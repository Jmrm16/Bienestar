import { Instagram, BookOpen, Info, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface Tutor {
  nombre: string
  apellido: string
  asignaturas: { id: number; nombre: string }[]
}

interface ProfileSectionProps {
  tutor: Tutor
}

export default function ProfileSection({ tutor }: ProfileSectionProps) {
  return (
    <div className="space-y-6">
{/* Header Section con estilo MetricCard */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  
  transition={{ type: "spring", stiffness: 300, damping: 10 }}
  className="relative rounded-xl border border-blue-500/30 p-6 overflow-hidden shadow-md  bg-card text-card-foreground"
>
  <div className="flex items-start gap-4">
    <div className="relative">
      <img
        alt="Tutor"
        className="w-[120px] h-[120px] rounded-lg object-cover"
      />
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {tutor.nombre} {tutor.apellido}
        </h1>
        <Button variant="outline" size="sm">
          Agregar red social
        </Button>
        
      </div>
      <p className="mt-2 text-gray-400 text-sm">
        Este tutor está asignado a las siguientes asignaturas:
      </p>
      <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
        {tutor.asignaturas.map((asignatura) => (
          <li key={asignatura.id}>{asignatura.nombre}</li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <Instagram className="w-5 h-5 text-blue-400" />
        <span className="text-sm text-gray-400">
          @{tutor.nombre.toLowerCase()}
        </span>
      </div>
    </div>
  </div>

  {/* Burbuja decorativa como fondo degradado difuminado */}
  <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-xl" />
</motion.div>

      {/* Secciones con estilo MetricCard */}
      
      <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Progreso académico</p>
      <div className="flex gap-6 flex-wrap ">
        {/* Bloque 1: Descripción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="relative rounded-xl border border-purple-500/30  p-5 overflow-hidden shadow-md flex-1 min-w-[280px]  bg-card text-card-foreground"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Descripción</span>
            <Info className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-sm text-white mt-2">
            Este tutor tiene amplia experiencia en acompañamiento académico.
          </p>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl" />
        </motion.div>

        {/* Bloque 2: Asignaturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="relative rounded-xl border border-cyan-500/30 bg-[#1a1a1a] p-5 overflow-hidden shadow-md flex-1 min-w-[280px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Asignaturas</span>
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <ul className="text-sm text-white space-y-1 mt-2">
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
