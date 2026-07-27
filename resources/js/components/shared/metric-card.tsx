import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export function MetricCard({
    title,
    value,
    icon: Icon,
    color = 'cyan',
    detail,
}: {
    title: string;
    value: React.ReactNode; // ✅ antes: number
    icon: React.ComponentType<{ className?: string }>;
    color?: 'cyan' | 'purple' | 'blue' | 'green';
    detail?: string; // ✅ antes: string (obligatorio)
}) {
    const reduceMotion = useReducedMotion();
    const iconTones = {
        cyan: 'bg-primary/10 text-primary',
        purple: 'bg-primary/10 text-primary',
        blue: 'bg-primary/10 text-primary',
        green: 'bg-primary/10 text-primary',
    };

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <Card className="h-full gap-0 py-0 shadow-xs">
                <CardContent className="flex h-full items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-sm font-medium">{title}</p>
                        <p className="text-foreground mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                        {detail ? <p className="text-muted-foreground mt-1 truncate text-xs">{detail}</p> : null}
                    </div>
                    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', iconTones[color])}>
                        <Icon className="size-4" aria-hidden="true" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
