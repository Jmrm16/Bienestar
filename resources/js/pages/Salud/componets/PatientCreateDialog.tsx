// resources/js/Pages/Salud/components/PatientCreateDialog.tsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  PatientForm,
  type PatientFormValues,
  type Carrera,
  validatePatient,
  hasErrors,
} from "./PatientForm";

export function PatientCreateDialog({
  open,
  onOpenChange,
  onCreate,
  carreras,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (values: PatientFormValues) => Promise<void> | void;
  carreras: Carrera[]; // ✅ nuevo
}) {
  const [values, setValues] = useState<PatientFormValues>({
    tipo_doc: "CC",
    documento: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    carrera_id: "",
    semestre: "",
  });

  const [saving, setSaving] = useState(false);
  const errors = useMemo(() => validatePatient(values), [values]);

  const handleSave = async () => {
    if (hasErrors(errors)) {
      toast.error("Revisa los campos obligatorios");
      return;
    }
    try {
      setSaving(true);

      // ✅ convertir carrera_id a number antes de enviar (backend espera integer)
      await onCreate({
        ...values,
        carrera_id: String(values.carrera_id), // el form lo maneja string
      });

      toast.success("Paciente registrado");
      onOpenChange(false);

      setValues({
        tipo_doc: "CC",
        documento: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        carrera_id: "",
        semestre: "",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agregar paciente</DialogTitle>
        </DialogHeader>

        {/* ✅ aquí se pasan las carreras */}
        <PatientForm
          value={values}
          onChange={setValues}
          disabled={saving}
          carreras={carreras}
        />

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
