import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface Carrera {
    id: number;
    nombre: string;
}

interface Props {
    carreras: Carrera[];
}

const AgregarAsignatura = ({ carreras }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        codigo: "",
        docente: "",
        carrera_id: "",
    });

    const [errors, setErrors] = useState<{
        nombre?: string;
        codigo?: string;
        docente?: string;
        carrera_id?: string;
    }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post("/asignaturas", form, {
            onSuccess: () => {
                toast.success("✅ Asignatura agregada correctamente");
                setIsOpen(false);
                setForm({ nombre: "", codigo: "", docente: "", carrera_id: "" });
                setErrors({});
            },
            onError: (serverErrors) => {
                console.error("Errores:", serverErrors);
                setErrors(serverErrors);
                toast.error("❌ No se pudo agregar la asignatura");
            }
        });
    };

    return (
        <div className="mb-6">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Agregar Asignatura</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Asignatura</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block">Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                                {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}
                            </div>
                            <div>
                                <label className="block">Código</label>
                                <input
                                    type="text"
                                    name="codigo"
                                    value={form.codigo}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                                {errors.codigo && <p className="text-red-500 text-sm">{errors.codigo}</p>}
                            </div>
                            <div>
                                <label className="block">Docente</label>
                                <input
                                    type="text"
                                    name="docente"
                                    value={form.docente}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                                {errors.docente && <p className="text-red-500 text-sm">{errors.docente}</p>}
                            </div>
                            <div>
                                <label className="block">Carrera</label>
                                <select
                                    name="carrera_id"
                                    value={form.carrera_id}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="">Seleccione una carrera</option>
                                    {carreras.map((carrera) => (
                                        <option key={carrera.id} value={carrera.id}>
                                            {carrera.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.carrera_id && <p className="text-red-500 text-sm">{errors.carrera_id}</p>}
                            </div>
                        </div>
                        <div className="p-4">
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">Guardar</Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AgregarAsignatura;
