// GF — Finanzas: Nomina
(function(window) {
  'use strict';

// ── ESTADO EDITABLE DE NOMINA ──
// Intentar cargar de DB primero; si no hay, usar defaults de data-constants
var _nomSaved = (typeof DB !== 'undefined' && DB.get) ? DB.get('gf_nomina') : null;
let NOM_EDIT = (_nomSaved && _nomSaved.length)
  ? _nomSaved
  : NOM.map(e=>({n:e.n,r:e.r,s:e.s,tipo:e.tipo||'Administrativo',fi:'',sal:Math.round(e.dist.Salem*100),end:Math.round(e.dist.Endless*100),dyn:Math.round(e.dist.Dynamo*100),wb:Math.round(e.dist.Wirebit*100),stel:Math.round((e.dist.Stellaris||0)*100)}));

// Factor de nómina por mes/año considerando fecha de ingreso y baja
// fi: "YYYY-MM-DD" ingreso — fb: "YYYY-MM-DD" baja
function _nomFactor(n, mes, year) {
  const yr = +year, m = +mes;
  let factor = 1;

  // Fecha de ingreso: prorrateo en mes de entrada, 0 antes
  if (n.fi) {
    const parts = String(n.fi).split('-');
    if (parts.length >= 2) {
      const fiY = +parts[0], fiM = +parts[1] - 1, fiD = parts[2] ? +parts[2] : 1;
      if (yr < fiY || (yr === fiY && m < fiM)) return 0;
      if (yr === fiY && m === fiM) {
        const diasMes = new Date(yr, m + 1, 0).getDate();
        factor = Math.max(0, (diasMes - fiD + 1) / diasMes);
      }
    }
  }

  // Fecha de baja: prorrateo en mes de salida, 0 después
  if (n.fb) {
    const parts = n.fb.split('-');
    if (parts.length >= 2) {
      const fbY = +parts[0], fbM = +parts[1] - 1, fbD = parts[2] ? +parts[2] : new Date(+parts[0], +parts[1], 0).getDate();
      if (yr > fbY || (yr === fbY && m > fbM)) return 0;
      if (yr === fbY && m === fbM) {
        const diasMes = new Date(yr, m + 1, 0).getDate();
        factor = Math.min(factor, fbD / diasMes);
      }
    }
  }

  return factor;
}

// Sueldo efectivo: recorre historial de cambios (más reciente primero)
// Soporta legacy s2/fs2 (migra a cambios[]) y nuevo cambios[]
function _nomSueldo(n, mes, year) {
  const cambios = _nomGetCambios(n);
  if (!cambios.length) return n.s;
  const yr = +year, m = +mes;
  // Buscar el cambio más reciente que aplique
  for (let i = cambios.length - 1; i >= 0; i--) {
    const c = cambios[i];
    const parts = (c.desde||'').split('-');
    if (parts.length < 2) continue;
    const cY = +parts[0], cM = +parts[1] - 1;
    if (yr > cY || (yr === cY && m >= cM)) return c.s;
  }
  return n.s;
}

// Get cambios array (migrate legacy s2/fs2 if needed)
function _nomGetCambios(n) {
  if (n.cambios && n.cambios.length) return n.cambios;
  if (n.s2 && n.fs2) return [{ s: n.s2, desde: n.fs2 }];
  return [];
}

// Current effective salary (today)
function _nomSueldoActual(n) {
  const now = new Date();
  return _nomSueldo(n, now.getMonth(), now.getFullYear());
}

const _nomDist = (e, n, mes, year) => {
  const pct = (e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:e==='Stellaris'?n.stel:n.wb)||0;
  const factor = (mes !== undefined && year !== undefined) ? _nomFactor(n, mes, year) : 1;
  const sueldo = (mes !== undefined && year !== undefined) ? _nomSueldo(n, mes, year) : n.s;
  return sueldo * (pct/100) * factor;
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
  if(q('nom-ft-total')) q('nom-ft-total').textContent=fmt(tot);
  if(q('nom-ft-sal')) q('nom-ft-sal').textContent=fmt(ts);
  if(q('nom-ft-end')) q('nom-ft-end').textContent=fmt(te);
  if(q('nom-ft-dyn')) q('nom-ft-dyn').textContent=fmt(td);
  if(q('nom-ft-wb')) q('nom-ft-wb').textContent=fmt(tw);
  if(q('nom-ft-stel')) q('nom-ft-stel').textContent=fmt(tst);
  const activos = NOM_EDIT.filter(e=>!e.fb).length;
  if(q('nom-ft-count')) q('nom-ft-count').textContent=activos+'/'+NOM_EDIT.length;
  // KPI cards
  if(q('nom-kpi-total')) q('nom-kpi-total').textContent=fmtK(tot);
  if(q('nom-kpi-emp')) q('nom-kpi-emp').textContent=NOM_EDIT.length+' empleados';
  if(q('nom-kpi-sal')) q('nom-kpi-sal').textContent=fmtK(ts);
  if(q('nom-kpi-end')) q('nom-kpi-end').textContent=fmtK(te);
  if(q('nom-kpi-dyn')) q('nom-kpi-dyn').textContent=fmtK(td);
  if(q('nom-kpi-wb')) q('nom-kpi-wb').textContent=fmtK(tw);
  if(q('nom-kpi-stel')) q('nom-kpi-stel').textContent=fmtK(tst);
  // propagate to NOM global
  NOM_EDIT.forEach((e,i)=>{
    if(NOM[i]){NOM[i].s=e.s;NOM[i].dist={Salem:e.sal/100,Endless:e.end/100,Dynamo:e.dyn/100,Wirebit:e.wb/100,Stellaris:(e.stel||0)/100};}
  });
}

// ── Mini distribution bar (visual % per company) ──
function _nomMiniBar(e){
  const ents = [{k:'sal',c:'#0073ea'},{k:'end',c:'#00b875'},{k:'dyn',c:'#ff7043'},{k:'wb',c:'#9b51e0'},{k:'stel',c:'#e53935'}];
  const tot = e.sal+e.end+e.dyn+e.wb+(e.stel||0);
  if(tot===0) return '<span style="color:var(--muted);font-size:.7rem">Sin asignar</span>';
  let bar = '<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--border)">';
  ents.forEach(en=>{
    const v=e[en.k]||0;
    if(v>0) bar+=`<div style="width:${v/tot*100}%;background:${en.c}" title="${en.k.toUpperCase()} ${v}%"></div>`;
  });
  bar+='</div>';
  // labels below
  const labels = ents.filter(en=>(e[en.k]||0)>0).map(en=>`<span style="color:${en.c};font-weight:600">${e[en.k]}%</span>`).join(' ');
  return bar+'<div style="font-size:.62rem;margin-top:2px">'+labels+(tot!==100?' <span style="color:var(--red)">!=100</span>':'')+'</div>';
}

function nomRenderRow(e,i){
  const isBaja = !!e.fb;
  const tipoColor = e.tipo==='Operativo' ? '#0073ea' : '#9b51e0';
  const statusBadge = isBaja
    ? '<span style="background:var(--red-bg);color:var(--red);padding:2px 8px;border-radius:10px;font-size:.68rem;font-weight:600">Baja</span>'
    : '<span style="background:var(--green-bg);color:var(--green);padding:2px 8px;border-radius:10px;font-size:.68rem;font-weight:600">Activo</span>';
  const sActual = _nomSueldoActual(e);
  const cambios = _nomGetCambios(e);
  const salM=sActual*(e.sal/100), endM=sActual*(e.end/100), dynM=sActual*(e.dyn/100), wbM=sActual*(e.wb/100), stelM=sActual*((e.stel||0)/100);
  const cambioLabel = cambios.length ? '<span style="display:block;font-size:.58rem;color:var(--blue);font-weight:400">'+cambios.length+' cambio'+(cambios.length>1?'s':'')+' de sueldo</span>' : '';
  return`<tr id="nom-row-${i}" class="nom-row" data-idx="${i}" style="cursor:pointer;${isBaja?'opacity:.5;':''}">
    <td style="padding:8px 12px;font-weight:600;font-size:.8rem">${escapeHtml(e.n)}${cambioLabel}</td>
    <td style="color:var(--muted);font-size:.76rem">${escapeHtml(e.r)}</td>
    <td><span style="color:${tipoColor};font-weight:600;font-size:.72rem">${e.tipo}</span></td>
    <td class="r" style="font-weight:600;color:var(--green);font-size:.8rem">${fmt(sActual)}</td>
    <td style="font-size:.72rem;color:var(--muted)">${e.fi||'—'}</td>
    <td class="r" style="color:#0073ea;font-size:.78rem">${salM>0?fmt(salM):'—'}</td>
    <td class="r" style="color:#00b875;font-size:.78rem">${endM>0?fmt(endM):'—'}</td>
    <td class="r" style="color:#ff7043;font-size:.78rem">${dynM>0?fmt(dynM):'—'}</td>
    <td class="r" style="color:#9b51e0;font-size:.78rem">${wbM>0?fmt(wbM):'—'}</td>
    <td class="r" style="color:#e53935;font-size:.78rem">${stelM>0?fmt(stelM):'—'}</td>
    <td style="text-align:center">${statusBadge}</td>
  </tr>`;
}

// ── Modal de detalle de empleado ──
function nomOpenDetail(i){
  const e = NOM_EDIT[i];
  const yr = _year;
  const _ENT = [{k:'Salem',c:'#0073ea',f:'sal'},{k:'Endless',c:'#00b875',f:'end'},{k:'Dynamo',c:'#ff7043',f:'dyn'},{k:'Wirebit',c:'#9b51e0',f:'wb'},{k:'Stellaris',c:'#e53935',f:'stel'}];
  const inS = 'style="width:100%;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:.82rem;font-family:inherit;background:var(--bg);color:var(--text)"';
  const tot = e.sal+e.end+e.dyn+e.wb+(e.stel||0);

  // Section 1: Info general
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
    <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Nombre</label>
      <input id="nd-n" ${inS} value="${escapeHtml(e.n)}"></div>
    <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Rol</label>
      <input id="nd-r" ${inS} value="${escapeHtml(e.r)}"></div>
    <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Tipo</label>
      <select id="nd-tipo" ${inS}>
        <option${e.tipo==='Operativo'?' selected':''}>Operativo</option>
        <option${e.tipo==='Administrativo'?' selected':''}>Administrativo</option>
      </select></div>
    <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Fecha Ingreso</label>
      <input id="nd-fi" type="date" ${inS} value="${e.fi||''}"></div>
    <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Fecha Baja</label>
      <input id="nd-fb" type="date" ${inS} value="${e.fb||''}" style="border-color:${e.fb?'var(--red)':'var(--border)'}"></div>
    <div></div>
  </div>`;

  // Section 2: Sueldo + Historial de cambios
  const cambios = _nomGetCambios(e);
  const sActual = _nomSueldoActual(e);
  html += `<div style="margin-bottom:20px;padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Sueldo Inicial</label>
        <input id="nd-s" type="text" ${inS} value="${e.s}" style="font-weight:700;color:var(--green);font-size:.95rem"></div>
      <div><label style="font-size:.68rem;color:var(--muted);display:block;margin-bottom:4px">Sueldo Actual (efectivo hoy)</label>
        <div style="font-weight:700;color:var(--blue);font-size:1.1rem;padding:6px 0">${fmt(sActual)}</div></div>
    </div>
    <h4 style="font-size:.72rem;margin:0 0 8px;color:var(--text)">Historial de Cambios de Sueldo</h4>
    <div id="nd-cambios-list">`;
  cambios.forEach((c,ci)=>{
    html+=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px" data-ci="${ci}">
      <input type="text" value="${c.s}" placeholder="Monto" class="nd-cambio-s" style="width:120px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:.82rem;font-family:inherit;background:var(--bg);color:var(--blue);font-weight:600">
      <span style="font-size:.72rem;color:var(--muted)">desde</span>
      <input type="date" value="${c.desde||''}" class="nd-cambio-d" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:.78rem;font-family:inherit;background:var(--bg);color:var(--text)">
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.9rem;padding:2px 6px" title="Eliminar cambio">✕</button>
    </div>`;
  });
  html+=`</div>
    <button onclick="nomAddCambio()" style="background:none;border:1px dashed var(--border);color:var(--blue);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.72rem;margin-top:4px">+ Agregar cambio de sueldo</button>
  </div>`;

  // Section 3: Distribución %
  html += `<div style="margin-bottom:20px"><h4 style="font-size:.78rem;margin:0 0 10px;color:var(--text)">Distribución por Empresa <span id="nd-tot" style="font-weight:700;color:${tot===100?'var(--green)':'var(--red)'}">${tot}%</span></h4>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">`;
  _ENT.forEach(en=>{
    html+=`<div style="text-align:center">
      <label style="font-size:.68rem;color:${en.c};font-weight:600;display:block;margin-bottom:4px">${en.k}</label>
      <input id="nd-${en.f}" type="number" min="0" max="100" step="5" value="${e[en.f]||0}"
        oninput="nomDetailUpdateTot()"
        style="width:100%;border:1px solid var(--border);border-radius:6px;padding:6px;font-size:.9rem;text-align:center;font-weight:700;color:${en.c};background:var(--bg);font-family:inherit">
    </div>`;
  });
  html+=`</div></div>`;

  // Section 4: Costo mensual por empresa
  html += `<div style="margin-bottom:16px"><h4 style="font-size:.78rem;margin:0 0 10px;color:var(--text)">Costo Mensual por Empresa (${yr})</h4>
    <div style="overflow-x:auto"><table class="bt" style="font-size:.72rem">
    <thead><tr><th>Empresa</th>`;
  MO.forEach(m=>{ html+=`<th class="r">${m}</th>`; });
  html+=`<th class="r" style="font-weight:700">Total</th></tr></thead><tbody>`;
  _ENT.forEach(en=>{
    let rowTotal = 0;
    html+=`<tr><td style="color:${en.c};font-weight:600">${en.k}</td>`;
    for(let m=0;m<12;m++){
      const v = _nomDist(en.k, e, m, yr);
      rowTotal += v;
      html+=`<td class="r">${v>0?fmt(Math.round(v)):'—'}</td>`;
    }
    html+=`<td class="r" style="font-weight:700;color:${en.c}">${fmt(Math.round(rowTotal))}</td></tr>`;
  });
  // Total row
  html+=`<tr style="font-weight:700;border-top:2px solid var(--border2)"><td>TOTAL</td>`;
  let grandTotal = 0;
  for(let m=0;m<12;m++){
    let mTotal = 0;
    _ENT.forEach(en=>{ mTotal+=_nomDist(en.k, e, m, yr); });
    grandTotal += mTotal;
    html+=`<td class="r">${mTotal>0?fmt(Math.round(mTotal)):'—'}</td>`;
  }
  html+=`<td class="r">${fmt(Math.round(grandTotal))}</td></tr>`;
  html+=`</tbody></table></div></div>`;

  // Action buttons
  html += `<div style="display:flex;gap:10px;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)">
    <button class="nom-del-emp" data-idx="${i}" data-name="${escapeHtml(e.n)}" style="background:none;border:1px solid var(--red);color:var(--red);padding:6px 16px;border-radius:6px;cursor:pointer;font-size:.78rem">Eliminar Empleado</button>
    <button class="nom-save-emp" data-idx="${i}" style="background:var(--blue);color:#fff;border:none;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:.82rem;font-weight:600">Guardar Cambios</button>
  </div>`;

  openModal('nomina_detail', e.n + ' — Ficha de Empleado', html);
  // ── Event delegation for modal buttons ──
  var delBtn = document.querySelector('.nom-del-emp');
  if(delBtn) delBtn.onclick = function(){
    var idx = +this.dataset.idx;
    if(confirm('Eliminar a '+this.dataset.name+'?')){ nomDelRow(idx); closeModal(); }
  };
  var saveBtn = document.querySelector('.nom-save-emp');
  if(saveBtn) saveBtn.onclick = function(){ nomSaveDetail(+this.dataset.idx); };
}

