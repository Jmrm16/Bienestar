import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderComponent from '@/../js/components/component/header-component';
import FooterComponent from '@/../js/components/component/footer-component';

declare global {
  interface Window {
    $: any;
    jQuery: any;
    owlCarousel: any;
  }
}

// Animaciones reutilizables
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Welcome() {
  useEffect(() => {
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
        setTimeout(initOwlCarousel, 100);
      }
    };

    initOwlCarousel();

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
      </Head>

      <HeaderComponent />

      <main className="flex min-h-screen flex-col items-center bg-[#FDFDFC] text-[#1b1b18]">
        {/* Hero Section - Carrusel */}

        <div className="hero-slider owl-carousel">
            <motion.div 
              className="hs-item h-[500px] bg-cover bg-center relative" 
              style={{ 
                backgroundImage: "url('https://diariodelnorte.net/wp-content/uploads/2024/02/edificio-Uniguajira-750x375.png')"
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="hs-text absolute bottom-0 left-0 right-0 p-5 bg-opacity-50 text-white"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="container mx-auto">
                  <motion.h2 
                    className="text-4xl font-bold"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    CHEN <span className="text-yellow-400">VIEJO</span>
                  </motion.h2>
                  <motion.p 
                    className="my-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <br/><br/>
                  </motion.p>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Link href="#" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                      Read More
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Segundo slide del carrusel */}
            <div 
              className="hs-item h-[500px] bg-cover bg-center relative" 
              style={{ 
                backgroundImage: "url('https://uniguajira.edu.co/wp-content/uploads/2024/05/unnamed-5-1-1024x576.webp')"
              }}
            >
              <div className="hs-text absolute bottom-0 left-0 right-0 p-5 bg-opacity-50 text-white">
                <div className="container mx-auto">
                  <h2 className="text-4xl font-bold">The Best <span className="text-yellow-400">Games</span> Out There</h2>
                  <p className="my-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <Link href="#" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        {/* Feature Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="feature-section w-full py-12"
        >
          <div className="container mx-auto">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
            >
              {[
                {
                  bg: "https://dragonraja.zloong.com/img/ss.png",
                  category: "new",
                  title: "Suspendisse ut justo tem por, rutrum",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                },
                // ... otros items del feature
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="w-full"
                >
                  <div 
                    className="feature-item h-64 bg-cover bg-center relative rounded-lg overflow-hidden shadow-md"
                    style={{ backgroundImage: `url('${item.bg}')` }}
                  >
                    <motion.span 
                      className={`absolute top-2 left-2 ${item.category === 'new' ? 'bg-red-600' : 'bg-blue-600'} text-white px-2 py-1 rounded text-xs`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {item.category}
                    </motion.span>
                    <div className="fi-content absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-70 text-white">
                      <h5 className="font-semibold">
                        <Link href="#" className="hover:underline">{item.title}</Link>
                      </h5>
                      <p className="text-sm my-2">{item.desc}</p>
                      <Link href="#" className="text-blue-300 text-sm hover:underline">
                        3 Comments
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Recent Games Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="recent-game-section w-full py-12 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/recent-game-bg.png')" }}
        >
          <div className="container mx-auto">
            <motion.div 
              className="section-title text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="cata bg-red-600 text-white px-3 py-1 rounded-full text-xs inline-block">
                new
              </div>
              <h2 className="text-3xl font-bold mt-2">Recent Games</h2>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  bg: "/img/recent-game/1.jpg",
                  category: "new",
                  title: "Suspendisse ut justo tem por, rutrum",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit amet, consectetur elit."
                },
                // ... otros items de juegos recientes
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03 }}
                  className="w-full"
                >
                  <div className="recent-game-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <div 
                      className="rgi-thumb h-48 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('${item.bg}')` }}
                    >
                      <div className={`cata absolute top-2 left-2 ${item.category === 'new' ? 'bg-red-600' : 'bg-yellow-600'} text-white px-2 py-1 rounded text-xs`}>
                        {item.category}
                      </div>
                    </div>
                    <div className="rgi-content p-4">
                      <h5 className="text-lg font-semibold mb-2">{item.title}</h5>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{item.desc}</p>
                      <Link href="#" className="text-blue-500 hover:underline text-sm">
                        3 Comments
                      </Link>
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Tournaments Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="tournaments-section w-full bg-gray-100 dark:bg-gray-900 py-12"
        >
          <div className="container mx-auto">
            <motion.div 
              className="tournament-title text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              Tournaments
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
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
                // ... otros items de torneos
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="w-full"
                >
                  <div className="tournament-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    <div className="ti-notic bg-blue-600 text-white px-4 py-2">
                      Premium Tournament
                    </div>
                    <div className="ti-content p-4">
                      <div 
                        className="ti-thumb h-48 bg-cover bg-center mb-4 rounded"
                        style={{ backgroundImage: `url('${item.bg}')` }}
                      ></div>
                      <div className="ti-text">
                        <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                        <ul className="space-y-2 mb-4">
                          {item.details.map((detail, i) => (
                            <motion.li 
                              key={i}
                              className="flex"
                              initial={{ x: -10, opacity: 0 }}
                              whileInView={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              viewport={{ once: true }}
                            >
                              <span className="font-semibold min-w-[150px]">{detail.split(':')[0]}:</span>
                              <span>{detail.split(':')[1]}</span>
                            </motion.li>
                          ))}
                        </ul>
                        <p className="font-semibold">
                          <span className="text-blue-600">Prizes:</span> {item.prizes}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Review Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="review-section w-full py-12 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/review-bg.png')" }}
        >
          <div className="container mx-auto">
            <motion.div 
              className="section-title text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="cata bg-red-600 text-white px-3 py-1 rounded-full text-xs inline-block mx-auto">
                new
              </div>
              <h2 className="text-3xl font-bold mt-2">Recent Reviews</h2>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  bg: "/img/review/1.jpg",
                  score: "9.3",
                  scoreClass: "bg-yellow-400",
                  title: "Assasin's Creed",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipisc ing ipsum dolor sit ame."
                },
                // ... otros items de reviews
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="w-full"
                >
                  <div className="review-item bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full">
                    <div 
                      className="review-cover h-48 bg-cover bg-center relative"
                      style={{ backgroundImage: `url('${item.bg}')` }}
                    >
                      <motion.div 
                        className={`score ${item.scoreClass} absolute top-2 right-2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ type: 'spring' }}
                      >
                        {item.score}
                      </motion.div>
                    </div>
                    <div className="review-text p-4">
                      <h5 className="text-lg font-semibold mb-2">{item.title}</h5>
                      <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <div className="hidden h-14 lg:block"></div>
      </main>

      <FooterComponent />
    </>
  );
}