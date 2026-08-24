import json

with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Agregar LE-EXTERNA como una materia común y corriente dentro del grupo "Libre Elección" existente
data["materias"]["LE-EXTERNA"] = {
    "nombre": "Libre Elección (Asignatura Externa)",
    "creditos": 3,
    "obligatoria": False,
    "grupo": "Libre Elección",
    "subgrupo": "Libre Elección — Profundización",
    "prerrequisitos": None
}

with open('pensum_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

bundle = "var PENSUM_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
with open('js/pensum_bundle.js', 'w', encoding='utf-8') as f:
    f.write(bundle)

print("LE-EXTERNA agregada correctamente como materia regular en Libre Elección.")
