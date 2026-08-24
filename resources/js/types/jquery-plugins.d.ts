type LegacyOwlCarouselOptions = {
    loop?: boolean;
    nav?: boolean;
    dots?: boolean;
    items?: number;
    autoplay?: boolean;
    autoplayTimeout?: number;
    autoplayHoverPause?: boolean;
    smartSpeed?: number;
    animateOut?: string;
    animateIn?: string;
};

declare global {
    interface JQuery<TElement = HTMLElement> {
        owlCarousel?: (options?: LegacyOwlCarouselOptions) => JQuery<TElement>;
    }

    interface JQueryStatic {
        fn?: {
            owlCarousel?: unknown;
        };
    }

    interface Window {
        $?: JQueryStatic;
        jQuery?: JQueryStatic;
    }
}

export {};
