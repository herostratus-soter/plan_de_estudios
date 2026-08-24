'use strict';
// malla_app.js — orquesta DOM, vis.js y los módulos de lógica.
// Depende de (orden de carga): pensum_bundle.js → pensum_logic.js → graph_builder.js

// ─── Datos y grafo ────────────────────────────────────────────────────────────
var materias         = {};
var modo             = 'grupo';
var allNodes         = null;
var allEdges         = null;
var network          = null;
var graphData        = null;
var MINS_PROGRAMA    = null;
var TOTALES_GRUPO    = null;
var TOTALES_SUBGRUPO = null;
var hoveredId        = null;

// ─── Paleta gris (sin color — se usa cuando el grupo NO está en el filtro) ──
// Cuatro niveles de brillo para los cuatro estados de selección.
var GRIS = {
  base:       '#1a1f26',   // sin selección: gris oscuro elegante
  hover:      '#343b47',   // hover: un toque más claro
  seleccion:  '#4c5464',   // seleccionado: gris claro neutro
  activo:     '#687284',   // activo: el más claro
};
var GRIS_FONT = {
  base:       '#b8c0cc',   // sin selección: gris bastante claro para ser muy legible (antes oscuro)
  hover:      '#000000',
  seleccion:  '#e2e8f0',
  activo:     '#ffffff',
};

// ─── Colores de componente para el dot indicador ──────────────────────────────
var COMP_DOT = {
  fundamentacion: '#3b82f6',
  disciplinar:    '#22c55e',
  libre_eleccion: '#f472b6',
};
var COMP_DOT_DIM = {};

function initCompColors() {
  for (var c in COMP_DOT) COMP_DOT_DIM[c] = dimHex(COMP_DOT[c]);
}

// ─── Estados visuales (solo bordes — el fondo lo decide otro sistema) ────────
var ESTADO_VISUAL = {
  sin_seleccion: { borderWidth: 0,   borderColor: 'transparent' },
  completo:      { borderWidth: 3,   borderColor: '#22c55e'     },
  incompleto:    { borderWidth: 3,   borderColor: '#ef4444'     },
  activo:        { borderWidth: 5,   borderColor: '#ffffff'     },
};

// ─── Filtro de leyenda (independiente por modo) ───────────────────────────────
var LeyendaFiltro = {
  grupo:    new Set(),
  subgrupo: new Set(),

  _set: function(m) { return m === 'grupo' ? this.grupo : this.subgrupo; },

  toggle:   function(key, m) {
    var s = this._set(m);
    if (s.has(key)) s.delete(key); else s.add(key);
  },
  deselect: function(key, m) { this._set(m).delete(key); },
  isActive: function(key, m) { return this._set(m).has(key); },
  hasAny:   function(m)      { return this._set(m).size > 0; },
};

// ─── Selección de materias ────────────────────────────────────────────────────
var Seleccion = {
  set: new Set(), activo: null,

  agregar:       function(c) { this.set.add(c); this.activo = c; },
  quitar:        function(c) { this.set.delete(c); if (this.activo===c) this.activo=null; },
  limpiarActivo: function()  { this.activo = null; },
  reiniciar:     function()  { this.set.clear(); this.activo = null; },
  esCompleto:    function(c) { return puedeMatricular(c, this.set, materias).puede; },
  exportar:      function()  { return { seleccionados: Array.from(this.set), activo: this.activo }; },
  importar:      function(d) { this.set = new Set(d.seleccionados||[]); this.activo = d.activo||null; },
};

// Estado de selección: solo determina «nivel de brillo» y «tipo de borde»
function getEstado(codigo) {
  if (Seleccion.activo === codigo) return 'activo';
  if (Seleccion.set.has(codigo))  return Seleccion.esCompleto(codigo) ? 'completo' : 'incompleto';
  return 'sin_seleccion';
}

// ─── Créditos mínimos del programa ───────────────────────────────────────────
function computarMinsPrograma() {
  var t = { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0 };
  for (var c of Object.keys(materias)) {
    var m = materias[c]; if (!m.obligatoria) continue;
    var comp = COMPONENTE_POR_GRUPO[m.grupo]; if (comp) t[comp] += m.creditos;
  }
  if (t.libre_eleccion === 0) t.libre_eleccion = 16;
  return t;
}

