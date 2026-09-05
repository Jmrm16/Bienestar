<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            ! Schema::hasTable('tutors') ||
            ! Schema::hasColumn('tutors', 'tipo_resolucion')
        ) {
            return;
        }

        Schema::table('tutors', function (Blueprint $table) {
            $table->enum('tipo_resolucion', ['R1', 'R2'])
                ->nullable()
                ->default(null)
                ->change();
        });
    }

    public function down(): void
    {
        if (
            ! Schema::hasTable('tutors') ||
            ! Schema::hasColumn('tutors', 'tipo_resolucion')
        ) {
            return;
        }

        Schema::table('tutors', function (Blueprint $table) {
            $table->enum('tipo_resolucion', ['R1', 'R2'])
                ->nullable(false)
                ->default('R1')
                ->change();
        });
    }
};
