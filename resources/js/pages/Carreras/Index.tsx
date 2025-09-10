import React from 'react';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { MetricCard } from '@/components/component/MetricCard';
import AgregarCarrera from './AgregarCarrera';
import TablaCarreras from './TablaCarreras';
import { Cpu } from 'lucide-react';

// Tipos
type Carrera = {
  id: number;
  nombre: string;
  codigo: string;
};

type Paginator<T> = {
  data: T[];
  total?: number;
};

type Props = {
  carreras?: Carrera[] | Paginator<Carrera>;
};

// 👉 util para normalizar a lista
function toList<T>(maybe: T[] | Paginator<T> | undefined): T[] {
  if (!maybe) return [];
  return Array.isArray(maybe) ? maybe : (maybe.data ?? []);
}
// 👉 util para contar
function toCount<T>(maybe: T[] | Paginator<T> | undefined): number {
  if (!maybe) return 0;
  return Array.isArray(maybe) ? maybe.length : (maybe.total ?? (maybe.data?.length ?? 0));
}

export default function Index(props: Props) {
  const carrerasList = toList(props.carreras);
  const totalCarreras = toCount(props.carreras);

  return (
    <AppLayout>
      <Head title="Carreras" />
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
          <MetricCard
            title="Carreras"
            value={totalCarreras}
            icon={Cpu}
            color="blue"
            detail={`${carrerasList.length} en esta página`}
          />
        </div>

        {/* Carreras */}
        <div className="p-6">
          <p className="mb-4" style={{ fontSize: '30px', fontWeight: 'bold' }}>
            Carreras
          </p>
          <div className="flex space-x-4 mb-4">
            <AgregarCarrera />
          </div>
          <TablaCarreras />
        </div>
      </div>
    </AppLayout>
  );
}
