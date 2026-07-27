<?php

namespace App\Http\Controllers;

use App\Models\ReportPeriod;
use App\Models\ReportWindow;
use App\Models\Tutor;
use App\Models\Carrera;
use App\Models\TutorReport;
use App\Models\Asistencia;
use App\Models\AsistenciaOcasional;
use App\Services\StudentNoteMatchingService;
use App\Services\StudentProfileResolver;
use App\Services\TutorAttendanceImportService;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Reader\IReader;

class ReportController extends Controller
{
    private array $bulkImportWorkbookProfileCache = [];
    private const WINDOW_CATEGORIES = [
        'corte_1',
        'corte_2',
        'corte_3',
        'habilitacion',
        'final',
        'custom',
    ];

    private const WINDOW_REQUIRED_ITEMS = [
        'asistencias_normales',
        'asistencias_ocasionales',
        'informe_tutor',
        'evidencias',
        'observaciones',
    ];

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

    public function periodsDestroy(?ReportPeriod $period)
    {
        if (! $period) {
            abort(404);
        }

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
        ->get(['id','period_id','name','tutor_type','open_at','due_at','close_at','instructions','is_published','category','required_items']);

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

    $defaultWindowId = (int)($windowIds->last() ?? $windowIds->first());
    $defaultWindows = $windows
        ->filter(fn ($window) => (int) $window->id === $defaultWindowId)
        ->values();

    $insights = $this->buildInsightsSliceForSelection($period, $defaultWindows);

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

    public function windowChartsAggregate(Request $request, ReportPeriod $period)
    {
        $data = $request->validate([
            'window_ids' => ['required', 'array', 'min:1'],
            'window_ids.*' => ['required', 'integer'],
        ]);

        $requestedIds = collect($data['window_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($requestedIds === []) {
            return response()->json($this->emptyCharts(), 200);
        }

        $validIds = DB::table('report_windows')
            ->where('period_id', $period->id)
            ->whereIn('id', $requestedIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($validIds === []) {
            return response()->json($this->emptyCharts(), 200);
        }

        try {
            return response()->json(
                $this->buildChartsForSelection($period, $validIds)
            );
        } catch (\Throwable $e) {
            Log::error('windowChartsAggregate failed', [
                'period_id' => (int) $period->id,
                'window_ids' => $validIds,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json($this->emptyCharts(), 200);
        }
    }

    public function windowInsightsAggregate(Request $request, ReportPeriod $period)
    {
        $data = $request->validate([
            'window_ids' => ['required', 'array', 'min:1'],
            'window_ids.*' => ['required', 'integer'],
        ]);

        $requestedIds = collect($data['window_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($requestedIds === []) {
            return response()->json([
                'by_window' => [],
                'tree' => ['carreras' => []],
            ], 200);
        }

        $selectedWindows = $this->resolveWindowsForSelection($period, $requestedIds);

        if ($selectedWindows->isEmpty()) {
            return response()->json([
                'by_window' => [],
                'tree' => ['carreras' => []],
            ], 200);
        }

        try {
            return response()->json(
                $this->buildInsightsSliceForSelection($period, $selectedWindows)
            );
        } catch (\Throwable $e) {
            Log::error('windowInsightsAggregate failed', [
                'period_id' => (int) $period->id,
                'window_ids' => $requestedIds,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'by_window' => [],
                'tree' => ['carreras' => []],
            ], 200);
        }
    }

private function resolveWindowsForSelection(ReportPeriod $period, array $requestedIds)
{
    $windows = $period->windows()
        ->whereIn('id', $requestedIds)
        ->get(['id', 'period_id', 'name', 'tutor_type', 'open_at', 'due_at', 'close_at', 'instructions', 'is_published', 'category', 'required_items'])
        ->map(function ($window) {
            $window->setAttribute('required_items', $window->required_items ?? []);
            return $window;
        })
        ->keyBy(fn ($window) => (int) $window->id);

    return collect($requestedIds)
        ->map(fn ($id) => $windows->get((int) $id))
        ->filter()
        ->values();
}

private function buildInsightsSliceForSelection(ReportPeriod $period, $selectedWindows): array
{
    $windows = collect($selectedWindows)->values();
    $visibleWindowIds = $windows
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->filter(fn ($id) => $id > 0)
        ->values()
        ->all();

    if ($visibleWindowIds === []) {
        return [
            'by_window' => [],
            'tree' => ['carreras' => []],
        ];
    }

    $scopeWindowIds = $this->expandIncrementalWindowScope($period, $visibleWindowIds);

    $selectionStampKey = "rep_tree_selection_stamp_period_{$period->id}";
    $selectionStamp = (int) Cache::get($selectionStampKey, 1);
    $cacheKeyTree = "rep_tree_v5_period_{$period->id}_selection_{$selectionStamp}_" . md5(implode(',', $scopeWindowIds) . '|visible:' . implode(',', $visibleWindowIds));

    $treeCarreras = Cache::remember(
        $cacheKeyTree,
        now()->addMinutes(10),
        fn() => $this->buildTreeForWindowIds($period->id, $scopeWindowIds, $visibleWindowIds)
    );

    return [
        'by_window' => $windows->map(fn ($window) => [
            'window_id' => (int) $window->id,
            'name' => (string) $window->name,
            'tutor_type' => (string) $window->tutor_type,
            'category' => $window->category,
        ])->values()->all(),
        'tree' => ['carreras' => $treeCarreras],
    ];
}

    public function windowsStore(Request $request, ReportPeriod $period)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:120',
            'tutor_type'   => 'nullable|in:R1,R2',
            'tutor_types'  => 'nullable|array|min:1',
            'tutor_types.*'=> 'required|in:R1,R2',
            'open_at'      => 'required|date',
            'due_at'       => 'nullable|date|after_or_equal:open_at',
            'close_at'     => 'nullable|date|after_or_equal:due_at',
            'instructions' => 'nullable|string',
            'is_published' => 'sometimes|boolean',

            'category'          => ['required', Rule::in(self::WINDOW_CATEGORIES)],
            'required_items'    => 'nullable|array',
            'required_items.*'  => ['string', Rule::in(self::WINDOW_REQUIRED_ITEMS)],
        ]);

        $data['period_id']    = $period->id;
        $data['is_published'] = (bool)($data['is_published'] ?? true);
        $data['required_items'] = array_values(array_unique(array_filter($data['required_items'] ?? [])));
        $selectedTutorTypes = collect($data['tutor_types'] ?? [])
            ->map(fn ($type) => strtoupper((string) $type))
            ->filter(fn ($type) => in_array($type, ['R1', 'R2'], true))
            ->unique()
            ->values();

        if ($selectedTutorTypes->isEmpty()) {
            $fallbackTutorType = strtoupper((string) ($data['tutor_type'] ?? ''));
            if (in_array($fallbackTutorType, ['R1', 'R2'], true)) {
                $selectedTutorTypes = collect([$fallbackTutorType]);
            }
        }

        if ($selectedTutorTypes->isEmpty()) {
            return back()->withErrors([
                'tutor_type' => 'Debes seleccionar al menos una resolución.',
            ]);
        }

        $createdCount = 0;
        $duplicateCount = 0;

        foreach ($selectedTutorTypes as $tutorType) {
            $windowPayload = $data;
            $windowPayload['tutor_type'] = $tutorType;

            $lockKey = 'report_window_create_' . md5(json_encode([
                'period_id' => (int) $period->id,
                'name' => trim((string) ($windowPayload['name'] ?? '')),
                'tutor_type' => (string) $tutorType,
                'open_at' => (string) ($windowPayload['open_at'] ?? ''),
                'due_at' => (string) ($windowPayload['due_at'] ?? ''),
                'close_at' => (string) ($windowPayload['close_at'] ?? ''),
                'category' => (string) ($windowPayload['category'] ?? ''),
            ]));

            [, $wasCreated] = Cache::lock($lockKey, 10)->block(5, function () use ($windowPayload, $period) {
                $existingWindow = ReportWindow::query()
                    ->where('period_id', $period->id)
                    ->where('name', trim((string) ($windowPayload['name'] ?? '')))
                    ->where('tutor_type', (string) ($windowPayload['tutor_type'] ?? ''))
                    ->where('category', (string) ($windowPayload['category'] ?? ''))
                    ->where('open_at', $windowPayload['open_at'])
                    ->where('due_at', $windowPayload['due_at'] ?? null)
                    ->where('close_at', $windowPayload['close_at'] ?? null)
                    ->first();

                if ($existingWindow) {
                    return [$existingWindow, false];
                }

                return [ReportWindow::create($windowPayload), true];
            });

            if ($wasCreated) {
                $createdCount++;
            } else {
                $duplicateCount++;
            }
        }

        $this->forgetPeriodReportCaches($period);

        if ($createdCount === 0 && $duplicateCount > 0) {
            return back()->with('warning', 'Las entregas ya existían; se evitó crear duplicados.');
        }

        if ($createdCount > 0 && $duplicateCount > 0) {
            return back()->with('success', "Se crearon {$createdCount} entrega(s); {$duplicateCount} ya existían.");
        }

        return back()->with('success', $createdCount > 1 ? 'Entregas creadas correctamente.' : 'Entrega creada correctamente.');
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

            'category'          => ['required', Rule::in(self::WINDOW_CATEGORIES)],
            'required_items'    => 'nullable|array',
            'required_items.*'  => ['string', Rule::in(self::WINDOW_REQUIRED_ITEMS)],
        ]);

        if (array_key_exists('is_published', $data)) {
            $data['is_published'] = (bool)$data['is_published'];
        }
        $data['required_items'] = array_values(array_unique(array_filter($data['required_items'] ?? [])));

        $window->update($data);

        $this->forgetPeriodReportCaches($period);

        return back()->with('success', 'Entrega actualizada correctamente.');
    }

    public function windowsDestroy(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        DB::transaction(function () use ($period, $window) {
            Asistencia::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->delete();

            AsistenciaOcasional::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->delete();

            TutorReport::query()
                ->where('period_id', $period->id)
                ->where('window_id', $window->id)
                ->delete();

            $window->delete();
        });

        $this->forgetPeriodReportCaches($period);

        return back()->with('success', 'Entrega eliminada junto con sus datos cargados.');
    }

    public function windowsClearData(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        $deleted = DB::transaction(function () use ($period, $window) {
            $normalCount = Asistencia::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->count();

            $occasionalCount = AsistenciaOcasional::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->count();

            $reportCount = TutorReport::query()
                ->where('period_id', $period->id)
                ->where('window_id', $window->id)
                ->count();

            if (Schema::hasTable('tutor_report_files') && Schema::hasColumn('tutor_report_files', 'tutor_report_id')) {
                $reportIds = TutorReport::query()
                    ->where('period_id', $period->id)
                    ->where('window_id', $window->id)
                    ->pluck('id')
                    ->all();

                if ($reportIds !== []) {
                    DB::table('tutor_report_files')
                        ->whereIn('tutor_report_id', $reportIds)
                        ->delete();
                }
            }

            Asistencia::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->delete();

            AsistenciaOcasional::query()
                ->where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->delete();

            TutorReport::query()
                ->where('period_id', $period->id)
                ->where('window_id', $window->id)
                ->delete();

            return [
                'normal' => $normalCount,
                'ocasional' => $occasionalCount,
                'reports' => $reportCount,
            ];
        });

        $this->forgetPeriodReportCaches($period);

        return back()->with(
            'success',
            sprintf(
                'Se limpiaron %d asistencias normales, %d ocasionales y %d reportes de la entrega %s.',
                (int) ($deleted['normal'] ?? 0),
                (int) ($deleted['ocasional'] ?? 0),
                (int) ($deleted['reports'] ?? 0),
                $window->name
            )
        );
    }

    /* =====================================================
     |  ASIGNACIÓN MASIVA DE ENTREGAS A TUTORES
     ===================================================== */

    public function windowsAssignAll(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        DB::transaction(function () use ($window, $period) {
            $tutors = Tutor::query()
                ->whereHas('grupos', function ($query) use ($period) {
                    $query->where('periodo_grupo_tutor.period_id', $period->id);
                })
                ->distinct()
                ->get();

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

        return back()->with('success', 'Asignaciones creadas para todos los tutores con grupos en el período.');
    }

    public function bulkImportTutorAttendances(
        Request $request,
        ReportPeriod $period,
        TutorAttendanceImportService $importService
    ) {
        $stage = 'boot';

        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        @ini_set('max_execution_time', '0');
        @ini_set('memory_limit', '1024M');

        $stage = 'validate_request';
        $data = $request->validate([
            'window_id' => [
                'required',
                'integer',
                Rule::exists('report_windows', 'id')->where(
                    fn ($query) => $query->where('period_id', $period->id)
                ),
            ],
            'archivos' => ['required', 'array', 'min:1'],
            'archivos.*' => ['required', 'file', 'mimes:xlsx,xls'],
            'progress_token' => ['nullable', 'string', 'max:120'],
        ]);

        $progressToken = trim((string) ($data['progress_token'] ?? ''));
        $files = array_values(array_filter(
            $request->file('archivos', []),
            fn ($file) => $file instanceof UploadedFile
        ));
        $totalFiles = count($files);

        if ($progressToken !== '') {
            $this->writeBulkImportProgress($progressToken, [
                'status' => 'preparing',
                'message' => 'Preparando importación...',
                'progress_percent' => 0,
                'total_files' => $totalFiles,
                'processed_files' => 0,
                'skipped_files' => 0,
                'current_index' => 0,
                'current_file' => null,
            ]);
        }

        try {
            $stage = 'resolve_window';
            $window = ReportWindow::query()
                ->where('period_id', $period->id)
                ->findOrFail((int) $data['window_id']);
            $windowTutorType = (string) $window->tutor_type;

            $tutorCandidates = null;

            $processedFiles = 0;
            $skippedFiles = 0;
            $totalNormal = 0;
            $totalNormalDuplicated = 0;
            $totalOccasional = 0;
            $totalOccasionalDuplicated = 0;
            $issues = [];

            foreach ($files as $index => $file) {
                $stage = 'progress_processing';
                if ($progressToken !== '') {
                    $this->writeBulkImportProgress($progressToken, [
                        'status' => 'processing',
                        'message' => sprintf('Procesando archivo %d de %d', $index + 1, $totalFiles),
                        'progress_percent' => $this->bulkImportProgressPercent($processedFiles + $skippedFiles, $totalFiles),
                        'total_files' => $totalFiles,
                        'processed_files' => $processedFiles,
                        'skipped_files' => $skippedFiles,
                        'current_index' => $index + 1,
                        'current_file' => $file->getClientOriginalName(),
                    ]);
                }

                $stage = 'match_tutor';
                $match = $this->matchTutorCandidateForBulkFile($file, $period, $tutorCandidates);

                try {
                    $resolvedMatch = $match;

                    $stats = DB::transaction(function () use (&$resolvedMatch, &$tutorCandidates, $period, $importService, $window, $file, $windowTutorType, &$stage) {
                        $stage = 'transaction_resolve_match';
                        if (! $resolvedMatch) {
                            $resolvedMatch = $this->createTutorCandidateFromBulkFile($file, $period);

                            if (! $resolvedMatch) {
                                throw ValidationException::withMessages([
                                    'archivo' => sprintf(
                                        'No se pudo asociar "%s" a un tutor usando responsable, código, documento o nombre del archivo.',
                                        $file->getClientOriginalName()
                                    ),
                                ]);
                            }
                        }

                        $stage = 'transaction_activate_tutor';
                        $this->activateTutorForBulkImport(
                            $resolvedMatch['model'],
                            $period,
                            $windowTutorType
                        );

                        $stage = 'transaction_import_workbook';
                        return $importService->importWorkbookForTutorWindow($resolvedMatch['model'], $window, $file);
                    });

                    if (! $match && $resolvedMatch) {
                        $alreadyKnown = collect($tutorCandidates)
                            ->contains(fn ($candidate) => (int) (($candidate['model']->id ?? 0)) === (int) $resolvedMatch['model']->id);

                        if (! $alreadyKnown && is_array($tutorCandidates)) {
                            $tutorCandidates[] = $resolvedMatch;
                        }
                    }

                    $match = $resolvedMatch;
                    $processedFiles++;
                    $totalNormal += (int) ($stats['importadas_normal'] ?? 0);
                    $totalNormalDuplicated += (int) ($stats['duplicadas_normal'] ?? 0);
                    $totalOccasional += (int) ($stats['importadas_ocasionales'] ?? 0);
                    $totalOccasionalDuplicated += (int) ($stats['duplicadas_ocasionales'] ?? 0);
                } catch (ValidationException $exception) {
                    $skippedFiles++;
                    $issues[] = sprintf(
                        '%s: %s',
                        $file->getClientOriginalName(),
                        $exception->validator->errors()->first()
                    );
                } catch (\Throwable $exception) {
                    $skippedFiles++;
                    $issues[] = sprintf(
                        '%s: %s',
                        $file->getClientOriginalName(),
                        $exception->getMessage()
                    );
                }

                if ($progressToken !== '') {
                    $this->writeBulkImportProgress($progressToken, [
                        'status' => 'processing',
                        'message' => sprintf('Archivo %d de %d procesado', $index + 1, $totalFiles),
                        'progress_percent' => $this->bulkImportProgressPercent($processedFiles + $skippedFiles, $totalFiles),
                        'total_files' => $totalFiles,
                        'processed_files' => $processedFiles,
                        'skipped_files' => $skippedFiles,
                        'current_index' => $index + 1,
                        'current_file' => $file->getClientOriginalName(),
                    ]);
                }

                unset($match, $stats);
                gc_collect_cycles();
            }

            if ($processedFiles === 0) {
                throw ValidationException::withMessages([
                    'archivos' => $issues[0] ?? 'No se pudo importar ningún archivo.',
                ]);
            }

            $this->forgetPeriodReportCaches($period);

            $success = sprintf(
                'Carga masiva completada en "%s" (%s): %d archivo(s) procesado(s), %d asistencia(s) normales nuevas, %d ocasional(es) nuevas.',
                $window->name,
                $window->tutor_type,
                $processedFiles,
                $totalNormal,
                $totalOccasional
            );

            if ($totalNormalDuplicated > 0 || $totalOccasionalDuplicated > 0) {
                $success .= sprintf(
                    ' Duplicadas omitidas: %d normales y %d ocasionales.',
                    $totalNormalDuplicated,
                    $totalOccasionalDuplicated
                );
            }

            if ($skippedFiles > 0) {
                $success .= sprintf(' %d archivo(s) quedaron pendientes de revisión.', $skippedFiles);
            }

            $warning = $issues !== []
                ? implode(' | ', array_slice($issues, 0, 3))
                : null;

            if ($progressToken !== '') {
                $this->writeBulkImportProgress($progressToken, [
                    'status' => 'completed',
                    'message' => 'Importación completada.',
                    'progress_percent' => 100,
                    'total_files' => $totalFiles,
                    'processed_files' => $processedFiles,
                    'skipped_files' => $skippedFiles,
                    'current_index' => $totalFiles,
                    'current_file' => null,
                    'success' => $success,
                    'warning' => $warning,
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => $success,
                    'warning' => $warning,
                    'processed_files' => $processedFiles,
                    'skipped_files' => $skippedFiles,
                    'total_normal' => $totalNormal,
                    'total_occasional' => $totalOccasional,
                ]);
            }

            return back()
                ->with('success', $success)
                ->with('warning', $warning);
        } catch (ValidationException $exception) {
            if ($progressToken !== '') {
                $completedFiles = ($processedFiles ?? 0) + ($skippedFiles ?? 0);
                $this->writeBulkImportProgress($progressToken, [
                    'status' => 'failed',
                    'message' => $exception->validator->errors()->first(),
                    'progress_percent' => $this->bulkImportProgressPercent($completedFiles, $totalFiles),
                    'total_files' => $totalFiles,
                    'processed_files' => $processedFiles ?? 0,
                    'skipped_files' => $skippedFiles ?? 0,
                    'current_index' => $completedFiles,
                    'current_file' => null,
                ]);
            }

            throw $exception;
        } catch (\Throwable $exception) {
            Log::error('bulkImportTutorAttendances failed', [
                'period_id' => (int) $period->id,
                'window_id' => (int) ($data['window_id'] ?? 0),
                'tutor_type' => (string) (($windowTutorType ?? '') ?: ''),
                'stage' => $stage,
                'files' => array_map(
                    fn ($file) => $file instanceof UploadedFile ? $file->getClientOriginalName() : null,
                    $files ?? []
                ),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            if ($progressToken !== '') {
                $completedFiles = ($processedFiles ?? 0) + ($skippedFiles ?? 0);
                $this->writeBulkImportProgress($progressToken, [
                    'status' => 'failed',
                    'message' => $exception->getMessage(),
                    'progress_percent' => $this->bulkImportProgressPercent($completedFiles, $totalFiles),
                    'total_files' => $totalFiles,
                    'processed_files' => $processedFiles ?? 0,
                    'skipped_files' => $skippedFiles ?? 0,
                    'current_index' => $completedFiles,
                    'current_file' => null,
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Error interno al importar asistencias [' . $stage . ']: ' . $exception->getMessage(),
                ], 500);
            }

            throw $exception;
        }
    }

    public function bulkImportTutorAttendancesProgress(Request $request, ReportPeriod $period)
    {
        $token = trim((string) $request->query('token', ''));

        if ($token === '') {
            return response()->json([
                'status' => 'idle',
                'message' => 'Sin seguimiento activo.',
                'progress_percent' => 0,
                'total_files' => 0,
                'processed_files' => 0,
                'skipped_files' => 0,
                'current_index' => 0,
                'current_file' => null,
            ]);
        }

        try {
            $payload = Cache::get($this->bulkImportProgressCacheKey($token), [
                'status' => 'idle',
                'message' => 'Esperando progreso...',
                'progress_percent' => 0,
                'total_files' => 0,
                'processed_files' => 0,
                'skipped_files' => 0,
                'current_index' => 0,
                'current_file' => null,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('bulk import progress cache read failed', [
                'token' => $token,
                'message' => $exception->getMessage(),
            ]);

            $payload = [
                'status' => 'idle',
                'message' => 'Esperando progreso...',
                'progress_percent' => 0,
                'total_files' => 0,
                'processed_files' => 0,
                'skipped_files' => 0,
                'current_index' => 0,
                'current_file' => null,
            ];
        }

        return response()->json($payload);
    }

public function exportChartsExcel(Request $request, ReportPeriod $period)
{
    $windows = $this->resolveExportWindowsSelection($request, $period);

    if ($windows->isEmpty()) {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Resumen');
        $sheet->setCellValue('A1', 'No hay cortes seleccionados para exportar.');
        $writer = new Xlsx($spreadsheet);
        $writer->setPreCalculateFormulas(false);

        $filename = "SEGUIMIENTO_CORTE_A_CORTE_{$period->code}_SIN_DATOS.xlsx";
        return $this->downloadSpreadsheetFile($spreadsheet, $writer, $filename);
    }

    $export = $this->buildSeguimientoExportData($period, $windows);
    $gradeStage = (string) ($export['grade_stage'] ?? '');
    $filename = "SEGUIMIENTO_CORTE_A_CORTE_{$period->code}_" . $export['file_suffix'] . ".xlsx";

    $spreadsheet = new Spreadsheet();
    $spreadsheet->getProperties()
        ->setCreator('Sistema Bienestar')
        ->setTitle('Seguimiento corte a corte')
        ->setDescription('Exportación académica tipo seguimiento corte a corte');

    $generalSheet = $spreadsheet->getActiveSheet();
    $generalSheet->setTitle($this->safeSheetName($export['general_sheet_title']));
    $generalHeaders = [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Identificación',
        'Beneficiados tutorías (1er corte)',
        'Beneficiados tutorías (2do corte)',
        'Beneficiados tutorías (3er corte)',
        'Nota 1',
        'Nota 2',
        'Nota 3',
        'Habilitación',
        'Definitiva',
        'Final',
        $export['note_header'],
        'Estado',
        'Sexo',
        'Grupos priorizados',
        'Programa',
        'Materia',
        'Sede',
        'Semestre',
        'Grupo',
        'Año',
        'Periodo',
        'Nombre del tutor',
        'CLAVE IDE',
        'CLAVE MATERIA',
        'CLAVE CODIGO',
        'CLAVE NOMBRE',
        'CLAVE NOMBRES',
        'CLAVE APELLIDOS',
        'CODIGO DE LA MATERIA',
    ];
    $generalRows = array_map(function (array $row) {
        return [
            $row['codigo'],
            $row['apellido'],
            $row['nombre'],
            $row['identificacion'],
            $row['flags'][0] ?? 'NO',
            $row['flags'][1] ?? 'NO',
            $row['flags'][2] ?? 'NO',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            $row['sexo'],
            $row['grupo_priorizado'],
            $row['programa'],
            $row['materia'],
            $row['sede'],
            $row['semestre'],
            $row['grupo'],
            $row['anio'],
            $row['periodo'],
            $row['tutor_nombre'],
            '',
            '',
            '',
            '',
            '',
            '',
            $row['codigo_materia'],
        ];
    }, $export['general_repeated_rows'] ?? []);
    $this->fillSeguimientoTable($generalSheet, $generalHeaders, $generalRows, 'A1');

    $uniqueSheet = new Worksheet($spreadsheet, $this->safeSheetName($export['repeated_sheet_title']));
    $spreadsheet->addSheet($uniqueSheet, 1);
    $this->fillSeguimientoTable($uniqueSheet, $export['general_headers'], $export['general_rows'], 'A1');

    $repeatedHeaders = [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Identificación',
        'Programa',
        'Sexo',
        'Grupos priorizados',
        'Materia',
        'Nota 1',
        'Nota 2',
        'Nota 3',
        'Habilitación',
        'Definitiva',
        'Final',
        $export['note_header'],
        'Estado',
        'Nombre del tutor',
        'Sede',
        'Semestre',
        'Grupo',
        'Año',
        'Periodo',
        'Resolución',
        'Corte',
        'CLAVE IDE',
        'CLAVE MATERIA',
        'CLAVE CODIGO',
        'CLAVE NOMBRE',
        'CLAVE NOMBRES',
        'CLAVE APELLIDOS',
        'CODIGO DE LA MATERIA',
    ];

    $repeatedSheet = new Worksheet($spreadsheet, $this->safeSheetName($export['unique_sheet_title']));
    $spreadsheet->addSheet($repeatedSheet, 2);
    $repeatedRows = array_map(function (array $row) {
        return [
            $row['codigo'],
            $row['apellido'],
            $row['nombre'],
            $row['identificacion'],
            $row['programa'],
            $row['sexo'],
            $row['grupo_priorizado'],
            $row['materia'],
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            $row['tutor_nombre'],
            $row['sede'],
            $row['semestre'],
            $row['grupo'],
            $row['anio'],
            $row['periodo'],
            $row['resolucion'],
            $row['corte'],
            '',
            '',
            '',
            '',
            '',
            '',
            $row['codigo_materia'],
        ];
    }, $export['beneficiary_rows']);
    $this->fillSeguimientoTable($repeatedSheet, $repeatedHeaders, $repeatedRows, 'A1');
    foreach (['I', 'J', 'K', 'L', 'M', 'N', 'O'] as $numericColumn) {
        $repeatedSheet->getStyle($numericColumn . '2:' . $numericColumn . max(2, count($repeatedRows) + 1))
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }

    foreach ($export['window_note_sheets'] as $windowSheetExport) {
        $windowSheet = new Worksheet($spreadsheet, $this->safeSheetName((string) ($windowSheetExport['title'] ?? 'CORTE')));
        $spreadsheet->addSheet($windowSheet);
        $this->fillSeguimientoTable($windowSheet, [
            'Codigo',
            'Apellidos',
            'Nombre',
            'Identificación',
            (string) ($windowSheetExport['note_header'] ?? 'Nota'),
            'Sexo',
            'Grupo priorizado',
            'Programa',
            'Materia',
            'Sede',
            'Semestre',
            'Grupo',
            'Año',
            'Periodo',
            'Resolución',
        ], $windowSheetExport['rows'] ?? [], 'A1');

        $windowSheet->getStyle('E2:E' . max(2, count($windowSheetExport['rows'] ?? []) + 1))
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }

    $graphRepeatedSheet = new Worksheet($spreadsheet, $this->safeSheetName('GRAFICOS CON REP'));
    $spreadsheet->addSheet($graphRepeatedSheet);
    $this->fillSeguimientoSummarySheetWithRepetition($graphRepeatedSheet, $export);

    $graphUniqueSheet = new Worksheet($spreadsheet, $this->safeSheetName('GRAFICOS SIN REP'));
    $spreadsheet->addSheet($graphUniqueSheet);
    $this->fillSeguimientoUniqueSummarySheet($graphUniqueSheet, $export);

    $notesSheet = new Worksheet($spreadsheet, $this->safeSheetName($export['notes_sheet_title']));
    $spreadsheet->addSheet($notesSheet, 3 + count($export['window_note_sheets']));
    $this->fillSeguimientoTable($notesSheet, [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Tipo Identificacion',
        'Identificacion',
        'Ide Programa',
        'Programa',
        'Semestre',
        'Ide Materia',
        'Materia',
        'Grupo',
        'Nota 1',
        'Nota 2',
        'Nota 3',
        'Habilitación',
        'Definitiva',
        'Final',
        'Año',
        'Periodo',
        'CLAVE IDE',
        'CLAVE MATERIA',
        'CLAVE CODIGO',
        'CLAVE NOMBRE',
        'CLAVE NOMBRES',
        'CLAVE APELLIDOS',
    ], array_map(function (array $row) {
        return [
            $row['codigo'],
            $row['apellidos'],
            $row['nombres'],
            $row['tipo_identificacion'],
            $row['identificacion'],
            $row['ide_programa'],
            $row['programa'],
            $row['semestre'],
            $row['ide_materia'],
            $row['materia'],
            $row['grupo'],
            $row['nota_1'],
            $row['nota_2'],
            $row['nota_3'],
            $row['habilitacion'],
            $row['definitiva'],
            $row['final'],
            $row['anio'],
            $row['periodo'],
            '',
            '',
            '',
            '',
            '',
            '',
        ];
    }, $export['notes_rows']), 'A1');
    foreach (['L', 'M', 'N', 'O', 'P', 'Q'] as $numericColumn) {
        $notesSheet->getStyle($numericColumn . '2:' . $numericColumn . max(2, count($export['notes_rows']) + 1))
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }

    $notesLastRow = max(2, count($export['notes_rows']) + 1);
    $this->populateSeguimientoNotesHelperColumns($notesSheet, $notesLastRow);

    $generalLastRow = max(2, count($generalRows) + 1);
    for ($row = 2; $row <= $generalLastRow; $row++) {
        $generalSheet->setCellValue(
            'Z' . $row,
            '=IF(AND($D' . $row . '<>"",$AF' . $row . '<>""),$D' . $row . '&"|"&$AF' . $row . ',"")'
        );
        $generalSheet->setCellValue(
            'AA' . $row,
            '=IF(AND($D' . $row . '<>"",$S' . $row . '<>""),LOWER(TRIM($D' . $row . '&"|"&$S' . $row . ')),"")'
        );
        $generalSheet->setCellValue(
            'AB' . $row,
            '=IF(AND($A' . $row . '<>"",$S' . $row . '<>""),LOWER(TRIM($A' . $row . '&"|"&$S' . $row . ')),"")'
        );
        $generalSheet->setCellValue(
            'AC' . $row,
            '=IF(AND(TRIM($C' . $row . '&" "&$B' . $row . ')<>"",$S' . $row . '<>""),LOWER(TRIM($C' . $row . '&" "&$B' . $row . '&"|"&$S' . $row . ')),"")'
        );
        $generalSheet->setCellValue(
            'AD' . $row,
            '=IF(AND($C' . $row . '<>"",$S' . $row . '<>""),LOWER(TRIM($C' . $row . '&"|"&$S' . $row . ')),"")'
        );
        $generalSheet->setCellValue(
            'AE' . $row,
            '=IF(AND($B' . $row . '<>"",$S' . $row . '<>""),LOWER(TRIM($B' . $row . '&"|"&$S' . $row . ')),"")'
        );
        $generalSheet->setCellValue('H' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'L', $notesLastRow));
        $generalSheet->setCellValue('I' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'M', $notesLastRow));
        $generalSheet->setCellValue('J' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'N', $notesLastRow));
        $generalSheet->setCellValue('K' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'O', $notesLastRow));
        $generalSheet->setCellValue('L' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'P', $notesLastRow));
        $generalSheet->setCellValue('M' . $row, $this->buildSeguimientoNoteLookupFormula($export['notes_sheet_title'], $row, 'Q', $notesLastRow));
        $generalSheet->setCellValue('N' . $row, $this->buildSeguimientoSelectedNoteFormula($row, $gradeStage));
        $generalSheet->setCellValue('O' . $row, $this->buildSeguimientoStatusFormula($row));
    }
    foreach (['H', 'I', 'J', 'K', 'L', 'M', 'N'] as $numericColumn) {
        $generalSheet->getStyle($numericColumn . '2:' . $numericColumn . $generalLastRow)
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }
    foreach (['Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF'] as $hiddenColumn) {
        $generalSheet->getColumnDimension($hiddenColumn)->setVisible(false);
    }

    $repeatedLastRow = max(2, count($repeatedRows) + 1);
    for ($row = 2; $row <= $repeatedLastRow; $row++) {
        $repeatedSheet->setCellValue(
            'Y' . $row,
            '=IF(AND($D' . $row . '<>"",$AE' . $row . '<>""),$D' . $row . '&"|"&$AE' . $row . ',"")'
        );
        $repeatedSheet->setCellValue(
            'Z' . $row,
            '=IF(AND($D' . $row . '<>"",$H' . $row . '<>""),LOWER(TRIM($D' . $row . '&"|"&$H' . $row . ')),"")'
        );
        $repeatedSheet->setCellValue(
            'AA' . $row,
            '=IF(AND($A' . $row . '<>"",$H' . $row . '<>""),LOWER(TRIM($A' . $row . '&"|"&$H' . $row . ')),"")'
        );
        $repeatedSheet->setCellValue(
            'AB' . $row,
            '=IF(AND(TRIM($C' . $row . '&" "&$B' . $row . ')<>"",$H' . $row . '<>""),LOWER(TRIM($C' . $row . '&" "&$B' . $row . '&"|"&$H' . $row . ')),"")'
        );
        $repeatedSheet->setCellValue(
            'AC' . $row,
            '=IF(AND($C' . $row . '<>"",$H' . $row . '<>""),LOWER(TRIM($C' . $row . '&"|"&$H' . $row . ')),"")'
        );
        $repeatedSheet->setCellValue(
            'AD' . $row,
            '=IF(AND($B' . $row . '<>"",$H' . $row . '<>""),LOWER(TRIM($B' . $row . '&"|"&$H' . $row . ')),"")'
        );
        $repeatedSheet->setCellValue('I' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'L', $notesLastRow));
        $repeatedSheet->setCellValue('J' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'M', $notesLastRow));
        $repeatedSheet->setCellValue('K' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'N', $notesLastRow));
        $repeatedSheet->setCellValue('L' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'O', $notesLastRow));
        $repeatedSheet->setCellValue('M' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'P', $notesLastRow));
        $repeatedSheet->setCellValue('N' . $row, $this->buildSeguimientoRepeatedNoteLookupFormula($export['notes_sheet_title'], $row, 'Q', $notesLastRow));
        $repeatedSheet->setCellValue('O' . $row, $this->buildSeguimientoRepeatedSelectedNoteFormula($row, $gradeStage));
        $repeatedSheet->setCellValue('P' . $row, $this->buildSeguimientoRepeatedStatusFormula($row));
    }

    foreach (['Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'] as $hiddenColumn) {
        $repeatedSheet->getColumnDimension($hiddenColumn)->setVisible(false);
    }

    $spreadsheet->setActiveSheetIndex(0);

    $writer = new Xlsx($spreadsheet);
    $writer->setIncludeCharts(true);
    $writer->setPreCalculateFormulas(false);

    return $this->downloadSpreadsheetFile($spreadsheet, $writer, $filename);
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

