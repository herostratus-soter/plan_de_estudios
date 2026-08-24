'use strict';
// graph_builder.js — construye nodos y aristas para vis.js a partir de materias JSON.
// Depende de: pensum_logic.js (COLORES_GRUPO, COLORES_SUBGRUPO)

// ── Helpers de color ──────────────────────────────────────────────────────────

function padHex(n) {
  var h = n.toString(16);
  return h.length === 1 ? '0' + h : h;
}

/**
 * Atenúa un color #rrggbb mez clándolo 72% con el fondo oscuro del canvas (#0d1117).
 * Nodos sin selección: tono muy apagado con un leve tinte del color de grupo.
 */
function dimHex(hex) {
  var bgR = 13, bgG = 17, bgB = 23; // #0d1117
  var f   = 0.72;                    // tono medio equilibrado
  var r   = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - f) + bgR * f);
  var g   = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - f) + bgG * f);
  var b   = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - f) + bgB * f);
  return '#' + padHex(r) + padHex(g) + padHex(b);
}
function lightenHex(hex, amount) {
  var r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  var g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  var b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return '#' + padHex(r) + padHex(g) + padHex(b);
}

/**
 * Parte el nombre de una materia en líneas para el label de vis.js.
 */
function wrapLabel(nombre, maxChars) {
  maxChars = maxChars || 18;
  var words = nombre.split(' ');
  var lines = [];
  var current = '';
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var candidate = current ? current + ' ' + word : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

/**
 * Extrae las aristas del árbol de prerrequisitos preservando si la relación es
 * absoluta (directa / AND) o alternativa booleana (opción dentro de un OR).
 * @param {Object|string} tree
 * @param {boolean} inOrGroup
 * @returns {Array<{code: string, isOr: boolean}>}
 */
function extractEdgesFromTree(tree, inOrGroup) {
  if (!tree) return [];
  if (typeof tree === 'string') {
    return [{ code: tree, isOr: !!inOrGroup }];
  }
  var result = [];
  if (tree.and) {
    for (var i = 0; i < tree.and.length; i++) {
      var sub = extractEdgesFromTree(tree.and[i], inOrGroup);
      for (var k = 0; k < sub.length; k++) result.push(sub[k]);
    }
  } else if (tree.or) {
    for (var j = 0; j < tree.or.length; j++) {
      var subOr = extractEdgesFromTree(tree.or[j], true);
      for (var m = 0; m < subOr.length; m++) result.push(subOr[m]);
    }
  }
  return result;
}

/**
 * Aplana el árbol booleano de prerrequisitos a un array de códigos.
 * Pierde semántica AND/OR — solo sirve para calcular niveles.
 */
function flatPrereqs(tree) {
  if (!tree) return [];
  if (typeof tree === 'string') return [tree];
  var items = tree.and || tree.or || [];
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var sub = flatPrereqs(items[i]);
    for (var j = 0; j < sub.length; j++) result.push(sub[j]);
  }
  return result;
}

/**
 * Calcula el nivel jerárquico de cada materia.
 * Nivel = max(niveles de todos sus prerrequisitos internos) + 1.
 * Raíces (sin prerrequisitos internos) = nivel 0.
 * Usa DFS con memoización; guarda conjunto de visitas para detectar ciclos.
 */
function computarNiveles(materias) {
  var levels   = {};
  var visiting = {};

  function getLevel(codigo) {
    if (levels[codigo] !== undefined) return levels[codigo];
    if (visiting[codigo]) return 0;

    visiting[codigo] = true;
    var m = materias[codigo];
    if (!m) { delete visiting[codigo]; return 0; }

    if (m.grupo === 'Trabajo de Grado' || (m.nombre && m.nombre.indexOf('Trabajo de Grado') !== -1)) {
      levels[codigo] = 7;
      delete visiting[codigo];
      return 7;
    }

    var prereqs = flatPrereqs(m.prerrequisitos).filter(function(p) { return !!materias[p]; });

    if (prereqs.length === 0) {
      var req = m.creditos_requeridos;
      if (req && req.minimo >= 40) {
        levels[codigo] = 5;
      } else {
        levels[codigo] = 0;
      }
    } else {
      var max = 0;
      for (var i = 0; i < prereqs.length; i++) {
        var l = getLevel(prereqs[i]);
        if (l > max) max = l;
      }
      levels[codigo] = max + 1;
    }

    delete visiting[codigo];
    return levels[codigo];
  }

  var codigos = Object.keys(materias);
  for (var i = 0; i < codigos.length; i++) getLevel(codigos[i]);
  return levels;
}

/**
 * Construye los arrays de nodos y aristas que vis.js necesita.
 * @param {Object} materias  — objeto materias de pensum_data.json
 * @param {string} modo      — 'grupo' | 'subgrupo'
 * @returns {{ nodes: Array, edges: Array, levels: Object }}
 */
