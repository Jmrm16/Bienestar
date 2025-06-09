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
  Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilLine, Delete, Eye, Upload, UserPlus2 } from "lucide-react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
}

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  carrera: {
    id: number;
    nombre: string;
  };
  tipo?: string;
}

interface Props {
  grupos?: Grupo[];
  gruposT?: Grupo[];
  tutores: Tutor[];
  onSeleccionarGrupo: (grupo: Grupo) => void;
}

const TablaGrupo = ({ grupos = [], gruposT = [], tutores, onSeleccionarGrupo }: Props) => {
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [tutorId, setTutorId] = useState<string>("");

  const handleAsignar = () => {
    if (!selectedGrupo || !tutorId) return;

    router.post(`/grupost/${selectedGrupo.id}/asignar-tutor`, { tutor_id: tutorId }, {
      onSuccess: () => {
        toast.success("Tutor asignado correctamente");
        setTutorId("");
        setIsAsignarOpen(false);
      },
      onError: () => toast.error("Error al asignar el tutor"),
    });
  };

  const listaGrupos = [
    ...grupos.map((g) => ({ ...g, tipo: 'Grupo' })),
    ...gruposT.map((g) => ({ ...g, tipo: 'GrupoT' })),
  ];

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <Table>
        <TableCaption>Lista de grupos.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Carrera</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listaGrupos.map((grupo) => (
            <TableRow key={`${grupo.tipo}-${grupo.id}`}>
              <TableCell>{grupo.nombre}</TableCell>
              <TableCell>{grupo.codigo}</TableCell>
              <TableCell>{grupo.carrera.nombre}</TableCell>
              <TableCell>{grupo.tipo}</TableCell>
              <TableCell className="text-right space-x-2">

                {/* Botón asignar tutor */}
                <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedGrupo(grupo);
                        setIsAsignarOpen(true);
                      }}
                    >
                      <UserPlus2 />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Tutor</DialogTitle>
                      <DialogDescription>
                        Selecciona un tutor para el grupo{" "}
                        <strong>{selectedGrupo?.nombre}</strong>
                      </DialogDescription>
                    </DialogHeader>
                    <select
                      className="w-full border rounded px-3 py-2 mt-2"
                      value={tutorId}
                      onChange={(e) => setTutorId(e.target.value)}
                    >
                      <option value="">Selecciona un tutor</option>
                      {tutores.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} {t.apellido}
                        </option>
                      ))}
                    </select>
                    <DialogFooter>
                      <Button onClick={handleAsignar}>Asignar</Button>
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
