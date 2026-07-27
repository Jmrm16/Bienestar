// resources/js/Pages/Acompanamiento/Carreras/AgregarCarrera.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

const AgregarCarrera = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ nombre: '', codigo: '' });
    const [errors, setErrors] = useState<{ nombre?: string; codigo?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/acompañamientos', form, {
            onSuccess: () => {
                toast.success('✅ Carrera agregada correctamente');
                setIsOpen(false);
                setForm({ nombre: '', codigo: '' });
                setErrors({});
            },
            onError: (serverErrors) => {
                console.error('Errores:', serverErrors);
                setErrors(serverErrors);
                toast.error('❌ No se pudo agregar la carrera');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Agregar Carrera</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Nueva Carrera</DialogTitle>
                    <DialogDescription>Ingresa el nombre y el código de la carrera.</DialogDescription>
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
                                className="w-full rounded border p-2"
                                required
                            />
                            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
                        </div>
                        <div>
                            <label className="block">Código</label>
                            <input
                                type="text"
                                name="codigo"
                                value={form.codigo}
                                onChange={handleChange}
                                className="w-full rounded border p-2"
                                required
                            />
                            {errors.codigo && <p className="text-sm text-red-500">{errors.codigo}</p>}
                        </div>
                    </div>
                    <div className="pt-4">
                        <DialogFooter>
                            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AgregarCarrera;
