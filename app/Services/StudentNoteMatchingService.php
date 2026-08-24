<?php

namespace App\Services;

use Illuminate\Support\Str;

class StudentNoteMatchingService
{
    public function buildNoteMaps(iterable $rows): array
    {
        $byStudentProgramMateria = [];
        $byStudentMateria = [];
        $byStudentProgram = [];
        $byStudent = [];

        foreach ($rows as $row) {
            $studentKeys = $this->buildStudentMatchKeys(
                $this->field($row, 'identificacion'),
                $this->field($row, 'codigo_key', $this->field($row, 'codigo')),
                $this->field($row, 'nombres_key', $this->field($row, 'nombres')),
                $this->field($row, 'apellidos_key', $this->field($row, 'apellidos'))
            );
            $program = $this->normalizeComparableText(
                $this->field($row, 'programa_key', $this->field($row, 'programa', $this->field($row, 'ide_programa')))
            );
            $subjectVariants = $this->subjectKeyVariants(
                $this->field($row, 'materia_key', $this->field($row, 'materia'))
            );

            if ($studentKeys === [] || $subjectVariants === []) {
                continue;
            }

            foreach ($studentKeys as $studentKey) {
                $byStudent[$studentKey] = array_merge($byStudent[$studentKey] ?? [], [$row]);

                if ($program !== '') {
                    $byStudentProgram[$studentKey][$program] = array_merge(
                        $byStudentProgram[$studentKey][$program] ?? [],
                        [$row]
                    );
                }

                foreach ($subjectVariants as $variant) {
                    $byStudentMateria[$studentKey][$variant][] = $row;

                    if ($program !== '') {
                        $byStudentProgramMateria[$studentKey][$program][$variant][] = $row;
                    }
                }
            }
        }

        return [
            'by_student_program_materia' => $byStudentProgramMateria,
            'by_student_materia' => $byStudentMateria,
            'by_student_program' => $byStudentProgram,
            'by_student' => $byStudent,
        ];
    }

    public function resolveBestMatches(array $detailRow, array $noteMaps, string $groupRaw = ''): array
    {
        $studentKeys = $this->buildStudentMatchKeys(
            $detailRow['identificacion'] ?? '',
            $detailRow['codigo'] ?? '',
            $detailRow['nombre'] ?? '',
            $detailRow['apellido'] ?? ''
        );
        $program = $this->normalizeComparableText($detailRow['programa'] ?? '');
        $subjectVariants = $this->subjectKeyVariants($detailRow['materia'] ?? '');

        $candidateRows = [];

        if ($studentKeys !== [] && $program !== '' && $subjectVariants !== []) {
            foreach ($studentKeys as $studentKey) {
                foreach ($subjectVariants as $variant) {
                    $candidateRows = array_merge(
                        $candidateRows,
                        $noteMaps['by_student_program_materia'][$studentKey][$program][$variant] ?? []
                    );
                }
            }
        }

        if ($candidateRows === [] && $studentKeys !== [] && $subjectVariants !== []) {
            foreach ($studentKeys as $studentKey) {
                foreach ($subjectVariants as $variant) {
                    $candidateRows = array_merge(
                        $candidateRows,
                        $noteMaps['by_student_materia'][$studentKey][$variant] ?? []
                    );
                }
            }
        }

        if ($candidateRows === [] && $studentKeys !== [] && $program !== '') {
            $fallbackRows = [];
            foreach ($studentKeys as $studentKey) {
                $fallbackRows = array_merge(
                    $fallbackRows,
                    $noteMaps['by_student_program'][$studentKey][$program] ?? []
                );
            }

            $candidateRows = $this->pickBestRowsBySubject($fallbackRows, (string) ($detailRow['materia'] ?? ''), $groupRaw);
        }

        if ($candidateRows === [] && $studentKeys !== []) {
            $fallbackRows = [];
            foreach ($studentKeys as $studentKey) {
                $fallbackRows = array_merge(
                    $fallbackRows,
                    $noteMaps['by_student'][$studentKey] ?? []
                );
            }

            $candidateRows = $this->pickBestRowsBySubject($fallbackRows, (string) ($detailRow['materia'] ?? ''), $groupRaw);
        }

        if ($candidateRows !== []) {
            $filtered = $this->filterRowsByGroup($candidateRows, $groupRaw);
            if ($filtered !== []) {
                $candidateRows = $filtered;
            }
        }

        return array_values($this->uniqueRows($candidateRows));
    }

