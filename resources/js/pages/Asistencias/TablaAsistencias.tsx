import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Download,
  Info,
  Printer,
  Search,
  Filter,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/* =========================
   TIPOS
========================= */

type AsistenciaRaw =
  | {
      id: number;

      nombres_del_estudiante?: string;
      apellidos_del_estudiante?: string;
      identificacion?: string;
      codigo_estudiantil?: string;
      programa_academico?: string;
      sexo?: string;
      grupo_priorizado?: string;

      // puede venir como string, array o "2025-09-11, 2025-09-18"
      fecha?: string | string[];

      total_asistencias?: number;

      // compat si backend manda ya agrupado
      estudiante?: string;
      codigo?: string;
      programa?: string;

      estado?: string;
    }
  | Record<string, any>;

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  asignatura_id: number;
}

interface Estadisticas {
  total_estudiantes: number;
  promedio_asistencias: number;
  porcentaje_asistencia: number;
  top_estudiantes: Array<{
    nombre: string;
    asistencias: number;
  }>;
}

interface PageProps {
  asistencias: AsistenciaRaw[] | Record<string, AsistenciaRaw> | null;
  grupo?: Grupo;
  estadisticas?: Estadisticas;
  [key: string]: unknown;
}

/* =========================
   HELPERS
========================= */

const s = (v: any) => String(v ?? "").trim();
const lower = (v: any) => s(v).toLowerCase();

