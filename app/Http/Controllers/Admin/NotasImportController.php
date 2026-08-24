<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nota;
use App\Models\ReportPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class NotasImportController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('q', ''));
        $studentResults = [];
        $matchedRowsCount = 0;

        if ($search !== '') {
            $rows = Nota::query()
                ->select([
                    'id',
                    'codigo',
                    'apellidos',
                    'nombres',
                    'identificacion',
                    'programa',
                    'materia',
                    'grupo',
                    'nota_1',
                    'nota_2',
                    'nota_3',
                    'definitiva',
                    'habilitacion',
                    'final',
                    'anio',
                    'periodo',
                ])
                ->where(function ($query) use ($search) {
                    $like = '%' . $search . '%';

                    $query->where('identificacion', 'like', $like)
                        ->orWhere('codigo', 'like', $like)
                        ->orWhere('nombres', 'like', $like)
                        ->orWhere('apellidos', 'like', $like)
                        ->orWhere(DB::raw("CONCAT(nombres, ' ', apellidos)"), 'like', $like)
                        ->orWhere(DB::raw("CONCAT(apellidos, ' ', nombres)"), 'like', $like);
                })
                ->orderBy('apellidos')
                ->orderBy('nombres')
                ->orderByDesc('anio')
                ->orderByDesc('periodo')
                ->orderBy('materia')
                ->limit(800)
                ->get();

            $matchedRowsCount = $rows->count();

            $studentResults = $rows
                ->groupBy(function (Nota $nota) {
                    $identificacion = trim((string) $nota->identificacion);
                    $codigo = trim((string) ($nota->codigo ?? ''));

                    return ($identificacion !== '' ? $identificacion : 'SIN-ID') . '|' . ($codigo !== '' ? $codigo : 'SIN-CODIGO');
                })
                ->map(function ($group) {
                    /** @var Nota $first */
                    $first = $group->first();

                    return [
                        'id' => $first->id,
                        'codigo' => (string) ($first->codigo ?? ''),
                        'apellidos' => (string) $first->apellidos,
                        'nombres' => (string) $first->nombres,
                        'identificacion' => (string) $first->identificacion,
                        'programa' => (string) ($first->programa ?? ''),
                        'materias' => $group->map(function (Nota $nota) {
                            return [
                                'id' => $nota->id,
                                'materia' => (string) ($nota->materia ?? ''),
                                'grupo' => (string) ($nota->grupo ?? ''),
                                'nota_1' => $nota->nota_1,
                                'nota_2' => $nota->nota_2,
                                'nota_3' => $nota->nota_3,
                                'definitiva' => $nota->definitiva,
                                'habilitacion' => $nota->habilitacion,
                                'final' => $nota->final,
                                'anio' => (int) $nota->anio,
                                'periodo' => (string) $nota->periodo,
                            ];
                        })->values()->all(),
                    ];
                })
                ->values()
                ->all();
        }

        return inertia('Notas/Index', [
            'notas' => [],
            'totalNotas' => Nota::count(),
            'totalEstudiantes' => Nota::query()
                ->whereNotNull('identificacion')
                ->where('identificacion', '!=', '')
                ->distinct()
                ->count('identificacion'),
            'search' => $search,
            'studentResults' => $studentResults,
            'studentResultCount' => count($studentResults),
            'matchedRowsCount' => $matchedRowsCount,
        ]);
    }

    public function store(Request $request)
    {
        ini_set('memory_limit', '2048M');
        set_time_limit(0);

        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls',
        ]);

        /* =========================
           PERIODO ACTIVO
        ========================= */
        $period = ReportPeriod::where('is_active', true)->first();
        if (!$period) {
            return back()->withErrors([
                'archivo' => 'No hay un período académico activo.'
            ]);
        }

        $spreadsheet = IOFactory::load($request->file('archivo'));
        $sheet = $this->detectarHojaConDatos($spreadsheet);

        if (!$sheet) {
            return back()->withErrors([
                'archivo' => 'No se encontró una hoja válida con Identificación.'
            ]);
        }

        $existingKeys = Nota::query()
            ->where('period_id', $period->id)
            ->get(['identificacion', 'ide_materia', 'materia', 'grupo'])
            ->mapWithKeys(function (Nota $nota) {
                $key = $this->buildNotaUniqueKey([
                    'identificacion' => $nota->identificacion,
                    'ide_materia' => $nota->ide_materia,
                    'materia' => $nota->materia,
                    'grupo' => $nota->grupo,
                ]);

                return $key ? [$key => true] : [];
            })
            ->all();

        $userId = Auth::id();
        $importadas = 0;
        $duplicadas = 0;
        $invalidas = 0;
        $batch = [];
        $seenKeys = $existingKeys;

        DB::beginTransaction();

        try {
            foreach ($sheet->getRowIterator() as $rowIndex => $row) {

                // ⛔ Saltar encabezados
                if ($rowIndex < 2) {
                    continue;
                }

                $cells = [];
                foreach ($row->getCellIterator() as $cell) {
                    $cells[$cell->getColumn()] = $cell->getValue();
                }

                $payload = [
                    'codigo'              => $cells['A'] ?? null,
                    'apellidos'           => trim((string) ($cells['B'] ?? '')),
                    'nombres'             => trim((string) ($cells['C'] ?? '')),
                    'tipo_identificacion' => trim((string) ($cells['D'] ?? '')),
                    'identificacion'      => $this->normalizeIdentificacion($cells['E'] ?? null),

                    'ide_programa' => $cells['F'] ?? null,
                    'programa'     => $this->nullableTrim($cells['G'] ?? null),
                    'semestre'     => $this->nullableTrim($cells['H'] ?? null),

                    'ide_materia' => $this->nullableTrim($cells['I'] ?? null),
                    'materia'     => $this->nullableTrim($cells['J'] ?? null),
                    'grupo'       => $this->nullableTrim($cells['K'] ?? null),

                    'nota_1'       => is_numeric($cells['L'] ?? null) ? $cells['L'] : null,
                    'nota_2'       => is_numeric($cells['M'] ?? null) ? $cells['M'] : null,
                    'nota_3'       => is_numeric($cells['N'] ?? null) ? $cells['N'] : null,
                    'definitiva'   => is_numeric($cells['O'] ?? null) ? $cells['O'] : null,
                    'habilitacion' => is_numeric($cells['P'] ?? null) ? $cells['P'] : null,
                    'final'        => is_numeric($cells['Q'] ?? null) ? $cells['Q'] : null,

                    'anio'      => (int) ($cells['R'] ?? now()->year),
                    'periodo'   => trim((string) ($cells['S'] ?? '')),
                    'period_id' => $period->id,

                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (($payload['identificacion'] ?? '') === '') {
                    $invalidas++;
                    continue;
                }

                $rowKey = $this->buildNotaUniqueKey($payload);
                if (!$rowKey) {
                    $invalidas++;
                    continue;
                }

                if (isset($seenKeys[$rowKey])) {
                    $duplicadas++;
                    continue;
                }

                $batch[] = $payload;
                $seenKeys[$rowKey] = true;

                // 🔥 Insertar por bloques grandes
                if (count($batch) === 1000) {
                    Nota::insert($batch);
                    $importadas += count($batch);
                    $batch = [];
                }
            }

            // Último bloque
            if (!empty($batch)) {
                Nota::insert($batch);
                $importadas += count($batch);
            }

            DB::commit();

            if ($importadas === 0 && $duplicadas > 0) {
                return back()->withErrors([
                    'archivo' => "Las notas de este archivo ya existen para el período activo ({$period->name}). No se importó nada."
                ]);
            }

            $message = "✅ {$importadas} notas importadas correctamente ({$period->name})";

            if ($duplicadas > 0 || $invalidas > 0) {
                $extras = [];

                if ($duplicadas > 0) {
                    $extras[] = "{$duplicadas} duplicadas omitidas";
                }

                if ($invalidas > 0) {
                    $extras[] = "{$invalidas} filas inválidas omitidas";
                }

                $message .= '. ' . implode(', ', $extras) . '.';
            }

            return back()->with('success', $message);

        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()->withErrors([
                'archivo' => 'Error al importar notas. Revisa el archivo.'
            ]);
        }
    }

    /* =========================
       DETECTAR HOJA CORRECTA
    ========================= */
    private function detectarHojaConDatos($spreadsheet)
    {
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $fila1 = $sheet->toArray(null, true, true, true)[1] ?? [];

            foreach ($fila1 as $valor) {
                if (
                    is_string($valor) &&
                    str_contains(mb_strtolower($valor), 'identificacion')
                ) {
                    return $sheet;
                }
            }
        }

        return null;
    }

    private function buildNotaUniqueKey(array $row): ?string
    {
        $identificacion = $this->normalizeIdentificacion($row['identificacion'] ?? null);
        if ($identificacion === '') {
            return null;
        }

        $materiaKey = $this->nullableTrim($row['ide_materia'] ?? null);
        if (!$materiaKey) {
            $materiaKey = $this->normalizeTextKey($row['materia'] ?? null);
        }

        if (!$materiaKey) {
            return null;
        }

        $grupo = $this->normalizeTextKey($row['grupo'] ?? null) ?: 'SIN-GRUPO';

        return $identificacion . '|' . $materiaKey . '|' . $grupo;
    }

    private function normalizeIdentificacion($value): string
    {
        $text = trim((string) $value);
        return preg_replace('/\s+/', '', $text);
    }

    private function nullableTrim($value): ?string
    {
        $text = trim((string) $value);
        return $text !== '' ? $text : null;
    }

    private function normalizeTextKey($value): ?string
    {
        $text = $this->nullableTrim($value);

        if ($text === null) {
            return null;
        }

        $text = mb_strtoupper($text);
        $text = str_replace(['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'], ['A', 'E', 'I', 'O', 'U', 'U', 'N'], $text);

        return preg_replace('/\s+/', ' ', $text);
    }
}
