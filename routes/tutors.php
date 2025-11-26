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
    
  });
});
