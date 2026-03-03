import type { ComponentType } from "react";
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
  Dumbbell,
  MapPin,
  Trophy,
  Volleyball,
} from "lucide-react";
import { ParticipantsSection } from "./components/ParticipantsSection";
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

const AREA_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  futbol: Trophy,
  voleibol: Volleyball,
  "entrenamiento-funcional": Dumbbell,
  "actividad-fisica-musicalizada": Activity,
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

  const Icon = AREA_ICONS[area.key] ?? Trophy;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${area.title} | Deporte`} />

      <div className="flex h-full flex-grow flex-col gap-6 rounded-xl p-4">
        <Card className="rounded-2xl border-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg">
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
                <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
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
              <Badge className="w-fit border-white/20 bg-white/10 text-white hover:bg-white/10">
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
            icon={Volleyball}
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
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Informacion de la oferta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4" />
                    Horario
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {area.schedule}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Lugar
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {area.location}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-base font-semibold">Descripcion</h2>
                <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
                  {area.description}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-base font-semibold">
                  {area.kind === "servicio"
                    ? "Practicas o implementos disponibles"
                    : "Lineas de trabajo"}
                </h2>
                {area.services.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {area.services.map((service) => (
                      <div
                        key={service}
                        className="rounded-2xl border p-4 text-sm text-muted-foreground"
                      >
                        {service}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    Sin lineas adicionales registradas por ahora.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Requisitos y control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {area.requirements.map((requirement) => (
                <div
                  key={requirement}
                  className="rounded-2xl border p-4 text-sm text-muted-foreground"
                >
                  {requirement}
                </div>
              ))}

              <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                <div className="mb-2 text-sm font-medium">
                  Siguiente paso recomendado
                </div>
                <p className="text-sm text-muted-foreground">
                  Si luego me pasas horarios, responsables o cupos reales, este
                  modulo ya esta listo para parametrizarlos sin rehacer la
                  estructura.
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/deportes">Ver otras disciplinas</Link>
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
