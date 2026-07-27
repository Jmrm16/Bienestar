<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('tutors') || ! Schema::hasColumn('tutors', 'tipo_resolucion')) {
            return;
        }

        DB::statement("ALTER TABLE tutors MODIFY tipo_resolucion ENUM('R1','R2') NULL DEFAULT NULL");
    }

    public function down(): void
    {
        if (! Schema::hasTable('tutors') || ! Schema::hasColumn('tutors', 'tipo_resolucion')) {
            return;
        }

        DB::statement("UPDATE tutors SET tipo_resolucion = 'R1' WHERE tipo_resolucion IS NULL");
        DB::statement("ALTER TABLE tutors MODIFY tipo_resolucion ENUM('R1','R2') NOT NULL DEFAULT 'R1'");
    }
};
