import React, { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import PeriodInsightsPanel from "./Entregas/components/PeriodInsightsPanel";
import type { PeriodInsights } from "./Entregas/components/PeriodInsightsPanel";
import { type BreadcrumbItem } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ReportCharts from "@/components/charts/ReportCharts";
import { Plus, Send, CheckCircle2, Globe, ClipboardList, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/* =========================
   TIPOS
========================= */

type Period = {
  id: number;
  code: string;
  name?: string | null;
};

type Window = {
  id: number;
  name: string;
  tutor_type: "R1" | "R2";
  open_at: string;
  due_at?: string | null;
  close_at?: string | null;
  instructions?: string | null;
  is_published: boolean;
};

type ChartRow = { label: string; APROBADO: number; REPROBADO: number; total?: number };

type Charts = {
  porPrograma: ChartRow[];
  porTutor: ChartRow[];
  totalAprobado: number;
  totalReprobado: number;
  sexo: { FEMENINO: number; MASCULINO: number };
  grupos: { NINGUNO: number; AFRO: number; INDIGENA: number };
};

type Props = {
  period: Period;
  windows: Window[];
  insights: PeriodInsights | null;

  // ✅ default (para no romper)
  charts: Charts;
  default_window_id: number | null;
};

const breadcrumbs = (p: Period): BreadcrumbItem[] => [
  { title: "Reportes", href: "/reportes/periodos" },
  { title: `Periodo ${p.code}`, href: `/reportes/periodos/${p.id}/entregas` },
];

export default function WindowsIndex({
  period,
  windows,
  insights,
  charts,
  default_window_id,
}: Props) {
  const totalPublicadas = useMemo(
    () => windows.filter((w) => w.is_published).length,
    [windows]
  );

  /* =========================
     Selector de Corte (Charts)
  ========================== */

  const defaultId =
    Number(default_window_id) ||
    Number(windows?.[windows.length - 1]?.id) ||
    Number(windows?.[0]?.id) ||
    0;

  const [selectedWindowId, setSelectedWindowId] = useState<number>(defaultId);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartCache, setChartCache] = useState<Record<string, Charts>>(() =>
    defaultId ? { [String(defaultId)]: charts } : {}
  );

  const selectedWindow = useMemo(() => {
    return windows.find((w) => Number(w.id) === Number(selectedWindowId)) ?? null;
  }, [windows, selectedWindowId]);

  const selectedCharts: Charts = useMemo(() => {
    return chartCache[String(selectedWindowId)] ?? charts;
  }, [chartCache, selectedWindowId, charts]);

  useEffect(() => {
    const key = String(selectedWindowId);

    if (!selectedWindowId || chartCache[key]) {
      return;
    }

    let cancelled = false;
    setChartsLoading(true);

    fetch(route("reports.windows.charts", [period.id, selectedWindowId]), {
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los gráficos del corte.");
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
      .catch(() => {
        if (!cancelled) {
          toast.error("No se pudieron cargar los gráficos del corte seleccionado");
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
  }, [chartCache, period.id, selectedWindowId]);

  // -----------------------------
  //  Estado del modal Crear / Editar
  // -----------------------------
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Window | null>(null);
  const [form, setForm] = useState({
    name: "",
    tutor_type: "R1" as "R1" | "R2",
    open_at: "",
    due_at: "",
    close_at: "",
    instructions: "",
    is_published: true,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      tutor_type: "R1",
      open_at: "",
      due_at: "",
      close_at: "",
      instructions: "",
      is_published: true,
    });
  };

  // Crear nuevo corte/entrega
  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  // Editar corte/entrega existente
  const openEdit = (w: Window) => {
    setEditing(w);
    setForm({
      name: w.name,
      tutor_type: w.tutor_type,
      open_at: w.open_at.slice(0, 16), // datetime-local
      due_at: w.due_at ? w.due_at.slice(0, 16) : "",
      close_at: w.close_at ? w.close_at.slice(0, 16) : "",
      instructions: w.instructions || "",
      is_published: w.is_published,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("El nombre de la entrega/corte es obligatorio");
      return;
    }
    if (!form.open_at) {
      toast.error("La fecha de apertura es obligatoria");
      return;
    }

    const payload = { ...form };

    const routeName = editing ? "reports.windows.update" : "reports.windows.store";
    const routeParams = editing ? [period.id, editing.id] : [period.id];

    router.post(
      route(routeName, routeParams),
      { _method: editing ? "put" : undefined, ...payload },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(editing ? "Entrega/corte actualizada" : "Entrega/corte creada");
          setOpen(false);
          resetForm();
        },
        onError: (e) => {
          const msg =
            e && typeof e === "object"
              ? (Object.values(e)[0] as string)
              : "Error al guardar";
          toast.error(msg);
        },
      }
    );
  };

  const destroyW = (w: Window) => {
    router.post(route("reports.windows.destroy", [period.id, w.id]), { _method: "delete" }, {
      preserveScroll: true,
      onSuccess: () => toast.success("Entrega/corte eliminada"),
      onError: () => toast.error("No se pudo eliminar esta entrega/corte"),
    });
  };

  const assignAll = (w: Window) => {
    router.post(route("reports.windows.assign_all", [period.id, w.id]), {}, {
      preserveScroll: true,
      onSuccess: () =>
        toast.success(`Entrega/corte asignada a todos los tutores de tipo ${w.tutor_type}`),
      onError: () => toast.error("No se pudo asignar a todos los tutores"),
    });
  };

  const viewSubmissions = (w: Window) => {
    router.visit(`/reportes/periodos/${period.id}/entregas/${w.id}/tutores`, {
      preserveScroll: true,
    });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    return value.replace("T", " ").slice(0, 16);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(period)}>
      <Head title={`Entregas / Cortes - ${period.code}`} />

      <div className="flex flex-col gap-6 p-4">
        {/* Header + métricas simples */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Entregas / Cortes del periodo {period.code}
            </h1>
            <p className="text-sm text-muted-foreground">
              {period.name ?? "Periodo sin descripción"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Usa estas entregas para habilitar los cortes de asistencias que deben subir los tutores
              (Corte 1, Corte 2, Informe final, etc.).
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva entrega / corte
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar entrega/corte" : "Crear nueva entrega/corte"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Corte 1 – Asistencias, Corte 2 – Seguimiento, Informe final..."
                  />
                </div>

                <div>
                  <Label>Tipo de tutor *</Label>
                  <Select
                    value={form.tutor_type}
                    onValueChange={(v: "R1" | "R2") => setForm((f) => ({ ...f, tutor_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R1">Tutores de Primera resolución (R1)</SelectItem>
                      <SelectItem value="R2">Tutores de Segunda resolución (R2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Publicada</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={form.is_published}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: Boolean(v) }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      Visible para los tutores en el portal
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Apertura *</Label>
                  <Input
                    type="datetime-local"
                    value={form.open_at}
                    onChange={(e) => setForm((f) => ({ ...f, open_at: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Fecha límite</Label>
                  <Input
                    type="datetime-local"
                    value={form.due_at}
                    onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Cierre</Label>
                  <Input
                    type="datetime-local"
                    value={form.close_at}
                    onChange={(e) => setForm((f) => ({ ...f, close_at: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Instrucciones</Label>
                  <Textarea
                    rows={5}
                    value={form.instructions}
                    onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                    placeholder="Especifica qué deben subir los tutores en este corte..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={submit}>
                  {editing ? "Guardar cambios" : "Crear entrega/corte"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de entregas / cortes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Corte</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Publicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {windows.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>

                  <TableCell>
                    <Badge variant="outline">{w.tutor_type}</Badge>
                  </TableCell>

                  <TableCell>{formatDate(w.open_at) || "—"}</TableCell>

                  <TableCell>
                    {w.due_at ? (
                      formatDate(w.due_at)
                    ) : (
                      <span className="text-muted-foreground">Sin fecha</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {w.is_published ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        <Globe className="mr-1 h-3 w-3" />
                        Publicada
                      </Badge>
                    ) : (
                      <Badge variant="outline">Oculta</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(w)}>
                      Editar
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => assignAll(w)}>
                      <Send className="mr-1 h-4 w-4" />
                      Asignar a todos
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => viewSubmissions(w)}>
                      <ClipboardList className="mr-1 h-4 w-4" />
                      Ver entregas
                    </Button>

                    <Button size="sm" variant="ghost" onClick={() => destroyW(w)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {windows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aún no has creado cortes/entregas para este período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {totalPublicadas} publicadas · {windows.length - totalPublicadas} ocultas
          </div>
        </motion.div>

        <PeriodInsightsPanel insights={insights} />

        {/* =========================
            ✅ CHARTS POR CORTE
        ========================== */}
        <div className="mt-6 space-y-3">
<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:gap-3">
  <div className="w-full sm:w-[320px]">
    <Label className="text-xs text-muted-foreground">Corte</Label>
    <Select
      value={String(selectedWindowId)}
      onValueChange={(v) => setSelectedWindowId(Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Seleccione un corte" />
      </SelectTrigger>
      <SelectContent>
        {windows.map((w) => (
          <SelectItem key={w.id} value={String(w.id)}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* ✅ Botón exportar Excel (charts de TODO el periodo) */}
<Button
  variant="outline"
  className="gap-2"
  onClick={() => window.open(route("reports.period.export_charts", period.id), "_blank")}
>
  <Download className="h-4 w-4" />
  Exportar Excel (Charts)
</Button>
</div>

          {chartsLoading && !chartCache[String(selectedWindowId)] ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Cargando gráficos del corte seleccionado...
            </div>
          ) : (
            <ReportCharts
              data={selectedCharts}
              topTutores={35}
              windowName={selectedWindow?.name}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
