import * as React from "react";
import { Cultura } from "@/types";
import { resolveCulturaImageUrl } from "@/lib/cultura-media";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Props {
  culturas: Cultura[];
}

const DEFAULT_IMG =
  "https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp";

const CarouselSize = ({ culturas }: Props) => {
  return (
    <section className="bg-white pt-6">
      <div className="container mx-auto">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            {culturas.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-2"
              >
                <article className="bg-white rounded-md shadow-sm overflow-hidden">
                  <a href={`/cultura/${item.id}/item`} className="block">
                    <div className="overflow-hidden">
                      <img
                        src={resolveCulturaImageUrl(item, DEFAULT_IMG)}
                        alt={item.titulo}
                        className="w-full h-36 object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </a>
                  <div className="p-3">
                    <h6 className="text-sm font-medium text-zinc-800 line-clamp-2 mt-1 leading-snug">
                      <a href={`/cultura/${item.id}/item`} className="hover:text-primary">
                        {item.titulo}
                      </a>
                    </h6>

                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <i className="far fa-calendar-alt mr-1 text-gray-400"></i>
                      {new Date(item.fecha).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
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
