<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('estudiantes')) {
            return;
        }

        Schema::create('estudiantes', function (Blueprint $table) {
            $table->id();

            // `report_periods` se crea despues en el historial actual.
            $table->unsignedBigInteger('period_id');

            $table->string('identificacion', 50);
            $table->string('nombres', 150)->nullable();
            $table->string('apellidos', 150)->nullable();

            $table->string('sexo', 20)->nullable();
            $table->string('grupos_prioritarios', 255)->nullable();
            $table->string('estamento', 100)->nullable();
            $table->string('dependencia', 150)->nullable();
            $table->string('programa_academico', 150)->nullable();

            $table->string('servicio', 150)->nullable();
            $table->string('actividad', 200)->nullable();
            $table->string('responsable', 150)->nullable();
            $table->string('trimestre', 50)->nullable();

            $table->timestamps();

            $table->unique(
                ['period_id', 'identificacion', 'servicio', 'actividad', 'trimestre'],
                'uniq_est_period_serv_act_trim'
            );

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
