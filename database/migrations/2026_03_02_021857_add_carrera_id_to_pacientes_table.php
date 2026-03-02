<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pacientes', function (Blueprint $table) {
            // Ajusta el nombre de tu tabla de carreras si no es "carreras"
            $table->foreignId('carrera_id')
                ->nullable()
                ->after('correo')
                ->constrained('carreras')
                ->nullOnDelete();

            // Si ya tenías la columna "programa" (string) y la quieres eliminar:
            // $table->dropColumn('programa');
        });
    }

    public function down(): void
    {
        Schema::table('pacientes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');

            // Si la eliminaste en up, la puedes volver a crear:
            // $table->string('programa', 150)->nullable();
        });
    }
};