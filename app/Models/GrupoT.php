<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GrupoT extends Model
{
    use HasFactory;
    protected $table = 'grupo_t'; // <-- Aquí le indicas la tabla correcta

    // Asegúrate de que 'tutor_id' NO esté en el $fillable, porque es manejado en la tabla pivote
    protected $fillable = ['nombre', 'codigo', 'carrera_id'];

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class);
    }

    public function tutores()
    {
        // Relación muchos a muchos con Tutor a través de la tabla pivote 'grupo_tutor'
        return $this->belongsToMany(Tutor::class,'grupo_tutor' );
    }
    //
}
