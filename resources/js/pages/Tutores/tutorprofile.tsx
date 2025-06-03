import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProfileSection from '@/components/component/profile-section';
import Estado from '@/components/component/estado';

interface Asignatura {
  id: number;
  nombre: string;
}

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  tipo_documento: string;
  documento: string;
  lugar_expedicion: string;
  sexo: string;
  grupo_priorizado: string;
  sede: string;
  programa_academico: string;
  correo: string;
  telefono: string;
  asignaturas: Asignatura[];
}

export default function TutorProfile() {
  const { props } = usePage();
  const tutor = props.tutor as Tutor;

  return (
    <AppLayout>
      <Head title={`Perfil del Tutor - ${tutor.nombre} ${tutor.apellido}`} />

      {/* Botón icono regresar */}
      <div className="mb-4">
        <Button
          variant="secondary"
          size="icon"
          className="size-8"
          onClick={() => router.visit('/tutores')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      <motion.div
        className="flex flex-col gap-8 rounded-xl p-6 h-full flex-grow bg-gray-100 dark:bg-zinc-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-2">
          Perfil del Tutor
        </h1>

        {/* Fila superior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow hover:shadow-lg transition">
            <ProfileSection tutor={tutor} />
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow hover:shadow-lg transition">
            <Estado />
          </div>
        </div>

        {/* Fila inferior */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Información Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              <p><span className="font-medium">Nombre:</span> {tutor.nombre} {tutor.apellido}</p>
              <p><span className="font-medium">Tipo de documento:</span> {tutor.tipo_documento}</p>
              <p><span className="font-medium">Documento:</span> {tutor.documento}</p>
              <p><span className="font-medium">Lugar de expedición:</span> {tutor.lugar_expedicion}</p>
              <p><span className="font-medium">Sexo:</span> {tutor.sexo}</p>
              <p><span className="font-medium">Grupo priorizado:</span> {tutor.grupo_priorizado}</p>
              <p><span className="font-medium">Sede:</span> {tutor.sede}</p>
              <p><span className="font-medium">Programa académico:</span> {tutor.programa_academico}</p>
              <p className="md:col-span-2"><span className="font-medium">Correo:</span> {tutor.correo}</p>
              <p className="md:col-span-2"><span className="font-medium">Teléfono:</span> {tutor.telefono}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Asignaturas Asignadas
            </h2>
            {tutor.asignaturas.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {tutor.asignaturas.map((asig) => (
                  <li key={asig.id}>{asig.nombre}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No tiene asignaturas asignadas.</p>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
