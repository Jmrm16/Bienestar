import { FaBars } from 'react-icons/fa';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export const HeaderComponent = () => {
    const { auth } = usePage<SharedData>().props;
    return (
        <header className="header-section bg-white dark:bg-gray-900 shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo a la izquierda */}
                <div className="flex items-center">
                    <Link href={route('home')} className="site-logo mr-4">
                        <img src="#" alt="SITE LOGO" className="h-10" />
                    </Link>
                    
                    {/* Menú principal (oculto en móviles) */}
                    <nav className="hidden md:block">
                        <ul className="flex space-x-6">
                            <li>
                                <Link href={route('home')} className="text-[#1b1b18] dark:text-[#EDEDEC] hover:text-blue-600 transition">
                                    Home
                                </Link>
                            </li>
                            {/* Agrega más elementos del menú aquí */}
                        </ul>
                    </nav>
                </div>

                {/* Contenedor derecho */}
                <div className="flex items-center space-x-4">
                    {/* Botón de menú móvil */}
                    <div className="md:hidden nav-switch">
                        <FaBars className="text-xl text-[#1b1b18] dark:text-[#EDEDEC]" />
                    </div>

                    {/* Navegación de autenticación */}
                    <nav className="flex items-center space-x-3">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b] transition"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="hidden sm:inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A] transition"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b] transition"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;