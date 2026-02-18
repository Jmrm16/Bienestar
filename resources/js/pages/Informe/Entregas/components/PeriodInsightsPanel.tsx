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

type WindowRow = {
  window_id: number;
  name: string;
};

type PerWindow = Record<string, { estudiantes: number; asistencias: number }>;

type TutorNode = {
  id: number;
  name: string;
  per_window: PerWindow;
};

type AsignaturaNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  tutores: TutorNode[];
};

type CarreraNode = {
  id: number;
  name: string;
  per_window: PerWindow;
  asignaturas: AsignaturaNode[];
};

type Insights = {
  by_window: WindowRow[];
  tree?: {
    carreras: CarreraNode[];
  };
};

function sumCells(perWindow: PerWindow, windows: WindowRow[]) {
  let est = 0;
  let asis = 0;
  for (const w of windows) {
    const cell = perWindow?.[String(w.window_id)];
    est += cell?.estudiantes ?? 0;
    asis += cell?.asistencias ?? 0;
  }
  return { est, asis };
}

function HeaderCells({ windows }: { windows: WindowRow[] }) {
  return (
    <>
      {windows.map((w) => (
        <React.Fragment key={w.window_id}>
          <TableHead className="text-right">Est. {w.name}</TableHead>
          <TableHead className="text-right">Asis. {w.name}</TableHead>
        </React.Fragment>
      ))}
      <TableHead className="text-right">Total Est.</TableHead>
      <TableHead className="text-right">Total Asis.</TableHead>
    </>
  );
}

function DataCells({
  perWindow,
  windows,
}: {
  perWindow: PerWindow;
  windows: WindowRow[];
}) {
  const totals = sumCells(perWindow, windows);

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
      <TableCell className="text-right font-semibold">{totals.est}</TableCell>
      <TableCell className="text-right font-semibold">{totals.asis}</TableCell>
    </>
  );
}

export default function ReportTreeTable({
  insights,
}: {
  insights: Insights | null;
}) {
  const windows = insights?.by_window ?? [];
  const carreras = insights?.tree?.carreras ?? [];

  const [openCarreras, setOpenCarreras] = useState<Record<number, boolean>>({});
  const [openAsignaturas, setOpenAsignaturas] = useState<Record<string, boolean>>(
    {}
  );

  const toggleCarrera = (id: number) =>
    setOpenCarreras((s) => ({ ...s, [id]: !s[id] }));

  const toggleAsignatura = (carreraId: number, asignaturaId: number) => {
    const key = `${carreraId}:${asignaturaId}`;
    setOpenAsignaturas((s) => ({ ...s, [key]: !s[key] }));
  };

  const colSpan = 1 + windows.length * 2 + 2;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Carreras → Asignaturas → Tutores (por informe)
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <HeaderCells windows={windows} />
              </TableRow>
            </TableHeader>

            <TableBody>
              {carreras.map((c) => {
                const isOpenC = !!openCarreras[c.id];

                return (
                  <React.Fragment key={c.id}>
                    {/* Carrera */}
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleCarrera(c.id)}
                          className="inline-flex items-center gap-2"
                        >
                          {isOpenC ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {c.name}
                        </button>
                      </TableCell>

                      <DataCells perWindow={c.per_window} windows={windows} />
                    </TableRow>

                    {/* Asignaturas */}
                    {isOpenC &&
                      (c.asignaturas ?? []).map((a) => {
                        const key = `${c.id}:${a.id}`;
                        const isOpenA = !!openAsignaturas[key];

                        return (
                          <React.Fragment key={a.id}>
                            <TableRow>
                              <TableCell className="pl-8 font-medium">
                                <button
                                  type="button"
                                  onClick={() => toggleAsignatura(c.id, a.id)}
                                  className="inline-flex items-center gap-2"
                                >
                                  {isOpenA ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  {a.name}
                                </button>
                              </TableCell>

                              <DataCells perWindow={a.per_window} windows={windows} />
                            </TableRow>

                            {/* Tutores */}
                            {isOpenA &&
                              (a.tutores ?? []).map((t) => (
                                <TableRow key={t.id}>
                                  <TableCell className="pl-14 text-sm">
                                    {t.name}
                                  </TableCell>

                                  <DataCells
                                    perWindow={t.per_window}
                                    windows={windows}
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
                    No hay datos para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
