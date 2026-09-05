import { resolveCulturaImageUrl } from '@/lib/cultura-media';
import { Cultura } from '@/types';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Props {
    culturas: Cultura[];
}

const DEFAULT_IMG = 'https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp';

const CarouselSize = ({ culturas }: Props) => {
    return (
        <section className="bg-white pt-6">
            <div className="container mx-auto">
                <Carousel opts={{ align: 'start' }} className="w-full">
                    <CarouselContent>
                        {culturas.map((item) => (
                            <CarouselItem key={item.id} className="basis-full px-2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <article className="overflow-hidden rounded-md bg-white shadow-sm">
                                    <a href={`/cultura/${item.id}/item`} className="block">
                                        <div className="overflow-hidden">
                                            <img
                                                src={resolveCulturaImageUrl(item, DEFAULT_IMG)}
                                                alt={item.titulo}
                                                className="h-36 w-full object-cover transition-transform duration-300 hover:scale-105"
                                            />
                                        </div>
                                    </a>
                                    <div className="p-3">
                                        <h6 className="mt-1 line-clamp-2 text-sm leading-snug font-medium text-zinc-800">
                                            <a href={`/cultura/${item.id}/item`} className="hover:text-primary">
                                                {item.titulo}
                                            </a>
                                        </h6>

                                        <p className="mt-1 flex items-center text-xs text-gray-500">
                                            <i className="far fa-calendar-alt mr-1 text-gray-400"></i>
                                            {new Date(item.fecha).toLocaleDateString('es-CO', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </article>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </section>
    );
};

export default CarouselSize;
