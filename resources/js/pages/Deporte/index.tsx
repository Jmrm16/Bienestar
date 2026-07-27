import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowRight, Clock3, MapPin, Trophy, Users, Volleyball } from 'lucide-react';
import { getAreaStyle } from './components/area-styles';

type SportArea = {
    key: string;
    title: string;
    card_subtitle?: string | null;
    description: string;
    href: string;
    location: string;
    schedule: string;
    coach: string;
    capacity: number;
    registered: number;
    status: string;
    focus: string;
    services: string[];
    requirements: string[];
    kind: 'servicio' | 'disciplina';
};

type Stats = {
    offers: number;
    disciplines: number;
    services: number;
    free_time_policy: string;
};

type Props = {
    moduleDescription: string;
    areas: SportArea[];
    stats: Stats;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Deporte', href: '/deportes' }];

export default function DeporteIndex({ moduleDescription, areas, stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deporte | Bienestar Universitario" />

            <PageContainer>
                <PageHeader eyebrow="Bienestar universitario" title="Deporte" description={moduleDescription} icon={Volleyball} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Ofertas activas" value={stats.offers} icon={Volleyball} color="blue" detail="Catálogo actual del área" />
                    <MetricCard title="Disciplinas" value={stats.disciplines} icon={Users} color="cyan" detail="Procesos deportivos disponibles" />
                    <MetricCard title="Servicios" value={stats.services} icon={Trophy} color="purple" detail="Servicios de apoyo deportivo" />
                    <MetricCard
                        title="Práctica libre"
                        value={stats.free_time_policy}
                        icon={Activity}
                        color="green"
                        detail="Tiempo máximo de préstamo"
                    />
                </div>

                <SectionHeader
                    title="Oferta por disciplina"
                    description="Selecciona una disciplina o servicio para consultar y gestionar su información."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {areas.map((area) => {
                        const style = getAreaStyle(area.key);
                        const Icon = style.icon;

                        return (
                            <Card key={area.key} className="group hover:bg-muted/20 gap-0 py-0 transition-colors">
                                <CardContent className="flex h-full flex-col p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="bg-primary/10 text-primary rounded-lg p-2.5">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium">
                                            {area.kind === 'servicio' ? 'Servicio' : 'Disciplina'}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        {area.card_subtitle ? (
                                            <div className="text-muted-foreground mb-1 text-xs font-medium">{area.card_subtitle}</div>
                                        ) : null}
                                        <h2 className="text-base font-semibold tracking-tight">{area.title}</h2>
                                        <p className="text-muted-foreground mt-2 line-clamp-2 min-h-10 text-sm leading-5">{area.description}</p>
                                    </div>

                                    <div className="text-muted-foreground mt-5 grid gap-2 border-t pt-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5" />
                                            <span className="truncate">{area.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock3 className="size-3.5" />
                                            <span className="truncate">{area.schedule}</span>
                                        </div>
                                    </div>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="text-primary hover:text-primary/80 mt-3 justify-between px-0 hover:bg-transparent"
                                    >
                                        <Link href={area.href}>
                                            Ver información
                                            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </PageContainer>
        </AppLayout>
    );
}
