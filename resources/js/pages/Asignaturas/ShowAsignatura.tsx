import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import AgregarGrupo from '@/pages/Tutores/components/dialogs/AgregarGrupo';
import ImportarGruposDialog from '@/pages/Tutores/components/dialogs/ImportarGruposDialog';
import TablaGrupo from '@/pages/Tutores/components/tables/TablaGrupos';
import { Asignatura, Carrera, Grupo, Tutor } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Props {
    asignatura: Asignatura & {
        carrera: Carrera;
        grupos: Grupo[];
    };
    tutores: Tutor[];
}

export default function ShowAsignatura({ asignatura, tutores }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Tutores', href: '/tutores' },
                { title: asignatura.nombre, href: '#' },
            ]}
        >
            <Head title={`Asignatura - ${asignatura.nombre}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-6">
                {/* ✅ Botón de regreso */}
                <div>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                        onClick={() => router.visit('/asignaturas')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver atras
                    </Button>
                </div>

                {/* Información de la asignatura */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la asignatura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-zinc-700">
                        <p>
                            <strong>Nombre:</strong> {asignatura.nombre}
                        </p>

                        <p>
                            <strong>Carrera:</strong> {asignatura.carrera.nombre}
                        </p>
                    </CardContent>
                </Card>

                {/* Sección de Grupos */}
                <div>
                    <p className="mb-4 text-2xl font-bold text-zinc-800">Grupos</p>
                    <div className="mb-4 flex space-x-4">
                        <AgregarGrupo />
                        <ImportarGruposDialog />
                    </div>
                    <TablaGrupo grupos={asignatura.grupos} tutores={tutores} />
                </div>
            </div>
        </AppLayout>
    );
}
