<?php

namespace App\Http\Controllers;

use App\Models\Cultura;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CulturaController extends Controller
{
    public function index()
    {
        $culturas = $this->presentCulturas(Cultura::latest()->get());

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

        $data['contenido_json'] = $this->prepareEditorContentForStorage($request->input('contenido_json'));

        Cultura::create($data);
        return redirect()->route('cultura.index');
    }

    public function edit(Cultura $cultura)
    {
        return Inertia::render('Cultura/Edit', ['cultura' => $this->presentCultura($cultura)]);
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
                $storedPath = Cultura::normalizeMediaPath($cultura->imagen_banner);

                if ($storedPath) {
                    Storage::disk('public')->delete($storedPath);
                }
            }

            $data['imagen_banner'] = $request->file('imagen_banner')->store('cultura', 'public');
        }

        $data['contenido_json'] = $this->prepareEditorContentForStorage($request->input('contenido_json'));

        $cultura->update($data);
        return redirect()->route('cultura.index');
    }

    public function destroy(Cultura $cultura)
    {
        if ($cultura->imagen_banner) {
            $storedPath = Cultura::normalizeMediaPath($cultura->imagen_banner);

            if ($storedPath) {
                Storage::disk('public')->delete($storedPath);
            }
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
                'url' => $this->mediaUrl($path),
            ],
        ]);
    }

    public function media(string $path)
    {
        $storedPath = Cultura::normalizeMediaPath(urldecode($path));

        abort_if(! $storedPath || str_contains($storedPath, '..'), Response::HTTP_NOT_FOUND);
        abort_unless(Storage::disk('public')->exists($storedPath), Response::HTTP_NOT_FOUND);

        return Storage::disk('public')->response($storedPath, null, [
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    public function vistaPublica()
    {
        $eventos = $this->presentCulturas(
            Cultura::eventos()
                ->recientes()
                ->where('fecha', '>=', now())
                ->take(3)
                ->get()
        );

        $noticias = $this->presentCulturas(
            Cultura::noticias()
                ->recientes()
                ->take(2)
                ->get()
        );

        $galeria = $this->presentCulturas(
            Cultura::where('publicado', true)
                ->recientes()
                ->take(12)
                ->get()
        )->filter(fn (array $item) => ! empty($item['imagen_url']));

        $areasCulturales = [
            ['icon' => 'literatura', 'title' => 'Literatura y Poesía'],
            ['icon' => 'musica', 'title' => 'Música'],
            ['icon' => 'cine', 'title' => 'Cine y Teatro'],
            ['icon' => 'danza', 'title' => 'Danza'],
            ['icon' => 'fotografia', 'title' => 'Fotografía'],
            ['icon' => 'artes', 'title' => 'Artes Visuales'],
        ];

        return Inertia::render('cultura', [
            'eventos' => $eventos,
            'noticias' => $noticias,
            'areasCulturales' => $areasCulturales,
            'galeria' => $galeria->values(),
        ]);
    }

/**
 * Extrae la primera imagen del contenido_json (Editor.js)
 */
    private function extraerPrimeraImagenDelJson($contenido): ?string
    {
        try {
            $json = is_string($contenido) ? json_decode($contenido, true) : $contenido;
            $bloques = $json['blocks'] ?? [];

            foreach ($bloques as $bloque) {
                if (($bloque['type'] ?? null) === 'image' && ! empty($bloque['data']['file']['url'])) {
                    return $this->normalizeMediaUrl($bloque['data']['file']['url']);
                }
            }
        } catch (\Throwable $e) {
            // opcional: log error
        }

        return null;
    }

    public function home()
    {
        $culturas = $this->presentCulturas(
            Cultura::where('publicado', true)
                ->orderBy('fecha', 'desc')
                ->take(8)
                ->get()
        );

        return Inertia::render('welcome', [
            'culturas' => $culturas,
        ]);
    }

    public function show(Cultura $cultura)
    {
        return Inertia::render('Cultura_vistas/ShowCultura', [
            'cultura' => $this->presentCultura($cultura),
        ]);
    }

    private function presentCulturas(Collection $culturas): Collection
    {
        return $culturas->map(fn (Cultura $cultura) => $this->presentCultura($cultura))->values();
    }

    private function presentCultura(Cultura $cultura): array
    {
        $payload = $cultura->toArray();
        $payload['contenido_json'] = $this->normalizeEditorContentForOutput($payload['contenido_json'] ?? null);
        $payload['imagen_url'] = $payload['imagen_url'] ?? $this->extraerPrimeraImagenDelJson($payload['contenido_json']);

        if (empty($payload['imagen_url'])) {
            $payload['imagen_url'] = $this->extraerPrimeraImagenDelJson($payload['contenido_json']);
        }

        return $payload;
    }

    private function prepareEditorContentForStorage($contenido): ?string
    {
        if (empty($contenido)) {
            return null;
        }

        $json = is_string($contenido) ? json_decode($contenido, true) : $contenido;

        if (! is_array($json)) {
            return is_string($contenido) ? $contenido : null;
        }

        foreach ($json['blocks'] ?? [] as &$bloque) {
            if (($bloque['type'] ?? null) !== 'image' || empty($bloque['data']['file']['url'])) {
                continue;
            }

            $normalizedPath = Cultura::normalizeMediaPath($bloque['data']['file']['url']);

            if ($normalizedPath) {
                $bloque['data']['file']['url'] = $normalizedPath;
            }
        }

        return json_encode($json, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function normalizeEditorContentForOutput($contenido): array|string|null
    {
        if (empty($contenido)) {
            return $contenido;
        }

        $json = is_string($contenido) ? json_decode($contenido, true) : $contenido;

        if (! is_array($json)) {
            return $contenido;
        }

        foreach ($json['blocks'] ?? [] as &$bloque) {
            if (($bloque['type'] ?? null) !== 'image' || empty($bloque['data']['file']['url'])) {
                continue;
            }

            $bloque['data']['file']['url'] = $this->normalizeMediaUrl($bloque['data']['file']['url']);
        }

        return $json;
    }

    private function normalizeMediaUrl(?string $value): ?string
    {
        $normalizedPath = Cultura::normalizeMediaPath($value);

        if ($normalizedPath) {
            return $this->mediaUrl($normalizedPath);
        }

        return $value;
    }

    private function mediaUrl(string $path): string
    {
        return '/media/cultura/' . ltrim($path, '/');
    }
}
