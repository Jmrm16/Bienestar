<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcompanamientoCarrera extends Model
{
    protected $fillable = ['nombre', 'codigo'];

    public function grupos()
    {
        return $this->hasMany(AcompanamientoGrupo::class);
    }
}
