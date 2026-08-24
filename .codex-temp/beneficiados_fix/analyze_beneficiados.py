from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
import unicodedata

import pandas as pd


WORKBOOK_PATH = Path(r"C:\Users\USUARIO\Downloads\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2.xlsx")
OUTPUT_DIR = Path(r"C:\xampp\htdocs\Bienestar\storage\app\exports")
REPORT_PATH = OUTPUT_DIR / "beneficiados_123_fix_report.json"


def norm_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none"}:
        return ""
    return text


def norm_upper(value: object) -> str:
    return norm_text(value).upper()


def canonical(value: object) -> str:
    text = norm_text(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("�", "")
    text = " ".join(text.split())
    return text.upper()


def norm_ident(value: object) -> str:
    text = norm_text(value)
    if not text:
        return ""
    return text.replace(".0", "")


def main() -> None:
    beneficiados = pd.read_excel(WORKBOOK_PATH, sheet_name="BENEFICIADOS 1,2Y3CORTE", dtype=str)
    nota = pd.read_excel(WORKBOOK_PATH, sheet_name="NOTA", dtype=str)

    beneficiados.columns = [norm_text(c) for c in beneficiados.columns]
    nota.columns = [norm_text(c) for c in nota.columns]

    for frame in (beneficiados, nota):
        for column in frame.columns:
            frame[column] = frame[column].map(norm_text)

    beneficiados_by_canonical = {canonical(column): column for column in beneficiados.columns}
    nota_by_canonical = {canonical(column): column for column in nota.columns}

    def bcol(name: str) -> str:
        return beneficiados_by_canonical[canonical(name)]

    def ncol(name: str) -> str:
        return nota_by_canonical[canonical(name)]

    by_ident_priority: dict[str, set[str]] = defaultdict(set)
    by_ident_group: dict[str, set[str]] = defaultdict(set)

    for _, row in beneficiados.iterrows():
        ident = norm_ident(row.get(bcol("Identificación"), ""))
        if not ident:
            continue
        gp = norm_text(row.get(bcol("Grupos priorizados"), ""))
        grupo = norm_text(row.get(bcol("Grupo"), ""))
        if gp:
            by_ident_priority[ident].add(gp)
        if grupo:
            by_ident_group[ident].add(grupo)

    nota_by_ident_materia: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    nota_by_ident_code: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    nota_by_ident_materia_grupo: dict[tuple[str, str, str], list[dict[str, str]]] = defaultdict(list)

    for _, row in nota.iterrows():
        ident = norm_ident(row.get(ncol("Identificacion"), ""))
        materia = norm_upper(row.get(ncol("Materia"), ""))
        ide_materia = norm_text(row.get(ncol("Ide Materia"), ""))
        grupo = norm_text(row.get(ncol("Grupo"), ""))
        payload = {
            "grupo": grupo,
            "ide_materia": ide_materia,
            "materia": materia,
        }
        if ident and materia:
            nota_by_ident_materia[(ident, materia)].append(payload)
        if ident and ide_materia:
            nota_by_ident_code[(ident, ide_materia)].append(payload)
        if ident and materia and grupo:
            nota_by_ident_materia_grupo[(ident, materia, grupo)].append(payload)

    summary = {
        "missing_counts": {},
        "fillable_counts": {
            "grupos_from_same_sheet_ident_unique": 0,
            "grupo_from_same_sheet_ident_unique": 0,
            "grupo_from_nota_ident_materia_unique": 0,
            "codigo_materia_from_nota_ident_materia_unique": 0,
        },
        "samples": [],
    }

    targets = ["Grupos priorizados", "Grupo", "CODIGO DE LA MATERIA", "Notas 1er corte", "Notas 2do corte", "Notas 3er corte", "Def"]
    for column in targets:
        summary["missing_counts"][column] = int((beneficiados[bcol(column)].map(norm_text) == "").sum())

    for idx, row in beneficiados.iterrows():
        ident = norm_ident(row.get(bcol("Identificación"), ""))
        materia = norm_upper(row.get(bcol("Materia"), ""))
        codigo_materia = norm_text(row.get(bcol("CODIGO DE LA MATERIA"), ""))
        grupo = norm_text(row.get(bcol("Grupo"), ""))
        grupos_priorizados = norm_text(row.get(bcol("Grupos priorizados"), ""))

        row_actions: list[str] = []

        if not grupos_priorizados and ident:
            same_ident_priorities = sorted(by_ident_priority.get(ident, set()))
            if len(same_ident_priorities) == 1:
                summary["fillable_counts"]["grupos_from_same_sheet_ident_unique"] += 1
                row_actions.append(f"grupos_priorizados={same_ident_priorities[0]}")

        if not grupo and ident:
            same_ident_groups = sorted(by_ident_group.get(ident, set()))
            if len(same_ident_groups) == 1:
                summary["fillable_counts"]["grupo_from_same_sheet_ident_unique"] += 1
                row_actions.append(f"grupo_same_ident={same_ident_groups[0]}")
            else:
                nota_matches = nota_by_ident_materia.get((ident, materia), [])
                grupos = sorted({match["grupo"] for match in nota_matches if match["grupo"]})
                if len(grupos) == 1:
                    summary["fillable_counts"]["grupo_from_nota_ident_materia_unique"] += 1
                    row_actions.append(f"grupo_nota={grupos[0]}")

        if not codigo_materia and ident and materia:
            nota_matches = nota_by_ident_materia.get((ident, materia), [])
            codes = sorted({match["ide_materia"] for match in nota_matches if match["ide_materia"]})
            if len(codes) == 1:
                summary["fillable_counts"]["codigo_materia_from_nota_ident_materia_unique"] += 1
                row_actions.append(f"codigo_materia={codes[0]}")

        if row_actions and len(summary["samples"]) < 20:
            summary["samples"].append(
                {
                    "row_excel": idx + 2,
                    "identificacion": ident,
                    "nombre": norm_text(row.get(bcol("Nombre"), "")),
                    "apellidos": norm_text(row.get(bcol("Apellidos"), "")),
                    "materia": norm_text(row.get(bcol("Materia"), "")),
                    "acciones": row_actions,
                }
            )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(REPORT_PATH)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
