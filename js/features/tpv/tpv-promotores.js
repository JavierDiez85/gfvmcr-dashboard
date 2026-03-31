// GF — TPV: Promotores
(function(window) {
  'use strict';

// ═══════════════════════════════════════
// PROMOTORES VIEW
// ═══════════════════════════════════════
const PROM_PAGOS_KEY = 'gf_tpv_promotor_pagos';
let _promSelectedName = null;
let _promAllOptions = [];
let _promClientRows = [];

function promPagosLoad(){ try{return DB.get(PROM_PAGOS_KEY)||{};}catch(e){return {};} }
function promPagosSave(data){ DB.set(PROM_PAGOS_KEY,data); }
function promTotalPagado(name){ return (promPagosLoad()[name]||[]).reduce((s,p)=>s+p.monto,0); }

function setPromDates(period){
  const now=new Date();
  let from,to=now.toISOString().slice(0,10);
  if(period==='this_month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';}
  else if(period==='last_month'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);from=d.toISOString().slice(0,10);to=new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10);}
  else if(period==='last_3'){const d=new Date(now.getFullYear(),now.getMonth()-2,1);from=d.toISOString().slice(0,10);}
  else if(period==='all'){from=null;to=null;}
  const dfEl=document.getElementById('prom-from');if(dfEl)dfEl.value=from||'';
  const dtEl=document.getElementById('prom-to');if(dtEl)dtEl.value=to||'';
  TPV.invalidateAll();
  rTPVPromotoresDetail();
}

function filterPromotorOptions(q){
  _filterSelectOptions('prom-sel',_promAllOptions,q,'— Seleccionar promotor —');
}

