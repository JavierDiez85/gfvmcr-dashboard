// GF — Créditos: carteras, PDF upload

// RENDER: CARTERAS
// ═══════════════════════════════════════
// CRÉDITOS — Engine completo
// ═══════════════════════════════════════

// ── Helpers de cálculo ──
function credIntMes(c){
  if(!c.monto||!c.tasa) return 0;
  // If amortization table exists, use first period interest
  if(c.amort && c.amort.length>1) return c.amort[1].int||0;
  return c.monto * (c.tasa/100) / (c.plazo<=24?12:c.plazo<=60?12:1);
}
function credComApertura(c){ return c.monto*(c.com||0)/100; }
function credIngAnual(c){
  if(c.amort && c.amort.length>1){
    return c.amort.slice(1).reduce((s,r)=>s+(r.int||0)+(r.ivaInt||0),0);
  }
  return credIntMes(c)*12 + credComApertura(c);
}
function credSaldoActual(c){
  // Return current outstanding capital based on last fully-paid period
  if(!c.amort || c.amort.length<=1) return c.monto||0;
  let lastPaid = 0;
  for(let i=1; i<c.amort.length; i++){
    const st = credPeriodStatus(c, c.amort[i]);
    if(st === 'PAGADO') lastPaid = i;
  }
  return c.amort[lastPaid].saldo||0;
}
function credPagoFijo(c){
  if(c.amort && c.amort.length>1) return c.amort[1].pago||0;
  return 0;
}
function credTotalPagos(c){
  if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.pago||0),0);
  return 0;
}
function credTotalIntereses(c){
  if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.int||0),0);
  return 0;
}

// ── Helpers de fecha DD/MM/YYYY o DD/Mon/YYYY ──
const _MESES_MAP = {ene:0,feb:1,mar:2,abr:3,apr:3,may:4,jun:5,jul:6,ago:7,aug:7,sep:8,oct:9,nov:10,dic:11,dec:11};
function credParseDate(str){
  if(!str) return null;
  const p = str.split('/');
  if(p.length!==3) return null;
  let mes = parseInt(p[1]);
  if(isNaN(mes)){
    mes = _MESES_MAP[p[1].toLowerCase().substring(0,3)];
    if(mes===undefined) return null;
  } else { mes--; }
  return new Date(parseInt(p[2]), mes, parseInt(p[0]));
}
function credFormatDate(d){
  if(!d) return '';
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}

// ── Estatus de pago por periodo ──
function credPeriodStatus(credit, row){
  if(!row || row.periodo===0) return null;
  const pagos = credit.pagos || [];
  const pago = pagos.find(p => p.periodo === row.periodo);
  const fechaVenc = credParseDate(row.fecha);
  const today = new Date(); today.setHours(0,0,0,0);

  if(pago){
    return pago.monto >= (row.pago||0) ? 'PAGADO' : 'PARCIAL';
  }
  if(!fechaVenc) return 'PENDIENTE';
  return fechaVenc < today ? 'VENCIDO' : 'PENDIENTE';
}

function credDiasAtraso(row){
  const f = credParseDate(row.fecha);
  if(!f) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((today - f)/(1000*60*60*24));
  return diff > 0 ? diff : 0;
}

function credCobranzaResumen(credit){
  if(!credit.amort || credit.amort.length<=1) return null;
  const rows = credit.amort.slice(1);
  let pagado=0, parcial=0, vencido=0, pendiente=0;
  let montoVencido=0, montoPagado=0, montoPendiente=0, maxAtraso=0;
  const pagos = credit.pagos || [];

  rows.forEach(r=>{
    const st = credPeriodStatus(credit, r);
    const pr = pagos.find(p=>p.periodo===r.periodo);
    if(st==='PAGADO')   { pagado++;  montoPagado += pr ? pr.monto : 0; }
    else if(st==='PARCIAL'){ parcial++; montoPagado += pr ? pr.monto : 0; montoVencido += (r.pago||0) - (pr?pr.monto:0); }
    else if(st==='VENCIDO'){ vencido++; montoVencido += (r.pago||0); maxAtraso = Math.max(maxAtraso, credDiasAtraso(r)); }
    else { pendiente++; montoPendiente += (r.pago||0); }
  });
  return { pagado, parcial, vencido, pendiente, montoVencido, montoPagado, montoPendiente, maxAtraso, total:rows.length };
}

function credProximoPago(credit){
  if(!credit.amort || credit.amort.length<=1) return null;
  for(let i=1;i<credit.amort.length;i++){
    const st = credPeriodStatus(credit, credit.amort[i]);
    if(st==='VENCIDO'||st==='PENDIENTE'||st==='PARCIAL') return credit.amort[i];
  }
  return null;
}

// ══════════════════════════════════════
// DASHBOARD CONSOLIDADO DE CRÉDITOS
// ══════════════════════════════════════
function rCredDash(entFilter, elPrefix){
  // entFilter: 'end'=solo Endless, 'dyn'=solo Dynamo, null=todos
  // elPrefix: prefijo de IDs HTML (default 'cred-dash')
  if(!elPrefix) elPrefix = 'cred-dash';

  // Load latest data from DB
  try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}

  let all = [];
  if(!entFilter || entFilter==='end') all.push(...END_CREDITS.map(c=>({...c, _ent:'end', _entLabel:'Endless Money', _col:'#00b875'})));
  if(!entFilter || entFilter==='dyn') all.push(...DYN_CREDITS.map(c=>({...c, _ent:'dyn', _entLabel:'Dynamo Finance', _col:'#ff7043'})));

  // ── KPIs consolidados ──
  const activos    = all.filter(c=>c.st==='Activo');
  const vencidos   = all.filter(c=>c.st==='Vencido');
  const prospectos = all.filter(c=>c.st==='Prospecto');
  const pagados    = all.filter(c=>c.st==='Pagado');

  const montoTotal     = all.reduce((s,c)=>s+(c.monto||0),0);
  // Cartera vencida = suma de montos de periodos vencidos por fecha (no por estatus del crédito)
  const activosYVencidos = all.filter(c=>c.st==='Activo'||c.st==='Vencido');
  const carteraVencida = activosYVencidos.reduce((s,c)=>{
    const res = credCobranzaResumen(c);
    return s + (res ? res.montoVencido : 0);
  },0);
  const saldoTotal     = activosYVencidos.reduce((s,c)=>s+credSaldoActual(c),0);
  const carteraActiva  = saldoTotal - carteraVencida;
  const carteraTotal   = saldoTotal;
  const intTotal       = all.reduce((s,c)=>s+credTotalIntereses(c),0);
  const totalCreditos  = activos.length + vencidos.length + prospectos.length;
  const pctVencida     = carteraTotal>0 ? ((carteraVencida/carteraTotal)*100).toFixed(1) : '0';

  const _kpiCard = (k) => `
    <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px;border-top:3px solid ${k.color}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
        <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
      </div>
      <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
      <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
    </div>`;

  const kpis1 = [
    {lbl:'Total Créditos', val:totalCreditos, sub:`${activos.length} activos · ${vencidos.length} vencidos · ${prospectos.length} prospectos`, ico:'📋', color:'#0073ea', bg:'var(--blue-bg)'},
    {lbl:'Monto Total Prestado', val:fmtK(montoTotal), sub:'Capital otorgado ambas SOFOMs', ico:'💵', color:'var(--green)', bg:'var(--green-bg)'},
    {lbl:'Cartera Vigente', val:fmtK(carteraActiva), sub:'Saldo activo pendiente consolidado', ico:'📈', color:'#0073ea', bg:'var(--blue-bg)'},
  ];
  const kpis2 = [
    {lbl:'Cartera Vencida', val:fmtK(carteraVencida), sub: carteraVencida>0 ? pctVencida+'% del total' : 'Sin vencimientos', ico:'⚠️', color: carteraVencida>0?'var(--red)':'var(--green)', bg: carteraVencida>0?'var(--red-bg)':'var(--green-bg)'},
    {lbl:'Intereses Totales', val:fmtK(intTotal), sub:'Sobre tablas de amortización', ico:'💰', color:'var(--purple)', bg:'var(--purple-bg)'},
    {lbl:'Tasa Ponderada Prom.', val: montoTotal>0 ? (all.reduce((s,c)=>s+(c.tasa||0)*(c.monto||0),0)/montoTotal).toFixed(1)+'%' : '—', sub:'Ponderada por monto', ico:'📊', color:'var(--orange)', bg:'var(--orange-bg)'},
  ];

  const el1 = document.getElementById(elPrefix+'-kpis');
  const el2 = document.getElementById(elPrefix+'-kpis2');
  if(el1) el1.innerHTML = kpis1.map(_kpiCard).join('');
  if(el2) el2.innerHTML = kpis2.map(_kpiCard).join('');

  // ── Charts ──
  // Chart 1: Status breakdown (horizontal bar)
  const _chKey1 = elPrefix+'-st';
  const _chKey2 = elPrefix+'-ent';
  dc(_chKey1);
  const _canvasSt = document.getElementById('c-'+elPrefix+'-status');
  if(!_canvasSt) { _credDashEntitySummary('end', END_CREDITS, '#00b875'); _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043'); _credDashRenderAllList(all, elPrefix); return; }
  CH[_chKey1] = new Chart(_canvasSt,{
    type:'bar',
    data:{
      labels:['Activos','Vencidos','Prospectos','Pagados'],
      datasets:[{
        data:[activos.length, vencidos.length, prospectos.length, pagados.length],
        backgroundColor:['rgba(0,184,117,.22)','rgba(234,57,67,.22)','rgba(255,160,0,.22)','rgba(155,81,224,.22)'],
        borderColor:['#00b875','#ea3943','#ffa000','#9b51e0'],
        borderWidth:1.5, borderRadius:4
      }]
    },
    options:{...cOpts(),indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw+' créditos'}}},
      scales:{x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{stepSize:1,color:'#b0b4d0',font:{size:9}}},y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}}}
  });

  // Chart 2: Entity distribution (doughnut)
  dc(_chKey2);
  const endCartera = END_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
  const dynCartera = DYN_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
  const totalCar = endCartera + dynCartera;
  const _canvasEnt = document.getElementById('c-'+elPrefix+'-entity');
  if(!_canvasEnt) { _credDashEntitySummary('end', END_CREDITS, '#00b875'); _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043'); _credDashRenderAllList(all, elPrefix); return; }
  CH[_chKey2] = new Chart(_canvasEnt,{
    type:'doughnut',
    data:{
      labels:[`Endless ${fmtK(endCartera)}`,`Dynamo ${fmtK(dynCartera)}`],
      datasets:[{
        data: totalCar>0 ? [endCartera, dynCartera] : [1,1],
        backgroundColor: totalCar>0 ? ['rgba(0,184,117,.22)','rgba(255,112,67,.22)'] : ['rgba(134,134,134,.15)','rgba(134,134,134,.15)'],
        borderColor: totalCar>0 ? ['#00b875','#ff7043'] : ['rgba(134,134,134,.3)','rgba(134,134,134,.3)'],
        borderWidth:2
      }]
    },
    options:{...cOpts(),cutout:'60%',plugins:{legend:{position:'bottom',labels:{color:'#8b8fb5',font:{size:10},boxWidth:8,padding:6}},
      tooltip:{callbacks:{label:ctx=>' '+fmtK(ctx.raw)+' ('+(totalCar>0?((ctx.raw/totalCar)*100).toFixed(1):0)+'%)'}}},
      scales:{x:{display:false},y:{display:false}}}
  });

  // ── Entity summary cards (solo si hay ambas) ──
  if(!entFilter) {
    _credDashEntitySummary('end', END_CREDITS, '#00b875');
    _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043');
  }

  // ── Lista combinada ──
  _credDashRenderAllList(all, elPrefix);
}

