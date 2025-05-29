<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Estudiante;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTutores = Tutor::count();
        $totalEstudiantes = Estudiante::count();

        return Inertia::render('dashboard', [
            'totalTutores' => $totalTutores,
            'totalEstudiantes' => $totalEstudiantes,
        ]);
    }
}
