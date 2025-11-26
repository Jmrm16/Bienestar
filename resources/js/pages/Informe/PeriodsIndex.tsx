import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/component/MetricCard";

type Period = {
  id: number;
  code: string;
  name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  windows_count: number;
};

type Props = { periods: Period[] };

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Reportes", href: "/reportes/periodos" },
];

export default function PeriodsIndex({ periods }: Props) {
  const totalActivos = useMemo(() => periods.filter(p => p.is_active).length, [periods]);

  // Create/Edit dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ code: "", name: "", starts_at: "", ends_at: "", is_active: true });
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (p: Period) => {
    setEditing(p);
    setForm({
      code: p.code || "",
      name: p.name || "",
      starts_at: (p.starts_at || "").slice(0, 10),
      ends_at: (p.ends_at || "").slice(0, 10),
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const submit = () => {
    const payload = { ...form };
    if (!form.code.trim()) { toast.error("El código es obligatorio (ej. 2025-2)"); return; }

    if (editing) {
      router.post(route("reports.periods.update", editing.id), { _method: "put", ...payload }, {
        onSuccess: () => { toast.success("Periodo actualizado"); setOpen(false); resetForm(); },
        onError: (e) => toast.error(Object.values(e)[0] as string ?? "Error"),
      });
    } else {
      router.post(route("reports.periods.store"), payload, {
        onSuccess: () => { toast.success("Periodo creado"); setOpen(false); resetForm(); },
        onError: (e) => toast.error(Object.values(e)[0] as string ?? "Error"),
      });
    }
  };

  const destroyP = (id: number) => {
    router.post(route("reports.periods.destroy", id), { _method: "delete" }, {
      onSuccess: () => toast.success("Periodo eliminado"),
      onError: () => toast.error("No se pudo eliminar"),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Periodos de reportes" />

      <div className="flex flex-col gap-6 p-4">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Periodos" value={periods.length} icon={CalendarDays} color="blue" detail="Total creados" />
          <MetricCard title="Activos" value={totalActivos} icon={CalendarDays} color="cyan" detail="Visibles para ventanas" />
          <MetricCard title="Inactivos" value={periods.length - totalActivos} icon={CalendarDays} color="purple" detail="Archivados" />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Gestión de periodos</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo periodo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar periodo" : "Crear periodo"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Código *</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="2025-2" />
                </div>
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Periodo 2025-II" />
                </div>
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: Boolean(v) }))} />
                  <span className="text-sm">Activo</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={submit}>{editing ? "Guardar cambios" : "Crear"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rango</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Entregas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.code}</TableCell>
                  <TableCell>{p.name ?? "—"}</TableCell>
                  <TableCell>{p.starts_at ? p.starts_at.slice(0,10) : "—"} — {p.ends_at ? p.ends_at.slice(0,10) : "—"}</TableCell>
                  <TableCell>{p.is_active ? <Badge className="bg-emerald-600">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}</TableCell>
                  <TableCell>{p.windows_count}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => router.get(route("reports.windows.index", p.id))}>
                      Ver entregas
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => destroyP(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </AppLayout>
  );
}
