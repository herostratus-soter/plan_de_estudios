'use strict';
// pensum_logic.js — lógica pura. Sin DOM, sin vis.js.
// Todo lo que no es presentación vive aquí.

// ─── Mapa grupo → componente ─────────────────────────────────────────────────
const COMPONENTE_POR_GRUPO = {
  'Matemáticas':                                                       'fundamentacion',
  'Probabilidad y Estadística':                                        'fundamentacion',
  'Física':                                                            'fundamentacion',
  'Ciencias de la Computación':                                        'fundamentacion',
  'Ciencias Económicas y Administrativas':                             'fundamentacion',
  'Métodos y Tecnologías de Software':                                 'disciplinar',
  'Infraestructura Computacional, de Comunicaciones y de Información': 'disciplinar',
  'Computación Aplicada':                                              'disciplinar',
  'Sistemas Inteligentes':                                             'disciplinar',
  'Modelos, Sistemas, Optimización y Simulación':                      'disciplinar',
  'Contexto Profesional e Interdisciplinario':                         'disciplinar',
  'Trabajo de Grado':                                                  'disciplinar',
  'Libre Elección — Profundización':                                   'libre_eleccion',
};

// ─── Requisitos de créditos ──────────────────────────────────────────────────
// Extraídos del JSON — son lógica de validación, no datos declarativos.
// El JSON no los tiene; el contador vive aquí.
const CREDITOS_REQUERIDOS = {
  // Taller Interdisciplinario y afines → 40 cr disciplinar
  '2024045': { componente: 'disciplinar', minimo: 40 },
  '2016615': { componente: 'disciplinar', minimo: 40 },
  '2017275': { componente: 'disciplinar', minimo: 40 },
  '2016093': { componente: 'disciplinar', minimo: 40 },
  '2016091': { componente: 'disciplinar', minimo: 40 },
  '2026551': { componente: 'disciplinar', minimo: 40 },
  '2016007': { componente: 'disciplinar', minimo: 40 },
  '2016600': { componente: 'disciplinar', minimo: 40 },
  '2016599': { componente: 'disciplinar', minimo: 40 },
  '2016741': { componente: 'disciplinar', minimo: 40 },
  '2016037': { componente: 'disciplinar', minimo: 40 },
  // Prácticas → 40 cr disciplinar
  '2016762': { componente: 'disciplinar', minimo: 40 },
  '2016763': { componente: 'disciplinar', minimo: 40 },
  '2016764': { componente: 'disciplinar', minimo: 40 },
  '1000070': { componente: 'disciplinar', minimo: 40 },
  '1000071': { componente: 'disciplinar', minimo: 40 },
  '1000072': { componente: 'disciplinar', minimo: 40 },
  // Trabajo de Grado → 60 cr disciplinar
  '2025974': { componente: 'disciplinar', minimo: 60 },
  '2025973': { componente: 'disciplinar', minimo: 60 },
  '2016843': { componente: 'disciplinar', minimo: 60 },
};

// ─── Colores por grupo ─────────────────────────────────────────────────────────
// Colores saturados (Tailwind ~400) — lo suficientemente oscuros para que los bordes
// de selección sean claramente visibles, pero con contraste adecuado para texto oscuro.
const COLORES_GRUPO = {
  'Matemáticas':                                                       '#60a5fa', // blue-400
  'Probabilidad y Estadística':                                        '#a78bfa', // violet-400
  'Física':                                                            '#4ade80', // green-400
  'Ciencias de la Computación':                                        '#818cf8', // indigo-400
  'Ciencias Económicas y Administrativas':                             '#fbbf24', // amber-400
  'Métodos y Tecnologías de Software':                                 '#34d399', // emerald-400
  'Infraestructura Computacional, de Comunicaciones y de Información': '#fb923c', // orange-400
  'Computación Aplicada':                                              '#22d3ee', // cyan-400
  'Sistemas Inteligentes':                                             '#2dd4bf', // teal-400
  'Modelos, Sistemas, Optimización y Simulación':                      '#fb7185', // rose-400
  'Contexto Profesional e Interdisciplinario':                         '#c084fc', // purple-400
  'Trabajo de Grado':                                                  '#f87171', // red-400
  'Libre Elección — Profundización':                                   '#a3e635', // lime-400
};

// Color único para modo "limpio" (sin agrupación por color) — tono neutro claro
const COLORES_LIMPIO = '#9bb5cc'; // slate-azulado claro


