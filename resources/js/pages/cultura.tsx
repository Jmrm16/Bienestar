import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderComponent from '@/components/component/header-component';
import FooterComponent from '@/components/component/footer-component';
import HeaderpermaComponent from './Cultura_vistas/headerperma';
import HeroCarousel from './Cultura_vistas/HeroCarousel ';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Newspaper, Mic2, Music, Film, BookOpen } from 'lucide-react';

type CulturaItem = {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  fecha: string;
  categoria?: string;
  imagen_url?: string;
  imagen_banner?: string;
  contenido_json?: any;
};

type CulturaProps = {
  eventos: CulturaItem[];
  noticias: CulturaItem[];
  areasCulturales: Array<{ icon: string; title: string }>;
  galeria: CulturaItem[];
};

export default function Cultura() {
  const { eventos = [], noticias = [], areasCulturales = [], galeria = [] } = usePage<CulturaProps>().props;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const extraerPrimeraImagen = (contenido_json: any): string | null => {
    try {
      const parsed = typeof contenido_json === 'string' ? JSON.parse(contenido_json) : contenido_json;
      const imageBlock = parsed?.blocks?.find((b: any) => b.type === 'image');
      return imageBlock?.data?.file?.url || null;
    } catch {
      return null;
    }
  };

  return (
    <>
      <Head title="Cultura Universitaria" />
      <HeaderComponent />

      <main className="flex flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        {/* Hero Section */}
        <section className="w-full relative">
          <HeaderpermaComponent />
          <HeroCarousel />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-32 z-10" />
        </section>

        {/* Bienvenida */}
        <section className="w-full py-16 bg-[#f8f4e8] text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#8B4513] mb-4">
              Cultura y Arte Universitario
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Descubre el vibrante mundo cultural de nuestra universidad. Eventos, exposiciones, talleres y más para enriquecer tu experiencia académica.
            </p>
          </div>
        </section>

        {/* Eventos */}
        <section className="w-full py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-[#8B4513]">Próximos Eventos Culturales</h3>
              <Button variant="outline" className="border-[#8B4513] text-[#8B4513]">
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver Calendario Completo
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventos.map((evento) => {
                const imagen = evento.imagen_url || extraerPrimeraImagen(evento.contenido_json);
                return (
                  <Card key={evento.id} className="hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        src={imagen || '/placeholder.jpg'}
                        alt={evento.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <span className="text-sm text-[#8B4513] font-medium">{evento.categoria}</span>
                      <CardTitle>{evento.titulo}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {new Date(evento.fecha).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{evento.descripcion}</p>
                      <a
                        href={`/cultura/${evento.id}/item`}
                        className="text-[#8B4513] text-sm underline mt-4 inline-block hover:text-[#A0522D]"
                      >
                        Más información →
                      </a>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Noticias */}
        <section className="w-full py-12 bg-[#f5f5f0]">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold text-[#8B4513] mb-8">Noticias Culturales</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {noticias.map((noticia) => (
                <Card key={noticia.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Newspaper className="h-5 w-5 text-[#8B4513]" />
                      <span className="text-sm text-gray-500">
                        {new Date(noticia.fecha).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <CardTitle>{noticia.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{noticia.descripcion}</p>
                      <a
                        href={`/cultura/${noticia.id}/item`}
                        className="text-[#8B4513] text-sm underline hover:text-[#A0522D]"
                      >
                        Leer más →
                      </a>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Áreas Culturales */}
        <section className="w-full py-12 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold text-[#8B4513] text-center mb-10">Áreas Culturales</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {areasCulturales.map((area, index) => (
                <Card key={index} className="text-center p-6 hover:border-[#8B4513] transition-colors">
                  <div className="text-[#8B4513] mx-auto mb-4">
                    {area.icon === 'literatura' && <Mic2 size={32} />}
                    {area.icon === 'musica' && <Music size={32} />}
                    {area.icon === 'cine' && <Film size={32} />}
                    {area.icon === 'danza' && <Music size={32} />}
                    {area.icon === 'fotografia' && <Film size={32} />}
                    {area.icon === 'artes' && <BookOpen size={32} />}
                  </div>
                  <CardHeader>
                    <CardTitle>{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">Conoce más sobre esta disciplina cultural.</p>
                    <Button variant="link" className="text-[#8B4513] p-0 mt-2">
                      Conoce más
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Galería */}
        <section className="w-full py-12 bg-[#f8f4e8]">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-[#8B4513] mb-8">Galería Cultural</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galeria.map((item) => {
                const imagen = item.imagen_url || extraerPrimeraImagen(item.contenido_json);
                return (
                  <a
                    key={item.id}
                    href={`/cultura/${item.id}/item`}
                    className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:scale-105 transition-transform block"
                  >
                    <img
                      src={imagen || '/placeholder.jpg'}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  </a>
                );
              })}
            </div>
            <Button variant="outline" className="mt-8 border-[#8B4513] text-[#8B4513]">
              Ver galería completa
            </Button>
          </div>
        </section>


      </main>

      <FooterComponent />
    </>
  );
}
