// resources/js/Pages/Acompanamiento/Carreras/Index.tsx
import { PageContainer, PageHeader } from '@/components/shared/page-shell';
import AppLayout from '@/layouts/app-layout';
import AgregarCarrera from '@/pages/Acompanamiento/components/dialogs/AgregarCarrera';
import TablaCarreras from '@/pages/Acompanamiento/components/tables/TablaCarrera';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Layers } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Acompañamiento', href: '/acompanamiento' },
    { title: 'Carreras', href: '/acompanamiento/carreras' },
];

export default function AcompanamientoCarrerasIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Carreras de Acompañamiento" />
            <PageContainer>
                <PageHeader
                    eyebrow="Acompañamiento"
                    title="Carreras"
                    description="Administra las carreras vinculadas a los procesos de acompañamiento."
                    icon={Layers}
                    actions={<AgregarCarrera />}
                />
                <TablaCarreras />
            </PageContainer>
        </AppLayout>
    );
}
