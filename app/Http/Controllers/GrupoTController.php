<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\GrupoT;
use App\Models\Tutor;
use App\Models\ReportPeriod;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;

class GrupoTController extends Controller
{
    /**
     * Crear un nuevo grupo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'        => 'required|string|max:255',
            'codigo'        => 'required|string|max:255',
            'docente'       => 'required|string|max:255',
            'carrera_id'    => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        // 🔥 Validar período activo Y vigente por fecha
        $today = Carbon::today();

        $period = ReportPeriod::where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->first();

        if (!$period) {
            return back()->withErrors([
                'periodo' => '❌ No existe un período activo y vigente para crear grupos.'
            ]);
        }

        // ✅ Validar duplicado por (codigo + carrera + asignatura + periodo)
        $exists = GrupoT::where('codigo', $request->codigo)
            ->where('carrera_id', $request->carrera_id)
            ->where('asignatura_id', $request->asignatura_id)
            ->where('period_id', $period->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'codigo' => '❌ Ya existe un grupo con este código para la misma carrera, asignatura y período.'
            ]);
        }

        GrupoT::create([
            'nombre'        => $request->nombre,
            'codigo'        => $request->codigo,
            'docente'       => $request->docente,
            'carrera_id'    => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
            'period_id'     => $period->id,
        ]);

        return back()->with('success', '✅ Grupo creado exitosamente.');
    }

    /**
     * Actualizar un grupo
     */
    public function update(Request $request, $id)
    {
        $grupo = GrupoT::findOrFail($id);

        $request->validate([
            'nombre'        => 'required|string|max:255',
            'codigo'        => 'required|string|max:255',
            'docente'       => 'required|string|max:255',
            'carrera_id'    => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        // 🔒 Bloquear edición si el período ya venció
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se puede editar un grupo de un período vencido.'
            ]);
        }

