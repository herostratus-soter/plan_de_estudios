'use strict';
// subgraph_modal.js — Módulo aislado para la vista modal del sub-árbol de prerrequisitos hiper-compacto.

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

var SubgrafoModal = {
  modalEl:     null,
  titleEl:     null,
  closeBtnEl:  null,
  containerEl: null,
  subNetwork:  null,
  subNodes:    null,
  subEdges:    null,
  targetId:    null,
  active:      false,

  init: function() {
    this.modalEl     = document.getElementById('subgraph-modal');
    this.titleEl     = document.getElementById('modal-course-title');
    this.closeBtnEl  = document.getElementById('modal-close-btn');
    this.containerEl = document.getElementById('subgraph-network');

    if (!this.modalEl || !this.closeBtnEl) return;

    var self = this;
    this.closeBtnEl.addEventListener('click', function() { self.cerrar(); });
  },

  abrir: function(targetId) {
    if (!this.modalEl) this.modalEl = document.getElementById('subgraph-modal');
    if (!this.titleEl) this.titleEl = document.getElementById('modal-course-title');
    if (!this.closeBtnEl) this.closeBtnEl = document.getElementById('modal-close-btn');
    if (!this.containerEl) this.containerEl = document.getElementById('subgraph-network');

    if (!targetId || !materias || !materias[targetId] || !graphData) return;
    this.targetId = targetId;
    this.active   = true;

    var m = materias[targetId];
    if (this.titleEl) this.titleEl.textContent = m.nombre;

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
      this.modalEl.style.display = 'flex';
    }

    var ancestorNodes = getAncestorNodeIds(targetId, materias);

    var filteredNodes = graphData.nodes
      .filter(function(n) { return ancestorNodes.has(n._codigo); })
      .map(function(n) {
        var copy = {};
        for (var p in n) { if (n.hasOwnProperty(p)) copy[p] = n[p]; }
        return copy;
      });

    var filteredEdges = graphData.edges
      .filter(function(e) {
        return ancestorNodes.has(e.from) && ancestorNodes.has(e.to);
      })
      .map(function(e) {
        var copy = {};
        for (var p in e) { if (e.hasOwnProperty(p)) copy[p] = e[p]; }
        return copy;
      });

    this.subNodes = new vis.DataSet(filteredNodes);
    this.subEdges = new vis.DataSet(filteredEdges);

    var options = {
      layout: {
        hierarchical: {
          direction: 'DU', sortMethod: 'directed',
          levelSeparation: 110, nodeSpacing: 165, treeSpacing: 65,
          blockShifting: true, edgeMinimization: true, parentCentralization: true,
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
      edges: { shadow: false, hoverWidth: 0, selectionWidth: 0, chosen: false },
    };

    if (this.subNetwork) this.subNetwork.destroy();
    this.subNetwork = new vis.Network(this.containerEl, { nodes: this.subNodes, edges: this.subEdges }, options);

    var self = this;
    this.subNetwork.on('click', function(params) {
      this.setSelection({ nodes: [], edges: [] });
      if (!params.nodes.length) return;
      var clicked = params.nodes[0];
      if (Seleccion.set.has(clicked)) {
        Seleccion.quitar(clicked);
      } else {
        Seleccion.agregar(clicked);
      }
      self.actualizar();
      applySelectionVisuals();
    });

    this.subNetwork.on('oncontext', function(params) {
      params.event.preventDefault();
      var nodeId = self.subNetwork.getNodeAt(params.pointer.DOM);
      if (nodeId === undefined) return;
      Seleccion.quitar(nodeId);
      self.actualizar();
      applySelectionVisuals();
    });

    this.subNetwork.on('afterDrawing', function(ctx) {
      self.drawModalDots(ctx);
    });

    this.actualizar();

    setTimeout(function() {
      if (self.subNetwork) {
        self.subNetwork.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
      }
    }, 100);
  },

  actualizar: function() {
    if (!this.active || !this.subNodes) return;

    var selectedAncestorEdges = new Set();
    if (this.subEdges && Seleccion.set.size > 0) {
      var allModalEdges = this.subEdges.get();
      Seleccion.set.forEach(function(selectedId) {
        var ancSet = getAncestorEdgeIds(selectedId, allModalEdges);
        ancSet.forEach(function(eid) { selectedAncestorEdges.add(eid); });
      });
    }

    var allModalNodes = this.subNodes.get();
    var nodeUpdates = [];

    for (var i = 0; i < allModalNodes.length; i++) {
      var n       = allModalNodes[i];
      var estado  = getEstado(n._codigo);
      var ev      = ESTADO_VISUAL[estado];
      var nodeKey = modo === 'grupo' ? n._grupo : n._subgrupo;
      var groupOn = LeyendaFiltro.isActive(nodeKey, modo);

      var bgColor, fontColor;

      if (groupOn) {
        switch (estado) {
          case 'sin_seleccion': bgColor = n._colorDim;  fontColor = '#c2c8d4'; break;
          case 'completo':
          case 'incompleto':    bgColor = n._colorBase; fontColor = '#1e293b'; break;
          case 'activo':        bgColor = n._colorActive; fontColor = '#0f172a'; break;
        }
      } else {
        switch (estado) {
          case 'sin_seleccion': bgColor = GRIS.base; fontColor = GRIS_FONT.base; break;
          case 'completo':
          case 'incompleto':    bgColor = GRIS.seleccion; fontColor = GRIS_FONT.seleccion; break;
          case 'activo':        bgColor = GRIS.activo; fontColor = GRIS_FONT.activo; break;
        }
      }

      nodeUpdates.push({
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

    this.subNodes.update(nodeUpdates);

    var allModalEdges = this.subEdges.get();
    var edgeUpdates = [];
    for (var k = 0; k < allModalEdges.length; k++) {
      var edge             = allModalEdges[k];
      var isSelectedPrereq = selectedAncestorEdges.has(edge.id);
      var isContinuous     = !edge.dashes;

      var edgeColor, edgeWidth;

      if (isSelectedPrereq) {
        var prereqMet = Seleccion.set.has(edge.from);
        var isOtherOrSatisfied = !prereqMet && edge.dashes && isOrGroupSatisfiedByOther(edge, allModalEdges, Seleccion.set);

        edgeWidth = isContinuous ? 2.2 : 1.5;
        if (prereqMet) {
          edgeColor = { color: '#4ade80', opacity: 0.90 };
        } else if (isOtherOrSatisfied) {
          edgeColor = { color: '#38bdf8', opacity: 0.15 };
        } else {
          edgeColor = { color: '#f87171', opacity: 0.85 };
        }
      } else {
        edgeWidth = 1;
        edgeColor = { color: 'rgba(255,255,255,0.12)', opacity: 0.25 };
      }

      edgeUpdates.push({
        id:    edge.id,
        width: edgeWidth,
        color: edgeColor,
      });
    }
    this.subEdges.update(edgeUpdates);
  },

  drawModalDots: function(ctx) {
    if (!this.subNodes || !this.subNetwork) return;
    var DOT_R = 6.5;
    var all = this.subNodes.get();

    for (var i = 0; i < all.length; i++) {
      var n    = all[i];
      var m    = materias[n._codigo];
      if (!m) continue;
      var comp = COMPONENTE_POR_GRUPO[m.grupo];
      if (!comp) continue;

      try {
        var bb = this.subNetwork.getBoundingBox(n.id);
        var x  = (bb.left + bb.right) / 2;
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
  },

  cerrar: function() {
    if (!this.active) return;
    this.active   = false;
    this.targetId = null;
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
      this.modalEl.style.display = 'none';
    }
    if (this.subNetwork) {
      this.subNetwork.destroy();
      this.subNetwork = null;
    }
    applySelectionVisuals();
    updateCreditCounter();
    updateInfoPanel(Seleccion.activo);
  }
};
