import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    Calendar,
    CalendarDays,
    CheckCircle,
    Download,
    FileText,
    Filter,
    Search,
    TrendingUp,
    User,
    Users,
} from 'lucide-react';

/* =========================
   TIPOS
========================= */

interface AsistenciaOcaRow {
    id: number;
    estudiante: string;
    codigo: string;
    programa: string;
    sexo: string;
    grupo_priorizado: string;
    total_asistencias: number;
    fecha: string | string[];
    fechas?: string[];

    asignatura_texto?: string | null;
    grupo_texto?: string | null;

    nota_1?: number | null;
    nota_2?: number | null;
    nota_3?: number | null;
    definitiva?: number | null;
    final?: number | null;
}

interface Props {
    window: { id: number; name: string };
    windows?: Array<{ id: number; name: string }>;
    asistencias: AsistenciaOcaRow[] | Record<string, AsistenciaOcaRow> | null;
}

/* =========================
   HELPERS
========================= */

function toNumberOrNull(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

function formatNota(v?: number | null) {
    const n = toNumberOrNull(v);
    if (n === null) return '—';
    return n.toFixed(2);
}

function getNotaColor(nota: number | null): string {
    if (nota === null) return 'text-muted-foreground dark:text-slate-400';
    if (nota >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
    if (nota >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (nota >= 3.0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
}

function getNotaBgColor(nota: number | null): string {
    if (nota === null) return 'bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-300';
    if (nota >= 4.5) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
    if (nota >= 3.5) return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
    if (nota >= 3.0) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300';
}

function calcNotaFinal(a: AsistenciaOcaRow): number | null {
    const c1 = toNumberOrNull(a.nota_1);
    const c2 = toNumberOrNull(a.nota_2);
    const c3 = toNumberOrNull(a.nota_3);

    if (c1 === null || c2 === null || c3 === null) return null;

    const nf = c1 * 0.3 + c2 * 0.35 + c3 * 0.35;
    return Math.round(nf * 100) / 100;
}

function normalizeFechas(fecha: AsistenciaOcaRow['fecha']): string[] {
    if (Array.isArray(fecha)) return fecha.filter(Boolean).map(String);

    const s = String(fecha ?? '').trim();
    if (!s) return [];

    return s
        .split(/,|\||;/g)
        .map((x) => x.trim())
        .filter(Boolean);
}

function toDateSafe(dateStr: string): Date | null {
    const iso = String(dateStr).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function formatFechaBonitaES(dateStr: string) {
    const d = toDateSafe(dateStr);
    if (!d) return dateStr;

    const parts = d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return parts.replace(/\./g, '');
}

/* =========================
   COMPONENTES AUXILIARES
========================= */

function StatCard({ title, value, icon: Icon, color = 'blue' }: { title: string; value: string | number; icon: React.ElementType; color?: string }) {
    const colorClasses = {
        blue: 'bg-blue-100 border-blue-200 dark:bg-blue-500/15 dark:border-blue-500/30',
        emerald: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30',
        amber: 'bg-amber-100 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30',
        violet: 'bg-violet-100 border-violet-200 dark:bg-violet-500/15 dark:border-violet-500/30',
        rose: 'bg-rose-100 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30',
    };

    const iconClasses = {
        blue: 'text-blue-600 dark:text-blue-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
        violet: 'text-violet-600 dark:text-violet-400',
        rose: 'text-rose-600 dark:text-rose-400',
    };

    return (
        <div className="bg-card rounded-xl border p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
                <div className="min-w-0 space-y-1">
                    <p className="text-muted-foreground truncate text-sm font-medium dark:text-slate-400">{title}</p>
                    <p className="text-foreground text-xl font-bold md:text-2xl dark:text-white">{value}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconClasses[color as keyof typeof iconClasses]}`} />
                </div>
            </div>
        </div>
    );
}

function StudentCardOcasional({ student, onViewDates }: { student: AsistenciaOcaRow; onViewDates: (student: AsistenciaOcaRow) => void }) {
    const nf = toNumberOrNull(student.final) ?? toNumberOrNull(student.definitiva) ?? calcNotaFinal(student);
    const fechas = student.fechas?.length ? student.fechas : normalizeFechas(student.fecha);
    const isAprobado = nf !== null && nf >= 3.0;

    return (
        <div className="group bg-card hover:border-border hover:bg-muted/50 rounded-xl border p-3 transition-all duration-200 md:p-4 dark:border-slate-800 dark:bg-gradient-to-b dark:from-slate-900/60 dark:to-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/80">
            <div className="space-y-3">
                {/* Header con información del estudiante */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10 dark:bg-slate-800">
                                <User className="text-muted-foreground h-4 w-4 md:h-5 md:w-5 dark:text-slate-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h6 className="text-foreground truncate text-sm font-semibold md:text-base dark:!text-white">{student.estudiante}</h6>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <code className="text-muted-foreground bg-muted max-w-[100px] truncate rounded px-2 py-0.5 text-xs font-medium dark:bg-slate-800/50 dark:text-slate-400">
                                        {student.codigo}
                                    </code>
                                    {nf !== null && (
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-xs ${isAprobado ? 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400' : 'border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400'}`}
                                        >
                                            {isAprobado ? 'Aprobado' : 'Reprobado'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nota Final si existe */}
                    {nf !== null && (
                        <div className="shrink-0">
                            <div className={`rounded-lg px-2 py-1 text-center md:px-3 md:py-2 ${getNotaBgColor(nf)}`}>
                                <div className="text-base font-bold md:text-lg">{nf.toFixed(1)}</div>
                                <div className="text-[10px] opacity-80 md:text-xs">Final</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Información de asignatura y grupo */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground border-border max-w-full text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <BookOpen className="mr-1 h-3 w-3 shrink-0" />
                            <span className="truncate">{student.programa}</span>
                        </Badge>
                        {student.asignatura_texto && (
                            <Badge
                                variant="secondary"
                                className="max-w-full border-blue-200 bg-blue-100 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400"
                            >
                                <FileText className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">{student.asignatura_texto}</span>
                            </Badge>
                        )}
                        {student.grupo_texto && (
                            <Badge
                                variant="outline"
                                className="max-w-full border-purple-200 bg-purple-50 text-xs text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400"
                            >
                                <Users className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">{student.grupo_texto}</span>
                            </Badge>
                        )}
                    </div>
                </div>

                <Separator className="bg-border dark:bg-slate-800" />

                {/* Asistencias y Cortes */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {/* Asistencias */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium dark:text-slate-400">Asistencias</span>
                            <span className="text-foreground text-sm font-bold dark:text-white">{student.total_asistencias}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-muted hover:bg-muted/80 h-7 w-full px-1 text-xs text-blue-600 hover:text-blue-700 md:h-8 md:px-2 dark:bg-slate-800/50 dark:text-blue-400 dark:hover:bg-slate-700/50 dark:hover:text-blue-300"
                            onClick={() => onViewDates(student)}
                        >
                            <CalendarDays className="mr-1 h-3 w-3 shrink-0" />
                            <span className="truncate">Ver ({fechas.length})</span>
                        </Button>
                    </div>

                    {/* Cortes */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium dark:text-slate-400">Cortes</span>
                            <span className="text-muted-foreground text-xs dark:text-slate-500">1·2·3</span>
                        </div>
                        <div className="flex gap-1">
                            {[student.nota_1, student.nota_2, student.nota_3].map((nota, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 truncate rounded px-1 py-1 text-center text-[10px] font-medium md:text-xs ${getNotaBgColor(toNumberOrNull(nota))}`}
                                >
                                    {formatNota(nota)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   MODAL FECHAS
========================= */

function FechasDialog({
    open,
    onClose,
    estudiante,
    codigo,
    fechas,
}: {
    open: boolean;
    onClose: () => void;
    estudiante: string;
    codigo: string;
    fechas: string[];
}) {
    const sorted = [...fechas]
        .map((f) => String(f).slice(0, 10))
        .filter(Boolean)
        .sort((a, b) => {
            const da = toDateSafe(a)?.getTime() ?? 0;
            const db = toDateSafe(b)?.getTime() ?? 0;
            return da - db;
        });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-background border-border w-[95vw] sm:max-w-2xl dark:border-slate-800 dark:bg-slate-950">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-lg bg-blue-100 p-2 dark:bg-blue-500/15">
                            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <DialogTitle className="text-foreground truncate text-sm font-semibold md:text-base dark:!text-white">
                                Detalle de Asistencias
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-slate-400">
                                Registro completo de fechas de asistencia
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-card rounded-lg border p-3 md:p-4 dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="min-w-0 space-y-1">
                                <h4 className="text-foreground truncate text-sm font-semibold md:text-base dark:!text-white">{estudiante}</h4>
                                <p className="text-muted-foreground truncate text-sm dark:text-slate-400">Código: {codigo}</p>
                            </div>
                            <Badge
                                variant="outline"
                                className="shrink-0 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                            >
                                {sorted.length} asistencia{sorted.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </div>

                    <ScrollArea className="h-[250px] md:h-[300px]">
                        {sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center md:py-12">
                                <div className="bg-muted mb-3 rounded-full p-3 md:p-4 dark:bg-slate-800">
                                    <Calendar className="text-muted-foreground/60 h-6 w-6 md:h-8 md:w-8 dark:text-slate-600" />
                                </div>
                                <p className="text-muted-foreground font-medium dark:text-slate-400">No hay fechas registradas</p>
                                <p className="text-muted-foreground/70 mt-1 text-xs md:text-sm dark:text-slate-500">
                                    El estudiante no tiene asistencias registradas
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 pr-2 md:pr-4">
                                {sorted.map((fecha, index) => (
                                    <div
                                        key={fecha}
                                        className="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-2 transition-colors md:p-3 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-2 md:gap-3">
                                            <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8 dark:bg-slate-800">
                                                <span className="text-muted-foreground text-xs font-medium md:text-sm dark:text-slate-300">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium md:text-base dark:text-white">
                                                    {formatFechaBonitaES(fecha)}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs dark:text-slate-500">{fecha}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 border-blue-200 bg-blue-100 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400"
                                        >
                                            Presente
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-border text-foreground hover:bg-muted text-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Cerrar
                    </Button>
                    <Button onClick={onClose} className="bg-blue-600 text-sm text-white hover:bg-blue-700">
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */

export default function AsistenciasOcasionales({ window: reportWindow, windows = [], asistencias }: Props) {
    const [q, setQ] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [fechasDialog, setFechasDialog] = useState<{
        open: boolean;
        estudiante: string;
        codigo: string;
        fechas: string[];
    }>({
        open: false,
        estudiante: '',
        codigo: '',
        fechas: [],
    });
    // Normalizar a array sin recrearlo en cada render
    const asistenciasArray = useMemo<AsistenciaOcaRow[]>(() => {
        if (Array.isArray(asistencias)) {
            return asistencias;
        }

        return asistencias ? Object.values(asistencias) : [];
    }, [asistencias]);

    // Filtrar resultados
    const filteredRows = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return asistenciasArray;

        return asistenciasArray.filter((a) =>
            [
                a.estudiante,
                a.codigo,
                a.programa,
                a.asignatura_texto,
                a.grupo_texto,
                a.sexo,
                a.grupo_priorizado,
                a.total_asistencias,
                Array.isArray(a.fecha) ? a.fecha.join(', ') : a.fecha,
                a.nota_1,
                a.nota_2,
                a.nota_3,
                a.definitiva,
                a.final,
            ]
                .join(' ')
                .toLowerCase()
                .includes(term),
        );
    }, [asistenciasArray, q]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const notasFinales = filteredRows
            .map((a) => toNumberOrNull(a.final) ?? toNumberOrNull(a.definitiva) ?? calcNotaFinal(a))
            .filter((n): n is number => n !== null);

        const promedio = notasFinales.length > 0 ? notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length : 0;

        const aprobados = notasFinales.filter((n) => n >= 3.0).length;
        const reprobados = notasFinales.length - aprobados;
        const totalAsistencias = filteredRows.reduce((sum, a) => sum + a.total_asistencias, 0);
        const promedioAsistencias = filteredRows.length > 0 ? totalAsistencias / filteredRows.length : 0;

        return {
            total: filteredRows.length,
            promedio: promedio.toFixed(1),
            aprobados,
            reprobados,
            totalAsistencias,
            promedioAsistencias: promedioAsistencias.toFixed(1),
        };
    }, [filteredRows]);

    const goHome = () => {
        sessionStorage.setItem('tutorHomeScrollY', String(window.scrollY));
        const params = new URLSearchParams(window.location.search);
        const returnTab = params.get('returnTab') || 'grupos';
        const returnWindow = params.get('window') || String(reportWindow.id);

        router.visit(route('portal.tutor.home') + `?tab=${encodeURIComponent(returnTab)}&window=${encodeURIComponent(returnWindow)}`, {
            preserveScroll: true,
        });
    };

    const openFechasModal = (student: AsistenciaOcaRow) => {
        const fechas = student.fechas?.length ? student.fechas : normalizeFechas(student.fecha);
        setFechasDialog({
            open: true,
            estudiante: student.estudiante,
            codigo: student.codigo,
            fechas,
        });
    };

    const availableWindows = windows.length > 0 ? windows : [reportWindow];

    return (
        <>
            <Head title="Asistencias Ocasionales (Consolidado)" />

            <FechasDialog
                open={fechasDialog.open}
                onClose={() => setFechasDialog({ ...fechasDialog, open: false })}
                estudiante={fechasDialog.estudiante}
                codigo={fechasDialog.codigo}
                fechas={fechasDialog.fechas}
            />

            <div className="bg-background min-h-screen dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-7xl space-y-4 p-3 md:space-y-6 md:p-6">
                    {/* Header Principal */}
                    <div className="space-y-3 md:space-y-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start md:gap-4">
                            <div className="w-full space-y-2 sm:w-auto md:space-y-2">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goHome}
                                        className="border-border text-foreground hover:bg-muted w-full sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                                        Volver
                                    </Button>
                                    <div className="min-w-0 space-y-1">
                                        <h1 className="text-foreground truncate text-xl font-bold tracking-tight md:text-2xl lg:text-3xl dark:text-white">
                                            Asistencias Ocasionales
                                        </h1>
                                        <p className="text-muted-foreground truncate text-xs md:text-sm dark:text-slate-400">
                                            Gestión de asistencias ocasionales consolidada
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                                    <div className="bg-muted flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 md:px-3 dark:bg-slate-800/50">
                                        <Calendar className="text-muted-foreground h-3 w-3 shrink-0 md:h-4 md:w-4 dark:text-slate-400" />
                                        <span className="text-foreground truncate dark:text-slate-300">
                                            {availableWindows.length > 1
                                                ? `Todas las entregas (${availableWindows.length})`
                                                : (availableWindows[0]?.name ?? reportWindow.name)}
                                        </span>
                                    </div>
                                    {availableWindows.length > 1 && (
                                        <div className="flex flex-wrap gap-1">
                                            {availableWindows.map((w) => (
                                                <Badge key={w.id} variant="outline" className="text-[10px] md:text-xs">
                                                    {w.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <div className="bg-muted flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 md:px-3 dark:bg-slate-800/50">
                                        <Users className="text-muted-foreground h-3 w-3 shrink-0 md:h-4 md:w-4 dark:text-slate-400" />
                                        <span className="text-foreground truncate dark:text-slate-300">{filteredRows.length} registros</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:self-start">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground hover:bg-muted px-2 text-xs md:px-3 md:text-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Download className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                                    <span className="hidden sm:inline">Exportar</span>
                                    <span className="sm:hidden">Export</span>
                                </Button>
                            </div>
                        </div>

                        {/* Cards de Estadísticas */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-5">
                            <StatCard title="Total" value={stats.total} icon={Users} color="blue" />
                            <StatCard
                                title="Promedio"
                                value={stats.promedio}
                                icon={TrendingUp}
                                color={parseFloat(stats.promedio) >= 3.0 ? 'emerald' : 'rose'}
                            />
                            <StatCard title="Aprobados" value={stats.aprobados} icon={CheckCircle} color="emerald" />
                            <StatCard title="Reprobados" value={stats.reprobados} icon={AlertCircle} color="rose" />
                            <StatCard title="Asist. Prom" value={stats.promedioAsistencias} icon={BarChart3} color="violet" />
                        </div>
                    </div>

                    {/* Panel de Control */}
                    <Card className="border-border bg-card backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
                        <CardHeader className="pb-3 md:pb-4">
                            <div className="flex flex-col justify-between gap-3 md:gap-4 lg:flex-row lg:items-center">
                                <div className="space-y-1">
                                    <CardTitle className="text-foreground text-lg md:text-xl dark:text-white">Registros de Estudiantes</CardTitle>
                                    <p className="text-muted-foreground text-xs md:text-sm dark:text-slate-400">
                                        Gestiona las asistencias ocasionales de los estudiantes
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 md:h-4 md:w-4 dark:text-slate-500" />
                                        <Input
                                            value={q}
                                            onChange={(e) => setQ(e.target.value)}
                                            placeholder="Buscar estudiante, código..."
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground w-full pl-8 text-sm focus:border-blue-500 sm:w-[220px] md:w-[280px] md:pl-10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                                        />
                                    </div>

                                    <Tabs
                                        defaultValue="grid"
                                        value={viewMode}
                                        onValueChange={(v) => setViewMode(v as 'grid' | 'table')}
                                        className="w-full sm:w-auto"
                                    >
                                        <TabsList className="bg-muted border-border grid w-full grid-cols-2 border p-1 sm:w-auto dark:border-slate-800 dark:bg-slate-900">
                                            <TabsTrigger
                                                value="grid"
                                                className="data-[state=active]:bg-background px-2 py-1.5 text-xs md:px-3 dark:data-[state=active]:bg-slate-800"
                                            >
                                                Grid
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="table"
                                                className="data-[state=active]:bg-background px-2 py-1.5 text-xs md:px-3 dark:data-[state=active]:bg-slate-800"
                                            >
                                                Tabla
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {filteredRows.length === 0 ? (
                                <div className="border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-center md:py-16 dark:border-slate-800 dark:bg-slate-900/20">
                                    <div className="bg-muted mb-3 rounded-full p-3 md:mb-4 md:p-4 dark:bg-slate-800">
                                        <Search className="text-muted-foreground/60 h-6 w-6 md:h-8 md:w-8 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-foreground mb-2 text-base font-semibold md:text-lg dark:text-slate-300">
                                        No se encontraron resultados
                                    </h3>
                                    <p className="text-muted-foreground max-w-md px-4 text-xs md:text-sm dark:text-slate-500">
                                        {q ? `No hay registros que coincidan con "${q}"` : 'No hay asistencias ocasionales para esta ventana'}
                                    </p>
                                    {q && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setQ('')}
                                            className="mt-3 text-xs text-blue-600 hover:text-blue-700 md:mt-4 md:text-sm dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Limpiar búsqueda
                                        </Button>
                                    )}
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredRows.map((student) => (
                                        <StudentCardOcasional key={student.id} student={student} onViewDates={openFechasModal} />
                                    ))}
                                </div>
                            ) : (
                                <div className="border-border overflow-hidden rounded-lg border dark:border-slate-800">
                                    <ScrollArea className="h-[400px] w-full md:h-[500px]">
                                        <div className="min-w-[800px]">
                                            <table className="w-full">
                                                <thead className="bg-background border-border sticky top-0 border-b dark:border-slate-800 dark:bg-slate-950">
                                                    <tr className="text-left text-xs md:text-sm">
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Estudiante
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Código
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Asignatura
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Grupo
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Asist
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            C1
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            C2
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            C3
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Final
                                                        </th>
                                                        <th className="text-muted-foreground px-2 py-2 font-medium md:px-4 md:py-3 dark:text-slate-300">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-border divide-y dark:divide-slate-800">
                                                    {filteredRows.map((student) => {
                                                        const nf =
                                                            toNumberOrNull(student.final) ??
                                                            toNumberOrNull(student.definitiva) ??
                                                            calcNotaFinal(student);

                                                        return (
                                                            <tr
                                                                key={student.id}
                                                                className="hover:bg-muted/30 transition-colors dark:hover:bg-slate-800/20"
                                                            >
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <div className="flex items-center gap-2 md:gap-3">
                                                                        <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8 dark:bg-slate-800">
                                                                            <User className="text-muted-foreground h-3 w-3 md:h-4 md:w-4 dark:text-slate-300" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-foreground max-w-[120px] truncate text-xs font-medium md:max-w-[180px] md:text-sm dark:text-white">
                                                                                {student.estudiante}
                                                                            </p>
                                                                            <p className="text-muted-foreground max-w-[120px] truncate text-[10px] md:max-w-[180px] md:text-xs dark:text-slate-500">
                                                                                {student.programa}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] md:px-2 md:py-1 md:text-xs dark:bg-slate-800 dark:text-slate-300">
                                                                        {student.codigo}
                                                                    </code>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <BookOpen className="text-muted-foreground h-3 w-3 shrink-0 md:h-4 md:w-4" />
                                                                        <span className="text-foreground max-w-[120px] truncate text-xs md:text-sm dark:text-slate-300">
                                                                            {student.asignatura_texto || '—'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <span className="text-foreground block max-w-[100px] truncate text-xs md:text-sm dark:text-slate-300">
                                                                        {student.grupo_texto || '—'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] text-blue-700 md:px-2 md:text-xs dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                                                                    >
                                                                        {student.total_asistencias}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <span
                                                                        className={`text-xs font-medium md:text-sm ${getNotaColor(toNumberOrNull(student.nota_1))}`}
                                                                    >
                                                                        {formatNota(student.nota_1)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <span
                                                                        className={`text-xs font-medium md:text-sm ${getNotaColor(toNumberOrNull(student.nota_2))}`}
                                                                    >
                                                                        {formatNota(student.nota_2)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <span
                                                                        className={`text-xs font-medium md:text-sm ${getNotaColor(toNumberOrNull(student.nota_3))}`}
                                                                    >
                                                                        {formatNota(student.nota_3)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <div
                                                                        className={`rounded px-1.5 py-0.5 text-center text-xs font-bold md:px-2 md:py-1 md:text-sm ${getNotaBgColor(nf)}`}
                                                                    >
                                                                        {nf !== null ? nf.toFixed(1) : '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 md:px-4 md:py-3">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="bg-muted hover:bg-muted/80 h-6 px-1.5 text-[10px] md:h-8 md:px-2 md:text-xs dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                                                                        onClick={() => openFechasModal(student)}
                                                                    >
                                                                        <CalendarDays className="mr-1 h-3 w-3" />
                                                                        <span className="hidden md:inline">Ver</span>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Pie de página con información */}
                            <div className="mt-4 flex flex-col justify-between gap-2 text-xs sm:flex-row sm:items-center md:mt-6 md:gap-3 md:text-sm">
                                <div className="text-muted-foreground flex items-center gap-1.5 md:gap-2 dark:text-slate-400">
                                    <Filter className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
                                    <span className="truncate">
                                        Filtrado por:{' '}
                                        <span className="text-foreground font-semibold dark:text-slate-300">
                                            {q ? `"${q}"` : 'todos los registros'}
                                        </span>
                                    </span>
                                </div>
                                <div className="text-muted-foreground dark:text-slate-500">
                                    Mostrando <span className="text-foreground font-semibold dark:text-slate-300">{filteredRows.length}</span> de{' '}
                                    <span className="text-foreground font-semibold dark:text-slate-300">{asistenciasArray.length}</span> registros
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
