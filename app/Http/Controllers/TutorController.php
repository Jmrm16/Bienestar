<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\Asignatura;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TutorController extends Controller
{
    public function index()
    {
        // Carga los tutores con sus asignaturas relacionadas
        $tutores = Tutor::with('asignaturas')->get();
        $asignaturas = Asignatura::all();
        $totalTutores = Tutor::count();

        return Inertia::render('Tutores/index', [
            'tutores' => $tutores,
            'asignaturas' => $asignaturas,
            'totalTutores' => $totalTutores,
        ]);
    }

// TutorController.php

public function store(Request $request)
{
    $request->validate([
        'nombre' => 'required|string|max:255',
        'apellido' => 'required|string|max:255',
        'asignaturas' => 'required|array', // Validar que sea un arreglo
        'asignaturas.*' => 'exists:asignaturas,id', // Asegurarse de que las asignaturas existan en la base de datos
    ]);

    // Crear el tutor
    $tutor = Tutor::create([
        'nombre' => $request->nombre,
        'apellido' => $request->apellido,
    ]);

    // Asociar las asignaturas al tutor (relación de muchos a muchos)
    $tutor->asignaturas()->sync($request->asignaturas);

    return redirect()->back()->with('success', 'Tutor registrado exitosamente.');
}

    
    
    

// TutorController.php

public function update(Request $request, $id)
{
    $request->validate([
        'nombre' => 'required|string',
        'apellido' => 'required|string',
        'asignaturas' => 'required|array',
        'asignaturas.*' => 'exists:asignaturas,id',
    ]);

    $tutor = Tutor::findOrFail($id);
    $tutor->update($request->only(['nombre', 'apellido']));
    $tutor->asignaturas()->sync($request->asignaturas);

    return redirect()->route('tutores.index')->with('success', 'Tutor actualizado correctamente.');
}

    

    public function destroy($id)
{
    $tutor = Tutor::findOrFail($id); // Encuentra al tutor por ID
    $tutor->delete(); // Elimina al tutor

    return redirect()->back()->with('success', 'Tutor eliminado correctamente.');
   
}

    
    
    
}
