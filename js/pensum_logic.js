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
 * Suma los créditos aprobados por componente
 */
function creditosAprobados(aprobadas, materias, compMap) {
  var result = { fundamentacion: 0, disciplinar: 0, libre_eleccion: 0 };
  if (!aprobadas || !materias) return result;

  aprobadas.forEach(function(code) {
    var m = materias[code];
    if (!m) return;

    var comp = compMap ? compMap[m.grupo] : null;
    if (comp && result.hasOwnProperty(comp)) {
      result[comp] += m.creditos;
    }
  });

  return result;
}

/**
 * Suma créditos seleccionados por grupo.
 */
function creditosPorGrupo(aprobadas, materias) {
  var r = {};
  if (!aprobadas || !materias) return r;
  aprobadas.forEach(function(code) {
    var m = materias[code];
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
    r[m.subgrupo] += m.creditos;
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

  var totales = creditosAprobados(aprobadas, materias, compMap);
  var cur = totales[reqInfo.componente] || 0;
  var puedeCreds = cur >= reqInfo.minimo;

  var faltan = [];
  if (!puedePrereqs) faltan.push('Prerrequisitos directos no cumplidos');
  if (!puedeCreds)   faltan.push('Créditos mínimos de ' + reqInfo.componente + ' (' + cur + '/' + reqInfo.minimo + ')');

  return { puede: puedePrereqs && puedeCreds, faltan: faltan };
}

/**
 * Calcula total de créditos obligatorios/optativos por grupo
 */
function computarTotalesGrupo(materias) {
  var r = {};
  for (var c in materias) {
    var m = materias[c];
    if (!r[m.grupo]) r[m.grupo] = { oblig: 0, opt: 0, total: 0 };
    if (m.obligatoria) r[m.grupo].oblig += m.creditos;
    else               r[m.grupo].opt   += m.creditos;
    r[m.grupo].total += m.creditos;
  }
  return r;
}

/**
 * Calcula total de créditos obligatorios/optativos por subgrupo
 */
function computarTotalesSubgrupo(materias) {
  var r = {};
  for (var c in materias) {
    var m = materias[c];
    if (!r[m.subgrupo]) r[m.subgrupo] = { oblig: 0, opt: 0, total: 0 };
    if (m.obligatoria) r[m.subgrupo].oblig += m.creditos;
    else               r[m.subgrupo].opt   += m.creditos;
    r[m.subgrupo].total += m.creditos;
  }
  return r;
}
