<?php

// app/Models/AcompanamientoGrupo.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AcompanamientoGrupo extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'codigo', 'acompanamiento_carrera_id'];

    public function carrera()
    {
        return $this->belongsTo(AcompanamientoCarrera::class, 'acompanamiento_carrera_id');
    }
}