private function resolveExportWindowsSelection(Request $request, ReportPeriod $period)
{
    $windows = $period->windows()
        ->orderBy('open_at')
        ->orderBy('id')
        ->get(['id', 'period_id', 'name', 'tutor_type', 'category', 'open_at', 'due_at', 'close_at', 'instructions', 'is_published']);

    $requestedWindowIds = $request->query('window_ids', $request->query('window_ids[]', []));
    if (is_string($requestedWindowIds)) {
        $requestedWindowIds = array_filter(array_map('trim', explode(',', $requestedWindowIds)));
    } elseif (! is_array($requestedWindowIds)) {
        $requestedWindowIds = [$requestedWindowIds];
    }

    $requestedIds = collect($requestedWindowIds)
        ->map(fn ($id) => (int) $id)
        ->filter(fn ($id) => $id > 0)
        ->unique()
        ->values();

    if ($requestedIds->isEmpty()) {
        return $windows->values();
    }

    $selectedLookup = array_fill_keys($requestedIds->all(), true);
    $selectedWindows = $windows
        ->filter(fn ($window) => isset($selectedLookup[(int) $window->id]))
        ->values();

    $selectedTutorTypes = $selectedWindows
        ->pluck('tutor_type')
        ->map(fn ($type) => strtoupper(trim((string) $type)))
        ->filter()
        ->unique()
        ->values()
        ->all();

    $maxSelectedCut = $selectedWindows
        ->map(fn ($window) => (int) ($this->inferWindowCutNumberFromWindow($window) ?? 0))
        ->filter(fn ($cutNumber) => $cutNumber > 0)
        ->max();

    if ($maxSelectedCut === null || $maxSelectedCut <= 0 || $selectedTutorTypes === []) {
        return $selectedWindows;
    }

    return $windows
        ->filter(function ($window) use ($selectedLookup, $selectedTutorTypes, $maxSelectedCut) {
            if (isset($selectedLookup[(int) $window->id])) {
                return true;
            }

            $tutorType = strtoupper(trim((string) ($window->tutor_type ?? '')));
            if (! in_array($tutorType, $selectedTutorTypes, true)) {
                return false;
            }

            $cutNumber = (int) ($this->inferWindowCutNumberFromWindow($window) ?? 0);
            return $cutNumber > 0 && $cutNumber <= $maxSelectedCut;
        })
        ->values();
}

