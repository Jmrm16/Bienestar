<?php

namespace App\Http\Controllers\PortalTutor;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\ReportPeriod;
use App\Models\Tutor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

// ✅ si ya lo tienes / lo vas a crear
use App\Models\AsistenciaOcasional;

class TutorDashboardController extends Controller
{
    public function index()
    {
        /* -------------------------------------------------------
         | 1) Tutor autenticado
         ------------------------------------------------------- */
        $authTutorId = Auth::guard('tutor')->id();
        abort_unless($authTutorId, 403, 'Tutor no autenticado');

        /* -------------------------------------------------------
         | 2) Tutor con relaciones base
         ------------------------------------------------------- */
        $tutor = Tutor::query()
            ->with([
                'carrera:id,nombre',
                'asignaturas:id,nombre',
                'periodResolutions:id,period_id,tutor_id,tipo_resolucion',
            ])
            ->select([
                'id',
                'codigo',
                'nombre',
                'apellido',
                'tipo_documento',
                'documento',
                'lugar_expedicion',
                'sexo',
                'grupo_priorizado',
                'sede',
                'carrera_id',
                'correo',
                'telefono',
                'activo',
                'ultimo_ingreso_at',
                'tipo_resolucion',
            ])
            ->findOrFail($authTutorId);

        /* -------------------------------------------------------
         | 3) Payload limpio del tutor
         ------------------------------------------------------- */
        $payloadTutor = [
            'id'               => $tutor->id,
            'codigo'           => $tutor->codigo,
            'nombre'           => $tutor->nombre,
            'apellido'         => $tutor->apellido,
            'tipo_documento'   => $tutor->tipo_documento,
            'documento'        => $tutor->documento,
            'lugar_expedicion' => $tutor->lugar_expedicion,
            'sexo'             => $tutor->sexo,
            'grupo_priorizado' => $tutor->grupo_priorizado,
            'sede'             => $tutor->sede,
            'correo'           => $tutor->correo,
            'telefono'         => $tutor->telefono,
            'activo'           => (bool) $tutor->activo,
            'ultimo_ingreso_at'=> $tutor->ultimo_ingreso_at,
            'carrera_id'       => $tutor->carrera_id,
            'carrera'          => $tutor->carrera
                ? [
                    'id'     => $tutor->carrera->id,
                    'nombre' => $tutor->carrera->nombre,
                ]
                : null,
            'asignaturas'      => $tutor->asignaturas
                ->map(fn ($a) => [
                    'id'     => $a->id,
                    'nombre' => $a->nombre,
                ])
                ->values(),
        ];

        /* -------------------------------------------------------
         | 4) PERÍODOS + VENTANAS vigentes
         ------------------------------------------------------- */
        $today = Carbon::today();

        $periods = ReportPeriod::query()
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->with([
                'windows' => function ($q) use ($tutor) {
                    $q->where('is_published', true)
                      ->orderBy('open_at')
                      ->with([
                          'tutorReports' => function ($qr) use ($tutor) {
                              $qr->where('tutor_id', $tutor->id)
                                 ->select([
                                     'id',
                                     'tutor_id',
                                     'window_id',
                                     'status',
                                     'submitted_at',
                                 ]);
                          },
                      ]);
                },
            ])
            ->orderByDesc('id')
            ->get();

        $resolutionMap = $tutor->periodResolutions
            ->whereIn('period_id', $periods->pluck('id'))
            ->mapWithKeys(fn ($resolution) => [
                (int) $resolution->period_id => $resolution->tipo_resolucion,
            ])
            ->all();

        $windowIdsWithAttendancesByPeriod = Asistencia::query()
            ->where('tutor_id', $tutor->id)
            ->whereIn('period_id', $periods->pluck('id'))
            ->whereNotNull('report_window_id')
            ->select(['period_id', 'report_window_id'])
            ->distinct()
            ->get()
            ->groupBy('period_id')
            ->map(fn ($rows) => $rows->pluck('report_window_id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all())
            ->all();

        $windowIdsWithOcasionalesByPeriod = AsistenciaOcasional::query()
            ->where('tutor_id', $tutor->id)
            ->whereIn('period_id', $periods->pluck('id'))
            ->whereNotNull('report_window_id')
            ->select(['period_id', 'report_window_id'])
            ->distinct()
            ->get()
            ->groupBy('period_id')
            ->map(fn ($rows) => $rows->pluck('report_window_id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all())
            ->all();

        /* -------------------------------------------------------
         | 5) Aplanar ventanas asignadas
         ------------------------------------------------------- */
        $windowsAssigned = [];

        foreach ($periods as $p) {
            $periodResolution = $resolutionMap[(int) $p->id] ?? $tutor->resolutionForPeriod((int) $p->id);
            $windowIdsWithData = array_values(array_unique(array_merge(
                $windowIdsWithAttendancesByPeriod[(int) $p->id] ?? [],
                $windowIdsWithOcasionalesByPeriod[(int) $p->id] ?? []
            )));

            $windowsForTutor = $p->windows->filter(function ($window) use ($periodResolution, $windowIdsWithData) {
                return $window->tutorReports->isNotEmpty()
                    || in_array((int) $window->id, $windowIdsWithData, true)
                    || ($periodResolution !== null && (string) $window->tutor_type === $periodResolution);
            });

            foreach ($windowsForTutor as $w) {
                $myReport = optional($w->tutorReports->first());

                $windowsAssigned[] = [
                    'id'           => $w->id,
                    'name'         => $w->name,
                    'category'     => $w->category,
                    'instructions' => $w->instructions,
                    'open_at'      => $w->open_at,
                    'due_at'       => $w->due_at,
                    'close_at'     => $w->close_at,
                    'tutor_type'   => $w->tutor_type,
                    'is_published' => (bool) $w->is_published,
                    'period'       => [
                        'id'   => $p->id,
                        'code' => $p->code,
                        'name' => $p->name,
                    ],
                    'report'       => $myReport->id
                        ? [
                            'id'           => $myReport->id,
                            'status'       => $myReport->status,
                            'submitted_at' => $myReport->submitted_at,
                        ]
                        : null,
                ];
            }
        }

        /* -------------------------------------------------------
         | 6) Estadísticas
         ------------------------------------------------------- */
        $stats = [
            'total_windows' => count($windowsAssigned),
            'pending' => collect($windowsAssigned)
                ->where(fn ($w) => ($w['report']['status'] ?? 'pending') === 'pending')
                ->count(),
            'submitted' => collect($windowsAssigned)
                ->where(fn ($w) => ($w['report']['status'] ?? null) === 'submitted')
                ->count(),
        ];

        /* -------------------------------------------------------
         | 7) GRUPOS asignados vigentes
         ------------------------------------------------------- */
        $gruposAsignados = $tutor->grupos()
            ->whereHas('periodo', function ($q) use ($today) {
                $q->where('is_active', true)
                  ->whereDate('starts_at', '<=', $today)
                  ->whereDate('ends_at', '>=', $today);
            })
            ->with([
                'carrera:id,nombre',
                'asignatura:id,nombre',
                'periodo:id,code,starts_at,ends_at,is_active',
            ])
            ->get()
            ->map(function ($g) {
                return [
                    'id'         => $g->id,
                    'nombre'     => $g->nombre,
                    'codigo'     => $g->codigo,
                    'docente'    => $g->docente,
                    'periodo'    => [
                        'id'         => $g->periodo->id,
                        'code'       => $g->periodo->code,
                        'starts_at'  => $g->periodo->starts_at,
                        'ends_at'    => $g->periodo->ends_at,
                    ],
                    'carrera'    => $g->carrera?->only('nombre'),
                    'asignatura' => $g->asignatura?->only('nombre'),
                    'rol'        => $g->pivot->rol,
                ];
            })
            ->values();

        /* -------------------------------------------------------
         | ✅ 8) ASISTENCIAS OCASIONALES (para mostrar en "Mis grupos")
         |    - Las agrupamos por Asignatura + Grupo_texto
         |    - Usamos el periodo vigente (si hay)
         ------------------------------------------------------- */
        $activePeriodId = collect($windowsAssigned)->first()['period']['id']
            ?? collect($gruposAsignados)->first()['periodo']['id']
            ?? null;
        $activeWindowId = collect($windowsAssigned)->first()['id'] ?? null;

        $ocasionales = collect();

        if ($activePeriodId) {
            $ocasionales = AsistenciaOcasional::query()
                ->where('period_id', $activePeriodId)
                ->where('tutor_id', $tutor->id)
                // opcional: si quieres que el home muestre solo las del corte activo
                // ->when($activeWindowId, fn($q) => $q->where('report_window_id', $activeWindowId))
                ->selectRaw("
                    COALESCE(asignatura_texto,'Sin asignatura') as asignatura,
                    COALESCE(grupo_texto,'Sin grupo') as grupo,
                    COUNT(DISTINCT identificacion) as estudiantes,
                    COUNT(*) as asistencias
                ")
                ->groupBy('asignatura', 'grupo')
                ->orderByDesc('estudiantes')
                ->get()
                ->map(fn ($r) => [
                    'id' => sha1($r->asignatura.'|'.$r->grupo),
                    'asignatura' => (string) $r->asignatura,
                    'grupo' => (string) $r->grupo,
                    'estudiantes' => (int) $r->estudiantes,
                    'asistencias' => (int) $r->asistencias,
                ])
                ->values();
        }

        /* -------------------------------------------------------
         | 9) Render Inertia
         ------------------------------------------------------- */
        return Inertia::render('Tutores/home', [
            'tutor'           => $payloadTutor,
            'periods'         => $periods->map->only([
                'id',
                'code',
                'name',
                'starts_at',
                'ends_at',
            ]),
            'windowsAssigned' => $windowsAssigned,
            'stats'           => $stats,
            'grupos'          => $gruposAsignados,
            'ocasionales'     => $ocasionales, // ✅ NUEVO
        ]);
    }
}
