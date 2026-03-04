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
    protected $appends = ['imagen_url'];

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

    public function getImagenUrlAttribute(): ?string
    {
        $path = self::normalizeMediaPath($this->imagen_banner);

        if ($path) {
            return '/media/cultura/' . ltrim($path, '/');
        }

        return is_string($this->imagen_banner) && $this->imagen_banner !== ''
            ? $this->imagen_banner
            : null;
    }

    public static function normalizeMediaPath(?string $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $path = trim($value);

        if (preg_match('#^https?://#i', $path)) {
            $path = parse_url($path, PHP_URL_PATH) ?: $path;
        }

        $path = ltrim($path, '/');

        if (str_starts_with($path, 'media/cultura/')) {
            return substr($path, strlen('media/cultura/'));
        }

        if (str_starts_with($path, 'storage/')) {
            return substr($path, strlen('storage/'));
        }

        return $path;
    }
}
