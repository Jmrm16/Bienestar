<?php

// database/migrations/xxxx_xx_xx_create_acompanamiento_grupos_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAcompanamientoGruposTable extends Migration
{
    public function up(): void
    {
        Schema::create('acompanamiento_grupos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('codigo')->unique();
            $table->foreignId('acompanamiento_carrera_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acompanamiento_grupos');
    }
}

