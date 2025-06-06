import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderComponent from "@/components/component/header-component";
import FooterComponent from "@/components/component/footer-component";
import CarouselPlugin from './Components/Carousel'
import CarouselSize from './Components/CarouselSize';

import HeaderpermaComponent from './headerperma';
import { CarouselItem } from "@/components/ui/carousel";


interface Cultura {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string; // formato ISO, por ejemplo "2025-06-05T00:00:00.000000Z"
  imagen_banner?: string;
}

interface CulturaPageProps {
  culturas: Cultura[];
}

export default function Cultura({ culturas }: CulturaPageProps) {
  return (
    <>
      <Head title="Cultura - Bienestar Universitario" />
      <HeaderComponent />
      <section className="hero-section w-full">
        <HeaderpermaComponent />
      </section>

      {/* ✅ Carrusel dentro de un section estilizado */}
      <section className="w-full">
        <CarouselPlugin images={culturas.filter(item => item.imagen_banner).map(item => `/storage/${item.imagen_banner}`)} />
      </section>
      {/* Fin del Carrusel */}
      <main className="bg-gray-50 text-gray-800">
                <section className="w-full">
          <div>
            <h1>
              eventos culturales
            </h1>
          </div>
        <CarouselSize culturas={culturas} />
        </section>
        <section className="py-12 text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Publicaciones Culturales</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora las actividades, eventos y noticias relacionadas con nuestra vida cultural universitaria.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {culturas.map((item) => (
            <Card key={item.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-700 text-lg">{item.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.imagen_banner && (
                  <img
                    src={`/storage/${item.imagen_banner}`}
                    alt={item.titulo}
                    className="mb-3 rounded-md max-h-40 w-full object-cover"
                  />
                )}
                <p className="text-sm text-gray-600">{item.descripcion.slice(0, 100)}...</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <FooterComponent />
    </>
  );
}