function _credDashEntitySummary(entKey, credits, col){
  const el = document.getElementById('cred-dash-'+entKey+'-summary');
  if(!el) return;
  const activos = credits.filter(c=>c.st==='Activo');
  const vencidos = credits.filter(c=>c.st==='Vencido');
  const prospectos = credits.filter(c=>c.st==='Prospecto');
  const activosYVenc = credits.filter(c=>c.st==='Activo'||c.st==='Vencido');
  const carteraVencida = activosYVenc.reduce((s,c)=>{ const r=credCobranzaResumen(c); return s+(r?r.montoVencido:0); },0);
  const saldoTotal = activosYVenc.reduce((s,c)=>s+credSaldoActual(c),0);
  const carteraVigente = saldoTotal - carteraVencida;
  const montoOriginal = credits.reduce((s,c)=>s+(c.monto||0),0);
  const total = activos.length+vencidos.length+prospectos.length;

  if(!total){
    el.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:.78rem">Sin créditos en cartera</div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
        <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Créditos</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${col}">${total}</div>
        <div style="font-size:.6rem;color:var(--muted)">${activos.length} act · ${vencidos.length} venc · ${prospectos.length} prosp</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
        <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Monto Prestado</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${col}">${fmtK(montoOriginal)}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
        <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Cartera Vigente</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:#0073ea">${fmtK(carteraVigente)}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
        <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Cartera Vencida</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${carteraVencida>0?'var(--red)':'var(--green)'}">${fmtK(carteraVencida)}</div>
      </div>
    </div>`;
}

function _credDashRenderAllList(all, elPrefix){
  if(!elPrefix) elPrefix = 'cred-dash';
  const listEl = document.getElementById(elPrefix+'-all-list');
  const countEl = document.getElementById(elPrefix+'-total-count');
  if(!listEl) return;

  if(countEl) countEl.textContent = all.length;

  if(!all.length){
    listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
      <div style="font-size:2rem;margin-bottom:10px">📭</div>
      No hay créditos en cartera.<br>
      <span style="font-size:.72rem">Usa <strong>Cargar PDF</strong> para importar desde tabla de amortización.</span>
    </div>`;
    return;
  }

  const sorted = [...all].sort((a,b)=>{
    const ord = {Activo:0,Vencido:1,Prospecto:2,Pagado:3};
    return (ord[a.st]||9) - (ord[b.st]||9) || (b.monto||0) - (a.monto||0);
  });

  const stIco = {Activo:'✅',Vencido:'⚠️',Pagado:'🏁',Prospecto:'🎯'};
  const stBg  = {Activo:'var(--green-bg)',Vencido:'var(--red-bg)',Pagado:'var(--purple-bg)',Prospecto:'var(--yellow-bg)'};
  const stCol = {Activo:'var(--green)',Vencido:'var(--red)',Pagado:'var(--purple)',Prospecto:'var(--yellow)'};
  const stBor = {Activo:'var(--green-lt)',Vencido:'var(--red-lt)',Pagado:'var(--purple-lt)',Prospecto:'var(--yellow-lt)'};

  listEl.innerHTML = sorted.map(c=>{
    const saldo = credSaldoActual(c);
    const intTot = credTotalIntereses(c);
    const credits = c._ent==='end' ? END_CREDITS : DYN_CREDITS;
    const origIdx = credits.findIndex(x=>x.cl===c.cl);

    return `<div class="cred-dash-row" data-name="${(c.cl||'').toLowerCase()}" onclick="credOpenDetail('${c._ent}','${(c.cl||'').replace(/'/g,"\\'")}',${origIdx})"
      style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <div style="width:36px;height:36px;border-radius:10px;background:${stBg[c.st]||stBg.Activo};border:1px solid ${stBor[c.st]||stBor.Activo};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${stIco[c.st]||'📋'}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span style="font-weight:700;font-size:.82rem">${c.cl}</span>
          <span style="font-size:.58rem;font-weight:700;padding:1px 6px;border-radius:8px;background:${stBg[c.st]};color:${stCol[c.st]};border:1px solid ${stBor[c.st]}">${c.st}</span>
          <span style="font-size:.56rem;font-weight:700;padding:1px 5px;border-radius:6px;background:${c._col}18;color:${c._col};border:1px solid ${c._col}35">${c._entLabel}</span>
        </div>
        <div style="font-size:.68rem;color:var(--muted)">${c.tipo||'Simple'} · ${c.tasa||0}% anual · ${c.plazo||0} meses${c.disbDate?' · '+c.disbDate:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:${c._col}">${fmtK(c.monto||0)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Monto</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#0073ea">${fmtK(saldo)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Saldo</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:var(--purple)">${fmtK(intTot)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Intereses</div>
      </div>
      <div style="color:var(--muted);font-size:.9rem;flex-shrink:0">›</div>
    </div>`;
  }).join('');
}

function credDashFilter(query){
  const q = query.toLowerCase();
  document.querySelectorAll('#cred-dash-all-list .cred-dash-row').forEach(row=>{
    row.style.display = row.dataset.name.includes(q) ? '' : 'none';
  });
}
function dynDashFilter(query){
  const q = query.toLowerCase();
  document.querySelectorAll('#dyn-dash-all-list .cred-dash-row').forEach(row=>{
    row.style.display = row.dataset.name.includes(q) ? '' : 'none';
  });
}

