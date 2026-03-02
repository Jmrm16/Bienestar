import React from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";

import { MetricCard } from "@/components/component/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Stethoscope,
  HeartPulse,
  Smile,
  Apple,
  Dumbbell,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";

type SaludArea = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: any;
};

const breadcrumbs: BreadcrumbItem[] = [
 
  { title: "Salud", href: "/salud" },
];

const SALUD_AREAS: SaludArea[] = [
  {
    key: "medicina",
    title: "Medicina general",
    description: "Citas, atenciones, remisiones y controles.",
    href: "/salud/medicina-general",
    icon: HeartPulse,
  },
  {
    key: "odontologia",
    title: "Odontología",
    description: "Valoraciones, procedimientos y seguimiento.",
    href: "/salud/odontologia",
    icon: Smile,
  },
  {
    key: "nutricion",
    title: "Nutrición",
    description: "Valoración nutricional y planes de control.",
    href: "/salud/nutricion",
    icon: Apple,
  },
  {
    key: "fisioterapia",
    title: "Fisioterapia",
    description: "Sesiones, evolución y recomendaciones.",
    href: "/salud/fisioterapia",
    icon: Dumbbell,
  },
  {
    key: "quiropraxia",
    title: "Quiropraxia",
    description: "Atenciones y seguimiento por sesión.",
    href: "/salud/quiropraxia",
    icon: Activity,
  },
  {
    key: "cosmiatria",
    title: "Cosmiatría",
    description: "Procedimientos, controles y evidencia.",
    href: "/salud/cosmiatria",
    icon: Sparkles,
  },
];

export default function SaludIndex() {
  const go = (href: string) => router.visit(href);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Salud | Bienestar Universitario" />

      <div className="flex flex-col gap-6 rounded-xl p-4 h-full flex-grow">
        {/* Header */}
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-6 w-6" />
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Módulo de Salud
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-3xl">
                  Selecciona un área para gestionar citas, atenciones y seguimiento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Áreas activas"
            value={SALUD_AREAS.length}
            icon={Stethoscope}
            color="cyan"
            detail="Servicios disponibles"
          />
          <MetricCard
            title="Citas (hoy)"
            value={"—"} // ✅ ahora NO da error
            icon={HeartPulse}
            color="blue"
            detail="Pendiente de integrar"
          />
          <MetricCard
            title="Atenciones (mes)"
            value={"—"} // ✅ ahora NO da error
            icon={Activity}
            color="purple"
            detail="Pendiente de integrar"
          />
          <MetricCard
            title="Remisiones"
            value={"—"} // ✅ ahora NO da error
            icon={ArrowRight}
            color="green"
            detail="Pendiente de integrar"
          />
        </div>

        {/* Botones/cards por área */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SALUD_AREAS.map((a, idx) => (
            <motion.button
              key={a.key}
              onClick={() => go(a.href)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group text-left rounded-2xl border bg-background p-5 shadow-sm hover:shadow-md transition
                         focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border p-2">
                    <a.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base leading-tight">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.description}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">
                  Citas
                </span>
                <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">
                  Atenciones
                </span>
                <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">
                  Reportes
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}