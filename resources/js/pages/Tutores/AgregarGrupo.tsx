import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import type { PageProps as InertiaPageProps } from "@inertiajs/core";
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Asignatura {
  id: number;
  nombre: string;
  carrera: {
    id: number;
    nombre: string;
  };
}

interface PageProps extends InertiaPageProps {
  asignatura: Asignatura;
  errors?: Partial<Record<keyof FormValues, string>>;
}

interface FormValues {
  [key: string]: string;
  nombre: string;
  codigo: string;
  carrera_id: string;
  asignatura_id: string;
}

const AgregarGrupo = () => {
  const { asignatura, errors = {} } = usePage<PageProps>().props;
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormValues>({
    nombre: "",
    codigo: "",
    carrera_id: asignatura.carrera.id.toString(),
    asignatura_id: asignatura.id.toString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      codigo: "",
      carrera_id: asignatura.carrera.id.toString(),
      asignatura_id: asignatura.id.toString(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    router.post("/grupost", form, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("✅ Grupo creado exitosamente");
        resetForm();
        setOpen(false);
      },
      onError: (errors) => {
        if (Object.keys(errors).length > 0) {
          toast.error("❌ Por favor corrige los errores en el formulario");
        } else {
          toast.error("❌ Ocurrió un error al crear el grupo");
        }
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        if (!open) resetForm();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" className="bg-primary hover:bg-primary/90">
          Crear Nuevo Grupo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Grupo</DialogTitle>
          <DialogDescription>
            Complete los campos requeridos para registrar un nuevo grupo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre" className="text-right">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="col-span-3"
              disabled={isSubmitting}
            />
            {errors.nombre && (
              <p className="col-span-4 col-start-2 text-sm text-destructive">
                {errors.nombre}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codigo" className="text-right">Código</Label>
            <Input
              id="codigo"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="col-span-3"
              disabled={isSubmitting}
            />
            {errors.codigo && (
              <p className="col-span-4 col-start-2 text-sm text-destructive">
                {errors.codigo}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgregarGrupo;
