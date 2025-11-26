<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up() {
    Schema::table('tutors', function (Blueprint $table) {
      if (!Schema::hasColumn('tutors','tipo_resolucion')) {
        $table->enum('tipo_resolucion', ['R1','R2'])->default('R1')->after('telefono');
      }
    });
  }
  public function down() {
    Schema::table('tutors', function (Blueprint $table) {
      if (Schema::hasColumn('tutors','tipo_resolucion')) {
        $table->dropColumn('tipo_resolucion');
      }
    });
  }
};

