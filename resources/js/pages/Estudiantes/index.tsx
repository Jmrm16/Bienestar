import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import React, { useMemo } from "react";

import ImportarExcelDialog from "@/pages/Estudiantes/ImportarExcelDialog";
import TablaEstudiantes, {
  type EstudianteFilterOptions,
  type EstudianteFilters,
  type EstudiantePagination,
} from "./TablaGrupos";

import { BarChart3 } from "lucide-react";
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
  const {
    periods = [],
    selected_period_id = 0,
    rows = { data: [], current_page: 1, next_page_url: null, prev_page_url: null, per_page: 50 },
    filters = { q: "", servicio: "", trimestre: "" },
    filter_options = { servicios: [], trimestres: [] },
  } = usePage().props as unknown as {
    periods?: Period[];
    selected_period_id?: number;
    rows?: EstudiantePagination;
    filters?: EstudianteFilters;
    filter_options?: EstudianteFilterOptions;
  };

  const periodId = Number(selected_period_id) || 0;

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
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Vista operativa del módulo. Se dejó sólo lo necesario para trabajar el período sin sobrecargar la página.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Período de trabajo</CardTitle>
              <CardDescription>
                Cambia de período, importa la base y entra a reportes cuando necesites análisis.
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

              <div className="flex flex-wrap gap-2">
                <ImportarExcelDialog />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    router.get(route("estudiantes.reportes"), {
                      period_id: periodId || undefined,
                      q: filters.q || undefined,
                      servicio: filters.servicio || undefined,
                      trimestre: filters.trimestre || undefined,
                      page: rows.current_page > 1 ? rows.current_page : undefined,
                    })
                  }
                >
                  <BarChart3 className="h-4 w-4" />
                  Ver reportes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-4">
              <CardTitle>Resumen actual</CardTitle>
              <CardDescription>
                Contexto mínimo del período seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                Período activo: <span className="font-medium text-foreground">{periodLabel}</span>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="rounded-lg border bg-background px-3 py-2">
                  Registros visibles: <span className="font-medium text-foreground">{rows.data.length}</span>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  Servicios filtrables: <span className="font-medium text-foreground">{filter_options.servicios.length}</span>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  Trimestres filtrables: <span className="font-medium text-foreground">{filter_options.trimestres.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TablaEstudiantes
          rows={rows}
          periodId={periodId}
          filters={filters}
          filterOptions={filter_options}
        />
      </div>
    </AppLayout>
  );
}
