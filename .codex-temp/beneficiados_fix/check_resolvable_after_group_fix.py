from __future__ import annotations

import json
import unicodedata

import pandas as pd


CORRECTED_PATH = r"C:\xampp\htdocs\Bienestar\storage\app\exports\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2_corregido.xlsx"
SOURCE_PATH = r"C:\Users\USUARIO\Downloads\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2.xlsx"


def n(value: object) -> str:
    text = "" if value is None else str(value).strip()
    return "" if text.lower() in {"nan", "none"} else text


def c(value: object) -> str:
    text = unicodedata.normalize("NFKD", n(value))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("�", "")
    return " ".join(text.split()).upper()


def ident(value: object) -> str:
    return n(value).replace(".0", "")


benef = pd.read_excel(CORRECTED_PATH, sheet_name="BENEFICIADOS 1,2Y3CORTE", dtype=str)
nota = pd.read_excel(SOURCE_PATH, sheet_name="NOTA", dtype=str)

benef.columns = [n(x) for x in benef.columns]
nota.columns = [n(x) for x in nota.columns]

for frame in (benef, nota):
    for col in frame.columns:
        frame[col] = frame[col].map(n)

bcols = {c(x): x for x in benef.columns}
ncols = {c(x): x for x in nota.columns}

keys = {c(row[ncols["CLAVE"]]) for _, row in nota.iterrows() if n(row[ncols["CLAVE"]])}

mask = False
for col in [bcols["NOTAS 1ER CORTE"], bcols["NOTAS 2DO CORTE"], bcols["NOTAS 3ER CORTE"], bcols["DEF"]]:
    mask = mask | (benef[col].map(c) == "NO ENCONTRADA")

count = 0
remaining = 0
samples: list[dict[str, object]] = []

for idx, row in benef[mask].iterrows():
    clave = f"{ident(row[bcols['IDENTIFICACION']])}|{n(row[bcols['MATERIA']])}|{n(row[bcols['GRUPO']])}"
    exists = c(clave) in keys
    if exists:
        count += 1
        if len(samples) < 12:
            samples.append({"row": idx + 2, "clave": clave})
    else:
        remaining += 1

print(json.dumps({
    "resolvable_by_current_clave_after_group_fix": count,
    "still_missing_after_group_fix": remaining,
    "samples": samples,
}, ensure_ascii=False, indent=2))
