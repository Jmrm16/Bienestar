<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\Estudiante;
use App\Models\GrupoT;
use App\Models\Nota;
use App\Models\ReportPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Schema;

class EstudianteController extends Controller
{
    /**
     * GET /estudiantes?period_id=#
     * Muestra registros SOLO del periodo seleccionado
     */
    public function index(Request $request)
    {
        return Inertia::render('Estudiantes/index', $this->buildIndexPayload($request));
    }

    /**
     * GET /estudiantes/reportes?period_id=#
     * Muestra la vista analítica del módulo por período.
     */
    public function reportes(Request $request)
    {
        return Inertia::render('Estudiantes/Reportes', $this->buildReportPayload($request));
    }

    /**
     * GET /estudiantes/{estudiante}
     * Muestra detalle del estudiante con grupo, tutores y notas del período.
     */
    public function show(Request $request, Estudiante $estudiante)
    {
        $estudiante->load('period:id,code,name');

        $periodId = (int) $estudiante->period_id;
        $identificacion = trim((string) $estudiante->identificacion);
        $returnPeriodId = (int) ($request->query('period_id') ?: $periodId);
        $returnFilters = [
            'period_id' => $returnPeriodId,
            'q' => trim((string) $request->query('q', '')),
            'servicio' => trim((string) $request->query('servicio', '')),
            'trimestre' => trim((string) $request->query('trimestre', '')),
            'page' => max(1, (int) $request->query('page', 1)),
        ];

        $asistenciasPorGrupo = Asistencia::query()
            ->where('period_id', $periodId)
            ->whereNotNull('grupo_id')
            ->whereRaw('TRIM(identificacion) = ?', [$identificacion])
            ->selectRaw('grupo_id, COUNT(*) as total_asistencias, MIN(fecha) as primera_fecha, MAX(fecha) as ultima_fecha')
            ->groupBy('grupo_id')
            ->get()
            ->keyBy('grupo_id');

        $grupoIds = $asistenciasPorGrupo
            ->keys()
            ->filter(fn ($id) => !is_null($id))
            ->map(fn ($id) => (int) $id)
            ->values();

        $grupos = $grupoIds->isEmpty()
            ? collect()
            : GrupoT::query()
                ->with([
                    'carrera:id,nombre',
                    'asignatura:id,nombre,carrera_id',
                    'tutores' => fn ($query) => $query
                        ->select('tutors.id', 'tutors.nombre', 'tutors.apellido', 'tutors.correo', 'tutors.telefono')
                        ->wherePivot('period_id', $periodId),
                ])
                ->where('period_id', $periodId)
                ->whereIn('id', $grupoIds)
                ->orderBy('nombre')
                ->get()
                ->map(function (GrupoT $grupo) use ($asistenciasPorGrupo) {
                    $meta = $asistenciasPorGrupo->get($grupo->id);

                    return [
                        'id' => $grupo->id,
                        'nombre' => $grupo->nombre,
                        'codigo' => $grupo->codigo,
                        'docente' => $grupo->docente,
                        'carrera' => $grupo->carrera
                            ? [
                                'id' => $grupo->carrera->id,
                                'nombre' => $grupo->carrera->nombre,
                            ]
                            : null,
                        'asignatura' => $grupo->asignatura
                            ? [
                                'id' => $grupo->asignatura->id,
                                'nombre' => $grupo->asignatura->nombre,
                            ]
                            : null,
                        'tutores' => $grupo->tutores
                            ->sortBy(fn ($tutor) => ($tutor->pivot->rol ?? '') === 'principal' ? 0 : 1)
                            ->values()
                            ->map(fn ($tutor) => [
                                'id' => $tutor->id,
                                'nombre' => $tutor->nombre,
                                'apellido' => $tutor->apellido,
                                'correo' => $tutor->correo,
                                'telefono' => $tutor->telefono,
                                'rol' => $tutor->pivot->rol ?? null,
                            ]),
                        'total_asistencias' => (int) ($meta->total_asistencias ?? 0),
                        'primera_fecha' => $meta->primera_fecha,
                        'ultima_fecha' => $meta->ultima_fecha,
                    ];
                })
                ->values();

        $notas = Nota::query()
            ->where('period_id', $periodId)
            ->whereRaw('TRIM(identificacion) = ?', [$identificacion])
            ->orderBy('materia')
            ->orderBy('grupo')
            ->get([
                'id',
                'materia',
                'grupo',
                'programa',
                'semestre',
                'nota_1',
                'nota_2',
                'nota_3',
                'definitiva',
                'final',
                'habilitacion',
            ])
            ->map(fn (Nota $nota) => [
                'id' => $nota->id,
                'materia' => $nota->materia,
                'grupo' => $nota->grupo,
                'programa' => $nota->programa,
                'semestre' => $nota->semestre,
                'nota_1' => $nota->nota_1,
                'nota_2' => $nota->nota_2,
                'nota_3' => $nota->nota_3,
                'definitiva' => $nota->definitiva,
                'final' => $nota->final,
                'habilitacion' => $nota->habilitacion,
            ])
            ->values();

        return Inertia::render('Estudiantes/Show', [
            'estudiante' => [
                'id' => $estudiante->id,
                'period_id' => $estudiante->period_id,
                'identificacion' => $estudiante->identificacion,
                'nombres' => $estudiante->nombres,
                'apellidos' => $estudiante->apellidos,
                'nombre_completo' => $estudiante->nombre_completo,
                'sexo' => $estudiante->sexo,
                'grupos_prioritarios' => $estudiante->grupos_prioritarios,
                'estamento' => $estudiante->estamento,
                'dependencia' => $estudiante->dependencia,
                'programa_academico' => $estudiante->programa_academico,
                'servicio' => $estudiante->servicio,
                'actividad' => $estudiante->actividad,
                'responsable' => $estudiante->responsable,
                'trimestre' => $estudiante->trimestre,
                'period' => $estudiante->period
                    ? [
                        'id' => $estudiante->period->id,
                        'code' => $estudiante->period->code,
                        'name' => $estudiante->period->name,
                    ]
                    : null,
            ],
            'return_period_id' => $returnPeriodId,
            'return_filters' => $returnFilters,
            'grupos' => $grupos,
            'notas' => $notas,
        ]);
    }

