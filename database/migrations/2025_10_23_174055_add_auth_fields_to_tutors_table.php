<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tutors')) {
            return;
        }

        Schema::table('tutors', function (Blueprint $table) {
            if (!Schema::hasColumn('tutors', 'codigo')) {
                $table->string('codigo')->unique()->nullable()->after('id');
            }

            if (!Schema::hasColumn('tutors', 'cedula_hash')) {
                $table->string('cedula_hash')->nullable()->after('documento');
            }

            if (!Schema::hasColumn('tutors', 'activo')) {
                $table->boolean('activo')->default(true)->after('telefono');
            }

            if (!Schema::hasColumn('tutors', 'ultimo_ingreso_at')) {
                $table->timestamp('ultimo_ingreso_at')->nullable()->after('activo');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('tutors')) {
            return;
        }

        Schema::table('tutors', function (Blueprint $table) {
            $columns = [];

            foreach (['codigo', 'cedula_hash', 'activo', 'ultimo_ingreso_at'] as $column) {
                if (Schema::hasColumn('tutors', $column)) {
                    $columns[] = $column;
                }
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
