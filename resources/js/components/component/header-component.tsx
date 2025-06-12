import { useState } from 'react';
import { FaBars, FaTimes, FaUser, FaSearch, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const HeaderComponent = () => {
    const { auth, url: currentPath } = usePage<SharedData>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const menuItems = [
        { name: 'Home', route: 'home' },
        { name: 'Permanencia y graduación', route: 'graduacion' },
        { name: 'Cultura', route: 'cultura' },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleSearch = () => setSearchOpen(!searchOpen);

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

    const searchVariants = {
        hidden: { width: 0, opacity: 0 },
        show: { width: '200px', opacity: 1 }
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
                    {/* Logo and main menu */}
                    <div className="flex items-center space-x-4 md:space-x-8">
                        {/* Mobile menu button */}
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

                        {/* Logo */}
                        <Link href={route('home')} className="flex items-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center"
                            >
                                <img
                                    src="/img/logo.png"
                                    alt="Site Logo"
                                    className="h-8 md:h-10"
                                />
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
                                        <motion.li
                                            key={item.route}
                                            variants={itemVariants}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
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

                    {/* Right side controls */}
                    <div className="flex items-center space-x-3">
                        {/* Search */}
                        <motion.div className="flex items-center">
                            {searchOpen && (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={searchVariants}
                                    className="mr-2"
                                >
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        className="h-9 border-gray-300 dark:border-gray-700 focus-visible:ring-primary"
                                    />
                                </motion.div>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSearch}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            >
                                <FaSearch className="h-4 w-4" />
                            </Button>
                        </motion.div>

                        {/* Notifications */}
                        {auth.user && (
                            <Button variant="ghost" size="icon" className="relative">
                                <FaBell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                            </Button>
                        )}

                        {/* User controls */}
                        {auth.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        <FaUser className="h-4 w-4" />
                                        <span className="hidden md:inline">{auth.user.name}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')}>Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('logout')} method="post" as="button">
                                            Log Out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Link href={route('login')}>
                                    <Button variant="outline" size="sm">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href={route('register')}>
                                    <Button size="sm">Register</Button>
                                </Link>
                            </div>
                        )}
                    </div>
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
                                        <motion.li
                                            key={`mobile-${item.route}`}
                                            variants={itemVariants}
                                        >
                                            <Link 
                                                href={route(item.route)} 
                                                onClick={toggleMobileMenu}
                                                className={`block px-4 py-2 rounded-md ${isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                {item.name}
                                            </Link>
                                        </motion.li>
                                    );
                                })}
                                {auth.user ? (
                                    <>
                                        <motion.li variants={itemVariants}>
                                            <Link 
                                                href={route('dashboard')} 
                                                onClick={toggleMobileMenu}
                                                className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                Dashboard
                                            </Link>
                                        </motion.li>
                                        <motion.li variants={itemVariants}>
                                            <Link 
                                                href={route('profile.edit')} 
                                                onClick={toggleMobileMenu}
                                                className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                Profile
                                            </Link>
                                        </motion.li>
                                        <motion.li variants={itemVariants}>
                                            <Link 
                                                href={route('logout')} 
                                                method="post" 
                                                as="button"
                                                onClick={toggleMobileMenu}
                                                className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                Log Out
                                            </Link>
                                        </motion.li>
                                    </>
                                ) : (
                                    <>
                                        <motion.li variants={itemVariants}>
                                            <Link 
                                                href={route('login')} 
                                                onClick={toggleMobileMenu}
                                                className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                Log in
                                            </Link>
                                        </motion.li>
                                        <motion.li variants={itemVariants}>
                                            <Link 
                                                href={route('register')} 
                                                onClick={toggleMobileMenu}
                                                className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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