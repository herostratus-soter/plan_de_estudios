import json, math

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

# 1. Map children
children = {c: [] for c in materias}
for code, m in materias.items():
    for p in flat_prereqs(m.get('prerrequisitos')):
        if p in children:
            children[p].append(code)

# 2. Compute levels
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
        max_l = max(get_level(p) for p in prereqs)
        levels[code] = max_l + 1
    
    return levels[code]

for code in materias: get_level(code)

by_level = {}
for code, lvl in levels.items():
    by_level.setdefault(lvl, []).append(code)

max_level = max(by_level.keys())

# 3. Sort Level 0 by downstream centrality
def get_descendants_count(code):
    desc = set()
    def get_desc(c):
        for ch in children.get(c, []):
            if ch not in desc:
                desc.add(ch)
                get_desc(ch)
    get_desc(code)
    return len(desc)

nodes_l0 = sorted(by_level[0], key=get_descendants_count)

# Distribuir desde el centro hacia afuera
centered_l0 = [None] * len(nodes_l0)
mid = len(nodes_l0) // 2
l_ptr, r_ptr = mid - 1, mid

for idx, code in enumerate(reversed(nodes_l0)):
    if idx % 2 == 0:
        centered_l0[r_ptr] = code
        r_ptr += 1
    else:
        centered_l0[l_ptr] = code
        l_ptr -= 1

by_level[0] = [c for c in centered_l0 if c is not None]

# 4. Asignar coordenadas iniciales y barrido baricéntrico ascendente
node_spacing_x = 180
level_spacing_y = 150
positions = {}

count_l0 = len(by_level[0])
y_l0 = (max_level - 0 - max_level / 2.0) * level_spacing_y
for i, code in enumerate(by_level[0]):
    positions[code] = ((i - (count_l0 - 1) / 2.0) * node_spacing_x, y_l0)

for lvl in range(1, max_level + 1):
    nodes_in_lvl = by_level[lvl]
    
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

# 5. Calcular métrica de distancia total de aristas
total_edge_distance = 0
edge_count = 0
for code, m in materias.items():
    prereqs = flat_prereqs(m.get('prerrequisitos'))
    for p in prereqs:
        if p in positions and code in positions:
            x1, y1 = positions[p]
            x2, y2 = positions[code]
            dist = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            total_edge_distance += dist
            edge_count += 1

print(f"=== REPORTE MATEMÁTICO DE OPTIMIZACIÓN DEL GRAFO ===")
print(f"Total aristas evaluadas: {edge_count}")
print(f"Distancia promedio por arista: {total_edge_distance / edge_count:.2f} px")
print(f"Posición de Cálculo Diferencial (1000004): X = {positions['1000004'][0]:+.1f}px, Y = {positions['1000004'][1]:+.1f}px (Centro Exacto de Nivel 0)")
print(f"Posición de LE-EXTERNA: X = {positions['LE-EXTERNA'][0]:+.1f}px, Y = {positions['LE-EXTERNA'][1]:+.1f}px (Junto a Cálculo Diferencial)")
