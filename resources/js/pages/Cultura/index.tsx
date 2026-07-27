import { PageContainer, PageHeader, SectionHeader } from '@/components/shared/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';
import Crear from '@/pages/Cultura/Crear';
import { Head, Link } from '@inertiajs/react';
import { Flower2 } from 'lucide-react';

interface Cultura {
    id: number;
    titulo: string;
    descripcion: string;
    tipo: string;
    imagen_banner?: string;
    imagen_url?: string | null;
    contenido_json?: unknown;
}

interface CulturaIndexProps {
    culturas: Cultura[];
}

export default function CulturaIndex({ culturas }: CulturaIndexProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Cultura', href: '/cultura' }]}>
            <Head title="Gestión Cultural" />
            <PageContainer>
                <PageHeader
                    title="Publicaciones culturales"
                    description="Crea y administra el contenido cultural publicado para la comunidad universitaria."
                    icon={Flower2}
                    actions={<Crear />}
                />

                <section className="space-y-4">
                    <SectionHeader title="Contenido publicado" description={`${culturas.length} publicaciones disponibles.`} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {culturas.map((item) => {
                            const imageUrl = resolveCulturaImageUrl(item, '');

                            return (
                                <Card key={item.id} className="gap-0 overflow-hidden py-0">
                                    {imageUrl && <img src={imageUrl} alt={item.titulo} className="aspect-[16/7] w-full border-b object-cover" />}
                                    <CardHeader className="pt-5">
                                        <CardTitle className="text-base">{item.titulo}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-5">
                                        <p className="text-muted-foreground text-sm">{item.descripcion.slice(0, 100)}...</p>
                                        <div className="text-muted-foreground mt-4 flex items-center justify-between border-t pt-4 text-xs">
                                            <span className="bg-muted rounded-md px-2 py-1">{item.tipo}</span>
                                            <Link href={`/culturas/${item.id}/edit`} className="text-primary font-medium hover:underline">
                                                Editar
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            </PageContainer>
        </AppLayout>
    );
}
