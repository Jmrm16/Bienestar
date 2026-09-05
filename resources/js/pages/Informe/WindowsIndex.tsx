import ReportCharts from '@/components/charts/ReportCharts';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, Download, Eye, FileSpreadsheet, Globe, MoreHorizontal, Pencil, Plus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import BulkTutorAttendanceImportDialog from './components/dialogs/BulkTutorAttendanceImportDialog';
import type { PeriodInsights } from './Entregas/components/PeriodInsightsPanel';
import PeriodInsightsPanel from './Entregas/components/PeriodInsightsPanel';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

/* =========================
   TIPOS
========================= */

type Period = {
    id: number;
    code: string;
    name?: string | null;
};

type WindowCategory = 'corte_1' | 'corte_2' | 'corte_3' | 'habilitacion' | 'final' | 'custom';

type RequiredItem = 'asistencias_normales' | 'asistencias_ocasionales' | 'informe_tutor' | 'evidencias' | 'observaciones';

type Window = {
    id: number;
    name: string;
    tutor_type: 'R1' | 'R2';
    open_at: string;
    due_at?: string | null;
    close_at?: string | null;
    instructions?: string | null;
    is_published: boolean;
    category?: WindowCategory | null;
    required_items?: RequiredItem[] | null;
};

type ChartRow = { label: string; APROBADO: number; REPROBADO: number; total?: number };

type Charts = {
    porPrograma: ChartRow[];
    porTutor: ChartRow[];
    totalAprobado: number;
    totalReprobado: number;
    totalEstudiantesUnicos?: number;
    totalEvaluados?: number;
    totalSinNota?: number;
    sexo: { FEMENINO: number; MASCULINO: number; SIN_DATO?: number };
    grupos: { NINGUNO: number; AFRO: number; INDIGENA: number; OTROS?: number };
};

type Props = {
    period: Period;
    windows: Window[];
    insights: PeriodInsights | null;

    // ✅ default (para no romper)
    charts: Charts;
    default_window_id: number | null;
};

const EMPTY_CHARTS: Charts = {
    porPrograma: [],
    porTutor: [],
    totalAprobado: 0,
    totalReprobado: 0,
    totalEstudiantesUnicos: 0,
    totalEvaluados: 0,
    totalSinNota: 0,
    sexo: { FEMENINO: 0, MASCULINO: 0, SIN_DATO: 0 },
    grupos: { NINGUNO: 0, AFRO: 0, INDIGENA: 0, OTROS: 0 },
};

const breadcrumbs = (p: Period): BreadcrumbItem[] => [
    { title: 'Reportes', href: '/reportes/periodos' },
    { title: `Periodo ${p.code}`, href: `/reportes/periodos/${p.id}/entregas` },
];

const publishedBadgeClassName = 'border-transparent bg-emerald-600/90 text-white hover:bg-emerald-600';

const resolutionCopy: Record<Window['tutor_type'], string> = {
    R1: 'Primera resolución',
    R2: 'Segunda resolución',
};

type WindowTutorSelection = Window['tutor_type'] | 'ALL';

const resolutionOptionCopy: Record<WindowTutorSelection, string> = {
    ALL: 'Ambas resoluciones (R1 y R2)',
    R1: 'Tutores de Primera resolución (R1)',
    R2: 'Tutores de Segunda resolución (R2)',
};

const categoryOrder: WindowCategory[] = ['corte_1', 'corte_2', 'corte_3', 'habilitacion', 'final', 'custom'];

const windowCategoryCopy: Record<
    WindowCategory,
    {
        label: string;
        shortLabel: string;
        suggestedName: string;
        description: string;
        defaultItems: RequiredItem[];
    }
> = {
    corte_1: {
        label: 'Corte 1',
        shortLabel: 'C1',
        suggestedName: 'Primer informe',
        description: 'Seguimiento inicial del periodo para la resolución elegida.',
        defaultItems: ['asistencias_normales', 'asistencias_ocasionales', 'informe_tutor'],
    },
    corte_2: {
        label: 'Corte 2',
        shortLabel: 'C2',
        suggestedName: 'Segundo informe',
        description: 'Segundo avance o seguimiento intermedio del periodo.',
        defaultItems: ['asistencias_normales', 'asistencias_ocasionales', 'informe_tutor'],
    },
    corte_3: {
        label: 'Corte 3',
        shortLabel: 'C3',
        suggestedName: 'Tercer informe',
        description: 'Tercer seguimiento o cierre académico previo al final.',
        defaultItems: ['asistencias_normales', 'asistencias_ocasionales', 'informe_tutor'],
    },
    habilitacion: {
        label: 'Habilitación',
        shortLabel: 'HAB',
        suggestedName: 'Habilitación',
        description: 'Ventana especial para habilitación o recuperación.',
        defaultItems: ['informe_tutor', 'observaciones'],
    },
    final: {
        label: 'Final',
        shortLabel: 'FIN',
        suggestedName: 'Informe final',
        description: 'Entrega final consolidada del periodo.',
        defaultItems: ['asistencias_normales', 'asistencias_ocasionales', 'informe_tutor', 'evidencias'],
    },
    custom: {
        label: 'Personalizada',
        shortLabel: 'CUS',
        suggestedName: '',
        description: 'Crea una entrega especial para una resolución específica.',
        defaultItems: [],
    },
};

