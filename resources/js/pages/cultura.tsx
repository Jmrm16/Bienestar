import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';
import HeaderpermaComponent from './Cultura_vistas/headerperma';
import HeroCarousel from './Cultura_vistas/HeroCarousel ';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Cultura() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Head title="Inicio - Cultura" />

      <HeaderComponent />

      <main className="flex flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        {/* Hero Section - Carrusel */}
        <section className="w-full">
          <HeaderpermaComponent />
          <HeroCarousel />
        </section>

        {/* Bienvenida institucional */}
        <section className="w-full py-16 bg-blue-50 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">
              Bienvenido al Sistema de Permanencia y Graduación Exitosa
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Este sistema promueve estrategias de acompañamiento académico, psicosocial y de bienestar para reducir la deserción estudiantil y fortalecer el éxito académico en la Universidad de La Guajira - Sede Maicao.
            </p>
          </div>
        </section>

        {/* Servicios institucionales */}
        <section className="w-full py-12 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold text-center mb-10 text-blue-700">Servicios Destacados</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[{
                title: 'Acompañamiento Académico',
                desc: 'Tutorías y seguimiento personalizado a estudiantes con bajo rendimiento.',
                icon: '🎓',
              }, {
                title: 'Orientación Psicológica',
                desc: 'Apoyo emocional y psicopedagógico con profesionales de bienestar.',
                icon: '🧠',
              }, {
                title: 'Nivelación y Refuerzo',
                desc: 'Estrategias de refuerzo en asignaturas críticas.',
                icon: '📘',
              }].map((item, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="text-4xl mb-2">{item.icon}</div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section className="w-full py-12 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-blue-700 mb-8">Indicadores de Impacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{
                value: '85%',
                label: 'Tasa de retención 2024-1'
              }, {
                value: '+150',
                label: 'Estudiantes beneficiados'
              }, {
                value: '12',
                label: 'Tutores activos'
              }].map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-blue-600 text-4xl">{item.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quiénes somos */}
        <section className="w-full py-16 bg-white text-center">
          <div className="container mx-auto px-4 max-w-4xl">
            <h3 className="text-2xl font-bold text-blue-700 mb-6">Quiénes Somos</h3>
            <p className="text-lg text-gray-700">
              Somos una iniciativa institucional de la Universidad de La Guajira, sede Maicao, dedicada a fortalecer el proceso educativo mediante acciones concretas que promuevan la permanencia y graduación oportuna. Nuestro equipo está conformado por profesionales en bienestar, psicología, docencia y gestión educativa.
            </p>
          </div>
        </section>

        <div className="h-10" />
      </main>

      <FooterComponent />
    </>
  );
}
