'use strict';
// malla_app.js — orquesta DOM, vis.js y los módulos de lógica.
// Depende de (orden de carga): pensum_bundle.js → pensum_logic.js → graph_builder.js

// ─── Datos y grafo ────────────────────────────────────────────────────────────
var materias             = {};
var modo                 = 'grupo';
var allNodes             = null;
var allEdges             = null;
var network              = null;
var graphData            = null;
var MINS_PROGRAMA        = null;
var TOTALES_GRUPO        = null;
var TOTALES_SUBGRUPO     = null;
var COMPONENTE_POR_GRUPO = {};
var COLORES_GRUPO        = {};
var COLORES_SUBGRUPO     = {};
var hoveredId            = null;

// ─── Modo de vista (Pensum Universal vs Árbol Local Enfoque) ──────────────────
var vistaModo       = 'universal'; // 'universal' | 'local'
var materiaEnfocada = null;

// ─── Paleta gris (sin color — se usa cuando el grupo NO está en el filtro) ──
var GRIS = {
  base:       '#282f38',   // sin selección: gris equilibrado, no tan oscuro
  hover:      '#3b4352',   // hover: un toque más claro
  seleccion:  '#525b6d',   // seleccionado: gris claro neutro
  activo:     '#6f7a8f',   // activo: el más claro
};

var GRIS_FONT = {
  base:       '#b8c0cc',   // sin selección: gris bastante claro para ser muy legible
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
  set: new Set(), activo: null, extCredits: 0,

  agregar:       function(c) { this.set.add(c); this.activo = c; },
  quitar:        function(c) { this.set.delete(c); if (this.activo===c) this.activo=null; },
  limpiarActivo: function()  { this.activo = null; },
  reiniciar:     function()  { this.set.clear(); this.activo = null; this.extCredits = 0; updateLEExternaLabel(); },
  esCompleto:    function(c) { return puedeMatricular(c, this.set, materias, COMPONENTE_POR_GRUPO).puede; },
  exportar:      function()  { return { seleccionados: Array.from(this.set), activo: this.activo, extCredits: this.extCredits }; },
  importar:      function(d) { this.set = new Set(d.seleccionados||[]); this.activo = d.activo||null; this.extCredits = d.extCredits||0; updateLEExternaLabel(); },
};

// Estado de selección: solo determina «nivel de brillo» y «tipo de borde»
function getEstado(codigo) {
  if (Seleccion.activo === codigo) return 'activo';
  if (Seleccion.set.has(codigo))  return Seleccion.esCompleto(codigo) ? 'completo' : 'incompleto';
  return 'sin_seleccion';
}

