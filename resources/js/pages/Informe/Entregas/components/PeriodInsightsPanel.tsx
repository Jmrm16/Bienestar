import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/* =========================
   TIPOS
========================= */

type PerWindow = Record<string, { estudiantes: number; asistencias: number }>;

type TutorNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  unique_estudiantes_total?: number;
};

type AsignaturaNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  tutores: TutorNode[];
  unique_estudiantes_total?: number;
};

type CarreraNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  asignaturas: AsignaturaNode[];
  unique_estudiantes_total?: number;
};

export type WindowInsightRow = {
  window_id: number;
  name?: string;
};

export type PeriodInsights = {
  by_window?: WindowInsightRow[]; // puede venir o no
  tree?: {
    carreras?: CarreraNode[];
  };
};

const EMPTY_CARRERAS: CarreraNode[] = [];

/* =========================
   HELPERS
========================= */

// ✅ solo suma asistencias (estudiantes NO se suman)
function sumAsis(perWindow: PerWindow, windows: WindowInsightRow[]) {
  let asis = 0;
  for (const w of windows) {
    const cell = perWindow?.[String(w.window_id)];
    asis += cell?.asistencias ?? 0;
  }
  return asis;
}

// ✅ infiere windows ids desde el tree (si by_window no viene)
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

function HeaderCells({ windows }: { windows: WindowInsightRow[] }) {
  return (
    <>
      {windows.map((w) => (
        <React.Fragment key={w.window_id}>
          <TableHead className="text-right">
            Est. {w.name ?? `W${w.window_id}`}
          </TableHead>
          <TableHead className="text-right">
            Asis. {w.name ?? `W${w.window_id}`}
          </TableHead>
        </React.Fragment>
      ))}
      <TableHead className="text-right font-bold">Total Est.</TableHead>
      <TableHead className="text-right font-bold">Total Asis.</TableHead>
    </>
  );
}

function DataCells({
  perWindow,
  windows,
  uniqueTotal,
}: {
  perWindow: PerWindow;
  windows: WindowInsightRow[];
  uniqueTotal?: number;
}) {
  const totalAsis = sumAsis(perWindow, windows);

  return (
    <>
      {windows.map((w) => {
        const cell = perWindow?.[String(w.window_id)];
        return (
          <React.Fragment key={w.window_id}>
            <TableCell className="text-right">{cell?.estudiantes ?? 0}</TableCell>
            <TableCell className="text-right">{cell?.asistencias ?? 0}</TableCell>
          </React.Fragment>
        );
      })}

      {/* ✅ Total Estudiantes ÚNICOS (backend) */}
      <TableCell className="text-right font-bold">{uniqueTotal ?? 0}</TableCell>

      {/* ✅ Total Asistencias sí se suma */}
      <TableCell className="text-right font-bold">{totalAsis}</TableCell>
    </>
  );
}

export default function ReportTreeTable({ insights }: { insights: PeriodInsights | null }) {
  const carreras = insights?.tree?.carreras ?? EMPTY_CARRERAS;

  // ✅ windows auto-detect:
  // 1) si viene by_window -> úsalo
  // 2) si no -> infiere por keys de per_window
  const windows: WindowInsightRow[] = useMemo(() => {
    const by = insights?.by_window ?? [];
    if (by.length > 0) {
      // Asegura shape y orden
      return by
        .map((w) => ({ window_id: Number(w.window_id), name: String(w.name ?? "") }))
        .filter((w) => Number.isFinite(w.window_id));
    }

    // fallback: inferir desde per_window
    const ids = inferWindowIdsFromTree(carreras);
    return ids.map((id) => ({ window_id: id, name: `Informe ${id}` }));
  }, [insights, carreras]);

  const [openCarreras, setOpenCarreras] = useState<Record<number, boolean>>({});
  const [openAsignaturas, setOpenAsignaturas] = useState<Record<string, boolean>>({});

  const toggleCarrera = (id: number) =>
    setOpenCarreras((s) => ({ ...s, [id]: !s[id] }));

  const toggleAsignatura = (carreraId: number, asignaturaId: number) => {
    const key = `${carreraId}:${asignaturaId}`;
    setOpenAsignaturas((s) => ({ ...s, [key]: !s[key] }));
  };

  const colSpan = 1 + windows.length * 2 + 2;

  if (!windows.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay informes disponibles
        </CardContent>
      </Card>
    );
  }

  return (
    
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      
      <Card>

        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Carreras → Asignaturas → Tutores (por informe)
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[320px]">Nombre</TableHead>
                    <HeaderCells windows={windows} />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {carreras.map((c) => {
                    const isOpenC = !!openCarreras[c.id];

                    return (
                      <React.Fragment key={c.id}>
                        {/* Carrera */}
                        <TableRow className="font-medium bg-muted/5">
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleCarrera(c.id)}
                              className="w-full text-left inline-flex items-center gap-2 py-1"
                            >
                              {isOpenC ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-semibold">{c.name}</span>
                            </button>
                          </TableCell>

                          <DataCells
                            perWindow={c.per_window}
                            windows={windows}
                            uniqueTotal={c.unique_estudiantes_total}
                          />
                        </TableRow>

                        {/* Asignaturas */}
                        {isOpenC &&
                          (c.asignaturas ?? []).map((a) => {
                            const key = `${c.id}:${a.id}`;
                            const isOpenA = !!openAsignaturas[key];

                            return (
                              <React.Fragment key={a.id}>
                                <TableRow className="text-sm">
                                  <TableCell className="pl-8">
                                    <button
                                      type="button"
                                      onClick={() => toggleAsignatura(c.id, a.id)}
                                      className="w-full text-left inline-flex items-center gap-2 py-1"
                                    >
                                      {isOpenA ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      {a.name}
                                    </button>
                                  </TableCell>

                                  <DataCells
                                    perWindow={a.per_window}
                                    windows={windows}
                                    uniqueTotal={a.unique_estudiantes_total}
                                  />
                                </TableRow>

                                {/* Tutores */}
                                {isOpenA &&
                                  (a.tutores ?? []).map((t) => (
                                    <TableRow
                                      key={t.id}
                                      className="text-sm text-muted-foreground"
                                    >
                                      <TableCell className="pl-14">{t.name}</TableCell>

                                      <DataCells
                                        perWindow={t.per_window}
                                        windows={windows}
                                        uniqueTotal={t.unique_estudiantes_total}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
