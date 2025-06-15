import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePage, router } from "@inertiajs/react";
import { PageProps as InertiaPageProps } from "@inertiajs/core";
import { toast } from "sonner";

interface PageProps extends InertiaPageProps {
  asignatura: {
    id: number;
    nombre: string;
    carrera: {
      id: number;
      nombre: string;
    };
  };
  errors?: Record<string, string>;
}

const AgregarGrupo = () => {
  const { asignatura, errors = {} } = usePage<PageProps>().props;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    carrera_id: asignatura.carrera.id.toString(),
    asignatura_id: asignatura.id.toString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    router.post("/grupost", form, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Grupo agregado correctamente");
        setForm({
          nombre: "",
          codigo: "",
          carrera_id: asignatura.carrera.id.toString(),
          asignatura_id: asignatura.id.toString(),
        });
        setOpen(false);
      },
      onError: () => {
        toast.error("Error al agregar el grupo");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-500 hover:bg-pink-600">Agregar Grupo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Agregar nuevo grupo</DialogTitle>
          <DialogDescription>Llena la información para crear un nuevo grupo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} />
            {errors?.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" value={form.codigo} onChange={handleChange} />
            {errors?.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo}</p>}
          </div>

          <DialogFooter>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgregarGrupo;
