<?php

// app/Models/Estudiante.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Estudiante extends Model
{
    use HasFactory;

protected $fillable = [
    'codigo',
    'apellidos',
    'nombres',
    'tipo_identificacion',
    'identificacion',
    'ide_programa',
    'programa',
    'semestre',
    'ide_materia',
    'materia',
    'grupo',
    'primer_corte',
    'segundo_corte',
    'tercer_corte',
    'definitiva',
    'habilitacion',
    'final',
    'anio',
    'periodo',
    'email',
    'celular',
    'nota_faltante',
    'grupo_id',
    'tutor_id',
    'correo_institucional'
];

    public function grupo()
    {
        return $this->belongsTo(Grupo::class);
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }
}
