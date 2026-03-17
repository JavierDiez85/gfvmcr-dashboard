// GF — TPV: Terminales View
(function(window) {
  'use strict';

// ── WRAPPER: Vista unificada Terminales + Cambios ──
async function rTPVTerminalesView(){
  await rTPVTerminales();
  await rTPVCambios();
}

async function rTPVTerminales(){
  const tbody=document.getElementById('term-tbody');if(!tbody)return;
  const terms = await TPV.terminalStatus() || [];
  _termAllData = terms; // store for filtering
  // Populate client dropdown + search cache
  const clientes = [...new Set(terms.map(t => t.cliente))].sort();
  _termClienteOptions = clientes.map(c => ({ value: c, label: c }));
  const clienteFilter = document.getElementById('term-cliente-filter');
  if (clienteFilter) {
    const prev = clienteFilter.value;
    clienteFilter.innerHTML = '<option value="">Todos los clientes</option>' +
      clientes.map(c => `<option value="${c}" ${c === prev ? 'selected' : ''}>${c}</option>`).join('');
  }
  const termSearchEl = document.getElementById('term-search');
  if (termSearchEl) termSearchEl.value = '';
  // KPIs
  const numTerm = new Set(terms.map(t=>t.terminal_id)).size;
  const totIng = terms.reduce((s,t)=>s+parseFloat(t.ingresos||0),0);
  const totTxn = terms.reduce((s,t)=>s+parseInt(t.transacciones||0),0);
  const avgTicket = totTxn > 0 ? totIng / totTxn : 0;
  const kEl=document.getElementById('tpv-term-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Terminales</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🖥️</div></div><div class="kpi-val" style="color:#0073ea">${numTerm}</div><div class="kpi-d dnu">Total registradas</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Ingresos</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totIng)}</div><div class="kpi-d dnu">Total período</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Transacciones</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🔢</div></div><div class="kpi-val" style="color:var(--purple)">${totTxn.toLocaleString()}</div><div class="kpi-d dnu">Pagos procesados</div><div class="kbar"><div class="kfill" style="background:var(--purple);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Ticket Promedio</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🎫</div></div><div class="kpi-val" style="color:var(--orange)">$${avgTicket.toFixed(0)}</div><div class="kpi-d dnu">Por transacción</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:65%"></div></div></div>`;
  // Count active/inactive/warning
  const activas = terms.filter(t=>(parseInt(t.dias_sin_uso)||0)<=14).length;
  const warning = terms.filter(t=>{const d=parseInt(t.dias_sin_uso)||0; return d>14&&d<=30;}).length;
  const inactivas = terms.filter(t=>(parseInt(t.dias_sin_uso)||0)>30).length;
  const numClientes = new Set(terms.map(t=>t.cliente)).size;
  const sub=document.getElementById('tpv-term-subtitle');
  if(sub)sub.innerHTML=`${numTerm} terminales · ${numClientes} clientes · <span style="color:var(--green);font-weight:600">${activas} activas</span> · <span style="color:var(--orange)">${warning} alerta</span> · <span style="color:var(--red)">${inactivas} inactivas</span>`;
  tbody.innerHTML=terms.map(t=>{
    const dias=parseInt(t.dias_sin_uso)||0;
    const badge=dias<=14?'<span class="tpv-badge-ok">Activa</span>':dias<=30?`<span class="tpv-badge-warn">${dias}d sin uso</span>`:`<span class="tpv-badge-inact">Inactiva ${dias}d</span>`;
    const tid=t.terminal_id&&t.terminal_id!=='-'&&t.terminal_id!=='None'?`<span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${t.terminal_id.slice(-10)}</span>`:'—';
    return`<tr>
      <td class="bld">${t.cliente}</td>
      <td class="mo" style="text-align:center">${t.num_term}</td>
      <td>${tid}</td>
      <td style="font-size:.73rem">${t.ultimo_uso||'—'}</td>
      <td class="mo pos bld">${parseFloat(t.ingresos)>0?fmtTPVFull(t.ingresos):'—'}</td>
      <td class="mo" style="text-align:center">${parseInt(t.transacciones)>0?parseInt(t.transacciones).toLocaleString():'—'}</td>
      <td class="mo">${parseFloat(t.promedio)>0?'$'+parseFloat(t.promedio).toFixed(0):'—'}</td>
      <td class="mo" style="text-align:center;color:${dias>30?'var(--red)':dias>14?'var(--orange)':'var(--green)'}">${dias||'—'}</td>
      <td>${badge}</td></tr>`;
  }).join('');
  // Terminal charts
  setTimeout(()=>{
    const isDark=document.body.classList.contains('dark');
    const textC=isDark?'#9da0c5':'#8b8fb5';
    const gridC=isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    // Top 10 bar chart
    const top10=terms.slice(0,10);
    if(TPV_CHARTS['term_top'])TPV_CHARTS['term_top'].destroy();
    const c1=document.getElementById('c-tpv-term-top');
    if(c1){TPV_CHARTS['term_top']=new Chart(c1,{type:'bar',
      data:{labels:top10.map(t=>(t.cliente||'').substring(0,16)),datasets:[{data:top10.map(t=>parseFloat(t.ingresos)),backgroundColor:'#0073ea22',borderColor:'#0073ea',borderWidth:1.5,borderRadius:4}]},
      options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:gridC},ticks:{color:textC,font:{size:9},callback:v=>'$'+Math.abs(Math.round(v)).toLocaleString('es-MX')}},y:{grid:{display:false},ticks:{color:textC,font:{size:8}}}}}
    });}
    // Status doughnut
    if(TPV_CHARTS['term_status'])TPV_CHARTS['term_status'].destroy();
    const c2=document.getElementById('c-tpv-term-status');
    if(c2){TPV_CHARTS['term_status']=new Chart(c2,{type:'doughnut',
      data:{labels:['Activas (≤14d)','Alerta (15-30d)','Inactivas (>30d)'],datasets:[{data:[activas,warning,inactivas],backgroundColor:['#00b875','#ffa000','#e53935'],borderWidth:0}]},
      options:{cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10,padding:8}}}}
    });}
  },50);
}

