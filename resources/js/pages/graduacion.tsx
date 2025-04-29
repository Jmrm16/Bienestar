import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';

// Declaración global para TypeScript
declare global {
  interface Window {
    $: any;
    jQuery: any;
    owlCarousel: any;
  }
}

export default function Welcome() {
  useEffect(() => {
    // Función para inicializar el carrusel
    const initOwlCarousel = () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').owlCarousel({
          loop: true,
          nav: false,
          dots: true,
          items: 1,
          autoplay: true,
          autoplayTimeout: 5000,
          autoplayHoverPause: true,
          smartSpeed: 1000
        });
      } else {
        // Reintentar si no están cargados los scripts
        setTimeout(initOwlCarousel, 100);
      }
    };

    // Inicializar el carrusel
    initOwlCarousel();

    // Limpieza al desmontar el componente
    return () => {
      if (window.$ && window.$.fn && window.$.fn.owlCarousel) {
        $('.hero-slider').trigger('destroy.owl.carousel');
      }
    };
  }, []);

  return (
    <>
      <Head title="Welcome">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        {/* Estilos de Owl Carousel */}
        
      </Head>

      <HeaderComponent />

      <main className="flex min-h-screen flex-col items-center bg-[#FDFDFC] text-[#1b1b18] ">
        
        {/* Hero Section - Carrusel */}
        <section className="hero-section w-[100%]">
          <div className="hero-slider owl-carousel">
            <div 
              className="hs-item h-[500px] bg-cover bg-center relative" 
              style={{ 
                backgroundImage: "url('https://diariodelnorte.net/wp-content/uploads/2024/02/edificio-Uniguajira-750x375.png')"
              }}
            >
              <div className="hs-text absolute bottom-0 left-0 right-0 p-5 bg-opacity-50 text-white">
                <div className="container mx-auto">
                  <h2 className="text-4xl font-bold">CHEN <span className="text-yellow-400">VIEJO</span></h2>
                  <p className="my-4"><br/><br/></p>
                  <Link href="#" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Read More</Link>
                </div>
              </div>
            </div>
            <div 
              className="hs-item h-[500px] bg-cover bg-center relative" 
              style={{ 
                backgroundImage: "url('https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp')"
              }}
            >
              <div className="hs-text absolute bottom-0 left-0 right-0 p-5 bg-opacity-50 text-white">
                <div className="container mx-auto">
                  <h2 className="text-4xl font-bold">The Best <span className="text-yellow-400">Games</span> Out There</h2>
                  <p className="my-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec malesuada <br/> lorem maximus mauris scelerisque, at rutrum nulla dictum.</p>
                  <Link href="#" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Read More</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End Hero Section */}

   

        {/* Feature Section */}
        <section className="feature-section w-full py-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  bg: "https://dragonraja.zloong.com/img/ss.png",
                  category: "new",
                  title: "Suspendisse ut justo tem por, rutrum",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                },
                {
                  bg: "https://dragonraja.zloong.com/img/mc_6.jpg",
                  category: "strategy",
                  title: "Justo tempor, rutrum erat id, molestie",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                },
                {
                  bg: "https://dragonraja.zloong.com/img/mc_7.jpg",
                  category: "new",
                  title: "Nullam lacinia ex eleifend orci porttitor",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                },
                {
                  bg: "https://dragonraja.zloong.com/img/mc_1.jpg",
                  category: "racing",
                  title: "Lacinia ex eleifend orci suscipit",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                }
              ].map((item, index) => (
                <div key={index} className="w-full">
                  <div 
                    className="feature-item h-64 bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${item.bg}')` }}
                  >
                    <span className={`absolute top-2 left-2 ${item.category === 'new' ? 'bg-red-600' : item.category === 'strategy' ? 'bg-blue-600' : 'bg-yellow-600'} text-white px-2 py-1 rounded text-xs`}>
                      {item.category}
                    </span>
                    <div className="fi-content absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-70 text-white">
                      <h5 className="font-semibold"><Link href="#" className="hover:underline">{item.title}</Link></h5>
                      <p className="text-sm my-2">{item.desc}</p>
                      <Link href="#" className="text-blue-300 text-sm hover:underline">3 Comments</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Games Section */}
        <section 
          className="recent-game-section w-full py-12 bg-cover bg-center" 
          style={{ backgroundImage: "url('/img/recent-game-bg.png')" }}
        >
          <div className="container mx-auto">
            <div className="section-title text-center mb-8">
              <div className="cata bg-red-600 text-white px-3 py-1 rounded-full text-xs inline-block">new</div>
              <h2 className="text-3xl font-bold mt-2">Recent Games</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  bg: "/img/recent-game/1.jpg",
                  category: "new",
                  title: "Suspendisse ut justo tem por, rutrum",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit amet, consectetur elit."
                },
                {
                  bg: "/img/recent-game/2.jpg",
                  category: "racing",
                  title: "Susce pulvinar metus nulla, vel facilisis sem",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit amet, consectetur elit."
                },
                {
                  bg: "/img/recent-game/3.jpg",
                  category: "adventure",
                  title: "Suspendisse ut justo tem por, rutrum",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit amet, consectetur elit."
                }
              ].map((item, index) => (
                <div key={index} className="w-full">
                  <div className="recent-game-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <div 
                      className="rgi-thumb h-48 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('${item.bg}')` }}
                    >
                      <div className={`cata absolute top-2 left-2 ${item.category === 'new' ? 'bg-red-600' : item.category === 'racing' ? 'bg-yellow-600' : 'bg-green-600'} text-white px-2 py-1 rounded text-xs`}>
                        {item.category}
                      </div>
                    </div>
                    <div className="rgi-content p-4">
                      <h5 className="text-lg font-semibold mb-2">{item.title}</h5>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{item.desc}</p>
                      <Link href="#" className="text-blue-500 hover:underline text-sm">3 Comments</Link>
                      <div className="rgi-extra flex justify-between mt-3">
                        <div className="rgi-star">
                          <img src="/img/icons/star.png" alt="Rating" className="h-5 w-5"/>
                        </div>
                        <div className="rgi-heart">
                          <img src="/img/icons/heart.png" alt="Likes" className="h-5 w-5"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tournaments Section */}
        <section className="tournaments-section w-full bg-gray-100 dark:bg-gray-900 py-12">
          <div className="container mx-auto">
            <div className="tournament-title text-center mb-8">Tournaments</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                {
                  bg: "/img/tournament/1.jpg",
                  title: "World Of WarCraft",
                  details: [
                    "Tournament Beggins: June 20, 2018",
                    "Tounament Ends: July 01, 2018",
                    "Participants: 10 teams",
                    "Tournament Author: Admin"
                  ],
                  prizes: "1st place $2000, 2nd place: $1000, 3rd place: $500"
                },
                {
                  bg: "/img/tournament/2.jpg",
                  title: "DOOM",
                  details: [
                    "Tournament Beggins: June 20, 2018",
                    "Tounament Ends: July 01, 2018",
                    "Participants: 10 teams",
                    "Tournament Author: Admin"
                  ],
                  prizes: "1st place $2000, 2nd place: $1000, 3rd place: $500"
                }
              ].map((item, index) => (
                <div key={index} className="w-full">
                  <div className="tournament-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    <div className="ti-notic bg-blue-600 text-white px-4 py-2">Premium Tournament</div>
                    <div className="ti-content p-4">
                      <div 
                        className="ti-thumb h-48 bg-cover bg-center mb-4 rounded"
                        style={{ backgroundImage: `url('${item.bg}')` }}
                      ></div>
                      <div className="ti-text">
                        <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                        <ul className="space-y-2 mb-4">
                          {item.details.map((detail, i) => (
                            <li key={i} className="flex">
                              <span className="font-semibold min-w-[150px]">{detail.split(':')[0]}:</span>
                              <span>{detail.split(':')[1]}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="font-semibold">
                          <span className="text-blue-600">Prizes:</span> {item.prizes}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Review Section */}
        <section 
          className="review-section w-full py-12 bg-cover bg-center" 
          style={{ backgroundImage: "url('/img/review-bg.png')" }}
        >
          <div className="container mx-auto">
            <div className="section-title text-center mb-8">
              <div className="cata bg-red-600 text-white px-3 py-1 rounded-full text-xs inline-block mx-auto">new</div>
              <h2 className="text-3xl font-bold mt-2">Recent Reviews</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  bg: "/img/review/1.jpg",
                  score: "9.3",
                  scoreClass: "bg-yellow-400",
                  title: "Assasin's Creed",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit ame."
                },
                {
                  bg: "/img/review/2.jpg",
                  score: "9.5",
                  scoreClass: "bg-purple-500",
                  title: "Doom",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit ame."
                },
                {
                  bg: "/img/review/3.jpg",
                  score: "9.1",
                  scoreClass: "bg-green-500",
                  title: "Overwatch",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit ame."
                },
                {
                  bg: "/img/review/4.jpg",
                  score: "9.7",
                  scoreClass: "bg-pink-500",
                  title: "GTA",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit ame."
                }
              ].map((item, index) => (
                <div key={index} className="w-full">
                  <div className="review-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full">
                    <div 
                      className="review-cover h-48 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('${item.bg}')` }}
                    >
                      <div className={`score ${item.scoreClass} absolute top-2 right-2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {item.score}
                      </div>
                    </div>
                    <div className="review-text p-4">
                      <h5 className="text-lg font-semibold mb-2">{item.title}</h5>
                      <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="hidden h-14 lg:block"></div>
      </main>

      <FooterComponent />
    </>
  );
}