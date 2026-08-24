from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


SOURCE_PATH = Path(r"C:\Users\USUARIO\Downloads\BaseDatosPermanenciaMaicao (8).xlsx")
OUTPUT_PATH = Path(r"C:\xampp\htdocs\Bienestar\storage\app\exports\maicao_talleres_impactados_2026_1.json")

TARGET_SERVICE = "ACOMPAÑAMIENTO AL APRENDIZAJE"
TARGET_SEMESTER = 1
TARGET_WORKSHOPS = [
    "TALLER NO 1. METODOLOGÍAS DE ESTUDIO PARA EL DESARROLLO DE LAS COMPETENCIAS EN MATEMÁTICAS",
    "TALLER NO 2. EXPRESIÓN ORAL MEJORANDO MI ORATORIA",
    "TALLER NO 3. DESCUBRIENDO MI POTENCIAL, MOTIVACIÓN Y COMPROMISO EN LA VIDA UNIVERSITARIA",
]
WORKSHOP_SHORT = {
    TARGET_WORKSHOPS[0]: "Taller 1",
    TARGET_WORKSHOPS[1]: "Taller 2",
    TARGET_WORKSHOPS[2]: "Taller 3",
}


def normalize_id(value: object) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def first_non_empty(series: pd.Series) -> str:
    for value in series:
        text = clean_text(value)
        if text:
            return text
    return ""


