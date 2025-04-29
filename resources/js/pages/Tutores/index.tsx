import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import AgregarTutor from '@/pages/Tutores/AgregaTutor';
import AgregarAsignatura from '@/pages/Tutores/AgregarAsignatura';
import AgregarGrupo from '@/pages/Tutores/AgregarGrupo';
import TablaTutor from '@/pages/Tutores/TablaTutor';
import TablaAsignatura from '@/pages/Tutores/TablaAsignatura';

import { MetricCard } from '@/components/component/MetricCard';
import { Cpu, HardDrive, Wifi } from 'lucide-react';
import TablaGrupo from '@/pages/Tutores/TablaGrupos'; // Importar TablaGrupo
import AgregarCarrera from '@/pages/Tutores/AgregarCarrera'; // Importar AgregarCarrera
import TablaCarreras from '@/pages/Tutores/TablaCarreras'; // Importar TablaCarreras

import { Calendar } from '@/components/ui/calendar';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

import { motion } from 'framer-motion'; // Importar motion

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

interface Props {
  tutores: Tutor[];
  asignaturas: Asignatura[];
  carreras: Carrera[]; // Añade esta línea
  totalTutores: number; // Añade esto si también lo usas
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



// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Registro',
    href: '/Registro',
  },
];

export default function Index({ tutores, asignaturas, carreras }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [grupos, setGrupos] = useState<any[]>([]); // Define grupos as an empty array
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any | null>(null); // Define grupoSeleccionado

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
          {/* Envuelve las MetricCard en motion.div */}
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
        <div  className="p-6">
          
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Tutores</p>

          {/* Agregar Tutor */}
          <div className="flex space-x-4 mb-4">
            <AgregarTutor />
          </div>

          {/* Tabla de tutores */}
          <TablaTutor />
        </div>
        {/* Asignaturas */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4"></h2>
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Asignaturas</p>

          {/* Agregar Asignatura */}
          <div className="flex space-x-4 mb-4">
            <AgregarAsignatura />
          </div>

          {/* Tabla de asignaturas */}
          <TablaAsignatura />
        </div>

        {/* Grupos */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4"></h2>
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Grupos</p>
          <div className="flex space-x-4 mb-4">
            <AgregarGrupo />
          </div>

          <TablaGrupo grupos={grupos} onSeleccionarGrupo={setGrupoSeleccionado} />  

          </div>
   
        {/* --- Carreras --- */}
        <div className=" p-6">
        <h2 className="text-2xl font-bold text-white mb-4"></h2>
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
