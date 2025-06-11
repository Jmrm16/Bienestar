<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\GrupoT;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;
use Carbon\Carbon;

class AsistenciaImportController extends Controller
{
    /**
     * Vista general de asistencias
     */
    public function index()
    {
        return Inertia::render('Asistencias/Importar', [
            'asistencias' => Asistencia::latest()->get(),
            'grupos' => GrupoT::select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Importar asistencias desde archivo Excel
     */
    public function import(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls',
            'grupo_id' => 'required|exists:grupo_t,id',
        ]);

        $grupoId = $request->input('grupo_id');
        $archivo = $request->file('archivo');
        $hoja = IOFactory::load($archivo)->getActiveSheet()->toArray(null, true, true, true);

        $diasColumna = [];
        foreach ($hoja[12] as $col => $val) {
            if (is_numeric($val)) {
                $diasColumna[$col] = intval($val);
            }
        }

        $importadas = 0;

        foreach ($hoja as $index => $fila) {
            if ($index < 13 || empty($fila['C'])) continue;

            $nombres = $fila['C'] ?? '';
            $apellidos = $fila['D'] ?? '';
            $identificacion = $fila['E'] ?? '';
            $codigo_estudiantil = $fila['F'] ?? '';
            $programa_academico = $fila['G'] ?? '';
            $sexo = (!empty($fila['H']) ? 'F' : (!empty($fila['I']) ? 'M' : 'Otro'));

            $priorizados = [];
            if (!empty($fila['J'])) $priorizados[] = 'Etnico';
            if (!empty($fila['K'])) $priorizados[] = 'Discapacidad';
            if (!empty($fila['L'])) $priorizados[] = 'Víctima';
            if (!empty($fila['M'])) $priorizados[] = 'LGTBIQ+';
            if (!empty($fila['N'])) $priorizados[] = 'Frontera';
            $grupo_priorizado = implode(', ', $priorizados);

            // ✅ Contar cuántos días tiene marcado el 1
            $totalAsistencias = 0;
            foreach ($diasColumna as $col => $dia) {
                if (!empty($fila[$col]) && $fila[$col] == 1) {
                    $totalAsistencias++;
                }
            }

            if ($totalAsistencias > 0) {
                // ✅ Registrar solo un registro por estudiante con total de asistencias
                Asistencia::updateOrCreate(
                    [
                        'grupo_id' => $grupoId,
                        'identificacion' => $identificacion,
                        'fecha' => now()->startOfMonth()->toDateString(), // Mes de carga
                    ],
                    [
                        'nombres_del_estudiante' => $nombres,
                        'apellidos_del_estudiante' => $apellidos,
                        'codigo_estudiantil' => $codigo_estudiantil,
                        'programa_academico' => $programa_academico,
                        'sexo' => $sexo,
                        'grupo_priorizado' => $grupo_priorizado,
                        'horas' => 1,
                        'total_asistencias' => $totalAsistencias,
                    ]
                );

                $importadas++;
            }
        }

        return redirect()->back()->with('success', "$importadas asistencias importadas correctamente.");
    }

    /**
     * Vista para importar asistencias desde un grupo específico
     */
    public function importarPorGrupoVista($grupoId)
    {
        $grupo = GrupoT::with('asistencias')->findOrFail($grupoId);

        return Inertia::render('Asistencias/Importar', [
            'grupo' => $grupo,
            'asistencias' => $grupo->asistencias ?? [],
            'grupos' => GrupoT::select('id', 'nombre')->get(),
        ]);
    }

    // AsistenciaImportController.php

public function verAsistenciasPorGrupo($grupoId)
{
    $grupo = GrupoT::with('asistencias')->findOrFail($grupoId);

    return Inertia::render('Asistencias/TablaAsistencias', [
        'grupo' => $grupo,
        'asistencias' => $grupo->asistencias ?? [],
    ]);
}

}
