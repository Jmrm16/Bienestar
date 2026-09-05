export type Carrera = { id: number; nombre: string };

export type Patient = {
    id: number;
    tipo_doc?: string;
    documento: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    carrera_id?: number | null;
    carrera_nombre?: string | null;
    semestre?: string;
};
