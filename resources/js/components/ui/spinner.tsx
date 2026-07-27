import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: keyof typeof sizeClasses;
};

export function Spinner({ className, label, size = "md" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? "Cargando"}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span className={cn("relative inline-flex shrink-0", sizeClasses[size])}>
        <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/70" />
        <span className="absolute inset-[28%] rounded-full bg-primary/12" />
      </span>
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
    </span>
  );
}
