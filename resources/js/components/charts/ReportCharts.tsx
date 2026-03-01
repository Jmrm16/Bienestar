import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

/* =========================
   TIPOS
========================= */

type AprobReprobRow = {
  label: string;
  APROBADO: number;
  REPROBADO: number;
  total?: number;
};

type SimpleCountRow = {
  label: string;
  value: number;
};

export type ReportChartsData = {
  porPrograma: AprobReprobRow[];
  porTutor: AprobReprobRow[];
  totalAprobado: number;
  totalReprobado: number;
  sexo: { FEMENINO: number; MASCULINO: number };
  grupos: { NINGUNO: number; AFRO: number; INDIGENA: number };
};

/* =========================
   HELPERS
========================= */

function formatInt(n: any) {
  const x = Number(n ?? 0);
  return Number.isFinite(x) ? x.toLocaleString("es-CO") : "0";
}

const PIE_COLORS = ["#2563eb", "#f97316", "#16a34a", "#a855f7", "#0ea5e9"];

function DefaultTooltip() {
  return (
    <Tooltip
      formatter={(value: any, name: any) => [formatInt(value), String(name)]}
      labelFormatter={(label) => String(label)}
      contentStyle={{
        backgroundColor: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
        color: "hsl(var(--popover-foreground))",
      }}
    />
  );
}

function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
      {right}
    </div>
  );
}

/* =========================
   BLOQUES
========================= */

