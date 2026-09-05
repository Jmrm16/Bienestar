import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AsistenciaPorGrupoChartProps {
    data: {
        grupo: string;
        total: number;
    }[];
}

export default function AsistenciaPorGrupoChart({ data }: AsistenciaPorGrupoChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Asistencias por Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="grupo" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
