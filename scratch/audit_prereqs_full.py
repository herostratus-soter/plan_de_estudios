import json
import re

with open('scratch/pdf_text.txt', 'r', encoding='utf-8') as f:
    pdf_text = f.read()

with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

materias = data['materias']

# Mapeo de nombres a códigos SIA para resolver prerrequisitos en texto
name_to_code = {}
for code, m in materias.items():
    name_to_code[m['nombre'].lower().strip()] = code

# Alias conocidos en el acuerdo
aliases = {
    "cálculo diferencial": ["1000004", "2016377"],
    "cálculo diferencial en una variable": "2016377",
    "cálculo integral": ["1000005", "2015556"],
    "cálculo integral en una variable": "2015556",
    "cálculo en varias variables": ["1000006", "2015162"],
    "álgebra lineal": ["1000003", "2015555"],
    "programación de computadores": ["2015734", "2026573"],
    "introducción a las ciencias de la computación y a la programación": "2026573",
    "matemáticas discretas i": ["2025963", "2015168"],
    "matemáticas discretas ii": ["2025964", "2015181"],
    "probabilidad y estadística": ["1000013", "2027877", "2015178"],
    "probabilidad fundamental": "2027877",
    "estadística fundamental": "1000013",
    "ingeniería económica": ["2025986", "2015703", "2016047"],
    "gerencia y gestión de proyectos": ["2015702", "2016028"],
    "bases de datos": ["2016353", "2027641"],
    "elementos de computadores": ["2016698", "2016498"],
    "sistemas de información": ["2025982", "2016053"],
    "modelos y sistemas": ["2025970", "2019082", "2017293"],
    "modelos y simulación": "2025970",
    "optimización": ["2025971", "2015173"],
    "programación orientada a objetos": "2016375",
    "estructuras de datos": "2016699",
    "algoritmos": "2016696",
    "introducción a la teoría de la computación": "2015174",
    "fundamentos de mecánica": "1000019",
    "fundamentos de electricidad y magnetismo": "1000017",
    "arquitectura de computadores": "2016697",
    "ingeniería de software i": "2016701",
    "ingeniería de software ii": "2016702",
    "redes de computadores": "2025967",
    "pensamiento sistémico": "2016703",
    "introducción a la ingeniería de sistemas y computación": "2025975"
}

# Audit Results
audit_output = []

for code, m in sorted(materias.items()):
    entry = {
        "codigo": code,
        "nombre": m["nombre"],
        "creditos": m["creditos"],
        "obligatoria": m["obligatoria"],
        "grupo": m["grupo"],
        "subgrupo": m["subgrupo"],
        "prerrequisitos_json": m["prerrequisitos"],
        "creditos_requeridos_json": m.get("creditos_requeridos")
    }
    audit_output.append(entry)

print(f"Total auditadas: {len(audit_output)}")
with open('scratch/full_audit_summary.json', 'w', encoding='utf-8') as f:
    json.dump(audit_output, f, ensure_ascii=False, indent=2)
print("Estructura completa analizada.")
