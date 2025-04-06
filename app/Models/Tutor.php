<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    protected $fillable = ['nombre', 'apellido', 'grupos'];

    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class);
    }
}

