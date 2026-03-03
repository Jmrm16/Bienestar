<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaludAtencion extends Model
{
    use HasFactory;

    protected $table = 'salud_atenciones';

    protected $fillable = [
        'area',
        'paciente_id',
        'fecha',
        'tipo',
        'motivo_consulta',
        'evaluacion',
        'plan_manejo',
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
