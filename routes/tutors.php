<?php
// routes/tutors.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PortalTutor\TutorAuthController;
use App\Http\Controllers\PortalTutor\TutorDashboardController;
use App\Http\Controllers\PortalTutor\TutorReportController;   

Route::prefix('portal-tutores')->name('portal.tutor.')->group(function () {
  Route::middleware('guest:tutor')->group(function () {
    Route::get('login', [TutorAuthController::class,'showLogin'])->name('login');
    Route::post('login', [TutorAuthController::class,'login'])->middleware('throttle:5,1')->name('login.post');
  });

  Route::middleware('auth:tutor')->group(function () {
    Route::post('logout', [TutorAuthController::class,'logout'])->name('logout');
    Route::get('/', [TutorDashboardController::class,'index'])->name('home');

    // Informes (mínimo borrador)

      Route::get(
          '/informes/tutor/{window}',
          [TutorReportController::class, 'upload']
      )->name('tutor.informes.upload');

Route::post(
    '/reportes/{window}/importar-asistencias',
    [TutorReportController::class, 'import']
)->name('informes.import');
Route::get(
  '/informes/tutor/{window}/asistencias/grupo/{grupo}',
  [TutorReportController::class, 'asistenciasGrupo']
)->name('informes.asistencias.grupo');


  Route::get('/informes/tutor/{window}/asistencias/ocasionales', [TutorReportController::class, 'asistenciasOcasionales'])
    ->name('informes.asistencias.ocasionales');





    
  });
});
