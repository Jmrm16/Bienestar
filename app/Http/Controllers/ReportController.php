<?php

namespace App\Http\Controllers;

use App\Models\ReportPeriod;
use App\Models\ReportWindow;
use App\Models\Tutor;
use App\Models\TutorReport;
use App\Models\Asistencia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /* =====================================================
     |  PERIODOS
     ===================================================== */

    public function periodsIndex()
    {
        $periods = ReportPeriod::withCount('windows')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Informe/PeriodsIndex', [
            'periods' => $periods
        ]);
    }

    public function periodsStore(Request $request)
    {
        $data = $request->validate([
            'code'      => 'required|string|max:20|unique:report_periods,code',
            'name'      => 'nullable|string|max:120',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'sometimes|boolean',
        ]);

        $data['is_active'] = (bool)($data['is_active'] ?? true);

        ReportPeriod::create($data);

        return back()->with('success', 'Periodo creado correctamente.');
    }

    public function periodsUpdate(Request $request, ReportPeriod $period)
    {
        $data = $request->validate([
            'code'      => 'required|string|max:20|unique:report_periods,code,' . $period->id,
            'name'      => 'nullable|string|max:120',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool)$data['is_active'];
        }

        $period->update($data);

        return back()->with('success', 'Periodo actualizado correctamente.');
    }

    public function periodsDestroy(ReportPeriod $period)
    {
        $period->delete();

        return back()->with('success', 'Periodo eliminado.');
    }

    /* =====================================================
     |  VENTANAS / ENTREGAS
     ===================================================== */

