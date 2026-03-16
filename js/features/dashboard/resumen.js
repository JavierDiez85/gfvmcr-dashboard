// GF — Dashboard: Resumen
(function(window) {
  'use strict';

// ═══════════════════════════════════════
// DASHBOARD GRUPO — Sección 2 & 3
// ═══════════════════════════════════════
let _edoMode = 'mensual';
let _dashMode = 'mensual';

function rResumen(){
  // NOTE: _syncAll() is called by the router before rResumen().
  // This ensures wbLoadFees + fiLoad + fgLoad + fiInjectTPV + fiInjectCredits + syncFlujoToRecs
  // are all executed, so S.recs contains ALL data (TPV, créditos, Wirebit fees, flujos).

  const entKeys = ['Salem','Endless','Dynamo','Wirebit','Stellaris'];
  const entC    = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0',Stellaris:'#e53935'};
  const entCBg  = {Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)',Stellaris:'rgba(229,57,53,.22)'};

  // ── Ingresos por empresa desde S.recs ──
  const ingByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0),Stellaris:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.yr==_year).forEach(r=>{
      if(ingByEnt[r.ent]) r.vals.forEach((v,i)=> ingByEnt[r.ent][i] += (v||0));
    });
  } catch(e){}

  // ── Gastos por empresa desde S.recs ──
  const gasByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0),Stellaris:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.yr==_year).forEach(r=>{
      if(gasByEnt[r.ent]) r.vals.forEach((v,i)=> gasByEnt[r.ent][i] += (v||0));
    });
  } catch(e){}

  // ── Nómina mensual por empresa (siempre disponible desde NOM_EDIT) ──
  const nomByEnt = {Salem:0,Endless:0,Dynamo:0,Wirebit:0,Stellaris:0};
  try {
    NOM_EDIT.forEach(n=>{
      nomByEnt.Salem   += n.s*(n.sal||0)/100;
      nomByEnt.Endless += n.s*(n.end||0)/100;
      nomByEnt.Dynamo  += n.s*(n.dyn||0)/100;
      nomByEnt.Wirebit += n.s*(n.wb||0)/100;
      nomByEnt.Stellaris += n.s*(n.stel||0)/100;
    });
  } catch(e){ nomByEnt.Salem=186000;nomByEnt.Endless=23000;nomByEnt.Dynamo=23000;nomByEnt.Wirebit=320000;nomByEnt.Stellaris=0; }
  const nomTotal = Object.values(nomByEnt).reduce((a,b)=>a+b,0);

  // ── Totales anuales ──
  const ingTot = {}, gasTot = {}, gasOnlyTot = {};
  entKeys.forEach(e=>{
    ingTot[e] = ingByEnt[e].reduce((a,b)=>a+b,0);
    gasOnlyTot[e] = gasByEnt[e].reduce((a,b)=>a+b,0);      // gastos capturados SIN nómina
    gasTot[e] = gasOnlyTot[e] + nomByEnt[e]*12;              // total con nómina (para margen, KPIs)
  });
  const ingGrupo      = Object.values(ingTot).reduce((a,b)=>a+b,0);
  const gasOnlyGrupo  = Object.values(gasOnlyTot).reduce((a,b)=>a+b,0);
  const gasGrupo      = Object.values(gasTot).reduce((a,b)=>a+b,0);   // con nómina (para margen)
  const margenGrupo   = ingGrupo - gasGrupo;

  // ── KPI cards ──
  const q = id => document.getElementById(id);

  // Ingresos
  const elIng = q('dash-kpi-ing');
  if(elIng){
    elIng.textContent = fmtK(ingGrupo);
    elIng.style.color = 'var(--green)';
    const sub = entKeys.filter(e=>ingTot[e]>0).map(e=>e.slice(0,3)+' '+fmtK(ingTot[e])).join('  ');
    if(q('dash-kpi-ing-sub')) q('dash-kpi-ing-sub').textContent = sub || 'Sin ingresos registrados';
    if(q('dash-kpi-ing-sub')) q('dash-kpi-ing-sub').className = 'kpi-d dnu';
    if(q('dash-bar-ing')) q('dash-bar-ing').style.width = Math.min(100, Math.round(ingGrupo/Math.max(ingGrupo,gasGrupo,1)*100))+'%';
  }

  // Gastos
  const elGas = q('dash-kpi-gas');
  if(elGas){
    elGas.textContent = fmtK(gasOnlyGrupo);
    elGas.style.color = 'var(--orange)';
    if(q('dash-kpi-gas-sub')) q('dash-kpi-gas-sub').textContent = gasOnlyGrupo > 0 ? 'Sin nómina · ver detalle →' : 'Sin gastos capturados';
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

    // Period columns for charts (exclude "Total" column from chart — only show breakdown)
    const {cols: _allCols, colLabels: _allLabels} = periodColumns(_dashMode);
    const isTotal = l => l.startsWith('Total');
    const chartCols   = _allCols.filter((_,i)=>!isTotal(_allLabels[i]));
    const chartLabels = _allLabels.filter(l=>!isTotal(l));

    // Gráfica 1 — Ingresos por empresa
    dc('cdashi');
    const ingMoTotal = Array(12).fill(0);
    entKeys.forEach(e=>ingByEnt[e].forEach((v,i)=>ingMoTotal[i]+=v));
    const hasMonthly = ingMoTotal.some(v=>v>0);
    const c1 = q('c-dash-ing'); if(!c1) return;

    if(hasMonthly){
      const ingAgg = {};
      entKeys.filter(e=>ingTot[e]>0).forEach(e=>{
        ingAgg[e] = chartCols.map(idxs=>colVal(ingByEnt[e],idxs));
      });
      CH['cdashi'] = new Chart(c1,{type:'bar',data:{labels:chartLabels,
        datasets:Object.keys(ingAgg).map(e=>({label:e,data:ingAgg[e],backgroundColor:entCBg[e],borderColor:entC[e],borderWidth:1.5}))
      },options:cOpts({scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:tK}}}})});
      const modeLabel = _dashMode==='trimestral'?'Trimestral':_dashMode==='anual'?'Anual':'Mensual';
      if(q('dash-c1-sub')) q('dash-c1-sub').textContent=modeLabel+' · por empresa';
    } else {
      const ann = entKeys.map(e=>({e,v:ingTot[e]}));
      CH['cdashi'] = new Chart(c1,{type:'doughnut',data:{
        labels:ann.map(d=>d.e),
        datasets:[{data:ann.map(d=>d.v),backgroundColor:ann.map(d=>entCBg[d.e]),borderColor:ann.map(d=>entC[d.e]),borderWidth:1.5}]
      },options:{...cOp,plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:8,padding:4}},tooltip:tip},cutout:'58%',scales:noAx}});
      if(q('dash-c1-sub')) q('dash-c1-sub').textContent='Anual · por empresa';
    }

    // Gráfica 2 — Gastos por empresa (donut) — siempre anual
    dc('cdashg');
    const c2 = q('c-dash-gas'); if(!c2) return;
    const gasAnn = entKeys.map(e=>({e,v:gasOnlyTot[e]}));
    CH['cdashg'] = new Chart(c2,{type:'doughnut',data:{
      labels:gasAnn.map(d=>d.e),
      datasets:[{data:gasAnn.map(d=>d.v),backgroundColor:gasAnn.map(d=>entCBg[d.e]),borderColor:gasAnn.map(d=>entC[d.e]),borderWidth:1.5}]
    },options:{...cOp,plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:8,padding:4}},tooltip:tip},cutout:'58%',scales:noAx}});

    // Gráfica 3 — Nómina por empresa (barras) — respeta período
    dc('cdashnom');
    const c3 = q('c-dash-nom'); if(!c3) return;
    const nomMult = _dashMode==='anual'?12:_dashMode==='trimestral'?3:1;
    const nomLabel = _dashMode==='anual'?'Anual':_dashMode==='trimestral'?'Trimestral':'Mensual';
    CH['cdashnom'] = new Chart(c3,{type:'bar',data:{
      labels:entKeys,
      datasets:[{data:entKeys.map(e=>nomByEnt[e]*nomMult),backgroundColor:entKeys.map(e=>entCBg[e]),borderColor:entKeys.map(e=>entC[e]),borderWidth:1.5,borderRadius:4}]
    },options:cOpts({plugins:{legend:{display:false}},scales:{
      x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},
      y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:tK}}
    }})});

    // Gráfica 4 — Margen por empresa (barras horizontales) — siempre anual
    dc('cdashm');
    const c4 = q('c-dash-margen'); if(!c4) return;
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

