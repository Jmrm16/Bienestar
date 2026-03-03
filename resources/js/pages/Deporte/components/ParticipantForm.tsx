import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Carrera, SportParticipant } from "./types";

export type ParticipantFormValues = {
  tipo_doc: string;
  documento: string;
  nombres: string;
  apellidos: string;
  estamento: string;
  estado: string;
  fecha_ingreso: string;
  telefono: string;
  correo: string;
  carrera_id: string;
  semestre: string;
  observaciones: string;
};

const DEFAULTS: ParticipantFormValues = {
  tipo_doc: "CC",
  documento: "",
  nombres: "",
  apellidos: "",
  estamento: "Estudiante",
  estado: "Activo",
  fecha_ingreso: "",
  telefono: "",
  correo: "",
  carrera_id: "none",
  semestre: "",
  observaciones: "",
};

export function buildParticipantFormValues(
  participant?: SportParticipant | null
): ParticipantFormValues {
  if (!participant) return DEFAULTS;

  return {
    tipo_doc: participant.tipo_doc ?? "CC",
    documento: participant.documento ?? "",
    nombres: participant.nombres ?? "",
    apellidos: participant.apellidos ?? "",
    estamento: participant.estamento ?? "Estudiante",
    estado: participant.estado ?? "Activo",
    fecha_ingreso: participant.fecha_ingreso ?? "",
    telefono: participant.telefono ?? "",
    correo: participant.correo ?? "",
    carrera_id: participant.carrera_id ? String(participant.carrera_id) : "none",
    semestre: participant.semestre ?? "",
    observaciones: participant.observaciones ?? "",
  };
}

export function ParticipantForm({
  value,
  onChange,
  disabled,
  carreras,
}: {
  value: ParticipantFormValues;
  onChange: (next: ParticipantFormValues) => void;
  disabled?: boolean;
  carreras: Carrera[];
}) {
  const set = <K extends keyof ParticipantFormValues>(
    key: K,
    val: ParticipantFormValues[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Tipo documento</Label>
        <Select
          value={value.tipo_doc}
          onValueChange={(x) => set("tipo_doc", x)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
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
        <Input
          value={value.documento}
          onChange={(e) => set("documento", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Nombres</Label>
        <Input
          value={value.nombres}
          onChange={(e) => set("nombres", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Apellidos</Label>
        <Input
          value={value.apellidos}
          onChange={(e) => set("apellidos", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Estamento</Label>
        <Select
          value={value.estamento}
          onValueChange={(x) => set("estamento", x)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Estudiante">Estudiante</SelectItem>
            <SelectItem value="Docente">Docente</SelectItem>
            <SelectItem value="Administrativo">Administrativo</SelectItem>
            <SelectItem value="Egresado">Egresado</SelectItem>
            <SelectItem value="Invitado">Invitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={value.estado}
          onValueChange={(x) => set("estado", x)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Inactivo">Inactivo</SelectItem>
            <SelectItem value="Retirado">Retirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Fecha de ingreso</Label>
        <Input
          type="date"
          value={value.fecha_ingreso}
          onChange={(e) => set("fecha_ingreso", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Telefono</Label>
        <Input
          value={value.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Correo</Label>
        <Input
          type="email"
          value={value.correo}
          onChange={(e) => set("correo", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Carrera</Label>
        <Select
          value={value.carrera_id}
          onValueChange={(x) => set("carrera_id", x)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No aplica</SelectItem>
            {carreras.map((carrera) => (
              <SelectItem key={carrera.id} value={String(carrera.id)}>
                {carrera.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Semestre</Label>
        <Input
          value={value.semestre}
          onChange={(e) => set("semestre", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Observaciones</Label>
        <Textarea
          value={value.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
          disabled={disabled}
          rows={4}
        />
      </div>
    </div>
  );
}

export function validateParticipant(values: ParticipantFormValues) {
  const errors: Partial<Record<keyof ParticipantFormValues, string>> = {};

  if (!values.documento.trim()) errors.documento = "Documento es requerido";
  if (!values.nombres.trim()) errors.nombres = "Nombres es requerido";
  if (!values.apellidos.trim()) errors.apellidos = "Apellidos es requerido";
  if (!values.estamento.trim()) errors.estamento = "Estamento es requerido";
  if (!values.estado.trim()) errors.estado = "Estado es requerido";

  return errors;
}

export function hasErrors(errs: Record<string, string | undefined>) {
  return Object.values(errs).some(Boolean);
}
