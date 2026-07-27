<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$windowIds = [7, 8];

$normalRows = DB::table('asistencias as a')
    ->leftJoin('grupo_t as g', 'g.id', '=', 'a.grupo_id')
    ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
    ->whereIn('a.report_window_id', $windowIds)
    ->selectRaw("TRIM(a.identificacion) as identificacion, COALESCE(c.nombre, 'SIN_CARRERA') as carrera, 'normal' as origen")
    ->get();

$ocasionalRows = DB::table('asistencias_ocasionales as ao')
    ->leftJoin('grupo_t as g', 'g.id', '=', 'ao.grupo_id')
    ->leftJoin('carreras as c', 'c.id', '=', 'g.carrera_id')
    ->whereIn('ao.report_window_id', $windowIds)
    ->selectRaw("TRIM(ao.identificacion) as identificacion, COALESCE(c.nombre, 'SIN_CARRERA') as carrera, 'ocasional' as origen")
    ->get();

$byStudent = [];
foreach ($normalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $byStudent[$id]['carreras'][$row->carrera] = true;
    $byStudent[$id]['origenes'][$row->origen] = true;
}
foreach ($ocasionalRows as $row) {
    $id = trim((string) $row->identificacion);
    if ($id === '') continue;
    $byStudent[$id]['carreras'][$row->carrera] = true;
    $byStudent[$id]['origenes'][$row->origen] = true;
}

$dupes = [];
foreach ($byStudent as $id => $info) {
    $carreras = array_keys($info['carreras'] ?? []);
    if (count($carreras) > 1) {
        sort($carreras);
        $dupes[] = [
            'identificacion' => $id,
            'carreras' => $carreras,
            'origenes' => array_keys($info['origenes'] ?? []),
        ];
    }
}

usort($dupes, fn($a, $b) => strcmp($a['identificacion'], $b['identificacion']));

echo json_encode([
    'count' => count($dupes),
    'rows' => $dupes,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
