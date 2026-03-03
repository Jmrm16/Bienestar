<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deporte_participantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deporte_id')->constrained('deportes')->cascadeOnDelete();
            $table->string('tipo_documento', 5)->default('CC');
            $table->string('documento', 30);
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('estamento', 50)->default('Estudiante');
            $table->string('estado', 30)->default('Activo');
            $table->date('fecha_ingreso')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('correo', 150)->nullable();
            $table->foreignId('carrera_id')->nullable()->constrained('carreras')->nullOnDelete();
            $table->string('semestre', 20)->nullable();
            $table->text('observaciones')->nullable();
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['deporte_id', 'tipo_documento', 'documento'], 'deporte_participantes_unique_document');
            $table->index(['deporte_id', 'estado']);
            $table->index(['apellidos', 'nombres']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deporte_participantes');
    }
};
