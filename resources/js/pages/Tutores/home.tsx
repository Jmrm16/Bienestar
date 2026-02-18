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
  estudiantes?: number; // Ahora es opcional para evitar errores
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
  nivel_experiencia: "junior" | "intermedio" | "senior";
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
    const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, color: string }> = {
      'completado': { variant: 'default', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
      'pendiente': { variant: 'secondary', icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
      'en_progreso': { variant: 'outline', icon: TrendingUp, color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
      'atrasado': { variant: 'destructive', icon: AlertTriangle, color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
    };
    
    return configs[status.toLowerCase()] || configs.pendiente;
  };

  const getExperienceBadge = () => {
    const configs = {
      'junior': { label: 'Junior', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Star },
      'intermedio': { label: 'Intermedio', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Award },
      'senior': { label: 'Senior', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300', icon: ShieldCheck }
    };
    
    const config = configs[tutor.nivel_experiencia] || configs.junior;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} border-0 gap-1.5 px-3 py-1 dark:border-transparent`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
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

  // Calcular total de estudiantes para mostrar en el header de grupos
  const totalEstudiantesGrupos = grupos.reduce((acc, g) => acc + (g.estudiantes || 0), 0);

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User, count: null },
    { id: "grupos", label: "Grupos", icon: Users, count: grupos.length + ocasionales.length },
    { id: "informes", label: "Informes", icon: FileText, count: windowsAssigned.length },
    { id: "soporte", label: "Soporte", icon: LifeBuoy, count: null },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const changeTab = (value: string): void => {
    setActiveTab(value);
  };

  return (
    <>
      <Head title={`Perfil Tutor - ${tutor.nombre} ${tutor.apellido}`} />

      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-gradient-to-b 
            from-slate-50 to-white 
            dark:from-slate-950 dark:to-slate-900 
            p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ───────── HEADER PRINCIPAL ───────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border shadow-lg overflow-hidden dark:border-slate-800 dark:bg-slate-900">
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
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {tutor.nombre} {tutor.apellido}
                          </h1>
                          <div className="flex items-center gap-2">
                            <Badge variant={tutor.activo ? "default" : "destructive"} className="gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${tutor.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                              {tutor.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            {getExperienceBadge()}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
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
                            <Badge variant="outline" className="text-slate-700 dark:text-slate-300 dark:border-slate-700">
                              {tutor.sede}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => router.post(route("portal.tutor.logout"))}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                      </Button>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Configuración</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ───────── ESTADÍSTICAS RÁPIDAS ───────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <Card className="border shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Grupos</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{estadisticas.totalGrupos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Informes Listos</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{estadisticas.informesCompletados}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Calificación</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{estadisticas.promedioSatisfaccion}/5.0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Estudiantes</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{estadisticas.totalEstudiantes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ───────── INDICADOR DE TAB ACTUAL ───────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-white border rounded-lg shadow-sm p-4 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTabData && (
                    <>
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <activeTabData.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">{activeTabData.label}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {activeTabData.id === 'perfil' && 'Información personal y configuración'}
                          {activeTabData.id === 'grupos' && `${grupos.length} grupo${grupos.length !== 1 ? 's' : ''} asignado${grupos.length !== 1 ? 's' : ''} • ${ocasionales.length} ocasional${ocasionales.length !== 1 ? 'es' : ''}`}
                          {activeTabData.id === 'informes' && `${estadisticas.informesCompletados} completados • ${estadisticas.informesPendientes} pendientes`}
                          {activeTabData.id === 'soporte' && 'Soporte técnico y recursos'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
                    {tabs.map(tab => (
                      <div
                        key={tab.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {tab.count !== null && (
                          <Badge variant="secondary" className="ml-1 text-xs bg-white dark:bg-slate-800 dark:text-slate-300">
                            {tab.count}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ───────── CONTENIDO PRINCIPAL ───────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border shadow-lg overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="sm:hidden border-b dark:border-slate-800">
                  <Tabs value={activeTab} onValueChange={changeTab}>
                    <TabsList className="grid grid-cols-4 w-full dark:bg-slate-800">
                      {tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex flex-col h-auto py-3 gap-1 dark:data-[state=active]:bg-slate-700"
                        >
                          <tab.icon className="h-4 w-4" />
                          <span className="text-xs">{tab.label}</span>
                          {tab.count !== null && (
                            <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0 dark:bg-slate-600">
                              {tab.count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="hidden sm:block border-b border-slate-200 dark:border-slate-800">
                    <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
                      {tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="relative rounded-none border-b-2 border-transparent px-6 py-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:font-semibold dark:data-[state=active]:border-blue-500 dark:data-[state=active]:text-blue-400 dark:text-slate-400"
                        >
                          <tab.icon className="h-4 w-4 mr-3" />
                          {tab.label}
                          {tab.count !== null && (
                            <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs dark:bg-slate-700">
                              {tab.count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <div className="p-6">
                    {/* ───────── PESTAÑA PERFIL ───────── */}
                    <TabsContent value="perfil" className="m-0 space-y-6">
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                          <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 dark:text-white">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Información Personal
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nombre Completo</label>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="font-medium dark:text-white">{tutor.nombre} {tutor.apellido}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Correo Electrónico</label>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <p className="dark:text-white">{tutor.correo}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Teléfono</label>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <p className="dark:text-white">{tutor.telefono || "No especificado"}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Sede</label>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">{tutor.sede}</Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Fecha de Ingreso</label>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="dark:text-white">{formatDate(tutor.fecha_ingreso)}</p>
                                  </div>
                                </div>
                              </div>

                              {tutor.especialidades && tutor.especialidades.length > 0 && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Especialidades</label>
                                  <div className="flex flex-wrap gap-2">
                                    {tutor.especialidades.map((especialidad, index) => (
                                      <Badge key={index} variant="secondary" className="dark:bg-slate-700">
                                        {especialidad}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Información
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>

                        <div className="space-y-6">
                          <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 dark:text-white">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Progreso
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium dark:text-slate-300">Informes</span>
                                  <span className="text-sm font-bold dark:text-white">{estadisticas.informesCompletados}/{windowsAssigned.length}</span>
                                </div>
                                <Progress value={(estadisticas.informesCompletados / windowsAssigned.length) * 100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium dark:text-slate-300">Grupos Principal</span>
                                  <span className="text-sm font-bold dark:text-white">
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

                          <Card className="dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 dark:text-white">
                                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Acciones Rápidas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Button variant="outline" className="w-full justify-start dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <FileSpreadsheet className="h-4 w-4 mr-3" />
                                Nuevo Informe
                              </Button>
                              <Button variant="outline" className="w-full justify-start dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <CalendarDays className="h-4 w-4 mr-3" />
                                Ver Calendario
                              </Button>
                              <Button variant="outline" className="w-full justify-start dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <Bell className="h-4 w-4 mr-3" />
                                Notificaciones
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ───────── PESTAÑA GRUPOS ───────── */}
                    <TabsContent value="grupos" className="m-0 space-y-6">
                      {(() => {
                        const windowId = windowsAssigned?.[0]?.id ?? null;
                        const hayGrupos = grupos.length > 0;
                        const hayOcasionales = ocasionales.length > 0;
                        const hayContenido = hayGrupos || hayOcasionales;

                        return (
                          <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  Mis Grupos
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mt-1">
                                  {hayGrupos ? `${grupos.length} grupo${grupos.length !== 1 ? "s" : ""} asignado${grupos.length !== 1 ? "s" : ""}` : "Sin grupos asignados"}
                                  {hayOcasionales && ` • ${ocasionales.length} ocasional${ocasionales.length !== 1 ? "es" : ""}`}
                                </p>
                                {/* Total de estudiantes */}
                                {hayGrupos && (
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                                    Total estudiantes: {totalEstudiantesGrupos}
                                  </p>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar Lista
                              </Button>
                            </div>

                            {!windowId ? (
                              <Card className="dark:border-slate-800 dark:bg-slate-900">
                                <CardContent className="p-12 text-center">
                                  <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-slate-400" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    No tienes una ventana de informe asignada
                                  </h4>
                                  <p className="text-slate-500 dark:text-slate-400">
                                    Para ver asistencias, primero debe existir una ventana de informe
                                    asignada en el período.
                                  </p>
                                </CardContent>
                              </Card>
                            ) : !hayContenido ? (
                              <Card className="dark:border-slate-800 dark:bg-slate-900">
                                <CardContent className="p-12 text-center">
                                  <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-slate-400" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    No tienes grupos asignados
                                  </h4>
                                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                                    Contacta con la coordinación para que te asignen grupos.
                                  </p>
                                  <Button className="dark:bg-blue-600 dark:hover:bg-blue-700">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Contactar Coordinación
                                  </Button>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-6">
                                {/* Sección: Grupos asignados */}
                                {hayGrupos && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                      Grupos asignados
                                    </h4>

                                    <div className="grid md:grid-cols-2 gap-4">
                                      {grupos.map((grupo) => (
                                        <Card
                                          key={grupo.id}
                                          className="hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
                                        >
                                          <CardHeader>
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <CardTitle className="flex items-center gap-2 dark:text-white">
                                                  {grupo.nombre}
                                                  {grupo.rol === "principal" && (
                                                    <Badge className="text-xs dark:bg-blue-600">
                                                      Principal
                                                    </Badge>
                                                  )}
                                                </CardTitle>
                                                <CardDescription className="mt-1 flex items-center gap-2 dark:text-slate-400">
                                                  <BookOpen className="h-3 w-3" />
                                                  {grupo.codigo}
                                                </CardDescription>
                                              </div>
                                            </div>
                                          </CardHeader>

                                          <CardContent className="space-y-3">
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <GraduationCap className="h-4 w-4" />
                                                  <span>Carrera:</span>
                                                </div>
                                                <span className="font-medium dark:text-white">
                                                  {grupo.carrera?.nombre || "No especificada"}
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <BookOpen className="h-4 w-4" />
                                                  <span>Asignatura:</span>
                                                </div>
                                                <span className="font-medium dark:text-white">
                                                  {grupo.asignatura?.nombre || "No especificada"}
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <UserCheck className="h-4 w-4" />
                                                  <span>Estudiantes:</span>
                                                </div>
                                                <span className="font-medium dark:text-white">
                                                  {grupo.estudiantes || 0}
                                                </span>
                                              </div>
                                            </div>
                                          </CardContent>

                                          <CardFooter>
                                            <Button
                                              variant="default"
                                              className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                                              onClick={() =>
                                                router.visit(
                                                  route("portal.tutor.informes.asistencias.grupo", {
                                                    window: windowId,
                                                    grupo: grupo.id,
                                                  }) + "?returnTab=grupos"
                                                )
                                              }
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              Ver asistencias
                                            </Button>
                                          </CardFooter>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sección: Asistencias ocasionales */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      Asistencias ocasionales
                                    </h4>

                                    <Badge variant="secondary" className="dark:bg-slate-700">
                                      {ocasionales.length}
                                    </Badge>
                                  </div>

                                  {ocasionales.length === 0 ? (
                                    <Card className="dark:border-slate-800 dark:bg-slate-900">
                                      <CardContent className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No tienes registros ocasionales en este período.
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                      {ocasionales.map((o) => (
                                        <Card
                                          key={o.id}
                                          className="hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
                                        >
                                          <CardHeader>
                                            <CardTitle className="flex items-center gap-2 dark:text-white">
                                              {o.asignatura}
                                              <Badge variant="outline" className="text-xs dark:border-slate-700 dark:text-slate-300">
                                                Ocasional
                                              </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-2 dark:text-slate-400">
                                              <BookOpen className="h-3 w-3" />
                                              {o.grupo}
                                            </CardDescription>
                                          </CardHeader>

                                          <CardContent className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-slate-600 dark:text-slate-400">Estudiantes:</span>
                                              <span className="font-medium dark:text-white">{o.estudiantes}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-slate-600 dark:text-slate-400">Asistencias:</span>
                                              <span className="font-medium dark:text-white">{o.asistencias}</span>
                                            </div>
                                          </CardContent>

                                          <CardFooter>
                                            <Button
                                              variant="outline"
                                              className="w-full dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                              onClick={() =>
                                                router.visit(
                                                  route("portal.tutor.informes.asistencias.ocasionales", {
                                                    window: windowId,
                                                    key: o.id,
                                                  }) + "?returnTab=grupos"
                                                )
                                              }
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              Ver ocasionales
                                            </Button>
                                          </CardFooter>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </TabsContent>

                    {/* ───────── PESTAÑA INFORMES ───────── */}
                    <TabsContent value="informes" className="m-0 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Informes Asignados
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {estadisticas.informesCompletados} completados • {estadisticas.informesPendientes} pendientes
                          </p>
                        </div>
                        <Button className="dark:bg-blue-600 dark:hover:bg-blue-700">
                          <FileText className="h-4 w-4 mr-2" />
                          Nuevo Informe
                        </Button>
                      </div>

                      {windowsAssigned.length === 0 ? (
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                          <CardContent className="p-12 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                              <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No hay informes asignados</h4>
                            <p className="text-slate-500 dark:text-slate-400">
                              No se te han asignado ventanas de informe en este período.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {windowsAssigned.map((window) => {
                            const config = getStatusConfig(window.report?.status || 'pendiente');
                            const Icon = config.icon;
                            const daysRemaining = calculateDaysRemaining(window.due_at ?? undefined);
                            
                            return (
                              <Card key={window.id} className="hover:shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900">
                                <CardContent className="p-6">
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                            {window.name}
                                          </h4>
                                          {window.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{window.description}</p>
                                          )}
                                        </div>
                                        <Badge className={config.color}>
                                          <Icon className="h-3.5 w-3.5 mr-1.5" />
                                          {window.report?.submitted_at ? "Enviado" : (window.report?.status || "pendiente")}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                        <div className="space-y-1">
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Período</p>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium dark:text-white">{window.period.code}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Fecha Límite</p>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium dark:text-white">
                                              {formatDate(window.due_at)}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Días Restantes</p>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {daysRemaining !== null ? (
                                              <span className={`font-bold ${
                                                daysRemaining <= 3 ? 'text-red-600 dark:text-red-400'
                                                : daysRemaining <= 7 ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-green-600 dark:text-green-400'
                                              }`}>
                                                {daysRemaining} días
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">—</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
                                          <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${
                                              window.report?.status === 'completado' ? 'bg-green-500'
                                              : window.report?.status === 'en_progreso' ? 'bg-blue-500'
                                              : window.report?.status === 'atrasado' ? 'bg-red-500'
                                              : 'bg-amber-500'
                                            }`} />
                                            <span className="font-medium dark:text-white">
                                              {window.report?.submitted_at ? "Enviado" : "Pendiente"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                      <Button
                                        variant={window.report ? "outline" : "default"}
                                        className={window.report ? "dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" : "dark:bg-blue-600 dark:hover:bg-blue-700"}
                                        onClick={() =>
                                          router.visit(`/portal-tutores/informes/tutor/${window.id}`)
                                        }
                                      >
                                        {window.report ? (
                                          <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Comenzar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* ───────── PESTAÑA SOPORTE ───────── */}
                    <TabsContent value="soporte" className="m-0 space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Soporte y Ayuda</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Encuentra respuestas rápidas o contacta con nuestro equipo
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              Contacto Directo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400" />
                                <div>
                                  <p className="font-medium dark:text-white">Soporte Técnico</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">soporte@institucion.edu</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-slate-400" />
                                <div>
                                  <p className="font-medium dark:text-white">Teléfono</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">+1 (555) 123-4567</p>
                                </div>
                              </div>
                            </div>
                            
                            <Button className="w-full dark:bg-blue-600 dark:hover:bg-blue-700">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contactar por Chat
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="dark:border-slate-800 dark:bg-slate-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              Recursos
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" className="h-auto py-4 flex-col gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <FileText className="h-5 w-5" />
                                <span className="text-sm">Guías</span>
                              </Button>
                              
                              <Button variant="outline" className="h-auto py-4 flex-col gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <CalendarDays className="h-5 w-5" />
                                <span className="text-sm">Calendario</span>
                              </Button>
                              
                              <Button variant="outline" className="h-auto py-4 flex-col gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <HelpCircle className="h-5 w-5" />
                                <span className="text-sm">FAQs</span>
                              </Button>
                              
                              <Button variant="outline" className="h-auto py-4 flex-col gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                <Download className="h-5 w-5" />
                                <span className="text-sm">Formatos</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </motion.div>

            {/* ───────── FOOTER ───────── */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4">
              <p>© {new Date().getFullYear()} Plataforma de Tutorías</p>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    </>
  );
}