<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tutor_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tutor_id')->constrained('tutors')->cascadeOnDelete();
            $table->foreignId('window_id')->constrained('report_windows')->cascadeOnDelete();

            // ✅ Reemplaza assignment_id (tutor_assignments) por period_id
            $table->foreignId('period_id')->constrained('report_periods')->cascadeOnDelete();

            $table->enum('status', ['pending','submitted','approved','rejected'])->default('pending');
            $table->dateTime('submitted_at')->nullable();
            $table->string('file_path')->nullable();
            $table->unsignedSmallInteger('hours_total')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->timestamps();

            // ✅ Un tutor solo 1 reporte por ventana y período
            $table->unique(['tutor_id','window_id','period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_reports');
    }
};
