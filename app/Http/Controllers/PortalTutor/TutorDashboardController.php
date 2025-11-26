<?php

namespace App\Http\Controllers\PortalTutor;

use App\Http\Controllers\Controller;
use App\Models\ReportPeriod;
use App\Models\Tutor;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TutorDashboardController extends Controller
{
    public function index()
    {
        // 1) ID del tutor autenticado con el guard 'tutor'
        $authTutorId = Auth::guard('tutor')->id();
        abort_unless($authTutorId, 403, 'Tutor no autenticado');

        // 2) Traer tutor con las relaciones que espera el frontend
        $tutor = Tutor::query()
            ->with([
                'carrera:id,nombre',
                'asignaturas:id,nombre', // agrega 'codigo' si lo usas
            ])
            ->select([
                'id','codigo','nombre','apellido','tipo_documento','documento',
                'lugar_expedicion','sexo','grupo_priorizado','sede',
                'carrera_id','correo','telefono','activo','ultimo_ingreso_at',
                // si tienes la columna en DB, se usará; si no, simplemente quedará null
                'tipo_resolucion',
            ])
            ->findOrFail($authTutorId);

        // 3) Payload limpio para la vista
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
            'carrera'          => $tutor->carrera ? [
                'id'     => $tutor->carrera->id,
                'nombre' => $tutor->carrera->nombre,
            ] : null,
            'asignaturas'      => $tutor->asignaturas->map(fn($a) => [
                'id'     => $a->id,
                'nombre' => $a->nombre,
            ])->values(),
            // si no existe la columna en DB, forzamos R1 por defecto
            'tipo_resolucion'  => $tutor->tipo_resolucion ?? 'R1',
        ];

        // 4) Periodos activos + ventanas publicadas para su tipo (R1/R2) + mi estado de reporte
        $tutorType = $payloadTutor['tipo_resolucion'] ?? 'R1';

        $periods = ReportPeriod::query()
            ->where('is_active', true)
            ->with(['windows' => function ($q) use ($tutorType, $tutor) {
                $q->where('is_published', true)
                  ->where('tutor_type', $tutorType)
                  ->orderBy('open_at')
                  ->with(['tutorReports' => function ($qr) use ($tutor) {
                      $qr->where('tutor_id', $tutor->id)
                         ->select(['id','tutor_id','window_id','status','submitted_at']);
                  }]);
            }])
            ->orderByDesc('id')
            ->get();

        // 5) Aplanar ventanas con mi estado (si existe)
        $windowsAssigned = [];
        foreach ($periods as $p) {
            foreach ($p->windows as $w) {
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
                    'is_published' => (bool)$w->is_published,
                    'period'       => [
                        'id'   => $p->id,
                        'code' => $p->code,
                        'name' => $p->name,
                    ],
                    'report' => $myReport ? [
                        'id'           => $myReport->id,
                        'status'       => $myReport->status, // pending|submitted|approved|rejected
                        'submitted_at' => $myReport->submitted_at,
                    ] : null,
                ];
            }
        }

        // 6) KPIs opcionales
        $stats = [
            'total_windows' => count($windowsAssigned),
            'pending'       => collect($windowsAssigned)->where(fn($w) => ($w['report']['status'] ?? 'pending') === 'pending')->count(),
            'submitted'     => collect($windowsAssigned)->where(fn($w) => ($w['report']['status'] ?? null) === 'submitted')->count(),
        ];

        // 7) Render
        return Inertia::render('Tutores/home', [
            'tutor'           => $payloadTutor,
            'periods'         => $periods->map->only(['id','code','name','starts_at','ends_at']),
            'windowsAssigned' => $windowsAssigned,
            'stats'           => $stats,
        ]);
    }
}
