<?php


use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends \Illuminate\Database\Migrations\Migration {
  public function up() {
    Schema::table('tutors', function (Blueprint $t) {
      $t->string('codigo')->unique()->nullable()->after('id');
      $t->string('cedula_hash')->nullable()->after('documento');
      $t->boolean('activo')->default(true)->after('telefono');
      $t->timestamp('ultimo_ingreso_at')->nullable()->after('activo');
    });
  }
  public function down() {
    Schema::table('tutors', function (Blueprint $t) {
      $t->dropColumn(['codigo','cedula_hash','activo','ultimo_ingreso_at']);
    });
  }
};