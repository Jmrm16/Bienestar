import React, { useState } from "react";
import { router } from "@inertiajs/react";
import {
  CalendarClock,
  ClipboardList,
  Plus,
  Smile,
  Stethoscope,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/component/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { Patient } from "../componets/types";

type ClinicalRecord = {
  id: number;
  fecha: string;
  tipo: string;
  motivo_consulta?: string | null;
  evaluacion: string;
  plan_manejo?: string | null;
  responsable?: string | null;
  observaciones?: string | null;
  paciente?: {
    id: number;
    nombre: string;
    documento: string;
  } | null;
};

type ClinicalStats = {
  total_registros: number;
  registros_mes: number;
  pacientes_atendidos: number;
  tipos_registrados: number;
};

type Props = {
  areaKey: string;
  panelEnabled?: boolean;
  records?: ClinicalRecord[];
  stats?: ClinicalStats;
  patients?: Patient[];
};

const today = new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const textOrDash = (value?: string | null, fallback = "—") => {
  const text = (value ?? "").trim();
  return text !== "" ? text : fallback;
};

export default function ClinicalPanel({
  areaKey,
  panelEnabled = false,
  records = [],
  stats,
  patients = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    paciente_id: "none",
    fecha: today,
    tipo: "",
    motivo_consulta: "",
    evaluacion: "",
    plan_manejo: "",
    responsable: "",
    observaciones: "",
  });

  const safeStats: ClinicalStats = stats ?? {
    total_registros: 0,
    registros_mes: 0,
    pacientes_atendidos: 0,
    tipos_registrados: 0,
  };

  const isOdontology = areaKey === "odontologia";
  const heading = isOdontology ? "Odontología" : "Medicina general";
  const recordsLabel = isOdontology ? "procedimientos" : "atenciones";
  const createLabel = isOdontology ? "Registrar procedimiento" : "Registrar atención";
  const typePlaceholder = isOdontology
    ? "Ej. Valoración, limpieza, control"
    : "Ej. Consulta general, control, remisión";

  const handleCreate = () => {
    router.post(
      `/salud/${areaKey}/atenciones`,
      {
        ...form,
        paciente_id: form.paciente_id === "none" ? null : Number(form.paciente_id),
        motivo_consulta: form.motivo_consulta || null,
        plan_manejo: form.plan_manejo || null,
        responsable: form.responsable || null,
        observaciones: form.observaciones || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          setForm({
            paciente_id: "none",
            fecha: today,
            tipo: "",
            motivo_consulta: "",
            evaluacion: "",
            plan_manejo: "",
            responsable: "",
            observaciones: "",
          });
        },
      },
    );
  };

  if (!panelEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <CardDescription>
            El panel clínico necesita la tabla de atenciones del módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Ejecuta las migraciones del módulo para habilitar el registro de {recordsLabel}, valoraciones y seguimiento.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={isOdontology ? "Procedimientos" : "Atenciones"}
          value={safeStats.total_registros}
          icon={ClipboardList}
          color="cyan"
          detail="Registros acumulados"
        />
        <MetricCard
          title="Este mes"
          value={safeStats.registros_mes}
          icon={CalendarClock}
          color="blue"
          detail={`${recordsLabel} registradas`}
        />
        <MetricCard
          title="Pacientes atendidos"
          value={safeStats.pacientes_atendidos}
          icon={Users}
          color="green"
          detail="Con historia en el área"
        />
        <MetricCard
          title="Tipos registrados"
          value={safeStats.tipos_registrados}
          icon={isOdontology ? Smile : Stethoscope}
          color="purple"
          detail="Categorías de atención"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>
              {isOdontology ? "Valoraciones y procedimientos" : "Atenciones y seguimiento"}
            </CardTitle>
            <CardDescription>
              {isOdontology
                ? "Registra valoraciones odontológicas, procedimientos realizados y plan de manejo."
                : "Registra consultas, controles, diagnósticos y planes de manejo del área."}
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {createLabel}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Evaluación</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Responsable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay {recordsLabel} registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.paciente ? (
                          <div className="space-y-1">
                            <p>{record.paciente.nombre}</p>
                            <p className="text-xs text-muted-foreground">{record.paciente.documento}</p>
                          </div>
                        ) : (
                          "Sin paciente"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="line-clamp-2">{textOrDash(record.motivo_consulta, "Sin motivo")}</p>
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <p className="line-clamp-2">{record.evaluacion}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="line-clamp-2">{textOrDash(record.plan_manejo, "Sin plan")}</p>
                      </TableCell>
                      <TableCell>{textOrDash(record.responsable, "No registrado")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{createLabel}</DialogTitle>
            <DialogDescription>
              {isOdontology
                ? "Documenta valoración, hallazgos, procedimiento realizado y plan de manejo."
                : "Documenta la consulta, evaluación clínica y plan de manejo del paciente."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={form.paciente_id} onValueChange={(value) => setForm((current) => ({ ...current, paciente_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Paciente opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {patient.nombres} {patient.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm((current) => ({ ...current, fecha: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo</Label>
              <Input
                value={form.tipo}
                onChange={(e) => setForm((current) => ({ ...current, tipo: e.target.value }))}
                placeholder={typePlaceholder}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Motivo de consulta</Label>
              <Textarea
                value={form.motivo_consulta}
                onChange={(e) => setForm((current) => ({ ...current, motivo_consulta: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{isOdontology ? "Evaluación / procedimiento" : "Evaluación clínica"}</Label>
              <Textarea
                value={form.evaluacion}
                onChange={(e) => setForm((current) => ({ ...current, evaluacion: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{isOdontology ? "Plan de manejo / recomendaciones" : "Plan de manejo"}</Label>
              <Textarea
                value={form.plan_manejo}
                onChange={(e) => setForm((current) => ({ ...current, plan_manejo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input
                value={form.responsable}
                onChange={(e) => setForm((current) => ({ ...current, responsable: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={form.observaciones}
                onChange={(e) => setForm((current) => ({ ...current, observaciones: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.tipo || !form.evaluacion}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
