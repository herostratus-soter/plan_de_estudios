import json

with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

materias = data["materias"]

# Definir los requisitos de créditos según el Acuerdo 11 de 2023
credit_reqs = {
    # Trabajo de Grado (60 cr Disciplinar)
    "2025974": { "componente": "disciplinar", "minimo": 60 },
    "2025973": { "componente": "disciplinar", "minimo": 60 },
    "2016843": { "componente": "disciplinar", "minimo": 60 },
    # Taller Interdisciplinario y Creación de Empresas (40 cr Disciplinar)
    "2024045": { "componente": "disciplinar", "minimo": 40 },
    "2026551": { "componente": "disciplinar", "minimo": 40 },
    # Prácticas estudiantiles y Colombia (40 cr Disciplinar)
    "2016762": { "componente": "disciplinar", "minimo": 40 },
    "2016763": { "componente": "disciplinar", "minimo": 40 },
    "2016764": { "componente": "disciplinar", "minimo": 40 },
    "1000070": { "componente": "disciplinar", "minimo": 40 },
    "1000071": { "componente": "disciplinar", "minimo": 40 },
    "1000072": { "componente": "disciplinar", "minimo": 40 },
}

updated_count = 0
for code, req in credit_reqs.items():
    if code in materias:
        materias[code]["creditos_requeridos"] = req
        updated_count += 1

with open('pensum_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

bundle = "var PENSUM_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
with open('js/pensum_bundle.js', 'w', encoding='utf-8') as f:
    f.write(bundle)

print(f"Créditos requeridos actualizados para {updated_count} materias.")
