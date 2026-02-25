// GFVMCR — Dashboard Grupo

// Capture HTML source at load time for export
window._htmlSource = document.documentElement.outerHTML;

// ═══════════════════════════════════════
// DATA: WIREBIT PRESUPUESTO 2026 (del Excel)
// ═══════════════════════════════════════
const MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const WB_ING = {
  'Fees Fondeo Tarjetas':   [20000,20200,21210,23331,26831,30855,32398,34018,37420,41162,43220,51864],
  'Fees Fondeo Tarjeta CRM':[15000,15150,15302,16832,19356,22260,25599,28159,30975,32523,35776,42931],
  'Fees VEX Retail':        [10000,11000,13200,16500,20625,26813,29494,32443,35687,39256,43182,47500],
  'Fees VEX Ecommerce':     [6500,7150,7865,8652,9517,10468,11515,12667,13933,15327,16859,18545],
  'Fees Retiros / OTC':     [6500,7150,7865,8652,9517,10467,11515,12667,13933,15327,16859,18545],
};
const WB_ING_TOTAL = [58000,60650,65442,73966,85845,100863,110521,119953,131948,143594,155896,179385];

const WB_COSTOS = {
  'Bitfinex':           [500,500,100,0,0,0,0,0,0,0,0,0],
  'Lmax':               [150,100,0,0,0,0,0,0,0,0,0,0],
  'Bitso':              [2100,2500,3000,7000,8400,10080,12096,14515,17418,20902,25082,30099],
  'Efevoo Fondeo':      [10000,15000,18000,30000,36000,43200,51840,62208,74650,89580,107495,128995],
  'Efevoo Tarjetas':    [6000,7200,8640,12960,19440,23328,25661,28227,31050,34155,37570,41327],
  'Efevoo SaaS':        [27675,27675,27675,27675,27675,30442,33487,36835,40519,44571,49028,53931],
  'Comisiones BBVA':    [1900,1900,1900,1900,1900,1900,1900,1900,1900,1900,1900,1900],
};
const WB_COSTO_TOTAL = [48325,54875,59315,79535,93415,108950,124983,143685,165536,191107,221076,256251];
const WB_MARGEN = WB_ING_TOTAL.map((v,i)=>v-WB_COSTO_TOTAL[i]);

const WB_NOM_TOTAL = [304000,361000,366000,326000,326000,346000,346000,346000,346000,346000,346000,346000];

const NOM = [
  {n:'Ángel Ahedo',     r:'Dir. Comercial',    s:120000, tipo:'Administrativo', dist:{Salem:.9, Endless:.05,Dynamo:.05,Wirebit:0}},
  {n:'Javier Diez',     r:'DOF / CFO',         s:120000, tipo:'Administrativo', dist:{Salem:.4, Endless:.1, Dynamo:.1, Wirebit:.4}},
  {n:'Joaquin Vallejo', r:'CEO Wirebit',       s:120000, tipo:'Administrativo', dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1}},
  {n:'Ezequiel',        r:'Tech Wirebit',      s:44000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1}},
  {n:'Anna',            r:'Marketing',         s:40000,  tipo:'Administrativo', dist:{Salem:.4, Endless:.1, Dynamo:.1, Wirebit:.4}},
  {n:'Ricardo',         r:'Tech Wirebit',      s:38000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1}},
  {n:'David',           r:'Ops Wirebit',       s:30000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1}},
  {n:'Ismael',          r:'Tech Wirebit',      s:22000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1}},
  {n:'Emiliano Mendoza',r:'Serv. al cliente',  s:10000,  tipo:'Operativo',      dist:{Salem:.6, Endless:.1, Dynamo:.1, Wirebit:.2}},
  {n:'Sergio',          r:'Administración',    s:8000,   tipo:'Administrativo', dist:{Salem:1,  Endless:0,  Dynamo:0,  Wirebit:0}},
];
const NOM_DIST = {Salem:186000, Endless:23000, Dynamo:23000, Wirebit:320000};

const GCOMP = [
  // Porcentajes actualizados según hoja "Gastos Compartidos" del Excel
  {c:'Renta impresora',    cat:'Administrativo', sal:.2,end:.2,dyn:.2,wb:.4, vals:[0,0,1260,1462,1580,1521,108346,2500]},
  {c:'Renta oficina',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, vals:[1893,3086,2390,26695,54666,54666,1276,36775]},
  {c:'Mantenimiento',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, vals:[0,13718,31780,34218,35271,35499,35499,35000]},
  {c:'Alestra',            cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[0,0,0,31415,17391,17391,17391,17391]},
  {c:'Luz',                cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Insumos Oficina',    cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Efevoo Tarjetas',    cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  vals:[121789,108727,122415,103756,100961,105276,111108,110000]},
  {c:'Efevoo TPV',         cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  vals:[88267,88267,85524,85967,95792,99885,97642,100000]},
  {c:'Material MKT',       cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  vals:[1959,24256,0,0,0,1200,0,3000]},
  {c:'Evento NL',          cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  vals:[0,434600,0,0,0,0,0,0]},
  {c:'Viajes',             cat:'Representación', sal:1, end:0, dyn:0, wb:0,  vals:[23787,35376,26269,29505,11750,3300,7649,10000]},
  {c:'Software',           cat:'Operaciones',    sal:.4,end:.1,dyn:.1,wb:.4, vals:[4152,16135,2008,0,2680,1040,1902,5000]},
  {c:'Hardware',           cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  vals:[0,0,0,534000,0,0,524782,10000]},
  {c:'STP',                cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  vals:[7714,0,0,0,0,0,0,5000]},
  {c:'Comisiones SitesPay',cat:'Com. Bancarias', sal:1, end:0, dyn:0, wb:0,  vals:[0,15882,23391,16180,16383,13645,12412,13000]},
  {c:'CNBV Endless',       cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  vals:[0,0,0,42796,5006,5006,5006,5006]},
  {c:'CNBV Dynamo',        cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  vals:[0,0,0,42796,5006,5006,5006,5006]},
  {c:'Icarus Endless',     cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  vals:[0,16211,16211,16211,16211,16211,16211,16211]},
  {c:'Icarus Dynamo',      cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  vals:[0,16211,16211,0,16211,16211,16211,16211]},
  {c:'Otros/Varios',       cat:'Varios',         sal:.4,end:.1,dyn:.1,wb:.4, vals:[22030,0,14850,0,0,31200,153135,15000]},
];

const SAL_TPV_CLIENTES = ['La Cantada','Quesos Chiapas','Luna Canela','Dentista Niños','Lucia Acapulco','Templados Varsa','Paradiso Beach','Tonys Restaurante','La Churrasca Atlixco','Molienda Sagrada','Tintorería Easy Clean','Super el Valle','La Churrasca Dorada','Otros Clientes'];

const SAL_GASTOS_ITEMS = [
  // Costos Directos
  {c:'Nómina Operativa',       cat:'Nómina',       sec:'cd', ppto:0},
  {c:'Software (CD)',          cat:'Operaciones',  sec:'cd', ppto:5000},
  {c:'Hardware (CD)',          cat:'Operaciones',  sec:'cd', ppto:10000},
  {c:'Comisiones Promotoría',  cat:'Com. Bancarias',sec:'cd',ppto:13000},
  // Gastos Administrativos
  {c:'Nómina Administrativa',  cat:'Nómina',       sec:'ga', ppto:186000},
  {c:'Renta Oficina',          cat:'Renta',        sec:'ga', ppto:36775},
  {c:'Mantenimiento',          cat:'Renta',        sec:'ga', ppto:35000},
  {c:'Renta Impresora',        cat:'Administrativo',sec:'ga',ppto:2500},
  {c:'Software',               cat:'Operaciones',  sec:'ga', ppto:5000},
  {c:'Hardware',               cat:'Operaciones',  sec:'ga', ppto:10000},
  {c:'Efevoo Tarjetas',        cat:'Costo Directo',sec:'ga', ppto:110000},
  {c:'Efevoo TPV',             cat:'Costo Directo',sec:'ga', ppto:100000},
  {c:'Marketing',              cat:'Marketing',    sec:'ga', ppto:3000},
  {c:'Luz',                    cat:'Administrativo',sec:'ga',ppto:0},
  {c:'Insumos Oficina',        cat:'Administrativo',sec:'ga',ppto:2000},
  {c:'Viáticos',               cat:'Representación',sec:'ga',ppto:10000},
  {c:'Comisiones Bancarias',   cat:'Com. Bancarias',sec:'ga',ppto:0},
  {c:'Cumplimiento',           cat:'Regulatorio',  sec:'ga', ppto:17391},
];

const END_CREDITS = /*EMBED:END_CREDITS*/[]/*END:END_CREDITS*/;
const DYN_CREDITS = /*EMBED:DYN_CREDITS*/[]/*END:DYN_CREDITS*/;

const WB_NOM_DETAIL = [
  {n:'Joaquin Vallejo',vals:[120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000],total:1440000},
  {n:'Javier Diez',vals:[60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000,60000],total:720000},
  {n:'Ezequiel',vals:[44000,44000,44000,44000,44000,44000,44000,44000,44000,44000,44000,44000],total:528000},
  {n:'Ricardo Medina',vals:[30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000],total:360000},
  {n:'Ismael (Entra Feb)',vals:[0,22000,22000,22000,22000,22000,22000,22000,22000,22000,22000,22000],total:242000},
  {n:'Auxiliar Contable (Entra Feb)',vals:[0,10000,10000,10000,10000,10000,10000,10000,10000,10000,10000,10000],total:110000},
  {n:'Diseño/Imagen (Ene-Mar)',vals:[20000,20000,10000,0,0,0,0,0,0,0,0,0],total:50000},
  {n:'Community Manager (Entra Mar)',vals:[0,0,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000],total:150000},
  {n:'David (Sale Abr)',vals:[30000,30000,30000,0,0,0,0,0,0,0,0,0],total:90000},
  {n:'Back-end (Entra Feb)',vals:[0,25000,25000,25000,25000,25000,25000,25000,25000,25000,25000,25000],total:275000},
  {n:'Ejecutivo Comercial (Entra Jun)',vals:[0,0,0,0,0,20000,20000,20000,20000,20000,20000,20000],total:140000},
];

