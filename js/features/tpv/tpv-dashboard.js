// GF — TPV: Dashboard
(function(window) {
  'use strict';

async function initTPVDashboard(fromDate, toDate) {
  console.log('[TPV] initTPVDashboard loading...');
  // Use provided dates or get from date pickers, default to current month
  const from = fromDate || document.getElementById('dash-from')?.value || (()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-01'})();
  const to = toDate || document.getElementById('dash-to')?.value || new Date().toISOString().slice(0,10);
  // Update date picker values
  const dfEl = document.getElementById('dash-from'); if(dfEl && !dfEl.value) dfEl.value = from;
  const dtEl = document.getElementById('dash-to'); if(dtEl && !dtEl.value) dtEl.value = to;
  const [clients, kpis, mix] = await Promise.all([
    TPV.clientsByVolume(from, to), TPV.kpis(from, to), TPV.commissionMix(from, to)
  ]);
  console.log('[TPV] initTPVDashboard data:', { from, to, clients: (clients||[]).length, kpis: kpis ? 'OK' : 'null', mix: (mix||[]).length });
  const k = kpis || {};
  const periodLabel = from && to ? `${from} → ${to}` : 'Histórico completo';
  const sub = document.getElementById('tpv-dashboard-subtitle');
  if (sub) sub.innerHTML = `Período: <span style="color:#0073ea;font-weight:600">${periodLabel}</span> · ${k.num_clientes || 0} clientes · ${(k.num_transacciones||0).toLocaleString()} txns`;
  // Update chart and table labels dynamically
  const chartPeriod = document.getElementById('dd-chart-period');
  if (chartPeriod) chartPeriod.textContent = periodLabel;
  const piePeriod = document.getElementById('dd-pie-period');
  if (piePeriod) piePeriod.textContent = periodLabel;
  const tableTitle = document.getElementById('dd-table-title');
  if (tableTitle) tableTitle.textContent = `Clientes — ${periodLabel}`;
  _renderClientTable('dd-tbody', clients || []);
  _renderKpis('tpv-dashboard-kpis', k, mix, false);
  setTimeout(() => _renderCharts('dd_top', 'dd_pie', clients, mix, '#00b875'), 50);

  // Calculate and render Salem monthly earnings
  const year = (from || to || new Date().toISOString()).slice(0, 4);
  TPV.calcMonthlyPL(year).then(plData => {
    _renderSalemEarnings(plData);
  }).catch(e => {
    console.warn('[TPV] Salem earnings calc failed:', e.message);
    _renderSalemEarnings(TPV.monthlyPLData(year));
  });
}

// Helper for quick date buttons
function setDashDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  const _ds = d => d.toISOString().slice(0,10);
  const _ago = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  if (period === 'yesterday') {
    from = _ds(_ago(1)); to = _ds(_ago(1));
  }
  else if (period === 'weekend') {
    const dow = now.getDay();
    let fOff, sOff;
    if (dow === 1) { fOff = 4; sOff = 1; }
    else if (dow === 0) { fOff = 2; sOff = 1; }
    else if (dow === 6) { from = _ds(_ago(1)); to = _ds(_ago(1));
      document.getElementById('dash-from').value = from;
      document.getElementById('dash-to').value = to;
      TPV.invalidateAll(); initTPVDashboard(from, to); return;
    } else { fOff = dow + 2; sOff = dow; }
    from = _ds(_ago(fOff)); to = _ds(_ago(sOff));
  }
  else if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('dash-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('dash-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  initTPVDashboard(from, to);
}
function setPagosDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  const _ds = d => d.toISOString().slice(0,10); // date to string helper
  const _ago = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; }; // N days ago

  if (period === 'today') {
    // "Hoy" = cobros de hoy corresponden a transacciones de ayer
    const ayer = _ago(1);
    from = _ds(ayer);
    to = _ds(ayer);
  }
  else if (period === 'weekend') {
    // "Fin de Semana" = viernes a domingo
    // Si hoy es lunes (1): por el corte de las 11 PM, incluir desde jueves
    // dow: 0=dom, 1=lun, 2=mar, 3=mie, 4=jue, 5=vie, 6=sab
    const dow = now.getDay();
    let fridayOffset, sundayOffset;
    if (dow === 1) {
      // Lunes: jueves(-4) a domingo(-1) por el corte 11 PM
      fridayOffset = 4; // jueves
      sundayOffset = 1; // domingo
    } else if (dow === 0) {
      // Domingo: viernes(-2) a sábado(-1) (hoy aún es domingo)
      fridayOffset = 2;
      sundayOffset = 1;
    } else if (dow === 6) {
      // Sábado: viernes(-1) es ayer
      fridayOffset = 1;
      sundayOffset = 0; // hoy no hay domingo aún, solo hasta viernes
      // Pero mostramos viernes
      from = _ds(_ago(1));
      to = _ds(_ago(1));
      const dfEl = document.getElementById('pagos-from'); if(dfEl) dfEl.value = from || '';
      const dtEl = document.getElementById('pagos-to'); if(dtEl) dtEl.value = to || '';
      TPV.invalidateAll();
      rTPVPagos();
      return;
    } else {
      // Martes(2) a viernes(5): buscar el fin de semana pasado
      // Viernes pasado: retroceder (dow - 5 + 7) % 7 o simplemente calcular
      // dow=2(mar): vie=-4, dom=-2  |  dow=3(mie): vie=-5, dom=-3
      // dow=4(jue): vie=-6, dom=-4  |  dow=5(vie): vie=-7, dom=-5
      fridayOffset = dow + 2; // viernes pasado
      sundayOffset = dow;      // domingo pasado
    }
    from = _ds(_ago(fridayOffset));
    to = _ds(_ago(sundayOffset));
  }
  else if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('pagos-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('pagos-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  rTPVPagos();
}


// ═══════════════════════════════════════
// SALEM MONTHLY EARNINGS — Dashboard Section + Modal
// ═══════════════════════════════════════

const MES_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function _renderSalemEarnings(data) {
  const kSalem = document.getElementById('se-kpi-salem');
  const kPromo = document.getElementById('se-kpi-promo');
  const kInternas = document.getElementById('se-kpi-internas');
  const kNeto = document.getElementById('se-kpi-neto');
  const sub = document.getElementById('salem-earn-subtitle');
  if (!kSalem) return;

  if (!data || !data.monthly) {
    kSalem.textContent = '—';
    kPromo.textContent = '—';
    kInternas.textContent = '—';
    kNeto.textContent = '—';
    if (sub) sub.textContent = 'Datos no disponibles — carga datos TPV primero';
    return;
  }

  const totSalem = data.monthly.reduce((s, m) => s + (m.com_salem || 0), 0);
  const totPromo = data.monthly.reduce((s, m) => s + (m.com_comisionista || 0), 0);
  const totInternas = data.monthly.reduce((s, m) => s + (m.com_agentes || 0), 0);
  const neto = totSalem - totPromo - totInternas;

  kSalem.textContent = fmtTPV(totSalem);
  kPromo.textContent = fmtTPV(totPromo);
  kInternas.textContent = fmtTPV(totInternas);
  kNeto.textContent = fmtTPV(neto);
  if (sub) {
    const activeMo = data.monthly.filter(m => m.com_salem > 0).length;
    sub.textContent = `${data.year} · ${activeMo} meses con actividad · Auto-sync P&L`;
  }

  // Mini bar chart — monthly com_salem
  const canvas = document.getElementById('c-tpv-salem-monthly');
  if (!canvas) return;
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textC = isDark ? '#9da0c5' : '#8b8fb5';

  if (TPV_CHARTS['csalearnm']) TPV_CHARTS['csalearnm'].destroy();
  TPV_CHARTS['csalearnm'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MES_NAMES,
      datasets: [
        { label: 'Com. Salem', data: data.monthly.map(m => m.com_salem || 0), backgroundColor: '#0073ea33', borderColor: '#0073ea', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Promotoría', data: data.monthly.map(m => -(m.com_comisionista || 0)), backgroundColor: '#ff704333', borderColor: '#ff7043', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Internas', data: data.monthly.map(m => -(m.com_agentes || 0)), backgroundColor: '#9b51e033', borderColor: '#9b51e0', borderWidth: 1.5, borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: textC, boxWidth: 10, padding: 8 } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: textC, font: { size: 8 } } },
        y: { stacked: true, grid: { color: gridC }, ticks: { color: textC, font: { size: 8 }, callback: v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v } }
      }
    }
  });
}

function openSalemEarnings() {
  const year = new Date().getFullYear().toString();
  const data = TPV.monthlyPLData(year);
  if (!data || !data.monthly) {
    if (typeof toast === 'function') toast('⚠️ No hay datos mensuales — carga el Dashboard TPV primero');
    return;
  }

  const ov = document.getElementById('salem-earnings-overlay');
  if (!ov) return;

  // Update subtitle
  const sub = document.getElementById('salem-earn-modal-subtitle');
  if (sub) sub.textContent = `Año ${data.year} · ${data.byClient ? data.byClient.length : 0} clientes · Actualizado ${new Date(data.updated).toLocaleString('es-MX')}`;

  // Monthly summary table
  const tbody = document.getElementById('salem-earn-monthly-tbody');
  const tfoot = document.getElementById('salem-earn-monthly-tfoot');
  if (tbody) {
    tbody.innerHTML = data.monthly.map((m, i) => {
      const neto = (m.com_salem || 0) - (m.com_comisionista || 0) - (m.com_agentes || 0);
      const hasData = m.com_salem > 0;
      return `<tr style="${!hasData ? 'opacity:.4' : ''}">
        <td class="bld">${MES_NAMES[i]}</td>
        <td class="mo" style="color:#0073ea">${fmtTPVFull(m.com_salem)}</td>
        <td class="mo" style="color:#ff7043">${fmtTPVFull(m.com_comisionista)}</td>
        <td class="mo" style="color:#9b51e0">${fmtTPVFull(m.com_agentes)}</td>
        <td class="mo bld ${neto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(neto)}</td>
        <td class="mo">${fmtTPVFull(m.total_cobrado)}</td>
      </tr>`;
    }).join('');
  }
  if (tfoot) {
    const tSalem = data.monthly.reduce((s, m) => s + (m.com_salem || 0), 0);
    const tPromo = data.monthly.reduce((s, m) => s + (m.com_comisionista || 0), 0);
    const tInt = data.monthly.reduce((s, m) => s + (m.com_agentes || 0), 0);
    const tCob = data.monthly.reduce((s, m) => s + (m.total_cobrado || 0), 0);
    const tNeto = tSalem - tPromo - tInt;
    tfoot.innerHTML = `<tr style="font-weight:700;border-top:2px solid var(--border)">
      <td>TOTAL</td>
      <td class="mo" style="color:#0073ea">${fmtTPVFull(tSalem)}</td>
      <td class="mo" style="color:#ff7043">${fmtTPVFull(tPromo)}</td>
      <td class="mo" style="color:#9b51e0">${fmtTPVFull(tInt)}</td>
      <td class="mo bld ${tNeto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(tNeto)}</td>
      <td class="mo">${fmtTPVFull(tCob)}</td>
    </tr>`;
  }

  // Per-client detail table
  const cTbody = document.getElementById('salem-earn-client-tbody');
  if (cTbody && data.byClient) {
    cTbody.innerHTML = data.byClient.map((c, i) => {
      const neto = c.total_salem - c.total_comisionista - c.total_agentes;
      const pctPromo = c.total_salem > 0 ? ((c.total_comisionista + c.total_agentes) / c.total_salem * 100).toFixed(1) : '0.0';
      return `<tr data-name="${c.cliente.toLowerCase()}">
        <td style="color:var(--muted);font-size:.72rem">${i + 1}</td>
        <td class="bld">${escapeHtml(c.cliente)}</td>
        <td>${c.agente ? '<span style="font-size:.65rem;background:var(--purple-bg);color:var(--purple);padding:2px 5px;border-radius:4px">' + escapeHtml(c.siglas || c.agente) + '</span>' : '<span style="color:var(--muted);font-size:.65rem">—</span>'}</td>
        <td class="mo" style="color:#0073ea">${fmtTPVFull(c.total_salem)}</td>
        <td class="mo" style="color:#ff7043">${fmtTPVFull(c.total_comisionista)}</td>
        <td class="mo" style="color:#9b51e0">${fmtTPVFull(c.total_agentes)}</td>
        <td class="mo">${pctPromo}%</td>
        <td class="mo bld ${neto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(neto)}</td>
      </tr>`;
    }).join('');
  }

  ov.style.display = 'flex';
}

function closeSalemEarnings() {
  const ov = document.getElementById('salem-earnings-overlay');
  if (ov) ov.style.display = 'none';
}

function filterSalemClients(q) {
  const rows = document.querySelectorAll('#salem-earn-client-tbody tr');
  const lq = q.toLowerCase();
  rows.forEach(r => { r.style.display = r.dataset.name && r.dataset.name.includes(lq) ? '' : 'none'; });
}

  // Expose on window
  window.initTPVDashboard = initTPVDashboard;
  window.setDashDates = setDashDates;
  window.setPagosDates = setPagosDates;
  window.MES_NAMES = MES_NAMES;
  window._renderSalemEarnings = _renderSalemEarnings;
  window.openSalemEarnings = openSalemEarnings;
  window.closeSalemEarnings = closeSalemEarnings;
  window.filterSalemClients = filterSalemClients;

})(window);
