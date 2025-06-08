import React from 'react';
import { Head } from '@inertiajs/react';
import { Asignatura, Grupo, Carrera } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgregarGrupo from '@/pages/Tutores/AgregarGrupo';
import TablaGrupo from '@/pages/Tutores/TablaGrupos';

interface Props {
  asignatura: Asignatura & {
    carrera: Carrera;
    grupos: Grupo[];
  };
}

export default function ShowAsignatura({ asignatura }: Props) {
  const [grupoSeleccionado, setGrupoSeleccionado] = React.useState<Grupo | null>(null);

  function setGrupoSeleccionadoHandler(grupo: Grupo): void {
    setGrupoSeleccionado(grupo);
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Tutores', href: '/tutores' }, { title: asignatura.nombre, href: '#' }]}>
      <Head title={`Asignatura - ${asignatura.nombre}`} />

      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la asignatura</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Nombre:</strong> {asignatura.nombre}</p>
            <p><strong>Código:</strong> {asignatura.codigo}</p>
            <p><strong>Docente:</strong> {asignatura.docente}</p>
            <p><strong>Carrera:</strong> {asignatura.carrera.nombre}</p>
          </CardContent>
        </Card>

        {/* Grupos */}
        <div className="p-6">
          <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Grupos</p>
          <div className="flex space-x-4 mb-4">
            <AgregarGrupo />
          </div>
          <TablaGrupo
            grupos={asignatura.grupos}
            onSeleccionarGrupo={(grupo) => setGrupoSeleccionadoHandler(grupo as Grupo)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
