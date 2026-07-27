import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Carrera = { id: number; nombre: string };

export type PatientFormValues = {
  tipo_doc: string;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  carrera_id: string; // ✅ string para Select (luego lo convertimos)
  semestre: string;
};

const DEFAULTS: PatientFormValues = {
  tipo_doc: "CC",
  documento: "",
  nombres: "",
  apellidos: "",
  telefono: "",
  correo: "",
  carrera_id: "",
  semestre: "",
};

export function PatientForm({
  value,
  onChange,
  disabled,
  carreras,
}: {
  value?: Partial<PatientFormValues>;
  onChange: (next: PatientFormValues) => void;
  disabled?: boolean;
  carreras: Carrera[];
}) {
  const v: PatientFormValues = { ...DEFAULTS, ...(value ?? {}) };

  const set = <K extends keyof PatientFormValues>(key: K, val: PatientFormValues[K]) => {
    onChange({ ...v, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Tipo documento</Label>
        <Select value={v.tipo_doc} onValueChange={(x) => set("tipo_doc", x)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CC">CC</SelectItem>
            <SelectItem value="TI">TI</SelectItem>
            <SelectItem value="CE">CE</SelectItem>
            <SelectItem value="PP">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Documento</Label>
        <Input value={v.documento} onChange={(e) => set("documento", e.target.value)} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Nombres</Label>
        <Input value={v.nombres} onChange={(e) => set("nombres", e.target.value)} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Apellidos</Label>
        <Input value={v.apellidos} onChange={(e) => set("apellidos", e.target.value)} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Teléfono</Label>
        <Input value={v.telefono} onChange={(e) => set("telefono", e.target.value)} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Correo</Label>
        <Input type="email" value={v.correo} onChange={(e) => set("correo", e.target.value)} disabled={disabled} />
      </div>

      {/* ✅ Carrera desde BD */}
      <div className="space-y-2">
        <Label>Carrera</Label>
        <Select
          value={v.carrera_id}
          onValueChange={(x) => set("carrera_id", x)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una carrera" />
          </SelectTrigger>
          <SelectContent>
            {carreras.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Semestre</Label>
        <Input value={v.semestre} onChange={(e) => set("semestre", e.target.value)} disabled={disabled} />
      </div>
    </div>
  );
}

export function validatePatient(values: PatientFormValues) {
  const errors: Partial<Record<keyof PatientFormValues, string>> = {};
  if (!values.documento.trim()) errors.documento = "Documento es requerido";
  if (!values.nombres.trim()) errors.nombres = "Nombres es requerido";
  if (!values.apellidos.trim()) errors.apellidos = "Apellidos es requerido";
  if (!values.carrera_id.trim()) errors.carrera_id = "Carrera es requerida";
  return errors;
}

export function hasErrors(errs: Record<string, any>) {
  return Object.keys(errs).length > 0;
}