    public function buildStudentMatchKeys(
        mixed $identificacion,
        mixed $codigo,
        mixed $nombres,
        mixed $apellidos
    ): array {
        $keys = [];

        foreach ($this->identifierLooseVariants($identificacion) as $variant) {
            $keys[] = 'ID:' . $variant;
        }

        foreach ($this->identifierLooseVariants($codigo) as $variant) {
            $keys[] = 'COD:' . $variant;
        }

        $nameNormal = $this->normalizeComparableText(trim((string) $nombres . ' ' . (string) $apellidos));
        if ($nameNormal !== '') {
            $keys[] = 'NAME:' . $nameNormal;

            $tokens = preg_split('/\s+/', $nameNormal) ?: [];
            if (count($tokens) >= 2) {
                $keys[] = 'NAME:' . $tokens[0] . ' ' . $tokens[count($tokens) - 1];
            }
        }

        $nameInverse = $this->normalizeComparableText(trim((string) $apellidos . ' ' . (string) $nombres));
        if ($nameInverse !== '' && $nameInverse !== $nameNormal) {
            $keys[] = 'NAME:' . $nameInverse;
        }

        return array_values(array_unique(array_filter($keys, fn ($item) => is_string($item) && trim($item) !== '')));
    }

    public function subjectKeyVariants(mixed $value): array
    {
        $normalized = $this->normalizeSubjectComparableText($value);
        if ($normalized === '') {
            return [];
        }

        $variants = [$normalized];

        $withoutStopwords = $this->stripSubjectStopwords($normalized);
        if ($withoutStopwords !== '' && $withoutStopwords !== $normalized) {
            $variants[] = $withoutStopwords;
        }

        $tokens = preg_split('/\s+/', $normalized) ?: [];
        if ($tokens !== []) {
            $sorted = $tokens;
            sort($sorted);
            $sortedVariant = trim(implode(' ', $sorted));
            if ($sortedVariant !== '' && $sortedVariant !== $normalized) {
                $variants[] = $sortedVariant;
            }

            $singularTokens = array_map(fn ($token) => $this->singularizeSubjectToken((string) $token), $tokens);
            $singular = trim(implode(' ', $singularTokens));
            if ($singular !== '' && $singular !== $normalized) {
                $variants[] = $singular;
                $singularWithoutStopwords = $this->stripSubjectStopwords($singular);
                if ($singularWithoutStopwords !== '' && $singularWithoutStopwords !== $singular) {
                    $variants[] = $singularWithoutStopwords;
                }
            }
        }

        return array_values(array_unique(array_filter($variants)));
    }

