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
  chip: string;
  focusPanel: string;
  action: string;
  copy: string;
  subcopy: string;
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
    "border-slate-200/80 bg-gradient-to-br from-slate-50 via-background to-slate-100 dark:border-slate-700/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80",
  iconWrap:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  badge:
    "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900",
  chip:
    "border-slate-200/80 bg-white/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-950/80 dark:text-slate-100",
  focusPanel:
    "border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-900/75",
  action: "text-slate-700 dark:text-slate-100",
  copy: "text-slate-800 dark:text-slate-50",
  subcopy: "text-slate-600 dark:text-slate-200",
  glow: "bg-slate-400/20",
  hero:
    "border-slate-200/70 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white",
  heroIconWrap: "bg-white/15 text-white",
  heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
  softCard:
    "border-slate-200/70 bg-gradient-to-br from-background to-slate-50 dark:border-slate-700/70 dark:from-slate-950 dark:to-slate-900/80",
  softIcon: "bg-slate-500/10 text-slate-600 dark:bg-slate-900 dark:text-slate-100",
  emphasisPanel:
    "border-slate-200/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-900/80",
};

const AREA_STYLES: Record<string, AreaStyle> = {
  "prestamo-de-implementos-deportivos": {
    icon: Shield,
    shell:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 via-background to-cyan-50 dark:border-sky-800/70 dark:from-sky-950 dark:via-slate-950 dark:to-cyan-950/80",
    iconWrap:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/90 dark:text-sky-100",
    badge:
      "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/90 dark:text-sky-100 dark:hover:bg-sky-950",
    chip:
      "border-sky-200/80 bg-sky-50/80 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/70 dark:text-sky-100",
    focusPanel:
      "border-sky-200/70 bg-sky-50/80 dark:border-sky-800/70 dark:bg-sky-950/70",
    action: "text-sky-700 dark:text-sky-100",
    copy: "text-sky-900 dark:text-sky-50",
    subcopy: "text-sky-700 dark:text-sky-100/90",
    glow: "bg-sky-400/20",
    hero:
      "border-sky-400/30 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-sky-200/70 bg-gradient-to-br from-background to-sky-50 dark:border-sky-800/70 dark:from-slate-950 dark:to-sky-950/70",
    softIcon: "bg-sky-500/10 text-sky-600 dark:bg-sky-950/90 dark:text-sky-100",
    emphasisPanel:
      "border-sky-200/70 bg-sky-50/70 dark:border-sky-800/70 dark:bg-sky-950/75",
  },
  voleibol: {
    icon: Volleyball,
    shell:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 via-background to-fuchsia-50 dark:border-violet-800/70 dark:from-violet-950 dark:via-slate-950 dark:to-fuchsia-950/80",
    iconWrap:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800/80 dark:bg-violet-950/90 dark:text-violet-100",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800/80 dark:bg-violet-950/90 dark:text-violet-100 dark:hover:bg-violet-950",
    chip:
      "border-violet-200/80 bg-violet-50/80 text-violet-700 dark:border-violet-800/80 dark:bg-violet-950/70 dark:text-violet-100",
    focusPanel:
      "border-violet-200/70 bg-violet-50/80 dark:border-violet-800/70 dark:bg-violet-950/70",
    action: "text-violet-700 dark:text-violet-100",
    copy: "text-violet-900 dark:text-violet-50",
    subcopy: "text-violet-700 dark:text-violet-100/90",
    glow: "bg-violet-400/20",
    hero:
      "border-violet-400/30 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-violet-200/70 bg-gradient-to-br from-background to-violet-50 dark:border-violet-800/70 dark:from-slate-950 dark:to-violet-950/70",
    softIcon: "bg-violet-500/10 text-violet-600 dark:bg-violet-950/90 dark:text-violet-100",
    emphasisPanel:
      "border-violet-200/70 bg-violet-50/70 dark:border-violet-800/70 dark:bg-violet-950/75",
  },
  baloncesto: {
    icon: Target,
    shell:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:border-amber-800/70 dark:from-amber-950 dark:via-slate-950 dark:to-orange-950/80",
    iconWrap:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/90 dark:text-amber-100",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/90 dark:text-amber-100 dark:hover:bg-amber-950",
    chip:
      "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/70 dark:text-amber-100",
    focusPanel:
      "border-amber-200/70 bg-amber-50/80 dark:border-amber-800/70 dark:bg-amber-950/70",
    action: "text-amber-700 dark:text-amber-100",
    copy: "text-amber-900 dark:text-amber-50",
    subcopy: "text-amber-700 dark:text-amber-100/90",
    glow: "bg-amber-400/20",
    hero:
      "border-amber-400/30 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-amber-200/70 bg-gradient-to-br from-background to-amber-50 dark:border-amber-800/70 dark:from-slate-950 dark:to-amber-950/70",
    softIcon: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/90 dark:text-amber-100",
    emphasisPanel:
      "border-amber-200/70 bg-amber-50/70 dark:border-amber-800/70 dark:bg-amber-950/75",
  },
  futbol: {
    icon: Trophy,
    shell:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:border-emerald-800/70 dark:from-emerald-950 dark:via-slate-950 dark:to-teal-950/80",
    iconWrap:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/90 dark:text-emerald-100",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/90 dark:text-emerald-100 dark:hover:bg-emerald-950",
    chip:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/70 dark:text-emerald-100",
    focusPanel:
      "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-800/70 dark:bg-emerald-950/70",
    action: "text-emerald-700 dark:text-emerald-100",
    copy: "text-emerald-900 dark:text-emerald-50",
    subcopy: "text-emerald-700 dark:text-emerald-100/90",
    glow: "bg-emerald-400/20",
    hero:
      "border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-emerald-200/70 bg-gradient-to-br from-background to-emerald-50 dark:border-emerald-800/70 dark:from-slate-950 dark:to-emerald-950/70",
    softIcon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/90 dark:text-emerald-100",
    emphasisPanel:
      "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-800/70 dark:bg-emerald-950/75",
  },
  taekwondo: {
    icon: Dumbbell,
    shell:
      "border-rose-200/80 bg-gradient-to-br from-rose-50 via-background to-pink-50 dark:border-rose-800/70 dark:from-rose-950 dark:via-slate-950 dark:to-pink-950/80",
    iconWrap:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/90 dark:text-rose-100",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800/80 dark:bg-rose-950/90 dark:text-rose-100 dark:hover:bg-rose-950",
    chip:
      "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/70 dark:text-rose-100",
    focusPanel:
      "border-rose-200/70 bg-rose-50/80 dark:border-rose-800/70 dark:bg-rose-950/70",
    action: "text-rose-700 dark:text-rose-100",
    copy: "text-rose-900 dark:text-rose-50",
    subcopy: "text-rose-700 dark:text-rose-100/90",
    glow: "bg-rose-400/20",
    hero:
      "border-rose-400/30 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-rose-200/70 bg-gradient-to-br from-background to-rose-50 dark:border-rose-800/70 dark:from-slate-950 dark:to-rose-950/70",
    softIcon: "bg-rose-500/10 text-rose-600 dark:bg-rose-950/90 dark:text-rose-100",
    emphasisPanel:
      "border-rose-200/70 bg-rose-50/70 dark:border-rose-800/70 dark:bg-rose-950/75",
  },
  "futbol-sala": {
    icon: Compass,
    shell:
      "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-background to-blue-50 dark:border-cyan-800/70 dark:from-cyan-950 dark:via-slate-950 dark:to-blue-950/80",
    iconWrap:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800/80 dark:bg-cyan-950/90 dark:text-cyan-100",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-800/80 dark:bg-cyan-950/90 dark:text-cyan-100 dark:hover:bg-cyan-950",
    chip:
      "border-cyan-200/80 bg-cyan-50/80 text-cyan-700 dark:border-cyan-800/80 dark:bg-cyan-950/70 dark:text-cyan-100",
    focusPanel:
      "border-cyan-200/70 bg-cyan-50/80 dark:border-cyan-800/70 dark:bg-cyan-950/70",
    action: "text-cyan-700 dark:text-cyan-100",
    copy: "text-cyan-900 dark:text-cyan-50",
    subcopy: "text-cyan-700 dark:text-cyan-100/90",
    glow: "bg-cyan-400/20",
    hero:
      "border-cyan-400/30 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 text-white",
    heroIconWrap: "bg-white/15 text-white",
    heroBadge: "border-white/20 bg-white/10 text-white hover:bg-white/10",
    softCard:
      "border-cyan-200/70 bg-gradient-to-br from-background to-cyan-50 dark:border-cyan-800/70 dark:from-slate-950 dark:to-cyan-950/70",
    softIcon: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-950/90 dark:text-cyan-100",
    emphasisPanel:
      "border-cyan-200/70 bg-cyan-50/70 dark:border-cyan-800/70 dark:bg-cyan-950/75",
  },
};

export function getAreaStyle(areaKey: string): AreaStyle {
  return AREA_STYLES[areaKey] ?? FALLBACK_STYLE;
}
