import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Usa checkboxes en lugar de `MultiSelect`
import { DialogTitle } from "@radix-ui/react-dialog";

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
}

const AgregarTutor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    grupos: "",
    asignaturas: [] as number[],
  });

  const { asignaturas = [] } = usePage().props as { asignaturas?: Asignatura[] }; // 🔹 Evita el error de undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAsignaturasChange = (id: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      asignaturas: prevForm.asignaturas.includes(id)
        ? prevForm.asignaturas.filter((asigId) => asigId !== id) // Desmarcar
        : [...prevForm.asignaturas, id], // Marcar
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/tutores", form, {
      onSuccess: () => {
        toast.success("✅ Tutor agregado correctamente");
        setIsOpen(false);
        setForm({ nombre: "", apellido: "", grupos: "", asignaturas: [] });
      },
      onError: () => {
        toast.error("❌ Hubo un error al agregar el tutor");
      },
    });
  };

  return (
    <div className="mb-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Agregar Tutor</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Tutor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
              </div>
              <div>
                <Label>Grupos</Label>
                <Input type="number" name="grupos" value={form.grupos} onChange={handleChange} required />
              </div>
              <div>
                <Label>Asignaturas</Label>
                <div className="flex flex-wrap gap-2">
                  {asignaturas.map((a) => (
                    <label key={a.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={form.asignaturas.includes(a.id)}
                        onCheckedChange={() => handleAsignaturasChange(a.id)}
                      />
                      <span>{a.nombre} ({a.codigo})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgregarTutor;
