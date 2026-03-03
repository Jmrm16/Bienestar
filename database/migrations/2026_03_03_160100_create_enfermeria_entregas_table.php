<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enfermeria_entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicamento_id')->constrained('enfermeria_medicamentos')->cascadeOnDelete();
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes')->nullOnDelete();
            $table->date('fecha_entrega');
            $table->unsignedInteger('cantidad');
            $table->string('responsable')->nullable();
            $table->string('destino')->nullable();
            $table->text('detalle')->nullable();
            $table->foreignId('entregado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fecha_entrega']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enfermeria_entregas');
    }
};
