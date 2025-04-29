<?php

namespace App\Http\Controllers;

use App\Models\Grupo;

use Illuminate\Http\Request;


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
            'tutor_id' => 'nullable|exists:tutors,id', // <- AÑADIDO
        ]);
    
        $grupo->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'carrera_id' => $request->carrera_id,
            'tutor_id' => $request->tutor_id, // <- AÑADIDO
        ]);
    
        return redirect()->back()->with('success', 'Grupo actualizado correctamente.');
    }

    public function destroy(Grupo $grupo)
    {
        $grupo->delete();
        return redirect()->back()->with('success', 'Grupo eliminado correctamente.');
    }
    public function asignarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);
    
        $grupo = Grupo::findOrFail($grupoId);
        $tutorId = $request->input('tutor_id');
    
        // Usamos syncWithoutDetaching para agregar sin borrar otros
        $grupo->tutores()->syncWithoutDetaching([$tutorId]);
    
        return response()->json(['message' => 'Tutor asignado correctamente.']);
    }
}
