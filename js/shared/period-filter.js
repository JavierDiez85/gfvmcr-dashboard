// GF — Period Filter: universal year + sub-period selector for all data views
(function(window){
  'use strict';

  const TODAY_YEAR = new Date().getFullYear();
  const GFP_YEARS = ['2025','2026'];

  function _isCurrentYear(y){ return parseInt(y) === TODAY_YEAR; }

  // Build the combined year + optional sub-period bar HTML
  // opts: { ent, color, type:'res'|'sub', years? }
  //   type='res' → shows year + sub-period (Mensual/Trimestral/Anual) for P&L results
  //   type='sub' → shows year selector only (Ingresos, Gastos, Nómina, consolidado)
  function gfpBarHTML(opts){
    const { ent, color, type } = opts;
    const avail = opts.years || GFP_YEARS;
    const curY = String(typeof _year !== 'undefined' ? _year : TODAY_YEAR);
    const isCur = _isCurrentYear(curY);
    const acColor = color || 'var(--blue)';

    const yBtns = avail.map(y => {
      const isAct = y === curY;
      const sty = isAct
        ? 'background:'+acColor+';color:white;border-color:'+acColor+';'
        : '';
      const dot = _isCurrentYear(y) ? ' <span style="font-size:.45rem;vertical-align:middle;opacity:.7">●</span>' : '';
      return `<button class="pbtn" style="${sty}font-size:.68rem" onclick="_gfSetYear(${y},'${ent}','${type}')">${y}${dot}</button>`;
    }).join('');

    let subHTML = '';
    if(type === 'res'){
      const curMode = (typeof _plMode !== 'undefined' ? _plMode[ent] : null) || (isCur ? 'mensual' : 'anual');
      const subOpts = isCur
        ? [{l:'Mensual', m:'mensual'}, {l:'Trimestral', m:'trimestral'}, {l:'Anual', m:'anual'}]
        : [{l:'Anual', m:'anual'}, {l:'Trimestral', m:'trimestral'}];
      const sBtns = subOpts.map(o => {
        const isA = o.m === curMode;
        return `<button class="pbtn${isA?' active':''}" style="font-size:.68rem" onclick="_gfSetSub('${ent}','${o.m}')">${o.l}</button>`;
      }).join('');
      subHTML = `<span style="display:inline-block;width:1px;height:16px;background:var(--border2);margin:0 5px;vertical-align:middle"></span>`
              + `<span style="font-size:.6rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-right:3px">PERÍODO</span>`
              + sBtns;
    }

    return `<div style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:3px">`
         + `<span style="font-size:.6rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-right:3px">AÑO</span>`
         + yBtns
         + subHTML
         + `</div>`;
  }

  // Inject/update the period bar into a container element
  // If the container doesn't exist, create it and insert before the first .tw in the view
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

  // Change year globally → updates _year, adjusts _plMode default, re-renders current view
  function _gfSetYear(y, ent, type){
    _year = parseInt(y); // modifies the global let binding from helpers.js
    // Reset sub-period to year-appropriate default for P&L res views
    if(typeof _plMode !== 'undefined' && ent && type === 'res'){
      _plMode[ent] = _isCurrentYear(y) ? 'mensual' : 'anual';
    }
    if(typeof _updateYearLabels === 'function') _updateYearLabels();
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // Change sub-period mode for a P&L entity → updates _plMode, re-renders P&L
  function _gfSetSub(ent, mode){
    if(typeof _plMode !== 'undefined') _plMode[ent] = mode;
    if(typeof rPL === 'function') rPL(ent);
    if(typeof rPLCharts === 'function') rPLCharts(ent);
  }

  window.gfpBarHTML = gfpBarHTML;
  window.gfpRender = gfpRender;
  window._gfSetYear = _gfSetYear;
  window._gfSetSub = _gfSetSub;

})(window);
