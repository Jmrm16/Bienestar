import AppLayout from '@/layouts/app-layout';
import { type Grupo } from '@/types';
import { Head, router } from '@inertiajs/react';

import { MetricCard } from '@/components/shared/metric-card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ArrowLeft, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { columnsEstudiantes, type Estudiante } from './columns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    grupo: Grupo;
    estudiantes: Estudiante[];
};

export default function GrupoDetalle({ grupo, estudiantes: initialEstudiantes }: Props) {
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [loading] = useState(false);

    useEffect(() => {
        if (initialEstudiantes && Array.isArray(initialEstudiantes)) {
            setEstudiantes(initialEstudiantes);
        }
    }, [initialEstudiantes]);

    return (
        <AppLayout>
            <Head title={`Grupo ${grupo.nombre} - Detalle`} />

            {/* Botón + métrica alineados a la izquierda */}
            <div className="mb-6 flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="flex w-fit items-center gap-2 text-blue-500 hover:text-blue-700"
                    onClick={() => router.visit('/estudiantes')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver atrás
                </Button>

                <div className="max-w-xs">
                    <MetricCard title="Estudiantes" value={estudiantes.length} icon={Cpu} color="cyan" detail={`${estudiantes.length} registradas`} />
                </div>
            </div>

            {/* Información del grupo */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-white">
                        Estudiantes del Grupo: {grupo.nombre} {grupo.codigo}
                    </CardTitle>
                    <p className="text-muted-foreground">Carrera: {grupo.carrera?.nombre || '—'}</p>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto rounded-xl border p-4">
                        {loading ? (
                            <p>Cargando estudiantes...</p>
                        ) : estudiantes.length > 0 ? (
                            <div className="min-w-[1500px]">
                                <DataTable columns={columnsEstudiantes} data={estudiantes} searchKey="nombres" />
                            </div>
                        ) : (
                            <p>No hay estudiantes disponibles.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
