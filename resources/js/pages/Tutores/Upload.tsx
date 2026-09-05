import NotificationsAndAlerts from '@/components/notifications-and-alerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    window: {
        id: number;
        name: string;
        instructions?: string;
    };
}

export default function UploadInforme({ window }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const goHomeInformes = () => {
        router.visit(route('portal.tutor.home') + '?tab=informes', {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleImport = () => {
        if (!file) {
            toast.error('Selecciona un archivo');
            return;
        }

        const form = new FormData();
        form.append('archivo', file);

        setImporting(true);

        router.post(route('portal.tutor.informes.import', window.id), form, {
            forceFormData: true,
            onError: (errors) => {
                console.log('Errores import:', errors);
                const firstError = Object.values(errors)[0] as string | undefined;
                toast.error(firstError || 'Error al importar asistencias');
            },
            onFinish: () => setImporting(false),
        });
    };

    return (
        <>
            <Head title="Subir asistencias" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                <NotificationsAndAlerts className="mb-2" />

                <Card>
                    <CardHeader className="space-y-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-xl md:text-2xl">Subir archivo de asistencias</CardTitle>
                                <p className="text-muted-foreground text-sm">{window.name}</p>
                            </div>

                            <Button type="button" variant="outline" onClick={goHomeInformes}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver (Informes)
                            </Button>
                        </div>

                        {window.instructions && <p className="text-muted-foreground text-sm">{window.instructions}</p>}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="border-border bg-muted/20 hover:bg-muted/30 relative rounded-xl border border-dashed transition-colors">
                            <div className="p-10 text-center">
                                <Upload className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                                <p className="font-medium">Arrastra o selecciona el Excel</p>
                                <p className="text-muted-foreground mt-1 text-sm">Formatos permitidos: .xlsx, .xls</p>
                            </div>

                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                            />
                        </div>

                        {file && (
                            <div className="border-border bg-muted/20 flex items-center gap-2 rounded-lg border px-3 py-2">
                                <FileText className="text-muted-foreground h-4 w-4" />
                                <span className="truncate text-sm font-medium">{file.name}</span>
                            </div>
                        )}

                        <Button type="button" onClick={handleImport} disabled={!file || importing} className="w-full">
                            {importing ? 'Importando…' : 'Importar asistencias'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
