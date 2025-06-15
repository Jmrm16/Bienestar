<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Estudiante;
use App\Models\GrupoT;
use App\Models\Asignatura;
use App\Models\Asistencia;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
{
    $asistenciasPorFecha = Asistencia::select(
        DB::raw('DATE(fecha) as fecha'),
        DB::raw('COUNT(*) as total')
    )
    ->groupBy('fecha')
    ->orderBy('fecha', 'desc')
    ->take(7) // últimas 7 fechas
    ->get();

    return Inertia::render('dashboard', [
        'totalTutores' => Tutor::count(),
        'totalAsignaturas' => Asignatura::count(),
        'totalGrupos' => GrupoT::count(),
        'asistenciasPorFecha' => $asistenciasPorFecha,
    ]);
}
}
