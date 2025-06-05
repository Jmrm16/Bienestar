import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [loading, setLoading] = useState(true);
    const page = usePage();

    useEffect(() => {
        const timeout = setTimeout(() => setLoading(false), 700); // tiempo de loader
        return () => clearTimeout(timeout);
    }, [page.url]); // se vuelve a activar cuando cambia de ruta

    return (
        <>
            {loading && <Loader />}
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                <div className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                    {children}
                </div>
            </AppLayoutTemplate>
        </>
    );
};
