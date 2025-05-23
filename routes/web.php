<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\AsignaturaController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\GrupoController;
use App\Http\Controllers\ImportarEstudiantesController;
use App\Http\Controllers\AcompanamientoCarreraController;



use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');
Route::get('/graduacion', function () {
    return Inertia::render('graduacion');
})->name('graduacion');






// routes/web.php



// 🟢 Rutas protegidas con autenticación
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/estudiantes/grupos/{grupo}', [EstudianteController::class, 'showGrupo'])->name('estudiantes.grupos.show');
    // 🟢 Rutas para tutores
Route::resource('tutores', TutorController::class)->except(['create', 'edit']);

// 🟢 Rutas para asignaturas (evita definirlas manualmente)
Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);

Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit']);

Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

Route::resource('grupos',GrupoController::class)->except(['create', 'edit']);

Route::resource('grupost',GrupoController::class)->except(['create', 'edit']);

Route::resource('acompañamientos',AcompanamientoCarreraController::class)->except(['create', 'edit']);

// Ruta para asignar un tutor a un grupo
Route::post('/grupos/{grupo}/asignar-tutor', [GrupoController::class, 'asignarTutor']);

// Ruta para el perfil del tutor
Route::get('/tutores/{tutor}/perfil', [TutorController::class, 'perfil'])->name('tutores.perfil');
Route::resource('tutores', TutorController::class);



Route::post('/estudiantes/cargar-excel', [EstudianteController::class, 'cargarExcel']);
});
// 🔹 Incluyendo otros archivos de rutas
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
