<?php

namespace App\Http\Controllers;

use App\Models\AcompanamientoCarrera;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcompanamientoCarreraController extends Controller
{
    public function index()
    {
        $carreras = AcompanamientoCarrera::withCount('grupos')->get();

        return Inertia::render('Acompanamiento/index', [
            'carreras' => $carreras,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
        ]);

        AcompanamientoCarrera::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
        ]);

        return redirect()->route('acompañamientos.index')->with('success', 'Carrera registrada exitosamente.');
    }

    public function update(Request $request, AcompanamientoCarrera $acompañamiento)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:255',
        ]);

        $acompañamiento->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo,
        ]);

        return redirect()->route('acompañamientos.index')->with('success', 'Carrera actualizada correctamente.');
    }

    public function destroy(AcompanamientoCarrera $acompañamiento)
    {
        $acompañamiento->delete();

        return redirect()->back()->with('success', 'Carrera eliminada correctamente.');
    }
}
