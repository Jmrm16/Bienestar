<?php
// app/Http/Controllers/EstudianteController.php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;

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
            'excel' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $archivo = $request->file('excel');
        $grupoId = $request->grupo_id;

        $spreadsheet = IOFactory::load($archivo->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        $header = array_map('trim', $rows[0]); // primera fila como encabezado

        foreach (array_slice($rows, 1) as $fila) {
            $data = array_combine($header, $fila);

            Estudiante::create([
                'numero' => $data['No.'] ?? null,
                'codigo' => $data['CODIGO'] ?? null,
                'apellidos' => $data['APELLIDOS'] ?? null,
                'nombres' => $data['NOMBRES'] ?? null,
                'tipo_identificacion' => $data['TIPO IDENTIFICACIÓN'] ?? null,
                'identificacion' => $data['IDENTIFICACIÓN'] ?? null,
                'ciudad_expedicion' => $data['CIUDAD DE EXPEDICIÓN'] ?? null,
                'sexo' => $data['SEXO'] ?? null,
                'programa' => $data['PROGRAMA'] ?? null,
                'semestre' => $data['SEMESTRE'] ?? null,
                'correo_institucional' => $data['CORREO INSTITUCIONAL'] ?? null,
                'grupo_id' => $grupoId,
            ]);
        }

        return redirect()->back()->with('success', 'Estudiantes importados correctamente.');
    }
}
