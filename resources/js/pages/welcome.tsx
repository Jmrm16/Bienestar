import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';

declare global {
  interface Window {
    $: any;
    jQuery: any;
    owlCarousel: any;
  }
}

interface Cultura {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagen_banner?: string; // ✅ esta es la clave que necesitas
  fecha?: string; // si usas fecha de evento
  
}


// Reusable animations
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const slideInFromLeft = {
  hidden: { x: -100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

export default function Welcome() {
  // Obtenemos los datos dinámicos de la página
  const { culturas } = (usePage().props as unknown as { culturas: Cultura[] });

  // Función para asignar color según tipo
  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'evento':
        return 'bg-green-600';
      case 'investigacion':
        return 'bg-purple-600';
      case 'internacional':
        return 'bg-blue-600';
      case 'nuevo':
      case 'noticia':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Tomamos solo las primeras 4 publicaciones para mostrar como fortalezas
  const fortalezas = culturas.slice(0, 4);

  // Filtramos las noticias (culturas de tipo 'noticia')
  const noticiasRecientes = culturas
    .filter(item => item.tipo.toLowerCase() === 'noticia')
    .slice(0, 3); // Tomamos solo las 3 más recientes

  useEffect(() => {
    const initOwlCarousel = () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').owlCarousel({
          loop: true,
          nav: true,
          dots: true,
          items: 1,
          autoplay: true,
          autoplayTimeout: 7000,
          autoplayHoverPause: true,
          smartSpeed: 1000,
          animateOut: 'fadeOut',
          animateIn: 'fadeIn'
        });
      } else {
        setTimeout(initOwlCarousel, 100);
      }
    };

    initOwlCarousel();

    return () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').trigger('destroy.owl.carousel');
      }
    };
  }, []);

  const testimonials = [
    {
      quote: "La Universidad de La Guajira me ha brindado herramientas valiosas para mi desarrollo profesional.",
      author: "María González",
      role: "Egresada de Ingeniería"
    },
    {
      quote: "Excelente ambiente académico y docentes altamente capacitados.",
      author: "Carlos Mendoza",
      role: "Estudiante de Derecho"
    },
    {
      quote: "Las oportunidades de investigación son increíbles, muy contento con mi experiencia.",
      author: "Luisa Fernández",
      role: "Investigadora"
    }
  ];

  const slides = [
    {
      img: "https://diariodelnorte.net/wp-content/uploads/2024/02/edificio-Uniguajira-750x375.png",
      title: "Universidad de La Guajira",
      subtitle: "Educación superior de calidad en la región",
      button: "Conócenos",
    },
    {
      img: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      title: "Oportunidades Académicas",
      subtitle: "Programas, becas y desarrollo estudiantil",
      button: "Explorar programas",
    },
  ];

  // Imagen por defecto para noticias
  const defaultNewsImage = "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp";

  return (
    <>
      <Head title="Inicio | Universidad de La Guajira">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <meta name="description" content="Página oficial de la Universidad de La Guajira - Educación superior de calidad en la región" />
      </Head>

      <HeaderComponent />

      <main className="flex min-h-screen flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        {/* Hero Carousel */}
        <section className="w-full relative z-0 mb-12">
          <div className="hero-slider owl-carousel">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="relative min-h-[500px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${slide.img})` }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 z-0" />

                {/* Text Content */}
                <div className="z-10 text-center text-white px-4">
                  <h2 className="text-4xl font-bold mb-4 drop-shadow-md">{slide.title}</h2>
                  <p className="text-lg mb-6 drop-shadow-sm">{slide.subtitle}</p>
                  <Link
                    href="#"
                    className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white font-semibold rounded-lg transition"
                  >
                    {slide.button}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="w-full bg-white dark:bg-gray-900 shadow-md py-6 -mt-10 z-10 relative"
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "📚", title: "Académicos", link: "/" },
                { icon: "🏛️", title: "Admisiones", link: "/" },
                { icon: "🔬", title: "Investigación", link: "/" },
                { icon: "🌎", title: "Internacional", link: "/" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="text-center"
                >
                  <Link 
                    href={item.link}
                    className="block p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <span className="text-3xl mb-2 block">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features Section - Datos dinámicos */}
 
<motion.section 
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="w-full py-16 bg-gray-50 dark:bg-gray-900"
>
  <div className="container mx-auto px-4">
    <motion.div 
      className="text-center mb-12"
      variants={fadeInUp}
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        <span className="text-blue-600">Eventos</span>
      </h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Descubre lo que hace especial a nuestra institución y cómo podemos ayudarte a alcanzar tus metas académicas.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {fortalezas.map((item) => (
        <motion.article 
          key={item.id}
          variants={fadeInUp}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <a href={`/cultura/${item.id}/item`} className="block">
            <div className="overflow-hidden">
              <img
                src={`/storage/${item.imagen_banner}`}
                alt={item.titulo}
                className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </a>

          <div className="p-4">
            {/* Badge dinámico */}
            <span className={`inline-block mb-2 px-3 py-1 text-xs font-medium text-white rounded-full ${getBadgeColor(item.tipo)}`}>
              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
            </span>

            <h3 className="text-base font-bold mb-1">
              <a href={`/cultura/${item.id}/item`} className="hover:text-blue-600 transition">
                {item.titulo}
              </a>
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
              {item.descripcion}
            </p>

            <p className="text-xs text-gray-400 mb-3">
              <i className="far fa-calendar-alt mr-1"></i>
              {item.fecha
                ? new Date(item.fecha).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "Sin fecha"}
            </p>

            <Link
              href={`/cultura/${item.id}/item`}
              className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium inline-flex items-center text-sm"
            >
              Ver más
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.article>
      ))}
    </div>
  </div>
</motion.section>
        {/* News Section - Ahora con datos dinámicos */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="w-full py-16 bg-white dark:bg-gray-900"
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Noticias <span className="text-blue-600">Recientes</span></h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Mantente informado sobre los últimos acontecimientos en nuestra universidad.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {noticiasRecientes.length > 0 ? (
                noticiasRecientes.map((noticia) => (
                  <motion.div 
                    key={noticia.id}
                    variants={fadeInUp}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <div 
                      className="h-48 bg-cover bg-center"
                     style={{ backgroundImage: `url('${noticia.imagen_banner ? `/storage/${noticia.imagen_banner}` : defaultNewsImage}')` }}

                    ></div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium px-2 py-1 rounded">
                          Noticia
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(noticia.fecha)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{noticia.titulo}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {noticia.descripcion}
                      </p>
                      <Link 
                        href={`/cultura/${noticia.id}/item`}
                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium inline-flex items-center"
                      >
                        Leer más
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  variants={fadeInUp}
                  className="col-span-full text-center py-10"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay noticias disponibles en este momento.
                  </p>
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className="text-center mt-12"
              variants={fadeInUp}
            >
              <Link 
                href="/cultura/publica" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
              >
                Ver Todas las Noticias
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="w-full py-16 bg-gray-50 dark:bg-gray-800"
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Testimonios <span className="text-blue-600">de Nuestra Comunidad</span></h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Lo que dicen nuestros estudiantes, egresados y colaboradores sobre su experiencia en la universidad.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg"
                >
                  <div className="mb-6 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 inline-block" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-6">"{item.quote}"</p>
                  <div className="flex items-center">
                    <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                      {item.author.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold">{item.author}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>


      </main>

      <FooterComponent />
    </>
  );
}