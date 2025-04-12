<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use App\Models\Grupo;
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
            'grupo' => $grupo,
            'estudiantes' => $estudiantes,
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

        foreach ($filas as $i => $fila) {
            if ($i === 1) continue; // Saltar encabezado

            Estudiante::updateOrCreate(
                ['identificacion' => $fila['F']], // Clave única
                [
                    'grupo_id' => $grupoId,
                    'numero' => $fila['A'],
                    'codigo' => $fila['B'],
                    'apellidos' => $fila['C'],
                    'nombres' => $fila['D'],
                    'tipo_identificacion' => $fila['E'],
                    'identificacion' => $fila['F'],
                    'ciudad_expedicion' => $fila['G'],
                    'sexo' => $fila['H'],
                    'programa' => $fila['I'],
                    'semestre' => $fila['J'],
                    'correo_institucional' => $fila['K'],
                ]
            );
        }

        return redirect()->back()->with('success', 'Estudiantes importados correctamente.');
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
