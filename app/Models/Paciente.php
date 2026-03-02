<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paciente extends Model
{
    use HasFactory;

    protected $table = 'pacientes';

    protected $fillable = [
        'tipo_documento',
        'documento',
        'nombres',
        'apellidos',
        'telefono',
        'correo',
        'carrera_id',   // ✅ nuevo
        'semestre',
        'creado_por',
    ];

    public function carrera()
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }
}