<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo',
        'cedula_hash',
        'tipo_resolucion',
        'nombre',
        'apellido',
        'tipo_documento',
        'documento',
        'lugar_expedicion',
        'sexo',
        'grupo_priorizado',
        'sede',
        'carrera_id',
        'correo',
        'telefono',
        'activo',
        'ultimo_ingreso_at',
    ];

    protected $hidden = ['cedula_hash'];

    /**
     * 🔹 Relación Tutor ↔ Grupos (pivot)
     * (NO SE TOCA, ESTÁ PERFECTA)
     */
    public function grupos()
    {
        return $this->belongsToMany(
            GrupoT::class,
            'periodo_grupo_tutor',
            'tutor_id',
            'grupo_t_id'
        )
        ->withPivot(['period_id', 'rol'])
        ->withTimestamps();
    }

    /**
     * 🔥 NUEVO
     * Asignaciones reales del tutor
     * (periodo_grupo_tutor como MODELO)
     */
   

    /**
     * 🔥 NUEVO
     * Reportes del tutor (a través de asignaciones)
     */
    public function reports()
    {
        return $this->hasManyThrough(
            TutorReport::class,     // modelo final
         
            'tutor_id',             // FK en assignments
            'assignment_id',        // FK en tutor_reports
            'id',
            'id'
        );
    }

    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class);
    }

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }
}
