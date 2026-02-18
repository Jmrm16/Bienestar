<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notas', function (Blueprint $table) {
            $table->id();

            /* =========================
               ESTUDIANTE
            ========================= */
            $table->string('codigo')->nullable();
            $table->string('apellidos');
            $table->string('nombres');
            $table->string('tipo_identificacion', 20);
            $table->string('identificacion', 20);

            /* =========================
               PROGRAMA / MATERIA
            ========================= */
            $table->string('ide_programa')->nullable();
            $table->string('programa')->nullable();
            $table->string('semestre')->nullable();

            $table->string('ide_materia')->nullable();
            $table->string('materia');
            $table->string('grupo')->nullable();

            /* =========================
               NOTAS
            ========================= */
            $table->decimal('nota_1', 5, 2)->nullable();
            $table->decimal('nota_2', 5, 2)->nullable();
            $table->decimal('nota_3', 5, 2)->nullable();
            $table->decimal('definitiva', 5, 2)->nullable();
            $table->decimal('habilitacion', 5, 2)->nullable();
            $table->decimal('final', 5, 2)->nullable();

            /* =========================
               PERIODO ACADÉMICO (REAL)
            ========================= */
            $table
                ->foreignId('period_id')
                ->constrained('report_periods')
                ->cascadeOnDelete();

            // Campos informativos (Excel / legacy)
            $table->integer('anio');
            $table->string('periodo', 10);

            /* =========================
               AUDITORÍA
            ========================= */
            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            /* =========================
               ÍNDICES CLAVE
            ========================= */
            $table->index(['identificacion']);
            $table->index(['ide_materia']);
            $table->index(['period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notas');
    }
};
