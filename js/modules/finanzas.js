// GF — Finanzas: P&L, nómina, gastos compartidos

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
    // Gastos bar — from S.recs
    const salGasCats = [
      {lbl:'Nómina',       cats:['Nómina']},
      {lbl:'Efevoo Tar.',  cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas']},
      {lbl:'Efevoo TPV',   cats:['Costo Directo'], concepts:['efevoo tpv']},
      {lbl:'Com. TPV',     cats:['Com. Bancarias','TPV Comisiones']},
      {lbl:'Renta',        cats:['Renta']},
      {lbl:'Marketing',    cats:['Marketing']},
      {lbl:'Otros',        cats:['Administrativo','Operaciones','Regulatorio','Representación','Varios']},
    ];
    const salGasVals = salGasCats.map(gc => {
      const matched = (S.recs||[]).filter(r => !r.isSharedSource && r.tipo==='gasto' && r.ent==='Salem' && r.yr==_year && gc.cats.some(c=>r.cat.toLowerCase().includes(c.toLowerCase())) && (!gc.concepts || gc.concepts.some(c=>r.concepto.toLowerCase().includes(c))));
      return matched.reduce((s,r) => s + r.vals.reduce((a,b)=>a+b,0), 0);
    });
    if(salGasVals[0]===0){ try{ salGasVals[0] = NOM_EDIT.reduce((s,n)=>s+n.s*(n.sal||0)/100,0) * 12; }catch(e){} }
    const colors=['rgba(229,57,53,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(134,134,134,.5)'];
    dc('c-sal-gas');
    CH['c-sal-gas']=new Chart(document.getElementById('c-sal-gas'),{type:'bar',data:{labels:salGasCats.map(g=>g.lbl),datasets:[{data:salGasVals,backgroundColor:colors,borderWidth:0}]},options:compactOpts()});

    // TPV donut — ingresos por fuente from S.recs
    dc('c-sal-pie');
    const tpvIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&r.cat==='TPV'&&r.yr==_year).reduce((s,r)=>s+r.vals.reduce((a,b)=>a+b,0),0);
    const tarIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&(r.cat.includes('Tarjeta')||r.cat.includes('Centum'))&&r.yr==_year).reduce((s,r)=>s+r.vals.reduce((a,b)=>a+b,0),0);
    const otrosIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&r.cat!=='TPV'&&!r.cat.includes('Tarjeta')&&!r.cat.includes('Centum')&&r.yr==_year).reduce((s,r)=>s+r.vals.reduce((a,b)=>a+b,0),0);
    const hasSalIng = tpvIng>0||tarIng>0||otrosIng>0;
    CH['c-sal-pie']=new Chart(document.getElementById('c-sal-pie'),{type:'doughnut',data:{
      labels: hasSalIng ? [`TPV ${fmtK(tpvIng)}`,`Tarjetas ${fmtK(tarIng)}`,`Otros ${fmtK(otrosIng)}`] : ['Sin datos'],
      datasets:[{data: hasSalIng ? [tpvIng||0.01,tarIng||0.01,otrosIng||0.01] : [1],
        backgroundColor: hasSalIng ? ['rgba(0,115,234,.6)','rgba(155,81,224,.6)','rgba(134,134,134,.4)'] : ['rgba(200,200,200,.3)'],
        borderColor: hasSalIng ? ['#0073ea','#9b51e0','#888'] : ['transparent'],
        borderWidth: hasSalIng ? 2 : 0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
  if(ent==='end' || ent==='dyn'){
    const entName = ent==='end' ? 'Endless' : 'Dynamo';
    const credits = ent==='end' ? END_CREDITS : DYN_CREDITS;
    const colors = ['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(255,112,67,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(229,57,53,.7)','rgba(134,134,134,.5)'];

    // Gastos bar — from S.recs
    const gasCats = [
      {lbl:'Nómina',       cats:['Nómina']},
      {lbl:'Regulatorio',  cats:['Regulatorio']},
      {lbl:'Renta',        cats:['Renta']},
      {lbl:'Operaciones',  cats:['Operaciones']},
      {lbl:'Marketing',    cats:['Marketing']},
      {lbl:'Com. Banc.',   cats:['Com. Bancarias']},
      {lbl:'Otros',        cats:['Administrativo','Representación','Varios','Costo Directo']},
    ];
    const gasVals = gasCats.map(gc => {
      const matched = (S.recs||[]).filter(r => !r.isSharedSource && r.tipo==='gasto' && r.ent===entName && r.yr==_year && gc.cats.some(c=>r.cat.toLowerCase().includes(c.toLowerCase())));
      return matched.reduce((s,r) => s + r.vals.reduce((a,b)=>a+b,0), 0);
    });
    // Add nómina from NOM_EDIT if not in S.recs
    if(gasVals[0]===0){
      try{ gasVals[0] = NOM_EDIT.reduce((s,n)=>s+n.s*(n[ent]||0)/100,0) * 12; }catch(e){}
    }
    dc('c-'+ent+'-gas');
    if(document.getElementById('c-'+ent+'-gas')) CH['c-'+ent+'-gas']=new Chart(document.getElementById('c-'+ent+'-gas'),{type:'bar',data:{labels:gasCats.map(g=>g.lbl),datasets:[{data:gasVals,backgroundColor:colors,borderWidth:0}]},options:compactOpts()});

    // Cartera donut — from credits
    dc('c-'+ent+'-pie');
    const activos = credits.filter(c=>c.st==='Activo');
    const vencidos = credits.filter(c=>c.st==='Vencido');
    const prospectos = credits.filter(c=>c.st==='Prospecto');
    const cAct = activos.reduce((s,c)=>s+credSaldoActual(c),0);
    const cVen = vencidos.reduce((s,c)=>s+credSaldoActual(c),0);
    const cPro = prospectos.reduce((s,c)=>s+(c.monto||0),0);
    const hasCartera = cAct>0 || cVen>0 || cPro>0;
    if(document.getElementById('c-'+ent+'-pie')) CH['c-'+ent+'-pie']=new Chart(document.getElementById('c-'+ent+'-pie'),{type:'doughnut',data:{
      labels: hasCartera ? [`Activa ${fmtK(cAct)}`,`Vencida ${fmtK(cVen)}`,`Prospectos ${fmtK(cPro)}`] : ['Sin datos de cartera'],
      datasets:[{
        data: hasCartera ? [cAct||0.01, cVen||0.01, cPro||0.01] : [1],
        backgroundColor: hasCartera ? ['rgba(0,184,117,.6)','rgba(234,57,67,.6)','rgba(255,160,0,.4)'] : ['rgba(134,134,134,.2)'],
        borderColor: hasCartera ? ['#00b875','#ea3943','#ffa000'] : ['rgba(134,134,134,.3)'],
        borderWidth: hasCartera ? 2 : 0
      }]
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

// ═══════════════════════════════════════
// P&L PERIOD TOGGLE
// ═══════════════════════════════════════
const _plMode = {sal:'mensual', end:'mensual', dyn:'mensual', wb:'mensual'};
function setPLMode(ent, mode, btn){
  _plMode[ent] = mode;
  btn.closest('.pbar').querySelectorAll('.pbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  rPL(ent); rPLCharts(ent);
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
        { type:'ing',  label:'  Comisiones TPV',                    cats:['TPV'], concepts:['comision','comisión','com ','fee','auto'] },
        { type:'ing',  label:'  Fondeo Tarjetas Transferencias',     cats:['Tarjeta Centum Black'], concepts:['transferencia','spei','clabe'] },
        { type:'ing',  label:'  Fondeo Tarjetas Efectivo',           cats:['Tarjeta Centum Black'], concepts:['efectivo','cash','depósito','deposito'] },
        { type:'ing',  label:'  Venta Terminal',                     cats:['TPV','Otros Ingresos'], concepts:['venta'] },
        { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

                { type:'header', label:'▶ COSTES DIRECTOS', note:'Variables ligados al producto' },
        { type:'gasto', label:'  Nómina Directa',         cats:['Nómina'], ppto: ()=>nomMesOp('Salem') },
        { type:'gasto', label:'  Software',               cats:['Operaciones'], concepts:['software'] },
        { type:'gasto', label:'  Hardware',               cats:['Operaciones'], concepts:['hardware'] },
        { type:'gasto', label:'  Comisiones Promotoría',  cats:['Com. Bancarias','TPV Comisiones'], concepts:['sitespay','promotor','promotoría'] },
        { type:'gasto', label:'  Comisiones Internas',    cats:['Com. Bancarias','TPV Comisiones'], concepts:['internas'] },
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
      if(r.yr!=_year) return false;
      if(r.tipo !== tipo) return false;
      if(r.ent !== entName) return false;
      if(cats && !cats.some(c => r.cat.toLowerCase().includes(c.toLowerCase()))) return false;
      if(concepts && !concepts.some(c => r.concepto.toLowerCase().includes(c.toLowerCase()))) return false;
      return true;
    });
    if(!matches.length) return null;
    return MO.map((_,i) => matches.reduce((a,r) => a+(r.vals[i]||0), 0));
  }
  function hasRecs(tipo){ return S.recs.some(r=>!r.isSharedSource&&r.yr==_year&&r.tipo===tipo&&r.ent===entName); }

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

  // ── Period columns ──
  const {cols: _pCols, colLabels: _pLabels} = periodColumns(_plMode[ent]||'mensual');
  // For mensual: 12 data cols + Total; for trimestral: Q1-Q4 + Total; for anual: Total 2026
  const _pAgg = (arr) => {
    const agg = _pCols.map(idxs=>colVal(arr,idxs));
    if(_plMode[ent]==='mensual') agg.push(sum(arr)); // append annual total for mensual
    return agg;
  };
  const nCols = _pLabels.length; // includes Total column

  // ── Renderizar ──
  const thead = document.getElementById(cfg.id+'-thead');
  const tbody  = document.getElementById(cfg.id+'-tbody');
  thead.innerHTML = `<th style="min-width:180px">Concepto</th>`
    + _pLabels.map(l=>`<th class="r" style="min-width:72px">${l}</th>`).join('');

  const acC = cfg.acColor;

  tbody.innerHTML = rows.map(r => {
    if(r._type === 'hdr'){
      const note = r.note ? ` <span style="font-size:.62rem;font-weight:400;opacity:.75">${r.note}</span>` : '';
      return `<tr class="grp" style="background:${acC}22;border-left:3px solid ${acC}">
        <td colspan="${nCols+1}" style="color:${acC};font-weight:700;padding:7px 12px;font-size:.8rem">${r.label}${note}</td></tr>`;
    }

    const v12   = r._vals || Array(12).fill(0);
    const agg   = _pAgg(v12);
    const tot   = sum(v12);
    const hasData = v12.some(x=>x!==0);

    if(r._type === 'util' || r._type === 'subtotal'){
      const bg = r._type==='util'
        ? (tot>=0 ? '#e8f5e9' : '#ffebee')
        : (r._cls==='pos' ? '#e3f2fd' : '#fafafa');
      const color = r._type==='util'
        ? (tot>=0 ? '#1b5e20' : '#b71c1c')
        : (r._cls==='pos' ? '#1565c0' : '#444');
      return `<tr style="background:${bg}">
        <td style="padding:7px 12px;font-weight:800;font-size:.82rem;color:${color};border-left:3px solid ${acC}">${r.label}</td>
        ${agg.map((x,i)=>`<td class="mo" style="font-weight:${i===agg.length-1?800:700};color:${color}${i===agg.length-1?';font-size:.9rem':''}">${x?fmtFull(x):'—'}</td>`).join('')}
      </tr>`;
    }

    // Data row normal
    const isIng = r.type==='ing' || r.type==='ing_ppto';
    const valColor = isIng ? '#1b5e20' : '#555';
    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px 12px 6px 20px;font-size:.8rem;color:var(--text)">${r.label}</td>
      ${agg.map((x,i)=>`<td class="mo" style="color:${x?valColor:'var(--muted)'};font-size:.78rem${i===agg.length-1?';font-weight:600':''}">${x?fmtFull(x):'—'}</td>`).join('')}
    </tr>`;
  }).join('');
  // Update entity dashboard KPI cards with real totals
  const kIngEl = document.getElementById(ent+'-k-ing');
  const kCostEl = document.getElementById(ent+'-k-cost');
  const kGasEl = document.getElementById(ent+'-k-gas');
  const annIng = totIng.reduce((a,b)=>a+b,0);
  const annCost = totCost.reduce((a,b)=>a+b,0);
  const annGas = totGas.reduce((a,b)=>a+b,0);
  if(kIngEl) kIngEl.textContent = annIng > 0 ? fmtK(annIng) : '—';
  if(kCostEl){
    kCostEl.textContent = annCost > 0 ? fmtK(annCost) : '—';
    kCostEl.style.color = annCost > 0 ? 'var(--red)' : 'var(--muted)';
    kCostEl.style.fontSize = annCost > 0 ? '' : '.85rem';
  }
  const kCostD = document.getElementById(ent+'-k-cost-d');
  if(kCostD) kCostD.textContent = annCost > 0 ? 'Nómina + comisiones' : 'Pendiente de captura';
  if(kGasEl){
    kGasEl.textContent = annGas > 0 ? fmtK(annGas) : '—';
    kGasEl.style.color = annGas > 0 ? 'var(--purple)' : 'var(--muted)';
    kGasEl.style.fontSize = annGas > 0 ? '' : '.85rem';
  }
  const kGasD = document.getElementById(ent+'-k-gas-d');
  if(kGasD) kGasD.textContent = annGas > 0 ? 'Renta, admin, regulatorio' : 'Pendiente de captura';

  // ── Poblar KPIs de créditos para Endless / Dynamo ──
  if(ent==='end' || ent==='dyn'){
    const credits = ent==='end' ? END_CREDITS : DYN_CREDITS;
    const activos = credits.filter(c=>c.st==='Activo');
    const prospectos = credits.filter(c=>c.st==='Prospecto');
    // Cartera Total
    const cartera = activos.reduce((s,c)=>s+credSaldoActual(c),0);
    const elCart = document.getElementById(ent+'-kpi-cartera');
    const elCartSub = document.getElementById(ent+'-kpi-cartera-sub');
    if(elCart) elCart.textContent = cartera > 0 ? fmtK(cartera) : '—';
    if(elCartSub) elCartSub.textContent = activos.length + ' crédito' + (activos.length!==1?'s':'') + ' activo' + (activos.length!==1?'s':'');
    // Ingresos sub
    const elIngSub = document.getElementById(ent+'-kpi-ing-sub');
    if(elIngSub) elIngSub.textContent = annIng > 0 ? 'Intereses + comisiones' : 'Pendiente datos';
    // Pipeline
    const pipeline = prospectos.reduce((s,c)=>s+(c.monto||0),0);
    const elPipe = document.getElementById(ent+'-kpi-pipeline');
    const elPipeSub = document.getElementById(ent+'-kpi-pipeline-sub');
    if(elPipe) elPipe.textContent = pipeline > 0 ? fmtK(pipeline) : '—';
    if(elPipeSub) elPipeSub.textContent = prospectos.length > 0 ? prospectos.length + ' prospecto' + (prospectos.length!==1?'s':'') : 'Sin prospectos';
  }

  // ── Poblar KPI de nómina Wirebit ──
  if(ent==='wb'){
    const wbNom = nomMesTotal('Wirebit');
    const elNom = document.getElementById('wb-kpi-nomina');
    if(elNom){ elNom.textContent = fmtK(wbNom) + '/mes'; elNom.style.color=''; elNom.style.fontSize=''; }
  }
}
// ═══════════════════════════════════════
// RENDER: SALEM TPV
// ═══════════════════════════════════════
function rSalTPV(){
  const thead=document.getElementById('sal-tpv-thead');
  const tbody=document.getElementById('sal-tpv-tbody');
  thead.innerHTML=`<th>Cliente</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th><th class="r">Ppto ${_year}</th>`;
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
function rSalGas(){ rGasView('sal'); }

// Categorías que son Costes Directos (variables, ligados al producto)
const COST_CATS = ['Operaciones','Com. Bancarias','TPV Comisiones','Costo Directo','Costos Directos'];

function _isCostRow(r){
  // Nómina Operativa = costo directo, Nómina Administrativa = gasto
  if(r.cat==='Nómina') return r.concepto.toLowerCase().includes('operativ') || r.concepto.toLowerCase().includes('directa');
  return COST_CATS.some(c=>r.cat===c);
}

// ═══════════════════════════════════════
// EVOLUCIÓN MENSUAL: Ingresos + Costes + Gastos + EBITDA
// ═══════════════════════════════════════
function rEvoChart(canvasId, entKeys){
  const el=document.getElementById(canvasId);
  if(!el) return;
  dc(canvasId);

  const keys=Array.isArray(entKeys)?entKeys:[entKeys];
  const ingM=MO.map(()=>0), costM=MO.map(()=>0), gasM=MO.map(()=>0);

  keys.forEach(ek=>{
    const cfg=ENT_MAP[ek]; if(!cfg) return;
    const entName=cfg.fullName, nomK=cfg.nomKey;

    // Ingresos
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===entName&&r.yr==_year)
      .forEach(r=>r.vals.forEach((v,i)=>ingM[i]+=v));

    // Gastos (aggregate by concepto to avoid duplication)
    const gastoRecs=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==_year);
    const agg=new Map();
    gastoRecs.forEach(r=>{
      const key=r.concepto;
      if(agg.has(key)){const e=agg.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
      else agg.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
    });

    // NOM_EDIT fallback
    if(!gastoRecs.some(r=>r.cat==='Nómina')&&typeof NOM_EDIT!=='undefined'){
      const op=Math.round(nomMesOp(entName)),adm=Math.round(nomMesAdm(entName));
      if(op>0) agg.set(ek+'_NomOp',{concepto:'Nómina Operativa',cat:'Nómina',vals:Array(12).fill(op)});
      if(adm>0) agg.set(ek+'_NomAdm',{concepto:'Nómina Administrativa',cat:'Nómina',vals:Array(12).fill(adm)});
    }

    // GC_EDIT (gastos compartidos)
    if(typeof GC_EDIT!=='undefined'){
      GC_EDIT.forEach(gc=>{
        if(!gc.c||!gc[nomK]||gc[nomK]<=0) return;
        if(agg.has(gc.c)) return;
        const pptoMes=Math.round((gc.ppto||0)*gc[nomK]/100);
        if(pptoMes>0) agg.set(gc.c+'_'+ek,{concepto:gc.c,cat:gc.cat||'Varios',vals:Array(12).fill(pptoMes)});
      });
    }

    [...agg.values()].forEach(r=>{
      if(_isCostRow(r)) r.vals.forEach((v,i)=>costM[i]+=v);
      else r.vals.forEach((v,i)=>gasM[i]+=v);
    });
  });

  const ebitdaM=MO.map((_,i)=>ingM[i]-costM[i]-gasM[i]);

  CH[canvasId]=new Chart(el,{
    type:'bar',
    data:{
      labels:MO,
      datasets:[
        {label:'Ingresos',data:ingM,backgroundColor:'rgba(46,184,92,.55)',borderColor:'rgba(46,184,92,.8)',borderWidth:1,borderRadius:3,order:2},
        {label:'Costes Directos',data:costM,backgroundColor:'rgba(255,152,0,.50)',borderColor:'rgba(255,152,0,.8)',borderWidth:1,borderRadius:3,order:3},
        {label:'Gastos Admin',data:gasM,backgroundColor:'rgba(239,68,68,.40)',borderColor:'rgba(239,68,68,.7)',borderWidth:1,borderRadius:3,order:4},
        {type:'line',label:'EBITDA',data:ebitdaM,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.08)',borderWidth:2.5,pointRadius:3,pointBackgroundColor:'#6366f1',tension:.3,fill:true,order:1}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:true,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{position:'top',labels:{color:'#8b8fb5',font:{size:10},boxWidth:10,padding:10}},
        tooltip:{...cOpts().plugins.tooltip,mode:'index',intersect:false}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},
        y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}
      }
    }
  });
}

function rGasView(entKey){
  const cfg=ENT_MAP[entKey]; if(!cfg) return;
  const entName=cfg.fullName, nomK=cfg.nomKey, color=cfg.color;

  // Containers
  const costThead=document.getElementById(entKey+'-cost-thead');
  const costTbody=document.getElementById(entKey+'-cost-tbody');
  const gasThead=document.getElementById(entKey+'-gas-thead');
  const gasTbody=document.getElementById(entKey+'-gas-tbody');
  if(!gasThead||!gasTbody) return;

  const hdr='<th>Concepto</th><th>Categoría</th>'+MO.map(m=>'<th class="r">'+m+'</th>').join('')+'<th class="r">Total</th>';
  if(costThead) costThead.innerHTML=hdr;
  gasThead.innerHTML=hdr;

  // Filtrar gastos de S.recs para esta empresa
  const gastos=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==_year);

  // Agregar por concepto
  const agg=new Map();
  gastos.forEach(r=>{
    const key=r.concepto;
    if(agg.has(key)){const e=agg.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
    else agg.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
  });

  // Inyectar Nómina desde NOM_EDIT si no hay en S.recs
  const hasNomRecs=gastos.some(r=>r.cat==='Nómina');
  if(!hasNomRecs && typeof NOM_EDIT!=='undefined'){
    const nomOp=Math.round(nomMesOp(entName));
    const nomAdm=Math.round(nomMesAdm(entName));
    if(nomOp>0) agg.set('Nómina Operativa',{concepto:'Nómina Operativa',cat:'Nómina',vals:Array(12).fill(nomOp),ppto:true});
    if(nomAdm>0) agg.set('Nómina Administrativa',{concepto:'Nómina Administrativa',cat:'Nómina',vals:Array(12).fill(nomAdm),ppto:true});
  }

  // Inyectar Gastos Compartidos desde GC_EDIT
  if(typeof GC_EDIT!=='undefined'){
    GC_EDIT.forEach(gc=>{
      if(!gc.c || !gc[nomK] || gc[nomK]<=0) return;
      if(agg.has(gc.c)) return;
      const pptoMes=Math.round((gc.ppto||0)*gc[nomK]/100);
      if(pptoMes>0) agg.set(gc.c,{concepto:gc.c,cat:gc.cat||'Varios',vals:Array(12).fill(pptoMes),ppto:true});
    });
  }

  const all=[...agg.values()];
  const costRows=all.filter(r=>_isCostRow(r)).sort((a,b)=>sum(b.vals)-sum(a.vals));
  const gasRows=all.filter(r=>!_isCostRow(r)).sort((a,b)=>sum(b.vals)-sum(a.vals));

  const pillBg=color+'18';
  function renderTable(rows, tbody, label){
    if(rows.length===0){
      tbody.innerHTML='<tr><td colspan="15" style="text-align:center;padding:20px;color:var(--muted);font-size:.82rem">Sin registros</td></tr>';
      return {totM:Array(12).fill(0),total:0};
    }
    const totM=Array(12).fill(0);
    tbody.innerHTML=rows.map(g=>{
      const tot=sum(g.vals);
      g.vals.forEach((v,i)=>totM[i]+=v);
      const pptoTag=g.ppto?' <span style="font-size:.55rem;color:var(--muted);font-weight:400">(ppto)</span>':'';
      return '<tr><td class="bld">'+g.concepto+pptoTag+'</td><td><span class="pill" style="background:'+pillBg+';color:'+color+';font-size:.62rem">'+g.cat+'</span></td>'+g.vals.map(v=>'<td class="mo'+(v?' neg':'')+'"'+(g.ppto?' style="opacity:.65"':'')+'>'+(v?fmtFull(v):'—')+'</td>').join('')+'<td class="mo bld neg">'+fmtFull(tot)+'</td></tr>';
    }).join('');
    const gt=sum(totM);
    tbody.innerHTML+='<tr class="grp"><td colspan="2">'+label+'</td>'+totM.map(v=>'<td class="mo neg bld">'+(v?fmtFull(v):'—')+'</td>').join('')+'<td class="mo neg bld">'+fmtFull(gt)+'</td></tr>';
    return {totM,total:gt};
  }

  // Render both tables
  const costRes=costTbody ? renderTable(costRows,costTbody,'TOTAL COSTES DIRECTOS') : {totM:Array(12).fill(0),total:0};
  const gasRes=renderTable(gasRows,gasTbody,'TOTAL GASTOS ADMINISTRATIVOS');

  // KPIs
  const curMonth=new Date().getMonth();
  const costTotal=costRes.total;
  const gasTotal=gasRes.total;
  const grandTotal=costTotal+gasTotal;

  const kCost=document.getElementById(entKey+'-gas-kpi-cost');
  const kCostD=document.getElementById(entKey+'-gas-kpi-cost-d');
  const kGas=document.getElementById(entKey+'-gas-kpi-gas');
  const kGasD=document.getElementById(entKey+'-gas-kpi-gas-d');
  const kAnu=document.getElementById(entKey+'-gas-kpi-anual');
  const kAnuD=document.getElementById(entKey+'-gas-kpi-anual-d');

  if(kCost){kCost.textContent=costTotal>0?fmtK(costTotal):'—';kCost.style.color=costTotal>0?'var(--orange)':'var(--muted)';kCost.style.fontSize=costTotal>0?'':'.85rem';}
  if(kCostD){kCostD.textContent=costTotal>0?costRows.length+' concepto'+(costRows.length!==1?'s':''):'Sin costes registrados';kCostD.className=costTotal>0?'kpi-d':'kpi-d dnu';}

  if(kGas){kGas.textContent=gasTotal>0?fmtK(gasTotal):'—';kGas.style.color=gasTotal>0?'var(--red)':'var(--muted)';kGas.style.fontSize=gasTotal>0?'':'.85rem';}
  if(kGasD){kGasD.textContent=gasTotal>0?gasRows.length+' concepto'+(gasRows.length!==1?'s':''):'Sin gastos registrados';kGasD.className=gasTotal>0?'kpi-d':'kpi-d dnu';}

  if(kAnu){kAnu.textContent=grandTotal>0?fmtK(grandTotal):'Sin datos';kAnu.style.color=grandTotal>0?'var(--yellow)':'var(--muted)';kAnu.style.fontSize=grandTotal>0?'':'.85rem';}
  if(kAnuD){kAnuD.textContent=grandTotal>0?'Acumulado '+_year:'Pendiente de captura';kAnuD.className=grandTotal>0?'kpi-d':'kpi-d dnu';}
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
// RENDER: INGRESOS & NÓMINA POR EMPRESA
// ═══════════════════════════════════════
const ENT_MAP = {
  sal:{name:'Salem Internacional',fullName:'Salem',nomKey:'sal',color:'#0073ea'},
  end:{name:'Endless Money',fullName:'Endless',nomKey:'end',color:'#00b875'},
  dyn:{name:'Dynamo Finance',fullName:'Dynamo',nomKey:'dyn',color:'#ff7043'},
  wb:{name:'Wirebit',fullName:'Wirebit',nomKey:'wb',color:'#9b51e0'},
};

function rIngView(entKey){
  const cfg=ENT_MAP[entKey]; if(!cfg) return;
  const entName=cfg.fullName, color=cfg.color;
  const thead=document.getElementById(entKey+'-ing-thead');
  const tbody=document.getElementById(entKey+'-ing-tbody');
  if(!thead||!tbody) return;

  const rows=FI_ROWS.filter(r=>r.ent===entName&&r.yr==_year);
  const curMonth=new Date().getMonth();
  const totalAnual=rows.reduce((s,r)=>s+sum(r.vals),0);
  const totalMes=rows.reduce((s,r)=>s+(r.vals[curMonth]||0),0);

  // KPIs
  const kT=document.getElementById(entKey+'-ing-kpi-total');
  const kTs=document.getElementById(entKey+'-ing-kpi-total-sub');
  const kM=document.getElementById(entKey+'-ing-kpi-mes');
  const kMs=document.getElementById(entKey+'-ing-kpi-mes-sub');
  const kC=document.getElementById(entKey+'-ing-kpi-count');
  const kCs=document.getElementById(entKey+'-ing-kpi-count-sub');

  if(totalAnual>0){
    if(kT){kT.textContent=fmtK(totalAnual);kT.style.color=color;kT.style.fontSize='';}
    if(kTs){kTs.textContent='Ingresos acumulados '+_year;kTs.className='kpi-d';}
  } else {
    if(kT){kT.textContent='Sin datos';kT.style.color='var(--muted)';kT.style.fontSize='.85rem';}
    if(kTs){kTs.textContent='Pendiente de captura';kTs.className='kpi-d dnu';}
  }
  if(totalMes>0){
    if(kM){kM.textContent=fmtK(totalMes);kM.style.color='var(--blue)';kM.style.fontSize='';}
    if(kMs){kMs.textContent=MO[curMonth]+' '+_year;kMs.className='kpi-d';}
  } else {
    if(kM){kM.textContent='—';kM.style.color='var(--muted)';kM.style.fontSize='.85rem';}
    if(kMs){kMs.textContent='Pendiente';kMs.className='kpi-d dnu';}
  }
  if(kC){kC.textContent=rows.length;kC.style.color=rows.length>0?'var(--green)':'var(--muted)';kC.style.fontSize=rows.length>0?'':'.85rem';}
  if(kCs) kCs.textContent=rows.length+' concepto'+(rows.length!==1?'s':'')+' de ingreso';

  // Chart bar
  const ck='c'+entKey+'ingbar';
  dc(ck);
  const mTotals=MO.map((_,i)=>rows.reduce((s,r)=>s+(r.vals[i]||0),0));
  const cv=document.getElementById('c-'+entKey+'-ing-bar');
  if(cv){
    CH[ck]=new Chart(cv,{
      type:'bar',
      data:{labels:MO,datasets:[{label:'Ingresos '+cfg.name,data:mTotals,backgroundColor:color+'44',borderColor:color,borderWidth:1.5,borderRadius:4}]},
      options:{...cOpts(),
        plugins:{legend:{display:false},tooltip:cOpts().plugins?.tooltip},
        scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}
      }
    });
  }

  // Table
  thead.innerHTML='<th>Concepto</th><th>Categoría</th>'+MO.map(m=>'<th class="r">'+m+'</th>').join('')+'<th class="r">Total</th>';
  if(rows.length===0){
    tbody.innerHTML='<tr><td colspan="15" style="text-align:center;padding:24px;color:var(--muted);font-size:.82rem">Sin ingresos registrados para '+cfg.name+' — usa <b>Flujo de Ingresos</b> o <b>Carga Masiva</b> para agregar datos</td></tr>';
    return;
  }
  const totM=Array(12).fill(0);
  tbody.innerHTML=rows.map(r=>{
    const tot=sum(r.vals);
    r.vals.forEach((v,i)=>totM[i]+=v);
    const badge=r.auto?' <span style="font-size:.55rem;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto</span>':(r.autoTPV?' <span style="font-size:.55rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span>':'');
    return '<tr><td class="bld">'+r.concepto+badge+'</td><td><span class="pill" style="background:'+color+'18;color:'+color+';font-size:.62rem">'+r.cat+'</span></td>'+r.vals.map(v=>'<td class="mo'+(v?' pos':'')+'">'+( v?fmtFull(v):'—')+'</td>').join('')+'<td class="mo bld pos">'+fmtFull(tot)+'</td></tr>';
  }).join('');
  tbody.innerHTML+='<tr class="grp"><td colspan="2">TOTAL INGRESOS '+entName.toUpperCase()+'</td>'+totM.map(v=>'<td class="mo pos bld">'+(v?fmtFull(v):'—')+'</td>').join('')+'<td class="mo pos bld">'+fmtFull(sum(totM))+'</td></tr>';
}

function rNomView(entKey){
  const cfg=ENT_MAP[entKey]; if(!cfg) return;
  const nomK=cfg.nomKey;
  const thead=document.getElementById(entKey+'-nom-thead');
  const tbody=document.getElementById(entKey+'-nom-tbody');
  if(!thead||!tbody) return;

  const emps=NOM_EDIT.filter(e=>(e[nomK]||0)>0);
  const detail=emps.map(e=>{
    const mc=Math.round(e.s*(e[nomK]||0)/100);
    return {n:e.n,r:e.r,tipo:e.tipo,pct:e[nomK],vals:Array(12).fill(mc),total:mc*12};
  });
  const monthTotals=MO.map((_,i)=>detail.reduce((s,e)=>s+e.vals[i],0));
  const annualTotal=sum(monthTotals);

  // KPIs
  const kT=document.getElementById(entKey+'-nom-kpi-total');
  const kC=document.getElementById(entKey+'-nom-kpi-count');
  const kA=document.getElementById(entKey+'-nom-kpi-avg');
  if(kT){kT.textContent=annualTotal>0?fmtK(annualTotal):'—';kT.style.color=annualTotal>0?cfg.color:'var(--muted)';kT.style.fontSize=annualTotal>0?'':'.85rem';}
  if(kC){kC.textContent=emps.length+' empleado'+(emps.length!==1?'s':'');kC.style.color='var(--blue)';}
  if(kA){const avg=annualTotal/12;kA.textContent=avg>0?fmtK(avg):'—';kA.style.color=avg>0?'var(--green)':'var(--muted)';kA.style.fontSize=avg>0?'':'.85rem';}

  // Table
  thead.innerHTML='<th>Empleado</th><th>Rol</th><th class="r">Tipo</th><th class="r">%</th>'+MO.map(m=>'<th class="r">'+m+'</th>').join('')+'<th class="r">Total</th>';
  if(detail.length===0){
    tbody.innerHTML='<tr><td colspan="17" style="text-align:center;padding:24px;color:var(--muted);font-size:.82rem">Sin empleados asignados a '+cfg.name+' — configura la distribución en <b>Nómina Compartida</b></td></tr>';
    return;
  }
  tbody.innerHTML=detail.map(e=>{
    const tc=e.tipo==='Operativo'?'#0073ea':'#9b51e0';
    return '<tr><td class="bld">'+e.n+'</td><td style="color:var(--muted);font-size:.76rem">'+e.r+'</td><td style="text-align:right"><span style="font-size:.66rem;font-weight:600;color:'+tc+'">'+e.tipo+'</span></td><td class="mo" style="color:'+cfg.color+';font-weight:600">'+e.pct+'%</td>'+e.vals.map(v=>'<td class="mo'+(v?' neg':'')+'">'+(v?fmt(v):'—')+'</td>').join('')+'<td class="mo bld neg">'+fmt(e.total)+'</td></tr>';
  }).join('');
  tbody.innerHTML+='<tr class="grp"><td colspan="4">TOTAL NÓMINA '+cfg.fullName.toUpperCase()+'</td>'+monthTotals.map(v=>'<td class="mo neg bld">'+fmt(v)+'</td>').join('')+'<td class="mo neg bld">'+fmt(annualTotal)+'</td></tr>';
}

// ═══════════════════════════════════════
// RENDER: CONSOLIDADOS
// ═══════════════════════════════════════
function rConsCharts(type){
  const pieTip={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}};
  const noAxes={x:{display:false},y:{display:false}};
  const smOpts=(noLeg=true)=>({...cOpts(),plugins:{legend:{display:!noLeg,labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}});

  if(type==='centum'){
    // Ingresos por entidad bar (Salem vs Endless vs Dynamo)
    dc('c-centum-gas');
    const centumEnts = ['Salem','Endless','Dynamo'];
    const centumIngByEnt = centumEnts.map(e => {
      return MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((s,r)=>s+(r.vals[i]||0),0));
    });
    CH['c-centum-gas']=new Chart(document.getElementById('c-centum-gas'),{type:'bar',data:{labels:MO,
      datasets:[
        {label:'Salem',data:centumIngByEnt[0],backgroundColor:'rgba(0,115,234,.5)',borderWidth:0},
        {label:'Endless',data:centumIngByEnt[1],backgroundColor:'rgba(0,184,117,.5)',borderWidth:0},
        {label:'Dynamo',data:centumIngByEnt[2],backgroundColor:'rgba(255,112,67,.5)',borderWidth:0},
      ]
    },options:{...smOpts(false),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});

    // Cartera donut from END_CREDITS + DYN_CREDITS
    dc('c-centum-pie');
    const endCart = END_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
    const dynCart = DYN_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
    const totCart = endCart + dynCart;
    CH['c-centum-pie']=new Chart(document.getElementById('c-centum-pie'),{type:'doughnut',data:{
      labels: totCart>0 ? [`Endless ${fmtK(endCart)}`,`Dynamo ${fmtK(dynCart)}`] : ['Sin datos de cartera'],
      datasets:[{
        data: totCart>0 ? [endCart||0.01, dynCart||0.01] : [1],
        backgroundColor: totCart>0 ? ['rgba(0,184,117,.6)','rgba(255,112,67,.6)'] : ['rgba(134,134,134,.2)'],
        borderColor: totCart>0 ? ['#00b875','#ff7043'] : ['rgba(134,134,134,.3)'],
        borderWidth: totCart>0 ? 2 : 0
      }]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }

  if(type==='grupo'){
    // Ingresos por fuente — all entities
    dc('c-grupo-ing');
    const _grpIng = (ent) => MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===ent&&r.yr==_year).reduce((s,r)=>s+(r.vals[i]||0),0));
    const salIngM = _grpIng('Salem'), endIngM = _grpIng('Endless'), dynIngM = _grpIng('Dynamo'), wbIngM = _grpIng('Wirebit');
    CH['c-grupo-ing']=new Chart(document.getElementById('c-grupo-ing'),{type:'bar',data:{labels:MO,
      datasets:[
        {label:'Salem',data:salIngM,backgroundColor:'rgba(0,115,234,.5)',borderWidth:0},
        {label:'Endless',data:endIngM,backgroundColor:'rgba(0,184,117,.5)',borderWidth:0},
        {label:'Dynamo',data:dynIngM,backgroundColor:'rgba(255,112,67,.5)',borderWidth:0},
        {label:'Wirebit',data:wbIngM,backgroundColor:'rgba(155,81,224,.5)',borderWidth:0},
      ]
    },options:{...smOpts(false),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
    // Nómina por empresa donut
    dc('c-grupo-nom');
    const _nomE={Salem:0,Endless:0,Dynamo:0,Wirebit:0};
    try{NOM_EDIT.forEach(n=>{_nomE.Salem+=n.s*(n.sal||0)/100;_nomE.Endless+=n.s*(n.end||0)/100;_nomE.Dynamo+=n.s*(n.dyn||0)/100;_nomE.Wirebit+=n.s*(n.wb||0)/100;})}catch(e){}
    CH['c-grupo-nom']=new Chart(document.getElementById('c-grupo-nom'),{type:'doughnut',data:{
      labels:['Salem '+fmtK(_nomE.Salem),'Endless '+fmtK(_nomE.Endless),'Dynamo '+fmtK(_nomE.Dynamo),'Wirebit '+fmtK(_nomE.Wirebit)],
      datasets:[{data:[_nomE.Salem,_nomE.Endless,_nomE.Dynamo,_nomE.Wirebit],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)'],borderWidth:0}]
    },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
  }
}

function rConsolidado(type){
  const isCentum=type==='centum';
  const tid=isCentum?'centum':'grupo';
  const thead=document.getElementById(tid+'-thead');
  const tbody=document.getElementById(tid+'-tbody');
  thead.innerHTML=`<th>Concepto</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total ${_year}</th>`;

  // ── Helper: aggregate S.recs vals by entities and tipo ──
  function _rv(ents, tipo){
    const ea = Array.isArray(ents)?ents:[ents];
    return MO.map((_,i)=>
      (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&ea.includes(r.ent)&&r.yr==_year)
        .reduce((s,r)=>s+(r.vals[i]||0),0)
    );
  }
  // Nómina mensual por entidades
  function _nom(ents){
    const ea = Array.isArray(ents)?ents:[ents];
    let total=0;
    try{ NOM_EDIT.forEach(n=>{
      ea.forEach(e=>{
        const k=e==='Salem'?'sal':e==='Endless'?'end':e==='Dynamo'?'dyn':'wb';
        total+=n.s*(n[k]||0)/100;
      });
    });}catch(e){}
    return MO.map(()=>Math.round(total));
  }
  const _add=(a,b)=>a.map((v,i)=>v+(b[i]||0));
  const _sub=(a,b)=>a.map((v,i)=>v-(b[i]||0));

  const centumEnts=['Salem','Endless','Dynamo'];
  let rows;

  if(isCentum){
    const salIng=_rv('Salem','ingreso'), endIng=_rv('Endless','ingreso'), dynIng=_rv('Dynamo','ingreso');
    const totIng=_add(_add(salIng,endIng),dynIng);
    const totGas=_rv(centumEnts,'gasto');
    const nom=_nom(centumEnts);
    const margen=_sub(totIng,totGas);
    const ebitda=_sub(margen,nom);
    rows=[
      {l:'▸ CENTUM CAPITAL — Ingresos',hdr:true},
      {l:'  · Salem',vals:salIng,t:'ing'},
      {l:'  · Endless',vals:endIng,t:'ing'},
      {l:'  · Dynamo',vals:dynIng,t:'ing'},
      {l:'TOTAL INGRESOS CENTUM',vals:totIng,t:'total',bold:true},
      {l:'COSTOS + GASTOS OPERATIVOS',vals:totGas,t:'gasto',bold:true},
      {l:'MARGEN BRUTO',vals:margen,t:'util',bold:true},
      {l:'NÓMINA CENTUM',vals:nom,t:'gasto',bold:true},
      {l:'EBITDA CENTUM CAPITAL',vals:ebitda,t:'util',bold:true},
    ];
  } else {
    // Grupo Financiero
    const cIng=_rv(centumEnts,'ingreso'), wIng=_rv('Wirebit','ingreso');
    const totIng=_add(cIng,wIng);
    const cGas=_rv(centumEnts,'gasto'), wGas=_rv('Wirebit','gasto');
    const totGas=_add(cGas,wGas);
    const margen=_sub(totIng,totGas);
    const cNom=_nom(centumEnts), wNom=_nom('Wirebit');
    const totNom=_add(cNom,wNom);
    const ebitda=_sub(margen,totNom);
    rows=[
      {l:'▸ CENTUM CAPITAL — Ingresos',vals:cIng,t:'ing'},
      {l:'▸ WIREBIT — Ingresos',vals:wIng,t:'ing'},
      {l:'TOTAL INGRESOS GRUPO',vals:totIng,t:'total',bold:true},
      {l:'▸ CENTUM CAPITAL — Gastos',vals:cGas,t:'gasto'},
      {l:'▸ WIREBIT — Gastos',vals:wGas,t:'gasto'},
      {l:'TOTAL GASTOS',vals:totGas,t:'total',bold:true},
      {l:'MARGEN BRUTO GRUPO',vals:margen,t:'util',bold:true},
      {l:'▸ CENTUM CAPITAL — Nómina',vals:cNom,t:'gasto'},
      {l:'▸ WIREBIT — Nómina',vals:wNom,t:'gasto'},
      {l:'TOTAL NÓMINA GRUPO',vals:totNom,t:'total',bold:true},
      {l:'EBITDA GRUPO',vals:ebitda,t:'util',bold:true},
    ];
  }

  tbody.innerHTML=rows.map(r=>{
    if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
    const tot=sum(r.vals);
    const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
    return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map(v=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'—'}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}</td></tr>`;
  }).join('');

  // ── KPIs ──
  if(isCentum){
    const centumNom = nomMesTotal('Salem') + nomMesTotal('Endless') + nomMesTotal('Dynamo');
    const el = document.getElementById('centum-kpi-nomina');
    if(el){ el.textContent = fmtK(centumNom) + '/mes'; el.style.color=''; el.style.fontSize=''; }
    // Ingresos + Gastos KPIs
    const kIng = document.getElementById('centum-k-ing');
    const kGas = document.getElementById('centum-k-gas');
    const totI = _rv(centumEnts,'ingreso').reduce((a,b)=>a+b,0);
    const totG = _rv(centumEnts,'gasto').reduce((a,b)=>a+b,0);
    if(kIng) kIng.textContent = totI>0 ? fmtK(totI) : '—';
    if(kGas) kGas.textContent = totG>0 ? fmtK(totG) : '—';
    // Cartera Crédito KPI
    const allCred = [...END_CREDITS,...DYN_CREDITS].filter(c=>c.st==='Activo'||c.st==='Vencido');
    const carteraTotal = allCred.reduce((s,c)=>s+credSaldoActual(c),0);
    const kCart = document.getElementById('centum-kpi-cartera');
    const kCartSub = document.getElementById('centum-kpi-cartera-sub');
    if(kCart) kCart.textContent = carteraTotal > 0 ? fmtK(carteraTotal) : '—';
    if(kCartSub) kCartSub.textContent = allCred.length + ' crédito' + (allCred.length!==1?'s':'') + ' (End+Dyn)';
  } else {
    const totI = _rv(['Salem','Endless','Dynamo','Wirebit'],'ingreso').reduce((a,b)=>a+b,0);
    const totG = _rv(['Salem','Endless','Dynamo','Wirebit'],'gasto').reduce((a,b)=>a+b,0);
    const kIng = document.getElementById('grupo-k-ing');
    const kGas = document.getElementById('grupo-k-gas');
    if(kIng) kIng.textContent = totI>0 ? fmtK(totI) : '—';
    if(kGas) kGas.textContent = totG>0 ? fmtK(totG) : '—';
  }
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
  try{ FI_ROWS = DB.get('gf_fi') || []; }catch(e){FI_ROWS=[];}
  // Reinject créditos automáticos
  fiInjectCredits();
}
function fgLoad(){
  try{ FG_ROWS = DB.get('gf_fg') || []; }catch(e){FG_ROWS=[];}
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
    const vals = Array(12).fill(0);
    let hasAmort = false;

    // Usar tabla de amortización real si existe
    if(cr.amort && cr.amort.length > 1){
      hasAmort = true;
      cr.amort.slice(1).forEach(row => {
        const fecha = (typeof credParseDate==='function') ? credParseDate(row.fecha) : null;
        if(!fecha || fecha.getFullYear() !== _year) return;
        vals[fecha.getMonth()] += Math.round(row.int || 0);
      });
    }

    // Fallback: fórmula simplificada si no hay tabla de amortización
    if(!hasAmort){
      const intMes = Math.round(cr.monto * (cr.tasa/100) / 12);
      if(!intMes) return;
      vals.fill(intMes);
    }

    if(!vals.some(v => v > 0)) return;

    // Intereses — vals ahora reflejan el periodo real (mensual/trim/sem/anual)
    FI_ROWS.unshift({
      id: 'cred_int_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
      concepto: 'Intereses — '+cr.cl,
      ent: cr.ent,
      cat: 'Crédito Simple',
      yr: String(_year),
      vals: vals,
      auto: true,
      credId: cr.cl,
      note: `${cr.tasa}% anual · ${fmt(cr.monto)}` + (hasAmort ? ' · amort' : ' · fórmula')
    });

    // Comisión de apertura — en el mes real de desembolso
    if(cr.com && cr.com > 0){
      const comMonto = Math.round(cr.monto * cr.com / 100);
      const comVals = Array(12).fill(0);
      const dDate = (typeof credParseDate==='function') ? credParseDate(cr.disbDate) : null;
      const comMonth = (dDate && dDate.getFullYear() === _year) ? dDate.getMonth() : 0;
      comVals[comMonth] = comMonto;
      FI_ROWS.unshift({
        id: 'cred_com_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
        concepto: 'Comisión Apertura — '+cr.cl,
        ent: cr.ent,
        cat: 'Crédito Simple',
        yr: String(_year),
        vals: comVals,
        auto: true,
        credId: cr.cl,
        note: cr.com + '% comisión'
      });
    }
  });
}

// ── Inyectar datos TPV como filas automáticas de ingresos y gastos ──
function fiInjectTPV(){
  // Quitar filas auto TPV anteriores
  FI_ROWS = FI_ROWS.filter(r => !r.autoTPV);
  FG_ROWS = FG_ROWS.filter(r => !r.autoTPV);

  const year = String(_year);
  const data = (typeof TPV !== 'undefined' && TPV.monthlyPLData)
    ? TPV.monthlyPLData(year) : null;
  if (!data || !data.monthly) return;

  const vals_salem = data.monthly.map(m => Math.round(m.com_salem || 0));
  const vals_promo = data.monthly.map(m => Math.round(m.com_comisionista || 0));
  const vals_internas = data.monthly.map(m => Math.round(m.com_agentes || 0));

  // Ingreso: Comisiones TPV (Salem)
  // NOTE: Do NOT set auto:true here — fiInjectCredits() removes all r.auto rows.
  // Use autoTPV:true exclusively to avoid interference with credit injection.
  FI_ROWS.unshift({
    id: 'tpv_com_salem',
    concepto: 'Comisiones TPV (auto)',
    ent: 'Salem',
    cat: 'TPV',
    yr: year,
    vals: vals_salem,
    autoTPV: true,
    note: 'Auto-inyectado desde datos TPV'
  });

  // Gasto: Comisiones Promotoría (external promoters)
  // Use 'TPV Comisiones' category to avoid double-counting with
  // the generic "Comisiones Bancarias" line in Gastos Administrativos
  FG_ROWS.unshift({
    id: 'tpv_com_promo',
    concepto: 'Comisiones Promotoría TPV',
    ent: 'Salem',
    cat: 'TPV Comisiones',
    yr: year,
    vals: vals_promo,
    autoTPV: true,
    note: 'Auto-inyectado desde datos TPV'
  });

  // Gasto: Comisiones Internas (agent commissions)
  FG_ROWS.unshift({
    id: 'tpv_com_internas',
    concepto: 'Comisiones Internas TPV',
    ent: 'Salem',
    cat: 'TPV Comisiones',
    yr: year,
    vals: vals_internas,
    autoTPV: true,
    note: 'Auto-inyectado desde datos TPV'
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
    const isAuto = r.auto || r.autoTPV;
    const rowBg  = isAuto ? (r.autoTPV ? 'background:rgba(0,115,234,.04)' : 'background:rgba(0,184,117,.04)') : '';
    const badge  = r.autoTPV
      ? `<span style="font-size:.57rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span>`
      : (isAuto ? `<span style="font-size:.57rem;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto</span>` : '');
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
        ${!isAuto && !isViewer() ? `<button onclick="fiDelRow('${r.id}')" title="Eliminar"
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
  FI_ROWS.push({id: Date.now(), concepto:'', ent:'Salem', cat:'TPV', yr:String(_year), vals:Array(12).fill(0), auto:false});
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
  // Persist only non-auto rows (exclude credit auto AND TPV auto)
  const toSave = FI_ROWS.filter(r=>!r.auto && !r.autoTPV);
  DB.set('gf_fi', toSave);
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
  XLSX.writeFile(wb2, 'GF_Flujo_Ingresos.xlsx');
}

// ═══════════════════════════════════════
// FLUJO DE GASTOS — Engine
// ═══════════════════════════════════════
function rFlujoGas(){
  if(!document.getElementById('fg-tbody')) return; // view not active
  const tbody = document.getElementById('fg-tbody');
  if(!tbody) return;

  // Show TPV auto notice if any autoTPV rows
  const fgTpvNotice = document.getElementById('fg-tpv-notice');
  if(fgTpvNotice) fgTpvNotice.style.display = FG_ROWS.some(r=>r.autoTPV) ? 'flex' : 'none';

  tbody.innerHTML = FG_ROWS.map((r,ri) => {
    // Auto-injected TPV rows: non-editable display
    if(r.autoTPV) {
      const entC = ENT_COLOR[r.ent]||'#555';
      const rowTot = r.vals.reduce((a,b)=>a+b,0);
      return `<tr style="background:rgba(0,115,234,.04);border-bottom:1px solid var(--border)">
        <td style="padding:4px 8px"><div style="font-size:.78rem;font-weight:600;color:var(--text)">${r.concepto}<span style="font-size:.57rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span></div>
        <div style="font-size:.6rem;color:var(--muted);margin-top:1px">${r.note||''}</div></td>
        <td style="padding:4px 6px"><span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span></td>
        <td style="padding:4px 6px;font-size:.73rem">${r.cat}</td>
        <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
        <td></td><td></td>
        ${r.vals.map(v=>`<td class="mo" style="font-size:.74rem;color:var(--muted);padding:2px 3px">${v?fmt(v):'—'}</td>`).join('')}
        <td class="mo neg bld" style="font-size:.78rem;font-weight:700">${rowTot?fmt(rowTot):'—'}</td>
        <td></td></tr>`;
    }

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
        ${!isViewer() ? `<button onclick="fgDelRow('${r.id}')" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button>` : ''}
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
  FG_ROWS.push({id:Date.now(), concepto:'', ent:'Salem', cat:'Administrativo', yr:String(_year), shared:false, gcConcept:'', vals:Array(12).fill(0)});
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
  // Persist only non-auto rows (exclude TPV auto-injected)
  const toSave = FG_ROWS.filter(r => !r.autoTPV);
  DB.set('gf_fg', toSave);
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
  XLSX.writeFile(wb2, 'GF_Flujo_Gastos.xlsx');
}

// ═══════════════════════════════════════
// SYNC FLUJOS → S.recs (para P&L)
// ═══════════════════════════════════════
function syncFlujoToRecs(){
  // Limpiar recs previos generados por flujos (no los de addRec legacy)
  S.recs = S.recs.filter(r => !r.fromFlujo);

  // Ingresos
  FI_ROWS.forEach(r => {
    if(!r.concepto && !r.auto && !r.autoTPV) return;
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

  // ── Wirebit upload fees → S.recs ──
  const _WB_CAT = {
    'Fees Fondeo Tarjetas':'Tarjeta Wirebit',
    'Fees Fondeo Tarjeta CRM':'Tarjeta Wirebit',
    'Fees VEX Retail':'Exchange',
    'Fees VEX Ecommerce':'Exchange',
    'Fees Retiros / OTC':'OTC',
  };
  if(typeof WB_ING !== 'undefined'){
    for(const [concepto, vals] of Object.entries(WB_ING)){
      if(!vals.some(v=>v>0)) continue;
      S.recs.push({
        id: 'wb_fee_'+concepto.replace(/[^a-zA-Z0-9]/g,'_'),
        tipo: 'ingreso',
        concepto: concepto,
        ent: 'Wirebit',
        cat: _WB_CAT[concepto] || 'Exchange',
        yr: String(_year),
        vals: [...vals],
        fromFlujo: true
      });
    }
  }

  // ── Wirebit costos directos → S.recs ──
  if(typeof WB_COSTO_TOTAL !== 'undefined' && WB_COSTO_TOTAL.some(v=>v>0)){
    const _WB_COST_MAP = {
      'Bitfinex':'Costo Directo','Lmax':'Costo Directo','Bitso':'Costo Directo',
      'Efevoo Fondeo':'Costo Directo','Efevoo Tarjetas':'Costo Directo',
      'Efevoo SaaS':'Costo Directo','Comisiones BBVA':'Com. Bancarias',
    };
    if(typeof WB_COSTOS !== 'undefined'){
      for(const [concepto, vals] of Object.entries(WB_COSTOS)){
        if(!vals.some(v=>v>0)) continue;
        S.recs.push({
          id: 'wb_cost_'+concepto.replace(/[^a-zA-Z0-9]/g,'_'),
          tipo: 'gasto',
          concepto: concepto,
          ent: 'Wirebit',
          cat: _WB_COST_MAP[concepto] || 'Costo Directo',
          yr: String(_year),
          vals: [...vals],
          fromFlujo: true
        });
      }
    }
  }

  DB.set('gf4', S.recs.filter(r=>!r.fromFlujo));
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
    DB.remove('gf4');
    DB.remove('gf_fi');
    DB.remove('gf_fg');
    refreshActivePL();
    toast('🗑 Datos borrados');
  });
}
function delRec(id){
  S.recs=S.recs.filter(r=>String(r.id)!==String(id));
  DB.set('gf4', S.recs);
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
  XLSX.utils.book_append_sheet(wb2,ws,'Flujo GF');
  XLSX.writeFile(wb2,'GF_datos.xlsx');
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
// TOP 10 GASTOS MODAL
// ═══════════════════════════════════════
function openTopGastos(entity) {
  const ov = document.getElementById('top-gastos-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  const tbody = document.getElementById('top-gas-tbody');
  const kpisDiv = document.getElementById('top-gas-kpis');
  const subDiv = document.getElementById('top-gas-subtitle');
  const thEnt = document.getElementById('top-gas-th-ent');

  // Show/hide entity column
  if (thEnt) thEnt.style.display = entity ? 'none' : '';

  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Cargando...</td></tr>';

  try {
    // 1. Filter S.recs for gastos (exclude shared sources) + year
    let gastos = (S.recs || []).filter(r => !r.isSharedSource && r.tipo === 'gasto' && r.yr==_year);

    // 2. If entity specified, filter
    if (entity) gastos = gastos.filter(r => r.ent === entity);

    // 3. Aggregate by concepto + ent
    const map = {};
    gastos.forEach(r => {
      const key = (r.concepto || '?') + '|' + (r.ent || '?');
      if (!map[key]) map[key] = { concepto: r.concepto || '?', ent: r.ent || '?', cat: r.cat || '-', total: 0 };
      map[key].total += (r.vals || []).reduce((a, v) => a + (v || 0), 0);
    });

    // 4. Sort descending and take top 10
    const sorted = Object.values(map).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    const top10 = sorted.slice(0, 10);
    const totalGas = sorted.reduce((s, r) => s + r.total, 0);
    const top10Tot = top10.reduce((s, r) => s + r.total, 0);
    const top10Pct = totalGas > 0 ? (top10Tot / totalGas * 100).toFixed(1) : '0';

    // 5. Handle empty state
    if (!sorted.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Sin gastos capturados</td></tr>';
      if (kpisDiv) kpisDiv.innerHTML = '';
      if (subDiv) subDiv.textContent = entity ? 'Gastos · ' + entity : 'Gastos por empresa · Grupo';
      return;
    }

    // 6. Subtitle
    if (subDiv) subDiv.textContent = entity
      ? 'Gastos · ' + entity + ' · ' + sorted.length + ' conceptos'
      : 'Gastos por empresa · Grupo · ' + sorted.length + ' conceptos';

    // 7. KPI chips
    if (kpisDiv) {
      kpisDiv.innerHTML = `
        <div style="background:var(--orange-bg);color:var(--orange);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Total: ${fmtK(totalGas)}
        </div>
        <div style="background:var(--blue-bg);color:#0073ea;padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Top 10: ${fmtK(top10Tot)} (${top10Pct}%)
        </div>
        <div style="background:var(--purple-bg);color:var(--purple);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          ${sorted.length} conceptos
        </div>`;
    }

    // 8. Render table rows
    const entColors = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
    if (tbody) {
      tbody.innerHTML = top10.map((r, i) => {
        const pct = totalGas > 0 ? (r.total / totalGas * 100).toFixed(1) : '0.0';
        const barW = top10[0] && top10[0].total > 0 ? (r.total / top10[0].total * 100).toFixed(0) : 0;
        const ec = entColors[r.ent] || '#555';
        return `<tr>
          <td style="font-weight:700;color:var(--orange)">${i + 1}</td>
          <td><b>${r.concepto}</b></td>
          ${entity ? '' : `<td><span style="color:${ec};font-weight:600">${r.ent}</span></td>`}
          <td style="color:var(--muted)">${r.cat}</td>
          <td style="text-align:right"><b style="color:var(--orange)">${fmtK(r.total)}</b>
            <div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px">
              <div style="height:100%;background:var(--orange);border-radius:2px;width:${barW}%"></div>
            </div>
          </td>
          <td style="text-align:right;font-weight:600">${pct}%</td>
        </tr>`;
      }).join('');
    }
  } catch (e) {
    console.error('[Gastos] openTopGastos error:', e);
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#e53935">Error al cargar datos</td></tr>';
  }
}

function closeTopGastos() {
  const ov = document.getElementById('top-gastos-overlay');
  if (ov) ov.style.display = 'none';
}

// ═══════════════════════════════════════ END
