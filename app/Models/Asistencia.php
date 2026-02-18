<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $table = 'asistencias';

    // ✅ IMPORTANTE:
    // Agregamos report_window_id y tutor_id para que updateOrCreate los inserte.
    // Quitamos total_asistencias porque ahora guardas 1 fila por fecha (el total se calcula con COUNT).
    protected $fillable = [
        'grupo_id',
        'period_id',
        'report_window_id',
        'tutor_id',

        'nombres_del_estudiante',
        'apellidos_del_estudiante',
        'identificacion',
        'codigo_estudiantil',
        'programa_academico',
        'sexo',
        'grupo_priorizado',

        'fecha',
        'horas',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    /* =========================
       RELACIONES
    ========================= */

    public function grupo()
    {
        return $this->belongsTo(GrupoT::class, 'grupo_id');
    }

    public function periodo()
    {
        return $this->belongsTo(ReportPeriod::class, 'period_id');
    }

    public function window()
    {
        return $this->belongsTo(ReportWindow::class, 'report_window_id');
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'tutor_id');
    }
}
