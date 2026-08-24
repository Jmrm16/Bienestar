import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Loader2, UploadCloud } from 'lucide-react';
import React from 'react';

export default function ImportarNotas() {
    const { setData, post, processing, errors } = useForm<{
        archivo: File | null;
    }>({
        archivo: null,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/notas/importar', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <Card className="gap-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <UploadCloud className="size-4" />
                    Importar notas
                </CardTitle>
                <CardDescription>Carga el archivo Excel oficial con los registros académicos.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="notas-file">Archivo Excel</Label>
                        <Input
                            id="notas-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(event) => setData('archivo', event.target.files?.[0] || null)}
                            required
                        />
                        {errors.archivo ? <p className="text-destructive text-sm">{errors.archivo}</p> : null}
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                        {processing ? 'Importando...' : 'Importar notas'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
