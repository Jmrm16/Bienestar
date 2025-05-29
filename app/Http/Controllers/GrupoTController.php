<?php

namespace App\Http\Controllers;

use App\Models\GrupoT;
use Illuminate\Http\Request;

class GrupoTController extends Controller
{
    /**
     * Registrar un nuevo grupo.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        GrupoT::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()->back()->with('success', 'Grupo registrado exitosamente.');
    }

    /**
     * Actualizar un grupo existente.
     */
    public function update(Request $request, GrupoT $grupo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
            'tutor_id' => 'nullable|exists:tutors,id',
        ]);

        $grupo->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'carrera_id' => $request->carrera_id,
            'tutor_id' => $request->tutor_id,
        ]);

        return redirect()->back()->with('success', 'Grupo actualizado correctamente.');
    }

    /**
     * Eliminar un grupo.
     */
    public function destroy(GrupoT $grupo)
    {
        $grupo->delete();

        return redirect()->back()->with('success', 'Grupo eliminado correctamente.');
    }

    /**
     * Asignar un tutor a un grupo sin eliminar los ya existentes.
     */
    public function asignarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);
        $tutorId = $request->input('tutor_id');

        // Usamos syncWithoutDetaching para agregar tutor sin eliminar otros asignados
        $grupo->tutores()->syncWithoutDetaching([$tutorId]);

        return response()->json(['message' => 'Tutor asignado correctamente.']);
    }
}
