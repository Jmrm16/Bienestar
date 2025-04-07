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
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  carrera: {
    id: number;
    nombre: string;
  };
}

interface Props {
  grupos: Grupo[];
  onSeleccionarGrupo: (grupo: Grupo) => void;
}

const TablaGrupo = ({ grupos, onSeleccionarGrupo }: Props) => {
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const actualizarGrupo = () => {
    if (!selectedGrupo) return;

    router.patch(`/grupos/${selectedGrupo.id}`, {
      nombre: selectedGrupo.nombre,
      codigo: selectedGrupo.codigo,
      carrera_id: selectedGrupo.carrera.id,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Grupo actualizado correctamente");
        setIsEditOpen(false);
        setSelectedGrupo(null);
      },
      onError: () => toast.error("Error al actualizar el grupo"),
    });
  };

  const eliminarGrupo = () => {
    if (!selectedGrupo) return;

    router.delete(`/grupos/${selectedGrupo.id}`, {
      onSuccess: () => {
        toast.success("Grupo eliminado correctamente");
        setIsDeleteOpen(false);
        setSelectedGrupo(null);
      },
      onError: () => toast.error("Error al eliminar el grupo"),
    });
  };

  return (
    <div className="border rounded-xl p-4">
      <Table>
        <TableCaption>Lista de grupos.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Carrera</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos?.map((grupo) => (
            <TableRow key={grupo.id}>
              <TableCell>{grupo.nombre}</TableCell>
              <TableCell>{grupo.codigo}</TableCell>
              <TableCell>{grupo.carrera?.nombre}</TableCell>
              <TableCell className="text-right space-x-2">
                {/* Ver */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedGrupo(grupo);
                        onSeleccionarGrupo(grupo); // <- Notificamos al padre
                      }}
                    >
                      <Eye />
                    </Button>
                  </DialogTrigger>
                  {selectedGrupo?.id === grupo.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalles del Grupo</DialogTitle>
                        <DialogDescription asChild>
                          <div>
                            <p><strong>Nombre:</strong> {selectedGrupo.nombre}</p>
                            <p><strong>Código:</strong> {selectedGrupo.codigo}</p>
                            <p><strong>Carrera:</strong> {selectedGrupo.carrera.nombre}</p>
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
                        setSelectedGrupo(grupo);
                        setIsEditOpen(true);
                      }}
                    >
                      <PencilLine />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Grupo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Nombre</Label>
                      <Input
                        value={selectedGrupo?.nombre || ""}
                        onChange={(e) =>
                          setSelectedGrupo({ ...selectedGrupo!, nombre: e.target.value })
                        }
                      />
                      <Label>Código</Label>
                      <Input
                        value={selectedGrupo?.codigo || ""}
                        onChange={(e) =>
                          setSelectedGrupo({ ...selectedGrupo!, codigo: e.target.value })
                        }
                      />
                      <DialogFooter>
                        <Button onClick={actualizarGrupo}>Guardar Cambios</Button>
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
                        setSelectedGrupo(grupo);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Delete />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar Grupo</DialogTitle>
                      <DialogDescription>
                        ¿Estás seguro de que deseas eliminar el grupo{" "}
                        <strong>{selectedGrupo?.nombre}</strong>?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={eliminarGrupo}>
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

export default TablaGrupo;