// ─── Arranque ─────────────────────────────────────────────────────────────────
if (typeof PENSUM_DATA !== 'undefined') {
  materias = PENSUM_DATA.materias;
  init();
} else {
  document.getElementById('network').innerHTML =
    '<p style="padding:2rem;color:#ef4444">Error: PENSUM_DATA no encontrado.</p>';
}

function init() {
  MINS_PROGRAMA    = computarMinsPrograma();
  TOTALES_GRUPO    = computarTotalesGrupo(materias);
  TOTALES_SUBGRUPO = computarTotalesSubgrupo(materias);
  initCompColors();
  renderStats();
  rebuildGraph();
  renderLegend();
  setupEvents();
  updateCreditCounter();
}

// ─── Grafo ────────────────────────────────────────────────────────────────────
function rebuildGraph() {
  graphData = buildGraph(materias, modo);
  allNodes  = new vis.DataSet(graphData.nodes);
  allEdges  = new vis.DataSet(graphData.edges);

  var container = document.getElementById('network');
  var options = {
    layout: {
      hierarchical: {
        direction: 'DU', sortMethod: 'directed',
        levelSeparation: 130, nodeSpacing: 190, treeSpacing: 80,
        blockShifting: false, edgeMinimization: false, parentCentralization: true,
      }
    },
    physics: false,
    interaction: {
      hover:                true,
      hoverConnectedEdges:  false,
      selectConnectedEdges: false,
      tooltipDelay:         200,
      dragNodes:            true,
      multiselect:          false,
    },
    nodes: { shadow: false },
    edges: {
      shadow:         false,
      hoverWidth:     0,
      selectionWidth: 0,
      chosen:         false,
    },
  };

  if (network) network.destroy();
  network = new vis.Network(container, { nodes: allNodes, edges: allEdges }, options);

  network.on('click',     onLeftClick);
  network.on('oncontext', onRightClick);
  network.on('hoverNode', function(p) {
    if (hoveredId !== p.node) {
      hoveredId = p.node;
      applySelectionVisuals();
    }
  });
  network.on('blurNode',  function()  {
    if (hoveredId !== null) {
      hoveredId = null;
      applySelectionVisuals();
    }
  });
  network.on('afterDrawing', drawComponentDots);

  applySelectionVisuals();
}

// ─── Dots de componente en canvas ────────────────────────────────────────────
// Independientes del filtro de leyenda: siempre color real a máximo brillo.
// Posición: centro abajo, justo fuera de la caja.
function drawComponentDots(ctx) {
  if (!graphData) return;
  var DOT_R = 6.5; // puntico un poco más grande (diámetro 13px)

  for (var i = 0; i < graphData.nodes.length; i++) {
    var n    = graphData.nodes[i];
    var m    = materias[n._codigo];
    var comp = COMPONENTE_POR_GRUPO[m.grupo];
    if (!comp) continue;

    try {
      var bb = network.getBoundingBox(n.id);
      var x  = (bb.left + bb.right) / 2;
      // Obligatoria (recta): bb.bottom coincide con el borde visual (+3px afuera).
      // Optativa (redondeada): vis.js extiende el bounding box (-17px para alinear al borde visual).
      var y  = m.obligatoria ? (bb.bottom + 3) : (bb.bottom - 17);

      ctx.beginPath();
      ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle   = COMP_DOT[comp];
      ctx.fill();
      ctx.lineWidth   = 1.4;
      ctx.strokeStyle = '#12161c';
      ctx.stroke();
    } catch(e) {}
  }
}

// ─── Recoloreado en caliente (sin reset de zoom) ─────────────────────────────
function recolorNodes() {
  for (var i = 0; i < graphData.nodes.length; i++) {
    var n = graphData.nodes[i];
    var m = materias[n._codigo];
    var c = modo === 'grupo'
      ? (COLORES_GRUPO[m.grupo] || '#e5e7eb')
      : (COLORES_SUBGRUPO[m.subgrupo] || COLORES_GRUPO[m.grupo] || '#e5e7eb');
    n._colorBase   = c;
    n._colorDim    = dimHex(c);
    n._colorHover  = lightenHex(c, 60);
    n._colorActive = lightenHex(c, 70);
  }
}

