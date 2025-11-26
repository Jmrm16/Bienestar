import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, User } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Portal del Tutor
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Ingrese con su código y cédula
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-sm font-medium text-slate-700">
                  Código
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="Ingrese su código"
                    className="pl-10 h-11 border-slate-300 focus:border-emerald-500"
                    value={data.codigo}
                    onChange={(e) => setData("codigo", e.target.value)}
                    autoFocus
                  />
                </div>
                {errors.codigo && (
                  <p className="text-sm text-red-600 font-medium">{errors.codigo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula" className="text-sm font-medium text-slate-700">
                  Cédula
                </Label>
                <Input
                  id="cedula"
                  type="password"
                  placeholder="Ingrese su cédula"
                  className="h-11 border-slate-300 focus:border-emerald-500"
                  value={data.cedula}
                  onChange={(e) => setData("cedula", e.target.value)}
                />
                {errors.cedula && (
                  <p className="text-sm text-red-600 font-medium">{errors.cedula}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={processing}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
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

          <div className="text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Al ingresar, acepta el tratamiento de datos personales 
              <span className="block font-medium text-emerald-600 mt-1">
                (Habeas Data)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}