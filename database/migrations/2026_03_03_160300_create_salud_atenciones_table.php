<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salud_atenciones', function (Blueprint $table) {
            $table->id();
            $table->string('area', 50);
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes')->nullOnDelete();
            $table->date('fecha');
            $table->string('tipo', 120);
            $table->text('motivo_consulta')->nullable();
            $table->text('evaluacion');
            $table->text('plan_manejo')->nullable();
            $table->string('responsable', 120)->nullable();
            $table->text('observaciones')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['area', 'fecha']);
            $table->index(['area', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salud_atenciones');
    }
};
