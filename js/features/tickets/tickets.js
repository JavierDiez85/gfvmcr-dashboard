// GF — Tickets
(function(window) {
  'use strict';

// GF — Tickets: sistema de tickets para pagos TPV (con pagos múltiples)

const TK_STORAGE_KEY = 'gf_tickets_pagos_tpv';
let _tkModalPagoIdx = 0;

function _tkLoad(){
  try { return DB.get(TK_STORAGE_KEY) || []; } catch(e){ return []; }
}
function _tkSave(tickets){
  DB.set(TK_STORAGE_KEY, tickets);
}

// Helper: extract total from pagos[] or fallback to legacy monto
function _tkPagosTotal(t){
  if(Array.isArray(t.pagos) && t.pagos.length){
    let fijo = 0, hasPct = false;
    t.pagos.forEach(p => {
      if(p.monto_tipo === 'porcentaje') hasPct = true;
      else fijo += (Number(p.monto)||0);
    });
    return { fijo, hasPct };
  }
  // Legacy: single monto
  if(typeof t.monto === 'number') return { fijo: t.monto, hasPct: false };
  return { fijo: 0, hasPct: false };
}

function _tkFmtMonto(t){
  const { fijo, hasPct } = _tkPagosTotal(t);
  const fmt = n => '$' + n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(fijo > 0 && hasPct) return fmt(fijo) + ' <span style="font-size:.55rem;color:var(--muted)">+%</span>';
  if(fijo > 0) return fmt(fijo);
  if(hasPct) return '<span style="font-size:.7rem;color:var(--muted)">% (ver detalle)</span>';
  return '—';
}

// ═══════════════════════════════════════
// RENDER PRINCIPAL
// ═══════════════════════════════════════
function rTkPagosTpv(){
  _tkPopulateClientes();
  rTkPagosList();
  _tkUpdateBadge();
}

function rTkPagosList(){
  const tickets = _tkLoad();
  const fStatus = document.getElementById('tk-filter-status')?.value || '';
  const fPriority = document.getElementById('tk-filter-priority')?.value || '';
  const fSearch = (document.getElementById('tk-filter-search')?.value || '').toLowerCase();

  let filtered = tickets;
  if(fStatus) filtered = filtered.filter(t => t.estado === fStatus);
  if(fPriority) filtered = filtered.filter(t => t.prioridad === fPriority);
  if(fSearch) filtered = filtered.filter(t =>
    (t.cliente||'').toLowerCase().includes(fSearch) ||
    (t.asunto||'').toLowerCase().includes(fSearch) ||
    (t.referencia||'').toLowerCase().includes(fSearch) ||
    String(t.id).includes(fSearch)
  );

  // Sort: pendientes first, then abiertos, then by date desc
  const statusOrder = {pendiente:-1, abierto:0, en_proceso:1, resuelto:2, cerrado:3};
  filtered.sort((a,b) => (statusOrder[a.estado]??9) - (statusOrder[b.estado]??9) || new Date(b.creado) - new Date(a.creado));

  // KPIs
  const total = tickets.length;
  const pendientes = tickets.filter(t => t.estado === 'pendiente').length;
  const abiertos = tickets.filter(t => t.estado === 'abierto').length;
  const proceso = tickets.filter(t => t.estado === 'en_proceso').length;
  const resueltos = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado').length;

  const el = id => document.getElementById(id);
  if(el('tk-kpi-total')) el('tk-kpi-total').textContent = total;
  if(el('tk-kpi-pendientes')) el('tk-kpi-pendientes').textContent = pendientes;
  if(el('tk-kpi-abiertos')) el('tk-kpi-abiertos').textContent = abiertos;
  if(el('tk-kpi-proceso')) el('tk-kpi-proceso').textContent = proceso;
  if(el('tk-kpi-resueltos')) el('tk-kpi-resueltos').textContent = resueltos;

  // Table
  const tbody = document.getElementById('tk-pagos-tbody');
  if(!tbody) return;

  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay tickets que coincidan con los filtros</td></tr>';
    return;
  }

  const statusBadge = {
    pendiente:  '<span style="background:rgba(156,39,176,.12);color:#9c27b0;padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:600">Pendiente</span>',
    abierto:    '<span style="background:rgba(255,68,68,.12);color:var(--red);padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:600">Abierto</span>',
    en_proceso: '<span style="background:rgba(255,152,0,.12);color:#ff9800;padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:600">En proceso</span>',
    resuelto:   '<span style="background:rgba(0,184,117,.12);color:var(--green);padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:600">Resuelto</span>',
    cerrado:    '<span style="background:rgba(0,0,0,.08);color:var(--muted);padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:600">Cerrado</span>',
  };
  const priorBadge = {
    alta:  '<span style="color:var(--red);font-weight:600;font-size:.7rem">● Alta</span>',
    media: '<span style="color:#ff9800;font-weight:600;font-size:.7rem">● Media</span>',
    baja:  '<span style="color:var(--muted);font-weight:600;font-size:.7rem">● Baja</span>',
  };

  tbody.innerHTML = filtered.map(t => {
    const unreadDot = t.leido === false ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#9c27b0;margin-right:4px" title="No leído"></span>' : '';
    const rowBg = t.leido === false ? 'background:rgba(156,39,176,.04);' : '';
    const origenBadge = t.origen === 'cliente' ? ' <span style="font-size:.55rem;background:rgba(0,115,234,.1);color:var(--blue);padding:1px 5px;border-radius:8px">Externo</span>' : '';
    const pagosCount = Array.isArray(t.pagos) ? t.pagos.length : 0;
    const pagosHint = pagosCount > 1 ? ` <span style="font-size:.55rem;color:var(--muted)">(${pagosCount})</span>` : '';
    return `<tr style="cursor:pointer;${rowBg}" onclick="openTkDetail('${t.id}')">
    <td style="font-size:.7rem;color:var(--muted);font-weight:600">${unreadDot}#${t.id}</td>
    <td style="font-size:.75rem;font-weight:600">${t.cliente||'—'}${origenBadge}</td>
    <td style="font-size:.73rem">${t.asunto||'—'}</td>
    <td>${priorBadge[t.prioridad]||'—'}</td>
    <td>${statusBadge[t.estado]||'—'}</td>
    <td class="r" style="font-size:.75rem;font-weight:600">${_tkFmtMonto(t)}${pagosHint}</td>
    <td style="font-size:.68rem;color:var(--muted)">${t.creado ? new Date(t.creado).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</td>
    <td><button class="btn btn-out" style="font-size:.6rem;padding:2px 8px" onclick="event.stopPropagation();changeTkStatus('${t.id}')">⋮</button></td>
  </tr>`;
  }).join('');
}

// ═══════════════════════════════════════
// BADGE — Indicador en sidebar
// ═══════════════════════════════════════
function _tkUpdateBadge(){
  const tickets = _tkLoad();
  const unread = tickets.filter(t => t.leido === false).length;
  // Badge on Salem sidebar icon (new narrow sidebar)
  let badge = document.getElementById('tk-unread-badge');
  if(!badge){
    const co = document.getElementById('co-salem');
    if(!co) return;
    badge = document.createElement('span');
    badge.id = 'tk-unread-badge';
    badge.style.cssText = 'position:absolute;top:2px;right:2px;background:#9c27b0;color:#fff;font-size:.5rem;font-weight:700;padding:1px 4px;border-radius:8px;min-width:14px;text-align:center;line-height:1.3;';
    co.style.position = 'relative';
    co.appendChild(badge);
  }
  if(unread > 0){
    badge.textContent = unread;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// ═══════════════════════════════════════
// MODAL: NUEVO TICKET (INTERNO) — Pagos múltiples
// ═══════════════════════════════════════
function _tkPopulateClientes(){
  const sel = document.getElementById('tk-f-cliente');
  if(!sel) return;
  const clients = DB.get('gf_tpv_clients') || [];
  const names = [...new Set(clients.map(c => c.nombre_display || c.nombre || c.client_name).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">— Selecciona —</option>' +
    names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function tkModalAddPago(){
  _tkModalPagoIdx++;
  const container = document.getElementById('tk-f-pagos-container');
  if(!container) return;
  const idx = _tkModalPagoIdx;
  const div = document.createElement('div');
  div.className = 'tk-m-pago';
  div.id = 'tk-m-pago-' + idx;
  div.style.cssText = 'border:1px solid var(--border2);border-radius:var(--r);padding:14px 12px;margin-bottom:8px;position:relative;background:var(--bg);transition:border-color .2s;';
  const canDel = container.children.length > 0;
  div.innerHTML =
    '<span style="position:absolute;top:6px;left:10px;font-size:.58rem;font-weight:700;color:var(--muted);background:var(--white);padding:1px 6px;border-radius:10px;border:1px solid var(--border2)">Pago ' + (container.children.length + 1) + '</span>' +
    (canDel ? '<button type="button" onclick="tkModalRemovePago(' + idx + ')" style="position:absolute;top:6px;right:8px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;padding:2px 6px;width:auto" title="Eliminar pago">✕</button>' : '') +
    '<div style="margin-top:18px">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px">' +
        '<div style="flex:1">' +
          '<label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Destino *</label>' +
          '<select data-field="tipo" onchange="tkModalToggleBanco(this)" style="width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text)">' +
            '<option value="banco">Banco</option>' +
            '<option value="tarjetas_centum">Tarjetas Centum</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex:1" class="tk-m-banco-field">' +
          '<label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Nombre del Banco</label>' +
          '<input type="text" data-field="banco" placeholder="Ej: BBVA, Banorte..." style="width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text);box-sizing:border-box">' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px">' +
        '<div style="flex:1">' +
          '<label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Tipo de monto</label>' +
          '<select data-field="monto_tipo" onchange="tkToggleMontoInput(this)" style="width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text)">' +
            '<option value="fijo">$ Monto fijo</option>' +
            '<option value="porcentaje">% Porcentaje</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex:1" class="tk-m-monto-field">' +
          '<label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Valor *</label>' +
          '<input type="number" data-field="monto" placeholder="0.00" step="0.01" min="0" style="width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text);box-sizing:border-box">' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Descripción del pago</label>' +
        '<input type="text" data-field="descripcion" placeholder="Ej: Deposito quincenal, comision marzo..." style="width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text);box-sizing:border-box">' +
      '</div>' +
    '</div>';
  container.appendChild(div);
}

function tkModalRemovePago(idx){
  const el = document.getElementById('tk-m-pago-' + idx);
  if(el) el.remove();
  tkModalRenumberPagos();
  tkUpdatePctBar();
}

function tkModalRenumberPagos(){
  const cards = document.querySelectorAll('#tk-f-pagos-container .tk-m-pago');
  cards.forEach((card, i) => {
    const num = card.querySelector('span');
    if(num) num.textContent = 'Pago ' + (i + 1);
    // First card can't be deleted
    const del = card.querySelector('button[title="Eliminar pago"]');
    if(i === 0 && del) del.remove();
    if(i > 0 && !del){
      const id = card.id.replace('tk-m-pago-','');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = 'Eliminar pago';
      btn.style.cssText = 'position:absolute;top:6px;right:8px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;padding:2px 6px;width:auto';
      btn.textContent = '✕';
      btn.onclick = function(){ tkModalRemovePago(id); };
      card.appendChild(btn);
    }
  });
}

function tkModalToggleBanco(sel){
  const card = sel.closest('.tk-m-pago');
  const bancoField = card.querySelector('.tk-m-banco-field');
  if(bancoField) bancoField.style.display = sel.value === 'banco' ? '' : 'none';
}

function _tkPctOptions(){
  let opts = '<option value="">— Selecciona —</option>';
  for(let i = 5; i <= 100; i += 5) opts += `<option value="${i}">${i}%</option>`;
  return opts;
}

function tkToggleMontoInput(sel){
  const card = sel.closest('.tk-m-pago');
  const montoField = card.querySelector('.tk-m-monto-field');
  if(!montoField) return;
  const labelStyle = 'font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px';
  const inputStyle = 'width:100%;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text);box-sizing:border-box';
  if(sel.value === 'porcentaje'){
    montoField.innerHTML = `<label style="${labelStyle}">Valor *</label><select data-field="monto" onchange="tkUpdatePctBar()" style="${inputStyle}">${_tkPctOptions()}</select>`;
  } else {
    montoField.innerHTML = `<label style="${labelStyle}">Valor *</label><input type="number" data-field="monto" placeholder="0.00" step="0.01" min="0" style="${inputStyle}">`;
  }
  tkUpdatePctBar();
}

function tkUpdatePctBar(){
  const cards = document.querySelectorAll('#tk-f-pagos-container .tk-m-pago');
  let total = 0, hasPct = false;
  cards.forEach(card => {
    const tipoSel = card.querySelector('[data-field="monto_tipo"]');
    if(tipoSel && tipoSel.value === 'porcentaje'){
      hasPct = true;
      total += parseFloat(card.querySelector('[data-field="monto"]')?.value) || 0;
    }
  });
  const wrap = document.getElementById('tk-pct-bar-wrap');
  if(!wrap) return;
  if(!hasPct){ wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  const remaining = 100 - total;
  const fill = document.getElementById('tk-pct-bar-fill');
  const assignedEl = document.getElementById('tk-pct-assigned');
  const remainingEl = document.getElementById('tk-pct-remaining');
  fill.style.width = Math.min(total, 100) + '%';
  fill.style.background = total > 100 ? 'var(--red)' : total === 100 ? 'var(--green)' : 'var(--blue)';
  assignedEl.textContent = 'Asignado: ' + total + '%';
  remainingEl.textContent = total > 100 ? 'Excede por ' + (total - 100) + '%' : 'Restante: ' + remaining + '%';
  remainingEl.style.color = total > 100 ? 'var(--red)' : 'var(--muted)';
}

function _tkModalCollectPagos(){
  const cards = document.querySelectorAll('#tk-f-pagos-container .tk-m-pago');
  const pagos = [];
  let valid = true;
  cards.forEach(card => {
    const tipo = card.querySelector('[data-field="tipo"]').value;
    const banco = (card.querySelector('[data-field="banco"]') || {}).value || '';
    const monto_tipo = card.querySelector('[data-field="monto_tipo"]').value;
    const monto = parseFloat(card.querySelector('[data-field="monto"]').value);
    const descripcion = (card.querySelector('[data-field="descripcion"]') || {}).value || '';
    if(isNaN(monto) || monto <= 0){ valid = false; return; }
    pagos.push({
      tipo,
      banco: tipo === 'banco' ? banco.trim() : '',
      monto_tipo,
      monto,
      descripcion: descripcion.trim()
    });
  });
  return valid ? pagos : null;
}

function openNewTicketModal(){
  _tkPopulateClientes();
  document.getElementById('tk-f-asunto').value = '';
  document.getElementById('tk-f-desc').value = '';
  document.getElementById('tk-f-prioridad').value = 'media';
  document.getElementById('tk-f-cliente').value = '';
  // Reset pagos
  const container = document.getElementById('tk-f-pagos-container');
  if(container) container.innerHTML = '';
  _tkModalPagoIdx = 0;
  tkModalAddPago(); // start with one payment line
  const pctWrap = document.getElementById('tk-pct-bar-wrap');
  if(pctWrap) pctWrap.style.display = 'none';
  document.getElementById('tk-new-modal').style.display = 'flex';
}

function closeTkModal(){
  document.getElementById('tk-new-modal').style.display = 'none';
}

function saveTkPago(){
  const cliente = document.getElementById('tk-f-cliente').value;
  const asunto = document.getElementById('tk-f-asunto').value.trim();
  if(!cliente || !asunto){ toast('⚠️ Cliente y Asunto son obligatorios'); return; }

  const pagos = _tkModalCollectPagos();
  if(!pagos || pagos.length === 0){ toast('⚠️ Agrega al menos un pago con monto válido'); return; }

  const tickets = _tkLoad();
  const maxId = tickets.reduce((mx,t) => Math.max(mx, Number(t.id)||0), 0);

  const ticket = {
    id: String(maxId + 1).padStart(3,'0'),
    cliente,
    asunto,
    descripcion: document.getElementById('tk-f-desc').value.trim(),
    prioridad: document.getElementById('tk-f-prioridad').value,
    pagos,
    estado: 'abierto',
    leido: true,
    origen: 'interno',
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString(),
    notas: []
  };

  tickets.push(ticket);
  _tkSave(tickets);
  closeTkModal();
  toast(`✅ Ticket #${ticket.id} creado`);
  rTkPagosList();
  _tkUpdateBadge();
}

// ═══════════════════════════════════════
// CAMBIO DE ESTADO RÁPIDO
// ═══════════════════════════════════════
function changeTkStatus(id){
  const tickets = _tkLoad();
  const t = tickets.find(x => x.id === id);
  if(!t) return;

  const states = ['pendiente','abierto','en_proceso','resuelto','cerrado'];
  const labels = ['Pendiente','Abierto','En proceso','Resuelto','Cerrado'];
  const curIdx = states.indexOf(t.estado);

  const opts = states.map((s,i) => `<option value="${s}" ${i===curIdx?'selected':''}>${labels[i]}</option>`).join('');

  const overlay = document.getElementById('confirm-overlay');
  const msg = document.getElementById('confirm-msg');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  msg.innerHTML = `<div style="margin-bottom:10px;font-weight:600">Cambiar estado — Ticket #${id}</div>
    <div style="font-size:.75rem;margin-bottom:6px;color:var(--muted)">${t.cliente} — ${t.asunto}</div>
    <select id="tk-status-change-sel" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">${opts}</select>`;
  okBtn.textContent = 'Guardar';
  okBtn.style.background = 'var(--blue)';
  cancelBtn.style.display = '';

  overlay.style.display = 'flex';

  okBtn.onclick = () => {
    const newState = document.getElementById('tk-status-change-sel').value;
    t.estado = newState;
    t.actualizado = new Date().toISOString();
    _tkSave(tickets);
    overlay.style.display = 'none';
    okBtn.textContent = 'Eliminar';
    okBtn.style.background = 'var(--red)';
    okBtn.onclick = null;
    toast(`✅ Ticket #${id} → ${newState}`);
    rTkPagosList();
    _tkUpdateBadge();
  };

  cancelBtn.onclick = () => {
    overlay.style.display = 'none';
    okBtn.textContent = 'Eliminar';
    okBtn.style.background = 'var(--red)';
    okBtn.onclick = null;
  };
}

// ═══════════════════════════════════════
// DETALLE DE TICKET (con desglose de pagos)
// ═══════════════════════════════════════
function openTkDetail(id){
  const tickets = _tkLoad();
  const t = tickets.find(x => x.id === id);
  if(!t) return;

  // Auto-mark as read
  if(t.leido === false){
    t.leido = true;
    t.actualizado = new Date().toISOString();
    _tkSave(tickets);
    _tkUpdateBadge();
    rTkPagosList();
  }

  const statusLabels = {pendiente:'Pendiente',abierto:'Abierto',en_proceso:'En proceso',resuelto:'Resuelto',cerrado:'Cerrado'};
  const priorLabels = {alta:'🔴 Alta',media:'🟡 Media',baja:'⚪ Baja'};
  const origenLabels = {cliente:'Externo (cliente)',interno:'Interno'};
  const fmt = n => typeof n === 'number' ? '$' + n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';

  // Build pagos table
  let pagosHTML = '';
  if(Array.isArray(t.pagos) && t.pagos.length){
    const tipoLabels = { banco:'🏦 Banco', tarjetas_centum:'💳 Tarjetas Centum' };
    pagosHTML = `
      <div style="margin-top:14px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--text);margin-bottom:6px">💳 Pagos (${t.pagos.length})</div>
      <div style="border:1px solid var(--border2);border-radius:var(--r);overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:.7rem">
          <thead>
            <tr style="background:var(--bg)">
              <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--muted);font-size:.62rem;text-transform:uppercase">#</th>
              <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--muted);font-size:.62rem;text-transform:uppercase">Destino</th>
              <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--muted);font-size:.62rem;text-transform:uppercase">Banco</th>
              <th style="text-align:right;padding:6px 8px;font-weight:600;color:var(--muted);font-size:.62rem;text-transform:uppercase">Monto</th>
              <th style="text-align:left;padding:6px 8px;font-weight:600;color:var(--muted);font-size:.62rem;text-transform:uppercase">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${t.pagos.map((p, i) => {
              const montoStr = p.monto_tipo === 'porcentaje' ? p.monto + '%' : fmt(p.monto);
              const tipoLabel = tipoLabels[p.tipo] || p.tipo;
              return `<tr style="border-top:1px solid var(--border2)">
                <td style="padding:6px 8px;color:var(--muted)">${i+1}</td>
                <td style="padding:6px 8px;font-weight:600">${tipoLabel}</td>
                <td style="padding:6px 8px">${p.banco || '—'}</td>
                <td style="padding:6px 8px;text-align:right;font-weight:600;color:${p.monto_tipo==='porcentaje'?'#ff9800':'var(--text)'}">${montoStr}</td>
                <td style="padding:6px 8px;color:var(--muted)">${p.descripcion || '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } else if(typeof t.monto === 'number'){
    // Legacy single monto
    pagosHTML = `
      <div style="margin-top:14px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--text);margin-bottom:6px">💳 Pago</div>
      <div style="padding:8px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:.75rem;background:var(--bg)">
        <span style="font-weight:600">${fmt(t.monto)}</span>${t.referencia ? ` · Ref: ${t.referencia}` : ''}
      </div>`;
  }

  const overlay = document.getElementById('confirm-overlay');
  const msg = document.getElementById('confirm-msg');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  msg.innerHTML = `
    <div style="font-weight:700;font-size:.88rem;margin-bottom:12px">🎫 Ticket #${t.id}</div>
    <div style="display:grid;grid-template-columns:100px 1fr;gap:6px 12px;font-size:.75rem">
      <div style="color:var(--muted);font-weight:600">Cliente:</div><div>${t.cliente}</div>
      <div style="color:var(--muted);font-weight:600">Asunto:</div><div>${t.asunto}</div>
      <div style="color:var(--muted);font-weight:600">Estado:</div><div>${statusLabels[t.estado]||t.estado}</div>
      <div style="color:var(--muted);font-weight:600">Prioridad:</div><div>${priorLabels[t.prioridad]||t.prioridad}</div>
      <div style="color:var(--muted);font-weight:600">Origen:</div><div>${origenLabels[t.origen]||'—'}</div>
      <div style="color:var(--muted);font-weight:600">Creado:</div><div>${new Date(t.creado).toLocaleString('es-MX')}</div>
      <div style="color:var(--muted);font-weight:600">Actualizado:</div><div>${new Date(t.actualizado).toLocaleString('es-MX')}</div>
    </div>
    ${t.descripcion ? `<div style="margin-top:10px;font-size:.73rem;padding:8px;background:var(--bg);border-radius:var(--r)">${t.descripcion}</div>` : ''}
    ${pagosHTML}`;

  okBtn.textContent = 'Cerrar';
  okBtn.style.background = 'var(--blue)';
  cancelBtn.style.display = 'none';

  overlay.style.display = 'flex';

  okBtn.onclick = () => {
    overlay.style.display = 'none';
    okBtn.textContent = 'Eliminar';
    okBtn.style.background = 'var(--red)';
    cancelBtn.style.display = '';
    okBtn.onclick = null;
  };
}

  // Expose globals
  window.TK_STORAGE_KEY = TK_STORAGE_KEY;
  window._tkModalPagoIdx = _tkModalPagoIdx;
  window._tkLoad = _tkLoad;
  window._tkSave = _tkSave;
  window._tkPagosTotal = _tkPagosTotal;
  window._tkFmtMonto = _tkFmtMonto;
  window.rTkPagosTpv = rTkPagosTpv;
  window.rTkPagosList = rTkPagosList;
  window._tkUpdateBadge = _tkUpdateBadge;
  window._tkPopulateClientes = _tkPopulateClientes;
  window.tkModalAddPago = tkModalAddPago;
  window.tkModalRemovePago = tkModalRemovePago;
  window.tkModalRenumberPagos = tkModalRenumberPagos;
  window.tkModalToggleBanco = tkModalToggleBanco;
  window.tkToggleMontoInput = tkToggleMontoInput;
  window.tkUpdatePctBar = tkUpdatePctBar;
  window.openNewTicketModal = openNewTicketModal;
  window.closeTkModal = closeTkModal;
  window.saveTkPago = saveTkPago;
  window.changeTkStatus = changeTkStatus;
  window.openTkDetail = openTkDetail;

})(window);
