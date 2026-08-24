<?php

namespace App\Services;

use App\Models\Asistencia;
use App\Models\AsistenciaOcasional;
use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\GrupoT;
use App\Models\ReportWindow;
use App\Models\Tutor;
use App\Models\TutorReport;
use App\Services\StudentProfileResolver;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReader;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TutorAttendanceImportService
{
    public function importWorkbookForTutorWindow(Tutor $tutor, ReportWindow $window, UploadedFile $archivo): array
    {
        $period = $window->period;

        if (! $period || ! $period->is_active) {
            $this->fail('El período de la entrega no está activo.');
        }

        $careerLookup = $this->buildCareerLookup();
        $subjectLookup = $this->buildSubjectLookup();
        $studentProfileResolver = app(StudentProfileResolver::class);

        $gruposTutor = $tutor->grupos()
            ->wherePivot('period_id', $period->id)
            ->with('asignatura:id,nombre')
            ->get();

        $gruposTutorData = $gruposTutor->map(function (GrupoT $group) {
            return [
                'group' => $group,
                'codigo_variants' => $this->groupCodeVariants((string) $group->codigo),
                'asignatura_norm' => $this->canonicalSubjectKey((string) (optional($group->asignatura)->nombre ?? '')),
            ];
        })->values()->all();

        $workbookPath = $archivo->getPathname();
        $workbook = $this->loadWorkbookSheetsRows($workbookPath);
        $sheetNames = $workbook['sheet_names'];
        $sheetRows = $workbook['rows'];
        if ($sheetNames === []) {
            $this->fail('No se detectaron hojas en el archivo Excel.');
        }

        $importadasNormal = 0;
        $marcadasNormal = 0;
        $duplicadasNormal = 0;

        $hoja1 = $sheetRows[$sheetNames[0]] ?? [];
        $p1 = $this->parseSheet($hoja1, (string) ($period->code ?? ''), $window);

        if (! $p1['colAsignatura']) {
            $this->fail('No se detectó columna ASIGNATURA en la hoja 1.');
        }

        $grupoIds = $gruposTutor->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $existentesSet = [];
        if ($grupoIds !== []) {
            $existentesSet = Asistencia::where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->where('tutor_id', $tutor->id)
                ->whereIn('grupo_id', $grupoIds)
                ->get(['grupo_id', 'identificacion', 'fecha'])
                ->map(function (Asistencia $attendance) {
                    $idNorm = $this->normId((string) $attendance->identificacion);
                    $fechaNorm = Carbon::parse($attendance->fecha)->toDateString();

                    return $attendance->grupo_id . '|' . $idNorm . '|' . $fechaNorm;
                })
                ->flip()
                ->all();
        }

        $gruposCreados = 0;
        $gruposAsignados = 0;
        $normalRowContext = [
            'programa' => '',
            'asignatura' => '',
            'grupo' => '',
        ];

        foreach ($hoja1 as $index => $fila) {
            if ($index <= $p1['daysRowIndex']) {
                continue;
            }

            $identificacionRaw = trim((string) ($fila[$p1['colIdent']] ?? ''));
            if ($identificacionRaw === '') {
                continue;
            }

            $identificacionNorm = $this->normId($identificacionRaw);
            $codigoRaw = trim((string) ($fila[$p1['colCodigo']] ?? ''));
            $studentProfile = $studentProfileResolver->resolveIdentityForPeriod(
                $period->id,
                $identificacionNorm,
                $codigoRaw,
                trim((string) ($fila[$p1['colNombres']] ?? '')),
                trim((string) ($fila[$p1['colApellidos']] ?? ''))
            );
            $identificacionFinal = $this->preferText(
                $this->normId((string) ($studentProfile['identificacion'] ?? '')),
                $identificacionNorm
            );

            $nombres = $this->preferText(
                $studentProfile['nombres'] ?? '',
                trim((string) ($fila[$p1['colNombres']] ?? '')),
            );
            $apellidos = $this->preferText(
                $studentProfile['apellidos'] ?? '',
                trim((string) ($fila[$p1['colApellidos']] ?? '')),
            );

            if ($nombres === '' && $apellidos === '') {
                continue;
            }

            $codigoGrupoRaw = $this->resolveRowContextValue(
                $fila,
                $p1['colGrupo'] ?? null,
                $normalRowContext['grupo']
            );
            $programa = $this->preferText($this->resolveRowContextValue(
                $fila,
                $p1['colPrograma'] ?? null,
                $normalRowContext['programa']
            ), $studentProfile['programa'] ?? '');
            $asignaturaExcelRaw = $this->resolveRowContextValue(
                $fila,
                $p1['colAsignatura'] ?? null,
                $normalRowContext['asignatura']
            );

            $grupo = $this->resolveTutorGroup(
                $gruposTutorData,
                $codigoGrupoRaw,
                $asignaturaExcelRaw
            );

            if (! $grupo) {
                [$grupo, $wasCreated, $wasAssigned] = $this->resolveOrCreateTutorGroup(
                    $tutor,
                    $period->id,
                    $programa,
                    $asignaturaExcelRaw,
                    $codigoGrupoRaw,
                    $gruposTutorData,
                    $grupoIds
                );

                if ($wasCreated) {
                    $gruposCreados++;
                }

                if ($wasAssigned) {
                    $gruposAsignados++;
                }
            }

            if (! $grupo) {
                continue;
            }

            $codigo = $this->preferText($studentProfile['codigo'] ?? '', $codigoRaw);
            $sexo = $this->preferSexo(
                $this->guessSexo($fila),
                $studentProfile['sexo'] ?? ''
            );
            $grupoPriorizado = $this->preferText(
                $this->guessPriorizados($fila),
                $studentProfile['grupo_priorizado'] ?? ''
            );

            foreach ($p1['colToDate'] as $colFecha => $fecha) {
                $cell = $fila[$colFecha] ?? null;

                $marcado = false;
                if (is_numeric($cell) && (int) $cell === 1) {
                    $marcado = true;
                }
                if (is_string($cell) && trim(mb_strtolower($cell)) === 'x') {
                    $marcado = true;
                }

                if (! $marcado) {
                    continue;
                }

                $marcadasNormal++;

                $key = $grupo->id . '|' . $identificacionFinal . '|' . $fecha;
                if (isset($existentesSet[$key])) {
                    $duplicadasNormal++;
                    continue;
                }

                Asistencia::create([
                    'grupo_id' => $grupo->id,
                    'period_id' => $period->id,
                    'report_window_id' => $window->id,
                    'tutor_id' => $tutor->id,
                    'identificacion' => $identificacionFinal,
                    'fecha' => $fecha,
                    'nombres_del_estudiante' => $nombres,
                    'apellidos_del_estudiante' => $apellidos,
                    'codigo_estudiantil' => $codigo ?: null,
                    'programa_academico' => $programa ?: null,
                    'sexo' => $sexo,
                    'grupo_priorizado' => $grupoPriorizado ?: null,
                    'horas' => 1,
                ]);

                $existentesSet[$key] = true;
                $importadasNormal++;
            }
        }

        $importadasOcasionales = 0;
        $marcadasOcasionales = 0;
        $duplicadasOcasionales = 0;

        $hasOccasionalSheet = isset($sheetNames[1]);
        if ($hasOccasionalSheet) {
            $occasionalRowContext = [
                'programa' => '',
                'asignatura' => '',
                'grupo' => '',
            ];
            $hoja2 = $sheetRows[$sheetNames[1]] ?? [];
            $p2 = $this->parseSheet(
                $hoja2,
                (string) ($period->code ?? ''),
                $window,
                [
                    $sheetNames[0] => $hoja1,
                ]
            );

            $existOca = AsistenciaOcasional::where('period_id', $period->id)
                ->where('report_window_id', $window->id)
                ->where('tutor_id', $tutor->id)
                ->get(['unique_key'])
                ->pluck('unique_key')
                ->flip();

            foreach ($hoja2 as $index => $fila) {
                if ($index <= $p2['daysRowIndex']) {
                    continue;
                }

                $identificacionRaw = trim((string) ($fila[$p2['colIdent']] ?? ''));
                if ($identificacionRaw === '') {
                    continue;
                }

                $identificacionNorm = $this->normId($identificacionRaw);
                $codigoRaw = trim((string) ($fila[$p2['colCodigo']] ?? ''));
                $studentProfile = $studentProfileResolver->resolveIdentityForPeriod(
                    $period->id,
                    $identificacionNorm,
                    $codigoRaw,
                    trim((string) ($fila[$p2['colNombres']] ?? '')),
                    trim((string) ($fila[$p2['colApellidos']] ?? ''))
                );
                $identificacionFinal = $this->preferText(
                    $this->normId((string) ($studentProfile['identificacion'] ?? '')),
                    $identificacionNorm
                );

                $nombres = $this->preferText(
                    $studentProfile['nombres'] ?? '',
                    trim((string) ($fila[$p2['colNombres']] ?? '')),
                );
                $apellidos = $this->preferText(
                    $studentProfile['apellidos'] ?? '',
                    trim((string) ($fila[$p2['colApellidos']] ?? '')),
                );

                if ($nombres === '' && $apellidos === '') {
                    continue;
                }

                $codigo = $this->preferText($studentProfile['codigo'] ?? '', $codigoRaw);
                $programa = $this->preferText($this->resolveRowContextValue(
                    $fila,
                    $p2['colPrograma'] ?? null,
                    $occasionalRowContext['programa']
                ), $studentProfile['programa'] ?? '');
                $asignaturaTxt = $this->resolveRowContextValue(
                    $fila,
                    $p2['colAsignatura'] ?? null,
                    $occasionalRowContext['asignatura']
                );
                $grupoTxt = $this->resolveRowContextValue(
                    $fila,
                    $p2['colGrupo'] ?? null,
                    $occasionalRowContext['grupo']
                );
                $sexo = $this->preferSexo(
                    $this->guessSexo($fila),
                    $studentProfile['sexo'] ?? ''
                );
                $grupoPriorizado = $this->preferText(
                    $this->guessPriorizados($fila),
                    $studentProfile['grupo_priorizado'] ?? ''
                );

                foreach ($p2['colToDate'] as $colFecha => $fecha) {
                    $cell = $fila[$colFecha] ?? null;

                    $marcado = false;
                    if (is_numeric($cell) && (int) $cell === 1) {
                        $marcado = true;
                    }
                    if (is_string($cell) && trim(mb_strtolower($cell)) === 'x') {
                        $marcado = true;
                    }

                    if (! $marcado) {
                        continue;
                    }

                    $marcadasOcasionales++;

                    $uniqueKey = sha1(
                        $period->id . '|' .
                        $window->id . '|' .
                        $tutor->id . '|' .
                        $identificacionFinal . '|' .
                        $fecha . '|' .
                        ($asignaturaTxt ?? '') . '|' .
                        ($grupoTxt ?? '')
                    );

                    if (isset($existOca[$uniqueKey])) {
                        $duplicadasOcasionales++;
                        continue;
                    }

                    AsistenciaOcasional::create([
                        'period_id' => $period->id,
                        'report_window_id' => $window->id,
                        'tutor_id' => $tutor->id,
                        'grupo_id' => null,
                        'identificacion' => $identificacionFinal,
                        'fecha' => $fecha,
                        'nombres_del_estudiante' => $nombres,
                        'apellidos_del_estudiante' => $apellidos,
                        'codigo_estudiantil' => $codigo ?: null,
                        'programa_academico' => $programa ?: null,
                        'asignatura_texto' => $asignaturaTxt ?: null,
                        'grupo_texto' => $grupoTxt ?: null,
                        'sexo' => $sexo,
                        'grupo_priorizado' => $grupoPriorizado ?: null,
                        'horas' => 1,
                        'unique_key' => $uniqueKey,
                    ]);

                    $existOca[$uniqueKey] = true;
                    $importadasOcasionales++;
                }
            }

            unset($hoja2, $p2, $existOca);
            gc_collect_cycles();
        }

        unset($hoja1, $p1);
        gc_collect_cycles();

        TutorReport::updateOrCreate(
            [
                'tutor_id' => $tutor->id,
                'window_id' => $window->id,
                'period_id' => $period->id,
            ],
            [
                'status' => 'submitted',
                'submitted_at' => now(),
                'hours_total' => null,
                'notes' => null,
            ]
        );

        return [
            'importadas_normal' => $importadasNormal,
            'marcadas_normal' => $marcadasNormal,
            'duplicadas_normal' => $duplicadasNormal,
            'importadas_ocasionales' => $importadasOcasionales,
            'marcadas_ocasionales' => $marcadasOcasionales,
            'duplicadas_ocasionales' => $duplicadasOcasionales,
            'has_ocasional_sheet' => $hasOccasionalSheet,
            'grupos_creados' => $gruposCreados,
            'grupos_asignados' => $gruposAsignados,
        ];
    }

    private function loadWorkbookSheetsRows(string $workbookPath): array
    {
        $reader = $this->makeWorkbookReader($workbookPath);
        $spreadsheet = null;

        try {
            $spreadsheet = $reader->load($workbookPath);
            $sheetNames = array_slice($spreadsheet->getSheetNames(), 0, 2);
            $rowsBySheet = [];

            foreach ($sheetNames as $index => $sheetName) {
                $sheet = $spreadsheet->getSheetByName($sheetName) ?? $spreadsheet->getSheet($index);
                $rowsBySheet[$sheetName] = $this->worksheetToRows($sheet);
            }

            return [
                'sheet_names' => $sheetNames,
                'rows' => $rowsBySheet,
            ];
        } finally {
            if ($spreadsheet !== null) {
                $spreadsheet->disconnectWorksheets();
            }

            unset($sheet, $spreadsheet, $reader);
            gc_collect_cycles();
        }
    }

    private function worksheetToRows(Worksheet $sheet): array
    {
        $highestRow = max(1, (int) $sheet->getHighestDataRow());
        $highestColumn = (string) $sheet->getHighestDataColumn();

        if ($highestColumn === '') {
            $highestColumn = (string) $sheet->getHighestColumn();
        }

        $rows = $sheet->rangeToArray(
            'A1:' . $highestColumn . $highestRow,
            null,
            false,
            true,
            true
        );

        foreach ($rows as $rowIndex => &$row) {
            foreach ($row as $column => $value) {
                if (! is_string($value) || ! str_starts_with(trim($value), '=')) {
                    continue;
                }

                $cachedValue = $sheet->getCell((string) $column . (int) $rowIndex)->getOldCalculatedValue();
                if ($cachedValue !== null && $cachedValue !== '') {
                    $row[$column] = $cachedValue;
                }
            }
        }
        unset($row);

        return $rows;
    }

    private function makeWorkbookReader(string $workbookPath): IReader
    {
        $reader = IOFactory::createReaderForFile($workbookPath);
        $reader->setReadDataOnly(true);
        $reader->setReadEmptyCells(false);
        $reader->setIgnoreRowsWithNoCells(true);
        $reader->setIncludeCharts(false);

        return $reader;
    }

    public function buildImportMessage(array $stats): string
    {
        $msg = "Importación lista. Normal: {$stats['importadas_normal']} nuevas";
        if (($stats['marcadas_normal'] ?? 0) > 0) {
            $msg .= ", {$stats['duplicadas_normal']} duplicadas";
        }
        $msg .= '.';

        if (! empty($stats['has_ocasional_sheet'])) {
            $msg .= " Ocasionales: {$stats['importadas_ocasionales']} nuevas";
            if (($stats['marcadas_ocasionales'] ?? 0) > 0) {
                $msg .= ", {$stats['duplicadas_ocasionales']} duplicadas";
            }
            $msg .= '.';
        }

        if ((int) ($stats['grupos_creados'] ?? 0) > 0 || (int) ($stats['grupos_asignados'] ?? 0) > 0) {
            $msg .= sprintf(
                ' Grupos creados: %d. Asignaciones nuevas del tutor: %d.',
                (int) ($stats['grupos_creados'] ?? 0),
                (int) ($stats['grupos_asignados'] ?? 0)
            );
        }

        if (
            (int) ($stats['importadas_normal'] ?? 0) === 0
            && (int) ($stats['importadas_ocasionales'] ?? 0) === 0
        ) {
            $msg .= ' No había asistencias nuevas para registrar en esta entrega.';
        }

        return $msg;
    }

    private function parseSheet(
        array $hoja,
        string $periodCode,
        ReportWindow $window,
        array $referenceRowsBySheet = []
    ): array
    {
        $headerRowIndex = null;
        foreach ($hoja as $i => $row) {
            $joined = $this->norm(implode(' ', array_values($row)));
            if (
                str_contains($joined, 'NOMBRES DEL ESTUDIANTE')
                && str_contains($joined, 'APELLIDOS DEL ESTUDIANTE')
            ) {
                $headerRowIndex = (int) $i;
                break;
            }
        }

        if (! $headerRowIndex) {
            $this->fail('No se encontró el encabezado (NOMBRES DEL ESTUDIANTE).');
        }

        $headerRow = $hoja[$headerRowIndex] ?? [];

        $daysRowIndex = null;
        $maxNumbers = 0;
        for ($k = 1; $k <= 3; $k++) {
            $idx = $headerRowIndex + $k;
            if (! isset($hoja[$idx])) {
                continue;
            }

            $count = 0;
            foreach ($hoja[$idx] as $cell) {
                if ($this->resolveDayNumber($cell, $referenceRowsBySheet) !== null) {
                    $count++;
                }
            }

            if ($count > $maxNumbers) {
                $maxNumbers = $count;
                $daysRowIndex = $idx;
            }
        }

        if (! $daysRowIndex || $maxNumbers < 5) {
            $this->fail('No se detectó la fila de días (1,5,6,7...).');
        }

        $daysRow = $hoja[$daysRowIndex] ?? [];

        $monthRowIndex = null;
        foreach ([$headerRowIndex - 1, $headerRowIndex, $daysRowIndex] as $candidate) {
            if ($candidate < 1 || ! isset($hoja[$candidate])) {
                continue;
            }

            $joined = $this->norm(implode(' ', array_values($hoja[$candidate])));
            if ($this->containsAnyMonth($joined)) {
                $monthRowIndex = $candidate;
                break;
            }
        }

        $monthRowIndex = $monthRowIndex ?: $headerRowIndex;
        $monthRow = $hoja[$monthRowIndex] ?? [];

        $colNombres = $this->findColByContains($headerRow, 'NOMBRES DEL ESTUDIANTE');
        $colApellidos = $this->findColByContains($headerRow, 'APELLIDOS DEL ESTUDIANTE');
        $colIdent = $this->findColByContains($headerRow, 'IDENTIFICACION');
        $colCodigo = $this->findColByContains($headerRow, 'CÓDIGO ESTUDIANTIL')
            ?: $this->findColByContains($headerRow, 'CODIGO ESTUDIANTIL');
        $colPrograma = $this->findColByContains($headerRow, 'PROGRAMA');
        $colAsignatura = $this->findColByContains($headerRow, 'ASIGNATURA');
        $colGrupo = $this->findColByExact($headerRow, 'GRUPO')
            ?: $this->findColByContainsLast($headerRow, 'GRUPO');

        if (! $colNombres || ! $colApellidos || ! $colIdent) {
            $this->fail('No se detectaron columnas clave (Nombres/Apellidos/Identificación).');
        }

        $year = $this->yearFromPeriodCode($periodCode)
            ?: (int) ($window->open_at ? Carbon::parse($window->open_at)->year : now()->year);

        $colToDate = [];
        $currentMonthName = null;
        $currentYear = $year;
        $prevMonthNum = null;

        foreach ($daysRow as $col => $valDia) {
            $dia = $this->resolveDayNumber($valDia, $referenceRowsBySheet);
            if ($dia === null) {
                continue;
            }

            $monthCell = $monthRow[$col] ?? null;
            $monthNorm = $this->norm((string) $monthCell);

            if ($this->isSpanishMonth($monthNorm)) {
                $currentMonthName = $monthNorm;
            }
            if (! $currentMonthName) {
                continue;
            }

            $monthNum = $this->monthNumberFromSpanish($currentMonthName);
            if (! $monthNum) {
                continue;
            }

            if ($prevMonthNum !== null && $monthNum < $prevMonthNum) {
                $currentYear++;
            }
            $prevMonthNum = $monthNum;

            try {
                $fecha = Carbon::createFromDate($currentYear, $monthNum, $dia)->toDateString();
            } catch (\Throwable) {
                continue;
            }

            $colToDate[$col] = $fecha;
        }

        if (count($colToDate) === 0) {
            $this->fail('No se detectaron columnas de fechas (mes + día).');
        }

        return compact(
            'headerRowIndex',
            'headerRow',
            'daysRowIndex',
            'daysRow',
            'monthRowIndex',
            'monthRow',
            'colNombres',
            'colApellidos',
            'colIdent',
            'colCodigo',
            'colPrograma',
            'colAsignatura',
            'colGrupo',
            'colToDate'
        );
    }

    private function resolveOrCreateTutorGroup(
        Tutor $tutor,
        int $periodId,
        string $programaRaw,
        string $asignaturaRaw,
        string $codigoGrupoRaw,
        array &$gruposTutorData,
        array &$grupoIds
    ): array {
        $careerId = null;
        $subject = null;

        foreach ($this->candidateCareerIds($programaRaw, (int) $tutor->carrera_id) as $candidateCareerId) {
            $candidateSubject = $this->resolveSubjectForCareer($asignaturaRaw, $candidateCareerId);
            if (! $candidateSubject) {
                continue;
            }

            $careerId = $candidateCareerId;
            $subject = $candidateSubject;
            break;
        }

        if (! $subject) {
            return [null, false, false];
        }

        $group = $this->findExistingGroupForImport($periodId, $careerId, $subject->id, $codigoGrupoRaw);
        $wasCreated = false;

        if (! $group) {
            $codigo = trim($codigoGrupoRaw);
            if ($codigo === '') {
                $codigo = $this->buildAutoImportGroupCode($tutor, $subject);

                $group = GrupoT::query()
                    ->where('period_id', $periodId)
                    ->where('carrera_id', $careerId)
                    ->where('asignatura_id', $subject->id)
                    ->where('codigo', $codigo)
                    ->first();
            }

            if (! $group) {
                $group = GrupoT::create([
                    'nombre' => $subject->nombre,
                    'codigo' => $codigo,
                    'docente' => 'Importado desde asistencias',
                    'carrera_id' => $careerId,
                    'asignatura_id' => $subject->id,
                    'period_id' => $periodId,
                ]);
                $wasCreated = true;
            }
        }

        $tutor->asignaturas()->syncWithoutDetaching([$subject->id]);

        $alreadyAttached = $group->tutores()
            ->wherePivot('period_id', $periodId)
            ->where('tutors.id', $tutor->id)
            ->exists();

        $wasAssigned = false;
        if (! $alreadyAttached) {
            $role = $group->tutores()
                ->wherePivot('period_id', $periodId)
                ->exists()
                ? 'secundario'
                : 'principal';

            $group->tutores()->attach($tutor->id, [
                'period_id' => $periodId,
                'rol' => $role,
            ]);

            $wasAssigned = true;
        }

        $group->loadMissing('asignatura:id,nombre');

        $alreadyKnown = collect($gruposTutorData)->contains(
            fn ($item) => (int) (($item['group']->id ?? 0)) === (int) $group->id
        );

        if (! $alreadyKnown) {
            $gruposTutorData[] = [
                'group' => $group,
                'codigo_variants' => $this->groupCodeVariants((string) $group->codigo),
                'asignatura_norm' => $this->canonicalSubjectKey((string) (optional($group->asignatura)->nombre ?? '')),
            ];
        }

        if (! in_array((int) $group->id, $grupoIds, true)) {
            $grupoIds[] = (int) $group->id;
        }

        return [$group, $wasCreated, $wasAssigned];
    }

    private function buildAutoImportGroupCode(Tutor $tutor, Asignatura $subject): string
    {
        return sprintf('AUTO-T%s-A%s', (int) $tutor->id, (int) $subject->id);
    }

    private function candidateCareerIds(string $programaRaw, int $fallbackCareerId = 0): array
    {
        $careerIds = [];

        $resolvedCareerId = $this->resolveCareerId($programaRaw, 0);
        if ($resolvedCareerId) {
            $careerIds[] = (int) $resolvedCareerId;
        }

        if ($fallbackCareerId > 0 && ! in_array($fallbackCareerId, $careerIds, true)) {
            $careerIds[] = $fallbackCareerId;
        }

        return $careerIds;
    }

    private function buildCareerLookup(): array
    {
        $lookup = [];

        foreach (Carrera::query()->get(['id', 'nombre', 'codigo']) as $career) {
            $lookup[(string) $career->id] = (int) $career->id;
            $lookup[$this->norm((string) $career->nombre)] = (int) $career->id;

            if (! empty($career->codigo)) {
                $lookup[$this->norm((string) $career->codigo)] = (int) $career->id;
            }
        }

        foreach ($this->careerAliases() as $alias => $careerName) {
            $careerId = $lookup[$this->norm($careerName)] ?? null;
            if ($careerId !== null) {
                $lookup[$this->norm($alias)] = $careerId;
            }
        }

        return $lookup;
    }

    private function buildSubjectLookup(): array
    {
        $lookup = [];

        foreach (Asignatura::query()->get(['id', 'nombre', 'carrera_id']) as $subject) {
            $careerKey = (string) $subject->carrera_id;
            $lookup[$careerKey] ??= [];
            $lookup[$careerKey][(string) $subject->id] = $subject;

            foreach ($this->subjectLookupKeys((string) $subject->nombre) as $lookupKey) {
                $lookup[$careerKey][$lookupKey] = $subject;
            }
        }

        return $lookup;
    }

    private function resolveCareerId(string $programaRaw, int $fallbackCareerId = 0): ?int
    {
        static $lookup = null;
        $lookup ??= $this->buildCareerLookup();

        $programa = trim($programaRaw);
        if ($programa !== '') {
            $key = is_numeric($programa) ? (string) (int) $programa : $this->norm($programa);
            if (isset($lookup[$key])) {
                return (int) $lookup[$key];
            }
        }

        return $fallbackCareerId > 0 ? $fallbackCareerId : null;
    }

    private function resolveSubjectForCareer(string $asignaturaRaw, int $careerId): ?Asignatura
    {
        static $lookup = null;
        $lookup ??= $this->buildSubjectLookup();

        $lookupKeys = $this->subjectLookupKeys($asignaturaRaw);
        if ($lookupKeys === []) {
            return null;
        }

        $careerSubjects = $lookup[(string) $careerId] ?? [];

        foreach ($lookupKeys as $lookupKey) {
            $subject = $careerSubjects[$lookupKey] ?? null;
            if ($subject instanceof Asignatura) {
                return $subject;
            }
        }

        $subjectKey = $this->canonicalSubjectKey($asignaturaRaw);
        $best = null;
        $bestScore = 0.0;
        $secondScore = 0.0;

        foreach ($careerSubjects as $candidate) {
            if (! $candidate instanceof Asignatura) {
                continue;
            }

            $score = $this->subjectSimilarity($subjectKey, $this->canonicalSubjectKey((string) $candidate->nombre));
            if ($score > $bestScore) {
                $secondScore = $bestScore;
                $bestScore = $score;
                $best = $candidate;
            } elseif ($score > $secondScore) {
                $secondScore = $score;
            }
        }

        if ($best && $bestScore >= 0.9 && ($bestScore - $secondScore) >= 0.08) {
            return $best;
        }

        return null;
    }

    private function findExistingGroupForImport(int $periodId, int $careerId, int $subjectId, string $codigoGrupoRaw): ?GrupoT
    {
        $groups = GrupoT::query()
            ->where('period_id', $periodId)
            ->where('carrera_id', $careerId)
            ->where('asignatura_id', $subjectId)
            ->get();

        if ($groups->isEmpty()) {
            return null;
        }

        $codigoVariants = $this->groupCodeVariants($codigoGrupoRaw);
        if ($codigoVariants !== []) {
            foreach ($groups as $group) {
                if ($this->codeVariantsIntersect($codigoVariants, $this->groupCodeVariants((string) $group->codigo))) {
                    return $group;
                }
            }

            return null;
        }

        return $groups->count() === 1 ? $groups->first() : null;
    }

    private function resolveTutorGroup(array $gruposTutorData, string $codigoGrupoRaw, string $asignaturaRaw): ?GrupoT
    {
        $codigoVariants = $this->groupCodeVariants($codigoGrupoRaw);
        $asignaturaNorm = $this->canonicalSubjectKey($asignaturaRaw);

        if ($codigoVariants === [] && $asignaturaNorm === '') {
            return null;
        }

        $codeMatched = [];
        if ($codigoVariants !== []) {
            foreach ($gruposTutorData as $item) {
                if ($this->codeVariantsIntersect($codigoVariants, $item['codigo_variants'] ?? [])) {
                    $codeMatched[] = $item;
                }
            }
        }

        if ($codeMatched !== [] && $asignaturaNorm !== '') {
            $exact = array_values(array_filter(
                $codeMatched,
                fn ($item) => ($item['asignatura_norm'] ?? '') === $asignaturaNorm
            ));

            if (count($exact) === 1) {
                return $exact[0]['group'];
            }
        }

        if ($codeMatched !== []) {
            if ($asignaturaNorm === '') {
                return count($codeMatched) === 1 ? $codeMatched[0]['group'] : null;
            }

            $bestByCode = $this->pickBestByAsignatura($codeMatched, $asignaturaNorm, 0.74, 0.08);
            if ($bestByCode) {
                return $bestByCode;
            }
        }

        if ($asignaturaNorm !== '') {
            $exactAsig = array_values(array_filter(
                $gruposTutorData,
                fn ($item) => ($item['asignatura_norm'] ?? '') === $asignaturaNorm
            ));

            if (count($exactAsig) === 1) {
                return $exactAsig[0]['group'];
            }

            return $this->pickBestByAsignatura($gruposTutorData, $asignaturaNorm, 0.90, 0.10);
        }

        return null;
    }

    private function resolveRowContextValue(array $fila, ?string $column, string &$carry): string
    {
        if (! $column) {
            return $carry;
        }

        $value = trim((string) ($fila[$column] ?? ''));
        if ($value !== '') {
            $carry = $value;
            return $value;
        }

        return $carry;
    }

    private function pickBestByAsignatura(array $items, string $asignaturaNorm, float $minScore, float $minGap): ?GrupoT
    {
        $scored = [];

        foreach ($items as $item) {
            $score = $this->subjectSimilarity($asignaturaNorm, (string) ($item['asignatura_norm'] ?? ''));
            if ($score <= 0) {
                continue;
            }

            $scored[] = [
                'group' => $item['group'],
                'score' => $score,
            ];
        }

        if ($scored === []) {
            return null;
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        $best = $scored[0];
        if ($best['score'] < $minScore) {
            return null;
        }

        $second = $scored[1] ?? null;
        if ($second && (($best['score'] - $second['score']) < $minGap)) {
            return null;
        }

        return $best['group'];
    }

    private function groupCodeVariants(string $code): array
    {
        $norm = $this->normalizeGroupCode($code);
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

    private function normalizeGroupCode(string $code): string
    {
        return preg_replace('/[^0-9A-Z]/', '', $this->norm($code));
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

    private function subjectSimilarity(string $left, string $right): float
    {
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

    private function subjectLookupKeys(string $name): array
    {
        $keys = [];

        $raw = $this->norm($name);
        if ($raw !== '') {
            $keys[] = $raw;
        }

        $canonical = $this->canonicalSubjectKey($name);
        if ($canonical !== '' && ! in_array($canonical, $keys, true)) {
            $keys[] = $canonical;
        }

        return $keys;
    }

    private function canonicalSubjectKey(string $name): string
    {
        $normalized = $this->norm($name);
        if ($normalized === '') {
            return '';
        }

        $normalized = preg_replace('/[^A-Z0-9 ]+/', ' ', $normalized);
        $tokens = array_values(array_filter(explode(' ', preg_replace('/\s+/', ' ', trim($normalized)))));

        if ($tokens === []) {
            return '';
        }

        $romanToArabic = [
            'I' => '1',
            'II' => '2',
            'III' => '3',
            'IV' => '4',
            'V' => '5',
            'VI' => '6',
            'VII' => '7',
            'VIII' => '8',
            'IX' => '9',
            'X' => '10',
        ];

        $tokenAliases = [
            'ALGORITMOS' => 'ALGORITMO',
            'BASES' => 'BASE',
            'DATOS' => 'DATO',
            'ECUACIONES' => 'ECUACION',
            'DIFERENCIALES' => 'DIFERENCIAL',
        ];

        $canonicalTokens = array_map(function (string $token) use ($romanToArabic, $tokenAliases) {
            if (isset($romanToArabic[$token])) {
                return $romanToArabic[$token];
            }

            if (preg_match('/^[0-9]+$/', $token)) {
                return ltrim($token, '0') ?: '0';
            }

            return $tokenAliases[$token] ?? $token;
        }, $tokens);

        return implode(' ', $canonicalTokens);
    }

    private function norm(string $s): string
    {
        $s = trim(mb_strtoupper($s));
        $s = str_replace(['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'], ['A', 'E', 'I', 'O', 'U', 'U', 'N'], $s);

        return preg_replace('/\s+/', ' ', $s);
    }

    private function normId(string $id): string
    {
        $id = trim(mb_strtoupper($id));

        return preg_replace('/[^0-9A-Z]/', '', $id);
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

    private function isDayNumber(mixed $v): bool
    {
        if (! is_numeric($v)) {
            return false;
        }

        $n = (int) $v;

        return $n >= 1 && $n <= 31;
    }

    private function resolveDayNumber(
        mixed $value,
        array $referenceRowsBySheet = [],
        int $depth = 0
    ): ?int {
        if ($depth > 3) {
            return null;
        }

        if ($this->isDayNumber($value)) {
            return (int) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $formula = trim($value);
        if ($formula === '' || ! str_starts_with($formula, '=')) {
            return null;
        }

        if (! preg_match("/^=\\s*(?:'([^']+)'|([^!]+))!\\$?([A-Z]{1,4})\\$?(\\d+)\\s*$/u", $formula, $matches)) {
            return null;
        }

        $sheetName = $this->norm((string) ($matches[1] !== '' ? $matches[1] : $matches[2]));
        $column = strtoupper((string) $matches[3]);
        $rowIndex = (int) $matches[4];
        $referenceRows = $referenceRowsBySheet[$sheetName] ?? $referenceRowsBySheet[$matches[1] ?? ''] ?? $referenceRowsBySheet[$matches[2] ?? ''] ?? null;

        if (! is_array($referenceRows)) {
            foreach ($referenceRowsBySheet as $candidateSheet => $candidateRows) {
                if ($this->norm((string) $candidateSheet) === $sheetName && is_array($candidateRows)) {
                    $referenceRows = $candidateRows;
                    break;
                }
            }
        }

        if (! is_array($referenceRows)) {
            return null;
        }

        $referencedValue = $referenceRows[$rowIndex][$column] ?? null;

        return $this->resolveDayNumber($referencedValue, $referenceRowsBySheet, $depth + 1);
    }

    private function containsAnyMonth(string $joined): bool
    {
        foreach (['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'] as $month) {
            if (str_contains($joined, $month)) {
                return true;
            }
        }

        return false;
    }

    private function isSpanishMonth(string $s): bool
    {
        return in_array($s, ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'], true);
    }

    private function monthNumberFromSpanish(string $m): ?int
    {
        $map = [
            'ENERO' => 1,
            'FEBRERO' => 2,
            'MARZO' => 3,
            'ABRIL' => 4,
            'MAYO' => 5,
            'JUNIO' => 6,
            'JULIO' => 7,
            'AGOSTO' => 8,
            'SEPTIEMBRE' => 9,
            'OCTUBRE' => 10,
            'NOVIEMBRE' => 11,
            'DICIEMBRE' => 12,
        ];

        return $map[$m] ?? null;
    }

    private function yearFromPeriodCode(?string $code): ?int
    {
        if (! $code) {
            return null;
        }

        if (preg_match('/(\d{4})/', $code, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function findColByContains(array $row, string $needle): ?string
    {
        $needle = $this->norm($needle);

        foreach ($row as $col => $cell) {
            if (str_contains($this->norm((string) $cell), $needle)) {
                return (string) $col;
            }
        }

        return null;
    }

    private function findColByExact(array $row, string $exact): ?string
    {
        $exact = $this->norm($exact);

        foreach ($row as $col => $cell) {
            if ($this->norm((string) $cell) === $exact) {
                return (string) $col;
            }
        }

        return null;
    }

    private function findColByContainsLast(array $row, string $needle): ?string
    {
        $needle = $this->norm($needle);
        $last = null;

        foreach ($row as $col => $cell) {
            if (str_contains($this->norm((string) $cell), $needle)) {
                $last = (string) $col;
            }
        }

        return $last;
    }

    private function guessSexo(array $fila): ?string
    {
        $h = $fila['H'] ?? null;
        $i = $fila['I'] ?? null;

        $isX = fn ($v) => is_string($v) && trim(mb_strtolower($v)) === 'x';
        $is1 = fn ($v) => is_numeric($v) && (int) $v === 1;

        if ($isX($h) || $is1($h)) {
            return 'F';
        }
        if ($isX($i) || $is1($i)) {
            return 'M';
        }

        return null;
    }

    private function guessPriorizados(array $fila): ?string
    {
        $map = [
            'J' => 'Étnico',
            'K' => 'Étnico',
            'L' => 'Discapacidad',
            'M' => 'Víctima de conflicto armado',
            'N' => 'LGTBIQ+',
            'O' => 'Habitante de frontera',
        ];

        $vals = [];
        foreach ($map as $col => $label) {
            $v = $fila[$col] ?? null;
            $mark = (is_numeric($v) && (int) $v === 1) || (is_string($v) && trim(mb_strtolower($v)) === 'x');
            if ($mark) {
                $vals[] = $label;
            }
        }

        return count($vals) ? implode(', ', array_values(array_unique($vals))) : null;
    }

    private function fail(string $message): void
    {
        throw ValidationException::withMessages([
            'archivo' => $message,
        ]);
    }

    private function careerAliases(): array
    {
        return [
            'ING SISTEMAS' => 'INGENIERIA DE SISTEMAS',
            'INGENIERIA SISTEMAS' => 'INGENIERIA DE SISTEMAS',
            'INGENIERIA EN SISTEMAS' => 'INGENIERIA DE SISTEMAS',
            'LIC EDUCACION INFANTIL' => 'LICENCIATURA EN EDUCACION INFANTIL',
            'LIC EN EDU INFANTIL' => 'LICENCIATURA EN EDUCACION INFANTIL',
            'LIC. EN EDU INFANTIL' => 'LICENCIATURA EN EDUCACION INFANTIL',
        ];
    }
}
