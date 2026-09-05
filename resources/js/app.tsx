import '../css/animate.css';
import '../css/app.css';
import '../css/font-awesome.min.css';
import '../css/owl.carousel.css';
import '../css/style.css';

import { Loader } from '@/components/ui/loader';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

type InertiaRootElement = HTMLElement & {
    __inertiaRoot?: Root;
};

type InertiaStartEventDetail = {
    visit?: {
        prefetch?: boolean;
    };
};

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob('./pages/**/*.tsx');

const resolveInertiaPage = (name: string) => {
    const pagePath = `./pages/${name}.tsx`;

    if (pages[pagePath]) {
        return resolvePageComponent(pagePath, pages);
    }

    const caseInsensitiveMatch = Object.keys(pages).find((key) => key.toLowerCase() === pagePath.toLowerCase());

    if (caseInsensitiveMatch) {
        return resolvePageComponent(caseInsensitiveMatch, pages);
    }

    throw new Error(`Page not found: ${pagePath}`);
};

const loadScripts = () => {
    return new Promise<void>((resolve) => {
        if (window.$ && window.$.fn?.owlCarousel) {
            resolve();
            return;
        }

        const jqueryScript = document.createElement('script');
        jqueryScript.src = '/js/jquery-3.2.1.min.js';
        jqueryScript.async = false;
        jqueryScript.onload = () => {
            const owlScript = document.createElement('script');
            owlScript.src = '/js/owl.carousel.min.js';
            owlScript.async = false;
            owlScript.onload = () => resolve();
            document.head.appendChild(owlScript);
        };
        document.head.appendChild(jqueryScript);
    });
};

const ThemeAwareToaster = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

        return () => observer.disconnect();
    }, []);

    return <Toaster theme={theme} position="top-right" />;
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: resolveInertiaPage,
    setup({ el, App, props }) {
        // ✅ Evita crear múltiples roots en HMR / re-renders
        const rootElement = el as InertiaRootElement;
        const root: Root = rootElement.__inertiaRoot ?? (rootElement.__inertiaRoot = createRoot(el));

        // ✅ Loader global (no hace falta crear container extra)
        const LoaderWrapper = () => {
            const [loading, setLoading] = useState(false);
            const showTimerRef = useRef<number | null>(null);

            useEffect(() => {
                const clearPendingTimer = () => {
                    if (showTimerRef.current !== null) {
                        window.clearTimeout(showTimerRef.current);
                        showTimerRef.current = null;
                    }
                };

                const handleStart = (event: Event) => {
                    const detail = (event as CustomEvent<InertiaStartEventDetail>).detail;

                    if (detail?.visit?.prefetch) {
                        return;
                    }

                    clearPendingTimer();
                    showTimerRef.current = window.setTimeout(() => {
                        setLoading(true);
                        showTimerRef.current = null;
                    }, 140);
                };
                const handleFinish = () => {
                    clearPendingTimer();
                    setLoading(false);
                };

                window.addEventListener('inertia:start', handleStart);
                window.addEventListener('inertia:finish', handleFinish);

                return () => {
                    clearPendingTimer();
                    window.removeEventListener('inertia:start', handleStart);
                    window.removeEventListener('inertia:finish', handleFinish);
                };
            }, []);

            return loading ? <Loader /> : null;
        };

        root.render(
            <React.StrictMode>
                <LoaderWrapper />
                <ThemeAwareToaster />
                <App {...props} />
            </React.StrictMode>,
        );

        loadScripts();
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