function nomDetailUpdateTot(){
  const fields = ['sal','end','dyn','wb','stel'];
  const tot = fields.reduce((s,f)=>s+(+document.getElementById('nd-'+f).value||0),0);
  const el = document.getElementById('nd-tot');
  if(el){ el.textContent=tot+'%'; el.style.color=tot===100?'var(--green)':'var(--red)'; }
}

function nomAddCambio(){
  const list = document.getElementById('nd-cambios-list');
  if(!list) return;
  const div = document.createElement('div');
  div.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:6px';
  div.innerHTML=`<input type="text" placeholder="Monto" class="nd-cambio-s" style="width:120px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:.82rem;font-family:inherit;background:var(--bg);color:var(--blue);font-weight:600">
    <span style="font-size:.72rem;color:var(--muted)">desde</span>
    <input type="date" class="nd-cambio-d" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:.78rem;font-family:inherit;background:var(--bg);color:var(--text)">
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.9rem;padding:2px 6px">✕</button>`;
  list.appendChild(div);
}

function nomSaveDetail(i){
  const e = NOM_EDIT[i];
  e.n = document.getElementById('nd-n').value;
  e.r = document.getElementById('nd-r').value;
  e.tipo = document.getElementById('nd-tipo').value;
  e.fi = document.getElementById('nd-fi').value;
  e.fb = document.getElementById('nd-fb').value;
  e.s = +(document.getElementById('nd-s').value.replace(/[^0-9.]/g,''))||0;
  // Collect cambios from DOM
  const cambioRows = document.querySelectorAll('#nd-cambios-list > div');
  const cambios = [];
  cambioRows.forEach(row => {
    const sVal = +(row.querySelector('.nd-cambio-s').value.replace(/[^0-9.]/g,''))||0;
    const dVal = row.querySelector('.nd-cambio-d').value||'';
    if(sVal && dVal) cambios.push({s: sVal, desde: dVal});
  });
  cambios.sort((a,b) => a.desde.localeCompare(b.desde));
  e.cambios = cambios.length ? cambios : undefined;
  // Clean legacy fields
  delete e.s2; delete e.fs2;
  e.sal = +document.getElementById('nd-sal').value||0;
  e.end = +document.getElementById('nd-end').value||0;
  e.dyn = +document.getElementById('nd-dyn').value||0;
  e.wb = +document.getElementById('nd-wb').value||0;
  e.stel = +document.getElementById('nd-stel').value||0;
  closeModal();
  rNomina();
  toast('Empleado actualizado');
}

