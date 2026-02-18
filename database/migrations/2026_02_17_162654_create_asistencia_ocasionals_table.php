<?php

// php artisan make:migration create_asistencias_ocasionales_table

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('asistencias_ocasionales', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('period_id');
            $table->unsignedBigInteger('report_window_id');
            $table->unsignedBigInteger('tutor_id');

            // si logra mapear a grupo_t, guárdalo; si no, deja null
            $table->unsignedBigInteger('grupo_id')->nullable();

            $table->string('identificacion', 64);
            $table->date('fecha');

            $table->string('nombres_del_estudiante')->nullable();
            $table->string('apellidos_del_estudiante')->nullable();
            $table->string('codigo_estudiantil')->nullable();
            $table->string('programa_academico')->nullable();

            $table->string('asignatura_texto')->nullable();
            $table->string('grupo_texto')->nullable();

            $table->string('sexo', 10)->nullable();
            $table->string('grupo_priorizado')->nullable();
            $table->unsignedTinyInteger('horas')->default(1);

            // clave anti-duplicado (más fácil que unique compuesto)
            $table->string('unique_key', 120)->unique();

            $table->timestamps();

            $table->index(['period_id', 'report_window_id']);
            $table->index(['tutor_id']);
            $table->index(['grupo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias_ocasionales');
    }
};