// ─── Aristas ancestras para el hover de nodos ─────────────────────────────────
/**
 * Encuentra de forma recursiva todas las aristas (caminos) que llevan hasta targetId.
 * @param {string|null} targetId
 * @param {Array} edges
 * @returns {Set<string>} Set con los IDs de las aristas activas (origen -> targetId)
 */
function getAncestorEdgeIds(targetId, edges) {
  if (!targetId || !edges) return new Set();

  var incomingMap = {};
  for (var i = 0; i < edges.length; i++) {
    var e = edges[i];
    if (!incomingMap[e.to]) incomingMap[e.to] = [];
    incomingMap[e.to].push(e);
  }

  var activeEdgeIds = new Set();
  var visitedNodes  = new Set();

  function collectAncestors(nodeId) {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);

    var inc = incomingMap[nodeId];
    if (!inc) return;

    for (var j = 0; j < inc.length; j++) {
      var edge = inc[j];
      activeEdgeIds.add(edge.id);
      collectAncestors(edge.from);
    }
  }

  collectAncestors(targetId);
  return activeEdgeIds;
}

/**
 * Encuentra únicamente las aristas y nodos salientes DIRECTOS (1 nivel adelante: lo que targetId desbloquea).
 * No es recursivo.
 * @param {string|null} targetId
 * @param {Array} edges
 * @returns {{ edgeIds: Set<string>, nodeIds: Set<string> }}
 */
function getDirectDependentEdgesAndNodes(targetId, edges) {
  var edgeIds = new Set();
  var nodeIds = new Set();
  if (!targetId || !edges) return { edgeIds: edgeIds, nodeIds: nodeIds };

  for (var i = 0; i < edges.length; i++) {
    var e = edges[i];
    if (e.from === targetId) {
      edgeIds.add(e.id);
      nodeIds.add(e.to);
    }
  }

  return { edgeIds: edgeIds, nodeIds: nodeIds };
}

/**
 * Comprueba si una opción OR discontinua no fue elegida pero OTRA opción del mismo grupo OR ya fue elegida en Seleccion.set.
 * @param {Object} edge
 * @param {Array} edges
 * @param {Set<string>} selectionSet
 * @returns {boolean}
 */
function isOrGroupSatisfiedByOther(edge, edges, selectionSet) {
  if (!edge.dashes) return false;
  var targetId = edge.to;

  for (var i = 0; i < edges.length; i++) {
    var other = edges[i];
    if (other.to === targetId && other.dashes && other.from !== edge.from) {
      if (selectionSet.has(other.from)) {
        return true;
      }
    }
  }
  return false;
}

