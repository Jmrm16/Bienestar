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
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
        ->orderBy('id')
        ->get(['id','period_id','name','tutor_type','open_at','due_at','close_at','instructions','is_published']);

    $windowIds = $windows->pluck('id')->map(fn ($id) => (int) $id)->values();
    $orderedWindowIds = $windowIds->all();

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
                'totalEstudiantesUnicos' => 0,
                'totalEvaluados' => 0,
                'totalSinNota'   => 0,
                'sexo'           => ['FEMENINO' => 0, 'MASCULINO' => 0, 'SIN_DATO' => 0],
                'grupos'         => ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0, 'OTROS' => 0],
            ],
            'default_window_id' => null,
        ]);
    }

    // =====================================================
    // 1) BY WINDOW (ANTES: N+1). AHORA: 2 queries agregadas
    // =====================================================

    $asistAgg = DB::query()
        ->fromSub($this->buildIncrementalAsistenciasQuery($period->id, $orderedWindowIds), 'a')
        ->selectRaw("
            a.report_window_id as window_id,
            COUNT(*) as asistencias,
            COUNT(DISTINCT TRIM(a.identificacion)) as estudiantes_unicos
        ")
        ->groupBy('a.report_window_id')
        ->get()
        ->keyBy('window_id');

    $repAgg = DB::table('tutor_reports as tr')
        ->where('tr.period_id', $period->id)
        ->whereIn('tr.window_id', $windowIds)
        ->selectRaw("
            tr.window_id as window_id,
            SUM(CASE WHEN tr.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN tr.status = 'pending' THEN 1 ELSE 0 END) as pending
        ")
        ->groupBy('tr.window_id')
        ->get()
        ->keyBy('window_id');

    $byWindow = $windows->map(function ($w) use ($asistAgg, $repAgg) {
        $a = $asistAgg->get($w->id);
        $r = $repAgg->get($w->id);

        return [
            'window_id'          => (int) $w->id,
            'name'               => $w->name,
            'tutor_type'         => $w->tutor_type,
            'is_published'       => (bool) $w->is_published,
            'asistencias'        => (int) ($a->asistencias ?? 0),
            'estudiantes_unicos' => (int) ($a->estudiantes_unicos ?? 0),
            'submitted'          => (int) ($r->submitted ?? 0),
            'pending'            => (int) ($r->pending ?? 0),
        ];
    })->values();

    // =====================================================
    // 2) TREE (cacheado) - MISMA estructura que ya usas
    // =====================================================

    $cacheKeyTree = "rep_tree_v3_period_{$period->id}_" . md5($windowIds->implode(','));

    $treeCarreras = Cache::remember(
        $cacheKeyTree,
        now()->addMinutes(10),
        fn() => $this->buildTreeForWindowIds($period->id, $orderedWindowIds)
    );

    $byType = [];
    foreach (['R1', 'R2'] as $tutorType) {
        $typeWindowIds = $windows
            ->filter(fn($w) => (string) $w->tutor_type === $tutorType)
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $cacheKeyType = "rep_tree_v3_period_{$period->id}_{$tutorType}_" . md5(implode(',', $typeWindowIds));

        $treeByType = Cache::remember(
            $cacheKeyType,
            now()->addMinutes(10),
            fn() => $this->buildTreeForWindowIds($period->id, $typeWindowIds)
        );

        $byType[$tutorType] = [
            'by_window' => $byWindow
                ->filter(fn($row) => (string)($row['tutor_type'] ?? '') === $tutorType)
                ->values()
                ->all(),
            'tree' => ['carreras' => $treeByType],
        ];
    }

    $insights = [
        'by_window' => $byWindow,
        'tree' => ['carreras' => $treeCarreras],
        'by_type' => $byType,
    ];

    $defaultWindowId = (int)($windowIds->last() ?? $windowIds->first());
    $charts = $this->emptyCharts();
    if ($defaultWindowId) {
        try {
            $charts = $this->buildChartsForWindow($period, $defaultWindowId);
        } catch (\Throwable $e) {
            Log::error('windowsIndex default charts failed', [
                'period_id' => (int) $period->id,
                'window_id' => (int) $defaultWindowId,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }
    }

    return Inertia::render('Informe/WindowsIndex', [
        'period'   => $period,
        'windows'  => $windows,
        'insights' => $insights,
        'charts'   => $charts,
        'default_window_id' => $defaultWindowId,
    ]);
}

    public function windowCharts(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        try {
            return response()->json(
                $this->buildChartsForWindow($period, (int) $window->id)
            );
        } catch (\Throwable $e) {
            Log::error('windowCharts failed', [
                'period_id' => (int) $period->id,
                'window_id' => (int) $window->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json($this->emptyCharts(), 200);
        }
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
    public function exportChartsExcel(ReportPeriod $period)
{
    // 🔁 Reusar la lógica de windowsIndex pero solo para armar charts_by_window
    $windows = $period->windows()
        ->orderBy('open_at')
        ->get(['id','period_id','name','tutor_type','open_at','due_at','close_at','instructions','is_published']);

    $windowIds = $windows->pluck('id')->values();

    // Si no hay ventanas, exporta un excel vacío con mensaje
    if ($windowIds->isEmpty()) {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Resumen');
        $sheet->setCellValue('A1', 'No hay ventanas para este período.');
        $writer = new Xlsx($spreadsheet);

        $filename = "Reporte_Charts_{$period->code}_SIN_VENTANAS.xlsx";
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // ----------- construir charts_by_window -----------
    $chartsByWindow = [];
    foreach ($windowIds as $wid) {
        try {
            $chartsByWindow[(string)$wid] = $this->buildChartsForWindow($period, (int) $wid);
        } catch (\Throwable $e) {
            Log::error('exportChartsExcel window failed', [
                'period_id' => (int) $period->id,
                'window_id' => (int) $wid,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            $chartsByWindow[(string)$wid] = $this->emptyCharts();
        }
    }

    // ----------- EXCEL -----------
    $spreadsheet = new Spreadsheet();
    $spreadsheet->getProperties()
        ->setCreator('Sistema Bienestar')
        ->setTitle('Reporte de Charts')
        ->setDescription('Export de tablas y gráficos por ventana');

    // Hoja Resumen
    $resumen = $spreadsheet->getActiveSheet();
    $resumen->setTitle('Resumen');

    $resumen->fromArray([
        ['Ventana ID', 'Ventana', 'Aprobados', 'Reprobados'],
    ], null, 'A1');

    $row = 2;
    foreach ($windows as $w) {
        $ch = $chartsByWindow[(string)$w->id] ?? null;
        $resumen->setCellValue("A{$row}", (int)$w->id);
        $resumen->setCellValue("B{$row}", (string)$w->name);
        $resumen->setCellValue("C{$row}", (int)($ch['totalAprobado'] ?? 0));
        $resumen->setCellValue("D{$row}", (int)($ch['totalReprobado'] ?? 0));
        $row++;
    }

    // Crear una hoja por ventana con tablas + gráficos
    foreach ($windows as $w) {
        $wid = (string)$w->id;
        $ch = $chartsByWindow[$wid] ?? ['porPrograma'=>[], 'porTutor'=>[]];

        $sheet = new Worksheet($spreadsheet, $this->safeSheetName($w->name));
        $spreadsheet->addSheet($sheet);

        $sheet->setCellValue('A1', "Ventana: {$w->name}");
        $sheet->setCellValue('A2', "Tutor type: {$w->tutor_type}");

        // ---------- Por Programa ----------
        $sheet->setCellValue('A4', 'Por Programa');
        $sheet->fromArray([['Programa', 'APROBADO', 'REPROBADO']], null, 'A5');

        $startRow = 6;
        foreach (($ch['porPrograma'] ?? []) as $i => $r) {
            $rr = $startRow + $i;
            $sheet->setCellValue("A{$rr}", $r['label']);
            $sheet->setCellValue("B{$rr}", (int)$r['APROBADO']);
            $sheet->setCellValue("C{$rr}", (int)$r['REPROBADO']);
        }

        $endRow = max($startRow, $startRow + count($ch['porPrograma'] ?? []) - 1);

        // Chart Programa
        if ($endRow >= $startRow) {
            $this->addBarChart(
                $sheet,
                'Programa Aprobado/Reprobado',
                "A5:A{$endRow}",
                ["B5:B{$endRow}", "C5:C{$endRow}"],
                ['APROBADO', 'REPROBADO'],
                'E5',
                'N20'
            );
        }

        // ---------- Por Tutor ----------
        $baseTutorRow = $endRow + 4;
        $sheet->setCellValue("A{$baseTutorRow}", 'Por Tutor');
        $sheet->fromArray([['Tutor', 'APROBADO', 'REPROBADO']], null, "A" . ($baseTutorRow + 1));

        $tStart = $baseTutorRow + 2;
        foreach (($ch['porTutor'] ?? []) as $i => $r) {
            $rr = $tStart + $i;
            $sheet->setCellValue("A{$rr}", $r['label']);
            $sheet->setCellValue("B{$rr}", (int)$r['APROBADO']);
            $sheet->setCellValue("C{$rr}", (int)$r['REPROBADO']);
        }

        $tEnd = max($tStart, $tStart + count($ch['porTutor'] ?? []) - 1);

        if ($tEnd >= $tStart) {
            $this->addBarChart(
                $sheet,
                'Tutor Aprobado/Reprobado',
                "A" . ($baseTutorRow + 1) . ":A{$tEnd}",
                ["B" . ($baseTutorRow + 1) . ":B{$tEnd}", "C" . ($baseTutorRow + 1) . ":C{$tEnd}"],
                ['APROBADO', 'REPROBADO'],
                'E' . ($baseTutorRow + 1),
                'N' . ($baseTutorRow + 16)
            );
        }

        // Ajustes visuales básicos
        foreach (['A','B','C','D','E','F','G','H','I','J','K','L','M','N'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    // Elimina la hoja “Worksheet” por defecto si quedó vacía extra
    // (En este caso usamos "Resumen" como activa; ok)

    $writer = new Xlsx($spreadsheet);

    // Importante: para que se exporten gráficos en PhpSpreadsheet
    $writer->setIncludeCharts(true);

    $filename = "Reporte_Charts_{$period->code}.xlsx";

    return response()->streamDownload(function () use ($writer) {
        $writer->save('php://output');
    }, $filename);
}

public function exportChartsPdf(Request $request, ReportPeriod $period)
{
    $windows = $period->windows()
        ->orderBy('open_at')
        ->orderBy('id')
        ->get(['id', 'period_id', 'name', 'tutor_type', 'open_at', 'due_at', 'close_at', 'instructions', 'is_published']);

    $r1WindowsAll = $windows
        ->filter(fn ($w) => strtoupper((string)($w->tutor_type ?? '')) === 'R1')
        ->values();
    $r2WindowsAll = $windows
        ->filter(fn ($w) => strtoupper((string)($w->tutor_type ?? '')) === 'R2')
        ->values();

    // El esquema academico del modulo trabaja con 3 cortes.
    // Si existen mas entregas por tipo, se ignoran en el PDF y se avisa en la vista.
    $totalCuts = 3;
    $r1Windows = $r1WindowsAll->take($totalCuts)->values();
    $r2Windows = $r2WindowsAll->take($totalCuts)->values();
    $selectedWindowIds = $r1Windows
        ->concat($r2Windows)
        ->pluck('id')
        ->map(fn ($id) => (int)$id)
        ->unique()
        ->values();

    $chartsByWindow = [];
    foreach ($selectedWindowIds as $wid) {
        try {
            $chartsByWindow[(string)$wid] = $this->buildChartsForWindow($period, (int)$wid);
        } catch (\Throwable $e) {
            Log::error('exportChartsPdf window failed', [
                'period_id' => (int)$period->id,
                'window_id' => (int)$wid,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $chartsByWindow[(string)$wid] = $this->emptyCharts();
        }
    }

    $buildWindowPayload = function (?ReportWindow $window) use ($chartsByWindow): ?array {
        if (!$window) {
            return null;
        }

        $charts = $chartsByWindow[(string)$window->id] ?? $this->emptyCharts();

        return [
            'window' => [
                'id' => (int)$window->id,
                'name' => (string)$window->name,
                'tutor_type' => (string)$window->tutor_type,
                'open_at' => (string)($window->open_at ?? ''),
                'due_at' => (string)($window->due_at ?? ''),
                'close_at' => (string)($window->close_at ?? ''),
                'is_published' => (bool)$window->is_published,
            ],
            'charts' => $charts,
            'aprobado' => (int)($charts['totalAprobado'] ?? 0),
            'reprobado' => (int)($charts['totalReprobado'] ?? 0),
            'sin_nota' => (int)($charts['totalSinNota'] ?? 0),
            'evaluados' => (int)($charts['totalEvaluados'] ?? 0),
            'estudiantes_unicos' => (int)($charts['totalEstudiantesUnicos'] ?? 0),
        ];
    };

    $cutBundles = collect();
    for ($i = 0; $i < $totalCuts; $i++) {
        $r1 = $buildWindowPayload($r1Windows->get($i));
        $r2 = $buildWindowPayload($r2Windows->get($i));
        $r1Safe = is_array($r1) ? $r1 : [];
        $r2Safe = is_array($r2) ? $r2 : [];

        $cutBundles->push([
            'cut_number' => $i + 1,
            'r1' => $r1,
            'r2' => $r2,
            'totals' => [
                'aprobado' => (int)(($r1Safe['aprobado'] ?? 0) + ($r2Safe['aprobado'] ?? 0)),
                'reprobado' => (int)(($r1Safe['reprobado'] ?? 0) + ($r2Safe['reprobado'] ?? 0)),
                'sin_nota' => (int)(($r1Safe['sin_nota'] ?? 0) + ($r2Safe['sin_nota'] ?? 0)),
                'evaluados' => (int)(($r1Safe['evaluados'] ?? 0) + ($r2Safe['evaluados'] ?? 0)),
                'estudiantes_unicos' => (int)(($r1Safe['estudiantes_unicos'] ?? 0) + ($r2Safe['estudiantes_unicos'] ?? 0)),
            ],
        ]);
    }

    $summaryRows = $cutBundles->map(function (array $bundle) {
        $r1 = is_array($bundle['r1'] ?? null) ? $bundle['r1'] : [];
        $r2 = is_array($bundle['r2'] ?? null) ? $bundle['r2'] : [];
        $r1Window = is_array($r1['window'] ?? null) ? $r1['window'] : [];
        $r2Window = is_array($r2['window'] ?? null) ? $r2['window'] : [];

        return [
            'cut_number' => (int)$bundle['cut_number'],
            'r1_name' => (string)($r1Window['name'] ?? 'Sin entrega'),
            'r1_evaluados' => (int)($r1['evaluados'] ?? 0),
            'r1_aprobado' => (int)($r1['aprobado'] ?? 0),
            'r2_name' => (string)($r2Window['name'] ?? 'Sin entrega'),
            'r2_evaluados' => (int)($r2['evaluados'] ?? 0),
            'r2_aprobado' => (int)($r2['aprobado'] ?? 0),
            'total_evaluados' => (int)($bundle['totals']['evaluados'] ?? 0),
        ];
    })->values();

    return response()->view('reports.period_charts_pdf', [
        'period' => $period,
        'windows' => $windows,
        'cutBundles' => $cutBundles,
        'summaryRows' => $summaryRows,
        'totalCuts' => $totalCuts,
        'windowsCountR1' => $r1Windows->count(),
        'windowsCountR2' => $r2Windows->count(),
        'windowsCountR1Total' => $r1WindowsAll->count(),
        'windowsCountR2Total' => $r2WindowsAll->count(),
        'generatedAt' => now()->format('Y-m-d H:i:s'),
        'autoPrint' => $request->boolean('autoprint', true),
    ]);
}

private function buildTreeForWindowIds(int $periodId, array $orderedWindowIds): array
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));
    if ($orderedWindowIds === []) {
        return [];
    }

    $baseAsistencias = fn() => DB::query()->fromSub(
        $this->buildIncrementalAsistenciasQuery($periodId, $orderedWindowIds),
        'a'
    );

    $rowsPerWindow = $baseAsistencias()
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

            COUNT(DISTINCT TRIM(a.identificacion)) as estudiantes,
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

    $uniqueCarrera = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->selectRaw("COALESCE(c.id, 0) as carrera_id, COUNT(DISTINCT TRIM(a.identificacion)) as unique_estudiantes_total")
        ->groupBy('c.id')
        ->get()
        ->keyBy('carrera_id');

    $uniqueAsignatura = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            COUNT(DISTINCT TRIM(a.identificacion)) as unique_estudiantes_total
        ")
        ->groupBy('c.id', 's.id')
        ->get();

    $uniqueAsignaturaMap = [];
    foreach ($uniqueAsignatura as $u) {
        $uniqueAsignaturaMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id)] = (int)$u->unique_estudiantes_total;
    }

    $uniqueTutor = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            a.tutor_id as tutor_id,
            COUNT(DISTINCT TRIM(a.identificacion)) as unique_estudiantes_total
        ")
        ->groupBy('c.id', 's.id', 'a.tutor_id')
        ->get();

    $uniqueTutorMap = [];
    foreach ($uniqueTutor as $u) {
        $uniqueTutorMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id) . ':' . ((int)$u->tutor_id)] = (int)$u->unique_estudiantes_total;
    }

    $uniqueAsisExpr = "CONCAT(COALESCE(a.grupo_id,0),'|',COALESCE(a.tutor_id,0),'|',TRIM(a.identificacion),'|',a.fecha)";

    $uniqueAsisCarrera = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COUNT(DISTINCT {$uniqueAsisExpr}) as unique_asistencias_total
        ")
        ->groupBy('c.id')
        ->get()
        ->keyBy('carrera_id');

    $uniqueAsisAsignatura = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            COUNT(DISTINCT {$uniqueAsisExpr}) as unique_asistencias_total
        ")
        ->groupBy('c.id', 's.id')
        ->get();

    $uniqueAsisAsignaturaMap = [];
    foreach ($uniqueAsisAsignatura as $u) {
        $uniqueAsisAsignaturaMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id)] = (int)$u->unique_asistencias_total;
    }

    $uniqueAsisTutor = $baseAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            a.tutor_id as tutor_id,
            COUNT(DISTINCT {$uniqueAsisExpr}) as unique_asistencias_total
        ")
        ->groupBy('c.id', 's.id', 'a.tutor_id')
        ->get();

    $uniqueAsisTutorMap = [];
    foreach ($uniqueAsisTutor as $u) {
        $uniqueAsisTutorMap[((int)$u->carrera_id) . ':' . ((int)$u->asignatura_id) . ':' . ((int)$u->tutor_id)] = (int)$u->unique_asistencias_total;
    }

    $addCell = function (&$node, $wid, $est, $asis) {
        $k = (string)$wid;
        if (!isset($node['per_window'][$k])) {
            $node['per_window'][$k] = ['estudiantes' => 0, 'asistencias' => 0];
        }
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
                'unique_asistencias_total' => (int)($uniqueAsisCarrera[$cId]->unique_asistencias_total ?? 0),
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
                'unique_asistencias_total' => (int)($uniqueAsisAsignaturaMap[$keyA] ?? 0),
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
                'unique_asistencias_total' => (int)($uniqueAsisTutorMap[$keyT] ?? 0),
            ];
        }
        $addCell($tree[$cId]['asignaturas'][$aId]['tutores'][$tId], $wid, $est, $asis);
    }

    $sumNodeAsis = function ($node) {
        if (array_key_exists('unique_asistencias_total', $node)) {
            return (int)($node['unique_asistencias_total'] ?? 0);
        }

        $sum = 0;
        foreach (($node['per_window'] ?? []) as $cell) {
            $sum += (int)($cell['asistencias'] ?? 0);
        }
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

    return $carreras;
}

private function buildWindowOrderCaseSql(string $column, array $orderedWindowIds): string
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));

    if ($orderedWindowIds === []) {
        return '(0)';
    }

    $chunks = [];
    foreach ($orderedWindowIds as $index => $wid) {
        $rank = $index + 1;
        $chunks[] = "WHEN {$column} = {$wid} THEN {$rank}";
    }

    $fallback = count($orderedWindowIds) + 1000;
    return "(CASE " . implode(' ', $chunks) . " ELSE {$fallback} END)";
}

private function buildIncrementalAsistenciasQuery(int $periodId, array $orderedWindowIds)
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));

    $base = DB::table('asistencias as a')
        ->where('a.period_id', $periodId);

    if ($orderedWindowIds === []) {
        return $base->whereRaw('1 = 0');
    }

    $base->whereIn('a.report_window_id', $orderedWindowIds);

    if (count($orderedWindowIds) === 1) {
        return $base;
    }

    $prevOrder = $this->buildWindowOrderCaseSql('prev.report_window_id', $orderedWindowIds);
    $currOrder = $this->buildWindowOrderCaseSql('a.report_window_id', $orderedWindowIds);

    return $base->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrder, $currOrder) {
        $q->selectRaw('1')
            ->from('asistencias as prev')
            ->whereColumn('prev.period_id', 'a.period_id')
            ->whereIn('prev.report_window_id', $orderedWindowIds)
            ->whereRaw("{$prevOrder} < {$currOrder}")
            ->whereRaw('COALESCE(prev.tutor_id, 0) = COALESCE(a.tutor_id, 0)')
            ->whereRaw('COALESCE(prev.grupo_id, 0) = COALESCE(a.grupo_id, 0)')
            ->whereRaw('TRIM(prev.identificacion) = TRIM(a.identificacion)')
            ->whereRaw('DATE(prev.fecha) = DATE(a.fecha)');
    });
}

