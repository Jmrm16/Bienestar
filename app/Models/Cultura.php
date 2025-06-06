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
        'contenido_json', // ✅ nuevo
    ];

    protected $casts = [
        'imagenes_extra' => 'array',
        'contenido_json' => 'array', // ✅ nuevo
        'fecha' => 'date',
        'publicado' => 'boolean',
    ];

}
