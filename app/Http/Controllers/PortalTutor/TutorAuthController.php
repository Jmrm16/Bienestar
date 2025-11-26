<?php

// app/Http/Controllers/PortalTutor/TutorAuthController.php
namespace App\Http\Controllers\PortalTutor;

use App\Http\Controllers\Controller;
use App\Models\Auth\TutorUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TutorAuthController extends Controller
{
  public function showLogin() {
    return Inertia::render('Tutores/Login'); // crea esta vista en Inertia
  }

  public function login(Request $r) {
    $data = $r->validate(['codigo'=>'required', 'cedula'=>'required']);
    $t = TutorUser::where('codigo',$data['codigo'])->where('activo',true)->first();

    if (!$t || !$t->cedula_hash || !Hash::check($data['cedula'], $t->cedula_hash)) {
      return back()->withErrors(['codigo'=>'Credenciales inválidas'])->onlyInput('codigo');
    }

    Auth::guard('tutor')->login($t, false);
    $t->forceFill(['ultimo_ingreso_at'=>now()])->save();

    return redirect()->route('portal.tutor.home');
  }

  public function logout() {
    Auth::guard('tutor')->logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('portal.tutor.login');
  }
}

