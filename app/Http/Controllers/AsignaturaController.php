<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
use App\Models\Carrera;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Tutor;

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
    $asignatura->load('carrera', 'grupos.carrera');

    // ✅ Filtrar tutores que dictan esta asignatura
    $tutores = \App\Models\Tutor::whereHas('asignaturas', function ($query) use ($asignatura) {
        $query->where('asignatura_id', $asignatura->id);
    })->get();

    return Inertia::render('Tutores/ShowAsignatura', [
        'asignatura' => $asignatura,
        'tutores' => $tutores,
        'carreras' => \App\Models\Carrera::all(),
        'asignaturas' => \App\Models\Asignatura::all(),
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
