import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilLine, Delete, Eye } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

interface Carrera {
  id: number;
  nombre: string;
  codigo: string;
}

const TablaCarrera = () => {
  const { carreras } = usePage().props as { carreras?: Carrera[] };

  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const actualizarCarrera = () => {
    if (!selectedCarrera) return;

    router.patch(`/carreras/${selectedCarrera.id}`, {
      nombre: selectedCarrera.nombre,
      codigo: selectedCarrera.codigo,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Carrera actualizada correctamente");
        setIsEditOpen(false);
        setSelectedCarrera(null);
      },
      onError: () => toast.error("Error al actualizar la carrera"),
    });
  };

  const eliminarCarrera = () => {
    if (!selectedCarrera) return;

    router.delete(`/carreras/${selectedCarrera.id}`, {
      onSuccess: () => {
        toast.success("Carrera eliminada correctamente");
        setIsDeleteOpen(false);
        setSelectedCarrera(null);
      },
      onError: () => toast.error("Error al eliminar la carrera"),
    });
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <Table>
        <TableCaption>Lista de carreras.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carreras?.map((carrera) => (
            <TableRow key={carrera.id}>
              <TableCell>{carrera.nombre}</TableCell>
              <TableCell>{carrera.codigo}</TableCell>
              <TableCell className="text-right space-x-2">
                {/* Ver */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" onClick={() => setSelectedCarrera(carrera)}>
                      <Eye />
                    </Button>
                  </DialogTrigger>
                  {selectedCarrera?.id === carrera.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalles de la Carrera</DialogTitle>
                        <DialogDescription asChild>
                          <div>
                            <p><strong>Nombre:</strong> {selectedCarrera.nombre}</p>
                            <p><strong>Código:</strong> {selectedCarrera.codigo}</p>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  )}
                </Dialog>

                {/* Editar */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedCarrera(carrera);
                        setIsEditOpen(true);
                      }}
                    >
                      <PencilLine />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Carrera</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Nombre</Label>
                      <Input
                        value={selectedCarrera?.nombre || ""}
                        onChange={(e) =>
                          setSelectedCarrera({ ...selectedCarrera!, nombre: e.target.value })
                        }
                      />
                      <Label>Código</Label>
                      <Input
                        value={selectedCarrera?.codigo || ""}
                        onChange={(e) =>
                          setSelectedCarrera({ ...selectedCarrera!, codigo: e.target.value })
                        }
                      />
                      <DialogFooter>
                        <Button onClick={actualizarCarrera}>Guardar Cambios</Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Eliminar */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedCarrera(carrera);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Delete />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar Carrera</DialogTitle>
                      <DialogDescription>
                        ¿Estás seguro de que deseas eliminar la carrera{" "}
                        <strong>{selectedCarrera?.nombre}</strong>?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={eliminarCarrera}>
                        Eliminar
                      </Button>
                      <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                        Cancelar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TablaCarrera;
