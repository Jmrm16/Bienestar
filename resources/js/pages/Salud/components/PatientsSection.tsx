// resources/js/Pages/Salud/components/PatientsSection.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PatientCreateDialog } from './PatientCreateDialog';
import type { PatientFormValues } from './PatientForm';
import { PatientsTable } from './PatientsTable';
import type { Carrera, Patient } from './types';

export function PatientsSection({
    areaKey,
    patients,
    carreras,
}: {
    areaKey: string; // ej: "medicina-general"
    patients: Patient[];
    carreras: Carrera[]; // ✅ nuevo
}) {
    const [q, setQ] = useState('');
    const [openCreate, setOpenCreate] = useState(false);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return patients;

        return patients.filter((p) => {
            const full = `${p.nombres} ${p.apellidos}`.toLowerCase();
            return (
                p.documento.toLowerCase().includes(s) ||
                full.includes(s) ||
                (p.carrera_nombre ?? '').toLowerCase().includes(s) ||
                (p.telefono ?? '').toLowerCase().includes(s)
            );
        });
    }, [q, patients]);

    const handleCreate = (values: PatientFormValues) => {
        return new Promise<void>((resolve, reject) => {
            router.post(
                `/salud/${areaKey}/pacientes`,
                {
                    ...values,
                    carrera_id: Number(values.carrera_id),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setOpenCreate(false);
                        setQ('');
                        resolve();
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(new Error(typeof firstError === 'string' ? firstError : 'No se pudo guardar'));
                    },
                },
            );
        });
    };

    return (
        <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Pacientes</h2>
                        <p className="text-muted-foreground text-sm">Busca, registra y consulta pacientes del área.</p>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => setOpenCreate(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar paciente
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar por documento, nombre, carrera o teléfono..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <PatientsTable rows={filtered} />
            </CardContent>

            <PatientCreateDialog
                open={openCreate}
                onOpenChange={setOpenCreate}
                onCreate={handleCreate}
                carreras={carreras} // ✅ se pasan al modal
            />
        </Card>
    );
}
