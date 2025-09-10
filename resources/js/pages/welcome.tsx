import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';

declare global {
  interface Window {
    $: any;
  }
}

interface Cultura {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagen_banner?: string;
  fecha?: string;
}

// Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

export default function Welcome() {
  const { culturas = [] } = (usePage().props as unknown as { culturas: Cultura[] });

  const defaultNewsImage =
    'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp';

  const culturasOrdenadas = useMemo(() => {
    return [...culturas].sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha ? new Date(b.fecha).getTime() : 0;
      return db - da;
    });
  }, [culturas]);

  const fortalezas = useMemo(() => culturasOrdenadas.slice(0, 4), [culturasOrdenadas]);
  const noticiasRecientes = useMemo(
    () => culturasOrdenadas.filter(c => c.tipo?.toLowerCase() === 'noticia').slice(0, 3),
    [culturasOrdenadas]
  );

  const getBadgeTone = (tipo: string) => {
    const t = tipo?.toLowerCase() || '';
    if (t === 'evento') return 'bg-emerald-100 text-emerald-800';
    if (t === 'investigacion') return 'bg-purple-100 text-purple-800';
    if (t === 'internacional') return 'bg-sky-100 text-sky-800';
    if (t === 'nuevo' || t === 'noticia') return 'bg-rose-100 text-rose-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Sin fecha';
    }
  };

  useEffect(() => {
    const init = () => {
      if (window.$?.fn?.owlCarousel) {
        window.$('.hero-slider').owlCarousel({
          loop: true,
          nav: false,
          dots: true,
          items: 1,
          autoplay: true,
          autoplayTimeout: 6500,
          autoplayHoverPause: true,
          smartSpeed: 900,
          animateOut: 'fadeOut',
          animateIn: 'fadeIn',
        });
      } else {
        setTimeout(init, 120);
      }
    };
    init();
    return () => {
      if (window.$?.fn?.owlCarousel) {
        window.$('.hero-slider').trigger('destroy.owl.carousel');
      }
    };
  }, []);

  const slides = [
    {
      img: 'https://diariodelnorte.net/wp-content/uploads/2024/02/edificio-Uniguajira-750x375.png',
      title: 'Universidad de La Guajira',
      subtitle: 'Educación superior de calidad en la región',
      button: { label: 'Conócenos', href: '/institucional' },
    },
    {
      img: 'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp',
      title: 'Oportunidades Académicas',
      subtitle: 'Programas, becas y desarrollo estudiantil',
      button: { label: 'Explorar programas', href: '/programas' },
    },
  ];

  const quickLinks = [
    { icon: '📚', title: 'Académicos', link: '/programas' },
    { icon: '🏛️', title: 'Admisiones', link: '/admisiones' },
    { icon: '🔬', title: 'Investigación', link: '/investigacion' },
    { icon: '🌎', title: 'Internacional', link: '/internacional' },
  ];

  const testimonials = [
    { quote: 'La Universidad de La Guajira me ha brindado herramientas valiosas para mi desarrollo profesional.', author: 'María González', role: 'Egresada de Ingeniería' },
    { quote: 'Excelente ambiente académico y docentes altamente capacitados.', author: 'Carlos Mendoza', role: 'Estudiante de Derecho' },
    { quote: 'Las oportunidades de investigación son increíbles; muy contento con mi experiencia.', author: 'Luisa Fernández', role: 'Investigadora' },
  ];

  return (
    <>
      <Head title="Inicio | Universidad de La Guajira">
        <meta name="description" content="Página oficial de la Universidad de La Guajira - Educación superior de calidad en la región" />
      </Head>

      <HeaderComponent />

      <main className="min-h-screen bg-gray-50 text-gray-800">
        {/* HERO */}
        <section aria-label="Destacados" className="relative">
          <div className="hero-slider owl-carousel">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="relative min-h-[56vh] md:min-h-[64vh] flex items-center"
                style={{ backgroundImage: `url(${slide.img})` }}
              >
                <div className="absolute inset-0 bg-black/55"></div>
                <div className="relative z-10 w-full">
                  <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="max-w-3xl">
                      <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight drop-shadow-sm">
                        {slide.title}
                      </h1>
                      <p className="mt-3 md:mt-4 text-white/90 text-base md:text-lg">
                        {slide.subtitle}
                      </p>
                      <Link href={slide.button.href} className="inline-flex items-center mt-6 px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                        {slide.button.label}
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="-mt-10 relative z-10">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl shadow p-4">
              {quickLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  className="group rounded-xl p-4 hover:bg-gray-100 transition border border-gray-100"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition">
                    Ver más
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* EVENTOS */}
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold">
                <span className="text-blue-600">Eventos</span>
              </h2>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Actividades y oportunidades que fortalecen nuestra comunidad académica.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fortalezas.map(item => (
                <motion.article key={item.id} variants={fadeInUp} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
                  <Link href={`/cultura/${item.id}/item`}>
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img src={item.imagen_banner ? `/storage/${item.imagen_banner}` : defaultNewsImage} alt={item.titulo} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  </Link>
                  <div className="p-5">
                    <span className={`inline-block mb-2 px-3 py-1 text-xs font-medium rounded-full ${getBadgeTone(item.tipo)}`}>
                      {item.tipo}
                    </span>
                    <h3 className="text-lg font-semibold mb-2">
                      <Link href={`/cultura/${item.id}/item`} className="hover:text-blue-600">{item.titulo}</Link>
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{item.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(item.fecha)}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* NOTICIAS */}
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Noticias <span className="text-blue-600">Recientes</span></h2>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Mantente al día con los últimos acontecimientos de nuestra universidad.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticiasRecientes.map(noticia => (
                <motion.article key={noticia.id} variants={fadeInUp} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
                  <div className="relative aspect-[16/9]">
                    <img src={noticia.imagen_banner ? `/storage/${noticia.imagen_banner}` : defaultNewsImage} alt={noticia.titulo} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full">Noticia</span>
                      <time className="text-gray-500">{formatDate(noticia.fecha)}</time>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{noticia.titulo}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{noticia.descripcion}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TESTIMONIOS */}
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Testimonios <span className="text-blue-600">de nuestra comunidad</span></h2>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Voces de estudiantes, egresados y colaboradores.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.blockquote key={i} variants={fadeInUp} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="text-yellow-500">★★★★★</div>
                  <p className="mt-3 italic text-gray-700">“{t.quote}”</p>
                  <footer className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{t.author}</div>
                      <div className="text-sm text-gray-500">{t.role}</div>
                    </div>
                  </footer>
                </motion.blockquote>
              ))}
            </div>
          </div>
        </motion.section>
      </main>

      <FooterComponent />
    </>
  );
}
