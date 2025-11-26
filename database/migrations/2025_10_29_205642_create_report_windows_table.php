<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up() {
    Schema::create('report_windows', function (Blueprint $table) {
      $table->id();
      $table->foreignId('period_id')->constrained('report_periods')->cascadeOnDelete();
      $table->string('name');                     // "Entrega 1" / "Horario"
      $table->enum('tutor_type', ['R1','R2']);    // primera/segunda resolución
      $table->dateTime('open_at');
      $table->dateTime('due_at')->nullable();     // null = sin fecha de entrega
      $table->dateTime('close_at')->nullable();
      $table->text('instructions')->nullable();   // texto largo de la tarea
      $table->boolean('is_published')->default(false);
      $table->timestamps();
    });
  }
  public function down() { Schema::dropIfExists('report_windows'); }
};

