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
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| Rutas públicas
|--------------------------------------------------------------------------
*/
Route::get('/', [CulturaController::class, 'home'])->name('home');
Route::get('/graduacion', fn () => Inertia::render('graduacion'))->name('graduacion');
Route::get('/cultura', [CulturaController::class, 'vistaPublica'])->name('cultura');
Route::get('/cultura/{cultura}/item', [CulturaController::class, 'show'])->name('cultura.show');
Route::get('/permanencia/tutorias', [TutoriasController::class, 'index'])->name('tutorias.index');

/*
|--------------------------------------------------------------------------
| Rutas privadas (auth + verified)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /*
    |----------------------------------------------------------------------
    | Estudiantes
    |----------------------------------------------------------------------
    */
    Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit']);
    Route::get('/estudiantes/grupos/{grupo}', [EstudianteController::class, 'showGrupo'])
        ->name('estudiantes.grupos.show');
    Route::post('/estudiantes/cargar-excel', [EstudianteController::class, 'cargarExcel'])
        ->name('estudiantes.cargar-excel');

    /*
    |----------------------------------------------------------------------
    | Tutores
    |----------------------------------------------------------------------
    | En el frontend usa:
    |   router.post(route('tutores.update', id),  { ...data, _method:'put' })
    |   router.post(route('tutores.destroy', id), { _method:'delete' })
    */
    Route::resource('tutores', TutorController::class)->except(['create', 'edit']);
    Route::get('/tutores/{tutor}/perfil', [TutorController::class, 'perfil'])->name('tutores.perfil');

    /*
    |----------------------------------------------------------------------
    | Asignaturas
    |----------------------------------------------------------------------
    */
    Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);
    // Si tu controlador ya implementa show, el resource lo crea. Esta línea es opcional.
    Route::get('/asignaturas/{asignatura}', [AsignaturaController::class, 'show'])
        ->name('asignaturas.show');

    /*
    |----------------------------------------------------------------------
    | Carreras
    |----------------------------------------------------------------------
    */
    Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

    /*
    |----------------------------------------------------------------------
    | Grupos
    |----------------------------------------------------------------------
    */
    Route::resource('grupos', GrupoController::class)->except(['create', 'edit']);
    Route::post('/grupos/{grupo}/asignar-tutor', [GrupoController::class, 'asignarTutor'])
        ->name('grupos.asignar-tutor');

    /*
    |----------------------------------------------------------------------
    | GruposT
    |----------------------------------------------------------------------
    | IMPORTANTE: no duplicamos el DELETE; ya lo da Route::resource('grupost', ...).
    | En el frontend usa POST + _method:
    |   router.post(route('grupost.destroy', id), { _method:'delete' })
    */
    Route::resource('grupost', GrupoTController::class)->except(['create', 'edit']);
    Route::post('/grupost/{grupo}/asignar-tutor', [GrupoTController::class, 'asignarTutor'])
        ->name('grupost.asignar-tutor');
    Route::post('/grupost/{grupo}/quitar-tutor', [GrupoTController::class, 'quitarTutor'])
        ->name('grupost.quitar-tutor');

    /*
    |----------------------------------------------------------------------
    | Cultura (privado)
    |----------------------------------------------------------------------
    */
    Route::get('/culturas', [CulturaController::class, 'index'])->name('cultura.index');
    Route::get('/culturas/create', [CulturaController::class, 'create'])->name('cultura.create');
    Route::post('/culturas', [CulturaController::class, 'store'])->name('cultura.store');
    Route::get('/culturas/{cultura}/edit', [CulturaController::class, 'edit'])->name('cultura.edit');
    Route::put('/culturas/{cultura}', [CulturaController::class, 'update'])->name('cultura.update');
    Route::delete('/culturas/{cultura}', [CulturaController::class, 'destroy'])->name('cultura.destroy');
    Route::post('/culturas/upload-image', [CulturaController::class, 'uploadImage'])->name('cultura.uploadImage');
    Route::get('/cultura/publica', [CulturaController::class, 'vistaPublica']);

    /*
    |----------------------------------------------------------------------
    | Acompañamientos
    |----------------------------------------------------------------------
    */
    Route::resource('acompañamientos', AcompanamientoCarreraController::class)->except(['create', 'edit']);

    /*
    |----------------------------------------------------------------------
    | Asistencias
    |----------------------------------------------------------------------
    */
    Route::get('/asistencias/importar', [AsistenciaImportController::class, 'index'])
        ->name('asistencias.importar.form');
    Route::post('/asistencias/importar', [AsistenciaImportController::class, 'import'])
        ->name('asistencias.importar');
    Route::get('/grupos/{id}/asistencias', [AsistenciaImportController::class, 'verAsistenciasPorGrupo'])
        ->name('asistencias.ver');
    Route::get('/grupost/{grupo}/asistencias/importar', [AsistenciaImportController::class, 'importarPorGrupoVista'])
        ->name('grupost.asistencias.importar');

    Route::prefix('reportes')->name('reports.')->group(function () {
    // Periodos
    Route::get('/periodos', [ReportController::class, 'periodsIndex'])->name('periods.index');
    Route::post('/periodos', [ReportController::class, 'periodsStore'])->name('periods.store');
    Route::put('/periodos/{period}', [ReportController::class, 'periodsUpdate'])->name('periods.update');
    Route::delete('/periodos/{period}', [ReportController::class, 'periodsDestroy'])->name('periods.destroy');

    // Ventanas/Entregas por periodo
    Route::get('/periodos/{period}/entregas', [ReportController::class, 'windowsIndex'])->name('windows.index');
    Route::post('/periodos/{period}/entregas', [ReportController::class, 'windowsStore'])->name('windows.store');
    Route::put('/periodos/{period}/entregas/{window}', [ReportController::class, 'windowsUpdate'])->name('windows.update');
    Route::delete('/periodos/{period}/entregas/{window}', [ReportController::class, 'windowsDestroy'])->name('windows.destroy');

    // Asignación masiva
    Route::post('/periodos/{period}/entregas/{window}/assign-all', [ReportController::class, 'windowsAssignAll'])
        ->name('windows.assign_all');
});

    
});

/*
|--------------------------------------------------------------------------
| Otros archivos de rutas
|--------------------------------------------------------------------------
*/
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/tutors.php';
