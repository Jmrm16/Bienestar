import { Head, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  User,
  Users,
  FileText,
  HelpCircle,
  Eye,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Download,
  BarChart3,
  Star,
  Edit,
  FileSpreadsheet,
  MessageSquare,
  LifeBuoy,
  CalendarDays,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  Award,
  ShieldCheck,
  Target,
  TrendingUp,
  Bell,
  ChevronRight,
  Home,
  Briefcase,
  BookMarked,
  Layers,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Plus,
  Send,
  Globe,
  Trash2,
} from "lucide-react";

/* ───────────────────── TYPES ───────────────────── */

type GrupoAsignado = {
  id: number;
  nombre: string;
  codigo: string;
  carrera?: { nombre: string } | null;
  asignatura?: { nombre: string } | null;
  periodo?: { code: string } | null;
  rol: "principal" | "secundario";
  estudiantes?: number;
  completado: number;
};

type GrupoOcasional = {
  id: string;
  asignatura: string;
  grupo: string;
  estudiantes: number;
  asistencias: number;
};

type WindowDTO = {
  id: number;
  name: string;
  instructions?: string;
  description?: string;
  open_at: string | null;
  due_at: string | null;
  close_at: string | null;
  period: {
    code: string;
    starts_at?: string | null;
    ends_at?: string | null;
  };
  report: {
    status: string;
    submitted_at?: string | null;
  } | null;
};

type TutorPayload = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  sede: string;
  activo: boolean;
  avatar_url?: string;
  fecha_ingreso: string;
  
  especialidades?: string[];
};

interface Props {
  tutor: TutorPayload;
  grupos: GrupoAsignado[];
  ocasionales?: GrupoOcasional[];
  windowsAssigned: WindowDTO[];
  estadisticas?: {
    totalGrupos: number;
    informesCompletados: number;
    informesPendientes: number;
    promedioSatisfaccion: number;
    totalEstudiantes: number;
  };
}

/* ───────────────────── PAGE ───────────────────── */