private function buildSeguimientoExportData(ReportPeriod $period, $windows): array
{
    $windowIds = collect($windows)
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values()
        ->all();

    [$defaultYear, $defaultPeriod] = $this->parseAcademicPeriodCode((string) $period->code);

    $windowMeta = collect($windows)->mapWithKeys(function ($window) {
        $cutNumber = $this->inferWindowCutNumberFromWindow($window);
        $gradeStage = $this->inferWindowGradeStageFromWindow($window);
        $displayLabel = $this->buildSeguimientoWindowDisplayLabel(
            (string) ($window->name ?? ''),
            (string) ($window->tutor_type ?? ''),
            $cutNumber,
            $gradeStage
        );

        return [
            (int) $window->id => [
                'id' => (int) $window->id,
                'name' => (string) $window->name,
                'tutor_type' => (string) $window->tutor_type,
                'category' => (string) ($window->category ?? ''),
                'cut_number' => $cutNumber,
                'grade_stage' => $gradeStage,
                'display_label' => $displayLabel,
                'beneficiados_header' => 'BENEFICIADOS TUTORIAS (' . mb_strtoupper($displayLabel) . ')',
                'note_header' => $this->buildSeguimientoWindowNoteHeaderLabel($gradeStage, (string) ($window->tutor_type ?? '')),
                'sheet_title' => $this->buildSeguimientoWindowDataSheetTitle($gradeStage, (string) ($window->tutor_type ?? ''), (string) ($window->name ?? ''), (int) ($window->id ?? 0)),
            ],
        ];
    })->all();

    $selectedWindows = array_values($windowMeta);
    $selectedGroupsMap = [];
    foreach ($selectedWindows as $meta) {
        $groupKey = (string) ($meta['grade_stage'] ?: ('window_' . (int) ($meta['id'] ?? 0)));

        if (! isset($selectedGroupsMap[$groupKey])) {
            $selectedGroupsMap[$groupKey] = [
                'key' => $groupKey,
                'grade_stage' => (string) ($meta['grade_stage'] ?? ''),
                'cut_number' => $meta['cut_number'] ?? null,
                'window_ids' => [],
                'resolution_labels' => [],
                'beneficiados_header' => 'BENEFICIADOS TUTORIAS (' . mb_strtoupper($this->buildSeguimientoWindowDisplayLabel(
                    (string) ($meta['name'] ?? ''),
                    '',
                    $meta['cut_number'] ?? null,
                    $meta['grade_stage'] ?? null
                )) . ')',
                'note_header' => $this->buildSeguimientoWindowNoteHeaderLabel((string) ($meta['grade_stage'] ?? ''), ''),
                'sheet_title' => $this->buildSeguimientoGroupSheetTitle(
                    (string) ($meta['grade_stage'] ?? ''),
                    $meta['cut_number'] ?? null,
                    (string) ($meta['name'] ?? ''),
                    count($selectedWindows) > 1
                ),
            ];
        }

        $selectedGroupsMap[$groupKey]['window_ids'][] = (int) ($meta['id'] ?? 0);
        $resolution = strtoupper(trim((string) ($meta['tutor_type'] ?? '')));
        if ($resolution !== '') {
            $selectedGroupsMap[$groupKey]['resolution_labels'][$resolution] = true;
        }
    }

    $selectedGroups = array_values(array_map(function (array $group) {
        sort($group['window_ids']);
        ksort($group['resolution_labels']);
        return $group;
    }, $selectedGroupsMap));

    $normalRows = DB::query()
        ->fromSub($this->buildIncrementalAsistenciasQuery($period->id, $windowIds), 'a')
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->leftJoin('tutors as t', 't.id', '=', 'a.tutor_id')
        ->selectRaw("
            a.report_window_id as window_id,
            TRIM(COALESCE(a.nombres_del_estudiante, '')) as nombre,
            TRIM(COALESCE(a.apellidos_del_estudiante, '')) as apellido,
            TRIM(a.identificacion) as identificacion,
            TRIM(COALESCE(a.codigo_estudiantil, '')) as codigo,
            COALESCE(NULLIF(TRIM(c.nombre), ''), NULLIF(TRIM(a.programa_academico), ''), 'Sin programa') as programa,
            TRIM(COALESCE(a.sexo, '')) as sexo,
            TRIM(COALESCE(a.grupo_priorizado, '')) as grupo_priorizado,
            '' as codigo_materia,
            TRIM(COALESCE(s.nombre, '')) as materia,
            COALESCE(NULLIF(TRIM(CONCAT(t.nombre, ' ', t.apellido)), ''), CONCAT('Tutor #', a.tutor_id)) as tutor_nombre,
            TRIM(COALESCE(g.nombre, '')) as grupo_nombre,
            '' as semestre,
            'NORMAL' as origen
        ")
        ->get()
        ->map(fn ($row) => (array) $row);

    $occasionalRows = DB::query()
        ->fromSub($this->buildIncrementalAsistenciasOcasionalesQuery($period->id, $windowIds), 'ao')
        ->leftJoin('grupo_t as g', 'g.id', '=', 'ao.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->leftJoin('tutors as t', 't.id', '=', 'ao.tutor_id')
        ->selectRaw("
            ao.report_window_id as window_id,
            TRIM(COALESCE(ao.nombres_del_estudiante, '')) as nombre,
            TRIM(COALESCE(ao.apellidos_del_estudiante, '')) as apellido,
            TRIM(ao.identificacion) as identificacion,
            TRIM(COALESCE(ao.codigo_estudiantil, '')) as codigo,
            COALESCE(NULLIF(TRIM(c.nombre), ''), NULLIF(TRIM(ao.programa_academico), ''), 'Sin programa') as programa,
            TRIM(COALESCE(ao.sexo, '')) as sexo,
            TRIM(COALESCE(ao.grupo_priorizado, '')) as grupo_priorizado,
            '' as codigo_materia,
            TRIM(COALESCE(s.nombre, ao.asignatura_texto, '')) as materia,
            COALESCE(NULLIF(TRIM(CONCAT(t.nombre, ' ', t.apellido)), ''), CONCAT('Tutor #', ao.tutor_id)) as tutor_nombre,
            TRIM(COALESCE(g.nombre, ao.grupo_texto, '')) as grupo_nombre,
            '' as semestre,
            'OCASIONAL' as origen
        ")
        ->get()
        ->map(fn ($row) => (array) $row);

    $attendanceRows = collect($normalRows)->concat($occasionalRows);
    $relevantIdentifications = $attendanceRows
        ->pluck('identificacion')
        ->map(fn ($value) => trim((string) $value))
        ->filter()
        ->unique()
        ->values()
        ->all();
    $relevantCodes = $attendanceRows
        ->pluck('codigo')
        ->map(fn ($value) => trim((string) $value))
        ->filter()
        ->unique()
        ->values()
        ->all();
    $relevantNamePairs = $attendanceRows
        ->map(function (array $row) {
            return [
                'nombre' => trim((string) ($row['nombre'] ?? '')),
                'apellido' => trim((string) ($row['apellido'] ?? '')),
            ];
        })
        ->filter(fn (array $row) => $row['nombre'] !== '' || $row['apellido'] !== '')
        ->unique(fn (array $row) => mb_strtolower($row['nombre']) . '|' . mb_strtolower($row['apellido']))
        ->values()
        ->all();
    $notesRowsQuery = DB::table('notas')
        ->where('period_id', $period->id)
        ->orderBy('programa')
        ->orderBy('apellidos')
        ->orderBy('nombres')
        ->selectRaw("
            TRIM(COALESCE(codigo, '')) as codigo,
            TRIM(COALESCE(apellidos, '')) as apellidos,
            TRIM(COALESCE(nombres, '')) as nombres,
            TRIM(COALESCE(tipo_identificacion, '')) as tipo_identificacion,
            TRIM(identificacion) as identificacion,
            TRIM(COALESCE(ide_programa, '')) as ide_programa,
            TRIM(COALESCE(programa, '')) as programa,
            TRIM(COALESCE(semestre, '')) as semestre,
            TRIM(COALESCE(ide_materia, '')) as ide_materia,
            TRIM(COALESCE(materia, '')) as materia,
            TRIM(COALESCE(grupo, '')) as grupo,
            nota_1,
            nota_2,
            nota_3,
            habilitacion,
            definitiva,
            final,
            anio,
            periodo,
            TRIM(COALESCE(codigo, '')) as codigo_key,
            TRIM(COALESCE(nombres, '')) as nombres_key,
            TRIM(COALESCE(apellidos, '')) as apellidos_key,
            COALESCE(NULLIF(TRIM(programa), ''), NULLIF(TRIM(ide_programa), '')) as programa_key,
            LOWER(TRIM(COALESCE(materia, ''))) as materia_key
        ");

    if ($relevantIdentifications !== [] || $relevantCodes !== [] || $relevantNamePairs !== []) {
        $notesRowsQuery->where(function ($query) use ($relevantIdentifications, $relevantCodes, $relevantNamePairs) {
            if ($relevantIdentifications !== []) {
                $query->whereIn('identificacion', $relevantIdentifications);
            }

            if ($relevantCodes !== []) {
                $method = $relevantIdentifications !== [] ? 'orWhereIn' : 'whereIn';
                $query->{$method}('codigo', $relevantCodes);
            }

            foreach ($relevantNamePairs as $pair) {
                $nombre = trim((string) ($pair['nombre'] ?? ''));
                $apellido = trim((string) ($pair['apellido'] ?? ''));

                if ($nombre === '' && $apellido === '') {
                    continue;
                }

                $query->orWhere(function ($nameQuery) use ($nombre, $apellido) {
                    if ($nombre !== '') {
                        $nameQuery->where('nombres', $nombre);
                    }

                    if ($apellido !== '') {
                        $nameQuery->where('apellidos', $apellido);
                    }
                });
            }
        });
    }

    $notesRows = $notesRowsQuery
        ->get()
        ->map(fn ($row) => (array) $row)
        ->all();

    $noteMaps = $this->buildSeguimientoNoteMatchMaps($notesRows);

    $studentProfiles = app(StudentProfileResolver::class)->resolveManyForPeriod(
        $period->id,
        $attendanceRows->pluck('identificacion')->all()
    );

    $detailRows = $attendanceRows
        ->map(function (array $row) use ($windowMeta, $defaultYear, $defaultPeriod, $noteMaps, $studentProfiles) {
            $meta = $windowMeta[(int) ($row['window_id'] ?? 0)] ?? [
                'name' => 'Corte desconocido',
                'tutor_type' => 'N/D',
                'cut_number' => null,
                'grade_stage' => null,
                'display_label' => 'Corte desconocido · N/D',
            ];

            $resolvedNote = $this->resolveSeguimientoNoteForDetailRow(
                $row,
                $noteMaps,
                (int) ($meta['cut_number'] ?? 0)
            );

            $semestre = trim((string) ($resolvedNote['semestre'] ?? ''));
            $grupo = trim((string) ($resolvedNote['grupo'] ?? ''));
            $anio = trim((string) ($resolvedNote['anio'] ?? ''));
            $periodoValue = trim((string) ($resolvedNote['periodo'] ?? ''));

            $identVariants = $this->identifierLooseVariants($row['identificacion'] ?? '');
            $profile = $studentProfiles[$identVariants[0] ?? ''] ?? [];

            return [
                'window_id' => (int) ($row['window_id'] ?? 0),
                'nombre' => $this->preferFilledText(
                    trim((string) ($row['nombre'] ?? '')),
                    trim((string) ($profile['nombres'] ?? ''))
                ),
                'apellido' => $this->preferFilledText(
                    trim((string) ($row['apellido'] ?? '')),
                    trim((string) ($profile['apellidos'] ?? ''))
                ),
                'identificacion' => trim((string) ($row['identificacion'] ?? '')),
                'codigo' => $this->preferFilledText(
                    trim((string) ($row['codigo'] ?? '')),
                    trim((string) ($profile['codigo'] ?? ''))
                ),
                'programa' => $this->preferFilledText(
                    trim((string) ($row['programa'] ?? '')),
                    trim((string) ($profile['programa'] ?? '')),
                    'Sin programa'
                ),
                'sexo' => $this->normalizeSeguimientoSex($this->preferSeguimientoSexo(
                    (string) ($row['sexo'] ?? ''),
                    (string) ($profile['sexo'] ?? '')
                )),
                'grupo_priorizado' => $this->preferFilledText(
                    trim((string) ($row['grupo_priorizado'] ?? '')),
                    trim((string) ($profile['grupo_priorizado'] ?? '')),
                    'NINGUNO'
                ),
                'codigo_materia' => trim((string) ($resolvedNote['ide_materia'] ?? '')),
                'materia' => trim((string) ($row['materia'] ?? '')) ?: 'Sin materia',
                'nota' => $resolvedNote['nota'],
                'estado' => $this->determineSeguimientoStatus($resolvedNote['nota']),
                'tutor_nombre' => trim((string) ($row['tutor_nombre'] ?? '')) ?: 'Tutor no definido',
                'sede' => $this->inferSeguimientoSede((string) ($row['programa'] ?? ($profile['programa'] ?? ''))),
                'semestre' => $semestre,
                'grupo' => $grupo !== '' ? $grupo : trim((string) ($row['grupo_nombre'] ?? '')),
                'anio' => $anio !== '' ? $anio : $defaultYear,
                'periodo' => $periodoValue !== '' ? $periodoValue : $defaultPeriod,
                'resolucion' => (string) ($meta['tutor_type'] ?? 'N/D'),
                'corte' => (string) ($meta['name'] ?? 'Corte desconocido'),
                'cut_number' => $meta['cut_number'] ?? null,
                'grade_stage' => (string) ($meta['grade_stage'] ?? ''),
                'window_label' => (string) ($meta['display_label'] ?? ($meta['name'] ?? 'Corte desconocido')),
            ];
        })
        ->sort(function (array $left, array $right) {
            return [
                $left['programa'],
                $left['materia'],
                $left['tutor_nombre'],
                $left['apellido'],
                $left['nombre'],
                $left['identificacion'],
                $left['resolucion'],
                $left['corte'],
            ] <=> [
                $right['programa'],
                $right['materia'],
                $right['tutor_nombre'],
                $right['apellido'],
                $right['nombre'],
                $right['identificacion'],
                $right['resolucion'],
                $right['corte'],
            ];
        })
        ->values()
        ->all();

    $beneficiaryMap = [];
    foreach ($detailRows as $row) {
        $beneficiaryKey = implode('|', [
            (int) ($row['window_id'] ?? 0),
            $this->seguimientoUniqueStudentKey($row),
            $this->normalizeChartText((string) ($row['programa'] ?? '')),
            $this->normalizeSubjectComparableText((string) ($row['materia'] ?? '')),
            $this->normalizeChartText((string) ($row['grupo'] ?? '')),
            $this->normalizeChartText((string) ($row['tutor_nombre'] ?? '')),
        ]);

        if (! isset($beneficiaryMap[$beneficiaryKey])) {
            $beneficiaryMap[$beneficiaryKey] = $row;
            continue;
        }

        foreach (['codigo_materia', 'codigo', 'sexo', 'grupo_priorizado', 'semestre', 'grupo', 'anio', 'periodo'] as $field) {
            if (trim((string) ($beneficiaryMap[$beneficiaryKey][$field] ?? '')) === '' && trim((string) ($row[$field] ?? '')) !== '') {
                $beneficiaryMap[$beneficiaryKey][$field] = $row[$field];
            }
        }

        if (($beneficiaryMap[$beneficiaryKey]['nota'] ?? null) === null && ($row['nota'] ?? null) !== null) {
            $beneficiaryMap[$beneficiaryKey]['nota'] = $row['nota'];
            $beneficiaryMap[$beneficiaryKey]['estado'] = $row['estado'];
        }
    }

    $beneficiaryRows = array_values($beneficiaryMap);
    usort($beneficiaryRows, function (array $left, array $right) {
        return [
            $left['resolucion'],
            $left['corte'],
            $left['programa'],
            $left['materia'],
            $left['apellido'],
            $left['nombre'],
            $left['identificacion'],
        ] <=> [
            $right['resolucion'],
            $right['corte'],
            $right['programa'],
            $right['materia'],
            $right['apellido'],
            $right['nombre'],
            $right['identificacion'],
        ];
    });

    $repeatedGeneralMap = [];
    foreach ($beneficiaryRows as $row) {
        $repeatedKey = implode('|', [
            $this->seguimientoUniqueStudentKey($row),
            $this->normalizeChartText((string) ($row['programa'] ?? '')),
            $this->normalizeSubjectComparableText((string) ($row['materia'] ?? '')),
            $this->normalizeChartText((string) ($row['grupo'] ?? '')),
            $this->normalizeChartText((string) ($row['tutor_nombre'] ?? '')),
        ]);

        if (! isset($repeatedGeneralMap[$repeatedKey])) {
            $repeatedGeneralMap[$repeatedKey] = [
                'codigo' => $row['codigo'],
                'apellido' => $row['apellido'],
                'nombre' => $row['nombre'],
                'identificacion' => $row['identificacion'],
                'sexo' => $row['sexo'],
                'grupo_priorizado' => $row['grupo_priorizado'],
                'programa' => $row['programa'],
                'materia' => $row['materia'],
                'sede' => $row['sede'],
                'semestre' => $row['semestre'],
                'grupo' => $row['grupo'],
                'anio' => $row['anio'],
                'periodo' => $row['periodo'],
                'tutor_nombre' => $row['tutor_nombre'],
                'codigo_materia' => $row['codigo_materia'],
                'resoluciones' => [],
                'cuts' => [],
            ];
        }

        foreach (['codigo', 'sexo', 'grupo_priorizado', 'programa', 'materia', 'sede', 'semestre', 'grupo', 'anio', 'periodo', 'tutor_nombre', 'codigo_materia'] as $field) {
            if (trim((string) ($repeatedGeneralMap[$repeatedKey][$field] ?? '')) === '' && trim((string) ($row[$field] ?? '')) !== '') {
                $repeatedGeneralMap[$repeatedKey][$field] = $row[$field];
            }
        }

        $cutNumber = (int) ($row['cut_number'] ?? 0);
        if ($cutNumber > 0) {
            $repeatedGeneralMap[$repeatedKey]['cuts'][$cutNumber] = true;
        }

        $resolution = strtoupper(trim((string) ($row['resolucion'] ?? '')));
        if ($resolution !== '') {
            $repeatedGeneralMap[$repeatedKey]['resoluciones'][$resolution] = true;
        }
    }

    $generalStudentMap = [];
    foreach ($beneficiaryRows as $row) {
        $studentKey = $this->seguimientoUniqueStudentKey($row);

        if (! isset($generalStudentMap[$studentKey])) {
            $generalStudentMap[$studentKey] = [
                'codigo' => $row['codigo'],
                'apellido' => $row['apellido'],
                'nombre' => $row['nombre'],
                'identificacion' => $row['identificacion'],
                'sexo' => $row['sexo'],
                'grupo_priorizado' => $row['grupo_priorizado'],
                'programa' => $row['programa'],
                'per_window' => [],
            ];
        }

        $windowId = (int) ($row['window_id'] ?? 0);
        $groupKey = (string) ($row['grade_stage'] ?: ('window_' . $windowId));
        if (! isset($generalStudentMap[$studentKey]['per_window'][$groupKey])) {
            $generalStudentMap[$studentKey]['per_window'][$groupKey] = [
                'beneficiado' => false,
                'notes' => [],
            ];
        }

        $generalStudentMap[$studentKey]['per_window'][$groupKey]['beneficiado'] = true;

        if (($row['nota'] ?? null) !== null) {
            $noteKey = number_format((float) $row['nota'], 4, '.', '');
            $generalStudentMap[$studentKey]['per_window'][$groupKey]['notes'][$noteKey] = (float) $row['nota'];
        }
    }

    $selectedGroupByCut = [];
    foreach ($selectedGroups as $group) {
        $cutNumber = (int) ($group['cut_number'] ?? 0);
        if ($cutNumber >= 1 && $cutNumber <= 3) {
            $selectedGroupByCut[$cutNumber] = $group;
        }
    }

    $generalHeaders = [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Identificación',
        'Beneficiados tutorías (1er corte)',
        'Beneficiados tutorías (2do corte)',
        'Beneficiados tutorías (3er corte)',
        'Sexo',
        'Grupos priorizados',
        'Programa',
    ];

    $generalRows = collect($generalStudentMap)
        ->map(function (array $row) use ($selectedGroupByCut) {
            $flags = [];
            for ($cutNumber = 1; $cutNumber <= 3; $cutNumber++) {
                $group = $selectedGroupByCut[$cutNumber] ?? null;
                $groupKey = is_array($group) ? (string) ($group['key'] ?? '') : '';
                $windowPayload = $groupKey !== '' ? ($row['per_window'][$groupKey] ?? null) : null;
                $flags[] = $windowPayload && ($windowPayload['beneficiado'] ?? false) ? 'X' : 'NO';
            }

            return array_merge([
                $row['codigo'],
                $row['apellido'],
                $row['nombre'],
                $row['identificacion'],
            ], $flags, [
                $row['sexo'],
                $row['grupo_priorizado'],
                $row['programa'],
            ]);
        })
        ->sort(function (array $left, array $right) {
            return [
                $left[count($left) - 1] ?? '',
                $left[1] ?? '',
                $left[2] ?? '',
                $left[3] ?? '',
            ] <=> [
                $right[count($right) - 1] ?? '',
                $right[1] ?? '',
                $right[2] ?? '',
                $right[3] ?? '',
            ];
        })
        ->values()
        ->all();

    $generalRepeatedRows = collect($repeatedGeneralMap)
        ->map(function (array $row) {
            $flags = [];
            for ($cutNumber = 1; $cutNumber <= 3; $cutNumber++) {
                $flags[] = ! empty($row['cuts'][$cutNumber]) ? 'X' : 'NO';
            }

            return [
                'codigo' => $row['codigo'],
                'apellido' => $row['apellido'],
                'nombre' => $row['nombre'],
                'identificacion' => $row['identificacion'],
                'flags' => $flags,
                'sexo' => $row['sexo'],
                'grupo_priorizado' => $row['grupo_priorizado'],
                'programa' => $row['programa'],
                'materia' => $row['materia'],
                'sede' => $row['sede'],
                'semestre' => $row['semestre'],
                'grupo' => $row['grupo'],
                'anio' => $row['anio'],
                'periodo' => $row['periodo'],
                'tutor_nombre' => $row['tutor_nombre'],
                'codigo_materia' => $row['codigo_materia'],
                'resoluciones' => implode(', ', array_keys($row['resoluciones'] ?? [])),
            ];
        })
        ->sort(function (array $left, array $right) {
            return [
                $left['programa'],
                $left['materia'],
                $left['apellido'],
                $left['nombre'],
                $left['identificacion'],
            ] <=> [
                $right['programa'],
                $right['materia'],
                $right['apellido'],
                $right['nombre'],
                $right['identificacion'],
            ];
        })
        ->values()
        ->all();

    $windowNoteSheets = [];
    foreach ($selectedGroups as $meta) {
        $windowIdLookup = array_fill_keys(array_map('intval', $meta['window_ids'] ?? []), true);
        $rows = array_values(array_filter(
            $beneficiaryRows,
            fn (array $row) => isset($windowIdLookup[(int) ($row['window_id'] ?? 0)])
        ));

        usort($rows, function (array $left, array $right) {
            return [
                $left['programa'],
                $left['materia'],
                $left['apellido'],
                $left['nombre'],
                $left['identificacion'],
            ] <=> [
                $right['programa'],
                $right['materia'],
                $right['apellido'],
                $right['nombre'],
                $right['identificacion'],
            ];
        });

        $windowNoteSheets[] = [
            'title' => $meta['sheet_title'],
            'note_header' => $meta['note_header'],
            'cut_number' => (int) ($meta['cut_number'] ?? 0),
            'grade_stage' => (string) ($meta['grade_stage'] ?? ''),
            'rows' => array_map(function (array $row) {
                return [
                    $row['codigo'],
                    $row['apellido'],
                    $row['nombre'],
                    $row['identificacion'],
                    $row['nota'],
                    $row['sexo'],
                    $row['grupo_priorizado'],
                    $row['programa'],
                    $row['materia'],
                    $row['sede'],
                    $row['semestre'],
                    $row['grupo'],
                    $row['anio'],
                    $row['periodo'],
                    $row['resolucion'],
                ];
            }, $rows),
        ];
    }

    $statusCounts = [];
    $programSubjectCounts = [];
    $programUniqueCounts = [];
    $sexoCounts = [];
    $grupoCounts = [];
    $uniqueMap = [];

    foreach ($detailRows as $row) {
        $status = (string) ($row['estado'] ?: 'SIN NOTA');
        $statusCounts[$status] = (int) ($statusCounts[$status] ?? 0) + 1;

        $program = (string) $row['programa'];
        $subject = (string) $row['materia'];
        if (! isset($programSubjectCounts[$program])) {
            $programSubjectCounts[$program] = [
                'total' => 0,
                'subjects' => [],
            ];
        }
        $programSubjectCounts[$program]['total']++;
        $programSubjectCounts[$program]['subjects'][$subject] = (int) ($programSubjectCounts[$program]['subjects'][$subject] ?? 0) + 1;

        $studentKey = $this->seguimientoUniqueStudentKey($row);
        if (! isset($uniqueMap[$studentKey])) {
            $uniqueMap[$studentKey] = [
                'nombre' => $row['nombre'],
                'apellido' => $row['apellido'],
                'identificacion' => $row['identificacion'],
                'codigo' => $row['codigo'],
                'programa' => $row['programa'],
                'sexo' => $row['sexo'],
                'grupo_priorizado' => $row['grupo_priorizado'],
                'sede' => $row['sede'],
                'semestre' => $row['semestre'],
                'grupo' => $row['grupo'],
                'anio' => $row['anio'],
                'periodo' => $row['periodo'],
                'resolutions' => [],
                'cuts' => [],
            ];
        }

        if ($uniqueMap[$studentKey]['semestre'] === '' && $row['semestre'] !== '') {
            $uniqueMap[$studentKey]['semestre'] = $row['semestre'];
        }
        if ($uniqueMap[$studentKey]['grupo'] === '' && $row['grupo'] !== '') {
            $uniqueMap[$studentKey]['grupo'] = $row['grupo'];
        }
        if ($uniqueMap[$studentKey]['anio'] === '' && $row['anio'] !== '') {
            $uniqueMap[$studentKey]['anio'] = $row['anio'];
        }
        if ($uniqueMap[$studentKey]['periodo'] === '' && $row['periodo'] !== '') {
            $uniqueMap[$studentKey]['periodo'] = $row['periodo'];
        }

        $uniqueMap[$studentKey]['resolutions'][$row['resolucion']] = true;
        $uniqueMap[$studentKey]['cuts'][$row['corte']] = true;
    }

    $uniqueRows = collect($uniqueMap)
        ->map(function (array $row) {
            ksort($row['resolutions']);
            ksort($row['cuts']);

            return [
                'nombre' => $row['nombre'],
                'apellido' => $row['apellido'],
                'identificacion' => $row['identificacion'],
                'codigo' => $row['codigo'],
                'programa' => $row['programa'],
                'sexo' => $row['sexo'],
                'grupo_priorizado' => $row['grupo_priorizado'],
                'sede' => $row['sede'],
                'semestre' => $row['semestre'],
                'grupo' => $row['grupo'],
                'anio' => $row['anio'],
                'periodo' => $row['periodo'],
                'resoluciones' => implode(', ', array_keys($row['resolutions'])),
                'cortes' => implode(' | ', array_keys($row['cuts'])),
            ];
        })
        ->sort(function (array $left, array $right) {
            return [
                $left['programa'],
                $left['apellido'],
                $left['nombre'],
                $left['identificacion'],
            ] <=> [
                $right['programa'],
                $right['apellido'],
                $right['nombre'],
                $right['identificacion'],
            ];
        })
        ->values()
        ->all();

    foreach ($uniqueRows as $row) {
        $program = (string) $row['programa'];
        $programUniqueCounts[$program] = (int) ($programUniqueCounts[$program] ?? 0) + 1;

        $sexo = trim((string) ($row['sexo'] ?? '')) ?: 'SIN DATO';
        $sexoCounts[$sexo] = (int) ($sexoCounts[$sexo] ?? 0) + 1;

        $group = trim((string) ($row['grupo_priorizado'] ?? '')) ?: 'NINGUNO';
        $grupoCounts[$group] = (int) ($grupoCounts[$group] ?? 0) + 1;
    }

    ksort($statusCounts);
    ksort($programSubjectCounts);
    ksort($programUniqueCounts);
    ksort($sexoCounts);
    ksort($grupoCounts);

    $programSubjectRows = [];
    foreach ($programSubjectCounts as $program => $payload) {
        $programSubjectRows[] = [
            'label' => $program,
            'count' => (int) ($payload['total'] ?? 0),
            'type' => 'program',
        ];

        $subjects = $payload['subjects'] ?? [];
        ksort($subjects);
        foreach ($subjects as $subject => $count) {
            $programSubjectRows[] = [
                'label' => '   ' . $subject,
                'count' => (int) $count,
                'type' => 'subject',
            ];
        }
    }

    $selectedCutNumbers = array_values(array_unique(array_filter(array_map(
        fn ($meta) => (int) ($meta['cut_number'] ?? 0),
        array_values($windowMeta)
    ))));
    sort($selectedCutNumbers);

    $singleCut = count($selectedCutNumbers) === 1 ? (int) $selectedCutNumbers[0] : null;
    $gradeStage = match ($singleCut) {
        1 => 'nota_1',
        2 => 'nota_2',
        3 => 'nota_3',
        default => null,
    };
    $sheetTag = $singleCut ? "{$singleCut}CORTE" : 'SELECCION';
    $notesTag = $singleCut ? "{$singleCut}C" : 'SEL';
    $cutOrdinal = match ($singleCut) {
        1 => '1er',
        2 => '2do',
        3 => '3er',
        default => null,
    };
    $noteHeader = $cutOrdinal !== null
        ? "Notas {$cutOrdinal} corte"
        : 'Nota asociada';

    return [
        'repeated_rows' => $detailRows,
        'beneficiary_rows' => $beneficiaryRows,
        'general_repeated_rows' => $generalRepeatedRows,
        'unique_rows' => $uniqueRows,
        'general_headers' => $generalHeaders,
        'general_rows' => $generalRows,
        'window_note_sheets' => $windowNoteSheets,
        'selected_groups' => $selectedGroups,
        'notes_rows' => array_map(function (array $row) {
            return [
                'codigo' => $row['codigo'] ?? '',
                'apellidos' => $row['apellidos'] ?? '',
                'nombres' => $row['nombres'] ?? '',
                'tipo_identificacion' => $row['tipo_identificacion'] ?? '',
                'identificacion' => $row['identificacion'] ?? '',
                'ide_programa' => $row['ide_programa'] ?? '',
                'programa' => $row['programa'] ?? '',
                'semestre' => $row['semestre'] ?? '',
                'ide_materia' => $row['ide_materia'] ?? '',
                'materia' => $row['materia'] ?? '',
                'grupo' => $row['grupo'] ?? '',
                'nota_1' => $row['nota_1'] ?? null,
                'nota_2' => $row['nota_2'] ?? null,
                'nota_3' => $row['nota_3'] ?? null,
                'habilitacion' => $row['habilitacion'] ?? null,
                'definitiva' => $row['definitiva'] ?? null,
                'final' => $row['final'] ?? null,
                'anio' => $row['anio'] ?? '',
                'periodo' => $row['periodo'] ?? '',
            ];
        }, $notesRows),
        'status_counts' => $statusCounts,
        'program_subject_rows' => $programSubjectRows,
        'program_unique_counts' => $programUniqueCounts,
        'sexo_unique_counts' => $sexoCounts,
        'grupo_unique_counts' => $grupoCounts,
        'repeated_sheet_title' => "BENEFICIADOS {$sheetTag}",
        'general_sheet_title' => "GENERAL {$sheetTag}",
        'unique_sheet_title' => $singleCut ? "DETALLE {$sheetTag}" : 'DETALLE',
        'notes_sheet_title' => "NOTAS {$notesTag}",
        'note_header' => $noteHeader,
        'grade_stage' => $gradeStage,
        'file_suffix' => $this->buildSeguimientoFileSuffix($windows, $gradeStage),
    ];
}

private function buildSeguimientoNoteMatchMaps(array $notesRows): array
{
    return app(StudentNoteMatchingService::class)->buildNoteMaps($notesRows);
}

private function resolveSeguimientoNoteForDetailRow(array $detailRow, array $noteMaps, int $cutNumber = 0): array
{
    $candidateRows = app(StudentNoteMatchingService::class)->resolveBestMatches(
        $detailRow,
        $noteMaps,
        (string) ($detailRow['grupo'] ?? $detailRow['grupo_nombre'] ?? '')
    );

    $matched = array_values($candidateRows);
    $meta = $matched[0] ?? [];
    $nota = $this->resolveSeguimientoNumericNote($matched, $cutNumber);

    return [
        'nota' => $nota,
        'ide_materia' => trim((string) ($meta['ide_materia'] ?? '')),
        'semestre' => trim((string) ($meta['semestre'] ?? '')),
        'grupo' => trim((string) ($meta['grupo'] ?? '')),
        'anio' => trim((string) ($meta['anio'] ?? '')),
        'periodo' => trim((string) ($meta['periodo'] ?? '')),
    ];
}

private function resolveSeguimientoNumericNote(array $matchedRows, int $cutNumber = 0): ?float
{
    $values = [];

    foreach ($matchedRows as $row) {
        $value = $this->extractSeguimientoNoteValue($row, $cutNumber);
        if ($value === null) {
            continue;
        }

        $values[number_format($value, 6, '.', '')] = $value;
    }

    if ($values === []) {
        return null;
    }

    return (float) (array_sum($values) / count($values));
}

private function extractSeguimientoNoteValue(array $row, int $cutNumber = 0): ?float
{
    $fieldOrder = match ($cutNumber) {
        1 => ['nota_1', 'final', 'definitiva', 'nota_2', 'nota_3'],
        2 => ['nota_2', 'final', 'definitiva', 'nota_1', 'nota_3'],
        3 => ['nota_3', 'final', 'definitiva', 'nota_2', 'nota_1'],
        default => ['final', 'definitiva', 'nota_3', 'nota_2', 'nota_1'],
    };

    foreach ($fieldOrder as $field) {
        $value = $row[$field] ?? null;
        if ($value === null || $value === '') {
            continue;
        }

        return (float) $value;
    }

    return null;
}

private function determineSeguimientoStatus(?float $note): string
{
    if ($note === null) {
        return 'SIN NOTA';
    }

    if (abs($note) < 0.000001) {
        return 'CERO';
    }

    return $note >= 3.0 ? 'APROBADO' : 'REPROBADO';
}

private function seguimientoUniqueStudentKey(array $row): string
{
    $identificacion = trim((string) ($row['identificacion'] ?? ''));
    if ($identificacion !== '') {
        return 'ID:' . $identificacion;
    }

    $codigo = trim((string) ($row['codigo'] ?? ''));
    if ($codigo !== '') {
        return 'COD:' . $codigo;
    }

    return 'NAME:' . $this->normalizeChartText(($row['nombre'] ?? '') . ' ' . ($row['apellido'] ?? ''));
}

private function inferWindowCutNumberFromName(string $name): ?int
{
    $normalized = $this->normalizeChartText($name);

    if ($normalized === '') {
        return null;
    }

    if (
        str_contains($normalized, 'primer') ||
        str_contains($normalized, '1er') ||
        str_contains($normalized, 'corte 1') ||
        str_contains($normalized, 'informe 1')
    ) {
        return 1;
    }

    if (
        str_contains($normalized, 'segundo') ||
        str_contains($normalized, '2do') ||
        str_contains($normalized, 'corte 2') ||
        str_contains($normalized, 'informe 2')
    ) {
        return 2;
    }

    if (
        str_contains($normalized, 'tercer') ||
        str_contains($normalized, 'tercero') ||
        str_contains($normalized, '3er') ||
        str_contains($normalized, 'corte 3') ||
        str_contains($normalized, 'informe 3')
    ) {
        return 3;
    }

    return null;
}

private function inferWindowCutNumberFromWindow($window): ?int
{
    $category = Str::of((string) ($window->category ?? ''))->lower()->trim()->value();

    return match ($category) {
        'corte_1' => 1,
        'corte_2' => 2,
        'corte_3' => 3,
        default => $this->inferWindowCutNumberFromName((string) ($window->name ?? '')),
    };
}

private function inferWindowGradeStageFromName(string $name): ?string
{
    $normalized = $this->normalizeChartText($name);

    if ($normalized === '') {
        return null;
    }

    if (str_contains($normalized, 'habilit')) {
        return 'habilitacion';
    }

    if (str_contains($normalized, 'definitiv')) {
        return 'definitiva';
    }

    if (str_contains($normalized, 'final')) {
        return 'final';
    }

    return match ($this->inferWindowCutNumberFromName($name)) {
        1 => 'nota_1',
        2 => 'nota_2',
        3 => 'nota_3',
        default => null,
    };
}

private function inferWindowGradeStageFromWindow($window): ?string
{
    $category = Str::of((string) ($window->category ?? ''))->lower()->trim()->value();

    return match ($category) {
        'corte_1' => 'nota_1',
        'corte_2' => 'nota_2',
        'corte_3' => 'nota_3',
        'habilitacion' => 'habilitacion',
        'final' => 'final',
        default => $this->inferWindowGradeStageFromName((string) ($window->name ?? '')),
    };
}

private function buildSeguimientoWindowDisplayLabel(
    string $name,
    string $resolution,
    ?int $cutNumber = null,
    ?string $gradeStage = null
): string {
    $stageLabel = match ($gradeStage) {
        'nota_1' => '1er corte',
        'nota_2' => '2do corte',
        'nota_3' => '3er corte',
        'habilitacion' => 'Habilitación',
        'final' => 'Final',
        'definitiva' => 'Definitiva',
        default => trim($name) !== '' ? trim($name) : ($cutNumber ? "{$cutNumber} corte" : 'Corte'),
    };

    $resolutionLabel = strtoupper(trim($resolution));

    return $resolutionLabel !== ''
        ? "{$stageLabel} · {$resolutionLabel}"
        : $stageLabel;
}

private function buildSeguimientoWindowNoteHeaderLabel(?string $gradeStage, string $resolution): string
{
    $base = match ($gradeStage) {
        'nota_1' => 'Notas 1er corte',
        'nota_2' => 'Notas 2do corte',
        'nota_3' => 'Notas 3er corte',
        'habilitacion' => 'Habilitación',
        'final' => 'Final',
        'definitiva' => 'Definitiva',
        default => 'Nota asociada',
    };

    $resolutionLabel = strtoupper(trim($resolution));

    return $resolutionLabel !== '' ? "{$base} {$resolutionLabel}" : $base;
}

private function buildSeguimientoWindowDataSheetTitle(?string $gradeStage, string $resolution, string $name, int $windowId): string
{
    $base = match ($gradeStage) {
        'nota_1' => '1ER CORTE',
        'nota_2' => '2DO CORTE',
        'nota_3' => '3ER CORTE',
        'habilitacion' => 'HABILITACION',
        'final' => 'FINAL',
        'definitiva' => 'DEFINITIVA',
        default => Str::of($name)->ascii()->upper()->replace(['/', '\\'], ' ')->squish()->limit(18, '')->value(),
    };

    $resolutionLabel = strtoupper(trim($resolution)) ?: 'ND';

    return trim("{$resolutionLabel} {$base} {$windowId}");
}

private function buildSeguimientoGroupSheetTitle(
    ?string $gradeStage,
    ?int $cutNumber,
    string $fallbackName,
    bool $preferCompact = true
): string {
    return match ($gradeStage) {
        'nota_1' => $preferCompact ? '1ER CORTE' : 'PRIMER CORTE',
        'nota_2' => $preferCompact ? '2DO CORTE' : 'SEGUNDO CORTE',
        'nota_3' => $preferCompact ? '3ER CORTE' : 'TERCER CORTE',
        'habilitacion' => 'HABILITACION',
        'final' => 'FINAL',
        'definitiva' => 'DEFINITIVA',
        default => $cutNumber ? ($cutNumber . ' CORTE') : (Str::of($fallbackName)->ascii()->upper()->replace(['/', '\\'], ' ')->squish()->limit(24, '')->value() ?: 'CORTE'),
    };
}

private function pickBestSeguimientoRowsBySubject(array $rows, string $targetSubject): array
{
    $rows = array_values(array_reduce($rows, function (array $carry, array $row) {
        $key = trim((string) ($row['id'] ?? ''));
        if ($key === '') {
            $key = md5(json_encode($row));
        }
        $carry[$key] = $row;
        return $carry;
    }, []));

    if ($rows === []) {
        return [];
    }

    $target = $this->normalizeSubjectComparableText($targetSubject);
    if ($target === '') {
        return $rows;
    }

    $scored = [];
    foreach ($rows as $row) {
        $subject = $this->normalizeSubjectComparableText($row['materia'] ?? '');
        $score = $this->subjectSimilarity($target, $subject);
        if ($score <= 0) {
            continue;
        }

        $scored[] = [
            'row' => $row,
            'score' => $score,
        ];
    }

    if ($scored === []) {
        return [];
    }

    usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
    $best = $scored[0]['score'];
    if ($best < 0.72) {
        return [];
    }

    return array_values(array_map(
        fn ($item) => $item['row'],
        array_filter($scored, fn ($item) => (($best - $item['score']) <= 0.03))
    ));
}

private function parseAcademicPeriodCode(string $code): array
{
    if (preg_match('/(\d{4})\D+(\d+)/', $code, $matches)) {
        return [
            trim((string) ($matches[1] ?? '')),
            trim((string) ($matches[2] ?? '')),
        ];
    }

    return ['', ''];
}

private function inferSeguimientoSede(string $program): string
{
    $normalized = Str::of($program)->ascii()->upper()->value();

    foreach (['MAICAO', 'RIOHACHA', 'FONSECA', 'VILLANUEVA'] as $sede) {
        if (str_contains($normalized, $sede)) {
            return $sede;
        }
    }

    return '';
}

private function normalizeSeguimientoSex(string $value): string
{
    $normalized = Str::of($value)->ascii()->upper()->trim()->value();

    return match ($normalized) {
        'F', 'FEMENINO' => 'FEMENINO',
        'M', 'MASCULINO' => 'MASCULINO',
        default => $normalized !== '' ? $normalized : 'SIN DATO',
    };
}

private function preferFilledText(string $primary, string $fallback, string $default = ''): string
{
    $primaryText = trim($primary);
    if ($primaryText !== '') {
        return $primaryText;
    }

    $fallbackText = trim($fallback);
    if ($fallbackText !== '') {
        return $fallbackText;
    }

    return $default;
}

private function preferSeguimientoSexo(string $primary, string $fallback): string
{
    $primaryText = trim($primary);
    $primaryNorm = Str::of($primaryText)->ascii()->upper()->trim()->value();
    if ($primaryNorm !== '' && ! in_array($primaryNorm, ['OTRO', 'OTRA'], true)) {
        return $primaryText;
    }

    $fallbackText = trim($fallback);
    if ($fallbackText !== '') {
        return $fallbackText;
    }

    return $primaryText;
}

private function buildSeguimientoFileSuffix($windows, ?string $singleStage = null): string
{
    $resolutionSummary = collect($windows)
        ->pluck('tutor_type')
        ->map(fn ($type) => strtoupper((string) $type))
        ->unique()
        ->values()
        ->implode('-');

    $stageTag = $this->seguimientoStageFileTag($singleStage);

    if ($stageTag !== 'SELECCION') {
        return trim("{$stageTag}_{$resolutionSummary}", '_');
    }

    return trim('SELECCION_' . $resolutionSummary, '_');
}

private function buildSeguimientoStudentSummaryMaps(array $notesRows): array
{
    $maps = [
        'identificacion' => [],
        'codigo' => [],
        'full_name' => [],
        'nombres' => [],
        'apellidos' => [],
    ];

    foreach ($notesRows as $row) {
        $keys = [
            'identificacion' => trim((string) ($row['identificacion'] ?? '')),
            'codigo' => trim((string) ($row['codigo'] ?? '')),
            'full_name' => $this->normalizeChartText(trim((string) ($row['nombres'] ?? '')) . ' ' . trim((string) ($row['apellidos'] ?? ''))),
            'nombres' => $this->normalizeChartText((string) ($row['nombres'] ?? '')),
            'apellidos' => $this->normalizeChartText((string) ($row['apellidos'] ?? '')),
        ];

        foreach ($keys as $type => $key) {
            if ($key === '') {
                continue;
            }

            $this->pushSeguimientoStudentSummaryCandidate($maps[$type], $key, $row);
        }
    }

    foreach ($maps as $type => $bucket) {
        foreach ($bucket as $key => $values) {
            $maps[$type][$key] = $this->finalizeSeguimientoStudentSummaryBucket($values);
        }
    }

    return $maps;
}

private function pushSeguimientoStudentSummaryCandidate(array &$bucket, string $key, array $row): void
{
    if (! isset($bucket[$key])) {
        $bucket[$key] = [
            'nota_1' => [],
            'nota_2' => [],
            'nota_3' => [],
            'habilitacion' => [],
            'definitiva' => [],
            'final' => [],
        ];
    }

    foreach (array_keys($bucket[$key]) as $field) {
        $value = $row[$field] ?? null;
        if ($value === null || $value === '' || ! is_numeric($value)) {
            continue;
        }

        $bucket[$key][$field][number_format((float) $value, 6, '.', '')] = (float) $value;
    }
}

private function finalizeSeguimientoStudentSummaryBucket(array $bucket): array
{
    $summary = [];

    foreach ($bucket as $field => $values) {
        $summary[$field] = $values === []
            ? null
            : round(array_sum($values) / count($values), 2);
    }

    return $summary;
}

private function resolveSeguimientoStudentSummary(array $row, array $maps): array
{
    $identificacion = trim((string) ($row['identificacion'] ?? ''));
    if ($identificacion !== '' && isset($maps['identificacion'][$identificacion])) {
        return $maps['identificacion'][$identificacion];
    }

    $codigo = trim((string) ($row['codigo'] ?? ''));
    if ($codigo !== '' && isset($maps['codigo'][$codigo])) {
        return $maps['codigo'][$codigo];
    }

    $fullName = $this->normalizeChartText(trim((string) ($row['nombre'] ?? '')) . ' ' . trim((string) ($row['apellido'] ?? '')));
    if ($fullName !== '' && isset($maps['full_name'][$fullName])) {
        return $maps['full_name'][$fullName];
    }

    $nombres = $this->normalizeChartText((string) ($row['nombre'] ?? ''));
    if ($nombres !== '' && isset($maps['nombres'][$nombres])) {
        return $maps['nombres'][$nombres];
    }

    $apellidos = $this->normalizeChartText((string) ($row['apellido'] ?? ''));
    if ($apellidos !== '' && isset($maps['apellidos'][$apellidos])) {
        return $maps['apellidos'][$apellidos];
    }

    return [];
}

private function exportChartsExcelUsingWorkbookTemplate(array $export, string $filename)
{
    if (! $this->canUseSeguimientoWorkbookTemplate($export)) {
        return null;
    }

    try {
        $template = IOFactory::load($this->seguimientoWorkbookTemplatePath());
    } catch (\Throwable $exception) {
        Log::warning('seguimiento template export fallback', [
            'message' => $exception->getMessage(),
        ]);

        return null;
    }

    $spreadsheet = $template;

    $beneficiarySheet = $spreadsheet->getSheet(0);
    $beneficiaryStageLabels = collect($export['selected_groups'] ?? [])
        ->map(fn (array $group) => $this->buildSeguimientoGroupSheetTitle(
            (string) ($group['grade_stage'] ?? ''),
            (int) ($group['cut_number'] ?? 0) ?: null,
            '',
            true
        ))
        ->filter()
        ->unique()
        ->values()
        ->all();
    $beneficiaryHeaderLabel = count($beneficiaryStageLabels) === 1
        ? 'BENEFICIADOS TUTORIAS (' . strtoupper($beneficiaryStageLabels[0]) . ')'
        : 'BENEFICIADOS TUTORIAS';
    $beneficiarySheet->setTitle($this->safeSheetName('BENEFICIADOS ' . ($beneficiaryStageLabels[0] ?? 'CORTE')));
    $beneficiaryRows = $this->buildSeguimientoTemplateBeneficiaryRows(
        $export['beneficiary_rows'] ?? [],
        null
    );
    $this->fillSeguimientoTemplateSheet($beneficiarySheet, [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Tipo Identificacion',
        'Identificacion',
        'SEXO',
        'GRUPO PRIORIZADO',
        $beneficiaryHeaderLabel,
        'Ide Programa',
        'Programa',
        'Materia',
        'SEDE',
        'Semestre',
        'Ide Materia',
        'Grupo',
        'Año',
        'Periodo',
        'TUTORIA PLANIFICADA',
        'TUTORIA OCASIONAL',
        'Gano corte',
    ], $beneficiaryRows);

    $generalSheet = $spreadsheet->getSheet(1);
    $generalSheet->setTitle($this->safeSheetName('GENERAL'));
    $this->fillSeguimientoTemplateSheet($generalSheet, $export['general_headers'] ?? [], $export['general_rows'] ?? []);

    $windowSheetsByCut = [];
    foreach ($export['window_note_sheets'] as $windowSheetExport) {
        $windowSheetsByCut[(int) ($windowSheetExport['cut_number'] ?? 0)] = $windowSheetExport;
    }

    foreach ([3 => 4, 2 => 3, 1 => 2] as $cutNumber => $sheetIndex) {
        $sheet = $spreadsheet->getSheet($sheetIndex);
        $windowSheetExport = $windowSheetsByCut[$cutNumber] ?? null;

        if (! is_array($windowSheetExport)) {
            $spreadsheet->removeSheetByIndex($sheetIndex);
            continue;
        }

        $sheet->setTitle($this->safeSheetName((string) ($windowSheetExport['title'] ?? 'CORTE')));
        $rows = array_map(function (array $row) use ($cutNumber) {
            $base = [
                $row[0] ?? '',
                $row[1] ?? '',
                $row[2] ?? '',
                $row[3] ?? '',
                $row[4] ?? null,
            ];

            if ($cutNumber === 3) {
                $base[] = null;
            }

            return array_merge($base, [
                $row[5] ?? '',
                $row[6] ?? '',
                $row[7] ?? '',
                $row[8] ?? '',
                $row[9] ?? '',
                $row[10] ?? '',
                $row[11] ?? '',
                $row[12] ?? '',
                $row[13] ?? '',
                '',
                '',
                '',
            ]);
        }, $windowSheetExport['rows'] ?? []);
        $headers = $cutNumber === 3
            ? [
                'Codigo',
                'Apellidos',
                'Nombre',
                'Identificacion',
                (string) ($windowSheetExport['note_header'] ?? 'Nota'),
                'Definitiva',
                'Sexo',
                'Grupo priorizado',
                'Programa',
                'Materia',
                'Sede',
                'Semestre',
                'Grupo',
                'Año',
                'Periodo',
                'Ganadas',
                'En cero',
                'Perdidas',
            ]
            : [
                'Codigo',
                'Apellidos',
                'Nombre',
                'Identificacion',
                (string) ($windowSheetExport['note_header'] ?? 'Nota'),
                'Sexo',
                'Grupo priorizado',
                'Programa',
                'Materia',
                'Sede',
                'Semestre',
                'Grupo',
                'Año',
                'Periodo',
                'Ganadas',
                'En cero',
                'Perdidas',
            ];
        $this->fillSeguimientoTemplateSheet($sheet, $headers, $rows);
    }

    $notesSheet = new Worksheet($spreadsheet, $this->safeSheetName($export['notes_sheet_title']));
    $spreadsheet->addSheet($notesSheet);
    $this->fillSeguimientoTable($notesSheet, [
        'Codigo',
        'Apellidos',
        'Nombre',
        'Tipo Identificacion',
        'Identificacion',
        'Ide Programa',
        'Programa',
        'Semestre',
        'Ide Materia',
        'Materia',
        'Grupo',
        'Nota 1',
        'Nota 2',
        'Nota 3',
        'Habilitación',
        'Definitiva',
        'Final',
        'Año',
        'Periodo',
        'CLAVE IDE',
        'CLAVE MATERIA',
        'CLAVE CODIGO',
        'CLAVE NOMBRE',
        'CLAVE NOMBRES',
        'CLAVE APELLIDOS',
    ], array_map(function (array $row) {
        return [
            $row['codigo'] ?? '',
            $row['apellidos'] ?? '',
            $row['nombres'] ?? '',
            $row['tipo_identificacion'] ?? '',
            $row['identificacion'] ?? '',
            $row['ide_programa'] ?? '',
            $row['programa'] ?? '',
            $row['semestre'] ?? '',
            $row['ide_materia'] ?? '',
            $row['materia'] ?? '',
            $row['grupo'] ?? '',
            $row['nota_1'] ?? null,
            $row['nota_2'] ?? null,
            $row['nota_3'] ?? null,
            $row['habilitacion'] ?? null,
            $row['definitiva'] ?? null,
            $row['final'] ?? null,
            $row['anio'] ?? '',
            $row['periodo'] ?? '',
            '',
            '',
            '',
            '',
            '',
            '',
        ];
    }, $export['notes_rows'] ?? []), 'A1');
    foreach (['L', 'M', 'N', 'O', 'P', 'Q'] as $numericColumn) {
        $notesSheet->getStyle($numericColumn . '2:' . $numericColumn . max(2, count($export['notes_rows'] ?? []) + 1))
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }

    $notesLastRow = max(2, count($export['notes_rows'] ?? []) + 1);
    $this->populateSeguimientoNotesHelperColumns($notesSheet, $notesLastRow);
    $this->applySeguimientoGeneralSheetFormulas(
        $generalSheet,
        $export['notes_sheet_title'],
        $notesLastRow
    );

    foreach ($windowSheetsByCut as $cutNumber => $windowSheetExport) {
        $sheetIndex = match ((int) $cutNumber) {
            1 => 2,
            2 => 3,
            3 => 4,
            default => null,
        };

        if ($sheetIndex === null || $sheetIndex >= $spreadsheet->getSheetCount()) {
            continue;
        }

        $this->applySeguimientoTemplateWindowSheetFormulas(
            $spreadsheet->getSheet($sheetIndex),
            $export['notes_sheet_title'],
            $notesLastRow,
            (int) $cutNumber
        );
    }

    $writer = new Xlsx($spreadsheet);
    $writer->setPreCalculateFormulas(false);

    return $this->downloadSpreadsheetFile($spreadsheet, $writer, $filename);
}

private function canUseSeguimientoWorkbookTemplate(array $export): bool
{
    $templatePath = $this->seguimientoWorkbookTemplatePath();
    if (! is_file($templatePath)) {
        return false;
    }

    $groups = $export['selected_groups'] ?? [];
    if ($groups === []) {
        return false;
    }

    foreach ($groups as $group) {
        $stage = (string) ($group['grade_stage'] ?? '');
        if (! in_array($stage, ['nota_1', 'nota_2', 'nota_3'], true)) {
            return false;
        }
    }

    return true;
}

private function seguimientoWorkbookTemplatePath(): string
{
    return storage_path('app/templates/beneficiados_tutorias_por_corte_template.xlsx');
}

private function fillSeguimientoTemplateSheet(Worksheet $sheet, array $headers, array $rows): void
{
    $highestDataRow = $sheet->getHighestDataRow();
    if ($highestDataRow > 1) {
        $sheet->removeRow(2, $highestDataRow - 1);
    }

    $highestDataColumnIndex = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
    for ($columnIndex = 1; $columnIndex <= $highestDataColumnIndex; $columnIndex++) {
        $sheet->setCellValue(Coordinate::stringFromColumnIndex($columnIndex) . '1', null);
    }

    foreach ($headers as $index => $header) {
        $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
        $sheet->setCellValue($columnLetter . '1', $header);
        $sheet->getColumnDimension($columnLetter)->setVisible(true);
    }

    for ($columnIndex = count($headers) + 1; $columnIndex <= $highestDataColumnIndex; $columnIndex++) {
        $columnLetter = Coordinate::stringFromColumnIndex($columnIndex);
        $sheet->getColumnDimension($columnLetter)->setVisible(false);
    }

    if ($rows !== []) {
        $sheet->fromArray($rows, null, 'A2');
    }

    $lastColumn = Coordinate::stringFromColumnIndex(max(1, count($headers)));
    $lastRow = max(1, count($rows) + 1);
    $sheet->setAutoFilter('A1:' . $lastColumn . $lastRow);
}

private function buildSeguimientoTemplateBeneficiaryRows(array $rows, ?array $group = null): array
{
    $filtered = $rows;
    if (is_array($group)) {
        $windowIdLookup = array_fill_keys(array_map('intval', $group['window_ids'] ?? []), true);
        $filtered = array_values(array_filter(
            $rows,
            fn (array $row) => isset($windowIdLookup[(int) ($row['window_id'] ?? 0)])
        ));
    }

    usort($filtered, function (array $left, array $right) {
        return [
            $left['programa'],
            $left['materia'],
            $left['apellido'],
            $left['nombre'],
            $left['identificacion'],
        ] <=> [
            $right['programa'],
            $right['materia'],
            $right['apellido'],
            $right['nombre'],
            $right['identificacion'],
        ];
    });

    return array_map(function (array $row) {
        return [
            $row['codigo'] ?? '',
            $row['apellido'] ?? '',
            $row['nombre'] ?? '',
            '',
            $row['identificacion'] ?? '',
            $row['sexo'] ?? '',
            $row['grupo_priorizado'] ?? '',
            'X',
            '',
            $row['programa'] ?? '',
            $row['materia'] ?? '',
            $row['sede'] ?? '',
            $row['semestre'] ?? '',
            $row['codigo_materia'] ?? '',
            $row['grupo'] ?? '',
            $row['anio'] ?? '',
            $row['periodo'] ?? '',
            (($row['origen'] ?? '') === 'NORMAL') ? 'X' : '',
            (($row['origen'] ?? '') === 'OCASIONAL') ? 'X' : '',
            '',
        ];
    }, $filtered);
}

private function seguimientoStageLabel(?string $stage): string
{
    return match ($stage) {
        'nota_1' => 'Corte 1',
        'nota_2' => 'Corte 2',
        'nota_3' => 'Corte 3',
        'habilitacion' => 'Habilitación',
        'definitiva' => 'Definitiva',
        'final' => 'Nota final',
        default => 'Sin etapa definida',
    };
}

private function seguimientoStageNoteHeader(?string $stage): string
{
    return match ($stage) {
        'nota_1' => 'Notas 1er corte',
        'nota_2' => 'Notas 2do corte',
        'nota_3' => 'Notas 3er corte',
        'habilitacion' => 'Nota habilitación',
        'definitiva' => 'Definitiva',
        'final' => 'Nota final',
        default => 'Nota asociada',
    };
}

private function seguimientoStageSheetTag(?string $stage): string
{
    return match ($stage) {
        'nota_1' => '1CORTE',
        'nota_2' => '2CORTE',
        'nota_3' => '3CORTE',
        'habilitacion' => 'HABILITACION',
        'definitiva' => 'DEFINITIVA',
        'final' => 'FINAL',
        default => 'SELECCION',
    };
}

private function seguimientoStageNotesTag(?string $stage): string
{
    return match ($stage) {
        'nota_1' => '1C',
        'nota_2' => '2C',
        'nota_3' => '3C',
        'habilitacion' => 'HAB',
        'definitiva' => 'DEF',
        'final' => 'FINAL',
        default => 'SEL',
    };
}

private function seguimientoUniqueSheetTitle(?string $stage): string
{
    return match ($stage) {
        'nota_1' => 'CORTE1 SIN REP',
        'nota_2' => 'CORTE2 SIN REP',
        'nota_3' => 'CORTE3 SIN REP',
        'habilitacion' => 'HABILITACION SIN REP',
        'definitiva' => 'DEFINITIVA SIN REP',
        'final' => 'FINAL SIN REP',
        default => 'SIN REPETICION',
    };
}

private function seguimientoStageFileTag(?string $stage): string
{
    return match ($stage) {
        'nota_1' => 'CORTE1',
        'nota_2' => 'CORTE2',
        'nota_3' => 'CORTE3',
        'habilitacion' => 'HABILITACION',
        'definitiva' => 'DEFINITIVA',
        'final' => 'FINAL',
        default => 'SELECCION',
    };
}

private function quoteExcelSheetName(string $sheetName): string
{
    return "'" . str_replace("'", "''", $sheetName) . "'";
}

private function buildSeguimientoAverageLookupFragment(string $valueRange, array $criteriaPairs): array
{
    $sumArgs = [$valueRange];
    $countArgs = [];

    foreach ($criteriaPairs as [$range, $criterion]) {
        $sumArgs[] = $range;
        $sumArgs[] = $criterion;
        $countArgs[] = $range;
        $countArgs[] = $criterion;
    }

    $countArgs[] = $valueRange;
    $countArgs[] = '"<>"';

    return [
        'count' => 'COUNTIFS(' . implode(',', $countArgs) . ')',
        'value' => 'SUMIFS(' . implode(',', $sumArgs) . ')',
    ];
}

private function buildSeguimientoNoteLookupFormula(string $notesSheetTitle, int $row, string $notesValueColumn, int $notesLastRow): string
{
    $sheet = $this->quoteExcelSheetName($notesSheetTitle);
    $range = fn (string $column) => sprintf('%s!$%s$2:$%s$%d', $sheet, $column, $column, $notesLastRow);
    $valueRange = $range($notesValueColumn);
    $keyIdeRange = $range('T');
    $keyMateriaRange = $range('U');
    $keyCodigoRange = $range('V');
    $keyFullNameRange = $range('W');
    $keyNamesRange = $range('X');
    $keyLastNamesRange = $range('Y');

    $keyIdeCell = '$Z' . $row;
    $keyMateriaCell = '$AA' . $row;
    $keyCodigoCell = '$AB' . $row;
    $keyFullNameCell = '$AC' . $row;
    $keyNamesCell = '$AD' . $row;
    $keyLastNamesCell = '$AE' . $row;

    $fallbackByLastNames = 'IF(' . $keyLastNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyLastNamesCell . '&"*",' . $keyLastNamesRange . ',0)),"")' .
    ',"")';

    $fallbackByNames = 'IF(' . $keyNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyNamesCell . '&"*",' . $keyNamesRange . ',0)),' . $fallbackByLastNames . ')' .
    ',' . $fallbackByLastNames . ')';

    $fallbackByFullName = 'IF(' . $keyFullNameCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyFullNameCell . '&"*",' . $keyFullNameRange . ',0)),' . $fallbackByNames . ')' .
    ',' . $fallbackByNames . ')';

    $fallbackByCode = 'IF(' . $keyCodigoCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyCodigoCell . ',' . $keyCodigoRange . ',0)),' . $fallbackByFullName . ')' .
    ',' . $fallbackByFullName . ')';

    $fallbackBySubject = 'IF(' . $keyMateriaCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyMateriaCell . ',' . $keyMateriaRange . ',0)),' . $fallbackByCode . ')' .
    ',' . $fallbackByCode . ')';

    return '=IF(' . $keyIdeCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyIdeCell . ',' . $keyIdeRange . ',0)),' . $fallbackBySubject . ')' .
    ',' . $fallbackBySubject . ')';
}

private function buildSeguimientoRepeatedNoteLookupFormula(
    string $notesSheetTitle,
    int $row,
    string $notesValueColumn,
    int $notesLastRow
): string {
    $sheet = $this->quoteExcelSheetName($notesSheetTitle);
    $range = fn (string $column) => sprintf('%s!$%s$2:$%s$%d', $sheet, $column, $column, $notesLastRow);
    $valueRange = $range($notesValueColumn);
    $keyIdeRange = $range('T');
    $keyMateriaRange = $range('U');
    $keyCodigoRange = $range('V');
    $keyFullNameRange = $range('W');
    $keyNamesRange = $range('X');
    $keyLastNamesRange = $range('Y');

    $keyIdeCell = '$Y' . $row;
    $keyMateriaCell = '$Z' . $row;
    $keyCodigoCell = '$AA' . $row;
    $keyFullNameCell = '$AB' . $row;
    $keyNamesCell = '$AC' . $row;
    $keyLastNamesCell = '$AD' . $row;

    $fallbackByLastNames = 'IF(' . $keyLastNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyLastNamesCell . '&"*",' . $keyLastNamesRange . ',0)),"")' .
    ',"")';

    $fallbackByNames = 'IF(' . $keyNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyNamesCell . '&"*",' . $keyNamesRange . ',0)),' . $fallbackByLastNames . ')' .
    ',' . $fallbackByLastNames . ')';

    $fallbackByFullName = 'IF(' . $keyFullNameCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyFullNameCell . '&"*",' . $keyFullNameRange . ',0)),' . $fallbackByNames . ')' .
    ',' . $fallbackByNames . ')';

    $fallbackByCode = 'IF(' . $keyCodigoCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyCodigoCell . ',' . $keyCodigoRange . ',0)),' . $fallbackByFullName . ')' .
    ',' . $fallbackByFullName . ')';

    $fallbackBySubject = 'IF(' . $keyMateriaCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyMateriaCell . ',' . $keyMateriaRange . ',0)),' . $fallbackByCode . ')' .
    ',' . $fallbackByCode . ')';

    return '=IF(' . $keyIdeCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyIdeCell . ',' . $keyIdeRange . ',0)),' . $fallbackBySubject . ')' .
    ',' . $fallbackBySubject . ')';
}

private function buildSeguimientoTemplateNoteLookupFormula(
    string $notesSheetTitle,
    int $row,
    string $notesValueColumn,
    int $notesLastRow,
    array $helperColumns = ['R', 'S', 'T', 'U', 'V']
): string {
    $sheet = $this->quoteExcelSheetName($notesSheetTitle);
    $range = fn (string $column) => sprintf('%s!$%s$2:$%s$%d', $sheet, $column, $column, $notesLastRow);
    $valueRange = $range($notesValueColumn);
    $keyMateriaRange = $range('U');
    $keyCodigoRange = $range('V');
    $keyFullNameRange = $range('W');
    $keyNamesRange = $range('X');
    $keyLastNamesRange = $range('Y');

    [$helperMateria, $helperCodigo, $helperFullName, $helperNames, $helperLastNames] = $helperColumns;
    $keyMateriaCell = '$' . $helperMateria . $row;
    $keyCodigoCell = '$' . $helperCodigo . $row;
    $keyFullNameCell = '$' . $helperFullName . $row;
    $keyNamesCell = '$' . $helperNames . $row;
    $keyLastNamesCell = '$' . $helperLastNames . $row;

    $fallbackByLastNames = 'IF(' . $keyLastNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyLastNamesCell . '&"*",' . $keyLastNamesRange . ',0)),"")' .
    ',"")';

    $fallbackByNames = 'IF(' . $keyNamesCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyNamesCell . '&"*",' . $keyNamesRange . ',0)),' . $fallbackByLastNames . ')' .
    ',' . $fallbackByLastNames . ')';

    $fallbackByFullName = 'IF(' . $keyFullNameCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH("*"&' . $keyFullNameCell . '&"*",' . $keyFullNameRange . ',0)),' . $fallbackByNames . ')' .
    ',' . $fallbackByNames . ')';

    $fallbackByCode = 'IF(' . $keyCodigoCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyCodigoCell . ',' . $keyCodigoRange . ',0)),' . $fallbackByFullName . ')' .
    ',' . $fallbackByFullName . ')';

    return '=IF(' . $keyMateriaCell . '<>"",' .
        'IFERROR(INDEX(' . $valueRange . ',MATCH(' . $keyMateriaCell . ',' . $keyMateriaRange . ',0)),' . $fallbackByCode . ')' .
    ',' . $fallbackByCode . ')';
}

private function buildSeguimientoStudentAverageLookupFormula(
    string $notesSheetTitle,
    string $valueColumn,
    int $notesLastRow,
    string $identificationCell,
    string $codeCell,
    string $fullNameCell,
    string $namesCell,
    string $lastNamesCell
): string {
    $sheet = $this->quoteExcelSheetName($notesSheetTitle);
    $range = fn (string $column) => sprintf('%s!$%s$2:$%s$%d', $sheet, $column, $column, $notesLastRow);
    $valueRange = $range($valueColumn);

    $averageExpr = function (string $matchRange, string $criterion, bool $wildcard = false) use ($valueRange): string {
        $criterionExpr = $wildcard ? '"*"&' . $criterion . '&"*"' : $criterion;
        $fragment = $this->buildSeguimientoAverageLookupFragment($valueRange, [
            [$matchRange, $criterionExpr],
        ]);

        return 'IF(' . $fragment['count'] . '>0,' . $fragment['value'] . '/' . $fragment['count'] . ',"")';
    };

    return '=IF(' . $identificationCell . '<>"",' .
            $averageExpr($range('Z'), $identificationCell) .
        ',' .
            'IF(' . $codeCell . '<>"",' .
                $averageExpr($range('AA'), $codeCell) .
            ',' .
                'IF(' . $fullNameCell . '<>"",' .
                    $averageExpr($range('AB'), $fullNameCell, true) .
                ',' .
                    'IF(' . $namesCell . '<>"",' .
                        $averageExpr($range('AC'), $namesCell, true) .
                    ',' .
                        'IF(' . $lastNamesCell . '<>"",' .
                            $averageExpr($range('AD'), $lastNamesCell, true) .
                        ',"")' .
                    ')' .
                ')' .
            ')' .
        ')';
}

private function populateSeguimientoNotesHelperColumns(Worksheet $notesSheet, int $notesLastRow): void
{
    $notesSheet->setCellValue('Z1', 'CLAVE EST IDE');
    $notesSheet->setCellValue('AA1', 'CLAVE EST CODIGO');
    $notesSheet->setCellValue('AB1', 'CLAVE EST NOMBRE');
    $notesSheet->setCellValue('AC1', 'CLAVE EST NOMBRES');
    $notesSheet->setCellValue('AD1', 'CLAVE EST APELLIDOS');

    for ($row = 2; $row <= $notesLastRow; $row++) {
        $notesSheet->setCellValue('T' . $row, '=IF(AND($E' . $row . '<>"",$I' . $row . '<>""),$E' . $row . '&"|"&$I' . $row . ',"")');
        $notesSheet->setCellValue('U' . $row, '=IF(AND($E' . $row . '<>"",$J' . $row . '<>""),LOWER(TRIM($E' . $row . '&"|"&$J' . $row . ')),"")');
        $notesSheet->setCellValue('V' . $row, '=IF(AND($A' . $row . '<>"",$J' . $row . '<>""),LOWER(TRIM($A' . $row . '&"|"&$J' . $row . ')),"")');
        $notesSheet->setCellValue('W' . $row, '=IF(AND(TRIM($C' . $row . '&" "&$B' . $row . ')<>"",$J' . $row . '<>""),LOWER(TRIM($C' . $row . '&" "&$B' . $row . '&"|"&$J' . $row . ')),"")');
        $notesSheet->setCellValue('X' . $row, '=IF(AND($C' . $row . '<>"",$J' . $row . '<>""),LOWER(TRIM($C' . $row . '&"|"&$J' . $row . ')),"")');
        $notesSheet->setCellValue('Y' . $row, '=IF(AND($B' . $row . '<>"",$J' . $row . '<>""),LOWER(TRIM($B' . $row . '&"|"&$J' . $row . ')),"")');
        $notesSheet->setCellValue('Z' . $row, '=TRIM($E' . $row . ')');
        $notesSheet->setCellValue('AA' . $row, '=TRIM($A' . $row . ')');
        $notesSheet->setCellValue('AB' . $row, '=LOWER(TRIM($C' . $row . '&" "&$B' . $row . '))');
        $notesSheet->setCellValue('AC' . $row, '=LOWER(TRIM($C' . $row . '))');
        $notesSheet->setCellValue('AD' . $row, '=LOWER(TRIM($B' . $row . '))');
    }

    foreach (range('T', 'Y') as $column) {
        $notesSheet->getColumnDimension($column)->setVisible(false);
    }
    foreach (range('Z', 'Z') as $column) {
        $notesSheet->getColumnDimension($column)->setVisible(false);
    }
    foreach (['AA', 'AB', 'AC', 'AD'] as $column) {
        $notesSheet->getColumnDimension($column)->setVisible(false);
    }
}

private function applySeguimientoGeneralSheetFormulas(
    Worksheet $generalSheet,
    string $notesSheetTitle,
    int $notesLastRow
): void {
    $lastRow = max(2, $generalSheet->getHighestDataRow());

    for ($row = 2; $row <= $lastRow; $row++) {
        $generalSheet->setCellValue('O' . $row, '=TRIM($D' . $row . ')');
        $generalSheet->setCellValue('P' . $row, '=TRIM($A' . $row . ')');
        $generalSheet->setCellValue('Q' . $row, '=LOWER(TRIM($C' . $row . '&" "&$B' . $row . '))');
        $generalSheet->setCellValue('R' . $row, '=LOWER(TRIM($C' . $row . '))');
        $generalSheet->setCellValue('S' . $row, '=LOWER(TRIM($B' . $row . '))');

        $generalSheet->setCellValue('H' . $row, $this->buildSeguimientoStudentAverageLookupFormula($notesSheetTitle, 'L', $notesLastRow, '$O' . $row, '$P' . $row, '$Q' . $row, '$R' . $row, '$S' . $row));
        $generalSheet->setCellValue('I' . $row, $this->buildSeguimientoStudentAverageLookupFormula($notesSheetTitle, 'M', $notesLastRow, '$O' . $row, '$P' . $row, '$Q' . $row, '$R' . $row, '$S' . $row));
        $generalSheet->setCellValue('J' . $row, $this->buildSeguimientoStudentAverageLookupFormula($notesSheetTitle, 'N', $notesLastRow, '$O' . $row, '$P' . $row, '$Q' . $row, '$R' . $row, '$S' . $row));
        $generalSheet->setCellValue('K' . $row, $this->buildSeguimientoStudentAverageLookupFormula($notesSheetTitle, 'Q', $notesLastRow, '$O' . $row, '$P' . $row, '$Q' . $row, '$R' . $row, '$S' . $row));
    }

    foreach (['H', 'I', 'J', 'K'] as $column) {
        $generalSheet->getStyle($column . '2:' . $column . $lastRow)
            ->getNumberFormat()
            ->setFormatCode('0.00');
    }

    foreach (['O', 'P', 'Q', 'R', 'S'] as $column) {
        $generalSheet->getColumnDimension($column)->setVisible(false);
    }
}

private function applySeguimientoTemplateWindowSheetFormulas(
    Worksheet $sheet,
    string $notesSheetTitle,
    int $notesLastRow,
    int $cutNumber
): void {
    $lastRow = max(2, $sheet->getHighestDataRow());
    $notesValueColumn = match ($cutNumber) {
        1 => 'L',
        2 => 'M',
        3 => 'N',
        default => 'Q',
    };
    $subjectColumn = $cutNumber === 3 ? 'J' : 'I';
    $helperStart = $cutNumber === 3 ? ['S', 'T', 'U', 'V', 'W'] : ['R', 'S', 'T', 'U', 'V'];
    [$keyMateriaColumn, $keyCodigoColumn, $keyFullNameColumn, $keyNamesColumn, $keyLastNamesColumn] = $helperStart;
    $wonColumn = $cutNumber === 3 ? 'P' : 'O';
    $zeroColumn = $cutNumber === 3 ? 'Q' : 'P';
    $lostColumn = $cutNumber === 3 ? 'R' : 'Q';

    for ($row = 2; $row <= $lastRow; $row++) {
        $sheet->setCellValue($keyMateriaColumn . $row, '=IF(AND($D' . $row . '<>"",$' . $subjectColumn . $row . '<>""),LOWER(TRIM($D' . $row . '&"|"&$' . $subjectColumn . $row . ')),"")');
        $sheet->setCellValue($keyCodigoColumn . $row, '=IF(AND($A' . $row . '<>"",$' . $subjectColumn . $row . '<>""),LOWER(TRIM($A' . $row . '&"|"&$' . $subjectColumn . $row . ')),"")');
        $sheet->setCellValue($keyFullNameColumn . $row, '=IF(AND(TRIM($C' . $row . '&" "&$B' . $row . ')<>"",$' . $subjectColumn . $row . '<>""),LOWER(TRIM($C' . $row . '&" "&$B' . $row . '&"|"&$' . $subjectColumn . $row . ')),"")');
        $sheet->setCellValue($keyNamesColumn . $row, '=IF(AND($C' . $row . '<>"",$' . $subjectColumn . $row . '<>""),LOWER(TRIM($C' . $row . '&"|"&$' . $subjectColumn . $row . ')),"")');
        $sheet->setCellValue($keyLastNamesColumn . $row, '=IF(AND($B' . $row . '<>"",$' . $subjectColumn . $row . '<>""),LOWER(TRIM($B' . $row . '&"|"&$' . $subjectColumn . $row . ')),"")');

        $sheet->setCellValue('E' . $row, $this->buildSeguimientoTemplateNoteLookupFormula($notesSheetTitle, $row, $notesValueColumn, $notesLastRow, $helperStart));

        if ($cutNumber === 3) {
            $sheet->setCellValue('F' . $row, $this->buildSeguimientoTemplateNoteLookupFormula($notesSheetTitle, $row, 'P', $notesLastRow, $helperStart));
        }

        $sheet->setCellValue($wonColumn . $row, '=IF($E' . $row . '="","",IF($E' . $row . '>=3,"X",""))');
        $sheet->setCellValue($zeroColumn . $row, '=IF($E' . $row . '=0,"X","")');
        $sheet->setCellValue($lostColumn . $row, '=IF(OR($E' . $row . '="",$E' . $row . '=0,$E' . $row . '>=3),"","X")');
    }

    $sheet->getStyle('E2:E' . $lastRow)->getNumberFormat()->setFormatCode('0.00');
    if ($cutNumber === 3) {
        $sheet->getStyle('F2:F' . $lastRow)->getNumberFormat()->setFormatCode('0.00');
    }

    foreach ($helperStart as $column) {
        $sheet->getColumnDimension($column)->setVisible(false);
    }
}

private function buildSeguimientoSelectedNoteFormula(int $row, string $gradeStage): string
{
    return match ($gradeStage) {
        'nota_1' => '=$H' . $row,
        'nota_2' => '=IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . ')',
        'nota_3' => '=IF($J' . $row . '<>"",$J' . $row . ',IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . '))',
        'habilitacion' => '=IF($K' . $row . '<>"",$K' . $row . ',IF($J' . $row . '<>"",$J' . $row . ',IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . ')))',
        'definitiva' => '=IF($L' . $row . '<>"",$L' . $row . ',IF($K' . $row . '<>"",$K' . $row . ',IF($J' . $row . '<>"",$J' . $row . ',IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . '))))',
        'final' => '=IF($M' . $row . '<>"",$M' . $row . ',IF($L' . $row . '<>"",$L' . $row . ',IF($K' . $row . '<>"",$K' . $row . ',IF($J' . $row . '<>"",$J' . $row . ',IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . ')))))',
        default => '=IF($M' . $row . '<>"",$M' . $row . ',IF($L' . $row . '<>"",$L' . $row . ',IF($K' . $row . '<>"",$K' . $row . ',IF($J' . $row . '<>"",$J' . $row . ',IF($I' . $row . '<>"",$I' . $row . ',$H' . $row . ')))))',
    };
}

