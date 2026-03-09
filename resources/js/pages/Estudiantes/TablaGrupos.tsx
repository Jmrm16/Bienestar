import React, { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { PencilLine, Delete, Search, Eye, X } from "lucide-react";

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

export type EstudianteFilters = {
  q: string;
  servicio: string;
  trimestre: string;
};

export type EstudianteFilterOptions = {
  servicios: string[];
  trimestres: string[];
};

export type EstudiantePagination = {
  data: EstudianteRow[];
  current_page: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  per_page: number;
};

export default function TablaEstudiantes({
  rows,
  periodId,
  filters,
  filterOptions,
}: {
  rows: EstudiantePagination;
  periodId: number;
  filters: EstudianteFilters;
  filterOptions: EstudianteFilterOptions;
}) {
  const textOrDash = (value?: string | null, fallback = "—") => {
    const text = (value ?? "").trim();
    return text !== "" ? text : fallback;
  };

  const [searchDraft, setSearchDraft] = useState(filters.q);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EstudianteRow | null>(null);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  const currentRows = rows.data ?? [];
  const servicios = filterOptions.servicios ?? [];
  const trimestres = filterOptions.trimestres ?? [];
  const hasActiveFilters = Boolean(filters.q || filters.servicio || filters.trimestre);

  const applyFilters = (next?: Partial<EstudianteFilters>, page = 1) => {
    const payload = {
      period_id: periodId || undefined,
      q: (next?.q ?? filters.q) || undefined,
      servicio: (next?.servicio ?? filters.servicio) || undefined,
      trimestre: (next?.trimestre ?? filters.trimestre) || undefined,
      page,
    };

    router.get(route("estudiantes.index"), payload, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    setSearchDraft("");
    applyFilters({ q: "", servicio: "", trimestre: "" });
  };

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
      {
        period_id: periodId || undefined,
        q: filters.q || undefined,
        servicio: filters.servicio || undefined,
        trimestre: filters.trimestre || undefined,
        page: rows.current_page > 1 ? rows.current_page : undefined,
      },
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Registros importados</h2>
          <p className="text-sm text-muted-foreground">
            La búsqueda y los filtros se aplican desde el servidor para evitar cargar todo el período en pantalla.
          </p>
        </div>

        <div className="grid w-full gap-2 md:grid-cols-[minmax(0,1.4fr)_220px_220px_auto_auto] lg:max-w-[980px]">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters({ q: searchDraft.trim() });
                }
              }}
              placeholder="Buscar por nombre, identificación, programa o actividad"
              className="pl-9"
            />
          </div>

          <Select
            value={filters.servicio || "all"}
            onValueChange={(value) =>
              applyFilters({ servicio: value === "all" ? "" : value })
            }
          >
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

          <Select
            value={filters.trimestre || "all"}
            onValueChange={(value) =>
              applyFilters({ trimestre: value === "all" ? "" : value })
            }
          >
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

          <Button
            variant="outline"
            onClick={() => applyFilters({ q: searchDraft.trim() })}
          >
            Buscar
          </Button>

          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasActiveFilters && searchDraft === ""}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Página {rows.current_page}. Mostrando {currentRows.length} registros del período seleccionado.
        </span>
        {hasActiveFilters ? (
          <span>
            Filtros activos:
            {" "}
            {[filters.q && "búsqueda", filters.servicio && "servicio", filters.trimestre && "trimestre"]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Contexto académico</TableHead>
              <TableHead>Seguimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No hay registros para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((r) => (
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

      {(rows.prev_page_url || rows.next_page_url) && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Navegación por páginas para mantener el listado liviano.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!rows.prev_page_url}
              onClick={() => applyFilters({}, Math.max(1, rows.current_page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!rows.next_page_url}
              onClick={() => applyFilters({}, rows.current_page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

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
