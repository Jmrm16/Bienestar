<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use App\Models\Grupo;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class EstudianteController extends Controller
{
    public function index()
    {
        $grupos = Grupo::with('carrera')->orderBy('nombre')->get();
        $carreras = \App\Models\Carrera::all();

        return Inertia::render('Estudiantes/index', [
            'grupos' => $grupos,
            'carreras' => $carreras,
        ]);
    }

    public function showGrupo($grupoId)
{
    $grupo = Grupo::with('carrera')->findOrFail($grupoId);
    $estudiantes = Estudiante::where('grupo_id', $grupoId)->get();

    return Inertia::render('Estudiantes/GrupoDetalle', [
        'grupo' => $grupo->load('carrera'),
        'estudiantes' => Estudiante::where('grupo_id', $grupo->id)->get(),
    ]);
}

    public function cargarExcel(Request $request)
    {
        $request->validate([
            'grupo_id' => 'required|exists:grupos,id',
            'archivo' => 'required|file|mimes:xlsx,xls',
        ]);

        $grupoId = $request->grupo_id;
        $archivo = $request->file('archivo');

        $spreadsheet = IOFactory::load($archivo->getPathname());
        $hoja = $spreadsheet->getActiveSheet();
        $filas = $hoja->toArray(null, true, true, true);

        $creados = 0;
        $actualizados = 0;

        // Mapeo flexible de encabezados
        $headerMappings = [
            'codigo' => ['codigo', 'código', 'codigo estudiante', 'id estudiante'],
            'nombres' => ['nombres', 'nombre'],
            'apellidos' => ['apellidos', 'apellido'],
            'tipo_identificacion' => ['tipo identificacion', 'tipo documento'],
            'identificacion' => ['identificacion', 'número identificacion', 'documento'],
            'ide_programa' => ['ide programa'],
            'programa' => ['programa'],
            'semestre' => ['semestre'],
            'ide_materia' => ['ide materia'],
            'materia' => ['materia'],
            'grupo' => ['grupo'],
            'primer_corte' => ['1er', 'primer corte'],
            'segundo_corte' => ['2er', 'segundo corte'],
            'tercer_corte' => ['3er', 'tercer corte'],
            'definitiva' => ['def', 'definitiva'],
            'habilitacion' => ['hab', 'habilitacion'],
            'final' => ['final'],
            'anio' => ['año', 'anio'],
            'periodo' => ['periodo'],
            'email' => ['email', 'correo', 'correo electronico'],
            'celular' => ['celular', 'telefono'],
            'nota_faltante' => ['nota faltante'],
            'correo_institucional' => ['correo institucional'],
        ];

        // Leer encabezados reales de Excel
        $headerRow = $filas[1];
        $columnToField = [];

        foreach ($headerRow as $colKey => $header) {
            $headerClean = strtolower(trim($header));
            foreach ($headerMappings as $dbField => $aliases) {
                if (in_array($headerClean, $aliases)) {
                    $columnToField[$colKey] = $dbField;
                    break;
                }
            }
        }

        foreach ($filas as $i => $fila) {
            if ($i === 1) continue; // Saltar encabezado

            $data = ['grupo_id' => $grupoId];

            foreach ($fila as $colKey => $value) {
                if (isset($columnToField[$colKey])) {
                    $data[$columnToField[$colKey]] = $value ?? null;
                }
            }

            if (empty($data['codigo'])) continue; // Saltar si no hay código

            $estudiante = Estudiante::where('codigo', $data['codigo'])
                ->where('grupo_id', $grupoId)
                ->first();

            if ($estudiante) {
                $estudiante->update($data);
                $actualizados++;
            } else {
                Estudiante::create($data);
                $creados++;
            }
        }

        return redirect()->back()->with('success', "✅ $creados estudiantes creados, $actualizados actualizados.");
    }







    public function update(Request $request, $id)
    {
        $estudiante = Estudiante::findOrFail($id);

        $estudiante->update($request->all());

        return redirect()->back()->with('success', 'Estudiante actualizado correctamente.');
    }

    public function destroy($id)
    {
        $estudiante = Estudiante::findOrFail($id);
        $estudiante->delete();

        return redirect()->back()->with('success', 'Estudiante eliminado correctamente.');
    }
}
