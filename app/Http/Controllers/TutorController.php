<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\Tutor;
use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\GrupoT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class TutorController extends Controller
{
    /**
     * Mostrar todos los tutores y recursos relacionados.
     */
    public function index()
    {
        $tutores = Tutor::with(['asignaturas', 'carrera'])->get();
        $asignaturas = Asignatura::orderBy('nombre')->get();
        $totalTutores = Tutor::count();
        $carreras = Carrera::all();
        $grupos = GrupoT::with('carrera')->orderBy('nombre')->get();

        return Inertia::render('Tutores/index', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'carreras' => $carreras,
            'totalTutores' => $totalTutores,
            'grupos' => $grupos,
        ]);
    }

    /**
     * Mostrar perfil de un tutor.
     */
    public function perfil(Tutor $tutor)
    {
        $tutor->load([
            'carrera:id,nombre',
            'asignaturas:id,nombre,carrera_id',
            'grupos' => fn ($query) => $query
                ->select('grupo_t.id', 'grupo_t.nombre', 'grupo_t.codigo', 'grupo_t.carrera_id', 'grupo_t.asignatura_id', 'grupo_t.period_id')
                ->with([
                    'carrera:id,nombre',
                    'asignatura:id,nombre',
                    'periodo:id,code,name',
                ])
                ->orderByDesc('period_id')
                ->orderBy('nombre'),
        ]);

        $groupIds = $tutor->grupos
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $periodIds = $tutor->grupos
            ->map(fn (GrupoT $grupo) => (int) ($grupo->pivot->period_id ?? $grupo->period_id))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        $attendanceMeta = collect();
        if ($groupIds->isNotEmpty() && $periodIds->isNotEmpty()) {
            $attendanceMeta = Asistencia::query()
                ->whereIn('grupo_id', $groupIds)
                ->whereIn('period_id', $periodIds)
                ->selectRaw('grupo_id, period_id, COUNT(*) as total_asistencias, COUNT(DISTINCT identificacion) as total_estudiantes, MAX(fecha) as ultima_fecha')
                ->groupBy('grupo_id', 'period_id')
                ->get()
                ->keyBy(fn ($row) => $row->grupo_id . '|' . $row->period_id);
        }

        $grupos = $tutor->grupos
            ->map(function (GrupoT $grupo) use ($attendanceMeta) {
                $periodId = (int) ($grupo->pivot->period_id ?? $grupo->period_id ?? 0);
                $meta = $attendanceMeta->get($grupo->id . '|' . $periodId);

                return [
                    'id' => $grupo->id,
                    'nombre' => $grupo->nombre,
                    'codigo' => $grupo->codigo,
                    'rol' => $grupo->pivot->rol ?? null,
                    'period' => $grupo->periodo
                        ? [
                            'id' => $grupo->periodo->id,
                            'code' => $grupo->periodo->code,
                            'name' => $grupo->periodo->name,
                        ]
                        : null,
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
                    'total_asistencias' => (int) ($meta->total_asistencias ?? 0),
                    'total_estudiantes' => (int) ($meta->total_estudiantes ?? 0),
                    'ultima_fecha' => $meta->ultima_fecha ?? null,
                ];
            })
            ->values();

        return Inertia::render('Tutores/tutorprofile', [
            'tutor' => [
                'id' => $tutor->id,
                'codigo' => $tutor->codigo,
                'tipo_resolucion' => $tutor->tipo_resolucion,
                'nombre' => $tutor->nombre,
                'apellido' => $tutor->apellido,
                'tipo_documento' => $tutor->tipo_documento,
                'documento' => $tutor->documento,
                'lugar_expedicion' => $tutor->lugar_expedicion,
                'sexo' => $tutor->sexo,
                'grupo_priorizado' => $tutor->grupo_priorizado,
                'sede' => $tutor->sede,
                'correo' => $tutor->correo,
                'telefono' => $tutor->telefono,
                'activo' => (bool) $tutor->activo,
                'carrera' => $tutor->carrera
                    ? [
                        'id' => $tutor->carrera->id,
                        'nombre' => $tutor->carrera->nombre,
                    ]
                    : null,
                'asignaturas' => $tutor->asignaturas
                    ->map(fn (Asignatura $asignatura) => [
                        'id' => $asignatura->id,
                        'nombre' => $asignatura->nombre,
                    ])
                    ->values(),
                'grupos' => $grupos,
            ],
            'resumen' => [
                'total_grupos' => $grupos->count(),
                'grupos_con_asistencias' => $grupos->where('total_asistencias', '>', 0)->count(),
                'total_estudiantes' => (int) $grupos->sum('total_estudiantes'),
                'total_asistencias' => (int) $grupos->sum('total_asistencias'),
            ],
        ]);
    }

    /**
     * Registrar un nuevo tutor.
     */
    public function store(Request $request)
    {
        $request->validate([
            'codigo'            => 'required|string|max:50|unique:tutors,codigo',
            'tipo_resolucion'   => 'required|in:R1,R2', // ✅ NUEVO
            'nombre'            => 'required|string|max:255',
            'apellido'          => 'required|string|max:255',
            'tipo_documento'    => 'required|string|max:50',
            'documento'         => 'required|string|max:50|unique:tutors,documento',
            'lugar_expedicion'  => 'required|string|max:255',
            'sexo'              => 'required|string|max:10',
            'grupo_priorizado'  => 'required|string|max:255',
            'sede'              => 'required|string|max:255',
            'carrera_id'        => 'required|exists:carreras,id',
            'correo'            => 'required|email|unique:tutors,correo',
            'telefono'          => 'required|string|max:20',
            'asignaturas'       => 'required|array',
            'asignaturas.*'     => 'exists:asignaturas,id',
            'activo'            => 'nullable|boolean',
        ]);

        $subjectIds = array_values(array_unique(array_map('intval', $request->input('asignaturas', []))));
        $this->assertSubjectsMatchCareer((int) $request->carrera_id, $subjectIds);

        $tutor = Tutor::create([
            'codigo'           => $request->codigo,
            'tipo_resolucion'  => $request->tipo_resolucion, // ✅ NUEVO
            'nombre'           => $request->nombre,
            'apellido'         => $request->apellido,
            'tipo_documento'   => $request->tipo_documento,
            'documento'        => $request->documento,
            'cedula_hash'      => Hash::make($request->documento),
            'lugar_expedicion' => $request->lugar_expedicion,
            'sexo'             => $request->sexo,
            'grupo_priorizado' => $request->grupo_priorizado,
            'sede'             => $request->sede,
            'carrera_id'       => $request->carrera_id,
            'correo'           => $request->correo,
            'telefono'         => $request->telefono,
            'activo'           => $request->boolean('activo', true),
        ]);

        $tutor->asignaturas()->sync($subjectIds);

        return redirect()->back()->with('success', 'Tutor registrado exitosamente.');
    }

    /**
     * Importar tutores masivamente desde Excel.
     */
    public function import(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $uploadedFile = $request->file('archivo');
        $spreadsheet = IOFactory::load($uploadedFile->getPathname());
        $ignoredHeaders = $this->ignoredImportHeaders();

        $headerMappings = [
            'codigo' => ['codigo', 'codigo tutor', 'cod tutor', 'cod'],
            'tipo_resolucion' => ['tipo resolucion', 'tipo de resolucion', 'resolucion'],
            'nombre' => ['nombre', 'nombres'],
            'apellido' => ['apellido', 'apellidos'],
            'nombre_completo' => ['nombre completo', 'nombres y apellidos', 'tutor', 'docente'],
            'tipo_documento' => ['tipo documento', 'tipo de documento'],
            'documento' => ['documento', 'identificacion', 'identificación', 'cedula', 'cédula', 'numero documento', 'número documento'],
            'lugar_expedicion' => ['lugar expedicion', 'lugar de expedicion', 'expedicion', 'expedición'],
            'sexo' => ['sexo', 'genero', 'género'],
            'grupo_priorizado' => ['grupo priorizado', 'grupo pririzado', 'grupos prioritarios', 'grupo prioritario'],
            'sede' => ['sede'],
            'carrera' => ['carrera', 'programa', 'programa academico', 'programa académico'],
            'carrera_codigo' => ['codigo carrera', 'cod carrera', 'carrera codigo'],
            'carrera_id' => ['carrera id', 'id carrera'],
            'correo' => ['correo', 'email', 'correo electronico', 'correo electrónico'],
            'telefono' => ['telefono', 'teléfono', 'celular'],
            'asignaturas' => ['asignaturas', 'materias'],
            'asignatura' => ['asignatura', 'materia'],
            'activo' => ['activo', 'estado'],
        ];

        $careerLookup = $this->buildCareerLookup();
        $subjectLookup = $this->buildSubjectLookup();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $foundHeader = false;

        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            $rows = $sheet->toArray(null, true, true, true);
            if (count($rows) < 2) {
                continue;
            }

            $headerRowIndex = $this->detectHeaderRow($rows, $headerMappings, $ignoredHeaders);
            if ($headerRowIndex === null) {
                continue;
            }

            $foundHeader = true;
            $columnMap = $this->buildColumnMap($rows[$headerRowIndex] ?? [], $headerMappings, $ignoredHeaders);
            $defaultResolution = $this->detectResolutionDefault(
                $uploadedFile->getClientOriginalName(),
                $sheet->getTitle()
            );

            foreach ($rows as $rowIndex => $row) {
                if ($rowIndex <= $headerRowIndex || $this->rowIsEmpty($row)) {
                    continue;
                }

                $rowData = [];
                foreach ($row as $column => $value) {
                    $field = $columnMap[$column] ?? null;
                    if ($field === null) {
                        continue;
                    }

                    $rowData[$field] = $this->stringifyImportValue($value);
                }

                try {
                    [$payload, $subjectIds] = $this->normalizeImportedTutorRow(
                        $rowData,
                        $careerLookup,
                        $subjectLookup,
                        $defaultResolution
                    );
                    $existingTutor = $this->findExistingTutorForImport($payload);

                    $conflictExists = Tutor::query()
                        ->when($existingTutor, fn ($query) => $query->where('id', '!=', $existingTutor->id))
                        ->where(function ($query) use ($payload) {
                            $query->where('documento', $payload['documento'])
                                ->orWhere('correo', $payload['correo'])
                                ->orWhere('codigo', $payload['codigo']);
                        })
                        ->exists();

                    if ($conflictExists) {
                        throw ValidationException::withMessages([
                            'archivo' => 'La fila entra en conflicto con otro tutor existente por código, documento o correo.',
                        ]);
                    }

                    DB::transaction(function () use ($existingTutor, $payload, $subjectIds, &$created, &$updated) {
                        if ($existingTutor) {
                            $existingTutor->update($payload);
                            $existingTutor->asignaturas()->sync($subjectIds);
                            $updated++;

                            return;
                        }

                        $tutor = Tutor::create($payload);
                        $tutor->asignaturas()->sync($subjectIds);
                        $created++;
                    });
                } catch (ValidationException $exception) {
                    $skipped++;
                    $errors[] = sprintf(
                        'Hoja "%s", fila %s: %s',
                        $sheet->getTitle(),
                        $rowIndex,
                        $exception->validator->errors()->first()
                    );
                } catch (\Throwable $exception) {
                    $skipped++;
                    $errors[] = sprintf(
                        'Hoja "%s", fila %s: %s',
                        $sheet->getTitle(),
                        $rowIndex,
                        $exception->getMessage()
                    );
                }
            }
        }

        if (! $foundHeader) {
            throw ValidationException::withMessages([
                'archivo' => 'No se encontró una fila de encabezados válida en el Excel.',
            ]);
        }

        if ($created === 0 && $updated === 0) {
            throw ValidationException::withMessages([
                'archivo' => $errors[0] ?? 'No se pudo importar ninguna fila del archivo.',
            ]);
        }

        $successMessage = "Importación completada: {$created} creados, {$updated} actualizados";
        if ($skipped > 0) {
            $successMessage .= ", {$skipped} omitidos";
        }
        $successMessage .= '.';

        return redirect()
            ->route('tutores.index')
            ->with('success', $successMessage)
            ->with('warning', $errors !== [] ? implode(' | ', array_slice($errors, 0, 3)) : null);
    }

    /**
     * Actualizar un tutor.
     */
    public function update(Request $request, $id)
    {
        $tutor = Tutor::findOrFail($id);

        $request->validate([
            'codigo'            => 'required|string|max:50|unique:tutors,codigo,' . $tutor->id,
            'tipo_resolucion'   => 'required|in:R1,R2', // ✅ NUEVO
            'nombre'            => 'required|string|max:255',
            'apellido'          => 'required|string|max:255',
            'tipo_documento'    => 'required|string|max:50',
            'documento'         => 'required|string|max:50|unique:tutors,documento,' . $tutor->id,
            'lugar_expedicion'  => 'required|string|max:255',
            'sexo'              => 'required|string|max:10',
            'grupo_priorizado'  => 'required|string|max:255',
            'sede'              => 'required|string|max:255',
            'carrera_id'        => 'required|exists:carreras,id',
            'correo'            => 'required|email|unique:tutors,correo,' . $tutor->id,
            'telefono'          => 'required|string|max:20',
            'asignaturas'       => 'required|array',
            'asignaturas.*'     => 'exists:asignaturas,id',
            'activo'            => 'nullable|boolean',
            'reset_password'    => 'nullable|boolean',
        ]);

        $subjectIds = array_values(array_unique(array_map('intval', $request->input('asignaturas', []))));
        $this->assertSubjectsMatchCareer((int) $request->carrera_id, $subjectIds);

        $payload = [
            'codigo'           => $request->codigo,
            'tipo_resolucion'  => $request->tipo_resolucion, // ✅ NUEVO
            'nombre'           => $request->nombre,
            'apellido'         => $request->apellido,
            'tipo_documento'   => $request->tipo_documento,
            'documento'        => $request->documento,
            'lugar_expedicion' => $request->lugar_expedicion,
            'sexo'             => $request->sexo,
            'grupo_priorizado' => $request->grupo_priorizado,
            'sede'             => $request->sede,
            'carrera_id'       => $request->carrera_id,
            'correo'           => $request->correo,
            'telefono'         => $request->telefono,
            'activo'           => $request->boolean('activo', $tutor->activo),
        ];

        if ($request->documento !== $tutor->documento || $request->boolean('reset_password')) {
            $payload['cedula_hash'] = Hash::make($request->documento);
        }

        $tutor->update($payload);
        $tutor->asignaturas()->sync($subjectIds);

        return redirect()->route('tutores.index')->with('success', 'Tutor actualizado correctamente.');
    }

    /**
     * Eliminar un tutor.
     */
    public function destroy($id)
    {
        $tutor = Tutor::findOrFail($id);
        $tutor->delete();

        return redirect()->back()->with('success', 'Tutor eliminado correctamente.');
    }

    private function detectHeaderRow(array $rows, array $headerMappings, array $ignoredHeaders): ?int
    {
        foreach ($rows as $rowIndex => $row) {
            $matchedFields = [];

            foreach ($row as $value) {
                if ($this->shouldIgnoreHeader($value, $ignoredHeaders)) {
                    continue;
                }

                $field = $this->matchHeaderField($value, $headerMappings);
                if ($field !== null) {
                    $matchedFields[$field] = true;
                }
            }

            if (
                count($matchedFields) >= 4 &&
                (isset($matchedFields['documento']) || isset($matchedFields['correo']) || isset($matchedFields['codigo']))
            ) {
                return (int) $rowIndex;
            }
        }

        return null;
    }

    private function buildColumnMap(array $headerRow, array $headerMappings, array $ignoredHeaders): array
    {
        $map = [];

        foreach ($headerRow as $column => $header) {
            if ($this->shouldIgnoreHeader($header, $ignoredHeaders)) {
                continue;
            }

            $field = $this->matchHeaderField($header, $headerMappings);
            if ($field !== null) {
                $map[$column] = $field;
            }
        }

        return $map;
    }

    private function matchHeaderField(mixed $header, array $headerMappings): ?string
    {
        $normalizedHeader = $this->normalizeImportText($header);
        if ($normalizedHeader === '') {
            return null;
        }

        foreach ($headerMappings as $field => $aliases) {
            foreach ($aliases as $alias) {
                if ($normalizedHeader === $this->normalizeImportText($alias)) {
                    return $field;
                }
            }
        }

        return null;
    }

    private function normalizeImportedTutorRow(
        array $rowData,
        array $careerLookup,
        array $subjectLookup,
        string $defaultResolution
    ): array
    {
        $documento = preg_replace('/\s+/', '', (string) ($rowData['documento'] ?? ''));
        $correo = Str::lower(trim((string) ($rowData['correo'] ?? '')));
        $telefono = trim((string) ($rowData['telefono'] ?? ''));
        $codigo = trim((string) ($rowData['codigo'] ?? ''));

        $nombre = trim((string) ($rowData['nombre'] ?? ''));
        $apellido = trim((string) ($rowData['apellido'] ?? ''));

        if (($nombre === '' || $apellido === '') && ! empty($rowData['nombre_completo'])) {
            [$nombre, $apellido] = $this->splitFullName((string) $rowData['nombre_completo']);
        }

        if ($documento === '' || $nombre === '' || $apellido === '' || $correo === '' || $telefono === '') {
            throw ValidationException::withMessages([
                'archivo' => 'Las columnas documento, nombre/apellido, correo y teléfono son obligatorias.',
            ]);
        }

        $resolvedCareerId = $this->resolveCareerId($rowData, $careerLookup);
        if ($resolvedCareerId === null) {
            throw ValidationException::withMessages([
                'archivo' => 'No se pudo identificar la carrera de la fila.',
            ]);
        }

        $subjectIds = $this->resolveSubjectIds($rowData, $subjectLookup, $resolvedCareerId);

        return [[
            'codigo' => $codigo !== '' ? $codigo : $documento,
            'tipo_resolucion' => $this->normalizeResolution($rowData['tipo_resolucion'] ?? null, $defaultResolution),
            'nombre' => $nombre,
            'apellido' => $apellido,
            'tipo_documento' => $this->normalizeDocumentType($rowData['tipo_documento'] ?? null),
            'documento' => $documento,
            'cedula_hash' => Hash::make($documento),
            'lugar_expedicion' => $this->fallbackImportValue($rowData['lugar_expedicion'] ?? null, 'No especificado'),
            'sexo' => $this->normalizeSex($rowData['sexo'] ?? null),
            'grupo_priorizado' => $this->normalizePriorityGroup($rowData['grupo_priorizado'] ?? null),
            'sede' => $this->fallbackImportValue($rowData['sede'] ?? null, 'No especificada'),
            'carrera_id' => $resolvedCareerId,
            'correo' => $correo,
            'telefono' => $telefono,
            'activo' => $this->normalizeBooleanValue($rowData['activo'] ?? null, true),
        ], $subjectIds];
    }

    private function findExistingTutorForImport(array $payload): ?Tutor
    {
        return Tutor::query()
            ->where('documento', $payload['documento'])
            ->orWhere('correo', $payload['correo'])
            ->orWhere('codigo', $payload['codigo'])
            ->first();
    }

    private function buildCareerLookup(): array
    {
        $lookup = [];

        foreach (Carrera::query()->get(['id', 'nombre', 'codigo']) as $career) {
            $lookup[(string) $career->id] = $career->id;
            $lookup[$this->normalizeImportText($career->nombre)] = $career->id;

            if (! empty($career->codigo)) {
                $lookup[$this->normalizeImportText($career->codigo)] = $career->id;
            }
        }

        foreach ($this->careerAliases() as $alias => $careerName) {
            $careerId = $lookup[$this->normalizeImportText($careerName)] ?? null;
            if ($careerId !== null) {
                $lookup[$this->normalizeImportText($alias)] = $careerId;
            }
        }

        return $lookup;
    }

    private function buildSubjectLookup(): array
    {
        $select = ['id', 'nombre', 'carrera_id'];
        $hasCodeColumn = Schema::hasColumn('asignaturas', 'codigo');
        if ($hasCodeColumn) {
            $select[] = 'codigo';
        }

        $lookup = [];
        foreach (Asignatura::query()->get($select) as $subject) {
            $careerKey = (string) $subject->carrera_id;
            $lookup[$careerKey] ??= [];
            $lookup[$careerKey][(string) $subject->id] = $subject->id;
            $lookup[$careerKey][$this->normalizeImportText($subject->nombre)] = $subject->id;

            if ($hasCodeColumn && ! empty($subject->codigo)) {
                $lookup[$careerKey][$this->normalizeImportText($subject->codigo)] = $subject->id;
            }
        }

        return $lookup;
    }

    private function resolveCareerId(array $rowData, array $careerLookup): ?int
    {
        foreach (['carrera_id', 'carrera_codigo', 'carrera'] as $field) {
            $value = trim((string) ($rowData[$field] ?? ''));
            if ($value === '') {
                continue;
            }

            $key = is_numeric($value) ? (string) (int) $value : $this->normalizeImportText($value);
            if (isset($careerLookup[$key])) {
                return $careerLookup[$key];
            }
        }

        return null;
    }

    private function resolveSubjectIds(array $rowData, array $subjectLookup, int $careerId): array
    {
        $rawSubjects = trim(implode('|', array_filter([
            $rowData['asignaturas'] ?? null,
            $rowData['asignatura'] ?? null,
        ], fn ($value) => trim((string) $value) !== '')));

        if ($rawSubjects === '') {
            return [];
        }

        $subjects = preg_split('/[\n,;|]+/', $rawSubjects) ?: [];
        $ids = [];
        $careerSubjects = $subjectLookup[(string) $careerId] ?? [];

        foreach ($subjects as $subject) {
            $value = trim((string) $subject);
            if ($value === '') {
                continue;
            }

            $key = is_numeric($value) ? (string) (int) $value : $this->normalizeImportText($value);
            if (isset($careerSubjects[$key])) {
                $ids[] = $careerSubjects[$key];
            }
        }

        return array_values(array_unique($ids));
    }

    private function assertSubjectsMatchCareer(int $careerId, array $subjectIds): void
    {
        if ($subjectIds === []) {
            return;
        }

        $validCount = Asignatura::query()
            ->where('carrera_id', $careerId)
            ->whereIn('id', $subjectIds)
            ->count();

        if ($validCount !== count($subjectIds)) {
            throw ValidationException::withMessages([
                'asignaturas' => 'Solo puedes asignar asignaturas de la carrera seleccionada.',
            ]);
        }
    }

    private function splitFullName(string $fullName): array
    {
        $fullName = preg_replace('/\s+/', ' ', trim($fullName));

        if (str_contains($fullName, ',')) {
            [$apellido, $nombre] = array_map('trim', explode(',', $fullName, 2));

            return [$nombre ?: '', $apellido ?: ''];
        }

        $parts = explode(' ', $fullName);
        if (count($parts) <= 2) {
            return [$parts[0] ?? '', $parts[1] ?? ''];
        }

        return [
            implode(' ', array_slice($parts, 0, -2)),
            implode(' ', array_slice($parts, -2)),
        ];
    }

    private function normalizeResolution(mixed $value, string $default = 'R1'): string
    {
        $normalized = strtoupper(trim((string) $value));

        return in_array($normalized, ['R1', 'R2'], true) ? $normalized : $default;
    }

    private function normalizeDocumentType(mixed $value): string
    {
        $normalized = $this->normalizeImportText($value);

        return match ($normalized) {
            'cc', 'c c', 'c.c.', 'cedula de ciudadania', 'cedula ciudadania' => 'CC',
            'ti', 't i', 't.i.', 'tarjeta de identidad' => 'TI',
            'ce', 'c e', 'c.e.', 'cedula de extranjeria', 'cedula extranjeria' => 'CE',
            default => $normalized !== '' ? strtoupper(str_replace(' ', '', $normalized)) : 'CC',
        };
    }

    private function normalizeSex(mixed $value): string
    {
        $normalized = strtoupper(trim((string) $value));

        return match ($normalized) {
            'MASCULINO' => 'M',
            'FEMENINO' => 'F',
            '' => 'No especificado',
            default => $normalized,
        };
    }

    private function normalizePriorityGroup(mixed $value): string
    {
        $normalized = $this->normalizeImportText($value);

        return match (true) {
            $normalized === '' => 'ninguno',
            $normalized === 'ninguno' => 'ninguno',
            str_contains($normalized, 'victima') => 'victima',
            str_contains($normalized, 'discapacidad') => 'discapacidad',
            str_contains($normalized, 'indigena'),
            str_contains($normalized, 'afro'),
            str_contains($normalized, 'etnia'),
            str_contains($normalized, 'etnico') => 'etnia',
            default => trim((string) $value),
        };
    }

    private function normalizeBooleanValue(mixed $value, bool $default = true): bool
    {
        if ($value === null || trim((string) $value) === '') {
            return $default;
        }

        $normalized = $this->normalizeImportText($value);

        if (in_array($normalized, ['1', 'si', 'sí', 'true', 'activo', 'activa'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'no', 'false', 'inactivo', 'inactiva'], true)) {
            return false;
        }

        return $default;
    }

    private function fallbackImportValue(mixed $value, string $default): string
    {
        $normalized = trim((string) $value);

        return $normalized !== '' ? $normalized : $default;
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $this->stringifyImportValue($value)) !== '') {
                return false;
            }
        }

        return true;
    }

    private function stringifyImportValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_numeric($value)) {
            $number = (float) $value;
            if ((float) (int) $number === $number) {
                return (string) (int) $number;
            }

            return rtrim(rtrim((string) $number, '0'), '.');
        }

        return trim((string) $value);
    }

    private function normalizeImportText(mixed $value): string
    {
        return Str::of((string) $value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9#]+/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    private function ignoredImportHeaders(): array
    {
        return [
            'valoracion entrevista',
            'valoracion de entrevista',
            'puntaje prueba de tablero',
            'puntaje de prueba de tablero',
            'decision final',
            'desicion final',
            '#',
        ];
    }

    private function shouldIgnoreHeader(mixed $header, array $ignoredHeaders): bool
    {
        $normalized = $this->normalizeImportText($header);
        if ($normalized === '') {
            return false;
        }

        foreach ($ignoredHeaders as $ignoredHeader) {
            $normalizedIgnored = $this->normalizeImportText($ignoredHeader);

            if ($normalized === $normalizedIgnored) {
                return true;
            }

            if (
                str_contains($normalized, 'decision final') ||
                str_contains($normalized, 'desicion final')
            ) {
                return true;
            }
        }

        return false;
    }

    private function detectResolutionDefault(string $fileName, string $sheetTitle): string
    {
        $context = $this->normalizeImportText($fileName . ' ' . $sheetTitle);

        if (str_contains($context, '2 resolucion') || str_contains($context, 'resolucion 2')) {
            return 'R2';
        }

        return 'R1';
    }

    private function careerAliases(): array
    {
        return [
            'lic educacion infantil' => 'LICENCIATURA EN EDUCACION INFANTIL',
            'ingenieria de sistema' => 'INGENIERIA DE SISTEMAS',
        ];
    }
}
