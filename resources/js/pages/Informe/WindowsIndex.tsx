import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Send, CheckCircle2, Globe, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Period = {
  id: number;
  code: string;
  name?: string | null;
};

type Window = {
  id: number;
  name: string;
  tutor_type: "R1" | "R2";
  open_at: string;
  due_at?: string | null;
  close_at?: string | null;
  instructions?: string | null;
  is_published: boolean;
};

type Props = { period: Period; windows: Window[] };

const breadcrumbs = (p: Period): BreadcrumbItem[] => ([
  { title: "Reportes", href: "/reportes/periodos" },
  { title: `Periodo ${p.code}`, href: `/reportes/periodos/${p.id}/entregas` },
]);

export default function WindowsIndex({ period, windows }: Props) {
  const totalPublicadas = useMemo(() => windows.filter(w => w.is_published).length, [windows]);

  // Create/Edit dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Window | null>(null);
  const [form, setForm] = useState({
    name: "",
    tutor_type: "R1" as "R1" | "R2",
    open_at: "",
    due_at: "",
    close_at: "",
    instructions: "",
    is_published: true,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", tutor_type: "R1", open_at: "", due_at: "", close_at: "", instructions: "", is_published: true });
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (w: Window) => {
    setEditing(w);
    setForm({
      name: w.name,
      tutor_type: w.tutor_type,
      open_at: w.open_at.slice(0,16), // datetime-local
      due_at: w.due_at ? w.due_at.slice(0,16) : "",
      close_at: w.close_at ? w.close_at.slice(0,16) : "",
      instructions: w.instructions || "",
      is_published: w.is_published,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.open_at) { toast.error("La fecha de apertura es obligatoria"); return; }

    const payload = { ...form };
    const routeName = editing ? "reports.windows.update" : "reports.windows.store";
    const routeParams = editing ? [period.id, editing.id] : [period.id];

    router.post(route(routeName, routeParams), { _method: editing ? "put" : undefined, ...payload }, {
      onSuccess: () => { toast.success(editing ? "Entrega actualizada" : "Entrega creada"); setOpen(false); resetForm(); },
      onError: (e) => toast.error(Object.values(e)[0] as string ?? "Error"),
    });
  };

  const destroyW = (w: Window) => {
    router.post(route("reports.windows.destroy", [period.id, w.id]), { _method: "delete" }, {
      onSuccess: () => toast.success("Entrega eliminada"),
      onError: () => toast.error("No se pudo eliminar"),
    });
  };

  const assignAll = (w: Window) => {
    router.post(route("reports.windows.assign_all", [period.id, w.id]), {}, {
      onSuccess: () => toast.success(`Asignado a todos los tutores ${w.tutor_type}`),
      onError: () => toast.error("No se pudo asignar"),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(period)}>
      <Head title={`Entregas - ${period.code}`} />
      <div className="flex flex-col gap-6 p-4">
        {/* Header + métricas simples */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Entregas del periodo {period.code}</h1>
            <p className="text-sm text-muted-foreground">{period.name ?? "—"}</p>
          </div>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nueva entrega</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader><DialogTitle>{editing ? "Editar entrega" : "Crear entrega"}</DialogTitle></DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Horario del Servicio de Tutorías" />
                </div>

                <div>
                  <Label>Tipo de tutor *</Label>
                  <Select value={form.tutor_type} onValueChange={(v: "R1" | "R2") => setForm(f => ({ ...f, tutor_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R1">Primera resolución (R1)</SelectItem>
                      <SelectItem value="R2">Segunda resolución (R2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Publicada</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: Boolean(v) }))} />
                    <span className="text-sm text-muted-foreground">Visible para tutores</span>
                  </div>
                </div>

                <div>
                  <Label>Apertura *</Label>
                  <Input type="datetime-local" value={form.open_at} onChange={e => setForm(f => ({ ...f, open_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Fecha límite</Label>
                  <Input type="datetime-local" value={form.due_at} onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Cierre</Label>
                  <Input type="datetime-local" value={form.close_at} onChange={e => setForm(f => ({ ...f, close_at: e.target.value }))} />
                </div>

                <div className="md:col-span-2">
                  <Label>Instrucciones</Label>
                  <Textarea rows={5} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Especifica qué deben subir (p. ej. Informe periódico, acta, listados, etc.)" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={submit}>{editing ? "Guardar cambios" : "Crear"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de entregas */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Publicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {windows.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{w.tutor_type}</Badge>
                  </TableCell>
                  <TableCell>{w.open_at?.replace("T"," ").slice(0,16)}</TableCell>
                  <TableCell>{w.due_at ? w.due_at.replace("T"," ").slice(0,16) : <span className="text-muted-foreground">Sin fecha</span>}</TableCell>
                  <TableCell>{w.is_published ? <Badge className="bg-emerald-600"><Globe className="mr-1 h-3 w-3" />Publicado</Badge> : <Badge variant="outline">Oculta</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(w)}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={() => assignAll(w)}><Send className="mr-1 h-4 w-4" />Asignar a todos</Button>
                    <Button size="sm" variant="ghost" onClick={() => destroyW(w)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {totalPublicadas} publicadas · {windows.length - totalPublicadas} ocultas
          </div>
        </motion.div>

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4" /> Tips</div>
          <ul className="mt-2 list-disc list-inside">
            <li>Para “Sin fecha de entrega”, deja <em>Fecha límite</em> vacía.</li>
            <li>Usa el campo <em>Instrucciones</em> para pegar el texto de la solicitud.</li>
            <li><strong>Asignar a todos</strong> crea/actualiza registros <em>pendientes</em> para los tutores del tipo (R1/R2).</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
