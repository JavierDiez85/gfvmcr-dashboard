// GF — Tesoreria
(function(window) {
  'use strict';

// GF — Tesorería: flujo de caja, bancos, consolidado

// TESORERÍA — MÓDULO COMPLETO
// ══════════════════════════════════════
const TES_KEY = 'gf_tesoreria';
const TES_EMPS = ['Salem','Endless','Dynamo','Wirebit'];
const TES_EMP_COLORS = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};

const TES_CATS_ING = ['Comisiones TPV','Fondeo Tarjetas','Intereses Crédito','Comisión Apertura','Fee Exchange','Fee OTC','Fee Retiro','Otros Ingresos'];
const TES_CATS_GAS = ['Nómina Operativa','Nómina Administrativa','Renta Oficina','Mantenimiento','Renta Impresora','Software','Hardware','Efevoo Tarjetas','Efevoo TPV','Marketing','Luz','Insumos Oficina','Viáticos','Comisiones Bancarias','Cumplimiento','Liquidity Providers','Comisiones Promotoría','Otros Gastos'];
const TES_CUENTAS = ['BBVA Operaciones','BBVA Nómina','STP','Bitso','Bitfinex','LMAX','Efectivo','Otra'];

function tesLoad(){ try{ const s=DB.get(TES_KEY); return Array.isArray(s)?s:[]; }catch(e){return [];} }
function tesSave(data){ DB.set(TES_KEY, data); }
function tesFmt(n){ return '$'+Number(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function tesFmtSigned(n){ const s=n>=0?'+':'-'; return s+'$'+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ── Current month helper ──
function tesCurMonth(){
  const d=new Date();
  return d.getFullYear()+'-'+(String(d.getMonth()+1).padStart(2,'0'));
}

// ── KPIs ──
function tesUpdateKPIs(movs){
  const hoy = new Date();
  const mes  = tesCurMonth();
  const thisMon = movs.filter(m => m.fecha && m.fecha.substring(0,7)===mes);
  const ing  = thisMon.filter(m=>m.tipo==='Ingreso').reduce((s,m)=>s+m.monto,0);
  const gas  = thisMon.filter(m=>m.tipo==='Gasto').reduce((s,m)=>s+m.monto,0);
  const neto = ing - gas;

  const ki = document.getElementById('tes-kpi-ing');
  const kg = document.getElementById('tes-kpi-gas');
  const kn = document.getElementById('tes-kpi-neto');
  const km = document.getElementById('tes-kpi-mov');
  if(ki) ki.textContent = tesFmt(ing);
  if(kg) kg.textContent = tesFmt(gas);
  if(kn){ kn.textContent = tesFmtSigned(neto); kn.style.color = neto>=0?'var(--green)':'var(--red)'; }
  if(km) km.textContent = movs.length;
}

// ── Render tabla ──
let _tesFiltros = {empresa:'', tipo:'', mes:''};
let _tesSeleccionados = new Set();

function tesFiltrar(){
  _tesFiltros.empresa = document.getElementById('tes-fil-empresa')?.value || '';
  _tesFiltros.tipo    = document.getElementById('tes-fil-tipo')?.value    || '';
  _tesFiltros.mes     = document.getElementById('tes-fil-mes')?.value     || '';
  tesRenderTabla();
}

function tesClearFiltros(){
  _tesFiltros = {empresa:'',tipo:'',mes:''};
  const fe=document.getElementById('tes-fil-empresa'); if(fe) fe.value='';
  const ft=document.getElementById('tes-fil-tipo');    if(ft) ft.value='';
  const fm=document.getElementById('tes-fil-mes');     if(fm) fm.value='';
  tesRenderTabla();
}

function tesGetFiltrados(){
  let data = tesLoad();
  if(_tesFiltros.empresa) data = data.filter(m=>m.empresa===_tesFiltros.empresa);
  if(_tesFiltros.tipo)    data = data.filter(m=>m.tipo===_tesFiltros.tipo);
  if(_tesFiltros.mes)     data = data.filter(m=>m.fecha&&m.fecha.substring(0,7)===_tesFiltros.mes);
  return data.sort((a,b)=>b.fecha.localeCompare(a.fecha));
}

function tesRenderTabla(){
  const tbody = document.getElementById('tes-tbody');
  if(!tbody) return;
  const data = tesGetFiltrados();
  const all  = tesLoad();
  tesUpdateKPIs(all);

  const lbl = document.getElementById('tes-count-label');
  if(lbl) lbl.textContent = data.length + ' movimiento' + (data.length!==1?'s':'');

  if(!data.length){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px">Sin movimientos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((m,i)=>{
    const col = TES_EMP_COLORS[m.empresa]||'var(--muted)';
    const isIng = m.tipo==='Ingreso';
    const montoCol = isIng ? 'var(--green)' : 'var(--red)';
    const montoSign = isIng ? '+' : '-';
    const sel = _tesSeleccionados.has(m.id);
    return `<tr style="${sel?'background:var(--blue-bg)':''}">
      <td><input type="checkbox" ${sel?'checked':''} onchange="tesToggleSel('${m.id}',this)" style="cursor:pointer"></td>
      <td style="font-size:.75rem;white-space:nowrap">${m.fecha||''}</td>
      <td><span style="font-size:.65rem;font-weight:700;color:${col};background:${col}15;padding:2px 7px;border-radius:8px">${m.empresa}</span></td>
      <td><span style="font-size:.65rem;background:${isIng?'var(--green-bg)':'var(--red-bg)'};color:${isIng?'var(--green)':'var(--red)'};padding:2px 7px;border-radius:8px">${m.tipo}</span></td>
      <td style="font-size:.75rem">${m.categoria||'—'}</td>
      <td style="font-size:.75rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m.concepto||''}">${m.concepto||'—'}</td>
      <td style="font-size:.72rem;color:var(--muted)">${m.cuenta||'—'}</td>
      <td style="text-align:right;font-weight:700;color:${montoCol};white-space:nowrap">${montoSign}${tesFmt(m.monto).substring(1)}</td>
      <td style="text-align:center">
        ${!isViewer() ? `<button onclick="tesEditarMov('${m.id}')" style="background:var(--blue-bg);color:#0073ea;border:none;border-radius:5px;padding:3px 7px;font-size:.6rem;cursor:pointer;margin-right:2px">✏️</button>
        <button onclick="tesEliminarMov('${m.id}')" style="background:#fde8e8;color:#c62828;border:none;border-radius:5px;padding:3px 7px;font-size:.6rem;cursor:pointer">🗑</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function tesSelAll(cb){
  const data = tesGetFiltrados();
  if(cb.checked) data.forEach(m=>_tesSeleccionados.add(m.id));
  else _tesSeleccionados.clear();
  const btn = document.getElementById('tes-btn-eliminar');
  if(btn) btn.style.display = _tesSeleccionados.size>0 ? '' : 'none';
  tesRenderTabla();
}

function tesToggleSel(id, cb){
  if(cb.checked) _tesSeleccionados.add(id);
  else _tesSeleccionados.delete(id);
  const btn = document.getElementById('tes-btn-eliminar');
  if(btn) btn.style.display = _tesSeleccionados.size>0 ? '' : 'none';
}

function tesEliminarSeleccionados(){
  if(!_tesSeleccionados.size) return;
  if(!confirm(`¿Eliminar ${_tesSeleccionados.size} movimiento(s)?`)) return;
  let data = tesLoad().filter(m=>!_tesSeleccionados.has(m.id));
  tesSave(data);
  _tesSeleccionados.clear();
  tesRenderTabla();
  toast('🗑 Movimientos eliminados');
}

function tesEliminarMov(id){
  if(!confirm('¿Eliminar este movimiento?')) return;
  tesSave(tesLoad().filter(m=>m.id!==id));
  tesRenderTabla();
  toast('🗑 Movimiento eliminado');
}

// ── Render principal de Flujo ──
function rTesFlujo(){
  // Init mes filter to current month if empty
  const fm = document.getElementById('tes-fil-mes');
  if(fm && !fm.value) fm.value = tesCurMonth();
  _tesFiltros.mes = tesCurMonth();
  tesRenderTabla();
}

// ── Modal nuevo/editar movimiento ──
let _tesEditId = null;

function tesCuentasPorEmpresa(empresa){
  // Returns accounts filtered by empresa from config
  const all = tesBancosLoad();
  if(!empresa) return all.map(b=>b.nombre);
  return all.filter(b=>!b.empresas||b.empresas.includes(empresa)).map(b=>b.nombre);
}

function tesCategoriasParaTipo(tipo, empresa){
  // Returns categories filtered by tipo and empresa
  // For Ingreso: use income lines from recs/P&L config per entity
  // For Gasto/Costo: use CAT_GA_DEFAULT + CAT_CD_DEFAULT filtered by empresa
  if(tipo === 'Ingreso'){
    const ingMap = {
      Salem:   ['Comisiones TPV','Venta Terminal','Fondeo Tarjetas Trans.','Fondeo Tarjetas Efectivo','Otros Ingresos'],
      Endless: ['Intereses Crédito Simple','Intereses Crédito Automotriz','Comisión por Apertura','Intereses Moratorios','Intereses Tarjeta Blue','Gastos Admón y Legales','Otros Ingresos'],
      Dynamo:  ['Intereses Crédito Simple','Intereses Crédito Automotriz','Comisión por Apertura','Intereses Moratorios','Gastos Admón y Legales','Otros Ingresos'],
      Wirebit: ['Fee Exchange Cripto','Fee OTC','Fee Retiro Blockchain','Fee Retiro FIAT','Fee Fondeo Tarjeta','Otros Ingresos'],
    };
    return empresa && ingMap[empresa] ? ingMap[empresa] : Object.values(ingMap).flat().filter((v,i,a)=>a.indexOf(v)===i);
  }
  // Gasto / Costo Directo — from P&L categories filtered by empresa
  const cd = catGetData('cd').filter(c=>!empresa||!c.empresas||c.empresas.includes(empresa));
  const ga = catGetData('ga').filter(c=>!empresa||!c.empresas||c.empresas.includes(empresa));
  if(tipo === 'Costo Directo') return cd.map(c=>c.nombre);
  if(tipo === 'Gasto')         return ga.map(c=>c.nombre);
  // All gastos
  return [...cd.map(c=>c.nombre), ...ga.map(c=>c.nombre)];
}

function tesOpenModal(id){
  _tesEditId = id || null;
  const data  = tesLoad();
  const item  = id ? data.find(m=>m.id===id) : null;
  const isNew = !item;
  const initEmp  = item?.empresa  || TES_EMPS[0];
  const initTipo = item?.tipo     || 'Ingreso';

  const empOptions   = TES_EMPS.map(e=>`<option value="${e}" ${initEmp===e?'selected':''}>${e}</option>`).join('');
  const tipoOptions  = ['Ingreso','Gasto','Costo Directo'].map(t=>`<option value="${t}" ${initTipo===t?'selected':''}>${t==='Ingreso'?'📈':t==='Gasto'?'📉':'📦'} ${t}</option>`).join('');
  const cuentas      = tesCuentasPorEmpresa(initEmp);
  const cuentaOpts   = cuentas.length
    ? cuentas.map(c=>`<option value="${c}" ${item?.cuenta===c?'selected':''}>${c}</option>`).join('')
    : `<option value="">— Sin cuentas configuradas —</option>`;
  const cats         = tesCategoriasParaTipo(initTipo, initEmp);
  const catOpts      = cats.map(c=>`<option value="${c}" ${item?.categoria===c?'selected':''}>${c}</option>`).join('');

  const html = `
    <div style="background:var(--white);border-radius:12px;width:500px;max-width:96vw;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.28)">
      <div style="background:linear-gradient(135deg,#0073ea,#0060c7);padding:16px 22px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:Poppins,sans-serif;font-weight:700;color:#fff;font-size:.92rem">${isNew?'📥 Nuevo Movimiento':'✏️ Editar Movimiento'}</div>
        <button onclick="document.getElementById('confirm-overlay').style.display='none'" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:7px;cursor:pointer">✕</button>
      </div>
      <div style="padding:20px 22px">
        <div class="fg2" style="margin-bottom:12px">
          <div class="fg">
            <label class="fl">Fecha</label>
            <input type="date" id="tm-fecha" class="fi" value="${item?.fecha||new Date().toISOString().substring(0,10)}">
          </div>
          <div class="fg">
            <label class="fl">Tipo</label>
            <select id="tm-tipo" class="fs" onchange="tesModalActualizar()">${tipoOptions}</select>
          </div>
        </div>
        <div class="fg2" style="margin-bottom:12px">
          <div class="fg">
            <label class="fl">Empresa</label>
            <select id="tm-empresa" class="fs" onchange="tesModalActualizar()">${empOptions}</select>
          </div>
          <div class="fg">
            <label class="fl">Cuenta Bancaria</label>
            <select id="tm-cuenta" class="fs">${cuentaOpts}</select>
            <div style="font-size:.62rem;color:var(--muted);margin-top:3px">
              <a href="#" onclick="sv('cfg_bancos',null);document.getElementById('confirm-overlay').style.display='none';return false" style="color:#0073ea">+ Gestionar cuentas</a>
            </div>
          </div>
        </div>
        <div class="fg" style="margin-bottom:12px">
          <label class="fl">Categoría</label>
          <select id="tm-categoria" class="fs">${catOpts}</select>
        </div>
        <div class="fg" style="margin-bottom:12px">
          <label class="fl">Concepto / Descripción</label>
          <input type="text" id="tm-concepto" class="fi" value="${item?.concepto||''}" placeholder="Ej: Pago nómina enero, Comisiones TPV...">
        </div>
        <div class="fg" style="margin-bottom:18px">
          <label class="fl">Monto ($)</label>
          <input type="number" id="tm-monto" class="fi n" value="${item?.monto||''}" placeholder="0.00" min="0" step="0.01">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="document.getElementById('confirm-overlay').style.display='none'" class="btn btn-out">Cancelar</button>
          <button onclick="tesGuardarMov()" style="background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:.8rem;font-weight:600;cursor:pointer">✅ Guardar</button>
        </div>
      </div>
    </div>`;

  const ov = document.getElementById('confirm-overlay');
  ov.style.display = 'flex';
  ov.innerHTML = html;
}

function tesModalActualizar(){
  // Called when empresa or tipo changes — refresh cuentas and categorías
  const emp  = document.getElementById('tm-empresa')?.value  || '';
  const tipo = document.getElementById('tm-tipo')?.value     || 'Ingreso';

  // Update cuentas
  const cuentaSel = document.getElementById('tm-cuenta');
  if(cuentaSel){
    const cuentas = tesCuentasPorEmpresa(emp);
    cuentaSel.innerHTML = cuentas.length
      ? cuentas.map(c=>`<option value="${c}">${c}</option>`).join('')
      : `<option value="">— Sin cuentas configuradas —</option>`;
  }

  // Update categorías
  const catSel = document.getElementById('tm-categoria');
  if(catSel){
    const cats = tesCategoriasParaTipo(tipo, emp);
    catSel.innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }
}


function tesGuardarMov(){
  const fecha     = document.getElementById('tm-fecha')?.value;
  const tipo      = document.getElementById('tm-tipo')?.value;
  const empresa   = document.getElementById('tm-empresa')?.value;
  const cuenta    = document.getElementById('tm-cuenta')?.value;
  const categoria = document.getElementById('tm-categoria')?.value;
  const concepto  = document.getElementById('tm-concepto')?.value.trim();
  const monto     = parseFloat(document.getElementById('tm-monto')?.value) || 0;

  if(!fecha)   { toast('⚠️ Ingresa la fecha');    return; }
  if(!monto)   { toast('⚠️ Ingresa el monto');    return; }
  if(!concepto){ toast('⚠️ Ingresa el concepto'); return; }

  const data = tesLoad();
  if(_tesEditId){
    const idx = data.findIndex(m=>m.id===_tesEditId);
    if(idx>=0) data[idx] = {...data[idx], fecha, tipo, empresa, cuenta, categoria, concepto, monto};
    toast('✅ Movimiento actualizado');
  } else {
    data.push({id:'tes_'+Date.now(), fecha, tipo, empresa, cuenta, categoria, concepto, monto});
    toast('✅ Movimiento registrado');
  }
  tesSave(data);
  document.getElementById('confirm-overlay').style.display='none';
  tesRenderTabla();
}

function tesEditarMov(id){
  tesOpenModal(id);
}

// ── Vista individual por empresa ──
let _tesEmpSel = 'Salem';

function rTesIndividual(){
  tesSelectorEmp(_tesEmpSel);
}

function tesSelectorEmp(emp){
  _tesEmpSel = emp;
  // Update button styles
  TES_EMPS.forEach(e=>{
    const btn = document.getElementById('tes-emp-btn-'+e);
    if(btn){
      const col = TES_EMP_COLORS[e];
      btn.style.background = e===emp ? col : 'var(--bg)';
      btn.style.color      = e===emp ? '#fff' : 'var(--text)';
      btn.style.border     = e===emp ? 'none' : '1px solid var(--border)';
    }
  });

  const data = tesLoad().filter(m=>m.empresa===emp);
  const col  = TES_EMP_COLORS[emp];
  const cont = document.getElementById('tes-individual-content');
  if(!cont) return;

  // Compute metrics
  const ing   = data.filter(m=>m.tipo==='Ingreso').reduce((s,m)=>s+m.monto,0);
  const gas   = data.filter(m=>m.tipo==='Gasto').reduce((s,m)=>s+m.monto,0);
  const neto  = ing - gas;

  // Monthly breakdown
  const byMonth = {};
  data.forEach(m=>{
    const mes = m.fecha?.substring(0,7)||'';
    if(!mes) return;
    if(!byMonth[mes]) byMonth[mes]={ing:0,gas:0};
    if(m.tipo==='Ingreso') byMonth[mes].ing+=m.monto;
    else byMonth[mes].gas+=m.monto;
  });
  const meses = Object.keys(byMonth).sort();

  // Last 10 movements
  const recientes = [...data].sort((a,b)=>b.fecha?.localeCompare(a.fecha||'')||0).slice(0,10);

  cont.innerHTML = `
    <div class="kpi-row c3" style="margin-bottom:14px">
      <div class="kpi-card" style="--ac:${col}">
        <div class="kpi-top"><div class="kpi-lbl">Total Ingresos</div><div class="kpi-ico" style="background:${col}15;color:${col}">📈</div></div>
        <div class="kpi-val" style="color:var(--green)">${tesFmt(ing)}</div>
        <div class="kpi-d dnu">acumulado</div>
      </div>
      <div class="kpi-card" style="--ac:var(--red)">
        <div class="kpi-top"><div class="kpi-lbl">Total Gastos</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">📉</div></div>
        <div class="kpi-val" style="color:var(--red)">${tesFmt(gas)}</div>
        <div class="kpi-d dnu">acumulado</div>
      </div>
      <div class="kpi-card" style="--ac:${neto>=0?'var(--green)':'var(--red)'}">
        <div class="kpi-top"><div class="kpi-lbl">Flujo Neto</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💧</div></div>
        <div class="kpi-val" style="color:${neto>=0?'var(--green)':'var(--red)'}">${tesFmtSigned(neto)}</div>
        <div class="kpi-d dnu">${data.length} movimientos</div>
      </div>
    </div>
    <!-- Gráfica flujo mensual -->
    <div class="cc" style="margin-bottom:14px">
      <div class="cc-h"><div class="cc-ht">Flujo Mensual — ${emp}</div></div>
      <div class="cc-b"><canvas id="c-tes-ind-chart" height="100"></canvas></div>
    </div>
    <!-- Últimos movimientos -->
    <div class="tw">
      <div class="tw-h"><div class="tw-ht">Últimos movimientos — ${emp}</div>
        <button onclick="sv('tes_flujo',null);tesSelectorEmpFiltro('${emp}')" style="background:transparent;color:#0073ea;border:1px solid #0073ea;border-radius:6px;padding:4px 10px;font-size:.68rem;cursor:pointer">Ver todos →</button>
      </div>
      <table class="bt"><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Concepto</th><th>Cuenta</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${recientes.map(m=>{
        const isIng=m.tipo==='Ingreso';
        return `<tr>
          <td style="font-size:.75rem;white-space:nowrap">${m.fecha||''}</td>
          <td><span style="font-size:.65rem;background:${isIng?'var(--green-bg)':'var(--red-bg)'};color:${isIng?'var(--green)':'var(--red)'};padding:2px 7px;border-radius:8px">${m.tipo}</span></td>
          <td style="font-size:.75rem">${m.categoria||'—'}</td>
          <td style="font-size:.75rem">${m.concepto||'—'}</td>
          <td style="font-size:.72rem;color:var(--muted)">${m.cuenta||'—'}</td>
          <td style="text-align:right;font-weight:700;color:${isIng?'var(--green)':'var(--red)'};white-space:nowrap">${isIng?'+':'-'}${tesFmt(m.monto).substring(1)}</td>
        </tr>`;
      }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">Sin movimientos para '+emp+'</td></tr>'}</tbody>
      </table>
    </div>`;

  // Draw chart
  setTimeout(()=>{
    const ctx = document.getElementById('c-tes-ind-chart');
    if(!ctx || !meses.length) return;
    if(TES_CHARTS && TES_CHARTS['ind']) TES_CHARTS['ind'].destroy();
    const isDark = document.body.classList.contains('dark');
    const gc = isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    const tc = isDark?'#9da0c5':'#8b8fb5';
    TES_CHARTS['ind'] = new Chart(ctx, {
      type:'bar',
      data:{
        labels: meses,
        datasets:[
          {label:'Ingresos', data:meses.map(m=>byMonth[m].ing), backgroundColor:'rgba(0,184,117,.7)', borderRadius:4},
          {label:'Gastos',   data:meses.map(m=>byMonth[m].gas), backgroundColor:'rgba(229,57,53,.7)',  borderRadius:4},
          {label:'Neto',     data:meses.map(m=>byMonth[m].ing-byMonth[m].gas), type:'line', borderColor:col, backgroundColor:'transparent', tension:.4, pointRadius:4, pointBackgroundColor:col}
        ]
      },
      options:{responsive:true,plugins:{legend:{labels:{color:tc,font:{size:11}}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>'$'+Number(v).toLocaleString('es-MX')}}}}
    });
  }, 80);
}

function tesSelectorEmpFiltro(emp){
  const fe = document.getElementById('tes-fil-empresa');
  if(fe){ fe.value=emp; tesFiltrar(); }
}

// ── Vista consolidada grupo ──
const TES_CHARTS = {};

function rTesGrupo(){
  const data = tesLoad();
  const cont = document.getElementById('tes-grupo-content');
  if(!cont) return;

  const totIng  = data.filter(m=>m.tipo==='Ingreso').reduce((s,m)=>s+m.monto,0);
  const totGas  = data.filter(m=>m.tipo==='Gasto').reduce((s,m)=>s+m.monto,0);
  const totNeto = totIng - totGas;

  // Per company
  const byEmp = {};
  TES_EMPS.forEach(e=>{ byEmp[e]={ing:0,gas:0}; });
  data.forEach(m=>{ if(byEmp[m.empresa]){ if(m.tipo==='Ingreso')byEmp[m.empresa].ing+=m.monto; else byEmp[m.empresa].gas+=m.monto; }});

  // Monthly for group chart
  const byMonth = {};
  data.forEach(m=>{
    const mes=m.fecha?.substring(0,7)||''; if(!mes) return;
    if(!byMonth[mes]) byMonth[mes]={ing:0,gas:0};
    if(m.tipo==='Ingreso') byMonth[mes].ing+=m.monto; else byMonth[mes].gas+=m.monto;
  });
  const meses = Object.keys(byMonth).sort();

  cont.innerHTML = `
    <!-- KPIs grupo -->
    <div class="kpi-row c3" style="margin-bottom:14px">
      <div class="kpi-card" style="--ac:var(--green)">
        <div class="kpi-top"><div class="kpi-lbl">Ingresos Totales</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
        <div class="kpi-val" style="color:var(--green)">${tesFmt(totIng)}</div>
        <div class="kpi-d dnu">todas las empresas</div>
      </div>
      <div class="kpi-card" style="--ac:var(--red)">
        <div class="kpi-top"><div class="kpi-lbl">Gastos Totales</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">📉</div></div>
        <div class="kpi-val" style="color:var(--red)">${tesFmt(totGas)}</div>
        <div class="kpi-d dnu">todas las empresas</div>
      </div>
      <div class="kpi-card" style="--ac:${totNeto>=0?'var(--green)':'var(--red)'}">
        <div class="kpi-top"><div class="kpi-lbl">Flujo Neto Grupo</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💧</div></div>
        <div class="kpi-val" style="color:${totNeto>=0?'var(--green)':'var(--red)'}">${tesFmtSigned(totNeto)}</div>
        <div class="kpi-d dnu">${data.length} movimientos totales</div>
      </div>
    </div>
    <!-- Saldo por empresa -->
    <div class="kpi-row c4" style="margin-bottom:14px">
      ${TES_EMPS.map(e=>{
        const col=TES_EMP_COLORS[e];
        const neto=byEmp[e].ing-byEmp[e].gas;
        return `<div class="kpi-card" style="--ac:${col}">
          <div class="kpi-top"><div class="kpi-lbl">${e}</div><div class="kpi-ico" style="background:${col}15;color:${col}">🏢</div></div>
          <div class="kpi-val" style="color:${neto>=0?'var(--green)':'var(--red)'}">${tesFmtSigned(neto)}</div>
          <div class="kpi-d dnu">${tesFmt(byEmp[e].ing)} ing / ${tesFmt(byEmp[e].gas)} gas</div>
        </div>`;
      }).join('')}
    </div>
    <!-- Gráfica consolidada -->
    <div class="g2" style="margin-bottom:14px">
      <div class="cc">
        <div class="cc-h"><div class="cc-ht">Flujo Mensual Consolidado</div></div>
        <div class="cc-b"><canvas id="c-tes-grp-bar" height="120"></canvas></div>
      </div>
      <div class="cc">
        <div class="cc-h"><div class="cc-ht">Distribución por Empresa</div></div>
        <div class="cc-b"><canvas id="c-tes-grp-pie" height="120"></canvas></div>
      </div>
    </div>`;

  // Charts
  setTimeout(()=>{
    const isDark = document.body.classList.contains('dark');
    const gc = isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    const tc = isDark?'#9da0c5':'#8b8fb5';

    // Bar chart
    const ctxBar = document.getElementById('c-tes-grp-bar');
    if(ctxBar && meses.length){
      if(TES_CHARTS['grp_bar']) TES_CHARTS['grp_bar'].destroy();
      TES_CHARTS['grp_bar'] = new Chart(ctxBar, {
        type:'bar',
        data:{
          labels:meses,
          datasets:[
            {label:'Ingresos',data:meses.map(m=>byMonth[m].ing),backgroundColor:'rgba(0,184,117,.7)',borderRadius:4},
            {label:'Gastos',  data:meses.map(m=>byMonth[m].gas),backgroundColor:'rgba(229,57,53,.7)', borderRadius:4},
            {label:'Neto',    data:meses.map(m=>byMonth[m].ing-byMonth[m].gas),type:'line',borderColor:'#0073ea',backgroundColor:'transparent',tension:.4,pointRadius:4,pointBackgroundColor:'#0073ea'}
          ]
        },
        options:{responsive:true,plugins:{legend:{labels:{color:tc,font:{size:11}}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>'$'+Number(v).toLocaleString('es-MX')}}}}
      });
    }
    // Pie chart — ingresos por empresa
    const ctxPie = document.getElementById('c-tes-grp-pie');
    if(ctxPie){
      if(TES_CHARTS['grp_pie']) TES_CHARTS['grp_pie'].destroy();
      TES_CHARTS['grp_pie'] = new Chart(ctxPie, {
        type:'doughnut',
        data:{
          labels:TES_EMPS,
          datasets:[{data:TES_EMPS.map(e=>byEmp[e].ing||0), backgroundColor:TES_EMPS.map(e=>TES_EMP_COLORS[e]), borderWidth:2}]
        },
        options:{responsive:true,plugins:{legend:{position:'right',labels:{color:tc,font:{size:11}}}}}
      });
    }
  }, 80);
}

// ── Descargar plantilla Excel ──
function tesDescargarPlantilla(){
  const headers = ['Fecha','Empresa','Tipo','Categoria','Concepto','Cuenta','Monto'];
  const ejemplos = [
    ['2026-02-01','Salem','Ingreso','Comisiones TPV','Cobro comisiones enero','BBVA Operaciones','125000'],
    ['2026-02-03','Endless','Gasto','Nómina Operativa','Nómina febrero','BBVA Nómina','23000'],
    ['2026-02-05','Wirebit','Ingreso','Fee Exchange','Fees cripto semana 1','Bitso','45000'],
    ['2026-02-07','Dynamo','Gasto','Renta Oficina','Renta febrero','BBVA Operaciones','36775'],
  ];

  // Build CSV
  const rows = [headers, ...ejemplos];
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const nota = '\n\n"--- INSTRUCCIONES ---"\n"Empresa: Salem | Endless | Dynamo | Wirebit"\n"Tipo: Ingreso | Gasto"\n"Fecha: formato YYYY-MM-DD"\n"Monto: solo números sin signos ni $"';

  const blob = new Blob([csv+nota], {type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'Plantilla_Tesoreria.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('✅ Plantilla descargada');
}

// ── Subir Excel/CSV ──
function tesSubirExcel(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const text = e.target.result;
    const lines = text.split('\n').filter(l=>l.trim());
    if(lines.length < 2){ toast('⚠️ Archivo vacío o sin datos'); return; }

    let imported = 0, errors = 0;
    const data = tesLoad();
    const errRows = [];

    // Skip header row (row 0)
    for(let i=1; i<lines.length; i++){
      const cols = lines[i].split(',').map(c=>c.replace(/^"|"$/g,'').trim());
      if(cols.length < 7) continue;
      const [fecha, empresa, tipo, categoria, concepto, cuenta, montoStr] = cols;
      // Skip instruction rows
      if(fecha.startsWith('---') || !fecha.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
      const monto = parseFloat(montoStr.replace(/[^0-9.]/g,''));
      if(!TES_EMPS.includes(empresa)){ errRows.push(`Fila ${i+1}: empresa "${empresa}" inválida`); errors++; continue; }
      if(!['Ingreso','Gasto'].includes(tipo)){ errRows.push(`Fila ${i+1}: tipo "${tipo}" inválido`); errors++; continue; }
      if(!monto){ errRows.push(`Fila ${i+1}: monto inválido`); errors++; continue; }
      data.push({id:'tes_'+Date.now()+'_'+i, fecha, empresa, tipo, categoria, concepto, cuenta, monto});
      imported++;
    }
    tesSave(data);
    input.value = '';
    tesRenderTabla();
    if(errRows.length) console.warn('Errores en importación:', errRows);
    toast(`✅ ${imported} movimiento(s) importado(s)${errors?' · '+errors+' errores (ver consola)':''}`);
  };
  reader.readAsText(file, 'UTF-8');
}


// ══════════════════════════════════════

// DASHBOARD: TESORERÍA KPIs
// ══════════════════════════════════════
function rDashTesoreria(){
  const data = tesLoad();
  const mes  = tesCurMonth();

  // Acumulado total (neto)
  const totIng = data.filter(m=>m.tipo==='Ingreso').reduce((s,m)=>s+m.monto,0);
  const totGas = data.filter(m=>m.tipo==='Gasto').reduce((s,m)=>s+m.monto,0);
  const saldo  = totIng - totGas;

  // Este mes
  const thisMon = data.filter(m=>m.fecha?.substring(0,7)===mes);
  const mesIng  = thisMon.filter(m=>m.tipo==='Ingreso').reduce((s,m)=>s+m.monto,0);
  const mesGas  = thisMon.filter(m=>m.tipo==='Gasto').reduce((s,m)=>s+m.monto,0);
  const mesNeto = mesIng - mesGas;

  // Per company neto
  const byEmp = {};
  const EMP_COLS = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  ['Salem','Endless','Dynamo','Wirebit'].forEach(e=>{ byEmp[e]={ing:0,gas:0}; });
  data.forEach(m=>{ if(byEmp[m.empresa]){ if(m.tipo==='Ingreso')byEmp[m.empresa].ing+=m.monto; else byEmp[m.empresa].gas+=m.monto; }});

  // Update KPI cards
  function setEl(id, val){ const el=document.getElementById(id); if(el) el.textContent=val; }
  function setStyle(id, prop, val){ const el=document.getElementById(id); if(el) el.style[prop]=val; }

  setEl('dash-tes-saldo', tesFmt(saldo));
  setStyle('dash-tes-saldo', 'color', saldo>=0?'var(--green)':'var(--red)');
  setEl('dash-tes-saldo-sub', (saldo>=0?'superávit':'déficit')+' acumulado · '+data.length+' movs');

  setEl('dash-tes-neto-mes', tesFmtSigned(mesNeto));
  setStyle('dash-tes-neto-mes', 'color', mesNeto>=0?'var(--green)':'var(--red)');
  setEl('dash-tes-neto-mes-sub', new Date().toLocaleString('es-MX',{month:'long',year:'numeric'}));

  setEl('dash-tes-ing-mes', tesFmt(mesIng));
  setEl('dash-tes-gas-mes', tesFmt(mesGas));

  const maxMes = Math.max(mesIng, mesGas, 1);
  const setBar = (id, val, max) => { const el=document.getElementById(id); if(el) el.style.width=Math.min(100,val/max*100)+'%'; };
  setBar('dash-tes-ing-bar', mesIng, maxMes);
  setBar('dash-tes-gas-bar', mesGas, maxMes);
  setBar('dash-tes-bar', Math.abs(saldo), Math.max(totIng, totGas, 1));
  const netoBar = document.getElementById('dash-tes-neto-bar');
  if(netoBar){ netoBar.style.width='50%'; netoBar.style.background = mesNeto>=0?'var(--green)':'var(--red)'; }

  // Per company mini cards
  const empCont = document.getElementById('dash-tes-emp-cards');
  if(empCont){
    empCont.innerHTML = ['Salem','Endless','Dynamo','Wirebit'].map(e=>{
      const col  = EMP_COLS[e];
      const neto = byEmp[e].ing - byEmp[e].gas;
      const sign = neto>=0?'+':'-';
      const absV = Math.abs(neto);
      const fmtV = absV>=1000000 ? sign+'$'+(absV/1000000).toFixed(1)+'M'
                 : absV>=1000    ? sign+'$'+(absV/1000).toFixed(0)+'K'
                 : sign+'$'+absV.toLocaleString('es-MX');
      return `<div class="kpi-card kpi-clickable" style="--ac:${col};cursor:pointer" onclick="navTo('tes_individual')">
        <div class="kpi-hint">ver empresa →</div>
        <div class="kpi-top"><div class="kpi-lbl" style="font-size:.65rem">${e}</div><div class="kpi-ico" style="background:${col}15;color:${col};font-size:.8rem">🏢</div></div>
        <div style="font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;color:${neto>=0?'var(--green)':'var(--red)'}">${fmtV}</div>
        <div style="font-size:.62rem;color:var(--muted);margin-top:2px">flujo neto</div>
      </div>`;
    }).join('');
  }

  // Mini chart: flujo mensual del grupo
  const byMonth = {};
  data.forEach(m=>{
    const mm=m.fecha?.substring(0,7)||''; if(!mm) return;
    if(!byMonth[mm]) byMonth[mm]={ing:0,gas:0};
    if(m.tipo==='Ingreso') byMonth[mm].ing+=m.monto; else byMonth[mm].gas+=m.monto;
  });
  const meses = Object.keys(byMonth).sort().slice(-8); // last 8 months

  setTimeout(()=>{
    const ctx = document.getElementById('c-dash-tes-flujo');
    if(!ctx) return;
    if(!meses.length){
      // Draw empty placeholder
      const c2d = ctx.getContext('2d');
      c2d.clearRect(0,0,ctx.width,ctx.height);
      c2d.fillStyle = '#9da0c5';
      c2d.font = '11px Figtree';
      c2d.textAlign = 'center';
      c2d.fillText('Sin movimientos registrados', ctx.width/2, ctx.height/2);
      return;
    }
    if(window._dashTesChart) window._dashTesChart.destroy();
    const isDark = document.body.classList.contains('dark');
    const gc = isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    const tc = isDark?'#9da0c5':'#8b8fb5';
    window._dashTesChart = new Chart(ctx, {
      type:'bar',
      data:{
        labels: meses,
        datasets:[
          {label:'Ingresos', data:meses.map(m=>byMonth[m].ing), backgroundColor:'rgba(0,184,117,.65)', borderRadius:3},
          {label:'Gastos',   data:meses.map(m=>byMonth[m].gas), backgroundColor:'rgba(229,57,53,.65)',  borderRadius:3},
          {label:'Neto', data:meses.map(m=>byMonth[m].ing-byMonth[m].gas), type:'line', borderColor:'#0073ea', backgroundColor:'transparent', tension:.4, pointRadius:3, pointBackgroundColor:'#0073ea'}
        ]
      },
      options:{
        responsive:true,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{color:gc},ticks:{color:tc,font:{size:9}}},
          y:{grid:{color:gc},ticks:{color:tc,font:{size:9},callback:v=>v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v}}
        }
      }
    });
  }, 100);
}


// ══════════════════════════════════════

// BANCOS Y CUENTAS — CONFIGURACIÓN
// ══════════════════════════════════════
const BANCOS_KEY = 'gf_bancos';
const BANCOS_DEFAULT = [
  {id:'b1',  nombre:'BBVA',     empresa:'Salem',   empresas:['Salem'],   tipo:'Cuenta Corriente'},
  {id:'b2',  nombre:'BBVA',     empresa:'Endless', empresas:['Endless'], tipo:'Cuenta Corriente'},
  {id:'b3',  nombre:'BBVA',     empresa:'Dynamo',  empresas:['Dynamo'],  tipo:'Cuenta Corriente'},
  {id:'b4',  nombre:'BBVA',     empresa:'Wirebit', empresas:['Wirebit'], tipo:'Cuenta Corriente'},
  {id:'b5',  nombre:'STP',      empresa:'Salem',   empresas:['Salem'],   tipo:'SPEI / STP'},
  {id:'b6',  nombre:'STP',      empresa:'Endless', empresas:['Endless'], tipo:'SPEI / STP'},
  {id:'b7',  nombre:'STP',      empresa:'Dynamo',  empresas:['Dynamo'],  tipo:'SPEI / STP'},
  {id:'b8',  nombre:'Bitso',    empresa:'Wirebit', empresas:['Wirebit'], tipo:'Exchange Cripto'},
  {id:'b9',  nombre:'Bitfinex', empresa:'Wirebit', empresas:['Wirebit'], tipo:'Exchange Cripto'},
  {id:'b10', nombre:'LMAX',     empresa:'Wirebit', empresas:['Wirebit'], tipo:'Liquidez / Broker'},
  {id:'b11', nombre:'Efectivo', empresa:'Salem',   empresas:['Salem'],   tipo:'Efectivo'},
];

function tesBancosLoad(){
  try{ const s=DB.get(BANCOS_KEY); return Array.isArray(s)&&s.length?s:JSON.parse(JSON.stringify(BANCOS_DEFAULT)); }
  catch(e){ return JSON.parse(JSON.stringify(BANCOS_DEFAULT)); }
}
function tesBancosSave(data){ DB.set(BANCOS_KEY, data); }

let _bancosEditId = null;
const EMP_COLS_B = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
const BANCO_TIPOS = ['Cuenta Corriente','Cuenta Nómina','Cuenta Ahorro','SPEI / STP','Exchange Cripto','Liquidez / Broker','Efectivo','Otra'];

function rBancosView(){
  const root = document.getElementById('cfg-bancos-root');
  if(!root) return;
  const bancos = tesBancosLoad();
  const emps   = ['Salem','Endless','Dynamo','Wirebit'];

  function empBadges(empresas){
    return emps.map(e=>{
      const col = EMP_COLS_B[e];
      const active = empresas&&empresas.includes(e);
      return active
        ? `<span style="font-size:.6rem;font-weight:700;color:${col};background:${col}15;padding:2px 6px;border-radius:6px">${e.substring(0,3)}</span>`
        : `<span style="font-size:.6rem;color:var(--muted);padding:2px 6px;border-radius:6px;text-decoration:line-through">${e.substring(0,3)}</span>`;
    }).join(' ');
  }

  const rows = bancos.map((b,i)=>`
    <tr id="banco-row-${i}">
      <td style="font-weight:600">${b.nombre}</td>
      <td><span style="font-size:.65rem;color:var(--muted);background:var(--bg);padding:2px 7px;border-radius:10px">${b.tipo||'—'}</span></td>
      <td>
        <div style="display:flex;gap:3px;flex-wrap:wrap">
          ${emps.map(e=>{
            const col=EMP_COLS_B[e];
            const chk=b.empresas&&b.empresas.includes(e)?'checked':'';
            return `<label style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;padding:3px 7px;border-radius:6px;border:1px solid ${col}33;background:${col}11">
              <input type="checkbox" ${chk} onchange="bancosToggleEmp(${i},'${e}',this.checked)" style="accent-color:${col};width:11px;height:11px">
              <span style="font-size:.6rem;font-weight:700;color:${col}">${e.substring(0,3)}</span>
            </label>`;
          }).join('')}
        </div>
      </td>
      <td style="text-align:center;white-space:nowrap">
        ${!isViewer() ? `<button onclick="bancosEditModal(${i})" style="background:var(--blue-bg);color:#0073ea;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer;margin-right:4px">✏️</button>
        <button onclick="bancosDelete(${i})" style="background:#fde8e8;color:#c62828;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer">🗑</button>` : ''}
      </td>
    </tr>`).join('');

  root.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">🏦 Bancos y Cuentas</div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:2px">Configura las cuentas disponibles · Asigna cada una a sus empresas · Se usan en Flujo de Caja</div>
      </div>
      ${!isViewer() ? '<button onclick="bancosNewModal()" style="background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:.72rem;font-weight:600;cursor:pointer">+ Nueva Cuenta</button>' : ''}
    </div>
    <div class="kpi-row c3" style="margin-bottom:14px">
      <div class="kpi-card" style="--ac:#0073ea">
        <div class="kpi-top"><div class="kpi-lbl">Total Cuentas</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🏦</div></div>
        <div class="kpi-val" style="color:#0073ea">${bancos.length}</div>
        <div class="kpi-d dnu">configuradas</div>
      </div>
      <div class="kpi-card" style="--ac:var(--orange)">
        <div class="kpi-top"><div class="kpi-lbl">Exclusivas</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🏷️</div></div>
        <div class="kpi-val" style="color:var(--orange)">${bancos.filter(b=>b.empresas&&b.empresas.length<4).length}</div>
        <div class="kpi-d dnu">no compartidas</div>
      </div>
      <div class="kpi-card" style="--ac:var(--green)">
        <div class="kpi-top"><div class="kpi-lbl">Compartidas</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">🔗</div></div>
        <div class="kpi-val" style="color:var(--green)">${bancos.filter(b=>!b.empresas||b.empresas.length===4).length}</div>
        <div class="kpi-d dnu">todas las empresas</div>
      </div>
    </div>
    <!-- Leyenda empresas -->
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:.68rem;color:var(--muted);font-weight:600">EMPRESAS:</span>
      ${emps.map(e=>`<span style="font-size:.68rem;font-weight:700;color:${EMP_COLS_B[e]};background:${EMP_COLS_B[e]}15;padding:3px 10px;border-radius:6px">${e}</span>`).join('')}
      <span style="font-size:.65rem;color:var(--muted);margin-left:4px">· Marca/desmarca directo en la tabla</span>
    </div>
    <div class="tw">
      <div class="tw-h"><div class="tw-ht">Cuentas Bancarias</div></div>
      <table class="bt">
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Aplica a</th><th style="text-align:center">Acciones</th></tr></thead>
        <tbody>${rows||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">Sin cuentas configuradas</td></tr>'}</tbody>
      </table>
    </div>`;
}

function bancosToggleEmp(idx, empresa, checked){
  const bancos = tesBancosLoad();
  if(!bancos[idx]) return;
  let emps = bancos[idx].empresas ? [...bancos[idx].empresas] : ['Salem','Endless','Dynamo','Wirebit'];
  if(checked && !emps.includes(empresa)) emps.push(empresa);
  if(!checked) emps = emps.filter(e=>e!==empresa);
  if(!emps.length){ toast('⚠️ Debe quedar al menos una empresa'); return; }
  bancos[idx].empresas = emps;
  tesBancosSave(bancos);
  toast('✅ Guardado');
}

function bancosDelete(idx){
  const bancos = tesBancosLoad();
  if(!confirm(`¿Eliminar la cuenta "${bancos[idx].nombre}"?`)) return;
  bancos.splice(idx,1);
  tesBancosSave(bancos);
  rBancosView();
  toast('🗑 Cuenta eliminada');
}

let _bancosEditIdx = null;

function bancosNewModal(){ _bancosEditIdx=null; bancosShowModal(null); }
function bancosEditModal(idx){ _bancosEditIdx=idx; bancosShowModal(idx); }

function bancosShowModal(idx){
  const bancos = tesBancosLoad();
  const item   = idx !== null ? bancos[idx] : null;
  const emps   = ['Salem','Endless','Dynamo','Wirebit'];
  const curEmp = item?.empresa || item?.empresas?.[0] || emps[0];

  const empOptions = emps.map(e =>
    `<option value="${e}" ${curEmp===e?'selected':''}>${e}</option>`
  ).join('');
  const tipoOpts = BANCO_TIPOS.map(t =>
    `<option value="${t}" ${item?.tipo===t?'selected':''}>${t}</option>`
  ).join('');

  const html = `
    <div style="background:var(--white);border-radius:12px;width:420px;max-width:96vw;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.28)">
      <div style="background:linear-gradient(135deg,#0073ea,#0060c7);padding:16px 22px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:Poppins,sans-serif;font-weight:700;color:#fff;font-size:.92rem">${idx===null?'🏦 Nueva Cuenta':'✏️ Editar Cuenta'}</div>
        <button onclick="document.getElementById('confirm-overlay').style.display='none'" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:7px;cursor:pointer">✕</button>
      </div>
      <div style="padding:20px 22px">
        <div class="fg" style="margin-bottom:12px">
          <label class="fl">Nombre de la Cuenta</label>
          <input type="text" id="bm-nombre" class="fi" value="${item?.nombre||''}" placeholder="Ej: BBVA Operaciones Salem">
        </div>
        <div class="fg2" style="margin-bottom:18px">
          <div class="fg">
            <label class="fl">Empresa</label>
            <select id="bm-empresa" class="fs">${empOptions}</select>
          </div>
          <div class="fg">
            <label class="fl">Tipo de Cuenta</label>
            <select id="bm-tipo" class="fs">${tipoOpts}</select>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="document.getElementById('confirm-overlay').style.display='none'" class="btn btn-out">Cancelar</button>
          <button onclick="bancosGuardar()" style="background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:.8rem;font-weight:600;cursor:pointer">✅ Guardar</button>
        </div>
      </div>
    </div>`;

  const ov = document.getElementById('confirm-overlay');
  ov.style.display = 'flex';
  ov.innerHTML = html;
}

function bancosGuardar(){
  const nombre = document.getElementById('bm-nombre')?.value.trim();
  const tipo   = document.getElementById('bm-tipo')?.value;
  const emps   = ['Salem','Endless','Dynamo','Wirebit'].filter(e=>document.getElementById('bm-emp-'+e)?.checked);
  if(!nombre){ toast('⚠️ Ingresa el nombre de la cuenta'); return; }
  if(!emps.length){ toast('⚠️ Selecciona al menos una empresa'); return; }
  const bancos = tesBancosLoad();
  if(_bancosEditIdx===null){
    bancos.push({id:'b_'+Date.now(), nombre, tipo, empresas:emps});
    toast(`✅ Cuenta "${nombre}" agregada`);
  } else {
    bancos[_bancosEditIdx] = {...bancos[_bancosEditIdx], nombre, tipo, empresas:emps};
    toast(`✅ Cuenta "${nombre}" actualizada`);
  }
  tesBancosSave(bancos);
  document.getElementById('confirm-overlay').style.display='none';
  rBancosView();
}

  // Expose globals
  window.TES_KEY = TES_KEY;
  window.TES_EMPS = TES_EMPS;
  window.TES_EMP_COLORS = TES_EMP_COLORS;
  window.TES_CATS_ING = TES_CATS_ING;
  window.TES_CATS_GAS = TES_CATS_GAS;
  window.TES_CUENTAS = TES_CUENTAS;
  window.tesLoad = tesLoad;
  window.tesSave = tesSave;
  window.tesFmt = tesFmt;
  window.tesFmtSigned = tesFmtSigned;
  window.tesCurMonth = tesCurMonth;
  window.tesUpdateKPIs = tesUpdateKPIs;
  window._tesFiltros = _tesFiltros;
  window._tesSeleccionados = _tesSeleccionados;
  window.tesFiltrar = tesFiltrar;
  window.tesClearFiltros = tesClearFiltros;
  window.tesGetFiltrados = tesGetFiltrados;
  window.tesRenderTabla = tesRenderTabla;
  window.tesSelAll = tesSelAll;
  window.tesToggleSel = tesToggleSel;
  window.tesEliminarSeleccionados = tesEliminarSeleccionados;
  window.tesEliminarMov = tesEliminarMov;
  window.rTesFlujo = rTesFlujo;
  window.tesCuentasPorEmpresa = tesCuentasPorEmpresa;
  window.tesCategoriasParaTipo = tesCategoriasParaTipo;
  window.tesOpenModal = tesOpenModal;
  window.tesModalActualizar = tesModalActualizar;
  window.tesGuardarMov = tesGuardarMov;
  window.tesEditarMov = tesEditarMov;
  window._tesEmpSel = _tesEmpSel;
  window.rTesIndividual = rTesIndividual;
  window.tesSelectorEmp = tesSelectorEmp;
  window.tesSelectorEmpFiltro = tesSelectorEmpFiltro;
  window.TES_CHARTS = TES_CHARTS;
  window.rTesGrupo = rTesGrupo;
  window.tesDescargarPlantilla = tesDescargarPlantilla;
  window.tesSubirExcel = tesSubirExcel;
  window.rDashTesoreria = rDashTesoreria;
  window.BANCOS_KEY = BANCOS_KEY;
  window.BANCOS_DEFAULT = BANCOS_DEFAULT;
  window.tesBancosLoad = tesBancosLoad;
  window.tesBancosSave = tesBancosSave;
  window._bancosEditId = _bancosEditId;
  window.EMP_COLS_B = EMP_COLS_B;
  window.BANCO_TIPOS = BANCO_TIPOS;
  window.rBancosView = rBancosView;
  window.bancosToggleEmp = bancosToggleEmp;
  window.bancosDelete = bancosDelete;
  window._bancosEditIdx = _bancosEditIdx;
  window.bancosNewModal = bancosNewModal;
  window.bancosEditModal = bancosEditModal;
  window.bancosShowModal = bancosShowModal;
  window.bancosGuardar = bancosGuardar;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tes_flujo', function(){ rTesFlujo(); });
    registerView('tes_individual', function(){ rTesIndividual(); });
    registerView('tes_grupo', function(){ rTesGrupo(); });
  }

})(window);