// ─── Aplicar visuales ────────────────────────────────────────────────────────
// DOS sistemas independientes combinados:
//
//   Sistema 1 — Selección de materias → controla BRILLO (oscuro/normal/claro)
//     sin_seleccion → nivel oscuro
//     hover         → un poco más claro  (manejado explícitamente en applySelectionVisuals)
//     seleccionado  → nivel normal
//     activo        → nivel claro
//
//   Sistema 2 — Filtro de leyenda → controla si hay COLOR o todo GRIS
//     grupo OFF → se usa la paleta GRIS
//     grupo ON  → se usa el color real del grupo
//
//   Las aristas/flechas están OCULTAS por defecto y solo se muestran:
//     - Al hacer hover sobre un nodo (azul/blanco).
//     - Al seleccionar nodos (árbol RECURSIVO completo en verde/rojo/azul tenue).
//
function applySelectionVisuals() {
  // ─── 1. Visibilidad de aristas ───
  if (allEdges && graphData && graphData.edges) {
    // Hover: ancestros del nodo bajo el cursor (camino hacia atrás)
    var ancestorEdges = (hoveredId && graphData)
      ? getAncestorEdgeIds(hoveredId, graphData.edges)
      : new Set();

    // Hover: materias que el nodo bajo el cursor desbloquea (1 nivel adelante)
    var dependentInfo = (hoveredId && graphData)
      ? getDirectDependentEdgesAndNodes(hoveredId, graphData.edges)
      : { edgeIds: new Set(), nodeIds: new Set() };

    // Selección: mapa RECURSIVO completo de todas las aristas de prerrequisitos de los nodos en Seleccion.set
    var selectedAncestorEdges = new Set();
    if (graphData && Seleccion.set.size > 0) {
      Seleccion.set.forEach(function(selectedId) {
        var ancSet = getAncestorEdgeIds(selectedId, graphData.edges);
        ancSet.forEach(function(eid) { selectedAncestorEdges.add(eid); });
      });
    }

    var edgeUpdates = [];
    for (var k = 0; k < graphData.edges.length; k++) {
      var edge             = graphData.edges[k];
      var isAncestor       = ancestorEdges.has(edge.id);                  // Hover: camino hacia el nodo
      var isDependent      = dependentInfo.edgeIds.has(edge.id);          // Hover: materias que desbloquea (1 nivel)
      var isSelectedPrereq = selectedAncestorEdges.has(edge.id);          // Selección: arista en el árbol RECURSIVO de la selección
      var isContinuous     = !edge.dashes;                                // Continua (absoluta) vs discontinua (OR)

      var edgeColor, edgeWidth;

      if (isAncestor) {
        // Hover: camino hacia atrás al nodo bajo el cursor (intenso)
        edgeWidth = isContinuous ? 2.2 : 1.5;
        edgeColor = isContinuous ? { color: '#38bdf8', opacity: 0.95 } : { color: '#cbd5e1', opacity: 0.85 };
      } else if (isDependent) {
        // Hover: materias que desbloquea 1 nivel adelante (tenue)
        edgeWidth = isContinuous ? 1.8 : 1.4;
        edgeColor = isContinuous ? { color: '#38bdf8', opacity: 0.45 } : { color: '#cbd5e1', opacity: 0.35 };
      } else if (isSelectedPrereq) {
        // Selección: arista en el árbol RECURSIVO de prerrequisitos de la selección
        var prereqMet = Seleccion.set.has(edge.from);
        var isOtherOrSatisfied = !prereqMet && edge.dashes && isOrGroupSatisfiedByOther(edge, graphData.edges, Seleccion.set);

        edgeWidth = isContinuous ? 2.2 : 1.5;

        if (prereqMet) {
          // VERDE: prerrequisito elegido y cumplido
          edgeColor = { color: '#4ade80', opacity: 0.90 };
        } else if (isOtherOrSatisfied) {
          // AZUL SUPER TENUE: opción alternativa OR no elegida, pero el grupo ya fue satisfecho por otra materia
          edgeColor = { color: '#38bdf8', opacity: 0.12 };
        } else {
          // ROJO: prerrequisito obligatorio o grupo OR sin cumplir
          edgeColor = { color: '#f87171', opacity: 0.85 };
        }
      } else {
        // Invisible por defecto
        edgeWidth = 1;
        edgeColor = { color: 'rgba(0,0,0,0)', opacity: 0 };
      }

      edgeUpdates.push({
        id:    edge.id,
        width: edgeWidth,
        color: edgeColor,
      });
    }
    allEdges.update(edgeUpdates);
  }

  // ─── 2. Visuales de nodos ───
  var updates = [];

  for (var i = 0; i < graphData.nodes.length; i++) {
    var n          = graphData.nodes[i];
    var estado     = getEstado(n.id);
    var ev         = ESTADO_VISUAL[estado];
    var isHover    = (n.id === hoveredId);
    var isUnlocked = dependentInfo.nodeIds.has(n.id); // materia desbloqueada directamente por el hover

    // ¿Su grupo está activo en el filtro?
    var nodeKey = modo === 'grupo' ? n._grupo : n._subgrupo;
    var groupOn = LeyendaFiltro.isActive(nodeKey, modo);

    var bgColor, fontColor;

    if (isUnlocked && estado === 'sin_seleccion') {
      // Materia desbloqueada por el nodo bajo hover (tono tenue ilustrativo)
      bgColor   = groupOn ? lightenHex(n._colorDim, 35) : GRIS.hover;
      fontColor = groupOn ? '#1e293b' : '#c9cdd3';
    } else if (groupOn) {
      // ── CON COLOR (grupo activo en leyenda) ──
      switch (estado) {
        case 'sin_seleccion':
          bgColor   = isHover ? n._colorHover : n._colorDim;
          fontColor = isHover ? '#000000'     : '#c2c8d4';
          break;
        case 'completo':
        case 'incompleto':
          bgColor   = isHover ? n._colorHover : n._colorBase;
          fontColor = isHover ? '#000000'     : '#1e293b';
          break;
        case 'activo':
          bgColor   = n._colorActive;
          fontColor = '#0f172a';
          break;
      }
    } else {
      // ── SIN COLOR (grupo NO activo o ningún grupo seleccionado) ──
      switch (estado) {
        case 'sin_seleccion':
          bgColor   = isHover ? GRIS.hover : GRIS.base;
          fontColor = isHover ? '#000000'  : GRIS_FONT.base;
          break;
        case 'completo':
        case 'incompleto':
          bgColor   = isHover ? lightenHex(GRIS.seleccion, 30) : GRIS.seleccion;
          fontColor = isHover ? '#000000'                       : GRIS_FONT.seleccion;
          break;
        case 'activo':
          bgColor   = GRIS.activo;
          fontColor = isHover ? '#000000' : GRIS_FONT.activo;
          break;
      }
    }


    updates.push({
      id:          n.id,
      borderWidth: ev.borderWidth,
      font:        { color: fontColor },
      color: {
        background: bgColor,
        border:     ev.borderColor,
        highlight:  { background: bgColor, border: ev.borderColor },
        hover:      { background: bgColor, border: ev.borderColor },
      },
    });
  }

  allNodes.update(updates);
  updateCreditCounter();
}


