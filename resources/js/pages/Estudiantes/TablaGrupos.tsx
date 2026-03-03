import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { PencilLine, Delete, Search, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  servicio: string;  // Opción B => ''
  actividad: string; // Opción B => ''
  responsable?: string | null;
  trimestre: string; // Opción B => ''
};

export default function TablaEstudiantes({
  rows,
  periodId,
}: {
  rows: EstudianteRow[];
  periodId: number;
}) {
  const textOrDash = (value?: string | null, fallback = "—") => {
    const text = (value ?? "").trim();
    return text !== "" ? text : fallback;
  };

  const [q, setQ] = useState("");
  const [servicioFilter, setServicioFilter] = useState("all");
  const [trimestreFilter, setTrimestreFilter] = useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EstudianteRow | null>(null);

  // ✅ Cinturón de seguridad: si por error llega mezclado, igual mostramos SOLO el periodo seleccionado
  const scopedRows = useMemo(() => {
    const pid = Number(periodId) || 0;
    if (!pid) return rows ?? [];
    return (rows ?? []).filter((r) => Number(r.period_id) === pid);
  }, [rows, periodId]);

  const servicios = useMemo(() => {
    const s = new Set<string>();
    (scopedRows ?? []).forEach((r) => s.add((r.servicio ?? "").trim() || "Sin servicio"));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [scopedRows]);

  const trimestres = useMemo(() => {
    const s = new Set<string>();
    (scopedRows ?? []).forEach((r) => s.add((r.trimestre ?? "").trim() || "Sin trimestre"));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [scopedRows]);

  // ✅ Filtra + ordena SIEMPRE
  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    const list = (scopedRows ?? []).filter((r) => {
      const full = `${r.nombres ?? ""} ${r.apellidos ?? ""}`.toLowerCase();
      const ident = (r.identificacion ?? "").toLowerCase();
      const prog = (r.programa_academico ?? "").toLowerCase();
      const dep = (r.dependencia ?? "").toLowerCase();
      const act = (r.actividad ?? "").toLowerCase();

      const matchesText =
        !search ||
        full.includes(search) ||
        ident.includes(search) ||
        prog.includes(search) ||
        dep.includes(search) ||
        act.includes(search);

      const svc = (r.servicio ?? "").trim() || "Sin servicio";
      const tri = (r.trimestre ?? "").trim() || "Sin trimestre";

      const matchesSvc = servicioFilter === "all" || svc === servicioFilter;
      const matchesTri = trimestreFilter === "all" || tri === trimestreFilter;

      return matchesText && matchesSvc && matchesTri;
    });

    // ✅ Orden: servicio → actividad → apellidos → nombres → identificación
    return list.sort((a, b) => {
      const svcA = (a.servicio ?? "").trim().toLowerCase();
      const svcB = (b.servicio ?? "").trim().toLowerCase();
      if (svcA !== svcB) return svcA.localeCompare(svcB);

      const actA = (a.actividad ?? "").trim().toLowerCase();
      const actB = (b.actividad ?? "").trim().toLowerCase();
      if (actA !== actB) return actA.localeCompare(actB);

      const apA = (a.apellidos ?? "").trim().toLowerCase();
      const apB = (b.apellidos ?? "").trim().toLowerCase();
      if (apA !== apB) return apA.localeCompare(apB);

      const nomA = (a.nombres ?? "").trim().toLowerCase();
      const nomB = (b.nombres ?? "").trim().toLowerCase();
      if (nomA !== nomB) return nomA.localeCompare(nomB);

      const idA = (a.identificacion ?? "").trim().toLowerCase();
      const idB = (b.identificacion ?? "").trim().toLowerCase();
      return idA.localeCompare(idB);
    });
  }, [scopedRows, q, servicioFilter, trimestreFilter]);

  const openEdit = (r: EstudianteRow) => {
    setSelected(JSON.parse(JSON.stringify(r)));
    setEditOpen(true);
  };

  const openDelete = (r: EstudianteRow) => {
    setSelected(r);
    setDeleteOpen(true);
  };

  const openShow = (r: EstudianteRow) => {
    router.get(
      route("estudiantes.show", r.id),
      { period_id: periodId },
      { preserveScroll: true, preserveState: true }
    );
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
          <TableCaption>Vista compacta de los registros del período #{periodId}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Contexto académico</TableHead>
              <TableHead>Seguimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No hay registros para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">
                          {`${r.nombres ?? ""} ${r.apellidos ?? ""}`.trim() || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {textOrDash(r.identificacion)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {r.sexo ? <Badge variant="outline">{r.sexo}</Badge> : null}
                        {r.estamento ? (
                          <Badge variant="secondary">{r.estamento}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-1 max-w-[260px]">
                      <p className="font-medium" title={r.programa_academico ?? ""}>
                        {textOrDash(r.programa_academico, "Sin programa")}
                      </p>
                      <p className="text-sm text-muted-foreground" title={r.dependencia ?? ""}>
                        {textOrDash(r.dependencia, "Sin dependencia")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="max-w-[360px] space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {textOrDash(r.servicio, "Sin servicio")}
                        </Badge>
                        <Badge variant="outline">
                          {textOrDash(r.trimestre, "Sin trimestre")}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Actividad</p>
                        <p
                          className="text-sm text-muted-foreground line-clamp-2"
                          title={r.actividad ?? ""}
                        >
                          {textOrDash(r.actividad, "Sin actividad")}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Responsable: {textOrDash(r.responsable, "No registrado")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" onClick={() => openShow(r)} title="Ver detalles">
                      <Eye className="h-4 w-4" />
                    </Button>
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
