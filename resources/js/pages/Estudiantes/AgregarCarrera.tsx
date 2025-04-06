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

const AgregarCarrera = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", codigo: "" });
    const [errors, setErrors] = useState<{ nombre?: string; codigo?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post("/carreras", form, {
            onSuccess: () => {
                toast.success("✅ Carrera agregada correctamente");
                setIsOpen(false);
                setForm({ nombre: "", codigo: "" });
                setErrors({});
            },
            onError: (serverErrors) => {
                console.error("Errores:", serverErrors);
                setErrors(serverErrors);
                toast.error("❌ No se pudo agregar la carrera");
            }
        });
    };

    return (
        <div className="mb-6">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Agregar Carrera</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Carrera</DialogTitle>
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

export default AgregarCarrera;
