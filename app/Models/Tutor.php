<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'apellido'];

    // Relación muchos a muchos con Asignatura
    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class);
    }

    // Relación muchos a muchos con Grupo
    // Asegúrate de que la tabla pivote se llame 'grupo_tutor'
    public function grupos()
    {
        return $this->belongsToMany(Grupo::class,'grupo_tutor'); // Especificamos el nombre de la tabla pivote
    }
}
