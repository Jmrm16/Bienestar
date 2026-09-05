import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Asignatura {
    id: number;
    nombre: string;
    codigo?: string | null;
    carrera_id: number;
}

interface Props {
    asignaturas: Asignatura[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onClear: () => void;
    carreraNombre?: string | null;
}

export default function TutorAsignaturasField({ asignaturas, selectedIds, onToggle, onClear, carreraNombre }: Props) {
    const [search, setSearch] = useState('');

    const filteredSubjects = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return asignaturas;
        }

        return asignaturas.filter((subject) => {
            const code = subject.codigo?.toLowerCase() ?? '';
            return subject.nombre.toLowerCase().includes(query) || code.includes(query);
        });
    }, [asignaturas, search]);

    const selectedSubjects = useMemo(() => asignaturas.filter((subject) => selectedIds.includes(subject.id)), [asignaturas, selectedIds]);

    const hasCareer = Boolean(carreraNombre);

    return (
        <div className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Label>Asignaturas</Label>
                        <Badge variant="secondary">{selectedIds.length} seleccionadas</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {hasCareer ? `Mostrando solo asignaturas de ${carreraNombre}.` : 'Selecciona una carrera para ver sus asignaturas.'}
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                        Limpiar
                    </Button>
                )}
            </div>

            {selectedSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                        <Badge key={subject.id} variant="outline" className="max-w-full truncate">
                            {subject.nombre}
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">No hay asignaturas seleccionadas.</p>
            )}

            <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar asignatura o código"
                    className="pl-9"
                    disabled={!hasCareer}
                />
            </div>

            <ScrollArea className="h-56 rounded-md border">
                <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {!hasCareer ? (
                        <div className="text-muted-foreground col-span-full rounded-md border border-dashed p-4 text-sm">
                            Primero elige la carrera del tutor.
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className="text-muted-foreground col-span-full rounded-md border border-dashed p-4 text-sm">
                            No hay asignaturas para mostrar con ese filtro.
                        </div>
                    ) : (
                        filteredSubjects.map((subject) => (
                            <label
                                key={subject.id}
                                className="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                            >
                                <Checkbox checked={selectedIds.includes(subject.id)} onCheckedChange={() => onToggle(subject.id)} />
                                <div className="min-w-0 text-sm">
                                    <p className="leading-tight font-medium">{subject.nombre}</p>
                                    {subject.codigo && <p className="text-muted-foreground truncate text-xs">Código: {subject.codigo}</p>}
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
