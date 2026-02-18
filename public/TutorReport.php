<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TutorReport extends Model
{
    use HasFactory;

    protected $table = 'tutor_reports';

    protected $fillable = [
        'tutor_id',
        'window_id',
        'assignment_id', // 🔥🔥🔥 CLAVE (FALTABA)
        'status',
        'submitted_at',
        'file_path',
        'hours_total',
        'notes',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    /* ================= RELACIONES ================= */

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    public function window()
    {
        return $this->belongsTo(ReportWindow::class, 'window_id');
    }

    // 🔥 Relación con la asignación tutor–grupo–periodo
    public function assignment()
    {
        return $this->belongsTo(
            \Illuminate\Database\Eloquent\Model::class,
            'assignment_id'
        );
    }

    public function files()
    {
        return $this->hasMany(
            TutorReportFile::class,
            'tutor_report_id'
        );
    }
}
