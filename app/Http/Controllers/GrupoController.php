<?php

namespace App\Http\Controllers;

use App\Models\Grupo;
use App\Models\Carrera;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrupoController extends Controller
{


    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        Grupo::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()->back()->with('success', 'Grupo registrado exitosamente.');
    }

    public function update(Request $request, Grupo $grupo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        $grupo->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()->back()->with('success', 'Grupo actualizado correctamente.');
    }

    public function destroy(Grupo $grupo)
    {
        $grupo->delete();
        return redirect()->back()->with('success', 'Grupo eliminado correctamente.');
    }
}
