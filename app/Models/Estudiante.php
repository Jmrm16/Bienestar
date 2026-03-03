<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ReportPeriod;

class Estudiante extends Model
{
    use HasFactory;

    protected $table = 'estudiantes';

    protected $fillable = [
        'period_id',

        'identificacion',
        'nombres',
        'apellidos',

        'sexo',
        'grupos_prioritarios',
        'estamento',
        'dependencia',
        'programa_academico',

        'servicio',
        'actividad',
        'responsable',
        'trimestre',
    ];

    protected $casts = [
        'id' => 'integer',
        'period_id' => 'integer',
    ];

    /**
     * ✅ Opción B: evitar NULL en estos campos
     * (además de la migración con default(''))
     */
    protected $attributes = [
        'servicio' => '',
        'actividad' => '',
        'trimestre' => '',
    ];

    /* =========================
       Relaciones
    ========================= */

    public function period()
    {
        return $this->belongsTo(ReportPeriod::class, 'period_id');
    }

    /* =========================
       Accessors
    ========================= */

    protected $appends = [
        'nombre_completo',
    ];

    public function getNombreCompletoAttribute(): string
    {
        return trim(($this->nombres ?? '') . ' ' . ($this->apellidos ?? ''));
    }

    /* =========================
       Mutators (evitar nulls)
    ========================= */

    public function setServicioAttribute($value): void
    {
        $this->attributes['servicio'] = trim((string)($value ?? ''));
    }

    public function setActividadAttribute($value): void
    {
        $this->attributes['actividad'] = trim((string)($value ?? ''));
    }

    public function setTrimestreAttribute($value): void
    {
        $this->attributes['trimestre'] = trim((string)($value ?? ''));
    }

    public function setIdentificacionAttribute($value): void
    {
        // quita espacios en identificacion
        $v = preg_replace('/\s+/', '', trim((string)($value ?? '')));
        $this->attributes['identificacion'] = $v;
    }
}