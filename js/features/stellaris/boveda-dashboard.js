// GF — Stellaris Casino: Bóveda Dashboard
(function(window) {
  'use strict';

  var BOVEDA_CHARTS = {};
  var _bovedaFecha = null; // selected date or null for latest

  function rBovedaDashboard() {
    var el = document.getElementById('view-stel_boveda');
    if (!el) return;

    var data = bovedaLoad();
    var fechas = bovedaFechas();
    if (!_bovedaFecha && fechas.length) _bovedaFecha = fechas[fechas.length - 1];
    var kpis = bovedaKPIs(_bovedaFecha);
    var alertas = bovedaAlertas(kpis);
    var arq = _bovedaFecha ? data.arqueos.find(function(a) { return a.fecha === _bovedaFecha; }) : null;
    var f = typeof fmt === 'function' ? fmt : function(v) { return '$' + Math.round(v).toLocaleString('es-MX'); };

    // Date selector
    var dateOpts = fechas.map(function(d) {
      return '<option value="' + escapeHtml(d) + '"' + (d === _bovedaFecha ? ' selected' : '') + '>' + escapeHtml(d) + '</option>';
    }).join('');

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
    html += '<div><div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">🏦 Boveda — Dashboard</div>';
    html += '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">Grand Tuxtla Casino · ' + escapeHtml(_bovedaFecha || 'Sin datos') + '</div></div>';
    html += '<select id="boveda-fecha-sel" style="font-size:.75rem;padding:5px 10px;border:1px solid var(--border2);border-radius:var(--r)">' + dateOpts + '</select>';
    html += '</div>';

    // Alertas
    if (alertas.length) {
      html += '<div style="margin-bottom:14px;display:flex;flex-direction:column;gap:4px">';
      alertas.forEach(function(a) {
        var bg = a.type === 'alert' ? 'var(--red-bg)' : a.type === 'warn' ? 'var(--orange-bg)' : a.type === 'positive' ? 'var(--green-bg)' : 'var(--blue-bg)';
        var tc = a.type === 'alert' ? 'var(--red)' : a.type === 'warn' ? 'var(--orange)' : a.type === 'positive' ? 'var(--green)' : 'var(--blue)';
        html += '<div style="background:' + bg + ';color:' + tc + ';border-radius:var(--r);padding:6px 12px;font-size:.7rem;line-height:1.4">' + a.icon + ' ' + escapeHtml(a.text) + '</div>';
      });
      html += '</div>';
    }

    // KPIs Row 1
    html += '<div class="kpi-row" style="margin-bottom:14px">';
    html += '<div class="kpi-card" style="--ac:var(--blue)"><div class="kpi-top"><div class="kpi-lbl">Efectivo Boveda</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">💰</div></div><div class="kpi-val" style="color:var(--blue)">' + f(kpis.efectivo_t2 || kpis.efectivo_apertura) + '</div><div class="kpi-d dnu">ultimo conteo</div></div>';

    var sfColor = kpis.sob_fal_total < 0 ? 'var(--red)' : kpis.sob_fal_total > 0 ? 'var(--blue)' : 'var(--green)';
    var sfBg = kpis.sob_fal_total < 0 ? 'var(--red-bg)' : kpis.sob_fal_total > 0 ? 'var(--blue-bg)' : 'var(--green-bg)';
    html += '<div class="kpi-card" style="--ac:' + sfColor + '"><div class="kpi-top"><div class="kpi-lbl">SOB/FAL Total</div><div class="kpi-ico" style="background:' + sfBg + ';color:' + sfColor + '">' + (kpis.sob_fal_total < 0 ? '🔴' : kpis.sob_fal_total > 0 ? '🟡' : '✅') + '</div></div><div class="kpi-val" style="color:' + sfColor + '">' + f(kpis.sob_fal_total) + '</div><div class="kpi-d dnu">' + (kpis.sob_fal_total === 0 ? 'Cuadre perfecto' : kpis.sob_fal_total < 0 ? 'Faltante' : 'Sobrante') + '</div></div>';

    html += '<div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Caja Stellaris</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">🏦</div></div><div class="kpi-val" style="color:var(--green)">' + f(kpis.caja_stellaris) + '</div><div class="kpi-d dnu">acumulado</div></div>';
    html += '<div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">TPV Acumulado</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">💳</div></div><div class="kpi-val" style="color:var(--purple)">' + f(kpis.tpv_acumulado) + '</div><div class="kpi-d dnu">terminales bancarias</div></div>';
    html += '</div>';

    // KPIs Row 2
    html += '<div class="kpi-row c3" style="margin-bottom:14px">';
    html += '<div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Restaurante</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🍽️</div></div><div class="kpi-val" style="color:var(--orange)">' + f(kpis.restaurante) + '</div><div class="kpi-d dnu">acumulado</div></div>';
    html += '<div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Ingresos Mes</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div><div class="kpi-val" style="color:var(--green)">' + f(kpis.ingresos_mes) + '</div><div class="kpi-d dnu">total del mes</div></div>';
    html += '<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-top"><div class="kpi-lbl">Total Fondos</div><div class="kpi-ico" style="background:var(--bg);color:var(--muted)">💼</div></div><div class="kpi-val">' + f(kpis.total_fondos) + '</div><div class="kpi-d dnu">todos los fondos</div></div>';
    html += '</div>';

    // Arqueo por turno
    if (arq) {
      html += '<div class="tw" style="margin-bottom:14px"><div class="tw-h"><div class="tw-ht">📊 Arqueo del Dia — ' + escapeHtml(_bovedaFecha) + '</div></div>';
      html += '<div style="overflow-x:auto"><table class="bt">';
      html += '<thead><tr><th></th><th class="r">Apertura<br><span style="font-weight:400;font-size:.6rem;color:var(--muted)">' + escapeHtml(arq.apertura.responsable) + '</span></th>';
      html += '<th class="r">Turno 1<br><span style="font-weight:400;font-size:.6rem;color:var(--muted)">' + escapeHtml(arq.turno1.responsable) + '</span></th>';
      html += '<th class="r">Turno 2 (cierre)<br><span style="font-weight:400;font-size:.6rem;color:var(--muted)">' + escapeHtml(arq.turno2.responsable) + '</span></th>';
      html += '</tr></thead><tbody>';

      var rows = [
        ['Efectivo MXN', arq.apertura.total_mxn, arq.turno1.total_mxn, arq.turno2.total_mxn],
        ['Efectivo USD', arq.apertura.total_usd, arq.turno1.total_usd, arq.turno2.total_usd],
        ['Total Efectivo', arq.apertura.total, arq.turno1.total, arq.turno2.total],
      ];

      if (arq.resumen_t1 || arq.resumen_t2) {
        var r1 = arq.resumen_t1 || {};
        var r2 = arq.resumen_t2 || {};
        rows.push(
          ['', '', '', ''],
          ['Pagos Manuales T1', '', r1.pagos_manuales_t1 || 0, r2.pagos_manuales_t1 || 0],
          ['Pagos Manuales T2', '', r1.pagos_manuales_t2 || 0, r2.pagos_manuales_t2 || 0],
          ['TPV Prohidro T1', '', r1.tpv_prohidro_t1 || 0, r2.tpv_prohidro_t1 || 0],
          ['TPV Prohidro T2', '', r1.tpv_prohidro_t2 || 0, r2.tpv_prohidro_t2 || 0],
          ['TPV Grand Play T1', '', r1.tpv_grandplay_t1 || 0, r2.tpv_grandplay_t1 || 0],
          ['TPV Grand Play T2', '', r1.tpv_grandplay_t2 || 0, r2.tpv_grandplay_t2 || 0],
          ['', '', '', ''],
          ['Total Caja', '', r1.total_caja || 0, r2.total_caja || 0],
          ['Fondo Operativo', '', r1.fondo_operativo || 0, r2.fondo_operativo || 0],
          ['Wigos (sistema)', '', r1.wigos || 0, r2.wigos || 0]
        );
        // SOB/FAL with color
        rows.push(['SOB/FAL', '', r1.sob_fal || 0, r2.sob_fal || 0]);
      }

      rows.forEach(function(r) {
        if (r[0] === '') { html += '<tr><td colspan="4" style="padding:2px"></td></tr>'; return; }
        var isSF = r[0] === 'SOB/FAL';
        var isTotal = r[0].startsWith('Total');
        var style = isTotal ? 'font-weight:700;background:var(--bg2)' : '';
        html += '<tr style="' + style + '">';
        html += '<td style="font-size:.75rem;' + (isSF ? 'font-weight:700' : '') + '">' + r[0] + '</td>';
        for (var c = 1; c <= 3; c++) {
          if (r[c] === '') { html += '<td></td>'; continue; }
          var val = r[c];
          var color = '';
          if (isSF) color = val < 0 ? 'color:var(--red);font-weight:700' : val > 0 ? 'color:var(--blue);font-weight:700' : 'color:var(--green);font-weight:700';
          html += '<td class="r mo" style="font-size:.75rem;' + color + '">' + f(val) + '</td>';
        }
        html += '</tr>';
      });

      html += '</tbody></table></div></div>';

      // Fondo B
      if (arq.fondoB && arq.fondoB.total > 0) {
        html += '<div style="font-size:.7rem;color:var(--muted);margin-bottom:14px">💼 Fondo B: ' + f(arq.fondoB.total) + '</div>';
      }
    } else if (!fechas.length) {
      html += '<div style="text-align:center;color:var(--muted);padding:40px">Sin datos. Sube los reportes Excel en la seccion de Carga de Datos.</div>';
    }

    // Control de Fondos
    if (data.fondos.length) {
      html += '<div class="tw" style="margin-bottom:14px"><div class="tw-h"><div class="tw-ht">💼 Control de Fondos</div></div>';
      html += '<div style="overflow-x:auto"><table class="bt">';
      html += '<thead><tr><th>Fondo</th>';
      data.fondos.forEach(function(fo) { html += '<th class="r" style="font-size:.65rem">' + escapeHtml(fo.fecha.slice(5)) + '</th>'; });
      html += '</tr></thead><tbody>';

      var fundNames = ['fondo_a', 'fondo_b', 'sportbook_cajas', 'sportbook_premios', 'fondo_adrian', 'fondo_gastos', 'caja_stellaris', 'tpv', 'restaurante'];
      var fundLabels = { fondo_a: 'Fondo A', fondo_b: 'Fondo B', sportbook_cajas: 'SportBook Cajas', sportbook_premios: 'SportBook Premios', fondo_adrian: 'Fondo Adrian', fondo_gastos: 'Fondo Gastos', caja_stellaris: '🏦 Caja Stellaris', tpv: '💳 TPV', restaurante: '🍽️ Restaurante' };

      fundNames.forEach(function(key) {
        html += '<tr><td class="bld" style="font-size:.72rem">' + (fundLabels[key] || key) + '</td>';
        data.fondos.forEach(function(fo) {
          var val = fo[key] || 0;
          html += '<td class="r mo" style="font-size:.72rem">' + f(val) + '</td>';
        });
        html += '</tr>';
      });

      // Total row
      html += '<tr style="font-weight:700;border-top:2px solid var(--border2);background:var(--bg2)"><td>TOTAL</td>';
      data.fondos.forEach(function(fo) { html += '<td class="r mo">' + f(fo.total) + '</td>'; });
      html += '</tr></tbody></table></div>';

      // Chart
      html += '<div class="cc" style="margin-top:10px"><div class="cc-h"><div><div class="cc-t">Evolucion de Fondos</div></div></div>';
      html += '<div class="cc-b"><canvas id="c-boveda-fondos" height="220"></canvas></div></div>';
      html += '</div>';
    }

    el.innerHTML = html;

    // Wire date selector
    var dateSel = document.getElementById('boveda-fecha-sel');
    if (dateSel) dateSel.onchange = function() { _bovedaFecha = dateSel.value; rBovedaDashboard(); };

    // Render chart
    if (data.fondos.length > 1) {
      setTimeout(function() { _renderBovedaChart(data.fondos); }, 80);
    }
  }

  function _renderBovedaChart(fondos) {
    var canvas = document.getElementById('c-boveda-fondos');
    if (!canvas) return;
    if (BOVEDA_CHARTS.fondos) BOVEDA_CHARTS.fondos.destroy();

    var isDark = document.body.classList.contains('dark');
    var tc = isDark ? '#9da0c5' : '#8b8fb5';
    var gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    var labels = fondos.map(function(f) { return f.fecha.slice(5); });

    BOVEDA_CHARTS.fondos = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Caja Stellaris', data: fondos.map(function(f) { return f.caja_stellaris || 0; }), borderColor: '#00b875', backgroundColor: '#00b87520', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'TPV', data: fondos.map(function(f) { return f.tpv || 0; }), borderColor: '#9b51e0', backgroundColor: '#9b51e020', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Restaurante', data: fondos.map(function(f) { return f.restaurante || 0; }), borderColor: '#ff7043', backgroundColor: '#ff704320', fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Total', data: fondos.map(function(f) { return f.total || 0; }), borderColor: '#0073ea', borderWidth: 2, borderDash: [5, 3], tension: 0.3, fill: false, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10, padding: 8, color: tc } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc, font: { size: 9 } } },
          y: { grid: { color: gc }, ticks: { color: tc, font: { size: 8 }, callback: function(v) { return '$' + Math.round(v / 1000) + 'K'; } } }
        }
      }
    });
  }

  // ═══════════════════════════════════════
  // EXPOSE + REGISTER
  // ═══════════════════════════════════════
  window.rBovedaDashboard = rBovedaDashboard;
  window.BOVEDA_CHARTS = BOVEDA_CHARTS;

  if (typeof registerView === 'function') {
    registerView('stel_boveda', rBovedaDashboard);
  }

})(window);
