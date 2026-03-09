import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
        tutor_type: w.tutor_type,
      }))
      .filter((w) => Number.isFinite(w.window_id));
  }

  const ids = inferWindowIdsFromTree(carreras);
  return ids.map((id) => ({ window_id: id, name: `Informe ${id}` }));
}

function HeaderCells({ windows }: { windows: WindowInsightRow[] }) {
  return (
    <>
      {windows.map((w, index) => (
        <React.Fragment key={w.window_id}>
          <TableHead className="whitespace-nowrap px-2 text-right text-[11px] sm:text-sm">
            <span className="sm:hidden">Est. W{index + 1}</span>
            <span className="hidden sm:inline">Est. {w.name ?? `W${w.window_id}`}</span>
          </TableHead>
          <TableHead className="whitespace-nowrap px-2 text-right text-[11px] sm:text-sm">
            <span className="sm:hidden">Asis. W{index + 1}</span>
            <span className="hidden sm:inline">Asis. {w.name ?? `W${w.window_id}`}</span>
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
            <TableCell className="whitespace-nowrap px-2 text-right text-xs sm:text-sm">
              {cell?.estudiantes ?? 0}
            </TableCell>
            <TableCell className="whitespace-nowrap px-2 text-right text-xs sm:text-sm">
              {cell?.asistencias ?? 0}
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
  slice,
}: {
  title: string;
  slice: InsightSlice | undefined;
}) {
  const carreras = slice?.tree?.carreras ?? EMPTY_CARRERAS;

  const windows = useMemo(() => buildWindows(slice, carreras), [slice, carreras]);

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
    <Card className="overflow-hidden">
      <CardHeader className="px-4 pb-2 sm:px-6">
        <CardTitle className="text-sm leading-tight sm:text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-0 pt-0">
        {windows.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No hay informes disponibles para esta resolucion
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="px-4 pb-2 text-xs text-muted-foreground sm:hidden">
              Desliza horizontalmente para ver toda la tabla
            </div>
            <div className="px-4 pb-2 text-[11px] text-muted-foreground sm:hidden">
              {windows.map((w, index) => (
                <span key={w.window_id} className="mr-3 inline-block">
                  W{index + 1}: {w.name ?? `Informe ${w.window_id}`}
                </span>
              ))}
            </div>
            <div style={{ minWidth: `${tableMinWidth}px` }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 w-[220px] bg-background px-2 text-[11px] sm:w-[320px] sm:text-sm">
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
                          <TableCell className="sticky left-0 z-10 bg-background px-2">
                            <button
                              type="button"
                              onClick={() => toggleCarrera(c.id)}
                              className="inline-flex w-full min-w-0 items-center gap-2 py-1 text-left text-xs sm:text-sm"
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
                                  <TableCell className="sticky left-0 z-10 bg-background px-2 pl-8">
                                    <button
                                      type="button"
                                      onClick={() => toggleAsignatura(c.id, a.id)}
                                      className="inline-flex w-full min-w-0 items-center gap-2 py-1 text-left text-xs sm:text-sm"
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
                                      <TableCell className="sticky left-0 z-10 bg-background px-2 pl-14 text-xs sm:text-sm">
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

export default function ReportTreeTable({ insights }: { insights: PeriodInsights | null }) {
  const sections = useMemo(() => {
    if (insights?.by_type) {
      return [
        {
          key: "R1",
          title: "Carreras → Asignaturas → Tutores (Resolucion R1)",
          slice: insights.by_type.R1,
        },
        {
          key: "R2",
          title: "Carreras → Asignaturas → Tutores (Resolucion R2)",
          slice: insights.by_type.R2,
        },
      ];
    }

    return [
      {
        key: "ALL",
        title: "Carreras → Asignaturas → Tutores (por informe)",
        slice: insights ?? undefined,
      },
    ];
  }, [insights]);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <InsightsTableSection title={section.title} slice={section.slice} />
        </motion.div>
      ))}
    </div>
  );
}
