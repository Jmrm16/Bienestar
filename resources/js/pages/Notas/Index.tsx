import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";

import { MetricCard } from "@/components/component/MetricCard";
import { BookOpen, Upload, Users } from "lucide-react";

import ImportarNotas from "./components/ImportarNotas";
import TablaNotas from "./components/TablaNotas";

/* =========================
   TIPOS
========================= */

interface Nota {
  id: number;
  codigo: string;
  apellidos: string;
  nombres: string;
  identificacion: string;
  programa: string;
  materia: string;
  grupo: string;
  final: number | null;
  anio: number;
  periodo: string;
}

interface Props {
  notas?: Nota[];        // 👈 opcional
  totalNotas?: number;  // 👈 opcional
}

/* =========================
   BREADCRUMBS
========================= */

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Notas",
    href: "/admin/notas",
  },
];

/* =========================
   PÁGINA
========================= */

export default function Index({
  notas = [],        // 👈 valor por defecto
  totalNotas = 0,    // 👈 valor por defecto
}: Props) {

  const totalEstudiantes =
    notas.length > 0
      ? new Set(notas.map(n => n.identificacion)).size
      : 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notas Académicas" />

      <div className="flex flex-col gap-6 p-6">

        {/* =========================
            MÉTRICAS
        ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Notas registradas"
            value={totalNotas}
            icon={BookOpen}
            color="blue"
            detail="Se calculará tras importar"
          />

          <MetricCard
            title="Estudiantes"
            value={totalEstudiantes}
            icon={Users}
            color="green"
            detail="Con notas cargadas"
          />

          <MetricCard
            title="Importar notas"
            value={0}
            icon={Upload}
            color="purple"
            detail="Subir archivo Excel"
          />
        </div>

        {/* =========================
            IMPORTAR
        ========================= */}
        <ImportarNotas />

        {/* =========================
            TABLA (SOLO SI EXISTEN)
        ========================= */}
        {notas.length > 0 ? (
          <TablaNotas notas={notas} />
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no hay notas cargadas.  
            Importa un archivo Excel para comenzar.
          </div>
        )}

      </div>
    </AppLayout>
  );
}
