<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('periodo_grupo_tutor', function (Blueprint $table) {
            $table->id();

            $table->foreignId('period_id')
                ->constrained('report_periods')
                ->onDelete('cascade');

            $table->foreignId('tutor_id')
                ->constrained('tutors')
                ->onDelete('cascade');

            $table->foreignId('grupo_t_id')
                ->constrained('grupo_t')
                ->onDelete('cascade');

            // 🔥 Roles corregidos
            $table->enum('rol', ['principal', 'secundario'])
                  ->default('principal');

            $table->timestamps();

            // Evita duplicados por tutor–grupo–periodo
            $table->unique(['period_id','tutor_id','grupo_t_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodo_grupo_tutor');
    }
};
