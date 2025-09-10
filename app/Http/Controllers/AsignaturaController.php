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
     * Listado de asignaturas (sin paginación).
     */
    public function index()
    {
        $asignaturas = Asignatura::with('carrera')
            ->withCount(['grupos', 'tutores'])
            ->orderBy('nombre')
            ->get(); // ← SIN paginate()

        // Para el modal de crear asignatura
        $carreras = Carrera::orderBy('nombre')->get();

        return Inertia::render('Asignaturas/index', [
            'asignaturas' => $asignaturas,          // array plano
            'total'       => $asignaturas->count(), // opcional (métrica)
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
            'codigo'     => 'required|string|max:50|unique:asignaturas,codigo',
            'docente'    => 'required|string|max:255',
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        Asignatura::create($request->only(['nombre', 'codigo', 'docente', 'carrera_id']));

        return redirect()
            ->route('asignaturas.index')
            ->with('success', 'Asignatura creada exitosamente.');
    }

    /**
     * Ver detalle de una asignatura.
     */
    public function show(Asignatura $asignatura)
    {
        // Precarga de relaciones para la vista
        $asignatura->load([
            'carrera',
            'grupos.carrera',
            'grupos.tutores',
        ]);

        // Tutores que dictan esta asignatura (requires belongsToMany en modelos)
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
            'nombre'  => 'required|string|max:255',
            'codigo'  => 'required|string|max:50|unique:asignaturas,codigo,' . $asignatura->id,
            'docente' => 'required|string|max:255',
            // si también permites cambiar la carrera:
            'carrera_id' => 'sometimes|nullable|exists:carreras,id',
        ]);

        $asignatura->update($request->only(['nombre', 'codigo', 'docente', 'carrera_id']));

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
