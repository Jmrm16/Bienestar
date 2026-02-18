<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('tutors', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('apellido');
            $table->string('tipo_documento');
            $table->string('documento')->unique();
            $table->string('lugar_expedicion');
            $table->string('sexo');
            $table->string('grupo_priorizado');
            $table->string('sede');

            $table->foreignId('carrera_id')->constrained('carreras')->cascadeOnDelete();

            $table->string('correo')->unique();
            $table->string('telefono');
            $table->enum('tipo_resolucion', ['R1','R2'])->default('R1');
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('tutors');
    }
};
