<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;


class AsignaturaController extends Controller
{
    /**
     * Mostrar listado de asignaturas.
     */
    public function index()
    {
        $asignaturas = Asignatura::with('carrera')
            ->orderBy('nombre')
            ->get();

        $carreras = Carrera::orderBy('nombre')->get();

        return Inertia::render('Asignaturas/index', [
            'asignaturas' => $asignaturas,
            'carreras'    => $carreras,
        ]);
    }

    /**
     * Crear una nueva asignatura.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'     => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        $normalizedName = $this->normalizeImportText($request->nombre);

        $exists = Asignatura::query()
            ->where('carrera_id', $request->carrera_id)
            ->get(['nombre'])
            ->contains(fn (Asignatura $asignatura) => $this->normalizeImportText($asignatura->nombre) === $normalizedName);

        if ($exists) {
            throw ValidationException::withMessages([
                'nombre' => 'Ya existe una asignatura con ese nombre en la carrera seleccionada.',
            ]);
        }

        Asignatura::create([
            'nombre'     => trim((string) $request->nombre),
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura creada exitosamente.');
    }

    /**
     * Mostrar una asignatura con sus grupos y tutores.
     */


public function show(Asignatura $asignatura)
{
    $hoy = Carbon::today();

    $asignatura->load([
        'carrera',

        'grupos' => function ($q) use ($hoy) {
            $q->whereHas('periodo', function ($p) use ($hoy) {
                $p->where('is_active', true)
                  ->whereDate('ends_at', '>=', $hoy); // 🔥 período vigente
            })
            ->with(['carrera', 'tutores', 'periodo'])
            ->orderBy('nombre');
        },
    ]);

    $tutores = Tutor::whereHas('asignaturas', function ($q) use ($asignatura) {
        $q->where('asignatura_id', $asignatura->id);
    })->get();

    return Inertia::render('Asignaturas/ShowAsignatura', [
        'asignatura' => $asignatura,
        'tutores'    => $tutores,
    ]);
}



    /**
     * Actualizar una asignatura.
     */
    public function update(Request $request, Asignatura $asignatura)
    {
        $request->validate([
            'nombre'     => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        $normalizedName = $this->normalizeImportText($request->nombre);

        $exists = Asignatura::query()
            ->where('carrera_id', $request->carrera_id)
            ->where('id', '!=', $asignatura->id)
            ->get(['nombre'])
            ->contains(fn (Asignatura $item) => $this->normalizeImportText($item->nombre) === $normalizedName);

        if ($exists) {
            throw ValidationException::withMessages([
                'nombre' => 'Ya existe una asignatura con ese nombre en la carrera seleccionada.',
            ]);
        }

        $asignatura->update([
            'nombre'     => trim((string) $request->nombre),
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura actualizada exitosamente.');
    }

    /**
     * Eliminar una asignatura.
     */
    public function destroy(Asignatura $asignatura)
    {
        $asignatura->delete();

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura eliminada correctamente.');
    }

    /**
     * Importar asignaturas desde Excel.
     */
    public function import(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $spreadsheet = IOFactory::load($request->file('archivo')->getPathname());

        $headerMappings = [
            'carrera' => ['programa academico', 'programa académico', 'programa', 'carrera'],
            'asignatura' => ['asignatura', 'asignatura ', 'materia', 'nombre asignatura'],
        ];

        $careerLookup = $this->buildCareerLookup();
        $existingSubjects = $this->buildExistingSubjectLookup();

        $created = 0;
        $skipped = 0;
        $errors = [];
        $seenInFile = [];
        $foundHeader = false;

        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            $rows = $sheet->toArray(null, true, true, true);
            if (count($rows) < 2) {
                continue;
            }

            $headerRowIndex = $this->detectHeaderRow($rows, $headerMappings);
            if ($headerRowIndex === null) {
                continue;
            }

            $foundHeader = true;
            $columnMap = $this->buildColumnMap($rows[$headerRowIndex] ?? [], $headerMappings);

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

                    $rowData[$field] = trim((string) $this->stringifyImportValue($value));
                }

                $subjectName = trim((string) ($rowData['asignatura'] ?? ''));
                $careerValue = trim((string) ($rowData['carrera'] ?? ''));

                if ($subjectName === '' || $careerValue === '') {
                    $skipped++;
                    continue;
                }

                $careerId = $this->resolveCareerId($careerValue, $careerLookup);
                if ($careerId === null) {
                    $skipped++;
                    $errors[] = sprintf(
                        'Hoja "%s", fila %s: no se pudo identificar la carrera "%s".',
                        $sheet->getTitle(),
                        $rowIndex,
                        $careerValue
                    );
                    continue;
                }

                $subjectKey = $careerId . '|' . $this->normalizeImportText($subjectName);
                if ($subjectKey === $careerId . '|') {
                    $skipped++;
                    continue;
                }

                if (isset($existingSubjects[$subjectKey]) || isset($seenInFile[$subjectKey])) {
                    $skipped++;
                    continue;
                }

                Asignatura::create([
                    'nombre' => $subjectName,
                    'carrera_id' => $careerId,
                ]);

                $existingSubjects[$subjectKey] = true;
                $seenInFile[$subjectKey] = true;
                $created++;
            }
        }

        if (! $foundHeader) {
            throw ValidationException::withMessages([
                'archivo' => 'No se encontró una fila de encabezados válida con programa académico y asignatura.',
            ]);
        }

        $message = $created > 0
            ? "Importación completada: {$created} asignaturas creadas"
            : 'No se crearon asignaturas nuevas';

        if ($skipped > 0) {
            $message .= ", {$skipped} omitidas";
        }

        $message .= '.';

        return redirect()
            ->route('asignaturas.index')
            ->with('success', $message)
            ->with('warning', $errors !== [] ? implode(' | ', array_slice($errors, 0, 3)) : null);
    }

    private function detectHeaderRow(array $rows, array $headerMappings): ?int
    {
        foreach ($rows as $rowIndex => $row) {
            $matchedFields = [];

            foreach ($row as $value) {
                $field = $this->matchHeaderField($value, $headerMappings);
                if ($field !== null) {
                    $matchedFields[$field] = true;
                }
            }

            if (isset($matchedFields['carrera'], $matchedFields['asignatura'])) {
                return (int) $rowIndex;
            }
        }

        return null;
    }

    private function buildColumnMap(array $headerRow, array $headerMappings): array
    {
        $map = [];

        foreach ($headerRow as $column => $header) {
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

    private function buildExistingSubjectLookup(): array
    {
        $lookup = [];

        foreach (Asignatura::query()->get(['id', 'nombre', 'carrera_id']) as $subject) {
            $key = $subject->carrera_id . '|' . $this->normalizeImportText($subject->nombre);
            $lookup[$key] = true;
        }

        return $lookup;
    }

    private function resolveCareerId(string $value, array $careerLookup): ?int
    {
        $key = is_numeric($value) ? (string) (int) $value : $this->normalizeImportText($value);

        return $careerLookup[$key] ?? null;
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
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    private function careerAliases(): array
    {
        return [
            'ing sistemas' => 'INGENIERIA DE SISTEMAS',
            'ingenieria sistemas' => 'INGENIERIA DE SISTEMAS',
            'lic educacion infantil' => 'LICENCIATURA EN EDUCACION INFANTIL',
        ];
    }
}
