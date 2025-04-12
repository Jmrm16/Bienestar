// components/acompanamiento/TablaCarrera.tsx
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import { columns, Carrera } from "./columns";
import { DataTable } from "@/components/ui/data-table";

const TablaCarrera = () => {
  const { carreras } = usePage().props as { carreras?: Carrera[] };

  return (
    <div className="p-4 border rounded-xl">
      <DataTable columns={columns} data={carreras ?? []} searchKey="nombre" />
    </div>
  );
};

export default TablaCarrera;
