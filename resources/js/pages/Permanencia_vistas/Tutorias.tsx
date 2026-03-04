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
}

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  carrera: string;
  carrera_id: number;
  correo?: string | null;
  telefono?: string | null;
  sede?: string | null;
  calificacion?: number | null;
  imagen?: string | null;
  asignaturas: Asignatura[];
}

interface Carrera {
  id: number;
  nombre: string;
}

export default function Tutorias() {
  const { tutores, asignaturas, carreras, totalTutores } = usePage().props as unknown as {
    tutores: Tutor[];
    asignaturas: Asignatura[];
    carreras: Carrera[];
    totalTutores: number;
  };

  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroAsignatura, setFiltroAsignatura] = useState('');

  const tutoresFiltrados = tutores.filter((tutor) => {
    const cumpleCarrera = !filtroCarrera || filtroCarrera === 'todas' || tutor.carrera_id?.toString() === filtroCarrera;
    const cumpleAsignatura =
      !filtroAsignatura || filtroAsignatura === 'todas' || tutor.asignaturas.some((a) => a.id.toString() === filtroAsignatura);

    return cumpleCarrera && cumpleAsignatura;
  });

  const tieneCalificaciones = tutores.some((tutor) => typeof tutor.calificacion === 'number');

  const destacados = [...tutores]
    .sort((a, b) => {
      if (tieneCalificaciones) {
        return (b.calificacion ?? 0) - (a.calificacion ?? 0);
      }

      return b.asignaturas.length - a.asignaturas.length;
    })
    .slice(0, 3);

  const handleCarreraChange = (value: string) => {
    setFiltroCarrera(value === 'todas' ? '' : value);
  };

  const handleAsignaturaChange = (value: string) => {
    setFiltroAsignatura(value === 'todas' ? '' : value);
  };

  return (
    <>
      <Head title="Tutorías | Permanencia y Graduación Exitosa - Sede Maicao" />

      <HeaderComponent />

      <main className="bg-gray-50 text-gray-800">
        <section className="hero-section w-full">
          <HeaderpermaComponent />
        </section>

        <section className="py-12 text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Directorio de Tutorías</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Consulta los tutores disponibles por carrera o asignatura y encuentra los canales de atención de
            Permanencia y Graduación Exitosa en sede Maicao.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <Card className="border-blue-100">
              <CardContent className="pt-6">
                <p className="text-sm uppercase tracking-wide text-blue-600">Tutores registrados</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{totalTutores}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Directorio académico disponible para apoyo en asignaturas priorizadas.
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-100">
              <CardContent className="pt-6">
                <p className="text-sm uppercase tracking-wide text-blue-600">Correo del programa</p>
                <a
                  href="mailto:permanenciamaicao@uniguajira.edu.co"
                  className="mt-2 block text-lg font-semibold text-blue-900 hover:underline"
                >
                  permanenciamaicao@uniguajira.edu.co
                </a>
                <p className="mt-2 text-sm text-gray-600">
                  Canal institucional para orientación académica y remisiones.
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-100">
              <CardContent className="pt-6">
                <p className="text-sm uppercase tracking-wide text-blue-600">Bienestar sede Maicao</p>
                <p className="mt-2 text-lg font-semibold text-blue-900">(605) 728 2729 ext. 306</p>
                <p className="mt-2 text-sm text-gray-600">
                  Atención presencial en Calle 16 No. 28A - 80, salida a Riohacha.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <Card className="border-l-4 border-blue-600">
              <CardContent className="pt-6">
                <p className="font-semibold text-blue-900">Tutorías académicas</p>
                <p className="mt-2 text-sm text-gray-600">
                  Prioriza asignaturas de alta repitencia y estudiantes con dificultades de rendimiento.
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-blue-600">
              <CardContent className="pt-6">
                <p className="font-semibold text-blue-900">Estudiante repitente</p>
                <p className="mt-2 text-sm text-gray-600">
                  Si cursas una materia por tercera o cuarta vez, puedes solicitar seguimiento y apoyo.
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-blue-600">
              <CardContent className="pt-6">
                <p className="font-semibold text-blue-900">Acompañamiento al aprendizaje</p>
                <p className="mt-2 text-sm text-gray-600">
                  Orientación para estudiantes de primero y segundo semestre con adaptación académica.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <Select value={filtroCarrera || 'todas'} onValueChange={handleCarreraChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas las carreras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las carreras</SelectItem>
                {carreras.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroAsignatura || 'todas'} onValueChange={handleAsignaturaChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas las asignaturas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las asignaturas</SelectItem>
                {asignaturas.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tutoresFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No se encontraron tutores con los filtros seleccionados.</p>
            </div>
          )}

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
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-800">{tutor.carrera}</p>
                  <p>
                    {tutor.asignaturas.length > 0
                      ? tutor.asignaturas.map((a) => a.nombre).join(', ')
                      : 'Sin asignaturas registradas'}
                  </p>
                  <p>{tutor.sede || 'Sede Maicao'}</p>
                  {tutor.correo && (
                    <a href={`mailto:${tutor.correo}`} className="block text-blue-700 hover:underline">
                      {tutor.correo}
                    </a>
                  )}
                  {tutor.telefono && (
                    <a href={`tel:${tutor.telefono}`} className="block hover:text-blue-700">
                      {tutor.telefono}
                    </a>
                  )}
                  {typeof tutor.calificacion === 'number' && (
                    <Badge variant="secondary" className="text-yellow-600 font-semibold">
                      Calificación: {tutor.calificacion} ⭐
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16">
            <h3 className="text-2xl font-bold text-blue-800 text-center mb-6">
              {tieneCalificaciones ? 'Tutores mejor valorados' : 'Tutores con mayor cobertura académica'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {destacados.map((tutor, index) => (
                <Card key={tutor.id} className="border-l-4 border-yellow-400">
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold">
                      #{index + 1} {tutor.nombre} {tutor.apellido}
                    </p>
                    <p className="text-sm text-gray-700">
                      {tutor.carrera} - {tutor.asignaturas.map((a) => a.nombre).join(', ')}
                    </p>
                    {typeof tutor.calificacion === 'number' ? (
                      <p className="text-yellow-600 font-bold mt-1">
                        {tutor.calificacion} ⭐
                      </p>
                    ) : (
                      <p className="text-blue-700 font-bold mt-1">
                        {tutor.asignaturas.length} asignaturas de apoyo
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-16 border-blue-100 bg-blue-50/70">
            <CardContent className="py-6 text-center">
              <p className="text-lg font-semibold text-blue-900">
                ¿No encuentras tu asignatura o necesitas remisión por bajo rendimiento?
              </p>
              <p className="mt-2 text-gray-700">
                Escríbenos a{' '}
                <a href="mailto:permanenciamaicao@uniguajira.edu.co" className="font-semibold text-blue-700 hover:underline">
                  permanenciamaicao@uniguajira.edu.co
                </a>{' '}
                o comunícate con Bienestar Universitario sede Maicao al{' '}
                <span className="font-semibold">(605) 728 2729 ext. 306</span>.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}
