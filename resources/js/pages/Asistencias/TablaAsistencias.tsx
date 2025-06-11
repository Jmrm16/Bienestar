import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Download, Info, Printer, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useState } from 'react';
import { toast } from 'sonner';

interface Asistencia {
  id: number;
  nombres_del_estudiante: string;
  apellidos_del_estudiante: string;
  identificacion: string;
  codigo_estudiantil: string;
  programa_academico: string;
  sexo: string;
  grupo_priorizado: string;
  fecha: string;
  total_asistencias: number;
  estado?: string;
}

interface Grupo {
  id: number;
  nombre: string;
  codigo: string;
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
  asistencias: Asistencia[];
  grupo?: Grupo;
  estadisticas?: Estadisticas;
  [key: string]: unknown;
}

export default function TablaAsistencias() {
  const { asistencias, grupo, estadisticas } = usePage<PageProps>().props;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAsistencias = asistencias.filter(asistencia => {
    const searchLower = searchTerm.toLowerCase();
    return (
      asistencia.nombres_del_estudiante.toLowerCase().includes(searchLower) ||
      asistencia.apellidos_del_estudiante.toLowerCase().includes(searchLower) ||
      asistencia.identificacion.toLowerCase().includes(searchLower) ||
      asistencia.codigo_estudiantil.toLowerCase().includes(searchLower)
    );
  });

  const formatFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.info(`Exportando datos en formato ${format.toUpperCase()}...`);
  };

  const getSexoBadge = (
    sexo: string
  ): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined } => {
    const lower = sexo?.toLowerCase();
    if (lower === 'f' || lower === 'femenino') {
      return { text: 'Femenino', variant: 'default' }; // rosado
    }
    return { text: 'Masculino', variant: 'secondary' }; // azul
  };

  return (
    <AppLayout>
      <Head title="Asistencias" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {grupo ? `Asistencias del grupo ${grupo.nombre}` : 'Registro de asistencias'}
            </h1>
            {grupo && (
              <p className="text-sm text-muted-foreground mt-1">
                Código: {grupo.codigo} • {asistencias.length} estudiantes
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
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
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
                        <span className="font-medium">{estadisticas?.total_estudiantes ?? asistencias.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Asistencia promedio:</span>
                        <span className="font-medium">{estadisticas?.promedio_asistencias?.toFixed(2) ?? '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Porcentaje asistencia:</span>
                        <span className="font-medium">{estadisticas?.porcentaje_asistencia?.toFixed(1) ?? '0'}%</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

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
                  {estadisticas.top_estudiantes[0]?.nombre || 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Promedio general</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.promedio_asistencias?.toFixed(1) ?? '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas?.porcentaje_asistencia?.toFixed(1) ?? '0.0'}% de asistencia
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.total_estudiantes ?? asistencias.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {asistencias.length} registros
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <TooltipProvider>
          <ScrollArea className="rounded-md border h-[600px]">
            <Table className="relative">
              <TableCaption className="my-4">
                {filteredAsistencias.length > 0
                  ? `Mostrando ${filteredAsistencias.length} de ${asistencias.length} registros`
                  : 'No se encontraron resultados'}
              </TableCaption>

              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[180px]">Estudiante</TableHead>
                  <TableHead className="min-w-[120px]">Identificación</TableHead>
                  <TableHead className="min-w-[100px]">Código</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead className="w-[90px]">Sexo</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-center w-[110px]">Asistencias</TableHead>
                  <TableHead className="min-w-[110px]">Fecha</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAsistencias.length > 0 ? (
                  filteredAsistencias.map((asistencia) => {
                    const sexo = getSexoBadge(asistencia.sexo);
                    return (
                      <TableRow key={asistencia.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span>{asistencia.nombres_del_estudiante}</span>
                              <span className="text-sm text-muted-foreground">
                                {asistencia.apellidos_del_estudiante}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{asistencia.identificacion}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asistencia.codigo_estudiantil}</Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="max-w-[180px] truncate">
                                {asistencia.programa_academico}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{asistencia.programa_academico}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sexo.variant}>{sexo.text}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {asistencia.grupo_priorizado || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              asistencia.total_asistencias > 5
                                ? 'default'
                                : asistencia.total_asistencias > 0
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="px-3 py-1 font-mono"
                          >
                            {asistencia.total_asistencias}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFecha(asistencia.fecha)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              asistencia.estado === 'activo'
                                ? 'default'
                                : asistencia.estado === 'inactivo'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {asistencia.estado || '—'}
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
                        : 'No hay registros de asistencias'}
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