public function windowsIndex(ReportPeriod $period)
{
    $windows = $period->windows()
        ->orderBy('open_at')
        ->get(['id','period_id','name','tutor_type','open_at','due_at','close_at','instructions','is_published']);

    $windowIds = $windows->pluck('id')->values();

    // =========================
    // RESUMEN POR CORTE (por window)
    // =========================
    $reportsBase = TutorReport::query()
        ->where('period_id', $period->id)
        ->whereIn('window_id', $windowIds);

    $byWindow = $windows->map(function ($w) use ($period, $reportsBase) {

        $asistQ = Asistencia::query()
            ->where('period_id', $period->id)
            ->where('report_window_id', $w->id);

        $asistencias = (clone $asistQ)->count();

        $estudiantesUnicos = (clone $asistQ)
            ->distinct('identificacion')
            ->count('identificacion');

        $submitted = (clone $reportsBase)
            ->where('window_id', $w->id)
            ->where('status', 'submitted')
            ->count();

        $pending = (clone $reportsBase)
            ->where('window_id', $w->id)
            ->where('status', 'pending')
            ->count();

        return [
            'window_id'          => (int) $w->id,
            'name'               => $w->name,
            'tutor_type'         => $w->tutor_type,
            'is_published'       => (bool) $w->is_published,
            'asistencias'        => (int) $asistencias,
            'estudiantes_unicos' => (int) $estudiantesUnicos,
            'submitted'          => (int) $submitted,
            'pending'            => (int) $pending,
        ];
    })->values();

    // ============================================================
    // ✅ TREE: Carrera -> Asignatura -> Tutor (cada uno con per_window)
    // ============================================================
    // Query "grano fino": window + carrera + asignatura + tutor
$rows = DB::table('asistencias as a')
    ->where('a.period_id', $period->id)
    ->whereIn('a.report_window_id', $windowIds)
    ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
    ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
    ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
    ->leftJoin('tutors as t', 't.id', '=', 'a.tutor_id')
    ->selectRaw("
        a.report_window_id as window_id,

        COALESCE(c.id, 0) as carrera_id,
        COALESCE(c.nombre, a.programa_academico, 'Sin carrera') as carrera_name,

        COALESCE(s.id, 0) as asignatura_id,
        COALESCE(s.nombre, 'Sin asignatura') as asignatura_name,

        a.tutor_id as tutor_id,
        COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', a.tutor_id)) as tutor_name,

        COUNT(DISTINCT a.identificacion) as estudiantes,
        COUNT(*) as asistencias
    ")
    // ✅ GROUP BY por columnas reales (para ONLY_FULL_GROUP_BY)
    ->groupBy(
        'a.report_window_id',
        'c.id', 'c.nombre', 'a.programa_academico',
        's.id', 's.nombre',
        'a.tutor_id',
        't.nombre', 't.apellido'
    )
    ->get();


    // Helpers para acumular per_window
    $addCell = function (&$node, $wid, $est, $asis) {
        $k = (string) $wid;
        if (!isset($node['per_window'][$k])) {
            $node['per_window'][$k] = ['estudiantes' => 0, 'asistencias' => 0];
        }
        $node['per_window'][$k]['estudiantes'] += (int) $est;
        $node['per_window'][$k]['asistencias'] += (int) $asis;
    };

    $tree = []; // [carrera_id => carreraNode]

    foreach ($rows as $r) {
        $wid = (int) $r->window_id;

        $cId = (int) $r->carrera_id;
        $cName = (string) $r->carrera_name;

        $aId = (int) $r->asignatura_id;
        $aName = (string) $r->asignatura_name;

        $tId = (int) $r->tutor_id;
        $tName = (string) $r->tutor_name;

        $est = (int) $r->estudiantes;
        $asis = (int) $r->asistencias;

        // Carrera
        if (!isset($tree[$cId])) {
            $tree[$cId] = [
                'id' => $cId,
                'name' => $cName,
                'per_window' => [],
                'asignaturas' => [],
            ];
        }
        $addCell($tree[$cId], $wid, $est, $asis);

        // Asignatura (dentro de carrera)
        if (!isset($tree[$cId]['asignaturas'][$aId])) {
            $tree[$cId]['asignaturas'][$aId] = [
                'id' => $aId,
                'name' => $aName,
                'per_window' => [],
                'tutores' => [],
            ];
        }
        $addCell($tree[$cId]['asignaturas'][$aId], $wid, $est, $asis);

        // Tutor (dentro de asignatura)
        if (!isset($tree[$cId]['asignaturas'][$aId]['tutores'][$tId])) {
            $tree[$cId]['asignaturas'][$aId]['tutores'][$tId] = [
                'id' => $tId,
                'name' => $tName,
                'per_window' => [],
            ];
        }
        $addCell($tree[$cId]['asignaturas'][$aId]['tutores'][$tId], $wid, $est, $asis);
    }

    // Normalizar arrays (quitar keys) y ordenar por "Total Estudiantes" (sumados)
    $sumNodeEst = function ($node) {
        $sum = 0;
        foreach (($node['per_window'] ?? []) as $cell) $sum += (int) ($cell['estudiantes'] ?? 0);
        return $sum;
    };

    $carreras = array_values($tree);
    foreach ($carreras as &$c) {
        $asigs = array_values($c['asignaturas']);
        foreach ($asigs as &$a) {
            $a['tutores'] = array_values($a['tutores']);
            usort($a['tutores'], fn($x,$y) => $sumNodeEst($y) <=> $sumNodeEst($x));
        }
        unset($a);

        usort($asigs, fn($x,$y) => $sumNodeEst($y) <=> $sumNodeEst($x));
        $c['asignaturas'] = $asigs;
    }
    unset($c);

    usort($carreras, fn($x,$y) => $sumNodeEst($y) <=> $sumNodeEst($x));

    // (Opcional) Top N carreras para que no sea gigante:
    // $carreras = array_slice($carreras, 0, 30);

    $insights = [
        'by_window' => $byWindow,
        'tree' => [
            'carreras' => $carreras,
        ],
    ];

    return Inertia::render('Informe/WindowsIndex', [
        'period'   => $period,
        'windows'  => $windows,
        'insights' => $insights,
    ]);
}







    public function windowsStore(Request $request, ReportPeriod $period)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:120',
            'tutor_type'   => 'required|in:R1,R2',
            'open_at'      => 'required|date',
            'due_at'       => 'nullable|date|after_or_equal:open_at',
            'close_at'     => 'nullable|date|after_or_equal:due_at',
            'instructions' => 'nullable|string',
            'is_published' => 'sometimes|boolean',

            'category'          => 'nullable|string|max:50',
            'required_items'    => 'nullable|array',
            'required_items.*'  => 'string|max:120',
        ]);

        $data['period_id']    = $period->id;
        $data['is_published'] = (bool)($data['is_published'] ?? true);

        ReportWindow::create($data);

        return back()->with('success', 'Entrega creada correctamente.');
    }

    public function windowsUpdate(Request $request, ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        $data = $request->validate([
            'name'         => 'required|string|max:120',
            'tutor_type'   => 'required|in:R1,R2',
            'open_at'      => 'required|date',
            'due_at'       => 'nullable|date|after_or_equal:open_at',
            'close_at'     => 'nullable|date|after_or_equal:due_at',
            'instructions' => 'nullable|string',
            'is_published' => 'sometimes|boolean',

            'category'          => 'nullable|string|max:50',
            'required_items'    => 'nullable|array',
            'required_items.*'  => 'string|max:120',
        ]);

        if (array_key_exists('is_published', $data)) {
            $data['is_published'] = (bool)$data['is_published'];
        }

        $window->update($data);

        return back()->with('success', 'Entrega actualizada correctamente.');
    }

    public function windowsDestroy(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        $window->delete();

        return back()->with('success', 'Entrega eliminada.');
    }

    /* =====================================================
     |  ASIGNACIÓN MASIVA DE ENTREGAS A TUTORES (SIN tutor_assignments)
     ===================================================== */

    public function windowsAssignAll(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        DB::transaction(function () use ($window, $period) {

            $tutors = Tutor::where('tipo_resolucion', $window->tutor_type)->get();

            foreach ($tutors as $tutor) {
                TutorReport::firstOrCreate(
                    [
                        'tutor_id'  => $tutor->id,
                        'window_id' => $window->id,
                        'period_id' => $period->id,
                    ],
                    [
                        'status' => 'pending',
                    ]
                );
            }
        });

        return back()->with('success', 'Asignaciones creadas correctamente.');
    }
}
