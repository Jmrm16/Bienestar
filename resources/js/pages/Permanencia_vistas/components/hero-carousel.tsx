import { motion } from 'framer-motion';
import { useEffect } from 'react';

const slides = [
    {
        image: 'https://diariodelnorte.net/wp-content/uploads/2024/02/edificio-Uniguajira-750x375.png',
        title: 'Permanencia y Graduación Exitosa',
        subtitle: 'Conoce las rutas de acompañamiento académico y bienestar disponibles en sede Maicao.',
        button: 'Ver líneas de apoyo',
        link: '#servicios',
    },
    {
        image: 'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp',
        title: 'Equipo y canales institucionales',
        subtitle: 'Ubica el equipo de referencia y los contactos oficiales de Bienestar Universitario en Maicao.',
        button: 'Ir a contacto',
        link: '#contacto',
    },
];

export default function HeroCarousel() {
    useEffect(() => {
        const initOwlCarousel = () => {
            const jquery = window.$;

            if (jquery?.fn?.owlCarousel) {
                jquery('.hero-slider').owlCarousel?.({
                    loop: true,
                    nav: false,
                    dots: true,
                    items: 1,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    smartSpeed: 1000,
                });
            } else {
                setTimeout(initOwlCarousel, 100);
            }
        };

        initOwlCarousel();

        return () => {
            const jquery = window.$;

            if (jquery?.fn?.owlCarousel) {
                jquery('.hero-slider').trigger('destroy.owl.carousel');
            }
        };
    }, []);

    return (
        <div className="hero-slider owl-carousel relative">
            {slides.map((slide, i) => (
                <motion.div
                    key={i}
                    className="hs-item relative h-[500px] bg-cover bg-center"
                    style={{ backgroundImage: `url('${slide.image}')` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Banda oscura con contenido en la parte inferior */}
                    <motion.div
                        className="hs-text absolute right-0 bottom-0 left-0 z-20 bg-black/60 p-5 text-white"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <div className="container mx-auto">
                            <motion.h2
                                className="text-3xl font-bold md:text-4xl"
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                            >
                                {slide.title}
                            </motion.h2>
                            <motion.p
                                className="my-2 text-base md:text-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {slide.subtitle}
                            </motion.p>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9 }}>
                                <a
                                    href={slide.link}
                                    className="relative z-30 mt-2 inline-block rounded bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
                                >
                                    {slide.button}
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Capa base opcional para oscurecer imagen */}
                    <div className="absolute inset-0 z-10 bg-black/30"></div>
                </motion.div>
            ))}
        </div>
    );
}
