import EditorJSRenderer from '@/components/EditorJSRenderer';
import FooterComponent from '@/components/marketing/footer';
import HeaderComponent from '@/components/marketing/header';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';
import { Cultura } from '@/types';
import { Head, Link } from '@inertiajs/react';
import HeaderpermaComponent from './components/header';

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
                <section className="mx-auto max-w-5xl px-4 py-12">
                    <Link href="/cultura" className="mb-6 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700">
                        Volver a cultura
                    </Link>
                    <h1 className="mb-2 text-3xl font-bold text-orange-500">{cultura.titulo}</h1>
                    <div className="mb-6 h-1 w-24 bg-orange-500" />

                    {/* Imagen principal */}
                    {imageUrl && <img src={imageUrl} alt={cultura.titulo} className="mb-8 max-h-[400px] w-full rounded-md object-cover shadow" />}

                    {/* Contenido extendido desde EditorJS */}
                    <div className="prose dark:prose-invert max-w-none">
                        <EditorJSRenderer
                            data={typeof cultura.contenido_json === 'string' ? JSON.parse(cultura.contenido_json) : cultura.contenido_json}
                        />
                    </div>

                    {/* Metadatos */}
                    <div className="mt-10 grid gap-3 border-t pt-4 text-sm text-gray-600 md:grid-cols-2">
                        <p className="rounded-lg bg-white p-4 shadow-sm">
                            <strong>Fecha de publicación:</strong>{' '}
                            {new Date(cultura.fecha).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
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
