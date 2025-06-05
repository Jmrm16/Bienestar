<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cultura extends Model
{
    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'imagen_banner',
        'imagenes_extra',
        'fecha',
        'publicado',
    ];

    protected $casts = [
        'imagenes_extra' => 'array',
        'fecha' => 'date',
        'publicado' => 'boolean',
    ];
}
