import json

data = json.load(open('pensum_data.json', encoding='utf-8'))
materias = data['materias']

def flat_prereqs(tree):
    if not tree: return []
    if isinstance(tree, str): return [tree]
    items = tree.get('and') or tree.get('or') or []
    res = []
    for i in items:
        res.extend(flat_prereqs(i))
    return res

levels = {}

def get_level(code):
    if code in levels: return levels[code]
    m = materias.get(code)
    if not m: return 0
    
    # Trabajo de Grado o asignaturas finales de posgrado
    if m.get('grupo') == 'Trabajo de Grado' or 'Trabajo de Grado' in m.get('nombre', ''):
        levels[code] = 9
        return 9
    
    # Prácticas estudiantiles / Colombia que requieren 40+ créditos
    req = m.get('creditos_requeridos')
    if req and req.get('minimo', 0) >= 40:
        levels[code] = 7
        return 7

    prereqs = [p for p in flat_prereqs(m.get('prerrequisitos')) if p in materias]
    if not prereqs:
        levels[code] = 0
    else:
        max_l = 0
        for p in prereqs:
            l = get_level(p)
            if l > max_l: max_l = l
        levels[code] = max_l + 1
    
    return levels[code]

for code in materias:
    get_level(code)

by_level = {}
for code, lvl in levels.items():
    by_level.setdefault(lvl, []).append((code, materias[code]['nombre']))

print("=== DISTRIBUCIÓN LIMPIA DE NIVELES (COLUMNAS DEL ÁRBOL) ===")
for lvl in sorted(by_level.keys()):
    print(f"\n--- NIVEL {lvl} ({len(by_level[lvl])} materias) ---")
    for c, n in by_level[lvl]:
        print(f"  [{c}] {n}")
