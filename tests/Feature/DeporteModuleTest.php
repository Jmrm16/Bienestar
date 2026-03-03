<?php

use App\Models\Deporte;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected from deporte module routes', function () {
    $this->get('/deportes')->assertRedirect('/login');
    $this->get('/deportes/prestamo-de-implementos-deportivos')->assertRedirect('/login');
});

test('authenticated users can visit deporte module pages', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/deportes')->assertOk();
    $this->get('/deportes/prestamo-de-implementos-deportivos')->assertOk();
});

test('authenticated users can register participants in a discipline', function () {
    $this->actingAs(User::factory()->create());

    $deporte = Deporte::query()->where('slug', 'futbol')->firstOrFail();

    $response = $this->post("/deportes/{$deporte->slug}/participantes", [
        'tipo_doc' => 'CC',
        'documento' => '100200300',
        'nombres' => 'Laura',
        'apellidos' => 'Lopez',
        'estamento' => 'Estudiante',
        'estado' => 'Activo',
        'fecha_ingreso' => '2026-03-03',
        'telefono' => '3001234567',
        'correo' => 'laura@example.com',
        'carrera_id' => null,
        'semestre' => '5',
        'observaciones' => 'Capitana del equipo',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('deporte_participantes', [
        'deporte_id' => $deporte->id,
        'documento' => '100200300',
        'nombres' => 'Laura',
        'apellidos' => 'Lopez',
        'estamento' => 'Estudiante',
        'estado' => 'Activo',
    ]);
});

test('authenticated users can export participants report', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/deportes/futbol/participantes/export')
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
});