// ── Dashboard KPIs ──
function credRenderDashKPIs(credits, entKey){
  const col   = entKey==='end' ? '#00b875' : '#ff7043';
  const colBg = entKey==='end' ? 'var(--green-bg)' : 'var(--orange-bg)';
  const colLt = entKey==='end' ? 'var(--green-lt)' : 'var(--orange-lt)';
  const el    = document.getElementById(entKey+'-dash-kpis');
  if(!el) return;

  const activos    = credits.filter(c=>c.st==='Activo');
  const vencidos   = credits.filter(c=>c.st==='Vencido');
  const prospectos = credits.filter(c=>c.st==='Prospecto');
  const total      = activos.length + vencidos.length + prospectos.length;

  // Cartera vencida = montos de periodos vencidos por fecha de amortización
  const activosYVenc = credits.filter(c=>c.st==='Activo'||c.st==='Vencido');
  const carteraVencida = activosYVenc.reduce((s,c)=>{
    const res = credCobranzaResumen(c);
    return s + (res ? res.montoVencido : 0);
  },0);
  const saldoTotal     = activosYVenc.reduce((s,c)=>s+credSaldoActual(c),0);
  const carteraActiva  = saldoTotal - carteraVencida;
  const carteraTotal   = saldoTotal;
  const ganTotal       = credits.reduce((s,c)=>s+credTotalIntereses(c),0);
  const montoOriginal  = credits.reduce((s,c)=>s+(c.monto||0),0);
  const cobrado        = montoOriginal - carteraTotal + ganTotal;
  const numConVencidos = activosYVenc.filter(c=>{ const r=credCobranzaResumen(c); return r&&r.montoVencido>0; }).length;

  const kpis = [
    {lbl:'Créditos', val:total, sub: `${activos.length} activos · ${vencidos.length} vencidos · ${prospectos.length} prospectos`, ico:'📋', color:col, bg:colBg},
    {lbl:'Monto Prestado', val:fmtK(montoOriginal), sub:'Capital total otorgado', ico:'💵', color:col, bg:colBg},
    {lbl:'Cartera Vigente', val:fmtK(carteraActiva), sub:'Saldo al corriente', ico:'📈', color:'var(--blue)', bg:'var(--blue-bg)'},
    {lbl:'Cartera Vencida', val:fmtK(carteraVencida), sub: carteraVencida>0 ? `${((carteraVencida/carteraTotal)*100).toFixed(1)}% del total · ${numConVencidos} créditos` : 'Sin vencimientos', ico:'⚠️', color: carteraVencida>0?'var(--red)':'var(--green)', bg: carteraVencida>0?'var(--red-bg)':'var(--green-bg)'},
    {lbl:'Intereses Totales', val:fmtK(ganTotal), sub:'Sobre tabla de amortización', ico:'💰', color:'var(--purple)', bg:'var(--purple-bg)'},
  ];

  el.innerHTML = kpis.map(k=>`
    <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
        <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
      </div>
      <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
      <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
    </div>`).join('');
}

