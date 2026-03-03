<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnfermeriaMedicamento extends Model
{
    use HasFactory;

    protected $table = 'enfermeria_medicamentos';

    protected $fillable = [
        'nombre',
        'presentacion',
        'lote',
        'proveedor',
        'fecha_entrada',
        'fecha_vencimiento',
        'cantidad_inicial',
        'cantidad_disponible',
        'unidad',
        'ubicacion',
        'observaciones',
        'creado_por',
    ];

    protected $casts = [
        'fecha_entrada' => 'date',
        'fecha_vencimiento' => 'date',
        'cantidad_inicial' => 'integer',
        'cantidad_disponible' => 'integer',
    ];

    public function entregas()
    {
        return $this->hasMany(EnfermeriaEntrega::class, 'medicamento_id');
    }
}
