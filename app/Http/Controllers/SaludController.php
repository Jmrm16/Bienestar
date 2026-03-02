<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Models\Carrera;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaludController extends Controller
{
    private array $areas = [
        'medicina-general' => 'Medicina general',
        'odontologia'      => 'Odontología',
        'nutricion'        => 'Nutrición',
        'fisioterapia'     => 'Fisioterapia',
        'quiropraxia'      => 'Quiropraxia',
        'cosmiatria'       => 'Cosmiatría',
    ];

    public function index()
    {
        return inertia('Salud/index', [
            'areas' => $this->areas,
        ]);
    }

    public function area(string $area)
    {
        abort_unless(array_key_exists($area, $this->areas), 404);

        // ✅ Carreras para el Select
        $carreras = Carrera::query()
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        // ✅ Solo pacientes asociados a ESTA área (tabla pivote)
        $patients = DB::table('area_paciente')
            ->join('pacientes', 'pacientes.id', '=', 'area_paciente.paciente_id')
            ->leftJoin('carreras', 'carreras.id', '=', 'pacientes.carrera_id')
            ->where('area_paciente.area', $area)
            ->orderBy('pacientes.apellidos')
            ->orderBy('pacientes.nombres')
            ->select(
                'pacientes.id',
                'pacientes.tipo_documento',
                'pacientes.documento',
                'pacientes.nombres',
                'pacientes.apellidos',
                'pacientes.telefono',
                'pacientes.correo',
                'pacientes.carrera_id',
                'pacientes.semestre',
                'carreras.nombre as carrera_nombre'
            )
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'tipo_doc' => $p->tipo_documento,
                'documento' => $p->documento,
                'nombres' => $p->nombres,
                'apellidos' => $p->apellidos,
                'telefono' => $p->telefono,
                'correo' => $p->correo,
                'carrera_id' => $p->carrera_id,
                'carrera_nombre' => $p->carrera_nombre,
                'semestre' => $p->semestre,
            ]);

        return inertia('Salud/Areas/AreaPage', [
            'areaKey'   => $area,
            'areaTitle' => $this->areas[$area],
            'patients'  => $patients,
            'carreras'  => $carreras,
        ]);
    }

    // POST /salud/{area}/pacientes
    public function patientsStore(Request $request, string $area)
    {
        abort_unless(array_key_exists($area, $this->areas), 404);

        $data = $request->validate([
            'tipo_doc'   => ['required', 'string', 'max:5'],
            'documento'  => ['required', 'string', 'max:30'],
            'nombres'    => ['required', 'string', 'max:100'],
            'apellidos'  => ['required', 'string', 'max:100'],
            'telefono'   => ['nullable', 'string', 'max:30'],
            'correo'     => ['nullable', 'email', 'max:150'],
            'carrera_id' => ['required', 'integer', 'exists:carreras,id'],
            'semestre'   => ['nullable', 'string', 'max:20'],
        ]);

        // ✅ 1) Crear/actualizar paciente (global, sin duplicados)
        $paciente = Paciente::updateOrCreate(
            ['tipo_documento' => $data['tipo_doc'], 'documento' => $data['documento']],
            [
                'nombres'    => $data['nombres'],
                'apellidos'  => $data['apellidos'],
                'telefono'   => $data['telefono'] ?? null,
                'correo'     => $data['correo'] ?? null,
                'carrera_id' => $data['carrera_id'],
                'semestre'   => $data['semestre'] ?? null,
                'creado_por' => Auth::id(),
            ]
        );

        // ✅ 2) Asociar paciente a esta área (pivote)
        DB::table('area_paciente')->updateOrInsert(
            ['area' => $area, 'paciente_id' => $paciente->id],
            ['updated_at' => now(), 'created_at' => now()]
        );
        return back()->with('success', 'Paciente registrado correctamente.');
    }
}