<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\AsignaturaController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\GrupoController;
use App\Http\Controllers\GrupoTController;
use App\Http\Controllers\ImportarEstudiantesController;
use App\Http\Controllers\AcompanamientoCarreraController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TutoriasController;
use Inertia\Inertia;

// 🔹 Página principal
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');
Route::get('/permanencia/tutorias', [TutoriasController::class, 'index'])->name('tutorias.index');
Route::get('/cultura', function () {
    return Inertia::render('cultura');
})->name('cultura');
Route::get('/graduacion', function () {
    return Inertia::render('graduacion');
})->name('graduacion');

// 🟢 Rutas protegidas con autenticación
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard principal
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 🟢 Estudiantes
    Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit']);
    Route::get('/estudiantes/grupos/{grupo}', [EstudianteController::class, 'showGrupo'])->name('estudiantes.grupos.show');
    Route::post('/estudiantes/cargar-excel', [EstudianteController::class, 'cargarExcel'])->name('estudiantes.cargar-excel');

    // 🟢 Tutores
    Route::resource('tutores', TutorController::class)->except(['create', 'edit']);
    Route::get('/tutores/{tutor}/perfil', [TutorController::class, 'perfil'])->name('tutores.perfil');

    // 🟢 Asignaturas
    Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);

    // 🟢 Carreras
    Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

    // 🟢 Grupos (normal)
    Route::resource('grupos', GrupoController::class)->except(['create', 'edit']);
    Route::post('/grupos/{grupo}/asignar-tutor', [GrupoController::class, 'asignarTutor'])->name('grupos.asignar-tutor');

    // 🟢 GruposT (controlador separado, si realmente lo usas aparte)
    Route::resource('grupost', GrupoTController::class)->except(['create', 'edit']);
    Route::post('/grupost/{grupo}/asignar-tutor', [GrupoTController::class, 'asignarTutor'])->name('grupost.asignar-tutor');

    // 🟢 Acompañamientos
    Route::resource('acompañamientos', AcompanamientoCarreraController::class)->except(['create', 'edit']);

});

// 🔹 Otras configuraciones
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