private function buildSeguimientoStatusFormula(int $row): string
{
    return '=IF($N' . $row . '="","SIN NOTA",IF($N' . $row . '=0,"CERO",IF($N' . $row . '>=3,"APROBADO","REPROBADO")))';
}

private function buildSeguimientoRepeatedSelectedNoteFormula(int $row, string $gradeStage): string
{
    return match ($gradeStage) {
        'nota_1' => '=$I' . $row,
        'nota_2' => '=$J' . $row,
        'nota_3' => '=$K' . $row,
        'habilitacion' => '=$L' . $row,
        'definitiva' => '=$M' . $row,
        'final' => '=$N' . $row,
        default => '=IF($N' . $row . '<>"",$N' . $row . ',IF($M' . $row . '<>"",$M' . $row . ',IF($L' . $row . '<>"",$L' . $row . ',IF($K' . $row . '<>"",$K' . $row . ',IF($J' . $row . '<>"",$J' . $row . ',$I' . $row . ')))))',
    };
}

private function buildSeguimientoRepeatedStatusFormula(int $row): string
{
    return '=IF($O' . $row . '="","SIN NOTA",IF($O' . $row . '=0,"CERO",IF($O' . $row . '>=3,"APROBADO","REPROBADO")))';
}

private function seguimientoExportColumnWidth(string $header): float
{
    return match (trim($header)) {
        'Nombre', 'Apellidos' => 20,
        'Identificación', 'Codigo', 'Ide Materia', 'CODIGO DE LA MATERIA' => 16,
        'Programa', 'Materia', 'Nombre del tutor', 'Corte', 'Cortes incluidos' => 28,
        'Resoluciones incluidas' => 18,
        'Sexo', 'Sede', 'Periodo', 'Resolución', 'Tipo Identificacion', 'Etapa de nota' => 14,
        'Grupos priorizados', 'Grupo' => 18,
        'Semestre' => 12,
        'Año' => 10,
        'Nota 1', 'Nota 2', 'Nota 3', 'Definitiva', 'Habilitación', 'Final', 'Nota final', 'Nota habilitación', 'Nota asociada', 'Notas 1er corte', 'Notas 2do corte', 'Notas 3er corte', 'Estado', 'CLAVE IDE', 'CLAVE MATERIA', 'CLAVE CODIGO' => 14,
        default => 18,
    };
}

