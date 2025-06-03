import { useState, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  tipo_documento: string;
  documento: string;
  lugar_expedicion: string;
  sexo: string;
  grupo_priorizado: string;
  sede: string;
  programa_academico: string;
  correo: string;
  telefono: string;
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

  const asignaturasMap = useMemo(() => {
    const map = new Map<number, Asignatura>();
    asignaturas?.forEach((a) => map.set(a.id, a));
    return map;
  }, [asignaturas]);

  const handleCheckboxChange = (asignaturaId: number) => {
    if (!selectedTutor) return;

    const isSelected = selectedTutor.asignaturas.some((a) => a.id === asignaturaId);
    const updatedAsignaturas = isSelected
      ? selectedTutor.asignaturas.filter((a) => a.id !== asignaturaId)
      : [...selectedTutor.asignaturas, asignaturasMap.get(asignaturaId)!];

    setSelectedTutor({ ...selectedTutor, asignaturas: updatedAsignaturas });
  };

  const handleFieldChange = (field: keyof Tutor, value: string) => {
    if (!selectedTutor) return;
    setSelectedTutor({ ...selectedTutor, [field]: value });
  };

  const actualizarTutor = () => {
    if (!selectedTutor) return;

    const payload = {
      nombre: selectedTutor.nombre,
      apellido: selectedTutor.apellido,
      tipo_documento: selectedTutor.tipo_documento,
      documento: selectedTutor.documento,
      lugar_expedicion: selectedTutor.lugar_expedicion,
      sexo: selectedTutor.sexo,
      grupo_priorizado: selectedTutor.grupo_priorizado,
      sede: selectedTutor.sede,
      programa_academico: selectedTutor.programa_academico,
      correo: selectedTutor.correo,
      telefono: selectedTutor.telefono,
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
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutores?.map((tutor) => (
            <TableRow key={tutor.id}>
              <TableCell>{tutor.nombre}</TableCell>
              <TableCell>{tutor.apellido}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" onClick={() => router.get(`/tutores/${tutor.id}/perfil`)}>
                  <Eye />
                </Button>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input value={selectedTutor?.nombre || ""} onChange={(e) => handleFieldChange("nombre", e.target.value)} />
                      </div>
                      <div>
                        <Label>Apellido</Label>
                        <Input value={selectedTutor?.apellido || ""} onChange={(e) => handleFieldChange("apellido", e.target.value)} />
                      </div>
                      <div>
                        <Label>Tipo de Documento</Label>
                        <Select value={selectedTutor?.tipo_documento} onValueChange={(value) => handleFieldChange("tipo_documento", value)}>
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
                      <div>
                        <Label>Número de Documento</Label>
                        <Input value={selectedTutor?.documento || ""} onChange={(e) => handleFieldChange("documento", e.target.value)} />
                      </div>
                      <div>
                        <Label>Lugar de Expedición</Label>
                        <Input value={selectedTutor?.lugar_expedicion || ""} onChange={(e) => handleFieldChange("lugar_expedicion", e.target.value)} />
                      </div>
                      <div>
                        <Label>Sexo</Label>
                        <Select value={selectedTutor?.sexo} onValueChange={(value) => handleFieldChange("sexo", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Grupo Priorizado</Label>
                        <Select value={selectedTutor?.grupo_priorizado} onValueChange={(value) => handleFieldChange("grupo_priorizado", value)}>
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
                      <div>
                        <Label>Sede</Label>
                        <Input value={selectedTutor?.sede || ""} onChange={(e) => handleFieldChange("sede", e.target.value)} />
                      </div>
                      <div>
                        <Label>Programa Académico</Label>
                        <Input value={selectedTutor?.programa_academico || ""} onChange={(e) => handleFieldChange("programa_academico", e.target.value)} />
                      </div>
                      <div>
                        <Label>Correo</Label>
                        <Input value={selectedTutor?.correo || ""} onChange={(e) => handleFieldChange("correo", e.target.value)} />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input value={selectedTutor?.telefono || ""} onChange={(e) => handleFieldChange("telefono", e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Asignaturas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {asignaturas?.map((asig) => (
                          <div key={asig.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedTutor?.asignaturas.some((a) => a.id === asig.id)}
                              onCheckedChange={() => handleCheckboxChange(asig.id)}
                            />
                            <div className="flex flex-col text-sm">
                              <span className="font-medium">{asig.nombre}</span>
                              <span className="text-muted-foreground text-xs">{asig.codigo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button onClick={actualizarTutor}>Guardar Cambios</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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

export default TablaTutor;
