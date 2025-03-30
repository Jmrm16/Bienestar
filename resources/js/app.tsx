import '../css/app.css';
import '../css/style.css';
import '../css/animate.css';
import '../css/font-awesome.min.css';
import '../css/owl.carousel.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Declaración global para jQuery y Owl Carousel
declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Cargar jQuery y Owl Carousel dinámicamente
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

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);

    // Cargar scripts antes de renderizar la app
    loadScripts().then(() => {
      root.render(<App {...props} />);
    });
  },
  progress: {
    color: '#4B5563',
  },
});

// Inicializar el tema
initializeTheme();