import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = String.raw`C:\xampp\htdocs\Bienestar\storage\app\exports\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2_corregido.xlsx`;
const outputDir = String.raw`C:\xampp\htdocs\Bienestar\storage\app\exports\beneficiados_fix_preview`;

await fs.mkdir(outputDir, { recursive: true });

const file = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(file);

const summary = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 2000,
});
console.log(summary.ndjson);

const detail = await workbook.inspect({
  kind: "table",
  range: "BENEFICIADOS 1,2Y3CORTE!A1:AA12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 27,
  maxChars: 8000,
});
console.log(detail.ndjson);

const blob = await workbook.render({
  sheetName: "BENEFICIADOS 1,2Y3CORTE",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(path.join(outputDir, "BENEFICIADOS_1_2Y3CORTE.png"), new Uint8Array(await blob.arrayBuffer()));
