<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use Inertia\Inertia;

class TutoriasController extends Controller
{
    public function index()
    {
        $tutores = Tutor::with([
            'asignaturas:id,nombre',
            'carrera:id,nombre',
        ])
            ->orderBy('nombre')
            ->orderBy('apellido')
            ->get()
            ->map(function (Tutor $tutor) {
                return [
                    'id' => $tutor->id,
                    'nombre' => $tutor->nombre,
                    'apellido' => $tutor->apellido,
                    'carrera' => $tutor->carrera?->nombre ?? 'Carrera no asignada',
                    'carrera_id' => $tutor->carrera_id,
                    'correo' => $tutor->correo,
                    'telefono' => $tutor->telefono,
                    'sede' => $tutor->sede,
                    'calificacion' => $tutor->calificacion ?? null,
                    'imagen' => $tutor->imagen ?? null,
                    'asignaturas' => $tutor->asignaturas->map(function (Asignatura $asignatura) {
                        return [
                            'id' => $asignatura->id,
                            'nombre' => $asignatura->nombre,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $asignaturas = Asignatura::orderBy('nombre')->get(['id', 'nombre']);
        $carreras = \App\Models\Carrera::orderBy('nombre')->get(['id', 'nombre']);
        $totalTutores = $tutores->count();

        return Inertia::render('Permanencia_vistas/Tutorias', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'totalTutores' => $totalTutores,
            'carreras' => $carreras,
        ]);
    }
}
