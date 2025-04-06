<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asignatura extends Model
{
    protected $fillable = ['nombre', 'codigo', 'docente'];

    public function tutores()
    {
        return $this->belongsToMany(Tutor::class);
    }
}
