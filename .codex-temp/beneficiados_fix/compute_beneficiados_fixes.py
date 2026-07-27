from __future__ import annotations

import json
import unicodedata
from collections import defaultdict
from pathlib import Path

import pandas as pd


WORKBOOK_PATH = Path(r"C:\Users\USUARIO\Downloads\SEGUIMIENTO_CORTE_A_CORTE_2026-1_CONSOLIDADO_1Y2.xlsx")
SOURCE_PATH = Path(r"C:\Users\USUARIO\Downloads\FORMATO_SEGUIMIENTO_NOTAS_CORREGIDO_COMPLETADO.xlsx")
OUTPUT_DIR = Path(r"C:\xampp\htdocs\Bienestar\storage\app\exports")
PATCH_PATH = OUTPUT_DIR / "beneficiados_123_fixes.json"
SUMMARY_PATH = OUTPUT_DIR / "beneficiados_123_fixes_summary.json"


def norm_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none"}:
        return ""
    return text


def canonical(value: object) -> str:
    text = norm_text(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("�", "")
    text = " ".join(text.split())
    return text.upper()


def canonical_subject(value: object) -> str:
    text = canonical(value)
    replacements = {
        "INGLES I": "ENGLISH I",
        "INGLES II": "ENGLISH II",
        "INGLES III": "ENGLISH III",
        "INGLES 1": "ENGLISH I",
        "INGLES 2": "ENGLISH II",
        "INGLÉS I": "ENGLISH I",
        "INGLÉS II": "ENGLISH II",
        "INGLÉS III": "ENGLISH III",
        "INGLÉS 1": "ENGLISH I",
        "INGLÉS 2": "ENGLISH II",
    }
    for before, after in replacements.items():
        text = text.replace(before, after)
    return text


def norm_ident(value: object) -> str:
    return norm_text(value).replace(".0", "")


def norm_number(value: object) -> str:
    text = norm_text(value).replace(",", ".")
    if not text:
        return ""
    try:
        return (f"{float(text):.4f}").rstrip("0").rstrip(".")
    except ValueError:
        return canonical(text)


def pick_unique(values: list[str]) -> str:
    unique = sorted({norm_text(v) for v in values if norm_text(v)})
    if len(unique) == 1:
        return unique[0]
    return ""


def make_column_map(frame: pd.DataFrame) -> dict[str, str]:
    return {canonical(column): column for column in frame.columns}


def status_for_def(value: str) -> str:
    number = norm_number(value)
    if not number:
        return "SIN NOTA"
    try:
        return "APROBADO" if float(number) >= 3 else "REPROBADO"
    except ValueError:
        return "SIN NOTA"


def main() -> None:
    beneficiados = pd.read_excel(WORKBOOK_PATH, sheet_name="BENEFICIADOS 1,2Y3CORTE", dtype=str)
    nota = pd.read_excel(WORKBOOK_PATH, sheet_name="NOTA", dtype=str)
    source = pd.read_excel(SOURCE_PATH, sheet_name="SEGUIMIENTO", dtype=str)

    for frame in (beneficiados, nota, source):
        frame.columns = [norm_text(c) for c in frame.columns]
        for column in frame.columns:
            frame[column] = frame[column].map(norm_text)

    bmap = make_column_map(beneficiados)
    nmap = make_column_map(nota)
    smap = make_column_map(source)

    def bcol(name: str) -> str:
        return bmap[canonical(name)]

    def ncol(name: str) -> str:
        return nmap[canonical(name)]

    def scol(name: str) -> str:
        return smap[canonical(name)]

    same_sheet_gp: dict[str, set[str]] = defaultdict(set)
    same_sheet_group: dict[str, set[str]] = defaultdict(set)
    for _, row in beneficiados.iterrows():
        ident = norm_ident(row[bcol("Identificación")])
        if not ident:
            continue
        gp = norm_text(row[bcol("Grupos priorizados")])
        group = norm_text(row[bcol("Grupo")])
        if gp:
            same_sheet_gp[ident].add(gp)
        if group:
            same_sheet_group[ident].add(group)

    note_by_ident_subject: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    note_by_clave: dict[str, list[dict[str, str]]] = defaultdict(list)
    note_group_by_ident: dict[str, set[str]] = defaultdict(set)
    for _, row in nota.iterrows():
        ident = norm_ident(row[ncol("Identificacion")])
        subject = canonical_subject(row[ncol("Materia")])
        payload = {
            "grupo": norm_text(row[ncol("Grupo")]),
            "ide_materia": norm_text(row[ncol("Ide Materia")]),
            "clave": norm_text(row[ncol("CLAVE")]),
            "nota_1": norm_text(row[ncol("1er")]),
            "nota_2": norm_text(row[ncol("2do")]),
            "nota_3": norm_text(row[ncol("3er")]),
            "def": norm_text(row[ncol("Def")]),
        }
        if ident and subject:
            note_by_ident_subject[(ident, subject)].append(payload)
        if payload["clave"]:
            note_by_clave[payload["clave"]].append(payload)
        if ident and payload["grupo"]:
            note_group_by_ident[ident].add(payload["grupo"])

    source_by_ident_subject: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    source_by_name_subject: dict[tuple[str, str, str], list[dict[str, str]]] = defaultdict(list)
    source_gp_by_ident: dict[str, set[str]] = defaultdict(set)
    source_group_by_ident: dict[str, set[str]] = defaultdict(set)
    for _, row in source.iterrows():
        ident = norm_ident(row[scol("Identificación")])
        subject = canonical_subject(row[scol("Materia")])
        payload = {
            "grupo": norm_text(row[scol("Grupo")]),
            "grupos_priorizados": norm_text(row[scol("Grupos priorizados")]),
            "codigo_materia": norm_text(row[scol("CODIGO DE LA MATERIA")]),
            "nota_1": norm_text(row[scol("Notas 1er corte")]),
            "nota_2": norm_text(row[scol("Notas 2do corte")]),
            "nota_3": norm_text(row[scol("Nota 3er corte")]),
            "def": norm_text(row[scol("Final")]),
        }
        if ident and subject:
            source_by_ident_subject[(ident, subject)].append(payload)
        name_key = (
            canonical(row[scol("Nombre")]),
            canonical(row[scol("Apellidos")]),
            subject,
        )
        source_by_name_subject[name_key].append(payload)
        if ident and payload["grupos_priorizados"]:
            source_gp_by_ident[ident].add(payload["grupos_priorizados"])
        if ident and payload["grupo"]:
            source_group_by_ident[ident].add(payload["grupo"])

    def source_matches(row: pd.Series) -> list[dict[str, str]]:
        ident = norm_ident(row[bcol("Identificación")])
        subject = canonical_subject(row[bcol("Materia")])
        matches = source_by_ident_subject.get((ident, subject), [])
        if matches:
            return matches
        name_key = (
            canonical(row[bcol("Nombre")]),
            canonical(row[bcol("Apellidos")]),
            subject,
        )
        return source_by_name_subject.get(name_key, [])

    patches: list[dict[str, object]] = []
    stats = defaultdict(int)

    for idx, row in beneficiados.iterrows():
        excel_row = idx + 2
        ident = norm_ident(row[bcol("Identificación")])
        subject = canonical_subject(row[bcol("Materia")])
        clave = norm_text(row[bcol("CLAVE")])
        matches = source_matches(row)

        gp_current = norm_text(row[bcol("Grupos priorizados")])
        group_current = norm_text(row[bcol("Grupo")])
        code_current = norm_text(row[bcol("CODIGO DE LA MATERIA")])

        if not gp_current:
            gp_fill = pick_unique([item["grupos_priorizados"] for item in matches])
            source_name = ""
            if gp_fill:
                source_name = "source_exact"
            else:
                gp_fill = pick_unique(list(same_sheet_gp.get(ident, set())))
                if gp_fill:
                    source_name = "same_sheet_ident"
                else:
                    gp_fill = pick_unique(list(source_gp_by_ident.get(ident, set())))
                    if gp_fill:
                        source_name = "source_ident"
            if not gp_fill:
                gp_fill = "NINGUNO"
                source_name = "default_ninguno"
            patches.append({"row": excel_row, "field": "Grupos priorizados", "value": gp_fill, "source": source_name})
            stats[f"gp_{source_name}"] += 1

        if not group_current:
            group_fill = pick_unique([item["grupo"] for item in matches])
            source_name = ""
            if group_fill:
                source_name = "source_exact"
            else:
                group_fill = pick_unique(list(same_sheet_group.get(ident, set())))
                if group_fill:
                    source_name = "same_sheet_ident"
                else:
                    group_fill = pick_unique([item["grupo"] for item in note_by_clave.get(clave, [])])
                    if group_fill:
                        source_name = "nota_clave"
                    else:
                        group_fill = pick_unique([item["grupo"] for item in note_by_ident_subject.get((ident, subject), [])])
                        if group_fill:
                            source_name = "nota_subject"
                        else:
                            group_fill = pick_unique(list(note_group_by_ident.get(ident, set())))
                            if group_fill:
                                source_name = "nota_ident"
                            else:
                                group_fill = pick_unique(list(source_group_by_ident.get(ident, set())))
                                if group_fill:
                                    source_name = "source_ident"
            if group_fill:
                patches.append({"row": excel_row, "field": "Grupo", "value": group_fill, "source": source_name})
                stats[f"group_{source_name}"] += 1

        if not code_current:
            code_fill = pick_unique([item["codigo_materia"] for item in matches])
            source_name = ""
            if code_fill:
                source_name = "source_exact"
            else:
                code_fill = pick_unique([item["ide_materia"] for item in note_by_clave.get(clave, [])])
                if code_fill:
                    source_name = "nota_clave"
                else:
                    code_fill = pick_unique([item["ide_materia"] for item in note_by_ident_subject.get((ident, subject), [])])
                    if code_fill:
                        source_name = "nota_subject"
            if code_fill:
                patches.append({"row": excel_row, "field": "CODIGO DE LA MATERIA", "value": code_fill, "source": source_name})
                stats[f"code_{source_name}"] += 1

        note_fields = [
            ("Notas 1er corte", "nota_1"),
            ("Notas 2do corte", "nota_2"),
            ("Notas 3er corte", "nota_3"),
            ("Def", "def"),
        ]
        needs_note_fix = any(canonical(row[bcol(column)]) == "NO ENCONTRADA" or not norm_text(row[bcol(column)]) for column, _ in note_fields)
        if needs_note_fix:
            note_payload = {
                "nota_1": pick_unique([item["nota_1"] for item in note_by_ident_subject.get((ident, subject), [])]),
                "nota_2": pick_unique([item["nota_2"] for item in note_by_ident_subject.get((ident, subject), [])]),
                "nota_3": pick_unique([item["nota_3"] for item in note_by_ident_subject.get((ident, subject), [])]),
                "def": pick_unique([item["def"] for item in note_by_ident_subject.get((ident, subject), [])]),
            }
            source_name = ""
            if any(note_payload.values()):
                source_name = "nota_subject"
            else:
                note_payload = {
                    "nota_1": pick_unique([item["nota_1"] for item in matches]),
                    "nota_2": pick_unique([item["nota_2"] for item in matches]),
                    "nota_3": pick_unique([item["nota_3"] for item in matches]),
                    "def": pick_unique([item["def"] for item in matches]),
                }
                if any(note_payload.values()):
                    source_name = "source_exact"

            if source_name:
                for column, key in note_fields:
                    if note_payload[key]:
                        patches.append({"row": excel_row, "field": column, "value": note_payload[key], "source": source_name})
                        stats[f"{key}_{source_name}"] += 1
                if note_payload["def"]:
                    patches.append({"row": excel_row, "field": "Estado def", "value": status_for_def(note_payload["def"]), "source": source_name})
                    stats[f"estado_def_{source_name}"] += 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PATCH_PATH.write_text(json.dumps(patches, ensure_ascii=False, indent=2), encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps({"stats": stats, "patch_count": len(patches)}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(PATCH_PATH)
    print(SUMMARY_PATH)
    print(json.dumps({"stats": stats, "patch_count": len(patches)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
