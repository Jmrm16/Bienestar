import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type Grupo } from '@/types';

import { columnsEstudiantes, type Estudiante } from './columns';
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/component/MetricCard";
import { Cpu, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  grupo: Grupo;
  estudiantes: Estudiante[];
};

export default function GrupoDetalle({ grupo, estudiantes: initialEstudiantes }: Props) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEstudiantes && Array.isArray(initialEstudiantes)) {
      setEstudiantes(initialEstudiantes);
    }
  }, [initialEstudiantes]);

  return (
    <AppLayout>
      <Head title={`Grupo ${grupo.nombre} - Detalle`} />

      {/* Botón de regresar */}
      <div className="mb-4">
        <Button
          variant="secondary"
          size="icon"
          className="size-8"
          onClick={() => router.visit('/estudiantes')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">
        {/* Métricas */}
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Estudiantes"
              value={estudiantes.length}
              icon={Cpu}
              color="cyan"
              detail={`${estudiantes.length} registradas`}
            />
          </div>
        </div>

        {/* Información del grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Estudiantes del Grupo: {grupo.nombre} {grupo.codigo}
            </CardTitle>
            <p className="text-muted-foreground">Carrera: {grupo.carrera?.nombre || '—'}</p>
          </CardHeader>

          <CardContent>
            <div className="p-4 border rounded-xl overflow-x-auto">
              {loading ? (
                <p>Cargando estudiantes...</p>
              ) : estudiantes.length > 0 ? (
                <div className="min-w-[1500px]">
                  <DataTable
                    columns={columnsEstudiantes}
                    data={estudiantes}
                    searchKey="nombres"
                  />
                </div>
              ) : (
                <p>No hay estudiantes disponibles.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
