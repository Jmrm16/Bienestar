<?php

use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

it('imports tutors from excel and syncs their subjects', function () {
    $this->actingAs(User::factory()->create());

    $career = Carrera::create([
        'nombre' => 'Ingeniería de Sistemas',
        'codigo' => 'IS',
    ]);

    $subjectA = Asignatura::create([
        'nombre' => 'Algoritmos',
        'carrera_id' => $career->id,
    ]);

    $subjectB = Asignatura::create([
        'nombre' => 'Bases de Datos',
        'carrera_id' => $career->id,
    ]);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->fromArray([
        ['Codigo', 'Nombre', 'Apellido', 'Documento', 'Carrera', 'Correo', 'Telefono', 'Asignaturas', 'Tipo Resolucion'],
        ['TUT-001', 'Ana', 'Perez', '123456789', $career->nombre, 'ana@example.com', '3001234567', $subjectA->nombre . '; ' . $subjectB->nombre, 'R2'],
    ]);

    $filePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tutores-import-' . Str::uuid() . '.xlsx';

    try {
        (new Xlsx($spreadsheet))->save($filePath);

        $response = $this->post(route('tutores.import'), [
            'archivo' => new UploadedFile(
                $filePath,
                'tutores.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                null,
                true
            ),
        ]);

        $response->assertRedirect(route('tutores.index'));
        $response->assertSessionHas('success');

        $tutor = Tutor::query()
            ->where('documento', '123456789')
            ->with('asignaturas')
            ->first();

        expect($tutor)->not->toBeNull();
        expect($tutor->codigo)->toBe('TUT-001');
        expect($tutor->tipo_resolucion)->toBe('R2');
        expect($tutor->carrera_id)->toBe($career->id);
        expect($tutor->asignaturas->pluck('id')->all())
            ->toEqualCanonicalizing([$subjectA->id, $subjectB->id]);
    } finally {
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
});

it('imports the real admission excel layout and ignores score columns', function () {
    $this->actingAs(User::factory()->create());

    $career = Carrera::create([
        'nombre' => 'LICENCIATURA EN EDUCACION INFANTIL',
        'codigo' => '153',
    ]);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('2 RESOLUCION');
    $sheet->fromArray([
        ['PROCESO DE ADMISION ESTUDIANTE TUTOR 2025-2'],
        ['#', 'NOMBRES ', 'APELLIDOS', 'TIPO DE DOCUMENTO', 'DOCUMENTO ', 'LUGAR DE EXPEDICIÓN', 'SEXO', 'GRUPO PRIRIZADO', 'SEDE', 'PROGRAMA ACADÉMICO', 'CORREO', 'TELEFONO', 'VALORACION ENTREVISTA ', 'PUNTAJE PRUEBA DE TABLERO', 'DESICION FINAL'],
        [1, 'Laura', 'Ruiz', 'C. C.', '1122334455', 'Maicao', 'Femenino', 'POBLACIÓN INDÍGENA', 'Maicao', 'LIC. EDUCACION INFANTIL', 'laura@example.com', '3001231234', 'EXONERADO POR ANTIGÜEDAD', '98', 'ADMITIDO'],
    ]);

    $filePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tutores-admision-' . Str::uuid() . '.xlsx';

    try {
        (new Xlsx($spreadsheet))->save($filePath);

        $response = $this->post(route('tutores.import'), [
            'archivo' => new UploadedFile(
                $filePath,
                '2. ADMITIDOS 2 RESOLUCION.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                null,
                true
            ),
        ]);

        $response->assertRedirect(route('tutores.index'));
        $response->assertSessionHas('success');

        $tutor = Tutor::query()->where('documento', '1122334455')->with('asignaturas')->first();

        expect($tutor)->not->toBeNull();
        expect($tutor->tipo_resolucion)->toBe('R2');
        expect($tutor->tipo_documento)->toBe('CC');
        expect($tutor->sexo)->toBe('F');
        expect($tutor->grupo_priorizado)->toBe('etnia');
        expect($tutor->carrera_id)->toBe($career->id);
        expect($tutor->asignaturas)->toHaveCount(0);
    } finally {
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
});

it('imports rows when career comes as "INGENIERIA DE SISTEMA"', function () {
    $this->actingAs(User::factory()->create());

    $career = Carrera::create([
        'nombre' => 'INGENIERIA DE SISTEMAS',
        'codigo' => '124',
    ]);

    $subject = Asignatura::create([
        'nombre' => 'ALGORITMO Y PROGRAMACION I',
        'carrera_id' => $career->id,
    ]);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->fromArray([
        ['RELACION ESTUDIANTE PRIMERA RESOLUCION'],
        ['NOMBRE COMPLETO', 'DOCUMENTO', 'CODIGO', 'PROGRAMA ACADEMICO', 'ASIGNATURA', 'CORREO', 'TELEFONO'],
        ['SANCHEZ LOPEZ RENZO DAMIAN', '1121528077', '1242210024', 'INGENIERIA DE SISTEMA', $subject->nombre, 'rdamiansanchez@uniguajira.edu.co', '3013210716'],
    ]);

    $filePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tutores-r1-singular-' . Str::uuid() . '.xlsx';

    try {
        (new Xlsx($spreadsheet))->save($filePath);

        $response = $this->post(route('tutores.import'), [
            'archivo' => new UploadedFile(
                $filePath,
                '1. TUTORES PRIMERA RESOLUCION.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                null,
                true
            ),
        ]);

        $response->assertRedirect(route('tutores.index'));
        $response->assertSessionHas('success');

        $tutor = Tutor::query()
            ->where('documento', '1121528077')
            ->with('asignaturas')
            ->first();

        expect($tutor)->not->toBeNull();
        expect($tutor->nombre)->toBe('SANCHEZ LOPEZ');
        expect($tutor->apellido)->toBe('RENZO DAMIAN');
        expect($tutor->carrera_id)->toBe($career->id);
        expect($tutor->asignaturas->pluck('id')->all())
            ->toEqualCanonicalizing([$subject->id]);
    } finally {
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
});
