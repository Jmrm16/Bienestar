<?php

namespace App\Http\Controllers;

use App\Models\Cultura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CulturaController extends Controller
{
    public function index()
    {
        $culturas = Cultura::latest()->get();
        return Inertia::render('Cultura/index', ['culturas' => $culturas]);
    }

    public function create()
    {
        return Inertia::render('Cultura/Crear');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'tipo' => 'required|string',
            'fecha' => 'nullable|date',
            'imagen_banner' => 'nullable|image|max:2048',
            'publicado' => 'boolean',
            'contenido_json' => 'nullable|json', // ✅ validación para bloques
        ]);

        if ($request->hasFile('imagen_banner')) {
            $data['imagen_banner'] = $request->file('imagen_banner')->store('cultura', 'public');
        }

        $data['contenido_json'] = $request->input('contenido_json'); // ✅ guardar bloques

        Cultura::create($data);
        return redirect()->route('cultura.index');
    }

    public function edit(Cultura $cultura)
    {
        return Inertia::render('Cultura/Edit', ['cultura' => $cultura]);
    }

    public function update(Request $request, Cultura $cultura)
    {
        $data = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'tipo' => 'required|string',
            'fecha' => 'nullable|date',
            'imagen_banner' => 'nullable|image|max:2048',
            'publicado' => 'boolean',
            'contenido_json' => 'nullable|json', // ✅ validación para bloques
        ]);

        if ($request->hasFile('imagen_banner')) {
            if ($cultura->imagen_banner) {
                Storage::disk('public')->delete($cultura->imagen_banner);
            }
            $data['imagen_banner'] = $request->file('imagen_banner')->store('cultura', 'public');
        }

        $data['contenido_json'] = $request->input('contenido_json'); // ✅ actualizar bloques

        $cultura->update($data);
        return redirect()->route('cultura.index');
    }

    public function destroy(Cultura $cultura)
    {
        if ($cultura->imagen_banner) {
            Storage::disk('public')->delete($cultura->imagen_banner);
        }

        $cultura->delete();
        return redirect()->route('cultura.index');
    }
public function uploadImage(Request $request)
{
    $request->validate([
        'image' => 'required|image|max:2048',
    ]);

    $path = $request->file('image')->store('cultura/editor', 'public');

    return response()->json([
        'success' => 1,
        'file' => [
            'url' => asset('storage/' . $path), // ✅ corregido
        ],
    ]);
}
public function vistaPublica()
{
    $culturas = Cultura::where('publicado', true)->latest()->get();
    return Inertia::render('Cultura_vistas/Cultura', [
        'culturas' => $culturas,
    ]);
}
// Si decides dejarlo en CulturaController
public function home()
{
    $culturas = Cultura::where('publicado', true)
        ->orderBy('fecha', 'desc')
        ->take(8)
        ->get();

    return Inertia::render('welcome', [
        'culturas' => $culturas,
    ]);
}

public function show(Cultura $cultura)
{
    return Inertia::render('Cultura_vistas/ShowCultura', [
        'cultura' => $cultura
    ]);
}

}
