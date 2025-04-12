<?php

// app/Http/Controllers/AcompanamientoGrupoController.php
namespace App\Http\Controllers;

use App\Models\AcompanamientoGrupo;
use App\Models\AcompanamientoCarrera;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcompanamientoGrupoController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:100|unique:acompanamiento_grupos,codigo',
            'acompanamiento_carrera_id' => 'required|exists:acompanamiento_carreras,id',
        ]);

        AcompanamientoGrupo::create($data);

        return redirect()->back()->with('success', 'Grupo agregado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $grupo = AcompanamientoGrupo::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:100|unique:acompanamiento_grupos,codigo,' . $grupo->id,
        ]);

        $grupo->update($data);

        return redirect()->back()->with('success', 'Grupo actualizado correctamente.');
    }

    public function destroy($id)
    {
        AcompanamientoGrupo::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Grupo eliminado.');
    }
}