export default function TutorProfile({
  tutor,
  grupos,
  ocasionales = [],
  windowsAssigned,
  estadisticas = {
    totalGrupos: grupos.length,
    informesCompletados: windowsAssigned.filter(w => w.report?.status === 'completado').length,
    informesPendientes: windowsAssigned.filter(w => !w.report || w.report.status === 'pendiente').length,
    promedioSatisfaccion: 4.5,
    totalEstudiantes: grupos.reduce((acc, g) => acc + (g.estudiantes || 0), 0)
  }
}: Props) {
  const getInitialTab = () => {
    if (typeof window === "undefined") return "perfil";
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") ?? "perfil";
  };

  useEffect(() => {
    const y = sessionStorage.getItem("tutorHomeScrollY");
    if (y) {
      requestAnimationFrame(() => window.scrollTo(0, Number(y)));
      sessionStorage.removeItem("tutorHomeScrollY");
    }
  }, []);

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const getInitials = () => {
    return `${tutor.nombre?.charAt(0) || ""}${tutor.apellido?.charAt(0) || ""}`.toUpperCase() || "TU";
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, color: string, label: string }> = {
      'completado': { 
        variant: 'default', 
        icon: CheckCircle2, 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
        label: 'Completado'
      },
      'pendiente': { 
        variant: 'secondary', 
        icon: Clock, 
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
        label: 'Pendiente'
      },
      'en_progreso': { 
        variant: 'outline', 
        icon: TrendingUp, 
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
        label: 'En progreso'
      },
      'atrasado': { 
        variant: 'destructive', 
        icon: AlertCircle, 
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
        label: 'Atrasado'
      },
    };
    
    return configs[status.toLowerCase()] || configs.pendiente;
  };

  const getExperienceBadge = () => {
    const configs = {
      'junior': { label: 'Junior', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', icon: Star },
      'intermedio': { label: 'Intermedio', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', icon: Award },
      'senior': { label: 'Senior', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400', icon: ShieldCheck }
    };
    
   
    

  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDaysRemaining = (dueAt?: string | null) => {
    if (!dueAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dueAt);
    if (isNaN(deadline.getTime())) return null;
    deadline.setHours(0, 0, 0, 0);
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totalEstudiantesGrupos = grupos.reduce((acc, g) => acc + (g.estudiantes || 0), 0);

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User, description: "Información personal y configuración" },
    { id: "grupos", label: "Grupos", icon: Users, description: "Grupos asignados y ocasionales" },
    { id: "informes", label: "Informes", icon: FileText, description: "Gestión de informes académicos" },
    { id: "soporte", label: "Soporte", icon: LifeBuoy, description: "Ayuda y recursos disponibles" },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const changeTab = (value: string): void => {
    setActiveTab(value);
  };

  // Estadísticas detalladas
  const stats = [
    {
      label: "Grupos activos",
      value: estadisticas.totalGrupos,
      icon: Users,
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Informes completados",
      value: estadisticas.informesCompletados,
      icon: ClipboardCheck,
      bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Calificación promedio",
      value: `${estadisticas.promedioSatisfaccion}/5.0`,
      icon: Star,
      bgColor: "bg-amber-100 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Estudiantes a cargo",
      value: estadisticas.totalEstudiantes,
      icon: UserCheck,
      bgColor: "bg-violet-100 dark:bg-violet-950/30",
      textColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <>
      <Head title={`Perfil Tutor - ${tutor.nombre} ${tutor.apellido}`} />

      <TooltipProvider>
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
          {/* Header + métricas simples como en WindowsIndex */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Perfil del Tutor
              </h1>
              <p className="text-sm text-muted-foreground">
                {tutor.correo} • {tutor.sede}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gestiona tus grupos, informes y consulta tu información personal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notificaciones</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configuración</p>
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-8 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => router.post(route("portal.tutor.logout"))}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>

          {/* Perfil header estilo WindowsIndex */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-lg">
                      {tutor.avatar_url ? (
                        <AvatarImage src={tutor.avatar_url} alt={tutor.nombre} />
                      ) : null}
                      <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">
                          {tutor.nombre} {tutor.apellido}
                        </h1>
                        <div className="flex items-center gap-2">
                          
                          <Badge 
                            variant={tutor.activo ? "default" : "destructive"}
                            className={tutor.activo 
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" 
                              : ""
                            }
                          >
                            <div className={`h-1.5 w-1.5 rounded-full ${tutor.activo ? 'bg-emerald-500' : 'bg-red-500'} mr-1.5`} />
                            {tutor.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{tutor.correo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{tutor.telefono || "Sin teléfono"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{tutor.sede}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ingreso: {formatDate(tutor.fecha_ingreso)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabla de estadísticas estilo WindowsIndex */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.textColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs estilo WindowsIndex */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex h-auto p-1 bg-muted/50">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 py-2 data-[state=active]:bg-background"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'informes' && windowsAssigned.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {windowsAssigned.length}
                    </Badge>
                  )}
                  {tab.id === 'grupos' && (grupos.length + ocasionales.length) > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {grupos.length + ocasionales.length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              {/* Contenido Perfil */}
              <TabsContent value="perfil" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Nombre Completo
                            </label>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="font-medium text-foreground">{tutor.nombre} {tutor.apellido}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Correo Electrónico
                            </label>
                            <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-foreground">{tutor.correo}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Teléfono
                            </label>
                            <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-foreground">{tutor.telefono || "—"}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Sede
                            </label>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-foreground">{tutor.sede}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Fecha de Ingreso
                            </label>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-foreground">{formatDate(tutor.fecha_ingreso)}</p>
                            </div>
                          </div>
                        </div>

                        {tutor.especialidades && tutor.especialidades.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Especialidades
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {tutor.especialidades.map((especialidad, index) => (
                                <Badge key={index} variant="secondary">
                                  {especialidad}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Información
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Progreso
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Informes</span>
                            <span className="text-sm font-bold text-foreground">{estadisticas.informesCompletados}/{windowsAssigned.length}</span>
                          </div>
                          <Progress value={(estadisticas.informesCompletados / windowsAssigned.length) * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Grupos Principal</span>
                            <span className="text-sm font-bold text-foreground">
                              {grupos.filter(g => g.rol === 'principal').length}/{grupos.length}
                            </span>
                          </div>
                          <Progress 
                            value={(grupos.filter(g => g.rol === 'principal').length / grupos.length) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </div>
              </TabsContent>

              {/* Contenido Grupos */}
              <TabsContent value="grupos" className="space-y-6">
                {(() => {
                  const windowId = windowsAssigned?.[0]?.id ?? null;
                  const hayGrupos = grupos.length > 0;
                  const hayOcasionales = ocasionales.length > 0;
                  const hayContenido = hayGrupos || hayOcasionales;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">
                            Mis Grupos
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            {hayGrupos ? `${grupos.length} grupo${grupos.length !== 1 ? "s" : ""} asignado${grupos.length !== 1 ? "s" : ""}` : "Sin grupos asignados"}
                            {hayOcasionales && ` • ${ocasionales.length} ocasionales`}
                          </p>
                          {hayGrupos && (
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                              Total estudiantes: {totalEstudiantesGrupos}
                            </p>
                          )}
                        </div>

                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Lista
                        </Button>
                      </div>

                      {!windowId ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground mb-2">
                              No tienes una ventana de informe asignada
                            </h4>
                            <p className="text-muted-foreground max-w-md mx-auto">
                              Para ver asistencias, primero debe existir una ventana de informe
                              asignada en el período.
                            </p>
                          </CardContent>
                        </Card>
                      ) : !hayContenido ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground mb-2">
                              No tienes grupos asignados
                            </h4>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                              Contacta con la coordinación para que te asignen grupos.
                            </p>
                            <Button>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contactar Coordinación
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-6">
                          {/* Grupos asignados */}
                          {hayGrupos && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3">
                                Grupos asignados
                              </h4>

                              <div className="grid md:grid-cols-2 gap-4">
                                {grupos.map((grupo) => (
                                  <Card key={grupo.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <CardTitle className="flex items-center gap-2 text-base">
                                            {grupo.nombre}
                                            {grupo.rol === "principal" && (
                                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-xs">
                                                Principal
                                              </Badge>
                                            )}
                                          </CardTitle>
                                          <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                                            <BookOpen className="h-3 w-3" />
                                            {grupo.codigo}
                                          </CardDescription>
                                        </div>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="pb-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground truncate" title={grupo.carrera?.nombre || "No especificada"}>
                                            {grupo.carrera?.nombre?.substring(0, 20) || "N/E"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground truncate" title={grupo.asignatura?.nombre || "No especificada"}>
                                            {grupo.asignatura?.nombre?.substring(0, 20) || "N/E"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="font-medium">{grupo.estudiantes || 0} est.</span>
                                        </div>
                                      </div>
                                    </CardContent>

                                    <CardFooter className="pt-0">
                                      <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                          router.visit(
                                            route("portal.tutor.informes.asistencias.grupo", {
                                              window: windowId,
                                              grupo: grupo.id,
                                            }) + "?returnTab=grupos"
                                          )
                                        }
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-2" />
                                        Ver asistencias
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Asistencias ocasionales */}
                          {hayOcasionales && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-foreground">
                                  Asistencias ocasionales
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {ocasionales.length}
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                {ocasionales.map((o) => (
                                  <Card key={o.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="flex items-center gap-2 text-base">
                                        {o.asignatura}
                                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                                          Ocasional
                                        </Badge>
                                      </CardTitle>
                                      <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                                        <BookOpen className="h-3 w-3" />
                                        {o.grupo}
                                      </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pb-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">{o.estudiantes} est.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="font-medium">{o.asistencias} asis.</span>
                                        </div>
                                      </div>
                                    </CardContent>

                                    <CardFooter className="pt-0">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                          router.visit(
                                            route("portal.tutor.informes.asistencias.ocasionales", {
                                              window: windowId,
                                              key: o.id,
                                            }) + "?returnTab=grupos"
                                          )
                                        }
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-2" />
                                        Ver detalles
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* Contenido Informes - VERSIÓN COMPACTA MEJORADA */}
              <TabsContent value="informes" className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      Informes Asignados
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {estadisticas.informesCompletados} completados • {estadisticas.informesPendientes} pendientes
                    </p>
                  </div>
                
                </div>

                {windowsAssigned.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">No hay informes asignados</h4>
                      <p className="text-muted-foreground">
                        No se te han asignado ventanas de informe en este período.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {windowsAssigned.map((window) => {
                      const config = getStatusConfig(window.report?.status || 'pendiente');
                      const Icon = config.icon;
                      const daysRemaining = calculateDaysRemaining(window.due_at ?? undefined);
                      
                      return (
                        <Card key={window.id} className="hover:shadow-sm transition-shadow overflow-hidden">
                          <div className="flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-border">
                            {/* Información principal */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {window.name}
                                    </h4>
                                    <Badge className={`${config.color} border text-xs px-2 py-0 h-5`}>
                                      <Icon className="h-3 w-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {window.period.code} • {formatDateTime(window.due_at)}
                                  </p>
                                  {window.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {window.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Métricas compactas */}
                            <div className="flex items-center divide-x divide-border">
                              <div className="px-4 py-2 text-center min-w-[80px]">
                                <p className="text-xs text-muted-foreground">Días</p>
                                {daysRemaining !== null ? (
                                  <p className={`text-sm font-bold ${
                                    daysRemaining <= 3 ? 'text-red-600 dark:text-red-400'
                                    : daysRemaining <= 7 ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {daysRemaining}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">—</p>
                                )}
                              </div>

                              <div className="px-4 py-2 text-center min-w-[80px]">
                                <p className="text-xs text-muted-foreground">Estado</p>
                                <div className="flex items-center gap-1 justify-center">
                                  <div className={`h-2 w-2 rounded-full ${
                                    window.report?.status === 'completado' ? 'bg-emerald-500'
                                    : window.report?.status === 'en_progreso' ? 'bg-blue-500'
                                    : window.report?.status === 'atrasado' ? 'bg-red-500'
                                    : 'bg-amber-500'
                                  }`} />
                                  <span className="text-sm font-medium">
                                    {window.report?.submitted_at ? "Enviado" : (window.report?.status || "Pend")}
                                  </span>
                                </div>
                              </div>

                              {/* Acción */}
                              <div className="px-4">
                                <Button
                                  size="sm"
                                  variant={window.report ? "outline" : "default"}
                                  className={window.report ? "h-8" : "h-8 bg-emerald-600 hover:bg-emerald-700"}
                                  onClick={() =>
                                    router.visit(`/portal-tutores/informes/tutor/${window.id}`)
                                  }
                                >
                                  {window.report ? (
                                    <>
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Ver
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3.5 w-3.5 mr-1" />
                                      Iniciar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Contenido Soporte */}
              <TabsContent value="soporte" className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <LifeBuoy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Soporte y Ayuda</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    ¿Necesitas ayuda? Encuentra respuestas rápidas o contacta con nuestro equipo
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Contacto Directo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">Soporte Técnico</p>
                            <p className="text-sm text-muted-foreground">soporte@institucion.edu</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">Línea de atención</p>
                            <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">Horario de atención</p>
                            <p className="text-sm text-muted-foreground">Lun-Vie, 8:00 AM - 6:00 PM</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Iniciar chat de soporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Recursos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <FileText className="h-5 w-5" />
                          <span className="text-xs">Guías</span>
                        </Button>
                        
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <HelpCircle className="h-5 w-5" />
                          <span className="text-xs">FAQs</span>
                        </Button>
                        
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <CalendarDays className="h-5 w-5" />
                          <span className="text-xs">Calendario</span>
                        </Button>
                        
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <Download className="h-5 w-5" />
                          <span className="text-xs">Formatos</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Tips de uso estilo WindowsIndex */}
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Tips de uso para tutores
            </div>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Revisa tus <strong>grupos asignados</strong> y sus asistencias periódicamente.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Completa los <strong>informes</strong> antes de la fecha límite.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Usa la sección de <strong>Soporte</strong> para contactar al equipo.</span>
              </li>
            </ul>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}