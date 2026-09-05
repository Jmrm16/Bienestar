import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    grupoId: number;
}

export default function SubidaExcel({ grupoId }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = () => {
        if (!file) {
            toast.error('Selecciona un archivo Excel');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', file); // 👈 Nombre correcto del campo
        formData.append('grupo_id', grupoId.toString());

        setLoading(true);

        router.post('/estudiantes/cargar-excel', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Estudiantes subidos correctamente');
                setFile(null);
            },
            onError: () => {
                toast.error('Error al subir el archivo. Verifica el formato.');
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    return (
        <div className="space-y-4 rounded-xl border bg-gray-900 p-4">
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button onClick={handleUpload} disabled={loading || !file}>
                {loading ? 'Subiendo...' : 'Subir Estudiantes'}
            </Button>
        </div>
    );
}
