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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  Search,
  Filter,
  ArrowLeft,
  CalendarDays,
  Users,
  ClipboardCheck,
  BarChart3,
  LayoutGrid,
  List,
  User,
  BookOpen,
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
import { type ElementType, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/* =========================
   TIPOS
========================= */

type AsistenciaRaw = {
  id?: number;

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
  nota_1?: number | string | null;
  nota_2?: number | string | null;
  nota_3?: number | string | null;
  definitiva?: number | string | null;
  final?: number | string | null;

  // compat si backend manda ya agrupado
  estudiante?: string;
  codigo?: string;
  programa?: string;

  estado?: string;
  [key: string]: unknown;
};

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
  asignatura_id: number;
  materia?: string | null;
  tutores?: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol?: string | null;
  }>;
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

const s = (v: unknown) => String(v ?? "").trim();
const lower = (v: unknown) => s(v).toLowerCase();

function normalizeFechas(fecha: unknown): string[] {
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

function getSexoBadge(sexo: unknown): {
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
  nota_1?: number | string | null;
  nota_2?: number | string | null;
  nota_3?: number | string | null;
  definitiva?: number | string | null;
  final?: number | string | null;
  estado?: string;
};

function normalizeEvent(a: AsistenciaRaw): EventRow | null {
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
    nota_1: a?.nota_1 as number | string | null | undefined,
    nota_2: a?.nota_2 as number | string | null | undefined,
    nota_3: a?.nota_3 as number | string | null | undefined,
    definitiva: a?.definitiva as number | string | null | undefined,
    final: a?.final as number | string | null | undefined,
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
  nota_1?: number | string | null;
  nota_2?: number | string | null;
  nota_3?: number | string | null;
  definitiva?: number | string | null;
  final?: number | string | null;
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

function getAttendanceBadge(total: number) {
  if (total >= 8) return "default" as const;
  if (total >= 4) return "secondary" as const;
  return "outline" as const;
}

function toNumberOrNull(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatNota(value: unknown) {
  const nota = toNumberOrNull(value);
  return nota === null ? "—" : nota.toFixed(2);
}

function getNotaColor(nota: number | null) {
  if (nota === null) return "text-muted-foreground";
  if (nota >= 4.5) return "text-emerald-600";
  if (nota >= 3.5) return "text-blue-600";
  if (nota >= 3.0) return "text-amber-600";
  return "text-rose-600";
}

function getNotaBgColor(nota: number | null) {
  if (nota === null) return "bg-muted text-muted-foreground";
  if (nota >= 4.5) return "bg-emerald-100 text-emerald-800";
  if (nota >= 3.5) return "bg-blue-100 text-blue-800";
  if (nota >= 3.0) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function calcNotaFinal(row: Pick<StudentRow, "nota_1" | "nota_2" | "nota_3" | "definitiva" | "final">) {
  const final = toNumberOrNull(row.final);
  if (final !== null) return final;

  const definitiva = toNumberOrNull(row.definitiva);
  if (definitiva !== null) return definitiva;

  const c1 = toNumberOrNull(row.nota_1);
  const c2 = toNumberOrNull(row.nota_2);
  const c3 = toNumberOrNull(row.nota_3);

  if (c1 === null || c2 === null || c3 === null) return null;

  return Math.round((c1 * 0.3 + c2 * 0.35 + c3 * 0.35) * 100) / 100;
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: ElementType;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function StudentCard({
  student,
  onOpen,
}: {
  student: StudentRow;
  onOpen: (student: StudentRow) => void;
}) {
  const sexo = getSexoBadge(student.sexo);
  const hasPriority = s(student.grupo_priorizado) && s(student.grupo_priorizado) !== "—";
  const notaFinal = calcNotaFinal(student);

  return (
    <Card className="border-border/70 transition-colors hover:border-primary/30">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{student.nombreCompleto}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{student.identificacion}</span>
                <Badge variant="outline" className="font-mono">
                  {student.codigo}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={getAttendanceBadge(student.total_asistencias)}>
              {student.total_asistencias} asist.
            </Badge>
            <div className={`min-w-[72px] rounded-lg px-3 py-2 text-center ${getNotaBgColor(notaFinal)}`}>
              <div className="text-lg font-bold leading-none">
                {notaFinal === null ? "—" : notaFinal.toFixed(1)}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-75">
                Final
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="max-w-full">
            <BookOpen className="mr-1 h-3 w-3" />
            <span className="truncate">{student.programa}</span>
          </Badge>
          <Badge variant={sexo.variant}>{sexo.text}</Badge>
          {hasPriority ? (
            <Badge variant="secondary" className="max-w-full">
              <span className="truncate">{student.grupo_priorizado}</span>
            </Badge>
          ) : null}
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-2">
          {[
            ["C1", student.nota_1],
            ["C2", student.nota_2],
            ["C3", student.nota_3],
            ["NF", notaFinal],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className={`rounded-lg px-2 py-2 text-center ${getNotaBgColor(toNumberOrNull(value))}`}
            >
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</div>
              <div className="mt-1 text-sm font-semibold">{formatNota(value)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {student.fechas.length} fecha{student.fechas.length === 1 ? "" : "s"} registrada
            {student.fechas.length === 1 ? "" : "s"}
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => onOpen(student)}>
            <CalendarDays className="h-4 w-4" />
            Ver fechas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
      <DialogContent className="max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Detalle de fechas
          </DialogTitle>
          <DialogDescription>
            Fechas registradas de asistencia para el estudiante seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">{estudiante || "—"}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span>Código:</span>
            <Badge variant="outline" className="font-mono">
              {codigo || "—"}
            </Badge>
            <Badge variant="secondary">
              {ordenadas.length} fecha{ordenadas.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div>
          {ordenadas.length === 0 ? (
            <div className="grid h-[250px] place-items-center text-muted-foreground md:h-[320px]">
              No hay fechas registradas.
            </div>
          ) : (
            <ScrollArea className="h-[250px] pr-3 md:h-[320px]">
              <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 lg:grid-cols-3">
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
          nota_1: e.nota_1,
          nota_2: e.nota_2,
          nota_3: e.nota_3,
          definitiva: e.definitiva,
          final: e.final,
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
        prev.nota_1 = prev.nota_1 ?? e.nota_1;
        prev.nota_2 = prev.nota_2 ?? e.nota_2;
        prev.nota_3 = prev.nota_3 ?? e.nota_3;
        prev.definitiva = prev.definitiva ?? e.definitiva;
        prev.final = prev.final ?? e.final;
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
        r.nota_1,
        r.nota_2,
        r.nota_3,
        calcNotaFinal(r),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [students, searchTerm]);

  const resumen = useMemo(() => {
    const totalEstudiantes = filteredStudents.length;
    const totalAsistencias = filteredStudents.reduce((sum, student) => {
      return sum + student.total_asistencias;
    }, 0);
    const promedioAsistencias = totalEstudiantes > 0 ? totalAsistencias / totalEstudiantes : 0;
    const fechasUnicas = new Set(
      filteredStudents.flatMap((student) => student.fechas.map((fecha) => s(fecha).slice(0, 10)))
    ).size;
    const topStudent = [...filteredStudents].sort(
      (a, b) => b.total_asistencias - a.total_asistencias
    )[0];
    const priorizados = filteredStudents.filter((student) => {
      const valor = s(student.grupo_priorizado);
      return valor && valor !== "—";
    }).length;

    return {
      totalEstudiantes,
      totalAsistencias,
      promedioAsistencias,
      fechasUnicas,
      topStudent,
      priorizados,
    };
  }, [filteredStudents]);

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

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <section className="space-y-4">
          {grupo && (
            <Button
              variant="ghost"
              onClick={() => router.visit(`/asignaturas/${grupo.asignatura_id}`)}
              className="w-fit gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la asignatura
            </Button>
          )}

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {grupo ? `Control de asistencias del grupo ${grupo.nombre}` : "Registro de asistencias"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                  Vista resumida por estudiante con acceso rápido a las fechas registradas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {grupo ? (
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    Código {grupo.codigo}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {students.length} estudiantes
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {resumen.fechasUnicas} jornadas
                </Badge>
                {typeof estadisticas?.porcentaje_asistencia === "number" ? (
                  <Badge variant="outline" className="gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {estadisticas.porcentaje_asistencia.toFixed(1)}% asistencia
                  </Badge>
                ) : null}
              </div>

              {grupo ? (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      {grupo.tutores?.length ? `${grupo.tutores.length} tutor${grupo.tutores.length === 1 ? "" : "es"}` : "Sin tutores"}
                    </Badge>
                    {grupo.tutores?.length ? (
                      grupo.tutores.map((tutor) => (
                        <Badge key={tutor.id} variant="outline" className="max-w-full gap-1">
                          <span className="truncate">
                            {tutor.nombre} {tutor.apellido}
                          </span>
                          {tutor.rol ? (
                            <span className="text-muted-foreground">({tutor.rol})</span>
                          ) : null}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Este grupo no tiene tutores asignados.
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  className="w-full pl-10 sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Exportar
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Estudiantes"
              value={resumen.totalEstudiantes}
              caption={`${students.length} registrados en total`}
              icon={Users}
            />
            <StatCard
              title="Asistencias"
              value={resumen.totalAsistencias}
              caption={`${resumen.fechasUnicas} fechas consolidadas`}
              icon={ClipboardCheck}
            />
            <StatCard
              title="Promedio"
              value={resumen.promedioAsistencias.toFixed(1)}
              caption="asistencias por estudiante"
              icon={BarChart3}
            />
            <StatCard
              title="Mejor registro"
              value={resumen.topStudent?.total_asistencias ?? 0}
              caption={resumen.topStudent?.nombreCompleto ?? "Sin datos"}
              icon={CalendarDays}
            />
          </div>
        </section>

        <Card className="border-border/70">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <CardTitle>Registros por estudiante</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {resumen.priorizados} estudiante{resumen.priorizados === 1 ? "" : "s"} con grupo priorizado
                  {" "}y {filteredStudents.length} visible{filteredStudents.length === 1 ? "" : "s"} en la consulta.
                </p>
              </div>

              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "grid" | "table")}
                className="w-full lg:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                  <TabsTrigger value="grid" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <List className="h-4 w-4" />
                    Tabla
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <p className="text-base font-medium">No hay resultados para la búsqueda actual.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm
                    ? `Ningún estudiante coincide con "${searchTerm}".`
                    : "Todavía no hay asistencias cargadas para este grupo."}
                </p>
              </div>
            ) : (
              <TooltipProvider>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredStudents.map((student) => (
                      <StudentCard key={student.key} student={student} onOpen={openModal} />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[560px] rounded-xl border">
                    <Table>
                      <TableCaption>
                        {`Mostrando ${filteredStudents.length} de ${students.length} estudiantes`}
                      </TableCaption>
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
                          <TableHead className="min-w-[220px]">Estudiante</TableHead>
                          <TableHead className="min-w-[140px]">Identificación</TableHead>
                          <TableHead className="min-w-[120px]">Código</TableHead>
                          <TableHead className="min-w-[220px]">Programa</TableHead>
                          <TableHead className="w-[120px]">Sexo</TableHead>
                          <TableHead className="min-w-[180px]">Priorizado</TableHead>
                          <TableHead className="w-[120px] text-center">Asistencias</TableHead>
                          <TableHead className="w-[90px] text-center">C1</TableHead>
                          <TableHead className="w-[90px] text-center">C2</TableHead>
                          <TableHead className="w-[90px] text-center">C3</TableHead>
                          <TableHead className="w-[100px] text-center">Final</TableHead>
                          <TableHead className="w-[160px] text-center">Fechas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => {
                          const sexo = getSexoBadge(student.sexo);
                          const notaFinal = calcNotaFinal(student);

                          return (
                            <TableRow key={student.key} className="hover:bg-muted/40">
                              <TableCell className="font-medium">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{student.nombreCompleto}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {student.fechas.length} fecha{student.fechas.length === 1 ? "" : "s"} registrada
                                      {student.fechas.length === 1 ? "" : "s"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{student.identificacion}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {student.codigo}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="max-w-[220px] truncate">
                                      {student.programa}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{student.programa}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge variant={sexo.variant}>{sexo.text}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="max-w-[180px] truncate">
                                  {student.grupo_priorizado || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={getAttendanceBadge(student.total_asistencias)}
                                  className="px-3 py-1 font-mono"
                                >
                                  {student.total_asistencias}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-medium ${getNotaColor(toNumberOrNull(student.nota_1))}`}>
                                  {formatNota(student.nota_1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-medium ${getNotaColor(toNumberOrNull(student.nota_2))}`}>
                                  {formatNota(student.nota_2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-medium ${getNotaColor(toNumberOrNull(student.nota_3))}`}>
                                  {formatNota(student.nota_3)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex min-w-[70px] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${getNotaBgColor(notaFinal)}`}
                                >
                                  {notaFinal === null ? "—" : notaFinal.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => openModal(student)}
                                >
                                  <CalendarDays className="h-4 w-4" />
                                  Ver ({student.fechas.length})
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TooltipProvider>
            )}

            <div className="flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {filteredStudents.length} de {students.length} estudiante
                {students.length === 1 ? "" : "s"}.
              </p>
              <p>{searchTerm ? `Filtro activo: "${searchTerm}"` : "Sin filtros aplicados."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
