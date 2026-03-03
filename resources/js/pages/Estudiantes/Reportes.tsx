import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import React, { useMemo } from "react";
import { ArrowLeft, BarChart3, Calendar, FileText } from "lucide-react";

import EstudiantesReportPanel from "@/pages/Estudiantes/EstudiantesReportPanel";
import { MetricCard } from "@/components/component/MetricCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { EstudianteRow } from "./TablaGrupos";

type Period = { id: number; code: string; name?: string | null };

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Estudiantes", href: "/estudiantes" },
  { title: "Reportes", href: "/estudiantes/reportes" },
];

export default function EstudiantesReportes() {
  const { periods = [], selected_period_id = 0, rows = [] } = usePage().props as unknown as {
    periods?: Period[];
    selected_period_id?: number;
    rows?: EstudianteRow[];
  };

  const periodId = Number(selected_period_id) || 0;

  const periodLabel = useMemo(() => {
    const p = periods.find((x) => Number(x.id) === Number(periodId));
    return p ? `${p.code}${p.name ? ` · ${p.name}` : ""}` : "Sin período";
  }, [periods, periodId]);

  const estudiantesUnicos = useMemo(
    () => new Set((rows ?? []).map((row) => String(row.identificacion ?? "").trim()).filter(Boolean)).size,
    [rows],
  );

  const onChangePeriod = (value: string) => {
    router.get(
      route("estudiantes.reportes"),
      { period_id: Number(value) },
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Estudiantes | Reportes e informes" />

      <div className="flex flex-col gap-6 rounded-xl p-4 w-full flex-grow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Reportes e informes</h1>
            <p className="text-sm text-muted-foreground">
              Vista analítica del módulo de estudiantes por período, separada del flujo operativo de importación y edición.
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.get(route("estudiantes.index"), { period_id: periodId || undefined })
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div className="w-full md:w-[360px] space-y-2">
            <Label>Período</Label>
            <Select value={String(periodId)} onValueChange={onChangePeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={String(period.id)}>
                    {period.code}{period.name ? ` — ${period.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Período analizado"
            value={periodId ? 1 : 0}
            icon={Calendar}
            color="cyan"
            detail={periodLabel}
          />
          <MetricCard
            title="Registros cargados"
            value={rows.length}
            icon={BarChart3}
            color="purple"
            detail="Base del informe"
          />
          <MetricCard
            title="Estudiantes únicos"
            value={estudiantesUnicos}
            icon={FileText}
            color="green"
            detail="Identificaciones distintas"
          />
        </div>

        <EstudiantesReportPanel rows={rows} periodLabel={periodLabel} />
      </div>
    </AppLayout>
  );
}
