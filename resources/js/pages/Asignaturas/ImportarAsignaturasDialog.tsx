import { type FormEvent, useState } from "react";
import { router } from "@inertiajs/react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FlashProps = {
  flash?: {
    success?: string | null;
    warning?: string | null;
    error?: string | null;
  };
};

export default function ImportarAsignaturasDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const resetForm = () => {
    setFile(null);
    setInputKey((current) => current + 1);
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }

    setSending(true);

    router.post(
      route("asignaturas.import"),
      { archivo: file },
      {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: (page) => {
          const flash = (page.props as FlashProps).flash ?? {};

          if (flash.success) {
            toast.success(flash.success);
          }

          if (flash.warning) {
            toast.warning(flash.warning);
          }

          closeDialog();
        },
        onError: (errors) => {
          const firstError = Object.values(errors)[0];
          toast.error(
            typeof firstError === "string"
              ? firstError
              : "No se pudo importar el archivo"
          );
        },
        onFinish: () => setSending(false),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen && !sending) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Importar asignaturas desde Excel</DialogTitle>
          <DialogDescription>
            Solo se usan las columnas `PROGRAMA ACADEMICO` y `ASIGNATURA`.
            El sistema crea una sola asignatura por combinación `carrera + nombre`
            y omite repeticiones dentro del mismo archivo o si ya existen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asignaturas-excel">Archivo Excel</Label>
            <Input
              key={inputKey}
              id="asignaturas-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              `PROGRAMA ACADEMICO` se cruza contra las carreras registradas.
              `SEMESTRE`, `DOCENTE`, `TUTOR` y demás columnas se ignoran.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeDialog}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
