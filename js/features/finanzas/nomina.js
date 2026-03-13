// GF — Finanzas: Nomina
(function(window) {
  'use strict';

// ── ESTADO EDITABLE DE NOMINA (en memoria) ──
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

function rNomina(){
  const tbody=document.getElementById('nom-edit-tbody');
  if(!tbody) return;
  tbody.innerHTML=NOM_EDIT.map((e,i)=>nomRenderRow(e,i)).join('');
  nomUpdateFooter();
}

  // Expose globals
  window.NOM_EDIT = NOM_EDIT;
  window._nomDist = _nomDist;
  window.nomMesTotal = nomMesTotal;
  window.nomMesOp = nomMesOp;
  window.nomMesAdm = nomMesAdm;
  window.nomCalcTotals = nomCalcTotals;
  window.nomUpdateFooter = nomUpdateFooter;
  window.nomRenderRow = nomRenderRow;
  window.nomRefreshRow = nomRefreshRow;
  window.nomAddRow = nomAddRow;
  window.nomDelRow = nomDelRow;
  window.nomSave = nomSave;
  window.rNomina = rNomina;
})(window);
