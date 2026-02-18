<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\ReportPeriod;
use App\Models\ReportWindow;
use App\Models\TutorReport;
use App\Models\Asistencia;
use Illuminate\Http\Request;

class PeriodInsightsController extends Controller
{
    public function show(Request $request, ReportPeriod $period)
    {
        // Ventanas del periodo
        $windows = ReportWindow::where('period_id', $period->id)->get(['id','name','tutor_type','is_published']);

        // Totales globales (por período)
        $totalAsistencias = Asistencia::where('period_id', $period->id)->count();
        $totalGrupos = Asistencia::where('period_id', $period->id)->distinct('grupo_id')->count('grupo_id');
        $totalTutoresConAsistencias = Asistencia::where('period_id', $period->id)->distinct('tutor_id')->count('tutor_id');

        // TutorReports (estado de envío por ventana/periodo)
        $totalSubmissions = TutorReport::where('period_id', $period->id)->count();
        $totalSubmitted = TutorReport::where('period_id', $period->id)->where('status', 'submitted')->count();
        $totalPending = TutorReport::where('period_id', $period->id)->where('status', 'pending')->count();

        // Resumen por ventana
        $byWindow = $windows->map(function ($w) use ($period) {
            $asistenciasCount = Asistencia::where('period_id', $period->id)
                ->where('report_window_id', $w->id)
                ->count();

            $tutoresQueSubieron = TutorReport::where('period_id', $period->id)
                ->where('window_id', $w->id)
                ->where('status', 'submitted')
                ->count();

            $tutoresPendientes = TutorReport::where('period_id', $period->id)
                ->where('window_id', $w->id)
                ->where('status', 'pending')
                ->count();

            return [
                'window_id' => $w->id,
                'name' => $w->name,
                'tutor_type' => $w->tutor_type,
                'is_published' => (bool) $w->is_published,
                'asistencias' => $asistenciasCount,
                'submitted' => $tutoresQueSubieron,
                'pending' => $tutoresPendientes,
            ];
        })->values();

        return response()->json([
            'period' => [
                'id' => $period->id,
                'code' => $period->code,
                'name' => $period->name ?? null,
            ],
            'totals' => [
                'asistencias' => $totalAsistencias,
                'grupos' => $totalGrupos,
                'tutores_con_asistencias' => $totalTutoresConAsistencias,
                'submissions_total' => $totalSubmissions,
                'submitted' => $totalSubmitted,
                'pending' => $totalPending,
            ],
            'by_window' => $byWindow,
        ]);
    }
}
