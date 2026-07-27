import { EmptyModule, PageContainer, PageHeader } from '@/components/shared/page-shell';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { HandCoins } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Promoción Socioeconómica', href: '/promocion-socioeconomica' }];

export default function PromocionIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promoción Socioeconómica | Bienestar Universitario" />
            <PageContainer>
                <PageHeader
                    eyebrow="Bienestar universitario"
                    title="Promoción socioeconómica"
                    description="Espacio para administrar apoyos, convocatorias y seguimiento socioeconómico."
                    icon={HandCoins}
                />
                <EmptyModule
                    title="Módulo en preparación"
                    description="Las herramientas operativas de promoción socioeconómica se mostrarán aquí cuando estén disponibles."
                    icon={HandCoins}
                />
            </PageContainer>
        </AppLayout>
    );
}
