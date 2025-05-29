import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import AgregarTutor from '@/Pages/Tutores/AgregaTutor';
import AgregarAsignatura from '@/Pages/Tutores/AgregarAsignatura';
import AgregarGrupo from '@/Pages/Tutores/AgregarGrupo';
import TablaTutor from '@/Pages/Tutores/TablaTutor';
import TablaAsignatura from '@/Pages/Tutores/TablaAsignatura';
import TablaGrupo from '@/Pages/Tutores/TablaGrupos';
import AgregarCarrera from '@/Pages/Tutores/AgregarCarrera';
import TablaCarreras from '@/Pages/Tutores/TablaCarreras';

import { MetricCard } from '@/components/component/MetricCard';
import { Cpu, HardDrive, Wifi } from 'lucide-react';

import { motion } from 'framer-motion';

// Tipos
interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
  docente: string;
}

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  grupos: number;
  asignaturas: Asignatura[];
}

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

interface Props {
  tutores: Tutor[];
  asignaturas: Asignatura[];
  carreras: Carrera[];
  totalTutores: number;
  grupos: Grupo[];        // ✅ ahora incluido
  gruposT: Grupo[];       // ✅ ahora incluido
}

// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Registro',
    href: '/Registro',
  },
];

export default function Index({
  tutores,
  asignaturas,
  carreras,
  grupos,
  gruposT,
}: Props) {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any | null>(null);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
          <MetricCard
            title="Tutores"
            value={tutores.length}
            icon={Cpu}
            color="cyan"
            detail={`${tutores.length} registrados`}
          />
          <MetricCard
            title="Asignaturas"
            value={asignaturas.length}
            icon={HardDrive}
            color="purple"
            detail={`${asignaturas.length} registradas`}
          />
          <MetricCard
            title="Tutores disponibles"
            value={tutores.length}
            icon={Wifi}
            color="blue"
            detail={`${tutores.length} disponibles`}
          />
          <MetricCard
            title="Carreras"
            value={carreras.length}
            icon={Cpu}
            color="cyan"
            detail={`${carreras.length} registradas`}
          />
        </div>

        {/* Tutores */}
        <div className="p-6">
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Tutores</p>
          <div className="flex space-x-4 mb-4">
            <AgregarTutor />
          </div>
          <TablaTutor />
        </div>

        {/* Asignaturas */}
        <div className="p-6">
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Asignaturas</p>
          <div className="flex space-x-4 mb-4">
            <AgregarAsignatura />
          </div>
          <TablaAsignatura />
        </div>

        {/* Grupos */}
        <div className="p-6">
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Grupos</p>
          <div className="flex space-x-4 mb-4">
            <AgregarGrupo />
          </div>
          <TablaGrupo
            grupos={grupos}
            gruposT={gruposT}
            onSeleccionarGrupo={setGrupoSeleccionado}
          />
        </div>

        {/* Carreras */}
        <div className="p-6">
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Carreras</p>
          <div className="flex space-x-4 mb-4">
            <AgregarCarrera />
          </div>
          <TablaCarreras />
        </div>
      </div>
    </AppLayout>
  );
}