async function rTPVPromotores(){
  if(typeof gfpRender === 'function'){
    gfpRender('tpv-promotores-pbar', {ent:'tpv', color:'#0073ea', type:'sub', years:['2025','2026'], viewId:'tpv_promotores'});
  }
  // Populate dropdown from unique promotor values in tpv_clients
  const allClients=await TPV.getClients()||[];
  const promotores=[...new Set(allClients.map(c=>c.promotor||'Sin Promotor'))].filter(p=>p&&p!=='Sin Promotor').sort();
  _promAllOptions=promotores.map(p=>({value:p,label:p}));
  const sel=document.getElementById('prom-sel');
  if(sel){
    const prev=sel.value;
    sel.innerHTML='<option value="">— Seleccionar promotor —</option>'+
      promotores.map(p=>`<option value="${p}" ${p===prev?'selected':''}>${p}</option>`).join('');
  }
  const fromEl=document.getElementById('prom-from'),toEl=document.getElementById('prom-to');
  if(fromEl&&!fromEl.value){const now=new Date();fromEl.value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';}
  if(toEl&&!toEl.value){toEl.value=new Date().toISOString().slice(0,10);}
  const kEl=document.getElementById('prom-kpis');
  if(kEl)kEl.innerHTML='<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un promotor arriba</div></div>';
  const cb=document.getElementById('prom-clients-tbody');if(cb)cb.innerHTML='';
  const ct=document.getElementById('prom-com-tbody');if(ct)ct.innerHTML='';
  const pt=document.getElementById('prom-pagos-tbody');if(pt)pt.innerHTML='';
  const tt=document.getElementById('prom-totals');if(tt)tt.style.display='none';
  const ck=document.getElementById('prom-com-kpis');if(ck)ck.innerHTML='';
  if(sel&&sel.value) rTPVPromotoresDetail();
}

async function rTPVPromotoresDetail(){
  const selName=document.getElementById('prom-sel')?.value;
  if(!selName){
    _promSelectedName=null;
    const kEl=document.getElementById('prom-kpis');
    if(kEl)kEl.innerHTML='<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un promotor arriba</div></div>';
    return;
  }
  _promSelectedName=selName;
  const fromDate=document.getElementById('prom-from')?.value||null;
  const toDate=document.getElementById('prom-to')?.value||null;
  const periodText=fromDate&&toDate?`${fromDate} → ${toDate}`:'Histórico completo';

  const [allClients,comData]=await Promise.all([
    TPV.getClients(),TPV.clientCommissions(fromDate,toDate)
  ]);

  // Filter clients by promotor name
  const promClientIds=(allClients||[]).filter(c=>(c.promotor||'Sin Promotor')===selName).map(c=>c.id);
  const pData=pagosLoad();

  const rows=(comData||[]).filter(c=>promClientIds.includes(c.client_id)).map(c=>{
    const cobrado=parseFloat(c.total_cobrado)||0;
    const comTotal=parseFloat(c.monto_neto)||0;
    const aPagar=cobrado-comTotal;
    const pagado=pagosTotalCliente(c.client_id,pData);
    const saldo=Math.max(0,aPagar-pagado);
    return {id:c.client_id,cliente:c.cliente,total_cobrado:cobrado,total_comisiones:comTotal,
      com_comisionista:parseFloat(c.com_comisionista)||0,a_pagar:aPagar,_pagado:pagado,_saldo:saldo,
      _nPagos:(pData[c.client_id]||[]).filter(p=>!p.anulado).length};
  }).sort((a,b)=>b.total_cobrado-a.total_cobrado);

  _promClientRows=rows;

  // Aggregates
  const totCobrado=rows.reduce((s,r)=>s+r.total_cobrado,0);
  const totComisiones=rows.reduce((s,r)=>s+r.total_comisiones,0);
  const totAPagar=rows.reduce((s,r)=>s+r.a_pagar,0);
  const totPagadoClientes=rows.reduce((s,r)=>s+r._pagado,0);
  const totSaldoClientes=rows.reduce((s,r)=>s+r._saldo,0);
  // Promoter commission = sum of com_comisionista across their clients
  const comPromotor=rows.reduce((s,r)=>s+r.com_comisionista,0);
  const pagadoPromotor=promTotalPagado(selName);
  const pendientePromotor=Math.max(0,comPromotor-pagadoPromotor);
  const totalOwed=totAPagar+comPromotor;
  const totalPaid=totPagadoClientes+pagadoPromotor;
  const totalPending=totSaldoClientes+pendientePromotor;

  // Subtitle
  const sub=document.getElementById('prom-subtitle');
  if(sub)sub.innerHTML=`<b>${_esc(selName)}</b> — ${rows.length} clientes — ${periodText}`;

  // KPIs
  const kEl=document.getElementById('prom-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div><div class="kpi-val" style="color:#0073ea">${fmtTPV(totCobrado)}</div><div class="kpi-d dnu">${rows.length} clientes del promotor</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📊</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(totComisiones)}</div><div class="kpi-d dnu">${totCobrado>0?(totComisiones/totCobrado*100).toFixed(2):'0'}% del cobrado</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:${totCobrado>0?Math.min(totComisiones/totCobrado*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">A Pagar (Clientes)</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💵</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totAPagar)}</div><div class="kpi-d dnu">Pagado: ${fmtTPV(totPagadoClientes)} (${totAPagar>0?(totPagadoClientes/totAPagar*100).toFixed(1):'0'}%)</div><div class="kbar"><div class="kfill" style="background:var(--green);width:${totAPagar>0?Math.min(totPagadoClientes/totAPagar*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Com. Promotor</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🤝</div></div><div class="kpi-val" style="color:var(--purple)">${fmtTPV(comPromotor)}</div><div class="kpi-d dnu">Tasas comisionista — Pagado: ${fmtTPV(pagadoPromotor)}</div><div class="kbar"><div class="kfill" style="background:var(--purple);width:${comPromotor>0?Math.min(pagadoPromotor/comPromotor*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">Pendiente Total</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div><div class="kpi-val" style="color:var(--red)">${fmtTPV(totalPending)}</div><div class="kpi-d dnu">Clientes: ${fmtTPV(totSaldoClientes)} + Com: ${fmtTPV(pendientePromotor)}</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${totalOwed>0?Math.min(totalPending/totalOwed*100,100).toFixed(0):0}%"></div></div></div>`;

  // Client Breakdown Table
  const tbody=document.getElementById('prom-clients-tbody');
  if(tbody){
    const tTitle=document.getElementById('prom-clients-title');
    if(tTitle)tTitle.textContent=`Clientes de ${selName} (${rows.length})`;
    tbody.innerHTML=rows.length?rows.map(p=>{
      const pctPaid=p.a_pagar>0?(p._pagado/p.a_pagar*100):0;
      const est=p._saldo<=0
        ?'<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Al día</span>'
        :pctPaid>0?'<span class="pill" style="background:var(--yellow-lt);color:#7a5000">Parcial</span>'
        :'<span class="pill" style="background:var(--red-lt);color:#b02020">Pendiente</span>';
      const histBadge=p._nPagos>0?`<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${p._nPagos}</span>`:'';
      return `<tr>
        <td class="bld" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(p.cliente)}</td>
        <td class="mo r">${fmtTPVFull(p.total_cobrado,2)}</td>
        <td class="mo r" style="color:var(--orange)">${fmtTPVFull(p.total_comisiones,2)}</td>
        <td class="mo r bld" style="color:var(--green)">${fmtTPVFull(p.a_pagar,2)}</td>
        <td class="mo r">${p._pagado>0?fmtTPVFull(p._pagado,2):'<span style="color:var(--muted)">—</span>'}</td>
        <td class="mo r" style="color:${p._saldo>0.01?'var(--red)':'var(--green)'}">${p._saldo>0.01?fmtTPVFull(p._saldo,2):'✓ $0'}</td>
        <td>${est}</td>
        <td style="text-align:center;white-space:nowrap">
          <button class="prom-hist-btn" data-pid="${p.id}" title="Historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px">🕐${histBadge}</button>
          <button class="prom-pago-btn" data-pid="${p.id}" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>
        </td></tr>`;
    }).join(''):'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Sin clientes con actividad en este periodo</td></tr>';

    // Event delegation for promotor clients table
    if (!tbody._promClientsBound) {
      tbody.addEventListener('click', function(e) {
        const histBtn = e.target.closest('.prom-hist-btn');
        if (histBtn) { openHistorial(parseInt(histBtn.dataset.pid)); return; }
        const pagoBtn = e.target.closest('.prom-pago-btn');
        if (pagoBtn) { openPagoModal(parseInt(pagoBtn.dataset.pid)); return; }
      });
      tbody._promClientsBound = true;
    }
  }

  // Comision del Promotor Section
  const comTitle=document.getElementById('prom-com-title');
  if(comTitle)comTitle.textContent=`Comisión de ${selName}`;
  const comKpis=document.getElementById('prom-com-kpis');
  if(comKpis)comKpis.innerHTML=`
    <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Com. Comisionista</div><div class="m-kpi-val" style="color:var(--purple)">${fmtTPVFull(comPromotor,2)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(pagadoPromotor,2)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Pendiente</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(pendientePromotor,2)}</div></div>`;
  const comTbody=document.getElementById('prom-com-tbody');
  if(comTbody)comTbody.innerHTML=`
    <tr><td class="bld">Comisión comisionista (sum tasas rate_comisionista)</td><td class="mo r bld" style="color:var(--purple)">${fmtTPVFull(comPromotor,2)}</td></tr>
    <tr><td>Pagado</td><td class="mo r" style="color:var(--green)">${fmtTPVFull(pagadoPromotor,2)}</td></tr>
    <tr style="border-top:2px solid var(--border)"><td style="color:var(--red);font-weight:600">Pendiente de pago</td><td class="mo r bld" style="color:var(--red)">${fmtTPVFull(pendientePromotor,2)}</td></tr>`;

  // Pagos al Promotor
  const promPData=promPagosLoad();
  const pagos=(promPData[selName]||[]).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  const pagosTitle=document.getElementById('prom-pagos-title');
  if(pagosTitle)pagosTitle.textContent=`Pagos a ${selName} (${pagos.length})`;
  const pagosTbody=document.getElementById('prom-pagos-tbody');
  if(pagosTbody){
    pagosTbody.innerHTML=pagos.length?pagos.map(p=>
      `<tr><td class="bld">${p.fecha}</td><td class="mo r" style="color:var(--green)">${fmtTPVFull(p.monto)}</td><td style="color:var(--muted);font-size:.72rem">${p.ref||'—'}</td><td style="color:var(--muted);font-size:.66rem">${p.registrado}</td><td><button class="prom-del-pago-btn" data-name="${escapeHtml(selName)}" data-pid="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem" title="Eliminar">🗑</button></td></tr>`
    ).join(''):'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin pagos registrados</td></tr>';

    // Event delegation for promotor pago delete
    if (!pagosTbody._promBound) {
      pagosTbody.addEventListener('click', function(e) {
        const btn = e.target.closest('.prom-del-pago-btn');
        if (btn) deletePromPago(btn.dataset.name, parseInt(btn.dataset.pid));
      });
      pagosTbody._promBound = true;
    }
  }

  // Resumen Consolidado
  const totalsEl=document.getElementById('prom-totals');
  if(totalsEl){
    totalsEl.style.display='';
    totalsEl.innerHTML=`
      <div style="font-weight:700;font-size:.82rem;margin-bottom:10px">📋 Resumen Consolidado</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:.75rem">
        <div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
          <div style="color:var(--muted);font-size:.65rem;margin-bottom:4px">Total Adeudado</div>
          <div style="font-weight:700;color:var(--text);font-size:.9rem">${fmtTPVFull(totalOwed,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">Clientes: ${fmtTPV(totAPagar)} + Com: ${fmtTPV(comPromotor)}</div>
        </div>
        <div style="padding:10px;background:var(--green-bg);border-radius:8px;text-align:center">
          <div style="color:var(--green);font-size:.65rem;margin-bottom:4px">Total Pagado</div>
          <div style="font-weight:700;color:var(--green);font-size:.9rem">${fmtTPVFull(totalPaid,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">${totalOwed>0?(totalPaid/totalOwed*100).toFixed(1):0}% completado</div>
        </div>
        <div style="padding:10px;background:var(--red-bg);border-radius:8px;text-align:center">
          <div style="color:var(--red);font-size:.65rem;margin-bottom:4px">Total Pendiente</div>
          <div style="font-weight:700;color:var(--red);font-size:.9rem">${fmtTPVFull(totalPending,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">${rows.filter(r=>r._saldo>0).length} clientes + comisión</div>
        </div>
      </div>`;
  }
}

function openPromPagoModal(){
  if(!_promSelectedName){toast('⚠️ Selecciona un promotor');return;}
  const ov=document.getElementById('prom-pago-overlay');
  if(!ov){
    // Create modal dynamically
    const d=document.createElement('div');d.id='prom-pago-overlay';
    d.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999';
    d.innerHTML=`<div style="background:var(--white);border-radius:14px;padding:24px;width:400px;max-width:90vw">
      <div style="font-weight:700;font-size:.88rem;margin-bottom:14px">💰 Pago Comisión a <span id="prom-pago-name"></span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div><label style="font-size:.68rem;color:var(--muted)">Fecha</label><input type="date" id="prom-pago-fecha" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
        <div><label style="font-size:.68rem;color:var(--muted)">Monto</label><input type="number" id="prom-pago-monto" step="0.01" placeholder="$0.00" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
      </div>
      <div style="margin-bottom:14px"><label style="font-size:.68rem;color:var(--muted)">Referencia</label><input type="text" id="prom-pago-ref" placeholder="Transferencia, cheque..." style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-out prom-pago-cancel" style="font-size:.75rem">Cancelar</button>
        <button class="btn btn-blue edit-action prom-pago-submit" style="font-size:.75rem">✅ Registrar</button>
      </div>
    </div>`;
    d.querySelector('.prom-pago-cancel').addEventListener('click', function(){ document.getElementById('prom-pago-overlay').style.display='none'; });
    d.querySelector('.prom-pago-submit').addEventListener('click', function(){ submitPromPago(); });
    document.body.appendChild(d);
  }
  document.getElementById('prom-pago-overlay').style.display='flex';
  document.getElementById('prom-pago-name').textContent=_promSelectedName;
  document.getElementById('prom-pago-fecha').value=new Date().toISOString().slice(0,10);
  document.getElementById('prom-pago-monto').value='';
  document.getElementById('prom-pago-ref').value='';
}

function submitPromPago(){
  const fecha=document.getElementById('prom-pago-fecha').value;
  const monto=parseFloat(document.getElementById('prom-pago-monto').value);
  const ref=document.getElementById('prom-pago-ref').value.trim();
  if(!fecha||!monto||monto<=0){toast('⚠️ Completa fecha y monto');return;}
  const data=promPagosLoad();
  if(!data[_promSelectedName])data[_promSelectedName]=[];
  data[_promSelectedName].push({id:Date.now(),fecha,monto,ref,registrado:new Date().toLocaleString('es-MX')});
  promPagosSave(data);
  toast(`✅ Pago de ${fmtTPVFull(monto)} a ${_promSelectedName}`);
  document.getElementById('prom-pago-overlay').style.display='none';
  rTPVPromotoresDetail();
}

function deletePromPago(promName,pagoId){
  customConfirm('¿Eliminar este pago de comisión?','Eliminar',()=>{
    const data=promPagosLoad();
    if(data[promName]){data[promName]=data[promName].filter(p=>p.id!==pagoId);if(!data[promName].length)delete data[promName];}
    promPagosSave(data);
    toast('🗑 Pago eliminado');
    rTPVPromotoresDetail();
  });
}

function exportPromotoresCSV(){
  if(!_promClientRows.length){toast('⚠️ No hay datos');return;}
  const bom='\uFEFF';
  let csv=bom+'Cliente,Cobrado,Comisiones,A Pagar,Pagado,Saldo,Com Promotor\n';
  _promClientRows.forEach(r=>{csv+=`"${r.cliente}",${r.total_cobrado.toFixed(2)},${r.total_comisiones.toFixed(2)},${r.a_pagar.toFixed(2)},${r._pagado.toFixed(2)},${r._saldo.toFixed(2)},${r.com_comisionista.toFixed(2)}\n`;});
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`promotor_${_promSelectedName}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  toast('✅ CSV exportado');
}

  // Expose on window
  window.PROM_PAGOS_KEY = PROM_PAGOS_KEY;
  window._promSelectedName = _promSelectedName;
  window._promAllOptions = _promAllOptions;
  window._promClientRows = _promClientRows;
  window.promPagosLoad = promPagosLoad;
  window.promPagosSave = promPagosSave;
  window.promTotalPagado = promTotalPagado;
  window.setPromDates = setPromDates;
  window.filterPromotorOptions = filterPromotorOptions;
  window.rTPVPromotores = rTPVPromotores;
  window.rTPVPromotoresDetail = rTPVPromotoresDetail;
  window.openPromPagoModal = openPromPagoModal;
  window.submitPromPago = submitPromPago;
  window.deletePromPago = deletePromPago;
  window.exportPromotoresCSV = exportPromotoresCSV;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_promotores', function(){ return rTPVPromotores(); });
  }

})(window);
