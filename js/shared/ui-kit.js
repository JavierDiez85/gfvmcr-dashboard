// GF — UI Kit: Reusable component factories
// ═══════════════════════════════════════════════════════════
// Generates HTML strings matching existing CSS classes.
// Usage:  el.innerHTML = UI.kpiCard({...}) + UI.kpiCard({...})
// ═══════════════════════════════════════════════════════════

(function(window){
'use strict';

// ── Color presets ───────────────────────────────────────────
// Maps a short color name → { hex, bg, lt } using CSS vars
var COLORS = {
  blue:   { hex:'#0073ea', bg:'var(--blue-bg)',   lt:'var(--blue-lt)',   v:'var(--blue)'   },
  green:  { hex:'#00b875', bg:'var(--green-bg)',  lt:'var(--green-lt)',  v:'var(--green)'  },
  red:    { hex:'#e53935', bg:'var(--red-bg)',     lt:'var(--red-lt)',    v:'var(--red)'    },
  orange: { hex:'#ff7043', bg:'var(--orange-bg)', lt:'var(--orange-lt)', v:'var(--orange)' },
  purple: { hex:'#9b51e0', bg:'var(--purple-bg)', lt:'var(--purple-lt)', v:'var(--purple)' },
  yellow: { hex:'#ffa000', bg:'var(--yellow-bg)', lt:'var(--yellow-lt)', v:'var(--yellow)' }
};

function _col(c){ return COLORS[c] || COLORS.blue; }
function _esc(s){ return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ═══════════════════════════════════════════════════════════
// 1. KPI CARD  —  matches .kpi-card / .kpi-row CSS
// ═══════════════════════════════════════════════════════════
// opts: { id, label, value, sub, icon, color, bar, barPct,
//         cols, onClick, hint, style, cls }
//
// kpiRow(cards, opts)  — wraps cards[] in .kpi-row grid
// kpiCard(opts)        — single card HTML
//
function kpiCard(o){
  var c  = _col(o.color);
  var ac = o.hex || c.hex;

  var h  = '<div class="kpi-card' + (o.onClick ? ' kpi-clickable':'') + (o.cls ? ' '+o.cls:'') + '"'
         + ' style="--ac:'+ac + (o.style ? ';'+o.style : '') + '"'
         + (o.onClick ? ' onclick="'+_esc(o.onClick)+'"' : '')
         + (o.id ? ' id="'+o.id+'"' : '')
         + '>';

  // Clickable hint
  if(o.onClick && o.hint !== false){
    h += '<div class="kpi-hint">' + (o.hint || 'ver detalle &rarr;') + '</div>';
  }

  // Top row: label + icon
  h += '<div class="kpi-top">'
     + '<div class="kpi-lbl">' + _esc(o.label) + '</div>';
  if(o.icon){
    h += '<div class="kpi-ico" style="background:'+c.bg+';color:'+ac+'">' + o.icon + '</div>';
  }
  h += '</div>';

  // Value
  h += '<div class="kpi-val"'
     + (o.valColor ? ' style="color:'+o.valColor+'"' : '')
     + (o.valId ? ' id="'+o.valId+'"' : '')
     + '>' + (o.value != null ? o.value : '--') + '</div>';

  // Sub / delta
  if(o.sub != null){
    var dCls = o.delta === 'up' ? 'dup' : o.delta === 'down' ? 'ddn' : 'dnu';
    h += '<div class="kpi-d '+dCls+'"'
       + (o.subId ? ' id="'+o.subId+'"' : '')
       + '>' + o.sub + '</div>';
  }

  // Progress bar
  if(o.bar !== false && o.barPct != null){
    h += '<div class="kbar"><div class="kfill" style="background:'+ac+';width:'+o.barPct+'%"'
       + (o.barId ? ' id="'+o.barId+'"' : '')
       + '></div></div>';
  }

  h += '</div>';
  return h;
}

function kpiRow(cards, o){
  o = o || {};
  var cols = o.cols || cards.length;
  var cls  = 'kpi-row' + (cols===3?' c3':'');
  return '<div class="'+cls+'"' + (o.style ? ' style="'+o.style+'"':'') + '>'
       + cards.join('') + '</div>';
}

// Mini KPI (modal variant)  —  matches .m-kpi / .m-kpi-row CSS
// opts: { label, value, color, valStyle, cols }
function mkpi(o){
  var c  = _col(o.color);
  var ac = o.hex || c.hex;
  return '<div class="m-kpi" style="--ac:'+ac+'">'
       + '<div class="m-kpi-lbl">'+_esc(o.label)+'</div>'
       + '<div class="m-kpi-val"'+(o.valStyle?' style="'+o.valStyle+'"':'')+'>'+(o.value!=null?o.value:'--')+'</div>'
       + '</div>';
}

function mkpiRow(cards, o){
  o = o || {};
  var cols = o.cols || cards.length;
  return '<div class="m-kpi-row" style="grid-template-columns:repeat('+cols+',1fr)"'
       + (o.style ? ';'+o.style : '') + '>'
       + cards.join('') + '</div>';
}


// ═══════════════════════════════════════════════════════════
// 2. DATA TABLE  —  matches .bt / .tw CSS (and .mbt for modals)
// ═══════════════════════════════════════════════════════════
// opts: { id, headers:[], align:[], rows:[], cls, modal,
//         title, titleAction, searchId, emptyText, style }
//
// headers[]  — string array of column names
// align[]    — 'l'|'r' per column (default 'l')
// rows[]     — array of { cells:[], cls, style, onClick }
//              cells[] can be string or { html, cls, style }
//
function dataTable(o){
  var tCls = o.modal ? 'mbt' : 'bt';
  if(o.cls) tCls += ' ' + o.cls;

  var h = '';

  // Optional table wrapper (.tw)
  var wrap = !o.modal && (o.title || o.searchId);
  if(wrap){
    h += '<div class="tw">';
    // Header row
    h += '<div class="tw-h">';
    h += '<div class="tw-ht">' + (o.title || '') + '</div>';
    if(o.titleAction){
      h += o.titleAction; // raw HTML for button/link
    }
    if(o.searchId){
      h += '<input type="text" id="'+o.searchId+'" class="fi" placeholder="Buscar..." style="width:200px;font-size:.72rem;padding:5px 10px">';
    }
    h += '</div>';
  }

  // Table
  h += '<table class="'+tCls+'"'
     + (o.id ? ' id="'+o.id+'"' : '')
     + (o.style ? ' style="'+o.style+'"' : '')
     + '>';

  // Thead
  if(o.headers && o.headers.length){
    h += '<thead><tr>';
    for(var i=0;i<o.headers.length;i++){
      var al = (o.align && o.align[i]==='r') ? ' class="r"' : '';
      h += '<th'+al+'>' + _esc(o.headers[i]) + '</th>';
    }
    h += '</tr></thead>';
  }

  // Tbody
  h += '<tbody'+(o.tbodyId?' id="'+o.tbodyId+'"':'')+'>';
  if(o.rows && o.rows.length){
    for(var r=0;r<o.rows.length;r++){
      var row = o.rows[r];
      h += '<tr'
         + (row.cls ? ' class="'+row.cls+'"' : '')
         + (row.style ? ' style="'+row.style+'"' : '')
         + (row.onClick ? ' onclick="'+_esc(row.onClick)+'"' : '')
         + '>';
      var cells = row.cells || row;
      for(var j=0;j<cells.length;j++){
        var cell = cells[j];
        if(typeof cell === 'object' && cell !== null){
          h += '<td'
             + (cell.cls ? ' class="'+cell.cls+'"' : (o.align && o.align[j]==='r' ? ' class="r"' : ''))
             + (cell.style ? ' style="'+cell.style+'"' : '')
             + '>' + (cell.html||'') + '</td>';
        } else {
          var aCls = (o.align && o.align[j]==='r') ? ' class="r"' : '';
          h += '<td'+aCls+'>' + (cell!=null?cell:'') + '</td>';
        }
      }
      h += '</tr>';
    }
  } else if(o.emptyText){
    var cSpan = (o.headers && o.headers.length) || 1;
    h += '<tr><td colspan="'+cSpan+'" style="text-align:center;padding:24px;color:var(--muted);font-size:.78rem">'+_esc(o.emptyText)+'</td></tr>';
  }
  h += '</tbody></table>';

  if(wrap) h += '</div>';
  return h;
}


// ═══════════════════════════════════════════════════════════
// 3. CHART PANEL  —  matches .cc / .cc-h / .cc-b CSS
// ═══════════════════════════════════════════════════════════
// opts: { id, title, subtitle, height, actions, style, cls }
//
// id  — canvas id (e.g. 'c-sal-evo')
//
function chartPanel(o){
  var h = '<div class="cc' + (o.cls ? ' '+o.cls : '') + '"'
        + (o.style ? ' style="'+o.style+'"' : '')
        + '>';

  // Header (optional — omitted if no title)
  if(o.title){
    h += '<div class="cc-h"><div>';
    h += '<div class="cc-t">' + _esc(o.title) + '</div>';
    if(o.subtitle){
      h += '<div class="cc-s">' + _esc(o.subtitle) + '</div>';
    }
    h += '</div>';
    if(o.actions){
      h += '<div class="cc-a">' + o.actions + '</div>';
    }
    h += '</div>';
  }

  // Body with canvas
  h += '<div class="cc-b">';
  h += '<canvas id="'+o.id+'" height="'+(o.height||200)+'"></canvas>';
  h += '</div></div>';
  return h;
}

// Chart grid — wraps multiple chartPanel() in a responsive grid
function chartGrid(panels, o){
  o = o || {};
  var cols = o.cols || panels.length;
  return '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:'+(o.gap||'16px')+';"'
       + (o.style ? ' style="'+o.style+'"' : '')
       + '>' + panels.join('') + '</div>';
}


// ═══════════════════════════════════════════════════════════
// 4. PILL BADGE  —  matches .pill CSS
// ═══════════════════════════════════════════════════════════
// pill(text, color)        — standard pill with named color
// pill(text, {bg, color})  — custom colors
//
function pill(text, color){
  if(typeof color === 'object'){
    return '<span class="pill" style="background:'+color.bg+';color:'+color.color+'">'
         + _esc(text) + '</span>';
  }
  var c = _col(color);
  return '<span class="pill" style="background:'+c.lt+';color:'+c.hex+'">'
       + _esc(text) + '</span>';
}

// Status pill — maps status string to appropriate colors
// Matches existing statusPill() and spill() patterns
function statusPill(st){
  if(st === 'Activo' || st === 'activo')
    return '<span class="pill" style="background:var(--green-lt);color:#007a48">' + _esc(st) + '</span>';
  if(String(st).indexOf('VENCIDO') !== -1)
    return '<span class="pill" style="background:var(--red-lt);color:#b02020">' + _esc(st) + '</span>';
  if(st === 'Parcial' || st === 'Pendiente')
    return '<span class="pill" style="background:var(--yellow-lt);color:#7a5000">' + _esc(st) + '</span>';
  return '<span class="pill" style="background:var(--bg);color:var(--muted)">' + _esc(st) + '</span>';
}


// ═══════════════════════════════════════════════════════════
// 5. SECTION HEADER  —  panel wrapper with title + actions
// ═══════════════════════════════════════════════════════════
// opts: { title, subtitle, icon, actions, style }
//
function sectionHeader(o){
  var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px'
        + (o.style ? ';'+o.style : '') + '">';
  h += '<div>';
  if(o.icon){
    h += '<span style="margin-right:6px">' + o.icon + '</span>';
  }
  h += '<span style="font-size:.92rem;font-weight:700;color:var(--text)">' + _esc(o.title) + '</span>';
  if(o.subtitle){
    h += '<span style="font-size:.72rem;color:var(--muted);margin-left:8px">' + _esc(o.subtitle) + '</span>';
  }
  h += '</div>';
  if(o.actions){
    h += '<div style="display:flex;gap:8px;align-items:center">' + o.actions + '</div>';
  }
  h += '</div>';
  return h;
}


// ═══════════════════════════════════════════════════════════
// EXPORT — Global UI namespace
// ═══════════════════════════════════════════════════════════
window.UI = {
  kpiCard:       kpiCard,
  kpiRow:        kpiRow,
  mkpi:          mkpi,
  mkpiRow:       mkpiRow,
  dataTable:     dataTable,
  chartPanel:    chartPanel,
  chartGrid:     chartGrid,
  pill:          pill,
  statusPill:    statusPill,
  sectionHeader: sectionHeader,
  COLORS:        COLORS
};

})(window);