const requiredItemCopy: Record<RequiredItem, string> = {
    asistencias_normales: 'Asistencias normales',
    asistencias_ocasionales: 'Asistencias ocasionales',
    informe_tutor: 'Informe del tutor',
    evidencias: 'Evidencias',
    observaciones: 'Observaciones',
};

const requiredItemOptions: { value: RequiredItem; label: string }[] = [
    { value: 'asistencias_normales', label: requiredItemCopy.asistencias_normales },
    { value: 'asistencias_ocasionales', label: requiredItemCopy.asistencias_ocasionales },
    { value: 'informe_tutor', label: requiredItemCopy.informe_tutor },
    { value: 'evidencias', label: requiredItemCopy.evidencias },
    { value: 'observaciones', label: requiredItemCopy.observaciones },
];

function inferWindowCategoryFromName(name: string): WindowCategory {
    const normalized = name.toLowerCase();

    if (normalized.includes('primer informe') || normalized.includes('corte 1')) {
        return 'corte_1';
    }
    if (normalized.includes('segundo informe') || normalized.includes('corte 2')) {
        return 'corte_2';
    }
    if (normalized.includes('tercer informe') || normalized.includes('corte 3')) {
        return 'corte_3';
    }
    if (normalized.includes('habilit')) {
        return 'habilitacion';
    }
    if (normalized.includes('final')) {
        return 'final';
    }

    return 'custom';
}

function resolveWindowCategory(window: Pick<Window, 'name' | 'category'>): WindowCategory {
    return window.category ?? inferWindowCategoryFromName(window.name);
}

function formatWindowRequiredItems(requiredItems?: RequiredItem[] | null) {
    const resolved = (requiredItems ?? []).filter((item): item is RequiredItem => item in requiredItemCopy);
    return resolved.map((item) => requiredItemCopy[item]);
}

