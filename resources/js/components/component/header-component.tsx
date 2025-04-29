import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export const HeaderComponent = () => {
    const { auth } = usePage<SharedData>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const menuItems = [
        { name: 'Home', route: 'home' },
        { name: 'Graduacion', route: 'graduacion' },


        // Agrega más items de menú aquí según necesites
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: -20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.header 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50"
        >
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo y menú principal */}
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-8"
                    >
                        <Link href={route('home')} className="flex items-center">
                            <motion.img 
                                whileHover={{ scale: 1.05 }}
                                src="/logo.png" 
                                alt="Site Logo" 
                                className="h-10" 
                            />
                        </Link>
                        
                        {/* Menú de navegación (desktop) */}
                        <nav className="hidden md:block">
                            <motion.ul 
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="flex space-x-6"
                            >
                                {menuItems.map((item) => (
                                    <motion.li 
                                        key={item.route}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Link 
                                            href={route(item.route)} 
                                            className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </nav>
                    </motion.div>

                    {/* Controles de usuario */}
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-4"
                    >
                        {/* Menú móvil */}
                        <motion.button 
                            onClick={toggleMobileMenu}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <FaTimes className="text-xl text-gray-800 dark:text-gray-200" />
                            ) : (
                                <FaBars className="text-xl text-gray-800 dark:text-gray-200" />
                            )}
                        </motion.button>

                        {/* Acciones de autenticación */}
                        <div className="hidden md:flex items-center space-x-3">
                            {auth.user ? (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href={route('dashboard')}
                                        className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                </motion.div>
                            ) : (
                                <>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Link
                                            href={route('login')}
                                            className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Log in
                                        </Link>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Link
                                            href={route('register')}
                                            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Register
                                        </Link>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Menú móvil (colapsable) */}
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
                                className="flex flex-col space-y-2 py-2"
                            >
                                {menuItems.map((item) => (
                                    <motion.li 
                                        key={`mobile-${item.route}`}
                                        variants={itemVariants}
                                        whileHover={{ x: 5 }}
                                    >
                                        <Link 
                                            href={route(item.route)} 
                                            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                            onClick={toggleMobileMenu}
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.li>
                                ))}
                                {/* Menú de autenticación para móviles */}
                                {auth.user ? (
                                    <motion.li variants={itemVariants}>
                                        <Link
                                            href={route('dashboard')}
                                            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                            onClick={toggleMobileMenu}
                                        >
                                            Dashboard
                                        </Link>
                                    </motion.li>
                                ) : (
                                    <>
                                        <motion.li variants={itemVariants}>
                                            <Link
                                                href={route('login')}
                                                className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                onClick={toggleMobileMenu}
                                            >
                                                Log in
                                            </Link>
                                        </motion.li>
                                        <motion.li variants={itemVariants}>
                                            <Link
                                                href={route('register')}
                                                className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                onClick={toggleMobileMenu}
                                            >
                                                Register
                                            </Link>
                                        </motion.li>
                                    </>
                                )}
                            </motion.ul>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
};

export default HeaderComponent;