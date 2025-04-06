import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';
import AgregarTutor from '@/pages/Tutores/AgregaTutor';
import AgregarAsignatura from '@/pages/Tutores/AgregarAsignatura';

import TablaTutor from '@/pages/Tutores/TablaTutor';
import TablaAsignatura from '@/pages/Tutores/TablaAsignatura';
import { Button } from "@/components/ui/button";
import { Delete ,PencilLine ,Eye } from "lucide-react";
import PieChartComponent from "@/components/component/PieChartComponent";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Registro',
        href: '/Registro',
    },
];

export default function index() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 rounded-xl p-4 h-full flex-grow">
                <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Tutores</h1>


        {/* Botón que abre el modal */}
      <div className="flex space-x-4">
      <AgregarTutor />
      
     </div>

   
    
      
      {/* Puedes agregar más contenido aquí */}
    </div>

       {/*tabla tutor */}
       < TablaTutor/>




       <h1 className="text-2xl font-bold text-white mb-4">Asignaturas</h1>
       
        {/* Botón que abre el modal */}
      <div className="flex space-x-4">
      <AgregarAsignatura />
     </div>
       {/*tabla tutor */}
       < TablaAsignatura/>
                               <div className="grid auto-rows-min gap-4 md:grid-cols-3 h-full">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border flex-grow p-4 flex items-center justify-center">
                        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border flex-grow p-4">
                        {/* Contenido adicional aquí */}
                        <PieChartComponent />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border flex-grow p-4">
                        {/* Contenido adicional aquí */}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
