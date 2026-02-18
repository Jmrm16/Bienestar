import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import type { PageProps as InertiaPageProps } from "@inertiajs/core";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";

/* ───────────────────── TYPES ───────────────────── */

interface Carrera {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  nombre: string;
  carrera: Carrera;
}

interface PageProps extends InertiaPageProps {
  asignatura: Asignatura;
  flash?: {
    success?: string;
    error?: string;
  };
  errors?: Record<string, string>;
}

interface FormValues {
  nombre: string;
  codigo: string;
  docente: string;
  carrera_id: string;
  asignatura_id: string;
  [key: string]: any;
}

/* ───────────────────── COMPONENT ───────────────────── */

const AgregarGrupo = () => {
  const { asignatura, flash, errors } = usePage<PageProps>().props;

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* 🔔 Mensajes backend */
  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  /* ❌ Errores de validación */
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
    }
  }, [errors]);

  const initialForm: FormValues = {
    nombre: "",
    codigo: "",
    docente: "",
    carrera_id: asignatura.carrera.id.toString(),
    asignatura_id: asignatura.id.toString(),
  };

  const [form, setForm] = useState<FormValues>(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => setForm(initialForm);

  /* ───────────── SUBMIT CORRECTO ───────────── */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) return toast.error("Debe ingresar un nombre");
    if (!form.codigo.trim()) return toast.error("Debe ingresar un código");

    setIsSubmitting(true);

    router.post("/grupost", form, {
      preserveScroll: true,

      onSuccess: () => {
        // ✅ SOLO cuando TODO salió bien
        resetForm();
        setOpen(false); // 🔥 CIERRA MODAL
      },

      onError: () => {
        // ❌ errores ya se muestran por useEffect(errors)
      },

      onFinish: () => setIsSubmitting(false),
    });
  };

  /* ───────────────────── RENDER ───────────────────── */

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) resetForm();
        setOpen(state);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
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
            <Label className="text-right">Nombre</Label>
            <Input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Código</Label>
            <Input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Docente</Label>
            <Input
              name="docente"
              value={form.docente}
              onChange={handleChange}
              disabled={isSubmitting}
              className="col-span-3"
            />
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
