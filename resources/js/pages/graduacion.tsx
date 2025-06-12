import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';
import HeaderpermaComponent from './Permanencia_vistas/headerperma';
import HeroCarousel from './Permanencia_vistas/HeroCarousel ';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Welcome() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Datos reutilizables para mejor mantenimiento
  const services = [
    {
      title: 'Acompañamiento Académico',
      desc: 'Tutorías y seguimiento personalizado a estudiantes con bajo rendimiento académico.',
      icon: '🎓',
    },
    {
      title: 'Orientación Psicológica',
      desc: 'Apoyo emocional y psicopedagógico con profesionales de bienestar universitario.',
      icon: '🧠',
    },
    {
      title: 'Programas de Nivelación',
      desc: 'Estrategias de refuerzo en asignaturas críticas para mejorar el desempeño.',
      icon: '📘',
    }
  ];

  const metrics = [
    { value: '85%', label: 'Tasa de retención 2024-1' },
    { value: '+150', label: 'Estudiantes beneficiados' },
    { value: '12', label: 'Tutores especializados' }
  ];

  return (
    <>
      <Head title="Permanencia y Graduación Exitosa | Universidad de La Guajira - Sede Maicao" />

      <HeaderComponent />

      <main className="flex flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        {/* Hero Section */}
        <section className="w-full relative">
          <HeaderpermaComponent />
          <HeroCarousel />
        </section>

        {/* Bienvenida institucional - Mejorado con gradiente y padding responsive */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 leading-tight">
                Sistema Integral de Permanencia y Graduación Exitosa
              </h2>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                En la Universidad de La Guajira - Sede Maicao, implementamos estrategias de acompañamiento 
                académico, psicosocial y de bienestar para reducir la deserción estudiantil y fortalecer 
                tu éxito académico durante toda tu trayectoria universitaria.
              </p>
            </div>
          </div>
        </section>

        {/* Servicios - Mejorado con hover effects y mejor espaciado */}
        <section className="w-full py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
                Nuestros Servicios
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Conoce las herramientas que hemos diseñado para tu éxito académico
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((item, index) => (
                <Card 
                  key={index} 
                  className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
                >
                  <CardHeader>
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{item.desc}</p>
                  <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
                    Más información →
                  </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Indicadores - Mejorado con animaciones y diseño más atractivo */}
        <section className="w-full py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-12">
              Nuestro Impacto en Cifras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {metrics.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                    {item.value}
                  </p>
                  <p className="text-gray-700 text-lg">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quiénes somos - Mejorado con imagen y layout más interesante */}
        <section className="w-full py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <img 
                  src="/images/equipo-uniguajira.jpg" 
                  alt="Equipo de Permanencia y Graduación"
                  className="rounded-xl shadow-md w-full h-auto object-cover"
                />
              </div>
              <div className="lg:w-1/2">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-6">
                  Sobre Nosotros
                </h3>
                <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                  La iniciativa de Permanencia y Graduación Exitosa es un programa institucional 
                  de la Universidad de La Guajira, sede Maicao, comprometido con el éxito académico 
                  de nuestros estudiantes.
                </p>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Nuestro equipo multidisciplinario está conformado por profesionales en psicología, 
                  pedagogía, docencia y gestión educativa, trabajando articuladamente para brindarte 
                  el apoyo que necesitas en tu proceso formativo.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300">
                  Conoce a nuestro equipo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Sección nueva para mejorar la conversión */}
        <section className="w-full py-12 bg-blue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Necesitas apoyo académico o psicosocial?
            </h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Agenda una cita con nuestro equipo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-blue-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-300">
                Solicitar acompañamiento
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-700 font-bold py-3 px-8 rounded-lg transition-colors duration-300">
                Contactar a un tutor
              </button>
            </div>
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}