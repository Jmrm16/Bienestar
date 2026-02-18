import React from "react";
import { useForm } from "@inertiajs/react";
import { UploadCloud } from "lucide-react";

export default function ImportarNotas() {
  const { data, setData, post, processing, errors } = useForm<{
    archivo: File | null;
  }>({
    archivo: null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/notas/importar", {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <UploadCloud className="w-5 h-5" />
        Importar notas desde Excel
      </h2>

      <p className="text-sm text-muted-foreground">
        Sube el archivo Excel oficial con las notas académicas.
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setData("archivo", e.target.files?.[0] || null)}
        className="block w-full text-sm"
        required
      />

      {errors.archivo && (
        <p className="text-sm text-red-600">{errors.archivo}</p>
      )}

      <button
        type="submit"
        disabled={processing}
        className="w-fit px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
      >
        {processing ? "Importando..." : "Importar notas"}
      </button>
    </form>
  );
}
