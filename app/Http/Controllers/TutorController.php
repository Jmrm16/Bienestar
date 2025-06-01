<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use App\Models\Carrera;

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

        $grupos = GrupoT::with('carrera')->orderBy('nombre')->get();



        return Inertia::render('Tutores/index', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'carreras' => $carreras,
            'totalTutores' => $totalTutores,
            'grupos' => $grupos,
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
            'tipo_documento' => 'required|string|max:50',
            'documento' => 'required|string|max:50|unique:tutors',
            'lugar_expedicion' => 'required|string|max:255',
            'sexo' => 'required|string|max:10',
            'grupo_priorizado' => 'required|string|max:255',
            'sede' => 'required|string|max:255',
            'programa_academico' => 'required|string|max:255',
            'correo' => 'required|email|unique:tutors',
            'telefono' => 'required|string|max:20',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor = Tutor::create($request->only([
            'nombre', 'apellido', 'tipo_documento', 'documento',
            'lugar_expedicion', 'sexo', 'grupo_priorizado', 'sede',
            'programa_academico', 'correo', 'telefono'
        ]));

        $tutor->asignaturas()->sync($request->asignaturas);

        return redirect()->back()->with('success', 'Tutor registrado exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $tutor = Tutor::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento' => 'required|string|max:50',
            'documento' => 'required|string|max:50|unique:tutors,documento,' . $tutor->id,
            'lugar_expedicion' => 'required|string|max:255',
            'sexo' => 'required|string|max:10',
            'grupo_priorizado' => 'required|string|max:255',
            'sede' => 'required|string|max:255',
            'programa_academico' => 'required|string|max:255',
            'correo' => 'required|email|unique:tutors,correo,' . $tutor->id,
            'telefono' => 'required|string|max:20',
            'asignaturas' => 'required|array',
            'asignaturas.*' => 'exists:asignaturas,id',
        ]);

        $tutor->update($request->only([
            'nombre', 'apellido', 'tipo_documento', 'documento',
            'lugar_expedicion', 'sexo', 'grupo_priorizado', 'sede',
            'programa_academico', 'correo', 'telefono'
        ]));

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