private function emptyCharts(): array
{
    return [
        'porPrograma'    => [],
        'porTutor'       => [],
        'totalAprobado'  => 0,
        'totalReprobado' => 0,
        'totalEstudiantesUnicos' => 0,
        'totalEvaluados' => 0,
        'totalSinNota'   => 0,
        'sexo'           => ['FEMENINO' => 0, 'MASCULINO' => 0, 'SIN_DATO' => 0],
        'grupos'         => ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0, 'OTROS' => 0],
    ];
}

private function buildChartsForWindow(ReportPeriod $period, int $windowId, float $approvalMin = 3.0): array
{
    $orderedWindowIds = DB::table('report_windows')
        ->where('period_id', $period->id)
        ->orderBy('open_at')
        ->orderBy('id')
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values();

    $windowPosition = $orderedWindowIds->search($windowId);
    $idsToEvaluate = $windowPosition === false
        ? [$windowId]
        : $orderedWindowIds->take($windowPosition + 1)->all();

    $cacheKeyHash = md5(implode(',', $idsToEvaluate));

    return Cache::remember(
        "rep_window_chart_v6_period_{$period->id}_window_{$windowId}_{$cacheKeyHash}",
        now()->addMinutes(10),
        function () use ($period, $windowId, $approvalMin, $idsToEvaluate) {
            $baseA = DB::query()
                ->fromSub($this->buildIncrementalAsistenciasQuery($period->id, $idsToEvaluate), 'a')
                ->where('a.report_window_id', $windowId);

            // ✅ InfinityFree: evita JOIN masivo asistencias<->notas (MAX_JOIN_SIZE).
            //    Se calcula por etapas y en memoria.
            $studentRows = (clone $baseA)
                ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
                ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
                ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
                ->selectRaw("
                    TRIM(a.identificacion) as identificacion,
                    TRIM(COALESCE(a.codigo_estudiantil, '')) as codigo_key,
                    TRIM(COALESCE(a.nombres_del_estudiante, '')) as nombres_key,
                    TRIM(COALESCE(a.apellidos_del_estudiante, '')) as apellidos_key,
                    COALESCE(NULLIF(TRIM(c.nombre), ''), NULLIF(TRIM(a.programa_academico), ''), 'Sin programa') as programa_key,
                    a.tutor_id as tutor_id,
                    LOWER(TRIM(COALESCE(s.nombre, ''))) as materia_key
                ")
                ->groupBy(
                    'a.identificacion',
                    'a.codigo_estudiantil',
                    'a.nombres_del_estudiante',
                    'a.apellidos_del_estudiante',
                    'c.nombre',
                    'a.programa_academico',
                    'a.tutor_id',
                    's.nombre'
                )
                ->get();

            $notaRows = DB::table('notas')
                ->where('period_id', $period->id)
                ->selectRaw("
                    TRIM(identificacion) as identificacion,
                    TRIM(COALESCE(codigo, '')) as codigo_key,
                    TRIM(COALESCE(nombres, '')) as nombres_key,
                    TRIM(COALESCE(apellidos, '')) as apellidos_key,
                    COALESCE(NULLIF(TRIM(programa), ''), NULLIF(TRIM(ide_programa), '')) as programa_key,
                    LOWER(TRIM(materia)) as materia_key,
                    AVG(COALESCE(final, definitiva)) as avg_nota
                ")
                ->groupBy('identificacion', 'codigo', 'nombres', 'apellidos', 'programa', 'ide_programa', 'materia')
                ->get();

            $notasByStudentMateria = [];
            $notasByStudentProgramMateria = [];
            $notasAnyByStudent = [];
            $notasByStudentProgramAny = [];
            foreach ($notaRows as $n) {
                $studentKeys = $this->buildStudentMatchKeys(
                    $n->identificacion ?? '',
                    $n->codigo_key ?? '',
                    $n->nombres_key ?? '',
                    $n->apellidos_key ?? ''
                );
                $materia = $this->normalizeChartText($n->materia_key ?? '');
                $materiaVariants = $this->subjectKeyVariants($materia);
                $programaNota = $this->normalizeChartText($n->programa_key ?? '');
                $avg = $n->avg_nota;

                if ($studentKeys === [] || $avg === null || $avg === '') {
                    continue;
                }

                $notaFloat = (float)$avg;
                foreach ($studentKeys as $studentKey) {
                    $notasAnyByStudent[$studentKey][] = $notaFloat;
                    if ($programaNota !== '') {
                        $notasByStudentProgramAny[$studentKey][$programaNota][] = $notaFloat;
                    }

                    foreach ($materiaVariants as $materiaVariant) {
                        $notasByStudentMateria[$studentKey][$materiaVariant][] = $notaFloat;

                        if ($programaNota !== '') {
                            $notasByStudentProgramMateria[$studentKey][$programaNota][$materiaVariant][] = $notaFloat;
                        }
                    }
                }
            }

            $dedupeNotas = function (array $values): array {
                if ($values === []) {
                    return [];
                }

                $dedup = [];
                foreach ($values as $nota) {
                    $n = (float)$nota;
                    $dedup[number_format($n, 6, '.', '')] = $n;
                }

                return array_values($dedup);
            };

            $pickSingleNota = function (array $values) use ($dedupeNotas): ?float {
                $unique = $dedupeNotas($values);
                if ($unique === []) {
                    return null;
                }

                return (float)(array_sum($unique) / count($unique));
            };

            $programStudentNotas = [];
            $tutorStudentNotas = [];
            $studentsByProgram = [];
            $studentsByTutor = [];
            $studentsAll = [];
            $studentNotasOverall = [];
            $studentIdentityById = [];
            $studentProgramsById = [];

            foreach ($studentRows as $r) {
                $ident = trim((string)($r->identificacion ?? ''));
                $codigo = trim((string)($r->codigo_key ?? ''));
                $nombres = trim((string)($r->nombres_key ?? ''));
                $apellidos = trim((string)($r->apellidos_key ?? ''));
                $programa = preg_replace('/\s+/', ' ', trim((string)($r->programa_key ?? 'Sin programa')));
                $programa = $programa !== '' ? $programa : 'Sin programa';
                $programaMatch = $this->normalizeChartText($programa);
                $materia = $this->normalizeChartText($r->materia_key ?? '');
                $materiaVariants = $this->subjectKeyVariants($materia);
                $tutorId = (int)($r->tutor_id ?? 0);
                $studentKeys = $this->buildStudentMatchKeys($ident, $codigo, $nombres, $apellidos);

                if ($ident === '' || $studentKeys === []) {
                    continue;
                }

                $studentsAll[$ident] = true;
                $studentsByProgram[$programa][$ident] = true;
                $studentsByTutor[$tutorId][$ident] = true;

                if ($programaMatch !== '') {
                    $studentProgramsById[$ident][$programaMatch] = true;
                }

                if (!isset($studentIdentityById[$ident])) {
                    $studentIdentityById[$ident] = [
                        'identificacion' => $ident,
                        'codigo' => $codigo,
                        'nombres' => $nombres,
                        'apellidos' => $apellidos,
                    ];
                }

                if ($materiaVariants === []) {
                    continue;
                }

                $candidateNotas = [];
                if ($programaMatch !== '') {
                    foreach ($studentKeys as $studentKey) {
                        $byProgram = $notasByStudentProgramMateria[$studentKey][$programaMatch] ?? [];
                        if (!is_array($byProgram) || $byProgram === []) {
                            continue;
                        }

                        foreach ($materiaVariants as $materiaVariant) {
                            $vals = $byProgram[$materiaVariant] ?? [];
                            if (!is_array($vals) || $vals === []) {
                                continue;
                            }

                            $candidateNotas = array_merge($candidateNotas, $vals);
                        }
                    }
                }

                if ($candidateNotas === []) {
                    foreach ($studentKeys as $studentKey) {
                        $byMateria = $notasByStudentMateria[$studentKey] ?? [];
                        if (!is_array($byMateria) || $byMateria === []) {
                            continue;
                        }

                        foreach ($materiaVariants as $materiaVariant) {
                            $vals = $byMateria[$materiaVariant] ?? [];
                            if (!is_array($vals) || $vals === []) {
                                continue;
                            }

                            $candidateNotas = array_merge($candidateNotas, $vals);
                        }
                    }
                }

                $nota = $pickSingleNota($candidateNotas);
                if ($nota === null) {
                    continue;
                }

                $programStudentNotas[$programa][$ident][] = $nota;
                $tutorStudentNotas[$tutorId][$ident][] = $nota;
                $studentNotasOverall[$ident][] = $nota;
            }

            $getFallbackNotas = function (string $studentId) use (
                $studentIdentityById,
                $studentProgramsById,
                $notasByStudentProgramAny,
                $notasAnyByStudent,
                $dedupeNotas
            ): array {
                $identity = $studentIdentityById[$studentId] ?? [
                    'identificacion' => $studentId,
                    'codigo' => '',
                    'nombres' => '',
                    'apellidos' => '',
                ];

                $studentKeys = $this->buildStudentMatchKeys(
                    $identity['identificacion'] ?? '',
                    $identity['codigo'] ?? '',
                    $identity['nombres'] ?? '',
                    $identity['apellidos'] ?? ''
                );
                if ($studentKeys === []) {
                    return [];
                }

                $merged = [];
                $programs = array_keys($studentProgramsById[$studentId] ?? []);

                foreach ($studentKeys as $studentKey) {
                    foreach ($programs as $programaNorm) {
                        $vals = $notasByStudentProgramAny[$studentKey][$programaNorm] ?? [];
                        if (!is_array($vals) || $vals === []) {
                            continue;
                        }

                        $merged = array_merge($merged, $vals);
                    }
                }

                if ($merged === []) {
                    foreach ($studentKeys as $studentKey) {
                        $vals = $notasAnyByStudent[$studentKey] ?? [];
                        if (!is_array($vals) || $vals === []) {
                            continue;
                        }

                        $merged = array_merge($merged, $vals);
                    }
                }

                return $dedupeNotas($merged);
            };

            foreach (array_keys($studentsAll) as $sid) {
                if (is_array($studentNotasOverall[$sid] ?? null) && $studentNotasOverall[$sid] !== []) {
                    continue;
                }

                $fallbackNotas = $getFallbackNotas((string)$sid);
                if ($fallbackNotas !== []) {
                    $studentNotasOverall[$sid] = $fallbackNotas;
                }
            }

            foreach ($studentsByProgram as $programa => $studentSet) {
                foreach (array_keys(is_array($studentSet) ? $studentSet : []) as $sid) {
                    if (is_array($programStudentNotas[$programa][$sid] ?? null) && $programStudentNotas[$programa][$sid] !== []) {
                        continue;
                    }

                    $fallbackNotas = $getFallbackNotas((string)$sid);
                    if ($fallbackNotas !== []) {
                        $programStudentNotas[$programa][$sid] = $fallbackNotas;
                    }
                }
            }

            foreach ($studentsByTutor as $tutorId => $studentSet) {
                foreach (array_keys(is_array($studentSet) ? $studentSet : []) as $sid) {
                    if (is_array($tutorStudentNotas[$tutorId][$sid] ?? null) && $tutorStudentNotas[$tutorId][$sid] !== []) {
                        continue;
                    }

                    $fallbackNotas = $getFallbackNotas((string)$sid);
                    if ($fallbackNotas !== []) {
                        $tutorStudentNotas[$tutorId][$sid] = $fallbackNotas;
                    }
                }
            }

            $buildAprobReprobRows = function (array $bucketedNotas, array $studentsByLabel) use ($approvalMin): array {
                $rows = [];

                $labels = array_values(array_unique(array_merge(
                    array_map('strval', array_keys($studentsByLabel)),
                    array_map('strval', array_keys($bucketedNotas))
                )));

                foreach ($labels as $label) {
                    $aprobado = 0;
                    $reprobado = 0;
                    $sinNota = 0;

                    $studentSet = $studentsByLabel[$label] ?? [];
                    $notasByStudent = $bucketedNotas[$label] ?? [];

                    if (!is_array($studentSet)) {
                        $studentSet = [];
                    }
                    if (!is_array($notasByStudent)) {
                        $notasByStudent = [];
                    }

                    if ($studentSet === []) {
                        foreach (array_keys($notasByStudent) as $sid) {
                            $studentSet[(string)$sid] = true;
                        }
                    }

                    foreach (array_keys($studentSet) as $studentId) {
                        $notas = $notasByStudent[$studentId] ?? [];
                        if (!is_array($notas) || $notas === []) {
                            $sinNota++;
                            continue;
                        }

                        $avg = array_sum($notas) / count($notas);
                        if ($avg >= $approvalMin) {
                            $aprobado++;
                        } else {
                            $reprobado++;
                        }
                    }

                    $rows[] = [
                        'label' => (string)$label,
                        'APROBADO' => (int)$aprobado,
                        'REPROBADO' => (int)$reprobado,
                        'SIN_NOTA' => (int)$sinNota,
                        'total' => (int)$aprobado + (int)$reprobado + (int)$sinNota,
                    ];
                }

                usort($rows, fn($a, $b) => ($b['total'] <=> $a['total']) ?: strcmp((string)$a['label'], (string)$b['label']));
                return $rows;
            };

            $porPrograma = $buildAprobReprobRows($programStudentNotas, $studentsByProgram);

            $tutorIds = array_values(array_unique(array_map('intval', array_merge(
                array_keys($tutorStudentNotas),
                array_keys($studentsByTutor)
            ))));
            $tutorLabelById = [];
            if ($tutorIds !== []) {
                $tutorRows = DB::table('tutors')
                    ->whereIn('id', $tutorIds)
                    ->selectRaw("id, COALESCE(NULLIF(TRIM(CONCAT(nombre,' ',apellido)), ''), CONCAT('Tutor #', id)) as label")
                    ->get();

                foreach ($tutorRows as $tutor) {
                    $tutorLabelById[(int)$tutor->id] = (string)$tutor->label;
                }
            }

            $tutorBucketNotasByLabel = [];
            foreach ($tutorStudentNotas as $tutorId => $studentsNotas) {
                $label = $tutorLabelById[(int)$tutorId] ?? ('Tutor #' . (int)$tutorId);
                if (!isset($tutorBucketNotasByLabel[$label])) {
                    $tutorBucketNotasByLabel[$label] = [];
                }

                foreach ($studentsNotas as $ident => $notas) {
                    $existing = $tutorBucketNotasByLabel[$label][$ident] ?? [];
                    $tutorBucketNotasByLabel[$label][$ident] = array_merge(
                        is_array($existing) ? $existing : [],
                        is_array($notas) ? $notas : []
                    );
                }
            }

            $tutorStudentsByLabel = [];
            foreach ($studentsByTutor as $tutorId => $studentSet) {
                $label = $tutorLabelById[(int)$tutorId] ?? ('Tutor #' . (int)$tutorId);
                if (!isset($tutorStudentsByLabel[$label])) {
                    $tutorStudentsByLabel[$label] = [];
                }

                foreach (array_keys(is_array($studentSet) ? $studentSet : []) as $sid) {
                    $tutorStudentsByLabel[$label][(string)$sid] = true;
                }
            }

            $porTutor = $buildAprobReprobRows($tutorBucketNotasByLabel, $tutorStudentsByLabel);

            $totalAprobado = 0;
            $totalReprobado = 0;
            $totalSinNota = 0;
            foreach (array_keys($studentsAll) as $sid) {
                $notas = $studentNotasOverall[$sid] ?? [];
                if (!is_array($notas) || $notas === []) {
                    $totalSinNota++;
                    continue;
                }

                $avg = array_sum($notas) / count($notas);
                if ($avg >= $approvalMin) {
                    $totalAprobado++;
                } else {
                    $totalReprobado++;
                }
            }

            $totalEvaluados = $totalAprobado + $totalReprobado;
            $totalEstudiantesUnicos = count($studentsAll);

            $sexo = ['FEMENINO' => 0, 'MASCULINO' => 0, 'SIN_DATO' => 0];
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
                    'SIN_DATO'  => (int)($sexoRows->firstWhere('label', 'SIN_DATO')->total ?? 0),
                ];
            }

            $grupos = ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0, 'OTROS' => 0];
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

                foreach ($gpRows as $row) {
                    $raw = trim((string)($row->label ?? ''));
                    $total = (int)($row->total ?? 0);
                    if ($total <= 0) {
                        continue;
                    }

                    $norm = Str::of($raw)
                        ->ascii()
                        ->upper()
                        ->replaceMatches('/\s+/', ' ')
                        ->trim()
                        ->value();

                    if ($norm === '' || $norm === 'NINGUNO') {
                        $grupos['NINGUNO'] += $total;
                        continue;
                    }

                    if (str_contains($norm, 'AFRO')) {
                        $grupos['AFRO'] += $total;
                        continue;
                    }

                    if (
                        str_contains($norm, 'INDIGENA') ||
                        str_contains($norm, 'ETNICO') ||
                        str_contains($norm, 'ETNIA')
                    ) {
                        $grupos['INDIGENA'] += $total;
                        continue;
                    }

                    $grupos['OTROS'] += $total;
                }
            }

            return [
                'porPrograma'    => $porPrograma,
                'porTutor'       => $porTutor,
                'totalAprobado'  => $totalAprobado,
                'totalReprobado' => $totalReprobado,
                'totalEstudiantesUnicos' => $totalEstudiantesUnicos,
                'totalEvaluados' => $totalEvaluados,
                'totalSinNota'   => $totalSinNota,
                'sexo'           => $sexo,
                'grupos'         => $grupos,
            ];
        }
    );
}

