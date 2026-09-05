import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type FallbackNota = {
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
};

type StudentSubjectRow = {
    id: number;
    materia: string;
    grupo: string;
    nota_1: number | null;
    nota_2: number | null;
    nota_3: number | null;
    definitiva: number | null;
    habilitacion: number | null;
    final: number | null;
    anio: number;
    periodo: string;
};

export type StudentSearchResult = {
    id: number;
    codigo: string;
    apellidos: string;
    nombres: string;
    identificacion: string;
    programa: string;
    materias: StudentSubjectRow[];
};

interface Props {
    search: string;
    studentResults: StudentSearchResult[];
    studentResultCount: number;
    matchedRowsCount: number;
    fallbackNotas: FallbackNota[];
}

function formatNota(value: number | null) {
    if (value === null || Number.isNaN(Number(value))) {
        return '—';
    }

    return Number(value).toFixed(2);
}

export default function TablaNotas({ search, studentResults, studentResultCount, matchedRowsCount, fallbackNotas }: Props) {
    if (!search.trim()) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Consulta de notas</CardTitle>
                    <CardDescription>Busca un estudiante por nombre, código o cédula para ver sus materias y notas registradas.</CardDescription>
                </CardHeader>

                <CardContent className="text-muted-foreground text-sm">
                    {fallbackNotas.length > 0
                        ? 'La tabla general se reemplazó por una consulta enfocada por estudiante para ubicar mejor las materias.'
                        : 'Todavía no hay resultados porque no has realizado una búsqueda.'}
                </CardContent>
            </Card>
        );
    }

    if (studentResults.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sin coincidencias</CardTitle>
                    <CardDescription>
                        No encontramos estudiantes con el criterio <span className="text-foreground font-medium">"{search}"</span>.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Resultados de la búsqueda</CardTitle>
                    <CardDescription>
                        {studentResultCount} estudiante(s) encontrados y {matchedRowsCount} registro(s) académicos asociados a{' '}
                        <span className="text-foreground font-medium">"{search}"</span>.
                    </CardDescription>
                </CardHeader>
            </Card>

            {studentResults.map((student) => (
                <Card key={`${student.identificacion}-${student.codigo || 'sin-codigo'}`}>
                    <CardHeader className="gap-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base">
                                    {student.nombres} {student.apellidos}
                                </CardTitle>
                                <CardDescription>{student.programa || 'Programa sin definir'}</CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">CC {student.identificacion}</Badge>
                                {student.codigo ? <Badge variant="outline">Código {student.codigo}</Badge> : null}
                                <Badge variant="outline">{student.materias.length} materia(s)</Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Materia</TableHead>
                                    <TableHead>Grupo</TableHead>
                                    <TableHead className="text-center">C1</TableHead>
                                    <TableHead className="text-center">C2</TableHead>
                                    <TableHead className="text-center">C3</TableHead>
                                    <TableHead className="text-center">Hab.</TableHead>
                                    <TableHead className="text-center">Def.</TableHead>
                                    <TableHead className="text-center">Final</TableHead>
                                    <TableHead className="text-center">Periodo</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {student.materias.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-medium">{subject.materia || 'Sin materia'}</TableCell>
                                        <TableCell>{subject.grupo || '—'}</TableCell>
                                        <TableCell className="text-center">{formatNota(subject.nota_1)}</TableCell>
                                        <TableCell className="text-center">{formatNota(subject.nota_2)}</TableCell>
                                        <TableCell className="text-center">{formatNota(subject.nota_3)}</TableCell>
                                        <TableCell className="text-center">{formatNota(subject.habilitacion)}</TableCell>
                                        <TableCell className="text-center">{formatNota(subject.definitiva)}</TableCell>
                                        <TableCell className="text-center font-semibold">{formatNota(subject.final)}</TableCell>
                                        <TableCell className="text-center">
                                            {subject.anio}-{subject.periodo}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
