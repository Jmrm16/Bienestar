import { AttendanceTrendChart, ModuleDistributionChart, ModuleVolumeChart, SelectedModuleChart } from '@/components/charts/dashboard-charts';
import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Cpu,
    FileSpreadsheet,
    Flower,
    HardDrive,
    Layers,
    LayoutDashboard,
    NotebookText,
    Stethoscope,
    Trophy,
    Users,
    Volleyball,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Panel de control',
        href: '/dashboard',
    },
];

interface DashboardPageProps {
    asistenciasPorFecha: { fecha: string; total: number }[];
    defaultModule: string;
    moduleSummaries: ModuleSummary[];
    [key: string]: unknown;
}

type MetricColor = 'cyan' | 'purple' | 'blue' | 'green';

interface ModuleMetric {
    key: string;
    label: string;
    value: number | string;
    detail: string;
}

interface ModuleSummary {
    key: string;
    title: string;
    description: string;
    href: string;
    supports_chart: boolean;
    metrics: ModuleMetric[];
}

const metricColors: MetricColor[] = ['blue', 'cyan', 'purple', 'green'];

const moduleIcons: Record<string, LucideIcon> = {
    tutorias: Users,
    informes: FileSpreadsheet,
    acompanamiento: Layers,
    notas: NotebookText,
    cultura: Flower,
    salud: Stethoscope,
    deporte: Volleyball,
};

const metricIcons: Record<string, LucideIcon> = {
    tutores: Users,
    asignaturas: BookOpen,
    grupos: Layers,
    asistencias: HardDrive,
    periodos: CalendarDays,
    entregas: FileSpreadsheet,
    asignaciones: FileSpreadsheet,
    enviados: ArrowRight,
    estudiantes: Users,
    asistencias_ocasionales: HardDrive,
    notas: NotebookText,
    materias: BookOpen,
    publicaciones: Flower,
    publicadas: Flower,
    eventos: CalendarDays,
    noticias: NotebookText,
    pacientes: Users,
    atenciones: Stethoscope,
    medicamentos: HardDrive,
    ofertas: Trophy,
    participantes: Users,
    carreras: Layers,
    activos: CheckCircle2,
};

function toNumber(value: number | string) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

