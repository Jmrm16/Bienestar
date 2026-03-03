<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pacientes') || Schema::hasColumn('pacientes', 'carrera_id')) {
            return;
        }

        Schema::table('pacientes', function (Blueprint $table) {
            $table->foreignId('carrera_id')
                ->nullable()
                ->after('correo')
                ->constrained('carreras')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('pacientes') || !Schema::hasColumn('pacientes', 'carrera_id')) {
            return;
        }

        Schema::table('pacientes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carrera_id');
        });
    }
};
