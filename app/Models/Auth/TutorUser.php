<?php

// app/Models/Auth/TutorUser.php
namespace App\Models\Auth;

use Illuminate\Foundation\Auth\User as Authenticatable;

class TutorUser extends Authenticatable
{
  protected $table = 'tutors'; // misma tabla
  protected $fillable = ['codigo','cedula_hash','nombre','apellido','correo','telefono','activo'];
  protected $hidden = ['cedula_hash'];
}
