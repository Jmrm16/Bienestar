import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import * as XLSX from "xlsx";

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
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const isNumeric = (v: any) => typeof v === "number" || /^\d+$/.test(String(v));

  const goHomeInformes = () => {
    router.visit(route("portal.tutor.home") + "?tab=informes", {
      preserveScroll: true,
      preserveState: true,
    });
  };

  /* ===============================
     LEER EXCEL
  =============================== */
  const handleFile = async (f: File) => {
    setFile(f);
    setLoading(true);

    const buffer = await f.arrayBuffer();
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    const headerRowIndex = rows.findIndex((r) =>
      String(r.join(" ")).toUpperCase().includes("NOMBRES DEL ESTUDIANTE")
    );

    if (headerRowIndex === -1) {
      alert("No se encontró el encabezado del archivo.");
      setLoading(false);
      return;
    }

    const header = rows[headerRowIndex];

    const colMap = {
      nombres: header.findIndex((c) => String(c).toUpperCase().includes("NOMBRES")),
      identificacion: header.findIndex((c) =>
        String(c).toUpperCase().includes("IDENTIFICACION")
      ),
      codigo: header.findIndex((c) => String(c).toUpperCase().includes("CÓDIGO")),
    };

    const dataRows = rows.slice(headerRowIndex + 2);

    const students = dataRows.filter((r) => {
      if (!r[colMap.nombres]) return false;
      if (!isNumeric(r[colMap.identificacion])) return false;
      if (!isNumeric(r[colMap.codigo])) return false;
      return true;
    });

    setPreview(students);
    setLoading(false);
  };

  /* ===============================
     IMPORTAR
  =============================== */
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
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-xl md:text-2xl">Subir archivo de asistencias</CardTitle>
                <p className="text-sm text-muted-foreground">{window.name}</p>
              </div>

              {/* ✅ UN SOLO BOTÓN */}
              <Button
                type="button"
                variant="outline"
                onClick={goHomeInformes}
                className="sm:self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver (Informes)
              </Button>
            </div>

            {window.instructions ? (
              <p className="text-sm text-muted-foreground">{window.instructions}</p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="p-10 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Arrastra o selecciona el Excel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos permitidos: .xlsx, .xls
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
            )}

            {loading && (
              <div className="text-sm text-muted-foreground">Leyendo archivo…</div>
            )}
          </CardContent>
        </Card>

        {preview.length > 0 && (
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">
                Previsualización ({preview.length})
              </CardTitle>

              <Button
                type="button"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Importando…" : "Importar asistencias"}
              </Button>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Se detectaron <span className="font-semibold">{preview.length}</span> registros válidos para importar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
