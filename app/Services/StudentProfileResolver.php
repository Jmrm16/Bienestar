<?php

namespace App\Services;

use App\Models\Estudiante;
use App\Models\Nota;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class StudentProfileResolver
{
    private array $cache = [];
    private array $codeCache = [];
    private array $nameCache = [];

    public function resolveIdentityForPeriod(
        int $periodId,
        mixed $identificacion,
        mixed $codigo = '',
        mixed $nombres = '',
        mixed $apellidos = ''
    ): array
    {
        $id = $this->normalizeId($identificacion);
        $idProfile = $this->emptyProfile();
        if ($id !== '') {
            $idProfile = $this->resolveForPeriod($periodId, $id);
        }

        $code = $this->normalizeCode($codigo);
        $codeProfile = $this->emptyProfile();
        if ($code !== '') {
            $this->codeCache[$periodId] ??= [];
            if (! array_key_exists($code, $this->codeCache[$periodId])) {
                $this->hydrateCodeCache($periodId, [$code]);
            }

            $codeProfile = $this->codeCache[$periodId][$code] ?? $this->emptyProfile();
        }

        $nameProfile = $this->resolveByNameForPeriod($periodId, $nombres, $apellidos);

        if ($this->sameResolvedStudent($idProfile, $codeProfile)) {
            $idProfile = $this->mergeProfiles($idProfile, $codeProfile);
        }

        if ($this->sameResolvedStudent($idProfile, $nameProfile)) {
            $idProfile = $this->mergeProfiles($idProfile, $nameProfile);
        }

        if ($this->sameResolvedStudent($codeProfile, $nameProfile)) {
            $codeAndName = $this->mergeProfiles($codeProfile, $nameProfile);

            if (! $this->sameResolvedStudent($idProfile, $codeAndName)) {
                return $codeAndName;
            }

            $idProfile = $this->mergeProfiles($idProfile, $codeAndName);
        }

        if ($this->hasResolvedIdentity($idProfile)) {
            return $idProfile;
        }

        if ($this->hasResolvedIdentity($codeProfile)) {
            return $codeProfile;
        }

        if ($this->hasResolvedIdentity($nameProfile)) {
            return $nameProfile;
        }

        return $this->emptyProfile();
    }

    public function resolveForPeriod(int $periodId, mixed $identificacion): array
    {
        $id = $this->normalizeId($identificacion);
        if ($id === '') {
            return $this->emptyProfile();
        }

        return $this->resolveManyForPeriod($periodId, [$id])[$id] ?? $this->emptyProfile();
    }

    public function resolveManyForPeriod(int $periodId, array $identificaciones): array
    {
        $ids = array_values(array_unique(array_filter(
            array_map(fn ($value) => $this->normalizeId($value), $identificaciones)
        )));

        if ($ids === []) {
            return [];
        }

        $this->cache[$periodId] ??= [];
        $missing = array_values(array_filter($ids, fn ($id) => ! array_key_exists($id, $this->cache[$periodId])));

        if ($missing !== []) {
            $this->hydrateCache($periodId, $missing);
        }

        $resolved = [];
        foreach ($ids as $id) {
            $resolved[$id] = $this->cache[$periodId][$id] ?? $this->emptyProfile();
        }

        return $resolved;
    }

    private function hydrateCache(int $periodId, array $ids): void
    {
        $noteProfiles = $this->fetchBestNotes($periodId, $ids);
        $studentProfiles = $this->fetchBestStudents($ids, $periodId);
        $historicStudentProfiles = $this->fetchBestStudents($ids, null);

        foreach ($ids as $id) {
            $note = $noteProfiles[$id] ?? [];
            $student = $studentProfiles[$id] ?? $historicStudentProfiles[$id] ?? [];

            $this->cache[$periodId][$id] = [
                'identificacion' => $id,
                'nombres' => $this->preferText($note['nombres'] ?? '', $student['nombres'] ?? ''),
                'apellidos' => $this->preferText($note['apellidos'] ?? '', $student['apellidos'] ?? ''),
                'codigo' => $this->preferText($note['codigo'] ?? '', ''),
                'programa' => $this->preferText($note['programa'] ?? '', $student['programa'] ?? ''),
                'sexo' => $this->preferSexo($student['sexo'] ?? ''),
                'grupo_priorizado' => $this->preferText($student['grupo_priorizado'] ?? '', ''),
            ];
        }
    }

    private function fetchBestNotes(int $periodId, array $ids): array
    {
        $query = Nota::query()->where('period_id', $periodId);
        if ($ids !== []) {
            $query = $this->applyIdentificacionFilter($query, $ids);
        }

        $rows = $query
            ->get(['id', 'identificacion', 'codigo', 'nombres', 'apellidos', 'programa', 'updated_at']);

        $profiles = [];

        foreach ($rows as $row) {
            $id = $this->normalizeId($row->identificacion);
            if ($id === '') {
                continue;
            }

            $score = $this->filledScore([
                $row->codigo,
                $row->nombres,
                $row->apellidos,
                $row->programa,
            ]);

            if (! isset($profiles[$id]) || $score > $profiles[$id]['score'] || (
                $score === $profiles[$id]['score']
                && (string) $row->updated_at > (string) ($profiles[$id]['updated_at'] ?? '')
            )) {
                $profiles[$id] = [
                    'codigo' => trim((string) ($row->codigo ?? '')),
                    'nombres' => trim((string) ($row->nombres ?? '')),
                    'apellidos' => trim((string) ($row->apellidos ?? '')),
                    'programa' => trim((string) ($row->programa ?? '')),
                    'score' => $score,
                    'updated_at' => (string) ($row->updated_at ?? ''),
                ];
            }
        }

        return $profiles;
    }

    private function hydrateCodeCache(int $periodId, array $codes): void
    {
        $rows = $this->applyCodeFilter(
            Nota::query()->where('period_id', $periodId),
            $codes
        )
            ->get(['id', 'identificacion', 'codigo', 'nombres', 'apellidos', 'programa', 'updated_at']);

        foreach ($codes as $code) {
            $this->codeCache[$periodId][$code] = $this->emptyProfile();
        }

        $profiles = [];
        foreach ($rows as $row) {
            $code = $this->normalizeCode($row->codigo);
            if ($code === '') {
                continue;
            }

            $score = $this->filledScore([
                $row->identificacion,
                $row->codigo,
                $row->nombres,
                $row->apellidos,
                $row->programa,
            ]);

            if (! isset($profiles[$code]) || $score > $profiles[$code]['score'] || (
                $score === $profiles[$code]['score']
                && (string) $row->updated_at > (string) ($profiles[$code]['updated_at'] ?? '')
            )) {
                $profiles[$code] = [
                    'identificacion' => $this->normalizeId($row->identificacion),
                    'codigo' => trim((string) ($row->codigo ?? '')),
                    'nombres' => trim((string) ($row->nombres ?? '')),
                    'apellidos' => trim((string) ($row->apellidos ?? '')),
                    'programa' => trim((string) ($row->programa ?? '')),
                    'sexo' => '',
                    'grupo_priorizado' => '',
                    'score' => $score,
                    'updated_at' => (string) ($row->updated_at ?? ''),
                ];
            }
        }

        foreach ($profiles as $code => $profile) {
            $this->codeCache[$periodId][$code] = $profile;
        }
    }

    private function fetchBestStudents(array $ids, ?int $periodId): array
    {
        $query = Estudiante::query();
        if ($periodId !== null) {
            $query->where('period_id', $periodId);
        }

        if ($ids !== []) {
            $query = $this->applyIdentificacionFilter($query, $ids);
        }

        $rows = $query
            ->get([
                'id',
                'period_id',
                'identificacion',
                'nombres',
                'apellidos',
                'sexo',
                'grupos_prioritarios',
                'programa_academico',
                'updated_at',
            ]);

        $profiles = [];

        foreach ($rows as $row) {
            $id = $this->normalizeId($row->identificacion);
            if ($id === '') {
                continue;
            }

            $score = $this->filledScore([
                $row->nombres,
                $row->apellidos,
                $row->sexo,
                $row->grupos_prioritarios,
                $row->programa_academico,
            ]);

            if (! isset($profiles[$id]) || $score > $profiles[$id]['score'] || (
                $score === $profiles[$id]['score']
                && (
                    (int) $row->period_id > (int) ($profiles[$id]['period_id'] ?? 0)
                    || (
                        (int) $row->period_id === (int) ($profiles[$id]['period_id'] ?? 0)
                        && (string) $row->updated_at > (string) ($profiles[$id]['updated_at'] ?? '')
                    )
                )
            )) {
                $profiles[$id] = [
                    'nombres' => trim((string) ($row->nombres ?? '')),
                    'apellidos' => trim((string) ($row->apellidos ?? '')),
                    'programa' => trim((string) ($row->programa_academico ?? '')),
                    'sexo' => $this->preferSexo((string) ($row->sexo ?? '')),
                    'grupo_priorizado' => trim((string) ($row->grupos_prioritarios ?? '')),
                    'score' => $score,
                    'period_id' => (int) ($row->period_id ?? 0),
                    'updated_at' => (string) ($row->updated_at ?? ''),
                ];
            }
        }

        return $profiles;
    }

    private function resolveByNameForPeriod(int $periodId, mixed $nombres, mixed $apellidos): array
    {
        $fullName = $this->normalizeName(trim((string) $nombres . ' ' . (string) $apellidos));
        $namesOnly = $this->normalizeName($nombres);
        $lastNamesOnly = $this->normalizeName($apellidos);

        if ($fullName === '' && $namesOnly === '' && $lastNamesOnly === '') {
            return $this->emptyProfile();
        }

        if (! isset($this->nameCache[$periodId])) {
            $this->hydrateNameCache($periodId);
        }

        if ($fullName !== '') {
            $profile = $this->nameCache[$periodId]['full'][$fullName] ?? $this->emptyProfile();
            if ($this->filledScore($profile) > 0) {
                return $profile;
            }
        }

        if ($namesOnly !== '') {
            $profile = $this->nameCache[$periodId]['names'][$namesOnly] ?? $this->emptyProfile();
            if ($this->filledScore($profile) > 0) {
                return $profile;
            }
        }

        if ($lastNamesOnly !== '') {
            $profile = $this->nameCache[$periodId]['last_names'][$lastNamesOnly] ?? $this->emptyProfile();
            if ($this->filledScore($profile) > 0) {
                return $profile;
            }
        }

        return $this->emptyProfile();
    }

    private function hydrateNameCache(int $periodId): void
    {
        $noteProfiles = $this->fetchBestNotes($periodId, []);
        $studentProfiles = $this->fetchBestStudents([], $periodId);

        $profilesById = [];
        foreach (array_unique(array_merge(array_keys($noteProfiles), array_keys($studentProfiles))) as $id) {
            $note = $noteProfiles[$id] ?? [];
            $student = $studentProfiles[$id] ?? [];

            $profile = [
                'identificacion' => $id,
                'nombres' => $this->preferText($note['nombres'] ?? '', $student['nombres'] ?? ''),
                'apellidos' => $this->preferText($note['apellidos'] ?? '', $student['apellidos'] ?? ''),
                'codigo' => $this->preferText($note['codigo'] ?? '', ''),
                'programa' => $this->preferText($note['programa'] ?? '', $student['programa'] ?? ''),
                'sexo' => $this->preferSexo($student['sexo'] ?? ''),
                'grupo_priorizado' => $this->preferText($student['grupo_priorizado'] ?? '', ''),
            ];

            if ($this->filledScore($profile) > 0) {
                $profilesById[$id] = $profile;
            }
        }

        $full = [];
        $names = [];
        $lastNames = [];

        foreach ($profilesById as $profile) {
            $fullName = $this->normalizeName(trim(($profile['nombres'] ?? '') . ' ' . ($profile['apellidos'] ?? '')));
            $namesOnly = $this->normalizeName($profile['nombres'] ?? '');
            $lastNamesOnly = $this->normalizeName($profile['apellidos'] ?? '');

            $this->pushUniqueProfileCandidate($full, $fullName, $profile);
            $this->pushUniqueProfileCandidate($names, $namesOnly, $profile);
            $this->pushUniqueProfileCandidate($lastNames, $lastNamesOnly, $profile);
        }

        $this->nameCache[$periodId] = [
            'full' => $this->finalizeUniqueProfileIndex($full),
            'names' => $this->finalizeUniqueProfileIndex($names),
            'last_names' => $this->finalizeUniqueProfileIndex($lastNames),
        ];
    }

    private function pushUniqueProfileCandidate(array &$bucket, string $key, array $profile): void
    {
        if ($key === '' || ($profile['identificacion'] ?? '') === '') {
            return;
        }

        $bucket[$key] ??= [];
        $bucket[$key][$profile['identificacion']] = $profile;
    }

    private function finalizeUniqueProfileIndex(array $bucket): array
    {
        $resolved = [];

        foreach ($bucket as $key => $profiles) {
            if (count($profiles) === 1) {
                $resolved[$key] = array_values($profiles)[0];
            }
        }

        return $resolved;
    }

    private function hasResolvedIdentity(array $profile): bool
    {
        return trim((string) ($profile['identificacion'] ?? '')) !== '';
    }

    private function sameResolvedStudent(array $left, array $right): bool
    {
        if (! $this->hasResolvedIdentity($left) || ! $this->hasResolvedIdentity($right)) {
            return false;
        }

        return trim((string) ($left['identificacion'] ?? '')) === trim((string) ($right['identificacion'] ?? ''));
    }

    private function mergeProfiles(array $primary, array $secondary): array
    {
        return [
            'identificacion' => $this->preferText($primary['identificacion'] ?? '', $secondary['identificacion'] ?? ''),
            'nombres' => $this->preferText($primary['nombres'] ?? '', $secondary['nombres'] ?? ''),
            'apellidos' => $this->preferText($primary['apellidos'] ?? '', $secondary['apellidos'] ?? ''),
            'codigo' => $this->preferText($primary['codigo'] ?? '', $secondary['codigo'] ?? ''),
            'programa' => $this->preferText($primary['programa'] ?? '', $secondary['programa'] ?? ''),
            'sexo' => $this->preferSexo($this->preferText($primary['sexo'] ?? '', $secondary['sexo'] ?? '')),
            'grupo_priorizado' => $this->preferText($primary['grupo_priorizado'] ?? '', $secondary['grupo_priorizado'] ?? ''),
        ];
    }

    private function applyIdentificacionFilter(Builder $query, array $ids): Builder
    {
        return $query->where(function (Builder $inner) use ($ids) {
            foreach ($ids as $id) {
                $inner->orWhereRaw("REPLACE(TRIM(identificacion), ' ', '') = ?", [$id]);
            }
        });
    }

    private function applyCodeFilter(Builder $query, array $codes): Builder
    {
        return $query->where(function (Builder $inner) use ($codes) {
            foreach ($codes as $code) {
                $inner->orWhereRaw("REPLACE(TRIM(COALESCE(codigo, '')), ' ', '') = ?", [$code]);
            }
        });
    }

    private function filledScore(array $values): int
    {
        return collect($values)
            ->filter(fn ($value) => trim((string) ($value ?? '')) !== '')
            ->count();
    }

    private function emptyProfile(): array
    {
        return [
            'identificacion' => '',
            'nombres' => '',
            'apellidos' => '',
            'codigo' => '',
            'programa' => '',
            'sexo' => '',
            'grupo_priorizado' => '',
        ];
    }

    private function normalizeId(mixed $value): string
    {
        return preg_replace('/[^0-9A-Z]/', '', trim(mb_strtoupper((string) ($value ?? ''))));
    }

    private function normalizeCode(mixed $value): string
    {
        return preg_replace('/[^0-9A-Z]/', '', trim(mb_strtoupper((string) ($value ?? ''))));
    }

    private function normalizeName(mixed $value): string
    {
        return Str::of((string) ($value ?? ''))
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    private function preferText(mixed $primary, mixed $fallback): string
    {
        $primaryText = trim((string) ($primary ?? ''));
        if ($primaryText !== '') {
            return $primaryText;
        }

        return trim((string) ($fallback ?? ''));
    }

    private function preferSexo(mixed $value): string
    {
        $sexo = trim((string) ($value ?? ''));
        if ($sexo === '') {
            return '';
        }

        $upper = mb_strtoupper($sexo);

        return match ($upper) {
            'F', 'FEMENINO' => 'F',
            'M', 'MASCULINO' => 'M',
            default => $sexo,
        };
    }
}
