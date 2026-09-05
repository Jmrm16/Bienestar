import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type AlertType = 'success' | 'error' | 'warning' | 'info';

type NotificationItem = {
    id?: string;
    type: AlertType;
    message: string;
    title?: string;
    dismissible?: boolean;
};

type NotificationsAndAlertsProps = {
    items?: NotificationItem[];
    className?: string;
    showFlash?: boolean;
    showValidationErrors?: boolean;
    toastFlash?: boolean;
    maxValidationErrors?: number;
};

type InertiaFeedbackProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
        info?: string | null;
    };
    errors?: Record<string, string | string[] | undefined>;
};

const TYPE_LABEL: Record<AlertType, string> = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
};

function resolveTypeIcon(type: AlertType) {
    switch (type) {
        case 'success':
            return CheckCircle2;
        case 'warning':
            return AlertTriangle;
        case 'error':
            return AlertCircle;
        default:
            return Info;
    }
}

function resolveTypeClass(type: AlertType): string {
    switch (type) {
        case 'success':
            return 'border-emerald-300/80 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 dark:[&>svg]:text-emerald-300';
        case 'warning':
            return 'border-amber-300/80 bg-amber-50 text-amber-900 [&>svg]:text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:[&>svg]:text-amber-300';
        case 'error':
            return 'border-rose-300/80 bg-rose-50 text-rose-900 [&>svg]:text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100 dark:[&>svg]:text-rose-300';
        default:
            return 'border-blue-300/80 bg-blue-50 text-blue-900 [&>svg]:text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100 dark:[&>svg]:text-blue-300';
    }
}

function normalizeErrorMessages(errors: Record<string, string | string[] | undefined> | undefined, maxValidationErrors: number): NotificationItem[] {
    if (!errors) return [];

    const values = Object.values(errors).flatMap((value) => {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (!value) return [];
        return [value];
    });

    return values.slice(0, maxValidationErrors).map((message, index) => ({
        id: `validation-${index}-${message}`,
        type: 'error',
        title: 'Validación',
        message,
    }));
}

function resolveFlashItems(flash: InertiaFeedbackProps['flash'] | undefined): NotificationItem[] {
    if (!flash) return [];

    const entries: Array<{ type: AlertType; message?: string | null }> = [
        { type: 'success', message: flash.success },
        { type: 'error', message: flash.error },
        { type: 'warning', message: flash.warning },
        { type: 'info', message: flash.info },
    ];

    return entries
        .filter((entry): entry is { type: AlertType; message: string } => Boolean(entry.message))
        .map((entry) => ({
            id: `flash-${entry.type}-${entry.message}`,
            type: entry.type,
            message: entry.message,
            title: TYPE_LABEL[entry.type],
        }));
}

export default function NotificationsAndAlerts({
    items = [],
    className,
    showFlash = true,
    showValidationErrors = true,
    toastFlash = true,
    maxValidationErrors = 3,
}: NotificationsAndAlertsProps) {
    const { props } = usePage<{ flash?: InertiaFeedbackProps['flash']; errors?: InertiaFeedbackProps['errors'] }>();
    const [dismissed, setDismissed] = useState<Record<string, true>>({});
    const shownFlashToasts = useRef(new Set<string>());

    const flashItems = useMemo(() => (showFlash ? resolveFlashItems(props.flash) : []), [props.flash, showFlash]);

    const validationItems = useMemo(
        () => (showValidationErrors ? normalizeErrorMessages(props.errors, maxValidationErrors) : []),
        [maxValidationErrors, props.errors, showValidationErrors],
    );

    const allItems = useMemo(() => {
        const merged = [...flashItems, ...validationItems, ...items].map((item) => ({
            ...item,
            id: item.id ?? `${item.type}-${item.message}`,
        }));

        const unique = new Map<string, NotificationItem & { id: string }>();
        for (const item of merged) {
            unique.set(item.id, item);
        }

        return Array.from(unique.values()).filter((item) => !dismissed[item.id]);
    }, [dismissed, flashItems, items, validationItems]);

    useEffect(() => {
        if (!toastFlash) return;

        for (const item of flashItems) {
            const toastKey = item.id ?? `${item.type}-${item.message}`;
            if (shownFlashToasts.current.has(toastKey)) continue;

            shownFlashToasts.current.add(toastKey);
            if (item.type === 'success') toast.success(item.message);
            if (item.type === 'error') toast.error(item.message);
            if (item.type === 'warning') toast.warning(item.message);
            if (item.type === 'info') toast.info(item.message);
        }
    }, [flashItems, toastFlash]);

    if (allItems.length === 0) return null;

    return (
        <div className={cn('space-y-2', className)}>
            {allItems.map((item) => {
                const Icon = resolveTypeIcon(item.type);
                const dismissible = item.dismissible ?? true;
                const itemId = item.id ?? `${item.type}-${item.message}`;

                return (
                    <Alert
                        key={itemId}
                        variant={item.type === 'error' ? 'destructive' : 'default'}
                        className={cn('relative', resolveTypeClass(item.type))}
                    >
                        <Icon />
                        <AlertTitle className={cn(dismissible && 'pr-10')}>{item.title ?? TYPE_LABEL[item.type]}</AlertTitle>
                        <AlertDescription className={cn('text-current/90', dismissible && 'pr-10')}>{item.message}</AlertDescription>

                        {dismissible && (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2 h-6 w-6 text-current hover:bg-black/5 dark:hover:bg-white/10"
                                onClick={() =>
                                    setDismissed((prev) => ({
                                        ...prev,
                                        [itemId]: true,
                                    }))
                                }
                                aria-label="Cerrar alerta"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </Alert>
                );
            })}
        </div>
    );
}
