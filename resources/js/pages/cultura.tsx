import FooterComponent from '@/components/marketing/footer';
import HeaderComponent from '@/components/marketing/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Camera, Film, Mic2, Music, Newspaper, Palette } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import HeaderpermaComponent from './Cultura_vistas/components/header';
import HeroCarousel from './Cultura_vistas/components/hero-carousel';

type CulturaItem = {
    id: number;
    titulo: string;
    descripcion?: string;
    tipo: string;
    fecha: string; // ISO
    categoria?: string;
    imagen_url?: string;
    imagen_banner?: string;
    contenido_json?: unknown;
};

type CulturaProps = {
    eventos: CulturaItem[];
    noticias: CulturaItem[];
    areasCulturales: Array<{ icon: string; title: string }>;
    galeria: CulturaItem[];
};

// Paleta (clara) con acento institucional marrón elegante
const ACCENT = '#8B4513'; // primary

const DEFAULT_IMG = 'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp';

function formatDate(iso?: string) {
    if (!iso) return 'Sin fecha';
    try {
        return new Date(iso).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return 'Sin fecha';
    }
}

function safeImage(item: CulturaItem): string {
    return resolveCulturaImageUrl(item, DEFAULT_IMG);
}

function badgeTone(tipo?: string) {
    const t = (tipo || '').toLowerCase();
    // tonos suaves en claro
    if (t.includes('evento')) return 'bg-emerald-100 text-emerald-800';
    if (t.includes('noticia')) return 'bg-rose-100 text-rose-800';
    if (t.includes('musica')) return 'bg-sky-100 text-sky-800';
    if (t.includes('cine')) return 'bg-indigo-100 text-indigo-800';
    if (t.includes('literatura')) return 'bg-amber-100 text-amber-800';
    if (t.includes('fotografia')) return 'bg-fuchsia-100 text-fuchsia-800';
    if (t.includes('danza') || t.includes('artes')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
}

function areaIcon(name?: string) {
    const n = (name || '').toLowerCase();
    if (n.includes('literatura') || n.includes('poesía') || n.includes('poesia')) return <BookOpen size={32} />;
    if (n.includes('musica') || n.includes('música')) return <Music size={32} />;
    if (n.includes('cine') || n.includes('audiovisual')) return <Film size={32} />;
    if (n.includes('danza')) return <Music size={32} />;
    if (n.includes('fotografia') || n.includes('fotografía')) return <Camera size={32} />;
    if (n.includes('artes') || n.includes('plásticas') || n.includes('plasticas')) return <Palette size={32} />;
    if (n.includes('oratoria') || n.includes('teatro')) return <Mic2 size={32} />;
    return <Mic2 size={32} />; // default
}

export default function Cultura() {
    const { eventos = [], noticias = [], areasCulturales = [], galeria = [] } = usePage<CulturaProps>().props;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Ordenar eventos/noticias por fecha (descendente)
    const eventosOrdenados = useMemo(() => [...eventos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()), [eventos]);

    const noticiasOrdenadas = useMemo(() => [...noticias].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()), [noticias]);

    const eventosDestacados = useMemo(() => eventosOrdenados.slice(0, 6), [eventosOrdenados]);
    const noticiasDestacadas = useMemo(() => noticiasOrdenadas.slice(0, 4), [noticiasOrdenadas]);
    const galeriaDestacada = useMemo(() => galeria.slice(0, 8), [galeria]);
    const cultureSummary = useMemo(
        () => [
            { label: 'Eventos activos', value: eventos.length },
            { label: 'Noticias visibles', value: noticias.length },
            { label: 'Piezas en galería', value: galeria.length },
        ],
        [eventos.length, noticias.length, galeria.length],
    );

    return (
        <>
            <Head title="Cultura Universitaria" />
            <HeaderComponent />

            <main className="min-h-screen bg-[#FDFDFC] text-[#1b1b18]">
                <section className="relative w-full">
                    <HeaderpermaComponent />
                    <HeroCarousel stats={cultureSummary} />
                    <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                </section>

                <section className="w-full py-14 md:py-16" style={{ backgroundColor: '#f8f4e8' }}>
                    <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: ACCENT }}>
                            Cultura y Arte Universitario
                        </h2>
                        <p className="mx-auto max-w-3xl text-lg text-gray-700">
                            Explora lo principal de la agenda cultural sin duplicar tarjetas ni obligarte a recorrer bloques demasiado largos en una
                            sola visita.
                        </p>
                    </div>
                </section>

                <section id="eventos" className="w-full scroll-mt-24 bg-white py-12">
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-2xl font-bold" style={{ color: ACCENT }}>
                                Próximos Eventos Culturales
                            </h3>
                            <div className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-900">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Mostrando {eventosDestacados.length} de {eventosOrdenados.length} eventos
                            </div>
                        </div>

                        {eventosOrdenados.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                                Aún no hay eventos programados.
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {eventosDestacados.map((evento) => {
                                    const img = safeImage(evento);
                                    return (
                                        <Card key={evento.id} className="border border-gray-100 transition-shadow hover:shadow-lg">
                                            <Link href={`/cultura/${evento.id}/item`} aria-label={`Ver ${evento.titulo}`}>
                                                <div className="h-48 overflow-hidden rounded-t-lg bg-gray-100">
                                                    <img src={img} alt={evento.titulo} loading="lazy" className="h-full w-full object-cover" />
                                                </div>
                                            </Link>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone(
                                                            evento.categoria || evento.tipo,
                                                        )}`}
                                                        title={evento.categoria || evento.tipo}
                                                    >
                                                        {evento.categoria || evento.tipo}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{formatDate(evento.fecha)}</span>
                                                </div>
                                                <CardTitle className="mt-2 line-clamp-2 leading-snug">
                                                    <Link
                                                        href={`/cultura/${evento.id}/item`}
                                                        className="underline-offset-4 hover:underline"
                                                        style={{ color: ACCENT }}
                                                    >
                                                        {evento.titulo}
                                                    </Link>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="line-clamp-3 text-gray-700">
                                                    {evento.descripcion || 'Conoce más detalles del evento.'}
                                                </p>
                                                <Link
                                                    href={`/cultura/${evento.id}/item`}
                                                    className="mt-3 inline-flex items-center text-sm font-semibold"
                                                    style={{ color: ACCENT }}
                                                >
                                                    Más información
                                                    <svg
                                                        className="ml-1 h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {eventosOrdenados.length > eventosDestacados.length && (
                            <p className="mt-6 text-sm text-gray-500">
                                Hay {eventosOrdenados.length - eventosDestacados.length} eventos adicionales publicados. Puedes encontrarlos más abajo
                                dentro de las publicaciones culturales.
                            </p>
                        )}
                    </div>
                </section>

                <section id="noticias" className="w-full scroll-mt-24 py-12" style={{ backgroundColor: '#f5f5f0' }}>
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-2xl font-bold" style={{ color: ACCENT }}>
                                Noticias Culturales
                            </h3>
                            <span className="text-sm text-gray-500">Selección reciente de {noticiasDestacadas.length} noticias destacadas</span>
                        </div>

                        {noticiasOrdenadas.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                                No hay noticias culturales disponibles por ahora.
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2">
                                {noticiasDestacadas.map((noticia) => (
                                    <Card key={noticia.id} className="border border-gray-100 transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Newspaper className="h-5 w-5" style={{ color: ACCENT }} />
                                                <span className="text-sm text-gray-500">{formatDate(noticia.fecha)}</span>
                                            </div>
                                            <CardTitle className="line-clamp-2 leading-snug">
                                                <Link
                                                    href={`/cultura/${noticia.id}/item`}
                                                    className="underline-offset-4 hover:underline"
                                                    style={{ color: ACCENT }}
                                                >
                                                    {noticia.titulo}
                                                </Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 line-clamp-3 text-gray-700">{noticia.descripcion || 'Lee la nota completa.'}</p>
                                            <Link href={`/cultura/${noticia.id}/item`} className="text-sm font-semibold" style={{ color: ACCENT }}>
                                                Leer más →
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section id="areas" className="w-full scroll-mt-24 bg-white py-12">
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <h3 className="mb-10 text-center text-2xl font-bold" style={{ color: ACCENT }}>
                            Áreas Culturales
                        </h3>

                        {areasCulturales.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                                Aún no hay áreas culturales configuradas.
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {areasCulturales.map((area, idx) => (
                                    <Card
                                        key={idx}
                                        className="border border-gray-100 p-6 text-center transition-shadow hover:border-gray-200 hover:shadow-md"
                                    >
                                        <div className="mx-auto mb-4" style={{ color: ACCENT }}>
                                            {areaIcon(area.icon)}
                                        </div>
                                        <CardHeader className="pt-0">
                                            <CardTitle>{area.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700">
                                                Espacio institucional para actividades, talleres y muestras relacionadas con esta área.
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section id="galeria" className="w-full scroll-mt-24 py-12" style={{ backgroundColor: '#f8f4e8' }}>
                    <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
                        <h3 className="mb-8 text-2xl font-bold" style={{ color: ACCENT }}>
                            Galería Cultural
                        </h3>

                        {galeria.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                                Aún no hay elementos en la galería.
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {galeriaDestacada.map((item) => {
                                        const img = safeImage(item);
                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/cultura/${item.id}/item`}
                                                className="block aspect-square overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-[1.02]"
                                                aria-label={`Ver ${item.titulo}`}
                                            >
                                                <img src={img} alt={item.titulo} loading="lazy" className="h-full w-full object-cover" />
                                            </Link>
                                        );
                                    })}
                                </div>
                                {galeria.length > galeriaDestacada.length && (
                                    <p className="mt-6 text-sm text-gray-500">
                                        Se muestran {galeriaDestacada.length} elementos para mantener la carga visual ligera.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <FooterComponent />
        </>
    );
}
