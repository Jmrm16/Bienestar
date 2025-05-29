<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tutor;
use App\Models\Asignatura;
use Inertia\Inertia;

class TutoriasController extends Controller
{
       public function index()
    {
        // Carga los tutores con sus asignaturas relacionadas
        $tutores = Tutor::with('asignaturas')->get();
        $asignaturas = Asignatura::all();
        $totalTutores = Tutor::count();
        $carreras = \App\Models\Carrera::all();


        return Inertia::render('Permanencia_vistas/Tutorias', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'totalTutores' => $totalTutores,
            'carreras' => $carreras,
        ]);
    }
}
