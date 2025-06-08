<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
use App\Models\Carrera;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AsignaturaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asignaturas',
            'docente' => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        Asignatura::create($request->only(['nombre', 'codigo', 'docente', 'carrera_id']));

        return redirect()->route('tutores.index')->with('success', 'Asignatura creada exitosamente.');
    }

            public function show(Asignatura $asignatura)
            {
                $asignatura->load('carrera', 'grupos');

                return Inertia::render('Tutores/ShowAsignatura', [
                    'asignatura' => $asignatura,
                    'carreras' => Carrera::all(),
                    'asignaturas' => Asignatura::all(), // <-- esto es clave
                ]);
            }


    public function update(Request $request, Asignatura $asignatura)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asignaturas,codigo,' . $asignatura->id,
            'docente' => 'required|string|max:255',
        ]);

        $asignatura->update($request->only(['nombre', 'codigo', 'docente']));

        return redirect()->route('tutores.index')->with('success', 'Asignatura actualizada exitosamente.');
    }

    public function destroy(Asignatura $asignatura)
    {
        $asignatura->delete();

        return redirect()->route('tutores.index')->with('success', 'Asignatura eliminada exitosamente.');
    }
}
