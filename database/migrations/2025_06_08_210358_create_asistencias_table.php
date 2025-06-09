<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();

            // ✅ Relación con grupo_t
            $table->foreignId('grupo_id')->constrained('grupo_t')->onDelete('cascade');

            // ✅ Campos reales
            $table->string('nombres_del_estudiante');
            $table->string('apellidos_del_estudiante');
            $table->string('identificacion');
            $table->string('codigo_estudiantil')->nullable();
            $table->string('programa_academico')->nullable();
            $table->string('sexo')->nullable();
            $table->string('grupo_priorizado')->nullable();
            $table->date('fecha');
            $table->integer('horas')->default(1);

            // ✅ Nuevo campo: número total de asistencias (evita duplicar)
            $table->integer('total_asistencias')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
