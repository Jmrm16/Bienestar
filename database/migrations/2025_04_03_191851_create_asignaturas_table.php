<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('asignaturas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');

            // Relación con carreras
            $table->foreignId('carrera_id')
                  ->constrained('carreras')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('asignaturas');
    }
};
