import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface Props {
  grupoId: number;
}

export default function SubidaExcel({ grupoId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    if (!file) {
      toast.error("Selecciona un archivo Excel");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", file); // 👈 Nombre correcto del campo
    formData.append("grupo_id", grupoId.toString());

    setLoading(true);

    router.post("/estudiantes/cargar-excel", formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Estudiantes subidos correctamente");
        setFile(null);
      },
      onError: () => {
        toast.error("Error al subir el archivo. Verifica el formato.");
      },
      onFinish: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-gray-900">
      <Input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Subiendo..." : "Subir Estudiantes"}
      </Button>
    </div>
  );
}
