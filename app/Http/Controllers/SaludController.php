<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Models\Carrera;
use App\Models\EnfermeriaActividad;
use App\Models\EnfermeriaEntrega;
use App\Models\EnfermeriaMedicamento;
use App\Models\SaludAtencion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class SaludController extends Controller
{
    private array $areas = [
        'medicina-general' => 'Medicina general',
        'odontologia'      => 'Odontología',
        'enfermeria'       => 'Enfermería',
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
            ...($area === 'enfermeria' ? $this->buildEnfermeriaPayload() : []),
            ...($this->isClinicalArea($area) ? $this->buildClinicalPayload($area) : []),
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

    public function nursingInventoryStore(Request $request, string $area)
    {
        $this->abortUnlessEnfermeria($area);
        $this->abortUnlessNursingTablesReady();

        $data = $request->validate([
            'nombre'            => ['required', 'string', 'max:150'],
            'presentacion'      => ['nullable', 'string', 'max:120'],
            'lote'              => ['nullable', 'string', 'max:80'],
            'proveedor'         => ['nullable', 'string', 'max:150'],
            'fecha_entrada'     => ['required', 'date'],
            'fecha_vencimiento' => ['nullable', 'date', 'after_or_equal:fecha_entrada'],
            'cantidad_inicial'  => ['required', 'integer', 'min:1'],
            'unidad'            => ['nullable', 'string', 'max:30'],
            'ubicacion'         => ['nullable', 'string', 'max:120'],
            'observaciones'     => ['nullable', 'string'],
        ]);

        EnfermeriaMedicamento::create([
            'nombre'              => $data['nombre'],
            'presentacion'        => $data['presentacion'] ?? null,
            'lote'                => $data['lote'] ?? null,
            'proveedor'           => $data['proveedor'] ?? null,
            'fecha_entrada'       => $data['fecha_entrada'],
            'fecha_vencimiento'   => $data['fecha_vencimiento'] ?? null,
            'cantidad_inicial'    => (int) $data['cantidad_inicial'],
            'cantidad_disponible' => (int) $data['cantidad_inicial'],
            'unidad'              => $data['unidad'] ?? 'unidad',
            'ubicacion'           => $data['ubicacion'] ?? null,
            'observaciones'       => $data['observaciones'] ?? null,
            'creado_por'          => Auth::id(),
        ]);

        return back()->with('success', 'Medicamento registrado en el inventario.');
    }

    public function nursingDeliveryStore(Request $request, string $area)
    {
        $this->abortUnlessEnfermeria($area);
        $this->abortUnlessNursingTablesReady();

        $data = $request->validate([
            'medicamento_id' => ['required', 'integer', 'exists:enfermeria_medicamentos,id'],
            'paciente_id'    => ['nullable', 'integer', 'exists:pacientes,id'],
            'fecha_entrega'  => ['required', 'date'],
            'cantidad'       => ['required', 'integer', 'min:1'],
            'responsable'    => ['nullable', 'string', 'max:120'],
            'destino'        => ['nullable', 'string', 'max:150'],
            'detalle'        => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data) {
            $medicamento = EnfermeriaMedicamento::query()
                ->lockForUpdate()
                ->findOrFail($data['medicamento_id']);

            $cantidad = (int) $data['cantidad'];

            if ($cantidad > (int) $medicamento->cantidad_disponible) {
                throw ValidationException::withMessages([
                    'cantidad' => 'La cantidad entregada supera el stock disponible.',
                ]);
            }

            EnfermeriaEntrega::create([
                'medicamento_id' => $medicamento->id,
                'paciente_id'    => $data['paciente_id'] ?? null,
                'fecha_entrega'  => $data['fecha_entrega'],
                'cantidad'       => $cantidad,
                'responsable'    => $data['responsable'] ?? null,
                'destino'        => $data['destino'] ?? null,
                'detalle'        => $data['detalle'] ?? null,
                'entregado_por'  => Auth::id(),
            ]);

            $medicamento->decrement('cantidad_disponible', $cantidad);
        });

        return back()->with('success', 'Entrega registrada correctamente.');
    }

    public function nursingActivityStore(Request $request, string $area)
    {
        $this->abortUnlessEnfermeria($area);
        $this->abortUnlessNursingTablesReady();

        $data = $request->validate([
            'paciente_id'    => ['nullable', 'integer', 'exists:pacientes,id'],
            'fecha'          => ['required', 'date'],
            'tipo'           => ['required', 'string', 'max:120'],
            'descripcion'    => ['required', 'string'],
            'responsable'    => ['nullable', 'string', 'max:120'],
            'observaciones'  => ['nullable', 'string'],
        ]);

        EnfermeriaActividad::create([
            'paciente_id'   => $data['paciente_id'] ?? null,
            'fecha'         => $data['fecha'],
            'tipo'          => $data['tipo'],
            'descripcion'   => $data['descripcion'],
            'responsable'   => $data['responsable'] ?? null,
            'observaciones' => $data['observaciones'] ?? null,
            'registrado_por'=> Auth::id(),
        ]);

        return back()->with('success', 'Actividad de enfermería registrada.');
    }

    public function clinicalAttentionStore(Request $request, string $area)
    {
        $this->abortUnlessClinicalArea($area);
        $this->abortUnlessClinicalTablesReady();

        $data = $request->validate([
            'paciente_id'      => ['nullable', 'integer', 'exists:pacientes,id'],
            'fecha'            => ['required', 'date'],
            'tipo'             => ['required', 'string', 'max:120'],
            'motivo_consulta'  => ['nullable', 'string'],
            'evaluacion'       => ['required', 'string'],
            'plan_manejo'      => ['nullable', 'string'],
            'responsable'      => ['nullable', 'string', 'max:120'],
            'observaciones'    => ['nullable', 'string'],
        ]);

        if (!empty($data['paciente_id'])) {
            $belongsToArea = DB::table('area_paciente')
                ->where('area', $area)
                ->where('paciente_id', $data['paciente_id'])
                ->exists();

            if (!$belongsToArea) {
                throw ValidationException::withMessages([
                    'paciente_id' => 'El paciente seleccionado no está asociado a esta área.',
                ]);
            }
        }

        SaludAtencion::create([
            'area'            => $area,
            'paciente_id'     => $data['paciente_id'] ?? null,
            'fecha'           => $data['fecha'],
            'tipo'            => $data['tipo'],
            'motivo_consulta' => $data['motivo_consulta'] ?? null,
            'evaluacion'      => $data['evaluacion'],
            'plan_manejo'     => $data['plan_manejo'] ?? null,
            'responsable'     => $data['responsable'] ?? null,
            'observaciones'   => $data['observaciones'] ?? null,
            'registrado_por'  => Auth::id(),
        ]);

        return back()->with('success', 'Registro clínico guardado correctamente.');
    }

    private function buildEnfermeriaPayload(): array
    {
        $inventoryEnabled = $this->nursingTablesReady();

        if (!$inventoryEnabled) {
            return [
                'inventoryEnabled' => false,
                'nursingInventory' => [],
                'nursingDeliveries' => [],
                'nursingActivities' => [],
                'nursingStats' => [
                    'total_medicamentos' => 0,
                    'stock_bajo' => 0,
                    'proximos_vencer' => 0,
                    'entregas_mes' => 0,
                    'actividades_mes' => 0,
                ],
            ];
        }

        $today = now()->toDateString();
        $limitDate = now()->addDays(30)->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        $inventory = EnfermeriaMedicamento::query()
            ->orderByRaw('CASE WHEN fecha_vencimiento IS NULL THEN 1 ELSE 0 END')
            ->orderBy('fecha_vencimiento')
            ->orderBy('nombre')
            ->get()
            ->map(fn (EnfermeriaMedicamento $item) => [
                'id' => $item->id,
                'nombre' => $item->nombre,
                'presentacion' => $item->presentacion,
                'lote' => $item->lote,
                'proveedor' => $item->proveedor,
                'fecha_entrada' => optional($item->fecha_entrada)->toDateString(),
                'fecha_vencimiento' => optional($item->fecha_vencimiento)->toDateString(),
                'cantidad_inicial' => (int) $item->cantidad_inicial,
                'cantidad_disponible' => (int) $item->cantidad_disponible,
                'unidad' => $item->unidad,
                'ubicacion' => $item->ubicacion,
                'observaciones' => $item->observaciones,
            ])
            ->values();

        $deliveries = EnfermeriaEntrega::query()
            ->with([
                'medicamento:id,nombre,presentacion,unidad',
                'paciente:id,nombres,apellidos,documento',
            ])
            ->latest('fecha_entrega')
            ->latest('id')
            ->take(60)
            ->get()
            ->map(fn (EnfermeriaEntrega $delivery) => [
                'id' => $delivery->id,
                'fecha_entrega' => optional($delivery->fecha_entrega)->toDateString(),
                'cantidad' => (int) $delivery->cantidad,
                'responsable' => $delivery->responsable,
                'destino' => $delivery->destino,
                'detalle' => $delivery->detalle,
                'medicamento' => $delivery->medicamento ? [
                    'id' => $delivery->medicamento->id,
                    'nombre' => $delivery->medicamento->nombre,
                    'presentacion' => $delivery->medicamento->presentacion,
                    'unidad' => $delivery->medicamento->unidad,
                ] : null,
                'paciente' => $delivery->paciente ? [
                    'id' => $delivery->paciente->id,
                    'nombre' => trim($delivery->paciente->nombres . ' ' . $delivery->paciente->apellidos),
                    'documento' => $delivery->paciente->documento,
                ] : null,
            ])
            ->values();

        $activities = EnfermeriaActividad::query()
            ->with('paciente:id,nombres,apellidos,documento')
            ->latest('fecha')
            ->latest('id')
            ->take(60)
            ->get()
            ->map(fn (EnfermeriaActividad $activity) => [
                'id' => $activity->id,
                'fecha' => optional($activity->fecha)->toDateString(),
                'tipo' => $activity->tipo,
                'descripcion' => $activity->descripcion,
                'responsable' => $activity->responsable,
                'observaciones' => $activity->observaciones,
                'paciente' => $activity->paciente ? [
                    'id' => $activity->paciente->id,
                    'nombre' => trim($activity->paciente->nombres . ' ' . $activity->paciente->apellidos),
                    'documento' => $activity->paciente->documento,
                ] : null,
            ])
            ->values();

        return [
            'inventoryEnabled' => true,
            'nursingInventory' => $inventory,
            'nursingDeliveries' => $deliveries,
            'nursingActivities' => $activities,
            'nursingStats' => [
                'total_medicamentos' => EnfermeriaMedicamento::count(),
                'stock_bajo' => EnfermeriaMedicamento::where('cantidad_disponible', '<=', 5)->count(),
                'proximos_vencer' => EnfermeriaMedicamento::whereNotNull('fecha_vencimiento')
                    ->whereBetween('fecha_vencimiento', [$today, $limitDate])
                    ->count(),
                'entregas_mes' => EnfermeriaEntrega::where('fecha_entrega', '>=', $monthStart)->count(),
                'actividades_mes' => EnfermeriaActividad::where('fecha', '>=', $monthStart)->count(),
            ],
        ];
    }

    private function buildClinicalPayload(string $area): array
    {
        $clinicalPanelEnabled = $this->clinicalTablesReady();

        if (!$clinicalPanelEnabled) {
            return [
                'clinicalPanelEnabled' => false,
                'clinicalRecords' => [],
                'clinicalStats' => [
                    'total_registros' => 0,
                    'registros_mes' => 0,
                    'pacientes_atendidos' => 0,
                    'tipos_registrados' => 0,
                ],
            ];
        }

        $monthStart = now()->startOfMonth()->toDateString();

        $records = SaludAtencion::query()
            ->where('area', $area)
            ->with('paciente:id,nombres,apellidos,documento')
            ->latest('fecha')
            ->latest('id')
            ->take(60)
            ->get()
            ->map(fn (SaludAtencion $record) => [
                'id' => $record->id,
                'fecha' => optional($record->fecha)->toDateString(),
                'tipo' => $record->tipo,
                'motivo_consulta' => $record->motivo_consulta,
                'evaluacion' => $record->evaluacion,
                'plan_manejo' => $record->plan_manejo,
                'responsable' => $record->responsable,
                'observaciones' => $record->observaciones,
                'paciente' => $record->paciente ? [
                    'id' => $record->paciente->id,
                    'nombre' => trim($record->paciente->nombres . ' ' . $record->paciente->apellidos),
                    'documento' => $record->paciente->documento,
                ] : null,
            ])
            ->values();

        $query = SaludAtencion::query()->where('area', $area);

        return [
            'clinicalPanelEnabled' => true,
            'clinicalRecords' => $records,
            'clinicalStats' => [
                'total_registros' => (clone $query)->count(),
                'registros_mes' => (clone $query)->where('fecha', '>=', $monthStart)->count(),
                'pacientes_atendidos' => (clone $query)->whereNotNull('paciente_id')->distinct()->count('paciente_id'),
                'tipos_registrados' => (clone $query)->distinct()->count('tipo'),
            ],
        ];
    }

    private function abortUnlessEnfermeria(string $area): void
    {
        abort_unless($area === 'enfermeria', 404);
    }

    private function abortUnlessClinicalArea(string $area): void
    {
        abort_unless($this->isClinicalArea($area), 404);
    }

    private function abortUnlessNursingTablesReady(): void
    {
        if (!$this->nursingTablesReady()) {
            throw ValidationException::withMessages([
                'inventario' => 'Las tablas de enfermería no existen todavía. Ejecuta las migraciones del módulo.',
            ]);
        }
    }

    private function nursingTablesReady(): bool
    {
        return Schema::hasTable('enfermeria_medicamentos')
            && Schema::hasTable('enfermeria_entregas')
            && Schema::hasTable('enfermeria_actividades');
    }

    private function abortUnlessClinicalTablesReady(): void
    {
        if (!$this->clinicalTablesReady()) {
            throw ValidationException::withMessages([
                'atenciones' => 'Las tablas clínicas no existen todavía. Ejecuta las migraciones del módulo.',
            ]);
        }
    }

    private function clinicalTablesReady(): bool
    {
        return Schema::hasTable('salud_atenciones');
    }

    private function isClinicalArea(string $area): bool
    {
        return in_array($area, ['medicina-general', 'odontologia'], true);
    }
}
