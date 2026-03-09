import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Users,
  Search,
  Calendar,
  ArrowLeft,
  CalendarDays,
  FileText,
  User,
  BookOpen,
  TrendingUp,
  Filter,
  Download,
  BarChart3,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Hash,
} from "lucide-react";

/* =========================
   TIPOS
========================= */

interface AsistenciaOcaRow {
  id: number;
  estudiante: string;
  codigo: string;
  programa: string;
  sexo: string;
  grupo_priorizado: string;
  total_asistencias: number;
  fecha: string | string[];
  fechas?: string[];

  asignatura_texto?: string | null;
  grupo_texto?: string | null;

  nota_1?: number | null;
  nota_2?: number | null;
  nota_3?: number | null;
  definitiva?: number | null;
  final?: number | null;
}

interface Props {
  window: { id: number; name: string };
  windows?: Array<{ id: number; name: string }>;
  asistencias: AsistenciaOcaRow[] | Record<string, AsistenciaOcaRow> | null;
}

/* =========================
   HELPERS
========================= */

function toNumberOrNull(v: any): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatNota(v?: number | null) {
  const n = toNumberOrNull(v);
  if (n === null) return "—";
  return n.toFixed(2);
}

function getNotaColor(nota: number | null): string {
  if (nota === null) return "text-muted-foreground dark:text-slate-400";
  if (nota >= 4.5) return "text-emerald-600 dark:text-emerald-400";
  if (nota >= 3.5) return "text-blue-600 dark:text-blue-400";
  if (nota >= 3.0) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function getNotaBgColor(nota: number | null): string {
  if (nota === null) return "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-300";
  if (nota >= 4.5) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (nota >= 3.5) return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
  if (nota >= 3.0) return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300";
}

function calcNotaFinal(a: AsistenciaOcaRow): number | null {
  const c1 = toNumberOrNull(a.nota_1);
  const c2 = toNumberOrNull(a.nota_2);
  const c3 = toNumberOrNull(a.nota_3);

  if (c1 === null || c2 === null || c3 === null) return null;

  const nf = c1 * 0.3 + c2 * 0.35 + c3 * 0.35;
  return Math.round(nf * 100) / 100;
}

function normalizeFechas(fecha: AsistenciaOcaRow["fecha"]): string[] {
  if (Array.isArray(fecha)) return fecha.filter(Boolean).map(String);

  const s = String(fecha ?? "").trim();
  if (!s) return [];

  return s
    .split(/,|\||;/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toDateSafe(dateStr: string): Date | null {
  const iso = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatFechaBonitaES(dateStr: string) {
  const d = toDateSafe(dateStr);
  if (!d) return dateStr;

  const parts = d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return parts.replace(/\./g, "");
}

/* =========================
   COMPONENTES AUXILIARES
========================= */

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color?: string 
}) {
  const colorClasses = {
    blue: "bg-blue-100 border-blue-200 dark:bg-blue-500/15 dark:border-blue-500/30",
    emerald: "bg-emerald-100 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30",
    amber: "bg-amber-100 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    violet: "bg-violet-100 border-violet-200 dark:bg-violet-500/15 dark:border-violet-500/30",
    rose: "bg-rose-100 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
  };

  const iconClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="rounded-xl border bg-card dark:border-slate-800 dark:bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-foreground dark:text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-2 shrink-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconClasses[color as keyof typeof iconClasses]}`} />
        </div>
      </div>
    </div>
  );
}

function StudentCardOcasional({ 
  student, 
  onViewDates 
}: { 
  student: AsistenciaOcaRow; 
  onViewDates: (student: AsistenciaOcaRow) => void 
}) {
  const nf = toNumberOrNull(student.final) ?? toNumberOrNull(student.definitiva) ?? calcNotaFinal(student);
  const fechas = student.fechas?.length ? student.fechas : normalizeFechas(student.fecha);
  const isAprobado = nf !== null && nf >= 3.0;
  
  return (
    <div className="group rounded-xl border bg-card dark:border-slate-800 dark:bg-gradient-to-b dark:from-slate-900/60 dark:to-slate-900/40 p-3 md:p-4 hover:border-border dark:hover:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-900/80 transition-all duration-200">
      <div className="space-y-3">
        {/* Header con información del estudiante */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
                <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground dark:text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h6 className="truncate font-semibold text-foreground dark:!text-white text-sm md:text-base">
                  {student.estudiante}
                </h6>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <code className="truncate max-w-[100px] text-xs font-medium text-muted-foreground bg-muted dark:text-slate-400 dark:bg-slate-800/50 px-2 py-0.5 rounded">
                    {student.codigo}
                  </code>
                  {nf !== null && (
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 text-xs ${isAprobado ? 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400' : 'border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400'}`}
                    >
                      {isAprobado ? 'Aprobado' : 'Reprobado'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Nota Final si existe */}
          {nf !== null && (
            <div className="shrink-0">
              <div className={`rounded-lg px-2 md:px-3 py-1 md:py-2 text-center ${getNotaBgColor(nf)}`}>
                <div className="text-base md:text-lg font-bold">
                  {nf.toFixed(1)}
                </div>
                <div className="text-[10px] md:text-xs opacity-80">Final</div>
              </div>
            </div>
          )}
        </div>

        {/* Información de asignatura y grupo */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge 
              variant="secondary" 
              className="text-xs bg-muted text-muted-foreground border-border dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 max-w-full"
            >
              <BookOpen className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">{student.programa}</span>
            </Badge>
            {student.asignatura_texto && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 max-w-full"
              >
                <FileText className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{student.asignatura_texto}</span>
              </Badge>
            )}
            {student.grupo_texto && (
              <Badge 
                variant="outline" 
                className="text-xs border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-500/10 max-w-full"
              >
                <Users className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{student.grupo_texto}</span>
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-border dark:bg-slate-800" />

        {/* Asistencias y Cortes */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {/* Asistencias */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Asistencias</span>
              <span className="text-sm font-bold text-foreground dark:text-white">{student.total_asistencias}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 md:h-8 text-xs bg-muted hover:bg-muted/80 text-blue-600 hover:text-blue-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:text-blue-400 dark:hover:text-blue-300 px-1 md:px-2"
              onClick={() => onViewDates(student)}
            >
              <CalendarDays className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Ver ({fechas.length})</span>
            </Button>
          </div>

          {/* Cortes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Cortes</span>
              <span className="text-xs text-muted-foreground dark:text-slate-500">1·2·3</span>
            </div>
            <div className="flex gap-1">
              {[student.nota_1, student.nota_2, student.nota_3].map((nota, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded px-1 py-1 text-center text-[10px] md:text-xs font-medium truncate ${getNotaBgColor(toNumberOrNull(nota))}`}
                >
                  {formatNota(nota)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   MODAL FECHAS
========================= */

function FechasDialog({
  open,
  onClose,
  estudiante,
  codigo,
  fechas,
}: {
  open: boolean;
  onClose: () => void;
  estudiante: string;
  codigo: string;
  fechas: string[];
}) {
  const sorted = [...fechas]
    .map((f) => String(f).slice(0, 10))
    .filter(Boolean)
    .sort((a, b) => {
      const da = toDateSafe(a)?.getTime() ?? 0;
      const db = toDateSafe(b)?.getTime() ?? 0;
      return da - db;
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] bg-background dark:bg-slate-950 border-border dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 mt-1 dark:bg-blue-500/15">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="truncate font-semibold text-foreground dark:!text-white text-sm md:text-base">
                Detalle de Asistencias
              </DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-slate-400">
                Registro completo de fechas de asistencia
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card dark:border-slate-800 dark:bg-slate-900/40 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <h4 className="truncate font-semibold text-foreground dark:!text-white text-sm md:text-base">{estudiante}</h4>
                <p className="text-sm text-muted-foreground dark:text-slate-400 truncate">Código: {codigo}</p>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-500/30 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 shrink-0">
                {sorted.length} asistencia{sorted.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[250px] md:h-[300px]">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <div className="rounded-full bg-muted p-3 md:p-4 mb-3 dark:bg-slate-800">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/60 dark:text-slate-600" />
                </div>
                <p className="text-muted-foreground font-medium dark:text-slate-400">No hay fechas registradas</p>
                <p className="text-xs md:text-sm text-muted-foreground/70 dark:text-slate-500 mt-1">El estudiante no tiene asistencias registradas</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2 md:pr-4">
                {sorted.map((fecha, index) => (
                  <div
                    key={fecha}
                    className="flex items-center justify-between rounded-lg border bg-card dark:border-slate-800 dark:bg-slate-900/40 p-2 md:p-3 hover:bg-muted/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
                        <span className="text-xs md:text-sm font-medium text-muted-foreground dark:text-slate-300">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground dark:text-white text-sm md:text-base truncate">{formatFechaBonitaES(fecha)}</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-500 truncate">{fecha}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 text-xs">
                      Presente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="border-border text-foreground hover:bg-muted dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-sm"
          >
            Cerrar
          </Button>
          <Button 
            onClick={onClose} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */

export default function AsistenciasOcasionales({ window: reportWindow, windows = [], asistencias }: Props) {
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [fechasDialog, setFechasDialog] = useState<{
    open: boolean;
    estudiante: string;
    codigo: string;
    fechas: string[];
  }>({
    open: false,
    estudiante: "",
    codigo: "",
    fechas: [],
  });

  // Normalizar a array
  const asistenciasArray: AsistenciaOcaRow[] = Array.isArray(asistencias)
    ? asistencias
    : asistencias
    ? Object.values(asistencias)
    : [];

  // Filtrar resultados
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return asistenciasArray;

    return asistenciasArray.filter((a) =>
      [
        a.estudiante,
        a.codigo,
        a.programa,
        a.asignatura_texto,
        a.grupo_texto,
        a.sexo,
        a.grupo_priorizado,
        a.total_asistencias,
        Array.isArray(a.fecha) ? a.fecha.join(", ") : a.fecha,
        a.nota_1,
        a.nota_2,
        a.nota_3,
        a.definitiva,
        a.final,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [asistenciasArray, q]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const notasFinales = filteredRows.map((a) => 
      toNumberOrNull(a.final) ?? toNumberOrNull(a.definitiva) ?? calcNotaFinal(a)
    ).filter((n): n is number => n !== null);
    
    const promedio = notasFinales.length > 0 
      ? notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length 
      : 0;
    
    const aprobados = notasFinales.filter(n => n >= 3.0).length;
    const reprobados = notasFinales.length - aprobados;
    const totalAsistencias = filteredRows.reduce((sum, a) => sum + a.total_asistencias, 0);
    const promedioAsistencias = filteredRows.length > 0 
      ? totalAsistencias / filteredRows.length 
      : 0;
    
    return {
      total: filteredRows.length,
      promedio: promedio.toFixed(1),
      aprobados,
      reprobados,
      totalAsistencias,
      promedioAsistencias: promedioAsistencias.toFixed(1),
    };
  }, [filteredRows]);

  const goHome = () => {
    sessionStorage.setItem("tutorHomeScrollY", String(window.scrollY));
    const params = new URLSearchParams(window.location.search);
    const returnTab = params.get("returnTab") || "grupos";
    const returnWindow = params.get("window") || String(reportWindow.id);

    router.visit(
      route("portal.tutor.home") +
        `?tab=${encodeURIComponent(returnTab)}&window=${encodeURIComponent(returnWindow)}`,
      {
        preserveScroll: true,
      }
    );
  };

  const openFechasModal = (student: AsistenciaOcaRow) => {
    const fechas = student.fechas?.length ? student.fechas : normalizeFechas(student.fecha);
    setFechasDialog({
      open: true,
      estudiante: student.estudiante,
      codigo: student.codigo,
      fechas,
    });
  };

  const availableWindows = windows.length > 0 ? windows : [reportWindow];

  return (
    <>
      <Head title="Asistencias Ocasionales (Consolidado)" />

      <FechasDialog
        open={fechasDialog.open}
        onClose={() => setFechasDialog({ ...fechasDialog, open: false })}
        estudiante={fechasDialog.estudiante}
        codigo={fechasDialog.codigo}
        fechas={fechasDialog.fechas}
      />

      <div className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
          {/* Header Principal */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4">
              <div className="space-y-2 md:space-y-2 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goHome}
                    className="border-border text-foreground hover:bg-muted dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                    Volver
                  </Button>
                  <div className="space-y-1 min-w-0">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground dark:text-white tracking-tight truncate">
                      Asistencias Ocasionales
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400 truncate">
                      Gestión de asistencias ocasionales consolidada
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2 md:px-3 py-1 dark:bg-slate-800/50 min-w-0">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground dark:text-slate-400 shrink-0" />
                    <span className="text-foreground dark:text-slate-300 truncate">
                      {availableWindows.length > 1
                        ? `Todas las entregas (${availableWindows.length})`
                        : (availableWindows[0]?.name ?? reportWindow.name)}
                    </span>
                  </div>
                  {availableWindows.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {availableWindows.map((w) => (
                        <Badge key={w.id} variant="outline" className="text-[10px] md:text-xs">
                          {w.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2 md:px-3 py-1 dark:bg-slate-800/50 min-w-0">
                    <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground dark:text-slate-400 shrink-0" />
                    <span className="text-foreground dark:text-slate-300 truncate">{filteredRows.length} registros</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-start">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border text-foreground hover:bg-muted dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-xs md:text-sm px-2 md:px-3"
                >
                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            {/* Cards de Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
              <StatCard
                title="Total"
                value={stats.total}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Promedio"
                value={stats.promedio}
                icon={TrendingUp}
                color={parseFloat(stats.promedio) >= 3.0 ? "emerald" : "rose"}
              />
              <StatCard
                title="Aprobados"
                value={stats.aprobados}
                icon={CheckCircle}
                color="emerald"
              />
              <StatCard
                title="Reprobados"
                value={stats.reprobados}
                icon={AlertCircle}
                color="rose"
              />
              <StatCard
                title="Asist. Prom"
                value={stats.promedioAsistencias}
                icon={BarChart3}
                color="violet"
              />
            </div>
          </div>

          {/* Panel de Control */}
          <Card className="border-border bg-card dark:border-slate-800 dark:bg-slate-900/40 backdrop-blur-sm">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg md:text-xl text-foreground dark:text-white">
                    Registros de Estudiantes
                  </CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">
                    Gestiona las asistencias ocasionales de los estudiantes
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 md:h-4 md:w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-500" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar estudiante, código..."
                      className="pl-8 md:pl-10 w-full sm:w-[220px] md:w-[280px] bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 text-sm"
                    />
                  </div>
                  
                  <Tabs 
                    defaultValue="grid" 
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as "grid" | "table")}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="bg-muted border border-border dark:bg-slate-900 dark:border-slate-800 p-1 grid grid-cols-2 w-full sm:w-auto">
                      <TabsTrigger 
                        value="grid" 
                        className="data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 text-xs px-2 md:px-3 py-1.5"
                      >
                        Grid
                      </TabsTrigger>
                      <TabsTrigger 
                        value="table" 
                        className="data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 text-xs px-2 md:px-3 py-1.5"
                      >
                        Tabla
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center rounded-lg border-2 border-dashed border-border bg-muted/30 dark:border-slate-800 dark:bg-slate-900/20">
                  <div className="rounded-full bg-muted p-3 md:p-4 mb-3 md:mb-4 dark:bg-slate-800">
                    <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/60 dark:text-slate-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground dark:text-slate-300 mb-2">
                    No se encontraron resultados
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-500 max-w-md px-4">
                    {q 
                      ? `No hay registros que coincidan con "${q}"`
                      : "No hay asistencias ocasionales para esta ventana"}
                  </p>
                  {q && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setQ("")}
                      className="mt-3 md:mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs md:text-sm"
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filteredRows.map((student) => (
                    <StudentCardOcasional
                      key={student.id}
                      student={student}
                      onViewDates={openFechasModal}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border dark:border-slate-800 overflow-hidden">
                  <ScrollArea className="h-[400px] md:h-[500px] w-full">
                    <div className="min-w-[800px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800">
                          <tr className="text-left text-xs md:text-sm">
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Estudiante</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Código</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Asignatura</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Grupo</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Asist</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">C1</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">C2</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">C3</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Final</th>
                            <th className="py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground dark:text-slate-300">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-slate-800">
                          {filteredRows.map((student) => {
                            const nf = toNumberOrNull(student.final) ?? toNumberOrNull(student.definitiva) ?? calcNotaFinal(student);
                            const fechas = student.fechas?.length ? student.fechas : normalizeFechas(student.fecha);

                            return (
                              <tr key={student.id} className="hover:bg-muted/30 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
                                      <User className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground dark:text-slate-300" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-foreground dark:text-white text-xs md:text-sm truncate max-w-[120px] md:max-w-[180px]">
                                        {student.estudiante}
                                      </p>
                                      <p className="text-[10px] md:text-xs text-muted-foreground dark:text-slate-500 truncate max-w-[120px] md:max-w-[180px]">
                                        {student.programa}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <code className="rounded bg-muted px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs text-muted-foreground font-mono dark:bg-slate-800 dark:text-slate-300">
                                    {student.codigo}
                                  </code>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                                    <span className="text-foreground dark:text-slate-300 text-xs md:text-sm truncate max-w-[120px]">
                                      {student.asignatura_texto || "—"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <span className="text-foreground dark:text-slate-300 text-xs md:text-sm truncate block max-w-[100px]">
                                    {student.grupo_texto || "—"}
                                  </span>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <Badge 
                                    variant="outline" 
                                    className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/10 text-[10px] md:text-xs px-1.5 md:px-2 py-0"
                                  >
                                    {student.total_asistencias}
                                  </Badge>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <span className={`font-medium text-xs md:text-sm ${getNotaColor(toNumberOrNull(student.nota_1))}`}>
                                    {formatNota(student.nota_1)}
                                  </span>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <span className={`font-medium text-xs md:text-sm ${getNotaColor(toNumberOrNull(student.nota_2))}`}>
                                    {formatNota(student.nota_2)}
                                  </span>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <span className={`font-medium text-xs md:text-sm ${getNotaColor(toNumberOrNull(student.nota_3))}`}>
                                    {formatNota(student.nota_3)}
                                  </span>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <div className={`rounded px-1.5 md:px-2 py-0.5 md:py-1 text-center font-bold text-xs md:text-sm ${getNotaBgColor(nf)}`}>
                                    {nf !== null ? nf.toFixed(1) : "—"}
                                  </div>
                                </td>
                                <td className="py-2 md:py-3 px-2 md:px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 md:h-8 text-[10px] md:text-xs bg-muted hover:bg-muted/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 px-1.5 md:px-2"
                                    onClick={() => openFechasModal(student)}
                                  >
                                    <CalendarDays className="h-3 w-3 mr-1" />
                                    <span className="hidden md:inline">Ver</span>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Pie de página con información */}
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground dark:text-slate-400">
                  <Filter className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                  <span className="truncate">
                    Filtrado por: <span className="font-semibold text-foreground dark:text-slate-300">
                      {q ? `"${q}"` : "todos los registros"}
                    </span>
                  </span>
                </div>
                <div className="text-muted-foreground dark:text-slate-500">
                  Mostrando <span className="font-semibold text-foreground dark:text-slate-300">{filteredRows.length}</span> de{" "}
                  <span className="font-semibold text-foreground dark:text-slate-300">{asistenciasArray.length}</span> registros
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
