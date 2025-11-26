import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import ProfileSection from "@/components/component/profile-section";
import Estado from "@/components/component/estado";

import {
  LogOut,
  User,
  FileText,
  Upload,
  Folder,
  HelpCircle,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Users,
  Building,
  Info
} from "lucide-react";

type Asignatura = { id: number; nombre: string; codigo?: string };
type Carrera = { id: number; nombre: string };

type TutorPayload = {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  tipo_documento: string;
  documento: string;
  lugar_expedicion: string;
  sexo: string;
  grupo_priorizado: string;
  sede: string;
  correo: string;
  telefono: string;
  activo: boolean;
  ultimo_ingreso_at?: string | null;
  carrera_id: number | null;
  carrera?: Carrera | null;
  asignaturas: Asignatura[];
  tipo_resolucion?: "R1" | "R2";
};

type PeriodDTO = {
  id: number;
  code: string;
  name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null
};

type WindowDTO = {
  id: number;
  name: string;
  category?: string | null;
  instructions?: string | null;
  open_at: string;
  due_at?: string | null;
  close_at?: string | null;
  tutor_type: "R1" | "R2";
  is_published: boolean;
  period: { id: number; code: string; name?: string | null };
  report: {
    id: number;
    status: "pending" | "submitted" | "approved" | "rejected";
    submitted_at?: string | null
  } | null;
};

type PageProps = {
  tutor: TutorPayload;
  periods: PeriodDTO[];
  windowsAssigned: WindowDTO[];
  stats?: { total_windows: number; pending: number; submitted: number };
};

function LogoutButton() {
  const onClick = () => router.post(route("portal.tutor.logout"));
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <LogOut className="h-4 w-4" />
      Salir
    </Button>
  );
}