    /**
     * POST /estudiantes/importar-excel
     * Importa Excel multi-hoja (Repitencia / Acompañamiento)
     * Opción B: servicio/actividad/trimestre = '' (no null)
     */
    public function cargarExcel(Request $request)
    {
        $request->validate([
            'period_id' => ['required', 'exists:report_periods,id'],
            'archivo'   => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $periodId = (int) $request->period_id;
        $archivo  = $request->file('archivo');

        $spreadsheet = IOFactory::load($archivo->getPathname());

        $creados = 0;
        $actualizados = 0;
        $saltados = 0;

        // ✅ Mapeo de encabezados (flexible)
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

        // ✅ Columnas reales permitidas en la tabla
        $allowedCols = array_flip(Schema::getColumnListing((new Estudiante)->getTable()));

        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            $sheetName = trim((string) $sheet->getTitle());
            $filas = $sheet->toArray(null, true, true, true);

            if (count($filas) < 2) continue;

            // ✅ Detectar fila de encabezado (no asumir siempre fila 1)
            $headerIndex = null;
            foreach ($filas as $idx => $row) {
                $joined = $this->cleanHeader(implode(' ', array_values($row)));
                if (str_contains($joined, 'identificacion')) {
                    $headerIndex = (int) $idx;
                    break;
                }
            }
            if ($headerIndex === null) continue;

            $headerRow = $filas[$headerIndex] ?? [];
            $columnToField = [];

            foreach ($headerRow as $colKey => $header) {
                $h = $this->cleanHeader($header);

                foreach ($headerMappings as $field => $aliases) {
                    foreach ($aliases as $alias) {
                        if ($h === $this->cleanHeader($alias)) {
                            $columnToField[$colKey] = $field;
                            break 2; // ✅ solo sale del alias+mappings para ese header
                        }
                    }
                }
            }

            // Si no tiene identificación, esta hoja no es la plantilla esperada
            if (!in_array('identificacion', $columnToField, true)) continue;

            foreach ($filas as $i => $fila) {
                if ($i <= $headerIndex) continue;

                // Saltar filas vacías
                if (!is_array($fila) || count(array_filter($fila, fn ($v) => trim((string) $v) !== '')) === 0) {
                    continue;
                }

                $data = ['period_id' => $periodId];
                $fullName = null;

                // Mapear columnas detectadas
                foreach ($fila as $colKey => $value) {
                    if (!isset($columnToField[$colKey])) continue;

                    $field = $columnToField[$colKey];
                    $val = is_string($value) ? trim($value) : $value;

                    if ($field === 'nombres_apellidos') {
                        $fullName = trim((string) $val);
                        continue;
                    }

                    $data[$field] = ($val !== '' ? $val : null);
                }

                // Identificación obligatoria
                $ident = trim((string) ($data['identificacion'] ?? ''));
                $ident = preg_replace('/\s+/', '', $ident);
                if ($ident === '') {
                    $saltados++;
                    continue;
                }
                $data['identificacion'] = $ident;

                // Separar nombres/apellidos si viene fullName
                if ($fullName) {
                    [$nombres, $apellidos] = $this->splitFullName($fullName);
                    $data['nombres'] = $nombres;
                    $data['apellidos'] = $apellidos;
                }

                // Normalizar sexo
                if (!empty($data['sexo'])) {
                    $sx = strtoupper(trim((string) $data['sexo']));
                    if (in_array($sx, ['F', 'FEMENINO'])) $data['sexo'] = 'F';
                    elseif (in_array($sx, ['M', 'MASCULINO'])) $data['sexo'] = 'M';
                }

                // ✅ Opción B: servicio/actividad/trimestre NO NULL ('' default)
                $svc = trim((string) ($data['servicio'] ?? ''));
                if ($svc === '') $svc = $sheetName; // si no viene columna, usar nombre de hoja
                $data['servicio'] = $svc;

                $data['actividad'] = trim((string) ($data['actividad'] ?? ''));
                $data['trimestre'] = trim((string) ($data['trimestre'] ?? ''));

                // dependencia puede venir vacía => null
                if (isset($data['dependencia'])) {
                    $dep = trim((string) $data['dependencia']);
                    $data['dependencia'] = $dep === '' ? null : $dep;
                }

                // Filtrar solo columnas existentes
                $data = array_filter(
                    $data,
                    fn ($v, $k) => isset($allowedCols[$k]),
                    ARRAY_FILTER_USE_BOTH
                );

                // ✅ Upsert por llave compuesta
                $where = [
                    'period_id' => $periodId,
                    'identificacion' => $ident,
                    'servicio' => $data['servicio'] ?? '',
                    'actividad' => $data['actividad'] ?? '',
                    'trimestre' => $data['trimestre'] ?? '',
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

        // ✅ volver al index mostrando el periodo importado
        return redirect()
            ->route('estudiantes.index', ['period_id' => $periodId])
            ->with('success', "✅ Importación lista: $creados creados, $actualizados actualizados. (Saltados: $saltados)");
    }

    /**
     * PUT/PATCH /estudiantes/{id}
     */
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

        // ✅ Opción B: no null
        if (array_key_exists('servicio', $data)) $data['servicio'] = trim((string)($data['servicio'] ?? ''));
        if (array_key_exists('actividad', $data)) $data['actividad'] = trim((string)($data['actividad'] ?? ''));
        if (array_key_exists('trimestre', $data)) $data['trimestre'] = trim((string)($data['trimestre'] ?? ''));

        $estudiante->update($data);

        return back()->with('success', 'Registro actualizado correctamente.');
    }

    /**
     * DELETE /estudiantes/{id}
     */
    public function destroy($id)
    {
        $estudiante = Estudiante::findOrFail($id);
        $estudiante->delete();

        return back()->with('success', 'Registro eliminado correctamente.');
    }

    /* ========================= Helpers ========================= */

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

        // "APELLIDOS, NOMBRES"
        if (str_contains($fullName, ',')) {
            [$ap, $no] = array_map('trim', explode(',', $fullName, 2));
            return [$no ?: '', $ap ?: ''];
        }

        $parts = explode(' ', $fullName);

        if (count($parts) <= 2) {
            return [$parts[0] ?? '', $parts[1] ?? ''];
        }

        // últimos 2 = apellidos, resto = nombres
        $apellidos = implode(' ', array_slice($parts, -2));
        $nombres = implode(' ', array_slice($parts, 0, -2));
        return [$nombres, $apellidos];
    }

    private function buildIndexPayload(Request $request): array
    {
        $periods = ReportPeriod::orderByDesc('id')->get(['id', 'code', 'name']);

        $selectedPeriodId = (int) ($request->query('period_id') ?: ($periods->first()->id ?? 0));
        $search = trim((string) $request->query('q', ''));
        $servicio = trim((string) $request->query('servicio', ''));
        $trimestre = trim((string) $request->query('trimestre', ''));

        $rows = [
            'data' => [],
            'current_page' => 1,
            'next_page_url' => null,
            'prev_page_url' => null,
            'per_page' => 50,
        ];

        $filterOptions = [
            'servicios' => [],
            'trimestres' => [],
        ];

        if ($selectedPeriodId) {
            $periodQuery = Estudiante::query()->where('period_id', $selectedPeriodId);

            $filterOptions['servicios'] = (clone $periodQuery)
                ->whereNotNull('servicio')
                ->where('servicio', '!=', '')
                ->distinct()
                ->orderBy('servicio')
                ->pluck('servicio')
                ->values();

            $filterOptions['trimestres'] = (clone $periodQuery)
                ->whereNotNull('trimestre')
                ->where('trimestre', '!=', '')
                ->distinct()
                ->orderBy('trimestre')
                ->pluck('trimestre')
                ->values();

            $rowsQuery = (clone $periodQuery)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($inner) use ($search) {
                        $like = '%' . $search . '%';

                        $inner->where('identificacion', 'like', $like)
                            ->orWhere('nombres', 'like', $like)
                            ->orWhere('apellidos', 'like', $like)
                            ->orWhere('programa_academico', 'like', $like)
                            ->orWhere('dependencia', 'like', $like)
                            ->orWhere('actividad', 'like', $like);
                    });
                })
                ->when($servicio !== '', fn ($query) => $query->where('servicio', $servicio))
                ->when($trimestre !== '', fn ($query) => $query->where('trimestre', $trimestre));

            $rows = $rowsQuery
                ->select([
                    'id',
                    'period_id',
                    'identificacion',
                    'nombres',
                    'apellidos',
                    'sexo',
                    'grupos_prioritarios',
                    'estamento',
                    'dependencia',
                    'programa_academico',
                    'servicio',
                    'actividad',
                    'responsable',
                    'trimestre',
                ])
                ->orderBy('servicio')
                ->orderBy('actividad')
                ->orderBy('apellidos')
                ->orderBy('nombres')
                ->simplePaginate(50)
                ->withQueryString()
                ->through(fn (Estudiante $row) => [
                    'id' => $row->id,
                    'period_id' => $row->period_id,
                    'identificacion' => $row->identificacion,
                    'nombres' => $row->nombres,
                    'apellidos' => $row->apellidos,
                    'sexo' => $row->sexo,
                    'grupos_prioritarios' => $row->grupos_prioritarios,
                    'estamento' => $row->estamento,
                    'dependencia' => $row->dependencia,
                    'programa_academico' => $row->programa_academico,
                    'servicio' => $row->servicio ?? '',
                    'actividad' => $row->actividad ?? '',
                    'responsable' => $row->responsable,
                    'trimestre' => $row->trimestre ?? '',
                ]);
        }

