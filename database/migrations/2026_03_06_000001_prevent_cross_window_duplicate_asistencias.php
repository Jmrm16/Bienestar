<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $indexName = 'asist_unique_period_tutor_group_day';

    public function up(): void
    {
        if (! Schema::hasTable('asistencias')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            // Conserva el registro más antiguo por llave lógica de asistencia.
            DB::statement("
                DELETE a1
                FROM asistencias a1
                INNER JOIN asistencias a2
                    ON a1.period_id = a2.period_id
                   AND a1.tutor_id = a2.tutor_id
                   AND a1.grupo_id = a2.grupo_id
                   AND a1.identificacion = a2.identificacion
                   AND a1.fecha = a2.fecha
                   AND a1.id > a2.id
            ");
        }

        if ($this->hasIndex($this->indexName)) {
            return;
        }

        Schema::table('asistencias', function (Blueprint $table) {
            $table->unique(
                ['period_id', 'tutor_id', 'grupo_id', 'identificacion', 'fecha'],
                $this->indexName
            );
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('asistencias')) {
            return;
        }

        if (! $this->hasIndex($this->indexName)) {
            return;
        }

        Schema::table('asistencias', function (Blueprint $table) {
            $table->dropUnique($this->indexName);
        });
    }

    private function hasIndex(string $indexName): bool
    {
        $database = DB::getDatabaseName();

        $result = DB::selectOne(
            'SELECT COUNT(*) AS total FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$database, 'asistencias', $indexName]
        );

        return (int) ($result->total ?? 0) > 0;
    }
};
