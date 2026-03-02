import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Patient } from "./types";
import { Eye, Trash2 } from "lucide-react";

export function PatientsTable({
  rows,
  onView,
  onDelete,
}: {
  rows: Patient[];
  onView?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void; // ✅ opcional
}) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Carrera</TableHead> {/* ✅ antes: Programa */}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No hay pacientes para mostrar.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {(p.tipo_doc ? `${p.tipo_doc} ` : "") + p.documento}
                </TableCell>

                <TableCell>{`${p.nombres} ${p.apellidos}`}</TableCell>

                <TableCell>{p.telefono ?? "—"}</TableCell>

                <TableCell>{p.carrera_nombre ?? "—"}</TableCell>

                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    {onView ? (
                      <Button size="sm" variant="outline" onClick={() => onView(p)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    ) : null}

                    {onDelete ? (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(p)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}