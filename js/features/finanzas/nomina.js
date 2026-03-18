// GF — Finanzas: Nomina
(function(window) {
  'use strict';

// ── ESTADO EDITABLE DE NOMINA ──
// Intentar cargar de DB primero; si no hay, usar defaults de data-constants
var _nomSaved = (typeof DB !== 'undefined' && DB.get) ? DB.get('gf_nomina') : null;
let NOM_EDIT = (_nomSaved && _nomSaved.length)
  ? _nomSaved
  : NOM.map(e=>({n:e.n,r:e.r,s:e.s,tipo:e.tipo||'Administrativo',fi:'',sal:Math.round(e.dist.Salem*100),end:Math.round(e.dist.Endless*100),dyn:Math.round(e.dist.Dynamo*100),wb:Math.round(e.dist.Wirebit*100),stel:Math.round((e.dist.Stellaris||0)*100)}));

// Factor de nómina por mes/año considerando fecha de ingreso
// fi: "YYYY-MM-DD" — si vacío o ausente, factor = 1 (siempre activo)
function _nomFactor(n, mes, year) {
  if (!n.fi) return 1;
  const parts = n.fi.split('-');
  if (parts.length < 2) return 1;
  const fiY = +parts[0], fiM = +parts[1] - 1, fiD = parts[2] ? +parts[2] : 1;
  const yr = +year, m = +mes;
  if (yr < fiY || (yr === fiY && m < fiM)) return 0;         // antes del ingreso
  if (yr > fiY || (yr === fiY && m > fiM)) return 1;         // mes completo posterior
  // mismo año y mes → prorrateo por días
  const diasMes = new Date(yr, m + 1, 0).getDate();
  return Math.max(0, (diasMes - fiD + 1) / diasMes);
}

const _nomDist = (e, n, mes, year) => {
  const pct = (e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:e==='Stellaris'?n.stel:n.wb)||0;
  const factor = (mes !== undefined && year !== undefined) ? _nomFactor(n, mes, year) : 1;
  return n.s * (pct/100) * factor;
};
const nomMesTotal = (e, mes, year) => NOM_EDIT.reduce((a,n)=>a+_nomDist(e,n,mes,year),0);
const nomMesOp    = (e, mes, year) => NOM_EDIT.filter(n=>n.tipo==='Operativo').reduce((a,n)=>a+_nomDist(e,n,mes,year),0);
const nomMesAdm   = (e, mes, year) => NOM_EDIT.filter(n=>n.tipo==='Administrativo').reduce((a,n)=>a+_nomDist(e,n,mes,year),0);

function nomCalcTotals(){
  let ts=0,te=0,td=0,tw=0,tst=0,tot=0;
  NOM_EDIT.forEach(e=>{
    ts+=e.s*(e.sal/100); te+=e.s*(e.end/100); td+=e.s*(e.dyn/100); tw+=e.s*(e.wb/100); tst+=e.s*((e.stel||0)/100); tot+=e.s;
  });
  return{ts,te,td,tw,tst,tot};
}

function nomUpdateFooter(){
  const {ts,te,td,tw,tst,tot}=nomCalcTotals();
  const q=id=>document.getElementById(id);
  q('nom-ft-total').textContent=fmt(tot);
  q('nom-ft-sal').textContent=fmt(ts);
  q('nom-ft-end').textContent=fmt(te);
  q('nom-ft-dyn').textContent=fmt(td);
  q('nom-ft-wb').textContent=fmt(tw);
  var _stelFt=q('nom-ft-stel'); if(_stelFt) _stelFt.textContent=fmt(tst);
  // KPI cards
  q('nom-kpi-total').textContent=fmtK(tot);
  q('nom-kpi-emp').textContent=NOM_EDIT.length+' empleados';
  q('nom-kpi-sal').textContent=fmtK(ts);
  q('nom-kpi-end').textContent=fmtK(te);
  q('nom-kpi-dyn').textContent=fmtK(td);
  q('nom-kpi-wb').textContent=fmtK(tw);
  var _stelKpi=q('nom-kpi-stel'); if(_stelKpi) _stelKpi.textContent=fmtK(tst);
  // avg % cols
  const n=NOM_EDIT.length||1;
  const as=NOM_EDIT.reduce((a,e)=>a+e.sal,0)/n;
  const ae=NOM_EDIT.reduce((a,e)=>a+e.end,0)/n;
  const ad=NOM_EDIT.reduce((a,e)=>a+e.dyn,0)/n;
  const aw=NOM_EDIT.reduce((a,e)=>a+e.wb,0)/n;
  const ast=NOM_EDIT.reduce((a,e)=>a+(e.stel||0),0)/n;
  q('nom-ft-sal-p').textContent=as.toFixed(1)+'% avg';
  q('nom-ft-end-p').textContent=ae.toFixed(1)+'% avg';
  q('nom-ft-dyn-p').textContent=ad.toFixed(1)+'% avg';
  q('nom-ft-wb-p').textContent=aw.toFixed(1)+'% avg';
  var _stelFtP=q('nom-ft-stel-p'); if(_stelFtP) _stelFtP.textContent=ast.toFixed(1)+'% avg';
  // propagate to NOM global
  NOM_EDIT.forEach((e,i)=>{
    if(NOM[i]){NOM[i].s=e.s;NOM[i].dist={Salem:e.sal/100,Endless:e.end/100,Dynamo:e.dyn/100,Wirebit:e.wb/100,Stellaris:(e.stel||0)/100};}
  });
}

function nomRenderRow(e,i){
  const tot=e.sal+e.end+e.dyn+e.wb+(e.stel||0);
  const ok=tot===100;
  const totCls=ok?'pos':'neg';
  const inStyle='style="width:100%;border:none;background:transparent;text-align:right;font-size:.78rem;font-family:inherit;color:inherit;padding:0"';
  const tipoColor = e.tipo==='Operativo' ? '#0073ea' : '#9b51e0';
  // Indicador visual de fecha de ingreso
  const fiVal = e.fi || '';
  const fiLabel = fiVal ? ('<span style="font-size:.62rem;color:var(--muted);display:block;margin-top:1px">desde '+fiVal.substring(0,7)+'</span>') : '';
  return`<tr id="nom-row-${i}">
    <td><input ${inStyle} value="${e.n}" onchange="NOM_EDIT[${i}].n=this.value" style="text-align:left;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit"></td>
    <td><input ${inStyle} value="${e.r}" onchange="NOM_EDIT[${i}].r=this.value" style="text-align:left;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;color:var(--muted)"></td>
    <td style="padding:2px 6px">
      <input type="date" value="${fiVal}" title="Fecha de ingreso — nómina aplica desde esta fecha (proporcional en el mes de entrada)"
        style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.7rem;padding:2px 4px;background:var(--bg);font-family:inherit;color:var(--text)"
        onchange="NOM_EDIT[${i}].fi=this.value;nomUpdateFooter()">
    </td>
    <td style="padding:2px 6px">
      <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.72rem;padding:2px 4px;background:var(--bg);color:${tipoColor};font-weight:600"
        onchange="NOM_EDIT[${i}].tipo=this.value;nomRefreshRow(${i})">
        <option${e.tipo==='Operativo'?' selected':''}>Operativo</option>
        <option${e.tipo==='Administrativo'?' selected':''}>Administrativo</option>
      </select>
    </td>
    <td><input type="text" value="${fmt(e.s)}"
      onfocus="this.value=NOM_EDIT[${i}].s;this.select()"
      onblur="NOM_EDIT[${i}].s=+(this.value.replace(/[^0-9]/g,''))||0;this.value=fmt(NOM_EDIT[${i}].s);nomUpdateFooter()"
      style="text-align:right;width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;font-weight:600;color:var(--green);padding:0"></td>
    <td style="background:rgba(0,115,234,.05)"><input type="number" ${inStyle} value="${e.sal}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].sal=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#0073ea;font-weight:600"></td>
    <td style="background:rgba(0,184,117,.05)"><input type="number" ${inStyle} value="${e.end}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].end=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#00b875;font-weight:600"></td>
    <td style="background:rgba(255,112,67,.05)"><input type="number" ${inStyle} value="${e.dyn}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].dyn=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#ff7043;font-weight:600"></td>
    <td style="background:rgba(155,81,224,.05)"><input type="number" ${inStyle} value="${e.wb}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].wb=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#9b51e0;font-weight:600"></td>
    <td style="background:rgba(229,57,53,.05)"><input type="number" ${inStyle} value="${e.stel||0}" min="0" max="100" step="5" onchange="NOM_EDIT[${i}].stel=+this.value;nomRefreshRow(${i})" style="text-align:right;color:#e53935;font-weight:600"></td>
    <td class="mo ${totCls}" style="font-weight:700" id="nom-tot-${i}">${tot}%</td>
    <td class="mo" style="color:#0073ea">${fmt(e.s*(e.sal/100))}</td>
    <td class="mo" style="color:#00b875">${fmt(e.s*(e.end/100))}</td>
    <td class="mo" style="color:#ff7043">${fmt(e.s*(e.dyn/100))}</td>
    <td class="mo" style="color:#9b51e0">${fmt(e.s*(e.wb/100))}</td>
    <td class="mo" style="color:#e53935">${fmt(e.s*((e.stel||0)/100))}</td>
    <td style="text-align:center"><button onclick="nomDelRow(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;padding:2px 5px" title="Eliminar">✕</button></td>
  </tr>`;
}

function nomRefreshRow(i){
  const e=NOM_EDIT[i];
  const tot=e.sal+e.end+e.dyn+e.wb+(e.stel||0);
  const ok=tot===100;
  const el=document.getElementById('nom-tot-'+i);
  if(el){el.textContent=tot+'%';el.className='mo '+(ok?'pos':'neg');el.style.fontWeight='700';}
  // refresh calculated cells — columna "Fecha Ingreso" añadida → índices +1
  const row=document.getElementById('nom-row-'+i);
  if(row){
    const tds=row.querySelectorAll('td');
    tds[11].textContent=fmt(e.s*(e.sal/100));
    tds[12].textContent=fmt(e.s*(e.end/100));
    tds[13].textContent=fmt(e.s*(e.dyn/100));
    tds[14].textContent=fmt(e.s*(e.wb/100));
    tds[15].textContent=fmt(e.s*((e.stel||0)/100));
  }
  nomUpdateFooter();
}

function nomAddRow(){
  NOM_EDIT.push({n:'Nuevo empleado',r:'Rol',s:0,tipo:'Administrativo',fi:'',sal:100,end:0,dyn:0,wb:0,stel:0});
  rNomina();
}

function nomDelRow(i){
  NOM_EDIT.splice(i,1);
  rNomina();
}

function nomSave(){
  // propagate to NOM global so P&Ls update
  nomUpdateFooter();
  // Persistir a localStorage + Supabase
  DB.set('gf_nomina', NOM_EDIT);
  // Propagar cambios al P&L
  if(typeof syncFlujoToRecs === 'function') syncFlujoToRecs();
  if(typeof refreshActivePL === 'function') refreshActivePL();
  const btn=event.target;
  btn.textContent='✅ Guardado';
  setTimeout(()=>btn.textContent='💾 Guardar',1500);
  toast('✅ Nómina guardada — P&L actualizado');
}

function rNomina(){
  const tbody=document.getElementById('nom-edit-tbody');
  if(!tbody) return;
  tbody.innerHTML=NOM_EDIT.map((e,i)=>nomRenderRow(e,i)).join('');
  nomUpdateFooter();
}

  // Expose globals
  window.NOM_EDIT = NOM_EDIT;
  window._nomFactor = _nomFactor;
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

  // Register views
  if(typeof registerView === 'function'){
    registerView('nomina', function(){ rNomina(); });
  }

})(window);
