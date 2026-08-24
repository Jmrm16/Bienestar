import { Head, Link } from '@inertiajs/react';
import HeaderComponent from '@/components/marketing/header';
import FooterComponent from '@/components/marketing/footer';
import { Cultura } from '@/types';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import HeaderpermaComponent from './components/header';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';

interface Props {
  cultura: Cultura;
}

export default function ShowCultura({ cultura }: Props) {
  const imageUrl = resolveCulturaImageUrl(cultura, '');

  return (
    <>
      <Head title={cultura.titulo} />
      <HeaderComponent />
            <section className="hero-section w-full">
              <HeaderpermaComponent />
            </section>

      <main className="bg-gray-50 text-gray-800">
        <section className="max-w-5xl mx-auto py-12 px-4">
          <Link
            href="/cultura"
            className="mb-6 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Volver a cultura
          </Link>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">{cultura.titulo}</h1>
          <div className="w-24 h-1 bg-orange-500 mb-6" />

          {/* Imagen principal */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={cultura.titulo}
              className="w-full rounded-md shadow mb-8 object-cover max-h-[400px]"
            />
          )}

          {/* Contenido extendido desde EditorJS */}
          <div className="prose dark:prose-invert max-w-none">
            <EditorJSRenderer
              data={
                typeof cultura.contenido_json === 'string'
                  ? JSON.parse(cultura.contenido_json)
                  : cultura.contenido_json
              }
            />
          </div>

          {/* Metadatos */}
          <div className="mt-10 grid gap-3 border-t pt-4 text-sm text-gray-600 md:grid-cols-2">
            <p className="rounded-lg bg-white p-4 shadow-sm">
              <strong>Fecha de publicación:</strong>{" "}
              {new Date(cultura.fecha).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="rounded-lg bg-white p-4 shadow-sm">
              <strong>Tipo:</strong> {cultura.tipo}
            </p>
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}


