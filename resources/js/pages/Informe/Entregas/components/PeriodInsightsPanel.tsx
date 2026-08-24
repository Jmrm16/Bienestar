import React, { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PerWindow = Record<string, { estudiantes: number; asistencias: number }>;

type TutorNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  unique_estudiantes_total?: number;
  unique_asistencias_total?: number;
};

type AsignaturaNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  tutores: TutorNode[];
  unique_estudiantes_total?: number;
  unique_asistencias_total?: number;
};

type CarreraNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  asignaturas: AsignaturaNode[];
  unique_estudiantes_total?: number;
  unique_asistencias_total?: number;
};

export type WindowInsightRow = {
  window_id: number;
  name?: string;
  category?: string | null;
  tutor_type?: "R1" | "R2" | string;
};

type InsightSlice = {
  by_window?: WindowInsightRow[];
  tree?: {
    carreras?: CarreraNode[];
  };
};

export type PeriodInsights = InsightSlice & {
  by_type?: {
    R1?: InsightSlice;
    R2?: InsightSlice;
  };
};

const EMPTY_CARRERAS: CarreraNode[] = [];
const stickyHeaderCellClassName =
  "sticky left-0 z-10 w-[220px] bg-background/95 px-2 text-[11px] backdrop-blur sm:w-[320px] sm:text-sm";
const stickyBodyCellClassName = "sticky left-0 z-10 bg-background/95 backdrop-blur";

function sumMetric(
  perWindow: PerWindow,
  windows: WindowInsightRow[],
  metric: "estudiantes" | "asistencias"
) {
  let total = 0;
  for (const w of windows) {
    const cell = perWindow?.[String(w.window_id)];
    total += cell?.[metric] ?? 0;
  }
  return total;
}

