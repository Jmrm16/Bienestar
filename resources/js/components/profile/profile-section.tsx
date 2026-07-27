import { Instagram, BookOpen, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface Tutor {
  nombre: string
  apellido: string
  asignaturas: { id: number; nombre: string }[]
  // opcional a futuro: photo_url?: string
}

interface ProfileSectionProps {
  tutor: Tutor
}

/* ===== Utils avatar con iniciales (inline) ===== */
function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? "")
    .join("")
}

function InitialsAvatar({
  name,
  size = 120,
  className = "",
}: {
  name: string
  size?: number
  className?: string
}) {
  const initials = getInitials(name)
  const colors = ["bg-sky-700","bg-indigo-700","bg-cyan-700","bg-teal-700","bg-amber-700","bg-rose-700"]
  const idx = (initials.codePointAt(0) ?? 0) % colors.length
  const cls = `${colors[idx]} text-white`

  return (
    <div
      aria-label={name}
      className={`grid place-items-center rounded-full ${cls} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="font-semibold" style={{ fontSize: Math.round(size * 0.45) }}>
        {initials || "?"}
      </span>
    </div>
  )
}

export default function ProfileSection({ tutor }: ProfileSectionProps) {
  const fullName = `${tutor.nombre} ${tutor.apellido}`.trim()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
        className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-card p-6 text-card-foreground shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            {/* Avatar con iniciales */}
            <InitialsAvatar name={fullName} size={120} />
            <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-[#1a1a1a] bg-green-500" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold ">{fullName}</h1>
              
            </div>

            <p className="mt-2 text-sm text-gray-400">
              Este tutor está asignado a las siguientes asignaturas:
            </p>

            <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
              {tutor.asignaturas.map((asignatura) => (
                <li key={asignatura.id}>{asignatura.nombre}</li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <Instagram className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">
                @{tutor.nombre.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Burbuja decorativa */}
        <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-xl" />
      </motion.div>

      {/* Secciones tipo métricas */}
      <p className="mb-4 text-[30px] font-bold">Progreso académico</p>

      <div className="flex flex-wrap gap-6">
        {/* Descripción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="relative min-w-[280px] flex-1 overflow-hidden rounded-xl border border-purple-500/30 bg-card p-5 text-card-foreground shadow-md"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Descripción</span>
            <Info className="h-5 w-5 text-purple-400" />
          </div>
          <p className="mt-2 text-sm text-white">
            Este tutor tiene amplia experiencia en acompañamiento académico.
          </p>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl" />
        </motion.div>

        {/* Asignaturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="relative min-w-[280px] flex-1 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#1a1a1a] p-5 shadow-md"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Asignaturas</span>
            <BookOpen className="h-5 w-5 text-cyan-400" />
          </div>
          <ul className="mt-2 space-y-1 text-sm text-white">
            {tutor.asignaturas.map((asignatura) => (
              <li key={asignatura.id}>• {asignatura.nombre}</li>
            ))}
          </ul>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 blur-xl" />
        </motion.div>
      </div>
    </div>
  )
}
