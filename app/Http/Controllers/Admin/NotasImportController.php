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
    public function index()
    {
        return inertia('Notas/Index', [
            'notas' => [],
            'totalNotas' => Nota::count(),
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

    $userId = Auth::id();
    $importadas = 0;
    $batch = [];

    DB::beginTransaction();

    try {
        foreach ($sheet->getRowIterator() as $rowIndex => $row) {

            // ⛔ Saltar encabezados
            if ($rowIndex < 2) continue;

            $cells = [];
            foreach ($row->getCellIterator() as $cell) {
                $cells[$cell->getColumn()] = $cell->getValue();
            }

            // ⛔ Fila sin identificación
            if (empty($cells['E'])) continue;

            $batch[] = [
                'codigo'              => $cells['A'] ?? null,
                'apellidos'           => trim($cells['B'] ?? ''),
                'nombres'             => trim($cells['C'] ?? ''),
                'tipo_identificacion' => trim($cells['D'] ?? ''),
                'identificacion'      => trim((string) $cells['E']),

                'ide_programa' => $cells['F'] ?? null,
                'programa'     => $cells['G'] ?? null,
                'semestre'     => $cells['H'] ?? null,

                'ide_materia' => trim($cells['I'] ?? ''),
                'materia'     => trim($cells['J'] ?? ''),
                'grupo'       => $cells['K'] ?? null,

                'nota_1'       => is_numeric($cells['L'] ?? null) ? $cells['L'] : null,
                'nota_2'       => is_numeric($cells['M'] ?? null) ? $cells['M'] : null,
                'nota_3'       => is_numeric($cells['N'] ?? null) ? $cells['N'] : null,
                'definitiva'   => is_numeric($cells['O'] ?? null) ? $cells['O'] : null,
                'habilitacion' => is_numeric($cells['P'] ?? null) ? $cells['P'] : null,
                'final'        => is_numeric($cells['Q'] ?? null) ? $cells['Q'] : null,

                'anio'      => (int) ($cells['R'] ?? now()->year),
                'periodo'   => trim($cells['S'] ?? ''),
                'period_id' => $period->id,

                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ];

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

        return back()->with(
            'success',
            "✅ {$importadas} notas importadas correctamente ({$period->name})"
        );

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
}
