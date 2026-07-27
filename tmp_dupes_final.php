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
$method = new ReflectionMethod(ReportController::class, 'resolveCareerNodeForTree');
$method->setAccessible(true);
$careerCatalog = Carrera::query()->get(['id', 'nombre', 'codigo']);

$students = [];

$normalRows = DB::table('asistencias as a')
    ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
    ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
    ->whereIn('a.report_window_id', $windowIds)
    ->selectRaw("TRIM(a.identificacion) as identificacion, COALESCE(c.nombre, a.programa_academico, 'Sin carrera') as carrera, 'normal' as origen")
    ->distinct()
    ->get();

foreach ($normalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $careerName = trim((string) $row->carrera);
    $students[$id]['carreras'][$careerName] = true;
    $students[$id]['origenes'][$row->origen] = true;
}

$ocasionalRows = DB::table('asistencias_ocasionales as ao')
    ->whereIn('ao.report_window_id', $windowIds)
    ->selectRaw("TRIM(ao.identificacion) as identificacion, COALESCE(NULLIF(TRIM(ao.programa_academico), ''), 'Sin carrera') as programa_academico, 'ocasional' as origen")
    ->distinct()
    ->get();

foreach ($ocasionalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $careerNode = $method->invoke($controller, trim((string) $row->programa_academico), $careerCatalog);
    $careerName = trim((string) ($careerNode['name'] ?? 'Sin carrera'));
    $students[$id]['carreras'][$careerName] = true;
    $students[$id]['origenes'][$row->origen] = true;
}

$dupes = [];
foreach ($students as $id => $info) {
    $carreras = array_keys($info['carreras'] ?? []);
    if (count($carreras) > 1) {
        sort($carreras);
        $dupes[] = [
            'identificacion' => $id,
            'carreras' => $carreras,
            'origenes' => array_values(array_keys($info['origenes'] ?? [])),
        ];
    }
}

usort($dupes, fn($a, $b) => strcmp($a['identificacion'], $b['identificacion']));

echo json_encode([
    'count' => count($dupes),
    'rows' => $dupes,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