// ── Lista de créditos (cards) ──
function credRenderList(credits, entKey){
  const col = entKey==='end' ? '#00b875' : '#ff7043';
  const listEl = document.getElementById(entKey+'-cred-list');
  const countEl = document.getElementById(entKey+'-cred-count');
  if(!listEl) return;

  const sorted = [...credits].sort((a,b)=>{
    const da = a.disbDate||'9999', db = b.disbDate||'9999';
    return da < db ? -1 : da > db ? 1 : 0;
  });

  countEl.textContent = credits.length;

  if(!credits.length){
    listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
      <div style="font-size:2rem;margin-bottom:10px">📭</div>
      No hay créditos en cartera.<br>
      <span style="font-size:.72rem">Usa <strong>Cargar PDF</strong> para importar desde tabla de amortización.</span>
    </div>`;
    return;
  }

  const stStyle = {
    Activo:    {bg:'var(--green-bg)',   color:'var(--green)',  border:'var(--green-lt)'},
    Vencido:   {bg:'var(--red-bg)',     color:'var(--red)',    border:'var(--red-lt)'},
    Prospecto: {bg:'var(--yellow-bg)',  color:'var(--yellow)', border:'var(--yellow-lt)'},
    Pagado:    {bg:'var(--purple-bg)',  color:'var(--purple)', border:'var(--purple-lt)'},
  };

  listEl.innerHTML = sorted.map((c,i)=>{
    const st  = stStyle[c.st] || stStyle.Activo;
    const saldo = credSaldoActual(c);
    const intTot = credTotalIntereses(c);
    const pago  = credPagoFijo(c);
    const periodos = c.amort ? c.amort.length-1 : c.plazo;
    const cobr = credCobranzaResumen(c);
    const mPagado    = cobr ? cobr.montoPagado : 0;
    const mPendiente = cobr ? cobr.montoPendiente : 0;
    const mVencido   = cobr ? cobr.montoVencido : 0;

    return `<div onclick="credOpenDetail('${entKey}','${c.cl.replace(/'/g,"\\'")}',${credits.indexOf(c)})"
      style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">

      <!-- Avatar -->
      <div style="width:40px;height:40px;border-radius:12px;background:${st.bg};border:1px solid ${st.border};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
        ${c.st==='Activo'?'✅':c.st==='Vencido'?'⚠️':c.st==='Pagado'?'🏁':'🎯'}
      </div>

      <!-- Info principal -->
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span style="font-weight:700;font-size:.86rem">${c.cl}</span>
          <span style="font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:10px;background:${st.bg};color:${st.color};border:1px solid ${st.border}">${c.st}</span>
        </div>
        <div style="font-size:.7rem;color:var(--muted)">${c.tipo||'Simple'} · ${periodos} ${c.plazo<=24?'meses':'periodos'} · ${c.tasa}% anual${c.iva?` · IVA ${c.iva}%`:''}</div>
        ${c.disbDate?`<div style="font-size:.68rem;color:var(--muted);margin-top:1px">📅 Desembolso: ${c.disbDate}</div>`:''}
      </div>

      <!-- Montos -->
      <div style="text-align:right;flex-shrink:0;min-width:90px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:${col}">${fmtK(c.monto)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Monto original</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--blue)">${fmtK(saldo)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Saldo actual</div>
      </div>

      <!-- Cobranza columns -->
      <div style="text-align:right;flex-shrink:0;min-width:80px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--green)">${fmtK(mPagado)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Pagado</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:80px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--orange)">${fmtK(mPendiente)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Pendiente</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:80px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:${mVencido>0?'var(--red)':'var(--green)'}">${mVencido>0?fmtK(mVencido):'$0'}</div>
        <div style="font-size:.62rem;color:var(--muted)">Vencido</div>
      </div>

      <!-- Arrow -->
      <div style="color:var(--muted);font-size:1rem;flex-shrink:0">›</div>
    </div>`;
  }).join('');
}

// ── Modal de detalle con tabla de amortización ──
function credOpenDetail(entKey, nombre, idx){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  // Find by name (safer than index after sort)
  const realIdx = credits.findIndex(c => c.cl === nombre);
  const c = realIdx >= 0 ? credits[realIdx] : credits[idx];
  const resolvedIdx = realIdx >= 0 ? realIdx : idx;
  if(!c) return;

  const col    = entKey==='end' ? '#00b875' : '#ff7043';
  const label  = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
  const intTot = credTotalIntereses(c);
  const ivaTot = c.amort ? c.amort.slice(1).reduce((s,r)=>s+(r.ivaInt||0),0) : 0;
  const pagoTotal = credTotalPagos(c);

  let amortTable = '';
  if(c.amort && c.amort.length > 1){
    const rows = c.amort.map((r,i)=>{
      if(i===0) return `<tr style="background:var(--bg)">
        <td class="r" style="font-weight:600">0</td>
        <td>${r.fecha||'—'}</td>
        <td class="mo">—</td><td class="mo">—</td><td class="mo">—</td><td class="mo">—</td>
        <td class="mo bld" style="color:${col}">${fmtFull(r.saldo)}</td>
        <td style="text-align:center;color:var(--muted);font-size:.65rem">—</td>
      </tr>`;
      const isPaid = r.saldo <= 0.01;
      const st = credPeriodStatus(c, r);
      const pr = (c.pagos||[]).find(p=>p.periodo===r.periodo);
      let cobrCell = '';
      if(st==='PAGADO'){
        cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--green-bg);color:var(--green);font-weight:700">Pagado</span><br><span style="font-size:.58rem;color:var(--muted)">${pr.fecha} · ${fmtFull(pr.monto)}</span></td>`;
      } else if(st==='PARCIAL'){
        cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--orange-bg);color:var(--orange);font-weight:700">Parcial</span><br><span style="font-size:.58rem;color:var(--muted)">${fmtFull(pr.monto)} de ${fmtFull(r.pago)}</span><br>${!isViewer() ? `<button class="btn btn-out" style="font-size:.58rem;margin-top:2px;padding:1px 6px;height:auto" onclick="event.stopPropagation();credRegistrarPago('${entKey}',${resolvedIdx},${r.periodo})">+ Completar</button>` : ''}</td>`;
      } else if(st==='VENCIDO'){
        const dias = credDiasAtraso(r);
        cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--red-bg);color:var(--red);font-weight:700">Vencido ${dias}d</span><br>${!isViewer() ? `<button style="font-size:.58rem;margin-top:2px;padding:2px 8px;border-radius:6px;background:var(--red);color:#fff;border:none;cursor:pointer" onclick="event.stopPropagation();credRegistrarPago('${entKey}',${resolvedIdx},${r.periodo})">Registrar Pago</button>` : ''}</td>`;
      } else {
        cobrCell = !isViewer() ? `<td style="text-align:center"><button class="btn btn-out" style="font-size:.58rem;padding:2px 8px;height:auto" onclick="event.stopPropagation();credRegistrarPago('${entKey}',${resolvedIdx},${r.periodo})">Registrar Pago</button></td>` : '<td></td>';
      }
      return `<tr ${isPaid?'style="opacity:.6"':''}>
        <td class="r">${r.periodo}</td>
        <td style="font-size:.75rem">${r.fecha||'—'}</td>
        <td class="mo bld">${fmtFull(r.pago)}</td>
        <td class="mo pos">${fmtFull(r.capital)}</td>
        <td class="mo" style="color:var(--orange)">${fmtFull(r.int)}</td>
        <td class="mo" style="color:var(--muted);font-size:.72rem">${fmtFull(r.ivaInt)}</td>
        <td class="mo bld" style="color:${isPaid?'var(--green)':col}">${isPaid?'✅ Pagado':fmtFull(r.saldo)}</td>
        ${cobrCell}
      </tr>`;
    }).join('');
    const resumen = credCobranzaResumen(c);
    const resBadge = resumen ? `<span style="font-size:.6rem;padding:1px 6px;border-radius:6px;margin-left:6px;background:${resumen.vencido>0?'var(--red-bg)':'var(--green-bg)'};color:${resumen.vencido>0?'var(--red)':'var(--green)'};font-weight:600">${resumen.pagado}/${resumen.total} pagados</span>` : '';
    amortTable = `
      <div style="margin-top:16px">
        <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">📅 Tabla de Amortización ${resBadge}</div>
        <div id="cobr-form-container"></div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr>
              <th class="r">Periodo</th><th>Fecha</th>
              <th class="r">Pago Fijo</th><th class="r">Abono Capital</th>
              <th class="r">Intereses</th><th class="r">IVA Intereses</th>
              <th class="r">Saldo Capital</th>
              <th style="text-align:center;min-width:100px">Cobranza</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr style="background:var(--bg);font-weight:700">
              <td colspan="2" class="bld">TOTALES</td>
              <td class="mo bld">${fmtFull(pagoTotal)}</td>
              <td class="mo pos">${fmtFull(c.monto)}</td>
              <td class="mo" style="color:var(--orange)">${fmtFull(intTot)}</td>
              <td class="mo" style="color:var(--muted)">${fmtFull(ivaTot)}</td>
              <td class="mo bld" style="color:var(--green)">$0.00</td>
              <td></td>
            </tfoot>
          </table>
        </div>
      </div>`;
  }

  const html = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div style="width:44px;height:44px;border-radius:12px;background:${col}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem">🏦</div>
      <div style="flex:1">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${c.cl}</div>
        <div style="font-size:.72rem;color:var(--muted)">${label} · ${c.producto||c.tipo||'Crédito Simple'} · ${c.cat?'CAT '+c.cat+'%':''}</div>
      </div>
      <span style="font-size:.7rem;font-weight:700;padding:4px 12px;border-radius:12px;background:${c.st==='Activo'?'var(--green-bg)':c.st==='Vencido'?'var(--red-bg)':'var(--yellow-bg)'};color:${c.st==='Activo'?'var(--green)':c.st==='Vencido'?'var(--red)':'var(--yellow)'}">${c.st}</span>
    </div>

    <!-- KPIs del crédito -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Monto Original</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:${col}">${fmtFull(c.monto)}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Pago Fijo</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${credPagoFijo(c)?fmtFull(credPagoFijo(c)):'—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total a Pagar</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--blue)">${pagoTotal?fmtFull(pagoTotal):'—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total Intereses</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--purple)">${fmtFull(intTot)}</div>
      </div>
    </div>

    <!-- Datos del crédito -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Plazo</div>
        <div style="font-weight:600">${c.plazo} periodos (${c.vencimiento||'Años'})</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Tasa Anual</div>
        <div style="font-weight:600">${c.tasa}% · IVA ${c.iva||16}%</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Comisión apertura</div>
        <div style="font-weight:600">${c.com||0}% → ${fmtFull(credComApertura(c))}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">CAT</div>
        <div style="font-weight:600">${c.cat||c.tasa}%</div>
      </div>
      ${c.disbDate ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha desembolso</div><div style="font-weight:600">'+c.disbDate+'</div></div>' : ''}
      ${c.fechaElab ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha elaboración</div><div style="font-weight:600">'+c.fechaElab+'</div></div>' : ''}
    </div>
    ${amortTable}
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
      <button id="cred-del-btn" data-ent="${entKey}" data-idx="${resolvedIdx}"
        style="background:var(--red-bg);color:var(--red);border:1px solid var(--red-lt);border-radius:var(--r);padding:7px 16px;cursor:pointer;font-size:.78rem;font-weight:600"
        onmouseover="this.style.background='var(--red)';this.style.color='#fff'"
        onmouseout="this.style.background='var(--red-bg)';this.style.color='var(--red)'">
        🗑 Eliminar crédito
      </button>
    </div>`;

  openModal(null, `🏦 Detalle — ${c.cl}`, html);
}

// ── Registro de pagos ──
function credRegistrarPago(entKey, creditIdx, periodo){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  const c = credits[creditIdx];
  if(!c) return;
  const amortRow = c.amort ? c.amort.find(r=>r.periodo===periodo) : null;
  if(!amortRow) return;

  const formId = 'cobr-form-'+periodo;
  const existing = document.getElementById(formId);
  if(existing){ existing.remove(); return; }

  // Remove any other open form
  document.querySelectorAll('[id^="cobr-form-"]').forEach(el=>el.remove());

  const defaultFecha = new Date().toISOString().split('T')[0];
  const existingPago = (c.pagos||[]).find(p=>p.periodo===periodo);
  const defaultMonto = existingPago ? existingPago.monto : (amortRow.pago||0);

  const formHtml = `
    <div id="${formId}" style="background:var(--blue-bg);border:1px solid var(--blue);border-radius:10px;padding:14px 18px;margin:12px 0;animation:fadeIn .2s">
      <div style="font-size:.75rem;font-weight:700;color:var(--blue);margin-bottom:10px">
        💰 Registrar Pago — Periodo ${periodo} · Vence: ${amortRow.fecha||'—'} · Monto esperado: ${fmtFull(amortRow.pago)}
      </div>
      <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <label style="font-size:.65rem;color:var(--muted);display:block;margin-bottom:3px">Fecha del pago</label>
          <input id="cobr-fecha-${periodo}" type="date" value="${defaultFecha}"
            style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;font-family:'Figtree',sans-serif;background:var(--white);color:var(--text)">
        </div>
        <div style="flex:1;min-width:140px">
          <label style="font-size:.65rem;color:var(--muted);display:block;margin-bottom:3px">Monto pagado</label>
          <input id="cobr-monto-${periodo}" type="number" step="0.01" value="${defaultMonto}"
            style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;font-family:'Figtree',sans-serif;background:var(--white);color:var(--text)">
        </div>
        <button style="padding:7px 18px;border-radius:8px;background:var(--green);color:#fff;border:none;cursor:pointer;font-size:.72rem;font-weight:600;font-family:'Figtree',sans-serif"
          onclick="credGuardarPago('${entKey}',${creditIdx},${periodo})">
          Guardar
        </button>
        <button style="padding:7px 14px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:.72rem;font-family:'Figtree',sans-serif"
          onclick="document.getElementById('${formId}').remove()">
          Cancelar
        </button>
      </div>
      ${existingPago ? `<div style="font-size:.62rem;color:var(--muted);margin-top:6px">⚠️ Pago existente: ${existingPago.fecha} por ${fmtFull(existingPago.monto)} — se reemplazará</div>` : ''}
    </div>`;

  const container = document.getElementById('cobr-form-container');
  if(container){ container.innerHTML = formHtml; }
  else {
    // Fallback: insert before table
    const tbl = document.querySelector('#modal-body .bt');
    if(tbl) tbl.closest('div').insertAdjacentHTML('beforebegin', formHtml);
  }
}

function credGuardarPago(entKey, creditIdx, periodo){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  const c = credits[creditIdx];
  if(!c) return;

  const fechaEl = document.getElementById('cobr-fecha-'+periodo);
  const montoEl = document.getElementById('cobr-monto-'+periodo);
  if(!fechaEl||!montoEl) return;

  const fechaISO = fechaEl.value;
  const monto = parseFloat(montoEl.value);
  if(!fechaISO||isNaN(monto)||monto<=0){ toast('Ingresa fecha y monto válidos'); return; }

  const [y,m,d] = fechaISO.split('-');
  const fechaDDMMYYYY = `${d}/${m}/${y}`;

  if(!c.pagos) c.pagos = [];
  const idx = c.pagos.findIndex(p=>p.periodo===periodo);
  if(idx>=0) c.pagos[idx] = { periodo, fecha:fechaDDMMYYYY, monto };
  else c.pagos.push({ periodo, fecha:fechaDDMMYYYY, monto });

  DB.set('gf_cred_'+entKey, credits);
  credOpenDetail(entKey, c.cl, creditIdx);
  toast('✅ Pago registrado — Periodo '+periodo);
}

function credClearAll(entKey){
  const label = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
  customConfirm('¿Limpiar toda la cartera de '+label+'? Esta acción no se puede deshacer.', 'Limpiar', (ok)=>{
    if(!ok) return;
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    credits.length = 0;
    DB.remove('gf_cred_'+entKey);
    DB.remove('gf_cc_hist');
    entKey==='end' ? rEndCred() : rDynCred();
    fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
    toast('🗑 Cartera de '+label+' limpiada');
  });
}

function credDelete(entKey, idx){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  const name = (credits[idx] && credits[idx].cl) ? credits[idx].cl : 'este crédito';
  customConfirm('¿Eliminar "' + name + '"?', 'Eliminar', (ok)=>{
    if(!ok) return;
    credits.splice(idx, 1);
    DB.set('gf_cred_' + entKey, credits);
    closeModal();
    if(entKey==='end') rEndCred(); else rDynCred();
    toast('🗑 ' + name + ' eliminado');
  });
}

function credAddRow(entKey){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  credits.push({cl:'Nuevo Crédito',monto:0,plazo:12,tasa:0,com:0,tipo:'Simple',garantia:'',destino:'',st:'Prospecto',disbDate:'',amort:[]});
  entKey==='end' ? rEndCred() : rDynCred();
}

function credDelRow(entKey, ci){
  if(false) return; // confirm handled via customConfirm elsewhere
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  credits.splice(ci,1);
  entKey==='end' ? rEndCred() : rDynCred();
  fiInjectCredits(); rPL(entKey); rPLCharts(entKey);
}

function rEndCred(){
  try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  credRenderDashKPIs(END_CREDITS,'end');
  credRenderList(END_CREDITS,'end');
}
function rDynCred(){
  try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}
  credRenderDashKPIs(DYN_CREDITS,'dyn');
  credRenderList(DYN_CREDITS,'dyn');
  syncDynResKPIs();
}

// ══════════════════════════════════════
// COBRANZA — SEGUIMIENTO DE PAGOS
// ══════════════════════════════════════
function rCredCobr(entFilter, elPrefix){
  if(!elPrefix) elPrefix = 'cobr';

  // Reload data
  try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}

  let all = [];
  if(!entFilter || entFilter==='end') all.push(...END_CREDITS.map(c=>({...c, _ent:'end', _entLabel:'Endless Money', _col:'#00b875'})));
  if(!entFilter || entFilter==='dyn') all.push(...DYN_CREDITS.map(c=>({...c, _ent:'dyn', _entLabel:'Dynamo Finance', _col:'#ff7043'})));
  all = all.filter(c=>c.st==='Activo'||c.st==='Vencido');

  // Aggregate
  let totalPorCobrar=0, cobranzaAlDia=0, cobranzaVencida=0;
  let totalPeriodos=0, periodosPagados=0;
  const clientData = [];

  all.forEach(c=>{
    const res = credCobranzaResumen(c);
    if(!res) return;
    const pendienteMonto = (c.amort||[]).slice(1)
      .filter(r=>credPeriodStatus(c,r)==='PENDIENTE')
      .reduce((s,r)=>s+(r.pago||0),0);
    totalPorCobrar += res.montoVencido + pendienteMonto;
    cobranzaAlDia += res.montoPagado;
    cobranzaVencida += res.montoVencido;
    totalPeriodos += res.total;
    periodosPagados += res.pagado;

    const prox = credProximoPago(c);
    clientData.push({
      ...c, _resumen:res, _prox:prox,
      _diasAtraso: res.maxAtraso,
      _statusLabel: res.vencido>0?'Vencido' : res.parcial>0?'Parcial' : res.pagado===res.total?'Pagado' : 'Al día'
    });
  });

  const cumplimiento = totalPeriodos>0 ? ((periodosPagados/totalPeriodos)*100).toFixed(1) : '0';

  _cobrKPIs(totalPorCobrar, cobranzaAlDia, cobranzaVencida, cumplimiento, elPrefix);
  _cobrCharts(clientData, elPrefix);
  _cobrRenderList(clientData, elPrefix);
}

function _cobrKPIs(totalPorCobrar, alDia, vencida, cumplimiento, elPrefix){
  if(!elPrefix) elPrefix = 'cobr';
  const el = document.getElementById(elPrefix+'-kpis');
  if(!el) return;
  const _c = k => `
    <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px;border-top:3px solid ${k.color}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
        <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
      </div>
      <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
      <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
    </div>`;
  const pct = parseFloat(cumplimiento);
  el.innerHTML = [
    { lbl:'Total por Cobrar', val:fmtK(totalPorCobrar), sub:'Pendiente + Vencido', ico:'💰', color:'#0073ea', bg:'var(--blue-bg)' },
    { lbl:'Cobranza al Día', val:fmtK(alDia), sub:'Pagos recibidos', ico:'✅', color:'var(--green)', bg:'var(--green-bg)' },
    { lbl:'Cobranza Vencida', val:fmtK(vencida), sub:vencida>0?'Requiere atención':'Sin vencidos', ico:'🚨', color:vencida>0?'var(--red)':'var(--green)', bg:vencida>0?'var(--red-bg)':'var(--green-bg)' },
    { lbl:'% Cumplimiento', val:cumplimiento+'%', sub:'Periodos pagados vs total', ico:'📊', color:pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--red)', bg:pct>=80?'var(--green-bg)':pct>=50?'var(--orange-bg)':'var(--red-bg)' }
  ].map(_c).join('');
}

function _cobrCharts(clientData, elPrefix){
  if(!elPrefix) elPrefix = 'cobr';
  const totalPagado = clientData.reduce((s,c)=>s+(c._resumen?.pagado||0),0);
  const totalParcial = clientData.reduce((s,c)=>s+(c._resumen?.parcial||0),0);
  const totalVencido = clientData.reduce((s,c)=>s+(c._resumen?.vencido||0),0);
  const totalPendiente = clientData.reduce((s,c)=>s+(c._resumen?.pendiente||0),0);

  const _ck1 = elPrefix+'-st';
  const _ck2 = elPrefix+'-venc';
  dc(_ck1);
  const _cs = document.getElementById('c-'+elPrefix+'-status');
  if(!_cs) return;
  CH[_ck1] = new Chart(_cs,{
    type:'bar',
    data:{
      labels:['Pagados','Parciales','Vencidos','Pendientes'],
      datasets:[{
        data:[totalPagado,totalParcial,totalVencido,totalPendiente],
        backgroundColor:['rgba(0,184,117,.22)','rgba(255,160,0,.22)','rgba(234,57,67,.22)','rgba(0,115,234,.22)'],
        borderColor:['#00b875','#ffa000','#ea3943','#0073ea'],
        borderWidth:1.5, borderRadius:4
      }]
    },
    options:{...cOpts(), indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw+' periodos'}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{stepSize:1,color:'#b0b4d0',font:{size:9}}},
        y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}
      }
    }
  });

  const vencidos = clientData
    .filter(c=>c._resumen&&c._resumen.montoVencido>0)
    .sort((a,b)=>b._resumen.montoVencido-a._resumen.montoVencido)
    .slice(0,5);

  dc(_ck2);
  const _cv = document.getElementById('c-'+elPrefix+'-vencida');
  if(!_cv) return;
  CH[_ck2] = new Chart(_cv,{
    type:'bar',
    data:{
      labels:vencidos.length>0 ? vencidos.map(c=>c.cl) : ['Sin vencidos'],
      datasets:[{
        data:vencidos.length>0 ? vencidos.map(c=>c._resumen.montoVencido) : [0],
        backgroundColor:'rgba(234,57,67,.22)',
        borderColor:'#ea3943',
        borderWidth:1.5, borderRadius:4
      }]
    },
    options:{...cOpts(), indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmtFull(ctx.raw)}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>fmtK(v)}},
        y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}
      }
    }
  });
}

function _cobrRenderList(clientData, elPrefix){
  if(!elPrefix) elPrefix = 'cobr';
  const listEl = document.getElementById(elPrefix+'-list');
  const countEl = document.getElementById(elPrefix+'-count');
  if(!listEl) return;
  if(countEl) countEl.textContent = clientData.length;

  if(!clientData.length){
    listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
      <div style="font-size:2rem;margin-bottom:10px">✅</div>
      No hay créditos activos para seguimiento de cobranza.
    </div>`;
    return;
  }

  const sorted = [...clientData].sort((a,b)=>{
    if(a._statusLabel==='Vencido'&&b._statusLabel!=='Vencido') return -1;
    if(b._statusLabel==='Vencido'&&a._statusLabel!=='Vencido') return 1;
    return (b._diasAtraso||0)-(a._diasAtraso||0);
  });

  const stIco = {'Vencido':'🚨','Parcial':'⚠️','Al día':'✅','Pagado':'🏁'};
  const stBg  = {'Vencido':'var(--red-bg)','Parcial':'var(--orange-bg)','Al día':'var(--green-bg)','Pagado':'var(--purple-bg)'};
  const stCol = {'Vencido':'var(--red)','Parcial':'var(--orange)','Al día':'var(--green)','Pagado':'var(--purple)'};

  listEl.innerHTML = sorted.map(c=>{
    const credits = c._ent==='end' ? END_CREDITS : DYN_CREDITS;
    const origIdx = credits.findIndex(x=>x.cl===c.cl);
    const proxFecha = c._prox ? c._prox.fecha : '—';
    const proxMonto = c._prox ? fmtFull(c._prox.pago) : '—';
    const sl = c._statusLabel;

    return `<div class="cobr-row" data-name="${(c.cl||'').toLowerCase()}"
      onclick="credOpenDetail('${c._ent}','${(c.cl||'').replace(/'/g,"\\'")}',${origIdx})"
      style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <div style="width:36px;height:36px;border-radius:10px;background:${stBg[sl]||'var(--bg)'};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${stIco[sl]||'📋'}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span style="font-weight:700;font-size:.82rem">${c.cl}</span>
          <span style="font-size:.56rem;font-weight:700;padding:1px 5px;border-radius:6px;background:${c._col}18;color:${c._col};border:1px solid ${c._col}35">${c._entLabel}</span>
        </div>
        <div style="font-size:.68rem;color:var(--muted)">${c._resumen.pagado}/${c._resumen.total} periodos pagados</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:100px">
        <div style="font-size:.78rem;font-weight:600">${proxFecha}</div>
        <div style="font-size:.62rem;color:var(--muted)">Próximo Pago</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem">${proxMonto}</div>
        <div style="font-size:.62rem;color:var(--muted)">Monto</div>
      </div>
      <div style="text-align:center;flex-shrink:0;min-width:80px">
        <span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:10px;background:${stBg[sl]||'var(--bg)'};color:${stCol[sl]||'var(--text)'}">${sl}</span>
        ${c._diasAtraso>0 ? `<div style="font-size:.6rem;color:var(--red);margin-top:2px;font-weight:600">${c._diasAtraso} días</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:85px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:${c._resumen.montoVencido>0?'var(--red)':'var(--green)'}">${fmtK(c._resumen.montoVencido)}</div>
        <div style="font-size:.62rem;color:var(--muted)">Vencido</div>
      </div>
      <div style="color:var(--muted);font-size:.9rem;flex-shrink:0">›</div>
    </div>`;
  }).join('');
}

function cobrFilter(q){
  const query = q.toLowerCase();
  document.querySelectorAll('#cobr-list .cobr-row').forEach(r=>{
    r.style.display = r.dataset.name.includes(query) ? '' : 'none';
  });
}
function dynCobrFilter(q){
  const query = q.toLowerCase();
  document.querySelectorAll('#dyn-cobr-list .cobr-row').forEach(r=>{
    r.style.display = r.dataset.name.includes(query) ? '' : 'none';
  });
}

// RENDER: WIREBIT INGRESOS
// ═══════════════════════════════════════
function rWBIng(){
  // ── KPIs ──
  const totalAnual = sum(WB_ING_TOTAL);
  const kTotal = document.getElementById('wb-ing-kpi-total');
  const kStart = document.getElementById('wb-ing-kpi-start');
  const kEnd = document.getElementById('wb-ing-kpi-end');
  const kGrowth = document.getElementById('wb-ing-kpi-growth');
  if (totalAnual > 0) {
    kTotal.textContent = fmt(totalAnual);
    kTotal.style.color = 'var(--purple)';
    kTotal.style.fontSize = '';
    document.getElementById('wb-ing-kpi-total-sub').textContent = 'Ingresos acumulados 2026';

    const ene = WB_ING_TOTAL[0];
    kStart.textContent = ene ? fmt(ene) : '—';
    kStart.style.color = ene ? 'var(--green)' : 'var(--muted)';
    kStart.style.fontSize = '';
    document.getElementById('wb-ing-kpi-start-sub').textContent = 'Enero 2026';

    // Find last month with data
    let lastIdx = 11;
    while (lastIdx > 0 && !WB_ING_TOTAL[lastIdx]) lastIdx--;
    const lastVal = WB_ING_TOTAL[lastIdx];
    kEnd.textContent = lastVal ? fmt(lastVal) : '—';
    kEnd.style.color = lastVal ? '#0073ea' : 'var(--muted)';
    kEnd.style.fontSize = '';
    document.getElementById('wb-ing-kpi-end-sub').textContent = MO[lastIdx] + ' 2026';

    // Avg monthly growth (months with data)
    const months = WB_ING_TOTAL.filter(v => v > 0);
    if (months.length >= 2) {
      let growths = 0, cnt = 0;
      for (let i = 1; i < 12; i++) {
        if (WB_ING_TOTAL[i] > 0 && WB_ING_TOTAL[i - 1] > 0) {
          growths += (WB_ING_TOTAL[i] - WB_ING_TOTAL[i - 1]) / WB_ING_TOTAL[i - 1];
          cnt++;
        }
      }
      const avgGrowth = cnt ? (growths / cnt * 100) : 0;
      kGrowth.textContent = (avgGrowth >= 0 ? '+' : '') + avgGrowth.toFixed(1) + '%';
      kGrowth.style.color = avgGrowth >= 0 ? 'var(--orange)' : '#eb5757';
      kGrowth.style.fontSize = '';
      document.getElementById('wb-ing-kpi-growth-sub').textContent = 'Crecimiento mensual promedio';
    }
  }

  const colors=['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'];
  dc('cwbi2');
  CH['cwbi2']=new Chart(document.getElementById('c-wb-ing2'),{type:'bar',data:{labels:MO,
    datasets:Object.entries(WB_ING).map(([k,v],i)=>({label:k,data:v,backgroundColor:colors[i]+'33',borderColor:colors[i],borderWidth:1.5}))
  },options:cOpts({scales:{x:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+Math.abs(v/1000).toFixed(0)+'K'}}}})});

  const annual=Object.entries(WB_ING).map(([k,v])=>[k,sum(v)]);
  dc('cwbm');
  CH['cwbm']=new Chart(document.getElementById('c-wb-mix'),{type:'doughnut',data:{
    labels:annual.map(x=>x[0]),
    datasets:[{data:annual.map(x=>x[1]),backgroundColor:colors.map(c=>c+'33'),borderColor:colors,borderWidth:2}]
  },options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:10}}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${(ctx.raw/sum(WB_ING_TOTAL)*100).toFixed(1)}%)`}}},cutout:'65%',scales:{x:{display:false},y:{display:false}}}});

  const thead=document.getElementById('wb-ing-thead');
  const tbody=document.getElementById('wb-ing-tbody');
  thead.innerHTML=`<th>Fuente de Ingreso</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total 2026</th>`;

  const rows=[
    ...Object.entries(WB_ING).map(([k,v])=>({l:k,vals:v,t:'ing'})),
    {l:'TOTAL INGRESOS',vals:WB_ING_TOTAL,t:'total',bold:true},
    {l:'— COSTOS DIRECTOS —',hdr:true},
    ...Object.entries(WB_COSTOS).map(([k,v])=>({l:k,vals:v,t:'gasto'})),
    {l:'TOTAL COSTOS DIRECTOS',vals:WB_COSTO_TOTAL,t:'total',bold:true},
    {l:'MARGEN BRUTO',vals:WB_MARGEN,t:'util',bold:true},
    {l:'Nómina',vals:WB_NOM_TOTAL,t:'gasto'},
    {l:'RESULTADO OPERATIVO',vals:WB_MARGEN.map((v,i)=>v-WB_NOM_TOTAL[i]),t:'util',bold:true},
  ];
  tbody.innerHTML=rows.map(r=>{
    if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
    const tot=sum(r.vals);
    const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
    return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map(v=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'—'}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}</td></tr>`;
  }).join('');
}

// ═══════════════════════════════════════

// FILE UPLOAD
// ═══════════════════════════════════════
// FILE UPLOAD

function loadFile(ev){
  const f=ev.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      S.excelData={};
      wb.SheetNames.forEach(n=>{ S.excelData[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''}); });
      const lu=document.getElementById('lu');
      lu.style.display='inline';
      lu.innerHTML=`✅ <b>${f.name}</b>`;
      toast('✅ Excel cargado: '+f.name+' ('+wb.SheetNames.length+' hojas)');
      render(document.querySelector('.view.active').id.replace('view-',''));
    }catch(err){toast('❌ '+err.message);}
  };
  r.readAsArrayBuffer(f); ev.target.value='';
}


// ── Sidebar & Menu system (accordion single-column) ──
let _activeMenu = null;   // current open menu

// Mapa de vistas default por sección
const _MENU_DEFAULTS = {
  grupo_menu:'resumen', salem:'tpv_general',
  endless:'cred_dash', dynamo:'dyn_dash',
  wirebit:'wb_cripto', config:'cfg_usuarios'
};

function openMenu(menuId, el, viewOverride){
  const sub = document.getElementById('sub-' + menuId);

  // Mismo menú → toggle accordion
  if(_activeMenu === menuId){
    if(sub) sub.classList.remove('open');
    el.classList.remove('active');
    _activeMenu = null;
    return;
  }

  // Cerrar menú anterior
  if(_activeMenu){
    const prevSub = document.getElementById('sub-' + _activeMenu);
    if(prevSub) prevSub.classList.remove('open');
    document.querySelectorAll('.mi').forEach(m => m.classList.remove('active'));
  }

  // Abrir el nuevo
  el.classList.add('active');
  if(sub) sub.classList.add('open');
  _activeMenu = menuId;

  // Navegar a la vista (override o default)
  sv(viewOverride || _MENU_DEFAULTS[menuId], null);
}

function closeSubMenu(){
  if(_activeMenu){
    const sub = document.getElementById('sub-' + _activeMenu);
    if(sub) sub.classList.remove('open');
    document.querySelectorAll('.mi').forEach(m => m.classList.remove('active'));
    _activeMenu = null;
  }
}

function toggleSidebar(){
  const shell = document.getElementById('sb-shell');
  const main  = document.getElementById('main');
  const collapsed = shell.classList.toggle('collapsed');
  main.classList.toggle('sb-hidden', collapsed);
  updateToggleBtn();
  setTimeout(resizeCharts, 250);
}

function updateToggleBtn(){
  const btn = document.getElementById('sb-toggle');
  const collapsed = document.getElementById('sb-shell').classList.contains('collapsed');
  btn.style.left = collapsed ? '8px' : '248px';
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Mostrar menú' : 'Ocultar menú';
}

function resizeCharts(){
  Object.values(CH).forEach(c=>{ try{c.resize();}catch(e){} });
}

// ═══════════════════════════════════════

// CARGA DE CRÉDITOS DESDE PDF
// ═══════════════════════════════════════
let CC_PREVIEW = [];   // créditos extraídos pendientes de importar
let CC_HISTORY = [];   // historial de cargas

function ccLoad(){
  try{ CC_HISTORY = DB.get('gf_cc_hist') || []; }catch(e){ CC_HISTORY=[]; }
}

function rCargaCreditos(){
  ccLoad();
  ccRenderHistory();
}

function ccHandleDrop(e){
  e.preventDefault();
  const dz = document.getElementById('cc-dropzone');
  dz.style.borderColor = 'var(--border2)';
  dz.style.background  = 'var(--bg)';
  const file = e.dataTransfer.files[0];
  if(file && file.type === 'application/pdf') ccLoadFile(file);
  else toast('⚠️ Solo se aceptan archivos PDF');
}

function ccLoadFile(file){
  if(!file) return;
  ccSetStatus('loading', `📖 Leyendo "${file.name}"…`);
  document.getElementById('cc-preview-wrap').style.display = 'none';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    ccSetStatus('loading', '🤖 Analizando tabla de créditos con IA…');
    try {
      await ccAnalyzeWithClaude(base64, file.name);
    } catch(err) {
      ccSetStatus('error', '❌ Error al procesar: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

async function ccAnalyzeWithClaude(base64pdf, filename){
  const empresa = document.getElementById('cc-empresa').value;
  ccSetStatus('loading', '📖 Extrayendo texto del PDF…');

  // Extract text using PDF.js
  const pdfData = atob(base64pdf);
  const pdfBytes = new Uint8Array(pdfData.length);
  for(let i=0;i<pdfData.length;i++) pdfBytes[i]=pdfData.charCodeAt(i);

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdfDoc = await pdfjsLib.getDocument({data: pdfBytes}).promise;
  let fullText = '';
  for(let p=1; p<=pdfDoc.numPages; p++){
    const page = await pdfDoc.getPage(p);
    const tc   = await page.getTextContent();
    fullText += tc.items.map(i=>i.str).join(' ') + '\n';
  }

  ccSetStatus('loading', '🔍 Analizando tabla de amortización…');

  const credito = ccParseCentumPDF(fullText, filename);
  if(!credito) throw new Error('No se pudo leer la tabla. Verifica que sea un PDF de Centum Capital en formato estándar.');

  CC_PREVIEW = [credito];
  ccSetStatus('ok', `✅ Crédito de <strong>${credito.cl}</strong> extraído de "${filename}"`);
  try { ccRenderPreview(empresa, null); } catch(e){ console.error('Preview error:',e); }
}

function ccParseCentumPDF(text, filename){
  const t = text.replace(/\s+/g,' ');
  const get = (re) => { const m=t.match(re); return m?m[1].trim():null; };

  const nombre   = get(/Solicitante\s*:\s*([A-Za-záéíóúÁÉÍÓÚüÜñÑ ]+?)(?:\s{2,}|Crédito|$)/i);
  const monto    = get(/Crédito solicitado[^$]*\$\s*([\d,]+\.?\d*)/i);
  const pagoFijoM = t.match(/Pago fijo[\s\S]*?\$[\s\d,.]+?\$\s*([\d,]+\.?\d*)/i);
  const pagoFijo = pagoFijoM ? pagoFijoM[1] : null;
  const producto = get(/Producto financiero\s*:\s*([^\n]+?)(?:\s{2,}|Vencimiento)/i);
  const venc     = get(/Vencimiento:\s*([^\s]+(?:\s+[^\s]+)??)(?=\s{2,}|\s*Plazo)/i);
  const plazo    = get(/Plazo:\s*(\d+)/i);
  const tasa     = get(/Tasa:\s*([\d.]+)\s*%/i);
  const iva      = get(/IVA\s*:\s*([\d.]+)\s*%/i);
  const com      = get(/Comisión\s*:\s*([\d.]+)\s*%/i);
  const cat      = get(/CAT\s*:\s*([\d.]+)\s*%/i);
  const fechaElab= get(/Fecha de elaboración:\s*([^\n]+?)(?:\s{2,}|Solicitante)/i);

  const parseMXN = s => s ? parseFloat(s.replace(/,/g,'')) : 0;

  // Split into rows by detecting "N  DD/..." pattern, extract $ amounts per row
  const amort = [];
  const rowSplitRe = /\b(\d{1,3})\s+([\d]{1,2}\/[\d]{2,4}\/?\d{0,4}|[\d]{1,2}\/[A-Za-z]+\/\d{4})([\s\S]*?)(?=\b\d{1,3}\s+[\d]{1,2}\/|Total:|La presente|$)/g;
  let m;
  while((m=rowSplitRe.exec(t))!==null){
    const periodo = parseInt(m[1]);
    if(periodo > 200) continue;
    const rowText = m[3];
    const amounts = [...rowText.matchAll(/\$\s*([\d,]+\.?\d*)/g)].map(a=>parseMXN(a[1]));
    if(amounts.length < 2) continue;
    amort.push({
      periodo,
      fecha:   m[2],
      pago:    amounts[0],             // 1st $ = pago fijo
      capital: amounts[1],             // 2nd $ = abono capital
      int:     amounts[2]||0,          // 3rd $ = intereses
      ivaInt:  amounts[3]||0,          // 4th $ = IVA intereses
      saldo:   amounts[amounts.length-1], // last $ = saldo a capital
    });
  }

  console.log('PDF parsed - nombre:', nombre, 'amort rows:', amort.length, amort);

  if(!nombre || amort.length < 1) return null;

  return {
    cl:         nombre,
    monto:      parseMXN(monto),
    plazo:      parseInt(plazo)||0,
    vencimiento:venc||'Años',
    tasa:       parseFloat(tasa)||0,
    iva:        parseFloat(iva)||16,
    com:        parseFloat(com)||0,
    cat:        parseFloat(cat)||0,
    tipo:       'Simple',
    producto:   producto||'Centum Simple',
    pagoFijo:   parseMXN(pagoFijo),
    st:         'Activo',
    disbDate:   amort.length>0 ? amort[0].fecha : '',
    fechaElab:  fechaElab||'',
    amort,
  };
}

function ccRenderPreview(empresa, notas){
  const wrap   = document.getElementById('cc-preview-wrap');
  const thead  = document.getElementById('cc-preview-thead');
  const tbody  = document.getElementById('cc-preview-tbody');
  const title  = document.getElementById('cc-preview-title');
  const notesEl= document.getElementById('cc-preview-notes');
  const empresaLabel = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';

  title.textContent = `${creditos_count()} créditos extraídos — ${empresaLabel}`;

  thead.innerHTML = '<th>Cliente</th><th class="r">Monto</th><th class="r">Plazo</th><th class="r">Tasa</th><th class="r">Comisión</th><th>Tipo</th><th>Destino</th><th>Status</th><th class="r">Fecha</th>';

  const stColor = {Activo:'var(--green)',Prospecto:'var(--yellow)',Vencido:'var(--red)',Pagado:'var(--purple)'};
  tbody.innerHTML = CC_PREVIEW.map((c,i) => `
    <tr>
      <td style="font-weight:600">${c.cl||'—'}</td>
      <td class="mo pos">${fmtFull(c.monto)}</td>
      <td class="r">${c.plazo} meses</td>
      <td class="r">${c.tasa}%</td>
      <td class="r">${c.com?c.com+'%':'—'}</td>
      <td style="font-size:.75rem">${c.tipo||'Simple'}</td>
      <td style="font-size:.75rem;color:var(--muted)">${c.destino||'—'}</td>
      <td><span style="font-size:.68rem;font-weight:700;color:${stColor[c.st]||'var(--muted)'}">${c.st}</span></td>
      <td class="r" style="font-size:.72rem;color:var(--muted)">${c.disbDate||'—'}</td>
    </tr>`).join('');

  if(notas) notesEl.innerHTML = `<strong>Notas del análisis:</strong> ${notas}`;
  else notesEl.innerHTML = '';

  wrap.style.display = 'block';
  wrap.scrollIntoView({behavior:'smooth'});
}

function creditos_count(){ return CC_PREVIEW.length; }

function ccImport(){
  if(!CC_PREVIEW.length){ toast('⚠️ No hay créditos para importar'); return; }
  const empresa = document.getElementById('cc-empresa').value;

  if(empresa === 'endless'){
    // Merge: keep existing non-auto credits, add new ones (avoid duplicates by cl name)
    const existingNames = END_CREDITS.map(c=>c.cl.toLowerCase());
    const newOnes = CC_PREVIEW.filter(c => !existingNames.includes(c.cl.toLowerCase()));
    const updated = CC_PREVIEW.map(c => {
      const idx = END_CREDITS.findIndex(x=>x.cl.toLowerCase()===c.cl.toLowerCase());
      return idx>=0 ? {...END_CREDITS[idx], ...c} : c;
    });
    // Add any existing ones not in the new list
    END_CREDITS.forEach(c => {
      if(!updated.find(x=>x.cl.toLowerCase()===c.cl.toLowerCase())) updated.push(c);
    });
    END_CREDITS.length = 0;
    updated.forEach(c => END_CREDITS.push(c));
    DB.set('gf_cred_end', END_CREDITS);
  } else {
    const updated = CC_PREVIEW.map(c => {
      const idx = DYN_CREDITS.findIndex(x=>x.cl.toLowerCase()===c.cl.toLowerCase());
      return idx>=0 ? {...DYN_CREDITS[idx], ...c} : c;
    });
    DYN_CREDITS.forEach(c => {
      if(!updated.find(x=>x.cl.toLowerCase()===c.cl.toLowerCase())) updated.push(c);
    });
    DYN_CREDITS.length = 0;
    updated.forEach(c => DYN_CREDITS.push(c));
    DB.set('gf_cred_dyn', DYN_CREDITS);
  }

  // Log to history
  ccLoad();
  CC_HISTORY.unshift({
    date: new Date().toLocaleString('es-MX'),
    empresa: empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance',
    count: CC_PREVIEW.length,
    names: CC_PREVIEW.map(c=>c.cl).join(', ')
  });
  DB.set('gf_cc_hist', CC_HISTORY.slice(0,20));

  // Sync flows
  fiInjectTPV();
  fiInjectCredits();
  syncFlujoToRecs();

  const n = CC_PREVIEW.length;
  const label = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';
  CC_PREVIEW = [];
  ccClearPreview();
  ccRenderHistory();
  toast(`✅ ${n} crédito${n!==1?'s':''} importado${n!==1?'s':''} a ${label}`);

}

function ccClearPreview(){
  CC_PREVIEW = [];
  document.getElementById('cc-preview-wrap').style.display = 'none';
  document.getElementById('cc-status').style.display = 'none';
  document.getElementById('cc-file-input').value = '';
}

function ccSetStatus(type, html){
  const el = document.getElementById('cc-status');
  const colors = {
    loading: {bg:'var(--blue-bg)',  border:'var(--blue-lt)',  color:'var(--blue)'},
    ok:      {bg:'var(--green-bg)', border:'var(--green-lt)', color:'var(--green)'},
    error:   {bg:'var(--red-bg)',   border:'var(--red-lt)',   color:'var(--red)'},
  };
  const c = colors[type] || colors.loading;
  el.style.cssText = `display:block;padding:10px 14px;border-radius:var(--r);background:${c.bg};border:1px solid ${c.border};color:${c.color};font-size:.8rem`;
  el.innerHTML = html;
}

function ccRenderHistory(){
  ccLoad();
  const el = document.getElementById('cc-history');
  if(!el) return;
  if(!CC_HISTORY.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:.78rem">Sin cargas registradas</div>';
    return;
  }
  el.innerHTML = CC_HISTORY.map((h,i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);font-size:.78rem">
      <span style="color:var(--muted);min-width:140px;flex-shrink:0">${h.date}</span>
      <span style="font-weight:600;color:var(--blue);flex-shrink:0">${h.empresa}</span>
      <span style="color:var(--green);font-weight:600;flex-shrink:0">${h.count} crédito${h.count!==1?'s':''}</span>
      <span style="color:var(--muted);font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${h.names}</span>
    </div>`).join('');
}


