// GFVMCR — Finanzas: P&L, nómina, gastos compartidos

// RENDER: NOMINA
// ═══════════════════════════════════════
// ── ESTADO EDITABLE DE NÓMINA (en memoria) ──
let NOM_EDIT = NOM.map(e=>({n:e.n,r:e.r,s:e.s,tipo:e.tipo||'Administrativo',sal:Math.round(e.dist.Salem*100),end:Math.round(e.dist.Endless*100),dyn:Math.round(e.dist.Dynamo*100),wb:Math.round(e.dist.Wirebit*100)}));

const _nomDist = (e,n) => n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100;
const nomMesTotal = e => NOM_EDIT.reduce((a,n)=>a+_nomDist(e,n),0);
const nomMesOp    = e => NOM_EDIT.filter(n=>n.tipo==='Operativo').reduce((a,n)=>a+_nomDist(e,n),0);
const nomMesAdm   = e => NOM_EDIT.filter(n=>n.tipo==='Administrativo').reduce((a,n)=>a+_nomDist(e,n),0);

function nomCalcTotals(){
  let ts=0,te=0,td=0,tw=0,tot=0;
  NOM_EDIT.forEach(e=>{
    ts+=e.s*(e.sal/100); te+=e.s*(e.end/100); td+=e.s*(e.dyn/100); tw+=e.s*(e.wb/100); tot+=e.s;
  });
  return{ts,te,td,tw,tot};
}

function nomUpdateFooter(){
  const {ts,te,td,tw,tot}=nomCalcTotals();
  const q=id=>document.getElementById(id);
  q('nom-ft-total').textContent=fmt(tot);
  q('nom-ft-sal').textContent=fmt(ts);
  q('nom-ft-end').textContent=fmt(te);
  q('nom-ft-dyn').textContent=fmt(td);
  q('nom-ft-wb').textContent=fmt(tw);
  // KPI cards
  q('nom-kpi-total').textContent=fmtK(tot);
  q('nom-kpi-emp').textContent=NOM_EDIT.length+' empleados';
  q('nom-kpi-sal').textContent=fmtK(ts);
  q('nom-kpi-end').textContent=fmtK(te);
  q('nom-kpi-dyn').textContent=fmtK(td);
  q('nom-kpi-wb').textContent=fmtK(tw);
  // avg % cols
  const n=NOM_EDIT.length||1;
  const as=NOM_EDIT.reduce((a,e)=>a+e.sal,0)/n;
  const ae=NOM_EDIT.reduce((a,e)=>a+e.end,0)/n;
  const ad=NOM_EDIT.reduce((a,e)=>a+e.dyn,0)/n;
  const aw=NOM_EDIT.reduce((a,e)=>a+e.wb,0)/n;
  q('nom-ft-sal-p').textContent=as.toFixed(1)+'% avg';
  q('nom-ft-end-p').textContent=ae.toFixed(1)+'% avg';
  q('nom-ft-dyn-p').textContent=ad.toFixed(1)+'% avg';
  q('nom-ft-wb-p').textContent=aw.toFixed(1)+'% avg';
  // propagate to NOM global
  NOM_EDIT.forEach((e,i)=>{
    if(NOM[i]){NOM[i].s=e.s;NOM[i].dist={Salem:e.sal/100,Endless:e.end/100,Dynamo:e.dyn/100,Wirebit:e.wb/100};}
  });
}

function nomRenderRow(e,i){
  const tot=e.sal+e.end+e.dyn+e.wb;
  const ok=tot===100;
  const totCls=ok?'pos':'neg';
  const inStyle='style="width:100%;border:none;background:transparent;text-align:right;font-size:.78rem;font-family:inherit;color:inherit;padding:0"';
  const tipoColor = e.tipo==='Operativo' ? '#0073ea' : '#9b51e0';
  return`<tr id="nom-row-${i}">
    <td><input ${inStyle} value="${e.n}" onchange="NOM_EDIT[${i}].n=this.value" style="text-align:left;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit"></td>
    <td><input ${inStyle} value="${e.r}" onchange="NOM_EDIT[${i}].r=this.value" style="text-align:left;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;color:var(--muted)"></td>
    <td style="padding:2px 6px">
      <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.72rem;padding:2px 4px;background:var(--bg);color:${tipoColor};font-weight:600"
        onchange="NOM_EDIT[${i}].tipo=this.value;nomRefreshRow(${i})">
        <option${e.tipo==='Operativo'?' selected':''}>Operativo</option>
        <option${e.tipo==='Administrativo'?' selected':''}>Administrativo</option>
      </select>
    </td>
    <td><input type="number" ${inStyle} value="${e.s}" min="0" step="1000" onchange="NOM_EDIT[${i}].s=+this.value;nomUpdateFooter()" style="text-align:right;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;font-weight:600;color:var(--green)"></td>
    <td style="background:rgba(0,115,234,.05)"><input type="number" ${inStyle} value="${e.sal}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].sal=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#0073ea;font-weight:600"></td>
    <td style="background:rgba(0,184,117,.05)"><input type="number" ${inStyle} value="${e.end}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].end=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#00b875;font-weight:600"></td>
    <td style="background:rgba(255,112,67,.05)"><input type="number" ${inStyle} value="${e.dyn}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].dyn=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#ff7043;font-weight:600"></td>
    <td style="background:rgba(155,81,224,.05)"><input type="number" ${inStyle} value="${e.wb}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].wb=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#9b51e0;font-weight:600"></td>
    <td class="mo ${totCls}" style="font-weight:700" id="nom-tot-${i}">${tot}%</td>
    <td class="mo" style="color:#0073ea">${fmt(e.s*(e.sal/100))}</td>
    <td class="mo" style="color:#00b875">${fmt(e.s*(e.end/100))}</td>
    <td class="mo" style="color:#ff7043">${fmt(e.s*(e.dyn/100))}</td>
    <td class="mo" style="color:#9b51e0">${fmt(e.s*(e.wb/100))}</td>
    <td style="text-align:center"><button onclick="nomDelRow(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;padding:2px 5px" title="Eliminar">✕</button></td>
  </tr>`;
}

function nomRefreshRow(i){
  const e=NOM_EDIT[i];
  const tot=e.sal+e.end+e.dyn+e.wb;
  const ok=tot===100;
  const el=document.getElementById('nom-tot-'+i);
  if(el){el.textContent=tot+'%';el.className='mo '+(ok?'pos':'neg');el.style.fontWeight='700';}
  // refresh calculated cells
  const row=document.getElementById('nom-row-'+i);
  if(row){
    const tds=row.querySelectorAll('td');
    tds[8].textContent=fmt(e.s*(e.sal/100));
    tds[9].textContent=fmt(e.s*(e.end/100));
    tds[10].textContent=fmt(e.s*(e.dyn/100));
    tds[11].textContent=fmt(e.s*(e.wb/100));
  }
  nomUpdateFooter();
}

function nomAddRow(){
  NOM_EDIT.push({n:'Nuevo empleado',r:'Rol',s:0,tipo:'Administrativo',sal:100,end:0,dyn:0,wb:0});
  rNomina();
}

function nomDelRow(i){
  NOM_EDIT.splice(i,1);
  rNomina();
}

function nomSave(){
  // propagate to NOM global so P&Ls update
  nomUpdateFooter();
  const btn=event.target;
  btn.textContent='✅ Guardado';
  setTimeout(()=>btn.textContent='💾 Guardar',1500);
}

function fmtK(v){
  if(Math.abs(v)>=1000000) return'$'+(v/1000000).toFixed(2)+'M';
  if(Math.abs(v)>=1000) return'$'+(v/1000).toFixed(1)+'K';
  return'$'+Math.round(v).toLocaleString();
}

function rNomina(){
  const tbody=document.getElementById('nom-edit-tbody');
  if(!tbody) return;
  tbody.innerHTML=NOM_EDIT.map((e,i)=>nomRenderRow(e,i)).join('');
  nomUpdateFooter();
}

// ═══════════════════════════════════════
// RENDER: GASTOS COMPARTIDOS (config)
// ═══════════════════════════════════════
// ── ESTADO EDITABLE DE GASTOS COMPARTIDOS ──
let GC_EDIT = GCOMP.map(g=>({c:g.c,cat:g.cat,ppto:g.ppto||0,sal:Math.round(g.sal*100),end:Math.round(g.end*100),dyn:Math.round(g.dyn*100),wb:Math.round(g.wb*100)}));

