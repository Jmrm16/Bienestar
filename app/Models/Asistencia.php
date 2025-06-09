<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $fillable = [
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
}
