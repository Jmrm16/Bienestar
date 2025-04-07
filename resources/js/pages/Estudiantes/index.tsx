import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';

import AgregarCarrera from '@/pages/Estudiantes/AgregarCarrera';
import AgregarGrupo from '@/pages/Estudiantes/AgregarGrupo';
import TablaGrupo from '@/pages/Estudiantes/TablaGrupos';
import TablaCarreras from '@/pages/Estudiantes/TablaCarreras';
import SubidaExcel from '@/pages/Estudiantes/SubidaExcel';

type Carrera = {
  id: number;
  nombre: string;
};

type Grupo = {
  id: number;
  nombre: string;
  codigo: string;
  carrera: Carrera;
};

type Props = {
  carreras: Carrera[];
  grupos: Grupo[];
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Estudiantes', href: '/estudiantes' },
];

export default function EstudiantesIndex({ carreras, grupos }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Gestión de Estudiantes" />
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">

        {/* --- Dashboard Rápido --- */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 h-full">
          <div className="border rounded-xl p-4 flex items-center justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} />
          </div>
          <div className="border rounded-xl p-4" />
          <div className="border rounded-xl p-4" />
        </div>

        {/* --- Carreras --- */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">Carreras</h2>
          <div className="flex gap-4 mb-4">
            <AgregarCarrera />
          </div>
          <TablaCarreras />
        </div>

        {/* --- Grupos --- */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">Grupos</h2>
          <div className="flex gap-4 mb-4">
            <AgregarGrupo />
          </div>
          <TablaGrupo grupos={grupos} onSeleccionarGrupo={setGrupoSeleccionado} />
        </div>

        {/* --- Subida Excel --- */}
        {grupoSeleccionado && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Subir Estudiantes al Grupo: {grupoSeleccionado.nombre}
            </h2>
            <SubidaExcel grupoId={grupoSeleccionado.id} />
          </div>
        )}

      </div>
    </AppLayout>
  );
}