function gcUpdateKPIs(){
  const n=GC_EDIT.length;
  document.getElementById('gc-kpi-n').textContent=n;
  const as=(GC_EDIT.reduce((a,g)=>a+g.sal,0)/n).toFixed(0);
  const ae=(GC_EDIT.reduce((a,g)=>a+g.end,0)/n).toFixed(0);
  const ad=(GC_EDIT.reduce((a,g)=>a+g.dyn,0)/n).toFixed(0);
  const aw=(GC_EDIT.reduce((a,g)=>a+g.wb,0)/n).toFixed(0);
  document.getElementById('gc-kpi-sal').textContent=as+'%';
  document.getElementById('gc-kpi-end').textContent=ae+'%';
  document.getElementById('gc-kpi-dyn').textContent=ad+'%';
  document.getElementById('gc-kpi-wb').textContent=aw+'%';
  // Sync to GCOMP global
  GC_EDIT.forEach((g,i)=>{
    if(GCOMP[i]){GCOMP[i].sal=g.sal/100;GCOMP[i].end=g.end/100;GCOMP[i].dyn=g.dyn/100;GCOMP[i].wb=g.wb/100;GCOMP[i].ppto=g.ppto;}
    else{GCOMP.push({c:g.c,cat:g.cat,ppto:g.ppto,sal:g.sal/100,end:g.end/100,dyn:g.dyn/100,wb:g.wb/100,vals:Array(8).fill(0)});}
  });
  gcUpdatePreview();
}

function gcUpdatePreview(){
  // Show how captured real gastos would be distributed
  const tbody=document.getElementById('gc-preview-tbody');
  if(!tbody) return;
  const realGastos=GCOMP.filter(g=>sum(g.vals)>0);
  if(!realGastos.length){tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--muted);font-size:.75rem">No hay datos reales capturados aún. Sube gastos en "Ingresar Datos".</td></tr>`;return;}
  let totS=0,totE=0,totD=0,totW=0,totT=0;
  tbody.innerHTML=realGastos.map(g=>{
    const t=sum(g.vals),s=t*g.sal,e=t*g.end,d=t*g.dyn,w=t*g.wb;
    totS+=s;totE+=e;totD+=d;totW+=w;totT+=t;
    return`<tr><td class="bld">${g.c}</td><td><span class="pill" style="background:#f3eafd;color:#7a2eb8;font-size:.62rem">${g.cat}</span></td>
      <td class="mo" style="color:#0073ea">${s>0?fmt(s):'—'}</td><td class="mo" style="color:#00b875">${e>0?fmt(e):'—'}</td>
      <td class="mo" style="color:#ff7043">${d>0?fmt(d):'—'}</td><td class="mo" style="color:#9b51e0">${w>0?fmt(w):'—'}</td>
      <td class="mo bld">${fmt(t)}</td></tr>`;
  }).join('');
  tbody.innerHTML+=`<tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL</td><td></td>
    <td class="mo bld" style="color:#0073ea">${fmt(totS)}</td><td class="mo bld" style="color:#00b875">${fmt(totE)}</td>
    <td class="mo bld" style="color:#ff7043">${fmt(totD)}</td><td class="mo bld" style="color:#9b51e0">${fmt(totW)}</td>
    <td class="mo bld">${fmt(totT)}</td></tr>`;
}

const CAT_OPTIONS=['Administrativo','Renta','Costo Directo','Marketing','Representación','Operaciones','Com. Bancarias','Regulatorio','Varios'];

function gcRenderRow(g,i){
  const tot=g.sal+g.end+g.dyn+g.wb;
  const ok=tot===100;
  const inS='style="width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;padding:0"';
  const catOpts=CAT_OPTIONS.map(c=>`<option${c===g.cat?' selected':''}>${c}</option>`).join('');
  return`<tr id="gc-row-${i}">
    <td><input ${inS} value="${g.c}" onchange="GC_EDIT[${i}].c=this.value;gcUpdateKPIs()"></td>
    <td><select onchange="GC_EDIT[${i}].cat=this.value;gcUpdateKPIs()" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:3px 4px;background:var(--bg)">${catOpts}</select></td>
    <td><input type="number" ${inS} value="${g.ppto||0}" min="0" step="1000" onchange="GC_EDIT[${i}].ppto=+this.value;gcUpdateKPIs()" style="text-align:right;color:var(--text);font-weight:500"></td>
    <td style="background:rgba(0,115,234,.05)"><input type="number" ${inS} value="${g.sal}" min="0" max="100" step="5" onchange="GC_EDIT[${i}].sal=+this.value;gcRefreshRow(${i})" style="text-align:right;color:#0073ea;font-weight:600"></td>
    <td style="background:rgba(0,184,117,.05)"><input type="number" ${inS} value="${g.end}" min="0" max="100" step="5" onchange="GC_EDIT[${i}].end=+this.value;gcRefreshRow(${i})" style="text-align:right;color:#00b875;font-weight:600"></td>
    <td style="background:rgba(255,112,67,.05)"><input type="number" ${inS} value="${g.dyn}" min="0" max="100" step="5" onchange="GC_EDIT[${i}].dyn=+this.value;gcRefreshRow(${i})" style="text-align:right;color:#ff7043;font-weight:600"></td>
    <td style="background:rgba(155,81,224,.05)"><input type="number" ${inS} value="${g.wb}" min="0" max="100" step="5" onchange="GC_EDIT[${i}].wb=+this.value;gcRefreshRow(${i})" style="text-align:right;color:#9b51e0;font-weight:600"></td>
    <td class="mo ${ok?'pos':'neg'}" style="font-weight:700" id="gc-tot-${i}">${tot}%</td>
    <td style="text-align:center"><button onclick="gcDelRow(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;padding:2px 5px" title="Eliminar">✕</button></td>
  </tr>`;
}

function gcRefreshRow(i){
  const g=GC_EDIT[i];
  const tot=g.sal+g.end+g.dyn+g.wb;
  const el=document.getElementById('gc-tot-'+i);
  if(el){el.textContent=tot+'%';el.className='mo '+(tot===100?'pos':'neg');el.style.fontWeight='700';}
  gcUpdateKPIs();
}

function gcAddRow(){
  GC_EDIT.push({c:'Nuevo concepto',cat:'Varios',ppto:0,sal:25,end:25,dyn:25,wb:25});
  rGastosComp();
}

function gcDelRow(i){
  GC_EDIT.splice(i,1);
  if(i<GCOMP.length) GCOMP.splice(i,1);
  rGastosComp();
}

function gcSave(){
  gcUpdateKPIs();
  const btn=event.target;
  btn.textContent='✅ Guardado';
  setTimeout(()=>btn.textContent='💾 Guardar',1500);
}

function rGastosComp(){
  const tbody=document.getElementById('gc-edit-tbody');
  if(!tbody) return;
  tbody.innerHTML=GC_EDIT.map((g,i)=>gcRenderRow(g,i)).join('');
  gcUpdateKPIs();
}
// ═══════════════════════════════════════