        // ✅ Validar duplicado por (codigo + carrera + asignatura + periodo) ignorando el mismo grupo
        $exists = GrupoT::where('codigo', $request->codigo)
            ->where('carrera_id', $request->carrera_id)
            ->where('asignatura_id', $request->asignatura_id)
            ->where('period_id', $grupo->period_id)
            ->where('id', '!=', $grupo->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'codigo' => '❌ Ya existe otro grupo con este código para la misma carrera, asignatura y período.'
            ]);
        }

        $grupo->update([
            'nombre'        => $request->nombre,
            'codigo'        => $request->codigo,
            'docente'       => $request->docente,
            'carrera_id'    => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
        ]);

        return back()->with('success', '✅ Grupo actualizado correctamente.');
    }

    /**
     * Asignar tutor a un grupo
     */
    public function asignarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);

        // 🔒 Validar que el período del grupo esté vigente
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se pueden asignar tutores en períodos vencidos.'
            ]);
        }

        $tutor = Tutor::findOrFail($request->tutor_id);

        // 🔥 Validar asignatura correspondiente
        if (
            !$tutor->asignaturas()
                ->where('asignatura_id', $grupo->asignatura_id)
                ->exists()
        ) {
            return back()->withErrors([
                'tutor' => '❌ El tutor no dicta esta asignatura.'
            ]);
        }

        // 🔥 Rol del tutor
        $rol = $grupo->tutores()->count() === 0 ? 'principal' : 'secundario';

        $grupo->tutores()->attach($tutor->id, [
            'period_id' => $grupo->period_id,
            'rol'       => $rol,
        ]);

        return back()->with('success', "✅ Tutor asignado correctamente como {$rol}.");
    }

    /**
     * Quitar tutor del grupo
     */
    public function quitarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);

        $grupo->tutores()->detach($request->tutor_id);

        return back()->with('success', '✅ Tutor eliminado correctamente.');
    }

    /**
     * Eliminar grupo
     */
    public function destroy($id)
    {
        $grupo = GrupoT::find($id);

        if (!$grupo) {
            return back()->withErrors([
                'grupo' => '❌ Grupo no encontrado.'
            ]);
        }

        // 🔒 Evitar eliminar grupos de períodos vencidos
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se puede eliminar un grupo de un período vencido.'
            ]);
        }

        $grupo->delete();

        return back()->with('success', '✅ Grupo eliminado correctamente.');
    }

    /**
     * Importar grupos desde Excel.
     */
    public function import(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $period = $this->resolveActivePeriod();
        $spreadsheet = IOFactory::load($request->file('archivo')->getPathname());

        $headerMappings = [
            'carrera' => ['programa academico', 'programa académico', 'programa', 'carrera'],
            'asignatura' => ['asignatura', 'materia', 'nombre asignatura'],
            'codigo' => ['semestre', 'grupo', 'codigo grupo', 'código grupo', 'codigo', 'código'],
            'docente' => ['docente', 'profesor', 'nombre docente'],
            'tutor' => ['tutor', 'tutores', 'monitor', 'monitores'],
        ];

        $careerLookup = $this->buildCareerLookup();
        $subjectLookup = $this->buildSubjectLookup();
        $tutorMatcher = $this->buildTutorMatcher();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $assignedTutors = 0;
        $errors = [];
        $foundHeader = false;
        $seenInFile = [];

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

                $careerValue = trim((string) ($rowData['carrera'] ?? ''));
                $subjectValue = trim((string) ($rowData['asignatura'] ?? ''));
                $groupCode = trim((string) ($rowData['codigo'] ?? ''));
                $teacher = trim((string) ($rowData['docente'] ?? ''));
                $tutorCell = trim((string) ($rowData['tutor'] ?? ''));

                if ($careerValue === '' || $subjectValue === '' || $groupCode === '' || $teacher === '') {
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

                $subject = $this->resolveSubject($subjectValue, $careerId, $subjectLookup);
                if ($subject === null) {
                    $skipped++;
                    $errors[] = sprintf(
                        'Hoja "%s", fila %s: la asignatura "%s" no existe en la carrera seleccionada. Importa primero las asignaturas.',
                        $sheet->getTitle(),
                        $rowIndex,
                        $subjectValue
                    );
                    continue;
                }

                $duplicateKey = implode('|', [
                    $period->id,
                    $careerId,
                    $subject->id,
                    $this->normalizeImportText($groupCode),
                ]);

                if (isset($seenInFile[$duplicateKey])) {
                    $skipped++;
                    continue;
                }

                $existingGroup = GrupoT::query()
                    ->where('period_id', $period->id)
                    ->where('carrera_id', $careerId)
                    ->where('asignatura_id', $subject->id)
                    ->where('codigo', $groupCode)
                    ->first();

                $payload = [
                    'nombre' => $subject->nombre,
                    'codigo' => $groupCode,
                    'docente' => $teacher,
                    'carrera_id' => $careerId,
                    'asignatura_id' => $subject->id,
                    'period_id' => $period->id,
                ];

                if ($existingGroup) {
                    if (
                        $existingGroup->nombre !== $payload['nombre'] ||
                        $existingGroup->docente !== $payload['docente']
                    ) {
                        $existingGroup->update([
                            'nombre' => $payload['nombre'],
                            'docente' => $payload['docente'],
                        ]);
                        $updated++;
                    } else {
                        $skipped++;
                    }

                    $seenInFile[$duplicateKey] = true;

                    $assignedTutors += $this->assignImportedTutors(
                        $existingGroup->fresh('tutores'),
                        $tutorCell,
                        $careerId,
                        $subject->id,
                        $tutorMatcher,
                        $errors,
                        $sheet->getTitle(),
                        (int) $rowIndex
                    );
                    continue;
                }

                $group = GrupoT::create($payload);
                $seenInFile[$duplicateKey] = true;
                $created++;
                $assignedTutors += $this->assignImportedTutors(
                    $group,
                    $tutorCell,
                    $careerId,
                    $subject->id,
                    $tutorMatcher,
                    $errors,
                    $sheet->getTitle(),
                    (int) $rowIndex
                );
            }
        }

        if (! $foundHeader) {
            throw ValidationException::withMessages([
                'archivo' => 'No se encontró una fila de encabezados válida con programa, asignatura, semestre y docente.',
            ]);
        }

        $message = "Importación completada: {$created} grupos creados";
        if ($updated > 0) {
            $message .= ", {$updated} actualizados";
        }
        if ($assignedTutors > 0) {
            $message .= ", {$assignedTutors} tutores asignados";
        }
        if ($skipped > 0) {
            $message .= ", {$skipped} omitidos";
        }
        $message .= '.';

        return back()
            ->with('success', $message)
            ->with('warning', $errors !== [] ? implode(' | ', array_slice($errors, 0, 3)) : null);
    }

    private function resolveActivePeriod(): ReportPeriod
    {
        $today = Carbon::today();

        $period = ReportPeriod::query()
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->first();

        if (! $period) {
            throw ValidationException::withMessages([
                'archivo' => 'No existe un período activo y vigente para importar grupos.',
            ]);
        }

        return $period;
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

            if (
                isset($matchedFields['carrera'], $matchedFields['asignatura'], $matchedFields['codigo']) &&
                isset($matchedFields['docente'])
            ) {
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
            $lookup[$careerKey][(string) $subject->id] = $subject;
            $lookup[$careerKey][$this->normalizeImportText($subject->nombre)] = $subject;

            if ($hasCodeColumn && ! empty($subject->codigo)) {
                $lookup[$careerKey][$this->normalizeImportText($subject->codigo)] = $subject;
            }
        }

        return $lookup;
    }

    private function resolveCareerId(string $value, array $careerLookup): ?int
    {
        $key = is_numeric($value) ? (string) (int) $value : $this->normalizeImportText($value);

        return $careerLookup[$key] ?? null;
    }

    private function resolveSubject(string $value, int $careerId, array $subjectLookup): ?Asignatura
    {
        $careerSubjects = $subjectLookup[(string) $careerId] ?? [];
        $key = is_numeric($value) ? (string) (int) $value : $this->normalizeImportText($value);

        $subject = $careerSubjects[$key] ?? null;

        return $subject instanceof Asignatura ? $subject : null;
    }

    private function buildTutorMatcher(): array
    {
        $tutors = [];

        foreach (Tutor::query()->with('asignaturas:id')->get(['id', 'nombre', 'apellido', 'carrera_id']) as $tutor) {
            $fullName = trim($tutor->nombre . ' ' . $tutor->apellido);

            $tutors[] = [
                'id' => $tutor->id,
                'name' => $fullName,
                'norm' => $this->normalizeImportText($fullName),
                'tokens' => $this->personTokens($fullName),
                'carrera_id' => $tutor->carrera_id,
                'subject_ids' => $tutor->asignaturas->pluck('id')->map(fn ($id) => (int) $id)->all(),
            ];
        }

        return $tutors;
    }

    private function assignImportedTutors(
        GrupoT $group,
        string $tutorCell,
        int $careerId,
        int $subjectId,
        array $tutorMatcher,
        array &$errors,
        string $sheetTitle,
        int $rowIndex
    ): int {
        $rawNames = $this->splitTutorImportCell($tutorCell);
        if ($rawNames === []) {
            return 0;
        }

        $assigned = 0;

        foreach ($rawNames as $rawName) {
            $match = $this->matchImportedTutorName($rawName, $careerId, $subjectId, $tutorMatcher);
            if ($match === null) {
                $errors[] = sprintf(
                    'Hoja "%s", fila %s: no se pudo asignar el tutor "%s" por nombre.',
                    $sheetTitle,
                    $rowIndex,
                    $rawName
                );
                continue;
            }

            $alreadyAttached = $group->tutores()
                ->wherePivot('period_id', $group->period_id)
                ->where('tutors.id', $match['id'])
                ->exists();

            if ($alreadyAttached) {
                continue;
            }

            $role = $group->tutores()
                ->wherePivot('period_id', $group->period_id)
                ->exists()
                ? 'secundario'
                : 'principal';

            $group->tutores()->attach($match['id'], [
                'period_id' => $group->period_id,
                'rol' => $role,
            ]);

            $assigned++;
        }

        return $assigned;
    }

    private function splitTutorImportCell(string $value): array
    {
        $value = trim($value);
        if ($value === '') {
            return [];
        }

        $value = preg_replace('/\s+y\s+/iu', '|', $value);
        $value = str_replace([';', '/', ','], '|', $value);
        $value = str_replace('-', '|', $value);

        return array_values(array_unique(array_filter(array_map(
            fn ($item) => trim((string) preg_replace('/\s+/', ' ', $item)),
            explode('|', $value)
        ))));
    }

    private function matchImportedTutorName(
        string $rawName,
        int $careerId,
        int $subjectId,
        array $tutors
    ): ?array {
        $normalizedName = $this->normalizeImportText($rawName);
        $tokens = $this->personTokens($rawName);

        if ($normalizedName === '' || $tokens === []) {
            return null;
        }

        $scored = [];

        foreach ($tutors as $tutor) {
            $candidateTokens = $tutor['tokens'];
            if ($candidateTokens === []) {
                continue;
            }

            $tokenScores = [];
            foreach ($tokens as $token) {
                $best = 0.0;
                foreach ($candidateTokens as $candidateToken) {
                    $best = max($best, $this->tokenSimilarity($token, $candidateToken));
                }
                $tokenScores[] = $best;
            }

            $avgScore = array_sum($tokenScores) / count($tokenScores);
            $strongMatches = count(array_filter($tokenScores, fn ($score) => $score >= 0.84));
            $fullScore = $this->tokenSimilarity($normalizedName, $tutor['norm']);

            $score = ($avgScore * 0.75) + ($fullScore * 0.25);
            if ($strongMatches >= 2) {
                $score += 0.08;
            }
            if (in_array($subjectId, $tutor['subject_ids'], true)) {
                $score += 0.12;
            }
            if ((int) $tutor['carrera_id'] === $careerId) {
                $score += 0.04;
            }

            $scored[] = [
                'tutor' => $tutor,
                'score' => $score,
                'strong_matches' => $strongMatches,
                'full_score' => $fullScore,
            ];
        }

        usort($scored, fn ($left, $right) => $right['score'] <=> $left['score']);

        if ($scored === []) {
            return null;
        }

        $best = $scored[0];
        $second = $scored[1] ?? null;

        if ($best['score'] < 0.84) {
            return null;
        }

        if ($best['strong_matches'] < 2 && $best['full_score'] < 0.90) {
            return null;
        }

        if ($second && ($best['score'] - $second['score']) < 0.08) {
            return null;
        }

        return $best['tutor'];
    }

    private function personTokens(string $value): array
    {
        $normalized = $this->normalizeImportText($value);
        if ($normalized === '') {
            return [];
        }

        return array_values(array_unique(array_filter(
            explode(' ', $normalized),
            fn ($token) => strlen($token) > 1
        )));
    }

    private function tokenSimilarity(string $left, string $right): float
    {
        if ($left === $right) {
            return 1.0;
        }

        $length = max(strlen($left), strlen($right));
        if ($length === 0) {
            return 0.0;
        }

        $distance = levenshtein($left, $right);
        $score = 1 - ($distance / $length);

        if (metaphone($left) !== '' && metaphone($left) === metaphone($right)) {
            $score = max($score, 0.88);
        }

        return max(0.0, min(1.0, $score));
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

    private function careerAliases(): array
    {
        return [
            'ing sistemas' => 'INGENIERIA DE SISTEMAS',
            'ingenieria sistemas' => 'INGENIERIA DE SISTEMAS',
            'lic educacion infantil' => 'LICENCIATURA EN EDUCACION INFANTIL',
        ];
    }
}
