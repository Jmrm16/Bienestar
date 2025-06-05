import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

interface Cultura {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string;
  publicado: boolean;
}

interface EditCulturaProps {
  cultura: Cultura;
}

export default function EditCultura({ cultura }: EditCulturaProps) {
  const { data, setData, post, processing, errors, transform } = useForm({
    _method: 'PUT',
    titulo: cultura.titulo || '',
    descripcion: cultura.descripcion || '',
    tipo: cultura.tipo || '',
    fecha: cultura.fecha || '',
    imagen_banner: null as File | null,
    publicado: cultura.publicado || false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    transform((data) => {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('titulo', data.titulo);
      formData.append('descripcion', data.descripcion);
      formData.append('tipo', data.tipo);
      formData.append('fecha', data.fecha);
      formData.append('publicado', data.publicado ? '1' : '0');
      if (data.imagen_banner) {
        formData.append('imagen_banner', data.imagen_banner);
      }
      return formData;
    });

    post(`/cultura/${cultura.id}`);
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Cultura', href: '/cultura' }, { title: 'Editar', href: '#' }]}>
      <Head title="Editar publicación cultural" />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Editar publicación</h1>

        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block font-medium">Título</label>
            <input
              type="text"
              className="input w-full"
              value={data.titulo}
              onChange={e => setData('titulo', e.target.value)}
            />
            {errors.titulo && <div className="text-red-500 text-sm">{errors.titulo}</div>}
          </div>

          <div>
            <label className="block font-medium">Descripción</label>
            <textarea
              className="input w-full"
              rows={4}
              value={data.descripcion}
              onChange={e => setData('descripcion', e.target.value)}
            />
            {errors.descripcion && <div className="text-red-500 text-sm">{errors.descripcion}</div>}
          </div>

          <div>
            <label className="block font-medium">Tipo</label>
            <select
              className="input w-full"
              value={data.tipo}
              onChange={e => setData('tipo', e.target.value)}
            >
              <option value="noticia">Noticia</option>
              <option value="evento">Evento</option>
              <option value="actividad">Actividad</option>
            </select>
            {errors.tipo && <div className="text-red-500 text-sm">{errors.tipo}</div>}
          </div>

          <div>
            <label className="block font-medium">Fecha</label>
            <input
              type="date"
              className="input w-full"
              value={data.fecha}
              onChange={e => setData('fecha', e.target.value)}
            />
            {errors.fecha && <div className="text-red-500 text-sm">{errors.fecha}</div>}
          </div>

          <div>
            <label className="block font-medium">Banner (opcional)</label>
            <input
              type="file"
              className="input w-full"
              onChange={e => {
                const file = e.target.files?.[0] ?? null;
                setData('imagen_banner' as 'imagen_banner', file); // 👈 error solucionado aquí
              }}
            />
            {errors.imagen_banner && <div className="text-red-500 text-sm">{errors.imagen_banner}</div>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="publicado"
              type="checkbox"
              checked={data.publicado}
              onChange={e => setData('publicado', e.target.checked)}
            />
            <label htmlFor="publicado" className="text-sm">¿Publicado?</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={processing}>
            Actualizar
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
