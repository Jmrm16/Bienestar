import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

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

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: resolveInertiaPage,
        setup: ({ App, props }) => {
            /* eslint-disable */
            // @ts-expect-error
            global.route<RouteName> = (name, params, absolute) =>
                route(name, params as any, absolute, {
                    // @ts-expect-error
                    ...page.props.ziggy,
                    // @ts-expect-error
                    location: new URL(page.props.ziggy.location),
                });
            /* eslint-enable */

            return <App {...props} />;
        },
    }),
);
