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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { router, Link } from "@inertiajs/react";
import { toast } from "sonner";

// Tipos
interface Carrera {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  nombre: string;
  carrera_id: number;
  carrera?: Carrera;
}

export default function TablaAsignatura({
  asignaturas,
  carreras,
}: {
  asignaturas: Asignatura[];
  carreras: Carrera[];
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedAsignatura, setSelectedAsignatura] =
    useState<Asignatura | null>(null);

  const [deleteAsignatura, setDeleteAsignatura] =
    useState<Asignatura | null>(null);

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
      carrera_id: selectedAsignatura.carrera_id,
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
            <TableHead>Carrera</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {asignaturas.map((asignatura) => (
            <TableRow key={asignatura.id}>
              <TableCell>{asignatura.nombre}</TableCell>

              <TableCell>
                {asignatura.carrera?.nombre ??
                  carreras.find((c) => c.id === asignatura.carrera_id)?.nombre ??
                  "Sin carrera"}
              </TableCell>

              <TableCell className="text-right space-x-2">
                {/* Ver Detalles */}
                <Link href={`/asignaturas/${asignatura.id}`}>
                  <Button variant="ghost">
                    <Eye />
                  </Button>
                </Link>

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
                      {/* Nombre */}
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={selectedAsignatura?.nombre || ""}
                          onChange={(e) =>
                            setSelectedAsignatura({
                              ...selectedAsignatura!,
                              nombre: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Carrera */}
                      <div>
                        <Label>Carrera</Label>
                        <Select
                          value={
                            selectedAsignatura?.carrera_id
                              ? String(selectedAsignatura.carrera_id)
                              : ""
                          }
                          onValueChange={(v) =>
                            setSelectedAsignatura({
                              ...selectedAsignatura!,
                              carrera_id: parseInt(v),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una carrera" />
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

                      <DialogFooter>
                        <Button onClick={actualizarAsignatura}>
                          Guardar Cambios
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Modal Eliminar */}
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
                      <DialogDescription>
                        ¿Está seguro de eliminar{" "}
                        <strong>{deleteAsignatura?.nombre}</strong>?
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <Button variant="destructive" onClick={eliminarAsignatura}>
                        Eliminar
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => setIsDeleteOpen(false)}
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
}
