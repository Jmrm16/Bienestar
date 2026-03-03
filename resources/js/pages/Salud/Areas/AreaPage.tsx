import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";

import type { Patient, Carrera } from "../componets/types";
import { AreaHeader } from "../componets/AreaHeader";
import { PatientsSection } from "../componets/PatientsSection";

import {
  HeartPulse,
  Smile,
  Apple,
  Dumbbell,
  Activity,
  Sparkles,
  Stethoscope,
} from "lucide-react";

type Props = {
  areaKey: string;
  areaTitle: string;
  patients: Patient[];
  carreras: Carrera[]; // ✅ nuevo
};

const AREA_ICONS: Record<string, any> = {
  "medicina-general": HeartPulse,
  odontologia: Smile,
  enfermeria: Activity,

};

export default function AreaPage({ areaKey, areaTitle, patients, carreras }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
   
    { title: "Salud", href: "/salud" },
    { title: areaTitle, href: `/salud/${areaKey}` },
  ];

  const Icon = AREA_ICONS[areaKey] ?? Stethoscope;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${areaTitle} | Salud`} />

      <div className="flex flex-col gap-6 rounded-xl p-4 h-full flex-grow">
        <AreaHeader
          title={areaTitle}
          subtitle="Gestione pacientes, citas y atenciones desde esta área."
          icon={Icon}
          badge="Salud"
        />

        {/* ✅ pasa carreras */}
        <PatientsSection
          areaKey={areaKey}
          patients={patients ?? []}
          carreras={carreras ?? []}
        />
      </div>
    </AppLayout>
  );
}