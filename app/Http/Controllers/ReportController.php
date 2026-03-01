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
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

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

    // ✅ Evita whereIn([]) => 0 filas
    if ($windowIds->isEmpty()) {
        return Inertia::render('Informe/WindowsIndex', [
            'period'   => $period,
            'windows'  => $windows,
            'insights' => [
                'by_window' => [],
                'tree' => ['carreras' => []],
            ],
            'charts'   => [
                'porPrograma'    => [],
                'porTutor'       => [],
                'totalAprobado'  => 0,
                'totalReprobado' => 0,
                'sexo'           => ['FEMENINO' => 0, 'MASCULINO' => 0],
                'grupos'         => ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0],
            ],
            // ✅ NUEVO
            'charts_by_window' => [],
            'default_window_id' => null,
        ]);
    }

    /* =====================================================
       RESUMEN POR VENTANA (by_window)
    ===================================================== */

    $reportsBase = TutorReport::query()
        ->where('period_id', $period->id)
        ->whereIn('window_id', $windowIds);

    $byWindow = $windows->map(function ($w) use ($period, $reportsBase) {

        $asistQ = Asistencia::query()
            ->where('period_id', $period->id)
            ->where('report_window_id', $w->id);

        return [
            'window_id'          => (int) $w->id,
            'name'               => $w->name,
            'tutor_type'         => $w->tutor_type,
            'is_published'       => (bool) $w->is_published,
            'asistencias'        => (int) (clone $asistQ)->count(), // filas
            'estudiantes_unicos' => (int) (clone $asistQ)->distinct('identificacion')->count('identificacion'),
            'submitted'          => (int) (clone $reportsBase)->where('window_id', $w->id)->where('status', 'submitted')->count(),
            'pending'            => (int) (clone $reportsBase)->where('window_id', $w->id)->where('status', 'pending')->count(),
        ];
    })->values();

    /* ============================================================
       TREE (se mantiene combinado por todas las windows del periodo)
       - si quieres también “tree por window”, te lo hago igual.
    ============================================================ */

    $rowsPerWindow = DB::table('asistencias as a')
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
        ->groupBy(
            'a.report_window_id',
            'c.id', 'c.nombre', 'a.programa_academico',
            's.id', 's.nombre',
            'a.tutor_id',
            't.nombre', 't.apellido'
        )
        ->get();

    // únicos por carrera (combinado)
    $uniqueCarrera = DB::table('asistencias as a')
        ->where('a.period_id', $period->id)
        ->whereIn('a.report_window_id', $windowIds)
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->selectRaw("COALESCE(c.id, 0) as carrera_id, COUNT(DISTINCT a.identificacion) as unique_estudiantes_total")
        ->groupBy('c.id')
        ->get()
        ->keyBy('carrera_id');

    $uniqueAsignatura = DB::table('asistencias as a')
        ->where('a.period_id', $period->id)
        ->whereIn('a.report_window_id', $windowIds)
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            COUNT(DISTINCT a.identificacion) as unique_estudiantes_total
        ")
        ->groupBy('c.id', 's.id')
        ->get();

    $uniqueAsignaturaMap = [];
    foreach ($uniqueAsignatura as $u) {
        $uniqueAsignaturaMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id)] = (int)$u->unique_estudiantes_total;
    }

    $uniqueTutor = DB::table('asistencias as a')
        ->where('a.period_id', $period->id)
        ->whereIn('a.report_window_id', $windowIds)
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            a.tutor_id as tutor_id,
            COUNT(DISTINCT a.identificacion) as unique_estudiantes_total
        ")
        ->groupBy('c.id', 's.id', 'a.tutor_id')
        ->get();

    $uniqueTutorMap = [];
    foreach ($uniqueTutor as $u) {
        $uniqueTutorMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id) . ':' . ((int)$u->tutor_id)] = (int)$u->unique_estudiantes_total;
    }

    $addCell = function (&$node, $wid, $est, $asis) {
        $k = (string)$wid;
        if (!isset($node['per_window'][$k])) $node['per_window'][$k] = ['estudiantes' => 0, 'asistencias' => 0];
        $node['per_window'][$k]['estudiantes'] += (int)$est;
        $node['per_window'][$k]['asistencias'] += (int)$asis;
    };

    $tree = [];
    foreach ($rowsPerWindow as $r) {
        $wid = (int)$r->window_id;

        $cId = (int)$r->carrera_id;    $cName = (string)$r->carrera_name;
        $aId = (int)$r->asignatura_id; $aName = (string)$r->asignatura_name;
        $tId = (int)$r->tutor_id;      $tName = (string)$r->tutor_name;

        $est = (int)$r->estudiantes;
        $asis = (int)$r->asistencias;

        if (!isset($tree[$cId])) {
            $tree[$cId] = [
                'id' => $cId,
                'name' => $cName,
                'per_window' => [],
                'asignaturas' => [],
                'unique_estudiantes_total' => (int)($uniqueCarrera[$cId]->unique_estudiantes_total ?? 0),
            ];
        }
        $addCell($tree[$cId], $wid, $est, $asis);

        if (!isset($tree[$cId]['asignaturas'][$aId])) {
            $keyA = $cId . ':' . $aId;
            $tree[$cId]['asignaturas'][$aId] = [
                'id' => $aId,
                'name' => $aName,
                'per_window' => [],
                'tutores' => [],
                'unique_estudiantes_total' => (int)($uniqueAsignaturaMap[$keyA] ?? 0),
            ];
        }
        $addCell($tree[$cId]['asignaturas'][$aId], $wid, $est, $asis);

        if (!isset($tree[$cId]['asignaturas'][$aId]['tutores'][$tId])) {
            $keyT = $cId . ':' . $aId . ':' . $tId;
            $tree[$cId]['asignaturas'][$aId]['tutores'][$tId] = [
                'id' => $tId,
                'name' => $tName,
                'per_window' => [],
                'unique_estudiantes_total' => (int)($uniqueTutorMap[$keyT] ?? 0),
            ];
        }
        $addCell($tree[$cId]['asignaturas'][$aId]['tutores'][$tId], $wid, $est, $asis);
    }

    $sumNodeAsis = function ($node) {
        $sum = 0;
        foreach (($node['per_window'] ?? []) as $cell) $sum += (int)($cell['asistencias'] ?? 0);
        return $sum;
    };
    $nodeUnique = fn($node) => (int)($node['unique_estudiantes_total'] ?? 0);

    $carreras = array_values($tree);
    foreach ($carreras as &$c) {
        $asigs = array_values($c['asignaturas']);
        foreach ($asigs as &$a) {
            $a['tutores'] = array_values($a['tutores']);
            usort($a['tutores'], fn($x,$y) => ($nodeUnique($y) <=> $nodeUnique($x)) ?: ($sumNodeAsis($y) <=> $sumNodeAsis($x)));
        }
        unset($a);

        usort($asigs, fn($x,$y) => ($nodeUnique($y) <=> $nodeUnique($x)) ?: ($sumNodeAsis($y) <=> $sumNodeAsis($x)));
        $c['asignaturas'] = $asigs;
    }
    unset($c);

    usort($carreras, fn($x,$y) => ($nodeUnique($y) <=> $nodeUnique($x)) ?: ($sumNodeAsis($y) <=> $sumNodeAsis($x)));

    $insights = [
        'by_window' => $byWindow,
        'tree' => ['carreras' => $carreras],
    ];

    /* ============================================================
       ✅ CHARTS POR WINDOW (NO MEZCLAR CORTES)
       - Todo lo que está aquí adentro usa SOLO 1 window_id
       - Cuenta 1 vez por estudiante (AVG nota por estudiante)
       - Sexo/Grupos: 1 vez por estudiante (no por asistencias)
    ============================================================ */

    $approvalMin = 3.0;

    $buildChartsForWindow = function (int $wid) use ($period, $approvalMin) {

        $baseA = DB::table('asistencias as a')
            ->where('a.period_id', $period->id)
            ->where('a.report_window_id', $wid);

        // ============ NOTAS ============
        $notaExpr = "COALESCE(n.final, n.definitiva)";

        $baseStudentMateria = (clone $baseA)
            ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
            ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
            ->selectRaw("
                TRIM(a.identificacion) as identificacion,
                COALESCE(NULLIF(TRIM(a.programa_academico), ''), 'Sin programa') as programa_key,
                a.tutor_id as tutor_id,
                LOWER(TRIM(COALESCE(s.nombre, ''))) as materia_key
            ");

        $withNotasBase = DB::query()
            ->fromSub($baseStudentMateria, 'x')
            ->leftJoin('notas as n', function ($j) use ($period) {
                $j->on(DB::raw('TRIM(n.identificacion)'), '=', DB::raw('x.identificacion'))
                  ->on(DB::raw('LOWER(TRIM(n.materia))'), '=', DB::raw('x.materia_key'))
                  ->where('n.period_id', $period->id);
            });

        // 1 fila por estudiante por programa
        $studentPrograma = (clone $withNotasBase)
            ->selectRaw("x.programa_key as label, x.identificacion as identificacion, AVG($notaExpr) as avg_nota")
            ->groupBy('label', 'identificacion');

        $aprobExprP  = "SUM(CASE WHEN p.avg_nota >= $approvalMin THEN 1 ELSE 0 END)";
        $reprobExprP = "SUM(CASE WHEN p.avg_nota <  $approvalMin THEN 1 ELSE 0 END)";

        $porPrograma = DB::query()
            ->fromSub($studentPrograma, 'p')
            ->selectRaw("p.label as label, $aprobExprP as APROBADO, $reprobExprP as REPROBADO")
            ->groupBy('label')
            ->orderByRaw("($aprobExprP + $reprobExprP) DESC")
            ->get()
            ->map(fn($r) => [
                'label' => (string)$r->label,
                'APROBADO' => (int)$r->APROBADO,
                'REPROBADO' => (int)$r->REPROBADO,
                'total' => (int)$r->APROBADO + (int)$r->REPROBADO,
            ])
            ->values();

        // 1 fila por estudiante por tutor
        $studentTutor = (clone $withNotasBase)
            ->selectRaw("x.tutor_id as tutor_id, x.identificacion as identificacion, AVG($notaExpr) as avg_nota")
            ->groupBy('tutor_id', 'identificacion');

        $aprobExprT  = "SUM(CASE WHEN tt.avg_nota >= $approvalMin THEN 1 ELSE 0 END)";
        $reprobExprT = "SUM(CASE WHEN tt.avg_nota <  $approvalMin THEN 1 ELSE 0 END)";

        $porTutor = DB::query()
            ->fromSub($studentTutor, 'tt')
            ->leftJoin('tutors as t', 't.id', '=', 'tt.tutor_id')
            ->selectRaw("
                COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', tt.tutor_id)) as label,
                $aprobExprT as APROBADO,
                $reprobExprT as REPROBADO
            ")
            ->groupBy('label')
            ->orderByRaw("($aprobExprT + $reprobExprT) DESC")
            ->get()
            ->map(fn($r) => [
                'label' => (string)$r->label,
                'APROBADO' => (int)$r->APROBADO,
                'REPROBADO' => (int)$r->REPROBADO,
                'total' => (int)$r->APROBADO + (int)$r->REPROBADO,
            ])
            ->values();

        $totalAprobado  = (int)$porPrograma->sum('APROBADO');
        $totalReprobado = (int)$porPrograma->sum('REPROBADO');

        // ============ SEXO (POR ESTUDIANTE ÚNICO) ============
        $sexo = ['FEMENINO' => 0, 'MASCULINO' => 0];
        if (Schema::hasColumn('asistencias', 'sexo')) {
            $sexoPorEstudiante = (clone $baseA)
                ->selectRaw("
                    TRIM(a.identificacion) as identificacion,
                    MAX(
                        CASE
                            WHEN UPPER(TRIM(a.sexo)) IN ('F', 'FEMENINO') THEN 'FEMENINO'
                            WHEN UPPER(TRIM(a.sexo)) IN ('M', 'MASCULINO') THEN 'MASCULINO'
                            ELSE NULL
                        END
                    ) as sexo_norm
                ")
                ->groupBy('identificacion');

            $sexoRows = DB::query()
                ->fromSub($sexoPorEstudiante, 'sx')
                ->selectRaw("COALESCE(sx.sexo_norm, 'SIN_DATO') as label, COUNT(*) as total")
                ->groupBy('label')
                ->get();

            $sexo = [
                'FEMENINO'  => (int)($sexoRows->firstWhere('label', 'FEMENINO')->total ?? 0),
                'MASCULINO' => (int)($sexoRows->firstWhere('label', 'MASCULINO')->total ?? 0),
            ];
        }

        // ============ GRUPOS PRIORIZADOS (POR ESTUDIANTE ÚNICO) ============
        $grupos = ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0];
        if (Schema::hasColumn('asistencias', 'grupo_priorizado')) {
            $gpPorEstudiante = (clone $baseA)
                ->selectRaw("
                    TRIM(a.identificacion) as identificacion,
                    MAX(UPPER(COALESCE(NULLIF(TRIM(a.grupo_priorizado), ''), 'NINGUNO'))) as gp_norm
                ")
                ->groupBy('identificacion');

            $gpRows = DB::query()
                ->fromSub($gpPorEstudiante, 'gp')
                ->selectRaw("gp.gp_norm as label, COUNT(*) as total")
                ->groupBy('label')
                ->get();

            $grupos = [
                'NINGUNO'  => (int)($gpRows->firstWhere('label', 'NINGUNO')->total ?? 0),
                'AFRO'     => (int)($gpRows->firstWhere('label', 'AFRO')->total ?? 0),
                'INDIGENA' => (int)($gpRows->firstWhere('label', 'INDIGENA')->total ?? 0),
            ];

            $etnico = (int)(
                ($gpRows->firstWhere('label', 'ÉTNICO')->total ?? 0) +
                ($gpRows->firstWhere('label', 'ETNICO')->total ?? 0)
            );
            if ($etnico > 0 && $grupos['INDIGENA'] === 0) {
                $grupos['INDIGENA'] = $etnico;
            }
        }

        return [
            'porPrograma'    => $porPrograma,
            'porTutor'       => $porTutor,
            'totalAprobado'  => $totalAprobado,
            'totalReprobado' => $totalReprobado,
            'sexo'           => $sexo,
            'grupos'         => $grupos,
        ];
    };

    $chartsByWindow = [];
    foreach ($windowIds as $wid) {
        $chartsByWindow[(string)$wid] = $buildChartsForWindow((int)$wid);
    }

    $defaultWindowId = (int)($windowIds->last() ?? $windowIds->first());
    $charts = $chartsByWindow[(string)$defaultWindowId] ?? [
        'porPrograma'    => [],
        'porTutor'       => [],
        'totalAprobado'  => 0,
        'totalReprobado' => 0,
        'sexo'           => ['FEMENINO' => 0, 'MASCULINO' => 0],
        'grupos'         => ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0],
    ];

    return Inertia::render('Informe/WindowsIndex', [
        'period'   => $period,
        'windows'  => $windows,
        'insights' => $insights,

        // ✅ default (para que no se rompa)
        'charts'   => $charts,

        // ✅ NUEVO: charts por ventana
        'charts_by_window' => $chartsByWindow,
        'default_window_id' => $defaultWindowId,
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
     |  ASIGNACIÓN MASIVA DE ENTREGAS A TUTORES
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