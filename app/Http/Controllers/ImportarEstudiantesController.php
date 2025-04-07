<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use Illuminate\Http\Request;
use Spatie\SimpleExcel\SimpleExcelReader;

class EstudianteController extends Controller
{
    public function index()
    {
        $carreras = \App\Models\Carrera::with('grupos')->get();
        $grupos = \App\Models\Grupo::with('carrera')->orderBy('nombre')->get();

        return inertia('Estudiantes/index', [
            'carreras' => $carreras,
            'grupos' => $grupos,
        ]);
    }

    public function cargarExcel(Request $request)
    {
        $request->validate([
            'grupo_id' => ['required', 'exists:grupos,id'],
            'archivo' => ['required', 'file', 'mimes:xlsx,csv'],
        ]);

        $grupoId = $request->grupo_id;
        $archivo = $request->file('archivo');

        $rows = SimpleExcelReader::create($archivo)->getRows();

        foreach ($rows as $row) {
            Estudiante::create([
                'nombre' => $row['nombre'] ?? 'Desconocido',
                'apellido' => $row['apellido'] ?? '',
                'grupo_id' => $grupoId,
                'tutor_id' => $row['tutor_id'] ?? null,
                'tipo_identificacion' => $row['tipo_identificacion'] ?? '',
                'identificacion' => $row['identificacion'] ?? '',
                'ciudad_expedicion' => $row['ciudad_expedicion'] ?? '',
                'sexo' => $row['sexo'] ?? '',
                'programa' => $row['programa'] ?? '',
                'semestre' => $row['semestre'] ?? '',
            ]);
        }

        return redirect()->back()->with('success', 'Estudiantes importados correctamente.');
    }
}
