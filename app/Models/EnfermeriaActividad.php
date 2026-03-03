<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnfermeriaActividad extends Model
{
    use HasFactory;

    protected $table = 'enfermeria_actividades';

    protected $fillable = [
        'paciente_id',
        'fecha',
        'tipo',
        'descripcion',
        'responsable',
        'observaciones',
        'registrado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function paciente()
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }
}
