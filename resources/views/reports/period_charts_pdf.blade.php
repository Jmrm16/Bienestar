<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reporte {{ $period->code }}</title>
    <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #0f172a;
            background: #f8fafc;
            font-family: "DejaVu Sans", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.42;
        }
        .screen-actions {
            position: sticky;
            top: 0;
            z-index: 50;
            display: flex;
            gap: 8px;
            padding: 10px 14px;
            border-bottom: 1px solid #e2e8f0;
            background: #ffffff;
        }
        .screen-actions a,
        .screen-actions button {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            font-size: 12px;
            padding: 7px 10px;
            cursor: pointer;
            text-decoration: none;
        }
        .screen-actions button.primary {
            border-color: #0284c7;
            background: #0284c7;
            color: #ffffff;
        }
        .report-shell {
            max-width: 980px;
            margin: 14px auto 24px auto;
            padding: 0 8px;
        }
        .hero {
            border-radius: 16px;
            padding: 18px;
            color: #ffffff;
            background: linear-gradient(135deg, #075985, #1d4ed8);
        }
        .hero h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .hero p { margin: 6px 0 0 0; opacity: .95; }
        .meta {
            margin-top: 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .chip {
            border: 1px solid rgba(255,255,255,.35);
            border-radius: 999px;
            background: rgba(255,255,255,.14);
            padding: 4px 10px;
            font-size: 11px;
        }
        .card {
            margin-top: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            background: #ffffff;
            overflow: hidden;
        }
        .card-header {
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 11px 14px;
            font-size: 13px;
            font-weight: 700;
        }
        .card-body { padding: 12px 14px; }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 7px 8px;
            vertical-align: top;
            word-wrap: break-word;
        }
        th {
            background: #f1f5f9;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .35px;
            text-align: left;
        }
        td.num { text-align: right; font-variant-numeric: tabular-nums; }
        .muted { color: #475569; font-size: 11px; }
        .cut-section { margin-top: 16px; }
        .cut-title {
            margin: 0 0 8px 0;
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .resolution-box {
            border: 1px solid #dbeafe;
            border-radius: 12px;
            background: #f8fbff;
            padding: 10px;
        }
        .resolution-title {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            color: #1e3a8a;
        }
        .metrics {
            margin-top: 8px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
        }
        .metric {
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            background: #eff6ff;
            padding: 7px;
        }
        .metric .label {
            color: #1e3a8a;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .35px;
        }
        .metric .value {
            margin-top: 2px;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
        }
        .table-mini { margin-top: 8px; }
        .table-mini th, .table-mini td { font-size: 10px; padding: 5px 6px; }
        .empty-box {
            margin-top: 8px;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            padding: 10px;
            color: #64748b;
            font-size: 11px;
            text-align: center;
        }
        .page-break { page-break-before: always; }
        .warning {
            margin-top: 10px;
            border: 1px solid #fcd34d;
            background: #fffbeb;
            color: #92400e;
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 11px;
        }

        @media print {
            body { background: #ffffff; }
            .screen-actions { display: none !important; }
            .report-shell { max-width: none; margin: 0; padding: 0; }
            .card { break-inside: avoid; }
            .cut-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="screen-actions">
        <button class="primary" onclick="window.print()">Guardar como PDF</button>
        <a href="{{ route('reports.windows.index', ['period' => $period->id]) }}">Volver a Informes</a>
    </div>

    <main class="report-shell">
        <section class="hero">
            <h1>Reporte de Informes - Periodo {{ $period->code }}</h1>
            <p>Reporte organizado por cortes, separando resultados de Resolucion 1 (R1) y Resolucion 2 (R2).</p>
            <div class="meta">
                <span class="chip">Periodo: {{ $period->code }}</span>
                <span class="chip">Cortes configurados: {{ $totalCuts }}</span>
                <span class="chip">Entregas R1 usadas: {{ $windowsCountR1 }} / {{ $totalCuts }}</span>
                <span class="chip">Entregas R2 usadas: {{ $windowsCountR2 }} / {{ $totalCuts }}</span>
                <span class="chip">Generado: {{ $generatedAt }}</span>
            </div>
            @if (
                $windowsCountR1Total > $totalCuts ||
                $windowsCountR2Total > $totalCuts ||
                $windowsCountR1 < $totalCuts ||
                $windowsCountR2 < $totalCuts ||
                $windowsCountR1 !== $windowsCountR2
            )
                <div class="warning">
                    @if ($windowsCountR1Total > $totalCuts || $windowsCountR2Total > $totalCuts)
                        Se detectaron mas de {{ $totalCuts }} entregas por tipo.
                        Solo se usan las primeras {{ $totalCuts }} de cada tipo para formar los cortes.
                        <br>
                    @endif

                    @if ($windowsCountR1 < $totalCuts || $windowsCountR2 < $totalCuts)
                        Faltan entregas para completar los {{ $totalCuts }} cortes.
                        Los cortes sin entrega quedan vacios en el reporte.
                        <br>
                    @endif

                    @if ($windowsCountR1 !== $windowsCountR2)
                        La cantidad de entregas usadas en R1 y R2 no coincide.
                    @endif

                    El emparejamiento se realiza por orden cronologico (open_at) dentro de cada tipo.
                </div>
            @endif
        </section>

        <section class="card">
            <div class="card-header">Resumen por Corte (R1 vs R2)</div>
            <div class="card-body">
                @if ($summaryRows->isEmpty())
                    <p>No hay cortes configurados para este periodo.</p>
                @else
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%">Corte</th>
                                <th style="width: 24%">Entrega R1</th>
                                <th style="width: 10%">Eval R1</th>
                                <th style="width: 10%">Apr R1</th>
                                <th style="width: 24%">Entrega R2</th>
                                <th style="width: 10%">Eval R2</th>
                                <th style="width: 10%">Apr R2</th>
                                <th style="width: 10%">Eval Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($summaryRows as $row)
                                <tr>
                                    <td class="num">{{ $row['cut_number'] }}</td>
                                    <td>{{ $row['r1_name'] }}</td>
                                    <td class="num">{{ number_format($row['r1_evaluados']) }}</td>
                                    <td class="num">{{ number_format($row['r1_aprobado']) }}</td>
                                    <td>{{ $row['r2_name'] }}</td>
                                    <td class="num">{{ number_format($row['r2_evaluados']) }}</td>
                                    <td class="num">{{ number_format($row['r2_aprobado']) }}</td>
                                    <td class="num">{{ number_format($row['total_evaluados']) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            </div>
        </section>

        @foreach ($cutBundles as $index => $bundle)
            <section class="cut-section {{ $index > 0 ? 'page-break' : '' }}">
                <h2 class="cut-title">Corte {{ $bundle['cut_number'] }}</h2>
                <p class="muted">
                    Aprobado: {{ number_format((int) ($bundle['totals']['aprobado'] ?? 0)) }} |
                    Reprobado: {{ number_format((int) ($bundle['totals']['reprobado'] ?? 0)) }} |
                    Sin nota: {{ number_format((int) ($bundle['totals']['sin_nota'] ?? 0)) }} |
                    Evaluados: {{ number_format((int) ($bundle['totals']['evaluados'] ?? 0)) }}
                </p>

                <div class="grid-2">
                    @foreach (['r1' => 'Resolucion 1 (R1)', 'r2' => 'Resolucion 2 (R2)'] as $key => $label)
                        @php
                            $entryRaw = $bundle[$key] ?? null;
                            $entry = is_array($entryRaw) ? $entryRaw : null;
                            $charts = (is_array($entry) && is_array($entry['charts'] ?? null)) ? $entry['charts'] : [];
                            $rowsPrograma = collect($charts['porPrograma'] ?? [])->take(6)->values();
                            $rowsTutor = collect($charts['porTutor'] ?? [])->take(6)->values();
                        @endphp

                        <div class="resolution-box">
                            <h3 class="resolution-title">{{ $label }}</h3>

                            @if (!$entry)
                                <div class="empty-box">No hay entrega configurada para este corte.</div>
                            @else
                                <p class="muted">
                                    Entrega: {{ $entry['window']['name'] ?? 'Sin nombre' }} |
                                    ID: {{ $entry['window']['id'] ?? 'N/A' }} |
                                    Publicada: {{ !empty($entry['window']['is_published']) ? 'Si' : 'No' }}
                                </p>

                                <div class="metrics">
                                    <div class="metric">
                                        <div class="label">Aprobado</div>
                                        <div class="value">{{ number_format((int) ($entry['aprobado'] ?? 0)) }}</div>
                                    </div>
                                    <div class="metric">
                                        <div class="label">Reprobado</div>
                                        <div class="value">{{ number_format((int) ($entry['reprobado'] ?? 0)) }}</div>
                                    </div>
                                    <div class="metric">
                                        <div class="label">Sin nota</div>
                                        <div class="value">{{ number_format((int) ($entry['sin_nota'] ?? 0)) }}</div>
                                    </div>
                                    <div class="metric">
                                        <div class="label">Evaluados</div>
                                        <div class="value">{{ number_format((int) ($entry['evaluados'] ?? 0)) }}</div>
                                    </div>
                                </div>

                                <div class="table-mini">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Top programas</th>
                                                <th style="width: 18%">A</th>
                                                <th style="width: 18%">R</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @forelse ($rowsPrograma as $row)
                                                <tr>
                                                    <td>{{ $row['label'] ?? 'Sin etiqueta' }}</td>
                                                    <td class="num">{{ number_format((int) ($row['APROBADO'] ?? 0)) }}</td>
                                                    <td class="num">{{ number_format((int) ($row['REPROBADO'] ?? 0)) }}</td>
                                                </tr>
                                            @empty
                                                <tr><td colspan="3">Sin datos.</td></tr>
                                            @endforelse
                                        </tbody>
                                    </table>
                                </div>

                                <div class="table-mini">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Top tutores</th>
                                                <th style="width: 18%">A</th>
                                                <th style="width: 18%">R</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @forelse ($rowsTutor as $row)
                                                <tr>
                                                    <td>{{ $row['label'] ?? 'Sin etiqueta' }}</td>
                                                    <td class="num">{{ number_format((int) ($row['APROBADO'] ?? 0)) }}</td>
                                                    <td class="num">{{ number_format((int) ($row['REPROBADO'] ?? 0)) }}</td>
                                                </tr>
                                            @empty
                                                <tr><td colspan="3">Sin datos.</td></tr>
                                            @endforelse
                                        </tbody>
                                    </table>
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            </section>
        @endforeach
    </main>

    @if ($autoPrint)
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () { window.print(); }, 280);
            });
        </script>
    @endif
</body>
</html>
