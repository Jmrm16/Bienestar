import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { MetricCard } from '@/components/component/MetricCard';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  CalendarDays,
  BookOpen,
  Cpu,
  Flower,
  FileSpreadsheet,
  HardDrive,
  Layers,
  NotebookText,
  Stethoscope,
  Trophy,
  Users,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AsistenciaChart from '@/components/charts/AsistenciaChart';

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

const metricColors: MetricColor[] = ['cyan', 'purple', 'blue', 'green'];

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
  activos: Cpu,
};

export default function Dashboard() {
  const {
    asistenciasPorFecha,
    moduleSummaries,
    defaultModule,
  } = usePage<DashboardPageProps>().props;

  const [selectedModule, setSelectedModule] = useState<string>(
    defaultModule || moduleSummaries?.[0]?.key || 'tutorias',
  );

  const currentModule = useMemo(
    () => moduleSummaries.find((module) => module.key === selectedModule) ?? moduleSummaries[0],
    [moduleSummaries, selectedModule],
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Panel de control" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <Card className="rounded-2xl border">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Panel de control
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Módulos funcionales de Bienestar
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Selecciona un módulo y consulta únicamente sus métricas operativas y académicas.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {moduleSummaries.map((module) => {
                const Icon = moduleIcons[module.key] ?? Layers;
                const isSelected = module.key === currentModule?.key;

                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => setSelectedModule(module.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background text-foreground hover:border-primary/40 hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {module.title}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {currentModule ? (
          <>
            <Card className="rounded-2xl border">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">{currentModule.title}</h2>
                  <p className="text-sm text-muted-foreground">{currentModule.description}</p>
                </div>
                <Link
                  href={currentModule.href}
                  prefetch
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
                >
                  Abrir módulo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {currentModule.metrics.map((metric, index) => {
                const Icon = metricIcons[metric.key] ?? Cpu;
                const color = metricColors[index % metricColors.length];

                return (
                  <MetricCard
                    key={`${currentModule.key}-${metric.key}-${index}`}
                    title={metric.label}
                    value={metric.value}
                    icon={Icon}
                    color={color}
                    detail={metric.detail}
                  />
                );
              })}
            </div>

            {currentModule.supports_chart && (
              <Card className="rounded-2xl border">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold">Tendencia de asistencias</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Últimos registros consolidados del módulo seleccionado.
                  </p>
                  <AsistenciaChart data={asistenciasPorFecha} />
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