// ═══════════════════════════════════════

// RENDER: RESUMEN
// ═══════════════════════════════════════
function rResumen(){
  try {
    // ── Sync créditos → FI_ROWS → S.recs ──
    if(typeof fiInjectCredits==='function') fiInjectCredits();
    if(typeof syncFlujoToRecs==='function') syncFlujoToRecs();
  } catch(e){ console.warn('rResumen sync error:', e); }

  const entKeys = ['Salem','Endless','Dynamo','Wirebit'];
  const entC    = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const entCBg  = {Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};

  // ── Ingresos por empresa desde S.recs ──
  const ingByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso').forEach(r=>{
      if(ingByEnt[r.ent]) r.vals.forEach((v,i)=> ingByEnt[r.ent][i] += (v||0));
    });
  } catch(e){}

  // Si no hay datos de Wirebit capturados, usar el presupuesto hardcoded
  const hasWBreal = ingByEnt.Wirebit.some(v=>v>0);
  if(!hasWBreal && WB_ING_TOTAL) {
    WB_ING_TOTAL.forEach((v,i) => ingByEnt.Wirebit[i] = v);
  }

  // ── Gastos por empresa desde S.recs ──
  const gasByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto').forEach(r=>{
      if(gasByEnt[r.ent]) r.vals.forEach((v,i)=> gasByEnt[r.ent][i] += (v||0));
    });
  } catch(e){}

  // ── Nómina mensual por empresa (siempre disponible desde NOM_EDIT) ──
  const nomByEnt = {Salem:0,Endless:0,Dynamo:0,Wirebit:0};
  try {
    NOM_EDIT.forEach(n=>{
      nomByEnt.Salem   += n.s*(n.sal||0)/100;
      nomByEnt.Endless += n.s*(n.end||0)/100;
      nomByEnt.Dynamo  += n.s*(n.dyn||0)/100;
      nomByEnt.Wirebit += n.s*(n.wb||0)/100;
    });
  } catch(e){ nomByEnt.Salem=186000;nomByEnt.Endless=23000;nomByEnt.Dynamo=23000;nomByEnt.Wirebit=320000; }
  const nomTotal = Object.values(nomByEnt).reduce((a,b)=>a+b,0);

  // ── Totales anuales ──
  const ingTot = {}, gasTot = {};
  entKeys.forEach(e=>{
    ingTot[e] = ingByEnt[e].reduce((a,b)=>a+b,0);
    gasTot[e] = gasByEnt[e].reduce((a,b)=>a+b,0) + nomByEnt[e]*12;
  });
  const ingGrupo  = Object.values(ingTot).reduce((a,b)=>a+b,0);
  const gasGrupo  = Object.values(gasTot).reduce((a,b)=>a+b,0);
  const margenGrupo = ingGrupo - gasGrupo;

  // ── KPI cards ──
  const q = id => document.getElementById(id);

  // Ingresos
  const elIng = q('dash-kpi-ing');
  if(elIng){
    elIng.textContent = fmtK(ingGrupo);
    elIng.style.color = 'var(--green)';
    const sub = entKeys.filter(e=>ingTot[e]>0).map(e=>e.slice(0,3)+' '+fmtK(ingTot[e])).join('  ');
    if(q('dash-kpi-ing-sub')) q('dash-kpi-ing-sub').textContent = sub || 'Wirebit presupuesto incluido';
    if(q('dash-kpi-ing-sub')) q('dash-kpi-ing-sub').className = 'kpi-d dnu';
    if(q('dash-bar-ing')) q('dash-bar-ing').style.width = Math.min(100, Math.round(ingGrupo/Math.max(ingGrupo,gasGrupo,1)*100))+'%';
  }

  // Gastos
  const elGas = q('dash-kpi-gas');
  if(elGas){
    elGas.textContent = fmtK(gasGrupo);
    elGas.style.color = 'var(--orange)';
    if(q('dash-kpi-gas-sub')) q('dash-kpi-gas-sub').textContent = 'Nómina '+fmtK(nomTotal*12)+'/año incl.';
    if(q('dash-kpi-gas-sub')) q('dash-kpi-gas-sub').className = 'kpi-d dnu';
    if(q('dash-bar-gas')) q('dash-bar-gas').style.width = Math.min(100, Math.round(gasGrupo/Math.max(ingGrupo,gasGrupo,1)*100))+'%';
  }

  // Nómina
  if(q('dash-kpi-nom')) q('dash-kpi-nom').textContent = fmtK(nomTotal*12);

  // Margen
  const elM = q('dash-kpi-margen');
  if(elM){
    elM.textContent = fmtK(margenGrupo);
    elM.style.color = margenGrupo >= 0 ? 'var(--green)' : 'var(--red)';
    const pct = ingGrupo > 0 ? (margenGrupo/ingGrupo*100).toFixed(1)+'% margen' : 'Ing − Gastos';
    if(q('dash-kpi-margen-sub')) q('dash-kpi-margen-sub').textContent = pct;
    if(q('dash-kpi-margen-sub')) q('dash-kpi-margen-sub').className = margenGrupo>=0 ? 'kpi-d dnu' : 'kpi-d ddn';
    if(q('dash-bar-margen')){ q('dash-bar-margen').style.width = Math.min(100,Math.abs(margenGrupo)/Math.max(ingGrupo,1)*100)+'%'; q('dash-bar-margen').style.background = margenGrupo>=0?'var(--green)':'var(--red)'; }
  }

  // ── Gráficas (RAF para asegurar que canvas tiene dimensiones) ──
  requestAnimationFrame(()=>{
    const cOp  = cOpts();
    const noAx = {x:{display:false},y:{display:false}};
    const tip  = {...cOp.plugins.tooltip, callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}};
    const tK   = v=>'$'+(Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'M':Math.abs(v)>=1000?(v/1000).toFixed(0)+'K':v);

    // Gráfica 1 — Ingresos por empresa
    // Si hay datos mensuales → barras apiladas; si no → donut anual
    dc('cdashi');
    const ingMoTotal = Array(12).fill(0);
    entKeys.forEach(e=>ingByEnt[e].forEach((v,i)=>ingMoTotal[i]+=v));
    const hasMonthly = ingMoTotal.some(v=>v>0);
    const c1 = q('c-dash-ing'); if(!c1) return;

    if(hasMonthly){
      CH['cdashi'] = new Chart(c1,{type:'bar',data:{labels:MO,
        datasets:entKeys.filter(e=>ingTot[e]>0).map(e=>({label:e,data:ingByEnt[e],backgroundColor:entCBg[e],borderColor:entC[e],borderWidth:1.5}))
      },options:cOpts({scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:tK}}}})});
      if(q('dash-c1-sub')) q('dash-c1-sub').textContent='Mensual · por empresa';
    } else {
      const ann = entKeys.map(e=>({e,v:ingTot[e]}));
      CH['cdashi'] = new Chart(c1,{type:'doughnut',data:{
        labels:ann.map(d=>d.e),
        datasets:[{data:ann.map(d=>d.v),backgroundColor:ann.map(d=>entCBg[d.e]),borderColor:ann.map(d=>entC[d.e]),borderWidth:1.5}]
      },options:{...cOp,plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:8,padding:4}},tooltip:tip},cutout:'58%',scales:noAx}});
      if(q('dash-c1-sub')) q('dash-c1-sub').textContent='Presupuesto anual · por empresa';
    }

    // Gráfica 2 — Gastos por empresa (donut)
    dc('cdashg');
    const c2 = q('c-dash-gas'); if(!c2) return;
    const gasAnn = entKeys.map(e=>({e,v:gasTot[e]}));
    CH['cdashg'] = new Chart(c2,{type:'doughnut',data:{
      labels:gasAnn.map(d=>d.e),
      datasets:[{data:gasAnn.map(d=>d.v),backgroundColor:gasAnn.map(d=>entCBg[d.e]),borderColor:gasAnn.map(d=>entC[d.e]),borderWidth:1.5}]
    },options:{...cOp,plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:8,padding:4}},tooltip:tip},cutout:'58%',scales:noAx}});

    // Gráfica 3 — Nómina por empresa (barras)
    dc('cdashnom');
    const c3 = q('c-dash-nom'); if(!c3) return;
    CH['cdashnom'] = new Chart(c3,{type:'bar',data:{
      labels:entKeys,
      datasets:[{data:entKeys.map(e=>nomByEnt[e]),backgroundColor:entKeys.map(e=>entCBg[e]),borderColor:entKeys.map(e=>entC[e]),borderWidth:1.5,borderRadius:4}]
    },options:cOpts({plugins:{legend:{display:false}},scales:{
      x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},
      y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:tK}}
    }})});

    // Gráfica 4 — Margen por empresa (barras horizontales)
    dc('cdashm');
    const c4 = q('c-dash-margen'); if(!c4) return;
    // Margen = ingresos - (gastos capturados + nómina anual)
    const margenVals = entKeys.map(e => ingTot[e] - gasTot[e]);
    CH['cdashm'] = new Chart(c4,{type:'bar',data:{
      labels:entKeys,
      datasets:[{data:margenVals,
        backgroundColor:margenVals.map(v=>v>=0?'rgba(0,184,117,.25)':'rgba(229,57,53,.2)'),
        borderColor:margenVals.map(v=>v>=0?'#00b875':'#e53935'),
        borderWidth:1.5,borderRadius:4}]
    },options:cOpts({indexAxis:'y',plugins:{legend:{display:false}},scales:{
      x:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:tK}},
      y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}}
    }})});

  }); // end RAF

  // Render entity summary cards and EDO table
  rEntSummary();
  rEDO();
  rDashTesoreria();
}
// ═══════════════════════════════════════
// DASHBOARD GRUPO — Sección 2 & 3
// ═══════════════════════════════════════
let _edoMode = 'mensual';

