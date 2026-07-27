import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash2, Upload, UserPlus2, UserX2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import ImportarArchivoModal from '@/pages/Asistencias/Importar';

interface Tutor {
    id: number;
    nombre: string;
    apellido: string;
    tipo_resolucion?: 'R1' | 'R2' | null;
    period_resolutions?: Array<{
        period_id: number;
        tipo_resolucion: 'R1' | 'R2';
    }>;
    pivot?: {
        rol: string;
    };
}

interface Carrera {
    id: number;
    nombre: string;
}

interface Periodo {
    id: number;
    name: string;
    code: string;
}

interface Grupo {
    id: number;
    nombre: string;
    codigo: string;
    docente?: string;
    carrera: Carrera;
    tipo?: string;
    tutores?: Tutor[];
    asignatura_id?: number;
    periodo?: Periodo;
}

interface Props {
    grupos?: Grupo[];
    gruposT?: Grupo[];
    tutores: Tutor[];
}

const TablaGrupo = ({ grupos = [], gruposT = [], tutores }: Props) => {
    const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
    const [grupoParaImportar, setGrupoParaImportar] = useState<Grupo | null>(null);
    const [isAsignarOpen, setIsAsignarOpen] = useState(false);
    const [isImportarOpen, setIsImportarOpen] = useState(false);
    const [tutorId, setTutorId] = useState<string>('');
    const [tipoResolucion, setTipoResolucion] = useState<'' | 'R1' | 'R2'>('');

    const [grupoEdit, setGrupoEdit] = useState<Grupo | null>(null);
    const [grupoNombre, setGrupoNombre] = useState('');
    const [grupoCodigo, setGrupoCodigo] = useState('');
    const [grupoDocente, setGrupoDocente] = useState('');

    const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);

    const { flash = {} } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const selectedTutorData = tutores.find((tutor) => String(tutor.id) === tutorId) ?? null;

    const existingPeriodResolution =
        selectedTutorData?.period_resolutions?.find((resolution) => resolution.period_id === selectedGrupo?.periodo?.id)?.tipo_resolucion ?? '';

    useEffect(() => {
        if (!selectedGrupo || !selectedTutorData) {
            setTipoResolucion('');
            return;
        }

        setTipoResolucion(existingPeriodResolution || selectedTutorData.tipo_resolucion || '');
    }, [existingPeriodResolution, selectedGrupo, selectedTutorData]);

    const handleAsignar = () => {
        if (!selectedGrupo || !tutorId || !tipoResolucion) return;

        router.post(
            `/grupost/${selectedGrupo.id}/asignar-tutor`,
            {
                tutor_id: tutorId,
                tipo_resolucion: tipoResolucion,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('✅ Tutor asignado correctamente');
                    setIsAsignarOpen(false);
                    setTutorId('');
                    setTipoResolucion('');
                    router.reload({ only: ['gruposT', 'grupos'] });
                },
                onError: (errors) => {
                    const first = errors && Object.values(errors)[0];
                    toast.error(`❌ No se pudo asignar el tutor${first ? `: ${first}` : ''}`);
                },
            },
        );
    };

    const handleQuitarTutor = (grupoId: number, tutorId: number) => {
        router.post(
            `/grupost/${grupoId}/quitar-tutor`,
            { tutor_id: tutorId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tutor eliminado');
                    router.reload({ only: ['gruposT', 'grupos'] });
                },
            },
        );
    };

    const handleEliminarGrupo = () => {
        if (!grupoToDelete) return;

        router.delete(`/grupost/${grupoToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('✅ Grupo eliminado correctamente');
                setGrupoToDelete(null);
                router.reload({ only: ['gruposT', 'grupos'] });
            },
        });
    };

    const handleGuardarEdicion = () => {
        if (!grupoEdit) return;

        router.put(
            `/grupost/${grupoEdit.id}`,
            {
                nombre: grupoNombre,
                codigo: grupoCodigo,
                docente: grupoDocente,
                carrera_id: grupoEdit.carrera.id,
                asignatura_id: grupoEdit.asignatura_id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('✅ Grupo actualizado correctamente');
                    setGrupoEdit(null);
                    router.reload({ only: ['gruposT', 'grupos'] });
                },
            },
        );
    };

    const gruposCombinados = [...grupos.map((g) => ({ ...g, tipo: 'Grupo' })), ...gruposT.map((g) => ({ ...g, tipo: 'GrupoT' }))];

    return (
        <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
            <div className="p-6">
                <Table className="min-w-full">
                    <TableCaption>Lista de grupos registrados en el sistema</TableCaption>

                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Docente</TableHead>
                            <TableHead>Carrera</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead>Tutores</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {gruposCombinados.map((grupo) => (
                            <TableRow key={`${grupo.tipo}-${grupo.id}`}>
                                <TableCell>{grupo.nombre}</TableCell>
                                <TableCell>{grupo.codigo}</TableCell>
                                <TableCell>{grupo.docente ?? 'Sin docente'}</TableCell>
                                <TableCell>{grupo.carrera.nombre}</TableCell>
                                <TableCell>{grupo.tipo}</TableCell>

                                <TableCell>{grupo.periodo?.code ?? 'Sin período'}</TableCell>

                                {/* 🔥 MOSTRAR TODOS LOS TUTORES CON SU ROL */}
                                <TableCell>
                                    {grupo.tutores?.length ? (
                                        <div className="flex flex-col gap-1">
                                            {grupo.tutores.map((tutor) => (
                                                <div key={tutor.id} className="flex items-center justify-between">
                                                    <span>
                                                        {tutor.nombre} {tutor.apellido}
                                                        <span className="text-muted-foreground text-xs">({tutor.pivot?.rol})</span>
                                                    </span>

                                                    <button
                                                        className="text-xs text-red-500 hover:underline"
                                                        onClick={() => handleQuitarTutor(grupo.id, tutor.id)}
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'No asignado'
                                    )}
                                </TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.visit(`/grupos/${grupo.id}/asistencias`)}>
                                                <Eye className="mr-2 size-4" /> Ver asistencias
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setGrupoParaImportar(grupo);
                                                    setIsImportarOpen(true);
                                                }}
                                            >
                                                <Upload className="mr-2 size-4" /> Importar asistencias
                                            </DropdownMenuItem>

                                            {/* 🔥 SIEMPRE PERMITIR ASIGNAR TUTOR */}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedGrupo(grupo);
                                                    setTutorId('');
                                                    setTipoResolucion('');
                                                    setIsAsignarOpen(true);
                                                }}
                                            >
                                                <UserPlus2 className="mr-2 size-4" /> Asignar tutor
                                            </DropdownMenuItem>

                                            {/* 🔥 Mostrar quitar tutor SOLO si hay */}
                                            {grupo.tutores?.length ? (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (grupo.tutores?.[0]) {
                                                            handleQuitarTutor(grupo.id, grupo.tutores[0].id);
                                                        }
                                                    }}
                                                >
                                                    <UserX2 className="mr-2 size-4" /> Quitar tutor
                                                </DropdownMenuItem>
                                            ) : null}

                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setGrupoEdit(grupo);
                                                    setGrupoNombre(grupo.nombre);
                                                    setGrupoCodigo(grupo.codigo);
                                                    setGrupoDocente(grupo.docente ?? '');
                                                }}
                                            >
                                                <Pencil className="mr-2 size-4" /> Editar grupo
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => setGrupoToDelete(grupo)}>
                                                <Trash2 className="mr-2 size-4" /> Eliminar grupo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Modales (sin cambios) */}
            {/* ---------- MODALES ---------- */}

            {/* Modal editar */}
            <Dialog open={!!grupoEdit} onOpenChange={() => setGrupoEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Grupo</DialogTitle>
                        <DialogDescription>Actualiza la información académica del grupo.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Nombre</Label>
                            <input
                                value={grupoNombre}
                                onChange={(e) => setGrupoNombre(e.target.value)}
                                className="col-span-3 rounded border px-2 py-1"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Código</Label>
                            <input
                                value={grupoCodigo}
                                onChange={(e) => setGrupoCodigo(e.target.value)}
                                className="col-span-3 rounded border px-2 py-1"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Docente</Label>
                            <input
                                value={grupoDocente}
                                onChange={(e) => setGrupoDocente(e.target.value)}
                                className="col-span-3 rounded border px-2 py-1"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleGuardarEdicion}>Guardar cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal eliminar */}
            <AlertDialog open={!!grupoToDelete} onOpenChange={() => setGrupoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción eliminará el grupo permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="button" onClick={handleEliminarGrupo}>
                                Eliminar
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal importar */}
            <Dialog open={isImportarOpen} onOpenChange={setIsImportarOpen}>
                {grupoParaImportar && <ImportarArchivoModal grupo={grupoParaImportar} onClose={() => setIsImportarOpen(false)} />}
            </Dialog>

            {/* Modal asignar tutor */}
            <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Tutor</DialogTitle>
                        <DialogDescription>
                            Selecciona un tutor para el grupo <span className="font-semibold">{selectedGrupo?.nombre}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tutor</Label>
                            <Select value={tutorId} onValueChange={setTutorId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un tutor" />
                                </SelectTrigger>

                                <SelectContent>
                                    {tutores
                                        .filter((t) => !selectedGrupo?.tutores?.some((asig) => asig.id === t.id))
                                        .map((tutor) => (
                                            <SelectItem key={tutor.id} value={tutor.id.toString()}>
                                                {tutor.nombre} {tutor.apellido}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Resolución</Label>
                            <div className="col-span-3 space-y-2">
                                <Select
                                    value={tipoResolucion}
                                    onValueChange={(value) => setTipoResolucion(value as '' | 'R1' | 'R2')}
                                    disabled={!tutorId || Boolean(existingPeriodResolution)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona R1 o R2" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="R1">R1</SelectItem>
                                        <SelectItem value="R2">R2</SelectItem>
                                    </SelectContent>
                                </Select>

                                {existingPeriodResolution ? (
                                    <p className="text-muted-foreground text-xs">
                                        Este tutor ya tiene la resolución {existingPeriodResolution} para el período{' '}
                                        {selectedGrupo?.periodo?.code ?? 'actual'}.
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground text-xs">
                                        La resolución se guardará para este tutor solo en el período del grupo.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleAsignar} disabled={!tutorId || !tipoResolucion}>
                            Asignar tutor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ... */}
        </div>
    );
};

export default TablaGrupo;
