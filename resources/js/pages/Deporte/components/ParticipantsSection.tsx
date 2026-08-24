import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Download, Plus, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PARTICIPANT_ESTAMENTOS, PARTICIPANT_STATES } from './participant-badges';
import { ParticipantDialog } from './ParticipantDialog';
import type { ParticipantFormValues } from './ParticipantForm';
import { ParticipantsTable } from './ParticipantsTable';
import type { Carrera, ParticipantStats, SportParticipant } from './types';

function payloadFromForm(values: ParticipantFormValues) {
    return {
        ...values,
        carrera_id: values.carrera_id === 'none' ? null : Number(values.carrera_id),
        fecha_ingreso: values.fecha_ingreso || null,
        telefono: values.telefono || null,
        correo: values.correo || null,
        semestre: values.semestre || null,
        observaciones: values.observaciones || null,
    };
}

export function ParticipantsSection({
    sportKey,
    sportTitle,
    participants,
    carreras,
    stats,
}: {
    sportKey: string;
    sportTitle: string;
    participants: SportParticipant[];
    carreras: Carrera[];
    stats: ParticipantStats;
}) {
    const [q, setQ] = useState('');
    const [stateFilter, setStateFilter] = useState('Todos');
    const [estamentoFilter, setEstamentoFilter] = useState('Todos');
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<SportParticipant | null>(null);

    const hasActiveFilters = q.trim().length > 0 || stateFilter !== 'Todos' || estamentoFilter !== 'Todos';

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();

        return participants
            .filter((participant) => {
                if (!term) return true;

                const fullName = `${participant.nombres} ${participant.apellidos}`.toLowerCase();

                return (
                    participant.documento.toLowerCase().includes(term) ||
                    fullName.includes(term) ||
                    participant.estamento.toLowerCase().includes(term) ||
                    participant.estado.toLowerCase().includes(term) ||
                    (participant.carrera_nombre ?? '').toLowerCase().includes(term)
                );
            })
            .filter((participant) => (stateFilter === 'Todos' ? true : participant.estado === stateFilter))
            .filter((participant) => (estamentoFilter === 'Todos' ? true : participant.estamento === estamentoFilter));
    }, [participants, q, stateFilter, estamentoFilter]);

    const createParticipant = (values: ParticipantFormValues) => {
        router.post(`/deportes/${sportKey}/participantes`, payloadFromForm(values), {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                setQ('');
            },
        });
    };

    const updateParticipant = (values: ParticipantFormValues) => {
        if (!editing) return;

        router.post(
            `/deportes/${sportKey}/participantes/${editing.id}`,
            {
                _method: 'put',
                ...payloadFromForm(values),
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(null),
            },
        );
    };

    const deleteParticipant = (participant: SportParticipant) => {
        const confirmed = window.confirm(`Vas a eliminar a ${participant.nombres} ${participant.apellidos} de ${sportTitle}.`);

        if (!confirmed) return;

        router.delete(`/deportes/${sportKey}/participantes/${participant.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editing?.id === participant.id) setEditing(null);
            },
        });
    };

    const clearFilters = () => {
        setQ('');
        setStateFilter('Todos');
        setEstamentoFilter('Todos');
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">Participantes</h2>
                    <p className="text-muted-foreground text-sm">
                        {stats.total} registrados · {stats.active} activos · {stats.students} estudiantes
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <a href={`/deportes/${sportKey}/participantes/export`}>
                            <Download className="size-4" />
                            Exportar CSV
                        </a>
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Agregar participante
                    </Button>
                </div>
            </div>

            <Card className="gap-0">
                <CardHeader className="border-b">
                    <CardTitle className="text-base">Directorio de participantes</CardTitle>
                    <CardDescription>
                        {filtered.length} de {participants.length} registros visibles.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                    <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                            <Input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Buscar por documento, nombre o carrera"
                                className="pl-9"
                            />
                        </div>

                        <Select value={stateFilter} onValueChange={setStateFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos los estados</SelectItem>
                                {PARTICIPANT_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={estamentoFilter} onValueChange={setEstamentoFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos los estamentos</SelectItem>
                                {PARTICIPANT_ESTAMENTOS.map((estamento) => (
                                    <SelectItem key={estamento} value={estamento}>
                                        {estamento}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button type="button" variant="ghost" disabled={!hasActiveFilters} onClick={clearFilters}>
                            <RotateCcw className="size-4" />
                            Limpiar
                        </Button>
                    </div>

                    <ParticipantsTable rows={filtered} onEdit={setEditing} onDelete={deleteParticipant} />
                </CardContent>
            </Card>

            <ParticipantDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={createParticipant} carreras={carreras} mode="create" />

            <ParticipantDialog
                open={editing !== null}
                onOpenChange={(open) => {
                    if (!open) setEditing(null);
                }}
                onSubmit={updateParticipant}
                carreras={carreras}
                participant={editing}
                mode="edit"
            />
        </section>
    );
}
