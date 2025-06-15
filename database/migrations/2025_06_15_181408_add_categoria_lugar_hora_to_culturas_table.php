<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('culturas', function (Blueprint $table) {
        $table->string('categoria')->nullable();
        $table->string('lugar')->nullable();
        $table->string('hora')->nullable();
    });
}

public function down(): void
{
    Schema::table('culturas', function (Blueprint $table) {
        $table->dropColumn(['categoria', 'lugar', 'hora']);
    });
}
};
