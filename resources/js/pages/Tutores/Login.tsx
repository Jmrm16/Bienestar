import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, User, Lock, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    codigo: "",
    cedula: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route("portal.tutor.login.post"));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      {/* Header superior institucional (opcional) */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                Portal Tutorías
              </span>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/95">
          <CardHeader className="space-y-4 text-center pb-8 pt-8">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-full">
                <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                Portal del Tutor
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                Ingrese con su código y cédula
              </CardDescription>
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
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <Input
                      id="codigo"
                      type="text"
                      placeholder="Ingrese su código"
                      className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500"
                      value={data.codigo}
                      onChange={(e) => setData("codigo", e.target.value)}
                      autoFocus
                    />
                  </div>
                  {errors.codigo && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
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
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <Input
                      id="cedula"
                      type="password"
                      placeholder="Ingrese su cédula"
                      className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500"
                      value={data.cedula}
                      onChange={(e) => setData("cedula", e.target.value)}
                    />
                  </div>
                  {errors.cedula && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                      {errors.cedula}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar al Portal"
                )}
              </Button>
            </form>

            

       

        
          </CardContent>
        </Card>

        {/* Footer pequeño */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          © {new Date().getFullYear()} Plataforma de Tutorías Institucional
        </p>
      </motion.div>
    </div>
  );
}