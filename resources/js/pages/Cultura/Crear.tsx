import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { router, usePage } from "@inertiajs/react";

interface PageProps {
  errors?: Record<string, string>;
  [key: string]: unknown;
}

const CreateCulturaModal = () => {
  const { errors = {} } = usePage<PageProps>().props;
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "noticia",
    fecha: "",
    publicado: true,
    imagen_banner: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, imagen_banner: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("descripcion", form.descripcion);
    formData.append("tipo", form.tipo);
    formData.append("fecha", form.fecha);
    formData.append("publicado", "1");
    if (form.imagen_banner) {
      formData.append("imagen_banner", form.imagen_banner);
    }

    router.post("/culturas", formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("✅ Publicación creada correctamente");
        setForm({
          titulo: "",
          descripcion: "",
          tipo: "noticia",
          fecha: "",
          publicado: true,
          imagen_banner: null,
        });
        setOpen(false);
      },
      onError: () => toast.error("❌ Error al crear publicación"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear publicación</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva publicación cultural</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" value={form.titulo} onChange={handleChange} />
            {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>}
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              value={form.descripcion}
              onChange={handleChange}
            />
            {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="noticia">Noticia</option>
              <option value="evento">Evento</option>
              <option value="actividad">Actividad</option>
              <option value="galeria">Galería</option>
            </select>
            {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>}
          </div>

          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
            {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
          </div>

          <div>
            <Label htmlFor="imagen_banner">Imagen Banner</Label>
            <Input id="imagen_banner" name="imagen_banner" type="file" onChange={handleFileChange} />
            {errors.imagen_banner && (
              <p className="text-red-500 text-sm mt-1">{errors.imagen_banner}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCulturaModal;