private function normalizeChartText(mixed $value): string
{
    return Str::of((string) $value)
        ->ascii()
        ->lower()
        ->replaceMatches('/[^a-z0-9]+/', ' ')
        ->replaceMatches('/\s+/', ' ')
        ->trim()
        ->value();
}

private function studentIdentifierVariants(mixed $value): array
{
    return $this->identifierLooseVariants($value);
}

private function identifierLooseVariants(mixed $value): array
{
    $raw = trim((string)$value);
    if ($raw === '') {
        return [];
    }

    $variants = [
        Str::of($raw)
            ->ascii()
            ->upper()
            ->replaceMatches('/\s+/', '')
            ->trim()
            ->value(),
    ];

    $compactAlnum = preg_replace('/[^A-Z0-9]+/', '', (string)$variants[0]) ?? '';
    if ($compactAlnum !== '') {
        $variants[] = $compactAlnum;
    }

    if ($compactAlnum !== '' && preg_match('/^\d+$/', $compactAlnum) === 1) {
        $variants[] = $compactAlnum;

        $digitsNoLeading = ltrim($compactAlnum, '0');
        if ($digitsNoLeading !== '') {
            $variants[] = $digitsNoLeading;
        }
    }

    $filtered = array_filter($variants, fn($item) => is_string($item) && trim($item) !== '');
    return array_values(array_unique($filtered));
}