function buildGraph(materias, modo) {
  var levels  = computarNiveles(materias);
  var nodes   = [];
  var edges   = [];
  var edgeSet = {};

  var childrenMap = {};
  for (var cKey in materias) childrenMap[cKey] = [];
  for (var cKey in materias) {
    var pList = flatPrereqs(materias[cKey].prerrequisitos);
    for (var p = 0; p < pList.length; p++) {
      if (childrenMap[pList[p]]) childrenMap[pList[p]].push(cKey);
    }
  }

  var getDescendantsCount = function(code) {
    var desc = {};
    var count = 0;
    var traverse = function(c) {
      var chList = childrenMap[c] || [];
      for (var k = 0; k < chList.length; k++) {
        var ch = chList[k];
        if (!desc[ch]) {
          desc[ch] = true;
          count++;
          traverse(ch);
        }
      }
    };
    traverse(code);
    return count;
  };

  var byLevel = {};
  var maxLevel = 0;
  for (var code in levels) {
    var lvl = levels[code];
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(code);
    if (lvl > maxLevel) maxLevel = lvl;
  }

  if (byLevel[0] && byLevel[0].length > 0) {
    var nodesL0 = byLevel[0].slice();
    nodesL0.sort(function(a, b) {
      return getDescendantsCount(a) - getDescendantsCount(b);
    });

    var centeredL0 = new Array(nodesL0.length);
    var mid = Math.floor(nodesL0.length / 2);
    var lPtr = mid - 1, rPtr = mid;

    for (var idx = nodesL0.length - 1; idx >= 0; idx--) {
      var itemCode = nodesL0[idx];
      if ((nodesL0.length - 1 - idx) % 2 === 0) {
        centeredL0[rPtr++] = itemCode;
      } else {
        centeredL0[lPtr--] = itemCode;
      }
    }
    byLevel[0] = centeredL0.filter(function(x) { return !!x; });
  }

  var positions = {};
  var nodeSpacingX = 180;
  var levelSpacingY = 150;

  for (var l = 0; l <= maxLevel; l++) {
    var nodesInLvl = byLevel[l] || [];

    if (l > 0) {
      nodesInLvl.sort(function(a, b) {
        var getBary = function(c) {
          var prereqs = flatPrereqs(materias[c] ? materias[c].prerrequisitos : null);
          var sum = 0, count = 0;
          for (var p = 0; p < prereqs.length; p++) {
            if (positions[prereqs[p]]) {
              sum += positions[prereqs[p]].x;
              count++;
            }
          }
          return count > 0 ? (sum / count) : 0;
        };
        return getBary(a) - getBary(b);
      });
    }

    var count = nodesInLvl.length;
    var y = (maxLevel - l - (maxLevel / 2.0)) * levelSpacingY;

    for (var k = 0; k < count; k++) {
      var cCode = nodesInLvl[k];
      var x = (k - (count - 1) / 2.0) * nodeSpacingX;
      positions[cCode] = { x: x, y: y };
    }
  }

  var codigos = Object.keys(materias);
  for (var i = 0; i < codigos.length; i++) {
    var codigo = codigos[i];
    var m      = materias[codigo];

    var color;
    if (modo === 'limpio') {
      color = COLORES_LIMPIO;
    } else if (modo === 'grupo') {
      color = COLORES_GRUPO[m.grupo] || '#e5e7eb';
    } else {
      color = COLORES_SUBGRUPO[m.subgrupo] || COLORES_GRUPO[m.grupo] || '#e5e7eb';
    }

    var borderRadius = m.obligatoria ? 0 : 20;

    var dimColor    = dimHex(color);
    var hoverColor  = lightenHex(color, 60);
    var activeColor = lightenHex(color, 70);

    var pos = positions[codigo] || { x: 0, y: 0 };

    var nodeObj = {
      id:    codigo,
      label: wrapLabel(m.nombre),
      level: levels[codigo] !== undefined ? levels[codigo] : 0,
      x:     pos.x,
      y:     pos.y,
      color: {
        background: dimColor,
        border:     'transparent',
        highlight:  { background: hoverColor, border: 'transparent' },
        hover:      { background: hoverColor, border: 'transparent' },
      },
      font: {
        color: '#6b7280',
        size:  11,
        face:  'Inter, Arial, sans-serif',
        align: 'center',
      },
      shape:           'box',
      shapeProperties: { borderRadius: borderRadius },
      widthConstraint: { minimum: 110, maximum: 148 },
      heightConstraint:{ minimum: 50 },
      margin:      8,
      borderWidth: 0,
      _colorBase:   color,
      _colorDim:    dimColor,
      _colorHover:  hoverColor,
      _colorActive: activeColor,
      _codigo:         codigo,
      _nombre:         m.nombre,
      _grupo:          m.grupo,
      _subgrupo:       m.subgrupo,
      _creditos:       m.creditos,
      _obligatoria:    m.obligatoria,
      _prerrequisitos: m.prerrequisitos,
      _notas:          m.notas || null,
    };

    nodes.push(nodeObj);

    // Aristas desde el árbol de prerrequisitos (con semántica continua/discontinua)
    var prereqList = extractEdgesFromTree(m.prerrequisitos, false)
      .filter(function(item) { return !!materias[item.code]; });

    for (var j = 0; j < prereqList.length; j++) {
      var item   = prereqList[j];
      var prereq = item.code;
      var isOr   = item.isOr;
      var eid    = prereq + '__' + codigo;

      if (!edgeSet[eid]) {
        edgeSet[eid] = true;
        edges.push({
          id:             eid,
          from:           prereq,
          to:             codigo,
          arrows:         'to',
          color:          { color: 'rgba(0,0,0,0)', opacity: 0 }, // invisible por defecto
          width:          isOr ? 1.5 : 2.2,                       // continua es un triz más gruesa
          dashes:         isOr ? [6, 4] : false,                  // continua si es absoluta, discontinua si es OR booleano
          chosen:         false,
          hoverWidth:     0,
          selectionWidth: 0,
          smooth:         { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 },
        });
      }
    }
  }

  return { nodes: nodes, edges: edges, levels: levels };
}
