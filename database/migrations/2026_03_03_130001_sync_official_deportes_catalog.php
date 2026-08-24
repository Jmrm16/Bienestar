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

        $records = $this->officialRecords(now());
        $slugs = array_column($records, 'slug');

        DB::table('deportes')->whereNotIn('slug', $slugs)->delete();

        DB::table('deportes')->upsert(
            $records,
            ['slug'],
            [
                'title',
                'description',
                'location',
                'schedule',
                'coach',
                'capacity',
                'registered',
                'status',
                'focus',
                'services',
                'requirements',
                'active',
                'updated_at',
            ]
        );
    }

    public function down(): void
    {
        if (!Schema::hasTable('deportes')) {
            return;
        }

        DB::table('deportes')->delete();
        DB::table('deportes')->insert($this->sampleRecords(now()));
    }

    private function officialRecords($now): array
    {
        return [
            array_merge($this->baseRecord($now), [
                'slug' => 'prestamo-de-implementos-deportivos',
                'title' => 'Prestamo de implementos deportivos',
                'description' => 'Servicio orientado al buen uso del tiempo libre de los estamentos de la Universidad de La Guajira mediante actividades recreativas y deportivas de practica libre, solicitando espacios e implementos en la oficina de deportes.',
                'location' => 'Oficina de deportes y escenarios institucionales',
                'schedule' => 'Prestamo por un maximo de 2 horas, segun disponibilidad',
                'status' => 'Servicio permanente',
                'focus' => 'Tiempo libre y recreacion',
                'services' => json_encode([
                    'Futbol',
                    'Futbol sala',
                    'Baloncesto',
                    'Tenis de mesa',
                    'Ajedrez',
                    'Voleibol',
                ]),
                'requirements' => json_encode([
                    'Solicitar el espacio e implementos en la oficina de deportes',
                    'Tiempo maximo de uso: 2 horas',
                    'Devolver los implementos en el mismo estado en que fueron entregados',
                ]),
            ]),
            $this->discipline($now, 'voleibol', 'Voleibol', 'Disciplina coordinada por el area de Deporte para fortalecer la formacion deportiva, la practica institucional y la participacion en competencias.', 'Formacion y competencia', ['Formacion deportiva', 'Competencias internas', 'Competencias externas']),
            $this->discipline($now, 'baloncesto', 'Baloncesto', 'Espacio de practica, formacion y representacion institucional para estudiantes y comunidad universitaria.', 'Formacion y competencia', ['Entrenamiento formativo', 'Torneos internos', 'Representacion institucional']),
            $this->discipline($now, 'futbol', 'Futbol', 'Proceso de formacion y practica competitiva que fomenta integracion, disciplina y aprovechamiento del tiempo libre.', 'Formacion y competencia', ['Entrenamiento deportivo', 'Competencias internas', 'Competencias externas']),
            $this->discipline($now, 'entrenamiento-funcional', 'Entrenamiento funcional', 'Sesiones orientadas al acondicionamiento fisico, fortalecimiento corporal y mejoramiento del rendimiento general.', 'Acondicionamiento fisico', ['Fortalecimiento corporal', 'Acondicionamiento fisico', 'Rutinas grupales']),
            $this->discipline($now, 'taekwondo', 'Taekwondo', 'Disciplina de formacion deportiva enfocada en tecnica, autocontrol, preparacion fisica y participacion competitiva.', 'Tecnica y disciplina', ['Formacion tecnica', 'Preparacion fisica', 'Competencias institucionales']),
            $this->discipline($now, 'porrismo', 'Porrismo', 'Proceso de entrenamiento enfocado en coordinacion, fuerza, expresion corporal y representacion institucional.', 'Representacion e integracion', ['Entrenamiento coreografico', 'Fortalecimiento fisico', 'Participacion institucional']),
            $this->discipline($now, 'actividad-fisica-musicalizada', 'Actividad fisica musicalizada', 'Jornadas grupales de movimiento, ritmo y bienestar para promover habitos de vida activa dentro de la comunidad universitaria.', 'Bienestar y actividad fisica', ['Sesiones grupales', 'Promocion de habitos saludables', 'Recreacion activa']),
            $this->discipline($now, 'atletismo', 'Atletismo', 'Espacio para el desarrollo de habilidades fisicas y tecnicas en pruebas de pista y campo.', 'Rendimiento fisico', ['Preparacion tecnica', 'Acondicionamiento fisico', 'Competencias deportivas']),
            $this->discipline($now, 'deporte-inclusivo', 'Deporte inclusivo', 'Oferta deportiva orientada a promover participacion, inclusion y acceso al deporte para diferentes estamentos y capacidades.', 'Participacion e inclusion', ['Espacios de participacion', 'Actividades adaptadas', 'Integracion institucional']),
            $this->discipline($now, 'patinaje', 'Patinaje', 'Disciplina enfocada en tecnica, control corporal y fortalecimiento de habilidades motrices sobre ruedas.', 'Tecnica y acondicionamiento', ['Formacion tecnica', 'Acondicionamiento fisico', 'Competencias deportivas']),
            $this->discipline($now, 'futbol-sala', 'Futbol sala', 'Disciplina de practica y competencia en espacios cubiertos que fortalece trabajo en equipo y rendimiento deportivo.', 'Formacion y competencia', ['Entrenamiento deportivo', 'Torneos internos', 'Representacion institucional']),
            $this->discipline($now, 'juegos-tradicionales', 'Juegos tradicionales', 'Actividades recreativas que promueven integracion, identidad cultural y aprovechamiento saludable del tiempo libre.', 'Recreacion e integracion', ['Recreacion dirigida', 'Integracion institucional', 'Actividades de tiempo libre']),
            $this->discipline($now, 'tenis-de-mesa', 'Tenis de mesa', 'Disciplina de precision y reflejos con espacios para practica libre, formacion y competencia institucional.', 'Tecnica y competencia', ['Practica formativa', 'Torneos internos', 'Representacion institucional']),
            $this->discipline($now, 'tiro-con-arco', 'Tiro con arco', 'Disciplina de precision enfocada en tecnica, concentracion, control corporal y practica segura.', 'Precision y tecnica', ['Formacion tecnica', 'Practica supervisada', 'Competencias institucionales']),
            $this->discipline($now, 'multiaventura-universitario', 'Multiaventura universitario', 'Actividades de reto, trabajo en equipo y aprovechamiento del entorno para fortalecer habilidades fisicas y sociales.', 'Reto e integracion', ['Actividades de aventura', 'Trabajo en equipo', 'Experiencias al aire libre']),
        ];
    }

    private function discipline($now, string $slug, string $title, string $description, string $focus, array $services): array
    {
        return array_merge($this->baseRecord($now), [
            'slug' => $slug,
            'title' => $title,
            'description' => $description,
            'status' => 'Disciplina deportiva',
            'focus' => $focus,
            'services' => json_encode($services),
            'requirements' => json_encode($this->defaultRequirements()),
        ]);
    }

    private function baseRecord($now): array
    {
        return [
            'location' => 'Escenarios deportivos de la Universidad de La Guajira',
            'schedule' => 'Segun programacion y convocatorias del area',
            'coach' => 'Area de Deporte',
            'capacity' => 0,
            'registered' => 0,
            'active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function defaultRequirements(): array
    {
        return [
            'Participacion sujeta a programacion del area',
            'Inscripcion o convocatoria segun disponibilidad',
            'Uso adecuado de los escenarios deportivos',
        ];
    }

    private function sampleRecords($now): array
    {
        return [
            array_merge($this->baseRecord($now), [
                'slug' => 'futbol',
                'title' => 'Futbol',
                'description' => 'Entrenamientos formativos y preparacion competitiva para estudiantes.',
                'location' => 'Cancha sintetica principal',
                'schedule' => 'Lunes y miercoles, 4:00 p. m. a 6:00 p. m.',
                'coach' => 'Carlos Rodriguez',
                'capacity' => 30,
                'registered' => 24,
                'status' => 'Inscripciones abiertas',
                'focus' => 'Rendimiento e integracion',
                'services' => json_encode([
                    'Entrenamiento tecnico y tactico',
                    'Preparacion para torneos internos',
                    'Seguimiento de asistencia y rendimiento',
                ]),
                'requirements' => json_encode([
                    'Carnet institucional vigente',
                    'Uniforme o ropa deportiva',
                    'Hidratacion personal',
                ]),
            ]),
            array_merge($this->baseRecord($now), [
                'slug' => 'voleibol',
                'title' => 'Voleibol',
                'description' => 'Proceso de formacion y seleccion para encuentros universitarios.',
                'location' => 'Coliseo cubierto',
                'schedule' => 'Martes y jueves, 3:00 p. m. a 5:00 p. m.',
                'coach' => 'Laura Pineda',
                'capacity' => 24,
                'registered' => 18,
                'status' => 'Inscripciones abiertas',
                'focus' => 'Tecnica, trabajo en equipo y competencia',
                'services' => json_encode([
                    'Escuela de fundamentos',
                    'Microciclos de preparacion fisica',
                    'Convocatorias a seleccion institucional',
                ]),
                'requirements' => json_encode([
                    'Disponibilidad para entrenamientos semanales',
                    'Ropa deportiva adecuada',
                    'Compromiso con el reglamento interno',
                ]),
            ]),
            array_merge($this->baseRecord($now), [
                'slug' => 'gimnasio',
                'title' => 'Gimnasio',
                'description' => 'Acompanamiento para acondicionamiento fisico, fuerza y bienestar.',
                'location' => 'Sala de acondicionamiento fisico',
                'schedule' => 'Lunes a viernes, 6:00 a. m. a 8:00 p. m.',
                'coach' => 'Andres Rojas',
                'capacity' => 80,
                'registered' => 61,
                'status' => 'Cupos limitados',
                'focus' => 'Salud preventiva y fortalecimiento fisico',
                'services' => json_encode([
                    'Rutinas guiadas por objetivos',
                    'Induccion inicial para nuevos usuarios',
                    'Control basico de aforo por jornada',
                ]),
                'requirements' => json_encode([
                    'Registro previo en bienestar',
                    'Toalla y termo personal',
                    'Uso adecuado de maquinas y zonas comunes',
                ]),
            ]),
            array_merge($this->baseRecord($now), [
                'slug' => 'actividad-fisica',
                'title' => 'Actividad fisica',
                'description' => 'Sesiones abiertas para promover habitos saludables y pausas activas.',
                'location' => 'Plazoleta deportiva y espacios abiertos',
                'schedule' => 'Viernes, 8:00 a. m. a 10:00 a. m.',
                'coach' => 'Natalia Gomez',
                'capacity' => 40,
                'registered' => 29,
                'status' => 'Programacion semanal',
                'focus' => 'Bienestar integral y activacion corporal',
                'services' => json_encode([
                    'Clases grupales guiadas',
                    'Jornadas de bienestar para facultades',
                    'Rutinas de movilidad y estiramiento',
                ]),
                'requirements' => json_encode([
                    'Llegar con 10 minutos de anticipacion',
                    'Vestuario comodo para movilidad',
                    'Participacion activa en el calentamiento',
                ]),
            ]),
        ];
    }
};
