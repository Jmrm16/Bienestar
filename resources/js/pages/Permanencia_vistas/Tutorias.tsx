import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';
import HeaderpermaComponent from './headerperma';
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
} from '@/components/ui/select';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  carrera: string;
  calificacion: number;
  imagen?: string;
  asignaturas: Asignatura[];
}

interface Carrera {
  id: number;
  nombre: string;
}

export default function Tutorias() {
  const { tutores, asignaturas, carreras } = usePage().props as unknown as {
    tutores: Tutor[];
    asignaturas: Asignatura[];
    carreras: Carrera[];
  };

  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroAsignatura, setFiltroAsignatura] = useState('');

  const tutoresFiltrados = tutores.filter((tutor) => {
    const cumpleCarrera = !filtroCarrera || tutor.carrera === filtroCarrera;
    const cumpleAsignatura =
      !filtroAsignatura || tutor.asignaturas.some((a) => a.nombre === filtroAsignatura);
    return cumpleCarrera && cumpleAsignatura;
  });

  const ranking = [...tutores].sort((a, b) => b.calificacion - a.calificacion).slice(0, 3);

  return (
    <>
      <Head title="Tutores - Permanencia y Graduación" />

      <HeaderComponent />

      <main className="bg-gray-50 text-gray-800">
        <section className="hero-section w-full">
          <HeaderpermaComponent />
        </section>

        <section className="py-12 text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Directorio de Tutorías</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Consulta nuestros tutores disponibles según carrera o asignatura, y revisa quiénes están mejor calificados.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-12">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <Select onValueChange={setFiltroCarrera}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas las carreras" />
              </SelectTrigger>
              <SelectContent>
                {carreras.map((c) => (
                  <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setFiltroAsignatura}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas las asignaturas" />
              </SelectTrigger>
              <SelectContent>
                {asignaturas.map((a) => (
                  <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Listado de tutores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutoresFiltrados.map((tutor) => (
              <Card key={tutor.id} className="text-center">
                <CardHeader>
                  <Avatar className="mx-auto w-24 h-24">
                    <AvatarImage
                      src={tutor.imagen || '/img/tutores/default.jpg'}
                      alt={tutor.nombre}
                      className="object-cover"
                    />
                  </Avatar>
                  <CardTitle className="text-blue-700">{tutor.nombre} {tutor.apellido}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-1">
                  <p>{tutor.carrera}</p>
                  <p>
                    {tutor.asignaturas.map((a) => a.nombre).join(', ')}
                  </p>
                  <Badge variant="secondary" className="text-yellow-600 font-semibold">
                    Calificación: {tutor.calificacion} ⭐
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ranking de tutores */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-blue-800 text-center mb-6">Top Tutores Mejor Calificados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ranking.map((tutor, index) => (
                <Card key={tutor.id} className="border-l-4 border-yellow-400">
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold">
                      #{index + 1} {tutor.nombre} {tutor.apellido}
                    </p>
                    <p className="text-sm text-gray-700">
                      {tutor.carrera} - {tutor.asignaturas.map((a) => a.nombre).join(', ')}
                    </p>
                    <p className="text-yellow-600 font-bold mt-1">
                      {tutor.calificacion} ⭐
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}