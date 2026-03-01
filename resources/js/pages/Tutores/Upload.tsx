import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, ArrowLeft } from "lucide-react";

interface Props {
  window: {
    id: number;
    name: string;
    instructions?: string;
  };
}

export default function UploadInforme({ window }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const goHomeInformes = () => {
    router.visit(route("portal.tutor.home") + "?tab=informes", {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleImport = () => {
    if (!file) return alert("Selecciona un archivo");

    const form = new FormData();
    form.append("archivo", file);

    setImporting(true);

    router.post(route("portal.tutor.informes.import", window.id), form, {
      forceFormData: true,
      onError: (errors) => {
        console.log("Errores import:", errors);
        alert("Error al importar. Revisa consola y/o logs.");
      },
      onFinish: () => setImporting(false),
    });
  };

  return (
    <>
      <Head title="Subir asistencias" />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-xl md:text-2xl">
                  Subir archivo de asistencias
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {window.name}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={goHomeInformes}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver (Informes)
              </Button>
            </div>

            {window.instructions && (
              <p className="text-sm text-muted-foreground">
                {window.instructions}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="p-10 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">
                  Arrastra o selecciona el Excel
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos permitidos: .xlsx, .xls
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) =>
                  e.target.files && setFile(e.target.files[0])
                }
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {file.name}
                </span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? "Importando…" : "Importar asistencias"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}