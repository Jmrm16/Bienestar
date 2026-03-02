<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pacientes', function (Blueprint $table) {
            $table->id();

            $table->string('tipo_documento', 5)->default('CC');
            $table->string('documento', 30);

            $table->string('nombres', 100);
            $table->string('apellidos', 100);

            $table->string('telefono', 30)->nullable();
            $table->string('correo', 150)->nullable();

            $table->string('programa', 150)->nullable();
            $table->string('semestre', 20)->nullable();

            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['tipo_documento', 'documento']);
            $table->index(['apellidos', 'nombres']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pacientes');
    }
};