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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleSelectChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
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

          <div className="overflow-y-auto pr-2">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="w-full">
                  <Label>Nombre</Label>
                  <Input name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="w-full">
                  <Label>Apellido</Label>
                  <Input name="apellido" value={form.apellido} onChange={handleChange} required />
                </div>

                <div className="w-full">
                  <Label>Tipo de Documento</Label>
                  <Select onValueChange={(value) => handleSelectChange("tipo_documento", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Label>Número de Documento</Label>
                  <Input name="documento" value={form.documento} onChange={handleChange} required />
                </div>

                <div className="w-full">
                  <Label>Lugar de Expedición</Label>
                  <Input name="lugar_expedicion" value={form.lugar_expedicion} onChange={handleChange} required />
                </div>

                <div className="w-full">
                  <Label>Sexo</Label>
                  <Select onValueChange={(value) => handleSelectChange("sexo", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Label>Grupo Priorizado</Label>
                  <Select onValueChange={(value) => handleSelectChange("grupo_priorizado", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Ninguno</SelectItem>
                      <SelectItem value="discapacidad">Discapacidad</SelectItem>
                      <SelectItem value="etnia">Grupo Étnico</SelectItem>
                      <SelectItem value="victima">Víctima del conflicto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Label>Sede</Label>
                  <Input name="sede" value={form.sede} onChange={handleChange} required />
                </div>
                <div className="w-full">
                  <Label>Programa Académico</Label>
                  <Input name="programa_academico" value={form.programa_academico} onChange={handleChange} required />
                </div>

                <div className="w-full">
                  <Label>Correo</Label>
                  <Input name="correo" value={form.correo} onChange={handleChange} required />
                </div>
                <div className="w-full">
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
