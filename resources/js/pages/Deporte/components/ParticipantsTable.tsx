import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { AreaStyle } from "./area-styles";
import {
  getParticipantEstamentoBadgeClass,
  getParticipantStateBadgeClass,
} from "./participant-badges";
import type { SportParticipant } from "./types";

export function ParticipantsTable({
  rows,
  onEdit,
  onDelete,
  style,
}: {
  rows: SportParticipant[];
  onEdit: (participant: SportParticipant) => void;
  onDelete: (participant: SportParticipant) => void;
  style: AreaStyle;
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border ${style.softCard}`}>
      <Table>
        <TableHeader className={style.focusPanel}>
          <TableRow className="hover:bg-transparent">
            <TableHead className={style.copy}>Documento</TableHead>
            <TableHead className={style.copy}>Nombre</TableHead>
            <TableHead className={style.copy}>Estamento</TableHead>
            <TableHead className={style.copy}>Carrera</TableHead>
            <TableHead className={style.copy}>Estado</TableHead>
            <TableHead className={style.copy}>Ingreso</TableHead>
            <TableHead className={`text-right ${style.copy}`}>Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className={`py-8 text-center ${style.subcopy}`}>
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
                <TableCell>
                  <Badge variant="outline" className={getParticipantEstamentoBadgeClass(participant.estamento)}>
                    {participant.estamento}
                  </Badge>
                </TableCell>
                <TableCell>{participant.carrera_nombre ?? "No aplica"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getParticipantStateBadgeClass(participant.estado)}>
                    {participant.estado}
                  </Badge>
                </TableCell>
                <TableCell>{participant.fecha_ingreso ?? "Sin fecha"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={style.badge}
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
