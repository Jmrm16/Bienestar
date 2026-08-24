import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, HeartPulse, Smile, Stethoscope } from 'lucide-react';

type SaludArea = {
    key: string;
    title: string;
    description: string;
    href: string;
    icon: any;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Salud', href: '/salud' }];

const SALUD_AREAS: SaludArea[] = [
    {
        key: 'medicina',
        title: 'Medicina general',
        description: 'Citas, atenciones, remisiones y controles.',
        href: '/salud/medicina-general',
        icon: HeartPulse,
    },
    {
        key: 'odontologia',
        title: 'Odontología',
        description: 'Valoraciones, procedimientos y seguimiento.',
        href: '/salud/odontologia',
        icon: Smile,
    },

    {
        key: 'enfermeria',
        title: 'Enfermería',
        description: 'Atenciones y seguimiento por sesión.',
        href: '/salud/enfermeria',
        icon: Activity,
    },
];

export default function SaludIndex() {
    const go = (href: string) => router.visit(href);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salud | Bienestar Universitario" />

            <PageContainer>
                <PageHeader
                    eyebrow="Bienestar universitario"
                    title="Salud"
                    description="Selecciona un área para gestionar citas, atenciones y seguimiento."
                    icon={Stethoscope}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Áreas activas" value={SALUD_AREAS.length} icon={Stethoscope} color="cyan" detail="Servicios disponibles" />
                    <MetricCard
                        title="Citas (hoy)"
                        value={'—'} // ✅ ahora NO da error
                        icon={HeartPulse}
                        color="blue"
                        detail="Pendiente de integrar"
                    />
                    <MetricCard
                        title="Atenciones (mes)"
                        value={'—'} // ✅ ahora NO da error
                        icon={Activity}
                        color="purple"
                        detail="Pendiente de integrar"
                    />
                    <MetricCard
                        title="Remisiones"
                        value={'—'} // ✅ ahora NO da error
                        icon={ArrowRight}
                        color="green"
                        detail="Pendiente de integrar"
                    />
                </div>

                <section className="space-y-4">
                    <SectionHeader title="Áreas de atención" description="Accede al espacio de trabajo de cada servicio de salud." />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {SALUD_AREAS.map((a, idx) => (
                            <motion.button
                                key={a.key}
                                onClick={() => go(a.href)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-card text-card-foreground hover:bg-muted/40 focus-visible:ring-ring rounded-xl border p-5 text-left shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 text-primary rounded-lg p-2">
                                            <a.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base leading-tight font-semibold">{a.title}</h3>
                                            <p className="text-muted-foreground mt-1 text-sm">{a.description}</p>
                                        </div>
                                    </div>

                                    <ArrowRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition group-hover:translate-x-1" />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">Citas</span>
                                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">Atenciones</span>
                                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">Reportes</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>
            </PageContainer>
        </AppLayout>
    );
}
