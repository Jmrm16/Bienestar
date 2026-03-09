<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $asistenciasPorFecha = $this->buildAsistenciasPorFecha();

        $totalTutores = $this->countTable('tutors');
        $totalAsignaturas = $this->countTable('asignaturas');
        $totalGrupos = $this->countTable('grupo_t');

        $moduleSummaries = [
            [
                'key' => 'tutorias',
                'title' => 'Tutorias',
                'description' => 'Modulo para organizar y consultar la informacion academica de tutores, grupos y asistencias.',
                'href' => '/tutores',
                'supports_chart' => true,
                'metrics' => [
                    ['key' => 'tutores', 'label' => 'Tutores', 'value' => $totalTutores, 'detail' => 'Registrados'],
                    ['key' => 'asignaturas', 'label' => 'Asignaturas', 'value' => $totalAsignaturas, 'detail' => 'Disponibles'],
                    ['key' => 'grupos', 'label' => 'Grupos', 'value' => $totalGrupos, 'detail' => 'Configurados'],
                    ['key' => 'asistencias', 'label' => 'Asistencias', 'value' => $this->countTable('asistencias'), 'detail' => 'Registros totales'],
                ],
            ],
            [
                'key' => 'informes',
                'title' => 'Informes',
                'description' => 'Seguimiento de periodos, entregas y estado de reportes academicos.',
                'href' => '/reportes/periodos',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'periodos', 'label' => 'Periodos', 'value' => $this->countTable('report_periods'), 'detail' => 'Creados'],
                    ['key' => 'entregas', 'label' => 'Entregas', 'value' => $this->countTable('report_windows'), 'detail' => 'Configuradas'],
                    ['key' => 'asignaciones', 'label' => 'Asignaciones', 'value' => $this->countTable('tutor_reports'), 'detail' => 'Reportes de tutor'],
                    ['key' => 'enviados', 'label' => 'Enviados', 'value' => $this->countWhere('tutor_reports', 'status', 'submitted'), 'detail' => 'Estado submitted'],
                ],
            ],
            [
                'key' => 'acompanamiento',
                'title' => 'Acompanamiento',
                'description' => 'Control de estudiantes y estructura de acompanamiento academico.',
                'href' => '/estudiantes',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'estudiantes', 'label' => 'Estudiantes', 'value' => $this->countTable('estudiantes'), 'detail' => 'Registrados'],
                    ['key' => 'carreras', 'label' => 'Carreras', 'value' => $this->countTable('acompanamiento_carreras'), 'detail' => 'En acompanamiento'],
                    ['key' => 'grupos', 'label' => 'Grupos', 'value' => $this->countTable('acompanamiento_grupos'), 'detail' => 'Activos'],
                    ['key' => 'asistencias_ocasionales', 'label' => 'Asist. Ocasional', 'value' => $this->countTable('asistencias_ocasionales'), 'detail' => 'Registros'],
                ],
            ],
            [
                'key' => 'notas',
                'title' => 'Notas',
                'description' => 'Consolidado academico de calificaciones importadas por periodo.',
                'href' => '/notas',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'notas', 'label' => 'Registros', 'value' => $this->countTable('notas'), 'detail' => 'Filas de notas'],
                    ['key' => 'estudiantes', 'label' => 'Estudiantes', 'value' => $this->countDistinct('notas', 'identificacion'), 'detail' => 'Con nota'],
                    ['key' => 'materias', 'label' => 'Materias', 'value' => $this->countDistinct('notas', 'materia'), 'detail' => 'Reportadas'],
                    ['key' => 'periodos', 'label' => 'Periodos', 'value' => $this->countDistinct('notas', 'period_id'), 'detail' => 'Consolidado'],
                ],
            ],
            [
                'key' => 'cultura',
                'title' => 'Cultura',
                'description' => 'Gestion de publicaciones, eventos y noticias del area cultural.',
                'href' => '/culturas',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'publicaciones', 'label' => 'Publicaciones', 'value' => $this->countTable('culturas'), 'detail' => 'Totales'],
                    ['key' => 'publicadas', 'label' => 'Publicadas', 'value' => $this->countWhere('culturas', 'publicado', 1), 'detail' => 'Visibles'],
                    ['key' => 'eventos', 'label' => 'Eventos', 'value' => $this->countWhere('culturas', 'tipo', 'evento'), 'detail' => 'Registrados'],
                    ['key' => 'noticias', 'label' => 'Noticias', 'value' => $this->countWhere('culturas', 'tipo', 'noticia'), 'detail' => 'Publicadas'],
                ],
            ],
            [
                'key' => 'salud',
                'title' => 'Salud',
                'description' => 'Monitoreo de pacientes, atenciones y gestion clinica/enfermeria.',
                'href' => '/salud',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'pacientes', 'label' => 'Pacientes', 'value' => $this->countTable('pacientes'), 'detail' => 'Registrados'],
                    ['key' => 'atenciones', 'label' => 'Atenciones', 'value' => $this->countTable('salud_atenciones'), 'detail' => 'Realizadas'],
                    ['key' => 'medicamentos', 'label' => 'Medicamentos', 'value' => $this->countTable('enfermeria_medicamentos'), 'detail' => 'En inventario'],
                    ['key' => 'entregas', 'label' => 'Entregas', 'value' => $this->countTable('enfermeria_entregas'), 'detail' => 'Dispensaciones'],
                ],
            ],
            [
                'key' => 'deporte',
                'title' => 'Deporte',
                'description' => 'Control de ofertas deportivas y participacion de la comunidad universitaria.',
                'href' => '/deportes',
                'supports_chart' => false,
                'metrics' => [
                    ['key' => 'ofertas', 'label' => 'Ofertas', 'value' => $this->countTable('deportes'), 'detail' => 'Disciplinas/servicios'],
                    ['key' => 'participantes', 'label' => 'Participantes', 'value' => $this->countTable('deporte_participantes'), 'detail' => 'Activos'],
                    ['key' => 'carreras', 'label' => 'Carreras', 'value' => $this->countDistinct('deporte_participantes', 'carrera_id'), 'detail' => 'Con participacion'],
                    ['key' => 'activos', 'label' => 'Activos', 'value' => $this->countWhere('deportes', 'active', 1), 'detail' => 'Ofertas habilitadas'],
                ],
            ],
        ];

        $requestedModule = (string) request()->query('module', 'tutorias');
        $validModuleKeys = array_column($moduleSummaries, 'key');
        $defaultModule = in_array($requestedModule, $validModuleKeys, true) ? $requestedModule : 'tutorias';

        return Inertia::render('dashboard', [
            'totalTutores' => $totalTutores,
            'totalAsignaturas' => $totalAsignaturas,
            'totalGrupos' => $totalGrupos,
            'asistenciasPorFecha' => $asistenciasPorFecha,
            'moduleSummaries' => $moduleSummaries,
            'defaultModule' => $defaultModule,
        ]);
    }

    private function buildAsistenciasPorFecha()
    {
        if (!Schema::hasTable('asistencias') || !Schema::hasColumn('asistencias', 'fecha')) {
            return collect();
        }

        return Asistencia::select(
            DB::raw('DATE(fecha) as fecha'),
            DB::raw('COUNT(*) as total')
        )
            ->groupBy('fecha')
            ->orderBy('fecha', 'desc')
            ->take(7)
            ->get();
    }

    private function countTable(string $table): int
    {
        if (!Schema::hasTable($table)) {
            return 0;
        }

        return (int) DB::table($table)->count();
    }

    private function countDistinct(string $table, string $column): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return 0;
        }

        return (int) DB::table($table)
            ->whereNotNull($column)
            ->distinct()
            ->count($column);
    }

    private function countWhere(string $table, string $column, mixed $value): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return 0;
        }

        return (int) DB::table($table)
            ->where($column, $value)
            ->count();
    }
}
