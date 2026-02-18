<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('report_periods', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Ej: 2026-2
            $table->string('name')->nullable();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('report_periods');
    }
};
