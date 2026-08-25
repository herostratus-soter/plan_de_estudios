'use strict';
// pensum_logic.js — lógica pura de dominio. Sin DOM, sin vis.js.
// Toda la información de componentes y colores se deriva dinámicamente de PENSUM_DATA.

/**
 * Deriva dinámicamente el mapa de nombreGrupo -> identificadorComponente
 */
function buildComponenteMap(pensumData) {
  var map = {};
  if (!pensumData || !pensumData.programa || !pensumData.programa.componentes) return map;
  var componentes = pensumData.programa.componentes;

  for (var compKey in componentes) {
    var comp = componentes[compKey];
    if (!comp.agrupaciones) continue;
    for (var i = 0; i < comp.agrupaciones.length; i++) {
      var grupo = comp.agrupaciones[i];
      map[grupo.nombre] = compKey;
    }
  }
  return map;
}

/**
 * Deriva dinámicamente los mapas de colores por grupo y subgrupo desde PENSUM_DATA
 */
function buildColorMaps(pensumData) {
  var coloresGrupo = {};
  var coloresSubgrupo = {};

  if (!pensumData || !pensumData.programa || !pensumData.programa.componentes) {
    return { grupo: coloresGrupo, subgrupo: coloresSubgrupo };
  }

  var componentes = pensumData.programa.componentes;
  for (var compKey in componentes) {
    var comp = componentes[compKey];
    if (!comp.agrupaciones) continue;
    for (var i = 0; i < comp.agrupaciones.length; i++) {
      var grupo = comp.agrupaciones[i];
      coloresGrupo[grupo.nombre] = grupo.color;

      if (grupo.subagrupaciones) {
        for (var j = 0; j < grupo.subagrupaciones.length; j++) {
          var sg = grupo.subagrupaciones[j];
          coloresSubgrupo[sg.nombre] = sg.color;
        }
      }
    }
  }

  return { grupo: coloresGrupo, subgrupo: coloresSubgrupo };
}

/**
 * Extrae todos los códigos de asignaturas hojas dentro de una estructura de prerrequisitos booleana.
 */
function flatPrereqs(tree) {
  if (!tree) return [];
  if (typeof tree === 'string') return [tree];
  var result = [];
  if (Array.isArray(tree.and)) {
    for (var i = 0; i < tree.and.length; i++) {
      result = result.concat(flatPrereqs(tree.and[i]));
    }
  }
  if (Array.isArray(tree.or)) {
    for (var j = 0; j < tree.or.length; j++) {
      result = result.concat(flatPrereqs(tree.or[j]));
    }
  }
  return result;
}

/**
 * Retorna el conjunto de códigos SIA de todas las asignaturas ancestros (prerrequisitos directos e indirectos).
 */
function getAncestorNodeIds(targetId, materias) {
  var nodes = new Set();
  function collect(code) {
    if (!code || !materias[code] || nodes.has(code)) return;
    nodes.add(code);
    var m = materias[code];
    if (m && m.prerrequisitos) {
      var prereqs = flatPrereqs(m.prerrequisitos);
      for (var i = 0; i < prereqs.length; i++) collect(prereqs[i]);
    }
  }
  collect(targetId);
  return nodes;
}

/**
 * Evalúa recursivamente si un árbol de prerrequisitos booleanos se satisface con un conjunto de aprobadas.
 */
function evaluarArbolPrereqs(tree, aprobadas) {
  if (!tree) return true;
  if (typeof tree === 'string') return aprobadas.has(tree);
  if (Array.isArray(tree.and)) return tree.and.every(function(node) { return evaluarArbolPrereqs(node, aprobadas); });
  if (Array.isArray(tree.or))  return tree.or.some(function(node) { return evaluarArbolPrereqs(node, aprobadas); });
  return false;
}

/**
 * Suma los créditos aprobados por componente y calcula la transferencia de excesos
 * de Fundamentación y Disciplinar al contador de Libre Elección (Normativa UNAL)
 * manteniendo la suma total bruta sin doble conteo.
 */
