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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;
use Carbon\Carbon;

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
    public function import(Request $request, ReportWindow $window)
    {
        $tutorAuth = Auth::guard('tutor')->user();
        abort_unless($tutorAuth, 403);

        $tutor = Tutor::findOrFail($tutorAuth->id);

        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls',
        ]);

        $period = $window->period;
        abort_unless($period && $period->is_active, 403);

        // ✅ Grupos del tutor en el periodo, con asignatura cargada
        $gruposTutor = $tutor->grupos()
            ->wherePivot('period_id', $period->id)
            ->with('asignatura:id,nombre')
            ->get();

        $gruposTutorData = $gruposTutor->map(function ($g) {
            return [
                'group' => $g,
                'codigo_variants' => $this->groupCodeVariants((string) $g->codigo),
                'asignatura_norm' => $this->norm((string) (optional($g->asignatura)->nombre ?? '')),
            ];
        })->values()->all();

        $archivo = $request->file('archivo');

        // ✅ Cargar workbook completo
        $spreadsheet = IOFactory::load($archivo);

        $sheetNormal = $spreadsheet->getSheet(0); // Hoja 1
        $sheetOcasional = $spreadsheet->getSheetCount() > 1 ? $spreadsheet->getSheet(1) : null; // Hoja 2 si existe

        // ===========================
        // Helper: Parsear una hoja (header/días/meses/colToDate/cols base)
        // ===========================
        $parseSheet = function (array $hoja) use ($period, $window) {
            // 1) header
            $headerRowIndex = null;
            foreach ($hoja as $i => $row) {
                $joined = $this->norm(implode(' ', array_values($row)));
                if (str_contains($joined, 'NOMBRES DEL ESTUDIANTE') && str_contains($joined, 'APELLIDOS DEL ESTUDIANTE')) {
                    $headerRowIndex = (int) $i;
                    break;
                }
            }
            abort_unless($headerRowIndex, 422, 'No se encontró el encabezado (NOMBRES DEL ESTUDIANTE).');
            $headerRow = $hoja[$headerRowIndex] ?? [];

            // 2) days row
            $daysRowIndex = null;
            $maxNumbers = 0;
            for ($k = 1; $k <= 3; $k++) {
                $idx = $headerRowIndex + $k;
                if (!isset($hoja[$idx])) continue;

                $count = 0;
                foreach ($hoja[$idx] as $cell) {
                    if ($this->isDayNumber($cell)) $count++;
                }

                if ($count > $maxNumbers) {
                    $maxNumbers = $count;
                    $daysRowIndex = $idx;
                }
            }
            abort_unless($daysRowIndex && $maxNumbers >= 5, 422, 'No se detectó la fila de días (1,5,6,7...).');
            $daysRow = $hoja[$daysRowIndex] ?? [];

            // 3) month row
            $monthRowIndex = null;
            foreach ([$headerRowIndex - 1, $headerRowIndex, $daysRowIndex] as $candidate) {
                if ($candidate < 1 || !isset($hoja[$candidate])) continue;
                $joined = $this->norm(implode(' ', array_values($hoja[$candidate])));
                if ($this->containsAnyMonth($joined)) {
                    $monthRowIndex = $candidate;
                    break;
                }
            }
            $monthRowIndex = $monthRowIndex ?: $headerRowIndex;
            $monthRow = $hoja[$monthRowIndex] ?? [];

            // 4) columns base
            $colNombres = $this->findColByContains($headerRow, 'NOMBRES DEL ESTUDIANTE');
            $colApellidos = $this->findColByContains($headerRow, 'APELLIDOS DEL ESTUDIANTE');
            $colIdent = $this->findColByContains($headerRow, 'IDENTIFICACION');
            $colCodigo = $this->findColByContains($headerRow, 'CÓDIGO ESTUDIANTIL') ?: $this->findColByContains($headerRow, 'CODIGO ESTUDIANTIL');
            $colPrograma = $this->findColByContains($headerRow, 'PROGRAMA');
            $colAsignatura = $this->findColByContains($headerRow, 'ASIGNATURA');
            $colGrupo = $this->findColByExact($headerRow, 'GRUPO') ?: $this->findColByContainsLast($headerRow, 'GRUPO');

            abort_unless($colNombres && $colApellidos && $colIdent, 422, 'No se detectaron columnas clave (Nombres/Apellidos/Identificación).');

            // 5) year base
            $year = $this->yearFromPeriodCode($period->code ?? null)
                ?: (int) ($window->open_at ? Carbon::parse($window->open_at)->year : now()->year);

            // 6) col => date map
            $colToDate = [];
            $currentMonthName = null;
            $currentYear = $year;
            $prevMonthNum = null;

            foreach ($daysRow as $col => $valDia) {
                if (!$this->isDayNumber($valDia)) continue;
                $dia = (int) $valDia;

                $monthCell = $monthRow[$col] ?? null;
                $monthNorm = $this->norm((string) $monthCell);

                if ($this->isSpanishMonth($monthNorm)) {
                    $currentMonthName = $monthNorm;
                }
                if (!$currentMonthName) continue;

                $monthNum = $this->monthNumberFromSpanish($currentMonthName);
                if (!$monthNum) continue;

                if ($prevMonthNum !== null && $monthNum < $prevMonthNum) $currentYear++;
                $prevMonthNum = $monthNum;

                try {
                    $fecha = Carbon::createFromDate($currentYear, $monthNum, $dia)->toDateString();
                } catch (\Throwable $e) {
                    continue;
                }

                $colToDate[$col] = $fecha;
            }

            abort_unless(count($colToDate) > 0, 422, 'No se detectaron columnas de fechas (mes + día).');

            return compact(
                'headerRowIndex',
                'headerRow',
                'daysRowIndex',
                'daysRow',
                'monthRowIndex',
                'monthRow',
                'colNombres',
                'colApellidos',
                'colIdent',
                'colCodigo',
                'colPrograma',
                'colAsignatura',
                'colGrupo',
                'colToDate'
            );
        };

        // ===========================
        // 1) IMPORTAR HOJA NORMAL
        // ===========================
        $importadasNormal = 0;
        $marcadasNormal = 0;
        $duplicadasNormal = 0;

        $hoja1 = $sheetNormal->toArray(null, true, true, true);
        $p1 = $parseSheet($hoja1);

        // ✅ Para NORMAL exigimos ASIGNATURA; GRUPO queda opcional
        abort_unless($p1['colAsignatura'], 422, 'No se detectó columna ASIGNATURA en la hoja 1.');

        // Anti-duplicado normal (por ventana): solo grupos del tutor en el periodo
        $grupoIds = $gruposTutor->pluck('id')->values();

        $existentesSet = Asistencia::where('period_id', $period->id)
            ->where('report_window_id', $window->id)
            ->where('tutor_id', $tutor->id)
            ->whereIn('grupo_id', $grupoIds)
            ->get(['grupo_id', 'identificacion', 'fecha'])
            ->map(function ($a) {
                $idNorm = $this->normId((string) $a->identificacion);
                $fechaNorm = Carbon::parse($a->fecha)->toDateString();
                return $a->grupo_id . '|' . $idNorm . '|' . $fechaNorm;
            })
            ->flip();

        foreach ($hoja1 as $index => $fila) {
            if ($index <= $p1['daysRowIndex']) continue;

            $nombres = trim((string) ($fila[$p1['colNombres']] ?? ''));
            if ($nombres === '') continue;

            $apellidos = trim((string) ($fila[$p1['colApellidos']] ?? ''));
            $identificacionRaw = trim((string) ($fila[$p1['colIdent']] ?? ''));
            if ($identificacionRaw === '') continue;

            $identificacionNorm = $this->normId($identificacionRaw);

            $codigoGrupoRaw = $p1['colGrupo']
                ? (string) ($fila[$p1['colGrupo']] ?? '')
                : '';
            $asignaturaExcelRaw = (string) ($fila[$p1['colAsignatura']] ?? '');

            $grupo = $this->resolveTutorGroup(
                $gruposTutorData,
                $codigoGrupoRaw,
                $asignaturaExcelRaw
            );

            if (!$grupo) continue;

            $codigo = trim((string) ($fila[$p1['colCodigo']] ?? ''));
            $programa = trim((string) ($fila[$p1['colPrograma']] ?? ''));

            $sexo = $this->guessSexo($fila) ?? 'Otro';
            $grupo_priorizado = $this->guessPriorizados($fila) ?? null;

            foreach ($p1['colToDate'] as $colFecha => $fecha) {
                $cell = $fila[$colFecha] ?? null;

                $marcado = false;
                if (is_numeric($cell) && (int) $cell === 1) $marcado = true;
                if (is_string($cell) && trim(mb_strtolower($cell)) === 'x') $marcado = true;

                if (!$marcado) continue;
                $marcadasNormal++;

                $key = $grupo->id . '|' . $identificacionNorm . '|' . $fecha;

                if (isset($existentesSet[$key])) {
                    $duplicadasNormal++;
                    continue;
                }

                Asistencia::create([
                    'grupo_id' => $grupo->id,
                    'period_id' => $period->id,
                    'report_window_id' => $window->id,
                    'tutor_id' => $tutor->id,
                    'identificacion' => $identificacionNorm,
                    'fecha' => $fecha,
                    'nombres_del_estudiante' => $nombres,
                    'apellidos_del_estudiante' => $apellidos,
                    'codigo_estudiantil' => $codigo ?: null,
                    'programa_academico' => $programa ?: null,
                    'sexo' => $sexo,
                    'grupo_priorizado' => $grupo_priorizado,
                    'horas' => 1,
                ]);

                $existentesSet[$key] = true;
                $importadasNormal++;
            }
        }

        // ===========================
        // 2) IMPORTAR HOJA OCASIONALES (si existe)
        // ===========================
        $importadasOcasionales = 0;
        $marcadasOcasionales = 0;
        $duplicadasOcasionales = 0;

        if ($sheetOcasional) {
            $hoja2 = $sheetOcasional->toArray(null, true, true, true);
            $p2 = $parseSheet($hoja2);

            // Anti-duplicado ocasionales (por ventana)
            $existOca = AsistenciaOcasional::where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->where('tutor_id', $tutor->id)
                ->get(['unique_key'])
                ->pluck('unique_key')
                ->flip();

            foreach ($hoja2 as $index => $fila) {
                if ($index <= $p2['daysRowIndex']) continue;

                $nombres = trim((string) ($fila[$p2['colNombres']] ?? ''));
                if ($nombres === '') continue;

                $apellidos = trim((string) ($fila[$p2['colApellidos']] ?? ''));
                $identificacionRaw = trim((string) ($fila[$p2['colIdent']] ?? ''));
                if ($identificacionRaw === '') continue;

                $identificacionNorm = $this->normId($identificacionRaw);

                $codigo = trim((string) ($fila[$p2['colCodigo']] ?? ''));
                $programa = trim((string) ($fila[$p2['colPrograma']] ?? ''));

                $asignaturaTxt = $p2['colAsignatura'] ? trim((string) ($fila[$p2['colAsignatura']] ?? '')) : null;
                $grupoTxt = $p2['colGrupo'] ? trim((string) ($fila[$p2['colGrupo']] ?? '')) : null;

                $sexo = $this->guessSexo($fila) ?? 'Otro';
                $grupo_priorizado = $this->guessPriorizados($fila) ?? null;

                foreach ($p2['colToDate'] as $colFecha => $fecha) {
                    $cell = $fila[$colFecha] ?? null;

                    $marcado = false;
                    if (is_numeric($cell) && (int) $cell === 1) $marcado = true;
                    if (is_string($cell) && trim(mb_strtolower($cell)) === 'x') $marcado = true;

                    if (!$marcado) continue;
                    $marcadasOcasionales++;

                    $uk = sha1(
                        $period->id . '|' .
                        $window->id . '|' .
                        $tutor->id . '|' .
                        $identificacionNorm . '|' .
                        $fecha . '|' .
                        ($asignaturaTxt ?? '') . '|' .
                        ($grupoTxt ?? '')
                    );

                    if (isset($existOca[$uk])) {
                        $duplicadasOcasionales++;
                        continue;
                    }

                    AsistenciaOcasional::create([
                        'period_id' => $period->id,
                        'report_window_id' => $window->id,
                        'tutor_id' => $tutor->id,

                        'grupo_id' => null,
                        'identificacion' => $identificacionNorm,
                        'fecha' => $fecha,

                        'nombres_del_estudiante' => $nombres,
                        'apellidos_del_estudiante' => $apellidos,
                        'codigo_estudiantil' => $codigo ?: null,
                        'programa_academico' => $programa ?: null,

                        'asignatura_texto' => $asignaturaTxt ?: null,
                        'grupo_texto' => $grupoTxt ?: null,

                        'sexo' => $sexo,
                        'grupo_priorizado' => $grupo_priorizado,
                        'horas' => 1,

                        'unique_key' => $uk,
                    ]);

                    $existOca[$uk] = true;
                    $importadasOcasionales++;
                }
            }
        }

        // ✅ Marcar entrega como enviada
        TutorReport::updateOrCreate(
            [
                'tutor_id' => $tutor->id,
                'window_id' => $window->id,
                'period_id' => $period->id,
            ],
            [
                'status' => 'submitted',
                'submitted_at' => now(),
                'hours_total' => null,
                'notes' => null,
            ]
        );

        $msg = "Importación lista. Normal: {$importadasNormal} nuevas";
        if ($marcadasNormal > 0) {
            $msg .= ", {$duplicadasNormal} duplicadas";
        }
        $msg .= '.';

        if ($sheetOcasional) {
            $msg .= " Ocasionales: {$importadasOcasionales} nuevas";
            if ($marcadasOcasionales > 0) {
                $msg .= ", {$duplicadasOcasionales} duplicadas";
            }
            $msg .= '.';
        }

        if ($importadasNormal === 0 && (! $sheetOcasional || $importadasOcasionales === 0)) {
            $msg .= " No había asistencias nuevas para registrar en esta entrega.";
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

        $notasIndexes = $this->buildNotasIndexes(
            Nota::where('period_id', $period->id)
                ->get(['id', 'identificacion', 'materia', 'grupo', 'nota_1', 'nota_2', 'nota_3', 'definitiva', 'final', 'updated_at'])
        );

        $materiaGrupoLabel = trim((string) (optional($grupo->asignatura)->nombre ?? ''));
        $materiaGrupoNorm = $this->norm($materiaGrupoLabel);
        $grupoCodigo = (string) ($grupo->codigo ?? '');

        $resultado = $asistencias
            ->groupBy(fn ($a) => $this->normId((string) $a->identificacion))
            ->map(function ($items) use ($notasIndexes, $materiaGrupoNorm, $materiaGrupoLabel, $grupoCodigo) {
                $first = $items->first();

                $nota = $this->resolveNotaFromIndexes(
                    $notasIndexes,
                    (string) $first->identificacion,
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
                    'estudiante' => trim($first->nombres_del_estudiante . ' ' . $first->apellidos_del_estudiante),
                    'codigo' => $first->codigo_estudiantil,
                    'programa' => $first->programa_academico,
                    'materia' => $materiaGrupoLabel !== '' ? $materiaGrupoLabel : null,
                    'sexo' => $first->sexo,
                    'grupo_priorizado' => $first->grupo_priorizado ?: '—',
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

        $notasIndexes = $this->buildNotasIndexes(
            Nota::where('period_id', $period->id)
                ->get(['id', 'identificacion', 'materia', 'grupo', 'nota_1', 'nota_2', 'nota_3', 'definitiva', 'final', 'updated_at'])
        );

        $resultado = $ocasionales
            ->groupBy(function ($a) {
                $ident = $this->normId((string) $a->identificacion);
                $asig  = $this->norm((string) ($a->asignatura_texto ?? ''));
                $grp   = $this->norm((string) ($a->grupo_texto ?? ''));
                return $ident . '|' . $asig . '|' . $grp;
            })
            ->map(function ($items) use ($notasIndexes) {
                $first = $items->first();

                $nota = $this->resolveNotaFromIndexes(
                    $notasIndexes,
                    (string) $first->identificacion,
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
                    'estudiante' => trim($first->nombres_del_estudiante . ' ' . $first->apellidos_del_estudiante),
                    'codigo' => $first->codigo_estudiantil,
                    'programa' => $first->programa_academico,
                    'sexo' => $first->sexo,
                    'grupo_priorizado' => $first->grupo_priorizado ?: '—',

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
            $query = ReportWindow::query()
            ->where('period_id', $currentWindow->period_id)
            ->where('is_published', true);

            $tutorType = trim((string) ($tutor->tipo_resolucion ?? ''));
            if ($tutorType !== '') {
                $query->where('tutor_type', $tutorType);
            }

            $windows = $query
                ->orderBy('open_at')
                ->orderBy('id')
                ->get(['id', 'name']);
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
        $byMateria = [];
        $byMateriaGrupo = [];

        foreach ($notas as $nota) {
            $materiaKey = $this->notaMateriaKey(
                (string) $nota->identificacion,
                (string) $nota->materia
            );

            if ($materiaKey === '') {
                continue;
            }

            $byMateria[$materiaKey][] = $nota;

            foreach ($this->groupCodeVariants((string) ($nota->grupo ?? '')) as $grupoNorm) {
                $byMateriaGrupo[$materiaKey . '|' . $grupoNorm][] = $nota;
            }
        }

        return [
            'by_materia' => $byMateria,
            'by_materia_grupo' => $byMateriaGrupo,
        ];
    }

    private function resolveNotaFromIndexes(array $indexes, string $identificacion, string $materia, string $grupoRaw = ''): ?Nota
    {
        $materiaKey = $this->notaMateriaKey($identificacion, $materia);
        if ($materiaKey === '') {
            return null;
        }

        $grupoVariants = $this->groupCodeVariants($grupoRaw);

        foreach ($grupoVariants as $grupoNorm) {
            $exactByGroup = $indexes['by_materia_grupo'][$materiaKey . '|' . $grupoNorm] ?? [];
            if (count($exactByGroup) === 1) {
                return $exactByGroup[0];
            }
        }

        $byMateria = $indexes['by_materia'][$materiaKey] ?? [];
        if (count($byMateria) === 1) {
            return $byMateria[0];
        }

        if ($grupoVariants !== [] && $byMateria !== []) {
            $filtered = array_values(array_filter($byMateria, function (Nota $nota) use ($grupoVariants) {
                $notaGroupVariants = $this->groupCodeVariants((string) ($nota->grupo ?? ''));
                return $this->codeVariantsIntersect($grupoVariants, $notaGroupVariants);
            }));

            if (count($filtered) === 1) {
                return $filtered[0];
            }
        }

        return null;
    }

    private function notaMateriaKey(string $identificacion, string $materia): string
    {
        $identNorm = $this->normId($identificacion);
        $materiaNorm = $this->norm($materia);

        if ($identNorm === '' || $materiaNorm === '') {
            return '';
        }

        return $identNorm . '|' . $materiaNorm;
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
}
