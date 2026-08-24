<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\GrupoT;
use App\Models\Nota;
use App\Services\StudentProfileResolver;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AsistenciaImportController extends Controller
{
    /**
     * Vista general de asistencias
     */
    public function index()
    {
        return Inertia::render('Asistencias/Importar', [
            'asistencias' => Asistencia::latest()->get(),
            'grupos' => GrupoT::select('id', 'nombre')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * ✅ Importar asistencias desde Excel (1 fila POR DÍA marcado)
     * - Detecta automáticamente la fila de encabezados (donde aparece "NOMBRES DEL ESTUDIANTE")
     * - Detecta automáticamente la fila de días (la que tiene 1..31)
     * - Detecta el MES por columna leyendo la fila de meses (AGOSTO, SEPTIEMBRE, etc.) y “arrastra” el último mes visto
     * - Detecta el AÑO desde cualquier celda tipo "2025-2" o "2025"
     */
    public function import(Request $request)
    {
        // Si tu tabla asistencias tiene report_window_id NOT NULL, aquí lo pedimos.
        $hasReportWindow = Schema::hasColumn('asistencias', 'report_window_id');
        $hasTutorId = Schema::hasColumn('asistencias', 'tutor_id');

        $rules = [
            'archivo' => 'required|file|mimes:xlsx,xls',
            'grupo_id' => 'required|exists:grupo_t,id',
        ];

        if ($hasReportWindow) {
            // si quieres hacerlo opcional, cambia a 'nullable|exists:report_windows,id'
            $rules['report_window_id'] = 'required|exists:report_windows,id';
        }

        $validated = $request->validate($rules);

        $grupoId = (int) $validated['grupo_id'];
        $archivo = $request->file('archivo');

        $grupo = GrupoT::findOrFail($grupoId);
        $studentProfileResolver = app(StudentProfileResolver::class);

        // Si en tu diseño el grupo trae period_id directo:
        if (!$grupo->period_id) {
            return redirect()->back()->with('error', 'El grupo no tiene período asignado.');
        }

        $periodId = (int) $grupo->period_id;

        // Leer Excel
        $sheet = IOFactory::load($archivo)->getActiveSheet();
        $hoja = $sheet->toArray(null, true, true, true);

        if (!$hoja || count($hoja) < 10) {
            return redirect()->back()->with('error', 'El archivo no tiene contenido válido.');
        }

        /* =========================================================
           1) Detectar fila de encabezados (donde dice "NOMBRES DEL ESTUDIANTE")
        ========================================================= */
        $headerRowIndex = null;
        foreach ($hoja as $i => $row) {
            $joined = strtoupper(implode(' ', array_map(fn ($v) => trim((string)$v), $row)));
            if (str_contains($joined, 'NOMBRES DEL ESTUDIANTE')) {
                $headerRowIndex = (int) $i;
                break;
            }
        }

        if (!$headerRowIndex) {
            return redirect()->back()->with('error', 'No se encontró la fila de encabezados (NOMBRES DEL ESTUDIANTE).');
        }

        $header = $hoja[$headerRowIndex];

        // Helper: buscar columna por texto dentro del header
        $findCol = function (array $header, array $needles) {
            foreach ($header as $col => $val) {
                $h = strtoupper(trim((string) $val));
                foreach ($needles as $n) {
                    if ($n !== '' && str_contains($h, strtoupper($n))) {
                        return $col;
                    }
                }
            }
            return null;
        };

        // Columnas base (según tu formato)
        $colNombres = $findCol($header, ['NOMBRES']);
        $colApellidos = $findCol($header, ['APELLIDOS']);
        $colIdentificacion = $findCol($header, ['IDENTIFICACION', 'IDENTIFICACIÓN']);
        $colCodigo = $findCol($header, ['CÓDIGO', 'CODIGO']);
        $colPrograma = $findCol($header, ['PROGRAMA']);

        // SEXO: en tu formato, suelen ser columnas con header "F" y "M" en una fila inferior,
        // pero muchas veces PhpSpreadsheet deja esa "F" y "M" en el mismo headerRow.
        // Intentamos detectarlas; si no, las buscamos en la fila siguiente.
        $colSexoF = $findCol($header, ['F']);
        $colSexoM = $findCol($header, ['M']);

        // Priorizados (en tu formato hay columnas cortas I A D V C H, pero a veces no están como texto completo).
        // Aquí mantenemos la lógica por letras si existen.
        $colEtnico1 = 'J'; // por tu plantilla clásica
        $colEtnico2 = 'K';
        $colDiscap = 'L';
        $colVictima = 'M';
        $colLgtbi = 'N';
        $colFrontera = 'O';

        if (!$colNombres || !$colApellidos || !$colIdentificacion) {
            return redirect()->back()->with('error', 'No se pudieron detectar columnas base (nombres/apellidos/identificación).');
        }

        /* =========================================================
           2) Detectar fila de días (la que tiene 1..31)
              - Buscamos desde headerRowIndex hacia abajo (máx +10 filas)
        ========================================================= */
        $daysRowIndex = null;
        $maxScan = min($headerRowIndex + 12, max(array_keys($hoja)));
        for ($i = $headerRowIndex; $i <= $maxScan; $i++) {
            $row = $hoja[$i] ?? [];
            $nums = 0;
            foreach ($row as $v) {
                if (is_numeric($v) && (int)$v >= 1 && (int)$v <= 31) $nums++;
            }
            // si hay varios números 1..31 en una fila, casi seguro es la fila de días
            if ($nums >= 5) {
                $daysRowIndex = $i;
                break;
            }
        }

        if (!$daysRowIndex) {
            return redirect()->back()->with('error', 'No se encontró la fila de días (1..31).');
        }

        $daysRow = $hoja[$daysRowIndex];

        // Mapa: columna => día (1..31)
        $diasColumna = [];
        foreach ($daysRow as $col => $val) {
            if (is_numeric($val)) {
                $d = (int) $val;
                if ($d >= 1 && $d <= 31) {
                    $diasColumna[$col] = $d;
                }
            }
        }

        if (count($diasColumna) === 0) {
            return redirect()->back()->with('error', 'No se detectaron columnas de días.');
        }

        /* =========================================================
           3) Detectar la fila de MESES por columna
              - Normalmente está encima de la fila de días (daysRowIndex - 1 o -2)
              - Arrastramos el último mes visto para rellenar columnas vacías
        ========================================================= */
        $mesesES = [
            'ENERO' => 1, 'FEBRERO' => 2, 'MARZO' => 3, 'ABRIL' => 4,
            'MAYO' => 5, 'JUNIO' => 6, 'JULIO' => 7, 'AGOSTO' => 8,
            'SEPTIEMBRE' => 9, 'SETIEMBRE' => 9, 'OCTUBRE' => 10,
            'NOVIEMBRE' => 11, 'DICIEMBRE' => 12,
        ];

        $monthRowIndex = null;
        for ($i = $daysRowIndex - 1; $i >= max(1, $daysRowIndex - 5); $i--) {
            $row = $hoja[$i] ?? [];
            $found = false;
            foreach ($row as $v) {
                $t = strtoupper(trim((string)$v));
                if ($t && isset($mesesES[$t])) { $found = true; break; }
            }
            if ($found) { $monthRowIndex = $i; break; }
        }

        if (!$monthRowIndex) {
            return redirect()->back()->with('error', 'No se encontró la fila de meses (AGOSTO, SEPTIEMBRE, etc.).');
        }

        $monthRow = $hoja[$monthRowIndex];

        // Mapa: columna => mes (1..12) usando “carry forward”
        $mesPorCol = [];
        $lastMonth = null;

        // Ojo: recorremos en orden de columnas A..Z..AA (PhpSpreadsheet usa letras)
        foreach ($monthRow as $col => $val) {
            $t = strtoupper(trim((string)$val));
            if ($t && isset($mesesES[$t])) {
                $lastMonth = $mesesES[$t];
            }
            if ($lastMonth !== null) {
                $mesPorCol[$col] = $lastMonth;
            }
        }

        /* =========================================================
           4) Detectar AÑO (ej "2025-2" o "2025")
        ========================================================= */
        $year = null;
        $topScan = min(20, max(array_keys($hoja)));
        for ($i = 1; $i <= $topScan; $i++) {
            foreach (($hoja[$i] ?? []) as $v) {
                $s = (string)$v;
                if (preg_match('/\b(20\d{2})\b/', $s, $m)) {
                    $year = (int) $m[1];
                    break 2;
                }
            }
        }

        if (!$year) {
            // fallback
            $year = (int) now()->year;
        }

        /* =========================================================
           5) Filas de estudiantes (normalmente empiezan 1-2 filas debajo de header)
              - En tu excel, los estudiantes empiezan justo después del header + 1 o +2
              - Tomamos desde daysRowIndex+1 (porque la fila de días suele ser la última antes de datos)
        ========================================================= */
        $startDataRow = $daysRowIndex + 1;

        $reportWindowId = $hasReportWindow ? (int) $validated['report_window_id'] : null;

        $importadas = 0;
        $skippedSinAsistencia = 0;
        $skippedSinGrupoMes = 0;
        $skippedDatosInvalidos = 0;

        foreach ($hoja as $index => $fila) {
            if ((int)$index < $startDataRow) continue;

            $identificacion = trim((string)($fila[$colIdentificacion] ?? ''));
            if ($identificacion === '') { $skippedDatosInvalidos++; continue; }
            $codigoExcel = $colCodigo ? trim((string)($fila[$colCodigo] ?? '')) : '';
            $studentProfile = $studentProfileResolver->resolveIdentityForPeriod(
                $periodId,
                $identificacion,
                $codigoExcel,
                trim((string)($fila[$colNombres] ?? '')),
                trim((string)($fila[$colApellidos] ?? ''))
            );
            $identificacionFinal = $this->preferText(
                $this->normalizeIdentificacion((string)($studentProfile['identificacion'] ?? '')),
                $identificacion
            );

            $nombres = $this->preferText($studentProfile['nombres'] ?? '', trim((string)($fila[$colNombres] ?? '')));
            $apellidos = $this->preferText($studentProfile['apellidos'] ?? '', trim((string)($fila[$colApellidos] ?? '')));
            if ($nombres === '' && $apellidos === '') { $skippedDatosInvalidos++; continue; }

            $codigoEst = $this->preferText(
                $studentProfile['codigo'] ?? '',
                $codigoExcel
            );
            $programa = $this->preferText(
                $colPrograma ? trim((string)($fila[$colPrograma] ?? '')) : '',
                $studentProfile['programa'] ?? ''
            );

            // Sexo (si no se detectó en header, igual respetamos el patrón H/I del formato)
            $sexo = $this->preferSexo(
                !empty($fila[$colSexoF ?? 'H']) ? 'F' : (!empty($fila[$colSexoM ?? 'I']) ? 'M' : 'Otro'),
                $studentProfile['sexo'] ?? ''
            );

            // Priorizados
            $priorizados = [];
            if (!empty($fila[$colEtnico1]) || !empty($fila[$colEtnico2])) $priorizados[] = 'Étnico';
            if (!empty($fila[$colDiscap])) $priorizados[] = 'Discapacidad';
            if (!empty($fila[$colVictima])) $priorizados[] = 'Víctima de conflicto armado';
            if (!empty($fila[$colLgtbi])) $priorizados[] = 'LGTBIQ+';
            if (!empty($fila[$colFrontera])) $priorizados[] = 'Habitante de frontera';
            $grupoPriorizado = $this->preferText(
                $priorizados ? implode(', ', $priorizados) : '',
                $studentProfile['grupo_priorizado'] ?? ''
            );

            $tieneAlguna = false;

            // ✅ Por cada columna de día, si vale 1, guardamos un registro con fecha real
            foreach ($diasColumna as $col => $dia) {
                $cell = $fila[$col] ?? null;
                if (empty($cell) || (int)$cell !== 1) continue;

                $tieneAlguna = true;

                $mes = $mesPorCol[$col] ?? null;
                if (!$mes) {
                    $skippedSinGrupoMes++;
                    continue;
                }

                try {
                    $fecha = Carbon::createFromDate($year, $mes, $dia)->toDateString();
                } catch (\Throwable $e) {
                    // día inválido (ej 31 febrero)
                    continue;
                }

                // ✅ Crear / evitar duplicados por (grupo, periodo, estudiante, fecha, ventana)
                $where = [
                    'grupo_id' => $grupoId,
                    'period_id' => $periodId,
                    'identificacion' => $identificacionFinal,
                    'fecha' => $fecha,
                ];

                if ($hasReportWindow) {
                    $where['report_window_id'] = $reportWindowId;
                }

                $data = [
                    'nombres_del_estudiante' => $nombres,
                    'apellidos_del_estudiante' => $apellidos,
                    'codigo_estudiantil' => $codigoEst ?: null,
                    'programa_academico' => $programa ?: null,
                    'sexo' => $sexo,
                    'grupo_priorizado' => $grupoPriorizado ?: null,
                    'horas' => 1,
                ];

                // Si tienes tutor_id y lo quieres dejar null en este import admin:
                if ($hasTutorId) {
                    $data['tutor_id'] = $data['tutor_id'] ?? null;
                }

                // Si tu tabla aún tiene total_asistencias pero ya no lo quieres usar:
                if (Schema::hasColumn('asistencias', 'total_asistencias')) {
                    $data['total_asistencias'] = 1; // cada fila representa 1 asistencia en esa fecha
                }

                Asistencia::updateOrCreate($where, $data);

                $importadas++;
            }

            if (!$tieneAlguna) {
                $skippedSinAsistencia++;
            }
        }

        $msg = "{$importadas} asistencias importadas correctamente (por fecha).";
        $msg .= " Omitidas sin asistencia: {$skippedSinAsistencia}.";
        if ($skippedSinGrupoMes > 0) $msg .= " Omitidas sin mes detectado: {$skippedSinGrupoMes}.";
        if ($skippedDatosInvalidos > 0) $msg .= " Omitidas por datos inválidos: {$skippedDatosInvalidos}.";

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Vista para importar asistencias por grupo
     */
    public function importarPorGrupoVista($grupoId)
    {
        $grupo = GrupoT::with('asistencias')->findOrFail($grupoId);

        return Inertia::render('Asistencias/Importar', [
            'grupo' => $grupo,
            'asistencias' => $grupo->asistencias ?? [],
            'grupos' => GrupoT::select('id', 'nombre')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Ver asistencias por grupo
     */
    public function verAsistenciasPorGrupo($grupoId)
    {
        $grupo = GrupoT::with('asignatura')->findOrFail($grupoId);
        $grupo->load([
            'tutores' => fn ($query) => $query
                ->when(
                    $grupo->period_id,
                    fn ($tutores) => $tutores->where('periodo_grupo_tutor.period_id', $grupo->period_id)
                )
                ->orderBy('nombre')
                ->orderBy('apellido'),
        ]);

        $materiaGrupo = $this->normalizeText((string) optional($grupo->asignatura)->nombre);

        $notas = collect();
        if ($grupo->period_id && $materiaGrupo !== '') {
            $notas = Nota::query()
                ->where('period_id', $grupo->period_id)
                ->get()
                ->keyBy(fn (Nota $nota) => $this->notaKey(
                    (string) $nota->identificacion,
                    (string) $nota->materia
                ));
        }

        $asistencias = Asistencia::query()
            ->where('grupo_id', $grupo->id)
            ->when($grupo->period_id, fn ($query) => $query->where('period_id', $grupo->period_id))
            ->orderBy('apellidos_del_estudiante')
            ->orderBy('nombres_del_estudiante')
            ->orderBy('fecha')
            ->get()
            ->map(function (Asistencia $asistencia) use ($notas, $materiaGrupo) {
                $nota = $materiaGrupo !== ''
                    ? $notas->get($this->notaKey(
                        (string) $asistencia->identificacion,
                        $materiaGrupo
                    ))
                    : null;

                return [
                    'id' => $asistencia->id,
                    'nombres_del_estudiante' => $asistencia->nombres_del_estudiante,
                    'apellidos_del_estudiante' => $asistencia->apellidos_del_estudiante,
                    'identificacion' => $asistencia->identificacion,
                    'codigo_estudiantil' => $asistencia->codigo_estudiantil,
                    'programa_academico' => $asistencia->programa_academico,
                    'sexo' => $asistencia->sexo,
                    'grupo_priorizado' => $asistencia->grupo_priorizado,
                    'fecha' => $asistencia->fecha?->toDateString() ?? (string) $asistencia->fecha,
                    'nota_1' => $nota?->nota_1,
                    'nota_2' => $nota?->nota_2,
                    'nota_3' => $nota?->nota_3,
                    'definitiva' => $nota?->definitiva,
                    'final' => $nota?->final,
                ];
            });

        return Inertia::render('Asistencias/TablaAsistencias', [
            'grupo' => [
                'id' => $grupo->id,
                'nombre' => $grupo->nombre,
                'codigo' => $grupo->codigo,
                'asignatura_id' => $grupo->asignatura_id,
                'materia' => optional($grupo->asignatura)->nombre,
                'tutores' => $grupo->tutores->map(fn ($tutor) => [
                    'id' => $tutor->id,
                    'nombre' => $tutor->nombre,
                    'apellido' => $tutor->apellido,
                    'rol' => $tutor->pivot->rol ?? null,
                ])->values(),
            ],
            'asistencias' => $asistencias,
        ]);
    }

    private function notaKey(string $identificacion, string $materia): string
    {
        return $this->normalizeIdentificacion($identificacion) . '|' . $this->normalizeText($materia);
    }

    private function normalizeIdentificacion(string $value): string
    {
        return preg_replace('/[^0-9a-z]/i', '', $this->normalizeText($value));
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

        return $primaryText !== '' ? $primaryText : 'Otro';
    }

    private function normalizeText(string $value): string
    {
        $value = trim(mb_strtolower($value));
        $value = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
            ['a', 'e', 'i', 'o', 'u', 'u', 'n'],
            $value
        );

        return preg_replace('/\s+/', ' ', $value);
    }
}