function creditosAprobados(aprobadas, materias, compMap, mins) {
  var raw = { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0 };
  if (!aprobadas) return { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0, total_bruto: 0 };

  aprobadas.forEach(function(code) {
    if (code === 'LE-EXTERNA') {
      var crEx = (typeof Seleccion !== 'undefined' && Seleccion.extCredits) ? Seleccion.extCredits : 3;
      raw.libre_eleccion += crEx;
      return;
    }

    var m = materias ? materias[code] : null;
    if (!m) return;

    var comp = compMap ? compMap[m.grupo] : null;
    if (comp && raw.hasOwnProperty(comp)) {
      raw[comp] += m.creditos;
    }
  });

  var totalBruto = raw.fundamentacion + raw.disciplinar + raw.libre_eleccion;
  var result = {
    fundamentacion: raw.fundamentacion,
    disciplinar:    raw.disciplinar,
    libre_eleccion: raw.libre_eleccion,
    total_bruto:    totalBruto
  };

  if (mins) {
    var exFund = Math.max(0, raw.fundamentacion - (mins.fundamentacion || 0));
    var exDisc = Math.max(0, raw.disciplinar - (mins.disciplinar || 0));
    result.libre_eleccion = raw.libre_eleccion + exFund + exDisc;
  }

  return result;
}

/**
 * Suma créditos seleccionados por grupo.
 */
function creditosPorGrupo(aprobadas, materias) {
  var r = {};
  if (!aprobadas) return r;

  aprobadas.forEach(function(code) {
    if (code === 'LE-EXTERNA') {
      var crEx = (typeof Seleccion !== 'undefined' && Seleccion.extCredits) ? Seleccion.extCredits : 3;
      r['Libre Elección'] = (r['Libre Elección'] || 0) + crEx;
      return;
    }

    var m = materias ? materias[code] : null;
    if (!m) return;
    if (!r[m.grupo]) r[m.grupo] = 0;
    r[m.grupo] += m.creditos;
  });

  return r;
}

/**
 * Suma créditos seleccionados por subgrupo.
 */
function creditosPorSubgrupo(aprobadas, materias) {
  var r = {};
  if (!aprobadas || !materias) return r;
  aprobadas.forEach(function(code) {
    var m = materias[code];
    if (!m) return;
    if (!r[m.subgrupo]) r[m.subgrupo] = 0;
    var cr = (code === 'LE-EXTERNA' && typeof Seleccion !== 'undefined' && Seleccion.extCredits) ? Seleccion.extCredits : m.creditos;
    r[m.subgrupo] += cr;
  });
  return r;
}

/**
 * Determina si una materia puede ser matriculada según selecciones actuales
 */
function puedeMatricular(codigo, aprobadas, materias, compMap) {
  var m = materias[codigo];
  if (!m) return { puede: false, faltan: ['No encontrada'] };

  var puedePrereqs = evaluarArbolPrereqs(m.prerrequisitos, aprobadas);
  var reqInfo = m.creditos_requeridos;

  if (!reqInfo) {
    return { puede: puedePrereqs, faltan: puedePrereqs ? [] : ['Prerrequisitos directos no cumplidos'] };
  }

  var aprobadasSinEval = new Set();
  if (aprobadas) {
    aprobadas.forEach(function(code) {
      if (code !== codigo) aprobadasSinEval.add(code);
    });
  }

  var totales = creditosAprobados(aprobadasSinEval, materias, compMap);
  var cur = totales[reqInfo.componente] || 0;
  var puedeCreds = cur >= reqInfo.minimo;

  var faltan = [];
  if (!puedePrereqs) faltan.push('Prerrequisitos directos no cumplidos');
  if (!puedeCreds)   faltan.push('Créditos previos de ' + reqInfo.componente + ' (' + cur + '/' + reqInfo.minimo + ' créditos)');

  return { puede: puedePrereqs && puedeCreds, faltan: faltan };
}

