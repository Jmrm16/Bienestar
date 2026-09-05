import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, GraduationCap, Users } from 'lucide-react';

import { MetricCard } from '@/components/shared/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Period = {
    id: number;
    code: string;
    name?: string | null;
};

type Estudiante = {
    id: number;
    period_id: number;
    identificacion: string;
    nombres?: string | null;
    apellidos?: string | null;
    nombre_completo: string;
    sexo?: string | null;
    grupos_prioritarios?: string | null;
    estamento?: string | null;
    dependencia?: string | null;
    programa_academico?: string | null;
    servicio?: string | null;
    actividad?: string | null;
    responsable?: string | null;
    trimestre?: string | null;
    period?: Period | null;
};

type Tutor = {
    id: number;
    nombre: string;
    apellido: string;
    correo?: string | null;
    telefono?: string | null;
    rol?: string | null;
};

type Grupo = {
    id: number;
    nombre: string;
    codigo: string;
    docente?: string | null;
    carrera?: { id: number; nombre: string } | null;
    asignatura?: { id: number; nombre: string } | null;
    tutores: Tutor[];
    total_asistencias: number;
    primera_fecha?: string | null;
    ultima_fecha?: string | null;
};

type Nota = {
    id: number;
    materia: string;
    grupo?: string | null;
    programa?: string | null;
    semestre?: string | null;
    nota_1?: number | string | null;
    nota_2?: number | string | null;
    nota_3?: number | string | null;
    definitiva?: number | string | null;
    final?: number | string | null;
    habilitacion?: number | string | null;
};

type ReturnFilters = {
    period_id: number;
    q: string;
    servicio: string;
    trimestre: string;
    page: number;
};

type Props = {
    estudiante: Estudiante;
    return_period_id: number;
    return_filters?: ReturnFilters;
    grupos: Grupo[];
    notas: Nota[];
};

const textOrDash = (value?: string | null) => {
    const text = (value ?? '').trim();
    return text !== '' ? text : '—';
};

const formatDate = (value?: string | null) => {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatNota = (value?: number | string | null) => {
    if (value === null || value === undefined || value === '') return '—';

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return String(value);

    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    }).format(parsed);
};

