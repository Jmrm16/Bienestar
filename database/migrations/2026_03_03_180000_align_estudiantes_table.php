<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('estudiantes')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $indexes = $this->getIndexNames();

        Schema::table('estudiantes', function (Blueprint $table) use ($indexes) {
            if (!in_array('uniq_est_period_serv_act_trim', $indexes, true)) {
                $table->unique(
                    ['period_id', 'identificacion', 'servicio', 'actividad', 'trimestre'],
                    'uniq_est_period_serv_act_trim'
                );
            }

            if (!in_array('estudiantes_period_id_index', $indexes, true)) {
                $table->index(['period_id']);
            }

            if (!in_array('estudiantes_identificacion_index', $indexes, true)) {
                $table->index(['identificacion']);
            }

            if (!in_array('estudiantes_period_id_servicio_index', $indexes, true)) {
                $table->index(['period_id', 'servicio']);
            }

            if (!in_array('estudiantes_period_id_actividad_index', $indexes, true)) {
                $table->index(['period_id', 'actividad']);
            }
        });

        if (Schema::hasTable('report_periods') && !$this->hasPeriodForeignKey()) {
            Schema::table('estudiantes', function (Blueprint $table) {
                $table->foreign('period_id')
                    ->references('id')
                    ->on('report_periods')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('estudiantes')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        if ($this->hasPeriodForeignKey()) {
            Schema::table('estudiantes', function (Blueprint $table) {
                $table->dropForeign('estudiantes_period_id_foreign');
            });
        }

        $indexes = $this->getIndexNames();

        Schema::table('estudiantes', function (Blueprint $table) use ($indexes) {
            if (in_array('uniq_est_period_serv_act_trim', $indexes, true)) {
                $table->dropUnique('uniq_est_period_serv_act_trim');
            }

            if (in_array('estudiantes_period_id_index', $indexes, true)) {
                $table->dropIndex('estudiantes_period_id_index');
            }

            if (in_array('estudiantes_identificacion_index', $indexes, true)) {
                $table->dropIndex('estudiantes_identificacion_index');
            }

            if (in_array('estudiantes_period_id_servicio_index', $indexes, true)) {
                $table->dropIndex('estudiantes_period_id_servicio_index');
            }

            if (in_array('estudiantes_period_id_actividad_index', $indexes, true)) {
                $table->dropIndex('estudiantes_period_id_actividad_index');
            }
        });
    }

    private function getIndexNames(): array
    {
        return array_values(array_unique(array_map(
            static fn ($index) => $index->Key_name,
            DB::select('SHOW INDEX FROM estudiantes')
        )));
    }

    private function hasPeriodForeignKey(): bool
    {
        return count(DB::select(
            <<<'SQL'
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'estudiantes'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME = 'estudiantes_period_id_foreign'
            SQL
        )) > 0;
    }
};
