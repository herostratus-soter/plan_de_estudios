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

# 1. Mapear sucesores (hijos) directos de cada materia
children = {}
for code in materias:
    children[code] = []

for code, m in materias.items():
    prereqs = flat_prereqs(m.get('prerrequisitos'))
    for p in prereqs:
        if p in children:
            children[p].append(code)

# 2. Calcular niveles
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

max_level = max(by_level.keys())
positions = {}

# PASO 1: Para Nivel 0, ordenar materias por el número de descendientes y centralidad de sus hijos
def level0_centrality(code):
    # Número de materias que dependen de ella directa o indirectamente
    desc = set()
    def get_desc(c):
        for ch in children.get(c, []):
            if ch not in desc:
                desc.add(ch)
                get_desc(ch)
    get_desc(code)
    return len(desc)

nodes_l0 = by_level[0]
# Las materias con más conexiones (como Cálculo Diferencial) van en el CENTRO
nodes_l0.sort(key=level0_centrality)

# Queremos que las materias más centrales estén en la mitad del array
# Reordenar array para poner la más conectada en el centro exacto:
centered_l0 = [None] * len(nodes_l0)
left_idx = len(nodes_l0) // 2 - 1
right_idx = len(nodes_l0) // 2

# Insertar desde el más conectado hacia afuera
for idx, code in enumerate(reversed(nodes_l0)):
    if idx % 2 == 0:
        centered_l0[right_idx] = code
        right_idx += 1
    else:
        centered_l0[left_idx] = code
        left_idx -= 1

by_level[0] = [c for c in centered_l0 if c is not None]

# Asignar posiciones Nivel 0
node_spacing_x = 180
level_spacing_y = 150
count_l0 = len(by_level[0])
y_l0 = (max_level - 0 - max_level / 2.0) * level_spacing_y

for i, code in enumerate(by_level[0]):
    x = (i - (count_l0 - 1) / 2.0) * node_spacing_x
    positions[code] = (x, y_l0)

# PASO 2: Barrido ascendente Nivel 1 a max_level con baricentro de padres
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

print("=== VERIFICACIÓN DE POSICIÓN DE CÁLCULO DIFERENCIAL EN NIVEL 0 ===")
l0_nodes = by_level[0]
calc_diff_idx = l0_nodes.index('1000004')
calc_diff_x = positions['1000004'][0]
center_node = l0_nodes[len(l0_nodes)//2]

print(f"Total nodos en Nivel 0: {len(l0_nodes)}")
print(f"Nodo en el centro exacto de Nivel 0 (índice {len(l0_nodes)//2}): [{center_node}] {materias[center_node]['nombre']}")
print(f"Posición de Cálculo Diferencial (1000004): Índice {calc_diff_idx} | X = {calc_diff_x:+6.1f}px")
