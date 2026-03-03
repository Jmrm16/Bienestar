import type { ComponentType } from "react";
import {
  Compass,
  Dumbbell,
  Shield,
  Target,
  Trophy,
  Volleyball,
} from "lucide-react";

export type AreaStyle = {
  icon: ComponentType<{ className?: string }>;
  shell: string;
  iconWrap: string;
  badge: string;
  focusPanel: string;
  action: string;
  glow: string;
  hero: string;
  heroIconWrap: string;
  heroBadge: string;
  softCard: string;
  softIcon: string;
  emphasisPanel: string;
};

const FALLBACK_STYLE: AreaStyle = {
  icon: Volleyball,
  shell:
    "border-slate-200/80 bg-gradient-to-br from-slate-50 via-background to-slate-100 dark:border-slate-800 dark:from-slate-950/20 dark:via-background dark:to-slate-900/10",
  iconWrap:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  badge:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  focusPanel:
    "border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/20",
  action: "text-slate-700 dark:text-slate-300",
  glow: "bg-slate-400/20",
  hero:
    "border-slate-200/70 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white",
  heroIconWrap: "bg-white/15 text-white",
  heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
  softCard:
    "border-slate-200/70 bg-gradient-to-br from-background to-slate-50 dark:border-slate-800 dark:from-background dark:to-slate-900/20",
  softIcon: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  emphasisPanel:
    "border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/20",
};

const AREA_STYLES: Record<string, AreaStyle> = {
  "prestamo-de-implementos-deportivos": {
    icon: Shield,
    shell:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 via-background to-cyan-50 dark:border-sky-900/40 dark:from-sky-950/20 dark:via-background dark:to-cyan-950/10",
    iconWrap:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300",
    badge:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300",
    focusPanel:
      "border-sky-200/70 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/20",
    action: "text-sky-700 dark:text-sky-300",
    glow: "bg-sky-400/20",
    hero:
      "border-sky-400/30 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-sky-200/70 bg-gradient-to-br from-background to-sky-50 dark:border-sky-900/40 dark:from-background dark:to-sky-950/20",
    softIcon: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    emphasisPanel:
      "border-sky-200/70 bg-sky-50/70 dark:border-sky-900/40 dark:bg-sky-950/20",
  },
  voleibol: {
    icon: Volleyball,
    shell:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 via-background to-fuchsia-50 dark:border-violet-900/40 dark:from-violet-950/20 dark:via-background dark:to-fuchsia-950/10",
    iconWrap:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300",
    focusPanel:
      "border-violet-200/70 bg-violet-50/80 dark:border-violet-900/40 dark:bg-violet-950/20",
    action: "text-violet-700 dark:text-violet-300",
    glow: "bg-violet-400/20",
    hero:
      "border-violet-400/30 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-violet-200/70 bg-gradient-to-br from-background to-violet-50 dark:border-violet-900/40 dark:from-background dark:to-violet-950/20",
    softIcon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    emphasisPanel:
      "border-violet-200/70 bg-violet-50/70 dark:border-violet-900/40 dark:bg-violet-950/20",
  },
  baloncesto: {
    icon: Target,
    shell:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10",
    iconWrap:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
    focusPanel:
      "border-amber-200/70 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20",
    action: "text-amber-700 dark:text-amber-300",
    glow: "bg-amber-400/20",
    hero:
      "border-amber-400/30 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-amber-200/70 bg-gradient-to-br from-background to-amber-50 dark:border-amber-900/40 dark:from-background dark:to-amber-950/20",
    softIcon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    emphasisPanel:
      "border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20",
  },
  futbol: {
    icon: Trophy,
    shell:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10",
    iconWrap:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    focusPanel:
      "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20",
    action: "text-emerald-700 dark:text-emerald-300",
    glow: "bg-emerald-400/20",
    hero:
      "border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-emerald-200/70 bg-gradient-to-br from-background to-emerald-50 dark:border-emerald-900/40 dark:from-background dark:to-emerald-950/20",
    softIcon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    emphasisPanel:
      "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  },
  taekwondo: {
    icon: Dumbbell,
    shell:
      "border-rose-200/80 bg-gradient-to-br from-rose-50 via-background to-pink-50 dark:border-rose-900/40 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10",
    iconWrap:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
    focusPanel:
      "border-rose-200/70 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20",
    action: "text-rose-700 dark:text-rose-300",
    glow: "bg-rose-400/20",
    hero:
      "border-rose-400/30 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-rose-200/70 bg-gradient-to-br from-background to-rose-50 dark:border-rose-900/40 dark:from-background dark:to-rose-950/20",
    softIcon: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    emphasisPanel:
      "border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20",
  },
  "futbol-sala": {
    icon: Compass,
    shell:
      "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-background to-blue-50 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:via-background dark:to-blue-950/10",
    iconWrap:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-300",
    focusPanel:
      "border-cyan-200/70 bg-cyan-50/80 dark:border-cyan-900/40 dark:bg-cyan-950/20",
    action: "text-cyan-700 dark:text-cyan-300",
    glow: "bg-cyan-400/20",
    hero:
      "border-cyan-400/30 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-cyan-200/70 bg-gradient-to-br from-background to-cyan-50 dark:border-cyan-900/40 dark:from-background dark:to-cyan-950/20",
    softIcon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    emphasisPanel:
      "border-cyan-200/70 bg-cyan-50/70 dark:border-cyan-900/40 dark:bg-cyan-950/20",
  },
};

export function getAreaStyle(areaKey: string): AreaStyle {
  return AREA_STYLES[areaKey] ?? FALLBACK_STYLE;
}
