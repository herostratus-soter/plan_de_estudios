import json
import re

# Cargar pensum_data.json
with open('pensum_data.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

materias_json = json_data['materias']

# Cargar el texto extraído del PDF
with open('scratch/pdf_text.txt', 'r', encoding='utf-8') as f:
    pdf_text = f.read()

print(f"=== AUDITORÍA EXHAUSTIVA DE PENSUM DATA ===")
print(f"Total materias en JSON: {len(materias_json)}")

# Analizar asignaturas en el PDF
# En el texto del PDF de la UNAL, las asignaturas se presentan con patrón:
# Código / Nombre / Créditos / Requisitos / Agrupación
lines = pdf_text.splitlines()

# Vamos a buscar cada código SIA y su contexto en el PDF
audit_results = []
discrepancies = []

for code, m in materias_json.items():
    # Buscar ocurrencias del código SIA en el texto del PDF
    matches = [line for line in lines if code in line]
    
    # Evaluar si hay notas especiales de prerrequisito en el JSON
    prereq_json = m.get('prerrequisitos')
    creds_req_json = m.get('creditos_requeridos')
    
    audit_results.append({
        'codigo': code,
        'nombre': m['nombre'],
        'creditos': m['creditos'],
        'grupo': m['grupo'],
        'subgrupo': m['subgrupo'],
        'obligatoria': m['obligatoria'],
        'prerrequisitos': prereq_json,
        'creditos_requeridos': creds_req_json,
        'matches_pdf': len(matches)
    })

print(f"Materias procesadas: {len(audit_results)}")