        return [
            'periods' => $periods,
            'selected_period_id' => $selectedPeriodId,
            'filters' => [
                'q' => $search,
                'servicio' => $servicio,
                'trimestre' => $trimestre,
            ],
            'filter_options' => $filterOptions,
            'rows' => $rows,
        ];
    }

    private function buildReportPayload(Request $request): array
    {
        $periods = ReportPeriod::orderByDesc('id')->get(['id', 'code', 'name']);

        $selectedPeriodId = (int) ($request->query('period_id') ?: ($periods->first()->id ?? 0));
        $search = trim((string) $request->query('q', ''));
        $servicio = trim((string) $request->query('servicio', ''));
        $trimestre = trim((string) $request->query('trimestre', ''));
        $page = max(1, (int) $request->query('page', 1));

        $rows = $selectedPeriodId
            ? Estudiante::where('period_id', $selectedPeriodId)
                ->orderBy('servicio')
                ->orderBy('actividad')
                ->orderBy('apellidos')
                ->orderBy('nombres')
                ->get()
            : collect();

        return [
            'periods' => $periods,
            'selected_period_id' => $selectedPeriodId,
            'rows' => $rows,
            'return_filters' => [
                'q' => $search,
                'servicio' => $servicio,
                'trimestre' => $trimestre,
                'page' => $page,
            ],
        ];
    }
}
