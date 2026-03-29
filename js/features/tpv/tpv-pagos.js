// GF — TPV: Pagos
(function(window) {
  'use strict';

// ==============================
// TPV PAGOS — CAPTURA & LOCALSTORAGE
// ==============================

const PAGOS_KEY = 'gf_tpv_pagos';

// Load payments from localStorage
function pagosLoad() {
  try { return DB.get(PAGOS_KEY) || {}; }
  catch(e) { return {}; }
}

// Save payments to localStorage
function pagosSave(data) {
  DB.set(PAGOS_KEY, data);
}

// Get total paid for a client id (excludes voided payments)
function pagosTotalCliente(id, data) {
  const pagos = (data[id] || []);
  return pagos.filter(p => !p.anulado).reduce((s, p) => s + p.monto, 0);
}

// Get effective saldo for a client (a_pagar = cobrado - comisiones, minus what's been paid)
function pagosSaldo(cliente) {
  const data = pagosLoad();
  const pagado = pagosTotalCliente(cliente.id, data);
  const aPagar = cliente.a_pagar || (parseFloat(cliente.total_cobrado||0) - parseFloat(cliente.total_comisiones||0));
  return Math.max(0, aPagar - pagado);
}

// ── WRAPPER: Vista unificada Pagos + Historial ──
async function rTPVPagosView(){
  if(typeof gfpRender === 'function'){
    gfpRender('tpv-pagos-pbar', {ent:'tpv', color:'#0073ea', type:'sub', years:['2025','2026'], viewId:'tpv_pagos'});
  }
  await rTPVPagos();
  await rTPVHistorial();
}

// ── RENDER rTPVPagos ──
async function rTPVPagos() {
  const tbody = document.getElementById('pagos-tbody');
  if (!tbody) return;

  const data = pagosLoad();
  const today = new Date().toLocaleDateString('es-MX');

  // Get date range from pickers (if available)
  const fromDate = document.getElementById('pagos-from')?.value || null;
  const toDate = document.getElementById('pagos-to')?.value || null;
  const periodText = fromDate && toDate ? `${fromDate} → ${toDate}` : 'Histórico completo';

  // Load client commissions from Supabase for the selected period
  const comData = await TPV.clientCommissions(fromDate, toDate) || [];

  // Calculate effective totals with corrected data model:
  // total_cobrado = what clients' customers paid
  // monto_neto (from RPC) = sum of all commissions
  // a_pagar = total_cobrado - monto_neto = what we owe client
  let totCobrado = 0, totComisiones = 0, totAPagar = 0, totPagado = 0, totPend = 0, conSaldo = 0;
  const rows = comData.map(p => {
    const cobrado = parseFloat(p.total_cobrado) || 0;
    const comTotal = parseFloat(p.monto_neto) || 0;
    const aPagar = cobrado - comTotal;
    const pagado = pagosTotalCliente(p.client_id, data);
    const saldo = Math.max(0, aPagar - pagado);
    totCobrado += cobrado;
    totComisiones += comTotal;
    totAPagar += aPagar;
    totPagado += pagado;
    totPend += saldo;
    if (saldo > 0) conSaldo++;
    return {
      id: p.client_id, cliente: p.cliente,
      total_cobrado: cobrado, total_comisiones: comTotal,
      com_efevoo: parseFloat(p.com_efevoo)||0, com_salem: parseFloat(p.com_salem)||0,
      com_convenia: parseFloat(p.com_convenia)||0, com_comisionista: parseFloat(p.com_comisionista)||0,
      a_pagar: aPagar, _totalPagado: pagado, _saldo: saldo,
      _nPagos: (data[p.client_id] || []).length,
      _rate_corrected: p._rate_corrected || false
    };
  });

  // Store in cache for modal functions
  _tpvPagosCache = rows;

  // KPIs
  const kEl = document.getElementById('tpv-pagos-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(totCobrado)}</div>
      <div class="kpi-d dnu">${comData.length} clientes · ${periodText}</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--orange)">
      <div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📊</div></div>
      <div class="kpi-val" style="color:var(--orange)">${fmtTPV(totComisiones)}</div>
      <div class="kpi-d dnu">${totCobrado > 0 ? (totComisiones/totCobrado*100).toFixed(2) : '0.0'}% del cobrado</div>
      <div class="kbar"><div class="kfill" style="background:var(--orange);width:${totCobrado>0?Math.min(totComisiones/totCobrado*100,100).toFixed(0):0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">A Pagar (Clientes)</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💵</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totAPagar)}</div>
      <div class="kpi-d dnu">Pagado: ${fmtTPV(totPagado)} (${totAPagar>0?(totPagado/totAPagar*100).toFixed(1):'0'}%)</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${totAPagar>0?Math.min(totPagado/totAPagar*100,100).toFixed(0):0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--red)">
      <div class="kpi-top"><div class="kpi-lbl">Saldo Pendiente</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div>
      <div class="kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div>
      <div class="kpi-d dnu">${conSaldo} clientes con saldo</div>
      <div class="kbar"><div class="kfill" style="background:var(--red);width:${totAPagar>0?Math.min(totPend/totAPagar*100,100).toFixed(0):0}%"></div></div>
    </div>
  `;

  // Update timestamp
  const upd = document.getElementById('pagos-last-update');
  if (upd) upd.textContent = 'Actualizado: ' + today;

  // Table rows - corrected columns
  tbody.innerHTML = rows.filter(p => p.a_pagar > 0 || p._totalPagado > 0).map((p, i) => {
    const pct = p.a_pagar > 0 ? (p._totalPagado / p.a_pagar * 100) : 0;
    const est = p._saldo <= 0
      ? '<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Al día</span>'
      : pct > 0
        ? '<span class="pill" style="background:var(--yellow-lt);color:#7a5000">Parcial</span>'
        : '<span class="pill" style="background:var(--red-lt);color:#b02020">Pendiente</span>';
    const histBtn = p._nPagos > 0
      ? `<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${p._nPagos}</span>`
      : '';
    return `<tr>
      <td style="padding:6px 8px;width:28px">
        <button class="pagos-hist-btn" data-pid="${p.id}" title="Ver historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px;border-radius:4px;${p._nPagos===0?'opacity:.35':''}">🕐${histBtn}</button>
      </td>
      <td class="bld" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}${p._rate_corrected ? ' <span title="Comisiones corregidas por cambio de tasa histórica" style="font-size:.55rem;background:var(--purple-bg);color:var(--purple);border-radius:6px;padding:1px 5px;font-weight:700;cursor:help;vertical-align:middle">📊 Ajuste</span>' : ''}</td>
      <td class="mo">${fmtTPVFull(p.total_cobrado,2)}</td>
      <td class="mo" style="color:var(--orange)">${fmtTPVFull(p.total_comisiones,2)}</td>
      <td class="mo bld pos">${fmtTPVFull(p.a_pagar,2)}</td>
      <td class="mo pos">${p._totalPagado > 0 ? fmtTPVFull(p._totalPagado,2) : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="mo ${p._saldo > 0 ? 'neg' : 'pos'}">${p._saldo > 0.01 ? fmtTPVFull(p._saldo,2) : '<span style="color:var(--green)">✓ $0</span>'}</td>
      <td>${est}</td>
      <td style="text-align:center">
        <button class="pagos-pago-btn" data-pid="${p.id}" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>
      </td>
    </tr>`;
  }).join('');

  // Event delegation for pagos table
  if (!tbody._pagosBound) {
    tbody.addEventListener('click', function(e) {
      const histBtn = e.target.closest('.pagos-hist-btn');
      if (histBtn) { openHistorial(parseInt(histBtn.dataset.pid)); return; }
      const pagoBtn = e.target.closest('.pagos-pago-btn');
      if (pagoBtn) { openPagoModal(parseInt(pagoBtn.dataset.pid)); return; }
    });
    tbody._pagosBound = true;
  }

  // Show correction info banner if any clients have rate corrections
  const correctedCount = rows.filter(r => r._rate_corrected).length;
  const pagosView = document.getElementById('view-tpv_pagos');
  let banner = document.getElementById('rate-corr-banner');
  if (correctedCount > 0) {
    if (!banner && pagosView) {
      banner = document.createElement('div');
      banner.id = 'rate-corr-banner';
      pagosView.appendChild(banner);
    }
    if (banner) banner.innerHTML = `<div style="margin-top:10px;padding:8px 14px;background:var(--purple-bg);border-radius:8px;font-size:.7rem;color:var(--purple);display:flex;align-items:center;gap:8px">
      <span>📊</span>
      <span><b>${correctedCount} cliente${correctedCount > 1 ? 's' : ''}</b> con comisiones ajustadas por cambios de tasa históricos.</span>
      <button onclick="openRateChanges()" style="background:var(--purple);color:#fff;border:none;border-radius:5px;padding:3px 10px;font-size:.65rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif;white-space:nowrap">Ver Historial</button>
    </div>`;
  } else if (banner) {
    banner.innerHTML = '';
  }
}

// ── PAGO MODAL ──
let _pagoClienteId = null;

function openPagoModal(clienteId) {
  _pagoClienteId = clienteId;
  const ov = document.getElementById('pago-overlay');
  ov.style.display = 'flex';

  // Set today's date
  document.getElementById('pago-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('pago-monto').value = '';
  document.getElementById('pago-ref').value = '';
  document.getElementById('pago-monto-warn').style.display = 'none';

  // Populate client selector + search cache
  const sel = document.getElementById('pago-cliente-sel');
  const wrap = document.getElementById('pago-cliente-wrap');
  const eligibleClients = _tpvPagosCache.filter(p => (p.total_cobrado || 0) > 0);
  _pagoClienteAllOptions = eligibleClients.map(p => ({ value: String(p.id), label: p.cliente }));
  sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
    eligibleClients.map(p =>
      `<option value="${p.id}" ${p.id === clienteId ? 'selected' : ''}>${p.cliente}</option>`
    ).join('');
  const pagoSearchEl = document.getElementById('pago-cliente-search');
  if (pagoSearchEl) pagoSearchEl.value = '';

  if (clienteId !== null) {
    const cli = _tpvPagosCache.find(p => p.id === clienteId);
    document.getElementById('pago-modal-cliente-nombre').textContent = cli ? cli.cliente : '';
    wrap.style.display = 'none';
  } else {
    document.getElementById('pago-modal-cliente-nombre').textContent = 'Selecciona el cliente';
    wrap.style.display = '';
  }

  pagoUpdateSaldo();
}

function closePagoModal() {
  document.getElementById('pago-overlay').style.display = 'none';
  _pagoClienteId = null;
}

function pagoUpdateSaldo() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  const info = document.getElementById('pago-saldo-info');
  if (!selId) { info.style.display = 'none'; return; }
  const cli = _tpvPagosCache.find(p => p.id === selId);
  if (!cli) return;
  const saldo = pagosSaldo(cli);
  document.getElementById('pago-saldo-val').textContent = fmtTPVFull(saldo, 2);
  info.style.display = '';
  // Show/hide the "pagar total" button
  const btnTotal = document.getElementById('pago-llenar-total');
  if (btnTotal) btnTotal.style.display = saldo > 0 ? '' : 'none';
}

function pagoValidateMonto() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  const monto = parseFloat(document.getElementById('pago-monto').value) || 0;
  const warn = document.getElementById('pago-monto-warn');
  if (!selId) { warn.style.display = 'none'; return; }
  const cli = _tpvPagosCache.find(p => p.id === selId);
  const saldo = pagosSaldo(cli);
  warn.style.display = (monto > saldo + 0.01) ? '' : 'none';
}

/** Fill the monto field with the full pending amount */
function pagoLlenarTotal() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  if (!selId) return;
  const cli = _tpvPagosCache.find(p => p.id === selId);
  if (!cli) return;
  const saldo = pagosSaldo(cli);
  document.getElementById('pago-monto').value = saldo.toFixed(2);
  pagoValidateMonto();
}

function submitPago() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  if (!selId) { toast('⚠️ Selecciona un cliente'); return; }

  const fecha  = document.getElementById('pago-fecha').value;
  const monto  = parseFloat(document.getElementById('pago-monto').value);
  const dest   = document.getElementById('pago-destino').value;
  const ref    = document.getElementById('pago-ref').value.trim();

  if (!fecha)      { toast('⚠️ Ingresa la fecha'); return; }
  if (!monto || monto <= 0) { toast('⚠️ Ingresa un monto válido'); return; }

  const data = pagosLoad();
  if (!data[selId]) data[selId] = [];
  data[selId].push({
    id: Date.now(),
    fecha,
    monto,
    destino: dest,
    ref,
    registrado: new Date().toLocaleString('es-MX')
  });
  pagosSave(data);

  const cli = _tpvPagosCache.find(p => p.id === selId);
  toast(`✅ Pago de ${fmtTPVFull(monto)} registrado — ${cli?.cliente || ''}`);
  closePagoModal();
  rTPVPagos();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}

// ── HISTORIAL MODAL ──
function openHistorial(clienteId) {
  const cli = _tpvPagosCache.find(p => p.id === clienteId);
  if (!cli) return;

  const data = pagosLoad();
  const pagos = (data[clienteId] || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const aPagar = cli.a_pagar || (parseFloat(cli.total_cobrado||0) - parseFloat(cli.total_comisiones||0));
  const saldo = Math.max(0, aPagar - totalPagado);

  document.getElementById('hist-title').textContent = '🕐 Historial de Pagos — ' + cli.cliente;
  document.getElementById('hist-subtitle').textContent = `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} registrado${pagos.length !== 1 ? 's' : ''}`;

  // KPIs del historial: Cobrado, Comisiones, A Pagar, Pagado, Saldo
  document.getElementById('hist-kpis').innerHTML = `
    <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Total Cobrado</div><div class="m-kpi-val" style="color:#0073ea">${fmtTPVFull(cli.total_cobrado||0)}</div></div>
    <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Comisiones</div><div class="m-kpi-val" style="color:var(--orange)">${fmtTPVFull(cli.total_comisiones||0)}</div></div>
    <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">A Pagar</div><div class="m-kpi-val" style="color:var(--purple)">${fmtTPVFull(aPagar)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(totalPagado)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Saldo</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(saldo)}</div></div>
  `;

  if (pagos.length === 0) {
    document.getElementById('hist-body').innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">
        No hay pagos registrados para este cliente.<br>
        <button class="btn btn-blue hist-first-pago-btn" style="margin-top:12px;font-size:.72rem" data-cid="${clienteId}">+ Registrar primer pago</button>
      </div>`;
  } else {
    document.getElementById('hist-body').innerHTML = `
      <div class="tw" style="margin-bottom:0">
        <div class="tw-h" style="display:flex;align-items:center;justify-content:space-between">
          <div class="tw-ht">Pagos registrados</div>
          <button onclick="deletePagoConfirm=true" style="font-size:.65rem;color:var(--red);background:none;border:none;cursor:pointer">eliminar pago</button>
        </div>
        <table class="bt">
          <thead><tr><th>Fecha</th><th>Destino</th><th class="r">Monto</th><th>Referencia</th><th>Registrado</th><th></th></tr></thead>
          <tbody>
            ${pagos.map(p => `
              <tr>
                <td class="bld">${p.fecha}</td>
                <td><span class="pill" style="${p.destino==='tarjeta'?'background:var(--blue-lt);color:#003d7a':'background:var(--green-lt);color:#007a48'}">${p.destino==='tarjeta'?'💳 Tarjeta':'🏦 Banco'}</span></td>
                <td class="mo pos">${fmtTPVFull(p.monto)}</td>
                <td style="color:var(--muted);font-size:.72rem">${p.ref || '—'}</td>
                <td style="color:var(--muted);font-size:.66rem">${p.registrado}</td>
                <td><button class="hist-del-pago-btn" data-cid="${clienteId}" data-pid="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem" title="Eliminar">🗑</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  const histOverlay = document.getElementById('historial-overlay');
  histOverlay.style.display = 'flex';

  // Event delegation for historial overlay
  if (!histOverlay._bound) {
    histOverlay.addEventListener('click', function(e) {
      const firstBtn = e.target.closest('.hist-first-pago-btn');
      if (firstBtn) { closeHistorial(); openPagoModal(parseInt(firstBtn.dataset.cid)); return; }
      const delBtn = e.target.closest('.hist-del-pago-btn');
      if (delBtn) { deletePago(parseInt(delBtn.dataset.cid), parseInt(delBtn.dataset.pid)); return; }
    });
    histOverlay._bound = true;
  }
}

