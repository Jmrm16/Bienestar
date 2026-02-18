<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('asignaturas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('carrera_id')->constrained('carreras')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('asignaturas');
    }
};
