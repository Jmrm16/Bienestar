<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tutor_reports') || ! Schema::hasColumn('tutor_reports', 'id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $idColumn = DB::selectOne("SHOW COLUMNS FROM `tutor_reports` LIKE 'id'");
        $hasAutoIncrement = str_contains(strtolower((string) ($idColumn->Extra ?? '')), 'auto_increment');

        if (! $hasAutoIncrement) {
            DB::statement("ALTER TABLE `tutor_reports` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        }

        $nextId = ((int) DB::table('tutor_reports')->max('id')) + 1;
        if ($nextId < 1) {
            $nextId = 1;
        }

        DB::statement("ALTER TABLE `tutor_reports` AUTO_INCREMENT = {$nextId}");
    }

    public function down(): void
    {
        // No-op para evitar revertir metadatos críticos.
    }
};
