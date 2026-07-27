import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { getParticipantEstamentoBadgeClass, getParticipantStateBadgeClass } from './participant-badges';
import type { SportParticipant } from './types';

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
        <div className="overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
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
                            <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
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
                                <TableCell>{participant.carrera_nombre ?? 'No aplica'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getParticipantStateBadgeClass(participant.estado)}>
                                        {participant.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell>{participant.fecha_ingreso ?? 'Sin fecha'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(participant)}>
                                            <Pencil className="h-4 w-4" />
                                            Editar
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDelete(participant)}>
                                            <Trash2 className="h-4 w-4" />
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