function normalizeFechas(fecha: any): string[] {
  if (Array.isArray(fecha)) {
    return fecha.map(String).map((x) => x.trim()).filter(Boolean);
  }
  const str = s(fecha);
  if (!str) return [];

  return str
    .split(/,|\||;/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatFechaESShort(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSexoBadge(
  sexo: any
): {
  text: string;
  variant: "default" | "secondary" | "destructive" | "outline" | null | undefined;
} {
  const v = lower(sexo);
  if (v === "f" || v === "femenino") return { text: "Femenino", variant: "default" };
  if (v === "m" || v === "masculino") return { text: "Masculino", variant: "secondary" };
  return { text: "—", variant: "outline" };
}

/* =========================
   NORMALIZACIÓN EVENTO (fila individual)
========================= */

type EventRow = {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  identificacion: string;
  codigo: string;
  programa: string;
  sexo: string;
  grupo_priorizado: string;
  fecha: string; // 1 fecha por evento
  estado?: string;
};

function normalizeEvent(a: any): EventRow | null {
  const nombres = s(a?.nombres_del_estudiante);
  const apellidos = s(a?.apellidos_del_estudiante);
  const full = s(`${nombres} ${apellidos}`);

  const estudiante = s(a?.estudiante);
  const nombreCompleto = full || estudiante || "";

  const identificacion = s(a?.identificacion);
  const codigo = s(a?.codigo_estudiantil) || s(a?.codigo);

  if (!identificacion && !codigo) return null;

  const fechas = normalizeFechas(a?.fecha);
  const fecha = fechas[0] || s(a?.fecha);
  if (!fecha) return null;

  return {
    id: Number(a?.id ?? 0),
    nombres: nombres || (nombreCompleto || "—"),
    apellidos: apellidos || "",
    nombreCompleto: nombreCompleto || "—",
    identificacion: identificacion || "—",
    codigo: codigo || "—",
    programa: s(a?.programa_academico) || s(a?.programa) || "—",
    sexo: s(a?.sexo) || "—",
    grupo_priorizado: s(a?.grupo_priorizado) || "—",
    fecha,
    // ✅ corregido
    estado: a?.estado ? s(a?.estado) : undefined,
  };
}

/* =========================
   AGRUPAR POR ESTUDIANTE
========================= */

type StudentRow = {
  key: string;
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  identificacion: string;
  codigo: string;
  programa: string;
  sexo: string;
  grupo_priorizado: string;
  fechas: string[];
  total_asistencias: number;
  estado?: string;
};

function studentKey(e: EventRow) {
  const id = s(e.identificacion) !== "—" ? s(e.identificacion) : "";
  const cod = s(e.codigo) !== "—" ? s(e.codigo) : "";
  return id ? `id:${id}` : `cod:${cod}`;
}

function mergePrefer(oldV: string, newV: string) {
  const a = s(oldV);
  const b = s(newV);
  if (!a || a === "—") return b || oldV;
  return oldV;
}

/* =========================
   MODAL FECHAS (SHADCN)
========================= */

function FechasDialog({
  open,
  onOpenChange,
  estudiante,
  codigo,
  fechas,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  estudiante: string;
  codigo: string;
  fechas: string[];
}) {
  const ordenadas = useMemo(() => {
    return [...(fechas ?? [])].sort((a, b) => {
      const ta = new Date(a).getTime();
      const tb = new Date(b).getTime();
      if (Number.isNaN(ta) || Number.isNaN(tb)) return String(a).localeCompare(String(b));
      return ta - tb;
    });
  }, [fechas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Detalle de fechas
          </DialogTitle>

          <div className="mt-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{estudiante || "—"}</div>
            <div className="mt-1">
              Código:{" "}
              <Badge variant="outline" className="font-mono">
                {codigo || "—"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Body scroll */}
        <div className="flex-1 overflow-hidden">
          {ordenadas.length === 0 ? (
            <div className="h-full grid place-items-center text-muted-foreground">
              No hay fechas registradas.
            </div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
                {ordenadas.map((f) => (
                  <div
                    key={f}
                    className="rounded-xl border bg-card p-3 hover:bg-muted/40 transition"
                  >
                    <div className="text-sm font-semibold">{formatFechaESShort(f)}</div>
                    <div className="mt-1 text-xs text-muted-foreground font-mono">{f}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   COMPONENTE
========================= */

export default function TablaAsistencias() {
  const { asistencias, grupo, estadisticas } = usePage<PageProps>().props;
  const [searchTerm, setSearchTerm] = useState("");

  const [openFechas, setOpenFechas] = useState(false);
  const [modalCtx, setModalCtx] = useState<{
    estudiante: string;
    codigo: string;
    fechas: string[];
  }>({ estudiante: "", codigo: "", fechas: [] });

  const rawArray = useMemo(() => {
    if (Array.isArray(asistencias)) return asistencias;
    if (asistencias) return Object.values(asistencias);
    return [];
  }, [asistencias]);

  // eventos individuales (1 fila = 1 fecha)
  const events = useMemo<EventRow[]>(() => {
    return rawArray.map(normalizeEvent).filter(Boolean) as EventRow[];
  }, [rawArray]);

  // agrupar por estudiante
  const students = useMemo<StudentRow[]>(() => {
    const map = new Map<string, StudentRow>();

    for (const e of events) {
      const key = studentKey(e);
      const prev = map.get(key);

      if (!prev) {
        map.set(key, {
          key,
          id: e.id,
          nombres: e.nombres,
          apellidos: e.apellidos,
          nombreCompleto: e.nombreCompleto,
          identificacion: e.identificacion,
          codigo: e.codigo,
          programa: e.programa,
          sexo: e.sexo,
          grupo_priorizado: e.grupo_priorizado,
          fechas: [e.fecha],
          total_asistencias: 1,
          estado: e.estado,
        });
      } else {
        if (!prev.fechas.includes(e.fecha)) prev.fechas.push(e.fecha);

        prev.nombres = mergePrefer(prev.nombres, e.nombres);
        prev.apellidos = mergePrefer(prev.apellidos, e.apellidos);
        prev.nombreCompleto = mergePrefer(prev.nombreCompleto, e.nombreCompleto);
        prev.codigo = mergePrefer(prev.codigo, e.codigo);
        prev.programa = mergePrefer(prev.programa, e.programa);
        prev.sexo = mergePrefer(prev.sexo, e.sexo);
        prev.grupo_priorizado = mergePrefer(prev.grupo_priorizado, e.grupo_priorizado);
        prev.estado = prev.estado ?? e.estado;

        prev.total_asistencias = prev.fechas.length;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, "es")
    );
  }, [events]);

  // filtro por estudiante (ya agrupados)
  const filteredStudents = useMemo(() => {
    const term = lower(searchTerm).trim();
    if (!term) return students;

    return students.filter((r) => {
      const blob = [
        r.nombreCompleto,
        r.identificacion,
        r.codigo,
        r.programa,
        r.sexo,
        r.grupo_priorizado,
        r.total_asistencias,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [students, searchTerm]);

  const handleExport = (fmt: "csv" | "pdf") => {
    toast.info(`Exportando datos en formato ${fmt.toUpperCase()}...`);
  };

  const openModal = (r: StudentRow) => {
    setModalCtx({
      estudiante: r.nombreCompleto,
      codigo: r.codigo,
      fechas: r.fechas,
    });
    setOpenFechas(true);
  };

  return (
    <AppLayout>
      <Head title="Asistencias" />

      {/* ✅ Modal ShadCN, mismo estilo de tu app */}
      <FechasDialog
        open={openFechas}
        onOpenChange={setOpenFechas}
        estudiante={modalCtx.estudiante}
        codigo={modalCtx.codigo}
        fechas={modalCtx.fechas}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3">
          {grupo && (
            <Button
              variant="link"
              onClick={() => router.visit(`/asignaturas/${grupo.asignatura_id}`)}
              className="text-blue-500 w-fit p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver atrás
            </Button>
          )}

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {grupo ? `Asistencias del grupo ${grupo.nombre}` : "Registro de asistencias"}
              </h1>
              {grupo && (
                <p className="text-sm text-muted-foreground mt-1">
                  Código: {grupo.codigo} • {students.length} estudiantes
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  className="pl-10 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Exportar
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <Printer className="mr-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {grupo && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="w-64">
                      <div className="grid gap-1">
                        <div className="flex justify-between">
                          <span>Total estudiantes:</span>
                          <span className="font-medium">
                            {estadisticas?.total_estudiantes ?? students.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Asistencia promedio:</span>
                          <span className="font-medium">
                            {estadisticas?.promedio_asistencias?.toFixed(2) ?? "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Porcentaje asistencia:</span>
                          <span className="font-medium">
                            {estadisticas?.porcentaje_asistencia?.toFixed(1) ?? "0"}%
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas (si vienen) */}
        {estadisticas?.top_estudiantes && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mejor asistencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas.top_estudiantes[0]?.asistencias || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas.top_estudiantes[0]?.nombre || "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Promedio general</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.promedio_asistencias?.toFixed(1) ?? "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas?.porcentaje_asistencia?.toFixed(1) ?? "0.0"}% de asistencia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.total_estudiantes ?? students.length}
                </div>
                <p className="text-xs text-muted-foreground">{students.length} estudiantes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla */}
        <TooltipProvider>
          <ScrollArea className="rounded-md border h-[600px]">
            <Table className="relative">
              <TableCaption className="my-4">
                {filteredStudents.length > 0
                  ? `Mostrando ${filteredStudents.length} de ${students.length} estudiantes`
                  : "No se encontraron resultados"}
              </TableCaption>

              {/* ✅ Header NO sticky + z-index bajo */}
              <TableHeader className="relative z-[1] bg-background border-b">
                <TableRow>
                  <TableHead className="min-w-[220px]">Estudiante</TableHead>
                  <TableHead className="min-w-[140px]">Identificación</TableHead>
                  <TableHead className="min-w-[120px]">Código</TableHead>
                  <TableHead className="min-w-[220px]">Programa</TableHead>
                  <TableHead className="w-[120px]">Sexo</TableHead>
                  <TableHead className="min-w-[180px]">Grupo</TableHead>
                  <TableHead className="text-center w-[120px]">Asistencias</TableHead>
                  <TableHead className="text-center w-[160px]">Fechas</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((r) => {
                    const sexo = getSexoBadge(r.sexo);

                    return (
                      <TableRow key={r.key} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{r.nombres}</span>
                            {r.apellidos ? (
                              <span className="text-sm text-muted-foreground">{r.apellidos}</span>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>{r.identificacion}</TableCell>

                        <TableCell>
                          <Badge variant="outline">{r.codigo}</Badge>
                        </TableCell>

                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="max-w-[220px] truncate">
                                {r.programa}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{r.programa}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Badge variant={sexo.variant}>{sexo.text}</Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">{r.grupo_priorizado || "—"}</Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={
                              r.total_asistencias > 5
                                ? "default"
                                : r.total_asistencias > 0
                                ? "secondary"
                                : "destructive"
                            }
                            className="px-3 py-1 font-mono"
                          >
                            {r.total_asistencias}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2"
                            onClick={() => openModal(r)}
                          >
                            <CalendarDays className="h-4 w-4" />
                            Ver ({r.fechas.length})
                          </Button>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              r.estado === "activo"
                                ? "default"
                                : r.estado === "inactivo"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {r.estado || "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {searchTerm
                        ? `No se encontraron resultados para "${searchTerm}"`
                        : "No hay registros de asistencias"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TooltipProvider>
      </div>
    </AppLayout>
  );
}
