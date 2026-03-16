// GF — TPV: Agentes
(function(window) {
  'use strict';

// ── AGENT PAYMENT TRACKING (localStorage) ──
const AGENTE_PAGOS_KEY = 'gf_tpv_agente_pagos';
let _agentesCache = [];

function agentePagosLoad() { try { return DB.get(AGENTE_PAGOS_KEY) || {}; } catch(e) { return {}; } }
function agentePagosSave(data) { DB.set(AGENTE_PAGOS_KEY, data); }
function agenteTotalPagado(agenteId) {
  const data = agentePagosLoad();
  return (data[agenteId] || []).reduce((s, p) => s + p.monto, 0);
}

async function rTPVAgentes(){
  const tbody=document.getElementById('agentes-tbody');if(!tbody)return;
  const agents = await TPV.agentSummary() || [];
  const agPagosData = agentePagosLoad();

  // Enrich with payment data
  const enriched = agents.map(ag => {
    const comAgente = parseFloat(ag.com_agente||0);
    const pagado = agenteTotalPagado(ag.agente_id);
    const pendiente = Math.max(0, comAgente - pagado);
    return { ...ag, _pagado: pagado, _pendiente: pendiente, _nPagos: (agPagosData[ag.agente_id]||[]).length };
  });
  _agentesCache = enriched;

  // Populate agent filter dropdown + search cache
  _agenteOptions = enriched.map(a => ({ value: String(a.agente_id), label: `${a.agente} (${a.siglas})` }));
  const agenteFilter = document.getElementById('agente-filter');
  if (agenteFilter) {
    const prev = agenteFilter.value;
    agenteFilter.innerHTML = '<option value="">Todos los agentes</option>' +
      _agenteOptions.map(o => `<option value="${o.value}" ${o.value === prev ? 'selected' : ''}>${o.label}</option>`).join('');
  }
  const agenteSearchEl = document.getElementById('agente-search');
  if (agenteSearchEl) agenteSearchEl.value = '';

  const totV=enriched.reduce((a,ag)=>a+parseFloat(ag.vendido||0),0);
  const totC=enriched.reduce((a,ag)=>a+parseFloat(ag.com_agente||0),0);
  const totPagado=enriched.reduce((a,ag)=>a+ag._pagado,0);
  const totPend=enriched.reduce((a,ag)=>a+ag._pendiente,0);

  const sub=document.getElementById('agentes-subtitle');
  if(sub) sub.textContent=`${enriched.length} agentes · Com. sobre com. Salem · Pagado ${fmtTPV(totPagado)} de ${fmtTPV(totC)}`;

  // Restore table header and titles (in case we're coming back from client breakdown)
  const theadRow = document.getElementById('agentes-thead');
  if (theadRow) theadRow.innerHTML = '<th>Agente</th><th>Sig.</th><th class="r">% Com.</th><th class="r">Total Vendido</th><th class="r">Com. Salem</th><th class="r">Com. Agente</th><th class="r">Clientes</th><th class="r">Activos</th><th class="r" style="color:var(--green)">Pagado</th><th class="r" style="color:var(--red)">Pendiente</th><th>Acción</th>';
  const tTitle = document.getElementById('agentes-table-title');
  if (tTitle) tTitle.textContent = 'Detalle por Agente';
  const cTitle = document.getElementById('agentes-chart-title');
  if (cTitle) cTitle.textContent = 'Vendido por Agente';
  const cSub = document.getElementById('agentes-chart-sub');
  if (cSub) cSub.textContent = 'Total histórico';

  const kEl=document.getElementById('agentes-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Agentes Activos</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🤝</div></div><div class="kpi-val" style="color:#0073ea">${enriched.length}</div><div class="kpi-d dnu">Con clientes asignados</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Total Vendido</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totV)}</div><div class="kpi-d dnu">Por todos los agentes</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Com. Agentes</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📈</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(totC)}</div><div class="kpi-d dup">Pagado: ${fmtTPV(totPagado)} (${totC>0?(totPagado/totC*100).toFixed(0):0}%)</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:${totC>0?Math.min(totPagado/totC*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">Pendiente Pago</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div><div class="kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div><div class="kpi-d dnu">${enriched.filter(a=>a._pendiente>0).length} agentes con saldo</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${totC>0?Math.min(totPend/totC*100,100).toFixed(0):0}%"></div></div></div>`;
  tbody.innerHTML=enriched.map(ag=>{
    const badge=ag._pendiente<=0?'<span class="tpv-badge-ok">Al día</span>':`<span class="tpv-badge-warn">${fmtTPVFull(ag._pendiente)}</span>`;
    const histBtn = ag._nPagos > 0 ? `<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${ag._nPagos}</span>` : '';
    return`<tr>
      <td class="bld">${escapeHtml(ag.agente)}</td>
      <td><span style="font-size:.67rem;background:var(--blue-bg);color:#0060b8;border:1px solid var(--blue-lt);padding:1px 7px;border-radius:10px;font-weight:700">${escapeHtml(ag.siglas)}</span></td>
      <td class="mo">${(parseFloat(ag.pct||0)*100).toFixed(0)}%</td>
      <td class="mo bld">${fmtTPVFull(ag.vendido)}</td>
      <td class="mo">${fmtTPVFull(ag.com_salem)}</td>
      <td class="mo pos">${fmtTPVFull(ag.com_agente)}</td>
      <td class="mo" style="text-align:center">${ag.num_clientes||0}</td>
      <td class="mo" style="text-align:center">${ag.num_activos||0}</td>
      <td class="mo pos">${ag._pagado>0?fmtTPVFull(ag._pagado):'<span style="color:var(--muted)">—</span>'}</td>
      <td>${badge}</td>
      <td style="text-align:center;white-space:nowrap">
        <button onclick="openHistorialAgente(${ag.agente_id})" title="Historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px">🕐${histBtn}</button>
        ${!isViewer() ? `<button onclick="openEditAgente(${ag.agente_id})" title="Editar" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--blue);padding:2px 4px">✏️</button>
        <button onclick="openPagoAgenteModal(${ag.agente_id})" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:.65rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>` : ''}
      </td></tr>`;
  }).join('');
  // Chart
  setTimeout(()=>{
    const isDark=document.body.classList.contains('dark');
    const textC=isDark?'#9da0c5':'#8b8fb5';
    const filtered=enriched.filter(a=>parseFloat(a.vendido)>0);
    if(TPV_CHARTS['agentes'])TPV_CHARTS['agentes'].destroy();
    const canvas=document.getElementById('c-tpv-agentes');if(!canvas)return;
    TPV_CHARTS['agentes']=new Chart(canvas,{type:'bar',
      data:{labels:filtered.map(a=>a.siglas),datasets:[
        {label:'Com. Agente',data:filtered.map(a=>parseFloat(a.com_agente)),backgroundColor:'#ff704322',borderColor:'#ff7043',borderWidth:1.5,borderRadius:4},
        {label:'Pagado',data:filtered.map(a=>a._pagado),backgroundColor:'#00b87522',borderColor:'#00b875',borderWidth:1.5,borderRadius:4}
      ]},
      options:{plugins:{legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10}}},scales:{
        x:{grid:{display:false},ticks:{color:textC,font:{size:9}}},
        y:{grid:{color:isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'},ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v}}
      }}
    });
  },50);
}

// Agent payment modal functions
function openPagoAgenteModal(agenteId) {
  const ov = document.getElementById('pago-agente-overlay');
  ov.style.display = 'flex';
  document.getElementById('pago-agente-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('pago-agente-monto').value = '';
  document.getElementById('pago-agente-ref').value = '';
  const sel = document.getElementById('pago-agente-sel');
  // Populate options + search cache
  _pagoAgenteAllOptions = _agentesCache.map(a => ({ value: String(a.agente_id), label: `${a.agente} (${a.siglas})` }));
  sel.innerHTML = '<option value="">— Seleccionar agente —</option>' +
    _agentesCache.map(a => `<option value="${a.agente_id}" ${a.agente_id===agenteId?'selected':''}>${escapeHtml(a.agente)} (${escapeHtml(a.siglas)})</option>`).join('');
  const pagoAgSearchEl = document.getElementById('pago-agente-search');
  if (pagoAgSearchEl) pagoAgSearchEl.value = '';
  if (agenteId) { document.getElementById('pago-agente-title').textContent = 'Pago a ' + (_agentesCache.find(a=>a.agente_id===agenteId)?.agente||'Agente'); }
  else { document.getElementById('pago-agente-title').textContent = 'Registrar Pago a Agente'; }
  pagoAgenteUpdateSaldo();
}
function closePagoAgenteModal() { document.getElementById('pago-agente-overlay').style.display = 'none'; }
function pagoAgenteUpdateSaldo() {
  const selId = parseInt(document.getElementById('pago-agente-sel').value);
  const info = document.getElementById('pago-agente-saldo-info');
  if (!selId) { info.style.display = 'none'; return; }
  const ag = _agentesCache.find(a => a.agente_id === selId);
  if (!ag) return;
  document.getElementById('pago-agente-saldo-val').textContent = fmtTPVFull(ag._pendiente);
  info.style.display = '';
}
function submitPagoAgente() {
  const selId = parseInt(document.getElementById('pago-agente-sel').value);
  if (!selId) { toast('⚠️ Selecciona un agente'); return; }
  const fecha = document.getElementById('pago-agente-fecha').value;
  const monto = parseFloat(document.getElementById('pago-agente-monto').value);
  const ref = document.getElementById('pago-agente-ref').value.trim();
  if (!fecha) { toast('⚠️ Ingresa la fecha'); return; }
  if (!monto || monto <= 0) { toast('⚠️ Ingresa un monto válido'); return; }
  const data = agentePagosLoad();
  if (!data[selId]) data[selId] = [];
  data[selId].push({ id: Date.now(), fecha, monto, ref, registrado: new Date().toLocaleString('es-MX') });
  agentePagosSave(data);
  const ag = _agentesCache.find(a => a.agente_id === selId);
  toast(`✅ Pago de ${fmtTPVFull(monto)} a ${ag?.agente||'agente'}`);
  closePagoAgenteModal();
  rTPVAgentes();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}
function openHistorialAgente(agenteId) {
  const ag = _agentesCache.find(a => a.agente_id === agenteId);
  if (!ag) return;
  const data = agentePagosLoad();
  const pagos = (data[agenteId] || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  document.getElementById('hist-agente-title').textContent = '🕐 Historial — ' + ag.agente;
  document.getElementById('hist-agente-subtitle').textContent = `${pagos.length} pago${pagos.length!==1?'s':''} registrado${pagos.length!==1?'s':''}`;
  document.getElementById('hist-agente-kpis').innerHTML = `
    <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Com. Agente</div><div class="m-kpi-val" style="color:var(--orange)">${fmtTPVFull(ag.com_agente)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(ag._pagado)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Pendiente</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(ag._pendiente)}</div></div>`;
  if (pagos.length === 0) {
    document.getElementById('hist-agente-body').innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin pagos registrados</div>';
  } else {
    document.getElementById('hist-agente-body').innerHTML = `<table class="bt"><thead><tr><th>Fecha</th><th class="r">Monto</th><th>Referencia</th><th>Registrado</th><th></th></tr></thead><tbody>
      ${pagos.map(p => `<tr><td class="bld">${p.fecha}</td><td class="mo pos">${fmtTPVFull(p.monto)}</td><td style="color:var(--muted);font-size:.72rem">${p.ref||'—'}</td><td style="color:var(--muted);font-size:.66rem">${p.registrado}</td><td>${!isViewer() ? `<button onclick="deletePagoAgente(${agenteId},${p.id})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem">🗑</button>` : ''}</td></tr>`).join('')}
    </tbody></table>`;
  }
  document.getElementById('historial-agente-overlay').style.display = 'flex';
}
function closeHistorialAgente() { document.getElementById('historial-agente-overlay').style.display = 'none'; }

// ── MODAL: TOP 10 CLIENTES POR COMISIÓN ──
async function openTopComisiones() {
  const ov = document.getElementById('top-comisiones-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  const tbody = document.getElementById('top-com-tbody');
  const kpisDiv = document.getElementById('top-com-kpis');
  const subDiv = document.getElementById('top-com-subtitle');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted)">Cargando...</td></tr>';

  try {
    const data = await TPV.clientCommissions();
    if (!data || !data.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted)">Sin datos</td></tr>';
      return;
    }

    const top10 = data.slice(0, 10);
    const totalCom = data.reduce((s, r) => s + parseFloat(r.monto_neto || 0), 0);
    const top10Com = top10.reduce((s, r) => s + parseFloat(r.monto_neto || 0), 0);
    const top10Pct = totalCom > 0 ? (top10Com / totalCom * 100).toFixed(1) : '0';

    // KPI chips
    if (kpisDiv) {
      kpisDiv.innerHTML = `
        <div style="background:var(--green-bg);color:var(--green);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Total: ${fmtTPV(totalCom)}
        </div>
        <div style="background:var(--blue-bg);color:#0073ea;padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Top 10: ${fmtTPV(top10Com)} (${top10Pct}%)
        </div>
        <div style="background:var(--purple-bg);color:var(--purple);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          ${data.length} clientes activos
        </div>`;
    }
    if (subDiv) subDiv.textContent = 'Acumulado histórico · ' + data.length + ' clientes con actividad';

    // Table
    if (tbody) {
      tbody.innerHTML = top10.map((r, i) => {
        const neto = parseFloat(r.monto_neto || 0);
        const pct = totalCom > 0 ? (neto / totalCom * 100).toFixed(1) : '0.0';
        const barW = top10[0] && parseFloat(top10[0].monto_neto) > 0
          ? (neto / parseFloat(top10[0].monto_neto) * 100).toFixed(0) : 0;
        return `<tr>
          <td style="font-weight:700;color:var(--green)">${i + 1}</td>
          <td><b>${r.cliente || '-'}</b>${r._rate_corrected ? ' <span title="Ajuste por cambio de tasa" style="font-size:.5rem;background:var(--purple-bg);color:var(--purple);border-radius:4px;padding:0 4px;font-weight:700;vertical-align:middle">📊</span>' : ''}</td>
          <td style="text-align:right">${fmtTPV(r.total_cobrado)}</td>
          <td style="text-align:right">${fmtTPV(r.com_efevoo)}</td>
          <td style="text-align:right">${fmtTPV(r.com_salem)}</td>
          <td style="text-align:right">${fmtTPV(r.com_convenia)}</td>
          <td style="text-align:right">${fmtTPV(r.com_comisionista)}</td>
          <td style="text-align:right"><b style="color:var(--green)">${fmtTPV(neto)}</b>
            <div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px"><div style="height:100%;background:var(--green);border-radius:2px;width:${barW}%"></div></div>
          </td>
          <td style="text-align:right;font-weight:600">${pct}%</td>
        </tr>`;
      }).join('');
    }
  } catch (e) {
    console.error('[TPV] openTopComisiones error:', e);
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#e53935">Error al cargar datos</td></tr>';
  }
}
function closeTopComisiones() { document.getElementById('top-comisiones-overlay').style.display = 'none'; }
function deletePagoAgente(agenteId, pagoId) {
  if (!confirm('¿Eliminar este pago?')) return;
  const data = agentePagosLoad();
  if (data[agenteId]) { data[agenteId] = data[agenteId].filter(p => p.id !== pagoId); if (data[agenteId].length === 0) delete data[agenteId]; }
  agentePagosSave(data);
  toast('🗑 Pago eliminado');
  closeHistorialAgente();
  rTPVAgentes();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}
function exportAgentesCSV() {
  if (!_agentesCache.length) { toast('⚠️ No hay datos'); return; }
  let csv = 'Agente,Siglas,%Com,Vendido,Com Salem,Com Agente,Pagado,Pendiente\n';
  _agentesCache.forEach(a => { csv += `"${a.agente}","${a.siglas}",${(parseFloat(a.pct||0)*100).toFixed(0)}%,${parseFloat(a.vendido).toFixed(2)},${parseFloat(a.com_salem).toFixed(2)},${parseFloat(a.com_agente).toFixed(2)},${a._pagado.toFixed(2)},${a._pendiente.toFixed(2)}\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agentes_comisiones.csv'; a.click();
}

// ── EDITAR / NUEVO AGENTE ──
function openEditAgente(agenteId) {
  const ov = document.getElementById('edit-agente-overlay');
  const title = document.getElementById('edit-agente-title');
  if (agenteId) {
    // Editar existente
    const ag = _agentesCache.find(a => a.agente_id === agenteId);
    if (!ag) { toast('⚠️ Agente no encontrado'); return; }
    document.getElementById('edit-agente-id').value = agenteId;
    document.getElementById('edit-agente-nombre').value = ag.agente || '';
    document.getElementById('edit-agente-siglas').value = ag.siglas || '';
    document.getElementById('edit-agente-pct').value = (parseFloat(ag.pct || 0) * 100).toFixed(0);
    document.getElementById('edit-agente-activo').value = ag.activo !== false ? 'true' : 'false';
    title.textContent = 'Editar Agente';
  } else {
    // Nuevo agente
    document.getElementById('edit-agente-id').value = '';
    document.getElementById('edit-agente-nombre').value = '';
    document.getElementById('edit-agente-siglas').value = '';
    document.getElementById('edit-agente-pct').value = '10';
    document.getElementById('edit-agente-activo').value = 'true';
    title.textContent = 'Nuevo Agente';
  }
  ov.style.display = 'flex';
}

function closeEditAgente() {
  document.getElementById('edit-agente-overlay').style.display = 'none';
}

async function submitEditAgente() {
  const id = document.getElementById('edit-agente-id').value;
  const nombre = document.getElementById('edit-agente-nombre').value.trim();
  const siglas = document.getElementById('edit-agente-siglas').value.trim().toUpperCase();
  const pctVal = parseFloat(document.getElementById('edit-agente-pct').value);
  const activo = document.getElementById('edit-agente-activo').value === 'true';

  if (!nombre) { toast('⚠️ El nombre es requerido'); return; }
  if (!siglas) { toast('⚠️ Las siglas son requeridas'); return; }
  if (isNaN(pctVal) || pctVal < 0 || pctVal > 100) { toast('⚠️ % Comisión debe ser entre 0 y 100'); return; }

  const agente = { nombre, siglas, pct_comision: pctVal / 100, activo };
  if (id) agente.id = parseInt(id);

  try {
    await TPV.saveAgente(agente);
    toast(`✅ Agente ${nombre} guardado`);
    closeEditAgente();
    await rTPVAgentes();
  } catch (e) {
    toast('❌ Error al guardar: ' + (e.message || e));
  }
}

  // Expose on window
  window.AGENTE_PAGOS_KEY = AGENTE_PAGOS_KEY;
  window._agentesCache = _agentesCache;
  window.agentePagosLoad = agentePagosLoad;
  window.agentePagosSave = agentePagosSave;
  window.agenteTotalPagado = agenteTotalPagado;
  window.rTPVAgentes = rTPVAgentes;
  window.openPagoAgenteModal = openPagoAgenteModal;
  window.closePagoAgenteModal = closePagoAgenteModal;
  window.pagoAgenteUpdateSaldo = pagoAgenteUpdateSaldo;
  window.submitPagoAgente = submitPagoAgente;
  window.openHistorialAgente = openHistorialAgente;
  window.closeHistorialAgente = closeHistorialAgente;
  window.openTopComisiones = openTopComisiones;
  window.closeTopComisiones = closeTopComisiones;
  window.deletePagoAgente = deletePagoAgente;
  window.exportAgentesCSV = exportAgentesCSV;
  window.openEditAgente = openEditAgente;
  window.closeEditAgente = closeEditAgente;
  window.submitEditAgente = submitEditAgente;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_agentes', function(){ return rTPVAgentes(); });
  }

})(window);