function syncDynResKPIs(){
  const activos    = DYN_CREDITS.filter(c=>c.st==='Activo');
  const vencidos   = DYN_CREDITS.filter(c=>c.st==='Vencido');
  const prospectos = DYN_CREDITS.filter(c=>c.st==='Prospecto');
  const carteraTotal   = DYN_CREDITS.reduce((s,c)=>s+(c.monto||0),0);
  const carteraVencida = vencidos.reduce((s,c)=>s+(c.monto||0),0);
  const pipeline       = prospectos.reduce((s,c)=>s+(c.monto||0),0);
  const pct = carteraTotal>0 ? ((carteraVencida/carteraTotal)*100).toFixed(1) : 0;
  const q = id => document.getElementById(id);
  if(q('dyn-kpi-cartera'))    q('dyn-kpi-cartera').textContent    = fmtK(carteraTotal);
  if(q('dyn-kpi-cartera-sub'))q('dyn-kpi-cartera-sub').textContent= DYN_CREDITS.length+' crédito'+(DYN_CREDITS.length!==1?'s':'');
  if(q('dyn-kpi-vencida'))    q('dyn-kpi-vencida').textContent    = fmtK(carteraVencida);
  if(q('dyn-kpi-vencida-sub'))q('dyn-kpi-vencida-sub').textContent= carteraVencida>0 ? pct+'% cartera' : 'Sin vencimientos';
  if(q('dyn-kpi-vencida-bar'))q('dyn-kpi-vencida-bar').style.width= pct+'%';
  if(q('dyn-kpi-pipeline'))   q('dyn-kpi-pipeline').textContent   = fmtK(pipeline);
  if(q('dyn-kpi-pipeline-sub'))q('dyn-kpi-pipeline-sub').textContent= prospectos.length+' prospecto'+(prospectos.length!==1?'s':'');
}

