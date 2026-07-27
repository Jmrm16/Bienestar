<?php

namespace App\Http\Controllers\PortalTutor;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\AsistenciaOcasional;
use App\Models\GrupoT;
use App\Models\Nota;
use App\Models\TutorReport;
use App\Models\ReportWindow;
use App\Models\Tutor;
use App\Services\StudentNoteMatchingService;
use App\Services\StudentProfileResolver;
use App\Services\TutorAttendanceImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class TutorReportController extends Controller
{
    /**
     * Vista para subir asistencias
     */
    public function upload(ReportWindow $window)
    {
        $tutorAuth = Auth::guard('tutor')->user();
        abort_unless($tutorAuth, 403);

        $tutor = Tutor::findOrFail($tutorAuth->id);

        abort_unless($window->is_published, 403);

        $today = now()->toDateString();
        if (
            ($window->open_at && $window->open_at->toDateString() > $today) ||
            ($window->due_at && $window->due_at->toDateString() < $today)
        ) {
            abort(403, 'La ventana no está disponible');
        }

        $period = $window->period;
        abort_unless($period && $period->is_active, 403);

        $availableWindowIds = collect($this->availableWindowsForTutor($tutor, $window))
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        abort_unless(
            $availableWindowIds->contains((int) $window->id),
            403,
            'No tienes acceso a esta entrega.'
        );

        return Inertia::render('Tutores/Upload', [
            'window' => [
                'id' => $window->id,
                'name' => $window->name,
                'instructions' => $window->instructions,
            ],
        ]);
    }

    /**
     * ✅ IMPORTAR ASISTENCIAS (HOJA 1 normal + HOJA 2 ocasionales)
     *
     * REGLA anti-duplicado (NORMAL):
     * - Mismo periodo + misma ventana + mismo tutor + mismo grupo_id + mismo estudiante + misma fecha => NO insertar
     *
     * ✅ MEJORA DESTINO (NORMAL):
     * - Soporta códigos de grupo con variantes (A1 / 1A).
     * - Permite resolver por asignatura cuando no hay código de grupo.
     * - Aplica similitud de asignatura para tolerar errores leves de escritura.
     *
     * REGLA anti-duplicado (OCASIONALES):
     * - Se guarda en asistencias_ocasionales con unique_key hash (period+window+tutor+ident+fecha+asignatura_texto+grupo_texto)
     */
    public function import(Request $request, ReportWindow $window, TutorAttendanceImportService $importService)
    {
        $tutorAuth = Auth::guard('tutor')->user();
        abort_unless($tutorAuth, 403);

        $tutor = Tutor::findOrFail($tutorAuth->id);

        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls',
        ]);

        $archivo = $request->file('archivo');
        try {
            $stats = $importService->importWorkbookForTutorWindow($tutor, $window, $archivo);
            $msg = $importService->buildImportMessage($stats);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                'archivo' => $exception->getMessage() ?: 'No se pudo importar el archivo.',
            ]);
        }

        return redirect()
            ->route('portal.tutor.home', ['tab' => 'informes'])
            ->with('success', $msg);
    }

    /**
     * ✅ Ver asistencias de un grupo (por ventana) + notas
     */
    public function asistenciasGrupo(ReportWindow $window, GrupoT $grupo)
    {
        $tutorAuth = Auth::guard('tutor')->user();
        abort_unless($tutorAuth, 403);

        $tutor = Tutor::findOrFail($tutorAuth->id);

        $period = $window->period;
        abort_unless($period, 403);

        $isMine = $tutor->grupos()
            ->wherePivot('period_id', $period->id)
            ->where('grupo_t.id', $grupo->id)
            ->exists();

        abort_unless($isMine, 403, 'No tienes acceso a este grupo');

        $grupo->load('asignatura');

        $windowsForTutor = collect($this->availableWindowsForTutor($tutor, $window));
        $windowIds = $windowsForTutor
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->values()
            ->all();

        if ($windowIds === []) {
            $windowIds = [(int) $window->id];
        }

        $asistencias = Asistencia::where('grupo_id', $grupo->id)
            ->where('period_id', $period->id)
            ->whereIn('report_window_id', $windowIds)
            ->where('tutor_id', $tutor->id)
            ->orderBy('apellidos_del_estudiante')
            ->orderBy('nombres_del_estudiante')
            ->orderBy('fecha')
            ->get();
        $studentProfiles = app(StudentProfileResolver::class)->resolveManyForPeriod(
            $period->id,
            $asistencias->pluck('identificacion')->all()
        );

        $notasIndexes = $this->buildNotasIndexes(
            Nota::where('period_id', $period->id)
                ->get(['id', 'identificacion', 'codigo', 'nombres', 'apellidos', 'programa', 'ide_programa', 'materia', 'grupo', 'nota_1', 'nota_2', 'nota_3', 'definitiva', 'final', 'updated_at'])
        );

        $materiaGrupoLabel = trim((string) (optional($grupo->asignatura)->nombre ?? ''));
        $materiaGrupoNorm = $this->norm($materiaGrupoLabel);
        $grupoCodigo = (string) ($grupo->codigo ?? '');

        $resultado = $asistencias
            ->groupBy(fn ($a) => $this->normId((string) $a->identificacion))
            ->map(function ($items) use ($notasIndexes, $materiaGrupoNorm, $materiaGrupoLabel, $grupoCodigo, $studentProfiles) {
                $first = $items->first();
                $profile = $studentProfiles[$this->normId((string) $first->identificacion)] ?? [];

                $nota = $this->resolveNotaFromIndexes(
                    $notasIndexes,
                    (string) $first->identificacion,
                    (string) ($first->codigo_estudiantil ?? ''),
                    $this->preferText($first->nombres_del_estudiante, $profile['nombres'] ?? ''),
                    $this->preferText($first->apellidos_del_estudiante, $profile['apellidos'] ?? ''),
                    $this->preferText($first->programa_academico, $profile['programa'] ?? ''),
                    $materiaGrupoNorm,
                    $grupoCodigo
                );

                $fechas = $items->pluck('fecha')
                    ->map(fn ($f) => (string) $f)
                    ->filter(fn ($f) => $f !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                return [
                    'id' => $first->id,
                    'estudiante' => trim(
                        $this->preferText($first->nombres_del_estudiante, $profile['nombres'] ?? '') . ' ' .
                        $this->preferText($first->apellidos_del_estudiante, $profile['apellidos'] ?? '')
                    ),
                    'codigo' => $this->preferText($first->codigo_estudiantil, $profile['codigo'] ?? ''),
                    'programa' => $this->preferText($first->programa_academico, $profile['programa'] ?? ''),
                    'materia' => $materiaGrupoLabel !== '' ? $materiaGrupoLabel : null,
                    'sexo' => $this->preferSexo($first->sexo, $profile['sexo'] ?? ''),
                    'grupo_priorizado' => $this->preferText($first->grupo_priorizado, $profile['grupo_priorizado'] ?? '') ?: '—',
                    'total_asistencias' => (int) count($fechas),
                    'fecha' => implode(', ', $fechas),
                    'fechas' => $fechas,
                    'nota_1' => $nota?->nota_1,
                    'nota_2' => $nota?->nota_2,
                    'nota_3' => $nota?->nota_3,
                    'definitiva' => $nota?->definitiva,
                    'final' => $nota?->final,
                ];
            })
            ->values();

        return Inertia::render('Tutores/Asistencias', [
            'window' => [
                'id' => $window->id,
                'name' => $window->name,
            ],
            'windows' => $windowsForTutor->values()->all(),
            'grupo' => [
                'id' => $grupo->id,
                'nombre' => $grupo->nombre,
                'materia' => optional($grupo->asignatura)->nombre,
            ],
            'asistencias' => $resultado,
        ]);
    }

    /**
     * ✅ Ver asistencias OCASIONALES (por ventana) + notas (si aplican)
     */
    public function asistenciasOcasionales(ReportWindow $window)
    {
        $tutorAuth = Auth::guard('tutor')->user();
        abort_unless($tutorAuth, 403);

        $tutor = Tutor::findOrFail($tutorAuth->id);

        abort_unless($window->is_published, 403);

        $period = $window->period;
        abort_unless($period, 403);

        $windowsForTutor = collect($this->availableWindowsForTutor($tutor, $window));
        $windowIds = $windowsForTutor
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->values()
            ->all();

        if ($windowIds === []) {
            $windowIds = [(int) $window->id];
        }

        $ocasionales = AsistenciaOcasional::where('period_id', $period->id)
            ->whereIn('report_window_id', $windowIds)
            ->where('tutor_id', $tutor->id)
            ->orderBy('apellidos_del_estudiante')
            ->orderBy('nombres_del_estudiante')
            ->orderBy('asignatura_texto')
            ->orderBy('grupo_texto')
            ->orderBy('fecha')
            ->get();
        $studentProfiles = app(StudentProfileResolver::class)->resolveManyForPeriod(
            $period->id,
            $ocasionales->pluck('identificacion')->all()
        );

        $notasIndexes = $this->buildNotasIndexes(
            Nota::where('period_id', $period->id)
                ->get(['id', 'identificacion', 'codigo', 'nombres', 'apellidos', 'programa', 'ide_programa', 'materia', 'grupo', 'nota_1', 'nota_2', 'nota_3', 'definitiva', 'final', 'updated_at'])
        );

        $resultado = $ocasionales
            ->groupBy(function ($a) {
                $ident = $this->normId((string) $a->identificacion);
                $asig  = $this->norm((string) ($a->asignatura_texto ?? ''));
                $grp   = $this->norm((string) ($a->grupo_texto ?? ''));
                return $ident . '|' . $asig . '|' . $grp;
            })
            ->map(function ($items) use ($notasIndexes, $studentProfiles) {
                $first = $items->first();
                $profile = $studentProfiles[$this->normId((string) $first->identificacion)] ?? [];

                $nota = $this->resolveNotaFromIndexes(
                    $notasIndexes,
                    (string) $first->identificacion,
                    (string) ($first->codigo_estudiantil ?? ''),
                    $this->preferText($first->nombres_del_estudiante, $profile['nombres'] ?? ''),
                    $this->preferText($first->apellidos_del_estudiante, $profile['apellidos'] ?? ''),
                    $this->preferText($first->programa_academico, $profile['programa'] ?? ''),
                    (string) ($first->asignatura_texto ?? ''),
                    (string) ($first->grupo_texto ?? '')
                );

                $fechas = $items->pluck('fecha')
                    ->map(fn ($f) => (string) $f)
                    ->filter(fn ($f) => $f !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                return [
                    'id' => $first->id,
                    'estudiante' => trim(
                        $this->preferText($first->nombres_del_estudiante, $profile['nombres'] ?? '') . ' ' .
                        $this->preferText($first->apellidos_del_estudiante, $profile['apellidos'] ?? '')
                    ),
                    'codigo' => $this->preferText($first->codigo_estudiantil, $profile['codigo'] ?? ''),
                    'programa' => $this->preferText($first->programa_academico, $profile['programa'] ?? ''),
                    'sexo' => $this->preferSexo($first->sexo, $profile['sexo'] ?? ''),
                    'grupo_priorizado' => $this->preferText($first->grupo_priorizado, $profile['grupo_priorizado'] ?? '') ?: '—',

                    'asignatura_texto' => $first->asignatura_texto,
                    'grupo_texto' => $first->grupo_texto,

                    'total_asistencias' => (int) count($fechas),
                    'fecha' => implode(', ', $fechas),
                    'fechas' => $fechas,

                    'nota_1' => $nota?->nota_1,
                    'nota_2' => $nota?->nota_2,
                    'nota_3' => $nota?->nota_3,
                    'definitiva' => $nota?->definitiva,
                    'final' => $nota?->final,
                ];
            })
            ->values();

        return Inertia::render('Tutores/AsistenciasOcasionales', [
            'window' => [
                'id' => $window->id,
                'name' => $window->name,
            ],
            'windows' => $windowsForTutor->values()->all(),
            'asistencias' => $resultado,
        ]);
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    private function norm(string $s): string
    {
        $s = trim(mb_strtoupper($s));
        $s = str_replace(['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'], ['A', 'E', 'I', 'O', 'U', 'U', 'N'], $s);
        return preg_replace('/\s+/', ' ', $s);
    }

    private function normId(string $id): string
    {
        $id = trim(mb_strtoupper($id));
        return preg_replace('/[^0-9A-Z]/', '', $id);
    }

    private function isDayNumber($v): bool
    {
        if (!is_numeric($v)) return false;
        $n = (int) $v;
        return $n >= 1 && $n <= 31;
    }

    private function containsAnyMonth(string $joined): bool
    {
        foreach (['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'] as $m) {
            if (str_contains($joined, $m)) return true;
        }
        return false;
    }

    private function isSpanishMonth(string $s): bool
    {
        return in_array($s, ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'], true);
    }

    private function monthNumberFromSpanish(string $m): ?int
    {
        $map = [
            'ENERO' => 1, 'FEBRERO' => 2, 'MARZO' => 3, 'ABRIL' => 4, 'MAYO' => 5, 'JUNIO' => 6,
            'JULIO' => 7, 'AGOSTO' => 8, 'SEPTIEMBRE' => 9, 'OCTUBRE' => 10, 'NOVIEMBRE' => 11, 'DICIEMBRE' => 12,
        ];
        return $map[$m] ?? null;
    }

    private function yearFromPeriodCode(?string $code): ?int
    {
        if (!$code) return null;
        if (preg_match('/(\d{4})/', $code, $m)) return (int) $m[1];
        return null;
    }

    private function findColByContains(array $row, string $needle): ?string
    {
        $needle = $this->norm($needle);
        foreach ($row as $col => $cell) {
            if (str_contains($this->norm((string) $cell), $needle)) return (string) $col;
        }
        return null;
    }

    private function findColByExact(array $row, string $exact): ?string
    {
        $exact = $this->norm($exact);
        foreach ($row as $col => $cell) {
            if ($this->norm((string) $cell) === $exact) return (string) $col;
        }
        return null;
    }

    private function findColByContainsLast(array $row, string $needle): ?string
    {
        $needle = $this->norm($needle);
        $last = null;
        foreach ($row as $col => $cell) {
            if (str_contains($this->norm((string) $cell), $needle)) $last = (string) $col;
        }
        return $last;
    }

    private function availableWindowsForTutor(Tutor $tutor, ReportWindow $currentWindow)
    {
        $windows = ReportWindow::query()
            ->join('tutor_reports as tr', 'tr.window_id', '=', 'report_windows.id')
            ->where('tr.tutor_id', $tutor->id)
            ->where('report_windows.period_id', $currentWindow->period_id)
            ->where('report_windows.is_published', true)
            ->distinct()
            ->orderBy('report_windows.open_at')
            ->orderBy('report_windows.id')
            ->get([
                'report_windows.id',
                'report_windows.name',
            ]);

        if ($windows->isEmpty()) {
            $dataWindowIds = Asistencia::query()
                ->where('tutor_id', $tutor->id)
                ->where('period_id', $currentWindow->period_id)
                ->whereNotNull('report_window_id')
                ->pluck('report_window_id')
                ->merge(
                    AsistenciaOcasional::query()
                        ->where('tutor_id', $tutor->id)
                        ->where('period_id', $currentWindow->period_id)
                        ->whereNotNull('report_window_id')
                        ->pluck('report_window_id')
                )
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values();

            if ($dataWindowIds->isNotEmpty()) {
                $windows = ReportWindow::query()
                    ->where('period_id', $currentWindow->period_id)
                    ->where('is_published', true)
                    ->whereIn('id', $dataWindowIds->all())
                    ->orderBy('open_at')
                    ->orderBy('id')
                    ->get(['id', 'name']);
            }
        }

        if ($windows->isEmpty()) {
            $tutorType = $tutor->resolutionForPeriod((int) $currentWindow->period_id);
            if ($tutorType !== null && $tutorType !== '') {
                $windows = ReportWindow::query()
                    ->where('period_id', $currentWindow->period_id)
                    ->where('is_published', true)
                    ->where('tutor_type', $tutorType)
                    ->orderBy('open_at')
                    ->orderBy('id')
                    ->get(['id', 'name']);
            } else {
                $windows = collect();
            }
        }

        if ($windows->isEmpty()) {
            $windows = collect([$currentWindow]);
        }

        return $windows
            ->map(fn ($w) => [
                'id' => (int) $w->id,
                'name' => (string) $w->name,
            ])
            ->values()
            ->all();
    }

    private function resolveTutorGroup(array $gruposTutorData, string $codigoGrupoRaw, string $asignaturaRaw): ?GrupoT
    {
        $codigoVariants = $this->groupCodeVariants($codigoGrupoRaw);
        $asignaturaNorm = $this->norm($asignaturaRaw);

        if ($codigoVariants === [] && $asignaturaNorm === '') {
            return null;
        }

        $codeMatched = [];
        if ($codigoVariants !== []) {
            foreach ($gruposTutorData as $item) {
                if ($this->codeVariantsIntersect($codigoVariants, $item['codigo_variants'] ?? [])) {
                    $codeMatched[] = $item;
                }
            }
        }

        if ($codeMatched !== [] && $asignaturaNorm !== '') {
            $exact = array_values(array_filter(
                $codeMatched,
                fn ($item) => ($item['asignatura_norm'] ?? '') === $asignaturaNorm
            ));

            if (count($exact) === 1) {
                return $exact[0]['group'];
            }
        }

        if ($codeMatched !== []) {
            if ($asignaturaNorm === '') {
                return count($codeMatched) === 1 ? $codeMatched[0]['group'] : null;
            }

            $bestByCode = $this->pickBestByAsignatura($codeMatched, $asignaturaNorm, 0.74, 0.08);
            if ($bestByCode) {
                return $bestByCode;
            }
        }

        if ($asignaturaNorm !== '') {
            $exactAsig = array_values(array_filter(
                $gruposTutorData,
                fn ($item) => ($item['asignatura_norm'] ?? '') === $asignaturaNorm
            ));

            if (count($exactAsig) === 1) {
                return $exactAsig[0]['group'];
            }

            return $this->pickBestByAsignatura($gruposTutorData, $asignaturaNorm, 0.90, 0.10);
        }

        return null;
    }

    private function pickBestByAsignatura(array $items, string $asignaturaNorm, float $minScore, float $minGap): ?GrupoT
    {
        $scored = [];

        foreach ($items as $item) {
            $score = $this->subjectSimilarity($asignaturaNorm, (string) ($item['asignatura_norm'] ?? ''));
            if ($score <= 0) {
                continue;
            }

            $scored[] = [
                'group' => $item['group'],
                'score' => $score,
            ];
        }

        if ($scored === []) {
            return null;
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        $best = $scored[0];
        if ($best['score'] < $minScore) {
            return null;
        }

        $second = $scored[1] ?? null;
        if ($second && (($best['score'] - $second['score']) < $minGap)) {
            return null;
        }

        return $best['group'];
    }

    private function normalizeGroupCode(string $code): string
    {
        return preg_replace('/[^0-9A-Z]/', '', $this->norm($code));
    }

    private function groupCodeVariants(string $code): array
    {
        $norm = $this->normalizeGroupCode($code);
        if ($norm === '') {
            return [];
        }

        $variants = [$norm];

        $withoutPrefix = preg_replace('/^(GRUPO|GRP|GPO|GR)/', '', $norm);
        if ($withoutPrefix !== '' && $withoutPrefix !== $norm) {
            $variants[] = $withoutPrefix;
        }

        foreach (array_values(array_unique($variants)) as $base) {
            $letters = preg_replace('/[^A-Z]/', '', $base);
            $digits = preg_replace('/[^0-9]/', '', $base);

            if ($letters !== '' && $digits !== '') {
                $variants[] = $letters . $digits;
                $variants[] = $digits . $letters;
            }
        }

        return array_values(array_unique(array_filter($variants)));
    }

    private function codeVariantsIntersect(array $left, array $right): bool
    {
        if ($left === [] || $right === []) {
            return false;
        }

        foreach ($left as $value) {
            if (in_array($value, $right, true)) {
                return true;
            }
        }

        return false;
    }

    private function subjectSimilarity(string $left, string $right): float
    {
        if ($left === '' || $right === '') {
            return 0.0;
        }

        if ($left === $right) {
            return 1.0;
        }

        $maxLen = max(strlen($left), strlen($right));
        if ($maxLen === 0) {
            return 0.0;
        }

        $distance = levenshtein($left, $right);
        $distanceScore = max(0.0, 1 - ($distance / $maxLen));

        $tokenScore = $this->tokenOverlapScore($left, $right);

        if (str_contains($left, $right) || str_contains($right, $left)) {
            $ratio = min(strlen($left), strlen($right)) / $maxLen;
            $tokenScore = max($tokenScore, max(0.86, $ratio));
        }

        return max(0.0, min(1.0, max($distanceScore, $tokenScore)));
    }

    private function tokenOverlapScore(string $left, string $right): float
    {
        $leftTokens = array_values(array_unique(array_filter(
            explode(' ', $left),
            fn ($token) => strlen($token) > 1
        )));
        $rightTokens = array_values(array_unique(array_filter(
            explode(' ', $right),
            fn ($token) => strlen($token) > 1
        )));

        if ($leftTokens === [] || $rightTokens === []) {
            return 0.0;
        }

        $intersection = count(array_intersect($leftTokens, $rightTokens));
        return $intersection / max(count($leftTokens), count($rightTokens));
    }

    private function buildNotasIndexes($notas): array
    {
        return app(StudentNoteMatchingService::class)->buildNoteMaps($notas);
    }

    private function resolveNotaFromIndexes(
        array $indexes,
        string $identificacion,
        string $codigo,
        string $nombres,
        string $apellidos,
        string $programa,
        string $materia,
        string $grupoRaw = ''
    ): ?Nota
    {
        $matches = app(StudentNoteMatchingService::class)->resolveBestMatches([
            'identificacion' => $identificacion,
            'codigo' => $codigo,
            'nombre' => $nombres,
            'apellido' => $apellidos,
            'programa' => $programa,
            'materia' => $materia,
        ], $indexes, $grupoRaw);

        $first = $matches[0] ?? null;
        return $first instanceof Nota ? $first : null;
    }

    private function guessSexo(array $fila): ?string
    {
        $h = $fila['H'] ?? null;
        $i = $fila['I'] ?? null;

        $isX = fn ($v) => is_string($v) && trim(mb_strtolower($v)) === 'x';
        $is1 = fn ($v) => is_numeric($v) && (int) $v === 1;

        if ($isX($h) || $is1($h)) return 'F';
        if ($isX($i) || $is1($i)) return 'M';

        return null;
    }

    private function guessPriorizados(array $fila): ?string
    {
        $map = [
            'J' => 'Étnico',
            'K' => 'Étnico',
            'L' => 'Discapacidad',
            'M' => 'Víctima de conflicto armado',
            'N' => 'LGTBIQ+',
            'O' => 'Habitante de frontera',
        ];

        $vals = [];
        foreach ($map as $col => $label) {
            $v = $fila[$col] ?? null;
            $mark = (is_numeric($v) && (int) $v === 1) || (is_string($v) && trim(mb_strtolower($v)) === 'x');
            if ($mark) $vals[] = $label;
        }

        return count($vals) ? implode(', ', array_values(array_unique($vals))) : null;
    }

    private function preferText(?string $primary, ?string $fallback): string
    {
        $primaryText = trim((string) ($primary ?? ''));
        if ($primaryText !== '') {
            return $primaryText;
        }

        return trim((string) ($fallback ?? ''));
    }

    private function preferSexo(?string $primary, ?string $fallback): string
    {
        $primaryText = trim((string) ($primary ?? ''));
        if ($primaryText !== '' && ! in_array(mb_strtoupper($primaryText), ['OTRO', 'OTRA'], true)) {
            return $primaryText;
        }

        $fallbackText = trim((string) ($fallback ?? ''));
        if ($fallbackText !== '') {
            return $fallbackText;
        }

        return $primaryText !== '' ? $primaryText : '—';
    }
}