    public function normalizeComparableText(mixed $value): string
    {
        return Str::of((string) $value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    public function normalizeSubjectComparableText(mixed $value): string
    {
        $text = $this->normalizeComparableText($value);
        if ($text === '') {
            return '';
        }

        $replacements = [
            '/\bforeign language\b/' => 'ingles',
            '/\benglish\b/' => 'ingles',
            '/\blinear algebra\b/' => 'algebra lineal',
            '/\bcalculus\b/' => 'calculo',
            '/\bdifferential equations\b/' => 'ecuaciones diferenciales',
            '/\bdifferential equation\b/' => 'ecuacion diferencial',
            '/\bdata bases\b/' => 'bases de datos',
            '/\bdata base\b/' => 'base de datos',
            '/\bdatabases\b/' => 'bases de datos',
            '/\bdatabase\b/' => 'base de datos',
            '/\bprogramming\b/' => 'programacion',
            '/\balgorithms\b/' => 'algoritmos',
            '/\balgorithm\b/' => 'algoritmo',
            '/\bsoftware engineering\b/' => 'ingenieria de software',
            '/\baccounting\b/' => 'contabilidad',
        ];

        foreach ($replacements as $pattern => $replacement) {
            $text = preg_replace($pattern, $replacement, $text) ?? $text;
        }

        $romanMap = [
            '/\biii\b/' => '3',
            '/\bii\b/' => '2',
            '/\biv\b/' => '4',
            '/\bvi\b/' => '6',
            '/\bv\b/' => '5',
            '/\bi\b/' => '1',
        ];

        foreach ($romanMap as $pattern => $replacement) {
            $text = preg_replace($pattern, $replacement, $text) ?? $text;
        }

        return trim(preg_replace('/\s+/', ' ', $text) ?? $text);
    }

    public function subjectSimilarity(string $left, string $right): float
    {
        $left = $this->normalizeSubjectComparableText($left);
        $right = $this->normalizeSubjectComparableText($right);

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

    public function groupCodeVariants(string $code): array
    {
        $norm = preg_replace('/[^0-9A-Z]/', '', trim(mb_strtoupper($code)));
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

    private function field(mixed $row, string $key, mixed $default = ''): mixed
    {
        if (is_array($row)) {
            return $row[$key] ?? $default;
        }

        if (is_object($row)) {
            return $row->{$key} ?? $default;
        }

        return $default;
    }

    private function identifierLooseVariants(mixed $value): array
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return [];
        }

        $variants = [
            Str::of($raw)
                ->ascii()
                ->upper()
                ->replaceMatches('/\s+/', '')
                ->trim()
                ->value(),
        ];

        $compactAlnum = preg_replace('/[^A-Z0-9]+/', '', (string) $variants[0]) ?? '';
        if ($compactAlnum !== '') {
            $variants[] = $compactAlnum;
        }

        if ($compactAlnum !== '' && preg_match('/^\d+$/', $compactAlnum) === 1) {
            $digitsNoLeading = ltrim($compactAlnum, '0');
            if ($digitsNoLeading !== '') {
                $variants[] = $digitsNoLeading;
            }
        }

        return array_values(array_unique(array_filter($variants)));
    }

    private function stripSubjectStopwords(string $value): string
    {
        $tokens = preg_split('/\s+/', $value) ?: [];
        $stopwords = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'the', 'of', 'and', 'to'];
        $filtered = array_values(array_filter($tokens, fn ($token) => ! in_array($token, $stopwords, true)));

        return trim(implode(' ', $filtered));
    }

    private function singularizeSubjectToken(string $token): string
    {
        $token = trim($token);
        if ($token === '' || strlen($token) <= 4) {
            return $token;
        }

        if (in_array($token, ['ingles', 'analisis', 'tesis', 'crisis'], true)) {
            return $token;
        }

        if (str_ends_with($token, 'ciones')) {
            return substr($token, 0, -2);
        }

        if (str_ends_with($token, 'ses')) {
            return substr($token, 0, -1);
        }

        if (str_ends_with($token, 's')) {
            return substr($token, 0, -1);
        }

        return $token;
    }

    private function pickBestRowsBySubject(array $rows, string $targetSubject, string $groupRaw = ''): array
    {
        $rows = $this->uniqueRows($rows);
        if ($rows === []) {
            return [];
        }

        $scored = [];
        foreach ($rows as $row) {
            $score = $this->subjectSimilarity(
                $targetSubject,
                (string) $this->field($row, 'materia_key', $this->field($row, 'materia'))
            );

            if ($score <= 0) {
                continue;
            }

            $scored[] = [
                'row' => $row,
                'score' => $score,
            ];
        }

        if ($scored === []) {
            return [];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
        $best = $scored[0]['score'];
        if ($best < 0.72) {
            return [];
        }

        $rows = array_values(array_map(
            fn ($item) => $item['row'],
            array_filter($scored, fn ($item) => (($best - $item['score']) <= 0.03))
        ));

        $filtered = $this->filterRowsByGroup($rows, $groupRaw);
        return $filtered !== [] ? $filtered : $rows;
    }

    private function filterRowsByGroup(array $rows, string $groupRaw): array
    {
        $groupVariants = $this->groupCodeVariants($groupRaw);
        if ($groupVariants === [] || $rows === []) {
            return [];
        }

        $filtered = array_values(array_filter($rows, function ($row) use ($groupVariants) {
            $noteGroupVariants = $this->groupCodeVariants((string) $this->field($row, 'grupo'));
            return $this->codeVariantsIntersect($groupVariants, $noteGroupVariants);
        }));

        return count($filtered) === 1 ? $filtered : [];
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

    private function uniqueRows(array $rows): array
    {
        $unique = [];
        foreach ($rows as $row) {
            $key = trim((string) $this->field($row, 'id'));
            if ($key === '') {
                $key = md5(json_encode($row));
            }
            $unique[$key] = $row;
        }

        return array_values($unique);
    }
}
