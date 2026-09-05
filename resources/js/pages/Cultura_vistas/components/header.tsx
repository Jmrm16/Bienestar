import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function HeaderpermaComponent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [{ name: 'Inicio', href: '/cultura' }];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

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
            className="sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-900"
        >
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Menú Desktop */}
                    <nav className="hidden md:block">
                        <motion.ul variants={containerVariants} initial="hidden" animate="show" className="flex space-x-4">
                            {menuItems.map((item) => (
                                <motion.li key={item.href} variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href={item.href}>
                                        <Button variant="ghost" className="text-muted-foreground">
                                            {item.name}
                                        </Button>
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </nav>
                    {/* Logo / Título */}
                    <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        Cultura
                    </motion.h1>

                    {/* Botón menú móvil */}
                    <motion.button
                        onClick={toggleMobileMenu}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-md p-2 transition-colors hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes className="text-xl text-gray-800 dark:text-gray-200" />
                        ) : (
                            <FaBars className="text-xl text-gray-800 dark:text-gray-200" />
                        )}
                    </motion.button>
                </div>

                {/* Menú móvil colapsable */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.nav
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden md:hidden"
                        >
                            <motion.ul variants={containerVariants} initial="hidden" animate="show" className="flex flex-col space-y-2 py-2">
                                {menuItems.map((item) => (
                                    <motion.li key={item.href} variants={itemVariants}>
                                        <Link href={item.href} onClick={toggleMobileMenu}>
                                            <Button variant="ghost" className="text-muted-foreground w-full justify-start hover:text-blue-600">
                                                {item.name}
                                            </Button>
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
