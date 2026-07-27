import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const correctedWorkbookPath = String.raw`C:\Users\USUARIO\Downloads\FORMATO_SEGUIMIENTO_NOTAS_CORREGIDO_COMPLETADO.xlsx`;
const thirdCutNotesPath = String.raw`C:\Users\USUARIO\Downloads\Notas III CORTE 2026-I.xlsx`;
const outputDir = path.resolve("C:\\xampp\\htdocs\\Bienestar\\storage\\app\\exports");
await fs.mkdir(outputDir, { recursive: true });

const normalizeText = (value) =>
  String(value ?? "")
    .replace(/\uFFFD/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const normalizeKey = (...parts) => parts.map((part) => normalizeText(part)).join("|");

const correctedBlob = await FileBlob.load(correctedWorkbookPath);
const correctedFile = await SpreadsheetFile.importXlsx(correctedBlob);
const correctedSheet = correctedFile.worksheets.getItem("SEGUIMIENTO");
const correctedRange = correctedSheet.getUsedRange();
const correctedValues = correctedRange.values;

const thirdBlob = await FileBlob.load(thirdCutNotesPath);
const thirdFile = await SpreadsheetFile.importXlsx(thirdBlob);
const thirdSheet = thirdFile.worksheets.getItem("Data");
const thirdValues = thirdSheet.getUsedRange().values;

const correctedHeaders = correctedValues[0].map((header) => String(header ?? "").trim());
const thirdHeaders = thirdValues[0].map((header) => String(header ?? "").trim());

const idx = (headers, label) => headers.findIndex((header) => normalizeText(header) === normalizeText(label));

const correctedIndexes = {
  identificacion: idx(correctedHeaders, "Identificación"),
  codigoMateria: idx(correctedHeaders, "CODIGO DE LA MATERIA"),
  grupo: idx(correctedHeaders, "Grupo"),
  nota1: idx(correctedHeaders, "Notas 1er corte"),
  nota2: idx(correctedHeaders, "Notas 2do corte"),
  nota3: idx(correctedHeaders, "Nota 3er corte"),
  final: idx(correctedHeaders, "Final"),
};

const thirdIndexes = {
  identificacion: idx(thirdHeaders, "Identificacion"),
  codigoMateria: idx(thirdHeaders, "Ide Materia"),
  grupo: idx(thirdHeaders, "Grupo"),
  nota1: idx(thirdHeaders, "1er"),
  nota2: idx(thirdHeaders, "2er"),
  nota3: idx(thirdHeaders, "3er"),
  final: idx(thirdHeaders, "Final"),
};

const sourceMap = new Map();
for (const row of thirdValues.slice(1)) {
  const key = normalizeKey(
    row[thirdIndexes.identificacion],
    row[thirdIndexes.codigoMateria],
    row[thirdIndexes.grupo],
  );
  if (key === "||") continue;
  sourceMap.set(key, {
    nota1: row[thirdIndexes.nota1] ?? null,
    nota2: row[thirdIndexes.nota2] ?? null,
    nota3: row[thirdIndexes.nota3] ?? null,
    final: row[thirdIndexes.final] ?? null,
  });
}

let matchedRows = 0;
let filledRows = 0;
const replacementMatrix = [];

for (const row of correctedValues.slice(1)) {
  const key = normalizeKey(
    row[correctedIndexes.identificacion],
    row[correctedIndexes.codigoMateria],
    row[correctedIndexes.grupo],
  );
  const source = sourceMap.get(key);
  if (source) {
    matchedRows += 1;
  }

  const nextNota1 = source?.nota1 ?? row[correctedIndexes.nota1] ?? null;
  const nextNota2 = source?.nota2 ?? row[correctedIndexes.nota2] ?? null;
  const nextNota3 = source?.nota3 ?? row[correctedIndexes.nota3] ?? null;
  const nextFinal = source?.final ?? row[correctedIndexes.final] ?? null;

  const beforeSignature = [
    row[correctedIndexes.nota1],
    row[correctedIndexes.nota2],
    row[correctedIndexes.nota3],
    row[correctedIndexes.final],
  ].map((value) => String(value ?? ""));
  const afterSignature = [nextNota1, nextNota2, nextNota3, nextFinal].map((value) => String(value ?? ""));
  if (beforeSignature.join("|") !== afterSignature.join("|")) {
    filledRows += 1;
  }

  replacementMatrix.push([nextNota1, nextNota2, nextNota3, nextFinal]);
}

correctedSheet
  .getRangeByIndexes(1, correctedIndexes.nota1, replacementMatrix.length, 4)
  .values = replacementMatrix;

const outputPath = path.join(outputDir, "SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2Y3.xlsx");
const previewPath = path.join(outputDir, "SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2Y3_preview.png");

const preview = await correctedFile.render({
  sheetName: "SEGUIMIENTO",
  range: "A1:S35",
  scale: 2,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(correctedFile);
await output.save(outputPath);

console.log(
  JSON.stringify(
    {
      outputPath,
      previewPath,
      matchedRows,
      filledRows,
      totalRows: replacementMatrix.length,
    },
    null,
    2,
  ),
);
