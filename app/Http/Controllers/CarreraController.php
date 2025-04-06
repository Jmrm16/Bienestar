<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CarreraController extends Controller
{
    // Mostrar todas las carreras


    // Guardar una nueva carrera
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
        ]);

        Carrera::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
        ]);

        return redirect()->route('estudiantes.index')->with('success', 'Carrera registrada exitosamente.');
    }

    // Actualizar una carrera existente
    public function update(Request $request, Carrera $carrera)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
        ]);

        $carrera->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
        ]);

        return redirect()->route('estudiantes.index')->with('success', 'Carrera actualizada correctamente.');
    }

    // Eliminar una carrera
    public function destroy(Carrera $carrera)
    {
        $carrera->delete();

        return redirect()->back()->with('success', 'Carrera eliminada correctamente.');
    }
}
