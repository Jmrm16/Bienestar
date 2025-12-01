<?php

namespace App\Http\Controllers;

use App\Models\Asignatura;
use App\Models\Carrera;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AsignaturaController extends Controller
{
    /**
     * Listado de asignaturas.
     */
    public function index()
    {
        $asignaturas = Asignatura::with('carrera')
            ->orderBy('nombre')
            ->get();

        $carreras = Carrera::orderBy('nombre')->get();

        return Inertia::render('Asignaturas/index', [
            'asignaturas' => $asignaturas,
            'carreras'    => $carreras,
        ]);
    }

    /**
     * Crear una nueva asignatura.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'     => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        Asignatura::create([
            'nombre'     => $request->nombre,
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura creada exitosamente.');
    }

    /**
     * Ver detalle de una asignatura.
     */
    public function show(Asignatura $asignatura)
    {
        $asignatura->load([
            'carrera',
            'grupos.carrera',
            'grupos.tutores',
        ]);

        // Tutores que dictan esta asignatura
        $tutores = Tutor::whereHas('asignaturas', function ($q) use ($asignatura) {
            $q->where('asignatura_id', $asignatura->id);
        })->get();

        return Inertia::render('Asignaturas/ShowAsignatura', [
            'asignatura' => $asignatura,
            'tutores'    => $tutores,
        ]);
    }

    /**
     * Actualizar una asignatura.
     */
    public function update(Request $request, Asignatura $asignatura)
    {
        $request->validate([
            'nombre'     => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        $asignatura->update([
            'nombre'     => $request->nombre,
            'carrera_id' => $request->carrera_id,
        ]);

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura actualizada exitosamente.');
    }

    /**
     * Eliminar una asignatura.
     */
    public function destroy(Asignatura $asignatura)
    {
        $asignatura->delete();

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura eliminada correctamente.');
    }
}
