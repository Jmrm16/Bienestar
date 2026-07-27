interface HeroCarouselProps {
  stats?: Array<{
    label: string;
    value: number;
  }>;
}

export default function HeroCarousel({ stats = [] }: HeroCarouselProps) {
  const heroStats = stats.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-stone-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-amber-950/70" />

      <div className="relative mx-auto flex min-h-[440px] max-w-7xl flex-col justify-center px-4 py-16 md:px-6">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Bienestar Universitario
          </p>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            Cultura universitaria con una página más clara y enfocada
          </h2>
          <p className="mt-4 max-w-2xl text-base text-stone-200 md:text-lg">
            Consulta eventos, noticias, áreas artísticas y piezas destacadas sin repetir información ni
            cargar de más la vista principal.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#eventos"
              className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 font-semibold text-stone-950 transition hover:bg-amber-400"
            >
              Ver eventos
            </a>
            <a
              href="#noticias"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Ir a noticias
            </a>
          </div>
        </div>

        {heroStats.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
              >
                <p className="text-3xl font-bold text-amber-300">{item.value}</p>
                <p className="mt-1 text-sm text-stone-200">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
