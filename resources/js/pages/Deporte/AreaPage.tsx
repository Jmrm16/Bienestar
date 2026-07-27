import { PageContainer, PageHeader } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin } from 'lucide-react';
import { ParticipantsSection } from './components/ParticipantsSection';
import { getAreaStyle } from './components/area-styles';
import type { Carrera, ParticipantStats, SportParticipant } from './components/types';

type SportArea = {
    key: string;
    title: string;
    description: string;
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
    href: string;
};

type Props = {
    area: SportArea;
    participants: SportParticipant[];
    carreras: Carrera[];
    participantStats: ParticipantStats;
};

export default function AreaPage({ area, participants, carreras, participantStats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Deporte', href: '/deportes' },
        { title: area.title, href: area.href },
    ];

    const Icon = getAreaStyle(area.key).icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${area.title} | Deporte`} />

            <PageContainer>
                <PageHeader
                    eyebrow={area.kind === 'servicio' ? 'Servicio deportivo' : 'Disciplina deportiva'}
                    title={area.title}
                    description={area.description}
                    icon={Icon}
                    actions={
                        <Button asChild variant="outline">
                            <Link href="/deportes">
                                <ArrowLeft className="size-4" />
                                Volver a Deporte
                            </Link>
                        </Button>
                    }
                />

                <section className="border-y py-5">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                        <div className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <Clock3 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Horario</p>
                                        <p className="text-muted-foreground mt-1 text-sm leading-6">{area.schedule}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Lugar</p>
                                        <p className="text-muted-foreground mt-1 text-sm leading-6">{area.location}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Enfoque</p>
                                <p className="text-muted-foreground mt-1 text-sm leading-6">{area.focus}</p>
                            </div>

                            {area.services.length ? (
                                <div>
                                    <p className="text-sm font-medium">{area.kind === 'servicio' ? 'Servicios' : 'Líneas de trabajo'}</p>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">{area.services.join(' · ')}</p>
                                </div>
                            ) : null}
                        </div>

                        <div className="border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">Requisitos</p>
                                {area.status ? (
                                    <Badge variant="secondary">
                                        <CalendarDays className="size-3.5" />
                                        {area.status}
                                    </Badge>
                                ) : null}
                            </div>

                            {area.requirements.length ? (
                                <ul className="mt-3 space-y-2.5">
                                    {area.requirements.map((requirement) => (
                                        <li key={requirement} className="text-muted-foreground flex items-start gap-2.5 text-sm leading-6">
                                            <CheckCircle2 className="text-primary mt-1 size-3.5 shrink-0" />
                                            <span>{requirement}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground mt-2 text-sm">No hay requisitos adicionales.</p>
                            )}
                        </div>
                    </div>
                </section>

                <ParticipantsSection
                    sportKey={area.key}
                    sportTitle={area.title}
                    participants={participants}
                    carreras={carreras}
                    stats={participantStats}
                />
            </PageContainer>
        </AppLayout>
    );
}
