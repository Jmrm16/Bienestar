<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nota extends Model
{
    protected $fillable = [
        'codigo',
        'apellidos',
        'nombres',
        'tipo_identificacion',
        'identificacion',

        'ide_programa',
        'programa',
        'semestre',

        'ide_materia',
        'materia',
        'grupo',

        'nota_1',
        'nota_2',
        'nota_3',
        'definitiva',
        'habilitacion',
        'final',

        'anio',
        'periodo',
        'period_id',   // 👈 IMPORTANTE
        'created_by',
    ];

    public function period()
    {
        return $this->belongsTo(ReportPeriod::class, 'period_id');
    }
}
