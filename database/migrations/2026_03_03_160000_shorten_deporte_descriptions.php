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

        $this->updateDescriptions($this->shortDescriptions());
    }

    public function down(): void
    {
        if (!Schema::hasTable('deportes')) {
            return;
        }

        $this->updateDescriptions($this->originalDescriptions());
    }

    private function updateDescriptions(array $descriptions): void
    {
        foreach ($descriptions as $slug => $description) {
            DB::table('deportes')
                ->where('slug', $slug)
                ->update([
                    'description' => $description,
                    'updated_at' => now(),
                ]);
        }
    }

    private function shortDescriptions(): array
    {
        return [
            'prestamo-de-implementos-deportivos' => 'Prestamo temporal de espacios e implementos para practica libre y recreativa.',
            'voleibol' => 'Practica, formacion y participacion competitiva en voleibol.',
            'baloncesto' => 'Formacion deportiva y representacion institucional en baloncesto.',
            'futbol' => 'Entrenamiento, integracion y competencia en futbol.',
            'entrenamiento-funcional' => 'Acondicionamiento fisico y fortalecimiento corporal en sesiones grupales.',
            'taekwondo' => 'Formacion tecnica y disciplina deportiva en taekwondo.',
            'porrismo' => 'Entrenamiento coreografico y representacion institucional en porrismo.',
            'actividad-fisica-musicalizada' => 'Sesiones grupales de movimiento, ritmo y bienestar.',
            'atletismo' => 'Preparacion fisica y tecnica para pruebas de atletismo.',
            'deporte-inclusivo' => 'Espacios deportivos orientados a la inclusion y participacion.',
            'patinaje' => 'Formacion tecnica y acondicionamiento en patinaje.',
            'futbol-sala' => 'Practica y competencia en futbol sala.',
            'juegos-tradicionales' => 'Actividades recreativas para integracion y tiempo libre.',
            'tenis-de-mesa' => 'Practica formativa y competitiva en tenis de mesa.',
            'tiro-con-arco' => 'Disciplina de precision con practica tecnica supervisada.',
            'multiaventura-universitario' => 'Actividades de reto, integracion y aventura universitaria.',
        ];
    }

    private function originalDescriptions(): array
    {
        return [
            'prestamo-de-implementos-deportivos' => 'Servicio orientado al buen uso del tiempo libre de los estamentos de la Universidad de La Guajira mediante actividades recreativas y deportivas de practica libre, solicitando espacios e implementos en la oficina de deportes.',
            'voleibol' => 'Disciplina coordinada por el area de Deporte para fortalecer la formacion deportiva, la practica institucional y la participacion en competencias.',
            'baloncesto' => 'Espacio de practica, formacion y representacion institucional para estudiantes y comunidad universitaria.',
            'futbol' => 'Proceso de formacion y practica competitiva que fomenta integracion, disciplina y aprovechamiento del tiempo libre.',
            'entrenamiento-funcional' => 'Sesiones orientadas al acondicionamiento fisico, fortalecimiento corporal y mejoramiento del rendimiento general.',
            'taekwondo' => 'Disciplina de formacion deportiva enfocada en tecnica, autocontrol, preparacion fisica y participacion competitiva.',
            'porrismo' => 'Proceso de entrenamiento enfocado en coordinacion, fuerza, expresion corporal y representacion institucional.',
            'actividad-fisica-musicalizada' => 'Jornadas grupales de movimiento, ritmo y bienestar para promover habitos de vida activa dentro de la comunidad universitaria.',
            'atletismo' => 'Espacio para el desarrollo de habilidades fisicas y tecnicas en pruebas de pista y campo.',
            'deporte-inclusivo' => 'Oferta deportiva orientada a promover participacion, inclusion y acceso al deporte para diferentes estamentos y capacidades.',
            'patinaje' => 'Disciplina enfocada en tecnica, control corporal y fortalecimiento de habilidades motrices sobre ruedas.',
            'futbol-sala' => 'Disciplina de practica y competencia en espacios cubiertos que fortalece trabajo en equipo y rendimiento deportivo.',
            'juegos-tradicionales' => 'Actividades recreativas que promueven integracion, identidad cultural y aprovechamiento saludable del tiempo libre.',
            'tenis-de-mesa' => 'Disciplina de precision y reflejos con espacios para practica libre, formacion y competencia institucional.',
            'tiro-con-arco' => 'Disciplina de precision enfocada en tecnica, concentracion, control corporal y practica segura.',
            'multiaventura-universitario' => 'Actividades de reto, trabajo en equipo y aprovechamiento del entorno para fortalecer habilidades fisicas y sociales.',
        ];
    }
};