// ─── Colores por subgrupo ────────────────────────────────────────────────────
// Subgrupos reales tienen variantes del color de su grupo padre.
// Subgrupos que coinciden con el grupo (cuando subgrupo == grupo) usan COLORES_GRUPO.
const COLORES_SUBGRUPO = {
  // Matemáticas
  'Cálculo Diferencial':                                               '#eff6ff',
  'Cálculo Integral':                                                  '#dbeafe',
  'Cálculo en Varias Variables':                                       '#bfdbfe',
  'Álgebra Lineal':                                                    '#93c5fd',
  // Ciencias de la Computación
  'Matemáticas Discretas I':                                           '#e0e7ff',
  'Matemáticas Discretas II':                                          '#c7d2fe',
  'Métodos Numéricos':                                                 '#a5b4fc',
  // Ciencias Económicas
  'Ingeniería Económica':                                              '#fefce8',
  'Gerencia y Gestión de Proyectos':                                   '#fef9c3',
  // Métodos y Tecnologías de Software
  'Programación de Computadores':                                      '#f0fdf4',
  'Lenguajes':                                                         '#dcfce7',
  // Infraestructura
  'Elementos de Computadores':                                         '#fff7ed',
  'Bases de Datos':                                                    '#ffedd5',
  'Información y Comunicaciones':                                      '#fed7aa',
  'Sistemas de Información':                                           '#fdba74',
  'Criptografía y Seguridad de la Información':                        '#fca5a5',
  // Modelos
  'Modelos y Sistemas':                                                '#fee2e2',
  'Optimización':                                                      '#fecaca',
  // Contexto profesional
  'Taller Interdisciplinario de Proyectos de Creación y Gestión':      '#f3e8ff',
  // Grupos que actúan como propio subgrupo — mismos tonos que COLORES_GRUPO
  'Física':                                                            '#bbf7d0',
  'Probabilidad y Estadística':                                        '#ddd6fe',
  'Ciencias de la Computación':                                        '#c7d2fe',
  'Matemáticas':                                                       '#bfdbfe',
  'Ciencias Económicas y Administrativas':                             '#fef08a',
  'Métodos y Tecnologías de Software':                                 '#a7f3d0',
  'Infraestructura Computacional, de Comunicaciones y de Información': '#fed7aa',
  'Computación Aplicada':                                              '#a5f3fc',
  'Sistemas Inteligentes':                                             '#6ee7b7',
  'Modelos, Sistemas, Optimización y Simulación':                      '#fecaca',
  'Contexto Profesional e Interdisciplinario':                         '#e9d5ff',
  'Trabajo de Grado':                                                  '#fca5a5',
  'Libre Elección — Profundización':                                   '#d9f99d',
};

// ─── Funciones puras ──────────────────────────────────────────────────────────

/**
 * Evalúa árbol booleano de prerrequisitos contra un Set de códigos aprobados.
 * @param {null|string|{and:Array}|{or:Array}} tree
 * @param {Set<string>} cursadasSet
 * @returns {boolean}
 */
function cumpleArbol(tree, cursadasSet) {
  if (tree === null || tree === undefined) return true;
  if (typeof tree === 'string') return cursadasSet.has(tree);
  if (tree.and) return tree.and.every(item => cumpleArbol(item, cursadasSet));
  if (tree.or)  return tree.or.some(item  => cumpleArbol(item, cursadasSet));
  return false;
}

/**
 * Suma créditos aprobados por componente.
 * @param {Set<string>} cursadasSet
 * @param {Object} materias
 * @returns {{fundamentacion:number, disciplinar:number, libre_eleccion:number}}
 */
function creditosAprobados(cursadasSet, materias) {
  const totales = { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0 };
  for (const codigo of cursadasSet) {
    const m = materias[codigo];
    if (!m) continue;
    const comp = COMPONENTE_POR_GRUPO[m.grupo];
    if (comp) totales[comp] += m.creditos;
  }
  return totales;
}

/**
 * ¿Puede el estudiante matricular este curso?
 * Evalúa prerrequisitos de cursos Y de créditos.
 * @param {string} codigo
 * @param {Set<string>} cursadasSet
 * @param {Object} materias
 * @returns {{ puede:boolean, faltanCursos:boolean, faltanCreditos:boolean, credRequeridos:number|null }}
 */
function puedeMatricular(codigo, cursadasSet, materias) {
  const m = materias[codigo];
  if (!m) return { puede: false, faltanCursos: false, faltanCreditos: false, credRequeridos: null };

  const cumpleCursos = cumpleArbol(m.prerrequisitos, cursadasSet);

  let cumpleCreditos = true;
  let credRequeridos = null;
  const req = CREDITOS_REQUERIDOS[codigo];
  if (req) {
    const totales = creditosAprobados(cursadasSet, materias);
    credRequeridos = req.minimo;
    cumpleCreditos = totales[req.componente] >= req.minimo;
  }

  return {
    puede:          cumpleCursos && cumpleCreditos,
    faltanCursos:   !cumpleCursos,
    faltanCreditos: !cumpleCreditos,
    credRequeridos,
  };
}

/**
 * Suma créditos seleccionados por grupo.
 * @param {Set<string>} cursadasSet
 * @param {Object} materias
 * @returns {Object} { grupoNombre: creditosSel }
 */
function creditosPorGrupo(cursadasSet, materias) {
  const result = {};
  for (const codigo of Object.keys(materias)) {
    const m = materias[codigo];
    if (!result[m.grupo]) result[m.grupo] = 0;
    if (cursadasSet.has(codigo)) result[m.grupo] += m.creditos;
  }
  return result;
}

/**
 * Suma créditos seleccionados por subgrupo.
 */
function creditosPorSubgrupo(cursadasSet, materias) {
  const result = {};
  for (const codigo of Object.keys(materias)) {
    const m = materias[codigo];
    if (!result[m.subgrupo]) result[m.subgrupo] = 0;
    if (cursadasSet.has(codigo)) result[m.subgrupo] += m.creditos;
  }
  return result;
}

/**
 * Total de créditos obligatorios por grupo (denominador del contador).
 */
function computarTotalesGrupo(materias) {
  const result = {};
  for (const codigo of Object.keys(materias)) {
    const m = materias[codigo];
    if (!result[m.grupo]) result[m.grupo] = 0;
    if (m.obligatoria) result[m.grupo] += m.creditos;
  }
  return result;
}

/**
 * Total de créditos obligatorios por subgrupo.
 */
function computarTotalesSubgrupo(materias) {
  const result = {};
  for (const codigo of Object.keys(materias)) {
    const m = materias[codigo];
    if (!result[m.subgrupo]) result[m.subgrupo] = 0;
    if (m.obligatoria) result[m.subgrupo] += m.creditos;
  }
  return result;
}
