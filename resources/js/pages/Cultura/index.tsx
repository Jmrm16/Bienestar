import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Crear from '@/pages/Cultura/Crear';
import { resolveCulturaImageUrl } from '@/lib/cultura-media';

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
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Publicaciones Culturales</h1>
          <Crear />
    
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {culturas.map((item) => {
            const imageUrl = resolveCulturaImageUrl(item, '');

            return (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={item.titulo}
                    className="mb-3 rounded-lg max-h-48 object-cover w-full"
                  />
                )}
                <p className="text-sm text-muted-foreground">{item.descripcion.slice(0, 100)}...</p>
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>{item.tipo}</span>
                  <Link href={`/culturas/${item.id}/edit`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      </div>
    </AppLayout>
  );
}
