import { useState } from "react";
import { Delete, PencilLine, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
  docente: string;
}

const TablaAsignatura = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { asignaturas } = usePage().props as { asignaturas?: Asignatura[] };

  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);
  const [deleteAsignatura, setDeleteAsignatura] = useState<Asignatura | null>(null);

  const eliminarAsignatura = () => {
    if (!deleteAsignatura) return;

    router.delete(`/asignaturas/${deleteAsignatura.id}`, {
      onSuccess: () => {
        toast.success("Asignatura eliminada correctamente");
        setIsDeleteOpen(false);
      },
      onError: () => toast.error("Error al eliminar la asignatura"),
    });
  };

  const actualizarAsignatura = () => {
    if (!selectedAsignatura) return;

    const payload = {
      nombre: selectedAsignatura.nombre,
      codigo: selectedAsignatura.codigo,
      docente: selectedAsignatura.docente,
    };

    router.patch(`/asignaturas/${selectedAsignatura.id}`, payload, {
      onSuccess: () => {
        toast.success("Asignatura actualizada correctamente");
        setIsEditOpen(false);
      },
      onError: () => toast.error("Error al actualizar la asignatura"),
    });
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <Table>
        <TableCaption>Lista de asignaturas.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Docente</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asignaturas?.map((asignatura) => (
            <TableRow key={asignatura.id}>
              <TableCell>{asignatura.nombre}</TableCell>
              <TableCell>{asignatura.codigo}</TableCell>
              <TableCell>{asignatura.docente}</TableCell>
              <TableCell className="text-right space-x-2">
                {/* Modal Ver */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedAsignatura(asignatura)}
                    >
                      <Eye />
                    </Button>
                  </DialogTrigger>
                  {selectedAsignatura && selectedAsignatura.id === asignatura.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalles de la Asignatura</DialogTitle>
                        <DialogDescription asChild>
                          <div className="space-y-2">
                            <p><strong>Nombre:</strong> {selectedAsignatura.nombre}</p>
                            <p><strong>Código:</strong> {selectedAsignatura.codigo}</p>
                            <p><strong>Docente:</strong> {selectedAsignatura.docente}</p>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  )}
                </Dialog>

                {/* Modal Editar */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedAsignatura(asignatura);
                        setIsEditOpen(true);
                      }}
                    >
                      <PencilLine />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Asignatura</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Nombre</Label>
                      <Input
                        value={selectedAsignatura?.nombre || ""}
                        onChange={(e) =>
                          setSelectedAsignatura({ ...selectedAsignatura!, nombre: e.target.value })
                        }
                      />
                      <Label>Código</Label>
                      <Input
                        value={selectedAsignatura?.codigo || ""}
                        onChange={(e) =>
                          setSelectedAsignatura({ ...selectedAsignatura!, codigo: e.target.value })
                        }
                      />
                      <Label>Docente</Label>
                      <Input
                        value={selectedAsignatura?.docente || ""}
                        onChange={(e) =>
                          setSelectedAsignatura({ ...selectedAsignatura!, docente: e.target.value })
                        }
                      />
                      <DialogFooter>
                        <Button onClick={actualizarAsignatura}>Guardar Cambios</Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Modal Confirmación de Eliminación */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteAsignatura(asignatura);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Delete />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar Asignatura</DialogTitle>
                      <DialogDescription asChild>
                        <div>
                          ¿Estás seguro de que deseas eliminar{" "}
                          <strong>{deleteAsignatura?.nombre}</strong>?
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={eliminarAsignatura}>
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

export default TablaAsignatura;
