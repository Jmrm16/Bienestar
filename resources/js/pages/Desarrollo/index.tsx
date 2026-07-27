import { EmptyModule, PageContainer, PageHeader } from '@/components/shared/page-shell';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BrainCircuit } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Desarrollo Humano', href: '/desarrollo-humano' }];

export default function DesarrolloIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Desarrollo Humano | Bienestar Universitario" />
            <PageContainer>
                <PageHeader
                    eyebrow="Bienestar universitario"
                    title="Desarrollo humano"
                    description="Espacio para gestionar las actividades y servicios de desarrollo humano."
                    icon={BrainCircuit}
                />
                <EmptyModule
                    title="Módulo en preparación"
                    description="Aquí aparecerán las herramientas operativas de desarrollo humano cuando estén disponibles."
                    icon={BrainCircuit}
                />
            </PageContainer>
        </AppLayout>
    );
}
