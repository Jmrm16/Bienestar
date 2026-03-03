import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { PencilLine, Delete, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EstudianteRow = {
  id: number;
  period_id: number;
  identificacion: string;
  nombres?: string | null;
  apellidos?: string | null;

  sexo?: string | null;
  grupos_prioritarios?: string | null;
  estamento?: string | null;
  dependencia?: string | null;
  programa_academico?: string | null;

  servicio: string;      // opción B => ''
  actividad: string;     // opción B => ''
  responsable?: string | null;
  trimestre: string;     // opción B => ''
};

export default function TablaEstudiantes({
  rows,
  periodId,
}: {
  rows: EstudianteRow[];
  periodId: number;
}) {
  const [q, setQ] = useState("");
  const [servicioFilter, setServicioFilter] = useState("all");
  const [trimestreFilter, setTrimestreFilter] = useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EstudianteRow | null>(null);

  const servicios = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => s.add((r.servicio ?? "").trim() || "Sin servicio"));
    return Array.from(s).sort();
  }, [rows]);

  const trimestres = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => s.add((r.trimestre ?? "").trim() || "Sin trimestre"));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return (rows ?? []).filter((r) => {
      const full = `${r.nombres ?? ""} ${r.apellidos ?? ""}`.toLowerCase();
      const ident = (r.identificacion ?? "").toLowerCase();
      const prog = (r.programa_academico ?? "").toLowerCase();
      const dep = (r.dependencia ?? "").toLowerCase();
      const act = (r.actividad ?? "").toLowerCase();

      const matchesText =
        !s ||
        full.includes(s) ||
        ident.includes(s) ||
        prog.includes(s) ||
        dep.includes(s) ||
        act.includes(s);

      const svc = (r.servicio ?? "").trim() || "Sin servicio";
      const tri = (r.trimestre ?? "").trim() || "Sin trimestre";

      const matchesSvc = servicioFilter === "all" || svc === servicioFilter;
      const matchesTri = trimestreFilter === "all" || tri === trimestreFilter;

      return matchesText && matchesSvc && matchesTri;
    });
  }, [rows, q, servicioFilter, trimestreFilter]);

  const openEdit = (r: EstudianteRow) => {
    setSelected(JSON.parse(JSON.stringify(r)));
    setEditOpen(true);
  };

  const openDelete = (r: EstudianteRow) => {
    setSelected(r);
    setDeleteOpen(true);
  };

  const updateRow = () => {
    if (!selected) return;

    router.put(
      route("estudiantes.update", selected.id),
      {
        identificacion: selected.identificacion,
        nombres: selected.nombres ?? "",
        apellidos: selected.apellidos ?? "",
        sexo: selected.sexo ?? null,
        grupos_prioritarios: selected.grupos_prioritarios ?? null,
        estamento: selected.estamento ?? null,
        dependencia: selected.dependencia ?? null,
        programa_academico: selected.programa_academico ?? null,
        servicio: selected.servicio ?? "",
        actividad: selected.actividad ?? "",
        responsable: selected.responsable ?? null,
        trimestre: selected.trimestre ?? "",
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Registro actualizado");
          setEditOpen(false);
          setSelected(null);
        },
        onError: () => toast.error("No se pudo actualizar"),
      }
    );
  };

  const deleteRow = () => {
    if (!selected) return;

    router.delete(route("estudiantes.destroy", selected.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Registro eliminado");
        setDeleteOpen(false);
        setSelected(null);
      },
      onError: () => toast.error("No se pudo eliminar"),
    });
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Registros importados</h2>
          <p className="text-sm text-muted-foreground">
            Filtra por servicio/trimestre y busca por identificación, nombre, programa o actividad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-[760px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar..."
              className="pl-9"
            />
          </div>

          <Select value={servicioFilter} onValueChange={setServicioFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              {servicios.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={trimestreFilter} onValueChange={setTrimestreFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los trimestres</SelectItem>
              {trimestres.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableCaption>Registros del periodo #{periodId}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Identificación</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead>Trimestre</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Dependencia</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay registros para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.identificacion}</TableCell>
                  <TableCell>{`${r.nombres ?? ""} ${r.apellidos ?? ""}`.trim() || "—"}</TableCell>
                  <TableCell>{(r.servicio ?? "").trim() || "Sin servicio"}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={r.actividad}>
                    {(r.actividad ?? "").trim() || "—"}
                  </TableCell>
                  <TableCell>{(r.trimestre ?? "").trim() || "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={r.programa_academico ?? ""}>
                    {r.programa_academico ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate" title={r.dependencia ?? ""}>
                    {r.dependencia ?? "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" onClick={() => openEdit(r)} title="Editar">
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => openDelete(r)}
                      title="Eliminar"
                    >
                      <Delete className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Modal Editar */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Identificación</Label>
                <Input
                  value={selected.identificacion}
                  onChange={(e) => setSelected({ ...selected, identificacion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sexo</Label>
                <Input
                  value={selected.sexo ?? ""}
                  onChange={(e) => setSelected({ ...selected, sexo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input
                  value={selected.nombres ?? ""}
                  onChange={(e) => setSelected({ ...selected, nombres: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={selected.apellidos ?? ""}
                  onChange={(e) => setSelected({ ...selected, apellidos: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Programa académico</Label>
                <Input
                  value={selected.programa_academico ?? ""}
                  onChange={(e) => setSelected({ ...selected, programa_academico: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Dependencia</Label>
                <Input
                  value={selected.dependencia ?? ""}
                  onChange={(e) => setSelected({ ...selected, dependencia: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Servicio</Label>
                <Input
                  value={selected.servicio ?? ""}
                  onChange={(e) => setSelected({ ...selected, servicio: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Actividad</Label>
                <Input
                  value={selected.actividad ?? ""}
                  onChange={(e) => setSelected({ ...selected, actividad: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Trimestre</Label>
                <Input
                  value={selected.trimestre ?? ""}
                  onChange={(e) => setSelected({ ...selected, trimestre: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input
                  value={selected.responsable ?? ""}
                  onChange={(e) => setSelected({ ...selected, responsable: e.target.value })}
                />
              </div>

              <DialogFooter className="md:col-span-2">
                <Button variant="ghost" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateRow}>Guardar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Modal Eliminar */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(v) => {
          setDeleteOpen(v);
          if (!v) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar registro</DialogTitle>
            <DialogDescription>
              ¿Eliminar el registro de <strong>{selected?.identificacion}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteRow}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}