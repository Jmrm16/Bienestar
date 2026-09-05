import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import TablaTutor from '@/pages/Tutores/components/tables/TablaTutor';
import { BookOpen, GraduationCap, UserCheck, Users } from 'lucide-react';

// Tipos
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
    grupos: number;
    asignaturas: Asignatura[];
}

type Carrera = {
    id: number;
    nombre: string;
};

type Periodo = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
};

interface Props {
    tutores: Tutor[];
    asignaturas: Asignatura[];
    carreras: Carrera[];
    periodos: Periodo[];
}

// Migas de pan
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Registro',
        href: '/Registro',
    },
];

export default function Index({ tutores, asignaturas, carreras }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tutores" />
            <PageContainer>
                <PageHeader
                    eyebrow="Permanencia y graduación"
                    title="Tutores"
                    description="Administra tutores, asignaturas, carreras y disponibilidad académica."
                    icon={Users}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Tutores" value={tutores.length} icon={Users} color="blue" detail={`${tutores.length} registrados`} />
                    <MetricCard
                        title="Asignaturas"
                        value={asignaturas.length}
                        icon={BookOpen}
                        color="purple"
                        detail={`${asignaturas.length} registradas`}
                    />
                    <MetricCard
                        title="Tutores disponibles"
                        value={tutores.length}
                        icon={UserCheck}
                        color="blue"
                        detail={`${tutores.length} disponibles`}
                    />
                    <MetricCard
                        title="Carreras"
                        value={carreras.length}
                        icon={GraduationCap}
                        color="cyan"
                        detail={`${carreras.length} registradas`}
                    />
                </div>

                <section className="space-y-4">
                    <SectionHeader title="Directorio de tutores" description="Filtra el listado y gestiona la información académica de cada tutor." />
                    <TablaTutor />
                </section>
            </PageContainer>
        </AppLayout>
    );
}
