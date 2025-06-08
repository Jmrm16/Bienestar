<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Carrera extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'codigo'];

    // Relación con asignaturas
    public function asignaturas()
    {
        return $this->hasMany(Asignatura::class);
    }

    // Relación con grupos
    public function grupos()
    {
        return $this->hasMany(GrupoT::class); // Asegúrate de que el modelo sea GrupoT, no Grupo
    }
}
