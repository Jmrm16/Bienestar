<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('report_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('report_periods')->cascadeOnDelete();

            $table->string('name');              // "Primer corte"
            $table->enum('tutor_type', ['R1','R2']);
            $table->dateTime('open_at');
            $table->dateTime('due_at')->nullable();
            $table->dateTime('close_at')->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('is_published')->default(false);

            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('report_windows');
    }
};
