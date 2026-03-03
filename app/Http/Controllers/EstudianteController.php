<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use App\Models\ReportPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Schema;

class EstudianteController extends Controller
{
    public function index(Request $request)
    {
        $periods = ReportPeriod::orderByDesc('id')->get(['id','code','name']);

        // ✅ periodo seleccionado por query (?period_id=) o el último
        $selectedPeriodId = (int) ($request->query('period_id') ?: ($periods->first()->id ?? 0));

        // ✅ rows del periodo seleccionado
        $rows = $selectedPeriodId
            ? Estudiante::where('period_id', $selectedPeriodId)
                ->orderBy('apellidos')
                ->orderBy('nombres')
                ->get()
            : collect();

        return Inertia::render('Estudiantes/index', [
            'periods' => $periods,
            'selected_period_id' => $selectedPeriodId,
            'rows' => $rows,
        ]);
    }

    /**
     * ✅ IMPORTAR EXCEL MULTI-HOJA (Repitencia / Acompañamiento)
     * Opción B: servicio/actividad/trimestre = '' (no null)
     */
    public function cargarExcel(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:report_periods,id',
            'archivo'   => 'required|file|mimes:xlsx,xls',
        ]);

        $periodId = (int) $request->period_id;
        $archivo  = $request->file('archivo');

        $spreadsheet = IOFactory::load($archivo->getPathname());

        $creados = 0;
        $actualizados = 0;
        $saltados = 0;

        $headerMappings = [
            'identificacion'      => ['identificacion', 'identificación', 'documento', 'número documento', 'numero documento'],
            'nombres_apellidos'   => ['nombres y apellidos', 'nombre y apellido', 'nombre completo', 'nombres completos'],
            'sexo'                => ['sexo', 'genero', 'género'],
            'grupos_prioritarios' => ['grupos prioritarios', 'grupo prioritario', 'priorizados', 'grupo priorizado'],
            'estamento'           => ['estamento'],
            'dependencia'         => ['dependencia'],
            'programa_academico'  => ['programa academico', 'programa académico', 'programa', 'carrera'],
            'servicio'            => ['servicio'],
            'actividad'           => ['actividad'],
            'responsable'         => ['responsable'],
            'trimestre'           => ['trimestre'],
        ];

        $allowedCols = array_flip(Schema::getColumnListing((new Estudiante)->getTable()));

        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            $sheetName = trim((string) $sheet->getTitle());
            $filas = $sheet->toArray(null, true, true, true);

            if (count($filas) < 2) continue;

            // ✅ buscar fila encabezado
            $headerIndex = null;
            foreach ($filas as $idx => $row) {
                $joined = $this->cleanHeader(implode(' ', array_values($row)));
                if (str_contains($joined, 'identificacion')) {
                    $headerIndex = (int) $idx;
                    break;
                }
            }
            if (!$headerIndex) continue;

            $headerRow = $filas[$headerIndex] ?? [];
            $columnToField = [];

            foreach ($headerRow as $colKey => $header) {
                $h = $this->cleanHeader($header);
                foreach ($headerMappings as $field => $aliases) {
                    foreach ($aliases as $alias) {
                        if ($h === $this->cleanHeader($alias)) {
                            $columnToField[$colKey] = $field;
                            break 2; // ✅ solo sale de alias+mappings para ese header
                        }
                    }
                }
            }

            if (!in_array('identificacion', $columnToField, true)) continue;

            foreach ($filas as $i => $fila) {
                if ($i <= $headerIndex) continue;

                if (!is_array($fila) || count(array_filter($fila, fn($v) => trim((string)$v) !== '')) === 0) {
                    continue;
                }

                $data = ['period_id' => $periodId];
                $fullName = null;

                foreach ($fila as $colKey => $value) {
                    if (!isset($columnToField[$colKey])) continue;

                    $field = $columnToField[$colKey];
                    $val = is_string($value) ? trim($value) : $value;

                    if ($field === 'nombres_apellidos') {
                        $fullName = trim((string)$val);
                        continue;
                    }

                    $data[$field] = ($val !== '' ? $val : null);
                }

                // identificacion obligatoria
                $ident = trim((string)($data['identificacion'] ?? ''));
                $ident = preg_replace('/\s+/', '', $ident);
                if ($ident === '') {
                    $saltados++;
                    continue;
                }
                $data['identificacion'] = $ident;

                // split nombres/apellidos
                if ($fullName) {
                    [$nombres, $apellidos] = $this->splitFullName($fullName);
                    $data['nombres'] = $nombres;
                    $data['apellidos'] = $apellidos;
                }

                // normalizar sexo
                if (!empty($data['sexo'])) {
                    $sx = strtoupper(trim((string)$data['sexo']));
                    if (in_array($sx, ['F', 'FEMENINO'])) $data['sexo'] = 'F';
                    else if (in_array($sx, ['M', 'MASCULINO'])) $data['sexo'] = 'M';
                }

                // ✅ Opción B: no null
                $svc = trim((string)($data['servicio'] ?? ''));
                if ($svc === '') $svc = $sheetName;
                $data['servicio'] = $svc;

                $data['actividad'] = trim((string)($data['actividad'] ?? ''));
                $data['trimestre'] = trim((string)($data['trimestre'] ?? ''));

                // dependencia (acompañamiento puede no traer)
                if (isset($data['dependencia'])) {
                    $dep = trim((string)$data['dependencia']);
                    $data['dependencia'] = $dep === '' ? null : $dep;
                }

                // filtrar columnas existentes
                $data = array_filter(
                    $data,
                    fn($v, $k) => isset($allowedCols[$k]),
                    ARRAY_FILTER_USE_BOTH
                );

                // ✅ llave compuesta (para evitar pisados)
                $where = [
                    'period_id' => $periodId,
                    'identificacion' => $ident,
                    'servicio' => $data['servicio'],
                    'actividad' => $data['actividad'],
                    'trimestre' => $data['trimestre'],
                ];

                $est = Estudiante::where($where)->first();

                if ($est) {
                    $est->update($data);
                    $actualizados++;
                } else {
                    Estudiante::create($data);
                    $creados++;
                }
            }
        }

        // ✅ redirige al index con el periodo importado para que muestre datos
        return redirect()
            ->route('estudiantes.index', ['period_id' => $periodId])
            ->with('success', "✅ Importación lista: $creados creados, $actualizados actualizados. (Saltados: $saltados)");
    }

    public function update(Request $request, $id)
    {
        $estudiante = Estudiante::findOrFail($id);

        $data = $request->validate([
            'identificacion' => 'sometimes|string|max:50',
            'nombres' => 'sometimes|string|max:150',
            'apellidos' => 'sometimes|string|max:150',
            'sexo' => 'nullable|string|max:20',
            'grupos_prioritarios' => 'nullable|string|max:255',
            'estamento' => 'nullable|string|max:100',
            'dependencia' => 'nullable|string|max:150',
            'programa_academico' => 'nullable|string|max:150',
            'servicio' => 'nullable|string|max:150',
            'actividad' => 'nullable|string|max:200',
            'responsable' => 'nullable|string|max:150',
            'trimestre' => 'nullable|string|max:50',
        ]);

        // opción B: no null
        if (array_key_exists('servicio', $data)) $data['servicio'] = trim((string)($data['servicio'] ?? ''));
        if (array_key_exists('actividad', $data)) $data['actividad'] = trim((string)($data['actividad'] ?? ''));
        if (array_key_exists('trimestre', $data)) $data['trimestre'] = trim((string)($data['trimestre'] ?? ''));

        $estudiante->update($data);

        return back()->with('success', 'Registro actualizado correctamente.');
    }

    public function destroy($id)
    {
        $estudiante = Estudiante::findOrFail($id);
        $estudiante->delete();

        return back()->with('success', 'Registro eliminado correctamente.');
    }

    /* ================= Helpers ================= */

    private function cleanHeader($s): string
    {
        $s = strtolower(trim((string)$s));
        $s = str_replace(['á','é','í','ó','ú','ü','ñ'], ['a','e','i','o','u','u','n'], $s);
        $s = preg_replace('/\s+/', ' ', $s);
        return $s;
    }

    private function splitFullName(string $fullName): array
    {
        $fullName = preg_replace('/\s+/', ' ', trim($fullName));

        if (str_contains($fullName, ',')) {
            [$ap, $no] = array_map('trim', explode(',', $fullName, 2));
            return [$no ?: '', $ap ?: ''];
        }

        $parts = explode(' ', $fullName);

        if (count($parts) <= 2) {
            return [$parts[0] ?? '', $parts[1] ?? ''];
        }

        $apellidos = implode(' ', array_slice($parts, -2));
        $nombres = implode(' ', array_slice($parts, 0, -2));
        return [$nombres, $apellidos];
    }
}