// ─── Créditos mínimos del programa ───────────────────────────────────────────
function computarMinsPrograma() {
  if (typeof PENSUM_DATA !== 'undefined' && PENSUM_DATA.programa && PENSUM_DATA.programa.componentes) {
    var comp = PENSUM_DATA.programa.componentes;
    return {
      fundamentacion: comp.fundamentacion ? comp.fundamentacion.creditos_exigidos : 51,
      disciplinar:    comp.disciplinar ? comp.disciplinar.creditos_exigidos : 81,
      libre_eleccion: comp.libre_eleccion ? comp.libre_eleccion.creditos_exigidos : 33,
    };
  }
  return { fundamentacion: 51, disciplinar: 81, libre_eleccion: 33 };
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
  COMPONENTE_POR_GRUPO = buildComponenteMap(PENSUM_DATA);
  var maps             = buildColorMaps(PENSUM_DATA);
  COLORES_GRUPO        = maps.grupo;
  COLORES_SUBGRUPO     = maps.subgrupo;

  // Activar todos los grupos y subgrupos por defecto
  LeyendaFiltro.grupo    = new Set(Object.keys(COLORES_GRUPO));
  LeyendaFiltro.subgrupo = new Set(Object.keys(COLORES_SUBGRUPO));

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

// ─── Cambio de Modo de Vista (Pensum Universal <-> Árbol Local) ───────────────
function mostrarArbolLocal(codigo) {
  if (!codigo || !materias[codigo]) return;
  vistaModo       = 'local';
  materiaEnfocada = codigo;

  var banner  = document.getElementById('view-mode-banner');
  var titleEl = document.getElementById('banner-course-title');
  if (banner) banner.classList.remove('hidden');
  if (titleEl) titleEl.textContent = materias[codigo].nombre;

  var ancestorNodes = getAncestorNodeIds(codigo, materias);
  var subMaterias   = {};
  ancestorNodes.forEach(function(code) {
    if (materias[code]) subMaterias[code] = materias[code];
  });

  var localGraph = buildGraph(subMaterias, modo);

  allNodes.clear();
  allNodes.add(localGraph.nodes);

  allEdges.clear();
  allEdges.add(localGraph.edges);

  applySelectionVisuals();
  if (network) {
    network.fit({ animation: true });
  }

  updateInfoPanel(codigo);
}

function mostrarPensumUniversal() {
  vistaModo       = 'universal';
  materiaEnfocada = null;

  var banner = document.getElementById('view-mode-banner');
  if (banner) banner.classList.add('hidden');

  var universalGraph = buildGraph(materias, modo);

  allNodes.clear();
  allNodes.add(universalGraph.nodes);

  allEdges.clear();
  allEdges.add(universalGraph.edges);

  applySelectionVisuals();
  if (network) {
    network.fit({ animation: true });
  }
  updateInfoPanel(Seleccion.activo);
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
        enabled: false
      }
    },
    physics: false,
    interaction: {
      hover:                true,
      hoverConnectedEdges:  false,
      selectConnectedEdges: false,
      tooltipDelay:         200,
      dragNodes:            false,
      dragView:             true,
      zoomView:             true,
      multiselect:          false,
    },
    nodes: {
      shadow: false,
      chosen: false,
      fixed:  true,
    },
    edges: {
      shadow:         false,
      hoverWidth:     0,
      selectionWidth: 0,
      chosen:         false,
    },
  };

  network = new vis.Network(container, { nodes: allNodes, edges: allEdges }, options);

  network.on('click',     onLeftClick);
  network.on('oncontext', onRightClick);

  network.on('hoverNode', function(params) {
    hoveredId = params.node;
    applySelectionVisuals();
  });
  network.on('blurNode', function() {
    hoveredId = null;
    applySelectionVisuals();
  });

  network.on('afterDrawing', drawComponentDots);
  applySelectionVisuals();
}

// ─── Puntos de Componente ───────────────────────────────────────────────────
function drawComponentDots(ctx) {
  var DOT_R = 6.5;
  var all = allNodes.get();

  for (var i = 0; i < all.length; i++) {
    var n    = all[i];
    var m    = materias[n.id];
    if (!m) continue;
    var comp = COMPONENTE_POR_GRUPO[m.grupo];
    if (!comp) continue;

    try {
      var bb = network.getBoundingBox(n.id);
      var x  = (bb.left + bb.right) / 2;
      var y  = m.obligatoria ? (bb.bottom + 3) : (bb.bottom - 17);

      ctx.beginPath();
      ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle   = COMP_DOT[comp];
      ctx.fill();
      ctx.lineWidth   = 1.4;
      ctx.strokeStyle = '#0d1117';
      ctx.stroke();
    } catch(e) {}
  }
}

// Recoloración liviana cuando cambia el modo grupo / subgrupo
function recolorNodes() {
  if (vistaModo === 'local') return;
  var updates = [];
  for (var i = 0; i < graphData.nodes.length; i++) {
    var n   = graphData.nodes[i];
    var key = modo === 'grupo' ? n._grupo : n._subgrupo;
    var col = modo === 'grupo'
      ? (COLORES_GRUPO[key]    || COLORES_LIMPIO)
      : (COLORES_SUBGRUPO[key] || COLORES_LIMPIO);

    n._colorBase   = col;
    n._colorDim    = dimHex(col);
    n._colorHover  = lightenHex(col, 20);
    n._colorActive = lightenHex(col, 40);

    updates.push({ id: n.id, color: { background: n._colorBase } });
  }
  allNodes.update(updates);
}