function PieBlock({
  title,
  rows,
  height = 260,
  windowName,
}: {
  title: string;
  rows: SimpleCountRow[];
  height?: number;
  windowName?: string;
}) {
  const total = rows.reduce((acc, r) => acc + (r.value ?? 0), 0);
  const validRows = rows.filter((r) => (r.value ?? 0) > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <SectionTitle
          title={windowName ? `${title} - ${windowName}` : title}
          right={<Badge variant="secondary">Total: {formatInt(total)}</Badge>}
        />
      </CardHeader>

      <CardContent className="pt-0">
        {validRows.length > 0 ? (
          <>
            <div style={{ width: "100%", height }}>
              <ResponsiveContainer>
                <PieChart>
                  <DefaultTooltip />
                  <Legend
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Pie
                    data={validRows}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${String(name)} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {validRows.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {validRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/50"
                >
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{formatInt(r.value)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarBlock({
  title,
  rows,
  height = 320,
  xLabelRotate = 0,
  windowName,
}: {
  title: string;
  rows: AprobReprobRow[];
  height?: number;
  xLabelRotate?: number;
  windowName?: string;
}) {
  const total = rows.reduce(
    (acc, r) => acc + (r.total ?? r.APROBADO + r.REPROBADO),
    0
  );

  const validRows = rows.filter((r) => r.APROBADO + r.REPROBADO > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <SectionTitle
          title={windowName ? `${title} - ${windowName}` : title}
          right={<Badge variant="secondary">Registros: {formatInt(total)}</Badge>}
        />
      </CardHeader>

      <CardContent className="pt-0">
        {validRows.length > 0 ? (
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
              <BarChart
                data={validRows}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: xLabelRotate ? 50 : 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={xLabelRotate}
                  textAnchor={xLabelRotate ? "end" : "middle"}
                  height={xLabelRotate ? 70 : 35}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <DefaultTooltip />
                <Legend
                  wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="APROBADO"
                  name="Aprobado"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="REPROBADO"
                  name="Reprobado"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */

export default function ReportCharts({
  data,
  topTutores = 30,
  windowName,
}: {
  data?: ReportChartsData;
  topTutores?: number;
  windowName?: string;
}) {
  const safe: ReportChartsData = useMemo(
    () =>
      data ?? {
        porPrograma: [],
        porTutor: [],
        totalAprobado: 0,
        totalReprobado: 0,
        sexo: { FEMENINO: 0, MASCULINO: 0 },
        grupos: { NINGUNO: 0, AFRO: 0, INDIGENA: 0 },
      },
    [data]
  );

  const porPrograma = useMemo(() => {
    return [...(safe.porPrograma ?? [])]
      .map((r) => ({ ...r, total: r.total ?? r.APROBADO + r.REPROBADO }))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  }, [safe.porPrograma]);

  const porTutor = useMemo(() => {
    return [...(safe.porTutor ?? [])]
      .map((r) => ({ ...r, total: r.total ?? r.APROBADO + r.REPROBADO }))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, Math.max(1, topTutores));
  }, [safe.porTutor, topTutores]);

  const totalesRows: SimpleCountRow[] = useMemo(
    () => [
      { label: "Aprobado", value: safe.totalAprobado ?? 0 },
      { label: "Reprobado", value: safe.totalReprobado ?? 0 },
    ],
    [safe.totalAprobado, safe.totalReprobado]
  );

  const sexoRows: SimpleCountRow[] = useMemo(
    () => [
      { label: "Femenino", value: safe.sexo?.FEMENINO ?? 0 },
      { label: "Masculino", value: safe.sexo?.MASCULINO ?? 0 },
    ],
    [safe.sexo]
  );

  const gruposRows: SimpleCountRow[] = useMemo(
    () => [
      { label: "Ninguno", value: safe.grupos?.NINGUNO ?? 0 },
      { label: "Afro", value: safe.grupos?.AFRO ?? 0 },
      { label: "Indígena", value: safe.grupos?.INDIGENA ?? 0 },
    ],
    [safe.grupos]
  );

  const hasData = useMemo(() => {
    return (
      porPrograma.some((r) => r.APROBADO + r.REPROBADO > 0) ||
      porTutor.some((r) => r.APROBADO + r.REPROBADO > 0) ||
      (safe.totalAprobado ?? 0) > 0 ||
      (safe.totalReprobado ?? 0) > 0 ||
      (safe.sexo?.FEMENINO ?? 0) > 0 ||
      (safe.sexo?.MASCULINO ?? 0) > 0 ||
      (safe.grupos?.NINGUNO ?? 0) > 0 ||
      (safe.grupos?.AFRO ?? 0) > 0 ||
      (safe.grupos?.INDIGENA ?? 0) > 0
    );
  }, [porPrograma, porTutor, safe]);

  if (!hasData) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {windowName ? `Gráficos - ${windowName}` : "Gráficos"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p>No hay datos para graficar en este corte.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Selecciona otro corte o verifica que hayan asistencias registradas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fila 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarBlock
            title="Aprobado vs Reprobado por Programa"
            rows={porPrograma}
            height={340}
            xLabelRotate={-20}
            windowName={windowName}
          />
        </div>

        <PieBlock title="Totales del corte" rows={totalesRows} windowName={windowName} />
      </div>

      {/* Fila 2 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <SectionTitle
            title={`Aprobado vs Reprobado por Tutor (Top ${topTutores})${
              windowName ? ` - ${windowName}` : ""
            }`}
            right={<Badge variant="secondary">Tutores: {porTutor.length}</Badge>}
          />
        </CardHeader>

        <CardContent className="pt-0">
          {porTutor.some((r) => r.APROBADO + r.REPROBADO > 0) ? (
            <ScrollArea className="w-full rounded-md border">
              <div className="min-w-[900px] p-1">
                <div style={{ width: "100%", height: 420 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={porTutor}
                      margin={{ top: 20, right: 20, left: 0, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={95}
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <DefaultTooltip />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="APROBADO" name="Aprobado" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="REPROBADO" name="Reprobado" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No hay datos de tutores disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fila 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <PieBlock title="Distribución por Sexo" rows={sexoRows} windowName={windowName} />
        <PieBlock title="Grupos Priorizados" rows={gruposRows} windowName={windowName} />
      </div>
    </div>
  );
}