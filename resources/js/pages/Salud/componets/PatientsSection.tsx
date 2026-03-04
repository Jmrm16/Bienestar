// resources/js/Pages/Salud/components/PatientsSection.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { router } from "@inertiajs/react";

import type { Patient, Carrera } from "./types";
import { PatientsTable } from "./PatientsTable";
import { PatientCreateDialog } from "./PatientCreateDialog";
import type { PatientFormValues } from "./PatientForm";

export function PatientsSection({
  areaKey,
  patients,
  carreras,
}: {
  areaKey: string; // ej: "medicina-general"
  patients: Patient[];
  carreras: Carrera[]; // ✅ nuevo
}) {
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients;

    return patients.filter((p) => {
      const full = `${p.nombres} ${p.apellidos}`.toLowerCase();
      return (
        p.documento.toLowerCase().includes(s) ||
        full.includes(s) ||
        (p.carrera_nombre ?? "").toLowerCase().includes(s) ||
        (p.telefono ?? "").toLowerCase().includes(s)
      );
    });
  }, [q, patients]);

  const handleCreate = (values: PatientFormValues) => {
    return new Promise<void>((resolve, reject) => {
      router.post(
        `/salud/${areaKey}/pacientes`,
        {
          ...values,
          carrera_id: Number(values.carrera_id),
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpenCreate(false);
            setQ("");
            resolve();
          },
          onError: (errors) => {
            const firstError = Object.values(errors)[0];
            reject(new Error(typeof firstError === "string" ? firstError : "No se pudo guardar"));
          },
        }
      );
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Pacientes</h2>
            <p className="text-sm text-muted-foreground">
              Busca, registra y consulta pacientes del área.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar paciente
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por documento, nombre, carrera o teléfono..."
              className="pl-9"
            />
          </div>
        </div>

        <PatientsTable rows={filtered} />
      </CardContent>

      <PatientCreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={handleCreate}
        carreras={carreras} // ✅ se pasan al modal
      />
    </Card>
  );
}
