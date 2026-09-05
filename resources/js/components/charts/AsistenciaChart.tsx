import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AsistenciaData {
    fecha: string;
    total: number;
}

interface Props {
    data: AsistenciaData[];
}

export default function AsistenciaChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Asistencias Registradas</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
