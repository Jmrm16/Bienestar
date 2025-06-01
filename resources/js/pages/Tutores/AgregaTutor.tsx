import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogTitle } from "@radix-ui/react-dialog";

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
}

const AgregarTutor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    tipo_documento: "",
    documento: "",
    lugar_expedicion: "",
    sexo: "",
    grupo_priorizado: "",
    sede: "",
    programa_academico: "",
    correo: "",
    telefono: "",
    asignaturas: [] as number[],
  });

  const { asignaturas = [] } = usePage().props as { asignaturas?: Asignatura[] };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAsignaturasChange = (id: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      asignaturas: prevForm.asignaturas.includes(id)
        ? prevForm.asignaturas.filter((asigId) => asigId !== id)
        : [...prevForm.asignaturas, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/tutores", form, {
      onSuccess: () => {
        toast.success("✅ Tutor agregado correctamente");
        setIsOpen(false);
        setForm({
          nombre: "",
          apellido: "",
          tipo_documento: "",
          documento: "",
          lugar_expedicion: "",
          sexo: "",
          grupo_priorizado: "",
          sede: "",
          programa_academico: "",
          correo: "",
          telefono: "",
          asignaturas: [],
        });
      },
      onError: () => {
        toast.error("❌ Hubo un error al agregar el tutor");
      },
    });
  };

  return (
    <div className="mb-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>Agregar Tutor</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Tutor</DialogTitle>
          </DialogHeader>
          {/* Área de scroll */}
          <div className="overflow-y-auto pr-2">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input name="apellido" value={form.apellido} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Tipo de Documento</Label>
                  <Input name="tipo_documento" value={form.tipo_documento} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Número de Documento</Label>
                  <Input name="documento" value={form.documento} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Lugar de Expedición</Label>
                  <Input name="lugar_expedicion" value={form.lugar_expedicion} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Input name="sexo" value={form.sexo} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Grupo Priorizado</Label>
                  <Input name="grupo_priorizado" value={form.grupo_priorizado} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Sede</Label>
                  <Input name="sede" value={form.sede} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Programa Académico</Label>
                  <Input name="programa_academico" value={form.programa_academico} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Correo</Label>
                  <Input name="correo" value={form.correo} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input name="telefono" value={form.telefono} onChange={handleChange} required />
                </div>
              </div>

              <div className="mt-4">
                <Label>Asignaturas</Label>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {asignaturas.map((a) => (
                      <label key={a.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.asignaturas.includes(a.id)}
                          onCheckedChange={() => handleAsignaturasChange(a.id)}
                        />
                        <span className="text-sm">{a.nombre} ({a.codigo})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>
          {/* Footer fijo */}
          <div className="p-4 flex justify-end gap-2 border-t">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={handleSubmit}>Guardar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgregarTutor;
