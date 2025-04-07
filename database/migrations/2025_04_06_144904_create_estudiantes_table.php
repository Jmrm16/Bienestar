<?php

// database/migrations/xxxx_xx_xx_create_estudiantes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEstudiantesTable extends Migration
{
    public function up(): void
    {
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->id();
            $table->integer('numero')->nullable();
            $table->string('codigo')->nullable();
            $table->string('apellidos')->nullable();
            $table->string('nombres')->nullable();
            $table->string('tipo_identificacion')->nullable();
            $table->string('identificacion')->nullable();
            $table->string('ciudad_expedicion')->nullable();
            $table->string('sexo')->nullable();
            $table->string('programa')->nullable();
            $table->string('semestre')->nullable();
            $table->string('correo_institucional')->nullable();
            $table->foreignId('grupo_id')->constrained()->onDelete('cascade');
            $table->foreignId('tutor_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiantes');
    }
}