// ─── Contador de créditos por componente ─────────────────────────────────────
function updateCreditCounter() {
  if (!MINS_PROGRAMA) return;
  var totales = Seleccion.set.size > 0
    ? creditosAprobados(Seleccion.set, materias)
    : { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0 };

  function fila(chkId, valId, cur, min) {
    var chk = document.getElementById(chkId);
    var val = document.getElementById(valId);
    if (!chk || !val) return;
    var done = cur >= min;
    chk.textContent = done ? '✓' : '□';
    chk.className   = 'cr-check' + (done ? ' done' : '');
    val.textContent = cur + ' / ' + min + ' cr';
    val.style.color = done ? '#4ade80' : 'var(--accent)';
  }

  fila('chk-fund',  'cr-fund',  totales.fundamentacion,  MINS_PROGRAMA.fundamentacion);
  fila('chk-disc',  'cr-disc',  totales.disciplinar,      MINS_PROGRAMA.disciplinar);
  fila('chk-libre', 'cr-libre', totales.libre_eleccion,   MINS_PROGRAMA.libre_eleccion);

  var total   = totales.fundamentacion + totales.disciplinar + totales.libre_eleccion;
  var totalEl = document.getElementById('cr-total');
  if (totalEl) { totalEl.textContent = total + ' cr'; totalEl.style.color = 'var(--accent)'; }
}

// ─── Eventos de click en el grafo ────────────────────────────────────────────
function onLeftClick(params) {
  network.setSelection({ nodes: [], edges: [] });
  if (!params.nodes.length) {
    Seleccion.limpiarActivo();
    applySelectionVisuals();
    updateInfoPanel(null);
    return;
  }
  var clicked = params.nodes[0];
  Seleccion.agregar(clicked);
  applySelectionVisuals();
  updateInfoPanel(clicked);
}

function onRightClick(params) {
  params.event.preventDefault();
  var nodeId = network.getNodeAt(params.pointer.DOM);
  if (nodeId === undefined) return;
  Seleccion.quitar(nodeId);
  applySelectionVisuals();
  updateInfoPanel(Seleccion.activo);
}

// ─── Botones y modo ──────────────────────────────────────────────────────────
function setupEvents() {
  document.getElementById('btn-grupo')
    .addEventListener('click', function() { applyModo('grupo'); });
  document.getElementById('btn-subgrupo')
    .addEventListener('click', function() { applyModo('subgrupo'); });
  document.getElementById('reset-btn')
    .addEventListener('click', function() {
      Seleccion.reiniciar();
      applySelectionVisuals();
      updateInfoPanel(null);
    });
}

// Seleccionar/deseleccionar todos los grupos de la leyenda actual
function toggleAllGrupos() {
  var s       = LeyendaFiltro._set(modo);
  var colors  = modo === 'grupo' ? COLORES_GRUPO : COLORES_SUBGRUPO;
  var allKeys = [];
  var seen    = {};
  var codigos = Object.keys(materias);
  for (var i = 0; i < codigos.length; i++) {
    var m   = materias[codigos[i]];
    var key = modo === 'grupo' ? m.grupo : m.subgrupo;
    if (!seen[key]) { seen[key] = true; allKeys.push(key); }
  }
  // Si ya están todos seleccionados → deseleccionar todos. Si no → seleccionar todos.
  var allSelected = allKeys.every(function(k) { return s.has(k); });
  if (allSelected) {
    s.clear();
  } else {
    for (var j = 0; j < allKeys.length; j++) s.add(allKeys[j]);
  }
  renderLegend();
  applySelectionVisuals();
}

