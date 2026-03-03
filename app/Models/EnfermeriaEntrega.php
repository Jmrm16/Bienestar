<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnfermeriaEntrega extends Model
{
    use HasFactory;

    protected $table = 'enfermeria_entregas';

    protected $fillable = [
        'medicamento_id',
        'paciente_id',
        'fecha_entrega',
        'cantidad',
        'responsable',
        'destino',
        'detalle',
        'entregado_por',
    ];

    protected $casts = [
        'fecha_entrega' => 'date',
        'cantidad' => 'integer',
    ];

    public function medicamento()
    {
        return $this->belongsTo(EnfermeriaMedicamento::class, 'medicamento_id');
    }

    public function paciente()
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }
}
