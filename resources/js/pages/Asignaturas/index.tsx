import React from 'react';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import AgregarAsignatura from '@/pages/Asignaturas/AgregarAsignatura';
import TablaAsignatura from '@/pages/Asignaturas/TablaAsignatura';
import { MetricCard } from '@/components/component/MetricCard';
import { HardDrive } from 'lucide-react';

// Tipos
interface Carrera {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  nombre: string;
  carrera_id: number;
  carrera?: Carrera;
}

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  grupos: number;
  asignaturas: Asignatura[];
}

interface Grupo {
  id: number;
  nombre: string;
  carrera: Carrera;
}

type Paginator<T> = {
  data: T[];
  total?: number;
};

type Props = {
  tutores?: Tutor[] | Paginator<Tutor>;
  asignaturas?: Asignatura[] | Paginator<Asignatura>;
  carreras?: Carrera[];
  grupos?: Grupo[];
  gruposT?: Grupo[];
};

// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Asignaturas', href: '/asignaturas' }
];

// Normalizadores
function toList<T>(maybe: T[] | Paginator<T> | undefined): T[] {
  if (!maybe) return [];
  return Array.isArray(maybe) ? maybe : (maybe.data ?? []);
}

function toCount<T>(maybe: T[] | Paginator<T> | undefined): number {
  if (!maybe) return 0;
  return Array.isArray(maybe) ? maybe.length : (maybe.total ?? maybe.data.length);
}

export default function Index(props: Props) {
  const asignaturasList = toList(props.asignaturas);
  const totalAsignaturas = toCount(props.asignaturas);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Asignaturas" />

      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
          <MetricCard
            title="Asignaturas"
            value={totalAsignaturas}
            icon={HardDrive}
            color="purple"
            detail={`${asignaturasList.length} registradas`}
          />
        </div>

        {/* LISTA */}
        <div className="p-6">
          <p className="mb-4 text-3xl font-bold">Asignaturas</p>

          <div className="flex space-x-4 mb-4">
            {/* Pasamos carreras correctamente */}
            <AgregarAsignatura carreras={props.carreras ?? []} />
          </div>

          {/* 🔥 PROPS CORREGIDOS AQUÍ 🔥 */}
          <TablaAsignatura
            asignaturas={asignaturasList}
            carreras={props.carreras ?? []}
          />
        </div>
      </div>
    </AppLayout>
  );
}
