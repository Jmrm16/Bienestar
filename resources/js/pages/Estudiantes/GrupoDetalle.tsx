import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type Grupo, type Estudiante } from '@/types';
import React, { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  grupo: Grupo;
  estudiantes: Estudiante[];
};

const ITEMS_PER_PAGE = 20;

export default function GrupoDetalle({ grupo, estudiantes }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(estudiantes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEstudiantes = estudiantes.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <AppLayout>
      <Head title={`Grupo ${grupo.nombre}`} />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Estudiantes del Grupo: {grupo.nombre}
            </CardTitle>
            <p className="text-muted-foreground">
              Carrera: {grupo.carrera.nombre}
            </p>
          </CardHeader>
          <CardContent>
            {estudiantes && estudiantes.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombres</TableHead>
                        <TableHead>Apellidos</TableHead>
                        <TableHead>Identificación</TableHead>
                        <TableHead>Correo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEstudiantes.map((est) => (
                        <TableRow key={est.id}>
                          <TableCell>{est.codigo}</TableCell>
                          <TableCell>{est.nombres}</TableCell>
                          <TableCell>{est.apellidos}</TableCell>
                          <TableCell>{est.identificacion}</TableCell>
                          <TableCell>{est.correo_institucional}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => goToPage(currentPage - 1)}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={i + 1 === currentPage}
                          onClick={() => goToPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => goToPage(currentPage + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            ) : (
              <p className="text-gray-400">No hay estudiantes registrados en este grupo.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
