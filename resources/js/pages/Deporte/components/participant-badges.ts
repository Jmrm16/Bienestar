export const PARTICIPANT_STATES = ["Activo", "Inactivo", "Retirado"] as const;

export const PARTICIPANT_ESTAMENTOS = [
  "Estudiante",
  "Docente",
  "Administrativo",
  "Egresado",
  "Invitado",
] as const;

export function getParticipantStateBadgeClass(state: string) {
  switch (state) {
    case "Activo":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/80 dark:text-emerald-100";
    case "Inactivo":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/80 dark:text-amber-100";
    case "Retirado":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/80 dark:text-rose-100";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100";
  }
}

export function getParticipantEstamentoBadgeClass(estamento: string) {
  switch (estamento) {
    case "Estudiante":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/80 dark:text-sky-100";
    case "Docente":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/80 dark:bg-violet-950/80 dark:text-violet-100";
    case "Administrativo":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800/80 dark:bg-cyan-950/80 dark:text-cyan-100";
    case "Egresado":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/80 dark:bg-orange-950/80 dark:text-orange-100";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100";
  }
}
