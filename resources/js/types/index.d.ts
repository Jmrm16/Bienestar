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
  
  export type Grupo = {
    id: number;
    nombre: string;
    carrera_id: number;
    carrera: {
      id: number;
      nombre: string;
    };
    tutor_id?: number; // <-- agrega esto si lo necesitas
  };
  
  
  

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
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
