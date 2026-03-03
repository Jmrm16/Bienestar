<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeporteParticipante extends Model
{
    use HasFactory;

    protected $table = 'deporte_participantes';

    protected $fillable = [
        'deporte_id',
        'tipo_documento',
        'documento',
        'nombres',
        'apellidos',
        'estamento',
        'estado',
        'fecha_ingreso',
        'telefono',
        'correo',
        'carrera_id',
        'semestre',
        'observaciones',
        'creado_por',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
    ];

    public function deporte()
    {
        return $this->belongsTo(Deporte::class, 'deporte_id');
    }

    public function carrera()
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }
}
