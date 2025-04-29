import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import ProfileSection from '@/components/component/profile-section'
import { Button } from '@/components/ui/button' // Adjust the path based on your project structure
import Estado from '@/components/component/estado'


interface Tutor {
  nombre: string
  apellido: string
  asignaturas: { id: number; nombre: string }[]
}

export default function TutorProfile() {
  const { props } = usePage()
  const tutor = props.tutor as Tutor

  return (
    <AppLayout>
      <Head title={`Perfil del Tutor - ${tutor.nombre} ${tutor.apellido}`} />

      <motion.div
        className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Encabezado con búsqueda y avatar */}
       
        {/* Información principal */}
        
        <p style={{ fontSize: '30px', fontWeight: 'bold' }} className="mb-4">Perfil del Tutor</p>

        <div className="space-y-6">
          {/* Card principal */}
          <ProfileSection tutor={tutor} />
        </div>

          {/* Estado a la derecha */}
          <div className="w-full lg:w-[400px]">
            <Estado />
          </div>
      </motion.div>
    </AppLayout>
  )
}
