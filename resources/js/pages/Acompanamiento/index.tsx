// resources/js/Pages/Acompanamiento/Carreras/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import React from 'react';
import TablaCarreras from '@/pages/Acompanamiento/Tablacarrera';
import AgregarCarrera from '@/pages/Acompanamiento/AgregarCarrera';




type Carrera = {
  id: number;
  nombre: string;
  codigo: string;
};

type Props = {
  carreras: Carrera[];
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Acompañamiento', href: '/acompanamiento' },
  { title: 'Carreras', href: '/acompanamiento/carreras' },
];

export default function AcompanamientoCarrerasIndex({ carreras }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Carreras de Acompañamiento" />
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Carreras</h1>
          <AgregarCarrera />
        </div>
        <TablaCarreras  />
      </div>
    </AppLayout>
  );
}
