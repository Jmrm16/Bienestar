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

const AgregarAsignatura = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", codigo: "", docente: "" });
    const [errors, setErrors] = useState<{ nombre?: string; codigo?: string; docente?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" }); // Limpiar error al escribir
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post("/asignaturas", form, {
            onSuccess: () => {
                toast.success("✅ Asignatura agregada correctamente");
                setIsOpen(false);
                setForm({ nombre: "", codigo: "", docente: "" });
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
                    <Button variant="outline">Agregar Asignatura</Button>
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
                        </div>
                        <div className="p-4">
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
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
