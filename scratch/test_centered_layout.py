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
    
    if m.get('grupo') == 'Trabajo de Grado' or 'Trabajo de Grado' in m.get('nombre', ''):
        levels[code] = 7
        return 7
    
    req = m.get('creditos_requeridos')
    if req and req.get('minimo', 0) >= 40:
        levels[code] = 5
        return 5

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
    by_level.setdefault(lvl, []).append(code)

# Barycenter sorting to minimize edge crossings & line length
positions = {}
node_spacing_y = 90
level_spacing_x = 220

num_levels = max(by_level.keys()) + 1

for lvl in range(num_levels):
    nodes_in_lvl = by_level.get(lvl, [])
    
    # Sort nodes in level by average y-position of their parent prerequisites
    if lvl > 0:
        def parent_barycenter(code):
            prereqs = flat_prereqs(materias[code].get('prerrequisitos'))
            parent_ys = [positions[p][1] for p in prereqs if p in positions]
            return sum(parent_ys) / len(parent_ys) if parent_ys else 0
        
        nodes_in_lvl.sort(key=parent_barycenter)
    
    count = len(nodes_in_lvl)
    x = (lvl - (num_levels / 2.0)) * level_spacing_x
    
    for i, code in enumerate(nodes_in_lvl):
        y = (i - (count - 1) / 2.0) * node_spacing_y
        positions[code] = (x, y)

print("=== LAYOUT CENTRADO Y BARI CENTRADO GENERADO ===")
for lvl in sorted(by_level.keys()):
    nodes_in_lvl = by_level[lvl]
    count = len(nodes_in_lvl)
    min_y = positions[nodes_in_lvl[0]][1]
    max_y = positions[nodes_in_lvl[-1]][1]
    print(f"Columna {lvl}: {count:2d} nodos | Y Rango: [{min_y:+6.1f}px a {max_y:+6.1f}px] (Centro: {(min_y+max_y)/2.0:+4.1f}px)")
