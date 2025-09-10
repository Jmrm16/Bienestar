<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
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
            
            // Aquí sustituimos el programa académico por la FK
            $table->foreignId('carrera_id')
                  ->constrained('carreras') // referencia a la tabla carreras
                  ->onDelete('cascade');   // si se elimina la carrera, se eliminan tutores

            $table->string('correo')->unique();
            $table->string('telefono');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tutors');
    }
};
