<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TutorController extends Controller
{
    public function index()
    {
        // Carga los tutores con sus asignaturas relacionadas
        $tutores = Tutor::with('asignaturas')->get();
        $asignaturas = Asignatura::all();
        $totalTutores = Tutor::count();

        return Inertia::render('Tutores/index', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'totalTutores' => $totalTutores,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'apellido' => 'required|string',
            'grupos' => 'required|integer',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor = Tutor::create($request->only(['nombre', 'apellido', 'grupos']));
        $tutor->asignaturas()->attach($request->asignaturas);

        return redirect()->route('tutores.index')->with('success', 'Tutor agregado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string',
            'apellido' => 'required|string',
            'grupos' => 'required|integer',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor = Tutor::findOrFail($id);
        $tutor->update($request->only(['nombre', 'apellido', 'grupos']));
        $tutor->asignaturas()->sync($request->asignaturas);

        return redirect()->route('tutores.index')->with('success', 'Tutor actualizado correctamente.');
    }

    public function destroy(Tutor $tutor)
    {
        $tutor->asignaturas()->detach(); // Borra las relaciones antes de eliminar
        $tutor->delete();

        return redirect()->route('tutores.index')->with('success', 'Tutor eliminado correctamente.');
    }
}