private function fillSeguimientoTable(Worksheet $sheet, array $headers, array $rows, string $startCell = 'A1'): void
{
    [$startColumnLetters, $headerRow] = Coordinate::coordinateFromString($startCell);
    $sheet->fromArray([$headers], null, $startCell);

    if ($rows !== []) {
        $sheet->fromArray($rows, null, $startColumnLetters . ($headerRow + 1));
    }

    $startColumn = Coordinate::columnIndexFromString(preg_replace('/\d+/', '', $startCell));
    $headerRow = (int) preg_replace('/\D+/', '', $startCell);
    $lastColumnIndex = $startColumn + count($headers) - 1;
    $lastColumn = Coordinate::stringFromColumnIndex($lastColumnIndex);
    $lastRow = max($headerRow + count($rows), $headerRow + 1);

    $sheet->getStyle("{$startCell}:{$lastColumn}{$headerRow}")->applyFromArray([
        'font' => [
            'bold' => true,
            'color' => ['rgb' => 'FFFFFF'],
        ],
        'fill' => [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => '155E75'],
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_CENTER,
            'vertical' => Alignment::VERTICAL_CENTER,
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => 'D1D5DB'],
            ],
        ],
    ]);

    $sheet->getStyle("{$startColumnLetters}{$headerRow}:{$lastColumn}{$lastRow}")->applyFromArray([
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => 'E5E7EB'],
            ],
        ],
        'alignment' => [
            'vertical' => Alignment::VERTICAL_CENTER,
        ],
    ]);

    $sheet->setAutoFilter("{$startColumnLetters}{$headerRow}:{$lastColumn}{$lastRow}");
    $sheet->freezePane($startColumnLetters . ($headerRow + 1));

    for ($offset = 0; $offset < count($headers); $offset++) {
        $columnIndex = $startColumn + $offset;
        $columnLetter = Coordinate::stringFromColumnIndex($columnIndex);
        $sheet->getColumnDimension($columnLetter)->setWidth(
            $this->seguimientoExportColumnWidth((string) ($headers[$offset] ?? ''))
        );
    }
}