private function buildStudentMatchKeys(
    mixed $identificacion,
    mixed $codigo,
    mixed $nombres,
    mixed $apellidos
): array {
    $keys = [];

    foreach ($this->identifierLooseVariants($identificacion) as $variant) {
        $keys[] = 'ID:' . $variant;
    }

    foreach ($this->identifierLooseVariants($codigo) as $variant) {
        $keys[] = 'COD:' . $variant;
    }

    $nameNormal = $this->normalizeChartText(trim((string)$nombres . ' ' . (string)$apellidos));
    if ($nameNormal !== '') {
        $keys[] = 'NAME:' . $nameNormal;
    }

    $nameInverse = $this->normalizeChartText(trim((string)$apellidos . ' ' . (string)$nombres));
    if ($nameInverse !== '' && $nameInverse !== $nameNormal) {
        $keys[] = 'NAME:' . $nameInverse;
    }

    return array_values(array_unique(array_filter($keys, fn($item) => is_string($item) && trim($item) !== '')));
}

private function subjectKeyVariants(mixed $value): array
{
    $normalized = $this->normalizeChartText($value);
    if ($normalized === '') {
        return [];
    }

    $variants = [$normalized];
    $tokens = preg_split('/\s+/', $normalized) ?: [];

    $singularTokens = [];
    foreach ($tokens as $token) {
        $token = trim((string)$token);
        if ($token === '') {
            continue;
        }

        // Captura diferencias comunes singular/plural (ej: "sistemas" -> "sistema").
        if (preg_match('/^[a-z]{4,}s$/', $token) === 1) {
            $singularTokens[] = substr($token, 0, -1);
        } else {
            $singularTokens[] = $token;
        }
    }

    $singular = trim(implode(' ', $singularTokens));
    if ($singular !== '' && $singular !== $normalized) {
        $variants[] = $singular;
    }

    return array_values(array_unique($variants));
}

