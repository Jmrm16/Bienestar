import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = String.raw`C:\xampp\htdocs\Bienestar\storage\app\exports\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2Y3.xlsx`;
const outputPath = path.resolve("C:\\xampp\\htdocs\\Bienestar\\.codex-temp\\seguimiento_corte3\\outputs\\final_preview.png");
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const blob = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(blob);
const preview = await workbook.render({
  sheetName: "SEGUIMIENTO",
  range: "A1:S35",
  scale: 2,
  format: "png",
});
await fs.writeFile(outputPath, new Uint8Array(await preview.arrayBuffer()));
console.log(outputPath);
