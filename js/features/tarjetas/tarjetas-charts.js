// GF — Tarjetas: Charts + Categorías P&L
(function(window) {
  'use strict';

// ==============================
// TARJETAS CHARTS (Dynamic — TAR data service)
// ==============================
const TAR_CHARTS = {};

function _tarFmt(v) {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function _tarNum(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toLocaleString('es-MX');
}
function _tarPct(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(1) + '%';
}
function _tarSetEl(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function _tarNoData(canvasId) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#8b8fb5';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sin datos', c.width / 2, c.height / 2);
}

async function initTarCharts(view) {
  if(typeof gfpRender === 'function'){
    gfpRender(view+'-pbar', {ent:'sal', color:'#0073ea', type:'sub', years:['2025','2026'], viewId:view});
  }
  const isDark = document.body.classList.contains('dark');
  const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tc = isDark ? '#9da0c5' : '#8b8fb5';
  const colors10 = ['#0073ea','#00b875','#9b51e0','#ff7043','#e53935','#ffa000','#8b8fb5','#17a589','#2e86c1','#aaa'];

  // ── TAR DASHBOARD ──────────────────────────────
  if (view === 'tar_dashboard') {
    try {
      const [kpis, weekday, conceptos, subclientes, rechazos] = await Promise.all([
        TAR.dashboardKpis(),
        TAR.activityByWeekday(),
        TAR.byConcepto(),
        TAR.bySubcliente(),
        TAR.rechazosDetail()
      ]);

      if (!kpis || !kpis.total_txns) {
        _tarSetEl('tar-d-txns', '0');
        _tarSetEl('tar-d-monto', '$0');
        _tarSetEl('tar-d-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-dias','c-tar-conc-pie','c-tar-top10','c-tar-rechazos'].forEach(id => _tarNoData(id));
        return;
      }

      // KPIs
      _tarSetEl('tar-d-txns', _tarNum(kpis.total_txns));
      _tarSetEl('tar-d-txns-sub', 'Cargos: ' + _tarNum(kpis.txns_cargos) + ' · Abonos: ' + _tarNum(kpis.txns_abonos));
      _tarSetEl('tar-d-monto', _tarFmt(kpis.monto_total));
      _tarSetEl('tar-d-monto-sub', 'Cargos: ' + _tarFmt(kpis.total_cargos) + ' · Abonos: ' + _tarFmt(kpis.total_abonos));
      _tarSetEl('tar-d-cargos', _tarFmt(kpis.total_cargos));
      _tarSetEl('tar-d-cargos-sub', _tarNum(kpis.txns_cargos) + ' transacciones');
      _tarSetEl('tar-d-abonos', _tarFmt(kpis.total_abonos));
      _tarSetEl('tar-d-abonos-sub', _tarNum(kpis.txns_abonos) + ' transacciones');
      _tarSetEl('tar-d-activas', _tarNum(kpis.tarjetas_activas));
      _tarSetEl('tar-d-activas-sub', 'de ' + _tarNum(kpis.tarjetas_total) + ' tarjetas');
      _tarSetEl('tar-d-saldo', _tarFmt(kpis.saldo_total));
      _tarSetEl('tar-d-saldo-sub', _tarNum(kpis.tarjetas_total) + ' tarjetas');
      _tarSetEl('tar-d-rechazo', _tarPct(kpis.tasa_rechazo));
      _tarSetEl('tar-d-rechazo-sub', _tarNum(kpis.rechazadas) + ' rechazadas');
      _tarSetEl('tar-d-ticket', _tarFmt(kpis.ticket_promedio));
      _tarSetEl('tar-d-ticket-sub', 'promedio por txn');
      _tarSetEl('tar-d-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // Días bar chart
      if (weekday && weekday.length) {
        const dLabels = weekday.map(r => r.day_name);
        const dMontos = weekday.map(r => Number(r.monto));
        const dTxns = weekday.map(r => Number(r.txn_count));
        if (TAR_CHARTS.dias) TAR_CHARTS.dias.destroy();
        TAR_CHARTS.dias = new Chart(document.getElementById('c-tar-dias'), {
          data: {
            labels: dLabels,
            datasets: [
              { type:'bar', label:'Monto ($)', data:dMontos, backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
              { type:'line', label:'Txns', data:dTxns, borderColor:'#00b875', backgroundColor:'#00b87520', pointRadius:4, pointBackgroundColor:'#00b875', tension:0.3, yAxisID:'y2' }
            ]
          },
          options: { plugins:{legend:{labels:{font:{size:9},color:tc,boxWidth:10}}}, scales:{
            y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':v} },
            y2:{ position:'right', grid:{display:false}, ticks:{color:tc,font:{size:9}} },
            x:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
          }}
        });
      } else { _tarNoData('c-tar-dias'); }

      // Concepto pie (top 9 + Otros)
      if (conceptos && conceptos.length) {
        const top9 = conceptos.slice(0, 9);
        const rest = conceptos.slice(9);
        const cLabels = top9.map(r => r.concepto);
        const cTxns = top9.map(r => Number(r.txn_count));
        if (rest.length) { cLabels.push('Otros'); cTxns.push(rest.reduce((s, r) => s + Number(r.txn_count), 0)); }
        if (TAR_CHARTS.conc_pie) TAR_CHARTS.conc_pie.destroy();
        TAR_CHARTS.conc_pie = new Chart(document.getElementById('c-tar-conc-pie'), {
          type:'doughnut',
          data:{ labels:cLabels, datasets:[{ data:cTxns, backgroundColor:colors10.slice(0, cLabels.length), borderWidth:0 }] },
          options:{ cutout:'60%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:6}} } }
        });
      } else { _tarNoData('c-tar-conc-pie'); }

      // Top10 subclientes bar
      if (subclientes && subclientes.length) {
        const top10 = subclientes.slice(0, 10);
        if (TAR_CHARTS.top10) TAR_CHARTS.top10.destroy();
        TAR_CHARTS.top10 = new Chart(document.getElementById('c-tar-top10'), {
          type:'bar',
          data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4 }] },
          options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
            x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
            y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
          }}
        });
      } else { _tarNoData('c-tar-top10'); }

      // Rechazos bar (top 6 + Otras)
      if (rechazos && rechazos.length) {
        const top6 = rechazos.slice(0, 6);
        const rRest = rechazos.slice(6);
        const rLabels = top6.map(r => r.razon);
        const rCounts = top6.map(r => Number(r.txn_count));
        if (rRest.length) { rLabels.push('Otras razones'); rCounts.push(rRest.reduce((s, r) => s + Number(r.txn_count), 0)); }
        if (TAR_CHARTS.rec_dash) TAR_CHARTS.rec_dash.destroy();
        TAR_CHARTS.rec_dash = new Chart(document.getElementById('c-tar-rechazos'), {
          type:'bar',
          data:{ labels:rLabels, datasets:[{ data:rCounts, backgroundColor:'#e5393525', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
          options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
            x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8}} },
            y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
          }}
        });
      } else { _tarNoData('c-tar-rechazos'); }

      // Hallazgos dinámicos
      const hDiv = document.getElementById('tar-d-hallazgos');
      if (hDiv && kpis) {
        const items = [];
        if (kpis.tasa_rechazo > 5) items.push('⚠️ Tasa de rechazo elevada: ' + _tarPct(kpis.tasa_rechazo));
        if (rechazos && rechazos.length) items.push('🔴 Principal causa de rechazo: ' + rechazos[0].razon + ' (' + rechazos[0].txn_count + ' txns)');
        if (subclientes && subclientes.length) items.push('🏆 Mayor volumen: ' + subclientes[0].subcliente + ' — ' + _tarFmt(subclientes[0].monto));
        if (conceptos && conceptos.length) items.push('📊 Concepto líder: ' + conceptos[0].concepto + ' (' + _tarFmt(conceptos[0].monto) + ')');
        if (weekday && weekday.length) {
          const topDay = weekday.reduce((a, b) => Number(b.monto) > Number(a.monto) ? b : a, weekday[0]);
          items.push('📅 Día más activo: ' + topDay.day_name + ' (' + _tarFmt(topDay.monto) + ')');
        }
        hDiv.innerHTML = items.length
          ? items.map(i => '<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">' + i + '</div>').join('')
          : '<div style="padding:10px;color:#8b8fb5;font-size:13px">Sin hallazgos disponibles</div>';
      }

    } catch (e) {
      console.error('[TAR] dashboard error:', e);
      _tarSetEl('tar-d-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR CONCEPTOS ──────────────────────────────
  if (view === 'tar_conceptos') {
    try {
      const conceptos = await TAR.byConcepto();
      const kpis = await TAR.dashboardKpis();

      if (!conceptos || !conceptos.length) {
        _tarSetEl('tar-c-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-conc-monto','c-tar-conc-txns'].forEach(id => _tarNoData(id));
        return;
      }

      // KPIs
      const topMonto = conceptos[0];
      const topTxns = [...conceptos].sort((a, b) => Number(b.txn_count) - Number(a.txn_count))[0];
      const rechRow = conceptos.find(r => r.concepto === 'RECHAZADA');
      _tarSetEl('tar-c-top-monto', topMonto ? topMonto.concepto : '—');
      _tarSetEl('tar-c-top-monto-sub', topMonto ? _tarFmt(topMonto.monto) + ' (' + _tarPct(topMonto.pct_monto) + ')' : '');
      _tarSetEl('tar-c-top-txns', topTxns ? topTxns.concepto : '—');
      _tarSetEl('tar-c-top-txns-sub', topTxns ? _tarNum(topTxns.txn_count) + ' txns (' + _tarPct(topTxns.pct_txns) + ')' : '');
      _tarSetEl('tar-c-rechazadas', rechRow ? _tarNum(rechRow.txn_count) : '0');
      _tarSetEl('tar-c-rechazadas-sub', rechRow ? _tarFmt(rechRow.monto) + ' (' + _tarPct(rechRow.pct_txns) + ')' : '');
      if (kpis) _tarSetEl('tar-c-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // Donut por monto (top 9 + Otros)
      const top9 = conceptos.slice(0, 9);
      const rest = conceptos.slice(9);
      const mLabels = top9.map(r => r.concepto);
      const mData = top9.map(r => Number(r.monto));
      if (rest.length) { mLabels.push('Otros'); mData.push(rest.reduce((s, r) => s + Number(r.monto), 0)); }
      if (TAR_CHARTS.conc_m) TAR_CHARTS.conc_m.destroy();
      TAR_CHARTS.conc_m = new Chart(document.getElementById('c-tar-conc-monto'), {
        type:'doughnut',
        data:{ labels:mLabels, datasets:[{ data:mData, backgroundColor:colors10.slice(0, mLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Donut por txns
      const tLabels = top9.map(r => r.concepto);
      const tData = top9.map(r => Number(r.txn_count));
      if (rest.length) { tLabels.push('Otros'); tData.push(rest.reduce((s, r) => s + Number(r.txn_count), 0)); }
      if (TAR_CHARTS.conc_t) TAR_CHARTS.conc_t.destroy();
      TAR_CHARTS.conc_t = new Chart(document.getElementById('c-tar-conc-txns'), {
        type:'doughnut',
        data:{ labels:tLabels, datasets:[{ data:tData, backgroundColor:colors10.slice(0, tLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Table
      const tbody = document.getElementById('tar-c-tbody');
      if (tbody) {
        tbody.innerHTML = conceptos.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.concepto || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right">' + _tarPct(r.pct_txns) +
          '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) + '</b></td><td style="text-align:right">' +
          _tarPct(r.pct_monto) + '</td><td style="text-align:right">' + _tarFmt(r.ticket_avg) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] conceptos error:', e);
      _tarSetEl('tar-c-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR SUBCLIENTES ────────────────────────────
  if (view === 'tar_subclientes') {
    try {
      const subs = await TAR.bySubcliente();
      const kpis = await TAR.dashboardKpis();

      if (!subs || !subs.length) {
        _tarSetEl('tar-s-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-sub-bar','c-tar-sub-pie'].forEach(id => _tarNoData(id));
        return;
      }

      if (kpis) _tarSetEl('tar-s-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      const top10 = subs.slice(0, 10);

      // Bar chart
      if (TAR_CHARTS.sub_bar) TAR_CHARTS.sub_bar.destroy();
      TAR_CHARTS.sub_bar = new Chart(document.getElementById('c-tar-sub-bar'), {
        type:'bar',
        data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:colors10, borderWidth:0, borderRadius:5 }] },
        options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
          x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
          y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
        }}
      });

      // Pie chart
      if (TAR_CHARTS.sub_pie) TAR_CHARTS.sub_pie.destroy();
      TAR_CHARTS.sub_pie = new Chart(document.getElementById('c-tar-sub-pie'), {
        type:'doughnut',
        data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:colors10, borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:5}} } }
      });

      // Table
      const tbody = document.getElementById('tar-s-tbody');
      if (tbody) {
        tbody.innerHTML = subs.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.subcliente || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) +
          '</b></td><td style="text-align:right">' + _tarPct(r.pct) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] subclientes error:', e);
      _tarSetEl('tar-s-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR RECHAZOS ───────────────────────────────
  if (view === 'tar_rechazos') {
    try {
      const rechazos = await TAR.rechazosDetail();
      const kpis = await TAR.dashboardKpis();

      if (!rechazos || !rechazos.length) {
        _tarSetEl('tar-r-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-rec-pie','c-tar-rec-bar'].forEach(id => _tarNoData(id));
        return;
      }

      if (kpis) _tarSetEl('tar-r-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // KPIs
      _tarSetEl('tar-r-causa', rechazos[0].razon);
      _tarSetEl('tar-r-causa-sub', _tarNum(rechazos[0].txn_count) + ' txns (' + _tarPct(rechazos[0].pct) + ')');
      const totalRecMonto = rechazos.reduce((s, r) => s + Number(r.monto), 0);
      _tarSetEl('tar-r-monto', _tarFmt(totalRecMonto));
      _tarSetEl('tar-r-monto-sub', _tarNum(rechazos.reduce((s, r) => s + Number(r.txn_count), 0)) + ' rechazos totales');
      _tarSetEl('tar-r-razones', String(rechazos.length));
      _tarSetEl('tar-r-razones-sub', 'tipos distintos');

      const recColors = ['#e53935','#ff7043','#ffa000','#ffcc02','#aaa','#ccc','#ddd'];
      const top6 = rechazos.slice(0, 6);
      const rRest = rechazos.slice(6);
      const rLabels = top6.map(r => r.razon);
      const rTxns = top6.map(r => Number(r.txn_count));
      const rMontos = top6.map(r => Number(r.monto));
      if (rRest.length) {
        rLabels.push('Otras razones');
        rTxns.push(rRest.reduce((s, r) => s + Number(r.txn_count), 0));
        rMontos.push(rRest.reduce((s, r) => s + Number(r.monto), 0));
      }

      // Pie chart
      if (TAR_CHARTS.rec_pie) TAR_CHARTS.rec_pie.destroy();
      TAR_CHARTS.rec_pie = new Chart(document.getElementById('c-tar-rec-pie'), {
        type:'doughnut',
        data:{ labels:rLabels, datasets:[{ data:rTxns, backgroundColor:recColors.slice(0, rLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Bar chart
      if (TAR_CHARTS.rec_bar) TAR_CHARTS.rec_bar.destroy();
      TAR_CHARTS.rec_bar = new Chart(document.getElementById('c-tar-rec-bar'), {
        type:'bar',
        data:{ labels:rLabels, datasets:[{ data:rMontos, backgroundColor:'#e5393520', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
        options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
          x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
          y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
        }}
      });

      // Table
      const tbody = document.getElementById('tar-r-tbody');
      if (tbody) {
        tbody.innerHTML = rechazos.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.razon || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) +
          '</b></td><td style="text-align:right">' + _tarPct(r.pct) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] rechazos error:', e);
      _tarSetEl('tar-r-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR TARJETAHABIENTES ───────────────────────
  if (view === 'tar_tarjetahabientes') {
    try {
      const summary = await TAR.cardholdersSummary();
      const kpis = await TAR.dashboardKpis();

      if (!summary || !summary.totals) {
        _tarSetEl('tar-t-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        _tarNoData('c-tar-saldos');
        return;
      }

      if (kpis) _tarSetEl('tar-t-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));
      const t = summary.totals;
      _tarSetEl('tar-t-activas', _tarNum(t.activas));
      _tarSetEl('tar-t-activas-sub', _tarPct(t.total > 0 ? (t.activas / t.total * 100) : 0) + ' del total');
      _tarSetEl('tar-t-bloqueadas', _tarNum(t.bloqueadas));
      _tarSetEl('tar-t-bloqueadas-sub', _tarPct(t.total > 0 ? (t.bloqueadas / t.total * 100) : 0) + ' del total');
      _tarSetEl('tar-t-inactivas', _tarNum(t.inactivas));
      _tarSetEl('tar-t-inactivas-sub', _tarPct(t.total > 0 ? (t.inactivas / t.total * 100) : 0) + ' del total');

      // Saldos chart
      const sr = summary.saldo_ranges;
      if (sr && sr.length) {
        const sColors = ['#e53935','#8b8fb5','#0073ea','#9b51e0','#00b875','#ffa000'];
        if (TAR_CHARTS.saldos) TAR_CHARTS.saldos.destroy();
        TAR_CHARTS.saldos = new Chart(document.getElementById('c-tar-saldos'), {
          type:'bar',
          data:{ labels:sr.map(r => r.range_label), datasets:[{ data:sr.map(r => Number(r.saldo_total)), backgroundColor:sColors.slice(0, sr.length).map(c => c + '20'), borderColor:sColors.slice(0, sr.length), borderWidth:1.5, borderRadius:4 }] },
          options:{ plugins:{legend:{display:false}}, scales:{
            x:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} },
            y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} }
          }}
        });
      } else { _tarNoData('c-tar-saldos'); }

      // Saldos ranges table
      const sTbody = document.getElementById('tar-t-saldos-tbody');
      if (sTbody && sr && sr.length) {
        sTbody.innerHTML = sr.map(r =>
          '<tr><td>' + r.range_label + '</td><td style="text-align:right">' + _tarNum(r.count) +
          '</td><td style="text-align:right"><b>' + _tarFmt(r.saldo_total) + '</b></td></tr>'
        ).join('');
      }

      // Top clientes table
      const cTbody = document.getElementById('tar-t-clientes-tbody');
      if (cTbody && summary.top_clientes && summary.top_clientes.length) {
        cTbody.innerHTML = summary.top_clientes.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.cliente || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.tarjetas) + '</td><td style="text-align:right"><b>' + _tarFmt(r.saldo_total) + '</b></td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] tarjetahabientes error:', e);
      _tarSetEl('tar-t-periodo', 'Error al cargar datos');
    }
  }
}

// ==============================
// CATEGORÍAS P&L — GESTOR
// ==============================
const CAT_CD_DEFAULT = [
  {id:'cd1', nombre:'Nómina Operativa',      tipo:'Nómina',          empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd2', nombre:'Software',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd3', nombre:'Hardware',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd4', nombre:'Liquidity Providers',   tipo:'Costos Directos', empresas:['Wirebit'], ppto:0},
  {id:'cd5', nombre:'Comisiones Promotoría', tipo:'Com. Bancarias',  empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
];
const CAT_GA_DEFAULT = [
  {id:'ga1', nombre:'Nómina Administrativa', tipo:'Nómina', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga2', nombre:'Renta Oficina', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga3', nombre:'Mantenimiento', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga4', nombre:'Renta Impresora', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga5', nombre:'Software', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga6', nombre:'Hardware', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga7', nombre:'Efevoo Tarjetas', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga8', nombre:'Efevoo TPV', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga9', nombre:'Marketing', tipo:'Marketing', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga10', nombre:'Luz', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga11', nombre:'Insumos Oficina', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga12', nombre:'Viáticos', tipo:'Representación', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga13', nombre:'Comisiones Bancarias', tipo:'Com. Bancarias', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga14', nombre:'Cumplimiento', tipo:'Regulatorio', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
];

function catGetData(sec){
  const key = sec==='cd' ? 'gf_cat_cd' : 'gf_cat_ga';
  const def = sec==='cd' ? CAT_CD_DEFAULT : CAT_GA_DEFAULT;
  try { const s=DB.get(key); return (s&&s.length)?s:JSON.parse(JSON.stringify(def)); }
  catch(e){ return JSON.parse(JSON.stringify(def)); }
}
function catSetData(sec,data){
  DB.set(sec==='cd'?'gf_cat_cd':'gf_cat_ga', data);
}

let _catTab = 'cd';
let _catEditIdx = null;
let _catEditSec = 'cd';

function rCatView(){
  const cd = catGetData('cd');
  const ga = catGetData('ga');
  const empCols = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const allEmps = ['Salem','Endless','Dynamo','Wirebit'];

  function empBadges(empresas){
    return allEmps.map(e => {
      const active = empresas && empresas.includes(e);
      const col = empCols[e];
      return active
        ? '<span style="font-size:.6rem;background:'+col+'22;color:'+col+';padding:2px 6px;border-radius:8px;font-weight:600">'+e+'</span>'
        : '<span style="font-size:.6rem;background:var(--bg);color:var(--muted);padding:2px 6px;border-radius:8px;text-decoration:line-through">'+e+'</span>';
    }).join(' ');
  }

  function buildRows(arr, sec){
    const empList = ['Salem','Endless','Dynamo','Wirebit'];
    const empCols2 = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
    if(!arr.length) return '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Sin categorías</td></tr>';
    return arr.map((c,i)=>{
      const pp = c.ppto ? '$'+Number(c.ppto).toLocaleString('es-MX') : '—';
      const emps = c.empresas || empList;
      const boxes = empList.map(e=>{
        const col = empCols2[e];
        const chk = emps.includes(e) ? 'checked' : '';
        return '<label style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;padding:3px 7px;border-radius:6px;border:1px solid '+col+'33;background:'+col+'11">'
          +'<input type="checkbox" '+chk+' onchange="catToggleEmp('+i+',\''+sec+'\',\''+e+'\',this.checked)" style="accent-color:'+col+';width:11px;height:11px">'
          +'<span style="font-size:.6rem;font-weight:700;color:'+col+'">'+e.substring(0,3)+'</span>'
          +'</label>';
      }).join('');
      return '<tr id="cat-row-'+sec+'-'+i+'">'
        +'<td style="font-weight:600">'+escapeHtml(c.nombre)+'</td>'
        +'<td><span style="font-size:.65rem;color:var(--muted);background:var(--bg);padding:2px 7px;border-radius:10px">'+c.tipo+'</span></td>'
        +'<td><div style="display:flex;gap:3px;flex-wrap:wrap">'+boxes+'</div></td>'
        +'<td style="text-align:right">'+pp+'</td>'
        +'<td style="text-align:center;white-space:nowrap">'
          +(!isViewer() ? '<button onclick="catEdit('+i+',\''+sec+'\')" style="background:var(--blue-bg);color:#0073ea;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer;margin-right:4px">✏️</button>'
          +'<button onclick="catDel('+i+',\''+sec+'\')" style="background:#fde8e8;color:#c62828;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer">🗑</button>' : '')
        +'</td></tr>';
    }).join('');
  }

  // Update KPI exclusivas
  const allCats = cd.concat(ga);
  const kExcl = document.querySelector('#view-cfg_categorias .kpi-val[style*="orange"]');
  if(kExcl) kExcl.textContent = allCats.filter(c=>!c.empresas||c.empresas.length<4).length;

  const tcd = document.getElementById('cat-tbody-cd');
  const tga = document.getElementById('cat-tbody-ga');
  if(tcd) tcd.innerHTML = buildRows(cd,'cd');
  if(tga) tga.innerHTML = buildRows(ga,'ga');
}

function catSwitchTab(tab){
  _catTab = tab;
  const pcd = document.getElementById('catpanel-cd');
  const pga = document.getElementById('catpanel-ga');
  const tcd = document.getElementById('cat-tab-cd');
  const tga = document.getElementById('cat-tab-ga');
  if(pcd) pcd.style.display = tab==='cd' ? '' : 'none';
  if(pga) pga.style.display = tab==='ga' ? '' : 'none';
  if(tcd){ tcd.style.background = tab==='cd' ? '#0073ea' : 'var(--bg)'; tcd.style.color = tab==='cd' ? '#fff' : 'var(--text)'; tcd.style.border = tab==='cd' ? 'none' : '1px solid var(--border)'; }
  if(tga){ tga.style.background = tab==='ga' ? '#0073ea' : 'var(--bg)'; tga.style.color = tab==='ga' ? '#fff' : 'var(--text)'; tga.style.border = tab==='ga' ? 'none' : '1px solid var(--border)'; }
  rCatView();
}

function catNew(){
  catShowModal(null, _catTab);
}

function catEdit(idx, sec){
  catShowModal(idx, sec);
}

function catDel(idx, sec){
  const data = catGetData(sec);
  if(!confirm('¿Eliminar "'+data[idx].nombre+'"?')) return;
  data.splice(idx,1);
  catSetData(sec, data);
  rCatView();
  toast('🗑 Categoría eliminada');
}

function catShowModal(idx, sec){
  _catEditIdx = idx;
  _catEditSec = sec;
  const isNew = idx===null;
  const data  = catGetData(sec);
  const item  = isNew ? {nombre:'',tipo:'',wb_only:false,ppto:0} : data[idx];
  const empList = ['Salem','Endless','Dynamo','Wirebit'];
  const empColors = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const curEmps = item.empresas || empList;
  const wbRow = '<div style="margin-bottom:12px"><label class="fl">Aplica a estas empresas</label>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'
    + empList.map(e => {
        const checked = curEmps.includes(e) ? 'checked' : '';
        const col = empColors[e];
        return '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:8px;border:1px solid '+(curEmps.includes(e)?col:'var(--border)')+';background:'+(curEmps.includes(e)?col+'15':'var(--bg)')+';">'
          +'<input type="checkbox" id="cm-emp-'+e+'" '+checked+' style="accent-color:'+col+'">'
          +'<span style="font-size:.72rem;font-weight:600;color:'+(curEmps.includes(e)?col:'var(--muted)')+'">'+e+'</span>'
          +'</label>';
      }).join('')
    +'</div></div>';
  const html =
    '<div style="background:var(--white);border-radius:12px;width:420px;max-width:95vw;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.25)">'
    +'<div style="background:linear-gradient(135deg,#0073ea,#0060c7);padding:16px 22px;display:flex;align-items:center;justify-content:space-between">'
      +'<div style="font-family:Poppins,sans-serif;font-weight:700;color:#fff;font-size:.9rem">'+(isNew?'+ Nueva Categoría':'✏️ Editar Categoría')+'</div>'
      +'<button onclick="document.getElementById(\'confirm-overlay\').style.display=\'none\'" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:7px;cursor:pointer;font-size:.9rem">✕</button>'
    +'</div>'
    +'<div style="padding:20px 22px">'
      +'<div style="margin-bottom:12px"><label class="fl">Nombre</label>'
        +'<input type="text" id="cm-nombre" class="fi" value="'+escapeHtml(item.nombre)+'" placeholder="Ej: Comisiones Promotoría"></div>'
      +'<div style="margin-bottom:12px"><label class="fl">Tipo / Agrupación</label>'
        +'<input type="text" id="cm-tipo" class="fi" value="'+escapeHtml(item.tipo)+'" placeholder="Ej: Nómina, Operaciones..."></div>'
      +'<div style="margin-bottom:12px"><label class="fl">Presupuesto Mensual ($)</label>'
        +'<input type="number" id="cm-ppto" class="fi n" value="'+(item.ppto||0)+'" min="0"></div>'
      + wbRow
      +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">'
        +'<button onclick="document.getElementById(\'confirm-overlay\').style.display=\'none\'" class="btn btn-out">Cancelar</button>'
        +'<button onclick="catSaveModal()" style="background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:.8rem;font-weight:600;cursor:pointer">✅ Guardar</button>'
      +'</div>'
    +'</div>'
  +'</div>';
  const ov = document.getElementById('confirm-overlay');
  ov.style.display = 'flex';
  ov.innerHTML = html;
}

function catSaveModal(){
  const nombre = document.getElementById('cm-nombre').value.trim();
  const tipo   = document.getElementById('cm-tipo').value.trim();
  const ppto   = parseFloat(document.getElementById('cm-ppto').value)||0;
  const empList2 = ['Salem','Endless','Dynamo','Wirebit'];
  const empresas = empList2.filter(e => { const el=document.getElementById('cm-emp-'+e); return el&&el.checked; });
  if(!nombre){ toast('⚠️ Ingresa el nombre'); return; }
  if(!empresas.length){ toast('⚠️ Selecciona al menos una empresa'); return; }
  const data = catGetData(_catEditSec);
  if(_catEditIdx===null){
    data.push({id:_catEditSec+'_'+Date.now(), nombre, tipo, empresas, ppto});
    toast('✅ Categoría "'+nombre+'" agregada');
  } else {
    data[_catEditIdx] = {...data[_catEditIdx], nombre, tipo, empresas, ppto};
    toast('✅ Categoría "'+nombre+'" actualizada');
  }
  catSetData(_catEditSec, data);
  document.getElementById('confirm-overlay').style.display='none';
  rCatView();
}


function catToggleEmp(idx, sec, empresa, checked){
  const data = catGetData(sec);
  if(!data[idx]) return;
  let emps = data[idx].empresas ? [...data[idx].empresas] : ['Salem','Endless','Dynamo','Wirebit'];
  if(checked && !emps.includes(empresa)) emps.push(empresa);
  if(!checked)  emps = emps.filter(e => e !== empresa);
  if(!emps.length){ 
    toast('⚠️ Debe quedar al menos una empresa'); 
    // Revert checkbox
    const cb = document.querySelector('#cat-row-'+sec+'-'+idx+' input[onchange*=\''+empresa+'\']');
    if(cb) cb.checked = true;
    return; 
  }
  data[idx].empresas = emps;
  catSetData(sec, data);
  // Update KPI exclusivas
  const allCD = catGetData('cd');
  const allGA = catGetData('ga');
  const excl = [...allCD,...allGA].filter(c=>!c.empresas||c.empresas.length<4).length;
  const kex = document.getElementById('cat-kpi-excl');
  if(kex) kex.textContent = excl;
  toast('✅ Guardado');
}

  // Expose on window
  window.TAR_CHARTS = TAR_CHARTS;
  window._tarFmt = _tarFmt;
  window._tarNum = _tarNum;
  window._tarPct = _tarPct;
  window._tarSetEl = _tarSetEl;
  window._tarNoData = _tarNoData;
  window.initTarCharts = initTarCharts;
  // Categorías P&L
  window.CAT_CD_DEFAULT = CAT_CD_DEFAULT;
  window.CAT_GA_DEFAULT = CAT_GA_DEFAULT;
  window.catGetData = catGetData;
  window.catSetData = catSetData;
  window.rCatView = rCatView;
  window.catSwitchTab = catSwitchTab;
  window.catNew = catNew;
  window.catEdit = catEdit;
  window.catDel = catDel;
  window.catShowModal = catShowModal;
  window.catSaveModal = catSaveModal;
  window.catToggleEmp = catToggleEmp;
  window._catTab = _catTab;
  window._catEditIdx = _catEditIdx;
  window._catEditSec = _catEditSec;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tar_dashboard', function(){ setTimeout(function(){ initTarCharts('tar_dashboard'); }, 50); });
    registerView('tar_conceptos', function(){ setTimeout(function(){ initTarCharts('tar_conceptos'); }, 50); });
    registerView('tar_subclientes', function(){ setTimeout(function(){ initTarCharts('tar_subclientes'); }, 50); });
    registerView('tar_rechazos', function(){ setTimeout(function(){ initTarCharts('tar_rechazos'); }, 50); });
    registerView('tar_tarjetahabientes', function(){ setTimeout(function(){ initTarCharts('tar_tarjetahabientes'); }, 50); });
  }

})(window);
