<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('culturas')) {
            return;
        }

        Schema::table('culturas', function (Blueprint $table) {
            if (!Schema::hasColumn('culturas', 'categoria')) {
                $table->string('categoria')->nullable();
            }

            if (!Schema::hasColumn('culturas', 'lugar')) {
                $table->string('lugar')->nullable();
            }

            if (!Schema::hasColumn('culturas', 'hora')) {
                $table->string('hora')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('culturas')) {
            return;
        }

        Schema::table('culturas', function (Blueprint $table) {
            $columns = [];

            foreach (['categoria', 'lugar', 'hora'] as $column) {
                if (Schema::hasColumn('culturas', $column)) {
                    $columns[] = $column;
                }
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
