<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $fillable = [
    'grupo_id',
    'nombres_del_estudiante',
    'apellidos_del_estudiante',
    'identificacion',
    'codigo_estudiantil',
    'programa_academico',
    'sexo',
    'grupo_priorizado',
    'fecha',
    'horas',
    'total_asistencias', // ✅ nuevo campo
];


    protected $casts = [
        'fecha' => 'date',
    ];

    /**
     * Relación: Una asistencia pertenece a un grupo tipo T
     */
    public function grupo()
    {
        return $this->belongsTo(GrupoT::class, 'grupo_id');
    }
}
