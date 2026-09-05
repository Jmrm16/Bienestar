import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

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
            className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Mobile menu button */}
                    <motion.button
                        onClick={toggleMobileMenu}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-md p-2 transition-colors hover:bg-gray-100 focus:outline-none md:hidden dark:hover:bg-gray-800"
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
                            <span className="ml-2 hidden text-xl font-bold text-gray-800 md:block dark:text-white">Uniguajira</span>
                        </motion.div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <motion.ul variants={containerVariants} initial="hidden" animate="show" className="flex space-x-1">
                            {menuItems.map((item) => {
                                const isActive = route(item.route) === currentPath;
                                return (
                                    <motion.li key={item.route} variants={itemVariants}>
                                        <Link href={route(item.route)}>
                                            <Button
                                                variant={isActive ? 'default' : 'ghost'}
                                                className={`rounded-lg ${isActive ? 'font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
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
                            className="overflow-hidden md:hidden"
                        >
                            <motion.ul variants={containerVariants} initial="hidden" animate="show" className="flex flex-col space-y-1 py-2">
                                {menuItems.map((item) => {
                                    const isActive = route(item.route) === currentPath;
                                    return (
                                        <motion.li key={`mobile-${item.route}`} variants={itemVariants}>
                                            <Link
                                                href={route(item.route)}
                                                onClick={toggleMobileMenu}
                                                className={`block rounded-md px-4 py-2 ${
                                                    isActive
                                                        ? 'bg-primary text-white'
                                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
