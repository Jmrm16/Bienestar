<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DesarrolloController extends Controller
{
    public function index()
    {
        return inertia('Desarrollo/index', [
            // Aquí puedes pasar datos relacionados con desarrollo humano si es necesario
        ]);
    }
}
