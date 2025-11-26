<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo',            // para login del portal
        'cedula_hash',       // hash del documento
        'nombre',
        'apellido',
        'tipo_documento',
        'documento',
        'lugar_expedicion',
        'sexo',
        'grupo_priorizado',
        'sede',
        'carrera_id',        // FK a carreras
        'correo',
        'telefono',
        'activo',
        'ultimo_ingreso_at', // actualizado por el portal
    ];

    protected $hidden = ['cedula_hash'];

    /**
     * Relación con grupos (corrigiendo belongsToMany):
     * Ajusta el nombre de la tabla pivote y las FKs si tu esquema usa otros nombres.
     */
    public function grupos()
    {
        // Asumiendo pivote 'grupo_tutor' con columnas 'tutor_id' y 'grupo_t_id'
        return $this->belongsToMany(GrupoT::class, 'grupo_tutor', 'tutor_id', 'grupo_t_id');
    }

    public function asignaturas()
    {
        // Por convención usará 'asignatura_tutor' (ajusta si tu pivote se llama diferente)
        return $this->belongsToMany(Asignatura::class);
    }

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }
}
