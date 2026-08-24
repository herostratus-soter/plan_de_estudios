import json
import re

with open('scratch/pdf_text.txt', 'r', encoding='utf-8') as f:
    pdf_text = f.read()

with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

materias = data['materias']

print("=== VERIFICACIÓN EXHAUSTIVA DE SUBAGRUPACIONES DE LAS 105 MATERIAS ===")

# Recorrer las 105 materias y verificar que su grupo y subgrupo coincidan con las tablas del PDF
subgrupo_counts = {}
grupo_counts = {}

for code, m in materias.items():
    g = m['grupo']
    sg = m['subgrupo']
    
    grupo_counts[g] = grupo_counts.get(g, 0) + 1
    subgrupo_counts[sg] = subgrupo_counts.get(sg, 0) + 1

print("\n--- RESUMEN DE MATERIAS POR AGRUPACIÓN (JSON) ---")
for g, count in sorted(grupo_counts.items()):
    print(f"  * Agrupación: '{g}': {count} materias")

print("\n--- RESUMEN DE MATERIAS POR SUBAGRUPACIÓN (JSON) ---")
for sg, count in sorted(subgrupo_counts.items()):
    print(f"  * Subagrupación: '{sg}': {count} materias")
