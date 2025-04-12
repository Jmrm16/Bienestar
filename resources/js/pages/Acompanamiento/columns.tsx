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
import { Eye, PencilLine } from "lucide-react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export type Carrera = {
  id: number;
  nombre: string;
  codigo: string;
};

export const columns: ColumnDef<Carrera>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    id: "actions",
    header: () => <div className="text-center w-full">Acciones</div>,
    size: 140,
    cell: ({ row }) => {
      const carrera = row.original;
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [selectedCarrera, setSelectedCarrera] = useState<Carrera>(carrera);
      const [isViewOpen, setIsViewOpen] = useState(false);

      const actualizarCarrera = () => {
        router.patch(
          `/acompañamientos/${selectedCarrera.id}`,
          {
            nombre: selectedCarrera.nombre,
            codigo: selectedCarrera.codigo,
          },
          {
            preserveScroll: true,
            onSuccess: () => {
              toast.success("Carrera actualizada correctamente");
              setIsEditOpen(false);
            },
            onError: () => toast.error("Error al actualizar la carrera"),
          }
        );
      };

      const eliminarCarrera = () => {
        router.delete(`/acompañamientos/${carrera.id}`, {
          onSuccess: () => toast.success("Carrera eliminada"),
          onError: () => toast.error("Error al eliminar la carrera"),
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
                  <DialogTitle>Detalles de la Carrera</DialogTitle>
                  <DialogDescription>
                    <p><strong>Nombre:</strong> {carrera.nombre}</p>
                    <p><strong>Código:</strong> {carrera.codigo}</p>
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
                  <DialogTitle>Editar Carrera</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label>Nombre</Label>
                  <Input
                    value={selectedCarrera.nombre}
                    onChange={(e) =>
                      setSelectedCarrera({
                        ...selectedCarrera,
                        nombre: e.target.value,
                      })
                    }
                  />
                  <Label>Código</Label>
                  <Input
                    value={selectedCarrera.codigo}
                    onChange={(e) =>
                      setSelectedCarrera({
                        ...selectedCarrera,
                        codigo: e.target.value,
                      })
                    }
                  />
                  <div className="flex justify-end">
                    <Button onClick={actualizarCarrera}>Guardar Cambios</Button>
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
                  <AlertDialogTitle>¿Eliminar Carrera?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará la carrera{" "}
                    <strong>{carrera.nombre}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={eliminarCarrera}
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
