import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Filter, Mail, PencilLine, Search, Trash2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AgregarTutor from '@/pages/Tutores/components/dialogs/AgregaTutor';
import ImportarResolucionesPeriodoDialog from '@/pages/Tutores/components/dialogs/ImportarResolucionesPeriodoDialog';
import ImportarTutoresDialog from '@/pages/Tutores/components/dialogs/ImportarTutoresDialog';
import TutorAsignaturasField from '@/pages/Tutores/components/fields/TutorAsignaturasField';

/* ===== Tipos ===== */
interface Asignatura {
    id: number;
    nombre: string;
    codigo?: string | null;
    carrera_id: number;
}

interface Carrera {
    id: number;
    nombre: string;
}

interface Periodo {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

interface Tutor {
    id: number;
    codigo?: string;
    nombre: string;
    apellido: string;
    tipo_documento: string;
    documento: string;
    lugar_expedicion: string;
    sexo: string;
    grupo_priorizado: string;
    sede: string;
    carrera_id: number;
    carrera?: { id: number; nombre: string };
    correo: string;
    telefono: string;
    activo?: boolean;
    asignaturas: Asignatura[];
}

/* CSRF */
function csrfToken(): string {
    const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return el?.content ?? '';
}

const ITEMS_PER_PAGE = 10;

const TablaTutor = () => {
    const {
        tutores = [],
        asignaturas = [],
        carreras = [],
    } = usePage().props as unknown as {
        tutores: Tutor[];
        asignaturas: Asignatura[];
        carreras: Carrera[];
        periodos: Periodo[];
    };

    /* ───────── FILTROS ───────── */
    const [search, setSearch] = useState('');
    const [carreraFilter, setCarreraFilter] = useState('all');
    const [asignaturaFilter, setAsignaturaFilter] = useState('all');

    /* ───────── MODALES ───────── */
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [page, setPage] = useState(1);

    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [deleteTutor, setDeleteTutor] = useState<Tutor | null>(null);

    const asignaturasMap = useMemo(() => {
        const map = new Map<number, Asignatura>();
        asignaturas.forEach((a) => map.set(a.id, a));
        return map;
    }, [asignaturas]);

    const carrerasMap = useMemo(() => {
        const map = new Map<number, Carrera>();
        carreras.forEach((carrera) => map.set(carrera.id, carrera));
        return map;
    }, [carreras]);

    const asignaturasDisponibles = useMemo(() => {
        if (!selectedTutor) {
            return [];
        }

        return asignaturas
            .filter((asignatura) => asignatura.carrera_id === selectedTutor.carrera_id)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [asignaturas, selectedTutor]);

    const asignaturasSeleccionadas = selectedTutor?.asignaturas.map((a) => a.id) ?? [];

    /* ───────── FILTRADO ───────── */
    const filteredTutores = useMemo(() => {
        const q = search.toLowerCase();
        return tutores.filter((t) => {
            const matchesSearch =
                t.nombre.toLowerCase().includes(q) ||
                t.apellido.toLowerCase().includes(q) ||
                t.documento.toLowerCase().includes(q) ||
                t.correo.toLowerCase().includes(q) ||
                (t.codigo ?? '').toLowerCase().includes(q);

            const matchesCarrera = carreraFilter === 'all' || String(t.carrera_id) === carreraFilter;

            const matchesAsignatura = asignaturaFilter === 'all' || t.asignaturas.some((a) => String(a.id) === asignaturaFilter);

            return matchesSearch && matchesCarrera && matchesAsignatura;
        });
    }, [tutores, search, carreraFilter, asignaturaFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, carreraFilter, asignaturaFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredTutores.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const paginatedTutores = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTutores.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredTutores]);

    const pageStart = filteredTutores.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredTutores.length);

    /* ───────── EDITAR ───────── */
    const openEdit = (tutor: Tutor) => {
        const clone = JSON.parse(JSON.stringify(tutor));
        clone.codigo = clone.codigo ?? '';
        clone.activo = typeof clone.activo === 'boolean' ? clone.activo : true;
        clone.asignaturas = (clone.asignaturas ?? []).filter((subject: Asignatura) => subject.carrera_id === clone.carrera_id);
        setSelectedTutor(clone);
        setEditOpen(true);
    };

    const handleFieldChange = (field: keyof Tutor, value: string | number | boolean | null) => {
        if (!selectedTutor) return;
        setSelectedTutor({ ...selectedTutor, [field]: value } as Tutor);
    };

    const handleCarreraTutorChange = (value: string) => {
        if (!selectedTutor) return;

        const carreraId = Number(value);
        const validSubjectIds = new Set(asignaturas.filter((subject) => subject.carrera_id === carreraId).map((subject) => subject.id));

        setSelectedTutor({
            ...selectedTutor,
            carrera_id: carreraId,
            asignaturas: selectedTutor.asignaturas.filter((subject) => validSubjectIds.has(subject.id)),
        });
    };

    const toggleAsignatura = (id: number) => {
        if (!selectedTutor) return;
        const exists = selectedTutor.asignaturas.some((a) => a.id === id);
        const picked = asignaturasMap.get(id);
        if (!picked) return;

        setSelectedTutor({
            ...selectedTutor,
            asignaturas: exists ? selectedTutor.asignaturas.filter((a) => a.id !== id) : [...selectedTutor.asignaturas, picked],
        });
    };

    const actualizarTutor = () => {
        if (!selectedTutor) return;

        router.post(
            `/tutores/${selectedTutor.id}`,
            {
                _method: 'put',
                _token: csrfToken(),
                ...selectedTutor,
                activo: selectedTutor.activo ? 1 : 0,
                asignaturas: selectedTutor.asignaturas.map((a) => a.id),
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Tutor actualizado correctamente');
                    setEditOpen(false);
                    setSelectedTutor(null);
                },
                onError: () => toast.error('Error al actualizar tutor'),
            },
        );
    };

