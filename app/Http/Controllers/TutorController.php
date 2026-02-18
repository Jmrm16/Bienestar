<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\GrupoT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TutorController extends Controller
{
    /**
     * Mostrar todos los tutores y recursos relacionados.
     */
    public function index()
    {
        $tutores = Tutor::with(['asignaturas', 'carrera'])->get();
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
            'tutor' => $tutor->load(['asignaturas', 'carrera']),
        ]);
    }

    /**
     * Registrar un nuevo tutor.
     */
    public function store(Request $request)
    {
        $request->validate([
            'codigo'            => 'required|string|max:50|unique:tutors,codigo',
            'tipo_resolucion'   => 'required|in:R1,R2', // ✅ NUEVO
            'nombre'            => 'required|string|max:255',
            'apellido'          => 'required|string|max:255',
            'tipo_documento'    => 'required|string|max:50',
            'documento'         => 'required|string|max:50|unique:tutors,documento',
            'lugar_expedicion'  => 'required|string|max:255',
            'sexo'              => 'required|string|max:10',
            'grupo_priorizado'  => 'required|string|max:255',
            'sede'              => 'required|string|max:255',
            'carrera_id'        => 'required|exists:carreras,id',
            'correo'            => 'required|email|unique:tutors,correo',
            'telefono'          => 'required|string|max:20',
            'asignaturas'       => 'required|array',
            'asignaturas.*'     => 'exists:asignaturas,id',
            'activo'            => 'nullable|boolean',
        ]);

        $tutor = Tutor::create([
            'codigo'           => $request->codigo,
            'tipo_resolucion'  => $request->tipo_resolucion, // ✅ NUEVO
            'nombre'           => $request->nombre,
            'apellido'         => $request->apellido,
            'tipo_documento'   => $request->tipo_documento,
            'documento'        => $request->documento,
            'cedula_hash'      => Hash::make($request->documento),
            'lugar_expedicion' => $request->lugar_expedicion,
            'sexo'             => $request->sexo,
            'grupo_priorizado' => $request->grupo_priorizado,
            'sede'             => $request->sede,
            'carrera_id'       => $request->carrera_id,
            'correo'           => $request->correo,
            'telefono'         => $request->telefono,
            'activo'           => $request->boolean('activo', true),
        ]);

        $tutor->asignaturas()->sync($request->asignaturas);

        return redirect()->back()->with('success', 'Tutor registrado exitosamente.');
    }

    /**
     * Actualizar un tutor.
     */
    public function update(Request $request, $id)
    {
        $tutor = Tutor::findOrFail($id);

        $request->validate([
            'codigo'            => 'required|string|max:50|unique:tutors,codigo,' . $tutor->id,
            'tipo_resolucion'   => 'required|in:R1,R2', // ✅ NUEVO
            'nombre'            => 'required|string|max:255',
            'apellido'          => 'required|string|max:255',
            'tipo_documento'    => 'required|string|max:50',
            'documento'         => 'required|string|max:50|unique:tutors,documento,' . $tutor->id,
            'lugar_expedicion'  => 'required|string|max:255',
            'sexo'              => 'required|string|max:10',
            'grupo_priorizado'  => 'required|string|max:255',
            'sede'              => 'required|string|max:255',
            'carrera_id'        => 'required|exists:carreras,id',
            'correo'            => 'required|email|unique:tutors,correo,' . $tutor->id,
            'telefono'          => 'required|string|max:20',
            'asignaturas'       => 'required|array',
            'asignaturas.*'     => 'exists:asignaturas,id',
            'activo'            => 'nullable|boolean',
            'reset_password'    => 'nullable|boolean',
        ]);

        $payload = [
            'codigo'           => $request->codigo,
            'tipo_resolucion'  => $request->tipo_resolucion, // ✅ NUEVO
            'nombre'           => $request->nombre,
            'apellido'         => $request->apellido,
            'tipo_documento'   => $request->tipo_documento,
            'documento'        => $request->documento,
            'lugar_expedicion' => $request->lugar_expedicion,
            'sexo'             => $request->sexo,
            'grupo_priorizado' => $request->grupo_priorizado,
            'sede'             => $request->sede,
            'carrera_id'       => $request->carrera_id,
            'correo'           => $request->correo,
            'telefono'         => $request->telefono,
            'activo'           => $request->boolean('activo', $tutor->activo),
        ];

        if ($request->documento !== $tutor->documento || $request->boolean('reset_password')) {
            $payload['cedula_hash'] = Hash::make($request->documento);
        }

        $tutor->update($payload);
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
