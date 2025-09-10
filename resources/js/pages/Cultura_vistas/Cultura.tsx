import { Head, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderComponent from "@/components/component/header-component";
import FooterComponent from "@/components/component/footer-component";
import CarouselPlugin from "./Components/Carousel";
import CarouselSize from "./Components/CarouselSize";
import HeaderpermaComponent from "./headerperma";

interface Cultura {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string; // ISO: "2025-06-05T00:00:00.000000Z"
  imagen_banner?: string;
}

interface CulturaPageProps {
  culturas: Cultura[];
}

const DEFAULT_IMG =
  "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp";

function formatDate(iso?: string) {
  if (!iso) return "Sin fecha";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Sin fecha";
  }
}

function badgeTone(tipo?: string) {
  const t = (tipo || "").toLowerCase();
  if (t === "evento") return "bg-emerald-100 text-emerald-800";
  if (t === "investigacion") return "bg-purple-100 text-purple-800";
  if (t === "internacional") return "bg-sky-100 text-sky-800";
  if (t === "noticia" || t === "nuevo") return "bg-rose-100 text-rose-800";
  return "bg-gray-100 text-gray-800";
}

export default function Cultura({ culturas }: CulturaPageProps) {
  const images = (culturas || [])
    .filter((c) => !!c.imagen_banner)
    .map((c) => `/storage/${c.imagen_banner}`);

  // Orden por fecha descendente para publicaciones
  const ordenadas = [...(culturas || [])].sort((a, b) => {
    const da = a.fecha ? new Date(a.fecha).getTime() : 0;
    const db = b.fecha ? new Date(b.fecha).getTime() : 0;
    return db - da;
  });

  return (
    <>
      <Head title="Cultura - Bienestar Universitario" />
      <HeaderComponent />

      {/* Hero encabezado permanente */}
      <section className="w-full">
        <HeaderpermaComponent />
      </section>

      {/* Carrusel principal */}
      <section className="w-full bg-white">
        {images.length > 0 ? (
          <CarouselPlugin images={images} />
        ) : (
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No hay banners disponibles para mostrar en este momento.
            </div>
          </div>
        )}
      </section>

      <main className="bg-gray-50 text-gray-800">
        {/* Eventos culturales destacados / slider por tarjetas */}
        <section className="w-full py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-800">
                Eventos culturales
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Explora la agenda cultural de nuestra comunidad universitaria.
              </p>
            </header>
            <CarouselSize culturas={ordenadas} />
          </div>
        </section>

        {/* Publicaciones culturales (grilla) */}
        <section className="w-full py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <header className="text-center mb-6 md:mb-10">
              <h2 className="text-3xl font-bold text-blue-800 mb-2">
                Publicaciones Culturales
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Actividades, eventos y noticias que fortalecen la vida cultural
                universitaria.
              </p>
            </header>

            {ordenadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                Aún no hay publicaciones culturales.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ordenadas.map((item) => (
                  <Card
                    key={item.id}
                    className="shadow-sm border border-gray-100 hover:shadow-lg transition"
                  >
                    <CardHeader className="pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-blue-700 text-lg leading-snug line-clamp-2">
                          <Link
                            href={`/cultura/${item.id}/item`}
                            className="hover:underline underline-offset-4"
                          >
                            {item.titulo}
                          </Link>
                        </CardTitle>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone(
                            item.tipo
                          )}`}
                          title={item.tipo}
                        >
                          {item.tipo}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDate(item.fecha)}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <Link href={`/cultura/${item.id}/item`} aria-label={`Ver ${item.titulo}`}>
                        <div className="overflow-hidden rounded-md">
                          <img
                            src={
                              item.imagen_banner
                                ? `/storage/${item.imagen_banner}`
                                : DEFAULT_IMG
                            }
                            alt={item.titulo}
                            loading="lazy"
                            className="w-full max-h-44 object-cover transition-transform duration-500 hover:scale-[1.03]"
                          />
                        </div>
                      </Link>

                      <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                        {item.descripcion}
                      </p>

                      <div className="mt-4">
                        <Link
                          href={`/cultura/${item.id}/item`}
                          className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Ver más
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}
