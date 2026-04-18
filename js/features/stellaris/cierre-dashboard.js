// GF — Stellaris: Cierre Maquineros — Dashboard & Acumulado
(function(window) {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────
  var C = {}; // chart instances
  function fmtC(n) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    return '$' + Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPctC(p) { return (p * 100).toFixed(0) + '%'; }
  function _ymLabel(ym) {
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var p = ym.split('-');
    return months[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function _pctBar(pct, color) {
    var w = Math.min(100, Math.max(0, pct * 100)).toFixed(0);
    return '<div style="height:4px;background:var(--border);border-radius:2px;margin-top:5px">' +
           '<div style="height:100%;width:' + w + '%;background:' + (color||'var(--blue)') + ';border-radius:2px;transition:width .4s"></div></div>';
  }
  function _provColor(prov) {
    var colMap = { Merkur:'#7b5ea7', Zitro:'#e74c3c', EGT:'#0073ea', Ortiz:'#00b875', AGS:'#ff7043', FBM:'#f39c12', Operadora:'#9b51e0' };
    return colMap[prov] || '#8b95a5';
  }

  // ────────────────────────────────────────────────────────────────
  // VISTA: ANÁLISIS CORTE — stel_cierre_maquineros
  // ────────────────────────────────────────────────────────────────
  function rCierreMaquineros() {
    var el = document.getElementById('view-stel_cierre_maquineros');
    if (!el) return;

    var data = cierreLoad();
    var cortes = data.cortes || [];

    if (!cortes.length) {
      _renderCierreVacio(el);
      return;
    }

    // Selector de corte activo
    var sel = el.querySelector('#cierre-corte-sel');
    var activeId = sel ? parseInt(sel.value) : null;
    var corte = activeId ? cortes.find(function(c){ return c.id === activeId; }) : cortes[0];
    if (!corte) corte = cortes[0];
    var kpis = corte.kpis || {};

    el.innerHTML = _buildCierreDashboard(cortes, corte, kpis);
    _bindCierreDashboard(el, cortes);
    _renderCierreChart(kpis);
  }

  function _renderCierreVacio(el) {
    el.innerHTML =
      '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">🎰 Análisis Maquineros — Reportes Cierre</div>' +
      '<div style="font-size:.68rem;color:var(--muted);margin-bottom:20px">Sube el reporte Excel de máquinas para comenzar el análisis</div>' +
      '<div style="text-align:center;padding:60px 20px;background:var(--white);border:2px dashed var(--border2);border-radius:var(--r)">' +
        '<div style="font-size:2.5rem;margin-bottom:12px">📊</div>' +
        '<div style="font-weight:700;font-size:.9rem;margin-bottom:6px">Sin datos cargados</div>' +
        '<div style="font-size:.75rem;color:var(--muted);margin-bottom:20px">Carga el reporte mensual de máquinas para ver el análisis de comisiones</div>' +
        '<button class="btn btn-blue" style="font-size:.78rem" onclick="navTo(\'stel_cierre_upload\')">📤 Cargar Reporte de Máquinas</button>' +
      '</div>';
  }

  function _buildCierreDashboard(cortes, corte, kpis) {
    var nt  = kpis.netwinTotal        || 0;
    var cmb = kpis.totalComBase       || 0;
    var cmi = kpis.totalComIva        || 0;
    var cmt = kpis.totalComMaquineros || 0;
    var cop = kpis.comOperadora       || {};
    var neo = kpis.netoStellaris      || 0;
    var prvs = kpis.proveedorItems    || [];
    var sinT = kpis.sinTasa           || [];

    var totalPagos = cmt + (cop.total || 0);
    var neoPct = nt > 0 ? neo / nt : 0;

    // Opciones de selector de corte
    var corteOpts = cortes.map(function(c) {
      return '<option value="' + c.id + '"' + (c.id === corte.id ? ' selected' : '') + '>' +
             escapeHtml(c.desde + ' → ' + c.hasta) + '</option>';
    }).join('');

    // Filas de proveedores
    var provRows = prvs.map(function(p) {
      var col = _provColor(p.proveedor);
      var pctNw = nt > 0 ? p.netwin / nt : 0;
      return '<tr>' +
        '<td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';margin-right:6px"></span><b>' + escapeHtml(p.proveedor) + '</b></td>' +
        '<td class="r">' + p.nMaquinas + '</td>' +
        '<td class="r mo">' + fmtC(p.netwin) + _pctBar(pctNw, col) + '</td>' +
        '<td class="r" style="color:var(--muted);font-size:.72rem">' + p.grupos.map(function(g){ return g.tipo + ' ' + fmtPctC(g.pct); }).join('<br>') + '</td>' +
        '<td class="r mo">' + fmtC(p.comBase) + '</td>' +
        '<td class="r mo" style="color:var(--muted)">' + fmtC(p.iva) + '</td>' +
        '<td class="r mo bld" style="color:' + col + '">' + fmtC(p.total) + '</td>' +
      '</tr>';
    }).join('');

    // Tabla detalle máquinas (para expandible)
    var data = cierreLoad();
    var tasas = data.tasas && data.tasas.length ? data.tasas : DEFAULT_TASAS;
    var maqRows = (corte.maquinas || []).map(function(m) {
      var t = cierreMatchTasa(m.nombre, m.fabricante, tasas);
      var comBase = t ? Math.max(0, m.netwin) * t.pct : null;
      var col = t ? _provColor(t.proveedor) : 'var(--muted)';
      return '<tr>' +
        '<td style="font-size:.72rem;font-family:monospace">' + escapeHtml(m.nombre) + '</td>' +
        '<td>' + escapeHtml(m.fabricante) + '</td>' +
        '<td class="r mo" style="font-size:.72rem">' + fmtC(m.coinIn) + '</td>' +
        '<td class="r mo ' + (m.netwin < 0 ? 'neg' : 'pos') + '">' + fmtC(m.netwin) + '</td>' +
        '<td style="font-size:.7rem;color:' + col + '">' + (t ? escapeHtml(t.proveedor + ' / ' + t.tipo + ' (' + fmtPctC(t.pct) + ')') : '<span style="color:var(--red)">⚠ Sin tasa</span>') + '</td>' +
        '<td class="r mo ' + (comBase !== null && comBase > 0 ? '' : 'neg') + '">' + (comBase !== null ? fmtC(comBase) : '—') + '</td>' +
      '</tr>';
    }).join('');

    return '' +
      // Header
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">🎰 Análisis Maquineros — Comisiones</div>' +
          '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">' + escapeHtml(corte.casino || '') + ' · Subido: ' + (corte.uploadedAt || '') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<select id="cierre-corte-sel" onchange="rCierreMaquineros()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif">' + corteOpts + '</select>' +
          '<button class="btn btn-blue edit-action" style="font-size:.7rem" onclick="navTo(\'stel_cierre_upload\')">📤 Nuevo Corte</button>' +
        '</div>' +
      '</div>' +

      // Período pill
      '<div style="margin-bottom:14px;padding:6px 14px;background:var(--blue-bg);border-radius:20px;display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:var(--blue)">' +
        '📅 Período: ' + escapeHtml(corte.desde) + ' → ' + escapeHtml(corte.hasta) +
      '</div>' +

      // KPIs
      '<div class="kpi-row" style="margin-bottom:14px">' +
        _kpiCard('Netwin Total', fmtC(nt), (corte.maquinas||[]).length + ' máquinas activas', '#0073ea', '🎰') +
        _kpiCard('Comisiones Maquineros', fmtC(cmb), 'Base · IVA: ' + fmtC(cmi), '#ff7043', '🔧') +
        _kpiCard('Comisión Operadora', fmtC(cop.base || 0), fmtPctC(cop.pct || 0.1) + ' Netwin · IVA: ' + fmtC(cop.iva || 0), '#9b51e0', '🏛') +
        _kpiCard('Neto Stellaris', fmtC(neo), fmtPctC(neoPct > 0 ? neoPct : 0) + ' del Netwin (sin IVA recuperable)', neo > 0 ? 'var(--green)' : 'var(--red)', '💰') +
      '</div>' +

      // Chart + resumen
      '<div style="display:grid;grid-template-columns:320px 1fr;gap:12px;margin-bottom:14px">' +
        '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">' +
          '<div style="font-size:.75rem;font-weight:700;margin-bottom:12px">Distribución Netwin</div>' +
          '<div style="position:relative;height:220px"><canvas id="cierre-chart-donut"></canvas></div>' +
        '</div>' +
        '<div class="tw" style="margin:0">' +
          '<div class="tw-h">' +
            '<div class="tw-ht">Comisiones por Proveedor</div>' +
            '<div style="font-size:.68rem;color:var(--muted)">Base + IVA 16%</div>' +
          '</div>' +
          '<div style="overflow-x:auto"><table class="bt">' +
            '<thead><tr><th>Proveedor</th><th class="r">Máquinas</th><th class="r">Netwin</th><th class="r">Tasas</th><th class="r">Base</th><th class="r">IVA</th><th class="r">Total</th></tr></thead>' +
            '<tbody>' + provRows +
              '<tr style="font-weight:700;background:var(--blue-bg)">' +
                '<td colspan="2">SUBTOTAL MAQUINEROS</td>' +
                '<td class="r mo">' + fmtC(nt) + '</td>' +
                '<td></td>' +
                '<td class="r mo">' + fmtC(cmb) + '</td>' +
                '<td class="r mo" style="color:var(--muted)">' + fmtC(cmi) + '</td>' +
                '<td class="r mo" style="color:var(--orange)">' + fmtC(cmt) + '</td>' +
              '</tr>' +
              '<tr style="background:rgba(155,81,224,.08)">' +
                '<td colspan="2"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#9b51e0;margin-right:6px"></span><b>Operadora</b></td>' +
                '<td class="r mo">' + fmtC(nt) + '</td>' +
                '<td class="r" style="color:var(--muted);font-size:.72rem">' + fmtPctC(cop.pct || 0.1) + ' Netwin</td>' +
                '<td class="r mo">' + fmtC(cop.base || 0) + '</td>' +
                '<td class="r mo" style="color:var(--muted)">' + fmtC(cop.iva || 0) + '</td>' +
                '<td class="r mo bld" style="color:#9b51e0">' + fmtC(cop.total || 0) + '</td>' +
              '</tr>' +
              '<tr style="font-weight:800;background:var(--bg)">' +
                '<td colspan="2">TOTAL A PAGAR</td>' +
                '<td></td><td></td>' +
                '<td class="r mo">' + fmtC(cmb + (cop.base||0)) + '</td>' +
                '<td class="r mo" style="color:var(--muted)">' + fmtC(cmi + (cop.iva||0)) + '</td>' +
                '<td class="r mo" style="color:var(--red)">' + fmtC(totalPagos) + '</td>' +
              '</tr>' +
            '</tbody>' +
          '</table></div>' +
        '</div>' +
      '</div>' +

      // Alerta máquinas sin tasa
      (sinT.length ? '<div style="padding:8px 14px;background:var(--red-lt);border-radius:8px;font-size:.72rem;color:var(--red);margin-bottom:12px">⚠ <b>' + sinT.length + ' máquinas sin tasa asignada:</b> ' + sinT.slice(0,5).map(escapeHtml).join(', ') + (sinT.length > 5 ? '...' : '') + '</div>' : '') +

      // Detalle por máquina (expandible)
      '<div onclick="var b=document.getElementById(\'cierre-maq-body\');b.style.display=b.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'span:first-child\').textContent=b.style.display===\'none\'?\'▶\':\'▼\'" style="cursor:pointer;user-select:none;padding:8px 0;display:flex;align-items:center;gap:8px;margin-top:6px">' +
        '<span>▼</span><span style="font-weight:700;font-size:.82rem">🎰 Detalle por Máquina (' + (corte.maquinas||[]).length + ' máquinas)</span>' +
        '<input onclick="event.stopPropagation()" oninput="_dFilterTPV(\'cierre-maq-tbody\',this.value)" style="margin-left:auto;padding:4px 10px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);width:200px" placeholder="🔍 Buscar máquina...">' +
      '</div>' +
      '<div id="cierre-maq-body">' +
        '<div class="tw" style="margin:0"><div style="overflow-x:auto"><table class="bt">' +
          '<thead><tr><th>Máquina</th><th>Fab.</th><th class="r">Coin In</th><th class="r">Netwin</th><th>Tasa Aplicada</th><th class="r">Com. Base</th></tr></thead>' +
          '<tbody id="cierre-maq-tbody">' + maqRows + '</tbody>' +
        '</table></div></div>' +
      '</div>';
  }

  function _kpiCard(lbl, val, sub, color, ico) {
    return '<div class="kpi-card" style="--ac:' + color + '">' +
      '<div class="kpi-top"><div class="kpi-lbl">' + lbl + '</div><div class="kpi-ico" style="background:rgba(0,0,0,.04);color:' + color + '">' + ico + '</div></div>' +
      '<div class="kpi-val" style="color:' + color + '">' + val + '</div>' +
      '<div class="kpi-d dnu">' + sub + '</div>' +
    '</div>';
  }

  function _bindCierreDashboard(el) {
    // selector de corte ya tiene onchange="rCierreMaquineros()"
    void el; // suppress unused warning
  }

  function _renderCierreChart(kpis) {
    var ctx = document.getElementById('cierre-chart-donut');
    if (!ctx || typeof Chart === 'undefined') return;
    if (C.donut) { C.donut.destroy(); C.donut = null; }

    var prvs = kpis.proveedorItems || [];
    var labels = prvs.map(function(p){ return p.proveedor; });
    var vals   = prvs.map(function(p){ return Math.max(0, p.netwin); });
    var colors = prvs.map(function(p){ return _provColor(p.proveedor); });

    if (!vals.length) return;

    C.donut = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 2, borderColor: 'var(--bg)' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 10, family: 'Figtree' }, padding: 8, boxWidth: 10 } },
          tooltip: { callbacks: { label: function(c) { return ' ' + c.label + ': ' + fmtC(c.raw); } } }
        }
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // VISTA: ACUMULADO MENSUAL — stel_cierre_acumulado
  // ────────────────────────────────────────────────────────────────
  function rCierreAcumulado() {
    var el = document.getElementById('view-stel_cierre_acumulado');
    if (!el) return;

    var meses = cierre_mesesDisponibles();
    if (!meses.length) {
      el.innerHTML =
        '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">📅 Acumulado Mensual — Maquineros</div>' +
        '<div style="text-align:center;padding:60px 20px;background:var(--white);border:2px dashed var(--border2);border-radius:var(--r);margin-top:14px">' +
          '<div style="font-size:2rem;margin-bottom:10px">📅</div>' +
          '<div style="font-weight:700;font-size:.9rem;margin-bottom:6px">Sin datos cargados</div>' +
          '<div style="font-size:.75rem;color:var(--muted);margin-bottom:16px">Carga al menos un reporte de máquinas para ver el acumulado</div>' +
          '<button class="btn btn-blue" style="font-size:.78rem" onclick="navTo(\'stel_cierre_upload\')">📤 Cargar Reporte</button>' +
        '</div>';
      return;
    }

    // Determinar mes activo (del selector o el más reciente)
    var selEl = el.querySelector('#acum-mes-sel');
    var ym = selEl ? selEl.value : meses[0];
    var acum = cierreAcumuladoMes(ym);

    el.innerHTML = _buildAcumulado(meses, ym, acum);
    _renderAcumuladoChart(acum);
  }

  function _buildAcumulado(meses, ymActivo, acum) {
    var mesOpts = meses.map(function(ym) {
      return '<option value="' + ym + '"' + (ym === ymActivo ? ' selected' : '') + '>' + _ymLabel(ym) + '</option>';
    }).join('');

    if (!acum) {
      return '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:12px">📅 Acumulado Mensual</div>' +
             '<select id="acum-mes-sel" onchange="rCierreAcumulado()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif;margin-bottom:14px">' + mesOpts + '</select>' +
             '<div style="padding:30px;text-align:center;color:var(--muted);font-size:.8rem">Sin datos para ' + _ymLabel(ymActivo) + '</div>';
    }

    var kpis = acum.kpis || {};
    var nt   = kpis.netwinTotal        || 0;
    var cmb  = kpis.totalComBase       || 0;
    var cmt  = kpis.totalComMaquineros || 0;
    var cop  = kpis.comOperadora       || {};
    var neo  = kpis.netoStellaris      || 0;
    var prvs = kpis.proveedorItems     || [];

    // Tabla de cortes del mes
    var cortesRows = (acum.cortes || []).map(function(c, idx) {
      var isLatest = idx === 0;
      return '<tr ' + (isLatest ? 'style="background:var(--blue-bg)"' : '') + '>' +
        '<td class="bld">' + escapeHtml(c.desde + ' → ' + c.hasta) + '</td>' +
        '<td class="r">' + ((c.maquinas || []).length) + '</td>' +
        '<td class="r mo pos">' + fmtC((c.kpis||{}).netwinTotal || 0) + '</td>' +
        '<td class="r mo" style="color:var(--orange)">' + fmtC(((c.kpis||{}).totalComMaquineros || 0) + (((c.kpis||{}).comOperadora||{}).total || 0)) + '</td>' +
        '<td class="r mo pos">' + fmtC((c.kpis||{}).netoStellaris || 0) + '</td>' +
        '<td style="font-size:.66rem;color:var(--muted)">' + (c.uploadedAt||'') + '</td>' +
        '<td style="text-align:center">' + (isLatest ? '<span class="pill" style="background:var(--blue-lt);color:#003d7a;font-size:.6rem">✓ Más reciente</span>' : '') + '</td>' +
      '</tr>';
    }).join('');

    // Tabla acumulado por proveedor
    var provRows = prvs.map(function(p) {
      var col = _provColor(p.proveedor);
      return '<tr>' +
        '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + col + ';margin-right:6px"></span><b>' + escapeHtml(p.proveedor) + '</b></td>' +
        '<td class="r">' + p.nMaquinas + '</td>' +
        '<td class="r mo">' + fmtC(p.netwin) + '</td>' +
        '<td class="r" style="font-size:.7rem;color:var(--muted)">' + p.grupos.map(function(g){ return g.tipo + ' ' + fmtPctC(g.pct); }).join(', ') + '</td>' +
        '<td class="r mo">' + fmtC(p.comBase) + '</td>' +
        '<td class="r mo" style="color:var(--muted)">' + fmtC(p.iva) + '</td>' +
        '<td class="r mo bld" style="color:' + col + '">' + fmtC(p.total) + '</td>' +
      '</tr>';
    }).join('');

    return '' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">📅 Acumulado Mensual — Maquineros</div>' +
          '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">Corte más reciente del mes seleccionado · ' + acum.nCortes + ' corte' + (acum.nCortes!==1?'s':'') + ' cargados</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
          '<select id="acum-mes-sel" onchange="rCierreAcumulado()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif">' + mesOpts + '</select>' +
          '<button class="btn btn-blue edit-action" style="font-size:.7rem" onclick="navTo(\'stel_cierre_upload\')">📤 Actualizar</button>' +
        '</div>' +
      '</div>' +

      // Badge período
      '<div style="margin-bottom:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<div style="padding:5px 14px;background:var(--blue-bg);border-radius:20px;font-size:.72rem;font-weight:700;color:var(--blue)">📅 ' + _ymLabel(ymActivo) + '</div>' +
        '<div style="padding:5px 14px;background:var(--green-bg);border-radius:20px;font-size:.72rem;font-weight:700;color:var(--green)">📄 Período: ' + escapeHtml((acum.latest||{}).desde||'') + ' → ' + escapeHtml((acum.latest||{}).hasta||'') + '</div>' +
      '</div>' +

      // KPIs
      '<div class="kpi-row" style="margin-bottom:14px">' +
        _kpiCard('Netwin Acumulado', fmtC(nt), 'Ingreso bruto de máquinas', '#0073ea', '🎰') +
        _kpiCard('Total Maquineros', fmtC(cmt), 'Base ' + fmtC(cmb) + ' + IVA', '#ff7043', '🔧') +
        _kpiCard('Total Operadora', fmtC(cop.total || 0), 'Base ' + fmtC(cop.base || 0) + ' + IVA', '#9b51e0', '🏛') +
        _kpiCard('Neto Stellaris', fmtC(neo), 'Margen antes de impuestos', neo >= 0 ? 'var(--green)' : 'var(--red)', '💰') +
      '</div>' +

      // Chart
      '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:14px">' +
        '<div style="font-size:.75rem;font-weight:700;margin-bottom:10px">Evolución de Cortes en el Mes</div>' +
        '<div style="position:relative;height:160px"><canvas id="acum-chart-bar"></canvas></div>' +
      '</div>' +

      // Tabla cortes del mes
      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">Cortes del Mes</div></div>' +
        '<div style="overflow-x:auto"><table class="bt">' +
          '<thead><tr><th>Período</th><th class="r">Máquinas</th><th class="r">Netwin</th><th class="r">Total Pagos</th><th class="r">Neto</th><th>Subido</th><th></th></tr></thead>' +
          '<tbody>' + cortesRows + '</tbody>' +
        '</table></div>' +
      '</div>' +

      // Tabla por proveedor (del corte más reciente)
      '<div class="tw">' +
        '<div class="tw-h"><div class="tw-ht">Desglose por Proveedor</div><div style="font-size:.68rem;color:var(--muted)">Corte más reciente</div></div>' +
        '<div style="overflow-x:auto"><table class="bt">' +
          '<thead><tr><th>Proveedor</th><th class="r">Máquinas</th><th class="r">Netwin</th><th class="r">Tasas</th><th class="r">Base</th><th class="r">IVA</th><th class="r">Total</th></tr></thead>' +
          '<tbody>' + provRows +
            '<tr style="font-weight:700;background:var(--blue-bg)">' +
              '<td colspan="2">SUBTOTAL MAQUINEROS</td>' +
              '<td class="r mo">' + fmtC(nt) + '</td><td></td>' +
              '<td class="r mo">' + fmtC(cmb) + '</td>' +
              '<td class="r mo" style="color:var(--muted)">' + fmtC(kpis.totalComIva || 0) + '</td>' +
              '<td class="r mo" style="color:var(--orange)">' + fmtC(cmt) + '</td>' +
            '</tr>' +
            '<tr style="background:rgba(155,81,224,.08)">' +
              '<td colspan="2"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#9b51e0;margin-right:6px"></span><b>Operadora</b></td>' +
              '<td class="r mo">' + fmtC(nt) + '</td>' +
              '<td class="r" style="font-size:.7rem;color:var(--muted)">' + fmtPctC(cop.pct||0.1) + '</td>' +
              '<td class="r mo">' + fmtC(cop.base||0) + '</td>' +
              '<td class="r mo" style="color:var(--muted)">' + fmtC(cop.iva||0) + '</td>' +
              '<td class="r mo bld" style="color:#9b51e0">' + fmtC(cop.total||0) + '</td>' +
            '</tr>' +
            '<tr style="font-weight:800;background:var(--bg)">' +
              '<td colspan="2">TOTAL A PAGAR</td><td></td><td></td>' +
              '<td class="r mo">' + fmtC(cmb + (cop.base||0)) + '</td>' +
              '<td class="r mo" style="color:var(--muted)">' + fmtC((kpis.totalComIva||0) + (cop.iva||0)) + '</td>' +
              '<td class="r mo" style="color:var(--red)">' + fmtC(cmt + (cop.total||0)) + '</td>' +
            '</tr>' +
          '</tbody>' +
        '</table></div>' +
      '</div>';
  }

  function _renderAcumuladoChart(acum) {
    var ctx = document.getElementById('acum-chart-bar');
    if (!ctx || typeof Chart === 'undefined') return;
    if (C.bar) { C.bar.destroy(); C.bar = null; }
    if (!acum) return;

    var cortes = (acum.cortes || []).slice().reverse(); // oldest first
    var labels = cortes.map(function(c){ return c.hasta ? c.hasta.slice(0,5) : ''; });
    var netwinVals = cortes.map(function(c){ return (c.kpis||{}).netwinTotal || 0; });
    var netoVals   = cortes.map(function(c){ return (c.kpis||{}).netoStellaris || 0; });

    C.bar = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Netwin', data: netwinVals, backgroundColor: 'rgba(0,115,234,.5)', borderRadius: 4 },
          { label: 'Neto Stellaris', data: netoVals, backgroundColor: 'rgba(0,184,117,.7)', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { size: 9, family: 'Figtree' }, boxWidth: 10 } },
                   tooltip: { callbacks: { label: function(c){ return ' ' + c.dataset.label + ': ' + fmtC(c.raw); } } } },
        scales: {
          x: { ticks: { font: { size: 9 } } },
          y: { ticks: { font: { size: 9 }, callback: function(v){ return '$' + (v/1000).toFixed(0) + 'K'; } } }
        }
      }
    });
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  window.rCierreMaquineros = rCierreMaquineros;
  window.rCierreAcumulado  = rCierreAcumulado;

  if (typeof registerView === 'function') {
    registerView('stel_cierre_maquineros', function(){ rCierreMaquineros(); });
    registerView('stel_cierre_acumulado',  function(){ rCierreAcumulado();  });
  }

})(window);
