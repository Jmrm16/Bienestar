<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enfermeria_medicamentos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('presentacion')->nullable();
            $table->string('lote')->nullable();
            $table->string('proveedor')->nullable();
            $table->date('fecha_entrada');
            $table->date('fecha_vencimiento')->nullable();
            $table->unsignedInteger('cantidad_inicial');
            $table->unsignedInteger('cantidad_disponible');
            $table->string('unidad', 30)->default('unidad');
            $table->string('ubicacion')->nullable();
            $table->text('observaciones')->nullable();
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['nombre']);
            $table->index(['fecha_vencimiento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enfermeria_medicamentos');
    }
};
