import FooterComponent from '@/components/marketing/footer';
import HeaderComponent from '@/components/marketing/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderpermaComponent from './Permanencia_vistas/components/header';
import HeroCarousel from './Permanencia_vistas/components/hero-carousel';

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
                <section className="relative w-full">
                    <HeaderpermaComponent />
                    <HeroCarousel />
                </section>

                <section className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="mb-6 text-3xl leading-tight font-bold text-blue-800 md:text-4xl">
                                Sistema Integral de Permanencia y Graduación Exitosa
                            </h2>
                            <p className="text-lg leading-relaxed text-gray-700 md:text-xl">
                                En la Universidad de La Guajira, sede Maicao, el proceso de Permanencia y Graduación Exitosa articula tutorías,
                                acompañamiento al aprendizaje, seguimiento académico y orientación desde Bienestar Universitario para reducir riesgos
                                de deserción y fortalecer tu éxito académico durante toda tu trayectoria universitaria.
                            </p>
                        </div>
                    </div>
                </section>

                <section id="servicios" className="w-full scroll-mt-24 bg-white py-12 md:py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h3 className="mb-2 text-2xl font-bold text-blue-700 md:text-3xl">Líneas reales de acompañamiento</h3>
                            <p className="mx-auto max-w-2xl text-gray-600">
                                Estas son las acciones institucionales publicadas por el área de Permanencia y Graduación Exitosa.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {serviceLines.map((item) => (
                                <Card
                                    key={item.title}
                                    className="h-full border-blue-100 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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

                <section className="w-full bg-gray-50 py-12 md:py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h3 className="mb-12 text-center text-2xl font-bold text-blue-700 md:text-3xl">¿Cuándo acercarte al programa?</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                            {supportScenarios.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-xl bg-white p-6 text-center shadow-md transition-shadow duration-300 hover:shadow-lg"
                                >
                                    <p className="mb-3 text-xl font-bold text-blue-600 md:text-2xl">{item.title}</p>
                                    <p className="text-base text-gray-700">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="equipo" className="w-full scroll-mt-24 bg-white py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-start gap-12 lg:flex-row">
                            <div className="lg:w-1/2">
                                <img
                                    src="https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp"
                                    alt="Equipo de Permanencia y Graduación"
                                    className="h-auto w-full rounded-xl object-cover shadow-md"
                                />
                            </div>
                            <div className="lg:w-1/2">
                                <h3 className="mb-6 text-2xl font-bold text-blue-700 md:text-3xl">Equipo de referencia en sede Maicao</h3>
                                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                                    La sede Maicao cuenta con responsables institucionales para Bienestar, coordinación académica, permanencia y
                                    graduados. Esto permite que el acompañamiento no dependa solo de una actividad aislada, sino de una ruta
                                    articulada de atención.
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

                <section id="contacto" className="w-full scroll-mt-24 bg-blue-700 py-12 text-white">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 text-center">
                            <h3 className="mb-4 text-2xl font-bold md:text-3xl">Canales reales de contacto</h3>
                            <p className="mx-auto max-w-3xl text-lg">
                                Si necesitas acompañamiento académico, tutorías o información sobre graduación, estos son los canales institucionales
                                para sede Maicao.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {contactPoints.map((item) => (
                                <div key={item.title} className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                                    <p className="text-sm tracking-wide text-blue-100 uppercase">{item.title}</p>
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

                        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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

function ActionLink({ href, variant, children }: { href: string; variant: 'primary' | 'secondary'; children: string }) {
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
