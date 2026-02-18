<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();

            // ✅ Grupo al que pertenece esta asistencia
            $table->foreignId('grupo_id')
                ->constrained('grupo_t')
                ->cascadeOnDelete();

            // ✅ Periodo académico donde se subió la info
            $table->foreignId('period_id')
                ->constrained('report_periods')
                ->cascadeOnDelete();

            // ✅ Ventana (primer informe, segundo informe, etc.) de donde vino la info
            $table->foreignId('report_window_id')
                ->constrained('report_windows')
                ->cascadeOnDelete();

            // ✅ Tutor responsable / quien sube la información
            $table->foreignId('tutor_id')
                ->constrained('tutors')
                ->cascadeOnDelete();

            // ✅ Datos del estudiante (mientras no tengas student_id propio)
            $table->string('nombres_del_estudiante');
            $table->string('apellidos_del_estudiante');
            $table->string('identificacion');
            $table->string('codigo_estudiantil')->nullable();
            $table->string('programa_academico')->nullable();
            $table->string('sexo')->nullable();
            $table->string('grupo_priorizado')->nullable();

            // ✅ Asistencia por fecha (NO guardamos total, guardamos el día)
            $table->date('fecha');

            // ✅ Opcional: horas de asistencia (siempre 1 por defecto)
            $table->unsignedTinyInteger('horas')->default(1);

            $table->timestamps();

            /**
             * ✅ Evitar duplicados:
             * mismo grupo + misma ventana + mismo estudiante + misma fecha
             */
            $table->unique(
                ['grupo_id', 'report_window_id', 'identificacion', 'fecha'],
                'asist_unique_window_day'
            );

            // ✅ Índices para consultas rápidas
            $table->index(['grupo_id', 'period_id'], 'asist_idx_grupo_periodo');
            $table->index(['tutor_id', 'report_window_id'], 'asist_idx_tutor_window');
            $table->index(['identificacion', 'fecha'], 'asist_idx_estudiante_fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
