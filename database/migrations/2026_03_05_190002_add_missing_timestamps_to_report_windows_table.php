<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $missingCreatedAt = ! Schema::hasColumn('report_windows', 'created_at');
        $missingUpdatedAt = ! Schema::hasColumn('report_windows', 'updated_at');

        if (! $missingCreatedAt && ! $missingUpdatedAt) {
            return;
        }

        Schema::table('report_windows', function (Blueprint $table) use ($missingCreatedAt, $missingUpdatedAt) {
            if ($missingCreatedAt) {
                $table->timestamp('created_at')->nullable();
            }

            if ($missingUpdatedAt) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        // No-op: no se eliminan columnas para evitar borrar timestamps preexistentes.
    }
};