private function downloadSpreadsheetFile(Spreadsheet $spreadsheet, Xlsx $writer, string $filename)
{
    $exportDirectory = storage_path('app/exports');

    if (! is_dir($exportDirectory)) {
        mkdir($exportDirectory, 0775, true);
    }

    $tempPath = $exportDirectory . DIRECTORY_SEPARATOR . Str::uuid()->toString() . '.xlsx';

    try {
        $writer->save($tempPath);
    } finally {
        $spreadsheet->disconnectWorksheets();
        unset($writer, $spreadsheet);
    }

    return response()->download($tempPath, $filename, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ])->deleteFileAfterSend(true);
}

private function fillSeguimientoSummarySheetWithRepetition(Worksheet $sheet, array $export): void
{
    $statusRows = [['Etiquetas de fila', 'Cuenta de Estado']];
    foreach ($export['status_counts'] as $label => $count) {
        $statusRows[] = [$label, (int) $count];
    }
    $statusRows[] = ['Total general', array_sum(array_map('intval', $export['status_counts']))];

    $sheet->fromArray($statusRows, null, 'A1');
    $this->styleSeguimientoSummaryBlock($sheet, 'A1:B' . count($statusRows), count($statusRows));

    $programRows = [['Etiquetas de fila', 'Cuenta de Programa']];
    foreach ($export['program_subject_rows'] as $row) {
        $programRows[] = [$row['label'], (int) $row['count']];
    }
    $programRows[] = ['Total general', count($export['repeated_rows'])];
    $programStartRow = 17;
    $sheet->fromArray($programRows, null, 'A' . $programStartRow);
    $this->styleSeguimientoSummaryBlock(
        $sheet,
        'A' . $programStartRow . ':B' . ($programStartRow + count($programRows) - 1),
        count($programRows),
        $programStartRow
    );

    if (count($statusRows) > 2) {
        $this->addBarChart(
            $sheet,
            'Estado de notas (con repetición)',
            'A2:A' . (count($statusRows) - 1),
            ['B2:B' . (count($statusRows) - 1)],
            ['Cantidad'],
            'D1',
            'K14'
        );
    }

    foreach (range('A', 'L') as $column) {
        $sheet->getColumnDimension($column)->setAutoSize(true);
    }
}

private function fillSeguimientoUniqueSummarySheet(Worksheet $sheet, array $export): void
{
    $programRows = [['Etiquetas de fila', 'Cuenta de Codigo']];
    foreach ($export['program_unique_counts'] as $label => $count) {
        $programRows[] = [$label, (int) $count];
    }
    $programRows[] = ['Total general', count($export['unique_rows'])];
    $sheet->fromArray($programRows, null, 'A1');
    $this->styleSeguimientoSummaryBlock($sheet, 'A1:B' . count($programRows), count($programRows));

    $sexoStartRow = 16;
    $sexoRows = [['Etiquetas de fila', 'Cuenta de Sexo']];
    foreach ($export['sexo_unique_counts'] as $label => $count) {
        $sexoRows[] = [$label, (int) $count];
    }
    $sexoRows[] = ['Total general', count($export['unique_rows'])];
    $sheet->fromArray($sexoRows, null, 'A' . $sexoStartRow);
    $this->styleSeguimientoSummaryBlock(
        $sheet,
        'A' . $sexoStartRow . ':B' . ($sexoStartRow + count($sexoRows) - 1),
        count($sexoRows),
        $sexoStartRow
    );

    $groupStartRow = 27;
    $groupRows = [['Etiquetas de fila', 'Cuenta de Grupos priorizados']];
    foreach ($export['grupo_unique_counts'] as $label => $count) {
        $groupRows[] = [$label, (int) $count];
    }
    $groupRows[] = ['Total general', count($export['unique_rows'])];
    $sheet->fromArray($groupRows, null, 'A' . $groupStartRow);
    $this->styleSeguimientoSummaryBlock(
        $sheet,
        'A' . $groupStartRow . ':B' . ($groupStartRow + count($groupRows) - 1),
        count($groupRows),
        $groupStartRow
    );

    if (count($programRows) > 2) {
        $this->addBarChart(
            $sheet,
            'Programas (sin repetición)',
            'A2:A' . (count($programRows) - 1),
            ['B2:B' . (count($programRows) - 1)],
            ['Cantidad'],
            'D1',
            'K14'
        );
    }

    if (count($sexoRows) > 2) {
        $this->addBarChart(
            $sheet,
            'Sexo (sin repetición)',
            'A' . ($sexoStartRow + 1) . ':A' . ($sexoStartRow + count($sexoRows) - 2),
            ['B' . ($sexoStartRow + 1) . ':B' . ($sexoStartRow + count($sexoRows) - 2)],
            ['Cantidad'],
            'D16',
            'K25'
        );
    }

    foreach (range('A', 'L') as $column) {
        $sheet->getColumnDimension($column)->setAutoSize(true);
    }
}

private function styleSeguimientoSummaryBlock(
    Worksheet $sheet,
    string $range,
    int $rowsCount,
    int $startRow = 1
): void {
    [$startCell, $endCell] = explode(':', $range);
    $headerRange = preg_replace('/\d+$/', '', $startCell) . $startRow . ':' . preg_replace('/\d+$/', '', $endCell) . $startRow;
    $lastRow = $startRow + max(1, $rowsCount) - 1;
    $totalRange = preg_replace('/\d+$/', '', $startCell) . $lastRow . ':' . preg_replace('/\d+$/', '', $endCell) . $lastRow;

    $sheet->getStyle($range)->applyFromArray([
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => 'E5E7EB'],
            ],
        ],
    ]);

    $sheet->getStyle($headerRange)->applyFromArray([
        'font' => [
            'bold' => true,
            'color' => ['rgb' => 'FFFFFF'],
        ],
        'fill' => [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => '1E6091'],
        ],
    ]);

    $sheet->getStyle($totalRange)->applyFromArray([
        'font' => [
            'bold' => true,
        ],
        'fill' => [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'F1F5F9'],
        ],
    ]);
}

private function buildTreeForWindowIds(int $periodId, array $orderedWindowIds, ?array $visibleWindowIds = null): array
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));
    $visibleWindowIds = $visibleWindowIds === null
        ? $orderedWindowIds
        : array_values(array_unique(array_map('intval', $visibleWindowIds)));

    if ($orderedWindowIds === []) {
        return [];
    }

    if ($visibleWindowIds === []) {
        return [];
    }

    $baseAsistencias = fn() => DB::query()->fromSub(
        $this->buildIncrementalAsistenciasQuery($periodId, $orderedWindowIds),
        'a'
    )->whereIn('a.report_window_id', $visibleWindowIds);

    $baseStudentAsistencias = fn() => DB::query()->fromSub(
        $this->buildIncrementalStudentAsistenciasQuery($periodId, $orderedWindowIds),
        'a'
    )->whereIn('a.report_window_id', $visibleWindowIds);

    $rowsPerWindowAsis = $baseAsistencias()
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

    $normalStudentRows = $baseStudentAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
        ->selectRaw("
            a.report_window_id as window_id,
            COALESCE(c.id, 0) as carrera_id,
            COALESCE(s.id, 0) as asignatura_id,
            a.tutor_id as tutor_id,
            TRIM(a.identificacion) as identificacion
        ")
        ->distinct()
        ->get();

    $careerWindowStudentSets = [];
    $careerStudentSets = [];
    $asignaturaWindowStudentSets = [];
    $asignaturaStudentSets = [];
    $tutorWindowStudentSets = [];
    $tutorStudentSets = [];

    $uniqueCarrera = $baseStudentAsistencias()
        ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
        ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
        ->selectRaw("COALESCE(c.id, 0) as carrera_id, COUNT(DISTINCT TRIM(a.identificacion)) as unique_estudiantes_total")
        ->groupBy('c.id')
        ->get()
        ->keyBy('carrera_id');

    $uniqueAsignatura = $baseStudentAsistencias()
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

    $uniqueTutor = $baseStudentAsistencias()
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
    foreach ($rowsPerWindowAsis as $r) {
        $wid = (int)$r->window_id;

        $cId = (int)$r->carrera_id;    $cName = (string)$r->carrera_name;
        $aId = (int)$r->asignatura_id; $aName = (string)$r->asignatura_name;
        $tId = (int)$r->tutor_id;      $tName = (string)$r->tutor_name;

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
        $addCell($tree[$cId], $wid, 0, $asis);

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
        $addCell($tree[$cId]['asignaturas'][$aId], $wid, 0, $asis);

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
        $addCell($tree[$cId]['asignaturas'][$aId]['tutores'][$tId], $wid, 0, $asis);
    }

    foreach ($normalStudentRows as $row) {
        $wid = (int) ($row->window_id ?? 0);
        $careerId = (int) ($row->carrera_id ?? 0);
        $asignaturaId = (int) ($row->asignatura_id ?? 0);
        $tutorId = (int) ($row->tutor_id ?? 0);
        $identificacion = trim((string) ($row->identificacion ?? ''));

        if ($wid <= 0 || $identificacion === '') {
            continue;
        }

        if (! isset($tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId])) {
            continue;
        }

        $careerKey = $careerId;
        $asignaturaKey = $careerId . ':' . $asignaturaId;
        $tutorKey = $careerId . ':' . $asignaturaId . ':' . $tutorId;

        if (! isset($careerWindowStudentSets[$careerKey][$wid][$identificacion])) {
            $careerWindowStudentSets[$careerKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId], $wid, 1, 0);
        }
        $careerStudentSets[$careerKey][$identificacion] = true;

        if (! isset($asignaturaWindowStudentSets[$asignaturaKey][$wid][$identificacion])) {
            $asignaturaWindowStudentSets[$asignaturaKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId]['asignaturas'][$asignaturaId], $wid, 1, 0);
        }
        $asignaturaStudentSets[$asignaturaKey][$identificacion] = true;

        if (! isset($tutorWindowStudentSets[$tutorKey][$wid][$identificacion])) {
            $tutorWindowStudentSets[$tutorKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId], $wid, 1, 0);
        }
        $tutorStudentSets[$tutorKey][$identificacion] = true;
    }

    $this->mergeOccasionalRowsIntoTree(
        $tree,
        $periodId,
        $orderedWindowIds,
        $visibleWindowIds,
        $careerWindowStudentSets,
        $careerStudentSets,
        $asignaturaWindowStudentSets,
        $asignaturaStudentSets,
        $tutorWindowStudentSets,
        $tutorStudentSets
    );

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

private function mergeOccasionalRowsIntoTree(
    array &$tree,
    int $periodId,
    array $orderedWindowIds,
    array $visibleWindowIds,
    array &$careerWindowStudentSets,
    array &$careerStudentSets,
    array &$asignaturaWindowStudentSets,
    array &$asignaturaStudentSets,
    array &$tutorWindowStudentSets,
    array &$tutorStudentSets
): void {
    $occasionalRows = $this->buildIncrementalAsistenciasOcasionalesQuery($periodId, $orderedWindowIds)
        ->whereIn('ao.report_window_id', $visibleWindowIds)
        ->leftJoin('tutors as t', 't.id', '=', 'ao.tutor_id')
        ->selectRaw("
            ao.report_window_id as window_id,
            ao.tutor_id as tutor_id,
            COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', ao.tutor_id)) as tutor_name,
            TRIM(ao.identificacion) as identificacion,
            COALESCE(NULLIF(TRIM(ao.programa_academico), ''), 'Sin carrera') as programa_academico,
            COALESCE(NULLIF(TRIM(ao.asignatura_texto), ''), 'Sin asignatura') as asignatura_name,
            DATE(ao.fecha) as fecha
        ")
        ->get();

    $careerCatalog = Carrera::query()->get(['id', 'nombre', 'codigo']);
    $subjectCatalog = \App\Models\Asignatura::query()->get(['id', 'nombre', 'carrera_id']);

    $newOccasionalStudentRows = $this->buildIncrementalStudentAsistenciasOcasionalesQuery($periodId, $orderedWindowIds)
        ->whereIn('ao.report_window_id', $visibleWindowIds)
        ->leftJoin('tutors as t', 't.id', '=', 'ao.tutor_id')
        ->selectRaw("
            ao.report_window_id as window_id,
            ao.tutor_id as tutor_id,
            COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', ao.tutor_id)) as tutor_name,
            TRIM(ao.identificacion) as identificacion,
            COALESCE(NULLIF(TRIM(ao.programa_academico), ''), 'Sin carrera') as programa_academico,
            COALESCE(NULLIF(TRIM(ao.asignatura_texto), ''), 'Sin asignatura') as asignatura_name
        ")
        ->get()
        ->groupBy(function ($row) {
            return implode('|', [
                (int) ($row->window_id ?? 0),
                trim((string) ($row->programa_academico ?? 'Sin carrera')),
                trim((string) ($row->asignatura_name ?? 'Sin asignatura')),
                (int) ($row->tutor_id ?? 0),
                trim((string) ($row->tutor_name ?? '')),
            ]);
        });

    if ($occasionalRows->isEmpty() && $newOccasionalStudentRows->isEmpty()) {
        return;
    }

    $addCell = function (&$node, int $wid, int $estudiantes, int $asistencias): void {
        $windowKey = (string) $wid;

        if (! isset($node['per_window'][$windowKey])) {
            $node['per_window'][$windowKey] = ['estudiantes' => 0, 'asistencias' => 0];
        }

        $node['per_window'][$windowKey]['estudiantes'] += $estudiantes;
        $node['per_window'][$windowKey]['asistencias'] += $asistencias;
    };

    foreach ($occasionalRows as $row) {
        $wid = (int) ($row->window_id ?? 0);
        $tutorId = (int) ($row->tutor_id ?? 0);
        $tutorName = trim((string) ($row->tutor_name ?? ('Tutor #' . $tutorId)));
        $identificacion = trim((string) ($row->identificacion ?? ''));
        $programa = trim((string) ($row->programa_academico ?? 'Sin carrera'));
        $asignatura = trim((string) ($row->asignatura_name ?? 'Sin asignatura'));
        $fecha = trim((string) ($row->fecha ?? ''));

        if ($wid <= 0 || $identificacion === '') {
            continue;
        }

        $careerNode = $this->resolveCareerNodeForTree($programa, $careerCatalog);
        $careerId = (int) $careerNode['id'];
        $careerName = (string) $careerNode['name'];

        $subjectNode = $this->resolveSubjectNodeForTree($careerId, $asignatura, $subjectCatalog);
        $asignaturaId = (int) $subjectNode['id'];
        $asignaturaName = (string) $subjectNode['name'];

        if (! isset($tree[$careerId])) {
            $tree[$careerId] = [
                'id' => $careerId,
                'name' => $careerName,
                'per_window' => [],
                'asignaturas' => [],
                'unique_estudiantes_total' => 0,
                'unique_asistencias_total' => 0,
            ];
        }

        if (! isset($tree[$careerId]['asignaturas'][$asignaturaId])) {
            $tree[$careerId]['asignaturas'][$asignaturaId] = [
                'id' => $asignaturaId,
                'name' => $asignaturaName,
                'per_window' => [],
                'tutores' => [],
                'unique_estudiantes_total' => 0,
                'unique_asistencias_total' => 0,
            ];
        }

        if (! isset($tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId])) {
            $tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId] = [
                'id' => $tutorId,
                'name' => $tutorName,
                'per_window' => [],
                'unique_estudiantes_total' => 0,
                'unique_asistencias_total' => 0,
            ];
        }

        $careerKey = $careerId;
        $asignaturaKey = $careerId . ':' . $asignaturaId;
        $tutorKey = $careerId . ':' . $asignaturaId . ':' . $tutorId;

        $studentBucketKey = implode('|', [
            $wid,
            $programa,
            $asignatura,
            $tutorId,
            $tutorName,
        ]);
        $newStudentsForBucket = $newOccasionalStudentRows[$studentBucketKey] ?? collect();
        $isNewVisibleStudent = $newStudentsForBucket->contains(function ($studentRow) use ($identificacion) {
            return trim((string) ($studentRow->identificacion ?? '')) === $identificacion;
        });

        if ($isNewVisibleStudent && ! isset($careerWindowStudentSets[$careerKey][$wid][$identificacion])) {
            $careerWindowStudentSets[$careerKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId], $wid, 1, 0);
        }

        if ($isNewVisibleStudent && ! isset($careerStudentSets[$careerKey][$identificacion])) {
            $careerStudentSets[$careerKey][$identificacion] = true;
            $tree[$careerId]['unique_estudiantes_total']++;
        }

        if ($isNewVisibleStudent && ! isset($asignaturaWindowStudentSets[$asignaturaKey][$wid][$identificacion])) {
            $asignaturaWindowStudentSets[$asignaturaKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId]['asignaturas'][$asignaturaId], $wid, 1, 0);
        }

        if ($isNewVisibleStudent && ! isset($asignaturaStudentSets[$asignaturaKey][$identificacion])) {
            $asignaturaStudentSets[$asignaturaKey][$identificacion] = true;
            $tree[$careerId]['asignaturas'][$asignaturaId]['unique_estudiantes_total']++;
        }

        if ($isNewVisibleStudent && ! isset($tutorWindowStudentSets[$tutorKey][$wid][$identificacion])) {
            $tutorWindowStudentSets[$tutorKey][$wid][$identificacion] = true;
            $addCell($tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId], $wid, 1, 0);
        }

        if ($isNewVisibleStudent && ! isset($tutorStudentSets[$tutorKey][$identificacion])) {
            $tutorStudentSets[$tutorKey][$identificacion] = true;
            $tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId]['unique_estudiantes_total']++;
        }

        $attendanceKey = $identificacion . '|' . $fecha . '|O';

        $addCell($tree[$careerId], $wid, 0, 1);
        $tree[$careerId]['unique_asistencias_total']++;

        $addCell($tree[$careerId]['asignaturas'][$asignaturaId], $wid, 0, 1);
        $tree[$careerId]['asignaturas'][$asignaturaId]['unique_asistencias_total']++;

        $addCell($tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId], $wid, 0, 1);
        $tree[$careerId]['asignaturas'][$asignaturaId]['tutores'][$tutorId]['unique_asistencias_total']++;
    }
}

