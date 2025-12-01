import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface Carrera {
  id: number;
  nombre: string;
}

/** RECIBE carreras COMO PROP */
export default function AgregarAsignatura({ carreras }: { carreras: Carrera[] }) {

  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    carrera_id: "",
  });

  const resetForm = () => {
    setForm({
      nombre: "",
      carrera_id: "",
    });
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!form.carrera_id) {
      toast.error("Debe seleccionar una carrera");
      return;
    }

    router.post(
      "/asignaturas",
      { 
        nombre: form.nombre.trim(),
        carrera_id: Number(form.carrera_id)
      },
      {
        onSuccess: () => {
          toast.success("Asignatura registrada exitosamente");
          resetForm();
          setIsOpen(false);
        },
        onError: (errors) => {
          const first = errors && Object.values(errors)[0];
          toast.error(first || "Error al guardar asignatura");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Agregar Asignatura</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Asignatura</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre de la asignatura"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          {/* Carrera */}
          <div>
            <Label htmlFor="carrera">Carrera</Label>
            <Select
              value={form.carrera_id}
              onValueChange={(value) =>
                setForm({ ...form, carrera_id: value })
              }
            >
              <SelectTrigger id="carrera">
                <SelectValue placeholder="Seleccione una carrera" />
              </SelectTrigger>

              <SelectContent>
                {carreras.map((carrera) => (
                  <SelectItem
                    key={carrera.id}
                    value={String(carrera.id)}
                  >
                    {carrera.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