function updateModoButtons() {
  document.getElementById('btn-grupo').classList.toggle('active', modo === 'grupo');
  document.getElementById('btn-subgrupo').classList.toggle('active', modo === 'subgrupo');
}

function applyModo(newModo) {
  modo = newModo;
  updateModoButtons();
  recolorNodes();
  applySelectionVisuals();
  renderLegend();
}

// ─── Sidebar: estadísticas ───────────────────────────────────────────────────
function renderStats() {
  var codigos = Object.keys(materias), obligCount = 0, grupoSet = {};
  for (var i = 0; i < codigos.length; i++) {
    var m = materias[codigos[i]];
    if (m.obligatoria) obligCount++;
    grupoSet[m.grupo] = true;
  }
  document.getElementById('stat-total').textContent  = codigos.length;
  document.getElementById('stat-oblig').textContent  = obligCount;
  document.getElementById('stat-grupos').textContent = Object.keys(grupoSet).length;
}

// ─── Sidebar: leyenda interactiva con contadores ─────────────────────────────
function renderLegend() {
  var legendList   = document.getElementById('legend-list');
  var legendTitle  = document.getElementById('legend-title');
  var colors       = modo === 'grupo' ? COLORES_GRUPO  : COLORES_SUBGRUPO;
  var totales      = modo === 'grupo' ? TOTALES_GRUPO  : TOTALES_SUBGRUPO;
  var crSel        = modo === 'grupo'
    ? creditosPorGrupo(Seleccion.set, materias)
    : creditosPorSubgrupo(Seleccion.set, materias);
  var filtroActivo = LeyendaFiltro.hasAny(modo);

  legendTitle.textContent = modo === 'grupo'
    ? 'Grupos (Acuerdo 11 de 2023)' : 'Subgrupos';
  legendList.classList.toggle('has-filter', filtroActivo);
  legendList.innerHTML = '';

  // Botón seleccionar/deseleccionar todos
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'legend-toggle-all';
  toggleBtn.textContent = filtroActivo ? 'Deseleccionar todos' : 'Seleccionar todos';
  toggleBtn.addEventListener('click', toggleAllGrupos);
  legendList.appendChild(toggleBtn);

  var seen = {}, codigos = Object.keys(materias);
  for (var i = 0; i < codigos.length; i++) {
    var m   = materias[codigos[i]];
    var key = modo === 'grupo' ? m.grupo : m.subgrupo;
    if (seen[key]) continue;
    seen[key] = true;

    var color    = colors[key] || '#e5e7eb';
    var selected = crSel[key]    || 0;
    var total    = totales[key]  || 0;
    var enFiltro = LeyendaFiltro.isActive(key, modo);
    var crColor;
    if (enFiltro && total > 0 && selected >= total) crColor = '#4ade80';
    else if (enFiltro && selected < total)           crColor = '#f87171';
    else                                              crColor = 'var(--accent)';

    var div = document.createElement('div');
    div.className = 'legend-item' + (enFiltro ? ' filtered' : '');
    div.innerHTML =
      '<span class="legend-dot" style="background:' + color + '"></span>' +
      '<span class="legend-name">' + key + '</span>' +
      '<span class="legend-cr" style="color:' + crColor + '">' +
        selected + '&thinsp;/&thinsp;' + total + '</span>';

    (function(k) {
      div.addEventListener('click', function() {
        LeyendaFiltro.toggle(k, modo);
        renderLegend();
        applySelectionVisuals();
      });
      div.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        LeyendaFiltro.deselect(k, modo);
        renderLegend();
        applySelectionVisuals();
      });
    })(key);

    legendList.appendChild(div);
  }
}