// ─── Colección recursiva de aristas prerrequisito ─────────────────────────────
function getAncestorEdgeIds(targetId, edges) {
  var ancestorEdges = new Set();
  var visitedNodes  = new Set();

  function visit(nodeId) {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);

    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      if (edge.to === nodeId) {
        ancestorEdges.add(edge.id);
        visit(edge.from);
      }
    }
  }

  visit(targetId);
  return ancestorEdges;
}

function getDirectDependentEdgesAndNodes(targetId, edges) {
  var dependentEdges = new Set();
  var dependentNodes = new Set();
  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    if (edge.from === targetId) {
      dependentEdges.add(edge.id);
      dependentNodes.add(edge.to);
    }
  }
  return { edgeIds: dependentEdges, nodeIds: dependentNodes };
}

function isOrGroupSatisfiedByOther(edge, edges, selectionSet) {
  var targetNode = edge.to;
  for (var i = 0; i < edges.length; i++) {
    var other = edges[i];
    if (other.to === targetNode && other.dashes && other.from !== edge.from) {
      if (selectionSet.has(other.from)) {
        return true;
      }
    }
  }
  return false;
}

// ─── Actualización Visual Centralizada ─────────────────────────────────────────
function applySelectionVisuals() {
  if (!allEdges || !allNodes) return;

  var hoverAncestorEdges = new Set();
  var dependentInfo      = { edgeIds: new Set(), nodeIds: new Set() };
  var allCurrentEdges    = allEdges.get();

  if (hoveredId) {
    hoverAncestorEdges = getAncestorEdgeIds(hoveredId, allCurrentEdges);
    dependentInfo      = getDirectDependentEdgesAndNodes(hoveredId, allCurrentEdges);
  }

  var selectedAncestorEdges = new Set();
  if (Seleccion.set.size > 0) {
    Seleccion.set.forEach(function(selectedId) {
      var ancSet = getAncestorEdgeIds(selectedId, allCurrentEdges);
      ancSet.forEach(function(eid) { selectedAncestorEdges.add(eid); });
    });
  }

  var edgeUpdates = [];

  for (var k = 0; k < allCurrentEdges.length; k++) {
    var edge             = allCurrentEdges[k];
    var isHoverAncestor  = hoverAncestorEdges.has(edge.id);
    var isHoverDependent = dependentInfo.edgeIds.has(edge.id);
    var isSelectedPrereq = selectedAncestorEdges.has(edge.id);
    var isContinuous     = !edge.dashes;

    var edgeColor, edgeWidth;

    if (hoveredId && (isHoverAncestor || isHoverDependent)) {
      if (isHoverAncestor) {
        edgeWidth = isContinuous ? 2.2 : 1.5;
        edgeColor = isContinuous
          ? { color: '#38bdf8', opacity: 0.95 }
          : { color: '#cbd5e1', opacity: 0.85 };
      } else {
        edgeWidth = isContinuous ? 2.0 : 1.5;
        edgeColor = isContinuous
          ? { color: '#38bdf8', opacity: 0.45 }
          : { color: '#cbd5e1', opacity: 0.35 };
      }
    } else if (isSelectedPrereq) {
      var prereqMet = Seleccion.set.has(edge.from);
      var isOtherOrSatisfied = !prereqMet && edge.dashes && isOrGroupSatisfiedByOther(edge, allCurrentEdges, Seleccion.set);

      edgeWidth = isContinuous ? 2.2 : 1.5;

      if (prereqMet) {
        edgeColor = { color: '#4ade80', opacity: 0.90 };
      } else if (isOtherOrSatisfied) {
        edgeColor = { color: '#38bdf8', opacity: 0.12 };
      } else {
        edgeColor = { color: '#f87171', opacity: 0.85 };
      }
    } else {
      edgeWidth = isContinuous ? 2.2 : 1.5;
      edgeColor = { color: 'rgba(0,0,0,0)', opacity: 0 };
    }

    edgeUpdates.push({
      id:    edge.id,
      width: edgeWidth,
      color: edgeColor,
    });
  }
  allEdges.update(edgeUpdates);

  // Visuales de nodos
  var currentNodes = allNodes.get();
  var updates = [];

  for (var i = 0; i < currentNodes.length; i++) {
    var n          = currentNodes[i];
    var estado     = getEstado(n.id);
    var ev         = ESTADO_VISUAL[estado];
    var isHover    = (n.id === hoveredId);

    var nodeKey = modo === 'grupo' ? n._grupo : n._subgrupo;
    var groupOn = LeyendaFiltro.isActive(nodeKey, modo);

    var bgColor, fontColor;

    if (groupOn) {
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
  renderLegend();
}

// ─── Contador de créditos por componente ─────────────────────────────────────
function updateCreditCounter() {
  if (!MINS_PROGRAMA) return;

  var totales = creditosAprobados(Seleccion.set, materias, COMPONENTE_POR_GRUPO);
  var metaTotal = (typeof PENSUM_DATA !== 'undefined' && PENSUM_DATA.programa && PENSUM_DATA.programa.creditos_totales)
    ? PENSUM_DATA.programa.creditos_totales
    : 165;

  function fila(chkId, valId, cur, min, typeClass) {
    var chk = document.getElementById(chkId);
    var val = document.getElementById(valId);
    if (!chk || !val) return;

    var done = cur >= min;
    val.textContent = cur + ' / ' + min + ' cr';

    chk.className = 'comp-dot ' + typeClass + (done ? ' done' : '');

    if (done) {
      val.style.color = '#4ade80';
    } else {
      val.style.color = '#38bdf8';
    }
  }

  fila('chk-fund',  'cr-fund',  totales.fundamentacion,  MINS_PROGRAMA.fundamentacion, 'fund');
  fila('chk-disc',  'cr-disc',  totales.disciplinar,      MINS_PROGRAMA.disciplinar,     'disc');
  fila('chk-libre', 'cr-libre', totales.libre_eleccion,   MINS_PROGRAMA.libre_eleccion,  'libre');

  var total   = totales.fundamentacion + totales.disciplinar + totales.libre_eleccion;
  var totalEl = document.getElementById('cr-total');
  if (totalEl) {
    totalEl.textContent = total + ' / ' + metaTotal + ' cr';
    if (total >= metaTotal) {
      totalEl.style.color = '#4ade80';
    } else {
      totalEl.style.color = '#38bdf8';
    }
  }
}

function updateLEExternaLabel() {
  if (!allNodes) return;
  var cr = Seleccion.extCredits || 0;
  var labelText = 'Libre Elección\n(Asignatura Externa)';
  if (cr > 0) labelText += '\n[' + cr + ' cr]';
  try {
    allNodes.update({ id: 'LE-EXTERNA', label: labelText });
  } catch(e) {}
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

  if (clicked === 'LE-EXTERNA') {
    if (!Seleccion.set.has('LE-EXTERNA')) {
      Seleccion.extCredits = 3;
      Seleccion.agregar('LE-EXTERNA');
    } else {
      Seleccion.extCredits = Math.min(33, (Seleccion.extCredits || 3) + 3);
      Seleccion.activo = 'LE-EXTERNA';
    }
    updateLEExternaLabel();
    applySelectionVisuals();
    updateInfoPanel('LE-EXTERNA');
    return;
  }

  Seleccion.agregar(clicked);
  applySelectionVisuals();
  updateInfoPanel(clicked);
}

function onRightClick(params) {
  params.event.preventDefault();
  var nodeId = network.getNodeAt(params.pointer.DOM);
  if (nodeId === undefined) return;

  if (nodeId === 'LE-EXTERNA') {
    if (Seleccion.extCredits > 3) {
      Seleccion.extCredits -= 3;
    } else {
      Seleccion.extCredits = 0;
      Seleccion.quitar('LE-EXTERNA');
    }
    updateLEExternaLabel();
    applySelectionVisuals();
    updateInfoPanel(Seleccion.activo);
    return;
  }

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

  var returnBtn = document.getElementById('btn-return-universal');
  if (returnBtn) {
    returnBtn.addEventListener('click', function() {
      mostrarPensumUniversal();
    });
  }

  // Atajos de teclado: F (Alternar Árbol Local / Universal) y Escape (Salir del Árbol Local)
  window.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Escape' || e.key === 'Esc') {
      if (vistaModo === 'local') {
        mostrarPensumUniversal();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      if (vistaModo === 'local') {
        mostrarPensumUniversal();
      } else if (Seleccion.activo) {
        mostrarArbolLocal(Seleccion.activo);
      }
    }
  });
}

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
  renderStats();
  applySelectionVisuals();
  renderLegend();
}

