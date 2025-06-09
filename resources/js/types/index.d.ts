import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}
export type Estudiante = {
    id: number;
    codigo: string;
    nombres: string;
    apellidos: string;
    identificacion: string;
    correo_institucional: string;
    grupo_id: number;
  };

  export type Carrera = {
    id: number;
    nombre: string;
  };
  export type Tutor = {
  id: number;
  nombre: string;
  apellido: string;
  tipo_documento?: string;
  documento?: string;
  lugar_expedicion?: string;
  sexo?: string;
  grupo_priorizado?: string;
  sede?: string;
  programa_academico?: string;
  correo?: string;
  telefono?: string;
};

  
export type Grupo = {
  id: number;
  nombre: string;
  codigo: string;
  carrera_id: number;
  carrera: {
    id: number;
    nombre: string;
  };
  tutor_id?: number; // opcional, por si se va a asignar más adelante
  asignatura_id: number;
};
export type GrupoExtendido = {
  id: number;
  nombre: string;
  codigo: string;
  carrera_id: number;
  asignatura_id: number;
  carrera: {
    id: number;
    nombre: string;
  };
  tipo?: string;
};



  // src/types/index.ts

export interface Cultura {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string; // formato ISO, por ejemplo "2025-06-05T00:00:00.000000Z"
  imagen_banner?: string;
  contenido_json?: any; // JSON de bloques Editor.js
}

  export interface NavItem {
    title: string;
    url?: string; // <- puede no tener url si tiene hijos
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[]; // <- para submenús
}

export interface Asignatura{
    id: number;
    nombre: string;
    codigo: string;
    docente: string;
    carrera_id: number;
    grupos: Grupo[];
    carrera: Carrera;
    [key: string]: unknown; // This allows for additional properties...
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
