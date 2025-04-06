<?php



use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('estudiantes', function (Blueprint $table) {
            $table->string('tipo_identificacion')->nullable();
            $table->string('identificacion')->nullable();
            $table->string('ciudad_expedicion')->nullable();
            $table->string('sexo')->nullable();
            $table->string('programa')->nullable();
            $table->string('semestre')->nullable();
        });
    }

    public function down(): void {
        Schema::dropIfExists('estudiantes');
    }
};