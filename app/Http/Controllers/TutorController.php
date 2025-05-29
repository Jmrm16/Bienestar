<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\Grupo;
use App\Models\GrupoT;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TutorController extends Controller
{
    /**
     * Mostrar todos los tutores y recursos relacionados.
     */
    public function index()
    {
        $tutores = Tutor::with('asignaturas')->get();
        $asignaturas = Asignatura::all();
        $totalTutores = Tutor::count();
        $carreras = Carrera::all();

        $grupos = Grupo::with('carrera')->get();    // carga grupos normales con carrera relacionada
        $gruposT = GrupoT::with('carrera')->get();  // carga gruposT con carrera relacionada

        return Inertia::render('Tutores/index', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'carreras' => $carreras,
            'totalTutores' => $totalTutores,
            'grupos' => $grupos,
            'gruposT' => $gruposT,
        ]);
    }

    /**
     * Mostrar perfil de un tutor.
     */
    public function perfil(Tutor $tutor)
    {
        return Inertia::render('Tutores/tutorprofile', [
            'tutor' => $tutor->load('asignaturas'),
        ]);
    }

    /**
     * Registrar un nuevo tutor.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor = Tutor::create([
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
        ]);

        $tutor->asignaturas()->sync($request->asignaturas);

        return redirect()->back()->with('success', 'Tutor registrado exitosamente.');
    }

    /**
     * Actualizar un tutor existente.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor = Tutor::findOrFail($id);
        $tutor->update($request->only(['nombre', 'apellido']));
        $tutor->asignaturas()->sync($request->asignaturas);

        return redirect()->route('tutores.index')->with('success', 'Tutor actualizado correctamente.');
    }

    /**
     * Eliminar un tutor.
     */
    public function destroy($id)
    {
        $tutor = Tutor::findOrFail($id);
        $tutor->delete();

        return redirect()->back()->with('success', 'Tutor eliminado correctamente.');
    }
}