export default function Dashboard() {
    const { asistenciasPorFecha = [], moduleSummaries = [], defaultModule } = usePage<DashboardPageProps>().props;

    const [selectedModule, setSelectedModule] = useState<string>(defaultModule || moduleSummaries[0]?.key || 'tutorias');

    const currentModule = useMemo(
        () => moduleSummaries.find((module) => module.key === selectedModule) ?? moduleSummaries[0],
        [moduleSummaries, selectedModule],
    );

    const moduleVolume = useMemo(
        () =>
            moduleSummaries.map((module) => ({
                key: module.key,
                label: module.title,
                value: toNumber(module.metrics[0]?.value ?? 0),
                fill: `var(--color-${module.key})`,
            })),
        [moduleSummaries],
    );

    const modulesWithData = useMemo(() => moduleVolume.filter((module) => module.value > 0).length, [moduleVolume]);

    const attendanceTotal = useMemo(() => asistenciasPorFecha.reduce((sum, point) => sum + toNumber(point.total), 0), [asistenciasPorFecha]);

    const leadingModule = useMemo(
        () =>
            [...moduleVolume].sort((a, b) => b.value - a.value)[0] ?? {
                label: 'Sin datos',
                value: 0,
            },
        [moduleVolume],
    );

    const maxModuleValue = Math.max(1, ...moduleVolume.map((module) => module.value));

    const selectedMetrics = useMemo(
        () =>
            (currentModule?.metrics ?? []).map((metric) => ({
                label: metric.label,
                value: toNumber(metric.value),
            })),
        [currentModule],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel de control" />

            <PageContainer>
                <PageHeader
                    eyebrow="Resumen institucional"
                    title="Panel de control"
                    description="Indicadores consolidados de los servicios académicos y de bienestar."
                    icon={LayoutDashboard}
                    actions={
                        <Badge variant="outline" className="h-8 px-3">
                            {moduleSummaries.length * 4} indicadores monitoreados
                        </Badge>
                    }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Módulos activos"
                        value={`${modulesWithData}/${moduleSummaries.length}`}
                        icon={LayoutDashboard}
                        color="blue"
                        detail="Con información registrada"
                    />
                    <MetricCard
                        title="Asistencias recientes"
                        value={attendanceTotal.toLocaleString('es-CO')}
                        icon={Activity}
                        color="cyan"
                        detail="Últimos 30 días con registros"
                    />
                    <MetricCard
                        title="Mayor volumen"
                        value={leadingModule.value.toLocaleString('es-CO')}
                        icon={BarChart3}
                        color="purple"
                        detail={leadingModule.label}
                    />
                    <MetricCard
                        title="Cobertura de datos"
                        value={moduleSummaries.length ? `${Math.round((modulesWithData / moduleSummaries.length) * 100)}%` : '0%'}
                        icon={CheckCircle2}
                        color="green"
                        detail="Módulos con actividad"
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="gap-0 xl:col-span-2">
                        <CardHeader className="border-b">
                            <CardTitle className="text-base">Tendencia de asistencias</CardTitle>
                            <CardDescription>Evolución diaria de los últimos 30 días con actividad registrada.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <AttendanceTrendChart data={asistenciasPorFecha} />
                        </CardContent>
                    </Card>

                    <Card className="gap-0">
                        <CardHeader className="border-b">
                            <CardTitle className="text-base">Distribución principal</CardTitle>
                            <CardDescription>Primera métrica operativa de cada módulo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ModuleDistributionChart data={moduleVolume} />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
                    <Card className="gap-0">
                        <CardHeader className="border-b">
                            <CardTitle className="text-base">Volumen principal por módulo</CardTitle>
                            <CardDescription>Comparación de la entidad principal que administra cada área.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <ModuleVolumeChart data={moduleVolume} />
                        </CardContent>
                    </Card>

                    <Card className="gap-0">
                        <CardHeader className="border-b">
                            <CardTitle className="text-base">Cobertura por área</CardTitle>
                            <CardDescription>Nivel relativo frente al módulo con mayor volumen.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            {moduleVolume.map((module) => {
                                const Icon = moduleIcons[module.key] ?? Cpu;
                                const percentage = Math.round((module.value / maxModuleValue) * 100);

                                return (
                                    <div key={module.key} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="text-muted-foreground size-4" />
                                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{module.label}</span>
                                            <span className="text-muted-foreground text-sm tabular-nums">{module.value.toLocaleString('es-CO')}</span>
                                        </div>
                                        <Progress value={percentage} className="h-1.5" />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <section className="space-y-5">
                    <SectionHeader title="Detalle por módulo" description="Cambia de área para comparar sus cuatro indicadores operativos." />

                    <div className="flex flex-wrap gap-2">
                        {moduleSummaries.map((module) => {
                            const Icon = moduleIcons[module.key] ?? Layers;
                            const isSelected = module.key === currentModule?.key;

                            return (
                                <Button
                                    key={module.key}
                                    type="button"
                                    variant={isSelected ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedModule(module.key)}
                                >
                                    <Icon className="size-4" />
                                    {module.title}
                                </Button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {currentModule ? (
                            <motion.div
                                key={currentModule.key}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.18 }}
                                className="space-y-4"
                            >
                                <Card className="gap-0">
                                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-semibold tracking-tight">{currentModule.title}</h2>
                                                <Badge variant="secondary">{currentModule.metrics.length} métricas</Badge>
                                            </div>
                                            <p className="text-muted-foreground max-w-3xl text-sm">{currentModule.description}</p>
                                        </div>
                                        <Button asChild variant="outline">
                                            <Link href={currentModule.href} prefetch>
                                                Abrir módulo
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {currentModule.metrics.map((metric, index) => {
                                        const Icon = metricIcons[metric.key] ?? Cpu;

                                        return (
                                            <MetricCard
                                                key={`${currentModule.key}-${metric.key}-${index}`}
                                                title={metric.label}
                                                value={metric.value}
                                                icon={Icon}
                                                color={metricColors[index % metricColors.length]}
                                                detail={metric.detail}
                                            />
                                        );
                                    })}
                                </div>

                                <Card className="gap-0">
                                    <CardHeader className="border-b">
                                        <CardTitle className="text-base">Comparación interna</CardTitle>
                                        <CardDescription>Relación entre los indicadores disponibles en {currentModule.title}.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-5">
                                        <SelectedModuleChart data={selectedMetrics} />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </section>
            </PageContainer>
        </AppLayout>
    );
}
