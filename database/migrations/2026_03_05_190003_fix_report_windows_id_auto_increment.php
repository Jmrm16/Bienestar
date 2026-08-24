<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('report_windows') || ! Schema::hasColumn('report_windows', 'id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $idColumn = DB::selectOne("SHOW COLUMNS FROM `report_windows` LIKE 'id'");
        $hasAutoIncrement = str_contains(strtolower((string) ($idColumn->Extra ?? '')), 'auto_increment');

        $hasPrimaryKey = ! empty(DB::select("SHOW KEYS FROM `report_windows` WHERE Key_name = 'PRIMARY'"));
        if (! $hasPrimaryKey) {
            DB::statement("ALTER TABLE `report_windows` ADD PRIMARY KEY (`id`)");
        }

        if (! $hasAutoIncrement) {
            DB::statement("ALTER TABLE `report_windows` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        }

        $nextId = ((int) DB::table('report_windows')->max('id')) + 1;
        if ($nextId < 1) {
            $nextId = 1;
        }

        DB::statement("ALTER TABLE `report_windows` AUTO_INCREMENT = {$nextId}");
    }

    public function down(): void
    {
        // No-op: evita revertir metadatos críticos en una tabla en producción.
    }
};
