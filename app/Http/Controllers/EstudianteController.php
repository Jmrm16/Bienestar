<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use App\Models\Carrera;
use App\Models\Grupo;

use Illuminate\Http\Request;


class EstudianteController extends Controller
{
    public function index()
    {
        return inertia('Estudiantes/index', [
            'carreras' => Carrera::with('grupos')->get(),
            'estudiantes' => Estudiante::with(['grupo.carrera', 'tutor'])->get(),
            'grupos' => Grupo::with('carrera')->orderBy('nombre')->get(),
            'carreras' => Carrera::orderBy('nombre')->get(),
        ]);

        
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'grupo_id' => 'required|exists:grupos,id',
            'tutor_id' => 'nullable|exists:tutors,id',
        ]);

        Estudiante::create([
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'grupo_id' => $request->grupo_id,
            'tutor_id' => $request->tutor_id,
        ]);

        return redirect()->back()->with('success', 'Estudiante registrado correctamente.');
    }

    public function destroy(Estudiante $estudiante)
    {
        $estudiante->delete();
        return redirect()->back()->with('success', 'Estudiante eliminado.');
    }
}
