<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorPeriodResolution extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_id',
        'tutor_id',
        'tipo_resolucion',
    ];

    public function period()
    {
        return $this->belongsTo(ReportPeriod::class, 'period_id');
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'tutor_id');
    }
}
