import React from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";

import type { Patient, Carrera } from "../componets/types";
import { AreaHeader } from "../componets/AreaHeader";
import { PatientsSection } from "../componets/PatientsSection";
import ClinicalPanel from "./ClinicalPanel";
import EnfermeriaPanel from "./EnfermeriaPanel";

import {
  HeartPulse,
  Smile,
  Activity,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

type Props = {
  areaKey: string;
  areaTitle: string;
  patients: Patient[];
  carreras: Carrera[]; // ✅ nuevo
  inventoryEnabled?: boolean;
  nursingInventory?: {
    id: number;
    nombre: string;
    presentacion?: string | null;
    lote?: string | null;
    proveedor?: string | null;
    fecha_entrada: string;
    fecha_vencimiento?: string | null;
    cantidad_inicial: number;
    cantidad_disponible: number;
    unidad: string;
    ubicacion?: string | null;
    observaciones?: string | null;
  }[];
  nursingDeliveries?: {
    id: number;
    fecha_entrega: string;
    cantidad: number;
    responsable?: string | null;
    destino?: string | null;
    detalle?: string | null;
    medicamento?: {
      id: number;
      nombre: string;
      presentacion?: string | null;
      unidad: string;
    } | null;
    paciente?: {
      id: number;
      nombre: string;
      documento: string;
    } | null;
  }[];
  nursingActivities?: {
    id: number;
    fecha: string;
    tipo: string;
    descripcion: string;
    responsable?: string | null;
    observaciones?: string | null;
    paciente?: {
      id: number;
      nombre: string;
      documento: string;
    } | null;
  }[];
  nursingStats?: {
    total_medicamentos: number;
    stock_bajo: number;
    proximos_vencer: number;
    entregas_mes: number;
    actividades_mes: number;
  };
  clinicalPanelEnabled?: boolean;
  clinicalRecords?: {
    id: number;
    fecha: string;
    tipo: string;
    motivo_consulta?: string | null;
    evaluacion: string;
    plan_manejo?: string | null;
    responsable?: string | null;
    observaciones?: string | null;
    paciente?: {
      id: number;
      nombre: string;
      documento: string;
    } | null;
  }[];
  clinicalStats?: {
    total_registros: number;
    registros_mes: number;
    pacientes_atendidos: number;
    tipos_registrados: number;
  };
};

const AREA_ICONS: Record<string, LucideIcon> = {
  "medicina-general": HeartPulse,
  odontologia: Smile,
  enfermeria: Activity,

};

export default function AreaPage({
  areaKey,
  areaTitle,
  patients,
  carreras,
  inventoryEnabled,
  nursingInventory,
  nursingDeliveries,
  nursingActivities,
  nursingStats,
  clinicalPanelEnabled,
  clinicalRecords,
  clinicalStats,
}: Props) {
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
          backHref="/salud"
          backLabel="Volver a Salud"
        />

        {areaKey === "medicina-general" || areaKey === "odontologia" ? (
          <ClinicalPanel
            areaKey={areaKey}
            panelEnabled={clinicalPanelEnabled}
            records={clinicalRecords}
            stats={clinicalStats}
            patients={patients}
          />
        ) : null}

        {areaKey === "enfermeria" ? (
          <EnfermeriaPanel
            areaKey={areaKey}
            inventoryEnabled={inventoryEnabled}
            inventory={nursingInventory}
            deliveries={nursingDeliveries}
            activities={nursingActivities}
            stats={nursingStats}
            patients={patients}
          />
        ) : null}

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
