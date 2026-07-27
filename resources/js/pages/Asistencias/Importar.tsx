import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface Grupo {
    id: number;
    nombre: string;
}

interface Props {
    grupo: Grupo;
    onClose?: () => void;
}

export default function ImportarArchivoModal({ grupo, onClose }: Props) {
    const { setData, post, processing } = useForm({
        archivo: null as File | null,
        grupo_id: grupo.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('asistencias.importar'), {
            onSuccess: () => {
                toast.success('✅ Archivo importado correctamente');
                setData('archivo', null);
                onClose?.(); // Cierra el modal si se define onClose
            },
            onError: () => {
                toast.error('❌ Error al importar el archivo');
            },
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Importar archivo Excel</DialogTitle>
                <DialogDescription>Selecciona el archivo con los registros de asistencia que deseas cargar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="archivo">Archivo Excel</Label>
                    <Input id="archivo" type="file" accept=".xlsx,.xls" onChange={(e) => setData('archivo', e.target.files?.[0] ?? null)} required />
                </div>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Importando...' : 'Importar'}
                </Button>
            </form>
        </DialogContent>
    );
}
