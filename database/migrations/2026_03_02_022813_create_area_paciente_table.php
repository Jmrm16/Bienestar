<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('area_paciente', function (Blueprint $table) {
            $table->id();
            $table->string('area', 50); // medicina-general, odontologia, etc.
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['area', 'paciente_id']);
            $table->index(['area']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_paciente');
    }
};