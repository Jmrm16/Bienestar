import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import AgregarTutor from '@/pages/Tutores/AgregaTutor';
import AgregarAsignatura from '@/pages/Tutores/AgregarAsignatura';
import TablaTutor from '@/pages/Tutores/TablaTutor';
import TablaAsignatura from '@/pages/Tutores/TablaAsignatura';

import { MetricCard } from '@/components/component/MetricCard';
import { Cpu, HardDrive, Wifi } from 'lucide-react';

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
}

// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Registro',
    href: '/Registro',
  },
];

export default function Index({ tutores, asignaturas }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Envuelve las MetricCard en motion.div */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} // Comienza con opacidad 0 y desplazada hacia abajo
            animate={{ opacity: 1, y: 0 }} // Finaliza con opacidad 1 y sin desplazamiento
            transition={{ duration: 0.5 }} // Duración de la animación
          >
            <MetricCard
              title="Tutores"
              value={tutores.length}
              icon={Cpu}
              color="cyan"
              detail={`${tutores.length} registrados`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }} // Con un pequeño retraso para dar un efecto de secuencia
          >
            <MetricCard
              title="Asignaturas"
              value={asignaturas.length}
              icon={HardDrive}
              color="purple"
              detail={`${asignaturas.length} registradas`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <MetricCard
              title="Red"
              value={88}
              icon={Wifi}
              color="blue"
              detail="Conexión estable"
            />
          </motion.div>
        </div>

        {/* Tutores */}
        <section className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Tutores</h2>

          {/* Agregar Tutor */}
          <div className="flex space-x-4 mb-4">
            <AgregarTutor />
          </div>

          {/* Tabla de tutores */}
          <TablaTutor />
        </section>

        {/* Asignaturas */}
        <section className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Asignaturas</h2>

          {/* Agregar Asignatura */}
          <div className="flex space-x-4 mb-4">
            <AgregarAsignatura />
          </div>

          {/* Tabla de asignaturas */}
          <TablaAsignatura />
        </section>

      </div>
    </AppLayout>
  );
}
