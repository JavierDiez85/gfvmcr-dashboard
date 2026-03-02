// GFVMCR — Tickets: sistema de tickets para pagos TPV

const TK_STORAGE_KEY = 'vmcr_tickets_pagos_tpv';

function _tkLoad(){
  try { return DB.get(TK_STORAGE_KEY) || []; } catch(e){ return []; }
}
function _tkSave(tickets){
  DB.set(TK_STORAGE_KEY, tickets);
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

  const fmt = n => typeof n === 'number' ? '$' + n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';

  tbody.innerHTML = filtered.map(t => {
    const unreadDot = t.leido === false ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#9c27b0;margin-right:4px" title="No leído"></span>' : '';
    const rowBg = t.leido === false ? 'background:rgba(156,39,176,.04);' : '';
    const origenBadge = t.origen === 'cliente' ? ' <span style="font-size:.55rem;background:rgba(0,115,234,.1);color:var(--blue);padding:1px 5px;border-radius:8px">Externo</span>' : '';
    return `<tr style="cursor:pointer;${rowBg}" onclick="openTkDetail('${t.id}')">
    <td style="font-size:.7rem;color:var(--muted);font-weight:600">${unreadDot}#${t.id}</td>
    <td style="font-size:.75rem;font-weight:600">${t.cliente||'—'}${origenBadge}</td>
    <td style="font-size:.73rem">${t.asunto||'—'}</td>
    <td>${priorBadge[t.prioridad]||'—'}</td>
    <td>${statusBadge[t.estado]||'—'}</td>
    <td class="r" style="font-size:.75rem;font-weight:600">${fmt(t.monto)}</td>
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
  let badge = document.getElementById('tk-unread-badge');
  if(!badge){
    const mi = document.getElementById('mi-tickets');
    if(!mi) return;
    badge = document.createElement('span');
    badge.id = 'tk-unread-badge';
    badge.style.cssText = 'background:#9c27b0;color:#fff;font-size:.55rem;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:auto;margin-right:4px;min-width:16px;text-align:center;';
    const arrow = mi.querySelector('.mi-arr');
    if(arrow) mi.insertBefore(badge, arrow);
    else mi.appendChild(badge);
  }
  if(unread > 0){
    badge.textContent = unread;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// ═══════════════════════════════════════
// MODAL: NUEVO TICKET (INTERNO)
// ═══════════════════════════════════════
function _tkPopulateClientes(){
  const sel = document.getElementById('tk-f-cliente');
  if(!sel) return;
  const clients = DB.get('vmcr_tpv_clients') || [];
  const names = [...new Set(clients.map(c => c.nombre || c.client_name).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">— Selecciona —</option>' +
    names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function openNewTicketModal(){
  _tkPopulateClientes();
  document.getElementById('tk-f-asunto').value = '';
  document.getElementById('tk-f-desc').value = '';
  document.getElementById('tk-f-prioridad').value = 'media';
  document.getElementById('tk-f-monto').value = '';
  document.getElementById('tk-f-ref').value = '';
  document.getElementById('tk-f-cliente').value = '';
  document.getElementById('tk-new-modal').style.display = 'flex';
}

function closeTkModal(){
  document.getElementById('tk-new-modal').style.display = 'none';
}

function saveTkPago(){
  const cliente = document.getElementById('tk-f-cliente').value;
  const asunto = document.getElementById('tk-f-asunto').value.trim();
  if(!cliente || !asunto){ toast('⚠️ Cliente y Asunto son obligatorios'); return; }

  const tickets = _tkLoad();
  const maxId = tickets.reduce((mx,t) => Math.max(mx, Number(t.id)||0), 0);

  const ticket = {
    id: String(maxId + 1).padStart(3,'0'),
    cliente,
    asunto,
    descripcion: document.getElementById('tk-f-desc').value.trim(),
    prioridad: document.getElementById('tk-f-prioridad').value,
    monto: parseFloat(document.getElementById('tk-f-monto').value) || null,
    referencia: document.getElementById('tk-f-ref').value.trim(),
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
// DETALLE DE TICKET
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
      <div style="color:var(--muted);font-weight:600">Monto:</div><div>${fmt(t.monto)}</div>
      <div style="color:var(--muted);font-weight:600">Referencia:</div><div>${t.referencia||'—'}</div>
      <div style="color:var(--muted);font-weight:600">Origen:</div><div>${origenLabels[t.origen]||'—'}</div>
      <div style="color:var(--muted);font-weight:600">Creado:</div><div>${new Date(t.creado).toLocaleString('es-MX')}</div>
      <div style="color:var(--muted);font-weight:600">Actualizado:</div><div>${new Date(t.actualizado).toLocaleString('es-MX')}</div>
    </div>
    ${t.descripcion ? `<div style="margin-top:10px;font-size:.73rem;padding:8px;background:var(--bg);border-radius:var(--r)">${t.descripcion}</div>` : ''}`;

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
