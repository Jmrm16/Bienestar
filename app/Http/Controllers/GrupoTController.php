<?php

namespace App\Http\Controllers;

use App\Models\GrupoT;
use App\Models\Tutor;
use App\Models\ReportPeriod;
use Illuminate\Http\Request;
use Carbon\Carbon;

class GrupoTController extends Controller
{
    /**
     * Crear un nuevo grupo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'        => 'required|string|max:255',
            'codigo'        => 'required|string|max:255',
            'docente'       => 'required|string|max:255',
            'carrera_id'    => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        // 🔥 Validar período activo Y vigente por fecha
        $today = Carbon::today();

        $period = ReportPeriod::where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->first();

        if (!$period) {
            return back()->withErrors([
                'periodo' => '❌ No existe un período activo y vigente para crear grupos.'
            ]);
        }

        // ✅ Validar duplicado por (codigo + carrera + asignatura + periodo)
        $exists = GrupoT::where('codigo', $request->codigo)
            ->where('carrera_id', $request->carrera_id)
            ->where('asignatura_id', $request->asignatura_id)
            ->where('period_id', $period->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'codigo' => '❌ Ya existe un grupo con este código para la misma carrera, asignatura y período.'
            ]);
        }

        GrupoT::create([
            'nombre'        => $request->nombre,
            'codigo'        => $request->codigo,
            'docente'       => $request->docente,
            'carrera_id'    => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
            'period_id'     => $period->id,
        ]);

        return back()->with('success', '✅ Grupo creado exitosamente.');
    }

    /**
     * Actualizar un grupo
     */
    public function update(Request $request, $id)
    {
        $grupo = GrupoT::findOrFail($id);

        $request->validate([
            'nombre'        => 'required|string|max:255',
            'codigo'        => 'required|string|max:255',
            'docente'       => 'required|string|max:255',
            'carrera_id'    => 'required|exists:carreras,id',
            'asignatura_id' => 'required|exists:asignaturas,id',
        ]);

        // 🔒 Bloquear edición si el período ya venció
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se puede editar un grupo de un período vencido.'
            ]);
        }

        // ✅ Validar duplicado por (codigo + carrera + asignatura + periodo) ignorando el mismo grupo
        $exists = GrupoT::where('codigo', $request->codigo)
            ->where('carrera_id', $request->carrera_id)
            ->where('asignatura_id', $request->asignatura_id)
            ->where('period_id', $grupo->period_id)
            ->where('id', '!=', $grupo->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'codigo' => '❌ Ya existe otro grupo con este código para la misma carrera, asignatura y período.'
            ]);
        }

        $grupo->update([
            'nombre'        => $request->nombre,
            'codigo'        => $request->codigo,
            'docente'       => $request->docente,
            'carrera_id'    => $request->carrera_id,
            'asignatura_id' => $request->asignatura_id,
        ]);

        return back()->with('success', '✅ Grupo actualizado correctamente.');
    }

    /**
     * Asignar tutor a un grupo
     */
    public function asignarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);

        // 🔒 Validar que el período del grupo esté vigente
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se pueden asignar tutores en períodos vencidos.'
            ]);
        }

        $tutor = Tutor::findOrFail($request->tutor_id);

        // 🔥 Validar asignatura correspondiente
        if (
            !$tutor->asignaturas()
                ->where('asignatura_id', $grupo->asignatura_id)
                ->exists()
        ) {
            return back()->withErrors([
                'tutor' => '❌ El tutor no dicta esta asignatura.'
            ]);
        }

        // 🔥 Rol del tutor
        $rol = $grupo->tutores()->count() === 0 ? 'principal' : 'secundario';

        $grupo->tutores()->attach($tutor->id, [
            'period_id' => $grupo->period_id,
            'rol'       => $rol,
        ]);

        return back()->with('success', "✅ Tutor asignado correctamente como {$rol}.");
    }

    /**
     * Quitar tutor del grupo
     */
    public function quitarTutor(Request $request, $grupoId)
    {
        $request->validate([
            'tutor_id' => 'required|exists:tutors,id',
        ]);

        $grupo = GrupoT::findOrFail($grupoId);

        $grupo->tutores()->detach($request->tutor_id);

        return back()->with('success', '✅ Tutor eliminado correctamente.');
    }

    /**
     * Eliminar grupo
     */
    public function destroy($id)
    {
        $grupo = GrupoT::find($id);

        if (!$grupo) {
            return back()->withErrors([
                'grupo' => '❌ Grupo no encontrado.'
            ]);
        }

        // 🔒 Evitar eliminar grupos de períodos vencidos
        $today = Carbon::today();

        $periodVigente = ReportPeriod::where('id', $grupo->period_id)
            ->where('is_active', true)
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->exists();

        if (!$periodVigente) {
            return back()->withErrors([
                'periodo' => '❌ No se puede eliminar un grupo de un período vencido.'
            ]);
        }

        $grupo->delete();

        return back()->with('success', '✅ Grupo eliminado correctamente.');
    }
}