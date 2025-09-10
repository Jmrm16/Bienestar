<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CarreraController extends Controller
{
    // GET /carreras
    public function index()
    {
        $carreras = Carrera::query()
            ->select('id', 'nombre', 'codigo', 'created_at')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Carreras/Index', [
            'carreras' => $carreras,
        ]);
    }

    // POST /carreras
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required','string','max:255'],
            'codigo' => ['nullable','string','max:255','unique:carreras,codigo'],
        ]);

        Carrera::create($data);

        return back()->with('success', 'Carrera creada correctamente.');
    }

    // GET /carreras/{carrera}
    public function show(Carrera $carrera)
    {
        return Inertia::render('Carreras/Show', [
            'carrera' => $carrera->only(['id','nombre','codigo','created_at','updated_at']),
        ]);
    }

    // PUT/PATCH /carreras/{carrera}
    public function update(Request $request, Carrera $carrera)
    {
        $data = $request->validate([
            'nombre' => ['required','string','max:255'],
            'codigo' => [
                'nullable','string','max:255',
                Rule::unique('carreras','codigo')->ignore($carrera->id),
            ],
        ]);

        $carrera->update($data);

        return back()->with('success', 'Carrera actualizada correctamente.');
    }

    // DELETE /carreras/{carrera}
    public function destroy(Carrera $carrera)
    {
        $carrera->delete();
        return back()->with('success', 'Carrera eliminada correctamente.');
    }
}
