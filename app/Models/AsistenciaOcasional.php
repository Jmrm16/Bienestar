<?php
// app/Models/AsistenciaOcasional.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsistenciaOcasional extends Model
{
    protected $table = 'asistencias_ocasionales';

    protected $fillable = [
        'period_id',
        'report_window_id',
        'tutor_id',
        'grupo_id',
        'identificacion',
        'fecha',
        'nombres_del_estudiante',
        'apellidos_del_estudiante',
        'codigo_estudiantil',
        'programa_academico',
        'asignatura_texto',
        'grupo_texto',
        'sexo',
        'grupo_priorizado',
        'horas',
        'unique_key',
    ];
}
