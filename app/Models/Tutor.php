<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'apellido',
        'tipo_documento',
        'documento',
        'lugar_expedicion',
        'sexo',
        'grupo_priorizado',
        'sede',
        'programa_academico',
        'correo',
        'telefono',
    ];

    public function grupos()
    {
        return $this->belongsToMany(GrupoT::class, 'tutor_id', 'grupo_t_id');
    }

    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class);
    }
}