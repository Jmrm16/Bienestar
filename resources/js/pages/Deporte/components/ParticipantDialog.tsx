import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildParticipantFormValues, hasErrors, ParticipantForm, type ParticipantFormValues, validateParticipant } from './ParticipantForm';
import type { Carrera, SportParticipant } from './types';

export function ParticipantDialog({
    open,
    onOpenChange,
    onSubmit,
    carreras,
    participant,
    mode,
}: {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    onSubmit: (values: ParticipantFormValues) => Promise<void> | void;
    carreras: Carrera[];
    participant?: SportParticipant | null;
    mode: 'create' | 'edit';
}) {
    const [values, setValues] = useState<ParticipantFormValues>(buildParticipantFormValues(participant));
    const [saving, setSaving] = useState(false);
    const errors = useMemo(() => validateParticipant(values), [values]);

    useEffect(() => {
        if (open) {
            setValues(buildParticipantFormValues(participant));
        }
    }, [open, participant]);

    const handleSubmit = async () => {
        if (hasErrors(errors)) {
            toast.error('Revisa los campos obligatorios');
            return;
        }

        try {
            setSaving(true);
            await onSubmit(values);
            toast.success(mode === 'create' ? 'Participante registrado' : 'Participante actualizado');
            onOpenChange(false);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Agregar participante' : 'Editar participante'}</DialogTitle>
                    <DialogDescription>Completa la información de identificación y vinculación deportiva.</DialogDescription>
                </DialogHeader>

                <ParticipantForm value={values} onChange={setValues} disabled={saving} carreras={carreras} />

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Guardando...' : mode === 'create' ? 'Guardar' : 'Actualizar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
