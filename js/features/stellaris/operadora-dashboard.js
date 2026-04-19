// GF — Stellaris: Operadora — Dashboard & Upload
(function(window) {
  'use strict';

  var OP = {}; // chart instances

  // ── HELPERS ──────────────────────────────────────────────────
  function fmtO(n) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    return '$' + Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtOP(p) { return (p * 100).toFixed(1) + '%'; }
  function _kpi(lbl, val, sub, color, ico) {
    return '<div class="kpi-card" style="--ac:' + color + '">' +
      '<div class="kpi-top"><div class="kpi-lbl">' + lbl + '</div><div class="kpi-ico" style="background:rgba(0,0,0,.04);color:' + color + '">' + ico + '</div></div>' +
      '<div class="kpi-val" style="color:' + color + '">' + val + '</div>' +
      '<div class="kpi-d dnu">' + sub + '</div>' +
    '</div>';
  }
  var _MN = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // ── VISTA PRINCIPAL: stel_operadora ──────────────────────────
  function rOperadora() {
    var el = document.getElementById('view-stel_operadora');
    if (!el) return;

    var data = operadoraLoad();
    var reportes  = data.reportes  || [];
    var sesiones  = data.sesiones  || [];
    var nR = reportes.length, nS = sesiones.length;

    if (!nR && !nS) {
      _renderOperadoraVacio(el); return;
    }

    // Sesiones: selector primero
    var sSel = el.querySelector('#op-ses-sel');
    var ses  = nS ? (sesiones[parseInt(sSel && sSel.value) || 0] || sesiones[0]) : null;

    // Fiscal: si hay cargado úsalo; si no, derivar de sesiones automáticamente
    var fSel = el.querySelector('#op-fiscal-sel');
    var fiscal = nR ? (reportes[parseInt(fSel && fSel.value) || 0] || reportes[0]) : null;
    var fiscalDerived = false;
    if (!fiscal && ses) {
      fiscal = deriveFiscalFromSesiones(ses);
      fiscalDerived = true;
    }

    var cross = (fiscal && ses && !fiscalDerived) ? operadoraCrossRef(fiscal, ses) : null;

    var selOptsFiscal = reportes.map(function(r, idx) {
      return '<option value="' + idx + '"' + (idx === 0 ? ' selected' : '') + '>' + escapeHtml(r.mes || 'Reporte ' + (idx+1)) + '</option>';
    }).join('');
    var selOpsSesiones = sesiones.map(function(s, idx) {
      return '<option value="' + idx + '"' + (idx === 0 ? ' selected' : '') + '>' + escapeHtml(s.desde + ' → ' + s.hasta) + '</option>';
    }).join('');

    window._opFiscalCache = fiscal; // para el botón de descarga
    el.innerHTML = _buildOperadoraHtml(fiscal, ses, cross, selOptsFiscal, selOpsSesiones, fiscalDerived);
    _renderOpCharts(fiscal, ses);
  }

  function _renderOperadoraVacio(el) {
    el.innerHTML =
      '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">🏛 Operadora — Reporte Fiscal</div>' +
      '<div style="text-align:center;padding:60px 20px;background:var(--white);border:2px dashed var(--border2);border-radius:var(--r);margin-top:14px">' +
        '<div style="font-size:2.5rem;margin-bottom:12px">📋</div>' +
        '<div style="font-weight:700;font-size:.9rem;margin-bottom:6px">Sin datos cargados</div>' +
        '<div style="font-size:.75rem;color:var(--muted);margin-bottom:20px">Carga el Reporte Fiscal de la Operadora o las Sesiones de Caja para comenzar</div>' +
        '<button class="btn btn-blue" style="font-size:.78rem" onclick="navTo(\'stel_operadora_upload\')">📤 Cargar Reportes</button>' +
      '</div>';
  }

  function _buildOperadoraHtml(fiscal, ses, cross, selFiscal, selSes, fiscalDerived) {
    var ft = fiscal ? fiscal.totales : {};
    var st = ses    ? ses.totales    : {};

    // KPIs from Fiscal report
    var cover      = ft.cover          || 0;
    var l007ent    = ft.l007_entradas  || 0;
    var l007pre    = ft.l007_premios   || 0;
    var l007ing    = ft.l007_ingreso   || 0;
    var retFed     = ft.ret_federal    || 0;
    var retEst     = ft.ret_estatal    || 0;
    var retTot     = ft.ret_total      || 0;
    var ingSala    = ft.ingreso_sala   || (cover + l007ing);
    var comOp10    = ft.comision_operadora_10pct || (l007ing * 0.10);

    // KPIs from Sesiones
    var depJuego   = st.depositoJuego  || 0;
    var acceso     = st.acceso         || 0;
    var promRed    = st.promoRedimible || 0;
    var promNoRed  = st.promoNoRed     || 0;
    var cancelPRed = st.cancelPromoRed || 0;
    var promNetoRed = promRed - cancelPRed;
    var nDiasF = fiscal ? fiscal.nDias : 0;
    var nDiasS = ses ? (ses.porDia || []).length : 0;

    var html = '' +
      // Header + selectors
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">🏛 Operadora — Reporte Fiscal</div>' +
          '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">Grand Play · Stellaris Casino</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
          (selFiscal ? '<select id="op-fiscal-sel" onchange="rOperadora()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif"><option value="">📋 Sin reportes</option>' + selFiscal + '</select>' : '') +
          (selSes    ? '<select id="op-ses-sel" onchange="rOperadora()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif"><option value="">📊 Sin sesiones</option>' + selSes + '</select>' : '') +
          (fiscal ? '<button class="btn btn-blue" style="font-size:.7rem;background:var(--green);border-color:var(--green)" onclick="operadora_generateExcel(' + (fiscal ? 'window._opFiscalCache' : 'null') + ')">⬇ Descargar Reporte Fiscal</button>' : '') +
          '<button class="btn btn-blue edit-action" style="font-size:.7rem" onclick="navTo(\'stel_operadora_upload\')">📤 Actualizar</button>' +
        '</div>' +
      '</div>' +
      (fiscalDerived ? '<div style="margin-bottom:10px;padding:6px 12px;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;font-size:.72rem;color:#b8860b">⚡ Reporte Fiscal <b>calculado automáticamente</b> desde Sesiones de Caja · Retenciones: Federal 1% / Estatal 6% · Split 70/30 mecánico</div>' : '');

    // Tabs: Fiscal | Sesiones de Caja | Validación Cruzada
    var activeTab = 'fiscal'; // default
    html +=
      '<div style="display:flex;gap:2px;margin-bottom:14px;border-bottom:2px solid var(--border);padding-bottom:0">' +
        '<button id="op-tab-fiscal" class="op-tab-btn" onclick="opSwitchTab(\'fiscal\')" style="padding:6px 14px;border:none;background:none;font-family:Figtree,sans-serif;font-size:.75rem;font-weight:700;cursor:pointer;border-bottom:2px solid var(--blue);color:var(--blue);margin-bottom:-2px">📋 Reporte Fiscal</button>' +
        '<button id="op-tab-sesiones" class="op-tab-btn" onclick="opSwitchTab(\'sesiones\')" style="padding:6px 14px;border:none;background:none;font-family:Figtree,sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;color:var(--muted)">🧾 Sesiones de Caja</button>' +
        (cross ? '<button id="op-tab-cross" class="op-tab-btn" onclick="opSwitchTab(\'cross\')" style="padding:6px 14px;border:none;background:none;font-family:Figtree,sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;color:var(--muted)">🔗 Validación Cruzada</button>' : '') +
      '</div>';

    // ── TAB: FISCAL ──
    html += '<div id="op-panel-fiscal">';

    if (fiscal) {
      html +=
        // Período badge
        '<div style="margin-bottom:14px;display:inline-flex;align-items:center;gap:8px">' +
          '<div style="padding:5px 14px;background:var(--purple-bg);border-radius:20px;font-size:.72rem;font-weight:700;color:var(--purple)">📅 ' + escapeHtml(fiscal.mes || '') + ' · ' + nDiasF + ' días con operación</div>' +
        '</div>' +

        // KPI row 1: ingresos
        '<div class="kpi-row" style="margin-bottom:10px">' +
          _kpi('Cover (Acceso)',      fmtO(cover),   'Entrada a instalaciones',          '#0073ea', '🚪') +
          _kpi('L007 Entradas',       fmtO(l007ent), 'Terminales electrónicas',          '#00b875', '🎰') +
          _kpi('L007 Pago Premios',   fmtO(l007pre), 'Premios pagados a jugadores',      '#ff7043', '🏆') +
          _kpi('L007 Ingreso Final',  fmtO(l007ing), 'Entradas − Salidas terminales',    'var(--green)', '💰') +
        '</div>' +

        // KPI row 2: retenciones y operadora
        '<div class="kpi-row" style="margin-bottom:14px">' +
          _kpi('Retención Federal 1%', fmtO(retFed), 'Sobre premios pagados (todos)',     'var(--red)',    '🏛') +
          _kpi('Retención Estatal 6%', fmtO(retEst), 'Sobre premios pagados (todos)',     '#e53935',      '🏛') +
          _kpi('Total Retenciones',    fmtO(retTot), 'Federal + Estatal a enterar',       'var(--orange)', '📋') +
          _kpi('Comisión Operadora 10%', fmtO(comOp10), '10% del Ingreso Final L007 + IVA', '#9b51e0',    '🤝') +
        '</div>' +

        // Chart
        '<div style="display:grid;grid-template-columns:1fr 260px;gap:12px;margin-bottom:14px">' +
          '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">' +
            '<div style="font-size:.75rem;font-weight:700;margin-bottom:10px">Evolución Diaria — Entradas vs Premios vs Ingreso</div>' +
            '<div style="position:relative;height:200px"><canvas id="op-chart-line"></canvas></div>' +
          '</div>' +
          '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">' +
            '<div style="font-size:.75rem;font-weight:700;margin-bottom:12px">Mix de Ingresos</div>' +
            '<div style="position:relative;height:200px"><canvas id="op-chart-donut"></canvas></div>' +
          '</div>' +
        '</div>' +

        // Tabla por día
        '<div class="tw">' +
          '<div class="tw-h"><div class="tw-ht">Detalle por Día</div><div style="font-size:.68rem;color:var(--muted)">Montos en MXN</div></div>' +
          '<div style="overflow-x:auto"><table class="bt" style="font-size:.72rem">' +
            '<thead><tr><th>Día</th><th class="r">Cover</th><th class="r">L007 Entradas</th><th class="r">L007 Premios</th><th class="r">Ingreso Final</th><th class="r" style="color:var(--red)">Ret. Federal</th><th class="r" style="color:var(--red)">Ret. Estatal</th></tr></thead>' +
            '<tbody>' + _fiscalDiasRows(fiscal) + '</tbody>' +
          '</table></div>' +
        '</div>';

    } else {
      html += '<div style="padding:24px;text-align:center;color:var(--muted);font-size:.8rem">Sin reporte fiscal cargado · <button class="btn btn-blue" style="font-size:.7rem" onclick="navTo(\'stel_operadora_upload\')">Cargar ahora</button></div>';
    }

    html += '</div>'; // end panel fiscal

    // ── TAB: SESIONES ──
    html += '<div id="op-panel-sesiones" style="display:none">';

    if (ses) {
      html +=
        '<div style="margin-bottom:14px;display:inline-flex;align-items:center;gap:8px">' +
          '<div style="padding:5px 14px;background:var(--green-bg);border-radius:20px;font-size:.72rem;font-weight:700;color:var(--green)">📅 ' + escapeHtml(ses.desde) + ' → ' + escapeHtml(ses.hasta) + ' · ' + ses.nSesiones + ' sesiones · ' + nDiasS + ' días</div>' +
        '</div>' +

        '<div class="kpi-row" style="margin-bottom:10px">' +
          _kpi('Depósito de Juego', fmtO(depJuego),    'Fichas compradas por jugadores', '#0073ea', '🎰') +
          _kpi('Acceso (Cover)',    fmtO(acceso),       'Entrada a instalaciones',        '#00b875', '🚪') +
          _kpi('Premios Pagados',  fmtO(st.premios||0), 'Pagos a jugadores en caja',     '#ff7043', '🏆') +
          _kpi('Retención',        fmtO(st.retencion||0),'Ret. sobre premios (caja)',    'var(--red)',  '🏛') +
        '</div>' +
        '<div class="kpi-row" style="margin-bottom:14px">' +
          _kpi('Promo Redimible',    fmtO(promRed),    'Fichas/chips promocionales',     '#9b51e0',  '🎁') +
          _kpi('Promo No Redimible', fmtO(promNoRed),  'Créditos de marketing',          '#7b5ea7',  '📢') +
          _kpi('Cancelación Promo',  fmtO(cancelPRed), 'Promos redimibles canceladas',   'var(--orange)', '↩') +
          _kpi('Promo Neta Red.',    fmtO(promNetoRed),'Redimible − Cancelaciones',      promNetoRed >= 0 ? 'var(--green)' : 'var(--red)', '📊') +
        '</div>' +

        '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:14px">' +
          '<div style="font-size:.75rem;font-weight:700;margin-bottom:10px">Evolución Diaria — Sesiones de Caja</div>' +
          '<div style="position:relative;height:180px"><canvas id="op-chart-ses"></canvas></div>' +
        '</div>' +

        '<div class="tw">' +
          '<div class="tw-h"><div class="tw-ht">Detalle por Día</div></div>' +
          '<div style="overflow-x:auto"><table class="bt" style="font-size:.72rem">' +
            '<thead><tr><th>Fecha</th><th class="r">Sesiones</th><th class="r">Dep. Juego</th><th class="r">Acceso</th><th class="r">Premios</th><th class="r">Retención</th><th class="r">Promo Red.</th><th class="r">Promo No Red.</th></tr></thead>' +
            '<tbody>' + _sesionesDiasRows(ses) + '</tbody>' +
          '</table></div>' +
        '</div>';

    } else {
      html += '<div style="padding:24px;text-align:center;color:var(--muted);font-size:.8rem">Sin sesiones de caja cargadas · <button class="btn btn-blue" style="font-size:.7rem" onclick="navTo(\'stel_operadora_upload\')">Cargar ahora</button></div>';
    }

    html += '</div>'; // end panel sesiones

    // ── TAB: VALIDACIÓN CRUZADA ──
    html += '<div id="op-panel-cross" style="display:none">';
    if (cross) {
      html += _buildCrossRef(cross, fiscal, ses);
    }
    html += '</div>';

    return html;
  }

  function _fiscalDiasRows(fiscal) {
    var dias = (fiscal.dias || []);
    return dias.map(function(d) {
      var retD = d.ret_fed70 + d.ret_fed_30x70 + d.ret_fed30;
      var retE = d.ret_est70 + d.ret_est_30x70 + d.ret_est30;
      return '<tr>' +
        '<td class="bld">DÍA ' + String(d.dia).padStart(2, '0') + '</td>' +
        '<td class="r mo">' + (d.cover > 0 ? fmtO(d.cover) : '<span style="color:var(--muted)">—</span>') + '</td>' +
        '<td class="r mo pos">' + fmtO(d.l007_entradas) + '</td>' +
        '<td class="r mo" style="color:var(--orange)">' + fmtO(d.l007_premios) + '</td>' +
        '<td class="r mo bld pos">' + fmtO(d.l007_ingreso) + '</td>' +
        '<td class="r" style="color:var(--red)">' + fmtO(retD) + '</td>' +
        '<td class="r" style="color:var(--red)">' + fmtO(retE) + '</td>' +
      '</tr>';
    }).join('') +
    '<tr style="font-weight:800;background:var(--blue-bg)">' +
      '<td>TOTAL</td>' +
      '<td class="r mo">' + fmtO(fiscal.totales.cover) + '</td>' +
      '<td class="r mo pos">' + fmtO(fiscal.totales.l007_entradas) + '</td>' +
      '<td class="r mo" style="color:var(--orange)">' + fmtO(fiscal.totales.l007_premios) + '</td>' +
      '<td class="r mo bld pos">' + fmtO(fiscal.totales.l007_ingreso) + '</td>' +
      '<td class="r" style="color:var(--red)">' + fmtO(fiscal.totales.ret_federal) + '</td>' +
      '<td class="r" style="color:var(--red)">' + fmtO(fiscal.totales.ret_estatal) + '</td>' +
    '</tr>';
  }

  function _sesionesDiasRows(ses) {
    var dias = (ses.porDia || []);
    return dias.map(function(d) {
      var dateLabel = d.fecha ? d.fecha.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1') : '—';
      return '<tr>' +
        '<td class="bld">' + dateLabel + '</td>' +
        '<td class="r">' + d.nSesiones + '</td>' +
        '<td class="r mo pos">' + fmtO(d.depositoJuego) + '</td>' +
        '<td class="r mo">' + fmtO(d.acceso) + '</td>' +
        '<td class="r mo" style="color:var(--orange)">' + fmtO(d.premios) + '</td>' +
        '<td class="r" style="color:var(--red)">' + fmtO(d.retencion) + '</td>' +
        '<td class="r" style="color:var(--purple)">' + fmtO(d.promoRedimible) + '</td>' +
        '<td class="r" style="color:var(--muted)">' + fmtO(d.promoNoRed) + '</td>' +
      '</tr>';
    }).join('') +
    '<tr style="font-weight:800;background:var(--blue-bg)">' +
      '<td>TOTAL</td>' +
      '<td class="r">' + ses.nSesiones + '</td>' +
      '<td class="r mo pos">' + fmtO(ses.totales.depositoJuego) + '</td>' +
      '<td class="r mo">' + fmtO(ses.totales.acceso) + '</td>' +
      '<td class="r mo" style="color:var(--orange)">' + fmtO(ses.totales.premios) + '</td>' +
      '<td class="r" style="color:var(--red)">' + fmtO(ses.totales.retencion) + '</td>' +
      '<td class="r" style="color:var(--purple)">' + fmtO(ses.totales.promoRedimible) + '</td>' +
      '<td class="r" style="color:var(--muted)">' + fmtO(ses.totales.promoNoRed) + '</td>' +
    '</tr>';
  }

  function _buildCrossRef(cross, fiscal, ses) {
    function pill(ok) {
      return ok ? '<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Cuadra</span>'
                : '<span class="pill" style="background:var(--red-lt);color:#b02020">⚠ Diferencia</span>';
    }
    return '<div style="margin-bottom:14px">' +
      '<div style="font-weight:700;font-size:.82rem;margin-bottom:10px">🔗 Validación Reporte Fiscal vs Sesiones de Caja</div>' +
      '<div class="tw"><div style="overflow-x:auto"><table class="bt">' +
        '<thead><tr><th>Concepto</th><th class="r">Reporte Fiscal</th><th class="r">Sesiones de Caja</th><th class="r">Diferencia</th><th>Estado</th></tr></thead>' +
        '<tbody>' +
          '<tr>' +
            '<td>Entradas (Cover + L007)</td>' +
            '<td class="r mo">' + fmtO((fiscal.totales.cover||0) + (fiscal.totales.l007_entradas||0)) + '</td>' +
            '<td class="r mo">' + fmtO((ses.totales.depositoJuego||0) + (ses.totales.acceso||0)) + '</td>' +
            '<td class="r ' + (Math.abs(cross.diff_entradas) < 100 ? '' : 'neg') + '">' + fmtO(cross.diff_entradas) + '</td>' +
            '<td>' + pill(cross.ok_entradas) + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td>Premios Pagados</td>' +
            '<td class="r mo">' + fmtO(fiscal.totales.l007_premios||0) + '</td>' +
            '<td class="r mo">' + fmtO(ses.totales.premios||0) + '</td>' +
            '<td class="r ' + (Math.abs(cross.diff_premios) < 100 ? '' : 'neg') + '">' + fmtO(cross.diff_premios) + '</td>' +
            '<td>' + pill(cross.ok_premios) + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td>Retenciones</td>' +
            '<td class="r mo">' + fmtO(fiscal.totales.ret_total||0) + '</td>' +
            '<td class="r mo">' + fmtO(ses.totales.retencion||0) + '</td>' +
            '<td class="r ' + (Math.abs(cross.diff_ret) < 100 ? '' : 'neg') + '">' + fmtO(cross.diff_ret) + '</td>' +
            '<td>' + pill(cross.ok_ret) + '</td>' +
          '</tr>' +
        '</tbody>' +
      '</table></div></div>' +
      '<div style="margin-top:10px;padding:8px 14px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--blue)">ℹ Una diferencia menor a $100 MXN se considera cuadrada (redondeos del sistema)</div>' +
    '</div>';
  }

  function _renderOpCharts(fiscal, ses) {
    // Chart 1: Evolución diaria fiscal (line)
    var ctx1 = document.getElementById('op-chart-line');
    if (ctx1 && fiscal && typeof Chart !== 'undefined') {
      if (OP.line) { OP.line.destroy(); OP.line = null; }
      var dias = fiscal.dias || [];
      OP.line = new Chart(ctx1.getContext('2d'), {
        type: 'bar',
        data: {
          labels: dias.map(function(d){ return 'D' + String(d.dia).padStart(2,'0'); }),
          datasets: [
            { label:'Entradas',     data: dias.map(function(d){ return d.l007_entradas; }),   backgroundColor:'rgba(0,115,234,.5)', borderRadius: 3 },
            { label:'Cover',        data: dias.map(function(d){ return d.cover; }),            backgroundColor:'rgba(0,184,117,.5)', borderRadius: 3 },
            { label:'Premios',      data: dias.map(function(d){ return d.l007_premios; }),     backgroundColor:'rgba(255,112,67,.5)', borderRadius: 3 },
            { type:'line', label:'Ingreso Final', data: dias.map(function(d){ return d.l007_ingreso; }), borderColor:'#9b51e0', backgroundColor:'transparent', pointRadius: 3, tension: 0.3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { size: 9, family:'Figtree' }, boxWidth: 10 } },
                     tooltip: { callbacks: { label: function(c){ return ' ' + c.dataset.label + ': ' + fmtO(c.raw); } } } },
          scales: {
            x: { ticks: { font: { size: 8 }, maxRotation: 0 } },
            y: { ticks: { font: { size: 9 }, callback: function(v){ return '$' + (v/1000).toFixed(0) + 'K'; } } }
          }
        }
      });
    }

    // Chart 2: Donut mix ingresos
    var ctx2 = document.getElementById('op-chart-donut');
    if (ctx2 && fiscal && typeof Chart !== 'undefined') {
      if (OP.donut) { OP.donut.destroy(); OP.donut = null; }
      var ft = fiscal.totales;
      var donutData = [ft.cover||0, ft.l007_ingreso||0, ft.l002_resultado||0, ft.l003_resultado||0, ft.l005_resultado||0, ft.l006_resultado||0];
      var donutLabels = ['Cover','L007 Terminales','L002 Carreras','L003 Deportivas','L005 Bingo','L006 Mesas'];
      var donutColors = ['#00b875','#0073ea','#7b5ea7','#f39c12','#e74c3c','#9b51e0'];
      // Filter zeros
      var filtered = donutLabels.reduce(function(acc, l, i){ if (donutData[i] > 0) { acc.labels.push(l); acc.data.push(donutData[i]); acc.colors.push(donutColors[i]); } return acc; }, { labels:[], data:[], colors:[] });

      OP.donut = new Chart(ctx2.getContext('2d'), {
        type: 'doughnut',
        data: { labels: filtered.labels, datasets: [{ data: filtered.data, backgroundColor: filtered.colors, borderWidth: 2, borderColor: 'var(--bg)' }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 9, family:'Figtree' }, boxWidth: 10, padding: 6 } },
                     tooltip: { callbacks: { label: function(c){ return ' ' + c.label + ': ' + fmtO(c.raw); } } } }
        }
      });
    }

    // Chart 3: Sesiones diarias (bar)
    var ctx3 = document.getElementById('op-chart-ses');
    if (ctx3 && ses && typeof Chart !== 'undefined') {
      if (OP.ses) { OP.ses.destroy(); OP.ses = null; }
      var porDia = ses.porDia || [];
      OP.ses = new Chart(ctx3.getContext('2d'), {
        type: 'bar',
        data: {
          labels: porDia.map(function(d){ return d.fecha ? d.fecha.slice(8) + '/' + d.fecha.slice(5,7) : ''; }),
          datasets: [
            { label:'Dep. Juego', data: porDia.map(function(d){ return d.depositoJuego; }), backgroundColor:'rgba(0,115,234,.6)', borderRadius:3 },
            { label:'Cover',      data: porDia.map(function(d){ return d.acceso; }),        backgroundColor:'rgba(0,184,117,.6)', borderRadius:3 },
            { label:'Premios',    data: porDia.map(function(d){ return d.premios; }),        backgroundColor:'rgba(255,112,67,.5)', borderRadius:3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { size: 9, family:'Figtree' }, boxWidth: 10 } },
                     tooltip: { callbacks: { label: function(c){ return ' ' + c.dataset.label + ': ' + fmtO(c.raw); } } } },
          scales: {
            x: { ticks: { font: { size: 8 } } },
            y: { stacked: false, ticks: { font: { size: 9 }, callback: function(v){ return '$' + (v/1000).toFixed(0) + 'K'; } } }
          }
        }
      });
    }
  }

  // Tab switcher (global)
  window.opSwitchTab = function(tab) {
    ['fiscal','sesiones','cross'].forEach(function(t) {
      var panel = document.getElementById('op-panel-' + t);
      var btn   = document.getElementById('op-tab-' + t);
      if (panel) panel.style.display = (t === tab) ? '' : 'none';
      if (btn) {
        if (t === tab) {
          btn.style.borderBottom = '2px solid var(--blue)'; btn.style.color = 'var(--blue)'; btn.style.fontWeight = '700';
        } else {
          btn.style.borderBottom = 'none'; btn.style.color = 'var(--muted)'; btn.style.fontWeight = '600';
        }
      }
    });
    // Render charts when switching (canvas may not have been visible on init)
    var data = operadoraLoad();
    if (tab === 'fiscal')   _renderOpCharts(data.reportes[0] || null, null);
    if (tab === 'sesiones') _renderOpCharts(null, data.sesiones[0] || null);
  };

  // ── VISTA UPLOAD: stel_operadora_upload ───────────────────────
  function rOperadoraUpload() {
    var el = document.getElementById('view-stel_operadora_upload');
    if (!el) return;

    var data = operadoraLoad();
    var nR = (data.reportes || []).length;
    var nS = (data.sesiones || []).length;
    var lastR = nR ? data.reportes[0] : null;
    var lastS = nS ? data.sesiones[0] : null;

    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">📤 Cargar Reportes — Operadora</div>' +
        ((nR || nS) ? '<button onclick="op_clearAll()" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:4px 10px;font-size:.7rem;cursor:pointer;font-family:inherit">🗑 Limpiar todo</button>' : '') +
      '</div>' +
      '<div style="font-size:.68rem;color:var(--muted);margin-bottom:14px">El sistema detecta automáticamente si el Excel es el Reporte Fiscal o las Sesiones de Caja.</div>' +

      '<div class="kpi-row c4" style="margin-bottom:14px">' +
        '<div class="kpi-card" style="--ac:#9b51e0"><div class="kpi-top"><div class="kpi-lbl">Reportes Fiscales</div><div class="kpi-ico" style="background:var(--purple-bg);color:#9b51e0">📋</div></div><div class="kpi-val" style="color:#9b51e0">' + nR + '</div><div class="kpi-d dnu">' + (lastR ? 'Último: ' + lastR.mes : 'Sin datos') + '</div></div>' +
        '<div class="kpi-card" style="--ac:var(--blue)"><div class="kpi-top"><div class="kpi-lbl">Sesiones de Caja</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">🧾</div></div><div class="kpi-val" style="color:var(--blue)">' + nS + '</div><div class="kpi-d dnu">' + (lastS ? lastS.desde + ' → ' + lastS.hasta : 'Sin datos') + '</div></div>' +
      '</div>' +

      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">📎 Subir Archivo</div></div>' +
        '<div style="padding:16px">' +
          '<div id="op-dropzone" style="border:2px dashed var(--purple);border-radius:var(--r);padding:36px 20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--purple-bg)">' +
            '<div style="font-size:2rem;margin-bottom:8px">📋</div>' +
            '<div style="font-size:.82rem;font-weight:700;color:#9b51e0;margin-bottom:4px">Arrastra el Excel aquí o haz clic para seleccionar</div>' +
            '<div style="font-size:.7rem;color:var(--muted)">Reporte Fiscal Mensual <b>ó</b> Sesiones de Caja — se detecta automáticamente</div>' +
            '<input type="file" id="op-file-input" accept=".xlsx,.xls" style="display:none">' +
          '</div>' +
          '<div id="op-status"  style="display:none;margin-top:10px;padding:10px 14px;border-radius:var(--r);font-size:.78rem"></div>' +
          '<div id="op-preview" style="display:none;margin-top:10px"></div>' +
          '<button id="op-save-btn" style="display:none;margin-top:10px" class="btn btn-blue" onclick="op_confirmSave()">✅ Guardar Reporte</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        // Historial Fiscales
        '<div class="tw">' +
          '<div class="tw-h"><div class="tw-ht">📋 Reportes Fiscales</div></div>' +
          '<div style="overflow-x:auto"><table class="bt"><thead><tr><th>Mes</th><th class="r">Ingreso Final</th><th class="r">Ret. Total</th><th>Subido</th><th></th></tr></thead>' +
          '<tbody>' + _opHistFiscal(data.reportes) + '</tbody></table></div>' +
        '</div>' +
        // Historial Sesiones
        '<div class="tw">' +
          '<div class="tw-h"><div class="tw-ht">🧾 Sesiones de Caja</div></div>' +
          '<div style="overflow-x:auto"><table class="bt"><thead><tr><th>Período</th><th class="r">Sesiones</th><th class="r">Dep. Juego</th><th>Subido</th><th></th></tr></thead>' +
          '<tbody>' + _opHistSesiones(data.sesiones) + '</tbody></table></div>' +
        '</div>' +
      '</div>';

    // Wire events
    var dz = document.getElementById('op-dropzone');
    var fi = document.getElementById('op-file-input');
    if (dz) {
      dz.onclick = function() { if (fi) fi.click(); };
      dz.ondragover = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-bg)'; };
      dz.ondragleave = function() { dz.style.borderColor = 'var(--purple)'; dz.style.background = 'var(--purple-bg)'; };
      dz.ondrop = function(e) {
        e.preventDefault(); dz.style.borderColor = 'var(--purple)'; dz.style.background = 'var(--purple-bg)';
        var f = e.dataTransfer.files[0]; if (f) op_handleFile(f);
      };
    }
    if (fi) fi.onchange = function() { if (fi.files[0]) op_handleFile(fi.files[0]); };
  }

  function _opHistFiscal(reportes) {
    if (!reportes.length) return '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin reportes</td></tr>';
    return reportes.map(function(r) {
      return '<tr><td class="bld">' + escapeHtml(r.mes||'—') + '</td>' +
        '<td class="r mo pos">' + fmtO((r.totales||{}).l007_ingreso||0) + '</td>' +
        '<td class="r" style="color:var(--red)">' + fmtO((r.totales||{}).ret_total||0) + '</td>' +
        '<td style="font-size:.68rem;color:var(--muted)">' + (r.uploadedAt||'') + '</td>' +
        '<td><button onclick="op_deleteReporte(\'fiscal\',' + r.id + ')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.75rem">🗑</button></td>' +
      '</tr>';
    }).join('');
  }

  function _opHistSesiones(sesiones) {
    if (!sesiones.length) return '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin sesiones</td></tr>';
    return sesiones.map(function(s) {
      return '<tr><td class="bld">' + escapeHtml(s.desde + ' → ' + s.hasta) + '</td>' +
        '<td class="r">' + (s.nSesiones||0) + '</td>' +
        '<td class="r mo pos">' + fmtO((s.totales||{}).depositoJuego||0) + '</td>' +
        '<td style="font-size:.68rem;color:var(--muted)">' + (s.uploadedAt||'') + '</td>' +
        '<td><button onclick="op_deleteReporte(\'sesiones\',' + s.id + ')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.75rem">🗑</button></td>' +
      '</tr>';
    }).join('');
  }

  // ── UPLOAD LOGIC ──────────────────────────────────────────────
  var _op_parsed = null;

  function op_handleFile(file) {
    var st  = document.getElementById('op-status');
    var prv = document.getElementById('op-preview');
    var btn = document.getElementById('op-save-btn');
    if (!st) return;
    st.style.display = ''; st.style.background = 'var(--blue-bg)'; st.style.color = 'var(--blue)';
    st.innerHTML = '⏳ Procesando <b>' + escapeHtml(file.name) + '</b>...';
    if (prv) prv.style.display = 'none';
    if (btn) btn.style.display = 'none';
    _op_parsed = null;

    if (typeof XLSX === 'undefined') { st.style.background = 'var(--red-lt)'; st.style.color = 'var(--red)'; st.innerHTML = '⚠ Librería XLSX no disponible'; return; }

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        var tipo = detectOperadoraTipo(wb);
        var parsed = null;

        if (tipo === 'fiscal') {
          parsed = parseReporteFiscal(wb);
        } else if (tipo === 'sesiones') {
          parsed = parseSesionesCaja(wb);
        }

        if (!parsed) {
          st.style.background = 'var(--red-lt)'; st.style.color = 'var(--red)';
          st.innerHTML = '⚠ No se pudo identificar el tipo de reporte.<br><span style="font-size:.7rem">Archivos válidos: Reporte Fiscal (REPORTE OPERADORA) o Sesiones de Caja</span>';
          return;
        }

        _op_parsed = parsed;
        st.style.background = 'var(--green-bg)'; st.style.color = 'var(--green)';
        st.innerHTML = '✅ ' + (tipo === 'fiscal' ? '📋 Reporte Fiscal — ' + (parsed.mes||'') + ' · ' + parsed.nDias + ' días' :
                                                    '🧾 Sesiones de Caja — ' + parsed.desde + ' → ' + parsed.hasta + ' · ' + parsed.nSesiones + ' sesiones');

        // Preview
        if (prv) { prv.style.display = ''; prv.innerHTML = _opPreview(parsed); }
        if (btn) btn.style.display = '';

      } catch(err) {
        st.style.background = 'var(--red-lt)'; st.style.color = 'var(--red)';
        st.innerHTML = '⚠ Error al procesar: ' + escapeHtml(String(err.message || err));
        console.warn('[Operadora] parse error:', err);
      }
    };
    reader.onerror = function() { st.style.background = 'var(--red-lt)'; st.style.color = 'var(--red)'; st.innerHTML = '⚠ Error al leer el archivo.'; };
    reader.readAsArrayBuffer(file);
  }

  function _opPreview(p) {
    var rows = '';
    if (p.tipo === 'fiscal') {
      var ft = p.totales || {};
      rows = [
        ['Cover (Acceso)', ft.cover||0],
        ['L007 Entradas (Terminales)', ft.l007_entradas||0],
        ['L007 Premios Pagados', ft.l007_premios||0],
        ['L007 Ingreso Final', ft.l007_ingreso||0],
        ['Retención Federal', ft.ret_federal||0],
        ['Retención Estatal', ft.ret_estatal||0],
        ['Retención Total', ft.ret_total||0],
        ['Ingreso Sala Total', ft.ingreso_sala||0]
      ].map(function(r){ return '<tr><td>' + r[0] + '</td><td class="r mo bld">' + fmtO(r[1]) + '</td></tr>'; }).join('');
    } else {
      var st = p.totales || {};
      rows = [
        ['Depósito de Juego',   st.depositoJuego||0],
        ['Acceso (Cover)',      st.acceso||0],
        ['Premios Pagados',     st.premios||0],
        ['Retención Premios',   st.retencion||0],
        ['Promo Redimible',     st.promoRedimible||0],
        ['Promo No Redimible',  st.promoNoRed||0]
      ].map(function(r){ return '<tr><td>' + r[0] + '</td><td class="r mo bld">' + fmtO(r[1]) + '</td></tr>'; }).join('');
    }
    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:14px">' +
      '<div style="font-weight:700;font-size:.8rem;margin-bottom:8px">👁 Vista previa — ' + escapeHtml(p.mes || (p.desde + ' → ' + p.hasta)) + '</div>' +
      '<table class="bt" style="font-size:.75rem"><tbody>' + rows + '</tbody></table>' +
    '</div>';
  }

  function op_confirmSave() {
    if (!_op_parsed) { toast('⚠ No hay datos para guardar'); return; }
    try {
      operadora_saveReporte(_op_parsed);
      var msg = _op_parsed.tipo === 'fiscal'
        ? '✅ Reporte Fiscal guardado: ' + (_op_parsed.mes||'')
        : '✅ Sesiones guardadas: ' + _op_parsed.desde + ' → ' + _op_parsed.hasta;
      toast(msg);
      _op_parsed = null;
      rOperadoraUpload();
    } catch(err) {
      toast('⚠ Error al guardar: ' + (err.message || err));
      console.warn('[Operadora] save error:', err);
    }
  }

  function op_clearAll() {
    if (!confirm('¿Eliminar TODOS los reportes y sesiones cargados y empezar de cero?')) return;
    operadora_save({ reportes: [], sesiones: [] });
    toast('🗑 Datos limpiados');
    rOperadoraUpload();
  }

  function op_deleteReporte(tipo, id) {
    if (!confirm('¿Eliminar este reporte?')) return;
    var data = operadoraLoad();
    if (tipo === 'fiscal')   data.reportes = data.reportes.filter(function(r){ return r.id !== id; });
    if (tipo === 'sesiones') data.sesiones = data.sesiones.filter(function(s){ return s.id !== id; });
    operadora_save(data);
    toast('🗑 Reporte eliminado');
    rOperadoraUpload();
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  window.rOperadora        = rOperadora;
  window.rOperadoraUpload  = rOperadoraUpload;
  window.op_handleFile     = op_handleFile;
  window.op_confirmSave    = op_confirmSave;
  window.op_deleteReporte  = op_deleteReporte;
  window.op_clearAll       = op_clearAll;

  if (typeof registerView === 'function') {
    registerView('stel_operadora',        function(){ rOperadora(); });
    registerView('stel_operadora_upload', function(){ rOperadoraUpload(); });
  }

})(window);
