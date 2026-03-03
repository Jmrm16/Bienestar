import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

type Period = { id: number; code: string; name?: string | null };

export default function ImportarExcelDialog() {
  const { periods = [] } = usePage().props as unknown as { periods: Period[] };

  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!periodId) {
      toast.error("Selecciona un período");
      return;
    }
    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }

    setSending(true);

    router.post(
      route("estudiantes.import"),
      {
        period_id: periodId,
        archivo: file,
      },
      {
        forceFormData: true, // ✅ importante para enviar archivos
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Importación realizada");
          setOpen(false);
          setFile(null);
          setPeriodId("");
        },
        onError: (err) => {
          console.error(err);
          toast.error("No se pudo importar el archivo");
        },
        onFinish: () => setSending(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Importar asistentes desde Excel</DialogTitle>
          <DialogDescription>
            Sube la plantilla de actividades (IDENTIFICACION, NOMBRES Y APELLIDOS, SEXO, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.code}{p.name ? ` — ${p.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Archivo Excel</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: .xlsx, .xls
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
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