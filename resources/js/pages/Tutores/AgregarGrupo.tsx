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

interface Carrera {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  nombre: string;
}

interface PageProps extends InertiaPageProps {
  carreras: Carrera[];
  asignaturas: Asignatura[];
  errors?: Record<string, string>;
}

const AgregarGrupo = () => {
  const { carreras = [], asignaturas = [], errors = {} } = usePage<PageProps>().props;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    carrera_id: "",
    asignatura_id: "", // <- Nueva clave
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    router.post("/grupost", form, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Grupo agregado correctamente");
        setForm({ nombre: "", codigo: "", carrera_id: "", asignatura_id: "" });
        setOpen(false);
      },
      onError: (errors) => {
        console.error("Errores:", errors);
        toast.error("Error al agregar el grupo");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Agregar Grupo</Button>
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

          <div>
            <Label htmlFor="carrera_id">Carrera</Label>
            <select
              id="carrera_id"
              name="carrera_id"
              value={form.carrera_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Selecciona una carrera</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
            {errors?.carrera_id && <p className="text-red-500 text-sm mt-1">{errors.carrera_id}</p>}
          </div>

          <div>
            <Label htmlFor="asignatura_id">Asignatura</Label>
            <select
              id="asignatura_id"
              name="asignatura_id"
              value={form.asignatura_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Selecciona una asignatura</option>
              {asignaturas.map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
            </select>
            {errors?.asignatura_id && <p className="text-red-500 text-sm mt-1">{errors.asignatura_id}</p>}
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