    /* ───────── ELIMINAR ───────── */
    const eliminarTutor = () => {
        if (!deleteTutor) return;

        router.post(
            `/tutores/${deleteTutor.id}`,
            { _method: 'delete', _token: csrfToken() },
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Tutor eliminado correctamente');
                    setDeleteOpen(false);
                    setDeleteTutor(null);
                },
            },
        );
    };

    /* ───────── RENDER ───────── */
    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold">Gestión de Tutores</h1>
                <p className="text-muted-foreground">Consulta, edita y administra los tutores académicos</p>
            </div>

            {/* FILTROS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" /> Filtros
                    </CardTitle>
                    <CardDescription>Busca y filtra tutores</CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <Label>Buscar</Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <Select value={carreraFilter} onValueChange={setCarreraFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Carrera" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {carreras.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={asignaturaFilter} onValueChange={setAsignaturaFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {asignaturas.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)}>
                                    {a.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            setCarreraFilter('all');
                            setAsignaturaFilter('all');
                        }}
                    >
                        Limpiar
                    </Button>
                </CardContent>
            </Card>
            <div className="mb-4 flex flex-wrap gap-3">
                <AgregarTutor />
                <ImportarTutoresDialog />
                <ImportarResolucionesPeriodoDialog />
            </div>

            {/* TABLA */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tutor</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Carrera</TableHead>
                                <TableHead>Asignaturas</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedTutores.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                                <User className="text-primary h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {t.nombre} {t.apellido}
                                                </div>
                                                <div className="text-muted-foreground text-xs">{t.documento}</div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            {t.correo}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant="secondary">{t.carrera?.nombre ?? '—'}</Badge>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {t.asignaturas.slice(0, 2).map((a) => (
                                                <Badge key={a.id} variant="outline">
                                                    {a.nombre}
                                                </Badge>
                                            ))}
                                            {t.asignaturas.length > 2 && <Badge variant="outline">+{t.asignaturas.length - 2}</Badge>}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="ghost" onClick={() => router.get(`/tutores/${t.id}/perfil`)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Ver perfil</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                                                    <PencilLine className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Editar</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setDeleteTutor(t);
                                                        setDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Eliminar</TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                        Mostrando {pageStart}-{pageEnd} de {filteredTutores.length} tutores
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Anterior
                        </Button>

                        <span className="text-muted-foreground min-w-24 text-center text-sm">
                            Página {currentPage} de {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* MODAL EDITAR */}
            {/* ───────── MODAL EDITAR ───────── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Tutor</DialogTitle>
                        <DialogDescription>Actualiza los datos personales y académicos del tutor.</DialogDescription>
                    </DialogHeader>

                    {selectedTutor && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Código */}
                                <div>
                                    <Label>Código</Label>
                                    <Input value={selectedTutor.codigo || ''} onChange={(e) => handleFieldChange('codigo', e.target.value)} />
                                </div>

                                {/* Nombre */}
                                <div>
                                    <Label>Nombre</Label>
                                    <Input value={selectedTutor.nombre} onChange={(e) => handleFieldChange('nombre', e.target.value)} />
                                </div>

                                {/* Apellido */}
                                <div>
                                    <Label>Apellido</Label>
                                    <Input value={selectedTutor.apellido} onChange={(e) => handleFieldChange('apellido', e.target.value)} />
                                </div>

                                {/* Tipo documento */}
                                <div>
                                    <Label>Tipo de Documento</Label>
                                    <Select value={selectedTutor.tipo_documento} onValueChange={(v) => handleFieldChange('tipo_documento', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                            <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Documento */}
                                <div>
                                    <Label>Número de Documento</Label>
                                    <Input value={selectedTutor.documento} onChange={(e) => handleFieldChange('documento', e.target.value)} />
                                </div>

                                {/* Lugar expedición */}
                                <div>
                                    <Label>Lugar de Expedición</Label>
                                    <Input
                                        value={selectedTutor.lugar_expedicion}
                                        onChange={(e) => handleFieldChange('lugar_expedicion', e.target.value)}
                                    />
                                </div>

                                {/* Sexo */}
                                <div>
                                    <Label>Sexo</Label>
                                    <Select value={selectedTutor.sexo} onValueChange={(v) => handleFieldChange('sexo', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un sexo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M">Masculino</SelectItem>
                                            <SelectItem value="F">Femenino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Grupo priorizado */}
                                <div>
                                    <Label>Grupo Priorizado</Label>
                                    <Select value={selectedTutor.grupo_priorizado} onValueChange={(v) => handleFieldChange('grupo_priorizado', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un grupo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ninguno">Ninguno</SelectItem>
                                            <SelectItem value="discapacidad">Discapacidad</SelectItem>
                                            <SelectItem value="etnia">Grupo Étnico</SelectItem>
                                            <SelectItem value="victima">Víctima del conflicto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sede */}
                                <div>
                                    <Label>Sede</Label>
                                    <Input value={selectedTutor.sede} onChange={(e) => handleFieldChange('sede', e.target.value)} />
                                </div>

                                {/* Carrera */}
                                <div>
                                    <Label>Carrera</Label>
                                    <Select value={String(selectedTutor.carrera_id)} onValueChange={handleCarreraTutorChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona una carrera" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {carreras.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Correo */}
                                <div>
                                    <Label>Correo</Label>
                                    <Input value={selectedTutor.correo} onChange={(e) => handleFieldChange('correo', e.target.value)} />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <Label>Teléfono</Label>
                                    <Input value={selectedTutor.telefono} onChange={(e) => handleFieldChange('telefono', e.target.value)} />
                                </div>

                                {/* Activo */}
                                <div className="mt-2 flex items-center gap-2">
                                    <Checkbox checked={!!selectedTutor.activo} onCheckedChange={(v) => handleFieldChange('activo', Boolean(v))} />
                                    <span className="text-sm">Activo</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <TutorAsignaturasField
                                    asignaturas={asignaturasDisponibles}
                                    selectedIds={asignaturasSeleccionadas}
                                    onToggle={toggleAsignatura}
                                    onClear={() => setSelectedTutor({ ...selectedTutor, asignaturas: [] })}
                                    carreraNombre={carrerasMap.get(selectedTutor.carrera_id)?.nombre ?? null}
                                />
                            </div>

                            {/* Footer */}
                            <DialogFooter className="mt-6">
                                <Button variant="ghost" onClick={() => setEditOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={actualizarTutor}>Guardar Cambios</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL ELIMINAR */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Tutor</DialogTitle>
                        <DialogDescription>
                            ¿Eliminar a {deleteTutor?.nombre} {deleteTutor?.apellido}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={eliminarTutor}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TablaTutor;
