import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type Grupo } from '@/types';

import { columnsEstudiantes, type Estudiante } from './columns';
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/component/MetricCard";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  grupo: Grupo;
  estudiantes: Estudiante[];
  tutores: { id: number; nombre: string; apellido: string }[];
};

export default function GrupoDetalle({ grupo, estudiantes: initialEstudiantes, tutores }: Props) {
  const [date] = useState<Date | undefined>(new Date());
  const [selectedTutor, setSelectedTutor] = useState<number | undefined>(grupo.tutor_id);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialEstudiantes && Array.isArray(initialEstudiantes)) {
      setEstudiantes(initialEstudiantes);
    }
  }, [initialEstudiantes]);

  const hasTutores = Array.isArray(tutores) && tutores.length > 0;

  const handleAssignTutor = async () => {
    if (!grupo?.id || !selectedTutor) {
      setMessage('Faltan datos para asignar el tutor.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/grupos/${grupo.id}/asignar-tutor`, {
        tutor_id: selectedTutor,
      });
      setLoading(false);
      setMessage(response.data.message || 'Tutor asignado correctamente.');
    } catch (error) {
      setLoading(false);
      setMessage('Error al asignar el tutor.');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">
        <Head title={`Grupo ${grupo.nombre} - Detalle`} />

        {/* Métricas */}
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Estudiantes"
              value={estudiantes.length}
              icon={Cpu}
              color="cyan"
              detail={`${estudiantes.length} registradas`}
            />
            <MetricCard
              title="Tutores"
              value={tutores.length}
              icon={Cpu}
              color="cyan"
              detail={`${tutores.length} registrados`}
            />
          </div>
        </div>

        {/* Información del grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Estudiantes del Grupo: {grupo.nombre} {grupo.codigo}
            </CardTitle>
            <p className="text-muted-foreground">Carrera: {grupo.carrera.nombre}</p>
          </CardHeader>

          <CardContent>
            <div className="p-4 border rounded-xl">
              {loading ? (
                <p>Cargando estudiantes...</p>
              ) : estudiantes.length > 0 ? (
                <DataTable
                  columns={columnsEstudiantes}
                  data={estudiantes}
                  searchKey="nombres"
                />
              ) : (
                <p>No hay estudiantes disponibles.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asignar tutor */}
        {hasTutores ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Asignar Tutor al Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="tutor_id" className="text-white mb-2 block">
                    Selecciona un tutor:
                  </label>
                  <Select
                    value={selectedTutor?.toString()}
                    onValueChange={(value) => setSelectedTutor(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {tutores.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id.toString()}>
                          {tutor.nombre} {tutor.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4">
                  <Button onClick={handleAssignTutor} disabled={loading}>
                    {loading ? 'Asignando...' : 'Asignar Tutor'}
                  </Button>
                </div>

                {message && (
                  <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                    {message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6">
            <p>No hay tutores disponibles para asignar.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
