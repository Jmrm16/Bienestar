import { useEffect, useMemo, useState } from "react";
import {
  Delete,
  PencilLine,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { router, Link } from "@inertiajs/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Tipos
interface Carrera {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  nombre: string;
  carrera_id: number;
  carrera?: Carrera;
}

const ITEMS_PER_PAGE = 10;

export default function TablaAsignatura({
  asignaturas,
  carreras,
}: {
  asignaturas: Asignatura[];
  carreras: Carrera[];
}) {
  // ✅ Filtros
  const [search, setSearch] = useState("");
  const [carreraFilter, setCarreraFilter] = useState("all");

  // ✅ Modales
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);
  const [deleteAsignatura, setDeleteAsignatura] = useState<Asignatura | null>(null);

  const filteredAsignaturas = useMemo(() => {
    const q = search.trim().toLowerCase();

    return asignaturas.filter((a) => {
      const carreraName =
        a.carrera?.nombre ??
        carreras.find((c) => c.id === a.carrera_id)?.nombre ??
        "";

      const matchesSearch =
        !q ||
        a.nombre.toLowerCase().includes(q) ||
        carreraName.toLowerCase().includes(q) ||
        String(a.id).includes(q);

      const matchesCarrera =
        carreraFilter === "all" || String(a.carrera_id) === carreraFilter;

      return matchesSearch && matchesCarrera;
    });
  }, [asignaturas, carreras, search, carreraFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, carreraFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAsignaturas.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedAsignaturas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAsignaturas.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredAsignaturas]);

  const pageStart =
    filteredAsignaturas.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredAsignaturas.length
  );

  const limpiarFiltros = () => {
    setSearch("");
    setCarreraFilter("all");
  };

  const eliminarAsignatura = () => {
    if (!deleteAsignatura) return;

    router.delete(`/asignaturas/${deleteAsignatura.id}`, {
      onSuccess: () => {
        toast.success("Asignatura eliminada correctamente");
        setIsDeleteOpen(false);
        setDeleteAsignatura(null);
      },
      onError: () => toast.error("Error al eliminar la asignatura"),
    });
  };

  const actualizarAsignatura = () => {
    if (!selectedAsignatura) return;

    const payload = {
      nombre: selectedAsignatura.nombre,
      carrera_id: selectedAsignatura.carrera_id,
    };

    router.patch(`/asignaturas/${selectedAsignatura.id}`, payload, {
      onSuccess: () => {
        toast.success("Asignatura actualizada correctamente");
        setIsEditOpen(false);
        setSelectedAsignatura(null);
      },
      onError: () => toast.error("Error al actualizar la asignatura"),
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ✅ FILTROS (estilo TablaTutor) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filtros
          </CardTitle>
          <CardDescription>Busca y filtra asignaturas</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o carrera..."
              />
            </div>
          </div>

          <div>
            <Label>Carrera</Label>
            <Select value={carreraFilter} onValueChange={setCarreraFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {carreras.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={limpiarFiltros} className="w-full">
              Limpiar
            </Button>
          </div>

          <div className="flex items-end text-sm text-muted-foreground">
            Mostrando {filteredAsignaturas.length} de {asignaturas.length}
          </div>
        </CardContent>
      </Card>

      {/* ✅ TABLA */}
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
        <Table>
          <TableCaption>Lista de asignaturas.</TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Carrera</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedAsignaturas.map((asignatura) => (
              <TableRow key={asignatura.id}>
                <TableCell>{asignatura.nombre}</TableCell>

                <TableCell>
                  {asignatura.carrera?.nombre ??
                    carreras.find((c) => c.id === asignatura.carrera_id)?.nombre ??
                    "Sin carrera"}
                </TableCell>

                <TableCell className="text-right space-x-2">
                  {/* Ver Detalles */}
                  <Link href={`/asignaturas/${asignatura.id}`}>
                    <Button variant="ghost">
                      <Eye />
                    </Button>
                  </Link>

                  {/* Modal Editar */}
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedAsignatura(asignatura);
                          setIsEditOpen(true);
                        }}
                      >
                        <PencilLine />
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Asignatura</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={selectedAsignatura?.nombre || ""}
                            onChange={(e) =>
                              setSelectedAsignatura({
                                ...selectedAsignatura!,
                                nombre: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Carrera</Label>
                          <Select
                            value={
                              selectedAsignatura?.carrera_id
                                ? String(selectedAsignatura.carrera_id)
                                : ""
                            }
                            onValueChange={(v) =>
                              setSelectedAsignatura({
                                ...selectedAsignatura!,
                                carrera_id: parseInt(v),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una carrera" />
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

                        <DialogFooter>
                          <Button onClick={actualizarAsignatura}>
                            Guardar Cambios
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Modal Eliminar */}
                  <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setDeleteAsignatura(asignatura);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Delete />
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eliminar Asignatura</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de eliminar{" "}
                          <strong>{deleteAsignatura?.nombre}</strong>?
                        </DialogDescription>
                      </DialogHeader>

                      <DialogFooter>
                        <Button variant="destructive" onClick={eliminarAsignatura}>
                          Eliminar
                        </Button>
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}

            {paginatedAsignaturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No hay resultados con esos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t px-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {pageStart}-{pageEnd} de {filteredAsignaturas.length} asignaturas
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            <span className="min-w-24 text-center text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