/**
 * Helper: nombre de hoja seguro (Excel limita 31 caracteres y no permite ciertos símbolos)
 */
private function safeSheetName(string $name): string
{
    $name = trim($name);
    $name = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', '-', $name);
    if ($name === '') $name = 'Ventana';
    return mb_substr($name, 0, 31);
}

/**
 * Helper: insertar gráfico de barras
 */
private function addBarChart(
    \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
    string $title,
    string $categoriesRange,
    array $valuesRanges,
    array $seriesNames,
    string $topLeftCell,
    string $bottomRightCell
): void {
    // ✅ IMPORTANTE: si la hoja tiene espacios, se debe referenciar así:  'Nombre Hoja'!A1:B2
    $sheetTitle = $sheet->getTitle();
    $sheetTitle = str_replace("'", "''", $sheetTitle); // escapar comillas simples
    $sheetRef = "'" . $sheetTitle . "'!";

    // Categorías
    $categories = new \PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues(
        'String',
        $sheetRef . $categoriesRange,
        null,
        1000
    );

    // Series
    $dataSeriesValues = [];
    $dataSeriesLabels = [];

    foreach ($valuesRanges as $i => $rng) {
        // Labels en array (ok), no como fórmula
        $dataSeriesLabels[] = new \PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues(
            'String',
            null,
            null,
            1,
            [$seriesNames[$i] ?? ('Serie ' . ($i + 1))]
        );

        $dataSeriesValues[] = new \PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues(
            'Number',
            $sheetRef . $rng,
            null,
            1000
        );
    }

    $series = new \PhpOffice\PhpSpreadsheet\Chart\DataSeries(
        \PhpOffice\PhpSpreadsheet\Chart\DataSeries::TYPE_BARCHART,
        \PhpOffice\PhpSpreadsheet\Chart\DataSeries::GROUPING_CLUSTERED,
        range(0, count($dataSeriesValues) - 1),
        $dataSeriesLabels,
        [$categories],
        $dataSeriesValues
    );
    $series->setPlotDirection(\PhpOffice\PhpSpreadsheet\Chart\DataSeries::DIRECTION_COL);

    $plotArea = new \PhpOffice\PhpSpreadsheet\Chart\PlotArea(null, [$series]);
    $legend = new \PhpOffice\PhpSpreadsheet\Chart\Legend(
        \PhpOffice\PhpSpreadsheet\Chart\Legend::POSITION_RIGHT,
        null,
        false
    );

    $chart = new \PhpOffice\PhpSpreadsheet\Chart\Chart(
        'chart_' . md5($title . $topLeftCell),
        new \PhpOffice\PhpSpreadsheet\Chart\Title($title),
        $legend,
        $plotArea
    );

    $chart->setTopLeftPosition($topLeftCell);
    $chart->setBottomRightPosition($bottomRightCell);

    $sheet->addChart($chart);
}
}