function setEDO(mode, btn){
  _edoMode = mode;
  btn.closest('.pbar').querySelectorAll('.pbtn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  rEDO();
}

function setDashMode(mode, btn){
  _dashMode = mode;
  // Sync per-entity P&L mode so topbar M/T/A works on all views
  if(typeof _plMode !== 'undefined') Object.keys(_plMode).forEach(k => _plMode[k] = mode);
  btn.closest('.pbar').querySelectorAll('.pbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render(_currentView);
}

function setYear(yr, btn){
  _year = yr;
  btn.closest('.pbar').querySelectorAll('.pbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _updateYearLabels();
  render(_currentView);
}

// Update static "20XX" labels in HTML view titles, sidebar, etc.
function _updateYearLabels(){
  document.title = 'Grupo Financiero — Dashboard ' + _year;
  const yr = String(_year);
  const sels = 'div[style*="Poppins"][style*="font-weight:700"], .tw-ht, .cc-t, .sb-sub-title, .si';
  document.querySelectorAll(sels).forEach(el => {
    if(el.children.length === 0 && /\b20[2-9]\d\b/.test(el.textContent)){
      el.textContent = el.textContent.replace(/\b20[2-9]\d\b/g, yr);
    }
  });
  // Also update KPI sub-labels that reference year
  document.querySelectorAll('.kpi-d').forEach(el => {
    if(el.children.length === 0 && /\b20[2-9]\d\b/.test(el.textContent)){
      el.textContent = el.textContent.replace(/\b20[2-9]\d\b/g, yr);
    }
  });
}

function rEntSummary(){
  const el = document.getElementById('dash-ent-summary');
  if(!el) return;

  const entC   = {Salem:'#0073ea', Endless:'#00b875', Dynamo:'#ff7043', Wirebit:'#9b51e0'};
  const entBg  = {Salem:'var(--blue-bg)', Endless:'var(--green-bg)', Dynamo:'var(--orange-bg)', Wirebit:'var(--purple-bg)'};
  const entIco = {Salem:'💳', Endless:'🏦', Dynamo:'🏦', Wirebit:'⛓', Stellaris:'🔴'};
  const entNav = {Salem:"navTo('sal_res')", Endless:"navTo('end_res')", Dynamo:"navTo('dyn_res')", Wirebit:"navTo('wb_res')", Stellaris:"navTo('stel_res')"};

  const cards = ['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e => {
    const ing  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+sum(r.vals),0);
    const gas  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+sum(r.vals),0);
    const nom  = NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:e==='Stellaris'?n.stel:n.wb)||0)/100,0)*12;
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
  fiInjectTPV();
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

  // Collapse months based on mode (shared utility)
  const {cols, colLabels} = periodColumns(_edoMode);

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

  // Expose globals
  window.rResumen = rResumen;
  window.setEDO = setEDO;
  window.setDashMode = setDashMode;
  window.setYear = setYear;
  window._updateYearLabels = _updateYearLabels;
  window.rEntSummary = rEntSummary;
  window.rEDO = rEDO;

  // Register views
  if(typeof registerView === 'function'){
    registerView('resumen', function(){ return _syncAll().then(function(){ rResumen(); }); });
  }

})(window);
