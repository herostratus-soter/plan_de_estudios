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

positions = {}
node_spacing_x = 180
level_spacing_y = 150

max_level = max(by_level.keys())

for lvl in range(max_level + 1):
    nodes_in_lvl = by_level.get(lvl, [])
    
    # Sort nodes in level by horizontal barycenter of parents to minimize line lengths
    if lvl > 0:
        def parent_barycenter_x(code):
            prereqs = flat_prereqs(materias[code].get('prerrequisitos'))
            parent_xs = [positions[p][0] for p in prereqs if p in positions]
            return sum(parent_xs) / len(parent_xs) if parent_xs else 0
        
        nodes_in_lvl.sort(key=parent_barycenter_x)
    
    count = len(nodes_in_lvl)
    y = (max_level - lvl - max_level / 2.0) * level_spacing_y
    
    for i, code in enumerate(nodes_in_lvl):
        x = (i - (count - 1) / 2.0) * node_spacing_x
        positions[code] = (x, y)

print("=== LAYOUT VERTICAL CENTRADO CON BARICENTRO EN X ===")
for lvl in sorted(by_level.keys()):
    nodes_in_lvl = by_level[lvl]
    count = len(nodes_in_lvl)
    min_x = positions[nodes_in_lvl[0]][0]
    max_x = positions[nodes_in_lvl[-1]][0]
    y_lvl = positions[nodes_in_lvl[0]][1]
    print(f"Fila Nivel {lvl} (Y={y_lvl:+6.1f}px): {count:2d} nodos | X Rango: [{min_x:+6.1f}px a {max_x:+6.1f}px] (Centro: {(min_x+max_x)/2.0:+4.1f}px)")
