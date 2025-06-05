import '../css/app.css';
import '../css/style.css';
import '../css/animate.css';
import '../css/font-awesome.min.css';
import '../css/owl.carousel.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { Inertia } from '@inertiajs/inertia';

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const loadScripts = () => {
  return new Promise<void>((resolve) => {
    if (window.$ && window.$.fn.owlCarousel) {
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
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Estado y lógica global del loader
    const LoaderWrapper = () => {
      const [loading, setLoading] = useState(false);

      useEffect(() => {
        const handleStart = (event: any) => {
          if (!event.detail.visit.prefetch) {
            setLoading(true);
          }
        };

        const handleFinish = () => setLoading(false);

        window.addEventListener('inertia:start', handleStart);
        window.addEventListener('inertia:finish', handleFinish);

        return () => {
          window.removeEventListener('inertia:start', handleStart);
          window.removeEventListener('inertia:finish', handleFinish);
        };
      }, []);

      return loading ? <Loader /> : null;
    };

    root.render(
      <>
        <LoaderWrapper />
        <ThemeAwareToaster />
        <App {...props} />
      </>
    );

    loadScripts();
  },
  progress: {
    color: '#4B5563',
  },
});

initializeTheme();
