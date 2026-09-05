import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CalendarDays, GraduationCap, ListChecks, Users } from 'lucide-react';

import { MetricCard } from '@/components/shared/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Asignatura = {
    id: number;
    nombre: string;
};

type TutorGrupo = {
    id: number;
    nombre: string;
    codigo: string;
    rol?: string | null;
    period?: { id: number; code: string; name?: string | null } | null;
    carrera?: { id: number; nombre: string } | null;
    asignatura?: { id: number; nombre: string } | null;
    total_asistencias: number;
    total_estudiantes: number;
    ultima_fecha?: string | null;
};

type Tutor = {
    id: number;
    codigo?: string | null;
    nombre: string;
    apellido: string;
    tipo_documento: string;
    documento: string;
    lugar_expedicion: string;
    sexo: string;
    grupo_priorizado: string;
    sede: string;
    correo: string;
    telefono: string;
    activo?: boolean;
    carrera?: { id: number; nombre: string } | null;
    asignaturas: Asignatura[];
    period_resolutions?: {
        period_id: number;
        tipo_resolucion: 'R1' | 'R2';
        period?: { id: number; code: string; name?: string | null } | null;
    }[];
    grupos: TutorGrupo[];
};

type Resumen = {
    total_grupos: number;
    grupos_con_asistencias: number;
    total_estudiantes: number;
    total_asistencias: number;
};

type Props = {
    tutor: Tutor;
    resumen: Resumen;
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

export default function TutorProfile({ tutor, resumen }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tutores', href: '/tutores' },
        {
            title: `${tutor.nombre} ${tutor.apellido}`.trim(),
            href: `/tutores/${tutor.id}/perfil`,
        },
    ];

    const goBack = () => {
        router.get(route('tutores.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const openAsistenciaByGrupo = (grupoId: number) => {
        router.visit(`/grupos/${grupoId}/asistencias`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Perfil administrativo - ${tutor.nombre} ${tutor.apellido}`} />

            <div className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold">
                            {tutor.nombre} {tutor.apellido}
                        </h1>
                        <p className="text-muted-foreground text-sm">Perfil administrativo del tutor con resumen de grupos y asistencias.</p>
                    </div>

                    <Button variant="outline" className="w-fit gap-2" onClick={goBack}>
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <MetricCard
                        title="Grupos asignados"
                        value={resumen.total_grupos}
                        icon={Users}
                        color="cyan"
                        detail="Relaciones vigentes por periodo"
                    />
                    <MetricCard
                        title="Con asistencias"
                        value={resumen.grupos_con_asistencias}
                        icon={ListChecks}
                        color="purple"
                        detail="Grupos con registros cargados"
                    />
                    <MetricCard
                        title="Estudiantes"
                        value={resumen.total_estudiantes}
                        icon={GraduationCap}
                        color="blue"
                        detail="Suma por grupos del tutor"
                    />
                    <MetricCard
                        title="Asistencias"
                        value={resumen.total_asistencias}
                        icon={BookOpen}
                        color="green"
                        detail="Total de asistencias registradas"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos del tutor</CardTitle>
                        <CardDescription>Informacion base registrada en el modulo administrativo.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <p className="text-muted-foreground text-sm">Codigo</p>
                            <p className="font-medium">{textOrDash(tutor.codigo)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Resoluciones por periodo</p>
                            {tutor.period_resolutions && tutor.period_resolutions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tutor.period_resolutions.map((resolution) => (
                                        <Badge key={`${resolution.period_id}-${resolution.tipo_resolucion}`} variant="secondary">
                                            {resolution.period?.code ?? `Periodo #${resolution.period_id}`}: {resolution.tipo_resolucion}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="font-medium">—</p>
                            )}
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Estado</p>
                            <p className="font-medium">{tutor.activo ? 'Activo' : 'Inactivo'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Tipo de documento</p>
                            <p className="font-medium">{textOrDash(tutor.tipo_documento)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Documento</p>
                            <p className="font-medium">{textOrDash(tutor.documento)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Lugar de expedicion</p>
                            <p className="font-medium">{textOrDash(tutor.lugar_expedicion)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Sexo</p>
                            <p className="font-medium">{textOrDash(tutor.sexo)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Grupo priorizado</p>
                            <p className="font-medium">{textOrDash(tutor.grupo_priorizado)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Sede</p>
                            <p className="font-medium">{textOrDash(tutor.sede)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Carrera</p>
                            <p className="font-medium">{textOrDash(tutor.carrera?.nombre)}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-muted-foreground text-sm">Correo</p>
                            <p className="font-medium">{textOrDash(tutor.correo)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Telefono</p>
                            <p className="font-medium">{textOrDash(tutor.telefono)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Asignaturas</CardTitle>
                        <CardDescription>Asignaturas asociadas al tutor para asignacion de grupos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tutor.asignaturas.length === 0 ? (
                            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                Este tutor no tiene asignaturas asignadas.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tutor.asignaturas.map((asignatura) => (
                                    <Badge key={asignatura.id} variant="secondary">
                                        {asignatura.nombre}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Grupos y asistencias</CardTitle>
                        <CardDescription>Desde aqui puedes revisar los grupos del tutor y abrir la vista de asistencias por grupo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tutor.grupos.length === 0 ? (
                            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                El tutor no tiene grupos asignados en este momento.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Periodo</TableHead>
                                            <TableHead>Grupo</TableHead>
                                            <TableHead>Carrera</TableHead>
                                            <TableHead>Asignatura</TableHead>
                                            <TableHead>Rol</TableHead>
                                            <TableHead>Estudiantes</TableHead>
                                            <TableHead>Asistencias</TableHead>
                                            <TableHead>Ultima asistencia</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tutor.grupos.map((grupo) => (
                                            <TableRow key={`${grupo.id}-${grupo.period?.id ?? 'na'}`}>
                                                <TableCell>
                                                    {grupo.period ? `${grupo.period.code}${grupo.period.name ? ` · ${grupo.period.name}` : ''}` : '—'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {textOrDash(grupo.nombre)} ({textOrDash(grupo.codigo)})
                                                </TableCell>
                                                <TableCell>{textOrDash(grupo.carrera?.nombre)}</TableCell>
                                                <TableCell>{textOrDash(grupo.asignatura?.nombre)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={grupo.rol === 'principal' ? 'default' : 'outline'}>{textOrDash(grupo.rol)}</Badge>
                                                </TableCell>
                                                <TableCell>{grupo.total_estudiantes}</TableCell>
                                                <TableCell>{grupo.total_asistencias}</TableCell>
                                                <TableCell>{formatDate(grupo.ultima_fecha)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => openAsistenciaByGrupo(grupo.id)}
                                                    >
                                                        <CalendarDays className="h-4 w-4" />
                                                        Ver asistencias
                                                    </Button>
                                                </TableCell>
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