private function resolveCareerNodeForTree(string $programa, $careerCatalog): array
{
    $career = $this->resolveCareerForAutoCreatedTutor($programa);

    if ($career) {
        return [
            'id' => (int) $career->id,
            'name' => (string) $career->nombre,
        ];
    }

    $programa = trim($programa);
    if ($programa === '') {
        $programa = 'Sin carrera';
    }

    return [
        'id' => $this->makeSyntheticTreeNodeId('career', $programa),
        'name' => $programa,
    ];
}

private function resolveSubjectNodeForTree(int $careerId, string $subjectName, $subjectCatalog): array
{
    $normalized = $this->normalizeChartText($subjectName);
    $variants = $this->subjectKeyVariants($subjectName);

    $subjects = collect($subjectCatalog)
        ->filter(fn ($subject) => (int) ($subject->carrera_id ?? 0) === $careerId)
        ->values();

    foreach ($subjects as $subject) {
        $subjectVariants = $this->subjectKeyVariants((string) ($subject->nombre ?? ''));
        if (array_intersect($variants, $subjectVariants) !== []) {
            return [
                'id' => (int) $subject->id,
                'name' => (string) $subject->nombre,
            ];
        }
    }

    $subjectName = trim($subjectName);
    if ($subjectName === '') {
        $subjectName = 'Sin asignatura';
    }

    return [
        'id' => $this->makeSyntheticTreeNodeId('subject:' . $careerId, $subjectName),
        'name' => $subjectName,
    ];
}

private function makeSyntheticTreeNodeId(string $scope, string $value): int
{
    $hash = crc32($scope . '|' . $value);

    return -1 * (int) sprintf('%u', $hash);
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

private function buildIncrementalStudentAsistenciasQuery(int $periodId, array $orderedWindowIds)
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

    $prevOrderNormal = $this->buildWindowOrderCaseSql('prev.report_window_id', $orderedWindowIds);
    $prevOrderOcc = $this->buildWindowOrderCaseSql('prev_ao.report_window_id', $orderedWindowIds);
    $currOrder = $this->buildWindowOrderCaseSql('a.report_window_id', $orderedWindowIds);

    return $base
        ->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrderNormal, $currOrder) {
            $q->selectRaw('1')
                ->from('asistencias as prev')
                ->whereColumn('prev.period_id', 'a.period_id')
                ->whereIn('prev.report_window_id', $orderedWindowIds)
                ->whereRaw("{$prevOrderNormal} < {$currOrder}")
                ->whereRaw('TRIM(prev.identificacion) = TRIM(a.identificacion)');
        })
        ->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrderOcc, $currOrder) {
            $q->selectRaw('1')
                ->from('asistencias_ocasionales as prev_ao')
                ->whereColumn('prev_ao.period_id', 'a.period_id')
                ->whereIn('prev_ao.report_window_id', $orderedWindowIds)
                ->whereRaw("{$prevOrderOcc} < {$currOrder}")
                ->whereRaw('TRIM(prev_ao.identificacion) = TRIM(a.identificacion)');
        });
}

private function buildIncrementalAsistenciasOcasionalesQuery(int $periodId, array $orderedWindowIds)
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));

    $base = DB::table('asistencias_ocasionales as ao')
        ->where('ao.period_id', $periodId);

    if ($orderedWindowIds === []) {
        return $base->whereRaw('1 = 0');
    }

    $base->whereIn('ao.report_window_id', $orderedWindowIds);

    if (count($orderedWindowIds) === 1) {
        return $base;
    }

    $prevOrder = $this->buildWindowOrderCaseSql('prev.report_window_id', $orderedWindowIds);
    $currOrder = $this->buildWindowOrderCaseSql('ao.report_window_id', $orderedWindowIds);

    return $base->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrder, $currOrder) {
        $q->selectRaw('1')
            ->from('asistencias_ocasionales as prev')
            ->whereColumn('prev.period_id', 'ao.period_id')
            ->whereIn('prev.report_window_id', $orderedWindowIds)
            ->whereRaw("{$prevOrder} < {$currOrder}")
            ->whereRaw('COALESCE(prev.tutor_id, 0) = COALESCE(ao.tutor_id, 0)')
            ->whereRaw('COALESCE(prev.grupo_id, 0) = COALESCE(ao.grupo_id, 0)')
            ->whereRaw('TRIM(prev.identificacion) = TRIM(ao.identificacion)')
            ->whereRaw('DATE(prev.fecha) = DATE(ao.fecha)')
            ->whereRaw("COALESCE(TRIM(prev.asignatura_texto), '') = COALESCE(TRIM(ao.asignatura_texto), '')")
            ->whereRaw("COALESCE(TRIM(prev.grupo_texto), '') = COALESCE(TRIM(ao.grupo_texto), '')");
    });
}

