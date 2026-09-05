import FooterComponent from '@/components/marketing/footer';
import HeaderComponent from '@/components/marketing/header';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';

interface Cultura {
    id: number;
    tipo: string;
    titulo: string;
    descripcion: string;
    imagen_banner?: string;
    imagen_url?: string | null;
    fecha?: string;
    contenido_json?: unknown;
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
    const { culturas = [] } = usePage().props as unknown as { culturas: Cultura[] };

    const defaultNewsImage = 'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp';

    const culturasOrdenadas = useMemo(() => {
        return [...culturas].sort((a, b) => {
            const da = a.fecha ? new Date(a.fecha).getTime() : 0;
            const db = b.fecha ? new Date(b.fecha).getTime() : 0;
            return db - da;
        });
    }, [culturas]);

    const fortalezas = useMemo(() => culturasOrdenadas.slice(0, 4), [culturasOrdenadas]);
    const noticiasRecientes = useMemo(() => culturasOrdenadas.filter((c) => c.tipo?.toLowerCase() === 'noticia').slice(0, 3), [culturasOrdenadas]);

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
            const jquery = window.$;

            if (jquery?.fn?.owlCarousel) {
                jquery('.hero-slider').owlCarousel?.({
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
            const jquery = window.$;

            if (jquery?.fn?.owlCarousel) {
                jquery('.hero-slider').trigger('destroy.owl.carousel');
            }
        };
    }, []);

    const slides = [
        {
            img: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo16BTxd_JpF4S1J-W9FyE0tOM6RsWonQq4zQTBby_myZ69nExSLgI-G1Q9ePd-FBvvMnczNe5TZxRoteiXkxB5doAbRhDqHNCfLERV5gRaNLmkICjcuTiQzXkusW1XfegCD2w3xA=s680-w680-h510-rw',
            title: 'Universidad de La Guajira',
            subtitle: 'Educación superior de calidad en la región',
            button: { label: 'Conócenos', href: '/institucional' },
        },
        {
            img: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweq7zl7WYXF7B4Pc6oDf1b1sA9JlrwYqT0IL3egAsTXIesRhr6RHMV-X_6wNsF3ZGsoST0wZj4LQbM9DfDxTl_Lm5HPhoF4h7-YcRVKe34nwJjgyTHfMsFoZf3zA4xwpJBQBfsGz=s680-w680-h510-rw',
            title: 'Oportunidades Académicas',
            subtitle: 'Programas, becas y desarrollo estudiantil',
            button: { label: 'Explorar programas', href: '/programas' },
        },
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
                                className="relative flex min-h-[56vh] items-center md:min-h-[64vh]"
                                style={{ backgroundImage: `url(${slide.img})` }}
                            >
                                <div className="absolute inset-0 bg-black/55"></div>
                                <div className="relative z-10 w-full">
                                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                                        <div className="max-w-3xl">
                                            <h1 className="text-3xl leading-tight font-bold text-white drop-shadow-sm md:text-5xl">{slide.title}</h1>
                                            <p className="mt-3 text-base text-white/90 md:mt-4 md:text-lg">{slide.subtitle}</p>
                                            <Link
                                                href={slide.button.href}
                                                className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                                            >
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
                <section className="relative z-10 -mt-10">
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-4 shadow md:grid-cols-4"></div>
                    </div>
                </section>

                {/* EVENTOS */}
                <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-16 md:py-20">
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <motion.div variants={fadeInUp} className="mb-12 text-center">
                            <h2 className="text-3xl font-bold">
                                <span className="text-blue-600">Eventos</span>
                            </h2>
                            <p className="mx-auto mt-2 max-w-2xl text-gray-600">
                                Actividades y oportunidades que fortalecen nuestra comunidad académica.
                            </p>
                        </motion.div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {fortalezas.map((item) => (
                                <motion.article
                                    key={item.id}
                                    variants={fadeInUp}
                                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:shadow-lg"
                                >
                                    <Link href={`/cultura/${item.id}/item`}>
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <img
                                                src={resolveCulturaImageUrl(item, defaultNewsImage)}
                                                alt={item.titulo}
                                                className="h-full w-full object-cover transition-transform hover:scale-105"
                                            />
                                        </div>
                                    </Link>
                                    <div className="p-5">
                                        <span className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${getBadgeTone(item.tipo)}`}>
                                            {item.tipo}
                                        </span>
                                        <h3 className="mb-2 text-lg font-semibold">
                                            <Link href={`/cultura/${item.id}/item`} className="hover:text-blue-600">
                                                {item.titulo}
                                            </Link>
                                        </h3>
                                        <p className="line-clamp-3 text-sm text-gray-600">{item.descripcion}</p>
                                        <p className="mt-2 text-xs text-gray-500">{formatDate(item.fecha)}</p>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* NOTICIAS */}
                <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white py-16">
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <motion.div variants={fadeInUp} className="mb-12 text-center">
                            <h2 className="text-3xl font-bold">
                                Noticias <span className="text-blue-600">Recientes</span>
                            </h2>
                            <p className="mx-auto mt-2 max-w-2xl text-gray-600">
                                Mantente al día con los últimos acontecimientos de nuestra universidad.
                            </p>
                        </motion.div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {noticiasRecientes.map((noticia) => (
                                <motion.article
                                    key={noticia.id}
                                    variants={fadeInUp}
                                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:shadow-lg"
                                >
                                    <div className="relative aspect-[16/9]">
                                        <img
                                            src={resolveCulturaImageUrl(noticia, defaultNewsImage)}
                                            alt={noticia.titulo}
                                            className="h-full w-full object-cover transition-transform hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between text-xs">
                                            <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">Noticia</span>
                                            <time className="text-gray-500">{formatDate(noticia.fecha)}</time>
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">{noticia.titulo}</h3>
                                        <p className="line-clamp-3 text-sm text-gray-600">{noticia.descripcion}</p>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </motion.section>
            </main>

            <FooterComponent />
        </>
    );
}
