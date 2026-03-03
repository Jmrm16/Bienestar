import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { SportParticipant } from "./types";

export function ParticipantsTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: SportParticipant[];
  onEdit: (participant: SportParticipant) => void;
  onDelete: (participant: SportParticipant) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Estamento</TableHead>
            <TableHead>Carrera</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ingreso</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No hay participantes registrados para esta disciplina.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell className="font-medium">
                  {participant.tipo_doc} {participant.documento}
                </TableCell>
                <TableCell>
                  {participant.nombres} {participant.apellidos}
                </TableCell>
                <TableCell>{participant.estamento}</TableCell>
                <TableCell>{participant.carrera_nombre ?? "No aplica"}</TableCell>
                <TableCell>{participant.estado}</TableCell>
                <TableCell>{participant.fecha_ingreso ?? "Sin fecha"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(participant)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(participant)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
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