function setEDO(mode, btn){
  _edoMode = mode;
  document.querySelectorAll('.pbar .pbtn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  rEDO();
}

function rEntSummary(){
  const el = document.getElementById('dash-ent-summary');
  if(!el) return;

  const entC   = {Salem:'#0073ea', Endless:'#00b875', Dynamo:'#ff7043', Wirebit:'#9b51e0'};
  const entBg  = {Salem:'var(--blue-bg)', Endless:'var(--green-bg)', Dynamo:'var(--orange-bg)', Wirebit:'var(--purple-bg)'};
  const entIco = {Salem:'💳', Endless:'🏦', Dynamo:'🏦', Wirebit:'⛓'};
  const entNav = {Salem:"navTo('sal_res')", Endless:"navTo('end_res')", Dynamo:"navTo('dyn_res')", Wirebit:"navTo('wb_res')"};

  const cards = ['Salem','Endless','Dynamo','Wirebit'].map(e => {
    const ing  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e).reduce((a,r)=>a+sum(r.vals),0);
    const gas  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e).reduce((a,r)=>a+sum(r.vals),0);
    const nom  = NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
    const ingD = ing || (e==='Wirebit' ? sum(WB_ING_TOTAL) : 0);
    const gasD = gas || nom;
    const mg   = ingD - gasD;
    const mgPct = ingD ? Math.round(mg/ingD*100) : null;

    // Credit info for SOFOMs
    let extra = '';
    if(e==='Endless'){
      const activa = END_CREDITS.filter(c=>c.st==='Activo').reduce((a,c)=>a+c.monto,0);
      if(activa) extra = `<div style="margin-top:5px;font-size:.67rem;color:var(--muted)">Cartera: <span style="color:${entC[e]};font-weight:600">${fmtK(activa)}</span></div>`;
    }
    if(e==='Dynamo'){
      const activa = DYN_CREDITS.filter(c=>c.st==='Activo').reduce((a,c)=>a+c.monto,0);
      const vencida = DYN_CREDITS.filter(c=>c.st==='Vencido').reduce((a,c)=>a+c.monto,0);
      extra = `<div style="margin-top:5px;font-size:.67rem;color:var(--muted)">
        Activa: <span style="color:${entC[e]};font-weight:600">${fmtK(activa)}</span>
        ${vencida?`· <span style="color:var(--red);font-weight:600">⚠ ${fmtK(vencida)} vencida</span>`:''}
      </div>`;
    }

    return `<div onclick="${entNav[e]}" style="background:var(--white);border:1px solid var(--border);border-top:3px solid ${entC[e]};border-radius:var(--rlg);padding:12px 14px;cursor:pointer;transition:box-shadow .12s" onmouseover="this.style.boxShadow='var(--shm)'" onmouseout="this.style.boxShadow=''">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.8rem;color:${entC[e]}">${entIco[e]} ${e}</span>
        <span style="font-size:.6rem;color:var(--muted)">ver P&L →</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px">
        <div>
          <div style="font-size:.6rem;color:var(--muted);margin-bottom:1px">Ingresos</div>
          <div style="font-size:.82rem;font-weight:700;color:var(--green)">${ingD ? fmtK(ingD) : '<span style="color:var(--muted)">—</span>'}</div>
        </div>
        <div>
          <div style="font-size:.6rem;color:var(--muted);margin-bottom:1px">Gastos</div>
          <div style="font-size:.82rem;font-weight:700;color:var(--orange)">${fmtK(gasD)}</div>
        </div>
        <div>
          <div style="font-size:.6rem;color:var(--muted);margin-bottom:1px">Nómina/mes</div>
          <div style="font-size:.82rem;font-weight:700;color:var(--purple)">${fmtK(nom/12)}</div>
        </div>
        <div>
          <div style="font-size:.6rem;color:var(--muted);margin-bottom:1px">Margen</div>
          <div style="font-size:.82rem;font-weight:700;color:${mg>=0?'var(--green)':'var(--red)'}">${ingD ? (mgPct+'%') : '<span style="color:var(--muted)">—</span>'}</div>
        </div>
      </div>
      ${extra}
    </div>`;
  });

  el.innerHTML = cards.join('');
}

function rEDO(){
  fiInjectCredits();
  syncFlujoToRecs();

  const thead = document.getElementById('edo-thead');
  const tbody = document.getElementById('edo-tbody');
  if(!thead || !tbody) return;

  const entC = {Salem:'#0073ea', Endless:'#00b875', Dynamo:'#ff7043', Wirebit:'#9b51e0'};

  // Helper: get vals for entity+tipo from S.recs
  const getVals = (ent, tipo) => {
    const recs = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&(ent==='ALL'||r.ent===ent));
    return Array(12).fill(0).map((_,i) => recs.reduce((a,r)=>a+(r.vals[i]||0),0));
  };

  // Nómina mensual por empresa
  const nomMes = nomMesTotal; // backwards compat

  // Build monthly rows
  const ING = {
    Salem:   getVals('Salem','ingreso'),
    Endless: getVals('Endless','ingreso'),
    Dynamo:  getVals('Dynamo','ingreso'),
    Wirebit: getVals('Wirebit','ingreso'),
  };
  const GAS = {
    Salem:   getVals('Salem','gasto').map((v,i)=>v+nomMes('Salem')),
    Endless: getVals('Endless','gasto').map((v,i)=>v+nomMes('Endless')),
    Dynamo:  getVals('Dynamo','gasto').map((v,i)=>v+nomMes('Dynamo')),
    Wirebit: getVals('Wirebit','gasto').map((v,i)=>v+nomMes('Wirebit')),
  };
  const ING_TOT = Array(12).fill(0).map((_,i)=>ING.Salem[i]+ING.Endless[i]+ING.Dynamo[i]+ING.Wirebit[i]);
  const GAS_TOT = Array(12).fill(0).map((_,i)=>GAS.Salem[i]+GAS.Endless[i]+GAS.Dynamo[i]+GAS.Wirebit[i]);
  const MARGEN  = ING_TOT.map((v,i)=>v-GAS_TOT[i]);

  // Collapse months based on mode
  let cols, colLabels;
  if(_edoMode === 'anual'){
    cols = [Array(12).fill(0).map((_,i)=>i)];
    colLabels = ['Total 2026'];
  } else if(_edoMode === 'trimestral'){
    cols = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
    colLabels = ['Q1','Q2','Q3','Q4','Total 2026'];
    cols.push(Array(12).fill(0).map((_,i)=>i));
  } else {
    cols = Array(12).fill(0).map((_,i)=>[i]);
    colLabels = MO.concat(['Total']);
  }

  const colVal = (arr, idxs) => idxs.reduce((a,i)=>a+arr[i],0);

  thead.innerHTML = '<th style="min-width:160px">Concepto</th>' +
    colLabels.map(l=>`<th class="r" style="min-width:70px">${l}</th>`).join('');

  const rowStyle = (type) => ({
    hdr: 'background:#f0f2fa;font-family:"Poppins",sans-serif;font-size:.7rem;font-weight:700',
    ing: '',
    gas: '',
    total: 'background:#f8f9fd;font-weight:700;border-top:2px solid var(--border2)',
    util: 'font-weight:700',
    sep: 'height:6px;background:var(--bg)',
  }[type]||'');

  const cell = (v, type, isTot=false) => {
    const cls = type==='util'?(v>=0?'pos':'neg'):type==='ing'?'pos':type==='gas'?'neg':'';
    const bold = (type==='total'||type==='util'||isTot) ? 'font-weight:700;' : '';
    return `<td class="mo ${cls}" style="${bold}">${v ? fmtFull(v) : '—'}</td>`;
  };

  const row = (label, arr, type, color='') => {
    const vals = cols.map(idxs => colVal(arr, idxs));
    const tot  = arr.reduce((a,b)=>a+b,0);
    const allCols = _edoMode==='trimestral' ? vals : (_edoMode==='mensual' ? [...vals,[tot]] : vals);
    return `<tr style="${rowStyle(type)}">
      <td style="font-size:.75rem;padding:5px 10px;color:${color||'var(--text)'}">${label}</td>
      ${allCols.map((v,i)=>cell(v, type, i===allCols.length-1)).join('')}
    </tr>`;
  };

  const hdr = (label) => `<tr style="${rowStyle('hdr')}"><td colspan="${colLabels.length+1}" style="padding:8px 10px;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)">${label}</td></tr>`;
  const sep = () => `<tr style="${rowStyle('sep')}"><td colspan="${colLabels.length+1}"></td></tr>`;

  tbody.innerHTML = [
    hdr('💰 INGRESOS'),
    row('Salem Internacional', ING.Salem, 'ing', entC.Salem),
    row('Endless Money', ING.Endless, 'ing', entC.Endless),
    row('Dynamo Finance', ING.Dynamo, 'ing', entC.Dynamo),
    row('Wirebit', ING.Wirebit, 'ing', entC.Wirebit),
    row('▸ TOTAL INGRESOS GRUPO', ING_TOT, 'total'),
    sep(),
    hdr('💸 COSTOS Y GASTOS OPERATIVOS'),
    row('Salem Internacional', GAS.Salem, 'gas', entC.Salem),
    row('Endless Money', GAS.Endless, 'gas', entC.Endless),
    row('Dynamo Finance', GAS.Dynamo, 'gas', entC.Dynamo),
    row('Wirebit', GAS.Wirebit, 'gas', entC.Wirebit),
    row('▸ TOTAL GASTOS GRUPO', GAS_TOT, 'total'),
    sep(),
    row('▸▸ MARGEN BRUTO GRUPO', MARGEN, 'util'),
  ].join('');
}

