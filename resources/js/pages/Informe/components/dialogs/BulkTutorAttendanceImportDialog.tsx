import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WindowOption = {
  id: number;
  name: string;
  tutor_type: "R1" | "R2";
  category?: "corte_1" | "corte_2" | "corte_3" | "habilitacion" | "final" | "custom" | null;
  required_items?: string[] | null;
  open_at: string;
  due_at?: string | null;
  is_published: boolean;
};

type Props = {
  periodId: number;
  windows: WindowOption[];
  onCompleted?: () => void;
};

type ImportProgressState = {
  status: "idle" | "preparing" | "processing" | "completed" | "failed";
  message: string | null;
  progressPercent: number;
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  currentIndex: number;
  currentFile: string | null;
};

const INITIAL_PROGRESS: ImportProgressState = {
  status: "idle",
  message: null,
  progressPercent: 0,
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  currentIndex: 0,
  currentFile: null,
};

const categoryCopy: Record<string, string> = {
  corte_1: "Corte 1",
  corte_2: "Corte 2",
  corte_3: "Corte 3",
  habilitacion: "Habilitación",
  final: "Final",
  custom: "Personalizada",
};

const requiredItemsCopy: Record<string, string> = {
  asistencias_normales: "Asistencias normales",
  asistencias_ocasionales: "Asistencias ocasionales",
  informe_tutor: "Informe del tutor",
  evidencias: "Evidencias",
  observaciones: "Observaciones",
};

function inferWindowCategory(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("primer informe") || normalized.includes("corte 1")) return "corte_1";
  if (normalized.includes("segundo informe") || normalized.includes("corte 2")) return "corte_2";
  if (normalized.includes("tercer informe") || normalized.includes("corte 3")) return "corte_3";
  if (normalized.includes("habilit")) return "habilitacion";
  if (normalized.includes("final")) return "final";
  return "custom";
}

function formatWindowLabel(window: WindowOption) {
  const category = window.category ?? inferWindowCategory(window.name);
  return `${categoryCopy[category] ?? "Entrega"} · ${window.name} · ${window.tutor_type}`;
}

