import { ColumnDef } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, PencilLine, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export type Estudiante = {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo_institucional: string;
};

export const columnsEstudiantes: ColumnDef<Estudiante>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue() as string}</div>
    ),
  },
  {
    accessorKey: "nombres",
    header: "Nombres",
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue() as string}</div>
    ),
  },
  {
    accessorKey: "apellidos",
    header: "Apellidos",
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue() as string}</div>
    ),
  },
  {
    accessorKey: "identificacion",
    header: "Identificación",
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue() as string}</div>
    ),
  },
  {
    accessorKey: "correo_institucional",
    header: "Correo",
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue() as string}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center w-full text-sm">Acciones</div>,
    size: 140,
    cell: ({ row }) => {
      const estudiante = row.original;
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [isViewOpen, setIsViewOpen] = useState(false);
      const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante>(estudiante);

      const actualizarEstudiante = () => {
        router.patch(
          `/acompanamiento-estudiantes/${selectedEstudiante.id}`,
          {
            ...selectedEstudiante,
          },
          {
            preserveScroll: true,
            onSuccess: () => {
              toast.success("Estudiante actualizado correctamente");
              setIsEditOpen(false);
            },
            onError: () => toast.error("Error al actualizar el estudiante"),
          }
        );
      };

      const eliminarEstudiante = () => {
        router.delete(`/acompanamiento-estudiantes/${estudiante.id}`, {
          onSuccess: () => {
            toast.success("Estudiante eliminado");
          },
          onError: () => toast.error("Error al eliminar el estudiante"),
        });
      };

      return (
        <TooltipProvider>
          <div className="flex justify-center items-center gap-2 w-full">
            {/* Ver */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver detalles</p>
                </TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Detalles del Estudiante</DialogTitle>
                  <DialogDescription className="space-y-1">
                    <p><strong>Código:</strong> {estudiante.codigo}</p>
                    <p><strong>Nombres:</strong> {estudiante.nombres}</p>
                    <p><strong>Apellidos:</strong> {estudiante.apellidos}</p>
                    <p><strong>Identificación:</strong> {estudiante.identificacion}</p>
                    <p><strong>Correo:</strong> {estudiante.correo_institucional}</p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            {/* Editar */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <PencilLine className="w-4 h-4 text-blue-500" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar</p>
                </TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Estudiante</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label>Nombres</Label>
                  <Input
                    value={selectedEstudiante.nombres}
                    onChange={(e) =>
                      setSelectedEstudiante({
                        ...selectedEstudiante,
                        nombres: e.target.value,
                      })
                    }
                  />
                  <Label>Apellidos</Label>
                  <Input
                    value={selectedEstudiante.apellidos}
                    onChange={(e) =>
                      setSelectedEstudiante({
                        ...selectedEstudiante,
                        apellidos: e.target.value,
                      })
                    }
                  />
                  <Label>Identificación</Label>
                  <Input
                    value={selectedEstudiante.identificacion}
                    onChange={(e) =>
                      setSelectedEstudiante({
                        ...selectedEstudiante,
                        identificacion: e.target.value,
                      })
                    }
                  />
                  <Label>Correo</Label>
                  <Input
                    value={selectedEstudiante.correo_institucional}
                    onChange={(e) =>
                      setSelectedEstudiante({
                        ...selectedEstudiante,
                        correo_institucional: e.target.value,
                      })
                    }
                  />
                  <div className="flex justify-end">
                    <Button onClick={actualizarEstudiante}>Guardar Cambios</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Eliminar */}
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Delete className="w-4 h-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar Estudiante?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará al estudiante{" "}
                    <strong>{estudiante.nombres} {estudiante.apellidos}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={eliminarEstudiante}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      );
    },
  },
];
