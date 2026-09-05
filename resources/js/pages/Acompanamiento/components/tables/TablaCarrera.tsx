// components/acompanamiento/TablaCarrera.tsx
import { DataTable } from '@/components/ui/data-table';
import { usePage } from '@inertiajs/react';
import { Carrera, columns } from './columns';

const TablaCarrera = () => {
    const { carreras } = usePage().props as { carreras?: Carrera[] };

    return (
        <div className="rounded-xl border p-4">
            <DataTable columns={columns} data={carreras ?? []} searchKey="nombre" />
        </div>
    );
};

export default TablaCarrera;
