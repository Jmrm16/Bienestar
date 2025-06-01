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
            $table->string('codigo')->nullable();
            $table->string('apellidos')->nullable();
            $table->string('nombres')->nullable();
            $table->string('tipo_identificacion')->nullable();
            $table->string('identificacion')->nullable();
            $table->string('ide_programa')->nullable();
            $table->string('programa')->nullable();
            $table->string('semestre')->nullable();
            $table->string('ide_materia')->nullable();
            $table->string('materia')->nullable();
            $table->string('grupo')->nullable();
            $table->string('primer_corte')->nullable();
            $table->string('segundo_corte')->nullable();
            $table->string('tercer_corte')->nullable();
            $table->string('definitiva')->nullable();
            $table->string('habilitacion')->nullable();
            $table->string('final')->nullable();
            $table->string('anio')->nullable();
            $table->string('periodo')->nullable();
            $table->string('email')->nullable();
            $table->string('celular')->nullable();
            $table->string('nota_faltante')->nullable();
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