/** Sincroniza pestaña con ?tab= */
function useSyncedTab(defaultTab: string) {
  const getInitial = () => {
    if (typeof window === "undefined") return defaultTab;
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || defaultTab;
  };
  const [tab, setTabState] = useState<string>(getInitial);

  useEffect(() => {
    const onPop = () => setTabState(getInitial());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = (value: string) => {
    setTabState(value);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", value);
      window.history.replaceState({}, "", url.toString());
    }
  };
  return { tab, setTab };
}

/** Chips sólidos de estado */
const StatusBadge = ({ status }: { status?: string | null }) => {
  const s = status ?? "pending";
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  const classes =
    s === "submitted" ? "bg-blue-600 text-white" :
    s === "approved"  ? "bg-emerald-600 text-white" :
    s === "rejected"  ? "bg-red-600 text-white" :
                        "bg-black text-white";
  const label =
    s === "submitted" ? "Enviado" :
    s === "approved"  ? "Aprobado" :
    s === "rejected"  ? "Rechazado" : "Pendiente";
  return <span className={`${base} ${classes}`}>{label}</span>;
};

export default function Dashboard() {
  const { props } = usePage<PageProps>();
  const { tutor, periods = [], windowsAssigned = [], stats } = props;
  const { tab, setTab } = useSyncedTab("perfil");
  const [selectedWindow, setSelectedWindow] = useState<WindowDTO | null>(null);

  // Intl memoizada
  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
    []
  );
  const formatDate = (s: string) => dtf.format(new Date(s));

  // Lógica ventana
  const canUploadNow = (w: WindowDTO) => {
    const now = new Date();
    const open = new Date(w.open_at);
    const close = w.close_at ? new Date(w.close_at) : null;
    const within = now >= open && (!close || now <= close);
    const pending = !w.report || w.report.status === "pending" || w.report.status === "rejected";
    return within && pending;
  };

  // FX livianas
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const itemVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.18 } } };

  // Skeleton percepción
  const [informesReady, setInformesReady] = useState(false);
  useEffect(() => {
    if (tab === "informes") {
      setInformesReady(false);
      const id = window.setTimeout(() => setInformesReady(true), 150);
      return () => window.clearTimeout(id);
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header
          className="mb-4 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-3xl">Hola, {tutor.nombre} 👋</h1>
              <p className="text-slate-600 text-sm sm:text-base">Bienvenido/a al Portal del Tutor - Gestión de informes académicos</p>
            </div>
            <div className="flex">
              <LogoutButton />
            </div>
          </div>
        </motion.header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
          {/* Stats */}
          {stats && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-full bg-blue-50 p-2.5 sm:p-3">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Total de Informes</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total_windows}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-full bg-amber-50 p-2.5 sm:p-3">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Pendientes</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-full bg-emerald-50 p-2.5 sm:p-3">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Enviados</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.submitted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main */}
          <Card className="border border-slate-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">Panel de Control</CardTitle>
              <CardDescription className="text-sm sm:text-base">Gestiona tus informes y accede a todas las funcionalidades del portal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                {/* Tabs scrollable en móvil */}
                <TabsList
                  className="w-full justify-start gap-1 sm:gap-2 border-b bg-transparent px-3 sm:px-6 pb-0 overflow-x-auto flex-nowrap
                  [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <TabsTrigger value="perfil" className="text-xs sm:text-sm gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    <User className="h-4 w-4" /> <span>Perfil</span>
                  </TabsTrigger>
                  <TabsTrigger value="informes" className="text-xs sm:text-sm gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    <FileText className="h-4 w-4" /> <span>Mis Informes</span>
                  </TabsTrigger>
                  <TabsTrigger value="subir" className="text-xs sm:text-sm gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    <Upload className="h-4 w-4" /> <span>Subir Informe</span>
                  </TabsTrigger>
                  <TabsTrigger value="documentos" className="text-xs sm:text-sm gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    <Folder className="h-4 w-4" /> <span>Documentos</span>
                  </TabsTrigger>
                  <TabsTrigger value="soporte" className="text-xs sm:text-sm gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    <HelpCircle className="h-4 w-4" /> <span>Soporte</span>
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence>
                  {/* PERFIL */}
                  <TabsContent value="perfil" className="p-3 sm:p-6">
                    <motion.div
                      key="perfil"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                        <Card className="border border-slate-200">
                          <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <User className="h-5 w-5" />
                              Perfil Académico
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <ProfileSection tutor={tutor} />
                          </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                          <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <BookOpen className="h-5 w-5" />
                              Estado Actual
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <Estado />
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border border-slate-200">
                        <CardHeader className="p-3 sm:p-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Users className="h-5 w-5" />
                            Información Personal
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 text-sm sm:text-base">
                            <p><span className="font-medium">Nombre:</span> {tutor.nombre} {tutor.apellido}</p>
                            <p><span className="font-medium">Tipo de documento:</span> {tutor.tipo_documento}</p>
                            <p><span className="font-medium">Documento:</span> {tutor.documento}</p>
                            <p><span className="font-medium">Lugar de expedición:</span> {tutor.lugar_expedicion}</p>
                            <p><span className="font-medium">Sexo:</span> {tutor.sexo}</p>
                            <p><span className="font-medium">Grupo priorizado:</span> {tutor.grupo_priorizado}</p>
                            <p><span className="font-medium">Sede:</span> {tutor.sede}</p>
                            <p><span className="font-medium">Carrera:</span> {tutor.carrera?.nombre ?? "—"}</p>
                            <p className="md:col-span-2"><span className="font-medium">Correo:</span> {tutor.correo}</p>
                            <p className="md:col-span-2"><span className="font-medium">Teléfono:</span> {tutor.telefono}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* MIS INFORMES */}
                  <TabsContent value="informes" className="p-3 sm:p-6">
                    <motion.div
                      key="informes"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      <Card className="border border-slate-200">
                        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                          <div className="flex flex-col gap-1 sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-base sm:text-lg">Mis informes</CardTitle>
                            {stats ? (
                              <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
                                <span>Total: {stats.total_windows}</span>
                                <span>• Pendientes: {stats.pending}</span>
                                <span>• Enviados: {stats.submitted}</span>
                              </div>
                            ) : null}
                          </div>
                          <CardDescription className="mt-1 sm:mt-2 flex items-center gap-2 text-xs sm:text-sm">
                            <Info className="h-4 w-4" />
                            Revisa y envía tus informes académicos
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="p-3 sm:p-4">
                          {/* Skeleton */}
                          {!informesReady ? (
                            <div className="space-y-2 sm:space-y-3">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 sm:h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50 animate-pulse" />
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2 sm:space-y-3">
                              {windowsAssigned.length === 0 && (
                                <div className="rounded-lg border border-slate-200 p-4 sm:p-6 text-xs sm:text-sm text-gray-500">
                                  No tienes entregas asignadas por ahora.
                                </div>
                              )}

                              {windowsAssigned.map((w) => {
                                const uploadable = canUploadNow(w);
                                const openLabel = formatDate(w.open_at);
                                const dueLabel = w.due_at ? formatDate(w.due_at) : null;
                                const closeLabel = w.close_at ? formatDate(w.close_at) : null;

                                return (
                                  <motion.div
                                    key={w.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 transition hover:shadow-sm dark:bg-zinc-900"
                                  >
                                    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-1 sm:gap-2 sm:flex-row sm:items-center">
                                          <span className="font-medium text-sm sm:text-base truncate">{w.name}</span>
                                          <div className="flex flex-wrap gap-1">
                                            {w.category ? (
                                              <Badge variant="outline" className="text-[10px] sm:text-xs">{w.category}</Badge>
                                            ) : null}
                                            <Badge variant="secondary" className="text-[10px] sm:text-xs">{w.period.code}</Badge>
                                          </div>
                                        </div>

                                        <div className="mt-2 flex flex-col gap-0.5 sm:gap-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                          <span className="break-words">Apertura: {openLabel}</span>
                                          {dueLabel && <span className="break-words">Vence: {dueLabel}</span>}
                                          {closeLabel && <span className="break-words">Cierra: {closeLabel}</span>}
                                        </div>

                                        {w.instructions && (
                                          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                                            {w.instructions}
                                          </p>
                                        )}
                                      </div>

                                      {/* Acciones (stack en móvil) */}
                                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                        <div className="sm:self-center">
                                          <StatusBadge status={w.report?.status} />
                                        </div>
                                        <Button
                                          size="sm"
                                          disabled={!uploadable}
                                          onClick={() => {
                                            // Reemplazar con ruta real
                                            alert(`Abrir formulario para: ${w.name}`);
                                          }}
                                          className={`w-full sm:w-auto ${uploadable ? "" : "bg-slate-300 text-slate-600 hover:bg-slate-300"}`}
                                        >
                                          {uploadable ? "Subir" : "No disponible"}
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* SUBIR INFORME */}
                  <TabsContent value="subir" className="p-3 sm:p-6">
                    <motion.div
                      key="subir"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      <Card className="border border-slate-200">
                        <CardHeader className="p-3 sm:p-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Upload className="h-5 w-5" />
                            Subir Informe Académico
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Selecciona una entrega disponible para cargar tu informe
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center py-6 sm:py-8">
                            <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                              Gestiona tus informes desde la pestaña "Mis Informes"
                            </h4>
                            <p className="text-slate-600 mb-4 text-sm">
                              Dirígete a la sección de Mis Informes para ver las entregas disponibles y subir tus archivos.
                            </p>
                            <Button onClick={() => setTab("informes")} className="gap-2 w-full sm:w-auto">
                              <FileText className="h-4 w-4" />
                              Ver Mis Informes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* DOCUMENTOS */}
                  <TabsContent value="documentos" className="p-3 sm:p-6">
                    <motion.div
                      key="documentos"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                    >
                      <Card className="border border-slate-200">
                        <CardHeader className="p-3 sm:p-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Folder className="h-5 w-5" />
                            Mis Documentos
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Accede a constancias, observaciones y archivos asociados
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-center py-10 sm:py-12">
                            <Folder className="h-16 w-16 sm:h-20 sm:w-20 text-slate-300 mx-auto mb-3 sm:mb-4" />
                            <h4 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">Próximamente</h4>
                            <p className="text-slate-600 max-w-md mx-auto text-sm">
                              Estamos trabajando en esta sección. Pronto podrás acceder a todos tus documentos,
                              constancias y archivos en un solo lugar.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* SOPORTE */}
                  <TabsContent value="soporte" className="p-3 sm:p-6">
                    <motion.div
                      key="soporte"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                    >
                      <Card className="border border-slate-200">
                        <CardHeader className="p-3 sm:p-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <HelpCircle className="h-5 w-5" />
                            Soporte Técnico
                          </CardTitle>
                          <CardDescription className="text-sm">¿Necesitas ayuda? Estamos aquí para apoyarte</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                            <div className="space-y-3 sm:space-y-4">
                              <h4 className="font-semibold text-slate-900">Contacto Directo</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                                  <Mail className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">Correo de soporte</p>
                                    <p className="text-slate-600 text-sm">bienestar@uniguajira.edu.co</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">Horario de atención</p>
                                    <p className="text-slate-600 text-sm">Lunes a Viernes: 8:00–12:00 / 14:00–18:00</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                              <h4 className="font-semibold text-slate-900">Recursos de Ayuda</h4>
                              <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                  <Download className="h-4 w-4" />
                                  Guía de usuario (PDF)
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                  <FileText className="h-4 w-4" />
                                  Preguntas frecuentes
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Reportar un problema
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sheet detalles */}
      <Sheet open={!!selectedWindow} onOpenChange={(open) => !open && setSelectedWindow(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex-1 text-base sm:text-lg">{selectedWindow?.name}</SheetTitle>
              {selectedWindow?.period?.code ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{selectedWindow.period.code}</Badge>
              ) : null}
            </div>
            <SheetDescription className="text-xs sm:text-sm">Detalles completos de la entrega asignada</SheetDescription>
          </SheetHeader>

          {selectedWindow && (
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <h4 className="font-medium text-slate-900 mb-1.5 sm:mb-2 text-sm">Estado</h4>
                <StatusBadge status={selectedWindow.report?.status} />
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <h4 className="font-medium text-slate-900 mb-1.5 sm:mb-2 text-sm">Fechas importantes</h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-3"><span className="text-slate-600">Apertura:</span><span className="text-right">{formatDate(selectedWindow.open_at)}</span></div>
                  {selectedWindow.due_at && (
                    <div className="flex justify-between gap-3"><span className="text-slate-600">Vencimiento:</span><span className="text-right">{formatDate(selectedWindow.due_at)}</span></div>
                  )}
                  {selectedWindow.close_at && (
                    <div className="flex justify-between gap-3"><span className="text-slate-600">Cierre:</span><span className="text-right">{formatDate(selectedWindow.close_at)}</span></div>
                  )}
                </div>
              </div>

              {selectedWindow.instructions && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <h4 className="font-medium text-slate-900 mb-1.5 sm:mb-2 text-sm">Instrucciones</h4>
                  <p className="text-xs sm:text-sm text-slate-700">{selectedWindow.instructions}</p>
                </div>
              )}

              <div className="pt-1 sm:pt-2">
                <Button
                  className="w-full gap-2"
                  disabled={!canUploadNow(selectedWindow)}
                  onClick={() => {
                    alert(`Abrir formulario para: ${selectedWindow.name}`);
                    setSelectedWindow(null);
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {canUploadNow(selectedWindow) ? "Subir Informe" : "Entrega No Disponible"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
