<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ReportController;
use App\Models\Carrera;

$windowIds = [7, 8];
$controller = app(ReportController::class);
$resolveCareer = new ReflectionMethod(ReportController::class, 'resolveCareerNodeForTree');
$resolveCareer->setAccessible(true);
$careerCatalog = Carrera::query()->get(['id', 'nombre', 'codigo']);

$normalRows = DB::table('asistencias as a')
    ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
    ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
    ->leftJoin('tutors as t', 't.id', '=', 'a.tutor_id')
    ->leftJoin('report_windows as rw', 'rw.id', '=', 'a.report_window_id')
    ->whereIn('a.report_window_id', $windowIds)
    ->selectRaw("TRIM(a.identificacion) as identificacion, COALESCE(c.nombre, a.programa_academico, 'Sin carrera') as carrera, COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', a.tutor_id)) as tutor, a.tutor_id as tutor_id, rw.name as window_name, rw.tutor_type as tutor_type, 'normal' as origen")
    ->distinct()
    ->get();

$ocasionalRows = DB::table('asistencias_ocasionales as ao')
    ->leftJoin('tutors as t', 't.id', '=', 'ao.tutor_id')
    ->leftJoin('report_windows as rw', 'rw.id', '=', 'ao.report_window_id')
    ->whereIn('ao.report_window_id', $windowIds)
    ->selectRaw("TRIM(ao.identificacion) as identificacion, COALESCE(NULLIF(TRIM(ao.programa_academico), ''), 'Sin carrera') as programa_academico, COALESCE(NULLIF(TRIM(CONCAT(t.nombre,' ',t.apellido)), ''), CONCAT('Tutor #', ao.tutor_id)) as tutor, ao.tutor_id as tutor_id, rw.name as window_name, rw.tutor_type as tutor_type, 'ocasional' as origen")
    ->distinct()
    ->get();

$students = [];

foreach ($normalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $careerName = trim((string) $row->carrera);
    $students[$id]['carreras'][$careerName] = true;
    $students[$id]['rows'][] = [
        'carrera' => $careerName,
        'tutor' => trim((string) $row->tutor),
        'tutor_id' => (int) $row->tutor_id,
        'window' => trim((string) $row->window_name),
        'resolucion' => trim((string) $row->tutor_type),
        'origen' => 'normal',
    ];
}

foreach ($ocasionalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $careerNode = $resolveCareer->invoke($controller, trim((string) $row->programa_academico), $careerCatalog);
    $careerName = trim((string) ($careerNode['name'] ?? 'Sin carrera'));
    $students[$id]['carreras'][$careerName] = true;
    $students[$id]['rows'][] = [
        'carrera' => $careerName,
        'tutor' => trim((string) $row->tutor),
        'tutor_id' => (int) $row->tutor_id,
        'window' => trim((string) $row->window_name),
        'resolucion' => trim((string) $row->tutor_type),
        'origen' => 'ocasional',
    ];
}

$duplicates = [];
$tutors = [];
foreach ($students as $id => $info) {
    $carreras = array_keys($info['carreras'] ?? []);
    if (count($carreras) <= 1) continue;
    sort($carreras);

    $rows = collect($info['rows'] ?? [])
        ->unique(fn ($row) => implode('|', [$row['tutor_id'], $row['carrera'], $row['window'], $row['origen']]))
        ->sortBy(['tutor', 'carrera', 'window'])
        ->values()
        ->all();

    $duplicates[] = [
        'identificacion' => $id,
        'carreras' => $carreras,
        'rows' => $rows,
    ];

    foreach ($rows as $row) {
        $key = $row['tutor_id'] . '|' . $row['tutor'];
        if (!isset($tutors[$key])) {
            $tutors[$key] = [
                'tutor_id' => $row['tutor_id'],
                'tutor' => $row['tutor'],
                'resoluciones' => [],
                'estudiantes' => [],
                'carreras' => [],
            ];
        }
        $tutors[$key]['resoluciones'][$row['resolucion']] = true;
        $tutors[$key]['estudiantes'][$id] = true;
        $tutors[$key]['carreras'][$row['carrera']] = true;
    }
}

$tutorList = array_values(array_map(function ($item) {
    return [
        'tutor_id' => $item['tutor_id'],
        'tutor' => $item['tutor'],
        'resoluciones' => array_values(array_keys($item['resoluciones'])),
        'total_estudiantes_duplicados' => count($item['estudiantes']),
        'carreras' => array_values(array_keys($item['carreras'])),
        'estudiantes' => array_values(array_keys($item['estudiantes'])),
    ];
}, $tutors));

usort($tutorList, function ($a, $b) {
    return [$b['total_estudiantes_duplicados'], $a['tutor']] <=> [$a['total_estudiantes_duplicados'], $b['tutor']];
});

file_put_contents(__DIR__ . '/tmp_dupes_tutors.json', json_encode([
    'duplicates' => $duplicates,
    'tutors' => $tutorList,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo __DIR__ . '/tmp_dupes_tutors.json';
