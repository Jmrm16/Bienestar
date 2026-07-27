import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, FileText, Layers3, PieChart as PieChartIcon } from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { EstudianteRow } from "../tables/TablaEstudiantes";

type CountRow = {
  label: string;
  value: number;
};

type ServiceRow = {
  label: string;
  estudiantes: number;
  registros: number;
  actividades: number;
};

const PIE_COLORS = ["#0f766e", "#2563eb", "#ea580c", "#7c3aed", "#16a34a", "#dc2626"];

const normalizeText = (value?: string | null, fallback = "Sin dato") => {
  const text = (value ?? "").trim();
  return text !== "" ? text : fallback;
};

const normalizeIdent = (value?: string | null) => (value ?? "").trim();

const formatInt = (value: number) => new Intl.NumberFormat("es-CO").format(value);

export default function EstudiantesReportPanel({
  rows,
  periodLabel,
}: {
  rows: EstudianteRow[];
  periodLabel: string;
}) {
  const report = useMemo(() => {
    if (!rows.length) {
      return {
        totalRegistros: 0,
        estudiantesUnicos: 0,
        totalServicios: 0,
        totalProgramas: 0,
        serviceRows: [] as ServiceRow[],
        trimesterRows: [] as CountRow[],
        programRows: [] as CountRow[],
        sexoRows: [] as CountRow[],
        priorizadosRows: [] as CountRow[],
        topService: null as ServiceRow | null,
        topProgram: null as CountRow | null,
        topTrimester: null as CountRow | null,
      };
    }

    const studentsMap = new Map<
      string,
      {
        sexo: string;
        programa: string;
        prioridadSet: Set<string>;
      }
    >();

    const serviceMap = new Map<
      string,
      { registros: number; estudiantes: Set<string>; actividades: Set<string> }
    >();
    const trimesterMap = new Map<string, Set<string>>();
    const programMap = new Map<string, Set<string>>();

    rows.forEach((row) => {
      const ident = normalizeIdent(row.identificacion);
      if (!ident) return;

      if (!studentsMap.has(ident)) {
        studentsMap.set(ident, {
          sexo: normalizeText(row.sexo, "Sin dato"),
          programa: normalizeText(row.programa_academico, "Sin programa"),
          prioridadSet: new Set<string>(),
        });
      }

      const student = studentsMap.get(ident)!;

      const sexo = normalizeText(row.sexo, "");
      const programa = normalizeText(row.programa_academico, "");

      if (sexo !== "") student.sexo = sexo;
      if (programa !== "") student.programa = programa;

      const prioridadRaw = normalizeText(row.grupos_prioritarios, "");
      if (prioridadRaw !== "") {
        prioridadRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((item) => student.prioridadSet.add(item));
      }

      const servicio = normalizeText(row.servicio, "Sin servicio");
      if (!serviceMap.has(servicio)) {
        serviceMap.set(servicio, {
          registros: 0,
          estudiantes: new Set<string>(),
          actividades: new Set<string>(),
        });
      }
      const service = serviceMap.get(servicio)!;
      service.registros += 1;
      service.estudiantes.add(ident);
      service.actividades.add(normalizeText(row.actividad, "Sin actividad"));

      const trimestre = normalizeText(row.trimestre, "Sin trimestre");
      if (!trimesterMap.has(trimestre)) trimesterMap.set(trimestre, new Set<string>());
      trimesterMap.get(trimestre)!.add(ident);

      const program = normalizeText(row.programa_academico, "Sin programa");
      if (!programMap.has(program)) programMap.set(program, new Set<string>());
      programMap.get(program)!.add(ident);
    });

    const serviceRows = Array.from(serviceMap.entries())
      .map(([label, stats]) => ({
        label,
        estudiantes: stats.estudiantes.size,
        registros: stats.registros,
        actividades: stats.actividades.size,
      }))
      .sort((a, b) => b.estudiantes - a.estudiantes || b.registros - a.registros);

    const trimesterRows = Array.from(trimesterMap.entries())
      .map(([label, students]) => ({ label, value: students.size }))
      .sort((a, b) => b.value - a.value);

    const programRows = Array.from(programMap.entries())
      .map(([label, students]) => ({ label, value: students.size }))
      .sort((a, b) => b.value - a.value);

    const sexoMap = new Map<string, number>();
    const prioridadMap = new Map<string, number>();

    studentsMap.forEach((student) => {
      sexoMap.set(student.sexo, (sexoMap.get(student.sexo) ?? 0) + 1);

      if (student.prioridadSet.size === 0) {
        prioridadMap.set("Sin priorización", (prioridadMap.get("Sin priorización") ?? 0) + 1);
      } else {
        student.prioridadSet.forEach((item) => {
          prioridadMap.set(item, (prioridadMap.get(item) ?? 0) + 1);
        });
      }
    });

    const sexoRows = Array.from(sexoMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const priorizadosRows = Array.from(prioridadMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalRegistros: rows.length,
      estudiantesUnicos: studentsMap.size,
      totalServicios: serviceMap.size,
      totalProgramas: programMap.size,
      serviceRows,
      trimesterRows,
      programRows,
      sexoRows,
      priorizadosRows,
      topService: serviceRows[0] ?? null,
      topProgram: programRows[0] ?? null,
      topTrimester: trimesterRows[0] ?? null,
    };
  }, [rows]);

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reportes e informes</CardTitle>
          <CardDescription>
            Cuando existan registros en el período seleccionado, aquí se mostrará el resumen analítico del módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No hay datos suficientes para generar el informe de estudiantes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Reportes e informes</h2>
        <p className="text-sm text-muted-foreground">
          Resumen del período <span className="font-medium text-foreground">{periodLabel}</span> con
          distribución por servicios, programas, trimestres y grupos priorizados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Estudiantes únicos"
          value={report.estudiantesUnicos}
          icon={FileText}
          color="cyan"
          detail="Identificaciones distintas"
        />
        <MetricCard
          title="Registros del período"
          value={report.totalRegistros}
          icon={Layers3}
          color="purple"
          detail="Filas importadas"
        />
        <MetricCard
          title="Servicios"
          value={report.totalServicios}
          icon={BarChart3}
          color="blue"
          detail="Servicios detectados"
        />
        <MetricCard
          title="Programas"
          value={report.totalProgramas}
          icon={PieChartIcon}
          color="green"
          detail="Programas académicos"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informe rápido</CardTitle>
          <CardDescription>
            Lectura ejecutiva del comportamiento del módulo en el período seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Se encontraron <span className="font-semibold text-foreground">{formatInt(report.estudiantesUnicos)}</span>{" "}
            estudiantes únicos distribuidos en{" "}
            <span className="font-semibold text-foreground">{formatInt(report.totalServicios)}</span> servicios y{" "}
            <span className="font-semibold text-foreground">{formatInt(report.totalProgramas)}</span> programas.
            {report.topService ? (
              <>
                {" "}El servicio con mayor cobertura es{" "}
                <span className="font-semibold text-foreground">{report.topService.label}</span> con{" "}
                <span className="font-semibold text-foreground">{formatInt(report.topService.estudiantes)}</span>{" "}
                estudiantes.
              </>
            ) : null}
            {report.topProgram ? (
              <>
                {" "}El programa con más registros únicos es{" "}
                <span className="font-semibold text-foreground">{report.topProgram.label}</span>.
              </>
            ) : null}
            {report.topTrimester ? (
              <>
                {" "}El trimestre más representado es{" "}
                <span className="font-semibold text-foreground">{report.topTrimester.label}</span>.
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap gap-2">
            {report.topService ? (
              <Badge variant="secondary">
                Servicio líder: {report.topService.label}
              </Badge>
            ) : null}
            {report.topProgram ? (
              <Badge variant="secondary">
                Programa líder: {report.topProgram.label}
              </Badge>
            ) : null}
            {report.topTrimester ? (
              <Badge variant="secondary">
                Trimestre líder: {report.topTrimester.label}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes por servicio</CardTitle>
            <CardDescription>Conteo de estudiantes únicos por servicio.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.serviceRows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-20} textAnchor="end" height={70} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="estudiantes" name="Estudiantes" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estudiantes por programa</CardTitle>
            <CardDescription>Top de programas con más estudiantes únicos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.programRows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-20} textAnchor="end" height={70} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Estudiantes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Distribución por sexo</CardTitle>
            <CardDescription>Estudiantes únicos por sexo reportado.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.sexoRows}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {report.sexoRows.map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Grupos priorizados</CardTitle>
            <CardDescription>Conteo de estudiantes por categoría prioritaria.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.priorizadosRows.slice(0, 6)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {report.priorizadosRows.slice(0, 6).map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Estudiantes por trimestre</CardTitle>
            <CardDescription>Distribución de estudiantes únicos por trimestre.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.trimesterRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Estudiantes" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla resumen por servicio</CardTitle>
          <CardDescription>
            Informe consolidado de estudiantes, registros y actividades detectadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full rounded-md border">
            <div className="min-w-[760px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estudiantes únicos</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Actividades</TableHead>
                    <TableHead>Peso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.serviceRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell>{formatInt(row.estudiantes)}</TableCell>
                      <TableCell>{formatInt(row.registros)}</TableCell>
                      <TableCell>{formatInt(row.actividades)}</TableCell>
                      <TableCell>
                        {report.estudiantesUnicos > 0
                          ? `${((row.estudiantes / report.estudiantesUnicos) * 100).toFixed(1)}%`
                          : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}



