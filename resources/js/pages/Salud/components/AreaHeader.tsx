// resources/js/Pages/Salud/components/AreaHeader.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

export function AreaHeader({
    title,
    subtitle,
    icon: Icon,
    badge,
    backHref,
    backLabel,
}: {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    badge?: string;
    backHref?: string;
    backLabel?: string;
}) {
    return (
        <Card className="rounded-2xl">
            <CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Icon className="h-6 w-6" />
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                        </div>
                        {subtitle ? <p className="text-muted-foreground max-w-3xl text-sm">{subtitle}</p> : null}
                    </div>
                    {backHref ? (
                        <Button asChild variant="outline" className="gap-2 self-start">
                            <Link href={backHref}>
                                <ArrowLeft className="h-4 w-4" />
                                {backLabel ?? 'Volver'}
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
