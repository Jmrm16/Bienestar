<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tutor_period_resolutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')
                ->constrained('report_periods')
                ->cascadeOnDelete();
            $table->foreignId('tutor_id')
                ->constrained('tutors')
                ->cascadeOnDelete();
            $table->enum('tipo_resolucion', ['R1', 'R2']);
            $table->timestamps();

            $table->unique(['period_id', 'tutor_id'], 'tpr_period_tutor_unique');
        });

        $legacyResolutions = DB::table('tutors')
            ->whereIn('tipo_resolucion', ['R1', 'R2'])
            ->pluck('tipo_resolucion', 'id');

        $periodTutorPairs = collect()
            ->merge(
                DB::table('periodo_grupo_tutor')
                    ->select('period_id', 'tutor_id')
                    ->distinct()
                    ->get()
            )
            ->merge(
                DB::table('tutor_reports')
                    ->select('period_id', 'tutor_id')
                    ->distinct()
                    ->get()
            )
            ->unique(fn ($row) => ((int) $row->period_id) . '|' . ((int) $row->tutor_id))
            ->values();

        $now = now();
        $rows = [];

        foreach ($periodTutorPairs as $pair) {
            $resolution = $legacyResolutions[(int) $pair->tutor_id] ?? null;
            if (! in_array($resolution, ['R1', 'R2'], true)) {
                continue;
            }

            $rows[] = [
                'period_id' => (int) $pair->period_id,
                'tutor_id' => (int) $pair->tutor_id,
                'tipo_resolucion' => $resolution,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows !== []) {
            DB::table('tutor_period_resolutions')->insertOrIgnore($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_period_resolutions');
    }
};
