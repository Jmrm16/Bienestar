<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deporte extends Model
{
    use HasFactory;

    protected $table = 'deportes';

    protected $fillable = [
        'slug',
        'title',
        'description',
        'location',
        'schedule',
        'coach',
        'capacity',
        'registered',
        'status',
        'focus',
        'services',
        'requirements',
        'active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'registered' => 'integer',
        'services' => 'array',
        'requirements' => 'array',
        'active' => 'boolean',
    ];

    public function participantes()
    {
        return $this->hasMany(DeporteParticipante::class, 'deporte_id');
    }
}
