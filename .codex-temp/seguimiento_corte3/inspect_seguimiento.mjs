import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const baseWorkbookPath = String.raw`C:\Users\USUARIO\Downloads\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2.xlsx`;
const correctedWorkbookPath = String.raw`C:\Users\USUARIO\Downloads\FORMATO_SEGUIMIENTO_NOTAS_CORREGIDO_COMPLETADO.xlsx`;
const thirdCutNotesPath = String.raw`C:\Users\USUARIO\Downloads\Notas III CORTE 2026-I.xlsx`;

const outputDir = path.resolve("C:\\xampp\\htdocs\\Bienestar\\.codex-temp\\seguimiento_corte3\\outputs");
await fs.mkdir(outputDir, { recursive: true });

async function inspectWorkbook(filePath, prefix) {
  const blob = await FileBlob.load(filePath);
  const workbook = await SpreadsheetFile.importXlsx(blob);

  const summary = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 12000,
    tableMaxRows: 12,
    tableMaxCols: 18,
    tableMaxCellChars: 120,
  });

  await fs.writeFile(
    path.join(outputDir, `${prefix}_summary.ndjson`),
    summary.ndjson,
    "utf8",
  );

  const sheetNames = workbook.worksheets.items.map((ws) => ws.name);
  const renders = [];
  for (const sheetName of sheetNames.slice(0, 3)) {
    const png = await workbook.render({
      sheetName,
      autoCrop: "all",
      scale: 1,
      format: "png",
    });
    const target = path.join(outputDir, `${prefix}_${sheetName.replace(/[^a-z0-9]+/gi, "_")}.png`);
    await fs.writeFile(target, new Uint8Array(await png.arrayBuffer()));
    renders.push({ sheetName, image: target });
  }

  return { sheetNames, renders };
}

const result = {
  base: await inspectWorkbook(baseWorkbookPath, "base"),
  corrected: await inspectWorkbook(correctedWorkbookPath, "corrected"),
  thirdCut: await inspectWorkbook(thirdCutNotesPath, "thirdcut"),
};

await fs.writeFile(
  path.join(outputDir, "sheet_names.json"),
  JSON.stringify(result, null, 2),
  "utf8",
);

console.log(JSON.stringify(result, null, 2));