function closeHistorial() {
  document.getElementById('historial-overlay').style.display = 'none';
}

function deletePago(clienteId, pagoId) {
  if (!confirm('¿Eliminar este pago?')) return;
  const data = pagosLoad();
  if (data[clienteId]) {
    data[clienteId] = data[clienteId].filter(p => p.id !== pagoId);
    if (data[clienteId].length === 0) delete data[clienteId];
  }
  pagosSave(data);
  toast('🗑 Pago eliminado');
  closeHistorial();
  rTPVPagos();
}

// ── EXPORT CSV ──
function exportPagosCSV() {
  const data = pagosLoad();
  let rows = ['Cliente,Fecha,Monto,Destino,Referencia,Registrado'];
  _tpvPagosCache.forEach(cli => {
    (data[cli.id] || []).forEach(p => {
      rows.push(`"${cli.cliente}","${p.fecha}",${p.monto},"${p.destino==='tarjeta'?'Tarjeta':'Banco'}","${p.ref || ''}","${p.registrado}"`);
    });
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pagos_tpv_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('📥 CSV descargado');
}



// ── HISTORIAL DE PAGOS (vista global) ──
let _historialCache = [];
let _historialFiltered = [];

async function rTPVHistorial() {
  const data = pagosLoad();

  // Build client name map — try _tpvPagosCache first, fallback to TPV.getClients()
  let clientMap = {};
  if (_tpvPagosCache && _tpvPagosCache.length > 0) {
    _tpvPagosCache.forEach(c => { clientMap[c.id] = c.cliente; });
  } else {
    try {
      const clients = await TPV.getClients();
      if (clients) clients.forEach(c => { clientMap[c.id] = c.nombre_display || c.nombre; });
    } catch(e) {}
  }

  // Flatten payments: {clienteId: [pagos]} → [{clienteId, cliente, ...pago}]
  const flat = [];
  for (const cid in data) {
    const nombre = clientMap[cid] || clientMap[parseInt(cid)] || 'Cliente #' + cid;
    (data[cid] || []).forEach(p => {
      flat.push({ clienteId: cid, cliente: nombre, ...p });
    });
  }
  flat.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.id - a.id);
  _historialCache = flat;

  // Populate client filter dropdown
  const sel = document.getElementById('hist-pg-cliente');
  if (sel) {
    const uniqueClients = [...new Map(flat.map(p => [p.clienteId, p.cliente])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1]));
    sel.innerHTML = '<option value="">Todos</option>' +
      uniqueClients.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  }

  // Set default dates (current month)
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  if (fromEl && !fromEl.value) {
    const now = new Date();
    fromEl.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    toEl.value = now.toISOString().split('T')[0];
  }

  filterHistorial();
}

