// GF — Finanzas: Gastos Compartidos
(function(window) {
  'use strict';

// ── ESTADO EDITABLE DE GASTOS COMPARTIDOS ──
// Intentar cargar de DB primero; si no hay, usar defaults de data-constants
var _gcSaved = (typeof DB !== 'undefined' && DB.get) ? DB.get('gf_gc') : null;
let GC_EDIT = (_gcSaved && _gcSaved.length)
  ? _gcSaved
  : GCOMP.map(g=>({c:g.c,cat:g.cat,ppto:g.ppto||0,sal:Math.round(g.sal*100),end:Math.round(g.end*100),dyn:Math.round(g.dyn*100),wb:Math.round(g.wb*100)}));

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
  const inS='style="width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;padding:0;color:var(--text)"';
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
  // Persistir a localStorage + Supabase
  DB.set('gf_gc', GC_EDIT);
  // Propagar cambios al P&L
  if(typeof syncFlujoToRecs === 'function') syncFlujoToRecs();
  if(typeof refreshActivePL === 'function') refreshActivePL();
  const btn=event.target;
  btn.textContent='✅ Guardado';
  setTimeout(()=>btn.textContent='💾 Guardar',1500);
  toast('✅ Gastos compartidos guardados — P&L actualizado');
}

function rGastosComp(){
  const tbody=document.getElementById('gc-edit-tbody');
  if(!tbody) return;
  tbody.innerHTML=GC_EDIT.map((g,i)=>gcRenderRow(g,i)).join('');
  gcUpdateKPIs();
}

  // Expose globals
  window.GC_EDIT = GC_EDIT;
  window.CAT_OPTIONS = CAT_OPTIONS;
  window.gcUpdateKPIs = gcUpdateKPIs;
  window.gcUpdatePreview = gcUpdatePreview;
  window.gcRenderRow = gcRenderRow;
  window.gcRefreshRow = gcRefreshRow;
  window.gcAddRow = gcAddRow;
  window.gcDelRow = gcDelRow;
  window.gcSave = gcSave;
  window.rGastosComp = rGastosComp;

  // Register views
  if(typeof registerView === 'function'){
    registerView('gastos_comp', function(){ rGastosComp(); });
  }

})(window);
