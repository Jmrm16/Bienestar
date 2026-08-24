export const PARTICIPANT_STATES = ['Activo', 'Inactivo', 'Retirado'] as const;

export const PARTICIPANT_ESTAMENTOS = ['Estudiante', 'Docente', 'Administrativo', 'Egresado', 'Invitado'] as const;

export function getParticipantStateBadgeClass(state: string) {
    switch (state) {
        case 'Activo':
            return 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        case 'Inactivo':
            return 'border-transparent bg-muted text-muted-foreground';
        case 'Retirado':
            return 'border-transparent bg-destructive/10 text-destructive';
        default:
            return 'border-transparent bg-muted text-muted-foreground';
    }
}

export function getParticipantEstamentoBadgeClass(estamento: string) {
    void estamento;
    return 'border-transparent bg-muted text-muted-foreground';
}
