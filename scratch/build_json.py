import json

# Cargar pensum_data.json actual
with open('pensum_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Agregar la estructura canónica de 4 niveles en programa.componentes
data["_meta"]["version"] = "4.0.0"

data["programa"] = {
    "nombre": "Ingeniería de Sistemas y Computación",
    "acuerdo": "Acuerdo 11 de 2023",
    "creditos_totales": 165,
    "componentes": {
        "fundamentacion": {
            "nombre": "Fundamentación",
            "creditos_exigidos": 51,
            "color_indicador": "#3b82f6",
            "agrupaciones": [
                {
                    "id": "matematicas",
                    "nombre": "Matemáticas",
                    "color": "#60a5fa",
                    "subagrupaciones": [
                        { "nombre": "Cálculo Diferencial", "color": "#eff6ff" },
                        { "nombre": "Cálculo Integral", "color": "#dbeafe" },
                        { "nombre": "Cálculo en Varias Variables", "color": "#bfdbfe" },
                        { "nombre": "Álgebra Lineal", "color": "#93c5fd" },
                        { "nombre": "Matemáticas Discretas I", "color": "#e0e7ff" },
                        { "nombre": "Matemáticas Discretas II", "color": "#c7d2fe" },
                        { "nombre": "Métodos Numéricos", "color": "#a5b4fc" }
                    ]
                },
                {
                    "id": "prob_estadistica",
                    "nombre": "Probabilidad y Estadística",
                    "color": "#a78bfa",
                    "subagrupaciones": [
                        { "nombre": "Probabilidad y Estadística", "color": "#a78bfa" }
                    ]
                },
                {
                    "id": "fisica",
                    "nombre": "Física",
                    "color": "#4ade80",
                    "subagrupaciones": [
                        { "nombre": "Física", "color": "#4ade80" }
                    ]
                },
                {
                    "id": "ciencias_computacion",
                    "nombre": "Ciencias de la Computación",
                    "color": "#818cf8",
                    "subagrupaciones": [
                        { "nombre": "Ciencias de la Computación", "color": "#818cf8" }
                    ]
                },
                {
                    "id": "econ_adm",
                    "nombre": "Ciencias Económicas y Administrativas",
                    "color": "#fbbf24",
                    "subagrupaciones": [
                        { "nombre": "Ingeniería Económica", "color": "#fefce8" },
                        { "nombre": "Gerencia y Gestión de Proyectos", "color": "#fef9c3" }
                    ]
                }
            ]
        },
        "disciplinar": {
            "nombre": "Disciplinar / Profesional",
            "creditos_exigidos": 81,
            "color_indicador": "#22c55e",
            "agrupaciones": [
                {
                    "id": "metodos_software",
                    "nombre": "Métodos y Tecnologías de Software",
                    "color": "#34d399",
                    "subagrupaciones": [
                        { "nombre": "Programación de Computadores", "color": "#f0fdf4" },
                        { "nombre": "Lenguajes", "color": "#dcfce7" },
                        { "nombre": "Métodos y Tecnologías de Software", "color": "#34d399" }
                    ]
                },
                {
                    "id": "infraestructura",
                    "nombre": "Infraestructura Computacional, de Comunicaciones y de Información",
                    "color": "#fb923c",
                    "subagrupaciones": [
                        { "nombre": "Elementos de Computadores", "color": "#fff7ed" },
                        { "nombre": "Bases de Datos", "color": "#ffedd5" },
                        { "nombre": "Información y Comunicaciones", "color": "#fed7aa" },
                        { "nombre": "Sistemas de Información", "color": "#fdba74" },
                        { "nombre": "Criptografía y Seguridad de la Información", "color": "#fca5a5" },
                        { "nombre": "Infraestructura Computacional, de Comunicaciones y de Información", "color": "#fb923c" }
                    ]
                },
                {
                    "id": "computacion_aplicada",
                    "nombre": "Computación Aplicada",
                    "color": "#22d3ee",
                    "subagrupaciones": [
                        { "nombre": "Computación Aplicada", "color": "#22d3ee" }
                    ]
                },
                {
                    "id": "sistemas_inteligentes",
                    "nombre": "Sistemas Inteligentes",
                    "color": "#2dd4bf",
                    "subagrupaciones": [
                        { "nombre": "Sistemas Inteligentes", "color": "#2dd4bf" }
                    ]
                },
                {
                    "id": "modelos_optimizacion",
                    "nombre": "Modelos, Sistemas, Optimización y Simulación",
                    "color": "#fb7185",
                    "subagrupaciones": [
                        { "nombre": "Modelos y Sistemas", "color": "#fee2e2" },
                        { "nombre": "Optimización", "color": "#fecdd3" },
                        { "nombre": "Modelos, Sistemas, Optimización y Simulación", "color": "#fb7185" }
                    ]
                },
                {
                    "id": "contexto_profesional",
                    "nombre": "Contexto Profesional e Interdisciplinario",
                    "color": "#c084fc",
                    "subagrupaciones": [
                        { "nombre": "Taller Interdisciplinario de Proyectos de Creación y Gestión", "color": "#f3e8ff" },
                        { "nombre": "Contexto Profesional e Interdisciplinario", "color": "#c084fc" }
                    ]
                },
                {
                    "id": "trabajo_grado",
                    "nombre": "Trabajo de Grado",
                    "color": "#f87171",
                    "subagrupaciones": [
                        { "nombre": "Trabajo de Grado", "color": "#f87171" }
                    ]
                }
            ]
        },
        "libre_eleccion": {
            "nombre": "Libre Elección",
            "creditos_exigidos": 33,
            "color_indicador": "#f472b6",
            "agrupaciones": [
                {
                    "id": "libre_eleccion_profundizacion",
                    "nombre": "Libre Elección — Profundización",
                    "color": "#a3e635",
                    "subagrupaciones": [
                        { "nombre": "Libre Elección — Profundización", "color": "#a3e635" }
                    ]
                }
            ]
        }
    }
}

# Asignar creditos_requeridos directamente en las materias aplicables
CREDITOS_REQUERIDOS_MAP = {
    "2015170": { "componente": "fundamentacion", "minimo": 40 },
    "2015160": { "componente": "fundamentacion", "minimo": 40 },
    "2015175": { "componente": "fundamentacion", "minimo": 40 },
    "2016704": { "componente": "fundamentacion", "minimo": 40 },
    "2015177": { "componente": "disciplinar",    "minimo": 20 },
    "2015179": { "componente": "disciplinar",    "minimo": 20 },
    "2015176": { "componente": "disciplinar",    "minimo": 20 },
    "2016705": { "componente": "disciplinar",    "minimo": 20 },
    "2016706": { "componente": "disciplinar",    "minimo": 20 },
    "2016023": { "componente": "disciplinar",    "minimo": 20 },
    "2016707": { "componente": "disciplinar",    "minimo": 20 },
    "2015180": { "componente": "disciplinar",    "minimo": 20 },
    "2016008": { "componente": "disciplinar",    "minimo": 20 },
    "2016009": { "componente": "disciplinar",    "minimo": 20 },
    "2016700": { "componente": "disciplinar",    "minimo": 20 },
    "2015164": { "componente": "disciplinar",    "minimo": 20 },
    "2015163": { "componente": "disciplinar",    "minimo": 20 },
    "2016040": { "componente": "disciplinar",    "minimo": 20 },
    "2016708": { "componente": "disciplinar",    "minimo": 20 },
    "2016709": { "componente": "disciplinar",    "minimo": 20 },
    "2016010": { "componente": "disciplinar",    "minimo": 20 },
    "2016710": { "componente": "disciplinar",    "minimo": 20 },
    "2015167": { "componente": "disciplinar",    "minimo": 20 },
    "2016711": { "componente": "disciplinar",    "minimo": 20 },
    "2016712": { "componente": "disciplinar",    "minimo": 20 },
    "2016005": { "componente": "disciplinar",    "minimo": 20 },
    "2016021": { "componente": "disciplinar",    "minimo": 20 },
    "2016027": { "componente": "disciplinar",    "minimo": 20 },
    "2015169": { "componente": "disciplinar",    "minimo": 20 },
    "2016713": { "componente": "disciplinar",    "minimo": 20 },
    "2015172": { "componente": "disciplinar",    "minimo": 20 },
    "2016006": { "componente": "disciplinar",    "minimo": 20 },
    "2015171": { "componente": "disciplinar",    "minimo": 20 },
    "2016714": { "componente": "disciplinar",    "minimo": 20 },
    "2016715": { "componente": "disciplinar",    "minimo": 20 },
    "2016004": { "componente": "disciplinar",    "minimo": 20 },
    "2016716": { "componente": "disciplinar",    "minimo": 20 },
    "2016717": { "componente": "disciplinar",    "minimo": 20 },
    "2016718": { "componente": "disciplinar",    "minimo": 20 },
    "2016719": { "componente": "disciplinar",    "minimo": 20 },
    "2016720": { "componente": "disciplinar",    "minimo": 20 },
    "2016721": { "componente": "disciplinar",    "minimo": 20 },
    "2016722": { "componente": "disciplinar",    "minimo": 20 },
    "2016723": { "componente": "disciplinar",    "minimo": 20 }
}

for code, m in data["materias"].items():
    if code in CREDITOS_REQUERIDOS_MAP:
        m["creditos_requeridos"] = CREDITOS_REQUERIDOS_MAP[code]

# Guardar pensum_data.json
with open('pensum_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Generar pensum_bundle.js
bundle_content = "var PENSUM_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
with open('js/pensum_bundle.js', 'w', encoding='utf-8') as f:
    f.write(bundle_content)

print("JSON canónico de 4 niveles y pensum_bundle.js actualizados correctamente.")
