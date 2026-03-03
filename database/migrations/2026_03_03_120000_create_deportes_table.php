<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deportes', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->string('schedule');
            $table->string('coach');
            $table->unsignedInteger('capacity')->default(0);
            $table->unsignedInteger('registered')->default(0);
            $table->string('status')->default('Inscripciones abiertas');
            $table->string('focus');
            $table->json('services')->nullable();
            $table->json('requirements')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        DB::table('deportes')->insert([
            [
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
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
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
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
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
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
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
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('deportes');
    }
};
