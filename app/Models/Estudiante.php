<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Estudiante extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'apellido',
        'grupo_id',
        'tutor_id',
        'tipo_identificacion',
        'identificacion',
        'ciudad_expedicion',
        'sexo',
        'programa',
        'semestre',
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
