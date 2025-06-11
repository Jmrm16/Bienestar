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
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { UserPlus2, Upload, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImportarArchivoModal from "../Asistencias/Importar"; // solo el contenido del modal, no incluye trigger

interface Tutor {
  id: number;
  nombre: string;
  apellido: string;
}

interface Carrera {
  id: number;
  nombre: string;
}

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  carrera: Carrera;
  tipo?: string;
}

interface Props {
  grupos?: Grupo[];
  gruposT?: Grupo[];
  tutores: Tutor[];
  onSeleccionarGrupo?: (grupo: Grupo) => void;
}

const TablaGrupo = ({ grupos = [], gruposT = [], tutores, onSeleccionarGrupo }: Props) => {
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [grupoParaImportar, setGrupoParaImportar] = useState<Grupo | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [isImportarOpen, setIsImportarOpen] = useState(false);
  const [tutorId, setTutorId] = useState<string>("");

  const handleAsignar = () => {
    if (!selectedGrupo || !tutorId) return;
    router.post(`/grupost/${selectedGrupo.id}/asignar-tutor`, { tutor_id: tutorId }, {
      onSuccess: () => {
        toast.success("✅ Tutor asignado correctamente");
        setTutorId("");
        setIsAsignarOpen(false);
      },
      onError: () => toast.error("❌ Error al asignar el tutor"),
    });
  };

  const listaGrupos = [
    ...grupos.map((g) => ({ ...g, tipo: "Grupo" })),
    ...gruposT.map((g) => ({ ...g, tipo: "GrupoT" })),
  ];

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="p-6">
        <Table className="min-w-full">
          <TableCaption className="mt-4 text-sm text-muted-foreground">
            Lista de grupos registrados en el sistema
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Nombre</TableHead>
              <TableHead className="w-[15%]">Código</TableHead>
              <TableHead className="w-[30%]">Carrera</TableHead>
              <TableHead className="w-[10%]">Tipo</TableHead>
              <TableHead className="w-[20%] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaGrupos.length > 0 ? (
              listaGrupos.map((grupo) => (
                <TableRow key={`${grupo.tipo}-${grupo.id}`} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{grupo.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{grupo.codigo}</TableCell>
                  <TableCell>{grupo.carrera.nombre}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      grupo.tipo === "Grupo" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}>
                      {grupo.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2 flex justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setGrupoParaImportar(grupo);
                              setIsImportarOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Importar archivo</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.visit(`/grupos/${grupo.id}/asistencias`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver asistencias</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedGrupo(grupo);
                              setIsAsignarOpen(true);
                            }}
                          >
                            <UserPlus2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Asignar tutor</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No hay grupos registrados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para Asignar tutor */}
      <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Tutor</DialogTitle>
            <DialogDescription>
              Selecciona un tutor para el grupo{" "}
              <span className="font-semibold text-foreground">{selectedGrupo?.nombre}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tutor" className="text-right">Tutor</Label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutores.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id.toString()}>
                      {tutor.nombre} {tutor.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAsignar} disabled={!tutorId}>
              Asignar tutor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para importar archivo Excel */}
<Dialog open={isImportarOpen} onOpenChange={setIsImportarOpen}>
  {grupoParaImportar && (
    <ImportarArchivoModal
      grupo={grupoParaImportar}
      onClose={() => setIsImportarOpen(false)} // ← cierra el modal
    />
  )}
</Dialog>

    </div>
  );
};

export default TablaGrupo;
