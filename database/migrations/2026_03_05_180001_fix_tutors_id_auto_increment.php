<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tutors') || ! Schema::hasColumn('tutors', 'id')) {
            return;
        }

        // Esta migración repara específicamente el AUTO_INCREMENT de MySQL.
        // SQLite ya maneja correctamente el ID creado mediante $table->id().
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $column = DB::selectOne("SHOW COLUMNS FROM `tutors` LIKE 'id'");

        $extra = strtolower((string) ($column->Extra ?? ''));

        if (str_contains($extra, 'auto_increment')) {
            return;
        }

        DB::statement(
            'ALTER TABLE `tutors` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT'
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('tutors') || ! Schema::hasColumn('tutors', 'id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(
            'ALTER TABLE `tutors` MODIFY `id` BIGINT UNSIGNED NOT NULL'
        );
    }
};
