import { useEffect, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EditorCultura from "./EditorCultura"; // 👈 asegúrate de que esté en el mismo folder

interface Cultura {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string;
  publicado: boolean;
  contenido_json: any; // JSON de bloques Editor.js
}

interface EditCulturaProps {
  cultura: Cultura;
}

export default function EditCultura({ cultura }: EditCulturaProps) {
  const { data, setData, post, processing, errors, transform } = useForm({
    _method: "PUT",
    titulo: cultura.titulo,
    descripcion: cultura.descripcion,
    tipo: cultura.tipo,
    fecha: cultura.fecha,
    imagen_banner: null as File | null,
    publicado: cultura.publicado,
  });

  const [contenido, setContenido] = useState<any>(() => {
  try {
    if (!cultura.contenido_json) return null;
    return typeof cultura.contenido_json === 'string'
      ? JSON.parse(cultura.contenido_json)
      : cultura.contenido_json;
  } catch (err) {
    console.error("Error al parsear contenido_json:", err);
    return null;
  }
});


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    transform(() => {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("titulo", data.titulo);
      formData.append("descripcion", data.descripcion);
      formData.append("tipo", data.tipo);
      formData.append("fecha", data.fecha);
      formData.append("publicado", data.publicado ? "1" : "0");
      formData.append("contenido_json", JSON.stringify(contenido));
      if (data.imagen_banner) {
        formData.append("imagen_banner", data.imagen_banner);
      }
      return formData;
    });

    post(`/culturas/${cultura.id}`);
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Cultura", href: "/culturas" }, { title: "Editar", href: "#" }]}>
      <Head title="Editar publicación cultural" />

      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Editar publicación cultural</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" value={data.titulo} onChange={(e) => setData("titulo", e.target.value)} />
                {errors.titulo && <p className="text-sm text-red-500">{errors.titulo}</p>}
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción corta</Label>
                <Textarea
                  id="descripcion"
                  rows={3}
                  value={data.descripcion}
                  onChange={(e) => setData("descripcion", e.target.value)}
                />
                {errors.descripcion && <p className="text-sm text-red-500">{errors.descripcion}</p>}
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  className="border-input w-full rounded-md p-2 text-sm"
                  value={data.tipo}
                  onChange={(e) => setData("tipo", e.target.value)}
                >
                  <option value="noticia">Noticia</option>
                  <option value="evento">Evento</option>
                  <option value="actividad">Actividad</option>
                </select>
                {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
              </div>

              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={data.fecha}
                  onChange={(e) => setData("fecha", e.target.value)}
                />
                {errors.fecha && <p className="text-sm text-red-500">{errors.fecha}</p>}
              </div>

              <div>
                <Label htmlFor="imagen_banner">Imagen Banner</Label>
                <Input
                  id="imagen_banner"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setData("imagen_banner" as "imagen_banner", file);
                  }}
                />
                {errors.imagen_banner && <p className="text-sm text-red-500">{errors.imagen_banner}</p>}
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="publicado"
                  checked={data.publicado}
                  onCheckedChange={(value) => setData("publicado", value)}
                />
                <Label htmlFor="publicado">¿Publicado?</Label>
              </div>

              {/* 🔥 Bloques Editor.js */}
              <div>
                <Label>Contenido extendido (por bloques)</Label>
                <EditorCultura data={contenido} onChange={setContenido} />
              </div>

              <Button type="submit" disabled={processing}>
                Actualizar publicación
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
