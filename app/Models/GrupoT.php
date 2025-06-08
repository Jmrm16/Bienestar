<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GrupoT extends Model
{
    use HasFactory;

    protected $table = 'grupo_t';

    protected $fillable = ['nombre', 'codigo', 'carrera_id', 'asignatura_id'];

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    public function asignatura()
    {
        return $this->belongsTo(Asignatura::class);
    }

    public function tutores()
    {
        return $this->belongsToMany(Tutor::class, 'grupo_tutor', 'grupo_t_id', 'tutor_id');
    }

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class);
    }
}
