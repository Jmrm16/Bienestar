import { MetricCard } from '@/components/shared/metric-card';
import { PageContainer, PageHeader } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Loader2, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ImportarNotas from './components/ImportarNotas';
import TablaNotas, { type StudentSearchResult } from './components/TablaNotas';

interface Nota {
    id: number;
    codigo: string;
    apellidos: string;
    nombres: string;
    identificacion: string;
    programa: string;
    materia: string;
    grupo: string;
    final: number | null;
    anio: number;
    periodo: string;
}

interface Props {
    notas?: Nota[];
    totalNotas?: number;
    totalEstudiantes?: number;
    search?: string;
    studentResults?: StudentSearchResult[];
    studentResultCount?: number;
    matchedRowsCount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notas',
        href: '/admin/notas',
    },
];

export default function Index({
    notas = [],
    totalNotas = 0,
    totalEstudiantes = 0,
    search = '',
    studentResults = [],
    studentResultCount = 0,
    matchedRowsCount = 0,
}: Props) {
    const [query, setQuery] = useState(search);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setQuery(search);
    }, [search]);

    const hasSearch = useMemo(() => query.trim().length > 0, [query]);

    const submitSearch = (nextQuery: string) => {
        setSearching(true);

        router.get(route('notas.index'), nextQuery.trim() ? { q: nextQuery.trim() } : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setSearching(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notas Académicas" />

            <PageContainer>
                <PageHeader
                    eyebrow="Permanencia y graduación"
                    title="Notas académicas"
                    description="Consulta estudiantes y administra los registros de notas importados."
                    icon={BookOpen}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <MetricCard title="Notas registradas" value={totalNotas} icon={BookOpen} color="blue" detail="Disponibles para consulta" />

                    <MetricCard title="Estudiantes" value={totalEstudiantes} icon={Users} color="green" detail="Con notas cargadas" />

                    <MetricCard
                        title="Resultados encontrados"
                        value={studentResultCount}
                        icon={Search}
                        color="purple"
                        detail={hasSearch ? `${matchedRowsCount} registros académicos encontrados` : 'Busca por nombre, código o cédula'}
                    />
                </div>

                <Card>
                    <CardHeader className="space-y-2">
                        <CardTitle>Consultar estudiante</CardTitle>
                        <CardDescription>Escribe nombre, código o cédula para ver las materias y notas cargadas del estudiante.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            className="flex flex-col gap-3 md:flex-row md:items-end"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitSearch(query);
                            }}
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="notas-search">Búsqueda</Label>
                                <Input
                                    id="notas-search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Ej: 1001234567, Juan Pérez o 202310045"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="gap-2" disabled={searching}>
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {searching ? 'Buscando...' : 'Buscar'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={searching || !search}
                                    onClick={() => {
                                        setQuery('');
                                        submitSearch('');
                                    }}
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <TablaNotas
                    search={search}
                    studentResults={studentResults}
                    studentResultCount={studentResultCount}
                    matchedRowsCount={matchedRowsCount}
                    fallbackNotas={notas}
                />

                <ImportarNotas />
            </PageContainer>
        </AppLayout>
    );
}
