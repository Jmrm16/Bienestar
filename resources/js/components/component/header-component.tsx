import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";

export const HeaderComponent = () => {
  const { url: currentPath } = usePage<SharedData>().props;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Inicio', route: 'home' },
    { name: 'Permanencia y graduación', route: 'graduacion' },
    { name: 'Cultura', route: 'cultura' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.header
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <motion.button
            onClick={toggleMobileMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
            aria-label="Alternar menú"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-xl text-gray-800 dark:text-gray-200" />
            ) : (
              <FaBars className="text-xl text-gray-800 dark:text-gray-200" />
            )}
          </motion.button>

          {/* Logo */}
          <Link href={route('home')} className="flex items-center">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
              <img src="/img/logo.png" alt="Logo del sitio" className="h-8 md:h-10" />
              <span className="ml-2 text-xl font-bold hidden md:block text-gray-800 dark:text-white">
                Uniguajira
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex space-x-1"
            >
              {menuItems.map((item) => {
                const isActive = route(item.route) === currentPath;
                return (
                  <motion.li key={item.route} variants={itemVariants}>
                    <Link href={route(item.route)}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`rounded-lg ${isActive ? "font-semibold" : "text-gray-600 dark:text-gray-300"}`}
                      >
                        {item.name}
                      </Button>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden overflow-hidden"
            >
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col space-y-1 py-2"
              >
                {menuItems.map((item) => {
                  const isActive = route(item.route) === currentPath;
                  return (
                    <motion.li key={`mobile-${item.route}`} variants={itemVariants}>
                      <Link
                        href={route(item.route)}
                        onClick={toggleMobileMenu}
                        className={`block px-4 py-2 rounded-md ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default HeaderComponent;
