export type Carrera = {
    id: number;
    nombre: string;
};

export type SportParticipant = {
    id: number;
    tipo_doc: string;
    documento: string;
    nombres: string;
    apellidos: string;
    estamento: string;
    estado: string;
    fecha_ingreso?: string | null;
    telefono?: string | null;
    correo?: string | null;
    carrera_id?: number | null;
    carrera_nombre?: string | null;
    semestre?: string | null;
    observaciones?: string | null;
};

export type ParticipantStats = {
    total: number;
    active: number;
    students: number;
};