// ── Custom confirm (replaces browser confirm() which is blocked in iframes) ──
function customConfirm(msg, okLabel, callback){
  const overlay = document.getElementById('confirm-overlay');
  const msgEl   = document.getElementById('confirm-msg');
  const okBtn   = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  msgEl.textContent = msg;
  okBtn.textContent = okLabel || 'Eliminar';
  overlay.style.display = 'flex';
  const cleanup = () => { overlay.style.display = 'none'; okBtn.onclick = null; cancelBtn.onclick = null; };
  okBtn.onclick    = () => { cleanup(); callback(true);  };
  cancelBtn.onclick = () => { cleanup(); callback(false); };
}

function ccDeleteHistory(idx){
  ccLoad();
  CC_HISTORY.splice(idx, 1);
  DB.set('gf_cc_hist', CC_HISTORY);
  ccRenderHistory();
}


// ═══════════════════════════════════════
// EXPORTAR HTML CON DATOS EMBEBIDOS
// ═══════════════════════════════════════
function exportHTML(){
  // Use stored source (set at load time)
  if(!window._htmlSource){
    toast('⚠️ Fuente no disponible, intenta recargar la página');
    return;
  }
  let html = window._htmlSource;

  function embedMarker(src, key, data){
    const json = JSON.stringify(data);
    const re = new RegExp('/\\*EMBED:' + key + '\\*\\/[\\s\\S]*?/\\*END:' + key + '\\*\\/');
    return src.replace(re, '/*EMBED:' + key + '*/' + json + '/*END:' + key + '*/');
  }

  html = embedMarker(html, 'END_CREDITS', END_CREDITS);
  html = embedMarker(html, 'DYN_CREDITS', DYN_CREDITS);
  html = embedMarker(html, 'FI_ROWS', FI_ROWS.filter(r=>!r.auto));
  html = embedMarker(html, 'FG_ROWS', FG_ROWS);

  // Update the stored source so next export is also up to date
  window._htmlSource = html;

  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'GF-Dashboard-' + new Date().toISOString().slice(0,10) + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✅ HTML exportado con todos los datos');
}
// ═══════════════════════════════════════
