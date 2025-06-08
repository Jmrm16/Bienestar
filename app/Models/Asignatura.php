<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Asignatura extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'codigo', 'docente', 'carrera_id'];

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    public function grupos()
    {
        return $this->hasMany(GrupoT::class, 'asignatura_id');
    }

    public function tutores()
    {
        return $this->belongsToMany(Tutor::class);
    }
}