function filterHistorial() {
  const fromVal = document.getElementById('hist-pg-from')?.value || '';
  const toVal = document.getElementById('hist-pg-to')?.value || '';
  const clienteVal = document.getElementById('hist-pg-cliente')?.value || '';
  const destinoVal = document.getElementById('hist-pg-destino')?.value || '';

  let filtered = _historialCache;
  if (fromVal) filtered = filtered.filter(p => p.fecha >= fromVal);
  if (toVal) filtered = filtered.filter(p => p.fecha <= toVal);
  if (clienteVal) filtered = filtered.filter(p => String(p.clienteId) === clienteVal);
  if (destinoVal) filtered = filtered.filter(p => p.destino === destinoVal);

  _historialFiltered = filtered;
  _renderHistorial(filtered);
}

// Filtro rápido: pagos registrados hoy (lo que tesorería debe pagar)
function filterPagosHoy() {
  const hoy = new Date();
  const d = hoy.getDate(), m = hoy.getMonth() + 1, y = hoy.getFullYear();
  // registrado está en formato es-MX: "d/m/yyyy, hh:mm:ss"
  const prefix = d + '/' + m + '/' + y;
  const destinoVal = document.getElementById('hist-pg-destino')?.value || '';

  let filtered = _historialCache.filter(p => {
    if (p.anulado) return false;
    return p.registrado && p.registrado.startsWith(prefix);
  });
  if (destinoVal) filtered = filtered.filter(p => p.destino === destinoVal);

  // Limpiar otros filtros visualmente
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  const selEl = document.getElementById('hist-pg-cliente');
  const searchEl = document.getElementById('hist-pg-search');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  if (selEl) selEl.value = '';
  if (searchEl) searchEl.value = '';

  _historialFiltered = filtered;
  _renderHistorial(filtered);
}

