<?php

namespace App\Http\Controllers;

use App\Models\ReportPeriod;
use App\Models\ReportWindow;
use App\Models\Tutor;
use App\Models\TutorReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // ---------- Periodos ----------
    public function periodsIndex()
    {
        $periods = ReportPeriod::withCount('windows')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Informe/PeriodsIndex', ['periods' => $periods]);
    }

    public function periodsStore(Request $r)
    {
        $data = $r->validate([
            'code'       => 'required|string|max:20|unique:report_periods,code',
            'name'       => 'nullable|string|max:120',
            'starts_at'  => 'nullable|date',
            'ends_at'    => 'nullable|date|after_or_equal:starts_at',
            'is_active'  => 'sometimes|boolean',
        ]);
        $data['is_active'] = (bool)($data['is_active'] ?? true);

        ReportPeriod::create($data);

        return back()->with('success', 'Periodo creado');
    }

    public function periodsUpdate(Request $r, ReportPeriod $period)
    {
        $data = $r->validate([
            'code'       => 'required|string|max:20|unique:report_periods,code,' . $period->id,
            'name'       => 'nullable|string|max:120',
            'starts_at'  => 'nullable|date',
            'ends_at'    => 'nullable|date|after_or_equal:starts_at',
            'is_active'  => 'sometimes|boolean',
        ]);
        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool)$data['is_active'];
        }

        $period->update($data);

        return back()->with('success', 'Periodo actualizado');
    }

    public function periodsDestroy(ReportPeriod $period)
    {
        $period->delete();

        return back()->with('success', 'Periodo eliminado');
    }

    // ---------- Ventanas / Entregas ----------
    public function windowsIndex(ReportPeriod $period)
    {
        $windows = $period->windows()
            ->orderBy('open_at')
            ->get();

        return Inertia::render('Informe/WindowsIndex', [
            'period'  => $period,
            'windows' => $windows,
        ]);
    }

    public function windowsStore(Request $r, ReportPeriod $period)
    {
        $data = $r->validate([
            'name'          => 'required|string|max:120',
            'tutor_type'    => 'required|in:R1,R2',
            'open_at'       => 'required|date',
            'due_at'        => 'nullable|date|after_or_equal:open_at',
            'close_at'      => 'nullable|date|after_or_equal:due_at',
            'instructions'  => 'nullable|string',
            'is_published'  => 'sometimes|boolean',

            // Campos extra (si creaste columnas en report_windows)
            'category'       => 'nullable|string|max:50',  // p.ej. HORARIO | INFORME
            'required_items' => 'nullable|array',          // checklist de strings
            'required_items.*' => 'string|max:120',
        ]);

        $data['is_published'] = (bool)($data['is_published'] ?? true);
        $data['period_id']    = $period->id;

        ReportWindow::create($data);

        return back()->with('success', 'Entrega creada');
    }

    public function windowsUpdate(Request $r, ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        $data = $r->validate([
            'name'          => 'required|string|max:120',
            'tutor_type'    => 'required|in:R1,R2',
            'open_at'       => 'required|date',
            'due_at'        => 'nullable|date|after_or_equal:open_at',
            'close_at'      => 'nullable|date|after_or_equal:due_at',
            'instructions'  => 'nullable|string',
            'is_published'  => 'sometimes|boolean',

            'category'       => 'nullable|string|max:50',
            'required_items' => 'nullable|array',
            'required_items.*' => 'string|max:120',
        ]);

        if (array_key_exists('is_published', $data)) {
            $data['is_published'] = (bool)$data['is_published'];
        }

        $window->update($data);

        return back()->with('success', 'Entrega actualizada');
    }

    public function windowsDestroy(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        $window->delete();

        return back()->with('success', 'Entrega eliminada');
    }

    // ---------- Asignación masiva ----------
    public function windowsAssignAll(ReportPeriod $period, ReportWindow $window)
    {
        abort_unless($window->period_id === $period->id, 404);

        DB::transaction(function () use ($window) {
            // Asegúrate de tener en tutors la columna 'tipo_resolucion' (R1/R2)
            $tutorIds = Tutor::where('tipo_resolucion', $window->tutor_type)->pluck('id');

            foreach ($tutorIds as $tid) {
                TutorReport::firstOrCreate(
                    ['tutor_id' => $tid, 'window_id' => $window->id],
                    ['status' => 'pending']
                );
            }
        });

        return back()->with('success', 'Asignaciones creadas para todos los tutores ' . $window->tutor_type);
    }
}