private function buildIncrementalStudentAsistenciasOcasionalesQuery(int $periodId, array $orderedWindowIds)
{
    $orderedWindowIds = array_values(array_unique(array_map('intval', $orderedWindowIds)));

    $base = DB::table('asistencias_ocasionales as ao')
        ->where('ao.period_id', $periodId);

    if ($orderedWindowIds === []) {
        return $base->whereRaw('1 = 0');
    }

    $base->whereIn('ao.report_window_id', $orderedWindowIds);

    if (count($orderedWindowIds) === 1) {
        return $base;
    }

    $prevOrderNormal = $this->buildWindowOrderCaseSql('prev.report_window_id', $orderedWindowIds);
    $prevOrderOcc = $this->buildWindowOrderCaseSql('prev_ao.report_window_id', $orderedWindowIds);
    $currOrder = $this->buildWindowOrderCaseSql('ao.report_window_id', $orderedWindowIds);

    return $base
        ->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrderNormal, $currOrder) {
            $q->selectRaw('1')
                ->from('asistencias as prev')
                ->whereColumn('prev.period_id', 'ao.period_id')
                ->whereIn('prev.report_window_id', $orderedWindowIds)
                ->whereRaw("{$prevOrderNormal} < {$currOrder}")
                ->whereRaw('TRIM(prev.identificacion) = TRIM(ao.identificacion)');
        })
        ->whereNotExists(function ($q) use ($orderedWindowIds, $prevOrderOcc, $currOrder) {
            $q->selectRaw('1')
                ->from('asistencias_ocasionales as prev_ao')
                ->whereColumn('prev_ao.period_id', 'ao.period_id')
                ->whereIn('prev_ao.report_window_id', $orderedWindowIds)
                ->whereRaw("{$prevOrderOcc} < {$currOrder}")
                ->whereRaw('TRIM(prev_ao.identificacion) = TRIM(ao.identificacion)');
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

private function orderedWindowIdsForPeriod(ReportPeriod $period): array
{
    return DB::table('report_windows')
        ->where('period_id', $period->id)
        ->orderBy('open_at')
        ->orderBy('id')
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values()
        ->all();
}

private function expandIncrementalWindowScope(ReportPeriod $period, array $selectedWindowIds): array
{
    $selectedIds = array_values(array_unique(array_map('intval', $selectedWindowIds)));
    $selectedIds = array_values(array_filter($selectedIds, fn ($id) => $id > 0));

    if ($selectedIds === []) {
        return [];
    }

    $windows = $period->windows()
        ->orderBy('open_at')
        ->orderBy('id')
        ->get(['id', 'tutor_type', 'category', 'name', 'open_at']);

    $selectedLookup = array_fill_keys($selectedIds, true);
    $selectedWindows = $windows
        ->filter(fn ($window) => isset($selectedLookup[(int) $window->id]))
        ->values();

    $selectedTutorTypes = $selectedWindows
        ->pluck('tutor_type')
        ->map(fn ($type) => strtoupper(trim((string) $type)))
        ->filter()
        ->unique()
        ->values()
        ->all();

    $maxSelectedCut = $selectedWindows
        ->map(fn ($window) => (int) ($this->inferWindowCutNumberFromWindow($window) ?? 0))
        ->filter(fn ($cutNumber) => $cutNumber > 0)
        ->max();

    if ($selectedTutorTypes === [] || $maxSelectedCut === null || $maxSelectedCut <= 0) {
        return $selectedIds;
    }

    return $windows
        ->filter(function ($window) use ($selectedTutorTypes, $maxSelectedCut) {
            $tutorType = strtoupper(trim((string) ($window->tutor_type ?? '')));
            if (! in_array($tutorType, $selectedTutorTypes, true)) {
                return false;
            }

            $cutNumber = (int) ($this->inferWindowCutNumberFromWindow($window) ?? 0);
            return $cutNumber > 0 && $cutNumber <= $maxSelectedCut;
        })
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values()
        ->all();
}

private function buildChartsForWindow(ReportPeriod $period, int $windowId, float $approvalMin = 3.0): array
{
    $idsToEvaluate = $this->expandIncrementalWindowScope($period, [$windowId]);

    return $this->buildChartsForWindowSelection(
        $period,
        $idsToEvaluate,
        [$windowId],
        $approvalMin
    );
}

private function buildChartsForSelection(ReportPeriod $period, array $selectedWindowIds, float $approvalMin = 3.0): array
{
    $orderedSelection = array_values(array_unique(array_map('intval', $selectedWindowIds)));
    $orderedSelection = array_values(array_filter($orderedSelection, fn ($id) => $id > 0));
    $scopeSelection = $this->expandIncrementalWindowScope($period, $orderedSelection);

    return $this->buildChartsForWindowSelection(
        $period,
        $scopeSelection,
        $orderedSelection,
        $approvalMin
    );
}

private function buildChartsForWindowSelection(
    ReportPeriod $period,
    array $idsToEvaluate,
    ?array $visibleWindowIds = null,
    float $approvalMin = 3.0
): array {
    $idsToEvaluate = array_values(array_unique(array_map('intval', $idsToEvaluate)));
    $idsToEvaluate = array_values(array_filter($idsToEvaluate, fn ($id) => $id > 0));
    $visibleWindowIds = $visibleWindowIds === null
        ? $idsToEvaluate
        : array_values(array_unique(array_map('intval', $visibleWindowIds)));
    $visibleWindowIds = array_values(array_filter($visibleWindowIds, fn ($id) => $id > 0));

    if ($idsToEvaluate === [] || $visibleWindowIds === []) {
        return $this->emptyCharts();
    }

    $focusKey = 'selection_' . md5(implode(',', $visibleWindowIds));
    $cacheStampKey = "rep_window_chart_stamp_period_{$period->id}";
    $cacheStamp = (int) Cache::get($cacheStampKey, 1);
    $cacheKeyHash = md5(implode(',', $idsToEvaluate) . '|visible:' . implode(',', $visibleWindowIds));

    return Cache::remember(
        "rep_window_chart_v8_period_{$period->id}_stamp_{$cacheStamp}_{$focusKey}_{$cacheKeyHash}",
        now()->addMinutes(10),
        function () use ($period, $visibleWindowIds, $approvalMin, $idsToEvaluate) {
            $baseA = DB::query()
                ->fromSub($this->buildIncrementalStudentAsistenciasQuery($period->id, $idsToEvaluate), 'a')
                ->whereIn('a.report_window_id', $visibleWindowIds);

            $baseAO = DB::query()
                ->fromSub($this->buildIncrementalStudentAsistenciasOcasionalesQuery($period->id, $idsToEvaluate), 'ao')
                ->whereIn('ao.report_window_id', $visibleWindowIds);

            // ✅ InfinityFree: evita JOIN masivo asistencias<->notas (MAX_JOIN_SIZE).
            //    Se calcula por etapas y en memoria.
            $normalStudentRows = (clone $baseA)
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

            $occasionalStudentRows = (clone $baseAO)
                ->leftJoin('grupo_t as g', 'g.id', '=', 'ao.grupo_id')
                ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
                ->leftJoin('asignaturas as s', 's.id', '=', 'g.asignatura_id')
                ->selectRaw("
                    TRIM(ao.identificacion) as identificacion,
                    TRIM(COALESCE(ao.codigo_estudiantil, '')) as codigo_key,
                    TRIM(COALESCE(ao.nombres_del_estudiante, '')) as nombres_key,
                    TRIM(COALESCE(ao.apellidos_del_estudiante, '')) as apellidos_key,
                    COALESCE(NULLIF(TRIM(c.nombre), ''), NULLIF(TRIM(ao.programa_academico), ''), 'Sin programa') as programa_key,
                    ao.tutor_id as tutor_id,
                    LOWER(TRIM(COALESCE(s.nombre, ao.asignatura_texto, ''))) as materia_key
                ")
                ->groupBy(
                    'ao.identificacion',
                    'ao.codigo_estudiantil',
                    'ao.nombres_del_estudiante',
                    'ao.apellidos_del_estudiante',
                    'c.nombre',
                    'ao.programa_academico',
                    'ao.tutor_id',
                    's.nombre',
                    'ao.asignatura_texto'
                )
                ->get();

            $studentRows = $normalStudentRows->concat($occasionalStudentRows);

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
            $sexoSources = [];

            if (Schema::hasColumn('asistencias', 'sexo')) {
                $sexoSources[] = (clone $baseA)
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
            }

            if (Schema::hasColumn('asistencias_ocasionales', 'sexo')) {
                $sexoSources[] = (clone $baseAO)
                    ->selectRaw("
                        TRIM(ao.identificacion) as identificacion,
                        MAX(
                            CASE
                                WHEN UPPER(TRIM(ao.sexo)) IN ('F', 'FEMENINO') THEN 'FEMENINO'
                                WHEN UPPER(TRIM(ao.sexo)) IN ('M', 'MASCULINO') THEN 'MASCULINO'
                                ELSE NULL
                            END
                        ) as sexo_norm
                    ")
                    ->groupBy('identificacion');
            }

            if ($sexoSources !== []) {
                $sexoUnion = array_shift($sexoSources);
                foreach ($sexoSources as $sexoSource) {
                    $sexoUnion->unionAll($sexoSource);
                }

                $sexoRows = DB::query()
                    ->fromSub($sexoUnion, 'sx')
                    ->selectRaw("
                        TRIM(sx.identificacion) as identificacion,
                        MAX(CASE WHEN sx.sexo_norm IN ('FEMENINO', 'MASCULINO') THEN sx.sexo_norm ELSE NULL END) as sexo_norm
                    ")
                    ->groupBy('identificacion')
                    ->get();

                foreach ($sexoRows as $row) {
                    $label = trim((string)($row->sexo_norm ?? ''));
                    if ($label === 'FEMENINO' || $label === 'MASCULINO') {
                        $sexo[$label]++;
                    } else {
                        $sexo['SIN_DATO']++;
                    }
                }
            }

            $grupos = ['NINGUNO' => 0, 'AFRO' => 0, 'INDIGENA' => 0, 'OTROS' => 0];
            $groupSources = [];

            if (Schema::hasColumn('asistencias', 'grupo_priorizado')) {
                $groupSources[] = (clone $baseA)
                    ->selectRaw("
                        TRIM(a.identificacion) as identificacion,
                        UPPER(COALESCE(NULLIF(TRIM(a.grupo_priorizado), ''), 'NINGUNO')) as gp_norm
                    ");
            }

            if (Schema::hasColumn('asistencias_ocasionales', 'grupo_priorizado')) {
                $groupSources[] = (clone $baseAO)
                    ->selectRaw("
                        TRIM(ao.identificacion) as identificacion,
                        UPPER(COALESCE(NULLIF(TRIM(ao.grupo_priorizado), ''), 'NINGUNO')) as gp_norm
                    ");
            }

            if ($groupSources !== []) {
                $groupUnion = array_shift($groupSources);
                foreach ($groupSources as $groupSource) {
                    $groupUnion->unionAll($groupSource);
                }

                $groupRows = DB::query()
                    ->fromSub($groupUnion, 'gp')
                    ->selectRaw("
                        TRIM(gp.identificacion) as identificacion,
                        gp.gp_norm as label
                    ")
                    ->get();

                $groupLabelByStudent = [];
                foreach ($groupRows as $row) {
                    $identificacion = trim((string)($row->identificacion ?? ''));
                    if ($identificacion === '') {
                        continue;
                    }

                    $raw = trim((string)($row->label ?? ''));
                    $norm = Str::of($raw)
                        ->ascii()
                        ->upper()
                        ->replaceMatches('/\s+/', ' ')
                        ->trim()
                        ->value();

                    if ($norm === '') {
                        $norm = 'NINGUNO';
                    }

                    $current = $groupLabelByStudent[$identificacion] ?? null;
                    if ($current === null || $current === 'NINGUNO') {
                        $groupLabelByStudent[$identificacion] = $norm;
                        continue;
                    }

                    if ($norm !== 'NINGUNO') {
                        $groupLabelByStudent[$identificacion] = $norm;
                    }
                }

                foreach ($groupLabelByStudent as $norm) {
                    if ($norm === '' || $norm === 'NINGUNO') {
                        $grupos['NINGUNO']++;
                        continue;
                    }

                    if (str_contains($norm, 'AFRO')) {
                        $grupos['AFRO']++;
                        continue;
                    }

                    if (
                        str_contains($norm, 'INDIGENA') ||
                        str_contains($norm, 'ETNICO') ||
                        str_contains($norm, 'ETNIA')
                    ) {
                        $grupos['INDIGENA']++;
                        continue;
                    }

                    $grupos['OTROS']++;
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
    return app(StudentNoteMatchingService::class)->subjectKeyVariants($value);
}

private function normalizeSubjectComparableText(mixed $value): string
{
    return app(StudentNoteMatchingService::class)->normalizeSubjectComparableText($value);
}

private function subjectSimilarity(string $left, string $right): float
{
    return app(StudentNoteMatchingService::class)->subjectSimilarity($left, $right);
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

private function buildBulkTutorImportCandidates(ReportPeriod $period): array
{
    return Tutor::query()
        ->where(function ($query) {
            $query->where('activo', true)
                ->orWhereNull('activo');
        })
        ->get(['id', 'codigo', 'documento', 'nombre', 'apellido', 'tipo_resolucion', 'carrera_id'])
        ->map(fn (Tutor $tutor) => $this->formatBulkTutorImportCandidate($tutor, $period))
        ->values()
        ->all();
}

private function formatBulkTutorImportCandidate(Tutor $tutor, ReportPeriod $period): array
{
    $fullName = trim($tutor->nombre . ' ' . $tutor->apellido);

    return [
        'model' => $tutor,
        'code_compact' => $this->compactTutorImportText((string) ($tutor->codigo ?? '')),
        'document_digits' => preg_replace('/\D+/', '', (string) ($tutor->documento ?? '')),
        'full_name' => $this->normalizeTutorImportText($fullName),
        'full_name_compact' => $this->compactTutorImportText($fullName),
        'period_resolution' => DB::table('tutor_period_resolutions')
            ->where('period_id', (int) $period->id)
            ->where('tutor_id', (int) $tutor->id)
            ->value('tipo_resolucion'),
    ];
}

private function bulkImportProgressCacheKey(string $token): string
{
    return 'reports.bulk_import.progress.' . $token;
}

private function writeBulkImportProgress(string $token, array $payload): void
{
    try {
        Cache::put(
            $this->bulkImportProgressCacheKey($token),
            array_merge([
                'status' => 'idle',
                'message' => null,
                'progress_percent' => 0,
                'total_files' => 0,
                'processed_files' => 0,
                'skipped_files' => 0,
                'current_index' => 0,
                'current_file' => null,
                'success' => null,
                'warning' => null,
                'updated_at' => now()->toIso8601String(),
            ], $payload, [
                'updated_at' => now()->toIso8601String(),
            ]),
            now()->addMinutes(30)
        );
    } catch (\Throwable $exception) {
        Log::warning('bulk import progress cache write failed', [
            'token' => $token,
            'message' => $exception->getMessage(),
        ]);
    }
}

private function bulkImportProgressPercent(int $completedFiles, int $totalFiles): int
{
    if ($totalFiles <= 0) {
        return 0;
    }

    return max(0, min(100, (int) round(($completedFiles / $totalFiles) * 100)));
}

private function forgetPeriodReportCaches(ReportPeriod $period): void
{
    $windows = $period->windows()
        ->orderBy('open_at')
        ->orderBy('id')
        ->get(['id', 'tutor_type']);

    $windowIds = $windows
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values()
        ->all();

    if ($windowIds === []) {
        return;
    }

    Cache::forget("rep_tree_v3_period_{$period->id}_" . md5(implode(',', $windowIds)));

    foreach (['R1', 'R2'] as $tutorType) {
        $typeWindowIds = $windows
            ->filter(fn ($window) => (string) $window->tutor_type === $tutorType)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        Cache::forget(
            "rep_tree_v3_period_{$period->id}_{$tutorType}_" . md5(implode(',', $typeWindowIds))
        );
    }

    foreach (array_values($windowIds) as $index => $windowId) {
        $idsToEvaluate = array_slice($windowIds, 0, $index + 1);
        $cacheKeyHash = md5(implode(',', $idsToEvaluate));

        Cache::forget("rep_window_chart_v6_period_{$period->id}_window_{$windowId}_{$cacheKeyHash}");
        Cache::forget("rep_window_chart_v7_period_{$period->id}_window_{$windowId}_{$cacheKeyHash}");
    }

    $chartStampKey = "rep_window_chart_stamp_period_{$period->id}";
    Cache::forever($chartStampKey, ((int) Cache::get($chartStampKey, 1)) + 1);

    $selectionStampKey = "rep_tree_selection_stamp_period_{$period->id}";
    Cache::forever($selectionStampKey, ((int) Cache::get($selectionStampKey, 1)) + 1);
}

private function activateTutorForBulkImport(Tutor $tutor, ReportPeriod $period, string $tutorType): void
{
    $existing = DB::table('tutor_period_resolutions')
        ->where('period_id', $period->id)
        ->where('tutor_id', $tutor->id)
        ->first();

    if ($existing) {
        if ((string) ($existing->tipo_resolucion ?? '') !== $tutorType) {
            throw ValidationException::withMessages([
                'tutor_type' => sprintf(
                    'El tutor %s %s ya está activo en %s para %s y no para %s.',
                    $tutor->nombre,
                    $tutor->apellido,
                    $period->code,
                    (string) ($existing->tipo_resolucion ?? ''),
                    $tutorType
                ),
            ]);
        }

        return;
    }

    DB::table('tutor_period_resolutions')->insert([
        'period_id' => $period->id,
        'tutor_id' => $tutor->id,
        'tipo_resolucion' => $tutorType,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

private function matchTutorCandidateForBulkFile(UploadedFile $file, ReportPeriod $period, ?array &$candidates = null): ?array
{
    $filenameGuess = $this->guessTutorNameFromFilename($file->getClientOriginalName());
    $directMatch = $this->findBulkTutorCandidateByLikelyName($filenameGuess, $period);
    if ($directMatch) {
        return $directMatch;
    }

    $profile = $this->extractBulkImportTutorProfile($file);
    $responsibleRaw = trim((string) ($profile['responsible'] ?? ''));
    if ($responsibleRaw !== '') {
        $directMatch = $this->findBulkTutorCandidateByLikelyName($responsibleRaw, $period);
        if ($directMatch) {
            return $directMatch;
        }
    }

    if ($candidates === null) {
        $candidates = $this->buildBulkTutorImportCandidates($period);
    }

    if ($candidates === []) {
        return null;
    }

    $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
    $normalizedName = $this->normalizeTutorImportText($originalName);
    $compactName = $this->compactTutorImportText($originalName);
    $digitsOnly = preg_replace('/\D+/', '', $originalName);

    $directMatches = [];
    foreach ($candidates as $candidate) {
        $score = 0;

        if (
            ($candidate['document_digits'] ?? '') !== ''
            && strlen((string) $candidate['document_digits']) >= 5
            && str_contains($digitsOnly, (string) $candidate['document_digits'])
        ) {
            $score = max($score, 4);
        }

        if (
            ($candidate['code_compact'] ?? '') !== ''
            && strlen((string) $candidate['code_compact']) >= 3
            && str_contains($compactName, (string) $candidate['code_compact'])
        ) {
            $score = max($score, 3);
        }

        if (
            ($candidate['full_name_compact'] ?? '') !== ''
            && str_contains($compactName, (string) $candidate['full_name_compact'])
        ) {
            $score = max($score, 5);
        }

        if (
            $score > 0
        ) {
            $directMatches[] = [
                'candidate' => $candidate,
                'score' => $score,
            ];
        }
    }

    if ($directMatches !== []) {
        usort($directMatches, fn ($a, $b) => $b['score'] <=> $a['score']);
        $best = $directMatches[0] ?? null;
        $second = $directMatches[1] ?? null;

        if ($best && (! $second || $best['score'] > $second['score'])) {
            return $best['candidate'];
        }
    }

    $responsibleNormalized = $this->normalizeTutorImportText($responsibleRaw);
    $responsibleCompact = $this->compactTutorImportText($responsibleRaw);

    if ($responsibleCompact !== '') {
        $responsibleMatches = [];

        foreach ($candidates as $candidate) {
            if (
                ($candidate['full_name_compact'] ?? '') !== ''
                && $responsibleCompact === (string) $candidate['full_name_compact']
            ) {
                $responsibleMatches[] = $candidate;
            }
        }

        if (count($responsibleMatches) === 1) {
            return $responsibleMatches[0];
        }
    }

    $bestCandidate = null;
    $bestScore = 0.0;
    $secondScore = 0.0;

    foreach ($candidates as $candidate) {
        $score = $this->tutorFilenameSimilarity(
            $normalizedName,
            (string) ($candidate['full_name'] ?? '')
        );

        if ($responsibleNormalized !== '') {
            $score = max(
                $score,
                $this->tutorFilenameSimilarity(
                    $responsibleNormalized,
                    (string) ($candidate['full_name'] ?? '')
                )
            );
        }

        if ($score > $bestScore) {
            $secondScore = $bestScore;
            $bestScore = $score;
            $bestCandidate = $candidate;
        } elseif ($score > $secondScore) {
            $secondScore = $score;
        }
    }

    if ($bestCandidate && $bestScore >= 0.92 && ($bestScore - $secondScore) >= 0.05) {
        return $bestCandidate;
    }

    return null;
}

private function findBulkTutorCandidateByLikelyName(string $fullName, ReportPeriod $period): ?array
{
    $normalizedName = $this->normalizeTutorImportText($fullName);
    if ($normalizedName === '') {
        return null;
    }

    $rawTokens = preg_split('/\s+/', trim($fullName)) ?: [];
    $tokens = array_values(array_unique(array_filter(array_map(
        fn ($token) => trim((string) $token),
        $rawTokens
    ), function (string $token) {
        return mb_strlen($token) >= 3 && ! preg_match('/^\d+$/', $token);
    })));

    if ($tokens === []) {
        return null;
    }

    usort($tokens, fn ($left, $right) => mb_strlen($right) <=> mb_strlen($left));
    $tokens = array_slice($tokens, 0, 2);

    $matches = Tutor::query()
        ->where(function ($query) {
            $query->where('activo', true)
                ->orWhereNull('activo');
        })
        ->where(function ($query) use ($tokens) {
            foreach ($tokens as $token) {
                $query->where(function ($nested) use ($token) {
                    $nested->where('nombre', 'like', '%' . $token . '%')
                        ->orWhere('apellido', 'like', '%' . $token . '%');
                });
            }
        })
        ->limit(20)
        ->get(['id', 'codigo', 'documento', 'nombre', 'apellido', 'tipo_resolucion', 'carrera_id', 'activo']);

    $exactMatch = $matches->first(function (Tutor $tutor) use ($normalizedName) {
        $fullName = $this->normalizeTutorImportText(trim($tutor->nombre . ' ' . $tutor->apellido));

        return $fullName !== '' && $fullName === $normalizedName;
    });

    if ($exactMatch) {
        return $this->formatBulkTutorImportCandidate($exactMatch, $period);
    }

    if ($matches->count() !== 1) {
        return null;
    }

    $candidate = $matches->first();
    if (! $candidate) {
        return null;
    }

    $score = $this->tutorFilenameSimilarity(
        $normalizedName,
        trim($candidate->nombre . ' ' . $candidate->apellido)
    );

    if ($score < 0.92) {
        return null;
    }

    return $this->formatBulkTutorImportCandidate($candidate, $period);
}

private function createTutorCandidateFromBulkFile(UploadedFile $file, ReportPeriod $period): ?array
{
    $profile = $this->extractBulkImportTutorProfile($file);
    $responsible = trim((string) ($profile['responsible'] ?? ''));
    $program = trim((string) ($profile['program'] ?? ''));

    if ($responsible === '') {
        $responsible = $this->guessTutorNameFromFilename($file->getClientOriginalName());
    }

    $normalizedResponsible = $this->normalizeTutorImportText($responsible);
    if ($normalizedResponsible === '') {
        return null;
    }

    $existingTutor = Tutor::query()
        ->get(['id', 'codigo', 'documento', 'nombre', 'apellido', 'tipo_resolucion', 'carrera_id', 'activo'])
        ->first(function (Tutor $tutor) use ($normalizedResponsible) {
            $fullName = $this->normalizeTutorImportText(trim($tutor->nombre . ' ' . $tutor->apellido));

            return $fullName !== '' && $fullName === $normalizedResponsible;
        });

    if ($existingTutor) {
        if (! $existingTutor->activo) {
            $existingTutor->forceFill(['activo' => true])->save();
        }

        return $this->formatBulkTutorImportCandidate($existingTutor, $period);
    }

    $career = $this->resolveCareerForAutoCreatedTutor($program);
    if (! $career) {
        return null;
    }

    [$nombre, $apellido] = $this->splitTutorFullName($responsible);
    if ($nombre === '' || $apellido === '') {
        return null;
    }

    $identitySeed = $this->compactTutorImportText($responsible);
    if ($identitySeed === '') {
        $identitySeed = strtoupper(Str::random(12));
    }

    $slugSeed = Str::lower(Str::slug($responsible, '.'));
    if ($slugSeed === '') {
        $slugSeed = 'tutor.importado.' . Str::lower(Str::random(6));
    }

    $codigo = $this->makeUniqueImportedTutorValue('codigo', 'AUTO-' . Str::limit($identitySeed, 28, ''));
    $documento = $this->makeUniqueImportedTutorValue('documento', 'IMP-' . Str::limit($identitySeed, 30, ''));
    $correo = $this->makeUniqueImportedTutorEmail($slugSeed);

    $tutor = Tutor::create([
        'codigo' => $codigo,
        'cedula_hash' => Hash::make($documento),
        'nombre' => $nombre,
        'apellido' => $apellido,
        'tipo_documento' => 'CC',
        'documento' => $documento,
        'lugar_expedicion' => 'IMPORTACION MASIVA',
        'sexo' => 'Otro',
        'grupo_priorizado' => 'Ninguno',
        'sede' => $this->inferImportedTutorSede($program),
        'carrera_id' => (int) $career->id,
        'correo' => $correo,
        'telefono' => '0000000000',
        'activo' => true,
    ]);

    return $this->formatBulkTutorImportCandidate($tutor, $period);
}

private function extractBulkImportTutorProfile(UploadedFile $file): array
{
    $cacheKey = $file->getPathname();
    if (isset($this->bulkImportWorkbookProfileCache[$cacheKey])) {
        return $this->bulkImportWorkbookProfileCache[$cacheKey];
    }

    $responsible = null;
    $program = null;
    $workbookPath = $file->getPathname();

    try {
        $sheetPreviews = $this->loadWorkbookPreviewSheets($workbookPath);
    } catch (\Throwable) {
        $sheetPreviews = [];
    }

    foreach ($sheetPreviews as $rows) {
        foreach ($rows as $row) {
            $columns = array_keys($row);
            foreach ($columns as $index => $column) {
                $value = $this->normalizeTutorImportText((string) ($row[$column] ?? ''));
                if ($value !== 'RESPONSABLE') {
                    continue;
                }

                for ($offset = 1; $offset <= 3; $offset++) {
                    $nextColumn = $columns[$index + $offset] ?? null;
                    if ($nextColumn === null) {
                        continue;
                    }

                    $candidate = trim((string) ($row[$nextColumn] ?? ''));
                    if ($candidate !== '') {
                        $responsible = $candidate;
                        break 3;
                    }
                }
            }
        }
    }

    foreach ($sheetPreviews as $rows) {
        $programColumn = null;
        foreach ($rows as $rowIndex => $row) {
            if ($rowIndex > 12) {
                break;
            }

            foreach ($row as $column => $value) {
                $normalized = $this->normalizeTutorImportText((string) $value);
                if (in_array($normalized, ['PROGRAMA ACADEMICO', 'PROGRAMA ACADEMICO '], true)) {
                    $programColumn = $column;
                    break 2;
                }
            }
        }

        if (! $programColumn) {
            continue;
        }

        foreach ($rows as $rowIndex => $row) {
            if ($rowIndex <= 12) {
                continue;
            }

            $candidate = trim((string) ($row[$programColumn] ?? ''));
            if ($candidate !== '') {
                $program = $candidate;
                break 2;
            }
        }
    }

    return $this->bulkImportWorkbookProfileCache[$cacheKey] = [
        'responsible' => $responsible ? trim($responsible) : null,
        'program' => $program ? trim($program) : null,
    ];
}

private function extractTutorResponsibleFromWorkbook(UploadedFile $file): ?string
{
    return $this->extractBulkImportTutorProfile($file)['responsible'] ?? null;
}

private function extractTutorProgramFromWorkbook(UploadedFile $file): ?string
{
    return $this->extractBulkImportTutorProfile($file)['program'] ?? null;
}

private function loadWorkbookPreviewSheets(string $workbookPath): array
{
    $reader = $this->makeWorkbookReader($workbookPath);
    $spreadsheet = null;

    try {
        $sheetNames = array_slice($reader->listWorksheetNames($workbookPath), 0, 2);
        if ($sheetNames === []) {
            return [];
        }

        $reader->setLoadSheetsOnly($sheetNames);
        $reader->setReadFilter($this->buildWorkbookPreviewFilter());
        $spreadsheet = $reader->load($workbookPath);
        $previews = [];

        foreach ($sheetNames as $index => $sheetName) {
            $sheet = $spreadsheet->getSheetByName($sheetName) ?? $spreadsheet->getSheet($index);
            $previews[$sheetName] = $sheet->rangeToArray('A1:Z15', null, false, true, true);
        }

        return $previews;
    } finally {
        if ($spreadsheet !== null) {
            $spreadsheet->disconnectWorksheets();
        }

        unset($sheet, $spreadsheet, $reader);
        gc_collect_cycles();
    }
}

private function buildWorkbookPreviewFilter(): IReadFilter
{
    return new class implements IReadFilter
    {
        public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
        {
            return $row <= 15 && Coordinate::columnIndexFromString($columnAddress) <= 26;
        }
    };
}

private function makeWorkbookReader(string $workbookPath): IReader
{
    $reader = IOFactory::createReaderForFile($workbookPath);
    $reader->setReadDataOnly(true);
    $reader->setReadEmptyCells(false);
    $reader->setIgnoreRowsWithNoCells(true);
    $reader->setIncludeCharts(false);

    return $reader;
}

private function tutorFilenameSimilarity(string $left, string $right): float
{
    if ($left === '' || $right === '') {
        return 0.0;
    }

    if ($left === $right) {
        return 1.0;
    }

    $compactLeft = $this->compactTutorImportText($left);
    $compactRight = $this->compactTutorImportText($right);

    if ($compactLeft !== '' && $compactLeft === $compactRight) {
        return 1.0;
    }

    $maxLen = max(strlen($compactLeft), strlen($compactRight));
    if ($maxLen === 0) {
        return 0.0;
    }

    $distance = levenshtein($compactLeft, $compactRight);
    $distanceScore = max(0.0, 1 - ($distance / $maxLen));

    similar_text($compactLeft, $compactRight, $percent);
    $similarityScore = max(0.0, min(1.0, $percent / 100));

    $tokenScore = $this->tutorNameCoverageScore($left, $right);

    return max($distanceScore, $similarityScore, $tokenScore);
}

private function normalizeTutorImportText(string $value): string
{
    $value = trim(Str::upper($value));
    $value = str_replace(
        ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'],
        ['A', 'E', 'I', 'O', 'U', 'U', 'N'],
        $value
    );
    $value = str_replace(['_', '-', '.', '(', ')', '[', ']', '{', '}', ','], ' ', $value);
    $value = preg_replace('/[^A-Z0-9\s]/', ' ', $value) ?? '';

    return preg_replace('/\s+/', ' ', trim($value)) ?? '';
}

private function compactTutorImportText(string $value): string
{
    return preg_replace('/[^A-Z0-9]/', '', $this->normalizeTutorImportText($value)) ?? '';
}

private function guessTutorNameFromFilename(string $filename): string
{
    $base = pathinfo($filename, PATHINFO_FILENAME);
    $normalized = $this->normalizeTutorImportText($base);
    $tokens = preg_split('/\s+/', $normalized) ?: [];
    $stopWords = [
        'REGISTRO', 'CONTABILIZACION', 'ASISTENCIAS', 'TUTORIAS', 'FORMATO',
        'TUTOR', 'ESTUDIANTE', 'POR', 'DE', 'DEL', 'LA', 'EL', 'Y', 'EN',
        'INFORME', 'PRIMER', 'SEGUNDO', 'TERCER', 'CUARTO', 'CONTADURIA',
        'PUBLICA', 'INGENIERIA', 'SISTEMAS',
    ];

    $nameTokens = array_values(array_filter($tokens, function (string $token) use ($stopWords) {
        if (strlen($token) <= 1) {
            return false;
        }

        if (in_array($token, $stopWords, true)) {
            return false;
        }

        return ! preg_match('/^\d+$/', $token);
    }));

    return implode(' ', $nameTokens);
}

private function splitTutorFullName(string $fullName): array
{
    $normalized = $this->normalizeTutorImportText($fullName);
    $tokens = preg_split('/\s+/', $normalized) ?: [];
    $tokens = array_values(array_filter($tokens));

    if (count($tokens) < 2) {
        return [$normalized, ''];
    }

    if (count($tokens) === 2) {
        return [$tokens[0], $tokens[1]];
    }

    if (count($tokens) === 3) {
        return [$tokens[0], implode(' ', array_slice($tokens, 1))];
    }

    return [
        implode(' ', array_slice($tokens, 0, -2)),
        implode(' ', array_slice($tokens, -2)),
    ];
}

private function resolveCareerForAutoCreatedTutor(string $program): ?Carrera
{
    $normalizedProgram = $this->normalizeTutorImportText($program);
    if ($normalizedProgram === '') {
        return null;
    }

    $aliases = [
        'ING SISTEMAS' => 'INGENIERIA DE SISTEMAS',
        'INGENIERIA SISTEMAS' => 'INGENIERIA DE SISTEMAS',
        'INGENIERIA EN SISTEMAS' => 'INGENIERIA DE SISTEMAS',
        'CONTADURIA PUBLICA AMPLIACION LUGAR DE DESARROLLO MAICAO' => 'CONTADURIA PUBLICA',
        'LIC EN EDU INFANTIL' => 'LICENCIATURA EN EDUCACION INFANTIL',
        'LIC EDUCACION INFANTIL' => 'LICENCIATURA EN EDUCACION INFANTIL',
    ];

    $target = $aliases[$normalizedProgram] ?? $normalizedProgram;

    $careers = Carrera::query()->get(['id', 'nombre', 'codigo']);
    foreach ($careers as $career) {
        $normalizedCareer = $this->normalizeTutorImportText((string) $career->nombre);
        if ($normalizedCareer === $target) {
            return $career;
        }
    }

    foreach ($careers as $career) {
        $normalizedCareer = $this->normalizeTutorImportText((string) $career->nombre);
        if (
            $normalizedCareer !== ''
            && (str_contains($normalizedProgram, $normalizedCareer) || str_contains($normalizedCareer, $target))
        ) {
            return $career;
        }
    }

    return null;
}

private function inferImportedTutorSede(string $program): string
{
    $normalizedProgram = $this->normalizeTutorImportText($program);

    if (str_contains($normalizedProgram, 'MAICAO')) {
        return 'MAICAO';
    }

    return 'SIN DEFINIR';
}

private function makeUniqueImportedTutorValue(string $column, string $base): string
{
    $value = trim($base);
    if ($value === '') {
        $value = strtoupper(Str::random(12));
    }

    $maxLength = 50;
    $candidate = Str::upper(Str::limit($value, $maxLength, ''));
    $suffix = 1;

    while (Tutor::query()->where($column, $candidate)->exists()) {
        $suffix++;
        $suffixText = '-' . $suffix;
        $candidate = Str::upper(
            Str::limit($value, max(1, $maxLength - strlen($suffixText)), '')
        ) . $suffixText;
    }

    return $candidate;
}

private function makeUniqueImportedTutorEmail(string $slugSeed): string
{
    $localPart = trim($slugSeed, '.');
    if ($localPart === '') {
        $localPart = 'tutor.importado';
    }

    $base = Str::limit($localPart, 48, '');
    $candidate = $base . '@bienestar.invalid';
    $suffix = 1;

    while (Tutor::query()->where('correo', $candidate)->exists()) {
        $suffix++;
        $suffixText = '.' . $suffix;
        $candidate = Str::limit($base, max(1, 48 - strlen($suffixText)), '') . $suffixText . '@bienestar.invalid';
    }

    return $candidate;
}

private function tutorNameCoverageScore(string $left, string $right): float
{
    $leftTokens = $this->meaningfulTutorNameTokens($left);
    $rightTokens = $this->meaningfulTutorNameTokens($right);

    if (count($leftTokens) < 2 || count($rightTokens) < 2) {
        return 0.0;
    }

    $shared = array_values(array_unique(array_intersect($leftTokens, $rightTokens)));
    $sharedCount = count($shared);

    if ($sharedCount < 2) {
        return 0.0;
    }

    $leftCoverage = $sharedCount / count($leftTokens);
    $rightCoverage = $sharedCount / count($rightTokens);

    if ($leftCoverage >= 1.0) {
        return max(0.95, min(0.99, 0.90 + ($rightCoverage * 0.09)));
    }

    if ($rightCoverage >= 1.0) {
        return max(0.93, min(0.98, 0.88 + ($leftCoverage * 0.10)));
    }

    return max(0.0, min(0.91, max($leftCoverage, $rightCoverage)));
}

private function meaningfulTutorNameTokens(string $value): array
{
    static $ignored = [
        'REGISTRO' => true,
        'CONTABILIZACION' => true,
        'ASISTENCIA' => true,
        'ASISTENCIAS' => true,
        'TUTOR' => true,
        'TUTORES' => true,
        'TUTORIA' => true,
        'TUTORIAS' => true,
        'FORMATO' => true,
        'INFORME' => true,
        'ENTREGA' => true,
        'CORTE' => true,
        'ESTUDIANTE' => true,
        'PLANIFICADAS' => true,
        'OCASIONALES' => true,
        'PRIMER' => true,
        'PRIMERA' => true,
        'SEGUNDO' => true,
        'SEGUNDA' => true,
        'TERCER' => true,
        'TERCERA' => true,
        'CUARTO' => true,
        'CUARTA' => true,
        'QUINTO' => true,
        'QUINTA' => true,
        'SEXTO' => true,
        'SEXTA' => true,
        'DE' => true,
        'DEL' => true,
        'LA' => true,
        'EL' => true,
        'LOS' => true,
        'LAS' => true,
        'Y' => true,
        'EN' => true,
        'PARA' => true,
        'CON' => true,
    ];

    $tokens = preg_split('/\s+/', $this->normalizeTutorImportText($value)) ?: [];

    return array_values(array_unique(array_filter($tokens, function ($token) use ($ignored) {
        if (! is_string($token)) {
            return false;
        }

        $token = trim($token);
        if ($token === '' || isset($ignored[$token])) {
            return false;
        }

        if (strlen($token) < 3) {
            return false;
        }

        if (preg_match('/^\d+$/', $token) === 1) {
            return false;
        }

        return preg_match('/[A-Z]/', $token) === 1;
    })));
}
}
