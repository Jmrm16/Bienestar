import { Head } from '@inertiajs/react';
import HeaderComponent from '@/components/component/header-component';
import FooterComponent from '@/components/component/footer-component';
import { Cultura } from '@/types';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import HeaderpermaComponent from './headerperma';

interface Props {
  cultura: Cultura;
}

export default function ShowCultura({ cultura }: Props) {
  return (
    <>
      <Head title={cultura.titulo} />
      <HeaderComponent />
            <section className="hero-section w-full">
              <HeaderpermaComponent />
            </section>

      <main className="bg-gray-50 text-gray-800">
        <section className="max-w-5xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">{cultura.titulo}</h1>
          <div className="w-24 h-1 bg-orange-500 mb-6" />

          {/* Imagen principal */}
          {cultura.imagen_banner && (
            <img
              src={`/storage/${cultura.imagen_banner}`}
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
          <div className="mt-10 text-sm text-gray-600 border-t pt-4">
            <p>
              <strong>Fecha de publicación:</strong>{" "}
              {new Date(cultura.fecha).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p>
              <strong>Tipo:</strong> {cultura.tipo}
            </p>
          </div>
        </section>
      </main>

      <FooterComponent />
    </>
  );
}
