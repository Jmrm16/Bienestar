import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';

type AttendancePoint = {
    fecha: string;
    total: number;
};

type ModulePoint = {
    key: string;
    label: string;
    value: number;
    fill?: string;
};

type MetricPoint = {
    label: string;
    value: number;
};

const attendanceConfig = {
    total: {
        label: 'Asistencias',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

const modulesConfig = {
    value: {
        label: 'Registros',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

const distributionConfig = {
    value: { label: 'Registros' },
    tutorias: { label: 'Tutorías', color: 'var(--chart-1)' },
    informes: { label: 'Informes', color: 'var(--chart-2)' },
    acompanamiento: { label: 'Acompañamiento', color: 'var(--chart-3)' },
    notas: { label: 'Notas', color: 'var(--chart-4)' },
    cultura: { label: 'Cultura', color: 'var(--chart-5)' },
    salud: { label: 'Salud', color: 'var(--chart-2)' },
    deporte: { label: 'Deporte', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function formatDate(value: string) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
    }).format(date);
}

export function AttendanceTrendChart({ data }: { data: AttendancePoint[] }) {
    if (!data.length) {
        return (
            <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
                Aún no hay asistencias para construir la tendencia.
            </div>
        );
    }

    return (
        <ChartContainer config={attendanceConfig} className="h-72 w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 12 }}>
                <defs>
                    <linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={formatDate} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(value) => formatDate(String(value))} />} />
                <Area dataKey="total" type="monotone" fill="url(#attendance-fill)" fillOpacity={1} stroke="var(--color-total)" strokeWidth={2} />
            </AreaChart>
        </ChartContainer>
    );
}

export function ModuleVolumeChart({ data }: { data: ModulePoint[] }) {
    return (
        <ChartContainer config={modulesConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={92} tickMargin={8} />
                <XAxis dataKey="value" type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 5, 5, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

export function ModuleDistributionChart({ data }: { data: ModulePoint[] }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (!total) {
        return <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">No hay registros principales disponibles.</div>;
    }

    return (
        <ChartContainer config={distributionConfig} className="mx-auto h-72 w-full max-w-sm">
            <PieChart accessibilityLayer>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
                <Pie data={data} dataKey="value" nameKey="key" innerRadius={68} outerRadius={96} paddingAngle={2} strokeWidth={2}>
                    {data.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                    ))}
                    <Label
                        content={({ viewBox }) => {
                            if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                                return null;
                            }

                            return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                                        {total.toLocaleString('es-CO')}
                                    </tspan>
                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">
                                        registros
                                    </tspan>
                                </text>
                            );
                        }}
                    />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="key" />} className="-translate-y-1 flex-wrap gap-x-3 gap-y-1" />
            </PieChart>
        </ChartContainer>
    );
}

export function SelectedModuleChart({ data }: { data: MetricPoint[] }) {
    return (
        <ChartContainer config={modulesConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[5, 5, 0, 0]} maxBarSize={72} />
            </BarChart>
        </ChartContainer>
    );
}
