import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
  UserPlus2,
  Upload,
  Eye,
  Trash2,
  Pencil,
  UserX2,
  MoreHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import ImportarArchivoModal from "../Asistencias/Importar";

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
}

interface Carrera {
  id: number;
  nombre: string;
}

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  carrera: Carrera;
  tipo?: string;
  tutores?: Tutor[];
  asignatura_id?: number;
}

interface Props {
  grupos?: Grupo[];
  gruposT?: Grupo[];
  tutores: Tutor[];
  onSeleccionarGrupo?: (grupo: Grupo) => void;
}

const TablaGrupo = ({ grupos = [], gruposT = [], tutores }: Props) => {
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [grupoParaImportar, setGrupoParaImportar] = useState<Grupo | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [isImportarOpen, setIsImportarOpen] = useState(false);
  const [tutorId, setTutorId] = useState<string>("");
  const [grupoEdit, setGrupoEdit] = useState<Grupo | null>(null);
  const [grupoNombre, setGrupoNombre] = useState("");
  const [grupoCodigo, setGrupoCodigo] = useState("");
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);

  const { flash = {} } = usePage().props as {
    flash?: { success?: string; error?: string };
  };

  useEffect(() => {
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
  }, [flash]);

  const handleAsignar = () => {
    if (!selectedGrupo || !tutorId) return;

    router.post(
      `/grupost/${selectedGrupo.id}/asignar-tutor`,
      { tutor_id: tutorId },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("✅ Tutor asignado correctamente");
          setIsAsignarOpen(false);
          setTutorId("");
          router.reload({ only: ["gruposT", "grupos"] });
        },
      }
    );
  };

  const handleQuitarTutor = (grupoId: number) => {
    router.post(`/grupost/${grupoId}/quitar-tutor`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("✅ Tutor eliminado del grupo");
        router.reload({ only: ["gruposT", "grupos"] });
      },
      onError: () => {
        toast.error("❌ No se pudo quitar el tutor");
      },
    });
  };

  const handleEliminarGrupo = () => {
    if (!grupoToDelete) return;

    const ruta = `/grupost/${grupoToDelete.id}`;

    router.delete(ruta, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("✅ Grupo eliminado correctamente");
        setGrupoToDelete(null);
        router.reload({ only: ["gruposT", "grupos"] });
      },
      onError: () => {
        toast.error("❌ No se pudo eliminar el grupo");
      },
    });
  };

  const handleGuardarEdicion = () => {
    if (!grupoEdit) return;

    if (
      grupoNombre === grupoEdit.nombre &&
      grupoCodigo === grupoEdit.codigo
    ) {
      toast.warning("⚠️ No se hicieron cambios");
      return;
    }

    const ruta = `/grupost/${grupoEdit.id}`;

    router.put(
      ruta,
      {
        nombre: grupoNombre,
        codigo: grupoCodigo,
        carrera_id: grupoEdit.carrera.id,
        asignatura_id: grupoEdit.asignatura_id,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("✅ Grupo actualizado correctamente");
          setGrupoEdit(null);
          router.reload({ only: ["gruposT", "grupos"] });
        },
        onError: () => {
          toast.error("❌ No se pudo editar el grupo");
        },
      }
    );
  };

  // Función para verificar si un grupo tiene tutor asignado
  const tieneTutorAsignado = (grupo: Grupo) => {
    return grupo.tutores && grupo.tutores.length > 0;
  };

  const gruposCombinados = [...grupos.map(g => ({ ...g, tipo: "Grupo" })), ...gruposT.map(g => ({ ...g, tipo: "GrupoT" }))];

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="p-6">
        <Table className="min-w-full">
          <TableCaption className="mt-4 text-sm text-muted-foreground">
            Lista de grupos registrados en el sistema
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Nombre</TableHead>
              <TableHead className="w-[15%]">Código</TableHead>
              <TableHead className="w-[25%]">Carrera</TableHead>
              <TableHead className="w-[10%]">Tipo</TableHead>
              <TableHead className="w-[20%]">Tutor Asignado</TableHead>
              <TableHead className="w-[10%] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gruposCombinados.length ? gruposCombinados.map((grupo) => (
              <TableRow key={`${grupo.tipo}-${grupo.id}`}>
                <TableCell>{grupo.nombre}</TableCell>
                <TableCell>{grupo.codigo}</TableCell>
                <TableCell>{grupo.carrera.nombre}</TableCell>
                <TableCell>{grupo.tipo}</TableCell>
                <TableCell>{grupo.tutores?.[0]?.nombre || 'No asignado'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.visit(`/grupos/${grupo.id}/asistencias`)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver asistencias
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setGrupoParaImportar(grupo); setIsImportarOpen(true); }}>
                        <Upload className="mr-2 h-4 w-4" /> Importar archivo
                      </DropdownMenuItem>
                      {/* Solo mostrar "Asignar tutor" si el grupo NO tiene tutor asignado */}
                      {!tieneTutorAsignado(grupo) && (
                        <DropdownMenuItem onClick={() => { setSelectedGrupo(grupo); setIsAsignarOpen(true); }}>
                          <UserPlus2 className="mr-2 h-4 w-4" /> Asignar tutor
                        </DropdownMenuItem>
                      )}
                      {/* Solo mostrar "Quitar tutor" si el grupo SÍ tiene tutor asignado */}
                      {tieneTutorAsignado(grupo) && (
                        <DropdownMenuItem onClick={() => handleQuitarTutor(grupo.id)}>
                          <UserX2 className="mr-2 h-4 w-4" /> Quitar tutor
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => { setGrupoEdit(grupo); setGrupoNombre(grupo.nombre); setGrupoCodigo(grupo.codigo); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar grupo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGrupoToDelete(grupo)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar grupo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No hay grupos registrados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modales */}
      <Dialog open={!!grupoEdit} onOpenChange={() => setGrupoEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre</Label>
              <input value={grupoNombre} onChange={(e) => setGrupoNombre(e.target.value)} className="col-span-3 border rounded px-2 py-1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo" className="text-right">Código</Label>
              <input value={grupoCodigo} onChange={(e) => setGrupoCodigo(e.target.value)} className="col-span-3 border rounded px-2 py-1" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGuardarEdicion}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!grupoToDelete} onOpenChange={() => setGrupoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará el grupo permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" onClick={handleEliminarGrupo}>Eliminar</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isImportarOpen} onOpenChange={setIsImportarOpen}>
        {grupoParaImportar && (
          <ImportarArchivoModal
            grupo={grupoParaImportar}
            onClose={() => setIsImportarOpen(false)}
          />
        )}
      </Dialog>

      <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Tutor</DialogTitle>
            <DialogDescription>Selecciona un tutor para el grupo <span className="font-semibold text-foreground">{selectedGrupo?.nombre}</span></DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tutor" className="text-right">Tutor</Label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutores.filter(t => !selectedGrupo?.tutores?.some(asig => asig.id === t.id)).map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.id.toString()}>{tutor.nombre} {tutor.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAsignar} disabled={!tutorId}>Asignar tutor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TablaGrupo;