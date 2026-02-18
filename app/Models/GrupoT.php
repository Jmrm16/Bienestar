<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GrupoT extends Model
{
    use HasFactory;

    protected $table = 'grupo_t';

    protected $fillable = [
        'nombre',
        'codigo',
        'docente',
        'carrera_id',
        'asignatura_id',
        'period_id',
    ];

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    // 🔹 Carrera del grupo
    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    // 🔹 Asignatura del grupo
    public function asignatura()
    {
        return $this->belongsTo(Asignatura::class);
    }

    // 🔹 Período académico del grupo
    public function periodo()
    {
        return $this->belongsTo(ReportPeriod::class, 'period_id');
    }

    // 🔹 Tutores asignados al grupo (RELACIÓN CLAVE 🔥)
    public function tutores()
    {
        return $this->belongsToMany(
            Tutor::class,
            'periodo_grupo_tutor', // tabla pivot
            'grupo_t_id',          // FK grupo
            'tutor_id'             // FK tutor
        )
        ->withPivot(['period_id', 'rol'])
        ->withTimestamps();
    }

    // 🔹 Estudiantes del grupo (si aplica)
    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class, 'grupo_id');
    }

    // 🔹 Asistencias del grupo
    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'grupo_id');
    }
}