async function rTPVCambios(){
  const tbody=document.getElementById('cambios-tbody');if(!tbody)return;
  const cambios = await TPV.terminalChanges() || [];
  const numSolap = cambios.filter(c=>(c.tipo||'').includes('⚠️')).length;
  const numTerminals = new Set(cambios.map(c=>c.terminal)).size;
  // KPIs
  const kEl=document.getElementById('tpv-cambios-kpis');
  if(kEl){
    const pctSolap = cambios.length > 0 ? (numSolap / cambios.length * 100).toFixed(1) : '0.0';
    kEl.innerHTML=`
      <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Terminales con Cambio</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🔄</div></div><div class="kpi-val" style="color:var(--orange)">${numTerminals}</div><div class="kpi-d dnu">Terminales reasignadas</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:100%"></div></div></div>
      <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Cambios Detectados</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">📋</div></div><div class="kpi-val" style="color:#0073ea">${cambios.length}</div><div class="kpi-d dnu">Movimientos registrados</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
      <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">⚠️ Solapamientos</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">🚨</div></div><div class="kpi-val" style="color:var(--red)">${numSolap}</div><div class="kpi-d dnu">${pctSolap}% del total</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${pctSolap}%"></div></div></div>`;
  }
  const numLimpios = cambios.length - numSolap;
  const sub=document.getElementById('tpv-cambios-subtitle');
  if(sub)sub.innerHTML=cambios.length > 0
    ? `${cambios.length} cambios detectados · <span style="color:var(--green);font-weight:600">✅ ${numLimpios} limpios</span> · <span style="color:var(--red);font-weight:600">⚠️ ${numSolap} solapamientos</span>`
    : 'No se detectaron cambios de terminal entre clientes';
  if (cambios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">✅ No se detectaron reasignaciones de terminales entre clientes. Todas las terminales mantienen su asignación original.</td></tr>';
    return;
  }
  tbody.innerHTML=cambios.map(c=>{
    const badge=(c.tipo||'').includes('⚠️')?'<span class="tpv-badge-warn">⚠️ Solapamiento</span>':'<span class="tpv-badge-ok">✅ Limpio</span>';
    const tid=c.terminal?c.terminal.slice(-12):'-';
    return`<tr style="${(c.tipo||'').includes('⚠️')?'background:rgba(255,152,0,.04)':''}">
      <td style="color:var(--muted);font-size:.72rem">${c.num}</td>
      <td><span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${tid}</span></td>
      <td class="bld">${c.cliente_ant||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_ant_ini||''}</td>
      <td style="font-size:.73rem">${c.fecha_ant_fin||''}</td>
      <td class="mo" style="text-align:center">${c.txns_ant||0}</td>
      <td class="mo">${parseFloat(c.monto_ant)>0?fmtTPVFull(c.monto_ant):'—'}</td>
      <td>${badge}</td>
      <td class="bld" style="color:#0073ea">${c.cliente_act||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_act_ini||''}</td>
      <td style="font-size:.73rem">${c.fecha_act_fin||''}</td>
      <td class="mo" style="text-align:center">${c.txns_act||0}</td></tr>`;
  }).join('');
}


// ==============================
// TPV CHARTS
// ==============================
const TPV_CHARTS = {};

// Charts now integrated into initTPVGeneral(), initTPVDashboard() and rTPVAgentes()
// Old standalone chart functions removed


  // Expose on window
  window.rTPVTerminalesView = rTPVTerminalesView;
  window.rTPVTerminales = rTPVTerminales;
  window.rTPVCambios = rTPVCambios;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_terminales', function(){ return rTPVTerminalesView(); });
  }

})(window);
