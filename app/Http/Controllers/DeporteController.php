<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\Deporte;
use App\Models\DeporteParticipante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DeporteController extends Controller
{
    private string $moduleDescription = 'Nuestra area de Deporte es la encargada de programar y coordinar actividades, competencias y cursos de formacion para facilitar a los estudiantes y a la comunidad universitaria los medios necesarios para la practica deportiva, el tiempo libre y la participacion interna y externa.';

    public function index()
    {
        $areas = Deporte::query()
            ->where('active', true)
            ->orderBy('title')
            ->get()
            ->map(fn (Deporte $area) => $this->mapArea($area))
            ->values();

        $stats = [
            'offers' => $areas->count(),
            'disciplines' => $areas->where('kind', 'disciplina')->count(),
            'services' => $areas->where('kind', 'servicio')->count(),
            'free_time_policy' => '2 horas',
        ];

        return Inertia::render('Deporte/index', [
            'moduleDescription' => $this->moduleDescription,
            'areas' => $areas,
            'stats' => $stats,
        ]);
    }

    public function area(string $area)
    {
        $sportArea = $this->findArea($area);

        $participants = $sportArea->participantes()
            ->with('carrera:id,nombre')
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get()
            ->map(fn (DeporteParticipante $participant) => $this->mapParticipant($participant))
            ->values();

        $participantStats = [
            'total' => $participants->count(),
            'active' => $participants->where('estado', 'Activo')->count(),
            'students' => $participants->where('estamento', 'Estudiante')->count(),
        ];

        $carreras = Carrera::query()
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Deporte/AreaPage', [
            'area' => $this->mapArea($sportArea),
            'participants' => $participants,
            'participantStats' => $participantStats,
            'carreras' => $carreras,
        ]);
    }

    public function participantsStore(Request $request, string $area)
    {
        $sportArea = $this->findArea($area);
        $data = $this->validateParticipant($request, $sportArea->id);

        $sportArea->participantes()->create([
            ...$this->participantPayload($data),
            'creado_por' => Auth::id(),
        ]);

        return back()->with('success', 'Participante registrado correctamente.');
    }

    public function participantsUpdate(Request $request, string $area, DeporteParticipante $participant)
    {
        $sportArea = $this->findArea($area);
        abort_unless($participant->deporte_id === $sportArea->id, 404);

        $data = $this->validateParticipant($request, $sportArea->id, $participant->id);
        $participant->update($this->participantPayload($data));

        return back()->with('success', 'Participante actualizado correctamente.');
    }

    public function participantsDestroy(string $area, DeporteParticipante $participant)
    {
        $sportArea = $this->findArea($area);
        abort_unless($participant->deporte_id === $sportArea->id, 404);

        $participant->delete();

        return back()->with('success', 'Participante eliminado correctamente.');
    }

    public function participantsExport(string $area): StreamedResponse
    {
        $sportArea = $this->findArea($area);
        $filename = 'participantes-' . $sportArea->slug . '-' . now()->format('Ymd-His') . '.csv';

        $participants = $sportArea->participantes()
            ->with('carrera:id,nombre')
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();

        return response()->streamDownload(function () use ($participants) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Tipo documento',
                'Documento',
                'Nombres',
                'Apellidos',
                'Estamento',
                'Estado',
                'Carrera',
                'Semestre',
                'Telefono',
                'Correo',
                'Fecha ingreso',
                'Observaciones',
            ]);

            foreach ($participants as $participant) {
                fputcsv($handle, [
                    $participant->tipo_documento,
                    $participant->documento,
                    $participant->nombres,
                    $participant->apellidos,
                    $participant->estamento,
                    $participant->estado,
                    $participant->carrera?->nombre,
                    $participant->semestre,
                    $participant->telefono,
                    $participant->correo,
                    optional($participant->fecha_ingreso)->format('Y-m-d'),
                    $participant->observaciones,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function findArea(string $area): Deporte
    {
        return Deporte::query()
            ->where('slug', $area)
            ->where('active', true)
            ->firstOrFail();
    }

    private function mapArea(Deporte $area): array
    {
        return [
            'key' => $area->slug,
            'title' => $area->title,
            'description' => $area->description,
            'location' => $area->location,
            'schedule' => $area->schedule,
            'coach' => $area->coach,
            'capacity' => $area->capacity,
            'registered' => $area->registered,
            'status' => $area->status,
            'focus' => $area->focus,
            'services' => $area->services ?? [],
            'requirements' => $area->requirements ?? [],
            'kind' => $area->status === 'Servicio permanente' ? 'servicio' : 'disciplina',
            'href' => route('deportes.area', $area->slug),
        ];
    }

    private function mapParticipant(DeporteParticipante $participant): array
    {
        return [
            'id' => $participant->id,
            'tipo_doc' => $participant->tipo_documento,
            'documento' => $participant->documento,
            'nombres' => $participant->nombres,
            'apellidos' => $participant->apellidos,
            'estamento' => $participant->estamento,
            'estado' => $participant->estado,
            'fecha_ingreso' => optional($participant->fecha_ingreso)->format('Y-m-d'),
            'telefono' => $participant->telefono,
            'correo' => $participant->correo,
            'carrera_id' => $participant->carrera_id,
            'carrera_nombre' => $participant->carrera?->nombre,
            'semestre' => $participant->semestre,
            'observaciones' => $participant->observaciones,
        ];
    }

    private function validateParticipant(Request $request, int $deporteId, ?int $participantId = null): array
    {
        return $request->validate([
            'tipo_doc' => ['required', 'string', 'max:5'],
            'documento' => [
                'required',
                'string',
                'max:30',
                Rule::unique('deporte_participantes', 'documento')
                    ->where(fn ($query) => $query
                        ->where('deporte_id', $deporteId)
                        ->where('tipo_documento', $request->input('tipo_doc')))
                    ->ignore($participantId),
            ],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'estamento' => ['required', 'string', 'max:50'],
            'estado' => ['required', 'string', 'max:30'],
            'fecha_ingreso' => ['nullable', 'date'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'correo' => ['nullable', 'email', 'max:150'],
            'carrera_id' => ['nullable', 'integer', 'exists:carreras,id'],
            'semestre' => ['nullable', 'string', 'max:20'],
            'observaciones' => ['nullable', 'string'],
        ], [
            'documento.unique' => 'Ya existe un participante con ese documento en esta disciplina.',
        ], [
            'tipo_doc' => 'tipo de documento',
            'fecha_ingreso' => 'fecha de ingreso',
            'carrera_id' => 'carrera',
        ]);
    }

    private function participantPayload(array $data): array
    {
        return [
            'tipo_documento' => $data['tipo_doc'],
            'documento' => $data['documento'],
            'nombres' => $data['nombres'],
            'apellidos' => $data['apellidos'],
            'estamento' => $data['estamento'],
            'estado' => $data['estado'],
            'fecha_ingreso' => $data['fecha_ingreso'] ?? null,
            'telefono' => $data['telefono'] ?? null,
            'correo' => $data['correo'] ?? null,
            'carrera_id' => $data['carrera_id'] ?? null,
            'semestre' => $data['semestre'] ?? null,
            'observaciones' => $data['observaciones'] ?? null,
        ];
    }
}
