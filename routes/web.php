<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controladores
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
use App\Http\Controllers\CulturaController;
use App\Http\Controllers\AsistenciaImportController;

// 🔹 Página pública
Route::get('/', fn () => Inertia::render('welcome'))->name('home');
Route::get('/graduacion', fn () => Inertia::render('graduacion'))->name('graduacion');
Route::get('/cultura', fn () => Inertia::render('cultura'))->name('cultura');

// Cultura pública
Route::get('/cultura/{cultura}/item', [CulturaController::class, 'show'])->name('cultura.show');

// Tutorías permanencia
Route::get('/permanencia/tutorias', [TutoriasController::class, 'index'])->name('tutorias.index');

// 🟢 Rutas protegidas con autenticación
Route::middleware(['auth', 'verified'])->group(function () {

    // 📊 Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 👨‍🎓 Estudiantes
    Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit']);
    Route::get('/estudiantes/grupos/{grupo}', [EstudianteController::class, 'showGrupo'])->name('estudiantes.grupos.show');
    Route::post('/estudiantes/cargar-excel', [EstudianteController::class, 'cargarExcel'])->name('estudiantes.cargar-excel');

    // 👨‍🏫 Tutores
    Route::resource('tutores', TutorController::class)->except(['create', 'edit']);
    Route::get('/tutores/{tutor}/perfil', [TutorController::class, 'perfil'])->name('tutores.perfil');

    // 📚 Asignaturas
    Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);
    Route::get('/asignaturas/{asignatura}', [AsignaturaController::class, 'show'])->name('asignaturas.show');

    // 🎓 Carreras
    Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

    // 👥 Grupos
    Route::resource('grupos', GrupoController::class)->except(['create', 'edit']);
    Route::post('/grupos/{grupo}/asignar-tutor', [GrupoController::class, 'asignarTutor'])->name('grupos.asignar-tutor');

    // GruposT (si se usan por separado)
    Route::resource('grupost', GrupoTController::class)->except(['create', 'edit']);
    Route::post('/grupost/{grupo}/asignar-tutor', [GrupoTController::class, 'asignarTutor'])->name('grupost.asignar-tutor');

    // 🧾 Cultura (Privado)
    Route::get('/culturas', [CulturaController::class, 'index'])->name('cultura.index');
    Route::get('/culturas/create', [CulturaController::class, 'create'])->name('cultura.create');
    Route::post('/culturas', [CulturaController::class, 'store'])->name('cultura.store');
    Route::get('/culturas/{cultura}/edit', [CulturaController::class, 'edit'])->name('cultura.edit');
    Route::put('/culturas/{cultura}', [CulturaController::class, 'update'])->name('cultura.update');
    Route::delete('/culturas/{cultura}', [CulturaController::class, 'destroy'])->name('cultura.destroy');
    Route::post('/culturas/upload-image', [CulturaController::class, 'uploadImage'])->name('cultura.uploadImage');
    Route::get('/cultura/publica', [CulturaController::class, 'vistaPublica']);

    // 🟨 Acompañamientos
    Route::resource('acompañamientos', AcompanamientoCarreraController::class)->except(['create', 'edit']);

    // ✅ Importar asistencias (vista + acción global)
    Route::get('/asistencias/importar', [AsistenciaImportController::class, 'index'])->name('asistencias.importar.form');
    Route::post('/asistencias/importar', [AsistenciaImportController::class, 'import'])->name('asistencias.importar');

    // ✅ Importar asistencias por grupo
    Route::get('/grupost/{grupo}/asistencias/importar', [AsistenciaImportController::class, 'importarPorGrupoVista'])->name('grupost.asistencias.importar');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
