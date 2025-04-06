<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Grupo extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'codigo', 'carrera_id'];


    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class);
    }
}
