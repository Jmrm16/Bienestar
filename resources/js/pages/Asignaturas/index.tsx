import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import AgregarAsignatura from '@/pages/Asignaturas/components/dialogs/AgregarAsignatura';
import ImportarAsignaturasDialog from '@/pages/Asignaturas/components/dialogs/ImportarAsignaturasDialog';
import TablaAsignatura from '@/pages/Asignaturas/components/tables/TablaAsignatura';
import { BookOpen } from 'lucide-react';

// Tipos
interface Carrera {
    id: number;
    nombre: string;
}

interface Asignatura {
    id: number;
    nombre: string;
    carrera_id: number;
    carrera?: Carrera;
}

interface Tutor {
    id: number;
    nombre: string;
    apellido: string;
    grupos: number;
    asignaturas: Asignatura[];
}

interface Grupo {
    id: number;
    nombre: string;
    carrera: Carrera;
}

type Paginator<T> = {
    data: T[];
    total?: number;
};

type Props = {
    tutores?: Tutor[] | Paginator<Tutor>;
    asignaturas?: Asignatura[] | Paginator<Asignatura>;
    carreras?: Carrera[];
    grupos?: Grupo[];
    gruposT?: Grupo[];
};

// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Asignaturas', href: '/asignaturas' }];

// Normalizadores
function toList<T>(maybe: T[] | Paginator<T> | undefined): T[] {
    if (!maybe) return [];
    return Array.isArray(maybe) ? maybe : (maybe.data ?? []);
}

function toCount<T>(maybe: T[] | Paginator<T> | undefined): number {
    if (!maybe) return 0;
    return Array.isArray(maybe) ? maybe.length : (maybe.total ?? maybe.data.length);
}

export default function Index(props: Props) {
    const asignaturasList = toList(props.asignaturas);
    const totalAsignaturas = toCount(props.asignaturas);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asignaturas" />

            <PageContainer>
                <PageHeader
                    title="Asignaturas"
                    description="Consulta, registra e importa las asignaturas asociadas a cada carrera."
                    icon={BookOpen}
                    actions={
                        <>
                            <AgregarAsignatura carreras={props.carreras ?? []} />
                            <ImportarAsignaturasDialog />
                        </>
                    }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Asignaturas"
                        value={totalAsignaturas}
                        icon={BookOpen}
                        color="blue"
                        detail={`${asignaturasList.length} registradas`}
                    />
                </div>

                <section className="space-y-4">
                    <SectionHeader title="Asignaturas registradas" description="Listado y acciones disponibles para el catálogo académico." />
                    <TablaAsignatura asignaturas={asignaturasList} carreras={props.carreras ?? []} />
                </section>
            </PageContainer>
        </AppLayout>
    );
}
