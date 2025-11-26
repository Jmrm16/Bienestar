<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up() {
    Schema::create('report_periods', function (Blueprint $table) {
      $table->id();
      $table->string('code')->unique();   // "2025-1"
      $table->string('name')->nullable(); // "Periodo 2025-I"
      $table->date('starts_at')->nullable();
      $table->date('ends_at')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });
  }
  public function down() { Schema::dropIfExists('report_periods'); }
};