export default function Show({ estudiante, return_period_id, return_filters, grupos = [], notas = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Estudiantes', href: '/estudiantes' },
        { title: textOrDash(estudiante.nombre_completo), href: `/estudiantes/${estudiante.id}` },
    ];

    const tutorsCount = new Set(grupos.flatMap((grupo) => grupo.tutores.map((tutor) => tutor.id))).size;

    const asignaturas = Array.from(
        new Map(grupos.filter((grupo) => grupo.asignatura?.id).map((grupo) => [grupo.asignatura!.id, grupo.asignatura!.nombre])).values(),
    );

    const goBack = () => {
        const returnPeriodId = Number(return_filters?.period_id || return_period_id || estudiante.period_id) || estudiante.period_id;

        router.get(
            route('estudiantes.index'),
            {
                period_id: returnPeriodId || undefined,
                q: return_filters?.q || undefined,
                servicio: return_filters?.servicio || undefined,
                trimestre: return_filters?.trimestre || undefined,
                page: (return_filters?.page ?? 1) > 1 ? return_filters?.page : undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detalle del estudiante - ${textOrDash(estudiante.nombre_completo)}`} />

            <div className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold">{textOrDash(estudiante.nombre_completo)}</h1>
                        <p className="text-muted-foreground text-sm">
                            Detalle del estudiante para el periodo{' '}
                            <span className="text-foreground font-medium">
                                {estudiante.period
                                    ? `${estudiante.period.code}${estudiante.period.name ? ` · ${estudiante.period.name}` : ''}`
                                    : `#${estudiante.period_id}`}
                            </span>
                        </p>
                    </div>

                    <Button variant="outline" className="w-fit gap-2" onClick={goBack}>
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <MetricCard title="Grupos encontrados" value={grupos.length} icon={Users} color="cyan" detail="Relacionados por asistencias" />
                    <MetricCard
                        title="Tutores asociados"
                        value={tutorsCount}
                        icon={GraduationCap}
                        color="purple"
                        detail="Asignados a los grupos hallados"
                    />
                    <MetricCard title="Notas encontradas" value={notas.length} icon={BookOpen} color="green" detail="Registros del mismo periodo" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos del estudiante</CardTitle>
                        <CardDescription>
                            La relacion con grupos se obtiene desde asistencias del mismo periodo. Si no hay asistencias cargadas, el estudiante puede
                            aparecer sin grupo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <p className="text-muted-foreground text-sm">Identificacion</p>
                            <p className="font-medium">{textOrDash(estudiante.identificacion)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Programa academico</p>
                            <p className="font-medium">{textOrDash(estudiante.programa_academico)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Dependencia</p>
                            <p className="font-medium">{textOrDash(estudiante.dependencia)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Servicio</p>
                            <p className="font-medium">{textOrDash(estudiante.servicio)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Actividad</p>
                            <p className="font-medium">{textOrDash(estudiante.actividad)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Trimestre</p>
                            <p className="font-medium">{textOrDash(estudiante.trimestre)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Responsable</p>
                            <p className="font-medium">{textOrDash(estudiante.responsable)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Sexo</p>
                            <p className="font-medium">{textOrDash(estudiante.sexo)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Grupo priorizado</p>
                            <p className="font-medium">{textOrDash(estudiante.grupos_prioritarios)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Estamento</p>
                            <p className="font-medium">{textOrDash(estudiante.estamento)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Asignaturas detectadas</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {asignaturas.length > 0 ? (
                                    asignaturas.map((asignatura) => (
                                        <Badge key={asignatura} variant="secondary">
                                            {asignatura}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="font-medium">—</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Grupos y tutores</CardTitle>
                        <CardDescription>
                            Si existe algun `grupo_t` relacionado, aqui se muestra con su asignatura y los tutores asignados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {grupos.length === 0 ? (
                            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                No se encontro un grupo relacionado en `grupo_t` para este estudiante en el periodo actual.
                            </div>
                        ) : (
                            grupos.map((grupo) => (
                                <div key={grupo.id} className="rounded-xl border p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold">
                                                {textOrDash(grupo.nombre)} <span className="text-muted-foreground">({textOrDash(grupo.codigo)})</span>
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                Carrera: {grupo.carrera?.nombre ?? '—'} | Asignatura: {grupo.asignatura?.nombre ?? '—'}
                                            </p>
                                            <p className="text-muted-foreground text-sm">Docente: {textOrDash(grupo.docente)}</p>
                                        </div>

                                        <div className="text-muted-foreground text-sm">
                                            <p>
                                                Asistencias: <span className="text-foreground font-medium">{grupo.total_asistencias}</span>
                                            </p>
                                            <p>
                                                Primera fecha: <span className="text-foreground font-medium">{formatDate(grupo.primera_fecha)}</span>
                                            </p>
                                            <p>
                                                Ultima fecha: <span className="text-foreground font-medium">{formatDate(grupo.ultima_fecha)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium">Tutores</p>
                                        {grupo.tutores.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">No hay tutores asignados a este grupo en el periodo.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {grupo.tutores.map((tutor) => (
                                                    <div key={tutor.id} className="bg-muted/40 rounded-lg p-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="font-medium">
                                                                {tutor.nombre} {tutor.apellido}
                                                            </p>
                                                            <Badge variant={tutor.rol === 'principal' ? 'default' : 'outline'}>
                                                                {textOrDash(tutor.rol)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-muted-foreground mt-1 text-sm">Correo: {textOrDash(tutor.correo)}</p>
                                                        <p className="text-muted-foreground text-sm">Telefono: {textOrDash(tutor.telefono)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notas</CardTitle>
                        <CardDescription>Registros encontrados por identificacion y periodo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {notas.length === 0 ? (
                            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                No hay notas registradas para este estudiante en el periodo actual.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Materia</TableHead>
                                            <TableHead>Grupo</TableHead>
                                            <TableHead>Programa</TableHead>
                                            <TableHead>Semestre</TableHead>
                                            <TableHead>N1</TableHead>
                                            <TableHead>N2</TableHead>
                                            <TableHead>N3</TableHead>
                                            <TableHead>Definitiva</TableHead>
                                            <TableHead>Final</TableHead>
                                            <TableHead>Habilitacion</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {notas.map((nota) => (
                                            <TableRow key={nota.id}>
                                                <TableCell className="font-medium">{textOrDash(nota.materia)}</TableCell>
                                                <TableCell>{textOrDash(nota.grupo)}</TableCell>
                                                <TableCell>{textOrDash(nota.programa)}</TableCell>
                                                <TableCell>{textOrDash(nota.semestre)}</TableCell>
                                                <TableCell>{formatNota(nota.nota_1)}</TableCell>
                                                <TableCell>{formatNota(nota.nota_2)}</TableCell>
                                                <TableCell>{formatNota(nota.nota_3)}</TableCell>
                                                <TableCell>{formatNota(nota.definitiva)}</TableCell>
                                                <TableCell>{formatNota(nota.final)}</TableCell>
                                                <TableCell>{formatNota(nota.habilitacion)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