// RENDER: P&L GENERIC (placeholder structure)
// ═══════════════════════════════════════
function rPLCharts(ent){
  // Guard: skip if charts not in DOM
  const canvasId = 'c-'+ent+'-pl';
  if(!document.getElementById(canvasId) && !document.getElementById('c-'+ent+'-gas')) return;
  const pieTip={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}};
  const noAxes={x:{display:false},y:{display:false}};
  const compactOpts=(noLeg=true)=>({...cOpts(),plugins:{legend:{display:!noLeg,labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}});

  if(ent==='sal'){
    // Gastos bar
    const labels=['Efevoo Tar.','Efevoo TPV','Nómina','SitesPay','Renta','Marketing','Otros'];
    const vals=[110000,100000,186000,13000,35000,5000,34000];
    const colors=['rgba(229,57,53,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(134,134,134,.5)'];
    dc('c-sal-gas');
    CH['c-sal-gas']=new Chart(document.getElementById('c-sal-gas'),{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:colors,borderWidth:0}]},options:compactOpts()});
    // TPV donut — just show # of clients as a visual
    dc('c-sal-pie');
    CH['c-sal-pie']=new Chart(document.getElementById('c-sal-pie'),{type:'doughnut',data:{
      labels:['Restaurantes','Comercios','Servicios','Otros'],datasets:[{data:[5,4,3,2],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.5)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
  if(ent==='end'){
    // Gastos bar
    const labels=['Nómina','CNBV','Icarus','Circ.Créd.','Alestra','Renta','Otros'];
    const vals=[23000,5006,16211,17391,17391,7155,4000];
    dc('c-end-gas');
    CH['c-end-gas']=new Chart(document.getElementById('c-end-gas'),{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(255,112,67,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(229,57,53,.7)','rgba(134,134,134,.5)'],borderWidth:0}]},options:compactOpts()});
    // Cartera donut
    dc('c-end-pie');
    CH['c-end-pie']=new Chart(document.getElementById('c-end-pie'),{type:'doughnut',data:{
      labels:['Activo $100K','Prospecto $3M'],datasets:[{data:[100000,3000000],backgroundColor:['rgba(0,184,117,.7)','rgba(255,160,0,.5)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
  if(ent==='dyn'){
    // Gastos bar
    const labels=['Nómina','CNBV','Icarus','Circ.Créd.','Alestra','Renta','Otros'];
    const vals=[23000,5006,16211,17391,17391,7155,4000];
    dc('c-dyn-gas');
    if(document.getElementById('c-dyn-gas')) CH['c-dyn-gas']=new Chart(document.getElementById('c-dyn-gas'),{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(255,112,67,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(229,57,53,.7)','rgba(134,134,134,.5)'],borderWidth:0}]},options:compactOpts()});
    // Cartera donut
    dc('c-dyn-pie');
    if(document.getElementById('c-dyn-pie')) CH['c-dyn-pie']=new Chart(document.getElementById('c-dyn-pie'),{type:'doughnut',data:{
      labels:['Activo $100K','Vencido $2.5M','Prospecto $2.25M'],datasets:[{data:[100000,2500000,2250000],backgroundColor:['rgba(0,184,117,.7)','rgba(229,57,53,.7)','rgba(255,160,0,.5)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
  if(ent==='wb'){
    // Line ingresos vs costos
    dc('c-wb-pl');
    CH['c-wb-pl']=new Chart(document.getElementById('c-wb-pl'),{type:'line',data:{labels:MO,datasets:[
      {label:'Ingresos',data:WB_ING_TOTAL,borderColor:'#9b51e0',backgroundColor:'rgba(155,81,224,.08)',fill:true,tension:.4,pointRadius:2,borderWidth:2},
      {label:'Costos',data:WB_COSTO_TOTAL,borderColor:'#ff7043',fill:false,tension:.4,pointRadius:2,borderWidth:1.5},
    ]},options:{...cOpts(),plugins:{legend:{labels:{color:'#8b8fb5',font:{size:9},boxWidth:7,padding:7}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
    // Fuentes donut
    const wbAnn=Object.entries(WB_ING).map(([k,v])=>[k.replace('Fees ',''),sum(v)]);
    dc('c-wb-pl-pie');
    CH['c-wb-pl-pie']=new Chart(document.getElementById('c-wb-pl-pie'),{type:'doughnut',data:{
      labels:wbAnn.map(x=>x[0]),datasets:[{data:wbAnn.map(x=>x[1]),backgroundColor:['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(255,160,0,.7)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
}

function rPL(ent){
  // Guard: only render if view is active or element exists
  const tableEl = document.getElementById(ent+'-res-thead');
  if(!tableEl) return;
  // ══════════════════════════════════════════════════════════════
  // ESTRUCTURA BASADA EN "Formato por empresa" + "Flujo de Ingresos"
  // ─────────────────────────────────────────────────────────────
  // INGRESOS (líneas específicas por empresa)
  // COSTES DIRECTOS: Nómina directa, Software, Hardware, Comisiones Promotores
  //   → MARGEN OPERATIVO = Ingresos − Costes Directos
  // GASTOS ADMINISTRATIVOS: Nómina admin, Renta, Mant., Software, Hardware,
  //   Efevoo Tarjetas, Efevoo TPV, Marketing, Luz, Insumos, Viáticos,
  //   Comisiones Bancarias, Cumplimiento
  //   → EBITDA = Margen Operativo − Gastos Administrativos
  // ══════════════════════════════════════════════════════════════

  const NOM_SAL  = 186000;
  const NOM_END  = 23000;
  const NOM_DYN  = 23000;

  // NOM_EDIT-aware: recalcula la distribución real desde la config de nómina
  function nomPorEmpresa(empKey){
    return NOM_EDIT.reduce((sum, e) => {
      const pct = {Salem:e.sal, Endless:e.end, Dynamo:e.dyn, Wirebit:e.wb}[empKey] || 0;
      return sum + (e.s * pct / 100);
    }, 0);
  }

  const configs = {
    // ─────────────────── SALEM ───────────────────
    sal: { id:'sal-res', entName:'Salem', acColor:'#0073ea',
      sections:[
        { type:'header', label:'▶ INGRESOS' },
        { type:'ing',  label:'  Comisiones TPV',                    cats:['TPV'] },
        { type:'ing',  label:'  Fondeo Tarjetas Transferencias',     cats:['Tarjeta Centum Black'] },
        { type:'ing',  label:'  Fondeo Tarjetas Efectivo',           cats:['Tarjeta Centum Black'] },
        { type:'ing',  label:'  Venta Terminal',                     cats:['TPV'] },
        { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

                { type:'header', label:'▶ COSTES DIRECTOS', note:'Variables ligados al producto' },
        { type:'gasto', label:'  Nómina Directa',         cats:['Nómina'], ppto: ()=>nomMesOp('Salem') },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Comisiones Promotoría',  cats:['Com. Bancarias'], concepts:['sitespay','promotor','promotoría'] },
        { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
        { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },


                { type:'header', label:'▶ GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
        { type:'gasto', label:'  Nómina Administrativa',  cats:['Nómina'], ppto: ()=>nomMesAdm('Salem') },
        { type:'gasto', label:'  Renta Oficina',          cats:['Renta'], concepts:['renta oficina'] },
        { type:'gasto', label:'  Mantenimiento',          cats:['Renta'], concepts:['mantenimiento'] },
        { type:'gasto', label:'  Renta Impresora',        cats:['Administrativo','Renta'], concepts:['impresora'] },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Efevoo Tarjetas',        cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas'] },
        { type:'gasto', label:'  Efevoo TPV',             cats:['Costo Directo'], concepts:['efevoo tpv'] },
        { type:'gasto', label:'  Marketing',              cats:['Marketing'] },
        { type:'gasto', label:'  Luz',                    cats:['Administrativo'], concepts:['luz'] },
        { type:'gasto', label:'  Insumos Oficina',        cats:['Administrativo'], concepts:['insumos','material oficina'] },
        { type:'gasto', label:'  Viáticos',               cats:['Representación'], concepts:['viaje','viatico'] },
        { type:'gasto', label:'  Comisiones Bancarias',   cats:['Com. Bancarias'] },
        { type:'gasto', label:'  Cumplimiento',           cats:['Regulatorio'], concepts:['alestra','cnbv','icarus','stp','cumpl'] },
        { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
        { type:'ebitda',    label:'EBITDA', bold:true, util:true },
      ]
    },

    // ─────────────────── ENDLESS ───────────────────
    end: { id:'end-res', entName:'Endless', acColor:'#00b875',
      sections:[
        { type:'header', label:'▶ INGRESOS' },
        { type:'ing', label:'  Intereses Crédito Simple',         cats:['Crédito Simple'] },
        { type:'ing', label:'  Comisión por Apertura',            cats:['Crédito Simple'], concepts:['apertura'] },
        { type:'ing', label:'  Intereses Crédito Automotriz',     cats:['Crédito Automotriz'] },
        { type:'ing', label:'  Gastos Admón y Legales',           cats:['Crédito Simple','Crédito Automotriz'], concepts:['admón','legal','gasto adm'] },
        { type:'ing', label:'  Intereses Moratorios',             cats:['Crédito Simple','Crédito Automotriz','Tarjeta Centum Blue'], concepts:['morat'] },
        { type:'ing', label:'  Intereses Tarjeta Centum Blue',    cats:['Tarjeta Centum Blue'] },
        { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

                { type:'header', label:'▶ COSTES DIRECTOS', note:'Variables ligados al producto' },
        { type:'gasto', label:'  Nómina Directa',         cats:['Nómina'], ppto: ()=>nomMesOp('Endless') },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Comisiones Promotoría',  cats:['Com. Bancarias'], concepts:['sitespay','promotor','promotoría'] },
        { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
        { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },


                { type:'header', label:'▶ GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
        { type:'gasto', label:'  Nómina Administrativa',  cats:['Nómina'], ppto: ()=>nomMesAdm('Endless') },
        { type:'gasto', label:'  Renta Oficina',          cats:['Renta'], concepts:['renta oficina'] },
        { type:'gasto', label:'  Mantenimiento',          cats:['Renta'], concepts:['mantenimiento'] },
        { type:'gasto', label:'  Renta Impresora',        cats:['Administrativo','Renta'], concepts:['impresora'] },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Efevoo Tarjetas',        cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas'] },
        { type:'gasto', label:'  Efevoo TPV',             cats:['Costo Directo'], concepts:['efevoo tpv'] },
        { type:'gasto', label:'  Marketing',              cats:['Marketing'] },
        { type:'gasto', label:'  Luz',                    cats:['Administrativo'], concepts:['luz'] },
        { type:'gasto', label:'  Insumos Oficina',        cats:['Administrativo'], concepts:['insumos','material oficina'] },
        { type:'gasto', label:'  Viáticos',               cats:['Representación'], concepts:['viaje','viatico'] },
        { type:'gasto', label:'  Comisiones Bancarias',   cats:['Com. Bancarias'] },
        { type:'gasto', label:'  Cumplimiento',           cats:['Regulatorio'], concepts:['alestra','cnbv','icarus','stp','cumpl'] },
        { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
        { type:'ebitda',    label:'EBITDA', bold:true, util:true },
      ]
    },

    // ─────────────────── DYNAMO ───────────────────
    dyn: { id:'dyn-res', entName:'Dynamo', acColor:'#ff7043',
      sections:[
        { type:'header', label:'▶ INGRESOS' },
        { type:'ing', label:'  Intereses Crédito Simple',      cats:['Crédito Simple'] },
        { type:'ing', label:'  Comisión por Apertura',         cats:['Crédito Simple'], concepts:['apertura'] },
        { type:'ing', label:'  Intereses Crédito Automotriz',  cats:['Crédito Automotriz'] },
        { type:'ing', label:'  Gastos Admón y Legales',        cats:['Crédito Simple','Crédito Automotriz'], concepts:['admón','legal','gasto adm'] },
        { type:'ing', label:'  Intereses Moratorios',          cats:['Crédito Simple','Crédito Automotriz'], concepts:['morat'] },
        { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

                { type:'header', label:'▶ COSTES DIRECTOS', note:'Variables ligados al producto' },
        { type:'gasto', label:'  Nómina Directa',         cats:['Nómina'], ppto: ()=>nomMesOp('Dynamo') },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Comisiones Promotoría',  cats:['Com. Bancarias'], concepts:['sitespay','promotor','promotoría'] },
        { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
        { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },


                { type:'header', label:'▶ GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
        { type:'gasto', label:'  Nómina Administrativa',  cats:['Nómina'], ppto: ()=>nomMesAdm('Dynamo') },
        { type:'gasto', label:'  Renta Oficina',          cats:['Renta'], concepts:['renta oficina'] },
        { type:'gasto', label:'  Mantenimiento',          cats:['Renta'], concepts:['mantenimiento'] },
        { type:'gasto', label:'  Renta Impresora',        cats:['Administrativo','Renta'], concepts:['impresora'] },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Efevoo Tarjetas',        cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas'] },
        { type:'gasto', label:'  Efevoo TPV',             cats:['Costo Directo'], concepts:['efevoo tpv'] },
        { type:'gasto', label:'  Marketing',              cats:['Marketing'] },
        { type:'gasto', label:'  Luz',                    cats:['Administrativo'], concepts:['luz'] },
        { type:'gasto', label:'  Insumos Oficina',        cats:['Administrativo'], concepts:['insumos','material oficina'] },
        { type:'gasto', label:'  Viáticos',               cats:['Representación'], concepts:['viaje','viatico'] },
        { type:'gasto', label:'  Comisiones Bancarias',   cats:['Com. Bancarias'] },
        { type:'gasto', label:'  Cumplimiento',           cats:['Regulatorio'], concepts:['alestra','cnbv','icarus','stp','cumpl'] },
        { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
        { type:'ebitda',    label:'EBITDA', bold:true, util:true },
      ]
    },

    // ─────────────────── WIREBIT ───────────────────
    wb: { id:'wb-res', entName:'Wirebit', acColor:'#9b51e0',
      sections:[
        { type:'header', label:'▶ INGRESOS' },
        { type:'ing', label:'  Fee por Exchange Cripto',    cats:['Exchange'] },
        { type:'ing', label:'  Fee por OTC',               cats:['OTC'] },
        { type:'ing', label:'  Fee Retiro en Blockchain',  cats:['Retiro Blockchain'] },
        { type:'ing', label:'  Fee Retiro en FIAT',        cats:['Retiro FIAT'] },
        { type:'ing', label:'  Fee Fondeo de Tarjeta',     cats:['Tarjeta Wirebit'] },
        { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

                { type:'header', label:'▶ COSTES DIRECTOS', note:'Variables ligados al producto' },
        { type:'gasto', label:'  Nómina Directa',         cats:['Nómina'], ppto: ()=>nomMesOp('Wirebit') },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Liquidity Providers',    cats:['Costos Directos'], concepts:['liquidity','proveedor liquidez'] },
        { type:'gasto', label:'  Comisiones Promotoría',  cats:['Com. Bancarias'], concepts:['sitespay','promotor','promotoría'] },
        { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
        { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },


                { type:'header', label:'▶ GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
        { type:'gasto', label:'  Nómina Administrativa',  cats:['Nómina'], ppto: ()=>nomMesAdm('Wirebit') },
        { type:'gasto', label:'  Renta Oficina',          cats:['Renta'], concepts:['renta oficina'] },
        { type:'gasto', label:'  Mantenimiento',          cats:['Renta'], concepts:['mantenimiento'] },
        { type:'gasto', label:'  Renta Impresora',        cats:['Administrativo','Renta'], concepts:['impresora'] },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Efevoo Tarjetas',        cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas'] },
        { type:'gasto', label:'  Efevoo TPV',             cats:['Costo Directo'], concepts:['efevoo tpv'] },
        { type:'gasto', label:'  Marketing',              cats:['Marketing'] },
        { type:'gasto', label:'  Luz',                    cats:['Administrativo'], concepts:['luz'] },
        { type:'gasto', label:'  Insumos Oficina',        cats:['Administrativo'], concepts:['insumos','material oficina'] },
        { type:'gasto', label:'  Viáticos',               cats:['Representación'], concepts:['viaje','viatico'] },
        { type:'gasto', label:'  Comisiones Bancarias',   cats:['Com. Bancarias'] },
        { type:'gasto', label:'  Cumplimiento',           cats:['Regulatorio'], concepts:['alestra','cnbv','icarus','stp','cumpl'] },
        { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
        { type:'ebitda',    label:'EBITDA', bold:true, util:true },
      ]
    },
  };

  const cfg = configs[ent];
  const entName = cfg.entName;

  // ── Resolver valores desde S.recs ──
  function recsVals(tipo, cats, concepts){
    const matches = S.recs.filter(r => {
      if(r.isSharedSource) return false;
      if(r.tipo !== tipo) return false;
      if(r.ent !== entName) return false;
      if(cats && !cats.some(c => r.cat.toLowerCase().includes(c.toLowerCase()))) return false;
      if(concepts && !concepts.some(c => r.concepto.toLowerCase().includes(c.toLowerCase()))) return false;
      return true;
    });
    if(!matches.length) return null;
    return MO.map((_,i) => matches.reduce((a,r) => a+(r.vals[i]||0), 0));
  }
  function hasRecs(tipo){ return S.recs.some(r=>!r.isSharedSource&&r.tipo===tipo&&r.ent===entName); }

  // ── Acumuladores ──
  let totIng  = MO.map(()=>0);
  let totCost = MO.map(()=>0);
  let totGas  = MO.map(()=>0);
  let section = 'none';

  // ── Resolver cada sección ──
  const rows = [];
  for(const s of cfg.sections){
    if(s.type === 'header'){
      const lc = s.label.toLowerCase();
      if(lc.includes('ingreso'))          section = 'ing';
      else if(lc.includes('coste') || lc.includes('costo')) section = 'cost';
      else if(lc.includes('gasto') || lc.includes('admin')) section = 'gas';
      rows.push({...s, _type:'hdr'});
      continue;
    }

    // Valores hardcoded (presupuesto Wirebit, costos WB)
    if(s.vals){
      const v = s.vals;
      if(s.type==='ing')  totIng  = totIng.map((x,i)=>x+v[i]);
      if(s.type==='gasto'){ if(section==='cost') totCost=totCost.map((x,i)=>x+v[i]); else totGas=totGas.map((x,i)=>x+v[i]); }
      rows.push({...s, _type:'data', _vals:v, _real:false});
      continue;
    }

    // ing_ppto: sólo mostrar si no hay recs reales
    if(s.type === 'ing_ppto'){
      if(!hasRecs('ingreso')){
        totIng = totIng.map((x,i)=>x+s.vals[i]);
        rows.push({...s, _type:'data', _vals:s.vals, _real:false, _ppto:true});
      }
      continue;
    }

    // Datos desde S.recs
    if(s.type==='ing' || s.type==='gasto'){
      let v = recsVals(s.type==='ing'?'ingreso':'gasto', s.cats||null, s.concepts||null);
      // Fallback a vals_fallback si existe (ej. nómina Wirebit)
      if(!v && s.vals_fallback) v = s.vals_fallback;
      // Fallback a ppto calculado — solo para gastos, NO para ingresos (ingresos deben ser reales)
      if(!v && s.ppto && s.type==='gasto') v = MO.map(()=>Math.round(s.ppto()));
      const isReal = !!recsVals(s.type==='ing'?'ingreso':'gasto', s.cats||null, s.concepts||null);
      const vals = v || MO.map(()=>0);
      if(s.type==='ing')  totIng  = totIng.map((x,i)=>x+vals[i]);
      if(s.type==='gasto'){ if(section==='cost') totCost=totCost.map((x,i)=>x+vals[i]); else totGas=totGas.map((x,i)=>x+vals[i]); }
      rows.push({...s, _type:'data', _vals:vals, _real:isReal});
      continue;
    }

    // Totales calculados
    if(s.type==='total_ing'){  rows.push({...s, _type:'subtotal', _vals:[...totIng],  _cls:'pos'}); continue; }
    if(s.type==='total_cost'){ rows.push({...s, _type:'subtotal', _vals:[...totCost], _cls:'neg'}); continue; }
    if(s.type==='total_gas'){  rows.push({...s, _type:'subtotal', _vals:[...totGas],  _cls:'neg'}); continue; }
    if(s.type==='margen_op'){
      const mo = totIng.map((x,i)=>x-totCost[i]);
      rows.push({...s, _type:'util', _vals:mo, _cls:mo.reduce((a,b)=>a+b,0)>=0?'pos':'neg'});
      continue;
    }
    if(s.type==='ebitda'){
      const ebitda = totIng.map((x,i)=>x-totCost[i]-totGas[i]);
      rows.push({...s, _type:'util', _vals:ebitda, _cls:ebitda.reduce((a,b)=>a+b,0)>=0?'pos':'neg'});
      continue;
    }
  }

  // ── Renderizar ──
  const thead = document.getElementById(cfg.id+'-thead');
  const tbody  = document.getElementById(cfg.id+'-tbody');
  thead.innerHTML = `<th style="min-width:180px">Concepto</th>`
    + MO.map(m=>`<th class="r" style="min-width:72px">${m}</th>`).join('')
    + `<th class="r" style="min-width:88px">Total Anual</th>`;

  const acC = cfg.acColor;

  tbody.innerHTML = rows.map(r => {
    if(r._type === 'hdr'){
      const note = r.note ? ` <span style="font-size:.62rem;font-weight:400;opacity:.75">${r.note}</span>` : '';
      return `<tr class="grp" style="background:${acC}22;border-left:3px solid ${acC}">
        <td colspan="${MO.length+2}" style="color:${acC};font-weight:700;padding:7px 12px;font-size:.8rem">${r.label}${note}</td></tr>`;
    }

    const v    = r._vals || MO.map(()=>0);
    const tot  = sum(v);
    const hasData = v.some(x=>x!==0);

    const badge = '';

    if(r._type === 'util' || r._type === 'subtotal'){
      const bg = r._type==='util'
        ? (tot>=0 ? '#e8f5e9' : '#ffebee')
        : (r._cls==='pos' ? '#e3f2fd' : '#fafafa');
      const color = r._type==='util'
        ? (tot>=0 ? '#1b5e20' : '#b71c1c')
        : (r._cls==='pos' ? '#1565c0' : '#444');
      return `<tr style="background:${bg}">
        <td style="padding:7px 12px;font-weight:800;font-size:.82rem;color:${color};border-left:3px solid ${acC}">${r.label}</td>
        ${v.map(x=>`<td class="mo" style="font-weight:700;color:${color}">${x?fmtFull(x):'—'}</td>`).join('')}
        <td class="mo" style="font-weight:800;color:${color};font-size:.9rem">${hasData||r._type==='util'?fmtFull(tot):'—'}</td>
      </tr>`;
    }

    // Data row normal
    const isIng = r.type==='ing' || r.type==='ing_ppto';
    const valColor = isIng ? '#1b5e20' : '#555';
    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px 12px 6px 20px;font-size:.8rem;color:var(--text)">${r.label}${badge}</td>
      ${v.map(x=>`<td class="mo" style="color:${x?valColor:'var(--muted)'}; font-size:.78rem">${x?fmtFull(x):'—'}</td>`).join('')}
      <td class="mo" style="color:${hasData?valColor:'var(--muted)'};font-weight:600;font-size:.8rem">${hasData?fmtFull(tot):'—'}</td>
    </tr>`;
  }).join('');
  // Update entity dashboard KPI cards with real totals
  const kIngEl = document.getElementById(ent+'-k-ing');
  const kGasEl = document.getElementById(ent+'-k-gas');
  if(kIngEl) kIngEl.textContent = totIng.reduce((a,b)=>a+b,0) > 0 ? fmtK(totIng.reduce((a,b)=>a+b,0)) : '—';
  if(kGasEl) kGasEl.textContent = totGas.reduce((a,b)=>a+b,0) > 0 ? fmtK(totGas.reduce((a,b)=>a+b,0)) : '—';
}
// ═══════════════════════════════════════
// RENDER: SALEM TPV
// ═══════════════════════════════════════
function rSalTPV(){
  const thead=document.getElementById('sal-tpv-thead');
  const tbody=document.getElementById('sal-tpv-tbody');
  thead.innerHTML=`<th>Cliente</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th><th class="r">Ppto 2026</th>`;
  tbody.innerHTML=SAL_TPV_CLIENTES.map(c=>`<tr>
    <td class="bld">${c}</td>${MO.map(()=>'<td class="mo" style="color:var(--muted)">—</td>').join('')}
    <td class="mo bld" style="color:var(--muted)">—</td>
    <td class="mo" style="color:var(--muted)">—</td>
  </tr>`).join('');
  tbody.innerHTML+=`<tr class="grp"><td>TOTAL TPV</td>${MO.map(()=>'<td class="mo">$0</td>').join('')}<td class="mo bld">$0</td><td class="mo">—</td></tr>`;
}

// ═══════════════════════════════════════
// RENDER: SALEM GASTOS
// ═══════════════════════════════════════
function rSalGas(){
  const thead=document.getElementById('sal-gas-thead');
  const tbody=document.getElementById('sal-gas-tbody');
  thead.innerHTML=`<th>Concepto</th><th>Categoría</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th><th class="r">Ppto/Mes</th>`;
  let totalPpto=0;
  tbody.innerHTML=SAL_GASTOS_ITEMS.map(g=>{
    totalPpto+=g.ppto;
    return`<tr><td class="bld">${g.c}</td>
      <td><span class="pill" style="background:#f3eafd;color:#7a2eb8;font-size:.62rem">${g.cat}</span></td>
      ${MO.map(()=>'<td class="mo" style="color:var(--muted)">—</td>').join('')}
      <td class="mo bld neg">$0</td>
      <td class="mo">${fmt(g.ppto)}</td></tr>`;
  }).join('');
  tbody.innerHTML+=`<tr class="grp"><td colspan="2">TOTAL GASTOS SALEM</td>${MO.map(()=>'<td class="mo neg bld">$0</td>').join('')}<td class="mo neg bld">$0</td><td class="mo bld">${fmt(totalPpto)}</td></tr>`;
}

// ═══════════════════════════════════════
// RENDER: CARTERAS
// ═══════════════════════════════════════

// RENDER: WB NÓMINA
// ═══════════════════════════════════════
function rWBNom(){
  const thead=document.getElementById('wb-nom-thead');
  const tbody=document.getElementById('wb-nom-tbody');
  thead.innerHTML=`<th>Empleado</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th>`;
  tbody.innerHTML=WB_NOM_DETAIL.map(e=>`<tr><td class="bld">${e.n}</td>${e.vals.map(v=>`<td class="mo ${v>0?'neg':''}">${v?fmt(v):'—'}</td>`).join('')}<td class="mo bld neg">${fmt(e.total)}</td></tr>`).join('');
  tbody.innerHTML+=`<tr class="grp"><td>TOTAL NÓMINA WIREBIT</td>${WB_NOM_TOTAL.map(v=>`<td class="mo neg bld">${fmt(v)}</td>`).join('')}<td class="mo neg bld">${fmt(sum(WB_NOM_TOTAL))}</td></tr>`;
}

// ═══════════════════════════════════════
// RENDER: CONSOLIDADOS
// ═══════════════════════════════════════
function rConsCharts(type){
  const pieTip={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}};
  const noAxes={x:{display:false},y:{display:false}};
  const smOpts=(noLeg=true)=>({...cOpts(),plugins:{legend:{display:!noLeg,labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}});

  if(type==='centum'){
    // Gastos por entidad bar
    dc('c-centum-gas');
    CH['c-centum-gas']=new Chart(document.getElementById('c-centum-gas'),{type:'bar',data:{
      labels:['Nómina Salem','Efevoo Tar.','Efevoo TPV','Nóm. Endless','Nóm. Dynamo','CNBV+Reg.','Otros'],
      datasets:[{data:[186000,110000,100000,23000,23000,49000,20000],
        backgroundColor:['rgba(155,81,224,.7)','rgba(229,57,53,.7)','rgba(255,112,67,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.5)','rgba(0,115,234,.7)','rgba(134,134,134,.5)'],borderWidth:0}]
    },options:smOpts()});
    // Cartera donut
    dc('c-centum-pie');
    CH['c-centum-pie']=new Chart(document.getElementById('c-centum-pie'),{type:'doughnut',data:{
      labels:['Activo $200K','Vencido $2.5M','Prospecto $5.25M'],
      datasets:[{data:[200000,2500000,5250000],backgroundColor:['rgba(0,184,117,.7)','rgba(229,57,53,.7)','rgba(255,160,0,.5)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }

  if(type==='grupo'){
    // Ingresos vs Costos grupo (Wirebit ppto + Centum = 0 pending)
    dc('c-grupo-ing');
    CH['c-grupo-ing']=new Chart(document.getElementById('c-grupo-ing'),{type:'bar',data:{labels:MO,
      datasets:[
        {label:'Wirebit Ingresos',data:WB_ING_TOTAL,backgroundColor:'rgba(155,81,224,.5)',borderWidth:0,stack:'ing'},
        {label:'WB Costos',data:WB_COSTO_TOTAL,backgroundColor:'rgba(229,57,53,.5)',borderWidth:0,stack:'cost'},
        {label:'WB Nómina',data:WB_NOM_TOTAL,backgroundColor:'rgba(229,57,53,.3)',borderWidth:0,stack:'cost'},
      ]
    },options:{...smOpts(false),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}},stacked:true},y:{stacked:false,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
    // Nómina por empresa donut
    dc('c-grupo-nom');
    CH['c-grupo-nom']=new Chart(document.getElementById('c-grupo-nom'),{type:'doughnut',data:{
      labels:['Salem $186K','Endless $23K','Dynamo $23K','Wirebit $320K'],
      datasets:[{data:[186000,23000,23000,320000],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
}

function rConsolidado(type){
  const isCentum=type==='centum';
  const tid=isCentum?'centum':'grupo';
  const thead=document.getElementById(tid+'-thead');
  const tbody=document.getElementById(tid+'-tbody');
  thead.innerHTML=`<th>Concepto</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total 2026</th>`;
  const rows=isCentum?[
    {l:'▸ CENTUM CAPITAL — Ingresos',hdr:true},
    {l:'  · Salem TPV + Fondeo',vals:MO.map(()=>0),t:'ing'},{l:'  · Endless — Crédito Simple',vals:MO.map(()=>0),t:'ing'},{l:'  · Dynamo — Crédito Simple',vals:MO.map(()=>0),t:'ing'},
    {l:'TOTAL INGRESOS CENTUM',vals:MO.map(()=>0),t:'total',bold:true},
    {l:'COSTOS DIRECTOS',vals:MO.map(()=>0),t:'gasto',bold:true},
    {l:'MARGEN BRUTO',vals:MO.map(()=>0),t:'util',bold:true},
    {l:'GASTOS OPERATIVOS',vals:MO.map((_,i)=>186000+23000+23000),t:'gasto',bold:true},
    {l:'EBITDA CENTUM CAPITAL',vals:MO.map(()=>0),t:'util',bold:true},
  ]:[
    {l:'▸ CENTUM CAPITAL — Ingresos',vals:MO.map(()=>0),t:'ing'},{l:'▸ WIREBIT — Ingresos',vals:WB_ING_TOTAL,t:'ing'},
    {l:'TOTAL INGRESOS GRUPO',vals:WB_ING_TOTAL,t:'total',bold:true},
    {l:'▸ CENTUM CAPITAL — Costos Dir.',vals:MO.map(()=>0),t:'gasto'},{l:'▸ WIREBIT — Costos Directos',vals:WB_COSTO_TOTAL,t:'gasto'},
    {l:'TOTAL COSTOS DIRECTOS',vals:WB_COSTO_TOTAL,t:'total',bold:true},
    {l:'MARGEN BRUTO GRUPO',vals:WB_MARGEN,t:'util',bold:true},
    {l:'▸ CENTUM CAPITAL — Gastos Op.',vals:MO.map(()=>186000+23000+23000),t:'gasto'},{l:'▸ WIREBIT — Gastos Operativos',vals:WB_NOM_TOTAL,t:'gasto'},
    {l:'TOTAL GASTOS OPERATIVOS',vals:WB_MARGEN.map((v,i)=>-(186000+23000+23000+WB_NOM_TOTAL[i])),t:'total',bold:true},
    {l:'EBITDA GRUPO',vals:WB_MARGEN.map((v,i)=>v-(186000+23000+23000+WB_NOM_TOTAL[i])),t:'util',bold:true},
  ];
  tbody.innerHTML=rows.map(r=>{
    if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
    const tot=sum(r.vals);
    const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
    return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map(v=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'—'}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}</td></tr>`;
  }).join('');
}

// ═══════════════════════════════════════

// FLUJO DE INGRESOS — Engine
// ═══════════════════════════════════════

// ── Estado en memoria ──
let FI_ROWS = /*EMBED:FI_ROWS*/[]/*END:FI_ROWS*/; // [{id, concepto, ent, cat, yr, vals:[12], auto, credId}]
let FG_ROWS = /*EMBED:FG_ROWS*/[]/*END:FG_ROWS*/; // [{id, concepto, ent, cat, yr, shared, gcConcept, vals:[12]}]

// ── Categorías ──
const CATS_ING  = ['TPV','Tarjeta Centum Black','Crédito Simple','Crédito Automotriz','Tarjeta Centum Blue','Exchange','OTC','Retiro Blockchain','Retiro FIAT','Tarjeta Wirebit','Otros Ingresos'];
const CATS_GAS  = ['Nómina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representación','Com. Bancarias','Varios'];
const ENT_CATS_ING = {
  'Salem':   ['TPV','Tarjeta Centum Black','Tarjeta Centum Blue','Otros Ingresos'],
  'Endless': ['Crédito Simple','Otros Ingresos'],
  'Dynamo':  ['Crédito Simple','Crédito Automotriz','Otros Ingresos'],
  'Wirebit': ['Exchange','OTC','Retiro Blockchain','Retiro FIAT','Tarjeta Wirebit','Otros Ingresos'],
};
const ENT_CATS_GAS = {
  'Salem':   ['Nómina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representación','Com. Bancarias','Varios'],
  'Endless': ['Nómina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representación','Com. Bancarias','Varios'],
  'Dynamo':  ['Nómina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representación','Com. Bancarias','Varios'],
  'Wirebit': ['Nómina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representación','Com. Bancarias','Varios'],
};
function catsIng(ent){ return ENT_CATS_ING[ent] || CATS_ING; }
function catsGas(ent){ return ENT_CATS_GAS[ent] || CATS_GAS; }
const EMPRESAS  = ['Salem','Endless','Dynamo','Wirebit'];
const ENT_COLOR = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};

// ── Cargar desde localStorage ──
function fiLoad(){
  try{ FI_ROWS = JSON.parse(localStorage.getItem('vmcr_fi')||'[]'); }catch(e){FI_ROWS=[];}
  // Reinject créditos automáticos
  fiInjectCredits();
}
function fgLoad(){
  try{ FG_ROWS = JSON.parse(localStorage.getItem('vmcr_fg')||'[]'); }catch(e){FG_ROWS=[];}
}

// ── Inyectar créditos activos como filas automáticas de ingresos ──
function fiInjectCredits(){
  // Quitar filas auto anteriores
  FI_ROWS = FI_ROWS.filter(r => !r.auto);
  const allCredits = [
    ...END_CREDITS.filter(c=>c.st==='Activo').map(c=>({...c, ent:'Endless'})),
    ...DYN_CREDITS.filter(c=>c.st==='Activo').map(c=>({...c, ent:'Dynamo'})),
  ];
  allCredits.forEach(cr => {
    const intMes = Math.round(cr.monto * (cr.tasa/100) / 12);
    if(!intMes) return;
    // Intereses mensuales
    FI_ROWS.unshift({
      id: 'cred_int_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
      concepto: 'Intereses — '+cr.cl,
      ent: cr.ent,
      cat: 'Crédito Simple',
      yr: '2026',
      vals: Array(12).fill(intMes),
      auto: true,
      credId: cr.cl,
      note: `${cr.tasa} anual · ${fmt(cr.monto)}`
    });
    // Comisión de apertura (sólo mes 1 si la hay)
    if(cr.com && cr.com>0){
      const comMonto = Math.round(cr.monto * cr.com/100);
      FI_ROWS.unshift({
        id: 'cred_com_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
        concepto: 'Comisión Apertura — '+cr.cl,
        ent: cr.ent,
        cat: 'Crédito Simple',
        yr: '2026',
        vals: [comMonto,0,0,0,0,0,0,0,0,0,0,0],
        auto: true,
        credId: cr.cl,
        note: cr.com+' comisión'
      });
    }
  });
}

// ── Calcular KPIs y totales del flujo ──
function fiCalcTotals(){
  const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
  const moTots = Array(12).fill(0);
  FI_ROWS.forEach(r => {
    r.vals.forEach((v,i) => { moTots[i] += v; kpis[r.ent] = (kpis[r.ent]||0)+v; kpis.total += v; });
  });
  return {kpis, moTots};
}

function fgCalcTotals(){
  const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
  const moTots = Array(12).fill(0);
  FG_ROWS.forEach(r => {
    r.vals.forEach((v,i) => { moTots[i] += v; kpis[r.ent] = (kpis[r.ent]||0)+v; kpis.total += v; });
  });
  return {kpis, moTots};
}

// ── Helpers ──
function selOpts(arr, cur){ return arr.map(o=>`<option${o===cur?' selected':''}>${o}</option>`).join(''); }
const inS = (align='right',extra='') => `style="width:100%;border:none;background:transparent;font-size:.76rem;font-family:inherit;text-align:${align};padding:1px 2px;${extra}"`;
const moInput = (rowId, idx, v, isGas=false) =>
  `<input type="number" ${inS()} value="${v||''}" placeholder="0" min="0" step="100"
    oninput="flRowUpdate('${isGas?'fg':'fi'}',${rowId},${idx},+this.value)"
    style="width:100%;border:none;background:transparent;font-size:.75rem;text-align:right;padding:1px 2px;color:${isGas?'var(--orange)':'var(--green)'}">`;

function flRowUpdate(type, rowId, moIdx, val){
  const rows = type==='fi' ? FI_ROWS : FG_ROWS;
  const row = rows.find(r=>r.id===rowId);
  if(!row) return;
  row.vals[moIdx] = val||0;
  flUpdateFooter(type);
  flUpdateKPIs(type);
}

function flUpdateFooter(type){
  const rows = type==='fi' ? FI_ROWS : FG_ROWS;
  const MO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const moTots = Array(12).fill(0);
  rows.forEach(r => r.vals.forEach((v,i) => moTots[i] += v));
  MO.forEach((m,i) => {
    const el = document.getElementById(`${type}-ft-${m}`);
    if(el) el.textContent = moTots[i] ? fmt(moTots[i]) : '—';
  });
  const tot = moTots.reduce((a,b)=>a+b,0);
  const el = document.getElementById(`${type}-ft-total`);
  if(el) el.textContent = tot ? fmt(tot) : '—';
}

function flUpdateKPIs(type){
  const rows = type==='fi' ? FI_ROWS : FG_ROWS;
  const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
  rows.forEach(r => r.vals.forEach(v => { kpis[r.ent]=(kpis[r.ent]||0)+v; kpis.total+=v; }));
  const pfx = type;
  const qk = id => document.getElementById(id);
  if(qk(`${pfx}-kpi-total`)) qk(`${pfx}-kpi-total`).textContent = fmtK(kpis.total);
  if(qk(`${pfx}-kpi-n`))     qk(`${pfx}-kpi-n`).textContent = rows.length+(type==='fi'?' conceptos':' conceptos');
  if(qk(`${pfx}-kpi-sal`))   qk(`${pfx}-kpi-sal`).textContent = fmtK(kpis.Salem||0);
  if(qk(`${pfx}-kpi-end`))   qk(`${pfx}-kpi-end`).textContent = fmtK(kpis.Endless||0);
  if(qk(`${pfx}-kpi-dyn`))   qk(`${pfx}-kpi-dyn`).textContent = fmtK(kpis.Dynamo||0);
  if(qk(`${pfx}-kpi-wb`))    qk(`${pfx}-kpi-wb`).textContent  = fmtK(kpis.Wirebit||0);
  // row count badge
  const rc = document.getElementById(`${pfx}-row-count`);
  if(rc) rc.textContent = rows.length+' filas';
}

// ── RENDER FLUJO INGRESOS ──
function rFlujoIng(){
  if(!document.getElementById('fi-tbody')) return; // view not active
  const tbody = document.getElementById('fi-tbody');
  if(!tbody) return;

  // Show credits notice if any auto rows
  const notice = document.getElementById('fi-cred-notice');
  if(notice) notice.style.display = FI_ROWS.some(r=>r.auto) ? 'flex' : 'none';

  tbody.innerHTML = FI_ROWS.map((r,ri) => {
    const isAuto = r.auto;
    const rowBg  = isAuto ? 'background:rgba(0,184,117,.04)' : '';
    const badge  = isAuto
      ? `<span style="font-size:.57rem;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto</span>`
      : '';
    const noteEl = r.note ? `<div style="font-size:.6rem;color:var(--muted);margin-top:1px">${r.note}</div>` : '';
    const entC   = ENT_COLOR[r.ent]||'#555';

    return `<tr id="fi-row-${r.id}" style="${rowBg};border-bottom:1px solid var(--border)">
      <td style="padding:4px 8px">
        ${isAuto
          ? `<div style="font-size:.78rem;font-weight:600;color:var(--text)">${r.concepto}${badge}</div>${noteEl}`
          : `<input ${inS('left')} value="${r.concepto}" onchange="FI_ROWS[${ri}].concepto=this.value" placeholder="Concepto...">`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span>`
          : `<select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600"
              onchange="FI_ROWS[${ri}].ent=this.value;this.style.color=ENT_COLOR[this.value]||'#555';FI_ROWS[${ri}].cat=catsIng(this.value)[0];rFlujoIng()">
              ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
            </select>`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-size:.73rem;color:var(--muted)">${r.cat}</span>`
          : `<select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)"
              onchange="FI_ROWS[${ri}].cat=this.value">
              ${selOpts(catsIng(r.ent), r.cat)}
            </select>`}
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,false)}</td>`).join('')}
      <td class="mo pos bld" style="font-size:.78rem;font-weight:700" id="fi-rtot-${r.id}">${fmt(r.vals.reduce((a,b)=>a+b,0))}</td>
      <td style="text-align:center;padding:2px">
        ${!isAuto ? `<button onclick="fiDelRow('${r.id}')" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button>` : ''}
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="17" style="padding:8px 12px">
      <button onclick="fiAddRow()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s"
        onmouseover="this.style.borderColor='var(--green)';this.style.color='var(--green)'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
        + Agregar fila de ingreso
      </button>
    </td>
  </tr>`;

  flUpdateFooter('fi');
  flUpdateKPIs('fi');
}

function fiAddRow(){
  FI_ROWS.push({id: Date.now(), concepto:'', ent:'Salem', cat:'TPV', yr:'2026', vals:Array(12).fill(0), auto:false});
  rFlujoIng();
  // Scroll to last row
  setTimeout(()=>{
    const t=document.getElementById('fi-tbody');
    if(t){ const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'}); }
  },50);
}

function fiDelRow(id){
  FI_ROWS = FI_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoIng();
}

function fiSave(){
  // Persist only non-auto rows
  const toSave = FI_ROWS.filter(r=>!r.auto);
  localStorage.setItem('vmcr_fi', JSON.stringify(toSave));
  // Sync to S.recs for P&L compatibility
  syncFlujoToRecs();
  refreshActivePL();
  const btn = document.getElementById('fi-save-btn');
  if(btn){btn.textContent='✅ Guardado';setTimeout(()=>btn.textContent='💾 Guardar',1800);}
  toast('✅ Flujo de Ingresos guardado — P&L actualizado');
}

function fiExport(){
  if(typeof XLSX==='undefined'){toast('❌ XLSX no disponible');return;}
  const data = FI_ROWS.map(r=>({
    Concepto:r.concepto, Empresa:r.ent, Categoría:r.cat, Año:r.yr,
    ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
    'Total Anual': r.vals.reduce((a,b)=>a+b,0)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws, 'Flujo Ingresos');
  XLSX.writeFile(wb2, 'GFVMCR_Flujo_Ingresos.xlsx');
}

// ═══════════════════════════════════════
// FLUJO DE GASTOS — Engine
// ═══════════════════════════════════════
function rFlujoGas(){
  if(!document.getElementById('fg-tbody')) return; // view not active
  const tbody = document.getElementById('fg-tbody');
  if(!tbody) return;

  tbody.innerHTML = FG_ROWS.map((r,ri) => {
    const entC = ENT_COLOR[r.ent]||'#555';
    const isShared = r.shared;
    const sharedBg = isShared ? 'background:rgba(230,81,0,.03)' : '';
    const toggleOn = isShared ? 'background:#ff7043;' : 'background:var(--border);';
    const dotPos   = isShared ? 'left:20px' : 'left:2px';
    const gcOpts   = GC_EDIT.map(g=>`<option${g.c===r.gcConcept?' selected':''}>${g.c}</option>`).join('');

    return `<tr id="fg-row-${r.id}" style="${sharedBg};border-bottom:1px solid var(--border)">
      <td style="padding:4px 8px">
        <input ${inS('left')} value="${r.concepto}" onchange="FG_ROWS[${ri}].concepto=this.value;fgAutoDetect(${ri})" placeholder="Concepto...">
      </td>
      <td style="padding:4px 6px">
        <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600"
          onchange="FG_ROWS[${ri}].ent=this.value;this.style.color=ENT_COLOR[this.value]||'#555';FG_ROWS[${ri}].cat=catsGas(this.value)[0];fgUpdateKPIs()">
          ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
        </select>
      </td>
      <td style="padding:4px 6px">
        <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)"
          onchange="FG_ROWS[${ri}].cat=this.value">
          ${selOpts(catsGas(r.ent), r.cat)}
        </select>
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      <td style="padding:4px 6px;text-align:center">
        <div style="width:36px;height:20px;border-radius:10px;${toggleOn}position:relative;cursor:pointer;transition:background .15s;margin:auto"
          onclick="fgToggleShared(${ri})" title="${isShared?'Compartido':'Solo esta empresa'}">
          <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;${dotPos};transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>
        </div>
      </td>
      <td style="padding:4px 6px">
        ${isShared
          ? `<select style="width:100%;border:1px solid #ff7043;border-radius:4px;font-size:.71rem;padding:2px 4px;background:var(--bg);color:var(--orange)"
              onchange="FG_ROWS[${ri}].gcConcept=this.value;fgUpdateKPIs()">
              <option value="">— Seleccionar —</option>${gcOpts}
            </select>`
          : `<span style="font-size:.7rem;color:var(--muted);padding-left:4px">—</span>`}
      </td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,true)}</td>`).join('')}
      <td class="mo neg bld" style="font-size:.78rem;font-weight:700" id="fg-rtot-${r.id}">${r.vals.some(v=>v)?fmt(r.vals.reduce((a,b)=>a+b,0)):'—'}</td>
      <td style="text-align:center;padding:2px">
        <button onclick="fgDelRow('${r.id}')" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button>
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="19" style="padding:8px 12px">
      <button onclick="fgAddRow()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s"
        onmouseover="this.style.borderColor='var(--orange)';this.style.color='var(--orange)'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
        + Agregar fila de gasto
      </button>
    </td>
  </tr>`;

  flUpdateFooter('fg');
  flUpdateKPIs('fg');
}

function fgAddRow(){
  FG_ROWS.push({id:Date.now(), concepto:'', ent:'Salem', cat:'Administrativo', yr:'2026', shared:false, gcConcept:'', vals:Array(12).fill(0)});
  rFlujoGas();
  setTimeout(()=>{
    const t=document.getElementById('fg-tbody');
    if(t){const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'});}
  },50);
}

function fgDelRow(id){
  FG_ROWS = FG_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoGas();
}

function fgToggleShared(ri){
  FG_ROWS[ri].shared = !FG_ROWS[ri].shared;
  if(!FG_ROWS[ri].shared) FG_ROWS[ri].gcConcept='';
  // Auto-detect concept
  if(FG_ROWS[ri].shared) fgAutoDetect(ri);
  rFlujoGas();
}

function fgAutoDetect(ri){
  const r = FG_ROWS[ri];
  if(!r.shared || !r.concepto) return;
  const con = r.concepto.toLowerCase();
  const match = GC_EDIT.find(g=>g.c.toLowerCase()===con||con.includes(g.c.toLowerCase())||g.c.toLowerCase().includes(con));
  if(match && !r.gcConcept){ FG_ROWS[ri].gcConcept=match.c; rFlujoGas(); }
}

function fgUpdateKPIs(){ flUpdateKPIs('fg'); }

function fgSave(){
  localStorage.setItem('vmcr_fg', JSON.stringify(FG_ROWS));
  syncFlujoToRecs();
  refreshActivePL();
  const btn = document.getElementById('fg-save-btn');
  if(btn){btn.textContent='✅ Guardado';setTimeout(()=>btn.textContent='💾 Guardar',1800);}
  toast('✅ Flujo de Gastos guardado — P&L actualizado');
}

function fgExport(){
  if(typeof XLSX==='undefined'){toast('❌ XLSX no disponible');return;}
  const data = FG_ROWS.map(r=>({
    Concepto:r.concepto, 'Empresa que paga':r.ent, Categoría:r.cat, Año:r.yr,
    '¿Compartido?':r.shared?'SI':'NO', 'Concepto GC':r.gcConcept||'',
    ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
    'Total Anual': r.vals.reduce((a,b)=>a+b,0)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws, 'Flujo Gastos');
  XLSX.writeFile(wb2, 'GFVMCR_Flujo_Gastos.xlsx');
}

// ═══════════════════════════════════════
// SYNC FLUJOS → S.recs (para P&L)
// ═══════════════════════════════════════
function syncFlujoToRecs(){
  // Limpiar recs previos generados por flujos (no los de addRec legacy)
  S.recs = S.recs.filter(r => !r.fromFlujo);

  // Ingresos
  FI_ROWS.forEach(r => {
    if(!r.concepto && !r.auto) return;
    S.recs.push({
      id: 'fi_'+r.id,
      tipo: 'ingreso',
      concepto: r.concepto,
      ent: r.ent,
      cat: r.cat,
      yr: r.yr,
      vals: [...r.vals],
      fromFlujo: true,
      auto: r.auto||false
    });
  });

  // Gastos
  FG_ROWS.forEach(r => {
    if(!r.concepto) return;
    if(r.shared && r.gcConcept){
      // Distribuir según GC_EDIT
      const gc = GC_EDIT.find(g=>g.c===r.gcConcept);
      if(gc){
        const dist = [{k:'Salem',p:gc.sal},{k:'Endless',p:gc.end},{k:'Dynamo',p:gc.dyn},{k:'Wirebit',p:gc.wb}].filter(d=>d.p>0);
        dist.forEach(d => {
          S.recs.push({
            id: 'fg_'+r.id+'_'+d.k,
            tipo: 'gasto',
            concepto: r.concepto,
            ent: d.k,
            cat: r.cat,
            yr: r.yr,
            vals: r.vals.map(v=>Math.round(v*d.p)),
            fromFlujo: true,
            shared: true,
            sharedFrom: r.ent,
            sharedPct: Math.round(d.p*100)
          });
        });
        return;
      }
    }
    S.recs.push({
      id: 'fg_'+r.id,
      tipo: 'gasto',
      concepto: r.concepto,
      ent: r.ent,
      cat: r.cat,
      yr: r.yr,
      vals: [...r.vals],
      fromFlujo: true
    });
  });

  localStorage.setItem('vmcr4', JSON.stringify(S.recs.filter(r=>!r.fromFlujo)));
}

// ═══════════════════════════════════════
// DATA ENTRY (legacy — kept for compat)
// ═══════════════════════════════════════

// ── Compatibility shims (legacy refs removed) ──
function addRec(){} // replaced by fiAddRow / fgAddRow
function renderReg(){} // replaced by rFlujoIng / rFlujoGas
function clearData(){
  customConfirm('¿Borrar todos los registros?', 'Borrar', (ok)=>{
    if(!ok) return;
    S.recs=[]; FI_ROWS=[]; FG_ROWS=[];
    localStorage.removeItem('vmcr4');
    localStorage.removeItem('vmcr_fi');
    localStorage.removeItem('vmcr_fg');
    refreshActivePL();
    toast('🗑 Datos borrados');
  });
}
function delRec(id){
  S.recs=S.recs.filter(r=>String(r.id)!==String(id));
  localStorage.setItem('vmcr4',JSON.stringify(S.recs));
  refreshActivePL();
}
function expData(){
  if(typeof XLSX==='undefined'){toast('❌ XLSX no disponible');return;}
  const all = [...FI_ROWS.map(r=>({...r,tipo:'ingreso'})), ...FG_ROWS.map(r=>({...r,tipo:'gasto'}))];
  const data = all.map(r=>({
    Tipo:r.tipo, Concepto:r.concepto, Empresa:r.ent, Categoría:r.cat, Año:r.yr,
    ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
    'Total Anual': r.vals.reduce((a,b)=>a+b,0)
  }));
  const ws=XLSX.utils.json_to_sheet(data);
  const wb2=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2,ws,'Flujo GFVMCR');
  XLSX.writeFile(wb2,'GFVMCR_datos.xlsx');
}
function refreshActivePL(){
  const active = document.querySelector('.view.active');
  if(!active) return;
  const vid = active.id.replace('view-','');
  const plMap = {sal_res:'sal',end_res:'end',dyn_res:'dyn',wb_res:'wb'};
  if(plMap[vid]){ rPL(plMap[vid]); rPLCharts(plMap[vid]); }
  // Also refresh flujo tables if active
  if(vid==='flujo_ing') rFlujoIng();
  if(vid==='flujo_gas') rFlujoGas();
}

// ═══════════════════════════════════════
