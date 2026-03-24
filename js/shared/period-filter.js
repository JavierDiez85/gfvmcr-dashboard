// GF — Period Filter: barra unificada AÑO → PERÍODO → MES para todas las vistas financieras
(function(window){
  'use strict';

  const TODAY_YEAR = new Date().getFullYear();
  const GFP_YEARS = [String(TODAY_YEAR - 1), String(TODAY_YEAR)];
  const _MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  function _isCurrentYear(y){ return parseInt(y) === TODAY_YEAR; }

  // ── Genera el HTML completo de la barra ──
  // opts: { ent, color, years? }
  function gfpBarHTML(opts){
    const { ent, color } = opts;
    const avail = opts.years || GFP_YEARS;
    const curY = String(typeof _year !== 'undefined' ? _year : TODAY_YEAR);
    const acColor = color || 'var(--blue)';
    const curPeriod = (typeof _gfPeriod !== 'undefined' ? _gfPeriod[ent] : null) || 'año';
    const curMonth = new Date().getMonth();

    // Helper: botón activo vs inactivo
    const btn = (label, mode, small) => {
      const isAct = curPeriod === mode;
      const sty = isAct
        ? `background:${acColor};color:white;border-color:${acColor};`
        : '';
      const fs = small ? '.63rem' : '.68rem';
      return `<button class="pbtn" style="${sty}font-size:${fs};padding:2px 6px" onclick="_gfSetPeriod('${ent}','${mode}')">${label}</button>`;
    };

    // Separador vertical
    const sep = `<span style="display:inline-block;width:1px;height:14px;background:var(--border2);margin:0 5px;vertical-align:middle;opacity:.5"></span>`;

    // ── Botones AÑO ──
    const yBtns = avail.map(y => {
      const isAct = y === curY;
      const dot = _isCurrentYear(y) ? '<span style="font-size:.4rem;vertical-align:middle;opacity:.6;margin-left:1px">●</span>' : '';
      const sty = isAct ? `background:${acColor};color:white;border-color:${acColor};` : '';
      return `<button class="pbtn" style="${sty}font-size:.68rem;padding:2px 6px" onclick="_gfSetYear(${y},'${ent}')">${y}${dot}</button>`;
    }).join('');

    // ── Botones PERÍODO (Año / Q1-Q4) ──
    const pBtns = [
      btn('Año', 'año', false),
      btn('Q1',  'q1',  false),
      btn('Q2',  'q2',  false),
      btn('Q3',  'q3',  false),
      btn('Q4',  'q4',  false),
    ].join('');

    // ── Botones MES (Ene-Dic) ──
    const mBtns = _MO.map((m, i) => {
      const isAct = curPeriod === 'mes_'+i;
      const isCurM = i === curMonth && _isCurrentYear(curY);
      const label = m + (isCurM ? '<span style="font-size:.38rem;vertical-align:super;opacity:.7">●</span>' : '');
      const sty = isAct ? `background:${acColor};color:white;border-color:${acColor};` : '';
      return `<button class="pbtn" style="${sty}font-size:.63rem;padding:2px 5px" onclick="_gfSetPeriod('${ent}','mes_${i}')">${label}</button>`;
    }).join('');

    // ── Botón COMPARAR vs año anterior ──
    const prevY = parseInt(curY) - 1;
    const hasPrev = avail.indexOf(String(prevY)) !== -1;
    let cmpBtn = '';
    if(hasPrev){
      const isOn = typeof _gfCompare !== 'undefined' && _gfCompare;
      const cmpSty = isOn
        ? 'background:var(--orange);color:white;border-color:var(--orange);'
        : 'border:1.5px solid var(--orange);color:var(--orange);background:transparent;';
      cmpBtn = sep
        + `<button class="pbtn" style="${cmpSty}font-size:.63rem;padding:2px 8px;font-weight:700" onclick="_gfToggleCompare()">`
        + (isOn ? '&#10003; ' : '') + 'vs ' + prevY
        + `</button>`;
    }

    return `<div style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:3px;row-gap:5px">`
         + `<span style="font-size:.58rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">AÑO</span>`
         + yBtns
         + sep
         + pBtns
         + sep
         + mBtns
         + cmpBtn
         + `</div>`;
  }

  // ── Inyecta / actualiza la barra en su contenedor ──
  function gfpRender(containerId, opts){
    let el = document.getElementById(containerId);
    if(!el && opts.viewId){
      const viewEl = document.getElementById('view-' + opts.viewId);
      if(viewEl){
        const tw = viewEl.querySelector('.tw');
        el = document.createElement('div');
        el.id = containerId;
        el.style.cssText = 'margin-bottom:10px';
        if(tw) viewEl.insertBefore(el, tw);
        else viewEl.appendChild(el);
      }
    }
    if(!el) return;
    el.innerHTML = gfpBarHTML(opts);
  }

  // ── Cambiar año ──
  function _gfSetYear(y, ent){
    _year = parseInt(y);
    // Resetear período y comparación al cambiar año
    if(typeof _gfPeriod !== 'undefined' && ent) _gfPeriod[ent] = 'año';
    if(typeof _gfCompare !== 'undefined') _gfCompare = false;
    if(typeof _updateYearLabels === 'function') _updateYearLabels();
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // ── Toggle modo comparativo vs año anterior ──
  function _gfToggleCompare(){
    _gfCompare = !_gfCompare;
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // ── Cambiar período (Año / Q1-Q4 / mes_N) ──
  function _gfSetPeriod(ent, mode){
    if(typeof _gfPeriod !== 'undefined') _gfPeriod[ent] = mode;
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // Backward compat: _gfSetSub aliased to _gfSetPeriod
  function _gfSetSub(ent, mode){ _gfSetPeriod(ent, mode); }

  window.gfpBarHTML       = gfpBarHTML;
  window.gfpRender        = gfpRender;
  window._gfSetYear       = _gfSetYear;
  window._gfSetPeriod     = _gfSetPeriod;
  window._gfSetSub        = _gfSetSub; // backward compat
  window._gfToggleCompare = _gfToggleCompare;

})(window);
