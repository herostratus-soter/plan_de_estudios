import json

# Cargar pensum_data.json actual
with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data["_meta"]["version"] = "4.1.0"
data["_meta"]["acuerdo"] = "Acuerdo 11 de 2023, Acta 36, 7 de diciembre — Consejo de Facultad de Ingeniería, UNAL Bogotá"

data["programa"] = {
    "nombre": "Ingeniería de Sistemas y Computación",
    "acuerdo": "Acuerdo 11 de 2023",
    "creditos_totales": 165,
    "componentes": {
        "fundamentacion": {
            "nombre": "Fundamentación",
            "creditos_exigidos": 51,
            "creditos_obligatorios": 15,
            "creditos_optativos": 36,
            "color_indicador": "#3b82f6",
            "agrupaciones": [
                {
                    "id": "matematicas",
                    "nombre": "Matemáticas",
                    "creditos_minimos": 16,
                    "color": "#60a5fa",
                    "subagrupaciones": [
                        { "nombre": "Cálculo Diferencial", "creditos_minimos": 4, "color": "#eff6ff" },
                        { "nombre": "Cálculo Integral", "creditos_minimos": 4, "color": "#dbeafe" },
                        { "nombre": "Cálculo en Varias Variables", "creditos_minimos": 4, "color": "#bfdbfe" },
                        { "nombre": "Álgebra Lineal", "creditos_minimos": 4, "color": "#93c5fd" }
                    ]
                },
                {
                    "id": "prob_estadistica",
                    "nombre": "Probabilidad y Estadística",
                    "creditos_minimos": 3,
                    "color": "#a78bfa",
                    "subagrupaciones": [
                        { "nombre": "Probabilidad y Estadística", "creditos_minimos": 3, "color": "#a78bfa" }
                    ]
                },
                {
                    "id": "fisica",
                    "nombre": "Física",
                    "creditos_minimos": 8,
                    "color": "#4ade80",
                    "subagrupaciones": [
                        { "nombre": "Física", "creditos_minimos": 8, "color": "#4ade80" }
                    ]
                },
                {
                    "id": "ciencias_computacion",
                    "nombre": "Ciencias de la Computación",
                    "creditos_minimos": 18,
                    "color": "#818cf8",
                    "subagrupaciones": [
                        { "nombre": "Matemáticas Discretas I", "creditos_minimos": 4, "color": "#e0e7ff" },
                        { "nombre": "Matemáticas Discretas II", "creditos_minimos": 4, "color": "#c7d2fe" },
                        { "nombre": "Métodos Numéricos", "creditos_minimos": 3, "color": "#a5b4fc" },
                        { "nombre": "Ciencias de la Computación", "creditos_minimos": 7, "color": "#818cf8" }
                    ]
                },
                {
                    "id": "econ_adm",
                    "nombre": "Ciencias Económicas y Administrativas",
                    "creditos_minimos": 6,
                    "color": "#fbbf24",
                    "subagrupaciones": [
                        { "nombre": "Ingeniería Económica", "creditos_minimos": 3, "color": "#fefce8" },
                        { "nombre": "Gerencia y Gestión de Proyectos", "creditos_minimos": 3, "color": "#fef9c3" }
                    ]
                }
            ]
        },
        "disciplinar": {
            "nombre": "Disciplinar / Profesional",
            "creditos_exigidos": 81,
            "creditos_obligatorios": 39,
            "creditos_optativos": 42,
            "color_indicador": "#22c55e",
            "agrupaciones": [
                {
                    "id": "metodos_software",
                    "nombre": "Métodos y Tecnologías de Software",
                    "creditos_minimos": 21,
                    "color": "#34d399",
                    "subagrupaciones": [
                        { "nombre": "Programación de Computadores", "creditos_minimos": 3, "color": "#f0fdf4" },
                        { "nombre": "Lenguajes", "creditos_minimos": 3, "color": "#dcfce7" },
                        { "nombre": "Métodos y Tecnologías de Software", "creditos_minimos": 15, "color": "#34d399" }
                    ]
                },
                {
                    "id": "infraestructura",
                    "nombre": "Infraestructura Computacional, de Comunicaciones y de Información",
                    "creditos_minimos": 30,
                    "color": "#fb923c",
                    "subagrupaciones": [
                        { "nombre": "Elementos de Computadores", "creditos_minimos": 3, "color": "#fff7ed" },
                        { "nombre": "Bases de Datos", "creditos_minimos": 3, "color": "#ffedd5" },
                        { "nombre": "Información y Comunicaciones", "creditos_minimos": 3, "color": "#fed7aa" },
                        { "nombre": "Sistemas de Información", "creditos_minimos": 3, "color": "#fdba74" },
                        { "nombre": "Criptografía y Seguridad de la Información", "creditos_minimos": 3, "color": "#fca5a5" },
                        { "nombre": "Infraestructura Computacional, de Comunicaciones y de Información", "creditos_minimos": 15, "color": "#fb923c" }
                    ]
                },
                {
                    "id": "computacion_aplicada",
                    "nombre": "Computación Aplicada",
                    "creditos_minimos": 3,
                    "color": "#22d3ee",
                    "subagrupaciones": [
                        { "nombre": "Computación Aplicada", "creditos_minimos": 3, "color": "#22d3ee" }
                    ]
                },
                {
                    "id": "sistemas_inteligentes",
                    "nombre": "Sistemas Inteligentes",
                    "creditos_minimos": 3,
                    "color": "#2dd4bf",
                    "subagrupaciones": [
                        { "nombre": "Sistemas Inteligentes", "creditos_minimos": 3, "color": "#2dd4bf" }
                    ]
                },
                {
                    "id": "modelos_optimizacion",
                    "nombre": "Modelos, Sistemas, Optimización y Simulación",
                    "creditos_minimos": 12,
                    "color": "#fb7185",
                    "subagrupaciones": [
                        { "nombre": "Modelos y Sistemas", "creditos_minimos": 3, "color": "#fee2e2" },
                        { "nombre": "Optimización", "creditos_minimos": 3, "color": "#fecdd3" },
                        { "nombre": "Modelos, Sistemas, Optimización y Simulación", "creditos_minimos": 6, "color": "#fb7185" }
                    ]
                },
                {
                    "id": "contexto_profesional",
                    "nombre": "Contexto Profesional e Interdisciplinario",
                    "creditos_minimos": 6,
                    "color": "#c084fc",
                    "subagrupaciones": [
                        { "nombre": "Taller Interdisciplinario de Proyectos de Creación y Gestión", "creditos_minimos": 3, "color": "#f3e8ff" },
                        { "nombre": "Contexto Profesional e Interdisciplinario", "creditos_minimos": 3, "color": "#c084fc" }
                    ]
                },
                {
                    "id": "trabajo_grado",
                    "nombre": "Trabajo de Grado",
                    "creditos_minimos": 6,
                    "color": "#f87171",
                    "subagrupaciones": [
                        { "nombre": "Trabajo de Grado", "creditos_minimos": 6, "color": "#f87171" }
                    ]
                }
            ]
        },
        "libre_eleccion": {
            "nombre": "Libre Elección",
            "creditos_exigidos": 33,
            "creditos_obligatorios": 0,
            "creditos_optativos": 33,
            "color_indicador": "#f472b6",
            "agrupaciones": [
                {
                    "id": "libre_eleccion",
                    "nombre": "Libre Elección",
                    "creditos_minimos": 33,
                    "color": "#f472b6",
                    "subagrupaciones": [
                        { "nombre": "Libre Elección", "creditos_minimos": 33, "color": "#f472b6" }
                    ]
                }
            ]
        }
    }
}

# Normalizar todas las materias de Libre Elección al grupo y subgrupo "Libre Elección"
for code, m in data["materias"].items():
    if "Libre Elección" in m.get("grupo", "") or "Profundización" in m.get("grupo", ""):
        m["grupo"] = "Libre Elección"
        m["subgrupo"] = "Libre Elección"

data["materias"]["LE-EXTERNA"] = {
    "nombre": "Libre Elección (Asignatura Externa)",
    "creditos": 3,
    "obligatoria": False,
    "grupo": "Libre Elección",
    "subgrupo": "Libre Elección",
    "prerrequisitos": None
}

# Guardar pensum_data.json
with open('pensum_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Generar pensum_bundle.js
bundle_content = "var PENSUM_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
with open('js/pensum_bundle.js', 'w', encoding='utf-8') as f:
    f.write(bundle_content)

print("JSON canónico con creditos_minimos por grupo/subgrupo actualizado con éxito.")
