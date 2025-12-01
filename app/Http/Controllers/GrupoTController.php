<?php

namespace App\Http\Controllers;

use App\Models\GrupoT;
use App\Models\Tutor;
use Illuminate\Http\Request;

class GrupoTController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'docente' => 'required|string|max:255', // 👈 NUEVO
            'carrera_id' => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        GrupoT::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'docente' => $request->docente,        // 👈 NUEVO
            'carrera_id' => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
        ]);

        return redirect()->back()->with('success', 'Grupo registrado exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $grupo = GrupoT::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
            'docente' => 'required|string|max:255', // 👈 NUEVO
            'carrera_id' => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        $grupo->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
            'docente' => $request->docente,        // 👈 NUEVO
            'carrera_id' => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
        ]);

        return redirect()->back()->with('success', 'Grupo actualizado correctamente.');
    }

    public function destroy($id)
    {
        $grupo = GrupoT::find($id);

        if (!$grupo) {
            return back()->with('error', '❌ Grupo no encontrado.');
        }

        $grupo->delete();

        return back()->with('success', '✅ Grupo eliminado correctamente.');
    }

    public function asignarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);
        $tutorId = $request->input('tutor_id');

        if ($grupo->tutores()->where('tutor_id', $tutorId)->exists()) {
            return redirect()->back()->with('error', '❌ El tutor ya está asignado a este grupo.');
        }

        $tutor = Tutor::findOrFail($tutorId);

        if (!$tutor->asignaturas()->where('asignatura_id', $grupo->asignatura_id)->exists()) {
            return redirect()->back()->with('error', '❌ El tutor no dicta esta asignatura.');
        }

        $grupo->tutores()->attach($tutorId);

        return redirect()->back()->with('success', '✅ Tutor asignado correctamente.');
    }

    public function quitarTutor(Request $request, $grupoId)
    {
        $grupo = GrupoT::findOrFail($grupoId);
        $grupo->tutores()->detach();

        return redirect()->back()->with('success', '👤 Tutor eliminado del grupo.');
    }
}
