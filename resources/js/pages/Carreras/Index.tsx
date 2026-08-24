import { Head } from '@inertiajs/react';

import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { GraduationCap } from 'lucide-react';
import AgregarCarrera from './components/dialogs/AgregarCarrera';
import TablaCarreras from './components/tables/TablaCarreras';

// Tipos
type Carrera = {
    id: number;
    nombre: string;
    codigo: string;
};

type Paginator<T> = {
    data: T[];
    total?: number;
};

type Props = {
    carreras?: Carrera[] | Paginator<Carrera>;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Carreras', href: '/carreras' }];

// 👉 util para normalizar a lista
function toList<T>(maybe: T[] | Paginator<T> | undefined): T[] {
    if (!maybe) return [];
    return Array.isArray(maybe) ? maybe : (maybe.data ?? []);
}
// 👉 util para contar
function toCount<T>(maybe: T[] | Paginator<T> | undefined): number {
    if (!maybe) return 0;
    return Array.isArray(maybe) ? maybe.length : (maybe.total ?? maybe.data?.length ?? 0);
}

export default function Index(props: Props) {
    const carrerasList = toList(props.carreras);
    const totalCarreras = toCount(props.carreras);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Carreras" />
            <PageContainer>
                <PageHeader
                    title="Carreras"
                    description="Gestiona el catálogo de programas académicos y sus códigos."
                    icon={GraduationCap}
                    actions={<AgregarCarrera />}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Carreras"
                        value={totalCarreras}
                        icon={GraduationCap}
                        color="blue"
                        detail={`${carrerasList.length} en esta página`}
                    />
                </div>

                <section className="space-y-4">
                    <SectionHeader title="Carreras registradas" description="Programas disponibles para asignación en los módulos académicos." />
                    <TablaCarreras />
                </section>
            </PageContainer>
        </AppLayout>
    );
}
