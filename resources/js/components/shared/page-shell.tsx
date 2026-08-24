import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type HTMLAttributes, type ReactNode } from 'react';

type PageContainerProps = HTMLAttributes<HTMLDivElement>;

export function PageContainer({ className, ...props }: PageContainerProps) {
    return <div className={cn('mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6', className)} {...props} />;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, eyebrow, icon: Icon, actions, className }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="flex min-w-0 items-start gap-3">
                {Icon ? (
                    <div className="bg-muted/50 text-foreground mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border">
                        <Icon className="size-5" aria-hidden="true" />
                    </div>
                ) : null}

                <div className="min-w-0 space-y-1">
                    {eyebrow ? <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{eyebrow}</p> : null}
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    {description ? <p className="text-muted-foreground max-w-3xl text-sm leading-6">{description}</p> : null}
                </div>
            </div>

            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}

interface SectionHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}

interface EmptyModuleProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export function EmptyModule({ title, description, icon: Icon }: EmptyModuleProps) {
    return (
        <div className="bg-muted/20 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
            <div className="bg-background mb-4 flex size-11 items-center justify-center rounded-lg border">
                <Icon className="text-muted-foreground size-5" aria-hidden="true" />
            </div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 max-w-md text-sm leading-6">{description}</p>
        </div>
    );
}