// ─── Sidebar: árbol booleano de prerrequisitos ───────────────────────────────
function renderPrereqTree(tree) {
  if (tree === null || tree === undefined)
    return '<em class="dim">Sin prerrequisitos de cursos.</em>';
  if (typeof tree === 'string') {
    var m = materias[tree];
    return '<span class="prereq-course">' + (m ? m.nombre : tree) + '</span>';
  }
  if (tree.and)
    return '<div class="bool-block bool-and"><span class="bool-op and-op">Y — todos</span><ul>' +
      tree.and.map(function(i) { return '<li>' + renderPrereqTree(i) + '</li>'; }).join('') +
      '</ul></div>';
  if (tree.or)
    return '<div class="bool-block bool-or"><span class="bool-op or-op">O — alguno</span><ul>' +
      tree.or.map(function(i) { return '<li>' + renderPrereqTree(i) + '</li>'; }).join('') +
      '</ul></div>';
  return '';
}

// ─── Sidebar: ficha de materia ───────────────────────────────────────────────
function updateInfoPanel(selectedId) {
  var content  = document.getElementById('info-content');
  var selCount = Seleccion.set.size;

  if (!selectedId) {
    content.innerHTML = selCount > 0
      ? '<span class="dim">' + selCount + ' materia' + (selCount>1?'s':'') +
        ' seleccionada' + (selCount>1?'s':'') + '.<br>Haz clic en una para ver su ficha.</span>'
      : '<span class="dim">Click izquierdo para seleccionar.<br>Click derecho para deseleccionar.</span>';
    return;
  }

  var m = materias[selectedId];
  if (!m) { content.innerHTML = '<span class="dim">No encontrado.</span>'; return; }

  var res        = puedeMatricular(selectedId, Seleccion.set, materias);
  var sinPrereqs = !m.prerrequisitos && !CREDITOS_REQUERIDOS[selectedId];
  var estadoHtml = sinPrereqs
    ? '<span style="color:#22c55e;font-weight:700">&#10003; Sin prerrequisitos</span>'
    : res.puede
      ? '<span style="color:#22c55e;font-weight:700">&#10003; Completo</span>'
      : '<span style="color:#ef4444;font-weight:700">&#10007; Incompleto</span>';

  var reqInfo = CREDITOS_REQUERIDOS[selectedId];
  var crHtml  = '';
  if (reqInfo) {
    var tot = creditosAprobados(Seleccion.set, materias);
    var cur = tot[reqInfo.componente] || 0;
    var pct = Math.min(100, Math.round(cur / reqInfo.minimo * 100));
    var bc  = cur >= reqInfo.minimo ? '#22c55e' : '#ef4444';
    crHtml  =
      '<div class="cr-req-block">' +
        '<div class="cr-req-label"><span>Créditos ' + reqInfo.componente + '</span>' +
        '<b style="color:' + bc + '">' + cur + ' / ' + reqInfo.minimo + '</b></div>' +
        '<div class="cr-req-bar"><div class="cr-req-fill" style="width:' + pct + '%;background:' + bc + '"></div></div>' +
      '</div>';
  }

  var node = null;
  for (var i = 0; i < graphData.nodes.length; i++) {
    if (graphData.nodes[i].id === selectedId) { node = graphData.nodes[i]; break; }
  }

  var html = '<div class="course-name">' + m.nombre + '</div>';
  html += '<div class="course-meta">';
  html += '<span class="badge ' + (m.obligatoria ? 'badge-oblig' : 'badge-opt') + '">';
  html += (m.obligatoria ? 'Obligatoria' : 'Optativa') + '</span>';
  html += '<span class="badge badge-cr">' + m.creditos + ' cr</span></div>';
  html += '<div class="info-row">' + estadoHtml + '</div>';
  html += crHtml;
  html += '<div class="info-row"><b>Código SIA:</b> ' + selectedId + '</div>';
  html += '<div class="info-row"><b>Grupo:</b> ' + m.grupo + '</div>';
  if (m.subgrupo !== m.grupo)
    html += '<div class="info-row"><b>Subgrupo:</b> ' + m.subgrupo + '</div>';
  if (node) html += '<div class="info-row"><b>Nivel:</b> ' + node.level + '</div>';
  html += '<div class="info-section">Prerrequisitos inmediatos</div>';
  html += renderPrereqTree(m.prerrequisitos);
  if (m.notas) html += '<div class="info-note">' + m.notas + '</div>';
  if (selCount > 1)
    html += '<div class="info-row" style="margin-top:8px;color:var(--text-dim);font-size:11px">' +
            selCount + ' materias en la selección</div>';

  content.innerHTML = html;
}