def main() -> None:
    base = pd.read_excel(SOURCE_PATH, sheet_name="Base de Datos")
    asistencias = pd.read_excel(SOURCE_PATH, sheet_name="Asistencias")

    base = base.copy()
    asistencias = asistencias.copy()

    base["Identificación"] = base["Identificación"].map(normalize_id)
    asistencias["Identificación"] = asistencias["Identificación"].map(normalize_id)

    base = base[
        base["Estamento"].map(clean_text).str.upper().eq("ESTUDIANTE")
        & base["Identificación"].ne("")
    ].copy()
    asistencias = asistencias[
        asistencias["Estamento"].map(clean_text).str.upper().eq("ESTUDIANTE")
        & asistencias["Identificación"].ne("")
    ].copy()

    base_sem1 = base[base["Semestre"] == TARGET_SEMESTER].copy()

    filtered = asistencias[
        asistencias["Servicio"].map(clean_text).eq(TARGET_SERVICE)
        & asistencias["Semestre"].eq(TARGET_SEMESTER)
        & asistencias["Actividad"].map(clean_text).isin(TARGET_WORKSHOPS)
    ].copy()

    raw_rows = len(filtered)

    filtered["Actividad"] = filtered["Actividad"].map(clean_text)
    filtered["Nombres completos"] = filtered["Nombres completos"].map(clean_text)
    filtered["Programa"] = filtered["Programa"].map(clean_text)
    filtered["Sexo"] = filtered["Sexo"].map(clean_text)
    filtered["Grupos priorizados"] = filtered["Grupos priorizados"].map(clean_text)
    filtered["Correo"] = filtered["Correo"].map(clean_text)
    filtered["Teléfono"] = filtered["Teléfono"].map(clean_text)
    filtered["taller_corto"] = filtered["Actividad"].map(WORKSHOP_SHORT)

    dedup = filtered.drop_duplicates(subset=["Identificación", "Actividad"]).copy()

    base_lookup = (
        base.sort_values(["Identificación"])
        .groupby("Identificación", as_index=False)
        .agg(
            {
                "Nombres completos": first_non_empty,
                "Sexo": first_non_empty,
                "Grupos priorizados": first_non_empty,
                "Programa": first_non_empty,
                "Semestre": "first",
                "Correo": first_non_empty,
                "Teléfono": first_non_empty,
            }
        )
        .set_index("Identificación")
    )

    workshop_summary = []
    for workshop in TARGET_WORKSHOPS:
        workshop_rows = filtered[filtered["Actividad"] == workshop]
        workshop_dedup = dedup[dedup["Actividad"] == workshop]
        workshop_summary.append(
            {
                "actividad": workshop,
                "taller_corto": WORKSHOP_SHORT[workshop],
                "registros_crudos": int(len(workshop_rows)),
                "estudiantes_unicos": int(workshop_dedup["Identificación"].nunique()),
            }
        )

    student_workshop_matrix = (
        dedup.assign(valor=1)
        .pivot_table(
            index="Identificación",
            columns="Actividad",
            values="valor",
            aggfunc="max",
            fill_value=0,
        )
        .reindex(columns=TARGET_WORKSHOPS, fill_value=0)
    )

    student_rows = []
    for student_id, row in student_workshop_matrix.iterrows():
        source_rows = dedup[dedup["Identificación"] == student_id]
        base_row = base_lookup.loc[student_id] if student_id in base_lookup.index else None

        names = first_non_empty(
            pd.Series(
                [
                    base_row["Nombres completos"] if base_row is not None else "",
                    *source_rows["Nombres completos"].tolist(),
                ]
            )
        )
        sexo = first_non_empty(
            pd.Series(
                [base_row["Sexo"] if base_row is not None else "", *source_rows["Sexo"].tolist()]
            )
        )
        grupo = first_non_empty(
            pd.Series(
                [
                    base_row["Grupos priorizados"] if base_row is not None else "",
                    *source_rows["Grupos priorizados"].tolist(),
                ]
            )
        )
        programa = first_non_empty(
            pd.Series(
                [
                    base_row["Programa"] if base_row is not None else "",
                    *source_rows["Programa"].tolist(),
                ]
            )
        )
        correo = first_non_empty(
            pd.Series(
                [base_row["Correo"] if base_row is not None else "", *source_rows["Correo"].tolist()]
            )
        )
        telefono = first_non_empty(
            pd.Series(
                [base_row["Teléfono"] if base_row is not None else "", *source_rows["Teléfono"].tolist()]
            )
        )
        semestre = (
            int(base_row["Semestre"])
            if base_row is not None and not pd.isna(base_row["Semestre"])
            else TARGET_SEMESTER
        )

        attended_workshops = [WORKSHOP_SHORT[w] for w in TARGET_WORKSHOPS if int(row[w]) == 1]
        total_workshops = len(attended_workshops)

        student_rows.append(
            {
                "identificacion": student_id,
                "nombres_completos": names,
                "sexo": sexo or "Sin dato",
                "grupos_priorizados": grupo or "Sin dato",
                "programa": programa or "Sin dato",
                "semestre": semestre,
                "correo": correo,
                "telefono": telefono,
                "taller_1": int(row[TARGET_WORKSHOPS[0]]),
                "taller_2": int(row[TARGET_WORKSHOPS[1]]),
                "taller_3": int(row[TARGET_WORKSHOPS[2]]),
                "total_talleres": total_workshops,
                "talleres_asistidos": ", ".join(attended_workshops),
            }
        )

    student_rows.sort(
        key=lambda item: (-item["total_talleres"], item["programa"], item["nombres_completos"])
    )

    repeated_rows = [row for row in student_rows if row["total_talleres"] >= 2]

    program_summary = (
        pd.DataFrame(student_rows)
        .groupby("programa", as_index=False)
        .agg(
            impactados_unicos=("identificacion", "nunique"),
            promedio_talleres=("total_talleres", "mean"),
        )
        .sort_values(["impactados_unicos", "programa"], ascending=[False, True])
    )

    dedup_export = dedup[
        [
            "Fecha y hora",
            "Identificación",
            "Nombres completos",
            "Sexo",
            "Grupos priorizados",
            "Programa",
            "Semestre",
            "Correo",
            "Teléfono",
            "Servicio",
            "Actividad",
            "taller_corto",
            "TRIMESTRE",
        ]
    ].copy()

    participation_counts = pd.Series([row["total_talleres"] for row in student_rows]).value_counts()

    summary = {
        "archivo_fuente": str(SOURCE_PATH),
        "servicio": TARGET_SERVICE,
        "semestre_objetivo": TARGET_SEMESTER,
        "base_semestre_1_unicos": int(base_sem1["Identificación"].nunique()),
        "registros_crudos": int(raw_rows),
        "registros_unicos_estudiante_taller": int(len(dedup)),
        "estudiantes_unicos_impactados": int(len(student_rows)),
        "estudiantes_con_1_taller": int(participation_counts.get(1, 0)),
        "estudiantes_con_2_talleres": int(participation_counts.get(2, 0)),
        "estudiantes_con_3_talleres": int(participation_counts.get(3, 0)),
        "cobertura_sobre_base_sem1": round(
            (len(student_rows) / max(1, int(base_sem1["Identificación"].nunique()))) * 100, 2
        ),
    }

    payload = {
        "summary": summary,
        "workshops": workshop_summary,
        "students": student_rows,
        "repeated_students": repeated_rows,
        "program_summary": program_summary.to_dict(orient="records"),
        "dedup_rows": [
            {
                **{
                    key: (
                        value.isoformat(sep=" ")
                        if hasattr(value, "isoformat")
                        else ("" if pd.isna(value) else value)
                    )
                    for key, value in record.items()
                }
            }
            for record in dedup_export.to_dict(orient="records")
        ],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
