// GF — Period Filter: barra unificada AÑO → PERÍODO → MES para todas las vistas financieras
// Soporta: Todo (multi-año), Año, Q1-Q4, Mes individual, Rango de meses (shift+click)
(function(window){
  'use strict';

  const TODAY_YEAR = new Date().getFullYear();
  const GFP_YEARS = [String(TODAY_YEAR - 1), String(TODAY_YEAR)];
  const _MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  function _isCurrentYear(y){ return parseInt(y) === TODAY_YEAR; }

  // Track last clicked month per entity for shift-click range
  let _lastClickedMonth = {};

  // ── Genera el HTML completo de la barra ──
  function gfpBarHTML(opts){
    const { ent, color } = opts;
    const avail = opts.years || GFP_YEARS;
    const curY = String(typeof _year !== 'undefined' ? _year : TODAY_YEAR);
    const acColor = color || 'var(--blue)';
    const curPeriod = (typeof _gfPeriod !== 'undefined' ? _gfPeriod[ent] : null) || 'año';
    const curMonth = new Date().getMonth();
    const isTodo = curPeriod === 'todo';

    // Parse range for highlighting
    let rangeFrom = -1, rangeTo = -1;
    if(curPeriod.startsWith('rango_')){
      const parts = curPeriod.split('_');
      rangeFrom = parseInt(parts[1]);
      rangeTo = parseInt(parts[2]);
    }

    // Helper: botón activo vs inactivo
    const btn = (label, mode, small) => {
      const isAct = curPeriod === mode;
      const sty = isAct
        ? `background:${acColor};color:white;border-color:${acColor};`
        : '';
      const fs = small ? '.63rem' : '.68rem';
      return `<button class="pbtn gfp-period" data-ent="${ent}" data-mode="${mode}" style="${sty}font-size:${fs};padding:2px 6px">${label}</button>`;
    };

    // Separador vertical
    const sep = `<span style="display:inline-block;width:1px;height:14px;background:var(--border2);margin:0 5px;vertical-align:middle;opacity:.5"></span>`;

    // ── Botón TODO (multi-año) ──
    const todoSty = isTodo
      ? `background:${acColor};color:white;border-color:${acColor};`
      : '';
    const todoBtn = `<button class="pbtn gfp-todo" data-ent="${ent}" style="${todoSty}font-size:.68rem;padding:2px 8px;font-weight:600">Todo</button>`;

    // ── Botones AÑO ──
    const yBtns = avail.map(y => {
      const isAct = y === curY && !isTodo;
      const dot = _isCurrentYear(y) ? '<span style="font-size:.4rem;vertical-align:middle;opacity:.6;margin-left:1px">●</span>' : '';
      const sty = isAct ? `background:${acColor};color:white;border-color:${acColor};` : '';
      return `<button class="pbtn gfp-year" data-year="${y}" data-ent="${ent}" style="${sty}font-size:.68rem;padding:2px 6px">${y}${dot}</button>`;
    }).join('');

    // ── Botones PERÍODO (Año / Q1-Q4) ──
    const pBtns = [
      btn('Año', 'año', false),
      btn('Q1',  'q1',  false),
      btn('Q2',  'q2',  false),
      btn('Q3',  'q3',  false),
      btn('Q4',  'q4',  false),
    ].join('');

    // ── Botones MES (Ene-Dic) con soporte de rango ──
    const mBtns = _MO.map((m, i) => {
      const isSingleActive = curPeriod === 'mes_'+i;
      const isInRange = rangeFrom >= 0 && i >= rangeFrom && i <= rangeTo;
      const isRangeEdge = isInRange && (i === rangeFrom || i === rangeTo);
      const isCurM = i === curMonth && _isCurrentYear(curY);

      let sty = '';
      if(isSingleActive || isRangeEdge){
        sty = `background:${acColor};color:white;border-color:${acColor};`;
      } else if(isInRange){
        sty = `background:${acColor}25;color:${acColor};border-color:${acColor}50;font-weight:600;`;
      }

      const label = m + (isCurM ? '<span style="font-size:.38rem;vertical-align:super;opacity:.7">●</span>' : '');
      return `<button class="pbtn gfp-month" data-ent="${ent}" data-month="${i}" style="${sty}font-size:.63rem;padding:2px 5px" title="Click: mes · Shift+Click: rango">${label}</button>`;
    }).join('');

    // ── Botón COMPARAR vs año anterior ──
    const prevY = parseInt(curY) - 1;
    const hasPrev = avail.indexOf(String(prevY)) !== -1;
    let cmpBtn = '';
    if(hasPrev && !isTodo){
      const isOn = typeof _gfCompare !== 'undefined' && _gfCompare;
      const cmpSty = isOn
        ? 'background:var(--orange);color:white;border-color:var(--orange);'
        : 'border:1.5px solid var(--orange);color:var(--orange);background:transparent;';
      cmpBtn = sep
        + `<button class="pbtn gfp-compare" style="${cmpSty}font-size:.63rem;padding:2px 8px;font-weight:700">`
        + (isOn ? '&#10003; ' : '') + 'vs ' + prevY
        + `</button>`;
    }

    // ── Range indicator ──
    let rangeLabel = '';
    if(rangeFrom >= 0){
      rangeLabel = `<span style="font-size:.58rem;color:${acColor};font-weight:700;margin-left:4px">${_MO[rangeFrom]}–${_MO[rangeTo]}</span>`;
    }

    return `<div style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:3px;row-gap:5px">`
         + `<span style="font-size:.58rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">AÑO</span>`
         + todoBtn
         + yBtns
         + sep
         + (isTodo ? '' : pBtns + sep + mBtns + rangeLabel + cmpBtn)
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
        if(tw && tw.parentNode === viewEl) viewEl.insertBefore(el, tw);
        else viewEl.appendChild(el);
      }
    }
    if(!el) return;
    el.innerHTML = gfpBarHTML(opts);

    // ── Event handlers ──
    el.querySelectorAll('.gfp-year').forEach(function(btn){
      btn.onclick = function(){ _gfSetYear(+this.dataset.year, this.dataset.ent); };
    });
    el.querySelectorAll('.gfp-period').forEach(function(btn){
      btn.onclick = function(){
        _lastClickedMonth[this.dataset.ent] = -1; // reset range anchor
        _gfSetPeriod(this.dataset.ent, this.dataset.mode);
      };
    });
    el.querySelectorAll('.gfp-month').forEach(function(btn){
      btn.onclick = function(e){
        const ent = this.dataset.ent;
        const month = parseInt(this.dataset.month);

        if(e.shiftKey && _lastClickedMonth[ent] >= 0 && _lastClickedMonth[ent] !== month){
          // Shift+Click → range selection
          const from = Math.min(_lastClickedMonth[ent], month);
          const to = Math.max(_lastClickedMonth[ent], month);
          _gfSetPeriod(ent, 'rango_' + from + '_' + to);
        } else {
          // Normal click → single month
          _lastClickedMonth[ent] = month;
          _gfSetPeriod(ent, 'mes_' + month);
        }
      };
    });
    el.querySelectorAll('.gfp-todo').forEach(function(btn){
      btn.onclick = function(){ _gfSetTodo(this.dataset.ent); };
    });
    el.querySelectorAll('.gfp-compare').forEach(function(btn){
      btn.onclick = function(){ _gfToggleCompare(); };
    });
  }

  // ── Cambiar año ──
  function _gfSetYear(y, ent){
    _year = parseInt(y);
    if(typeof _gfPeriod !== 'undefined' && ent) _gfPeriod[ent] = 'año';
    if(typeof _gfCompare !== 'undefined') _gfCompare = false;
    _lastClickedMonth[ent] = -1;
    if(typeof _updateYearLabels === 'function') _updateYearLabels();
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // ── Modo "Todo" (todos los años) ──
  function _gfSetTodo(ent){
    if(typeof _gfPeriod !== 'undefined') _gfPeriod[ent] = 'todo';
    if(typeof _gfCompare !== 'undefined') _gfCompare = false;
    _lastClickedMonth[ent] = -1;
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // ── Toggle modo comparativo vs año anterior ──
  function _gfToggleCompare(){
    _gfCompare = !_gfCompare;
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // ── Cambiar período (Año / Q1-Q4 / mes_N / rango_N_M / todo) ──
  function _gfSetPeriod(ent, mode){
    if(typeof _gfPeriod !== 'undefined') _gfPeriod[ent] = mode;
    if(typeof render === 'function') render(typeof _currentView !== 'undefined' ? _currentView : '');
  }

  // Backward compat
  function _gfSetSub(ent, mode){ _gfSetPeriod(ent, mode); }

  window.gfpBarHTML       = gfpBarHTML;
  window.gfpRender        = gfpRender;
  window._gfSetYear       = _gfSetYear;
  window._gfSetPeriod     = _gfSetPeriod;
  window._gfSetTodo       = _gfSetTodo;
  window._gfSetSub        = _gfSetSub;
  window._gfToggleCompare = _gfToggleCompare;

})(window);
