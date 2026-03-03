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
use App\Http\Controllers\Admin\NotasImportController;
use App\Http\Controllers\Reports\PeriodInsightsController;
use App\Http\Controllers\SaludController;
use App\Http\Controllers\DeporteController;
use App\Http\Controllers\DesarrolloController;
use App\Http\Controllers\PromocionController;
use Illuminate\Routing\Router;


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
    |--------------------------------------------------------------------------
    | Estudiantes
    |--------------------------------------------------------------------------
    */
    Route::get('/estudiantes/reportes', [EstudianteController::class, 'reportes'])
        ->name('estudiantes.reportes');

    Route::resource('estudiantes', EstudianteController::class)->except(['create', 'edit', 'store']);

    Route::post('/estudiantes/importar-excel', [EstudianteController::class, 'cargarExcel'])
        ->name('estudiantes.import');



    /*
    |--------------------------------------------------------------------------
    | Tutores
    |--------------------------------------------------------------------------
    */
    Route::resource('tutores', TutorController::class)->except(['create', 'edit']);
    Route::get('/tutores/{tutor}/perfil', [TutorController::class, 'perfil'])->name('tutores.perfil');

    /*
    |--------------------------------------------------------------------------
    | Asignaturas
    |--------------------------------------------------------------------------
    | ⚠️ IMPORTANTE: NO repetir asignaturas.show porque ya viene con resource.
    */
    Route::resource('asignaturas', AsignaturaController::class)->except(['create', 'edit']);

    /*
    |--------------------------------------------------------------------------
    | Carreras
    |--------------------------------------------------------------------------
    */
    Route::resource('carreras', CarreraController::class)->except(['create', 'edit']);

    /*
    |--------------------------------------------------------------------------
    | Grupos (simples)
    |--------------------------------------------------------------------------
    */
    Route::resource('grupos', GrupoController::class)->except(['create', 'edit']);
    Route::post('/grupos/{grupo}/asignar-tutor', [GrupoController::class, 'asignarTutor'])
        ->name('grupos.asignar-tutor');

    /*
    |--------------------------------------------------------------------------
    | GruposT (con periodo y tutores por periodo)
    |--------------------------------------------------------------------------
    */
    Route::resource('grupost', GrupoTController::class)->except(['create', 'edit']);

    Route::post('/grupost/{grupo}/asignar-tutor', [GrupoTController::class, 'asignarTutor'])
        ->name('grupost.asignar-tutor');

    Route::post('/grupost/{grupo}/quitar-tutor', [GrupoTController::class, 'quitarTutor'])
        ->name('grupost.quitar-tutor');

    /*
    |--------------------------------------------------------------------------
    | Cultura (privado)
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | Acompañamientos
    |--------------------------------------------------------------------------
    */
    Route::resource('acompañamientos', AcompanamientoCarreraController::class)->except(['create', 'edit']);

    /*
    |--------------------------------------------------------------------------
    | Asistencias
    |--------------------------------------------------------------------------
    */
    Route::get('/asistencias/importar', [AsistenciaImportController::class, 'index'])
        ->name('asistencias.importar.form');

    Route::post('/asistencias/importar', [AsistenciaImportController::class, 'import'])
        ->name('asistencias.importar');

    Route::get('/grupos/{id}/asistencias', [AsistenciaImportController::class, 'verAsistenciasPorGrupo'])
        ->name('asistencias.ver');

    Route::get('/grupost/{grupo}/asistencias/importar', [AsistenciaImportController::class, 'importarPorGrupoVista'])
        ->name('grupost.asistencias.importar');

    /*
    |--------------------------------------------------------------------------
    | Reportes de periodos y entregas
    |--------------------------------------------------------------------------
    */
    Route::prefix('reportes')->name('reports.')->group(function () {

        Route::get('/periodos', [ReportController::class, 'periodsIndex'])->name('periods.index');
        Route::post('/periodos', [ReportController::class, 'periodsStore'])->name('periods.store');
        Route::put('/periodos/{period}', [ReportController::class, 'periodsUpdate'])->name('periods.update');
        Route::delete('/periodos/{period}', [ReportController::class, 'periodsDestroy'])->name('periods.destroy');

        Route::get('/periodos/{period}/entregas', [ReportController::class, 'windowsIndex'])->name('windows.index');
        Route::post('/periodos/{period}/entregas', [ReportController::class, 'windowsStore'])->name('windows.store');
        Route::put('/periodos/{period}/entregas/{window}', [ReportController::class, 'windowsUpdate'])->name('windows.update');
        Route::delete('/periodos/{period}/entregas/{window}', [ReportController::class, 'windowsDestroy'])->name('windows.destroy');

        Route::post('/periodos/{period}/entregas/{window}/assign-all', [ReportController::class, 'windowsAssignAll'])
            ->name('windows.assign_all');
        
Route::get('/periodos/{period}/export-charts', [ReportController::class, 'exportChartsExcel'])
    ->name('period.export_charts');

 
    });
       /*
    |--------------------------------------------------------------------------
    | Notas
    |--------------------------------------------------------------------------
    */
    Route::get('/notas', [NotasImportController::class, 'index'])->name('notas.index');
        Route::post('/notas/importar', [NotasImportController::class, 'store'])
        ->name('notas.importar');
    
     /*
    |--------------------------------------------------------------------------
    | Salud
    |--------------------------------------------------------------------------
    */
    Route::get('/salud', [SaludController::class, 'index'])->name('salud.index');
    Route::get('/salud/{area}', [SaludController::class, 'area'])->name('salud.area');
    Route::post('/salud/{area}/pacientes', [SaludController::class, 'patientsStore'])->name('salud.pacientes.store');
    Route::post('/salud/{area}/atenciones', [SaludController::class, 'clinicalAttentionStore'])->name('salud.atenciones.store');
    Route::post('/salud/{area}/medicamentos', [SaludController::class, 'nursingInventoryStore'])->name('salud.enfermeria.medicamentos.store');
    Route::post('/salud/{area}/entregas', [SaludController::class, 'nursingDeliveryStore'])->name('salud.enfermeria.entregas.store');
    Route::post('/salud/{area}/actividades', [SaludController::class, 'nursingActivityStore'])->name('salud.enfermeria.actividades.store');


   /*
    |--------------------------------------------------------------------------
    | Deportes
    |--------------------------------------------------------------------------
    */
    Route::get('/deportes', [DeporteController::class, 'index'])->name('deportes.index');
    Route::get('/deportes/{area}', [DeporteController::class, 'area'])->name('deportes.area');
    Route::get('/deportes/{area}/participantes/export', [DeporteController::class, 'participantsExport'])
        ->name('deportes.participantes.export');
    Route::post('/deportes/{area}/participantes', [DeporteController::class, 'participantsStore'])
        ->name('deportes.participantes.store');
    Route::put('/deportes/{area}/participantes/{participant}', [DeporteController::class, 'participantsUpdate'])
        ->name('deportes.participantes.update');
    Route::delete('/deportes/{area}/participantes/{participant}', [DeporteController::class, 'participantsDestroy'])
        ->name('deportes.participantes.destroy');


    /*
    |--------------------------------------------------------------------------
    | Desarrollo Humano
    |--------------------------------------------------------------------------
    */ 
    Route::get('/desarrollo-humano', [DesarrolloController::class, 'index'])->name('desarrollo.index');


    /*
    |--------------------------------------------------------------------------
    | Promoción Socioeconómica
    |--------------------------------------------------------------------------
    */ 
    Route::get('/promocion-socioeconomica', [PromocionController::class, 'index'])->name('promocion.index');




    











});

/*
|--------------------------------------------------------------------------
| Otros archivos
|--------------------------------------------------------------------------
*/
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/tutors.php';