function renderStats() {
  var codigos    = Object.keys(materias);
  var obligCount = 0;
  for (var i = 0; i < codigos.length; i++) {
    if (materias[codigos[i]].obligatoria) obligCount++;
  }
  var totalesMap = modo === 'grupo' ? TOTALES_GRUPO : TOTALES_SUBGRUPO;
  var numGroups  = totalesMap ? Object.keys(totalesMap).length : 0;

  var totalEl = document.getElementById('stat-total');
  var obligEl = document.getElementById('stat-oblig');
  var grupEl  = document.getElementById('stat-grupos');

  if (totalEl) totalEl.textContent = codigos.length;
  if (obligEl) obligEl.textContent = obligCount;
  if (grupEl)  grupEl.textContent  = numGroups;
}

function renderLegend() {
  var grid    = document.getElementById('legend-list') || document.getElementById('legend-grid');
  var titleEl = document.getElementById('legend-title');
  if (titleEl) titleEl.textContent = modo === 'grupo' ? 'Grupos' : 'Subgrupos';
  if (!grid) return;

  var s      = LeyendaFiltro._set(modo);
  var colors = modo === 'grupo' ? COLORES_GRUPO : COLORES_SUBGRUPO;

  var totalesMap = modo === 'grupo' ? TOTALES_GRUPO : TOTALES_SUBGRUPO;
  var selecMap   = modo === 'grupo'
    ? creditosPorGrupo(Seleccion.set, materias)
    : creditosPorSubgrupo(Seleccion.set, materias);

  var keys = Object.keys(totalesMap);

  var html = '';
  for (var j = 0; j < keys.length; j++) {
    var key       = keys[j];
    var active    = s.has(key);
    var color     = colors[key] || '#94a3b8';

    var totInfo   = totalesMap[key] || { total: 0, oblig: 0, opt: 0, minimos: 0 };
    var totalCr   = totInfo.total;
    var obligCr   = totInfo.oblig;
    var selCr     = selecMap[key] || 0;
    var reqTarget = totInfo.minimos || (obligCr > 0 ? obligCr : totalCr);

    var isComplete   = (selCr > 0 && selCr >= reqTarget);
    var counterColor = isComplete ? '#4ade80' : '#38bdf8';
    var subText      = '<b style="color:' + counterColor + '">' + selCr + ' / ' + reqTarget + ' cr</b>';

    html += '<div class="legend-item' + (active ? '' : ' dim') + '" data-key="' + key + '">';
    html += '<span class="legend-dot" style="background:' + color + '"></span>';
    html += '<div class="legend-text">';
    html += '  <div class="legend-name" title="' + key + '">' + key + '</div>';
    html += '  <div class="legend-sub">' + subText + '</div>';
    html += '</div>';
    html += '</div>';
  }

  grid.innerHTML = html;

  var items = grid.getElementsByClassName('legend-item');
  for (var k = 0; k < items.length; k++) {
    items[k].addEventListener('click', function(e) {
      var itemKey = this.getAttribute('data-key');
      if (e.shiftKey) {
        var set = LeyendaFiltro._set(modo);
        if (set.size === 1 && set.has(itemKey)) {
          for (var x = 0; x < keys.length; x++) set.add(keys[x]);
        } else {
          set.clear();
          set.add(itemKey);
        }
      } else {
        LeyendaFiltro.toggle(itemKey, modo);
      }
      renderLegend();
      applySelectionVisuals();
    });
  }
}