// ═══════════════════════════════════════

// MODALES
// ═══════════════════════════════════════
function openModal(id, customTitle, customHtml){
  const bg=document.getElementById('modal-bg');
  const box=document.getElementById('modal-box');
  const body=document.getElementById('modal-body');
  const title=document.getElementById('modal-title');
  const sub=document.getElementById('modal-sub');
  dc('m-chart1');dc('m-chart2');
  bg.style.opacity='0';bg.style.pointerEvents='none';
  box.style.transform='translateY(8px)';
  // Custom mode (for credit detail, etc.)
  if(customTitle && customHtml){
    title.textContent = customTitle;
    sub.textContent = '';
    body.innerHTML = customHtml;
    requestAnimationFrame(()=>{
      bg.style.opacity='1';bg.style.pointerEvents='auto';box.style.transform='translateY(0)';
      // Wire delete button if present
      const delBtn = document.getElementById('cred-del-btn');
      if(delBtn){
        delBtn.onclick = function(){
          const ent = this.dataset.ent;
          const idx = parseInt(this.dataset.idx);
          console.log('Delete clicked: ent='+ent+' idx='+idx);
          credDelete(ent, idx);
        };
      } else {
        console.warn('cred-del-btn NOT FOUND in modal');
      }
    });
    return;
  }

  const configs={
    // ── Dashboard: Ingresos Grupo
    resumen_ingresos:{
      t:'Ingresos Grupo Financiero 2026', s:'Salem · Endless · Dynamo · Wirebit',
      render:()=>{
        fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows = ['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const recs = S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e);
          const tot  = recs.reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const mes  = Math.round(tot/12);
          return {e, tot, mes, n:recs.length};
        });
        const grand = rows.reduce((a,r)=>a+r.tot,0);
        return `<canvas id="m-chart1" height="200"></canvas>
        <table class="mbt" style="margin-top:14px"><thead><tr><th>Empresa</th><th class="r">Ingresos Capturados</th><th class="r">Promedio/Mes</th><th class="r">% del Grupo</th><th class="r">Conceptos</th></tr></thead><tbody>
          ${rows.map(r=>`<tr>
            <td class="bld" style="color:${entC[r.e]}">${r.e}</td>
            <td class="mo pos">${r.tot?fmt(r.tot):'—'}</td>
            <td class="mo">${r.mes?fmt(r.mes):'—'}</td>
            <td class="mo">${grand?Math.round(r.tot/grand*100)+'%':'—'}</td>
            <td style="text-align:center">${r.n}</td>
          </tr>`).join('')}
          <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo pos">${grand?fmt(grand):'$0 — captura pendiente'}</td><td class="mo">${grand?fmt(Math.round(grand/12)):'—'}</td><td>100%</td><td>${rows.reduce((a,r)=>a+r.n,0)}</td></tr>
        </tbody></table>`;
      },
      afterRender:()=>{
        fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const entCBg={Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const recs=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e);
          return {e, vals:MO.map((_,i)=>recs.reduce((a,r)=>a+(r.vals[i]||0),0))};
        }).filter(r=>r.vals.some(v=>v>0));
        if(!rows.length) return;
        dc('m-chart1');
        new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:MO,datasets:rows.map(r=>({label:r.e,data:r.vals,backgroundColor:entCBg[r.e],borderColor:entC[r.e],borderWidth:1.5}))},
          options:cOpts({scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}})});
      }
    },
    // ── Dashboard: Gastos Grupo
    resumen_gastos:{
      t:'Gastos Grupo Financiero 2026', s:'Nómina · Gastos operativos · Gastos compartidos',
      render:()=>{
        fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const nom = NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas = S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          return {e, nom, gas, tot:nom+gas};
        });
        const grand=rows.reduce((a,r)=>a+r.tot,0);
        return `<canvas id="m-chart1" height="200"></canvas>
        <table class="mbt" style="margin-top:14px"><thead><tr><th>Empresa</th><th class="r">Nómina Anual</th><th class="r">Gastos Capturados</th><th class="r">Total</th><th class="r">% del Grupo</th></tr></thead><tbody>
          ${rows.map(r=>`<tr>
            <td class="bld" style="color:${entC[r.e]}">${r.e}</td>
            <td class="mo neg">${fmt(r.nom)}</td>
            <td class="mo neg">${r.gas?fmt(r.gas):'—'}</td>
            <td class="mo neg">${fmt(r.tot)}</td>
            <td class="mo">${grand?Math.round(r.tot/grand*100)+'%':'—'}</td>
          </tr>`).join('')}
          <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo neg">${fmt(rows.reduce((a,r)=>a+r.nom,0))}</td><td class="mo neg">${fmt(rows.reduce((a,r)=>a+r.gas,0))}</td><td class="mo neg">${fmt(grand)}</td><td>100%</td></tr>
        </tbody></table>`;
      },
      afterRender:()=>{
        const entCBg={Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          return {e, v:nom+gas};
        });
        dc('m-chart1');
        new Chart(document.getElementById('m-chart1'),{type:'doughnut',data:{labels:rows.map(r=>r.e),datasets:[{data:rows.map(r=>r.v),backgroundColor:rows.map(r=>entCBg[r.e]),borderColor:rows.map(r=>entC[r.e]),borderWidth:1.5}]},
          options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:11},boxWidth:10}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}}},cutout:'55%',scales:{x:{display:false},y:{display:false}}}});
      }
    },
    // ── Dashboard: Margen Grupo
    resumen_margen:{
      t:'Margen Operativo Grupo Financiero 2026', s:'Ingresos capturados − Gastos totales por empresa',
      render:()=>{
        fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const margen=ing-(nom+gas);
          return {e, ing, nom, gas, margen};
        });
        const totIng=rows.reduce((a,r)=>a+r.ing,0);
        const totGas=rows.reduce((a,r)=>a+r.nom+r.gas,0);
        const totM=totIng-totGas;
        return `<canvas id="m-chart1" height="180"></canvas>
        <table class="mbt" style="margin-top:14px"><thead><tr><th>Empresa</th><th class="r">Ingresos</th><th class="r">Nómina + Gastos</th><th class="r">Margen</th><th class="r">% Margen</th></tr></thead><tbody>
          ${rows.map(r=>`<tr>
            <td class="bld" style="color:${entC[r.e]}">${r.e}</td>
            <td class="mo pos">${r.ing?fmt(r.ing):'—'}</td>
            <td class="mo neg">${fmt(r.nom+r.gas)}</td>
            <td class="mo ${r.margen>=0?'pos':'neg'}">${r.ing?fmt(r.margen):'—'}</td>
            <td class="mo ${r.margen>=0?'pos':'neg'}">${r.ing?Math.round(r.margen/r.ing*100)+'%':'—'}</td>
          </tr>`).join('')}
          <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo pos">${totIng?fmt(totIng):'$0'}</td><td class="mo neg">${fmt(totGas)}</td><td class="mo ${totM>=0?'pos':'neg'}">${totIng?fmt(totM):'—'}</td><td class="mo ${totM>=0?'pos':'neg'}">${totIng?Math.round(totM/totIng*100)+'%':'—'}</td></tr>
        </tbody></table>`;
      },
      afterRender:()=>{
        fiInjectCredits(); syncFlujoToRecs();
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          return {e, v:ing-(nom+gas)};
        });
        dc('m-chart1');
        new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:rows.map(r=>r.e),datasets:[{data:rows.map(r=>r.v),
          backgroundColor:rows.map(r=>r.v>=0?'rgba(0,184,117,.25)':'rgba(229,57,53,.2)'),
          borderColor:rows.map(r=>r.v>=0?'#00b875':'#e53935'),borderWidth:1.5,borderRadius:6}]},
          options:cOpts({indexAxis:'y',scales:{x:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+(Math.abs(v)/1000).toFixed(0)+'K'}},y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:11}}}},plugins:{legend:{display:false}}})});
      }
    },
    // ── Centum Ingresos
    centum_ing_modal:{
      t:'Centum Capital — Ingresos 2026',s:'Salem TPV · Fondeo Tarjetas · Endless · Dynamo',
      render:()=>`<div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.77rem;color:#0060b8">
        💡 Los ingresos de Centum Capital dependen de los datos reales de Salem, Endless y Dynamo. Usa <strong>"Ingresar Datos"</strong> para capturar la información mensual.
      </div>
      <div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem — Fuentes</div><div class="m-kpi-val" style="font-size:.85rem">TPV + Fondeo</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless — Ing. Est.</div><div class="m-kpi-val">$23.2K/año</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo — Ing. Est.</div><div class="m-kpi-val">$426.6K/año</div></div>
      </div>
      <table class="mbt"><thead><tr><th>Entidad</th><th>Fuente de Ingreso</th><th class="r">Est. Mensual</th><th class="r">Est. Anual</th><th>Status</th></tr></thead><tbody>
        <tr><td class="bld" style="color:#0073ea">Salem Internacional</td><td>Ingresos TPV + Fondeo Tarjetas</td><td class="mo">—</td><td class="mo">—</td><td><span style="font-size:.65rem;background:var(--yellow-lt);color:#7a6000;padding:2px 7px;border-radius:20px;font-weight:700">Pendiente</span></td></tr>
        <tr><td class="bld" style="color:#00b875">Endless Money</td><td>Intereses Crédito Simple (Jerónimo)</td><td class="mo pos">$1,934</td><td class="mo pos">$23,208</td><td><span style="font-size:.65rem;background:var(--green-lt);color:#007a48;padding:2px 7px;border-radius:20px;font-weight:700">Activo</span></td></tr>
        <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td>Intereses Crédito Simple (Easy Clean)</td><td class="mo pos">$1,068</td><td class="mo pos">$12,816</td><td><span style="font-size:.65rem;background:var(--green-lt);color:#007a48;padding:2px 7px;border-radius:20px;font-weight:700">Activo</span></td></tr>
        <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td>Intereses Juan Manuel (VENCIDO)</td><td class="mo neg">$34,482</td><td class="mo neg">$413,784</td><td><span style="font-size:.65rem;background:var(--red-lt);color:#b02020;padding:2px 7px;border-radius:20px;font-weight:700">⚠ Vencido</span></td></tr>
      </tbody></table>`
    },
    // ── Centum Costos
    centum_costos_modal:{
      t:'Centum Capital — Costos y Gastos Consolidados',s:'Presupuesto mensual de las 3 entidades',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem Gastos/Mes</div><div class="m-kpi-val" style="color:var(--red)">$383K</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless Gastos/Mes</div><div class="m-kpi-val" style="color:var(--red)">$90K</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo Gastos/Mes</div><div class="m-kpi-val" style="color:var(--red)">$90K</div></div>
      </div>
      <table class="mbt"><thead><tr><th>Entidad</th><th>Mayor Costo</th><th class="r">Total/Mes</th><th class="r">Total Anual</th><th class="r">% del Total</th></tr></thead><tbody>
        <tr><td class="bld" style="color:#0073ea">Salem Internacional</td><td>Efevoo Tarjetas $110K</td><td class="mo neg">$383,000</td><td class="mo neg">$4,596,000</td><td class="mo">65%</td></tr>
        <tr><td class="bld" style="color:#00b875">Endless Money</td><td>Nómina + Regulatorio</td><td class="mo neg">$90,154</td><td class="mo neg">$1,081,848</td><td class="mo">18%</td></tr>
        <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td>Nómina + Regulatorio</td><td class="mo neg">$90,154</td><td class="mo neg">$1,081,848</td><td class="mo">18%</td></tr>
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL CENTUM</td><td></td><td class="mo bld neg">$563,308/mes</td><td class="mo bld neg">$6,759,696/año</td><td class="mo bld">100%</td></tr>
      </tbody></table>`
    },
    // ── Centum Cartera
    centum_cartera_modal:{
      t:'Centum Capital — Cartera Consolidada de Créditos',s:'Endless Money + Dynamo Finance',
      render:()=>`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">⚠️ <strong>Alerta:</strong> Juan Manuel de la Colina (Dynamo) — $2.5M vencida = 44% de la cartera total de Centum.</div>
        <div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val">$5.7M</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
          <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Cartera Activa</div><div class="m-kpi-val" style="color:var(--green)">$200K</div></div>
          <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline Total</div><div class="m-kpi-val">$5.25M</div></div>
        </div>
        <table class="mbt"><thead><tr><th>SOFOM</th><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th class="r">Int/Mes</th><th>Status</th></tr></thead><tbody>
          ${[...END_CREDITS.map(c=>({...c,ent:'Endless',col:'#00b875'})),...DYN_CREDITS.map(c=>({...c,ent:'Dynamo',col:'#ff7043'}))].map(c=>`
          <tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld" style="color:${c.col}">${c.ent}</td><td>${c.cl}</td><td class="mo bld">${fmt(c.m)}</td><td>${c.pl}</td><td>${c.t}</td><td class="mo ${c.im?'pos':''}">${c.im?fmt(c.im):'—'}</td><td>${spill(c.st)}</td></tr>`).join('')}
        </tbody></table>`
    },
    // ── Centum Nomina
    centum_nom_modal:{
      t:'Centum Capital — Nómina Asignada',s:'Salem + Endless + Dynamo',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val">$186K/mes</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val">$23K/mes</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val">$23K/mes</div></div>
      </div>
      <table class="mbt"><thead><tr><th>Empleado</th><th>Rol</th><th class="r">Sueldo/Mes</th><th class="r">% Salem</th><th class="r">% Endless</th><th class="r">% Dynamo</th></tr></thead><tbody>
        ${NOM.filter(e=>e.dist.Salem>0||e.dist.Endless>0||e.dist.Dynamo>0).map(e=>`<tr>
          <td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td>
          <td class="mo" style="color:#0073ea">${e.dist.Salem>0?(e.dist.Salem*100).toFixed(0)+'%':'—'}</td>
          <td class="mo" style="color:#00b875">${e.dist.Endless>0?(e.dist.Endless*100).toFixed(0)+'%':'—'}</td>
          <td class="mo" style="color:#ff7043">${e.dist.Dynamo>0?(e.dist.Dynamo*100).toFixed(0)+'%':'—'}</td>
        </tr>`).join('')}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL CENTUM</td><td></td><td></td><td class="mo bld" style="color:#0073ea">$186K</td><td class="mo bld" style="color:#00b875">$23K</td><td class="mo bld" style="color:#ff7043">$23K</td></tr>
      </tbody></table>`
    },
    // ── Grupo Ingresos
    grupo_ing_modal:{
      t:'Grupo Financiero — Ingresos Consolidados 2026',s:'Centum Capital + Wirebit',
      render:()=>{
        const rows=MO.map((m,i)=>`<tr><td class="bld">${m}</td><td class="mo">—</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo bld pos">${fmt(WB_ING_TOTAL[i])}</td></tr>`).join('');
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Wirebit (ppto)</div><div class="m-kpi-val" style="color:#9b51e0">$1.29M</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Centum Capital</div><div class="m-kpi-val">Pendiente</div></div>
          <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Total Capturado</div><div class="m-kpi-val" style="color:#9b51e0">$1.29M</div></div>
        </div>
        <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Centum (pendiente)</th><th class="r">Wirebit</th><th class="r">Total Grupo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    },
    // ── Grupo Costos
    grupo_costos_modal:{
      t:'Grupo Financiero — Costos y Gastos Totales 2026',s:'Las 4 entidades consolidadas',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val" style="color:var(--red)">$4.6M/año</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val" style="color:var(--red)">$1.08M/año</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val" style="color:var(--red)">$1.08M/año</div></div>
        <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Wirebit</div><div class="m-kpi-val" style="color:var(--red)">$4.1M nom.</div></div>
      </div>
      <table class="mbt"><thead><tr><th>Entidad</th><th class="r">Gastos/Mes</th><th class="r">Total Anual</th><th class="r">% del Grupo</th></tr></thead><tbody>
        <tr><td class="bld" style="color:#0073ea">Salem Internacional</td><td class="mo neg">$383,000</td><td class="mo neg">$4,596,000</td><td class="mo">17%</td></tr>
        <tr><td class="bld" style="color:#00b875">Endless Money</td><td class="mo neg">$90,154</td><td class="mo neg">$1,081,848</td><td class="mo">4%</td></tr>
        <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td class="mo neg">$90,154</td><td class="mo neg">$1,081,848</td><td class="mo">4%</td></tr>
        <tr><td class="bld" style="color:#9b51e0">Wirebit (costos dir.)</td><td class="mo neg">$129,207</td><td class="mo neg">$1,550,484</td><td class="mo">6%</td></tr>
        <tr><td class="bld" style="color:#9b51e0">Wirebit (nómina)</td><td class="mo neg">$342,000</td><td class="mo neg">$4,104,000</td><td class="mo">15%</td></tr>
        <tr><td class="bld">Nómina Compartida (todos)</td><td class="mo neg">$552,000</td><td class="mo neg">$6,624,000</td><td class="mo">25%</td></tr>
        <tr><td class="bld">Gastos Compartidos (ppto)</td><td class="mo neg">$665,000</td><td class="mo neg">$7,980,000</td><td class="mo">29%</td></tr>
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld neg">—</td><td class="mo bld neg">~$27.0M</td><td class="mo bld">100%</td></tr>
      </tbody></table>`
    },
    // ── Grupo Cartera
    grupo_cartera_modal:{
      t:'Grupo Financiero — Cartera y Pipeline de Crédito',s:'Endless + Dynamo · Todas las posiciones',
      render:()=>`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">⚠️ Juan Manuel de la Colina (Dynamo) — $2.5M vencida sin resolver.</div>
        <div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Total Cartera</div><div class="m-kpi-val">$5.7M</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
          <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Activa</div><div class="m-kpi-val" style="color:var(--green)">$200K</div></div>
          <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$5.25M</div></div>
        </div>
        <table class="mbt"><thead><tr><th>SOFOM</th><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
          ${[...END_CREDITS.map(c=>({...c,ent:'Endless',col:'#00b875'})),...DYN_CREDITS.map(c=>({...c,ent:'Dynamo',col:'#ff7043'}))].map(c=>`
          <tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld" style="color:${c.col}">${c.ent}</td><td>${c.cl}</td><td class="mo bld">${fmt(c.m)}</td><td>${c.pl}</td><td>${c.t}</td><td class="mo ${c.im?'pos':''}">${c.im?fmt(c.im):'—'}</td><td class="mo ${c.ia?'pos':''}">${c.ia?fmt(c.ia):'—'}</td><td>${spill(c.st)}</td></tr>`).join('')}
        </tbody></table>`
    },
    // ── Grupo Mix
    grupo_mix_modal:{
      t:'Grupo Financiero — Mix Ingresos y Nómina',s:'Distribución anual presupuestada',
      render:()=>{
        const canv=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px"><canvas id="m-chart1" height="200"></canvas><canvas id="m-chart2" height="200"></canvas></div>`;
        setTimeout(()=>{
          dc('m-chart1');
          const pieTip2={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}};
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'doughnut',data:{
            labels:['Salem (pendiente)','Endless $23.2K','Dynamo $426.6K','Wirebit $1.29M'],
            datasets:[{data:[1,23208,426600,sum(WB_ING_TOTAL)],backgroundColor:['rgba(0,115,234,.3)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)'],borderWidth:0}]
          },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:10},boxWidth:9,padding:8}},tooltip:pieTip2},cutout:'50%',scales:{x:{display:false},y:{display:false}}}});
          dc('m-chart2');
          CH['m-chart2']=new Chart(document.getElementById('m-chart2'),{type:'doughnut',data:{
            labels:['Salem $186K','Endless $23K','Dynamo $23K','Wirebit $320K'],
            datasets:[{data:[186000,23000,23000,320000],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)'],borderWidth:0}]
          },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:10},boxWidth:9,padding:8}},tooltip:pieTip2},cutout:'50%',scales:{x:{display:false},y:{display:false}}}});
        },50);
        return canv+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">Ingresos por Entidad</div><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">Nómina Mensual por Empresa</div></div>`;
      }
    },
    // ── Salem Ingresos
    salem_ing_modal:{
      t:'Salem — Ingresos 2026',s:'TPV por cliente + Fondeo Tarjetas Centum Black',
      render:()=>{
        const salRows = FI_ROWS.filter(r=>r.ent==='Salem'&&!r.auto);
        const totalAnual = salRows.reduce((s,r)=>s+r.vals.reduce((a,b)=>a+b,0),0);
        const totalMes = salRows.reduce((s,r)=>s+(r.vals.reduce((a,b)=>a+b,0)/12),0);
        const hasReal = salRows.length > 0;
        const rowsHtml = hasReal
          ? salRows.map(r=>`<tr><td class="bld">${r.concepto||'—'}</td><td style="color:var(--muted);font-size:.73rem">${r.cat}</td><td class="mo pos">${fmt(r.vals.reduce((a,b)=>a+b,0)/12)}</td><td class="mo pos bld">${fmt(r.vals.reduce((a,b)=>a+b,0))}</td></tr>`).join('')
          : `<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:16px">Sin datos reales capturados — usa Flujo de Ingresos para agregar</td></tr>`;
        return `<div class="m-kpi-row">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Real Anual</div><div class="m-kpi-val" style="color:#0073ea">${fmtK(totalAnual)}</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Promedio Mensual</div><div class="m-kpi-val">${fmtK(totalMes)}</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Conceptos</div><div class="m-kpi-val">${salRows.length}</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Ingresos Capturados</div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Prom/Mes</th><th class="r">Total Anual</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
      }
    },
    // ── Salem Costos
    salem_costos_modal:{
      t:'Salem — Costos Directos 2026',s:'Efevoo TPV · Efevoo Tarjetas · SitesPay',
      render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Costo Mensual Total</div><div class="m-kpi-val" style="color:var(--red)">$210K</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Anual Estimado</div><div class="m-kpi-val" style="color:var(--red)">$2.52M</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Mayor Costo</div><div class="m-kpi-val" style="font-size:.85rem">Efevoo Tarjetas</div></div></div>
        <table class="mbt"><thead><tr><th>Concepto</th><th class="r">Ppto/Mes</th><th class="r">% del Total</th><th class="r">Anual Est.</th></tr></thead><tbody>
          <tr><td class="bld">Efevoo — Tarjetas Centum Black</td><td class="mo neg">$110,000</td><td class="mo">52%</td><td class="mo neg">$1,320,000</td></tr>
          <tr><td class="bld">Efevoo — TPV / Terminales</td><td class="mo neg">$100,000</td><td class="mo">48%</td><td class="mo neg">$1,200,000</td></tr>
          <tr><td class="bld">Comisiones SitesPay</td><td class="mo neg">$13,000</td><td class="mo">6%</td><td class="mo neg">$156,000</td></tr>
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td class="mo bld neg">$210,000/mes</td><td class="mo"></td><td class="mo bld neg">$2,520,000/año</td></tr>
        </tbody></table>`
    },
    // ── Salem Gastos Operativos
    salem_gas_modal:{
      t:'Salem — Gastos Operativos 2026',s:'Presupuesto detallado por categoría',
      render:()=>{
        const rows=SAL_GASTOS_ITEMS.map(g=>`<tr><td class="bld">${g.c}</td><td><span style="font-size:.65rem;color:var(--muted)">${g.cat}</span></td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td><td class="mo">${((g.ppto/383000)*100).toFixed(1)}%</td></tr>`).join('');
        return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Total Ppto/Mes</div><div class="m-kpi-val">$383K</div></div><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Anual Est.</div><div class="m-kpi-val">$4.6M</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Mayor Gasto</div><div class="m-kpi-val" style="font-size:.82rem">Nómina $186K</div></div></div>
          <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th><th class="r">% Total</th></tr></thead><tbody>${rows}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">$383,000</td><td class="mo bld neg">$4,596,000</td><td class="mo bld">100%</td></tr>
          </tbody></table>`;
      }
    },
    // ── Salem TPV clientes
    salem_tpv_modal:{
      t:'Salem — Clientes TPV / Terminales',s:'14 terminales activas — Pendiente datos reales',
      render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Terminales</div><div class="m-kpi-val">14</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Costo Efevoo TPV</div><div class="m-kpi-val" style="color:var(--red)">$100K/mes</div></div><div class="m-kpi" style="--ac:var(--muted)"><div class="m-kpi-lbl">Real Capturado</div><div class="m-kpi-val">$0</div></div></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
          ${SAL_TPV_CLIENTES.map((c,i)=>`<div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 13px">
            <div style="font-weight:700;font-size:.78rem;color:#0060b8;margin-bottom:3px">${c}</div>
            <div style="font-size:.65rem;color:var(--muted)">Terminal #${i+1} · Pendiente real</div>
          </div>`).join('')}
        </div>
        <div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 14px;font-size:.75rem;color:#0060b8">
          💡 Para capturar datos reales de TPV, usa la sección <strong>"Ingresar Datos"</strong> del menú lateral.
        </div>`
    },
    // ── Endless cartera modal
    endless_cred_modal:{
      t:'Endless Money — Cartera de Créditos',s:'Crédito Simple · SOFOM regulada CNBV',
      render:()=>{
        const rows=END_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'—'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'—'}</td><td>${spill(c.st)}</td></tr>`}).join('');
        return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#00b875">$3.1M</div></div><div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Ingreso Anual Est.</div><div class="m-kpi-val">$23.2K</div></div><div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$3M</div></div></div>
          <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisión</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
    },
    // ── Endless gastos modal
    endless_gas_modal:{
      t:'Endless — Gastos Operativos 2026',s:'Presupuesto detallado por categoría',
      render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Total Ppto/Mes</div><div class="m-kpi-val">$90K</div></div><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Anual Est.</div><div class="m-kpi-val">$1.08M</div></div><div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Mayor Gasto</div><div class="m-kpi-val" style="font-size:.82rem">Circ. Créd. $17.4K</div></div></div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
          <tr><td class="bld">Nómina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">Nómina</span></td><td class="mo neg">$23,000</td><td class="mo neg">$276,000</td></tr>
          <tr><td class="bld">Círculo de Crédito</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$17,391</td><td class="mo neg">$208,692</td></tr>
          <tr><td class="bld">Icarus Endless</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$16,211</td><td class="mo neg">$194,532</td></tr>
          <tr><td class="bld">Alestra</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$17,391</td><td class="mo neg">$208,692</td></tr>
          <tr><td class="bld">CNBV Endless</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$5,006</td><td class="mo neg">$60,072</td></tr>
          <tr><td class="bld">Renta y Servicios</td><td><span style="font-size:.65rem;color:var(--muted)">Renta</span></td><td class="mo neg">$7,155</td><td class="mo neg">$85,860</td></tr>
          <tr><td class="bld">Otros / Compartidos</td><td><span style="font-size:.65rem;color:var(--muted)">Varios</span></td><td class="mo neg">$4,000</td><td class="mo neg">$48,000</td></tr>
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">$90,154/mes</td><td class="mo bld neg">$1,081,848/año</td></tr>
        </tbody></table>`
    },
    // ── Dynamo cartera modal
    dynamo_cred_modal:{
      t:'Dynamo Finance — Cartera de Créditos',s:'SOFOM regulada CNBV · Alerta cartera vencida',
      render:()=>{
        const rows=DYN_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c);return`<tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'—'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'—'}</td><td>${spill(c.st)}</td></tr>`}).join('');
        return`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">⚠️ <strong>Alerta:</strong> Juan Manuel de la Colina — $2.5M en cartera vencida = 96% de la cartera activa.</div>
          <div class="m-kpi-row"><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#ff7043">$2.6M</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div><div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$2.25M</div></div></div>
          <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisión</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
    },
    // ── Dynamo gastos modal
    dynamo_gas_modal:{
      t:'Dynamo Finance — Gastos Operativos 2026',s:'Presupuesto detallado por categoría',
      render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Total Ppto/Mes</div><div class="m-kpi-val">$90K</div></div><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Anual Est.</div><div class="m-kpi-val">$1.08M</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Mayor Gasto</div><div class="m-kpi-val" style="font-size:.82rem">Circ. Créd. $17.4K</div></div></div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
          <tr><td class="bld">Nómina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">Nómina</span></td><td class="mo neg">$23,000</td><td class="mo neg">$276,000</td></tr>
          <tr><td class="bld">Círculo de Crédito</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$17,391</td><td class="mo neg">$208,692</td></tr>
          <tr><td class="bld">Icarus Dynamo</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$16,211</td><td class="mo neg">$194,532</td></tr>
          <tr><td class="bld">Alestra</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$17,391</td><td class="mo neg">$208,692</td></tr>
          <tr><td class="bld">CNBV Dynamo</td><td><span style="font-size:.65rem;color:var(--muted)">Regulatorio</span></td><td class="mo neg">$5,006</td><td class="mo neg">$60,072</td></tr>
          <tr><td class="bld">Renta y Servicios</td><td><span style="font-size:.65rem;color:var(--muted)">Renta</span></td><td class="mo neg">$7,155</td><td class="mo neg">$85,860</td></tr>
          <tr><td class="bld">Otros / Compartidos</td><td><span style="font-size:.65rem;color:var(--muted)">Varios</span></td><td class="mo neg">$4,000</td><td class="mo neg">$48,000</td></tr>
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">$90,154/mes</td><td class="mo bld neg">$1,081,848/año</td></tr>
        </tbody></table>`
    },
    // ── Ingresos Wirebit
    ingresos:{
      t:'Wirebit — Modelo de Ingresos 2026',s:'5 fuentes · Presupuesto mensual · TC $17.9',
      render:()=>{
        const rows=Object.entries(WB_ING).map(([k,v])=>{
          const tot=sum(v);
          return`<tr><td class="bld">${k}</td>${v.map(x=>`<td class="mo">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(tot)}</td></tr>`;
        }).join('');
        const totRow=`<tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL INGRESOS</td>${WB_ING_TOTAL.map(x=>`<td class="mo bld pos">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(sum(WB_ING_TOTAL))}</td></tr>`;
        const costRows=Object.entries(WB_COSTOS).map(([k,v])=>`<tr><td class="bld" style="padding-left:18px">${k}</td>${v.map(x=>`<td class="mo neg">${x?fmt(x):'—'}</td>`).join('')}<td class="mo neg">${fmt(sum(v))}</td></tr>`).join('');
        const ctotRow=`<tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL COSTOS</td>${WB_COSTO_TOTAL.map(x=>`<td class="mo bld neg">${fmt(x)}</td>`).join('')}<td class="mo bld neg">${fmt(sum(WB_COSTO_TOTAL))}</td></tr>`;
        const mbRow=`<tr style="background:var(--bg)"><td class="bld">MARGEN BRUTO</td>${WB_MARGEN.map(x=>`<td class="mo bld ${x>=0?'pos':'neg'}">${fmt(x)}</td>`).join('')}<td class="mo bld ${sum(WB_MARGEN)>=0?'pos':'neg'}">${fmt(sum(WB_MARGEN))}</td></tr>`;
        return`<div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Concepto</th>${MO.map(m=>`<th class="r">${m}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody>
          <tr class="grp"><td colspan="${MO.length+2}">INGRESOS</td></tr>${rows}${totRow}
          <tr class="grp"><td colspan="${MO.length+2}">COSTOS DIRECTOS</td></tr>${costRows}${ctotRow}
          ${mbRow}</tbody></table></div>`;
      }
    },
    // ── Margen Wirebit
    margen:{
      t:'Wirebit — Margen Bruto 2026',s:'Ingresos vs Costos por mes',
      render:()=>{
        const canv=`<canvas id="m-chart1" height="160" style="margin-bottom:14px"></canvas>`;
        const rows=MO.map((m,i)=>{
          const mg=WB_MARGEN[i],pct=WB_ING_TOTAL[i]?((mg/WB_ING_TOTAL[i])*100).toFixed(1)+'%':'—';
          return`<tr><td class="bld">${m}</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo neg">${fmt(WB_COSTO_TOTAL[i])}</td><td class="mo ${mg>=0?'pos':'neg'}">${fmt(mg)}</td><td class="mo ${mg>=0?'pos':'neg'}">${pct}</td></tr>`;
        }).join('');
        setTimeout(()=>{
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:MO,
            datasets:[
              {label:'Ingresos',data:WB_ING_TOTAL,backgroundColor:'rgba(155,81,224,.25)',borderColor:'#9b51e0',borderWidth:1.5},
              {label:'Costos',data:WB_COSTO_TOTAL,backgroundColor:'rgba(255,112,67,.25)',borderColor:'#ff7043',borderWidth:1.5},
            ]},options:{...cOpts(),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},y:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        },50);
        return canv+`<div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Directos</th><th class="r">Margen Bruto</th><th class="r">% Margen</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    },
    // ── Nómina
    nomina:{
      t:'Nómina Compartida — Distribución 2026',s:'11 empleados · Asignación por empresa',
      render:()=>{
        const rows=NOM.map(e=>{
          const dists=Object.entries(e.dist).filter(([,p])=>p>0).map(([co,p])=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:5px"><span style="width:7px;height:7px;border-radius:50%;background:${{Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'}[co]||'#aaa'};display:inline-block"></span><span style="font-size:.68rem">${co} ${(p*100).toFixed(0)}%</span></span>`).join('');
          return`<tr><td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td><td>${dists}</td><td class="mo">${fmt(e.s*12)}</td></tr>`;
        }).join('');
        const distRows=[{n:'Salem',v:186000,c:'#0073ea'},{n:'Endless',v:23000,c:'#00b875'},{n:'Dynamo',v:23000,c:'#ff7043'},{n:'Wirebit',v:320000,c:'#9b51e0'}]
          .map(d=>`<tr><td class="bld"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:3px;background:${d.c};display:inline-block"></span>${d.n}</span></td><td class="mo pos">${fmt(d.v)}/mes</td><td class="mo pos">${fmt(d.v*12)}/año</td></tr>`).join('');
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Total Mensual</div><div class="m-kpi-val">$552K</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Total Anual</div><div class="m-kpi-val">$6.62M</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Empleados</div><div class="m-kpi-val">11</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Promedio/mes</div><div class="m-kpi-val">$50.2K</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empleado</div>
        <div style="overflow-x:auto;margin-bottom:16px"><table class="mbt"><thead><tr><th>Nombre</th><th>Rol</th><th class="r">Sueldo/Mes</th><th>Distribución</th><th class="r">Anual</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empresa</div>
        <table class="mbt"><thead><tr><th>Empresa</th><th class="r">Mensual</th><th class="r">Anual</th></tr></thead><tbody>${distRows}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld pos">$552K/mes</td><td class="mo bld pos">$6.62M/año</td></tr>
        </tbody></table>`;
      }
    },
    // ── Gastos Compartidos
    gastos_comp_kpi:{
      t:'Gastos Compartidos — Detalle Ene–Ago',s:'18 conceptos · Distribución por empresa',
      render:()=>{
        const monthly=Array(8).fill(0);
        GCOMP.forEach(g=>g.vals.forEach((v,i)=>monthly[i]+=v));
        const catMap={};
        GCOMP.forEach(g=>{catMap[g.cat]=(catMap[g.cat]||0)+sum(g.vals);});
        const catRows=Object.entries(catMap).sort((a,b)=>b[1]-a[1])
          .map(([k,v])=>`<tr><td class="bld">${k}</td><td class="mo neg">${fmt(v)}</td><td class="mo">${((v/sum(Object.values(catMap)))*100).toFixed(1)}%</td></tr>`).join('');
        const rows=GCOMP.map(g=>{
          const tot=sum(g.vals);
          const ents=[g.sal>0?`SAL ${g.sal*100|0}%`:'',g.end>0?`END ${g.end*100|0}%`:'',g.dyn>0?`DYN ${g.dyn*100|0}%`:'',g.wb>0?`WB ${g.wb*100|0}%`:''].filter(Boolean).join(' · ');
          return`<tr><td class="bld">${g.c}</td><td style="color:var(--muted);font-size:.72rem">${g.cat}</td><td style="font-size:.7rem;color:var(--text2)">${ents}</td>${g.vals.map(v=>`<td class="mo neg">${v?fmt(v):'—'}</td>`).join('')}<td class="mo bld neg">${fmt(tot)}</td></tr>`;
        }).join('');
        return`<div class="m-kpi-row">
          <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Acumulado Ene–Ago</div><div class="m-kpi-val" style="color:var(--orange)">$5.32M</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Mayor Categoría</div><div class="m-kpi-val" style="font-size:.85rem">Costo Directo</div></div>
          <div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Ppto/Mes Promedio</div><div class="m-kpi-val">$665K</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Categoría</div>
        <div style="overflow-x:auto;margin-bottom:16px"><table class="mbt"><thead><tr><th>Categoría</th><th class="r">Total</th><th class="r">% del Total</th></tr></thead><tbody>${catRows}</tbody></table></div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Detalle por Concepto</div>
        <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Concepto</th><th>Cat.</th><th>Distribución</th>${MO.slice(0,8).map(m=>`<th class="r">${m}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    },
    // ── Salem detalle
    salem_kpi:{
      t:'Salem Internacional — Resumen Ejecutivo',s:'TPV · Fondeo Tarjetas Centum Black',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Gasto Ppto/Mes</div><div class="m-kpi-val" style="color:#0073ea">$383K</div></div>
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Clientes TPV</div><div class="m-kpi-val">14</div></div>
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Nómina Asignada</div><div class="m-kpi-val">$186K/mes</div></div>
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Mayor Costo</div><div class="m-kpi-val" style="font-size:.82rem">Efevoo Tarjetas $110K</div></div>
      </div>
      <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Clientes TPV</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
        ${SAL_TPV_CLIENTES.map(c=>`<div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:6px;padding:6px 10px;font-size:.75rem;font-weight:600;color:#0060b8">${c}</div>`).join('')}
      </div>
      <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Gastos Clave</div>
      <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
        ${SAL_GASTOS_ITEMS.map(g=>`<tr><td class="bld">${g.c}</td><td style="color:var(--muted);font-size:.75rem">${g.cat}</td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td></tr>`).join('')}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">$383K/mes</td><td class="mo bld neg">$4.6M/año</td></tr>
      </tbody></table>
      <div style="margin-top:12px;text-align:right"><button class="btn btn-blue" onclick="closeModal();navTo('sal_res')" style="font-size:.73rem">Ver P&L completo →</button></div>`
    },
    // ── Endless detalle
    endless_kpi:{
      t:'Endless Money — Resumen Ejecutivo',s:'Crédito Simple · Tarjetas Centum Blue · SOFOM CNBV',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#00b875">$3.1M</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Ingreso Anual Est.</div><div class="m-kpi-val">$23.2K</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Nómina Asignada</div><div class="m-kpi-val">$23K/mes</div></div>
        <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$3M</div></div>
      </div>
      <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Cartera de Créditos</div>
      <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisión</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
        ${END_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c),sp=spill(c.st);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'—'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'—'}</td><td>${sp}</td></tr>`;}).join('')}
      </tbody></table>
      <div style="margin-top:12px;text-align:right"><button class="btn btn-green" onclick="closeModal();navTo('end_res')" style="font-size:.73rem">Ver P&L completo →</button></div>`
    },
    // ── Dynamo detalle
    dynamo_kpi:{
      t:'Dynamo Finance — Resumen Ejecutivo',s:'Crédito Simple · SOFOM regulada CNBV',
      render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#ff7043">$2.6M</div></div>
        <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Nómina Asignada</div><div class="m-kpi-val">$23K/mes</div></div>
        <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$2.25M</div></div>
      </div>
      <div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:var(--red)">
        ⚠️ <strong>Alerta:</strong> Juan Manuel de la Colina — $2.5M en cartera vencida. Representa el 96% de la cartera activa de Dynamo.
      </div>
      <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Cartera de Créditos</div>
      <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisión</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
        ${DYN_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c),sp=spill(c.st);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'—'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'—'}</td><td>${sp}</td></tr>`;}).join('')}
      </tbody></table>
      <div style="margin-top:12px;text-align:right"><button class="btn btn-out" style="border-color:#ff7043;color:#ff7043;font-size:.73rem" onclick="closeModal();navTo('dyn_res')">Ver P&L completo →</button></div>`
    },
    // ── Wirebit detalle
    wirebit_kpi:{
      t:'Wirebit — Resumen Ejecutivo 2026',s:'Exchange · VEX · OTC · Tarjetas Cripto',
      render:()=>{
        const canv=`<canvas id="m-chart1" height="140" style="margin-bottom:14px"></canvas>`;
        setTimeout(()=>{
          dc('m-chart1');
          const datasets=Object.entries(WB_ING).map(([k,v],i)=>({label:k.replace('Fees ',''),data:v,backgroundColor:['rgba(155,81,224,.6)','rgba(0,115,234,.6)','rgba(0,184,117,.6)','rgba(255,112,67,.6)','rgba(255,160,0,.6)'][i],borderWidth:0,stack:'s'}));
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:MO,datasets},
            options:{...cOpts(),plugins:{legend:{labels:{color:'#444669',font:{size:10},boxWidth:8,padding:8}}},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        },50);
        const rows=MO.map((m,i)=>`<tr><td class="bld">${m}</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo neg">${fmt(WB_COSTO_TOTAL[i])}</td><td class="mo neg">${fmt(WB_NOM_TOTAL[i])}</td><td class="mo ${(WB_MARGEN[i]-WB_NOM_TOTAL[i])>=0?'pos':'neg'}">${fmt(WB_MARGEN[i]-WB_NOM_TOTAL[i])}</td></tr>`).join('');
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Ingresos Anuales</div><div class="m-kpi-val" style="color:#9b51e0">$1.29M</div></div>
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Inicio → Fin</div><div class="m-kpi-val" style="font-size:.9rem">$58K → $179K</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">EBITDA Anual Est.</div><div class="m-kpi-val" style="color:var(--red);font-size:.88rem">Negativo</div></div>
          <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Nómina Anual WB</div><div class="m-kpi-val">$4.1M</div></div>
        </div>
        ${canv}
        <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Directos</th><th class="r">Nómina</th><th class="r">EBITDA</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="margin-top:12px;text-align:right"><button class="btn btn-blue" onclick="closeModal();navTo('wb_res')" style="font-size:.73rem;background:#9b51e0;border-color:#9b51e0">Ver P&L completo →</button></div>`;
      }
    },
    // ── WB Ingresos chart
    wb_ingresos_chart:{
      t:'Wirebit — Ingresos vs Costos Detallado',s:'Presupuesto mensual 2026',
      render:()=>{
        const canv=`<canvas id="m-chart1" height="200" style="margin-bottom:16px"></canvas>`;
        setTimeout(()=>{
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'line',data:{labels:MO,datasets:[
            {label:'Total Ingresos',data:WB_ING_TOTAL,borderColor:'#9b51e0',backgroundColor:'rgba(155,81,224,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:2.5},
            {label:'Costos Directos',data:WB_COSTO_TOTAL,borderColor:'#ff7043',backgroundColor:'rgba(255,112,67,.06)',fill:true,tension:.4,pointRadius:4,borderWidth:2},
            {label:'Nómina WB',data:WB_NOM_TOTAL,borderColor:'#0073ea',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[5,3]},
          ]},options:cOpts()});
        },50);
        const rows=MO.map((m,i)=>{
          const mg=WB_MARGEN[i],ebitda=mg-WB_NOM_TOTAL[i];
          return`<tr><td class="bld">${m}</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo neg">${fmt(WB_COSTO_TOTAL[i])}</td><td class="mo ${mg>=0?'pos':'neg'}">${fmt(mg)}</td><td class="mo neg">${fmt(WB_NOM_TOTAL[i])}</td><td class="mo ${ebitda>=0?'pos':'neg'}">${fmt(ebitda)}</td></tr>`;
        }).join('');
        return canv+`<div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Dir.</th><th class="r">Margen Bruto</th><th class="r">Nómina</th><th class="r">EBITDA</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    },
    // ── WB Fuentes chart
    wb_fuentes_chart:{
      t:'Wirebit — Mix de Ingresos por Fuente',s:'Distribución anual presupuestada 2026',
      render:()=>{
        const canv=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px"><canvas id="m-chart1" height="220"></canvas><canvas id="m-chart2" height="220"></canvas></div>`;
        setTimeout(()=>{
          const wbAnn=Object.entries(WB_ING).map(([k,v])=>[k,sum(v)]);
          const cols=['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(255,160,0,.7)'];
          const bcs=['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'];
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'doughnut',data:{labels:wbAnn.map(x=>x[0].replace('Fees ','')),datasets:[{data:wbAnn.map(x=>x[1]),backgroundColor:cols,borderColor:bcs,borderWidth:2}]},
            options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:10},boxWidth:9,padding:8}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/sum(wbAnn.map(x=>x[1])))*100).toFixed(1)}%)`}}},cutout:'55%',scales:{x:{display:false},y:{display:false}}}});
          dc('m-chart2');
          CH['m-chart2']=new Chart(document.getElementById('m-chart2'),{type:'bar',data:{labels:MO,
            datasets:Object.entries(WB_ING).map(([k,v],i)=>({label:k.replace('Fees ',''),data:v,backgroundColor:cols[i],borderWidth:0,stack:'s'}))},
            options:{...cOpts(),plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        },50);
        const rows=Object.entries(WB_ING).map(([k,v],i)=>{
          const tot=sum(v),pct=((tot/sum(WB_ING_TOTAL))*100).toFixed(1);
          return`<tr><td class="bld"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:3px;background:${['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'][i]};display:inline-block"></span>${k}</span></td>${v.map(x=>`<td class="mo pos">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(tot)}</td><td class="mo">${pct}%</td></tr>`;
        }).join('');
        return canv+`<div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Fuente</th>${MO.map(m=>`<th class="r">${m}</th>`).join('')}<th class="r">Total</th><th class="r">%</th></tr></thead><tbody>${rows}<tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td>${WB_ING_TOTAL.map(x=>`<td class="mo bld pos">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(sum(WB_ING_TOTAL))}</td><td class="mo bld">100%</td></tr></tbody></table></div>`;
      }
    },
  };

  const cfg=configs[id];
  if(!cfg){console.warn('Modal no definido:',id);return;}
  title.textContent=cfg.t;
  sub.textContent=cfg.s||'';
  body.innerHTML=cfg.render();
  bg.style.opacity='1';bg.style.pointerEvents='all';
  box.style.transform='translateY(0)';
  if(cfg.afterRender) setTimeout(cfg.afterRender, 80);
}

function closeModal(){
  const bg=document.getElementById('modal-bg');
  const box=document.getElementById('modal-box');
  dc('m-chart1');dc('m-chart2');
  bg.style.opacity='0';bg.style.pointerEvents='none';
  box.style.transform='translateY(8px)';
}

document.getElementById('modal-bg').addEventListener('click',function(e){
  if(e.target===this) closeModal();
});

function spill(st){
  if(st==='Activo') return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--green-lt);color:#007a48">Activo</span>`;
  if(st.includes('VENCIDO')) return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--red-lt);color:#b02020">⚠ VENCIDO</span>`;
  return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--yellow-lt);color:#7a6000">Prospecto</span>`;
}

// ═══════════════════════════════════════
