import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderComponent from '@/components/marketing/header';
import FooterComponent from '@/components/marketing/footer';
import HeaderpermaComponent from './Permanencia_vistas/components/header';
import HeroCarousel from './Permanencia_vistas/components/hero-carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const serviceLines = [
  {
    title: 'Tutorías académicas',
    desc: 'Acompañamiento en asignaturas de alta repitencia para fortalecer el rendimiento y prevenir la deserción.',
    detail: 'Dirigido a estudiantes que requieren refuerzo en cursos críticos.',
  },
  {
    title: 'Acompañamiento al aprendizaje',
    desc: 'Seguimiento formativo para estudiantes de primero y segundo semestre con adaptación académica inicial.',
    detail: 'Incluye orientación en hábitos de estudio y seguimiento temprano.',
  },
  {
    title: 'Estudiante repitente',
    desc: 'Ruta de apoyo para quienes cursan una asignatura por tercera o cuarta vez.',
    detail: 'Busca mejorar permanencia, organización académica y continuidad del proceso formativo.',
  },
  {
    title: 'Promoción a la graduación exitosa',
    desc: 'Orientación para cerrar tu trayectoria universitaria y avanzar hacia el egreso y la graduación.',
    detail: 'Articula acompañamiento académico, bienestar y seguimiento institucional.',
  },
  {
    title: 'Mentorías y seguimiento',
    desc: 'Apoyo cercano desde bienestar y el equipo académico para detectar riesgos y activar respuestas oportunas.',
    detail: 'Se trabaja de forma articulada con coordinación académica y bienestar social universitario.',
  },
];

const supportScenarios = [
  {
    title: 'Bajo rendimiento académico',
    desc: 'Si estás presentando dificultades en una asignatura, puedes solicitar orientación y ser remitido a tutorías.',
  },
  {
    title: 'Alta repitencia',
    desc: 'Las acciones de permanencia priorizan cursos con mayor dificultad y estudiantes que necesitan refuerzo continuo.',
  },
  {
    title: 'Riesgo de deserción',
    desc: 'Bienestar, permanencia y el equipo académico coordinan acciones para atender factores académicos y psicosociales.',
  },
];

const teamMembers = [
  {
    name: 'Juliana Castellanos González',
    role: 'Directora provincial de sede Maicao',
  },
  {
    name: 'Jhon Jairo de la Rosa Mulford',
    role: 'Coordinador de Bienestar Social Universitario',
  },
  {
    name: 'Cindy Vanessa Hanny Cobo',
    role: 'Líder del proceso de Permanencia y Graduación',
  },
  {
    name: 'Carmen Paola Jiménez Martínez',
    role: 'Coordinadora académica',
  },
  {
    name: 'Elvira Blanco Gutiérrez',
    role: 'Líder del proceso de Oficina de Graduados',
  },
];

const contactPoints = [
  {
    title: 'Correo del programa en Maicao',
    value: 'permanenciamaicao@uniguajira.edu.co',
    href: 'mailto:permanenciamaicao@uniguajira.edu.co',
  },
  {
    title: 'Conmutador Bienestar sede Maicao',
    value: '(605) 728 2729 ext. 306',
    href: 'tel:+576057282729',
  },
  {
    title: 'Ubicación',
    value: 'Calle 16 No. 28A - 80, salida a Riohacha, Maicao, La Guajira',
  },
  {
    title: 'Horario de atención',
    value: 'Lunes a viernes, de 8:00 a. m. a 12:00 m. y de 3:00 p. m. a 7:00 p. m.',
  },
  {
    title: 'Atención institucional',
    value: 'atencionalciudadano@uniguajira.edu.co',
    href: 'mailto:atencionalciudadano@uniguajira.edu.co',
  },
];

export default function Welcome() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Head title="Permanencia y Graduación Exitosa | Universidad de La Guajira - Sede Maicao" />

      <HeaderComponent />

      <main className="flex flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        <section className="w-full relative">
          <HeaderpermaComponent />
          <HeroCarousel />
        </section>

        <section className="w-full py-12 md:py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 leading-tight">
                Sistema Integral de Permanencia y Graduación Exitosa
              </h2>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                En la Universidad de La Guajira, sede Maicao, el proceso de Permanencia y Graduación Exitosa
                articula tutorías, acompañamiento al aprendizaje, seguimiento académico y orientación desde
                Bienestar Universitario para reducir riesgos de deserción y fortalecer tu éxito académico
                durante toda tu trayectoria universitaria.
              </p>
            </div>
          </div>
        </section>

        <section id="servicios" className="w-full py-12 md:py-16 bg-white scroll-mt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
                Líneas reales de acompañamiento
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Estas son las acciones institucionales publicadas por el área de Permanencia y Graduación Exitosa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {serviceLines.map((item) => (
                <Card
                  key={item.title}
                  className="border-blue-100 text-left hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-800">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">{item.desc}</p>
                    <p className="text-sm text-gray-500">{item.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-12">
              ¿Cuándo acercarte al programa?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {supportScenarios.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <p className="text-xl md:text-2xl font-bold text-blue-600 mb-3">
                    {item.title}
                  </p>
                  <p className="text-gray-700 text-base">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="equipo" className="w-full py-12 md:py-20 bg-white scroll-mt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start gap-12">
              <div className="lg:w-1/2">
                <img
                  src="https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp"
                  alt="Equipo de Permanencia y Graduación"
                  className="rounded-xl shadow-md w-full h-auto object-cover"
                />
              </div>
              <div className="lg:w-1/2">
                <h3 className="text-2xl md:text-3xl font-bold text-blue-700 mb-6">
                  Equipo de referencia en sede Maicao
                </h3>
                <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                  La sede Maicao cuenta con responsables institucionales para Bienestar, coordinación
                  académica, permanencia y graduados. Esto permite que el acompañamiento no dependa solo
                  de una actividad aislada, sino de una ruta articulada de atención.
                </p>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                      <p className="font-semibold text-blue-900">{member.name}</p>
                      <p className="text-sm text-gray-700">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className="w-full py-12 bg-blue-700 text-white scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Canales reales de contacto
              </h3>
              <p className="text-lg max-w-3xl mx-auto">
                Si necesitas acompañamiento académico, tutorías o información sobre graduación, estos son
                los canales institucionales para sede Maicao.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {contactPoints.map((item) => (
                <div key={item.title} className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-blue-100">{item.title}</p>
                  {item.href ? (
                    <a href={item.href} className="mt-2 block text-lg font-semibold hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <ActionLink href="/permanencia/tutorias" variant="primary">
                Ver directorio de tutorías
              </ActionLink>
              <ActionLink href="mailto:permanenciamaicao@uniguajira.edu.co" variant="secondary">
                Escribir al programa
              </ActionLink>
            </div>
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}

function ActionLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'primary' | 'secondary';
  children: string;
}) {
  const className =
    variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 font-bold text-blue-700 transition-colors duration-300 hover:bg-gray-100'
      : 'inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-3 font-bold text-white transition-colors duration-300 hover:bg-white hover:text-blue-700';

  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}