function searchHistorial(q) {
  if (!q) { _renderHistorial(_historialFiltered); return; }
  const lq = q.toLowerCase();
  const results = _historialFiltered.filter(p =>
    (p.cliente || '').toLowerCase().includes(lq) ||
    (p.ref || '').toLowerCase().includes(lq) ||
    (p.fecha || '').includes(lq)
  );
  _renderHistorial(results);
}

function resetHistorialFilters() {
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  const selEl = document.getElementById('hist-pg-cliente');
  const searchEl = document.getElementById('hist-pg-search');
  const destEl = document.getElementById('hist-pg-destino');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  if (selEl) selEl.value = '';
  if (searchEl) searchEl.value = '';
  if (destEl) destEl.value = '';
  _historialFiltered = _historialCache;
  _renderHistorial(_historialCache);
}

function _renderHistorial(rows) {
  const tbody = document.getElementById('hist-pg-tbody');
  if (!tbody) return;

  // KPIs
  const activos = rows.filter(p => !p.anulado);
  const anulados = rows.filter(p => p.anulado);
  const totalMonto = activos.reduce((s, p) => s + (p.monto || 0), 0);
  const tarjeta = activos.filter(p => p.destino === 'tarjeta');
  const banco = activos.filter(p => p.destino === 'banco');
  const montoTarjeta = tarjeta.reduce((s, p) => s + (p.monto || 0), 0);
  const montoBanco = banco.reduce((s, p) => s + (p.monto || 0), 0);
  const kEl = document.getElementById('hist-pg-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Total Pagos</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">📋</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(totalMonto)}</div>
      <div class="kpi-d dnu">${activos.length} pagos activos${anulados.length ? ' · ' + anulados.length + ' anulados' : ''}</div>
    </div>
    <div class="kpi-card" style="--ac:var(--purple)">
      <div class="kpi-top"><div class="kpi-lbl">💳 Tarjeta</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">💳</div></div>
      <div class="kpi-val" style="color:var(--purple)">${fmtTPV(montoTarjeta)}</div>
      <div class="kpi-d dnu">${tarjeta.length} pago${tarjeta.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">🏦 Banco</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">🏦</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(montoBanco)}</div>
      <div class="kpi-d dnu">${banco.length} pago${banco.length !== 1 ? 's' : ''}</div>
    </div>
  `;

  // Table title
  const tt = document.getElementById('hist-pg-table-title');
  if (tt) tt.textContent = `${rows.length} pago${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''}`;

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">No hay pagos en el rango seleccionado</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(p => {
    const isAnulado = p.anulado;
    const destPill = p.destino === 'tarjeta'
      ? '<span class="pill" style="background:var(--blue-lt);color:#003d7a">💳 Tarjeta</span>'
      : '<span class="pill" style="background:var(--green-lt);color:#007a48">🏦 Banco</span>';
    const estadoPill = isAnulado
      ? '<span class="pill" style="background:var(--red-lt);color:#b02020">🚫 Anulado</span>'
      : '<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Activo</span>';
    const rowStyle = isAnulado ? 'opacity:.5;text-decoration:line-through' : '';
    const anularBtn = isAnulado
      ? `<span style="font-size:.62rem;color:var(--muted)" title="Anulado el ${p.anulado_fecha||''}">—</span>`
      : `<button class="hist-anular-btn" data-cid="${p.clienteId}" data-pid="${p.id}" style="background:none;border:1px solid var(--red-lt);border-radius:5px;cursor:pointer;color:var(--red);font-size:.65rem;padding:2px 8px;font-family:'Figtree',sans-serif" title="Anular pago">Anular</button>`;
    return `<tr style="${rowStyle}">
      <td class="bld">${p.fecha || '—'}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}</td>
      <td class="mo r">${fmtTPVFull(p.monto)}</td>
      <td>${destPill}</td>
      <td style="color:var(--muted);font-size:.72rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.ref || '—'}</td>
      <td style="color:var(--muted);font-size:.66rem">${p.registrado || '—'}</td>
      <td>${estadoPill}</td>
      <td style="text-align:center">${anularBtn}</td>
    </tr>`;
  }).join('');

  // Event delegation for anular buttons
  if (!tbody._anularBound) {
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('.hist-anular-btn');
      if (btn) anularPago(btn.dataset.cid, parseInt(btn.dataset.pid));
    });
    tbody._anularBound = true;
  }
}

// ── ANULAR PAGO ──
function anularPago(clienteId, pagoId) {
  const data = pagosLoad();
  const pagos = data[clienteId] || [];
  const pago = pagos.find(p => p.id === pagoId);
  if (!pago) { toast('⚠️ Pago no encontrado'); return; }

  const montoStr = fmtTPVFull(pago.monto);
  customConfirm(
    `¿Anular pago de ${montoStr} del ${pago.fecha}?\n\nEsta acción marcará el pago como anulado. No se eliminará del historial.`,
    'Anular Pago',
    (ok) => {
      if (!ok) return;
      const d = pagosLoad();
      const p = (d[clienteId] || []).find(x => x.id === pagoId);
      if (p) {
        p.anulado = true;
        p.anulado_fecha = new Date().toLocaleString('es-MX');
        p.anulado_por = (getCurrentUser()?.nombre || 'Admin');
        pagosSave(d);
        toast('🚫 Pago anulado — ' + montoStr);
        rTPVHistorial();
      }
    }
  );
}

// ── EXPORTAR HISTORIAL ──
function exportHistorialCSV() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  let csv = ['Fecha,Cliente,Monto,Destino,Referencia,Registrado,Estado'];
  rows.forEach(p => {
    csv.push(`"${p.fecha}","${p.cliente}",${p.monto},"${p.destino==='tarjeta'?'Tarjeta':'Banco'}","${(p.ref||'').replace(/"/g,'""')}","${p.registrado||''}","${p.anulado?'Anulado':'Activo'}"`);
  });
  const blob = new Blob(['\uFEFF'+csv.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'historial_pagos_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('📥 CSV descargado');
}

function exportHistorialXLSX() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  if (typeof XLSX === 'undefined') { toast('⚠️ Librería XLSX no disponible'); return; }
  const data = rows.map(p => ({
    Fecha: p.fecha,
    Cliente: p.cliente,
    Monto: p.monto,
    Destino: p.destino === 'tarjeta' ? 'Tarjeta' : 'Banco',
    Referencia: p.ref || '',
    Registrado: p.registrado || '',
    Estado: p.anulado ? 'Anulado' : 'Activo'
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{wch:12},{wch:30},{wch:14},{wch:10},{wch:25},{wch:20},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historial de Pagos');
  XLSX.writeFile(wb, 'historial_pagos_' + new Date().toISOString().split('T')[0] + '.xlsx');
  toast('📥 Excel descargado');
}

function exportHistorialPDF() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  const activos = rows.filter(p => !p.anulado);
  const totalMonto = activos.reduce((s, p) => s + (p.monto || 0), 0);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Historial de Pagos TPV</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;color:#1a1c2e;font-size:12px}
  h1{font-size:16px;margin:0 0 4px}
  .sub{font-size:11px;color:#666;margin-bottom:16px}
  .kpis{display:flex;gap:20px;margin-bottom:16px}
  .kpi{background:#f5f6fa;padding:8px 14px;border-radius:8px}
  .kpi-lbl{font-size:10px;color:#888;font-weight:600}
  .kpi-val{font-size:16px;font-weight:700}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f0f2f8;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #ddd}
  td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
  .r{text-align:right}
  .anulado{opacity:.5;text-decoration:line-through}
  @media print{body{padding:0}@page{margin:1cm}}
</style></head><body>
<h1>📋 Historial de Pagos TPV</h1>
<div class="sub">Generado: ${new Date().toLocaleString('es-MX')} · ${rows.length} pagos · Monto activo: $${totalMonto.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
<table>
<thead><tr><th>Fecha</th><th>Cliente</th><th class="r">Monto</th><th>Destino</th><th>Referencia</th><th>Estado</th></tr></thead>
<tbody>${rows.map(p=>`<tr class="${p.anulado?'anulado':''}"><td>${p.fecha}</td><td>${p.cliente}</td><td class="r">$${(p.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td>${p.destino==='tarjeta'?'Tarjeta':'Banco'}</td><td>${p.ref||'—'}</td><td>${p.anulado?'Anulado':'Activo'}</td></tr>`).join('')}</tbody>
</table></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
  toast('🖨 Preparando impresión...');
}

  // Expose on window
  window.PAGOS_KEY = PAGOS_KEY;
  window.pagosLoad = pagosLoad;
  window.pagosSave = pagosSave;
  window.pagosTotalCliente = pagosTotalCliente;
  window.pagosSaldo = pagosSaldo;
  window.rTPVPagosView = rTPVPagosView;
  window.rTPVPagos = rTPVPagos;
  window._pagoClienteId = _pagoClienteId;
  window.openPagoModal = openPagoModal;
  window.closePagoModal = closePagoModal;
  window.pagoUpdateSaldo = pagoUpdateSaldo;
  window.pagoValidateMonto = pagoValidateMonto;
  window.pagoLlenarTotal = pagoLlenarTotal;
  window.submitPago = submitPago;
  window.openHistorial = openHistorial;
  window.closeHistorial = closeHistorial;
  window.deletePago = deletePago;
  window.exportPagosCSV = exportPagosCSV;
  window._historialCache = _historialCache;
  window._historialFiltered = _historialFiltered;
  window.rTPVHistorial = rTPVHistorial;
  window.filterHistorial = filterHistorial;
  window.filterPagosHoy = filterPagosHoy;
  window.searchHistorial = searchHistorial;
  window.resetHistorialFilters = resetHistorialFilters;
  window._renderHistorial = _renderHistorial;
  window.anularPago = anularPago;
  window.exportHistorialCSV = exportHistorialCSV;
  window.exportHistorialXLSX = exportHistorialXLSX;
  window.exportHistorialPDF = exportHistorialPDF;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_pagos', function(){ return rTPVPagosView(); });
  }

})(window);
