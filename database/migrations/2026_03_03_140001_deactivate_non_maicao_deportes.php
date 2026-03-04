<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('deportes')) {
            return;
        }

        DB::table('deportes')
            ->whereIn('slug', [
                'tiro-con-arco',
                'tenis-de-mesa',
                'porrismo',
                'patinaje',
                'multiaventura-universitario',
                'juegos-tradicionales',
                'entrenamiento-funcional',
                'deporte-inclusivo',
                'atletismo',
                'actividad-fisica-musicalizada',
            ])
            ->update([
                'active' => false,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('deportes')) {
            return;
        }

        DB::table('deportes')
            ->whereIn('slug', [
                'tiro-con-arco',
                'tenis-de-mesa',
                'porrismo',
                'patinaje',
                'multiaventura-universitario',
                'juegos-tradicionales',
                'entrenamiento-funcional',
                'deporte-inclusivo',
                'atletismo',
                'actividad-fisica-musicalizada',
            ])
            ->update([
                'active' => true,
                'updated_at' => now(),
            ]);
    }
};
