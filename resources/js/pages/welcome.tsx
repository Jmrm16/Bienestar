import { Head, Link } from '@inertiajs/react';
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

  // Data for sections
  const features = [
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "new",
      title: "Programas Académicos",
      desc: "Explora nuestra amplia oferta de programas de pregrado y posgrado."
    },
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "event",
      title: "Eventos Culturales",
      desc: "Participa en nuestras actividades culturales y artísticas."
    },
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "research",
      title: "Investigación",
      desc: "Conoce nuestros proyectos de investigación e innovación."
    },
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "international",
      title: "Cooperación Internacional",
      desc: "Oportunidades de movilidad y convenios internacionales."
    }
  ];

  const recentNews = [
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "announcement",
      title: "Convocatorias Abiertas",
      desc: "Nuevas convocatorias para becas y ayudas económicas.",
      date: "15 Junio 2024"
    },
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "event",
      title: "Semana de la Ciencia",
      desc: "Participa en nuestra semana dedicada a la divulgación científica.",
      date: "20 Junio 2024"
    },
    {
      bg: "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp",
      category: "academic",
      title: "Nuevos Programas",
      desc: "Conoce nuestros nuevos programas académicos para el próximo semestre.",
      date: "25 Junio 2024"
    }
  ];

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
    useEffect(() => {
    const initOwlCarousel = () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').owlCarousel({
          loop: true,
          nav: true,
          dots: true,
          items: 1,
          autoplay: true,
          autoplayTimeout: 6000,
          autoplayHoverPause: true,
          smartSpeed: 1000,
          navText: ["", ""]
        });
      } else {
        setTimeout(initOwlCarousel, 200);
      }
    };

    initOwlCarousel();

    return () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').trigger('destroy.owl.carousel');
      }
    };
  }, []);

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
                { icon: "📚", title: "Académicos", link: "/academicos" },
                { icon: "🏛️", title: "Admisiones", link: "/admisiones" },
                { icon: "🔬", title: "Investigación", link: "/investigacion" },
                { icon: "🌎", title: "Internacional", link: "/internacional" }
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

        {/* Features Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestras <span className="text-blue-600">Fortalezas</span></h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Descubre lo que hace especial a nuestra institución y cómo podemos ayudarte a alcanzar tus metas académicas.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${item.bg}')` }}
                  >
                    <span className={`absolute top-3 left-3 ${
                      item.category === 'new' ? 'bg-red-600' : 
                      item.category === 'event' ? 'bg-green-600' : 
                      item.category === 'research' ? 'bg-purple-600' : 'bg-blue-600'
                    } text-white px-3 py-1 rounded-full text-xs`}>
                      {item.category === 'new' ? 'Nuevo' : 
                       item.category === 'event' ? 'Evento' : 
                       item.category === 'research' ? 'Investigación' : 'Internacional'}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{item.desc}</p>
                    <Link 
                      href="#" 
                      className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium inline-flex items-center"
                    >
                      Ver más
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* News Section */}
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
              {recentNews.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url('${item.bg}')` }}
                  ></div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.category === 'announcement' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        item.category === 'event' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {item.category === 'announcement' ? 'Anuncio' : 
                         item.category === 'event' ? 'Evento' : 'Académico'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.date}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{item.desc}</p>
                    <Link 
                      href="#" 
                      className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium inline-flex items-center"
                    >
                      Leer más
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="text-center mt-12"
              variants={fadeInUp}
            >
              <Link 
                href="/noticias" 
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

        {/* Call to Action */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full py-16 bg-blue-600 text-white"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para comenzar tu viaje académico?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Únete a nuestra comunidad universitaria y descubre un mundo de oportunidades.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/admisiones" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition duration-300"
              >
                Admisiones
              </Link>
              <Link 
                href="/contacto" 
                className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 rounded-lg transition duration-300"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <FooterComponent />
    </>
  );
}