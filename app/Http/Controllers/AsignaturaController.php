<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
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
        ]);

        Asignatura::create($request->only(['nombre', 'codigo', 'docente'])); // 🔹 Evita `$request->all()`

        return redirect()->route('tutores.index')->with('success', 'Asignatura creada exitosamente.');
    }

    public function update(Request $request, Asignatura $asignatura)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asignaturas,codigo,' . $asignatura->id,
            'docente' => 'required|string|max:255',
        ]);

        $asignatura->update($request->only(['nombre', 'codigo', 'docente'])); // 🔹 Evita `$request->all()`

        return redirect()->route('tutores.index')->with('success', 'Asignatura actualizada exitosamente.');
    }

    public function destroy(Asignatura $asignatura)
    {
        $asignatura->delete();

        return redirect()->route('tutores.index')->with('success', 'Asignatura eliminada exitosamente.');
    }
}
