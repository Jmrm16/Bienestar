<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Carrera extends Model
{
    use HasFactory;

    protected $fillable = ['nombre', 'codigo'];


    public function grupos()
    {
        return $this->hasMany(Grupo::class);
    }
}
