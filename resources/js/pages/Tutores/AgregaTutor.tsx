import { useMemo, useState } from "react";
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
import TutorAsignaturasField from "@/pages/Tutores/TutorAsignaturasField";

interface Asignatura {
  id: number;
  nombre: string;
  codigo?: string | null;
  carrera_id: number;
}

interface Carrera {
  id: number;
  nombre: string;
}

// Helper: tomar el CSRF del meta (lo mandaremos en el body)
function csrfToken(): string {
  const el = document.querySelector(
    'meta[name="csrf-token"]'
  ) as HTMLMetaElement | null;
  return el?.content ?? "";
}

const AgregarTutor = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    tipo_resolucion: "" as "" | "R1" | "R2", // ✅ NUEVO
    nombre: "",
    apellido: "",
    tipo_documento: "",
    documento: "",
    lugar_expedicion: "",
    sexo: "",
    grupo_priorizado: "",
    sede: "",
    carrera_id: "" as number | "",
    correo: "",
    telefono: "",
    activo: true,
    asignaturas: [] as number[],
  });

  const { asignaturas = [], carreras = [] } = usePage().props as {
    asignaturas?: Asignatura[];
    carreras?: Carrera[];
  };

  const carreraSeleccionada = useMemo(
    () => carreras.find((carrera) => carrera.id === form.carrera_id) ?? null,
    [carreras, form.carrera_id]
  );

  const asignaturasDisponibles = useMemo(() => {
    if (form.carrera_id === "") {
      return [];
    }

    return asignaturas
      .filter((asignatura) => asignatura.carrera_id === form.carrera_id)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [asignaturas, form.carrera_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleCarreraChange = (value: string) => {
    const parsed = Number(value);
    const nextCareerId = Number.isNaN(parsed) ? "" : parsed;

    setForm((prev) => ({
      ...prev,
      carrera_id: nextCareerId,
      asignaturas:
        nextCareerId === ""
          ? []
          : prev.asignaturas.filter((subjectId) =>
              asignaturas.some(
                (subject) =>
                  subject.id === subjectId && subject.carrera_id === nextCareerId
              )
            ),
    }));
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
      codigo: "",
      tipo_resolucion: "", // ✅ NUEVO
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
      activo: true,
      asignaturas: [],
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (form.carrera_id === "" || form.carrera_id === undefined) {
      toast.error("Selecciona una carrera");
      return;
    }
    if (!form.codigo.trim()) {
      toast.error("El código del tutor es obligatorio");
      return;
    }
    // ✅ opcional: obligar a escoger R1/R2
    if (!form.tipo_resolucion) {
      toast.error("Selecciona el tipo de resolución (R1 o R2)");
      return;
    }

    router.post(
      "/tutores",
      {
        _token: csrfToken(),

        codigo: form.codigo,
        tipo_resolucion: form.tipo_resolucion, // ✅ NUEVO

        nombre: form.nombre,
        apellido: form.apellido,
        tipo_documento: form.tipo_documento,
        documento: form.documento,
        lugar_expedicion: form.lugar_expedicion,
        sexo: form.sexo,
        grupo_priorizado: form.grupo_priorizado,
        sede: form.sede,
        carrera_id: form.carrera_id,
        correo: form.correo,
        telefono: form.telefono,
        activo: form.activo,
        asignaturas: form.asignaturas,
      },
      {
        forceFormData: true,
        onSuccess: () => {
          toast.success("✅ Tutor agregado correctamente");
          setIsOpen(false);
          resetForm();
        },
        onError: (errors) => {
          const first = errors && Object.values(errors)[0];
          toast.error(`❌ Error al agregar el tutor${first ? `: ${first}` : ""}`);
        },
      }
    );
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
                  <Label>Código del Tutor</Label>
                  <Input
                    name="codigo"
                    value={form.codigo}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ✅ NUEVO: Tipo Resolución (R1 / R2) */}
                <div>
                  <Label>Tipo de Resolución</Label>
                  <Select
                    value={form.tipo_resolucion}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        tipo_resolucion: value as "R1" | "R2" | "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona (R1 / R2)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R1">R1</SelectItem>
                      <SelectItem value="R2">R2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Input
                    name="lugar_expedicion"
                    value={form.lugar_expedicion}
                    onChange={handleChange}
                    required
                  />
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.activo}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, activo: Boolean(v) }))}
                  />
                  <span className="text-sm">Activo</span>
                </div>
              </div>

              <div className="mt-4">
                <TutorAsignaturasField
                  asignaturas={asignaturasDisponibles}
                  selectedIds={form.asignaturas}
                  onToggle={handleAsignaturasChange}
                  onClear={() => setForm((prev) => ({ ...prev, asignaturas: [] }))}
                  carreraNombre={carreraSeleccionada?.nombre ?? null}
                />
              </div>
            </form>
          </div>

          <div className="p-4 flex justify-end gap-2 border-t">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
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
