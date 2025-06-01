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
  tipo_identificacion: string;
  identificacion: string;
  ide_programa: string;
  programa: string;
  semestre: string;
  ide_materia: string;
  materia: string;
  grupo: string;
  primer_corte: string;
  segundo_corte: string;
  tercer_corte: string;
  definitiva: string;
  habilitacion: string;
  final: string;
  anio: string;
  periodo: string;
  correo_institucional: string;
  email: string;
  celular: string;
  nota_faltante: string;
};

export const columnsEstudiantes: ColumnDef<Estudiante>[] = [
  { accessorKey: "codigo", header: "Código" },
  { accessorKey: "nombres", header: "Nombres" },
  { accessorKey: "apellidos", header: "Apellidos" },
  { accessorKey: "tipo_identificacion", header: "Tipo Identificación" },
  { accessorKey: "identificacion", header: "Identificación" },
  { accessorKey: "ide_programa", header: "IDE Programa" },
  { accessorKey: "programa", header: "Programa" },
  { accessorKey: "semestre", header: "Semestre" },
  { accessorKey: "ide_materia", header: "IDE Materia" },
  { accessorKey: "materia", header: "Materia" },
  { accessorKey: "grupo", header: "Grupo" },
  { accessorKey: "primer_corte", header: "1er Corte" },
  { accessorKey: "segundo_corte", header: "2do Corte" },
  { accessorKey: "tercer_corte", header: "3er Corte" },
  { accessorKey: "definitiva", header: "Definitiva" },
  { accessorKey: "anio", header: "Año" },
  { accessorKey: "periodo", header: "Periodo" },
  { accessorKey: "correo_institucional", header: "Correo Institucional" },
  { accessorKey: "celular", header: "Celular" },
  { accessorKey: "nota_faltante", header: "Nota Faltante" },
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
          { ...selectedEstudiante },
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
          onSuccess: () => toast.success("Estudiante eliminado"),
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
                  <DialogDescription className="space-y-1 max-h-[300px] overflow-y-auto">
                    {Object.entries(estudiante).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong> {value || '—'}
                      </p>
                    ))}
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
                    value={selectedEstudiante.nombres || ''}
                    onChange={(e) =>
                      setSelectedEstudiante({ ...selectedEstudiante, nombres: e.target.value })
                    }
                  />
                  <Label>Apellidos</Label>
                  <Input
                    value={selectedEstudiante.apellidos || ''}
                    onChange={(e) =>
                      setSelectedEstudiante({ ...selectedEstudiante, apellidos: e.target.value })
                    }
                  />
                  <Label>Identificación</Label>
                  <Input
                    value={selectedEstudiante.identificacion || ''}
                    onChange={(e) =>
                      setSelectedEstudiante({ ...selectedEstudiante, identificacion: e.target.value })
                    }
                  />
                  <Label>Correo Institucional</Label>
                  <Input
                    value={selectedEstudiante.correo_institucional || ''}
                    onChange={(e) =>
                      setSelectedEstudiante({ ...selectedEstudiante, correo_institucional: e.target.value })
                    }
                  />
                  {/* Puedes agregar aquí más campos al modal si los necesitas */}
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
