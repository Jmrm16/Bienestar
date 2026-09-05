import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const updateMatch = (event?: MediaQueryListEvent) => {
            setMatches(event?.matches ?? mediaQueryList.matches);
        };

        updateMatch();
        mediaQueryList.addEventListener('change', updateMatch);

        return () => mediaQueryList.removeEventListener('change', updateMatch);
    }, [query]);

    return matches;
}
