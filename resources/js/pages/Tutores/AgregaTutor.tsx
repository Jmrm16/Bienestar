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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
}

interface Carrera {
  id: number;
  nombre: string;
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
    // ⬇️ ahora usamos carrera_id (número o "" al iniciar)
    carrera_id: "" as number | "" ,
    correo: "",
    telefono: "",
    asignaturas: [] as number[],
  });

  const { asignaturas = [], carreras = [] } = usePage().props as {
    asignaturas?: Asignatura[];
    carreras?: Carrera[];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // para strings simples
  const handleSelectChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  // para carrera_id (numérico)
  const handleCarreraChange = (value: string) => {
    const parsed = Number(value);
    setForm((prev) => ({ ...prev, carrera_id: Number.isNaN(parsed) ? "" : parsed }));
  };

  const handleAsignaturasChange = (id: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      asignaturas: prevForm.asignaturas.includes(id)
        ? prevForm.asignaturas.filter((asigId) => asigId !== id)
        : [...prevForm.asignaturas, id],
    }));
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      tipo_documento: "",
      documento: "",
      lugar_expedicion: "",
      sexo: "",
      grupo_priorizado: "",
      sede: "",
      carrera_id: "",
      correo: "",
      telefono: "",
      asignaturas: [],
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validación mínima en cliente: carrera_id requerido
    if (form.carrera_id === "" || form.carrera_id === undefined) {
      toast.error("Selecciona una carrera");
      return;
    }

    // Enviar exactamente los campos que espera el backend
    router.post("/tutores", {
      nombre: form.nombre,
      apellido: form.apellido,
      tipo_documento: form.tipo_documento,
      documento: form.documento,
      lugar_expedicion: form.lugar_expedicion,
      sexo: form.sexo,
      grupo_priorizado: form.grupo_priorizado,
      sede: form.sede,
      carrera_id: form.carrera_id, // ⬅️ clave: enviamos carrera_id
      correo: form.correo,
      telefono: form.telefono,
      asignaturas: form.asignaturas,
    }, {
      onSuccess: () => {
        toast.success("✅ Tutor agregado correctamente");
        setIsOpen(false);
        resetForm();
      },
      onError: (errors) => {
        // Muestra el primer error útil
        const first = errors && Object.values(errors)[0];
        toast.error(`❌ Error al agregar el tutor${first ? `: ${first}` : ""}`);
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
                  <Select
                    value={form.tipo_documento}
                    onValueChange={(value) => handleSelectChange("tipo_documento", value)}
                  >
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
                  <Select
                    value={form.sexo}
                    onValueChange={(value) => handleSelectChange("sexo", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Grupo Priorizado</Label>
                  <Select
                    value={form.grupo_priorizado}
                    onValueChange={(value) => handleSelectChange("grupo_priorizado", value)}
                  >
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

                <div>
                  <Label>Sede</Label>
                  <Input name="sede" value={form.sede} onChange={handleChange} required />
                </div>

                <div>
                  <Label>Carrera</Label>
                  <Select
                    value={form.carrera_id === "" ? "" : String(form.carrera_id)}
                    onValueChange={handleCarreraChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una carrera" />
                    </SelectTrigger>
                    <SelectContent>
                      {carreras.map((carrera) => (
                        <SelectItem key={carrera.id} value={String(carrera.id)}>
                          {carrera.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <span className="text-sm">
                          {a.nombre} ({a.codigo})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 flex justify-end gap-2 border-t">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              {/* El botón está fuera del <form>, así que llamamos manualmente a handleSubmit */}
              <Button type="button" onClick={handleSubmit}>
                Guardar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgregarTutor;
