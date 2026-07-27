<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo',
        'cedula_hash',
        'tipo_resolucion',
        'nombre',
        'apellido',
        'tipo_documento',
        'documento',
        'lugar_expedicion',
        'sexo',
        'grupo_priorizado',
        'sede',
        'carrera_id',
        'correo',
        'telefono',
        'activo',
        'ultimo_ingreso_at',
    ];

    protected $hidden = ['cedula_hash'];

    public function grupos()
    {
        return $this->belongsToMany(
            GrupoT::class,
            'periodo_grupo_tutor',
            'tutor_id',
            'grupo_t_id'
        )
        ->withPivot(['period_id', 'rol'])
        ->withTimestamps();
    }

    public function periodResolutions()
    {
        return $this->hasMany(TutorPeriodResolution::class, 'tutor_id');
    }

    public function reports()
    {
        return $this->hasMany(TutorReport::class, 'tutor_id');
    }

    public function asignaturas()
    {
        return $this->belongsToMany(Asignatura::class);
    }

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }

    public function resolutionForPeriod(?int $periodId, bool $fallbackToLegacy = true): ?string
    {
        if (! $periodId) {
            return $this->normalizeResolutionValue($fallbackToLegacy ? $this->tipo_resolucion : null);
        }

        $resolution = null;

        if ($this->relationLoaded('periodResolutions')) {
            $resolution = $this->periodResolutions
                ->firstWhere('period_id', $periodId)
                ?->tipo_resolucion;
        } else {
            $resolution = $this->periodResolutions()
                ->where('period_id', $periodId)
                ->value('tipo_resolucion');
        }

        $normalized = $this->normalizeResolutionValue($resolution);
        if ($normalized !== null) {
            return $normalized;
        }

        return $fallbackToLegacy
            ? $this->normalizeResolutionValue($this->tipo_resolucion)
            : null;
    }

    public function scopeForPeriodResolution(Builder $query, int $periodId, string $resolution): Builder
    {
        return $query->where(function (Builder $builder) use ($periodId, $resolution) {
            $builder
                ->whereHas('periodResolutions', function (Builder $relation) use ($periodId, $resolution) {
                    $relation
                        ->where('period_id', $periodId)
                        ->where('tipo_resolucion', $resolution);
                })
                ->orWhere(function (Builder $fallback) use ($periodId, $resolution) {
                    $fallback
                        ->whereDoesntHave('periodResolutions', function (Builder $relation) use ($periodId) {
                            $relation->where('period_id', $periodId);
                        })
                        ->where('tipo_resolucion', $resolution);
                });
        });
    }

    private function normalizeResolutionValue(mixed $value): ?string
    {
        $normalized = strtoupper(trim((string) $value));

        return in_array($normalized, ['R1', 'R2'], true) ? $normalized : null;
    }
}
