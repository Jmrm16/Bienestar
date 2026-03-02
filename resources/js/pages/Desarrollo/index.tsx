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
 
  { title: "Desarrollo Humano", href: "/desarrollo-humano" },
];



export default function DeporteIndex() {
  const go = (href: string) => router.visit(href);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Desarrollo Humano | Bienestar Universitario" />

      

   
    </AppLayout>
  );
}