export default function BulkTutorAttendanceImportDialog({ periodId, windows, onCompleted }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [windowId, setWindowId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgressState>(INITIAL_PROGRESS);

  const orderedWindows = useMemo(() => {
    return [...windows];
  }, [windows]);

  const selectedWindow = useMemo(() => {
    return orderedWindows.find((window) => String(window.id) === windowId) ?? null;
  }, [orderedWindows, windowId]);

  const selectedWindowLabel = selectedWindow?.name ?? "Sin seleccionar";
  const selectedWindowType = selectedWindow?.tutor_type ?? null;

  useEffect(() => {
    if (orderedWindows.length === 0) {
      setWindowId("");
      return;
    }

    const alreadySelected = orderedWindows.some((window) => String(window.id) === windowId);
    if (alreadySelected) {
      return;
    }

    const latestWindow = orderedWindows[0];

    setWindowId(latestWindow ? String(latestWindow.id) : "");
  }, [orderedWindows, windowId]);

  const resetForm = () => {
    setFiles([]);
    setImporting(false);
    setProgress(INITIAL_PROGRESS);
  };

  const handleClose = (nextOpen: boolean) => {
    if (importing && !nextOpen) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!windowId) {
      toast.error("Selecciona la entrega o corte destino");
      return;
    }

    if (files.length === 0) {
      toast.error("Selecciona al menos un archivo Excel");
      return;
    }

    setImporting(true);
    setProgress({
      status: "preparing",
      message: "Preparando importación por archivos...",
      progressPercent: 0,
      totalFiles: files.length,
      processedFiles: 0,
      skippedFiles: 0,
      currentIndex: 0,
      currentFile: null,
    });

    const csrfToken =
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";

    try {
      let processedFiles = 0;
      let skippedFiles = 0;
      let totalNormal = 0;
      let totalOccasional = 0;
      const warnings: string[] = [];
      const issues: string[] = [];

      for (const [index, file] of files.entries()) {
        setProgress({
          status: "processing",
          message: `Procesando archivo ${index + 1} de ${files.length}`,
          progressPercent: Math.round(((processedFiles + skippedFiles) / files.length) * 100),
          totalFiles: files.length,
          processedFiles,
          skippedFiles,
          currentIndex: index + 1,
          currentFile: file.name,
        });

        const formData = new FormData();
        formData.append("window_id", windowId);
        formData.append("archivos[]", file);

        const response = await fetch(route("reports.windows.bulk_import", periodId, false), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: formData,
        });

        const responseData = (await response.json().catch(() => null)) as
          | {
              success?: string;
              warning?: string | null;
              errors?: Record<string, string[] | string>;
              message?: string;
              processed_files?: number;
              skipped_files?: number;
              total_normal?: number;
              total_occasional?: number;
            }
          | null;

        if (!response.ok) {
          let firstError = `No se pudo importar ${file.name}`;
          const rawErrors = responseData?.errors;

          if (rawErrors && typeof rawErrors === "object") {
            const firstValue = Object.values(rawErrors)[0];
            if (Array.isArray(firstValue)) {
              firstError = firstValue[0] ?? firstError;
            } else if (typeof firstValue === "string") {
              firstError = firstValue;
            }
          } else if (typeof responseData?.message === "string" && responseData.message.trim() !== "") {
            firstError = responseData.message;
          }

          skippedFiles++;
          issues.push(`${file.name}: ${firstError}`);
          continue;
        }

        processedFiles += Number(responseData?.processed_files ?? 1);
        skippedFiles += Number(responseData?.skipped_files ?? 0);
        totalNormal += Number(responseData?.total_normal ?? 0);
        totalOccasional += Number(responseData?.total_occasional ?? 0);

        if (typeof responseData?.warning === "string" && responseData.warning.trim() !== "") {
          warnings.push(responseData.warning);
        }

        setProgress({
          status: "processing",
          message: `Archivo ${index + 1} de ${files.length} procesado`,
          progressPercent: Math.round(((processedFiles + skippedFiles) / files.length) * 100),
          totalFiles: files.length,
          processedFiles,
          skippedFiles,
          currentIndex: index + 1,
          currentFile: file.name,
        });
      }

      if (processedFiles === 0) {
        throw new Error(issues[0] ?? "No se pudo ejecutar la carga masiva");
      }

      const summary = `Carga masiva completada: ${processedFiles} archivo(s) procesado(s), ${totalNormal} asistencia(s) normales nuevas y ${totalOccasional} ocasional(es) nuevas.`;
      const warningMessage = issues.length > 0 ? issues.slice(0, 3).join(" | ") : warnings[0] ?? null;

      setProgress({
        status: "completed",
        message: "Importación completada.",
        progressPercent: 100,
        totalFiles: files.length,
        processedFiles,
        skippedFiles,
        currentIndex: files.length,
        currentFile: null,
      });

      toast.success(summary);
      if (warningMessage) {
        toast.warning(warningMessage);
      }

      setOpen(false);
      resetForm();
      onCompleted?.();
    } catch (error) {
      const firstError =
        error instanceof Error && error.message.trim() !== ""
          ? error.message
          : "No se pudo ejecutar la carga masiva";

      setProgress((current) => ({
        ...current,
        status: "failed",
        message: firstError,
      }));
      toast.error(firstError);
    } finally {
      setImporting(false);
    }
  };

  const hasWindowsAvailable = orderedWindows.length > 0;
  const shouldShowProgress = progress.status !== "idle";
  const completedFiles = progress.processedFiles + progress.skippedFiles;
  const totalFiles = progress.totalFiles || files.length;
  const statusTone =
    progress.status === "failed"
      ? "border-destructive/30 bg-destructive/5"
      : progress.status === "completed"
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-primary/20 bg-primary/5";

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Carga masiva Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="grid max-h-[85vh] w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader>
          <div className="border-b px-6 py-5">
            <DialogTitle>Cargar asistencias de tutores por lote</DialogTitle>
            <DialogDescription className="mt-2">
              Selecciona la entrega destino y varios archivos Excel para importar
              asistencias normales y ocasionales en una sola pasada. La resolución se toma
              automáticamente de la entrega elegida.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Entrega / corte destino</Label>
                <Select
                  value={windowId}
                  onValueChange={setWindowId}
                  disabled={!hasWindowsAvailable || importing}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        hasWindowsAvailable
                          ? "Seleccione la entrega"
                          : "No hay entregas publicadas en este período"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedWindows.map((window) => (
                      <SelectItem key={window.id} value={String(window.id)}>
                        {formatWindowLabel(window)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWindowType && (
                  <p className="text-xs text-muted-foreground">
                    Esta carga se procesará como <span className="font-medium text-foreground">{selectedWindowType}</span>{" "}
                    porque la entrega seleccionada pertenece a esa resolución.
                  </p>
                )}
                {selectedWindow?.required_items?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Esta entrega espera:{" "}
                    <span className="font-medium text-foreground">
                      {selectedWindow.required_items
                        .map((item) => requiredItemsCopy[item] ?? item)
                        .join(", ")}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="bulk-attendance-files">Archivos Excel</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    El sistema intenta asociar cada archivo usando primero el responsable dentro del
                    Excel y, si hace falta, el código, documento o nombre presente en el archivo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  disabled={importing}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {files.length > 0 ? "Cambiar archivos" : "Seleccionar archivos"}
                </Button>
                <input
                  ref={inputRef}
                  id="bulk-attendance-files"
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  disabled={importing}
                  className="hidden"
                  onChange={(event) => {
                    const nextFiles = event.target.files ? Array.from(event.target.files) : [];
                    setFiles(nextFiles);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={importing}
                className="flex w-full items-start gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-left transition hover:bg-muted/35 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {files.length > 0
                      ? `${files.length} archivo(s) listo(s) para importar`
                      : "Selecciona uno o varios archivos Excel"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Corte: {selectedWindow ? formatWindowLabel(selectedWindow) : selectedWindowLabel}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Formatos permitidos: `.xlsx` y `.xls`.
                  </p>
                </div>
              </button>
            </div>

            <div className="rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Archivos seleccionados</p>
                <span className="text-xs text-muted-foreground">
                  {files.length > 0 ? `${files.length} en cola` : "Sin archivos"}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto px-4 py-3">
                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Todavía no has agregado archivos.</p>
                )}
              </div>
            </div>

            {shouldShowProgress && (
              <div className={`space-y-4 rounded-2xl border p-4 shadow-sm ${statusTone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      {progress.status === "processing" || progress.status === "preparing" ? (
                        <Spinner size="sm" />
                      ) : progress.status === "completed" ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                      )}
                      <p className="text-sm font-semibold leading-5">
                        {progress.message ?? "Procesando importación..."}
                      </p>
                    </div>
                    <p className="break-words text-xs text-muted-foreground">
                      {progress.currentFile
                        ? `Archivo actual: ${progress.currentFile}`
                        : "Esperando respuesta del servidor..."}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {Math.max(0, Math.min(100, Math.round(progress.progressPercent)))}%
                  </span>
                </div>

                <Progress value={progress.progressPercent} className="h-2" />

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-xl bg-background/80 px-3 py-2">
                    Procesados: {completedFiles} de {totalFiles || 0}
                  </div>
                  <div className="rounded-xl bg-background/80 px-3 py-2">
                    Archivo {progress.currentIndex > 0 && totalFiles > 0 ? Math.min(progress.currentIndex, totalFiles) : 0} de {totalFiles || 0}
                  </div>
                  <div className="rounded-xl bg-background/80 px-3 py-2">
                    Pendientes: {progress.skippedFiles}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!hasWindowsAvailable || files.length === 0 || importing}>
            {importing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando…
              </span>
            ) : (
              "Importar archivos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
