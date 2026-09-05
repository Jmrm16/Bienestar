import { Head, Link } from '@inertiajs/react';

type Carrera = {
    id: number;
    nombre: string;
    codigo?: string | null;
    created_at?: string;
    updated_at?: string;
};

export default function Show({ carrera }: { carrera: Carrera }) {
    return (
        <>
            <Head title={`Carrera - ${carrera.nombre}`} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{carrera.nombre}</h1>
                    <Link href={route('carreras.index')} className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
                        ← Volver
                    </Link>
                </div>

                <div className="space-y-4 rounded-2xl border p-6">
                    <div>
                        <span className="text-sm text-gray-500">ID</span>
                        <p className="text-lg">{carrera.id}</p>
                    </div>

                    <div>
                        <span className="text-sm text-gray-500">Nombre</span>
                        <p className="text-lg">{carrera.nombre}</p>
                    </div>

                    <div>
                        <span className="text-sm text-gray-500">Código</span>
                        <p className="text-lg">{carrera.codigo || '—'}</p>
                    </div>

                    {carrera.created_at && (
                        <div>
                            <span className="text-sm text-gray-500">Creada</span>
                            <p className="text-lg">
                                {new Date(carrera.created_at).toLocaleDateString('es-CO', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    )}

                    {carrera.updated_at && (
                        <div>
                            <span className="text-sm text-gray-500">Última actualización</span>
                            <p className="text-lg">
                                {new Date(carrera.updated_at).toLocaleDateString('es-CO', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
