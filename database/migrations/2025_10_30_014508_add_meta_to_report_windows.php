<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_windows', function (Blueprint $table) {
            // Etiqueta funcional de la entrega (p.ej. "HORARIO" | "INFORME")
            if (!Schema::hasColumn('report_windows', 'category')) {
                $table->string('category')->nullable()->after('instructions');
            }

            // Checklist de documentos requeridos (JSON de strings)
            if (!Schema::hasColumn('report_windows', 'required_items')) {
                $table->json('required_items')->nullable()->after('category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('report_windows', function (Blueprint $table) {
            if (Schema::hasColumn('report_windows', 'required_items')) {
                $table->dropColumn('required_items');
            }
            if (Schema::hasColumn('report_windows', 'category')) {
                $table->dropColumn('category');
            }
        });
    }
};
