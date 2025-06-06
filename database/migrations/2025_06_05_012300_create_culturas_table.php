<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('culturas', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion');
            $table->string('tipo');
            $table->string('imagen_banner')->nullable();
            $table->json('imagenes_extra')->nullable();
            $table->date('fecha')->nullable();
            $table->boolean('publicado')->default(false);
            $table->timestamps();
            $table->json('contenido_json')->nullable(); // ✅ nuevo

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('culturas');
    }
};
