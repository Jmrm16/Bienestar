import { type FormEvent, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { CalendarRange, Loader2, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Periodo = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
};

type FlashProps = {
  flash?: {
    success?: string | null;
    warning?: string | null;
    error?: string | null;
  };
};

export default function ImportarResolucionesPeriodoDialog() {
  const { periodos = [] } = usePage().props as unknown as {
    periodos: Periodo[];
  };

  const orderedPeriods = useMemo(
    () => [...periodos].sort((a, b) => b.id - a.id),
    [periodos]
  );

  const defaultPeriodId = orderedPeriods.find((periodo) => periodo.is_active)?.id
    ?? orderedPeriods[0]?.id
    ?? null;

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [periodId, setPeriodId] = useState<string>(defaultPeriodId ? String(defaultPeriodId) : "");

  const resetForm = () => {
    setFile(null);
    setInputKey((current) => current + 1);
    setPeriodId(defaultPeriodId ? String(defaultPeriodId) : "");
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!periodId) {
      toast.error("Selecciona el período");
      return;
    }

    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }

    setSending(true);

    router.post(
      route("tutores.import.period_resolutions"),
      {
        period_id: periodId,
        archivo: file,
      },
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
              : "No se pudo importar el archivo de resoluciones"
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
          <CalendarRange className="h-4 w-4" />
          Importar resoluciones
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Importar resoluciones por período</DialogTitle>
          <DialogDescription>
            Sube el Excel del período con la resolución de cada tutor. Este archivo
            solo actualiza `R1/R2` del período elegido y no modifica los datos
            personales del tutor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodo-resolucion">Período</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger id="periodo-resolucion">
                <SelectValue placeholder="Selecciona el período" />
              </SelectTrigger>
              <SelectContent>
                {orderedPeriods.map((periodo) => (
                  <SelectItem key={periodo.id} value={String(periodo.id)}>
                    {periodo.code} - {periodo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resoluciones-excel">Archivo Excel</Label>
            <Input
              key={inputKey}
              id="resoluciones-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Columnas recomendadas: `codigo`, `documento`, `nombre completo` y
              `tipo_resolucion`. Si la columna de resolución no viene, el sistema
              intenta deducir `R1` o `R2` del nombre del archivo u hoja.
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
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar resoluciones
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
