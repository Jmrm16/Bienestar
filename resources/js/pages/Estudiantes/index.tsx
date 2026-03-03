import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import React, { useMemo, useState } from "react";

import ImportarExcelDialog from "@/pages/Estudiantes/ImportarExcelDialog";
import TablaEstudiantes, { type EstudianteRow } from "./TablaGrupos";

import { MetricCard } from "@/components/component/MetricCard";
import { Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
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
          <h1 className="text-2xl font-semibold">Importación por período</h1>
          <p className="text-sm text-muted-foreground">
            El archivo puede traer varias hojas (Repitencia / Acompañamiento). Se guarda por período y por
            actividad/servicio/trimestre.
          </p>
        </motion.div>

        {/* Selector de período + botón importar */}
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div className="w-full md:w-[360px] space-y-2">
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
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <MetricCard
            title="Período seleccionado"
            value={periodId ? 1 : 0}
            icon={Calendar}
            color="cyan"
            detail={periodLabel}
          />
          <MetricCard
            title="Registros importados"
            value={totalRegistros}
            icon={Users}
            color="purple"
            detail="Total en este período"
          />
        </div>

        {/* Tabla de registros */}
        <TablaEstudiantes rows={rows} periodId={periodId} />
      </div>
    </AppLayout>
  );
}