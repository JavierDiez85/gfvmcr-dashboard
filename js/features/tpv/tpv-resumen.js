// GF — TPV: Resumen por Cliente
(function(window) {
  'use strict';

// ═══════════════════════════════════════
// RESUMEN POR CLIENTE — Vista dinámica
// ═══════════════════════════════════════

let _resumenClients = null; // cached client commission data
let _resumenAllOptions = []; // all options for search filtering

/** Helper: read resumen date filters */
function _getResumenDates() {
  const from = document.getElementById('resumen-from')?.value || null;
  const to = document.getElementById('resumen-to')?.value || null;
  return { from, to };
}

/** Quick date presets for Resumen por Cliente */
function setResumenDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('resumen-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('resumen-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  rTPVResumen();
}

/** Load client list into filter dropdown */
async function rTPVResumen() {
  if(typeof gfpRender === 'function'){
    gfpRender('tpv-resumen-pbar', {ent:'tpv', color:'#0073ea', type:'sub', years:['2025','2026'], viewId:'tpv_resumen'});
  }
  await _ensureSupabase();
  const filterType = document.getElementById('resumen-filter-type');
  const filterValue = document.getElementById('resumen-filter-value');
  const searchEl = document.getElementById('resumen-search');
  if (!filterType || !filterValue) return;
  if (searchEl) searchEl.value = '';

  const { from, to } = _getResumenDates();

  // Update subtitle with period
  const subtitle = document.getElementById('resumen-subtitle');
  if (subtitle) {
    const periodLabel = from && to ? `${from} → ${to}` : from ? `Desde ${from}` : 'Histórico completo';
    subtitle.textContent = `Selecciona un cliente o promotor · ${periodLabel}`;
  }

  // Load commission data with date filter
  _resumenClients = await TPV.clientCommissions(from, to) || [];

  const type = filterType.value;
  _resumenAllOptions = [];
  filterValue.innerHTML = '<option value="">— Seleccionar —</option>';

  if (type === 'cliente') {
    _resumenClients.forEach(c => {
      _resumenAllOptions.push({ value: c.client_id, label: c.cliente });
      filterValue.innerHTML += `<option value="${_esc(c.client_id)}">${_esc(c.cliente)}</option>`;
    });
  } else {
    const { data: clients } = await _sb.from('tpv_clients').select('id, promotor').not('promotor', 'is', null);
    const promotors = [...new Set((clients || []).map(c => c.promotor).filter(Boolean))].sort();
    promotors.forEach(p => {
      _resumenAllOptions.push({ value: p, label: p });
      filterValue.innerHTML += `<option value="${_esc(p)}">${_esc(p)}</option>`;
    });
  }
}

/** Filter dropdown options based on search text */
function filterResumenOptions(query) {
  const filterValue = document.getElementById('resumen-filter-value');
  if (!filterValue) return;
  const q = (query || '').toLowerCase().trim();
  filterValue.innerHTML = '<option value="">— Seleccionar —</option>';
  const filtered = q ? _resumenAllOptions.filter(o => o.label.toLowerCase().includes(q)) : _resumenAllOptions;
  filtered.forEach(o => { filterValue.innerHTML += `<option value="${_esc(o.value)}">${_esc(o.label)}</option>`; });
  // Auto-select if only one match
  if (filtered.length === 1) { filterValue.value = filtered[0].value; rTPVResumenDetail(); }
}

/** Show detail for selected client/promotor */
async function rTPVResumenDetail() {
  await _ensureSupabase();
  const filterType = document.getElementById('resumen-filter-type')?.value;
  const filterValue = document.getElementById('resumen-filter-value')?.value;
  const kpiEl = document.getElementById('resumen-kpis');
  const detailEl = document.getElementById('resumen-detail');
  const subtitle = document.getElementById('resumen-subtitle');

  if (!filterValue) {
    if (kpiEl) kpiEl.innerHTML = '<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un cliente arriba ⬆️</div></div>';
    if (detailEl) detailEl.style.display = 'none';
    return;
  }

  let clientData;
  let displayName;

  if (filterType === 'cliente') {
    clientData = (_resumenClients || []).find(c => String(c.client_id) === filterValue);
    displayName = clientData ? clientData.cliente : filterValue;
  } else {
    // Promotor: aggregate all clients with this promotor
    const { data: promClients } = await _sb.from('tpv_clients').select('id').eq('promotor', filterValue);
    const ids = (promClients || []).map(c => c.id);
    const all = (_resumenClients || []).filter(c => ids.includes(c.client_id));
    if (all.length === 0) {
      if (kpiEl) kpiEl.innerHTML = '<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Sin datos para este promotor</div></div>';
      if (detailEl) detailEl.style.display = 'none';
      return;
    }
    clientData = {
      cliente: filterValue,
      total_cobrado: all.reduce((s, c) => s + parseFloat(c.total_cobrado || 0), 0),
      com_efevoo: all.reduce((s, c) => s + parseFloat(c.com_efevoo || 0), 0),
      com_salem: all.reduce((s, c) => s + parseFloat(c.com_salem || 0), 0),
      com_convenia: all.reduce((s, c) => s + parseFloat(c.com_convenia || 0), 0),
      com_comisionista: all.reduce((s, c) => s + parseFloat(c.com_comisionista || 0), 0),
      monto_neto: all.reduce((s, c) => s + parseFloat(c.monto_neto || 0), 0),
    };
    displayName = filterValue + ` (${all.length} clientes)`;
  }

  if (!clientData) return;

  const { from: rFrom, to: rTo } = _getResumenDates();
  const periodLabel = rFrom && rTo ? `${rFrom} → ${rTo}` : rFrom ? `Desde ${rFrom}` : 'Histórico completo';
  if (subtitle) subtitle.textContent = `Análisis de ventas y comisiones · ${displayName} · ${periodLabel}`;

  const cobrado = parseFloat(clientData.total_cobrado) || 0;
  const comEf = parseFloat(clientData.com_efevoo) || 0;
  const comSa = parseFloat(clientData.com_salem) || 0;
  const comCo = parseFloat(clientData.com_convenia) || 0;
  const comCm = parseFloat(clientData.com_comisionista) || 0;
  const totalCom = comEf + comSa + comCo + comCm;
  const pctCom = cobrado > 0 ? (totalCom / cobrado * 100).toFixed(1) : '0.0';

  // KPIs
  if (kpiEl) kpiEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Monto de Ventas</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(cobrado)}</div>
      <div class="kpi-d dnu">Total facturado</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totalCom)}</div>
      <div class="kpi-d dup">${pctCom}% del cobrado</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${Math.min(parseFloat(pctCom), 100)}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--purple)">
      <div class="kpi-top"><div class="kpi-lbl">Com. Efevoo</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">⚡</div></div>
      <div class="kpi-val" style="color:var(--purple)">${fmtTPV(comEf)}</div>
      <div class="kpi-d dnu">${totalCom > 0 ? (comEf / totalCom * 100).toFixed(1) : '0.0'}%</div>
      <div class="kbar"><div class="kfill" style="background:var(--purple);width:${totalCom > 0 ? (comEf / totalCom * 100) : 0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Com. Salem</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🏦</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(comSa)}</div>
      <div class="kpi-d dnu">${totalCom > 0 ? (comSa / totalCom * 100).toFixed(1) : '0.0'}%</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:${totalCom > 0 ? (comSa / totalCom * 100) : 0}%"></div></div>
    </div>`;

  // Detail tables
  if (detailEl) detailEl.style.display = 'block';

  // Commission breakdown
  const comTbody = document.getElementById('resumen-com-tbody');
  if (comTbody) {
    const entities = [
      { name: 'Efevoo', val: comEf },
      { name: 'Salem', val: comSa },
      { name: 'Convenia', val: comCo },
      { name: 'Comisionista', val: comCm }
    ];
    comTbody.innerHTML = entities.map(e => {
      const pct = totalCom > 0 ? (e.val / totalCom * 100).toFixed(1) : '0.0';
      return `<tr><td class="bld">${e.name}</td><td class="mo pos">${fmtTPV(e.val)}</td><td class="mo">${pct}%</td></tr>`;
    }).join('') + `<tr><td colspan="3" style="padding:0;border:none"><div style="height:1px;background:var(--border2);margin:4px 0"></div></td></tr>
      <tr><td class="bld" style="color:var(--text)">TOTAL</td><td class="mo bld pos">${fmtTPV(totalCom)}</td><td class="mo bld">100%</td></tr>`;
  }

  // Card type breakdown - we need to fetch this from clientsByVolume for this specific client
  const cardTbody = document.getElementById('resumen-card-tbody');
  if (cardTbody && filterType === 'cliente') {
    const volData = (await TPV.clientsByVolume(rFrom, rTo) || []).find(c => String(c.client_id) === filterValue);
    if (volData) {
      const tc = parseFloat(volData.monto_tc) || 0;
      const td = parseFloat(volData.monto_td) || 0;
      const amex = parseFloat(volData.monto_amex) || 0;
      const ti = parseFloat(volData.monto_ti) || 0;
      const total = tc + td + amex + ti || 1;
      cardTbody.innerHTML = [
        { name: 'Crédito TC', val: tc },
        { name: 'Débito TD', val: td },
        { name: 'Amex', val: amex },
        { name: 'Internacional', val: ti }
      ].map(e => `<tr><td class="bld">${e.name}</td><td class="mo">${fmtTPV(e.val)}</td><td class="mo">${(e.val / total * 100).toFixed(1)}%</td></tr>`).join('');
    }
  } else if (cardTbody) {
    cardTbody.innerHTML = '<tr><td colspan="3" style="color:var(--muted);text-align:center;font-size:.72rem">Disponible solo para clientes individuales</td></tr>';
  }
}

  // Expose on window
  window.setResumenDates = setResumenDates;
  window.rTPVResumen = rTPVResumen;
  window.filterResumenOptions = filterResumenOptions;
  window.rTPVResumenDetail = rTPVResumenDetail;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_resumen', function(){ return rTPVResumen(); });
  }

})(window);
