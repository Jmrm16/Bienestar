import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { MetricCard } from '@/components/component/MetricCard';
import { Cpu, HardDrive, Layers } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AsistenciaChart from '@/components/charts/AsistenciaChart';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

interface DashboardPageProps {
  totalTutores: number;
  totalAsignaturas: number;
  totalGrupos: number;
  asistenciasPorFecha: { fecha: string; total: number }[];
  [key: string]: unknown;
}

export default function Dashboard() {
  const { totalTutores, totalAsignaturas, totalGrupos, asistenciasPorFecha } = usePage<DashboardPageProps>().props;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
        {/* Tarjetas de métricas con MetricCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <MetricCard
            title="Tutores"
            value={totalTutores}
            icon={Cpu}
            color="cyan"
            detail={`${totalTutores} registrados`}
          />
          <MetricCard
            title="Asignaturas"
            value={totalAsignaturas}
            icon={HardDrive}
            color="purple"
            detail={`${totalAsignaturas} registradas`}
          />
          <MetricCard
            title="Grupos"
            value={totalGrupos}
            icon={Layers}
            color="blue"
            detail={`${totalGrupos} creados`}
          />
        </div>

        {/* Gráfico de asistencias */}
        <div className="mt-8">
          <AsistenciaChart data={asistenciasPorFecha} />
        </div>
      </div>
    </AppLayout>
  );
}
