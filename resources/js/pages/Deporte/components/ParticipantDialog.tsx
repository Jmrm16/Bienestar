import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  buildParticipantFormValues,
  hasErrors,
  ParticipantForm,
  type ParticipantFormValues,
  validateParticipant,
} from "./ParticipantForm";
import { getAreaStyle } from "./area-styles";
import type { Carrera, SportParticipant } from "./types";

export function ParticipantDialog({
  open,
  onOpenChange,
  onSubmit,
  carreras,
  participant,
  mode,
  sportKey,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (values: ParticipantFormValues) => Promise<void> | void;
  carreras: Carrera[];
  participant?: SportParticipant | null;
  mode: "create" | "edit";
  sportKey: string;
}) {
  const [values, setValues] = useState<ParticipantFormValues>(
    buildParticipantFormValues(participant)
  );
  const [saving, setSaving] = useState(false);
  const errors = useMemo(() => validateParticipant(values), [values]);
  const style = getAreaStyle(sportKey);

  useEffect(() => {
    if (open) {
      setValues(buildParticipantFormValues(participant));
    }
  }, [open, participant]);

  const handleSubmit = async () => {
    if (hasErrors(errors)) {
      toast.error("Revisa los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(values);
      toast.success(mode === "create" ? "Participante registrado" : "Participante actualizado");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className={`rounded-2xl border p-4 ${style.emphasisPanel}`}>
          <DialogTitle>
            {mode === "create" ? "Agregar participante" : "Editar participante"}
          </DialogTitle>
        </DialogHeader>

        <ParticipantForm
          value={values}
          onChange={setValues}
          disabled={saving}
          carreras={carreras}
        />

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className={style.badge}
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className={`${style.hero} border-0 hover:opacity-90`}
          >
            {saving ? "Guardando..." : mode === "create" ? "Guardar" : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