function formatWindowDateMeta(window: Window) {
    const openDate = window.open_at ? new Date(window.open_at) : null;
    const dateText =
        openDate && !Number.isNaN(openDate.getTime())
            ? new Intl.DateTimeFormat('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              }).format(openDate)
            : 'Sin fecha';

    const requested = formatWindowRequiredItems(window.required_items).slice(0, 2).join(', ');
    return `Apertura ${dateText}${requested ? ` · ${requested}` : ''}`;
}

function formatWindowOptionMeta(window: Window) {
    return `${resolutionCopy[window.tutor_type]} · ${formatWindowDateMeta(window)}`;
}

export default function WindowsIndex({ period, windows, insights, charts, default_window_id }: Props) {
    const sortedWindows = useMemo(() => {
        return [...windows].sort((left, right) => {
            const leftCategoryIndex = categoryOrder.indexOf(resolveWindowCategory(left));
            const rightCategoryIndex = categoryOrder.indexOf(resolveWindowCategory(right));

            if (leftCategoryIndex !== rightCategoryIndex) {
                return leftCategoryIndex - rightCategoryIndex;
            }

            if (left.tutor_type !== right.tutor_type) {
                return left.tutor_type.localeCompare(right.tutor_type);
            }

            const byDate = String(left.open_at ?? '').localeCompare(String(right.open_at ?? ''));
            if (byDate !== 0) {
                return byDate;
            }

            return left.id - right.id;
        });
    }, [windows]);

    const totalPublicadas = useMemo(() => windows.filter((w) => w.is_published).length, [windows]);

    const groupedWindows = useMemo(() => {
        const grouped = new Map<WindowCategory, Window[]>();

        for (const category of categoryOrder) {
            grouped.set(category, []);
        }

        for (const window of sortedWindows) {
            grouped.get(resolveWindowCategory(window))?.push(window);
        }

        return categoryOrder
            .map((category) => {
                const items = grouped.get(category) ?? [];

                return {
                    category,
                    meta: windowCategoryCopy[category],
                    windows: items,
                    publishedCount: items.filter((window) => window.is_published).length,
                };
            })
            .filter((group) => group.windows.length > 0);
    }, [sortedWindows]);

    const [expandedCategories, setExpandedCategories] = useState<Partial<Record<WindowCategory, boolean>>>({});

    useEffect(() => {
        setExpandedCategories((current) => {
            const next: Partial<Record<WindowCategory, boolean>> = { ...current };
            const availableCategories = new Set(groupedWindows.map((group) => group.category));
            let changed = false;

            for (const key of Object.keys(next) as WindowCategory[]) {
                if (!availableCategories.has(key)) {
                    delete next[key];
                    changed = true;
                }
            }

            return changed ? next : current;
        });
    }, [groupedWindows]);

    /* =========================
     Selector de Corte (Charts)
  ========================== */

    const defaultId = Number(default_window_id) || Number(sortedWindows?.[sortedWindows.length - 1]?.id) || Number(sortedWindows?.[0]?.id) || 0;

    const defaultCategory = useMemo(() => {
        const defaultWindow = sortedWindows.find((window) => Number(window.id) === defaultId) ?? sortedWindows[0] ?? null;

        return defaultWindow ? resolveWindowCategory(defaultWindow) : null;
    }, [defaultId, sortedWindows]);

    const orderedWindowIds = useMemo(
        () => sortedWindows.map((window) => Number(window.id)).filter((id) => Number.isFinite(id) && id > 0),
        [sortedWindows],
    );

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<WindowCategory | ''>(defaultCategory ?? '');
    const [selectedResolutionFilter, setSelectedResolutionFilter] = useState<WindowTutorSelection>('ALL');
    const [chartsLoading, setChartsLoading] = useState(false);
    const [treeLoading, setTreeLoading] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [savingWindow, setSavingWindow] = useState(false);
    const [chartCache, setChartCache] = useState<Record<string, Charts>>(() => (defaultId ? { [String(defaultId)]: charts } : {}));
    const [treeCache, setTreeCache] = useState<Record<string, PeriodInsights>>(() =>
        defaultId && insights ? { [String(defaultId)]: insights } : {},
    );

    useEffect(() => {
        setChartCache(defaultId ? { [String(defaultId)]: charts } : {});
        setTreeCache(defaultId && insights ? { [String(defaultId)]: insights } : {});
    }, [defaultId, charts, insights]);

    useEffect(() => {
        setSelectedCategoryFilter((current) => {
            if (current && groupedWindows.some((group) => group.category === current)) {
                return current;
            }

            return defaultCategory ?? groupedWindows[0]?.category ?? '';
        });
    }, [defaultCategory, groupedWindows]);

    const orderedSelection = useMemo(() => {
        if (!selectedCategoryFilter) {
            return [];
        }

        const selectedIds = sortedWindows
            .filter((window) => {
                const matchesCategory = resolveWindowCategory(window) === selectedCategoryFilter;
                const matchesResolution = selectedResolutionFilter === 'ALL' || window.tutor_type === selectedResolutionFilter;

                return matchesCategory && matchesResolution;
            })
            .map((window) => Number(window.id));

        return orderedWindowIds.filter((id) => selectedIds.includes(id));
    }, [orderedWindowIds, selectedCategoryFilter, selectedResolutionFilter, sortedWindows]);

    const selectionCacheKey = orderedSelection.join(',');

    const selectedWindows = useMemo(() => {
        const selectedLookup = new Set(orderedSelection);
        return sortedWindows.filter((window) => selectedLookup.has(Number(window.id)));
    }, [orderedSelection, sortedWindows]);

    const hasAggregateSelection = selectedWindows.length > 1;

    const selectedWindowSummary = useMemo(() => {
        if (!selectedCategoryFilter) {
            return 'Selecciona un corte';
        }

        const resolutionLabel = selectedResolutionFilter === 'ALL' ? 'R1 + R2' : selectedResolutionFilter;
        const uniqueNames = Array.from(new Set(selectedWindows.map((window) => window.name)));

        if (uniqueNames.length === 1) {
            return `${uniqueNames[0]} · ${resolutionLabel}`;
        }

        return `${windowCategoryCopy[selectedCategoryFilter].label} · ${resolutionLabel}`;
    }, [selectedCategoryFilter, selectedResolutionFilter, selectedWindows]);

    const selectedResolutionSummary = useMemo(() => {
        if (selectedResolutionFilter === 'ALL') {
            return 'Ambas resoluciones';
        }

        return resolutionCopy[selectedResolutionFilter];
    }, [selectedResolutionFilter]);

    const selectedCategoryMeta = selectedCategoryFilter ? windowCategoryCopy[selectedCategoryFilter] : null;

    const selectedCharts: Charts = useMemo(() => {
        return chartCache[selectionCacheKey] ?? EMPTY_CHARTS;
    }, [chartCache, selectionCacheKey]);
    const selectedInsights = useMemo(() => {
        return treeCache[selectionCacheKey] ?? null;
    }, [selectionCacheKey, treeCache]);
    const deferredSelectedCharts = useDeferredValue(selectedCharts);
    const deferredSelectedInsights = useDeferredValue(selectedInsights);

    const exportExcelUrl = useMemo(() => {
        const baseUrl = route('reports.period.export_charts', period.id, false);
        if (orderedSelection.length === 0) {
            return baseUrl;
        }

        const params = new URLSearchParams();
        params.set('window_ids', orderedSelection.join(','));

        return `${baseUrl}?${params.toString()}`;
    }, [orderedSelection, period.id]);

    const handleExcelExport = async () => {
        if (isExportingExcel) {
            return;
        }

        setIsExportingExcel(true);

        try {
            const response = await fetch(exportExcelUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type') ?? '';
                let detail = `HTTP ${response.status}`;

                if (contentType.includes('application/json')) {
                    try {
                        const payload = (await response.json()) as { message?: string };
                        detail = payload?.message || detail;
                    } catch {
                        // noop
                    }
                } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
                    try {
                        detail = (await response.text()).slice(0, 180) || detail;
                    } catch {
                        // noop
                    }
                }

                throw new Error(detail);
            }

            const blob = await response.blob();
            const disposition = response.headers.get('content-disposition') ?? '';
            const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i) ?? disposition.match(/filename="?([^";]+)"?/i);

            const fallbackName = `SEGUIMIENTO_CORTE_A_CORTE_${period.code.replace(/\s+/g, '_')}.xlsx`;
            const resolvedName = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1].replace(/"/g, '')) : fallbackName;

            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = resolvedName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error: unknown) {
            const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
            toast.error(`No se pudo exportar el Excel${detail}`);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const refreshReportsView = () => {
        setChartCache({});
        setTreeCache({});
        router.visit(window.location.pathname + window.location.search, {
            method: 'get',
            only: ['windows', 'insights', 'charts', 'default_window_id'],
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        const key = selectionCacheKey;

        if (orderedSelection.length === 0 || !key || chartCache[key]) {
            return;
        }

        let cancelled = false;
        setChartsLoading(true);

        const chartsUrl =
            orderedSelection.length === 1
                ? route('reports.windows.charts', [period.id, orderedSelection[0]], false)
                : (() => {
                      const baseUrl = route('reports.windows.charts.aggregate', [period.id], false);
                      const params = new URLSearchParams();
                      orderedSelection.forEach((id) => params.append('window_ids[]', String(id)));
                      return `${baseUrl}?${params.toString()}`;
                  })();

        fetch(chartsUrl, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    let detail = '';
                    try {
                        const payload = (await response.json()) as { message?: string };
                        detail = String(payload?.message ?? '');
                    } catch {
                        // noop: fallback con status
                    }

                    throw new Error(detail || `HTTP ${response.status}`);
                }

                return response.json() as Promise<Charts>;
            })
            .then((payload) => {
                if (cancelled) {
                    return;
                }

                setChartCache((current) => ({
                    ...current,
                    [key]: payload,
                }));
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
                    toast.error(`No se pudieron cargar los gráficos de la selección elegida${detail}`);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setChartsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [chartCache, orderedSelection, period.id, selectionCacheKey]);

    useEffect(() => {
        const key = selectionCacheKey;

        if (orderedSelection.length === 0 || !key || treeCache[key]) {
            return;
        }

        let cancelled = false;
        setTreeLoading(true);

        const baseUrl = route('reports.windows.insights.aggregate', [period.id], false);
        const params = new URLSearchParams();
        orderedSelection.forEach((id) => params.append('window_ids[]', String(id)));

        fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    let detail = '';
                    try {
                        const payload = (await response.json()) as { message?: string };
                        detail = String(payload?.message ?? '');
                    } catch {
                        // noop
                    }

                    throw new Error(detail || `HTTP ${response.status}`);
                }

                return response.json() as Promise<PeriodInsights>;
            })
            .then((payload) => {
                if (cancelled) {
                    return;
                }

                setTreeCache((current) => ({
                    ...current,
                    [key]: payload,
                }));
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
                    toast.error(`No se pudo cargar la tabla de la selección elegida${detail}`);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setTreeLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [orderedSelection, period.id, selectionCacheKey, treeCache]);

    // -----------------------------
    //  Estado del modal Crear / Editar
    // -----------------------------
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Window | null>(null);
    const [form, setForm] = useState({
        name: windowCategoryCopy.corte_1.suggestedName,
        category: 'corte_1' as WindowCategory,
        tutor_type: 'ALL' as WindowTutorSelection,
        open_at: '',
        due_at: '',
        close_at: '',
        instructions: '',
        is_published: true,
        required_items: [...windowCategoryCopy.corte_1.defaultItems] as RequiredItem[],
    });

    const resetForm = () => {
        setEditing(null);
        setForm({
            name: windowCategoryCopy.corte_1.suggestedName,
            category: 'corte_1',
            tutor_type: 'ALL',
            open_at: '',
            due_at: '',
            close_at: '',
            instructions: '',
            is_published: true,
            required_items: [...windowCategoryCopy.corte_1.defaultItems],
        });
    };

    // Crear nuevo corte/entrega
    const openCreate = () => {
        resetForm();
        setOpen(true);
    };

    // Editar corte/entrega existente
    const openEdit = (w: Window) => {
        const category = resolveWindowCategory(w);
        setEditing(w);
        setForm({
            name: w.name,
            category,
            tutor_type: w.tutor_type,
            open_at: w.open_at.slice(0, 16), // datetime-local
            due_at: w.due_at ? w.due_at.slice(0, 16) : '',
            close_at: w.close_at ? w.close_at.slice(0, 16) : '',
            instructions: w.instructions || '',
            is_published: w.is_published,
            required_items:
                (w.required_items?.filter((item): item is RequiredItem => item in requiredItemCopy) ?? []).length > 0
                    ? (w.required_items?.filter((item): item is RequiredItem => item in requiredItemCopy) ?? [])
                    : [...windowCategoryCopy[category].defaultItems],
        });
        setOpen(true);
    };

    const setWindowCategory = (category: WindowCategory) => {
        setForm((current) => {
            const previousCategory = current.category;
            const previousPreset = windowCategoryCopy[previousCategory];
            const nextPreset = windowCategoryCopy[category];
            const shouldReplaceName = !current.name.trim() || current.name === previousPreset.suggestedName;
            const shouldReplaceItems =
                current.required_items.length === 0 || JSON.stringify(current.required_items) === JSON.stringify(previousPreset.defaultItems);

            return {
                ...current,
                category,
                name: category === 'custom' ? (shouldReplaceName ? '' : current.name) : shouldReplaceName ? nextPreset.suggestedName : current.name,
                required_items: shouldReplaceItems ? [...nextPreset.defaultItems] : current.required_items,
            };
        });
    };

    const toggleRequiredItem = (item: RequiredItem, checked: boolean) => {
        setForm((current) => {
            const nextItems = checked
                ? Array.from(new Set([...current.required_items, item]))
                : current.required_items.filter((value) => value !== item);

            return {
                ...current,
                required_items: nextItems,
            };
        });
    };

    const submit = () => {
        if (savingWindow) {
            return;
        }

        if (!form.name.trim()) {
            toast.error('El nombre de la entrega/corte es obligatorio');
            return;
        }
        if (!form.open_at) {
            toast.error('La fecha de apertura es obligatoria');
            return;
        }

        const payload =
            !editing && form.tutor_type === 'ALL'
                ? {
                      ...form,
                      tutor_types: ['R1', 'R2'] as Window['tutor_type'][],
                      tutor_type: 'R1' as Window['tutor_type'],
                  }
                : { ...form, tutor_types: undefined, tutor_type: form.tutor_type as Window['tutor_type'] };

        const routeName = editing ? 'reports.windows.update' : 'reports.windows.store';
        const routeParams = editing ? [period.id, editing.id] : [period.id];

        setSavingWindow(true);

        router.post(
            route(routeName, routeParams),
            { _method: editing ? 'put' : undefined, ...payload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editing
                            ? 'Entrega/corte actualizada'
                            : form.tutor_type === 'ALL'
                              ? 'Entregas/cortes creados para R1 y R2'
                              : 'Entrega/corte creada',
                    );
                    setOpen(false);
                    resetForm();
                    refreshReportsView();
                },
                onError: (e) => {
                    const msg = e && typeof e === 'object' ? (Object.values(e)[0] as string) : 'Error al guardar';
                    toast.error(msg);
                },
                onFinish: () => {
                    setSavingWindow(false);
                },
            },
        );
    };

    const destroyW = (w: Window) => {
        if (!window.confirm(`Vas a eliminar la entrega "${w.name}" y toda su información asociada. ¿Deseas continuar?`)) {
            return;
        }

        router.post(
            route('reports.windows.destroy', [period.id, w.id]),
            { _method: 'delete' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Entrega/corte eliminada');
                    refreshReportsView();
                },
                onError: () => toast.error('No se pudo eliminar esta entrega/corte'),
            },
        );
    };

    const clearWindowData = (w: Window) => {
        if (!window.confirm(`Se vaciarán los datos cargados de "${w.name}" (${w.tutor_type}) y la entrega seguirá existiendo. ¿Deseas continuar?`)) {
            return;
        }

        router.post(
            route('reports.windows.clear_data', [period.id, w.id]),
            { _method: 'delete' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Datos cargados eliminados de ${w.name} · ${w.tutor_type}`);
                    refreshReportsView();
                },
                onError: () => toast.error('No se pudieron limpiar los datos de esta entrega'),
            },
        );
    };

    const assignAll = (w: Window) => {
        router.post(
            route('reports.windows.assign_all', [period.id, w.id]),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Entrega/corte asignada a todos los tutores con grupos en este período');
                    refreshReportsView();
                },
                onError: () => toast.error('No se pudo asignar a todos los tutores'),
            },
        );
    };

    const viewSubmissions = (w: Window) => {
        router.visit(`/reportes/periodos/${period.id}/entregas/${w.id}/tutores`, {
            preserveScroll: true,
        });
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '';
        return value.replace('T', ' ').slice(0, 16);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(period)}>
            <Head title={`Entregas / Cortes - ${period.code}`} />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
                <Card className="gap-0 overflow-hidden">
                    <CardHeader className="gap-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="outline" className="font-normal">
                                        Periodo {period.code}
                                    </Badge>
                                    <span>{windows.length} entregas</span>
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold tracking-tight">
                                        Entregas y cortes del periodo {period.code}
                                    </CardTitle>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                <BulkTutorAttendanceImportDialog periodId={period.id} windows={sortedWindows} onCompleted={refreshReportsView} />

                                <Dialog
                                    open={open}
                                    onOpenChange={(o) => {
                                        setOpen(o);
                                        if (!o) resetForm();
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button onClick={openCreate} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Nueva entrega / corte
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="grid max-h-[88vh] w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0 sm:max-w-[760px]">
                                        <DialogHeader>
                                            <div className="border-b px-6 py-5">
                                                <DialogTitle>{editing ? 'Editar entrega/corte' : 'Crear nueva entrega/corte'}</DialogTitle>
                                                <DialogDescription className="mt-2">
                                                    Define el corte, la resolución, las fechas y lo que deben subir los tutores en esta entrega del
                                                    periodo.
                                                </DialogDescription>
                                            </div>
                                        </DialogHeader>

                                        <div className="overflow-y-auto px-6 py-5">
                                            <div className="grid gap-5">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Corte / etapa *</Label>
                                                        <Select
                                                            value={form.category}
                                                            disabled={savingWindow}
                                                            onValueChange={(value: WindowCategory) => setWindowCategory(value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccione el corte" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {categoryOrder.map((category) => (
                                                                    <SelectItem key={category} value={category}>
                                                                        {windowCategoryCopy[category].label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-muted-foreground text-xs">
                                                            {windowCategoryCopy[form.category].description}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Resolución *</Label>
                                                        <Select
                                                            value={form.tutor_type}
                                                            disabled={savingWindow}
                                                            onValueChange={(v: WindowTutorSelection) => setForm((f) => ({ ...f, tutor_type: v }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccione" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {!editing && <SelectItem value="ALL">{resolutionOptionCopy.ALL}</SelectItem>}
                                                                <SelectItem value="R1">{resolutionOptionCopy.R1}</SelectItem>
                                                                <SelectItem value="R2">{resolutionOptionCopy.R2}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {!editing && form.tutor_type === 'ALL' && (
                                                            <p className="text-muted-foreground text-xs">
                                                                Se crearán dos entregas iguales: una para R1 y otra para R2.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Nombre visible *</Label>
                                                        <Input
                                                            value={form.name}
                                                            disabled={savingWindow}
                                                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                            placeholder={
                                                                form.category === 'custom'
                                                                    ? 'Ej: Refuerzo académico, Recuperación, Seguimiento especial...'
                                                                    : `Ej: ${windowCategoryCopy[form.category].suggestedName}`
                                                            }
                                                        />
                                                        <p className="text-muted-foreground text-xs">
                                                            Puedes dejar el nombre sugerido del corte o personalizarlo.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-card rounded-2xl border p-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Publicada</Label>
                                                            <div className="bg-muted/20 flex min-h-11 items-center gap-3 rounded-xl border px-3">
                                                                <Switch
                                                                    checked={form.is_published}
                                                                    disabled={savingWindow}
                                                                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: Boolean(v) }))}
                                                                />
                                                                <span className="text-muted-foreground text-sm">
                                                                    Visible para los tutores en el portal
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Apertura *</Label>
                                                            <Input
                                                                type="datetime-local"
                                                                value={form.open_at}
                                                                disabled={savingWindow}
                                                                onChange={(e) => setForm((f) => ({ ...f, open_at: e.target.value }))}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Fecha límite</Label>
                                                            <Input
                                                                type="datetime-local"
                                                                value={form.due_at}
                                                                disabled={savingWindow}
                                                                onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Cierre</Label>
                                                            <Input
                                                                type="datetime-local"
                                                                value={form.close_at}
                                                                disabled={savingWindow}
                                                                onChange={(e) => setForm((f) => ({ ...f, close_at: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-card space-y-3 rounded-2xl border p-4">
                                                    <div>
                                                        <Label>Qué deben subir</Label>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            Marca solo lo que quieres habilitar en esta entrega.
                                                        </p>
                                                    </div>
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {requiredItemOptions.map((item) => (
                                                            <label
                                                                key={item.value}
                                                                className="bg-muted/15 hover:border-border hover:bg-muted/30 flex min-h-[112px] items-start gap-3 rounded-xl border p-3 transition"
                                                            >
                                                                <Checkbox
                                                                    checked={form.required_items.includes(item.value)}
                                                                    disabled={savingWindow}
                                                                    onCheckedChange={(checked) => toggleRequiredItem(item.value, Boolean(checked))}
                                                                />
                                                                <div className="space-y-1">
                                                                    <span className="text-sm font-medium">{item.label}</span>
                                                                    <p className="text-muted-foreground text-xs leading-5">
                                                                        {item.value === 'asistencias_normales'
                                                                            ? 'Marca la asistencia ordinaria del corte.'
                                                                            : item.value === 'asistencias_ocasionales'
                                                                              ? 'Incluye acompañamientos o tutorías ocasionales.'
                                                                              : item.value === 'informe_tutor'
                                                                                ? 'Permite registrar el informe narrativo del tutor.'
                                                                                : item.value === 'evidencias'
                                                                                  ? 'Reserva esta entrega para anexos o soportes.'
                                                                                  : 'Deja abierta una casilla para notas adicionales.'}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Instrucciones</Label>
                                                    <Textarea
                                                        rows={5}
                                                        value={form.instructions}
                                                        disabled={savingWindow}
                                                        onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                                                        placeholder="Especifica qué deben subir los tutores en este corte..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <DialogFooter className="border-t px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                disabled={savingWindow}
                                                onClick={() => {
                                                    setOpen(false);
                                                    resetForm();
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button onClick={submit} disabled={savingWindow}>
                                                {savingWindow ? (
                                                    <>
                                                        <Spinner size="sm" />
                                                        {editing ? 'Guardando...' : 'Creando...'}
                                                    </>
                                                ) : editing ? (
                                                    'Guardar cambios'
                                                ) : (
                                                    'Crear entrega/corte'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div>
                    <Card className="gap-0">
                        <CardHeader className="gap-2">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">Entregas configuradas</CardTitle>
                                </div>
                                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                    {totalPublicadas} publicadas · {windows.length - totalPublicadas} ocultas
                                </div>
                            </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="px-0">
                            {groupedWindows.length === 0 ? (
                                <div className="text-muted-foreground py-10 text-center text-sm">
                                    Aún no has creado cortes o entregas para este período.
                                </div>
                            ) : (
                                groupedWindows.map((group, index) => {
                                    const isExpanded = Boolean(expandedCategories[group.category]);

                                    return (
                                        <div key={group.category}>
                                            {index > 0 && <Separator />}

                                            <Collapsible
                                                open={isExpanded}
                                                onOpenChange={(openState) =>
                                                    setExpandedCategories((current) => ({
                                                        ...current,
                                                        [group.category]: openState,
                                                    }))
                                                }
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="hover:bg-muted/30 flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors"
                                                    >
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <Badge variant="secondary" className="mt-0.5 font-medium">
                                                                {group.meta.shortLabel}
                                                            </Badge>

                                                            <div className="min-w-0 space-y-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-medium">{group.meta.label}</span>
                                                                    <Badge variant="outline" className="font-normal">
                                                                        {group.windows.length} {group.windows.length === 1 ? 'entrega' : 'entregas'}
                                                                    </Badge>
                                                                    <span className="text-muted-foreground text-sm">
                                                                        {group.publishedCount} publicadas
                                                                    </span>
                                                                </div>
                                                                <p className="text-muted-foreground text-sm">{group.meta.description}</p>
                                                            </div>
                                                        </div>

                                                        <ChevronDown
                                                            className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                </CollapsibleTrigger>

                                                <CollapsibleContent>
                                                    <div className="bg-muted/10 border-t">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Nombre visible</TableHead>
                                                                    <TableHead>Resolución</TableHead>
                                                                    <TableHead>Qué se sube</TableHead>
                                                                    <TableHead>Apertura</TableHead>
                                                                    <TableHead>Vence</TableHead>
                                                                    <TableHead>Publicación</TableHead>
                                                                    <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                            </TableHeader>

                                                            <TableBody>
                                                                {group.windows.map((w) => (
                                                                    <TableRow key={w.id}>
                                                                        <TableCell className="space-y-1">
                                                                            <p className="font-medium">{w.name}</p>
                                                                            <p className="text-muted-foreground text-sm">
                                                                                {formatWindowOptionMeta(w)}
                                                                            </p>
                                                                        </TableCell>

                                                                        <TableCell>
                                                                            <Badge variant="outline">{w.tutor_type}</Badge>
                                                                        </TableCell>

                                                                        <TableCell>
                                                                            <div className="flex max-w-[280px] flex-wrap gap-1">
                                                                                {formatWindowRequiredItems(w.required_items).length > 0 ? (
                                                                                    formatWindowRequiredItems(w.required_items).map((item) => (
                                                                                        <Badge key={item} variant="secondary" className="font-normal">
                                                                                            {item}
                                                                                        </Badge>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-muted-foreground text-sm">
                                                                                        Sin checklist
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>

                                                                        <TableCell>{formatDate(w.open_at) || '—'}</TableCell>

                                                                        <TableCell>
                                                                            {w.due_at ? (
                                                                                formatDate(w.due_at)
                                                                            ) : (
                                                                                <span className="text-muted-foreground">Sin fecha</span>
                                                                            )}
                                                                        </TableCell>

                                                                        <TableCell>
                                                                            {w.is_published ? (
                                                                                <Badge className={publishedBadgeClassName}>
                                                                                    <Globe className="mr-1 h-3 w-3" />
                                                                                    Publicada
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline">Oculta</Badge>
                                                                            )}
                                                                        </TableCell>

                                                                        <TableCell className="w-[1%] whitespace-nowrap">
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button size="icon" variant="ghost" className="h-9 w-9">
                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>

                                                                                <DropdownMenuContent align="end" className="w-52">
                                                                                    <DropdownMenuItem onClick={() => openEdit(w)}>
                                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                                        Editar
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => assignAll(w)}>
                                                                                        <Send className="mr-2 h-4 w-4" />
                                                                                        Asignar a todos
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => viewSubmissions(w)}>
                                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                                        Ver entregas
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        className="text-amber-700 focus:text-amber-700"
                                                                                        onClick={() => clearWindowData(w)}
                                                                                    >
                                                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                                                        Vaciar datos cargados
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        className="text-red-600 focus:text-red-600"
                                                                                        onClick={() => destroyW(w)}
                                                                                    >
                                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                                        Eliminar
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-0 [contain-intrinsic-size:760px] [content-visibility:auto]">
                    <CardHeader className="gap-4">
                        <div>
                            <CardTitle className="text-base">Análisis del corte</CardTitle>
                        </div>

                        <div className="bg-muted/20 rounded-2xl border p-4">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs">Qué quieres ver</Label>
                                        <Select
                                            value={selectedResolutionFilter}
                                            onValueChange={(value) => setSelectedResolutionFilter(value as WindowTutorSelection)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona una resolución" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Ambas resoluciones (R1 y R2)</SelectItem>
                                                <SelectItem value="R1">Solo Primera resolución (R1)</SelectItem>
                                                <SelectItem value="R2">Solo Segunda resolución (R2)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs">Corte</Label>
                                        <Select
                                            value={selectedCategoryFilter}
                                            onValueChange={(value) => setSelectedCategoryFilter(value as WindowCategory)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un corte" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {groupedWindows.map((group) => {
                                                    const names = Array.from(new Set(group.windows.map((window) => window.name)));
                                                    const description = names.length === 1 ? `${group.meta.label} · ${names[0]}` : group.meta.label;

                                                    return (
                                                        <SelectItem key={group.category} value={group.category}>
                                                            {description}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button variant="outline" className="gap-2" onClick={handleExcelExport} disabled={isExportingExcel}>
                                        {isExportingExcel ? <Spinner size="sm" /> : <FileSpreadsheet className="h-4 w-4" />}
                                        {isExportingExcel ? 'Preparando Excel...' : 'Exportar Excel'}
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        className="gap-2"
                                        onClick={() => window.open(`${route('reports.period.export_pdf', period.id)}?autoprint=1`, '_blank')}
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="font-normal">
                                    {selectedCategoryMeta?.label ?? 'Sin corte'} · {selectedResolutionSummary}
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                    {selectedWindows.length} {selectedWindows.length === 1 ? 'entrega incluida' : 'entregas incluidas'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="space-y-4 pt-6">
                        {chartsLoading && !chartCache[selectionCacheKey] ? (
                            <div className="bg-muted/20 text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm">
                                <Spinner size="md" label="Cargando gráficos de la selección..." />
                            </div>
                        ) : (
                            <ReportCharts
                                data={deferredSelectedCharts}
                                topTutores={35}
                                scopeLabel={hasAggregateSelection ? 'conjunto seleccionado' : 'corte seleccionado'}
                                detailContent={
                                    treeLoading && !treeCache[selectionCacheKey] ? (
                                        <Card className="gap-0 overflow-hidden">
                                            <CardContent className="flex min-h-52 items-center justify-center">
                                                <Spinner size="md" label="Cargando tabla de la selección..." />
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <PeriodInsightsPanel
                                            insights={deferredSelectedInsights}
                                            title="Detalle por carrera, asignatura y tutor"
                                            contextLabel={selectedWindowSummary}
                                            showSummary={false}
                                            totalEstudiantesOverride={
                                                typeof deferredSelectedCharts?.totalEstudiantesUnicos === 'number'
                                                    ? deferredSelectedCharts.totalEstudiantesUnicos
                                                    : undefined
                                            }
                                        />
                                    )
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
