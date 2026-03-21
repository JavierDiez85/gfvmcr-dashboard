// GF — Dashboard: Panel de Control
(function(window) {
  'use strict';

  const TAREAS_KEY = 'gf_tareas';

  // ── Entities config ──
  var _ENTS = [
    {key:'sal',  name:'Salem',     color:'#0073ea', nav:'sal_res',  icon:'💙', cxp:'Salem',     ppNav:'pp_salem'},
    {key:'end',  name:'Endless',   color:'#00b875', nav:'end_res',  icon:'💚', cxp:'Endless',   ppNav:'pp_endless'},
    {key:'dyn',  name:'Dynamo',    color:'#ff7043', nav:'dyn_res',  icon:'🔶', cxp:'Dynamo',    ppNav:'pp_dynamo'},
    {key:'wb',   name:'Wirebit',   color:'#9b51e0', nav:'wb_res',   icon:'💜', cxp:'Wirebit',   ppNav:'pp_wirebit'},
    {key:'stel', name:'Stellaris', color:'#e53935', nav:'stel_res', icon:'🔴', cxp:'Stellaris', ppNav:'pp_stellaris'}
  ];

  // ── Helpers ──
  function _fmtM(n) {
    if (n === null || n === undefined) return '—';
    var abs = Math.abs(Math.round(n));
    return (n < 0 ? '-' : '') + '$' + abs.toLocaleString('es-MX');
  }

  function _fmtMS(n) {
    if (n === null || n === undefined) return '—';
    var abs = Math.abs(Math.round(n));
    return (n >= 0 ? '+$' : '-$') + abs.toLocaleString('es-MX');
  }

  // Formato compacto para espacios reducidos: $1.2M, $693K, $450
  function _fmtK(n) {
    if (n === null || n === undefined) return '—';
    var sign = n < 0 ? '-' : '';
    var abs  = Math.abs(n);
    if (abs >= 1e6)  return sign + '$' + (abs / 1e6).toFixed(abs >= 10e6 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (abs >= 1e3)  return sign + '$' + (abs / 1e3).toFixed(abs >= 100e3 ? 0 : 1).replace(/\.?0+$/, '') + 'K';
    return sign + '$' + Math.round(abs).toLocaleString('es-MX');
  }

  function _fmtKS(n) {
    if (n === null || n === undefined) return '—';
    return (n >= 0 ? '+' : '') + _fmtK(n);
  }

  // Mapeo código corto → nombre completo (coincide con flujo-engine y pl-engine)
  var _ENT_FULL = { sal:'Salem', end:'Endless', dyn:'Dynamo', wb:'Wirebit', stel:'Stellaris' };

  function _entData(key, yr) {
    var recs = (typeof S !== 'undefined' && Array.isArray(S.recs)) ? S.recs : [];
    yr = yr || String(new Date().getFullYear());
    var full = _ENT_FULL[key] || key; // nombre completo: 'Stellaris', etc.

    // Filtrar por año + entidad (soporta esquema legacy: ent=código corto, type='ing'
    //   y esquema flujo: ent=nombre completo, tipo='ingreso')
    var rows = recs.filter(function(r) {
      if (String(r.yr) !== yr) return false;
      if (r.isSharedSource) return false;
      return r.ent === key || r.ent === full;
    });

    var ing = rows.filter(function(r) {
      return r.type === 'ing' || r.tipo === 'ingreso';
    }).reduce(function(s, r) { return s + ((r.vals || []).reduce(function(a, b) { return a + (b || 0); }, 0)); }, 0);

    var gas = rows.filter(function(r) {
      return r.type === 'gas' || r.type === 'cost' || r.tipo === 'gasto';
    }).reduce(function(s, r) { return s + ((r.vals || []).reduce(function(a, b) { return a + (b || 0); }, 0)); }, 0);

    return { ing: ing, gas: gas, margen: ing - gas };
  }

  function _cxpPendientes(cxpName) {
    try {
      var store = DB.get('gf_cxp') || { cuentas: [], pagos: [] };
      var pending = (store.cuentas || []).filter(function(c) {
        return c.empresa === cxpName && (c.status === 'pendiente' || c.status === 'parcial');
      });
      var total = pending.reduce(function(s, c) { return s + (parseFloat(c.saldo_mxn) || 0); }, 0);
      return { count: pending.length, total: total };
    } catch(e) { return { count: 0, total: 0 }; }
  }

  function _inversion(cxpName) {
    try {
      var inv = DB.get('gf_inversiones') || [];
      return inv.filter(function(i) { return i.empresa === cxpName; })
                .reduce(function(s, i) { return s + (parseFloat(i.monto) || 0); }, 0);
    } catch(e) { return 0; }
  }

  // ── Render helpers ──
  function _pillStyle(color) {
    return 'font-size:.78rem;font-weight:600;padding:8px 18px;border-radius:20px;'
         + 'border:1.5px solid ' + color + ';background:' + color + '18;color:' + color + ';'
         + 'cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap';
  }

  function _sectionLabel(txt) {
    return '<div style="font-size:.72rem;font-weight:700;color:var(--text);text-transform:uppercase;'
         + 'letter-spacing:.7px;margin-bottom:10px;text-align:center">' + txt + '</div>';
  }

  function _kpiCard(label, value, sub, color) {
    return '<div class="cc" style="padding:20px 16px;border-top:3px solid ' + color + ';text-align:center">'
         + '<div style="font-size:.74rem;font-weight:700;color:var(--text);margin-bottom:6px;'
         + 'text-transform:uppercase;letter-spacing:.4px">' + label + '</div>'
         + '<div style="font-size:1.35rem;font-weight:700;color:' + color + ';line-height:1.2">' + value + '</div>'
         + '<div style="font-size:.72rem;font-weight:600;color:var(--text2);margin-top:5px">' + sub + '</div>'
         + '</div>';
  }

  function _entMini(label, value, color) {
    return '<div style="background:var(--bg);border-radius:6px;padding:9px 10px">'
         + '<div style="font-size:.68rem;font-weight:700;color:var(--text);margin-bottom:3px;text-transform:uppercase;letter-spacing:.2px">' + label + '</div>'
         + '<div style="font-size:.88rem;font-weight:700;color:' + color + '">' + value + '</div>'
         + '</div>';
  }

  function _entCard(e, roi, pend) {
    var mc = e.margen >= 0 ? '#00b875' : '#e53935';
    var roiStr   = roi !== null ? (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%' : '—';
    var roiColor = roi === null ? 'var(--text2)' : (roi >= 0 ? '#00b875' : '#e53935');
    var roiBg    = roi === null ? 'var(--bg)' : (roi >= 0 ? '#00b87514' : '#e5393514');
    var pendBadge = pend.count > 0
      ? '<div style="margin-top:10px;font-size:.68rem;color:#ff9500;background:#ff950018;'
        + 'border-radius:6px;padding:5px 8px;cursor:pointer" onclick="event.stopPropagation();navTo(\''
        + e.ppNav + '\')">⏳ ' + pend.count + ' CxP · ' + _fmtK(pend.total) + '</div>'
      : '';
    // ROI badge — full-width, prominent
    var roiBadge = '<div style="margin-top:10px;background:' + roiBg + ';border:1.5px solid '
      + roiColor + '30;border-radius:8px;padding:8px 10px;text-align:center">'
      + '<div style="font-size:.6rem;font-weight:700;color:' + roiColor + ';text-transform:uppercase;'
      + 'letter-spacing:.5px;margin-bottom:2px">ROI</div>'
      + '<div style="font-size:1.25rem;font-weight:700;color:' + roiColor + ';line-height:1">' + roiStr + '</div>'
      + (roi === null ? '<div style="font-size:.6rem;color:var(--muted);margin-top:2px">Sin inversión registrada</div>' : '')
      + '</div>';
    return '<div class="cc" style="padding:16px;border-top:3px solid ' + e.color + ';cursor:pointer" '
         + 'onclick="navTo(\'' + e.nav + '\')">'
         + '<div style="font-size:.9rem;font-weight:700;color:' + e.color + ';margin-bottom:10px;letter-spacing:.1px">'
         + e.icon + ' ' + e.name + '</div>'
         + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'
         + _entMini('Ingresos', _fmtK(e.ing),     '#00b875')
         + _entMini('Gastos',   _fmtK(e.gas),     '#e53935')
         + _entMini('Margen',   _fmtKS(e.margen), mc)
         + '</div>'
         + roiBadge
         + pendBadge
         + '</div>';
  }

  function _pendCard(e, p) {
    return '<div class="cc" style="padding:14px 20px;min-width:180px;cursor:pointer;border-left:3px solid '
         + e.color + '" onclick="navTo(\'' + e.ppNav + '\')">'
         + '<div style="font-size:.75rem;font-weight:700;color:' + e.color + '">' + e.icon + ' ' + e.name + '</div>'
         + '<div style="font-size:1.05rem;font-weight:700;color:#e53935;margin:4px 0">' + _fmtM(p.total) + '</div>'
         + '<div style="font-size:.72rem;font-weight:600;color:var(--text2)">'
         + p.count + ' factura' + (p.count > 1 ? 's' : '') + ' pendiente' + (p.count > 1 ? 's' : '')
         + '</div>'
         + '</div>';
  }

  // ── Main render ──
  async function rInicio() {
    var root = document.getElementById('inicio-root');
    if (!root) return;

    var yr = String(new Date().getFullYear());
    var now = new Date();
    var fechaStr = '📅 ' + now.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).replace(/^\w/, function(c) { return c.toUpperCase(); });

    // Per-entity P&L
    var entDs = _ENTS.map(function(e) {
      var d = _entData(e.key, yr);
      return Object.assign({}, e, d);
    });

    // Group totals
    var grpIng    = entDs.reduce(function(s, e) { return s + e.ing; }, 0);
    var grpGas    = entDs.reduce(function(s, e) { return s + e.gas; }, 0);
    var grpMargen = grpIng - grpGas;

    // Group ROI (suma de inversiones registradas vs margen neto)
    var grpInv = _ENTS.reduce(function(s, e) { return s + _inversion(e.cxp); }, 0);
    var grpROI = grpInv > 0
      ? ((grpMargen - grpInv) / grpInv * 100)
      : (grpIng > 0 ? (grpMargen / grpIng * 100) : null);
    var grpROIStr   = grpROI !== null ? (grpROI >= 0 ? '+' : '') + grpROI.toFixed(1) + '%' : '—';
    var grpROIColor = grpROI === null ? 'var(--text2)' : (grpROI >= 0 ? '#00b875' : '#e53935');
    var grpROISub   = grpInv > 0 ? 'vs inversión total' : 'margen / ingresos';

    // ── Build HTML ──
    var h = '';

    // HEADER
    h += '<div style="text-align:center;margin-bottom:24px;padding-top:4px">';
    h += '<div style="font-family:\'Poppins\',sans-serif;font-size:1.25rem;font-weight:700;color:var(--text)">📊 Panel de Control</div>';
    h += '<div style="font-size:.75rem;color:var(--muted);margin-top:4px">' + fechaStr + '</div>';
    h += '</div>';

    // QUICK ACCESS PILLS
    h += '<div style="margin-bottom:24px">';
    h += _sectionLabel('Accesos Rápidos');
    h += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
    h += '<button onclick="navTo(\'resumen\')"  style="' + _pillStyle('#0073ea') + '">💹 Grupo</button>';
    _ENTS.forEach(function(e) {
      h += '<button onclick="navTo(\'' + e.nav + '\')" style="' + _pillStyle(e.color) + '">' + e.icon + ' ' + e.name + '</button>';
    });
    h += '<button onclick="navTo(\'tes_flujo\')" style="' + _pillStyle('#00b875') + '">🏛️ Tesorería</button>';
    h += '<button onclick="navTo(\'cred_dash\')" style="' + _pillStyle('#ff9500') + '">🏦 Créditos</button>';
    h += '</div>';
    h += '</div>';

    // GLOBAL KPIs
    h += '<div style="margin-bottom:24px">';
    h += _sectionLabel('📈 Finanzas Grupo ' + yr);
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">';
    h += _kpiCard('Ingresos Grupo', _fmtM(grpIng),     yr,          '#00b875');
    h += _kpiCard('Gastos Grupo',   _fmtM(grpGas),     yr,          '#e53935');
    h += _kpiCard('Margen Neto',    _fmtMS(grpMargen), yr,          grpMargen >= 0 ? '#00b875' : '#e53935');
    h += _kpiCard('ROI Grupo',      grpROIStr,         grpROISub,   grpROIColor);
    h += '</div>';
    h += '</div>';

    // PER-ENTITY CARDS
    h += '<div style="margin-bottom:24px">';
    h += _sectionLabel('🏢 Rendimiento por Empresa — ' + yr);
    h += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">';
    entDs.forEach(function(e) {
      var inv  = _inversion(e.cxp);
      var roi  = inv > 0 ? ((e.margen - inv) / inv * 100) : null;
      var pend = _cxpPendientes(e.cxp);
      h += _entCard(e, roi, pend);
    });
    h += '</div>';
    h += '</div>';

    // PENDING PAYMENTS
    var pendItems = [];
    _ENTS.forEach(function(e) {
      var p = _cxpPendientes(e.cxp);
      if (p.count > 0) pendItems.push({ e: e, p: p });
    });
    h += '<div style="margin-bottom:24px">';
    h += _sectionLabel('⏳ Cuentas por Pagar Pendientes');
    if (pendItems.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
      pendItems.forEach(function(x) { h += _pendCard(x.e, x.p); });
      h += '</div>';
    } else {
      h += '<div style="text-align:center;padding:16px;color:var(--green);font-size:.75rem;'
         + 'background:var(--green-bg);border-radius:10px">✅ Sin cuentas pendientes</div>';
    }
    h += '</div>';

    // ALERTAS + TAREAS
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-bottom:14px">';

    // Alertas
    h += '<div class="tw">';
    h += '<div class="tw-h"><div class="tw-ht">⚡ Alertas</div></div>';
    h += '<div style="padding:12px" id="inicio-alertas">'
       + '<div style="color:var(--muted);font-size:.72rem;text-align:center;padding:10px">Analizando datos...</div>'
       + '</div>';
    h += '</div>';

    // Tareas
    h += '<div class="tw">';
    h += '<div class="tw-h"><div class="tw-ht">📋 Tareas del Día</div></div>';
    h += '<div style="padding:12px">';
    h += '<div style="display:flex;gap:6px;margin-bottom:10px">';
    h += '<input id="inicio-tarea-input" type="text" placeholder="Nueva tarea..." '
       + 'onkeydown="if(event.key===\'Enter\')addTarea()" '
       + 'style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text)">';
    h += '<button class="btn btn-blue edit-action" style="font-size:.7rem;white-space:nowrap" onclick="addTarea()">+ Agregar</button>';
    h += '</div>';
    h += '<div id="inicio-tareas-body"></div>';
    h += '</div>';
    h += '</div>';

    h += '</div>'; // end alertas+tareas grid

    root.innerHTML = h;

    // Post-render callbacks
    renderTareas();
    _inicioAlertas();
  }

  // ══ ALERTAS ══

  async function _inicioAlertas() {
    var container = document.getElementById('inicio-alertas');
    if (!container) return;
    var alertas = [];

    try {
      // 1. Flujo neto negativo (tesorería)
      var data = typeof tesLoad === 'function' ? tesLoad() : [];
      var mes  = typeof tesCurMonth === 'function' ? tesCurMonth() : '';
      var thisMon = data.filter(function(m) { return (m.fecha || '').substring(0, 7) === mes; });
      var mesIng  = thisMon.filter(function(m) { return m.tipo === 'Ingreso'; }).reduce(function(s, m) { return s + m.monto; }, 0);
      var mesGas  = thisMon.filter(function(m) { return m.tipo === 'Gasto';   }).reduce(function(s, m) { return s + m.monto; }, 0);
      if (mesIng - mesGas < 0)
        alertas.push({ icon: '🔴', text: 'Flujo neto del mes es negativo: ' + (typeof tesFmtSigned === 'function' ? tesFmtSigned(mesIng - mesGas) : _fmtMS(mesIng - mesGas)), color: 'var(--red)', action: "navTo('tes_flujo')" });

      // 2. Sin movimientos de tesorería este mes
      if (thisMon.length === 0 && data.length > 0)
        alertas.push({ icon: '📅', text: 'Sin movimientos de tesorería registrados este mes', color: 'var(--muted)', action: "navTo('tes_flujo')" });

      // 3. Créditos vencidos
      var vencidos = 0;
      if (typeof END_CREDITS !== 'undefined' && Array.isArray(END_CREDITS))
        vencidos += END_CREDITS.filter(function(c) { return c.st === 'Vencido'; }).length;
      if (typeof DYN_CREDITS !== 'undefined' && Array.isArray(DYN_CREDITS))
        vencidos += DYN_CREDITS.filter(function(c) { return c.st === 'Vencido'; }).length;
      if (vencidos > 0)
        alertas.push({ icon: '⚠️', text: vencidos + ' créditos vencidos en cartera', color: 'var(--red)', action: "navTo('cred_cobr')" });

      // 4. Cobranza: pagos vencidos y próximos
      try {
        var allCred = [
          ...(Array.isArray(END_CREDITS) ? END_CREDITS.map(function(c) { return Object.assign({}, c, {_ent:'end'}); }) : []),
          ...(Array.isArray(DYN_CREDITS) ? DYN_CREDITS.map(function(c) { return Object.assign({}, c, {_ent:'dyn'}); }) : [])
        ].filter(function(c) { return c.st === 'Activo' || c.st === 'Vencido'; });

        var pagosProximos = 0, pagosVencidos = 0, montoVencido = 0;
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var in7d  = new Date(today); in7d.setDate(in7d.getDate() + 7);

        allCred.forEach(function(c) {
          if (!c.amort || c.amort.length <= 1) return;
          c.amort.slice(1).forEach(function(r) {
            if (typeof credPeriodStatus !== 'function') return;
            var st = credPeriodStatus(c, r);
            if (st === 'VENCIDO') { pagosVencidos++; montoVencido += (r.pago || 0); }
            else if (st === 'PENDIENTE') {
              var f = typeof credParseDate === 'function' ? credParseDate(r.fecha) : null;
              if (f && f >= today && f <= in7d) pagosProximos++;
            }
          });
        });

        if (pagosProximos > 0)
          alertas.push({ icon: '🔔', text: pagosProximos + ' pagos vencen en los próximos 7 días', color: 'var(--orange)', action: "navTo('cred_cobr')" });
        if (pagosVencidos > 0)
          alertas.push({ icon: '🚨', text: pagosVencidos + ' pagos vencidos por ' + (typeof fmtK === 'function' ? fmtK(montoVencido) : _fmtM(montoVencido)) + ' total', color: 'var(--red)', action: "navTo('cred_cobr')" });
      } catch(e) { console.warn('[Inicio] Cobranza alertas error:', e); }

      // 5. CxP pendientes globales
      var totalCxP = 0, countCxP = 0;
      _ENTS.forEach(function(e) {
        var p = _cxpPendientes(e.cxp);
        totalCxP += p.total;
        countCxP += p.count;
      });
      if (countCxP > 0)
        alertas.push({ icon: '🧾', text: countCxP + ' facturas por pagar · ' + _fmtM(totalCxP) + ' total pendiente', color: '#ff9500', action: "navTo('pp_salem')" });

      // 6. Tickets pendientes de lectura
      try {
        var tkData = DB.get('gf_tickets_pagos_tpv') || [];
        var tkPend = tkData.filter(function(t) { return t.leido === false; }).length;
        if (tkPend > 0)
          alertas.push({ icon: '🎫', text: tkPend + ' ticket' + (tkPend > 1 ? 's' : '') + ' pendiente' + (tkPend > 1 ? 's' : '') + ' de lectura', color: '#9c27b0', action: "navTo('tk_pagos_tpv')" });
      } catch(e) { console.warn('[Inicio] Tickets alertas error:', e); }

    } catch(e) { console.warn('[Inicio] Alertas error:', e); }

    if (alertas.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--green);font-size:.75rem">✅ Todo en orden — sin alertas pendientes</div>';
    } else {
      container.innerHTML = alertas.map(function(a) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:4px;border-radius:8px;cursor:pointer;'
             + 'background:' + a.color + '12;border-left:3px solid ' + a.color + '" onclick="' + a.action + '">'
             + '<span style="font-size:1rem">' + a.icon + '</span>'
             + '<span style="font-size:.72rem;color:var(--text);flex:1">' + a.text + '</span>'
             + '<span style="font-size:.62rem;color:var(--muted)">ver →</span>'
             + '</div>';
      }).join('');
    }
  }

  // ══ TAREAS MANUALES ══

  function _loadTareas() {
    try { var d = DB.get(TAREAS_KEY); return Array.isArray(d) ? d : []; } catch(e) { return []; }
  }

  function _saveTareas(tareas) {
    DB.set(TAREAS_KEY, tareas);
  }

  function addTarea() {
    var input = document.getElementById('inicio-tarea-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    var tareas = _loadTareas();
    tareas.push({ id: Date.now(), text: text, done: false, createdAt: new Date().toISOString() });
    _saveTareas(tareas);
    input.value = '';
    renderTareas();
  }

  function toggleTarea(id) {
    var tareas = _loadTareas();
    var t = tareas.find(function(t) { return t.id === id; });
    if (t) t.done = !t.done;
    _saveTareas(tareas);
    renderTareas();
  }

  function deleteTarea(id) {
    var tareas = _loadTareas().filter(function(t) { return t.id !== id; });
    _saveTareas(tareas);
    renderTareas();
  }

  function renderTareas() {
    var container = document.getElementById('inicio-tareas-body');
    if (!container) return;
    var tareas  = _loadTareas();
    var pending = tareas.filter(function(t) { return !t.done; });
    var done    = tareas.filter(function(t) { return  t.done; });
    var sorted  = pending.concat(done);

    if (sorted.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--muted);font-size:.72rem">Sin tareas pendientes. Agrega una arriba.</div>';
      return;
    }

    container.innerHTML = sorted.map(function(t) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);' + (t.done ? 'opacity:.5' : '') + '">'
           + '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' onchange="toggleTarea(' + t.id + ')" style="cursor:pointer;accent-color:var(--green)">'
           + '<span style="flex:1;font-size:.72rem;' + (t.done ? 'text-decoration:line-through;color:var(--muted)' : 'color:var(--text)') + '">' + t.text + '</span>'
           + (!isViewer() ? '<button onclick="deleteTarea(' + t.id + ')" style="background:none;border:none;cursor:pointer;font-size:.7rem;color:var(--muted);padding:2px 4px" title="Eliminar">✕</button>' : '')
           + '</div>';
    }).join('');
  }

  // Expose globals
  window.TAREAS_KEY       = TAREAS_KEY;
  window.rInicio          = rInicio;
  window._inicioAlertas   = _inicioAlertas;
  window._loadTareas      = _loadTareas;
  window._saveTareas      = _saveTareas;
  window.addTarea         = addTarea;
  window.toggleTarea      = toggleTarea;
  window.deleteTarea      = deleteTarea;
  window.renderTareas     = renderTareas;

  // Register view
  if (typeof registerView === 'function') {
    registerView('inicio', function() { return _syncAll().then(function(){ return rInicio(); }); });
  }

})(window);
