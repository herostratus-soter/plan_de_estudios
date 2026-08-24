import json
import re

with open('scratch/pdf_text.txt', 'r', encoding='utf-8') as f:
    pdf_text = f.read()

with open('pensum_data.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

materias_json = json_data['materias']

print("=== EXAMEN EXHAUSTIVO DE CADA MATERIA (PDF ACUERDO 11 DE 2023 vs JSON) ===")

# Buscar la mención de cada materia en el PDF y verificar prerrequisitos
audit_log = []
issues = []

for code, m in materias_json.items():
    # Buscar patrón de la asignatura en el PDF
    # En el PDF del Acuerdo 11 de 2023, las asignaturas están listadas en las tablas
    pattern = re.compile(rf'{code}\s+([^\n\t]+)', re.IGNORECASE)
    matches = pattern.findall(pdf_text)
    
    # Buscar mención explícita de Requisitos en el texto
    req_pattern = re.compile(rf'{code}.*?(?:Prerrequisito|Requisito|Creditos|Créditos).*?\n', re.IGNORECASE | re.DOTALL)
    
    log_entry = {
        'code': code,
        'nombre_json': m['nombre'],
        'creditos_json': m['creditos'],
        'obligatoria': m['obligatoria'],
        'grupo': m['grupo'],
        'subgrupo': m['subgrupo'],
        'prerrequisitos': m['prerrequisitos'],
        'creditos_requeridos': m.get('creditos_requeridos'),
        'pdf_mentions': len(matches)
    }
    audit_log.append(log_entry)

print(f"Total asignaturas auditadas: {len(audit_log)}")

# Escribir reporte detallado a scratch/audit_report.json
with open('scratch/audit_report.json', 'w', encoding='utf-8') as f:
    json.dump(audit_log, f, ensure_ascii=False, indent=2)

print("Reporte escrito en scratch/audit_report.json")
