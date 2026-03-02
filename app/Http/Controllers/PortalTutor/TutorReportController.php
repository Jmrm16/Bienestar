<?php

namespace App\Http\Controllers\PortalTutor;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use App\Models\AsistenciaOcasional;
use App\Models\GrupoT;
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
     * - Mismo periodo + mismo tutor + mismo grupo_id + mismo estudiante + misma fecha => NO insertar
     * - NO importa el report_window_id para comparar
     *
     * ✅ MEJORA DESTINO (NORMAL):
     * - El grupo se resuelve por (CODIGO_GRUPO + ASIGNATURA) del Excel, no solo por código.
     * - Si no existe esa combinación para el tutor en el periodo => NO se sube esa fila.
     *
     * REGLA anti-duplicado (OCASIONALES):
     * - Se guarda en asistencias_ocasionales con unique_key hash (period+tutor+ident+fecha+asignatura_texto+grupo_texto)
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

        // ✅ Mapa por (CODIGO|ASIGNATURA_NORMALIZADA) => GrupoT
        $gruposPorCodigoAsignatura = $gruposTutor->keyBy(function ($g) {
            $codigo = strtoupper(trim((string) $g->codigo));
            $asig = $this->norm((string) (optional($g->asignatura)->nombre ?? ''));
            return $codigo . '|' . $asig;
        });

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

        $hoja1 = $sheetNormal->toArray(null, true, true, true);
        $p1 = $parseSheet($hoja1);

        // ✅ Para NORMAL exigimos GRUPO + ASIGNATURA
        abort_unless($p1['colGrupo'], 422, 'No se detectó columna GRUPO en la hoja 1.');
        abort_unless($p1['colAsignatura'], 422, 'No se detectó columna ASIGNATURA en la hoja 1.');

        // Anti-duplicado normal (entre ventanas): solo grupos del tutor en el periodo
        $grupoIds = $gruposTutor->pluck('id')->values();

        $existentesSet = Asistencia::where('period_id', $period->id)
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

            // ✅ Resolver destino por (GRUPO + ASIGNATURA)
            $codigoGrupo = strtoupper(trim((string) ($fila[$p1['colGrupo']] ?? '')));
            $asignaturaExcel = $this->norm((string) ($fila[$p1['colAsignatura']] ?? ''));

            if ($codigoGrupo === '' || $asignaturaExcel === '') continue;

            $keyGrupo = $codigoGrupo . '|' . $asignaturaExcel;

            if (!isset($gruposPorCodigoAsignatura[$keyGrupo])) {
                // No pertenece al tutor o no coincide la asignatura con el grupo
                continue;
            }

            $grupo = $gruposPorCodigoAsignatura[$keyGrupo];

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

                $key = $grupo->id . '|' . $identificacionNorm . '|' . $fecha;

                if (isset($existentesSet[$key])) continue;

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

        if ($sheetOcasional) {
            $hoja2 = $sheetOcasional->toArray(null, true, true, true);
            $p2 = $parseSheet($hoja2);

            // Anti-duplicado ocasionales (por unique_key)
            $existOca = AsistenciaOcasional::where('period_id', $period->id)
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

                    $uk = sha1(
                        $period->id . '|' .
                        $tutor->id . '|' .
                        $identificacionNorm . '|' .
                        $fecha . '|' .
                        ($asignaturaTxt ?? '') . '|' .
                        ($grupoTxt ?? '')
                    );

                    if (isset($existOca[$uk])) continue;

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

        $msg = "Importación lista. Normal: {$importadasNormal} nuevas.";
        if ($sheetOcasional) $msg .= " Ocasionales: {$importadasOcasionales} nuevas.";

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

        $asistencias = Asistencia::where('grupo_id', $grupo->id)
            ->where('period_id', $period->id)
            ->where('report_window_id', $window->id)
            ->where('tutor_id', $tutor->id)
            ->orderBy('apellidos_del_estudiante')
            ->orderBy('nombres_del_estudiante')
            ->orderBy('fecha')
            ->get();

        $notas = \App\Models\Nota::where('period_id', $period->id)
            ->get()
            ->keyBy(fn ($n) => trim($n->identificacion) . '|' . mb_strtolower(trim($n->materia)));

        $materiaGrupo = mb_strtolower(trim(optional($grupo->asignatura)->nombre ?? ''));

        $resultado = $asistencias
            ->groupBy(fn ($a) => trim($a->identificacion))
            ->map(function ($items, $identificacion) use ($notas, $materiaGrupo) {
                $first = $items->first();

                $key = trim($identificacion) . '|' . $materiaGrupo;
                $nota = $notas->get($key);

                $fechas = $items->pluck('fecha')
                    ->map(fn ($f) => (string) $f)
                    ->values()
                    ->all();

                return [
                    'id' => $first->id,
                    'estudiante' => trim($first->nombres_del_estudiante . ' ' . $first->apellidos_del_estudiante),
                    'codigo' => $first->codigo_estudiantil,
                    'programa' => $first->programa_academico,
                    'materia' => $materiaGrupo ? strtoupper($materiaGrupo) : null,
                    'sexo' => $first->sexo,
                    'grupo_priorizado' => $first->grupo_priorizado ?: '—',
                    'total_asistencias' => (int) $items->count(),
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

        $ocasionales = AsistenciaOcasional::where('period_id', $period->id)
            ->where('report_window_id', $window->id)
            ->where('tutor_id', $tutor->id)
            ->orderBy('apellidos_del_estudiante')
            ->orderBy('nombres_del_estudiante')
            ->orderBy('asignatura_texto')
            ->orderBy('grupo_texto')
            ->orderBy('fecha')
            ->get();

        $notas = \App\Models\Nota::where('period_id', $period->id)
            ->get()
            ->keyBy(fn ($n) => trim($n->identificacion) . '|' . mb_strtolower(trim($n->materia)));

        $resultado = $ocasionales
            ->groupBy(function ($a) {
                $ident = trim((string) $a->identificacion);
                $asig  = mb_strtolower(trim((string) ($a->asignatura_texto ?? '')));
                $grp   = mb_strtolower(trim((string) ($a->grupo_texto ?? '')));
                return $ident . '|' . $asig . '|' . $grp;
            })
            ->map(function ($items) use ($notas) {
                $first = $items->first();

                $ident = trim((string) $first->identificacion);
                $materiaKey = mb_strtolower(trim((string) ($first->asignatura_texto ?? '')));
                $notaKey = $ident . '|' . $materiaKey;
                $nota = $notas->get($notaKey);

                $fechas = $items->pluck('fecha')
                    ->map(fn ($f) => (string) $f)
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

                    'total_asistencias' => (int) $items->count(),
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