<?php
namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Estudiante;
use App\Models\Acompanamiento;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTutores = Tutor::count();
        $totalEstudiantes = Estudiante::count();
        $totalAcompanamientos = Acompanamiento::count();

        return Inertia::render('Dashboard', [
            'totalTutores' => $totalTutores,
            'totalEstudiantes' => $totalEstudiantes,
            'totalAcompanamientos' => $totalAcompanamientos,
        ]);
    }
}
