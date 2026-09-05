import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import NotificationsAndAlerts from '@/components/notifications-and-alerts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
    AlertCircle,
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    FolderOpen,
    GraduationCap,
    HelpCircle,
    LifeBuoy,
    LogOut,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Settings,
    Sparkles,
    Star,
    TrendingUp,
    User,
    UserCheck,
    Users,
} from 'lucide-react';

/* ───────────────────── TYPES ───────────────────── */

type GrupoAsignado = {
    id: number;
    nombre: string;
    codigo: string;
    carrera?: { nombre: string } | null;
    asignatura?: { nombre: string } | null;
    periodo?: { code: string } | null;
    rol: 'principal' | 'secundario';
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
    tutor_type: 'R1' | 'R2';
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
        informesCompletados: windowsAssigned.filter((w) => w.report?.status === 'completado').length,
        informesPendientes: windowsAssigned.filter((w) => !w.report || w.report.status === 'pendiente').length,
        promedioSatisfaccion: 4.5,
        totalEstudiantes: grupos.reduce((acc, g) => acc + (g.estudiantes || 0), 0),
    },
}: Props) {
    const getInitialTab = () => {
        if (typeof window === 'undefined') return 'perfil';
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') ?? 'perfil';
    };

    const resolveLatestWindowId = () => {
        if (windowsAssigned.length === 0) return null;

        const sorted = [...windowsAssigned].sort((a, b) => {
            const aTime = a.open_at ? new Date(a.open_at).getTime() : 0;
            const bTime = b.open_at ? new Date(b.open_at).getTime() : 0;
            if (aTime !== bTime) return bTime - aTime;
            return b.id - a.id;
        });

        return sorted[0]?.id ?? null;
    };

    const getInitialWindowId = () => {
        const fallbackWindowId = resolveLatestWindowId();

        if (typeof window === 'undefined') return fallbackWindowId;

        const params = new URLSearchParams(window.location.search);
        const requestedWindowId = Number(params.get('window'));

        if (Number.isFinite(requestedWindowId) && windowsAssigned.some((w) => w.id === requestedWindowId)) {
            return requestedWindowId;
        }

        return fallbackWindowId;
    };

    useEffect(() => {
        const y = sessionStorage.getItem('tutorHomeScrollY');
        if (y) {
            requestAnimationFrame(() => window.scrollTo(0, Number(y)));
            sessionStorage.removeItem('tutorHomeScrollY');
        }
    }, []);

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [selectedWindowId, setSelectedWindowId] = useState<number | null>(getInitialWindowId);

    useEffect(() => {
        if (windowsAssigned.length === 0) {
            if (selectedWindowId !== null) setSelectedWindowId(null);
            return;
        }

        if (selectedWindowId !== null && windowsAssigned.some((w) => w.id === selectedWindowId)) {
            return;
        }

        const latestWindowId =
            [...windowsAssigned].sort((a, b) => {
                const aTime = a.open_at ? new Date(a.open_at).getTime() : 0;
                const bTime = b.open_at ? new Date(b.open_at).getTime() : 0;
                if (aTime !== bTime) return bTime - aTime;
                return b.id - a.id;
            })[0]?.id ?? null;

        setSelectedWindowId(latestWindowId);
    }, [windowsAssigned, selectedWindowId]);

    const getInitials = () => {
        return `${tutor.nombre?.charAt(0) || ''}${tutor.apellido?.charAt(0) || ''}`.toUpperCase() || 'TU';
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<
            string,
            { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string; label: string }
        > = {
            completado: {
                variant: 'default',
                icon: CheckCircle2,
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
                label: 'Completado',
            },
            pendiente: {
                variant: 'secondary',
                icon: Clock,
                color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
                label: 'Pendiente',
            },
            en_progreso: {
                variant: 'outline',
                icon: TrendingUp,
                color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
                label: 'En progreso',
            },
            atrasado: {
                variant: 'destructive',
                icon: AlertCircle,
                color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
                label: 'Atrasado',
            },
        };

        return configs[status.toLowerCase()] || configs.pendiente;
    };
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string | null) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
        { id: 'perfil', label: 'Perfil', icon: User, description: 'Información personal y configuración' },
        { id: 'grupos', label: 'Grupos', icon: Users, description: 'Grupos asignados y ocasionales' },
        { id: 'informes', label: 'Informes', icon: FileText, description: 'Gestión de informes académicos' },
        { id: 'soporte', label: 'Soporte', icon: LifeBuoy, description: 'Ayuda y recursos disponibles' },
    ];

    // Estadísticas detalladas
    const stats = [
        {
            label: 'Grupos activos',
            value: estadisticas.totalGrupos,
            icon: Users,
            bgColor: 'bg-blue-100 dark:bg-blue-950/30',
            textColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Informes completados',
            value: estadisticas.informesCompletados,
            icon: ClipboardCheck,
            bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
            textColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Calificación promedio',
            value: `${estadisticas.promedioSatisfaccion}/5.0`,
            icon: Star,
            bgColor: 'bg-amber-100 dark:bg-amber-950/30',
            textColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Estudiantes a cargo',
            value: estadisticas.totalEstudiantes,
            icon: UserCheck,
            bgColor: 'bg-violet-100 dark:bg-violet-950/30',
            textColor: 'text-violet-600 dark:text-violet-400',
        },
    ];

    return (
        <>
            <Head title={`Perfil Tutor - ${tutor.nombre} ${tutor.apellido}`} />

            <TooltipProvider>
                <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
                    <NotificationsAndAlerts className="-mb-2" />

                    {/* Header + métricas simples como en WindowsIndex */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-foreground text-2xl font-semibold">Perfil del Tutor</h1>
                            <p className="text-muted-foreground text-sm">
                                {tutor.correo} • {tutor.sede}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">Gestiona tus grupos, informes y consulta tu información personal.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Notificaciones</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Settings className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Configuración</p>
                                </TooltipContent>
                            </Tooltip>

                            <Separator orientation="vertical" className="mx-1 h-8" />

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground gap-2"
                                onClick={() => router.post(route('portal.tutor.logout'))}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Salir</span>
                            </Button>
                        </div>
                    </div>

                    {/* Perfil header estilo WindowsIndex */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900">
                            <div className="p-6">
                                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20 border-4 border-white shadow-lg dark:border-slate-800">
                                            {tutor.avatar_url ? <AvatarImage src={tutor.avatar_url} alt={tutor.nombre} /> : null}
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-xl text-white">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h1 className="text-foreground text-2xl font-bold">
                                                    {tutor.nombre} {tutor.apellido}
                                                </h1>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={tutor.activo ? 'default' : 'destructive'}
                                                        className={
                                                            tutor.activo
                                                                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                : ''
                                                        }
                                                    >
                                                        <div
                                                            className={`h-1.5 w-1.5 rounded-full ${tutor.activo ? 'bg-emerald-500' : 'bg-red-500'} mr-1.5`}
                                                        />
                                                        {tutor.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{tutor.correo}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{tutor.telefono || 'Sin teléfono'}</span>
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

                                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar perfil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabla de estadísticas estilo WindowsIndex */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.label} className="border shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                                                <p className="text-foreground text-2xl font-bold">{stat.value}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Tabs estilo WindowsIndex */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-muted/50 grid h-auto w-full grid-cols-4 p-1 lg:inline-flex lg:w-auto">
                            {tabs.map((tab) => (
                                <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-background flex items-center gap-2 py-2">
                                    <tab.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {tab.id === 'informes' && windowsAssigned.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                                            {windowsAssigned.length}
                                        </Badge>
                                    )}
                                    {tab.id === 'grupos' && grupos.length + ocasionales.length > 0 && (
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
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="space-y-6 lg:col-span-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    Información Personal
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Nombre Completo</label>
                                                        <div className="bg-muted rounded-lg p-3">
                                                            <p className="text-foreground font-medium">
                                                                {tutor.nombre} {tutor.apellido}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Correo Electrónico</label>
                                                        <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
                                                            <Mail className="text-muted-foreground h-4 w-4" />
                                                            <p className="text-foreground">{tutor.correo}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Teléfono</label>
                                                        <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
                                                            <Phone className="text-muted-foreground h-4 w-4" />
                                                            <p className="text-foreground">{tutor.telefono || '—'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Sede</label>
                                                        <div className="bg-muted rounded-lg p-3">
                                                            <p className="text-foreground">{tutor.sede}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Fecha de Ingreso</label>
                                                        <div className="bg-muted rounded-lg p-3">
                                                            <p className="text-foreground">{formatDate(tutor.fecha_ingreso)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {tutor.especialidades && tutor.especialidades.length > 0 && (
                                                    <div className="space-y-2">
                                                        <label className="text-muted-foreground text-sm font-medium">Especialidades</label>
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
                                                    <Edit className="mr-2 h-4 w-4" />
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
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-muted-foreground text-sm font-medium">Informes</span>
                                                        <span className="text-foreground text-sm font-bold">
                                                            {estadisticas.informesCompletados}/{windowsAssigned.length}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(estadisticas.informesCompletados / windowsAssigned.length) * 100}
                                                        className="h-2"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-muted-foreground text-sm font-medium">Grupos Principal</span>
                                                        <span className="text-foreground text-sm font-bold">
                                                            {grupos.filter((g) => g.rol === 'principal').length}/{grupos.length}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(grupos.filter((g) => g.rol === 'principal').length / grupos.length) * 100}
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
                                    const windowId = selectedWindowId;
                                    const selectedWindow = windowsAssigned.find((w) => w.id === windowId) ?? null;
                                    const canViewAttendances = windowId !== null;
                                    const hayGrupos = grupos.length > 0;
                                    const hayOcasionales = ocasionales.length > 0;
                                    const hayContenido = hayGrupos || hayOcasionales;

                                    return (
                                        <>
                                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                                <div>
                                                    <h3 className="text-foreground text-xl font-bold">Mis Grupos</h3>
                                                    <p className="text-muted-foreground mt-1">
                                                        {hayGrupos
                                                            ? `${grupos.length} grupo${grupos.length !== 1 ? 's' : ''} asignado${grupos.length !== 1 ? 's' : ''}`
                                                            : 'Sin grupos asignados'}
                                                        {hayOcasionales && ` • ${ocasionales.length} ocasionales`}
                                                    </p>
                                                    {hayGrupos && (
                                                        <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                            Total estudiantes: {totalEstudiantesGrupos}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="w-full space-y-2 sm:w-auto">
                                                    {windowsAssigned.length > 0 && (
                                                        <div className="w-full sm:w-80">
                                                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                                                Entrega disponible para consultar asistencias
                                                            </label>
                                                            <Select
                                                                value={windowId !== null ? String(windowId) : undefined}
                                                                onValueChange={(value) => setSelectedWindowId(Number(value))}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Selecciona una entrega" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {windowsAssigned.map((w) => (
                                                                        <SelectItem key={w.id} value={String(w.id)}>
                                                                            {w.name} • {w.tutor_type} • {w.period.code}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    <Button variant="outline" className="w-full sm:w-auto">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Exportar Lista
                                                    </Button>
                                                </div>
                                            </div>

                                            {selectedWindow && (
                                                <p className="text-muted-foreground text-xs">
                                                    Mostrando asistencias de la entrega:{' '}
                                                    <span className="text-foreground font-semibold">
                                                        {selectedWindow.name} ({selectedWindow.tutor_type} - {selectedWindow.period.code})
                                                    </span>
                                                </p>
                                            )}

                                            {!hayContenido ? (
                                                <Card>
                                                    <CardContent className="p-12 text-center">
                                                        <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                                            <Users className="text-muted-foreground h-8 w-8" />
                                                        </div>
                                                        <h4 className="text-foreground mb-2 text-lg font-semibold">No tienes grupos asignados</h4>
                                                        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
                                                            Contacta con la coordinación para que te asignen grupos.
                                                        </p>
                                                        <Button>
                                                            <MessageSquare className="mr-2 h-4 w-4" />
                                                            Contactar Coordinación
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <div className="space-y-6">
                                                    {!canViewAttendances && (
                                                        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <AlertTitle>Ya puedes ver tus grupos</AlertTitle>
                                                            <AlertDescription>
                                                                Tus grupos y asistencias ocasionales ya estan visibles. Para abrir el detalle de
                                                                asistencias por grupo, hace falta que exista una entrega publicada para tu resolución
                                                                o que el admin haya cargado asistencias en una entrega de este período.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {/* Grupos asignados */}
                                                    {hayGrupos && (
                                                        <div>
                                                            <h4 className="text-foreground mb-3 text-sm font-semibold">Grupos asignados</h4>

                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                {grupos.map((grupo) => (
                                                                    <Card key={grupo.id} className="transition-shadow hover:shadow-md">
                                                                        <CardHeader className="pb-3">
                                                                            <div className="flex items-start justify-between">
                                                                                <div>
                                                                                    <CardTitle className="flex items-center gap-2 text-base">
                                                                                        {grupo.nombre}
                                                                                        {grupo.rol === 'principal' && (
                                                                                            <Badge className="border-0 bg-blue-100 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
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
                                                                                    <GraduationCap className="text-muted-foreground h-3.5 w-3.5" />
                                                                                    <span
                                                                                        className="text-muted-foreground truncate"
                                                                                        title={grupo.carrera?.nombre || 'No especificada'}
                                                                                    >
                                                                                        {grupo.carrera?.nombre?.substring(0, 20) || 'N/E'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                                                                                    <span
                                                                                        className="text-muted-foreground truncate"
                                                                                        title={grupo.asignatura?.nombre || 'No especificada'}
                                                                                    >
                                                                                        {grupo.asignatura?.nombre?.substring(0, 20) || 'N/E'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <UserCheck className="text-muted-foreground h-3.5 w-3.5" />
                                                                                    <span className="font-medium">{grupo.estudiantes || 0} est.</span>
                                                                                </div>
                                                                            </div>
                                                                        </CardContent>

                                                                        <CardFooter className="pt-0">
                                                                            <Button
                                                                                size="sm"
                                                                                className="w-full"
                                                                                disabled={!canViewAttendances}
                                                                                onClick={() => {
                                                                                    const selectedId = windowId;
                                                                                    if (!selectedId) return;

                                                                                    router.visit(
                                                                                        route('portal.tutor.informes.asistencias.grupo', {
                                                                                            window: selectedId,
                                                                                            grupo: grupo.id,
                                                                                        }) +
                                                                                            `?returnTab=grupos&window=${encodeURIComponent(String(selectedId))}`,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                                                                {canViewAttendances ? 'Ver asistencias' : 'Entrega pendiente'}
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
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <h4 className="text-foreground text-sm font-semibold">Asistencias ocasionales</h4>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {ocasionales.length}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                {ocasionales.map((o) => (
                                                                    <Card key={o.id} className="transition-shadow hover:shadow-md">
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="flex items-center gap-2 text-base">
                                                                                {o.asignatura}
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="border-emerald-200 text-xs text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                                                                                >
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
                                                                                    <UserCheck className="text-muted-foreground h-3.5 w-3.5" />
                                                                                    <span className="text-muted-foreground">
                                                                                        {o.estudiantes} est.
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5" />
                                                                                    <span className="font-medium">{o.asistencias} asis.</span>
                                                                                </div>
                                                                            </div>
                                                                        </CardContent>

                                                                        <CardFooter className="pt-0">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="w-full"
                                                                                disabled={!canViewAttendances}
                                                                                onClick={() => {
                                                                                    const selectedId = windowId;
                                                                                    if (!selectedId) return;

                                                                                    router.visit(
                                                                                        route('portal.tutor.informes.asistencias.ocasionales', {
                                                                                            window: selectedId,
                                                                                            key: o.id,
                                                                                        }) +
                                                                                            `?returnTab=grupos&window=${encodeURIComponent(String(selectedId))}`,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                                                                {canViewAttendances ? 'Ver detalles' : 'Entrega pendiente'}
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
                                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-foreground text-xl font-bold">Informes Asignados</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {estadisticas.informesCompletados} completados • {estadisticas.informesPendientes} pendientes
                                        </p>
                                    </div>
                                </div>

                                {windowsAssigned.length === 0 ? (
                                    <Card>
                                        <CardContent className="p-12 text-center">
                                            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                                <FileText className="text-muted-foreground h-8 w-8" />
                                            </div>
                                            <h4 className="text-foreground mb-2 text-lg font-semibold">No hay informes asignados</h4>
                                            <p className="text-muted-foreground">No se te han asignado ventanas de informe en este período.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {windowsAssigned.map((window) => {
                                            const config = getStatusConfig(window.report?.status || 'pendiente');
                                            const Icon = config.icon;
                                            const daysRemaining = calculateDaysRemaining(window.due_at ?? undefined);

                                            return (
                                                <Card key={window.id} className="overflow-hidden transition-shadow hover:shadow-sm">
                                                    <div className="divide-border flex flex-col divide-y md:flex-row md:items-center md:divide-x md:divide-y-0">
                                                        {/* Información principal */}
                                                        <div className="flex-1 p-4">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="mb-1 flex items-center gap-2">
                                                                        <h4 className="text-foreground truncate font-semibold">{window.name}</h4>
                                                                        <Badge className={`${config.color} h-5 border px-2 py-0 text-xs`}>
                                                                            <Icon className="mr-1 h-3 w-3" />
                                                                            {config.label}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-muted-foreground mb-2 text-xs">
                                                                        {window.period.code} • {formatDateTime(window.due_at)}
                                                                    </p>
                                                                    {window.description && (
                                                                        <p className="text-muted-foreground line-clamp-1 text-xs">
                                                                            {window.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Métricas compactas */}
                                                        <div className="divide-border flex items-center divide-x">
                                                            <div className="min-w-[80px] px-4 py-2 text-center">
                                                                <p className="text-muted-foreground text-xs">Días</p>
                                                                {daysRemaining !== null ? (
                                                                    <p
                                                                        className={`text-sm font-bold ${
                                                                            daysRemaining <= 3
                                                                                ? 'text-red-600 dark:text-red-400'
                                                                                : daysRemaining <= 7
                                                                                  ? 'text-amber-600 dark:text-amber-400'
                                                                                  : 'text-emerald-600 dark:text-emerald-400'
                                                                        }`}
                                                                    >
                                                                        {daysRemaining}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-muted-foreground text-sm">—</p>
                                                                )}
                                                            </div>

                                                            <div className="min-w-[80px] px-4 py-2 text-center">
                                                                <p className="text-muted-foreground text-xs">Estado</p>
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <div
                                                                        className={`h-2 w-2 rounded-full ${
                                                                            window.report?.status === 'completado'
                                                                                ? 'bg-emerald-500'
                                                                                : window.report?.status === 'en_progreso'
                                                                                  ? 'bg-blue-500'
                                                                                  : window.report?.status === 'atrasado'
                                                                                    ? 'bg-red-500'
                                                                                    : 'bg-amber-500'
                                                                        }`}
                                                                    />
                                                                    <span className="text-sm font-medium">
                                                                        {window.report?.submitted_at ? 'Enviado' : window.report?.status || 'Pend'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Acción */}
                                                            <div className="px-4">
                                                                <Button
                                                                    size="sm"
                                                                    variant={window.report ? 'outline' : 'default'}
                                                                    className={window.report ? 'h-8' : 'h-8 bg-emerald-600 hover:bg-emerald-700'}
                                                                    onClick={() => router.visit(`/portal-tutores/informes/tutor/${window.id}`)}
                                                                >
                                                                    {window.report ? (
                                                                        <>
                                                                            <Eye className="mr-1 h-3.5 w-3.5" />
                                                                            Ver
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FileText className="mr-1 h-3.5 w-3.5" />
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
                                <div className="mb-6 text-center">
                                    <div className="mb-4 inline-flex rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <LifeBuoy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-foreground mb-2 text-xl font-bold">Soporte y Ayuda</h3>
                                    <p className="text-muted-foreground mx-auto max-w-2xl">
                                        ¿Necesitas ayuda? Encuentra respuestas rápidas o contacta con nuestro equipo
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                Contacto Directo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                                                    <Mail className="text-muted-foreground h-5 w-5" />
                                                    <div>
                                                        <p className="text-foreground font-medium">Soporte Técnico</p>
                                                        <p className="text-muted-foreground text-sm">soporte@institucion.edu</p>
                                                    </div>
                                                </div>

                                                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                                                    <Phone className="text-muted-foreground h-5 w-5" />
                                                    <div>
                                                        <p className="text-foreground font-medium">Línea de atención</p>
                                                        <p className="text-muted-foreground text-sm">+1 (555) 123-4567</p>
                                                    </div>
                                                </div>

                                                <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                                                    <Clock className="text-muted-foreground h-5 w-5" />
                                                    <div>
                                                        <p className="text-foreground font-medium">Horario de atención</p>
                                                        <p className="text-muted-foreground text-sm">Lun-Vie, 8:00 AM - 6:00 PM</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button className="w-full">
                                                <MessageSquare className="mr-2 h-4 w-4" />
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
                                                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                                                    <FileText className="h-5 w-5" />
                                                    <span className="text-xs">Guías</span>
                                                </Button>

                                                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                                                    <HelpCircle className="h-5 w-5" />
                                                    <span className="text-xs">FAQs</span>
                                                </Button>

                                                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                                                    <CalendarDays className="h-5 w-5" />
                                                    <span className="text-xs">Calendario</span>
                                                </Button>

                                                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
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
                    <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                        <div className="text-foreground mb-2 flex items-center gap-2 font-medium">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            Tips de uso para tutores
                        </div>
                        <ul className="space-y-1 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                <span>
                                    Revisa tus <strong>grupos asignados</strong> y sus asistencias periódicamente.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                <span>
                                    Completa los <strong>informes</strong> antes de la fecha límite.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                <span>
                                    Usa la sección de <strong>Soporte</strong> para contactar al equipo.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </TooltipProvider>
        </>
    );
}
