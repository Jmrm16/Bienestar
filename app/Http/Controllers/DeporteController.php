<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeporteController extends Controller
{
    public function index()
    {
        return inertia('Deporte/index', [
            // Aquí puedes pasar datos relacionados con deportes si es necesario
        ]);
    }
}
