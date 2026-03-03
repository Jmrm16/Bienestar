<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->id();

            // ✅ Relación con periodo
            $table->foreignId('period_id')
                ->constrained('report_periods')
                ->cascadeOnDelete();

            // ✅ Datos del Excel
            $table->string('identificacion', 50);          // IDENTIFICACION
            $table->string('nombres', 150)->nullable();    // (si separas)
            $table->string('apellidos', 150)->nullable();  // (si separas)

            $table->string('sexo', 20)->nullable();                 // SEXO
            $table->string('grupos_prioritarios', 255)->nullable(); // GRUPOS PRIORITARIOS
            $table->string('estamento', 100)->nullable();           // ESTAMENTO
            $table->string('dependencia', 150)->nullable();         // DEPENDENCIA (repitencia sí, acompañamiento puede no)
            $table->string('programa_academico', 150)->nullable();  // PROGRAMA ACADEMICO

            // ✅ clave para separar registros repetidos
            $table->string('servicio', 150)->nullable();            // hoja o columna SERVICIO
            $table->string('actividad', 200)->nullable();           // ACTIVIDAD (puede ser larga)
            $table->string('responsable', 150)->nullable();         // RESPONSABLE
            $table->string('trimestre', 50)->nullable();            // TRIMESTRE

            $table->timestamps();

            // ✅ Evita duplicados EXACTOS del mismo estudiante en el mismo servicio/actividad/trimestre
            $table->unique(
                ['period_id', 'identificacion', 'servicio', 'actividad', 'trimestre'],
                'uniq_est_period_serv_act_trim'
            );

            // ✅ índices para búsquedas y reportes
            $table->index(['period_id']);
            $table->index(['identificacion']);
            $table->index(['period_id', 'servicio']);
            $table->index(['period_id', 'actividad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiantes');
    }
};