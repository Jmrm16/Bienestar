import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { MetricCard } from "@/components/component/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { ParticipantsSection } from "./components/ParticipantsSection";
import { getAreaStyle } from "./components/area-styles";
import type {
  Carrera,
  ParticipantStats,
  SportParticipant,
} from "./components/types";

type SportArea = {
  key: string;
  title: string;
  description: string;
  location: string;
  schedule: string;
  coach: string;
  capacity: number;
  registered: number;
  status: string;
  focus: string;
  services: string[];
  requirements: string[];
  kind: "servicio" | "disciplina";
  href: string;
};

type Props = {
  area: SportArea;
  participants: SportParticipant[];
  carreras: Carrera[];
  participantStats: ParticipantStats;
};

export default function AreaPage({
  area,
  participants,
  carreras,
  participantStats,
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Deporte", href: "/deportes" },
    { title: area.title, href: area.href },
  ];

  const style = getAreaStyle(area.key);
  const Icon = style.icon;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${area.title} | Deporte`} />

      <div className="flex h-full flex-grow flex-col gap-6 rounded-xl p-4">
        <Card className={`overflow-hidden rounded-3xl border shadow-lg ${style.hero}`}>
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/deportes"
                className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al modulo
              </Link>
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 backdrop-blur ${style.heroIconWrap}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                    Programa deportivo
                  </div>
                  <h1 className="text-3xl font-semibold">{area.title}</h1>
                </div>
              </div>
              <p className="max-w-3xl text-sm text-white/85">
                {area.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <Badge className={`w-fit ${style.heroBadge}`}>
                {area.kind === "servicio" ? "Servicio" : "Disciplina"}
              </Badge>
              <div className="text-sm text-white/75">Enfoque principal</div>
              <div className="text-lg font-medium">{area.focus}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard
            title="Tipo de oferta"
            value={area.kind === "servicio" ? "Servicio" : "Disciplina"}
            icon={Icon}
            color="green"
            detail="Clasificacion del catalogo"
          />
          <MetricCard
            title="Participantes"
            value={participantStats.total}
            icon={Trophy}
            color="blue"
            detail="Registros acumulados"
          />
          <MetricCard
            title="Activos"
            value={participantStats.active}
            icon={Dumbbell}
            color="cyan"
            detail="Participantes vigentes"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <Card className={`rounded-3xl border ${style.softCard}`}>
            <CardHeader>
              <CardTitle className="text-foreground dark:text-slate-50">
                Informacion general
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-3xl border p-5 shadow-sm ${style.softCard}`}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Horario</div>
                      <div className={`text-xs uppercase tracking-[0.18em] ${style.subcopy}`}>
                        Programacion
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm ${style.subcopy}`}>
                    {area.schedule}
                  </p>
                </div>
                <div className={`rounded-3xl border p-5 shadow-sm ${style.softCard}`}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Lugar</div>
                      <div className={`text-xs uppercase tracking-[0.18em] ${style.subcopy}`}>
                        Escenario
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm ${style.subcopy}`}>
                    {area.location}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className={`text-base font-semibold ${style.copy}`}>
                      Descripcion
                    </h2>
                    <p className={`text-sm ${style.subcopy}`}>
                      Resumen de la oferta deportiva
                    </p>
                  </div>
                </div>
                <div className={`rounded-3xl border p-5 text-sm leading-7 ${style.subcopy} ${style.emphasisPanel}`}>
                  {area.description}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className={`text-base font-semibold ${style.copy}`}>
                      {area.kind === "servicio"
                        ? "Practicas o implementos disponibles"
                        : "Lineas de trabajo"}
                    </h2>
                    <p className={`text-sm ${style.subcopy}`}>
                      Componentes principales de esta oferta
                    </p>
                  </div>
                </div>
                {area.services.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {area.services.map((service) => (
                      <div
                        key={service}
                        className={`rounded-3xl border p-4 text-sm shadow-sm ${style.chip}`}
                      >
                        {service}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-2xl border border-dashed p-4 text-sm ${style.subcopy}`}>
                    Sin lineas adicionales registradas por ahora.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-3xl border ${style.softCard}`}>
            <CardHeader>
              <CardTitle className="text-foreground dark:text-slate-50">
                Requisitos y control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {area.requirements.map((requirement) => (
                  <div
                    key={requirement}
                    className={`flex items-start gap-3 rounded-3xl border p-4 shadow-sm ${style.softCard}`}
                  >
                    <div className={`mt-0.5 rounded-full p-1.5 ${style.softIcon}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className={`text-sm ${style.subcopy}`}>{requirement}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-3xl border border-dashed p-5 ${style.emphasisPanel}`}>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Gestion operativa</div>
                    <div className={`text-xs uppercase tracking-[0.18em] ${style.subcopy}`}>
                      Seguimiento
                    </div>
                  </div>
                </div>
                <p className={`text-sm ${style.subcopy}`}>
                  Usa la seccion de participantes para llevar registros,
                  mantener el control de la disciplina y exportar informes en
                  CSV cuando lo necesites.
                </p>
                <div className="mt-4 grid gap-3">
                  <div className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${style.copy} ${style.softCard}`}>
                    <ClipboardList className={`h-4 w-4 ${style.action}`} />
                    Registro y actualizacion de participantes
                  </div>
                  <div className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${style.copy} ${style.softCard}`}>
                    <FileSpreadsheet className={`h-4 w-4 ${style.action}`} />
                    Exportacion de informes por disciplina
                  </div>
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link href="/deportes">Volver al catalogo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <ParticipantsSection
          sportKey={area.key}
          sportTitle={area.title}
          participants={participants}
          carreras={carreras}
          stats={participantStats}
        />
      </div>
    </AppLayout>
  );
}
