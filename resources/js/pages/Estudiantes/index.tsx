import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';


import AgregarCarrera from '@/pages/Estudiantes/AgregarCarrera';
import AgregarGrupo from '@/pages/Estudiantes/AgregarGrupo';
import TablaGrupo from '@/pages/Estudiantes/TablaGrupos';
import TablaCarreras from '@/pages/Estudiantes/TablaCarreras';
import SubidaExcel from '@/pages/Estudiantes/SubidaExcel';
import {MetricCard} from "@/components/component/MetricCard";
import { Cpu, HardDrive, Wifi } from "lucide-react" // Iconos


import { motion } from "framer-motion";

// En tu componente principal:


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
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Gestión de Estudiantes" />
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">
      <div className="container mx-auto p-4">

  {/* Aquí irán los cuadros */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
  title="Carreras"
  value={carreras.length}
  icon={Cpu}
  color="cyan"
  detail={`${carreras.length} registradas`}
/>

<MetricCard
  title="Grupos"
  value={grupos.length}
  icon={HardDrive}
  color="purple"
  detail={`${grupos.length} registrados`}
/>
</div>


      </div>
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
      >

        {/* --- Carreras --- */}
        <div className="mt-6 w-full">
        <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Carreras</p>
          <div className="flex flex-wrap gap-4 mb-4 w-full">
            <AgregarCarrera />
          </div>
          <TablaCarreras />
        </div>

        {/* --- Grupos --- */}
        <div className="mt-6 w-full">
        <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Grupos</p>
          <div className="flex flex-wrap gap-4 mb-4 w-full">
            <AgregarGrupo />
          </div>
          <TablaGrupo grupos={grupos} onSeleccionarGrupo={setGrupoSeleccionado} />
        </div>

        {/* --- Subida Excel --- */}
        {grupoSeleccionado && (
          <div className="mt-6 w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Subir Estudiantes al Grupo: {grupoSeleccionado.nombre}
            </h2>
            <SubidaExcel grupoId={grupoSeleccionado.id} />
          </div>
        )}
        </motion.div>

      </div>
    </AppLayout>
  );
}