function inferWindowIdsFromTree(carreras: CarreraNode[]): number[] {
  const set = new Set<number>();

  const scanPerWindow = (pw?: PerWindow) => {
    if (!pw) return;
    for (const k of Object.keys(pw)) {
      const n = Number(k);
      if (Number.isFinite(n)) set.add(n);
    }
  };

  for (const c of carreras ?? []) {
    scanPerWindow(c.per_window);
    for (const a of c.asignaturas ?? []) {
      scanPerWindow(a.per_window);
      for (const t of a.tutores ?? []) {
        scanPerWindow(t.per_window);
      }
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

function buildWindows(slice: InsightSlice | undefined, carreras: CarreraNode[]) {
  const by = slice?.by_window ?? [];
  if (by.length > 0) {
    return by
      .map((w) => ({
        window_id: Number(w.window_id),
        name: String(w.name ?? ""),
        category: w.category,
        tutor_type: w.tutor_type,
      }))
      .filter((w) => Number.isFinite(w.window_id));
  }

  const ids = inferWindowIdsFromTree(carreras);
  return ids.map((id) => ({ window_id: id, name: `Informe ${id}` }));
}

function buildInsightsSummary(slice: InsightSlice | undefined) {
  const carreras = slice?.tree?.carreras ?? EMPTY_CARRERAS;
  const windows = buildWindows(slice, carreras);

  const perWindowTotals = windows.map((window) => {
    let estudiantes = 0;
    let asistencias = 0;

    for (const carrera of carreras) {
      const cell = carrera.per_window?.[String(window.window_id)];
      estudiantes += cell?.estudiantes ?? 0;
      asistencias += cell?.asistencias ?? 0;
    }

    return {
      ...window,
      estudiantes,
      asistencias,
    };
  });

  const hasUniqueTotals = carreras.some(
    (carrera) =>
      typeof carrera.unique_estudiantes_total === "number" ||
      typeof carrera.unique_asistencias_total === "number"
  );

  const totalEstudiantes = hasUniqueTotals
    ? carreras.reduce(
        (acc, carrera) => acc + (carrera.unique_estudiantes_total ?? 0),
        0
      )
    : carreras.reduce(
        (acc, carrera) => acc + sumMetric(carrera.per_window, windows, "estudiantes"),
        0
      );

  const totalAsistencias = hasUniqueTotals
    ? carreras.reduce(
        (acc, carrera) => acc + (carrera.unique_asistencias_total ?? 0),
        0
      )
    : carreras.reduce(
        (acc, carrera) => acc + sumMetric(carrera.per_window, windows, "asistencias"),
        0
      );

  return {
    perWindowTotals,
    totalEstudiantes,
    totalAsistencias,
  };
}

function formatWindowHeaderLabel(window: WindowInsightRow) {
  const categoryLabel =
    window.category === "corte_1"
      ? "Corte 1"
      : window.category === "corte_2"
        ? "Corte 2"
        : window.category === "corte_3"
          ? "Corte 3"
          : window.category === "habilitacion"
            ? "Habilitación"
            : window.category === "final"
              ? "Final"
              : null;

  const pieces = [categoryLabel, window.name, window.tutor_type].filter(Boolean);
  return pieces.join(" · ");
}

function formatCompactMetricHeader(
  window: WindowInsightRow,
  windows: WindowInsightRow[],
  metric: "estudiantes" | "asistencias",
  index: number
) {
  const metricLabel = metric === "estudiantes" ? "Est." : "Asis.";

  if (windows.length === 1) {
    return metric === "estudiantes" ? "Estudiantes" : "Asistencias";
  }

  const sameName = new Set(windows.map((item) => item.name || "")).size === 1;
  const sameCategory = new Set(windows.map((item) => item.category || "")).size === 1;

  if ((sameName || sameCategory) && window.tutor_type) {
    return `${metricLabel} ${window.tutor_type}`;
  }

  if (window.tutor_type) {
    return `${metricLabel} ${window.tutor_type}`;
  }

  return `${metricLabel} W${index + 1}`;
}

function HeaderCells({ windows }: { windows: WindowInsightRow[] }) {
  return (
    <>
      {windows.map((w, index) => (
        <React.Fragment key={w.window_id}>
          <TableHead className="whitespace-nowrap px-2 text-right text-[11px] sm:text-sm">
            <span title={formatWindowHeaderLabel(w) || `Informe ${w.window_id}`}>
              {formatCompactMetricHeader(w, windows, "estudiantes", index)}
            </span>
          </TableHead>
          <TableHead className="whitespace-nowrap px-2 text-right text-[11px] sm:text-sm">
            <span title={formatWindowHeaderLabel(w) || `Informe ${w.window_id}`}>
              {formatCompactMetricHeader(w, windows, "asistencias", index)}
            </span>
          </TableHead>
        </React.Fragment>
      ))}
      <TableHead className="whitespace-nowrap px-2 text-right text-[11px] font-bold sm:text-sm">
        <span className="sm:hidden">Tot. Est. U</span>
        <span className="hidden sm:inline">Total Est. Unicos</span>
      </TableHead>
      <TableHead className="whitespace-nowrap px-2 text-right text-[11px] font-bold sm:text-sm">
        <span className="sm:hidden">Tot. Asis. U</span>
        <span className="hidden sm:inline">Total Asis. Unicas</span>
      </TableHead>
    </>
  );
}

function DataCells({
  perWindow,
  windows,
  uniqueTotal,
  uniqueAsisTotal,
}: {
  perWindow: PerWindow;
  windows: WindowInsightRow[];
  uniqueTotal?: number;
  uniqueAsisTotal?: number;
}) {
  const totalEst =
    typeof uniqueTotal === "number"
      ? uniqueTotal
      : sumMetric(perWindow, windows, "estudiantes");
  const totalAsis =
    typeof uniqueAsisTotal === "number"
      ? uniqueAsisTotal
      : sumMetric(perWindow, windows, "asistencias");

  return (
    <>
      {windows.map((w) => {
        const cell = perWindow?.[String(w.window_id)];
        return (
          <React.Fragment key={w.window_id}>
            <TableCell
              className={cn(
                "whitespace-nowrap px-2 text-right text-xs sm:text-sm",
                !cell && "text-muted-foreground"
              )}
            >
              {cell ? cell.estudiantes : "—"}
            </TableCell>
            <TableCell
              className={cn(
                "whitespace-nowrap px-2 text-right text-xs sm:text-sm",
                !cell && "text-muted-foreground"
              )}
            >
              {cell ? cell.asistencias : "—"}
            </TableCell>
          </React.Fragment>
        );
      })}

      <TableCell className="whitespace-nowrap px-2 text-right text-xs font-bold sm:text-sm">
        {totalEst}
      </TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right text-xs font-bold sm:text-sm">
        {totalAsis}
      </TableCell>
    </>
  );
}

function InsightsTableSection({
  title,
  contextLabel,
  showSummary = true,
  totalEstudiantesOverride,
  slice,
}: {
  title: string;
  contextLabel?: string;
  showSummary?: boolean;
  totalEstudiantesOverride?: number;
  slice: InsightSlice | undefined;
}) {
  const carreras = slice?.tree?.carreras ?? EMPTY_CARRERAS;

  const windows = useMemo(() => buildWindows(slice, carreras), [slice, carreras]);
  const summary = useMemo(() => buildInsightsSummary(slice), [slice]);
  const totalEstudiantes =
    typeof totalEstudiantesOverride === "number"
      ? totalEstudiantesOverride
      : summary.totalEstudiantes;

  const [openCarreras, setOpenCarreras] = useState<Record<number, boolean>>({});
  const [openAsignaturas, setOpenAsignaturas] = useState<Record<string, boolean>>({});

  const toggleCarrera = (id: number) =>
    setOpenCarreras((s) => ({ ...s, [id]: !s[id] }));

  const toggleAsignatura = (carreraId: number, asignaturaId: number) => {
    const key = `${carreraId}:${asignaturaId}`;
    setOpenAsignaturas((s) => ({ ...s, [key]: !s[key] }));
  };

  const colSpan = 1 + windows.length * 2 + 2;
  const tableMinWidth = Math.max(680, 220 + windows.length * 120 + 160);

  return (
    <Card className="gap-0 overflow-hidden">
      <CardHeader className="gap-1 px-4 sm:px-6">
        <CardTitle className="text-sm leading-tight sm:text-base">{title}</CardTitle>
        <CardDescription>
          {contextLabel
            ? contextLabel
            : "Resumen por carrera, asignatura y tutor."}
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        {windows.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            No hay informes disponibles para esta resolución
          </div>
        ) : (
          <ScrollArea className="w-full">
            {showSummary ? (
              <div className="grid gap-3 px-4 pt-4 pb-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border bg-muted/15 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Total de la selección
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">Estudiantes únicos</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {totalEstudiantes.toLocaleString("es-CO")}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">Asistencias únicas</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {summary.totalAsistencias.toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Resumen por entrega
                  </p>
                  <div className="mt-3 grid gap-2">
                    {summary.perWindowTotals.map((window) => (
                      <div
                        key={window.window_id}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-muted/10 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {formatWindowHeaderLabel(window) || `Informe ${window.window_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {window.estudiantes.toLocaleString("es-CO")} estudiantes ·{" "}
                            {window.asistencias.toLocaleString("es-CO")} asistencias
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="px-4 pt-4 pb-2 text-xs text-muted-foreground sm:hidden">
              Desliza horizontalmente para ver toda la tabla
            </div>
            <div style={{ minWidth: `${tableMinWidth}px` }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={stickyHeaderCellClassName}>
                      Nombre
                    </TableHead>
                    <HeaderCells windows={windows} />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {carreras.map((c) => {
                    const isOpenC = !!openCarreras[c.id];

                    return (
                      <React.Fragment key={c.id}>
                        <TableRow className="bg-muted/5 font-medium">
                          <TableCell className={cn(stickyBodyCellClassName, "px-2")}>
                            <button
                              type="button"
                              onClick={() => toggleCarrera(c.id)}
                              className="inline-flex w-full min-w-0 items-center gap-2 py-1 text-left text-xs transition-colors hover:text-foreground sm:text-sm"
                            >
                              {isOpenC ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate font-semibold" title={c.name}>
                                {c.name}
                              </span>
                            </button>
                          </TableCell>

                          <DataCells
                            perWindow={c.per_window}
                            windows={windows}
                            uniqueTotal={c.unique_estudiantes_total}
                            uniqueAsisTotal={c.unique_asistencias_total}
                          />
                        </TableRow>

                        {isOpenC &&
                          (c.asignaturas ?? []).map((a) => {
                            const key = `${c.id}:${a.id}`;
                            const isOpenA = !!openAsignaturas[key];

                            return (
                              <React.Fragment key={a.id}>
                                <TableRow className="text-sm">
                                  <TableCell
                                    className={cn(stickyBodyCellClassName, "px-2 pl-8")}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleAsignatura(c.id, a.id)}
                                      className="inline-flex w-full min-w-0 items-center gap-2 py-1 text-left text-xs transition-colors hover:text-foreground sm:text-sm"
                                    >
                                      {isOpenA ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="truncate" title={a.name}>
                                        {a.name}
                                      </span>
                                    </button>
                                  </TableCell>

                                  <DataCells
                                    perWindow={a.per_window}
                                    windows={windows}
                                    uniqueTotal={a.unique_estudiantes_total}
                                    uniqueAsisTotal={a.unique_asistencias_total}
                                  />
                                </TableRow>

                                {isOpenA &&
                                  (a.tutores ?? []).map((t) => (
                                    <TableRow key={t.id} className="text-sm text-muted-foreground">
                                      <TableCell
                                        className={cn(
                                          stickyBodyCellClassName,
                                          "px-2 pl-14 text-xs sm:text-sm"
                                        )}
                                      >
                                        <span className="block truncate" title={t.name}>
                                          {t.name}
                                        </span>
                                      </TableCell>
                                      <DataCells
                                        perWindow={t.per_window}
                                        windows={windows}
                                        uniqueTotal={t.unique_estudiantes_total}
                                        uniqueAsisTotal={t.unique_asistencias_total}
                                      />
                                    </TableRow>
                                  ))}
                              </React.Fragment>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}

                  {carreras.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={colSpan}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No hay datos para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function ReportTreeTable({
  insights,
  title,
  contextLabel,
  showSummary = true,
  totalEstudiantesOverride,
}: {
  insights: PeriodInsights | null;
  title?: string;
  contextLabel?: string;
  showSummary?: boolean;
  totalEstudiantesOverride?: number;
}) {
  const sectionTitle = useMemo(
    () => title ?? "Detalle por carrera, asignatura y tutor",
    [title]
  );

  return (
    <div className="space-y-4 [content-visibility:auto] [contain-intrinsic-size:980px]">
      <div>
        <InsightsTableSection
          title={sectionTitle}
          contextLabel={contextLabel}
          showSummary={showSummary}
          totalEstudiantesOverride={totalEstudiantesOverride}
          slice={insights ?? undefined}
        />
      </div>
    </div>
  );
}

const MemoizedReportTreeTable = memo(ReportTreeTable);
MemoizedReportTreeTable.displayName = "ReportTreeTable";

export default MemoizedReportTreeTable;

export function PeriodInsightsSummary({
  insights,
  totalEstudiantesOverride,
}: {
  insights: PeriodInsights | null;
  totalEstudiantesOverride?: number;
}) {
  const summary = useMemo(() => buildInsightsSummary(insights ?? undefined), [insights]);
  const totalEstudiantes =
    typeof totalEstudiantesOverride === "number"
      ? totalEstudiantesOverride
      : summary.totalEstudiantes;

  if (summary.perWindowTotals.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border bg-muted/15 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Total de la selección
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Estudiantes únicos</p>
            <p className="mt-1 text-2xl font-semibold">
              {totalEstudiantes.toLocaleString("es-CO")}
            </p>
          </div>
          <div className="rounded-xl border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Asistencias únicas</p>
            <p className="mt-1 text-2xl font-semibold">
              {summary.totalAsistencias.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Resumen por entrega
        </p>
        <div className="mt-3 grid gap-2">
          {summary.perWindowTotals.map((window) => (
            <div
              key={window.window_id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-muted/10 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {formatWindowHeaderLabel(window) || `Informe ${window.window_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {window.estudiantes.toLocaleString("es-CO")} estudiantes ·{" "}
                  {window.asistencias.toLocaleString("es-CO")} asistencias
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
