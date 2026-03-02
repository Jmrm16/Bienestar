<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('grupo_t', function (Blueprint $table) {

            $table->id();

            // Periodo académico
            $table->foreignId('period_id')
                ->constrained('report_periods')
                ->onDelete('cascade');

            // Carrera
            $table->foreignId('carrera_id')
                ->constrained('carreras')
                ->onDelete('cascade');

            // Asignatura
            $table->foreignId('asignatura_id')
                ->constrained('asignaturas')
                ->onDelete('cascade');

            // Nombre del grupo (T1, A1, etc.)
            $table->string('nombre');

            // Código único del grupo
            $table->string('codigo');

            // Docente a cargo (si lo deseas mantener)
            $table->string('docente')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grupo_t');
    }
};
