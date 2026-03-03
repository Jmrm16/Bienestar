import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { MetricCard } from "@/components/component/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Trophy, Users, Volleyball } from "lucide-react";
import { getAreaStyle } from "./components/area-styles";

type SportArea = {
  key: string;
  title: string;
  description: string;
  href: string;
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
};

type Stats = {
  offers: number;
  disciplines: number;
  services: number;
  free_time_policy: string;
};

type Props = {
  moduleDescription: string;
  areas: SportArea[];
  stats: Stats;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: "Deporte", href: "/deportes" }];

export default function DeporteIndex({
  moduleDescription,
  areas,
  stats,
}: Props) {
  const go = (href: string) => router.visit(href);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Deporte | Bienestar Universitario" />

      <div className="flex h-full flex-grow flex-col gap-6 rounded-xl p-4">
        <Card className="rounded-2xl border-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <Volleyball className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                      Bienestar universitario
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Modulo de Deporte
                    </h1>
                  </div>
                </div>
                <p className="max-w-3xl text-sm text-white/85">
                  {moduleDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-white/85">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="text-white/70">Ofertas</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {stats.offers}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="text-white/70">Prestamo libre</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {stats.free_time_policy}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Panorama del area
            </h2>
            <p className="text-sm text-muted-foreground">
              Vista general del catalogo deportivo disponible en la sede.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <MetricCard
              title="Ofertas activas"
              value={stats.offers}
              icon={Volleyball}
              color="green"
              detail="Catalogo actual del area"
            />
            <MetricCard
              title="Disciplinas"
              value={stats.disciplines}
              icon={Users}
              color="blue"
              detail="Procesos deportivos listados"
            />
            <MetricCard
              title="Servicios"
              value={stats.services}
              icon={Trophy}
              color="cyan"
              detail="Prestaciones de apoyo al deporte"
            />
            <MetricCard
              title="Practica libre"
              value={stats.free_time_policy}
              icon={Activity}
              color="purple"
              detail="Tiempo maximo para prestamo"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Oferta por disciplina
            </h2>
            <p className="text-sm text-muted-foreground">
              Cada tarjeta resume una oferta y conserva una identidad visual
              propia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {areas.map((area, idx) => {
            const style = getAreaStyle(area.key);
            const Icon = style.icon;

            return (
              <motion.button
                key={area.key}
                onClick={() => go(area.href)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative overflow-hidden rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${style.shell}`}
              >
                <div
                  className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${style.glow}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className={`rounded-2xl border p-3 ${style.iconWrap}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
                    {area.kind === "servicio" ? "Servicio" : "Disciplina"}
                  </span>
                </div>

                <div className="relative mt-5">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {area.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm text-muted-foreground">
                    {area.description}
                  </p>
                </div>

                <div className={`mt-4 rounded-3xl border p-4 ${style.focusPanel}`}>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Enfoque
                  </div>
                  <div className="mt-1 text-sm font-medium leading-6 text-foreground">
                    {area.focus}
                  </div>
                </div>

                {area.services.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {area.services.slice(0, 2).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className={`mt-5 flex items-center justify-between text-sm font-medium ${style.action}`}>
                  <span>Ver informacion</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
