<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\AsignaturaController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\GrupoController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');




// 🟢 Rutas para tutores
Route::resource('tutores', TutorController::class)->except(['create', 'edit']);

// 🟢 Rutas para asignaturas (evita definirlas manualmente)
Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);


Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit']);

Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

Route::resource('grupos',GrupoController::class)->except(['create', 'edit']);





// 🟢 Rutas protegidas con autenticación
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// 🔹 Incluyendo otros archivos de rutas
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
