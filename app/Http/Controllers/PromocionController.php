<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PromocionController extends Controller
{
    public function index()
    {
        return inertia('Promocion/index', [
            // Aquí puedes pasar datos relacionados con promoción socioeconómica si es necesario
        ]);
    }
}
