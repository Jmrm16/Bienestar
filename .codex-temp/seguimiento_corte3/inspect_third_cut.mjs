import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const filePath = String.raw`C:\Users\USUARIO\Downloads\Notas III CORTE 2026-I.xlsx`;
const outputDir = path.resolve("C:\\xampp\\htdocs\\Bienestar\\.codex-temp\\seguimiento_corte3\\outputs");
await fs.mkdir(outputDir, { recursive: true });

const blob = await FileBlob.load(filePath);
const workbook = await SpreadsheetFile.importXlsx(blob);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 20,
  tableMaxCols: 24,
  tableMaxCellChars: 100,
});

await fs.writeFile(path.join(outputDir, "thirdcut_summary.ndjson"), summary.ndjson, "utf8");

for (const sheet of workbook.worksheets.items.slice(0, 3)) {
  const png = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(outputDir, `thirdcut_${sheet.name.replace(/[^a-z0-9]+/gi, "_")}.png`),
    new Uint8Array(await png.arrayBuffer()),
  );
}

console.log(workbook.worksheets.items.map((s) => s.name).join("\n"));