/**
 * Mapa oficial de créditos mínimos exigidos por Agrupación según Acuerdo 11 de 2023.
 */
var MINIMOS_GRUPO_ACUERDO11 = {
  "Matemáticas": 16,
  "Probabilidad y Estadística": 3,
  "Física": 8,
  "Ciencias de la Computación": 18,
  "Ciencias Económicas y Administrativas": 6,
  "Métodos y Tecnologías de Software": 21,
  "Infraestructura Computacional, de Comunicaciones y de Información": 30,
  "Computación Aplicada": 3,
  "Sistemas Inteligentes": 3,
  "Modelos, Sistemas, Optimización y Simulación": 12,
  "Contexto Profesional e Interdisciplinario": 6,
  "Trabajo de Grado": 6,
  "Libre Elección": 33
};

/**
 * Mapa oficial de créditos mínimos exigidos por Subagrupación según Acuerdo 11 de 2023.
 */
var MINIMOS_SUBGRUPO_ACUERDO11 = {
  "Cálculo Diferencial": 4,
  "Cálculo Integral": 4,
  "Cálculo en Varias Variables": 4,
  "Álgebra Lineal": 4,
  "Probabilidad y Estadística": 3,
  "Física": 8,
  "Matemáticas Discretas I": 4,
  "Matemáticas Discretas II": 4,
  "Métodos Numéricos": 3,
  "Ciencias de la Computación": 7,
  "Ingeniería Económica": 3,
  "Gerencia y Gestión de Proyectos": 3,
  "Programación de Computadores": 3,
  "Lenguajes": 3,
  "Métodos y Tecnologías de Software": 15,
  "Elementos de Computadores": 3,
  "Bases de Datos": 3,
  "Información y Comunicaciones": 3,
  "Sistemas de Información": 3,
  "Criptografía y Seguridad de la Información": 3,
  "Infraestructura Computacional, de Comunicaciones y de Información": 15,
  "Computación Aplicada": 3,
  "Sistemas Inteligentes": 3,
  "Modelos y Sistemas": 3,
  "Optimización": 3,
  "Modelos, Sistemas, Optimización y Simulación": 6,
  "Taller Interdisciplinario de Proyectos de Creación y Gestión": 3,
  "Contexto Profesional e Interdisciplinario": 3,
  "Trabajo de Grado": 6,
  "Libre Elección": 33
};

/**
 * Calcula total de créditos obligatorios/optativos y exigencia mínima por grupo
 */
function computarTotalesGrupo(materias) {
  var r = {};
  for (var c in materias) {
    var m = materias[c];
    if (!r[m.grupo]) r[m.grupo] = { oblig: 0, opt: 0, total: 0, minimos: 0 };
    if (m.obligatoria) r[m.grupo].oblig += m.creditos;
    else               r[m.grupo].opt   += m.creditos;
    r[m.grupo].total += m.creditos;
  }

  for (var g in r) {
    r[g].minimos = MINIMOS_GRUPO_ACUERDO11[g] || (r[g].oblig > 0 ? r[g].oblig : r[g].total);
  }
  return r;
}

/**
 * Calcula total de créditos obligatorios/optativos y exigencia mínima por subgrupo
 */
function computarTotalesSubgrupo(materias) {
  var r = {};
  for (var c in materias) {
    var m = materias[c];
    if (!r[m.subgrupo]) r[m.subgrupo] = { oblig: 0, opt: 0, total: 0, minimos: 0 };
    if (m.obligatoria) r[m.subgrupo].oblig += m.creditos;
    else               r[m.subgrupo].opt   += m.creditos;
    r[m.subgrupo].total += m.creditos;
  }

  for (var sg in r) {
    r[sg].minimos = MINIMOS_SUBGRUPO_ACUERDO11[sg] || (r[sg].oblig > 0 ? r[sg].oblig : r[sg].total);
  }
  return r;
}
