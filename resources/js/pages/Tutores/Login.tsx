import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2, Lock, Shield, User } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        codigo: '',
        cedula: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('portal.tutor.login.post'));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            {/* Header superior institucional (opcional) */}
            <header className="fixed top-0 right-0 left-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-slate-900 dark:text-white">Portal Tutorías</span>
                        </div>
                    </div>
                </div>
            </header>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
                <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg dark:from-slate-900 dark:to-slate-900/95">
                    <CardHeader className="space-y-4 pt-8 pb-8 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/30">
                                <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Portal del Tutor</CardTitle>
                            <CardDescription className="text-base text-slate-600 dark:text-slate-400">Ingrese con su código y cédula</CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="codigo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Código
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute top-3 left-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        <Input
                                            id="codigo"
                                            type="text"
                                            placeholder="Ingrese su código"
                                            className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                                            value={data.codigo}
                                            onChange={(e) => setData('codigo', e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {errors.codigo && (
                                        <p className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                                            {errors.codigo}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cedula" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Cédula
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        <Input
                                            id="cedula"
                                            type="password"
                                            placeholder="Ingrese su cédula"
                                            className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                                            value={data.cedula}
                                            onChange={(e) => setData('cedula', e.target.value)}
                                        />
                                    </div>
                                    {errors.cedula && (
                                        <p className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                                            {errors.cedula}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 w-full bg-gradient-to-r from-emerald-600 to-emerald-700 font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    'Entrar al Portal'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer pequeño */}
                <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    © {new Date().getFullYear()} Plataforma de Tutorías Institucional
                </p>
            </motion.div>
        </div>
    );
}
