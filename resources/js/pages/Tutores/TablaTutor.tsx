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
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
  docente: string;
}

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
  grupos: number;
  asignaturas: Asignatura[];
}

const TablaTutor = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { tutores, asignaturas } = usePage().props as {
    tutores?: Tutor[];
    asignaturas?: Asignatura[];
  };
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [deleteTutor, setDeleteTutor] = useState<Tutor | null>(null);

  const handleCheckboxChange = (asignaturaId: number) => {
    if (!selectedTutor) return;

    const isSelected = selectedTutor.asignaturas.some((a) => a.id === asignaturaId);
    const updatedAsignaturas = isSelected
      ? selectedTutor.asignaturas.filter((a) => a.id !== asignaturaId)
      : [...selectedTutor.asignaturas, asignaturas!.find((a) => a.id === asignaturaId)!];

    setSelectedTutor({ ...selectedTutor, asignaturas: updatedAsignaturas });
  };

  const actualizarTutor = () => {
    if (!selectedTutor) return;

    const payload = {
      nombre: selectedTutor.nombre,
      apellido: selectedTutor.apellido,
      grupos: selectedTutor.grupos,
      asignaturas: selectedTutor.asignaturas.map((a) => a.id),
    };

    router.patch(`/tutores/${selectedTutor.id}`, payload, {
      onSuccess: () => {
        toast.success("Tutor actualizado correctamente");
        setIsEditOpen(false);
      },
      onError: () => toast.error("Error al actualizar el tutor"),
    });
  };

  const eliminarTutor = () => {
    if (!deleteTutor) return;

    router.delete(`/tutores/${deleteTutor.id}`, {
      onSuccess: () => {
        toast.success("Tutor eliminado correctamente");
        setIsDeleteOpen(false);
        setDeleteTutor(null);
      },
      onError: () => toast.error("Error al eliminar el tutor"),
    });
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <Table>
        <TableCaption>Lista de tutores.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Grupos</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutores?.map((tutor) => (
            <TableRow key={tutor.id}>
              <TableCell>{tutor.nombre}</TableCell>
              <TableCell>{tutor.apellido}</TableCell>
              <TableCell>{tutor.grupos}</TableCell>
              <TableCell className="text-right space-x-2">

{/* Ver Detalles */}
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" onClick={() => setSelectedTutor(tutor)}>
      <Eye />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Detalles del Tutor</DialogTitle>

      {/* 👇 Esto corrige el error de estructura anidada */}
      <DialogDescription asChild>
        <div className="space-y-2 mt-2">
          <p><strong>Nombre:</strong> {selectedTutor?.nombre}</p>
          <p><strong>Apellido:</strong> {selectedTutor?.apellido}</p>
          <p><strong>Grupos:</strong> {selectedTutor?.grupos}</p>
          <div>
            <strong>Asignaturas:</strong>
            <ul className="list-disc ml-5 mt-1">
              {selectedTutor?.asignaturas?.length ? (
                selectedTutor.asignaturas.map((asig) => (
                  <li key={asig.id}>
                    {asig.nombre} ({asig.codigo}) - {asig.docente}
                  </li>
                ))
              ) : (
                <li>No tiene asignaturas asignadas</li>
              )}
            </ul>
          </div>
        </div>
      </DialogDescription>

    </DialogHeader>
  </DialogContent>
</Dialog>

                {/* Editar Tutor */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setIsEditOpen(true);
                      }}
                    >
                      <PencilLine />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Tutor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Nombre</Label>
                      <Input
                        value={selectedTutor?.nombre || ""}
                        onChange={(e) =>
                          setSelectedTutor({
                            ...selectedTutor!,
                            nombre: e.target.value,
                          })
                        }
                      />
                      <Label>Apellido</Label>
                      <Input
                        value={selectedTutor?.apellido || ""}
                        onChange={(e) =>
                          setSelectedTutor({
                            ...selectedTutor!,
                            apellido: e.target.value,
                          })
                        }
                      />
                      <Label>Grupos</Label>
                      <Input
                        type="number"
                        value={selectedTutor?.grupos || ""}
                        onChange={(e) =>
                          setSelectedTutor({
                            ...selectedTutor!,
                            grupos: parseInt(e.target.value),
                          })
                        }
                      />

                      {/* Checkboxes de Asignaturas */}
                      <div className="mt-4">
                        <Label>Asignaturas</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {asignaturas?.map((asig) => (
                            <div key={asig.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedTutor?.asignaturas.some((a) => a.id === asig.id)}
                                onCheckedChange={() => handleCheckboxChange(asig.id)}
                              />
                              <span>{asig.nombre} ({asig.codigo})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button onClick={actualizarTutor}>Guardar Cambios</Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Eliminar Tutor */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteTutor(tutor);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Delete />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar Tutor</DialogTitle>
                      <DialogDescription>
                        ¿Estás seguro de que deseas eliminar a{" "}
                        <strong>
                          {deleteTutor?.nombre} {deleteTutor?.apellido}
                        </strong>
                        ?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={eliminarTutor}>
                        Eliminar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsDeleteOpen(false);
                          setDeleteTutor(null);
                        }}
                      >
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

export default TablaTutor;