// ── Plantilla Excel: descargar template vacío ──
function nomDownloadTemplate(){
  const headers = ['Nombre','Rol','Sueldo','Tipo','Fecha Ingreso','Fecha Baja','Nuevo Sueldo','Cambio Desde','% Salem','% Endless','% Dynamo','% Wirebit','% Stellaris'];
  const example = ['Juan Pérez','Analista',15000,'Operativo','2026-01-15','','','',40,10,10,40,0];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = [{wch:25},{wch:20},{wch:12},{wch:15},{wch:15},{wch:15},{wch:14},{wch:15},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nomina');
  XLSX.writeFile(wb, 'plantilla_nomina.xlsx');
}

// ── Carga masiva desde Excel ──
function nomUploadExcel(input){
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { toast('El archivo está vacío'); return; }
      let added = 0;
      rows.forEach(r => {
        const nombre = r['Nombre'] || r['nombre'] || r['NOMBRE'] || '';
        if (!nombre) return;
        const sueldo = +(r['Sueldo'] || r['sueldo'] || r['SUELDO'] || 0);
        const rol = r['Rol'] || r['rol'] || r['ROL'] || r['Puesto'] || r['puesto'] || '';
        const tipo = (r['Tipo'] || r['tipo'] || r['TIPO'] || 'Administrativo');
        const fi = r['Fecha Ingreso'] || r['fecha_ingreso'] || r['FI'] || '';
        const fb = r['Fecha Baja'] || r['fecha_baja'] || r['FB'] || '';
        const s2raw = r['Nuevo Sueldo'] || r['nuevo_sueldo'] || '';
        const s2 = s2raw ? +s2raw : undefined;
        const fs2 = r['Cambio Desde'] || r['cambio_desde'] || '';
        const sal = +(r['% Salem'] || r['Salem'] || r['salem'] || 0);
        const end = +(r['% Endless'] || r['Endless'] || r['endless'] || 0);
        const dyn = +(r['% Dynamo'] || r['Dynamo'] || r['dynamo'] || 0);
        const wbp = +(r['% Wirebit'] || r['Wirebit'] || r['wirebit'] || 0);
        const stel = +(r['% Stellaris'] || r['Stellaris'] || r['stellaris'] || 0);
        NOM_EDIT.push({
          n: nombre, r: rol, s: sueldo,
          tipo: tipo.toLowerCase().includes('oper') ? 'Operativo' : 'Administrativo',
          fi, fb, s2, fs2, sal, end, dyn, wb: wbp, stel
        });
        added++;
      });
      rNomina();
      toast(added + ' empleados cargados desde Excel — revisa y guarda');
    } catch(err) {
      toast('Error al leer archivo: ' + err.message);
    }
    input.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function nomAddRow(){
  NOM_EDIT.push({n:'Nuevo empleado',r:'Rol',s:0,tipo:'Administrativo',fi:'',fb:'',s2:undefined,fs2:'',sal:100,end:0,dyn:0,wb:0,stel:0});
  rNomina();
}

function nomDelRow(i){
  NOM_EDIT.splice(i,1);
  DB.set('gf_nomina', NOM_EDIT);
  rNomina();
  toast('Empleado eliminado');
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
  // ── Event delegation for row clicks ──
  tbody.querySelectorAll('.nom-row').forEach(function(el){
    el.onclick = function(){ nomOpenDetail(+this.dataset.idx); };
  });
  nomUpdateFooter();
}

  // Expose globals
  window.NOM_EDIT = NOM_EDIT;
  window._nomFactor = _nomFactor;
  window._nomSueldo = _nomSueldo;
  window._nomSueldoActual = _nomSueldoActual;
  window._nomGetCambios = _nomGetCambios;
  window._nomDist = _nomDist;
  window.nomMesTotal = nomMesTotal;
  window.nomMesOp = nomMesOp;
  window.nomMesAdm = nomMesAdm;
  window.nomCalcTotals = nomCalcTotals;
  window.nomUpdateFooter = nomUpdateFooter;
  window.nomRenderRow = nomRenderRow;
  window.nomOpenDetail = nomOpenDetail;
  window.nomDetailUpdateTot = nomDetailUpdateTot;
  window.nomSaveDetail = nomSaveDetail;
  window.nomAddCambio = nomAddCambio;
  window.nomAddRow = nomAddRow;
  window.nomDelRow = nomDelRow;
  window.nomSave = nomSave;
  window.nomDownloadTemplate = nomDownloadTemplate;
  window.nomUploadExcel = nomUploadExcel;
  window.rNomina = rNomina;

  // Register views
  if(typeof registerView === 'function'){
    registerView('nomina', function(){ rNomina(); });
  }

})(window);
