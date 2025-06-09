<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;
use Carbon\Carbon;

class AsistenciaImportController extends Controller
{
    public function index()
    {
        return Inertia::render('Asistencias/Importar', [
            'asistencias' => Asistencia::latest()->get(),
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls',
        ]);

        $archivo = $request->file('archivo');
        $hoja = IOFactory::load($archivo)->getActiveSheet()->toArray(null, true, true, true);

        $diasColumna = [];

        // Detectar columnas con fechas (días del mes) desde fila 12
        foreach ($hoja[12] as $col => $val) {
            if (is_numeric($val)) {
                $diasColumna[$col] = intval($val);
            }
        }

        $importadas = 0;

        // Recorrer desde fila 13 en adelante (donde inician los datos reales)
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

            // Procesar días con asistencia
            foreach ($diasColumna as $col => $dia) {
                if (!empty($fila[$col]) && $fila[$col] == 1) {
                    Asistencia::create([
                        'nombres_del_estudiante' => $nombres,
                        'apellidos_del_estudiante' => $apellidos,
                        'identificacion' => $identificacion,
                        'codigo_estudiantil' => $codigo_estudiantil,
                        'programa_academico' => $programa_academico,
                        'sexo' => $sexo,
                        'grupo_priorizado' => $grupo_priorizado,
                        'fecha' => Carbon::createFromDate(2025, 3, $dia),
                        'horas' => 1,
                    ]);
                    $importadas++;
                }
            }
        }

        return redirect()->back()->with('success', "$importadas asistencias importadas correctamente.");
    }
}
