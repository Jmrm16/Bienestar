<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cultura extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo', // 'evento', 'noticia', 'actividad', 'galeria'
        'fecha',
        'imagen_banner',
        'publicado',
        'contenido_json', // Para bloques de contenido estructurado
        'categoria', // Nueva columna para categorizar
        'lugar', // Nueva columna para eventos
        'hora', // Nueva columna para eventos
    ];
       protected $appends = ['imagen_url']; // 👈 AÑADE ESTA LÍNEA

    protected $casts = [
        'publicado' => 'boolean',
        'fecha' => 'datetime',
        'contenido_json' => 'array', // Cast a array para fácil manipulación
    ];

    // Scopes útiles
    public function scopeEventos($query)
    {
        return $query->where('tipo', 'evento')->where('publicado', true);
    }

    public function scopeNoticias($query)
    {
        return $query->where('tipo', 'noticia')->where('publicado', true);
    }

    public function scopeRecientes($query)
    {
        return $query->orderBy('fecha', 'desc');
    }

    // Accesor para la URL completa de la imagen
    public function getImagenUrlAttribute()
    {
        return $this->imagen_banner ? asset('storage/' . $this->imagen_banner) : null;
    }
}