import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import React, { useMemo } from "react";

import ImportarExcelDialog from "@/pages/Estudiantes/ImportarExcelDialog";
import TablaEstudiantes, { type EstudianteRow } from "./TablaGrupos";

import { MetricCard } from "@/components/component/MetricCard";
import { Users, BarChart3, Layers3, FolderKanban } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Period = { id: number; code: string; name?: string | null };

const breadcrumbs: BreadcrumbItem[] = [{ title: "Estudiantes", href: "/estudiantes" }];

export default function EstudiantesIndex() {
  const { periods = [], selected_period_id = 0, rows = [] } = usePage().props as unknown as {
    periods?: Period[];
    selected_period_id?: number;
    rows?: EstudianteRow[];
  };

  const periodId = Number(selected_period_id) || 0;

  const totalRegistros = rows.length;
  const totalEstudiantesUnicos = useMemo(
    () => new Set(rows.map((row) => String(row.identificacion ?? "").trim()).filter(Boolean)).size,
    [rows],
  );
  const totalServicios = useMemo(
    () => new Set(rows.map((row) => (row.servicio ?? "").trim()).filter(Boolean)).size,
    [rows],
  );
  const totalTrimestres = useMemo(
    () => new Set(rows.map((row) => (row.trimestre ?? "").trim()).filter(Boolean)).size,
    [rows],
  );

  const periodLabel = useMemo(() => {
    const p = periods.find((x) => Number(x.id) === Number(periodId));
    return p ? `${p.code}${p.name ? ` · ${p.name}` : ""}` : "Sin período";
  }, [periods, periodId]);

  const onChangePeriod = (v: string) => {
    const nextId = Number(v);
    router.get(
      "/estudiantes",
      { period_id: nextId },
      { preserveScroll: true, preserveState: true }
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Estudiantes | Importación por período" />

      <div className="flex flex-col gap-6 rounded-xl p-4 w-full flex-grow">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Administra la importación por período, revisa los registros cargados y accede al área de reportes del módulo.
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Período de trabajo</CardTitle>
              <CardDescription>
                Selecciona el período sobre el que quieres importar, consultar o editar estudiantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-md space-y-2">
                <Label>Período</Label>
                <Select value={String(periodId)} onValueChange={onChangePeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.code}{p.name ? ` — ${p.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <ImportarExcelDialog />
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-4">
              <CardTitle>Reportes e informes</CardTitle>
              <CardDescription>
                Abre la vista analítica del período para revisar distribución por servicios, programas y trimestres.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col justify-between gap-4">
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                Período activo: <span className="font-medium text-foreground">{periodLabel}</span>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  router.get(route("estudiantes.reportes"), { period_id: periodId || undefined })
                }
              >
                <BarChart3 className="h-4 w-4" />
                Ir a reportes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Registros importados"
            value={totalRegistros}
            icon={Layers3}
            color="cyan"
            detail="Filas cargadas en este período"
          />
          <MetricCard
            title="Estudiantes únicos"
            value={totalEstudiantesUnicos}
            icon={Users}
            color="purple"
            detail="Identificaciones distintas"
          />
          <MetricCard
            title="Servicios detectados"
            value={totalServicios}
            icon={FolderKanban}
            color="blue"
            detail="Servicios con registros"
          />
          <MetricCard
            title="Trimestres activos"
            value={totalTrimestres}
            icon={BarChart3}
            color="green"
            detail="Trimestres encontrados"
          />
        </div>

        {/* Tabla de registros */}
        <TablaEstudiantes rows={rows} periodId={periodId} />
      </div>
    </AppLayout>
  );
}