function renderPrereqTree(tree) {
  if (!tree)
    return '<em class="dim">Sin prerrequisitos de cursos.</em>';
  if (typeof tree === 'string') {
    var m = materias[tree];
    return '<div class="prereq-item"><span class="prereq-bullet">•</span><span class="prereq-course">' + (m ? m.nombre : tree) + '</span></div>';
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

  if (selectedId === 'LE-EXTERNA') {
    var crEx = Seleccion.extCredits || 3;
    var htmlEx = '<div class="course-name">Libre Elección (Asignatura Externa)</div>';
    htmlEx += '<div class="course-meta"><span class="badge badge-opt">Optativa</span>';
    htmlEx += '<span class="badge badge-cr">' + crEx + ' cr</span></div>';
    htmlEx += '<div class="info-row"><b>Grupo:</b> Libre Elección</div>';
    htmlEx += '<div class="info-row"><b>Subgrupo:</b> Libre Elección — Profundización</div>';
    htmlEx += '<div class="info-row"><b>Créditos acumulados:</b> <b style="color:#38bdf8">' + crEx + ' cr</b></div>';
    htmlEx += '<div class="info-note" style="margin-top:12px;background:rgba(59,130,246,0.1);border-left-color:#38bdf8;color:#e2e8f0;">';
    htmlEx += '💡 <b>Contador de Asignaturas de Libre Elección</b><br>';
    htmlEx += '• Clic izquierdo: <b>Suma +3 créditos</b><br>';
    htmlEx += '• Clic derecho: <b>Resta -3 créditos</b>';
    htmlEx += '</div>';

    content.innerHTML = htmlEx;
    return;
  }

  var m = materias[selectedId];
  if (!m) { content.innerHTML = '<span class="dim">No encontrado.</span>'; return; }

  var res        = puedeMatricular(selectedId, Seleccion.set, materias, COMPONENTE_POR_GRUPO);
  var reqInfo    = m.creditos_requeridos;
  var sinPrereqs = !m.prerrequisitos && !reqInfo;
  var estadoHtml = sinPrereqs
    ? '<span style="color:#22c55e;font-weight:700">&#10003; Sin prerrequisitos</span>'
    : res.puede
      ? '<span style="color:#22c55e;font-weight:700">&#10003; Completo</span>'
      : '<span style="color:#ef4444;font-weight:700">&#10007; Incompleto</span>';

  var crHtml  = '';
  if (reqInfo) {
    var tot = creditosAprobados(Seleccion.set, materias, COMPONENTE_POR_GRUPO);
    var cur = (tot[reqInfo.componente] || 0) - (Seleccion.set.has(selectedId) && COMPONENTE_POR_GRUPO[m.grupo] === reqInfo.componente ? (selectedId === 'LE-EXTERNA' ? (Seleccion.extCredits || 3) : m.creditos) : 0);
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
  if (graphData && graphData.nodes) {
    for (var i = 0; i < graphData.nodes.length; i++) {
      if (graphData.nodes[i].id === selectedId) { node = graphData.nodes[i]; break; }
    }
  }

  var isCurrentLocal = (vistaModo === 'local' && materiaEnfocada === selectedId);
  var btnText = isCurrentLocal ? '⬅ Volver al Pensum Universal' : '🔍 Enfocar árbol local';

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
  html += '<button class="focus-mode-btn" id="btn-focus-toggle">' + btnText + '</button>';

  if (m.notas) html += '<div class="info-note">' + m.notas + '</div>';
  if (selCount > 1)
    html += '<div class="info-row" style="margin-top:8px;color:var(--text-dim);font-size:11px">' +
            selCount + ' materias en la selección</div>';

  content.innerHTML = html;

  var focusBtn = document.getElementById('btn-focus-toggle');
  if (focusBtn) {
    focusBtn.onclick = function() {
      if (isCurrentLocal) {
        mostrarPensumUniversal();
      } else {
        mostrarArbolLocal(selectedId);
      }
    };
  }
}
