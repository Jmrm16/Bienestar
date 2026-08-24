<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('deportes')) {
            return;
        }

        if (!Schema::hasColumn('deportes', 'card_subtitle')) {
            Schema::table('deportes', function (Blueprint $table) {
                $table->string('card_subtitle')->nullable()->after('title');
            });
        }

        $this->updateSubtitles($this->subtitles());
    }

    public function down(): void
    {
        if (!Schema::hasTable('deportes') || !Schema::hasColumn('deportes', 'card_subtitle')) {
            return;
        }

        Schema::table('deportes', function (Blueprint $table) {
            $table->dropColumn('card_subtitle');
        });
    }

    private function updateSubtitles(array $subtitles): void
    {
        if (!Schema::hasColumn('deportes', 'card_subtitle')) {
            return;
        }

        foreach ($subtitles as $slug => $subtitle) {
            DB::table('deportes')
                ->where('slug', $slug)
                ->update([
                    'card_subtitle' => $subtitle,
                    'updated_at' => now(),
                ]);
        }
    }

    private function subtitles(): array
    {
        return [
            'prestamo-de-implementos-deportivos' => 'Practica libre',
            'voleibol' => 'Competencia y formacion',
            'baloncesto' => 'Representacion deportiva',
            'futbol' => 'Entrenamiento y torneo',
            'entrenamiento-funcional' => 'Acondicionamiento grupal',
            'taekwondo' => 'Tecnica y disciplina',
            'porrismo' => 'Expresion y equipo',
            'actividad-fisica-musicalizada' => 'Bienestar con ritmo',
            'atletismo' => 'Rendimiento fisico',
            'deporte-inclusivo' => 'Participacion abierta',
            'patinaje' => 'Tecnica en movimiento',
            'futbol-sala' => 'Juego bajo techo',
            'juegos-tradicionales' => 'Recreacion e identidad',
            'tenis-de-mesa' => 'Precision y reflejos',
            'tiro-con-arco' => 'Control y punteria',
            'multiaventura-universitario' => 'Reto e integracion',
        ];
    }
};
