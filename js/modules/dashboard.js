// GF — Dashboard Grupo

// Capture HTML source at load time for export
window._htmlSource = document.documentElement.outerHTML;

// ═══════════════════════════════════════
// DATA: WIREBIT PRESUPUESTO 2026 (del Excel)
// ═══════════════════════════════════════
// MO is now defined globally in helpers.js

const WB_ING = {
  'Fees Fondeo Tarjetas':   [0,0,0,0,0,0,0,0,0,0,0,0],
  'Fees Fondeo Tarjeta CRM':[0,0,0,0,0,0,0,0,0,0,0,0],
  'Fees VEX Retail':        [0,0,0,0,0,0,0,0,0,0,0,0],
  'Fees VEX Ecommerce':     [0,0,0,0,0,0,0,0,0,0,0,0],
  'Fees Retiros / OTC':     [0,0,0,0,0,0,0,0,0,0,0,0],
};
const WB_ING_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];

const WB_COSTOS = {
  'Bitfinex':           [0,0,0,0,0,0,0,0,0,0,0,0],
  'Lmax':               [0,0,0,0,0,0,0,0,0,0,0,0],
  'Bitso':              [0,0,0,0,0,0,0,0,0,0,0,0],
  'Efevoo Fondeo':      [0,0,0,0,0,0,0,0,0,0,0,0],
  'Efevoo Tarjetas':    [0,0,0,0,0,0,0,0,0,0,0,0],
  'Efevoo SaaS':        [0,0,0,0,0,0,0,0,0,0,0,0],
  'Comisiones BBVA':    [0,0,0,0,0,0,0,0,0,0,0,0],
};
const WB_COSTO_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];
const WB_MARGEN = WB_ING_TOTAL.map((v,i)=>v-WB_COSTO_TOTAL[i]);

// Inject Wirebit fees from localStorage into WB_ING arrays
function wbLoadFees() {
  const data = DB.get('vmcr_wb_fees_2026');
  if (!data || !data.monthly) return;
  for (const [concepto, vals] of Object.entries(data.monthly)) {
    if (WB_ING[concepto]) {
      for (let i = 0; i < 12; i++) WB_ING[concepto][i] = Math.round(vals[i] || 0);
    }
  }
  // Recalculate totals
  for (let i = 0; i < 12; i++) {
    WB_ING_TOTAL[i] = Object.values(WB_ING).reduce((s, v) => s + v[i], 0);
    WB_MARGEN[i] = WB_ING_TOTAL[i] - WB_COSTO_TOTAL[i];
  }
}
// Auto-load on script init
wbLoadFees();

const WB_NOM_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];

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
  // Porcentajes de distribución (data real pendiente de captura)
  {c:'Renta impresora',    cat:'Administrativo', sal:.2,end:.2,dyn:.2,wb:.4, vals:[]},
  {c:'Renta oficina',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Mantenimiento',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Alestra',            cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Luz',                cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Insumos Oficina',    cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Efevoo Tarjetas',    cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Efevoo TPV',         cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Material MKT',       cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Evento NL',          cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Viajes',             cat:'Representación', sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Software',           cat:'Operaciones',    sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
  {c:'Hardware',           cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'STP',                cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'Comisiones SitesPay',cat:'Com. Bancarias', sal:1, end:0, dyn:0, wb:0,  vals:[]},
  {c:'CNBV Endless',       cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  vals:[]},
  {c:'CNBV Dynamo',        cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  vals:[]},
  {c:'Icarus Endless',     cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  vals:[]},
  {c:'Icarus Dynamo',      cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  vals:[]},
  {c:'Otros/Varios',       cat:'Varios',         sal:.4,end:.1,dyn:.1,wb:.4, vals:[]},
];

const SAL_TPV_CLIENTES = [];

const SAL_GASTOS_ITEMS = [
  // Costos Directos
  {c:'Nómina Operativa',       cat:'Nómina',       sec:'cd', ppto:0},
  {c:'Software (CD)',          cat:'Operaciones',  sec:'cd', ppto:0},
  {c:'Hardware (CD)',          cat:'Operaciones',  sec:'cd', ppto:0},
  {c:'Comisiones Promotoría',  cat:'Com. Bancarias',sec:'cd',ppto:0},
  // Gastos Administrativos
  {c:'Nómina Administrativa',  cat:'Nómina',       sec:'ga', ppto:0},
  {c:'Renta Oficina',          cat:'Renta',        sec:'ga', ppto:0},
  {c:'Mantenimiento',          cat:'Renta',        sec:'ga', ppto:0},
  {c:'Renta Impresora',        cat:'Administrativo',sec:'ga',ppto:0},
  {c:'Software',               cat:'Operaciones',  sec:'ga', ppto:0},
  {c:'Hardware',               cat:'Operaciones',  sec:'ga', ppto:0},
  {c:'Efevoo Tarjetas',        cat:'Costo Directo',sec:'ga', ppto:0},
  {c:'Efevoo TPV',             cat:'Costo Directo',sec:'ga', ppto:0},
  {c:'Marketing',              cat:'Marketing',    sec:'ga', ppto:0},
  {c:'Luz',                    cat:'Administrativo',sec:'ga',ppto:0},
  {c:'Insumos Oficina',        cat:'Administrativo',sec:'ga',ppto:0},
  {c:'Viáticos',               cat:'Representación',sec:'ga',ppto:0},
  {c:'Comisiones Bancarias',   cat:'Com. Bancarias',sec:'ga',ppto:0},
  {c:'Cumplimiento',           cat:'Regulatorio',  sec:'ga', ppto:0},
];

const END_CREDITS = /*EMBED:END_CREDITS*/[]/*END:END_CREDITS*/;
const DYN_CREDITS = /*EMBED:DYN_CREDITS*/[]/*END:DYN_CREDITS*/;

const WB_NOM_DETAIL = [];

// ═══════════════════════════════════════

// RENDER: INICIO (Pantalla de Bienvenida)
// ═══════════════════════════════════════

const TAREAS_KEY = 'vmcr_tareas';

async function rInicio() {
  // 1. Fecha actual
  const fechaEl = document.getElementById('inicio-fecha');
  if (fechaEl) {
    const now = new Date();
    const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    fechaEl.textContent = '📅 ' + now.toLocaleDateString('es-MX', opts).replace(/^\w/, c => c.toUpperCase());
  }

  // 2. KPIs Tesorería
  _inicioTesKPIs();

  // 3. KPIs Terminales (async)
  _inicioTPVKPIs();

  // 4. KPIs Tarjetas (estáticos)
  _inicioTarKPIs();

  // 5. Alertas automáticas
  _inicioAlertas();

  // 6. Tareas manuales
  renderTareas();
}

function _inicioTesKPIs() {
  try {
    const data = typeof tesLoad === 'function' ? tesLoad() : [];
    const mes = typeof tesCurMonth === 'function' ? tesCurMonth() : '';
    const totIng = data.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const totGas = data.filter(m => m.tipo === 'Gasto').reduce((s, m) => s + m.monto, 0);
    const saldo = totIng - totGas;
    const thisMon = data.filter(m => m.fecha?.substring(0, 7) === mes);
    const mesIng = thisMon.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const mesGas = thisMon.filter(m => m.tipo === 'Gasto').reduce((s, m) => s + m.monto, 0);
    const mesNeto = mesIng - mesGas;

    const fmt = n => typeof tesFmt === 'function' ? tesFmt(n) : '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    const fmtS = n => typeof tesFmtSigned === 'function' ? tesFmtSigned(n) : (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    const mesLabel = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });

    const _s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const _c = (id, v) => { const el = document.getElementById(id); if (el) el.style.color = v; };

    _s('inicio-tes-saldo', fmt(saldo));
    _c('inicio-tes-saldo', saldo >= 0 ? 'var(--green)' : 'var(--red)');
    _s('inicio-tes-saldo-sub', (saldo >= 0 ? 'Superávit' : 'Déficit') + ' · ' + data.length + ' movimientos');

    _s('inicio-tes-neto', fmtS(mesNeto));
    _c('inicio-tes-neto', mesNeto >= 0 ? 'var(--green)' : 'var(--red)');
    _s('inicio-tes-neto-sub', mesLabel);

    _s('inicio-tes-ing', fmt(mesIng));
    _s('inicio-tes-ing-sub', mesLabel);
    _s('inicio-tes-gas', fmt(mesGas));
    _s('inicio-tes-gas-sub', mesLabel);
  } catch (e) { console.warn('[Inicio] Tesorería KPIs error:', e); }
}

async function _inicioTPVKPIs() {
  try {
    const k = await TPV.kpis();
    if (!k) return;
    const _s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    _s('inicio-tpv-cobrado', fmtTPV(k.total_cobrado));
    _s('inicio-tpv-cobrado-sub', (k.num_transacciones ? parseFloat(k.num_transacciones).toLocaleString() : '0') + ' transacciones');

    const totalCom = parseFloat(k.total_comisiones) || 0;
    const totalCob = parseFloat(k.total_cobrado) || 1;
    _s('inicio-tpv-com', fmtTPV(totalCom));
    _s('inicio-tpv-com-sub', (totalCom / totalCob * 100).toFixed(1) + '% del cobrado');

    const comSalem = parseFloat(k.com_salem) || 0;
    _s('inicio-tpv-salem', fmtTPV(comSalem));
    _s('inicio-tpv-salem-sub', totalCom > 0 ? (comSalem / totalCom * 100).toFixed(1) + '% de comisiones' : '—');

    _s('inicio-tpv-clientes', k.num_clientes || '0');
    _s('inicio-tpv-clientes-sub', 'Clientes con operaciones');
  } catch (e) { console.warn('[Inicio] TPV KPIs error:', e); }
}

function _inicioTarKPIs() {
  try {
    // Tarjetas data is hardcoded in tar_dashboard HTML — read from the DOM if available,
    // otherwise use the known static values
    const _s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    _s('inicio-tar-monto', '$18.7M');
    _s('inicio-tar-txns', '7,232');
    _s('inicio-tar-th', '1,847');
  } catch (e) { console.warn('[Inicio] Tarjetas KPIs error:', e); }
}

async function _inicioAlertas() {
  const container = document.getElementById('inicio-alertas');
  if (!container) return;
  const alertas = [];

  try {
    // 1. Clientes TPV sin comisiones
    const clients = await TPV.getClients();
    const RATE_FIELDS = [
      'rate_efevoo_tc','rate_efevoo_td','rate_salem_tc','rate_salem_td',
      'rate_convenia_tc','rate_convenia_td','rate_comisionista_tc','rate_comisionista_td'
    ];
    const sinConfig = (clients || []).filter(c => !RATE_FIELDS.some(f => parseFloat(c[f]) > 0)).length;
    if (sinConfig > 0) alertas.push({ icon: '⚙️', text: `${sinConfig} clientes TPV sin comisiones configuradas`, color: 'var(--orange)', action: "openMenu('terminales',document.getElementById('mi-terminales'),'tpv_comisiones')" });

    // 2. Flujo neto negativo
    const data = typeof tesLoad === 'function' ? tesLoad() : [];
    const mes = typeof tesCurMonth === 'function' ? tesCurMonth() : '';
    const thisMon = data.filter(m => m.fecha?.substring(0, 7) === mes);
    const mesIng = thisMon.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const mesGas = thisMon.filter(m => m.tipo === 'Gasto').reduce((s, m) => s + m.monto, 0);
    if (mesIng - mesGas < 0) alertas.push({ icon: '🔴', text: 'Flujo neto del mes es negativo: ' + (typeof tesFmtSigned === 'function' ? tesFmtSigned(mesIng - mesGas) : ''), color: 'var(--red)', action: "openMenu('tesoreria',document.getElementById('mi-tesoreria'));sv('tes_flujo',null)" });

    // 3. Créditos vencidos (fix: c.st not c.status)
    let vencidos = 0;
    if (typeof END_CREDITS !== 'undefined' && Array.isArray(END_CREDITS))
      vencidos += END_CREDITS.filter(c => c.st === 'Vencido').length;
    if (typeof DYN_CREDITS !== 'undefined' && Array.isArray(DYN_CREDITS))
      vencidos += DYN_CREDITS.filter(c => c.st === 'Vencido').length;
    if (vencidos > 0) alertas.push({ icon: '⚠️', text: `${vencidos} créditos vencidos en cartera`, color: 'var(--red)', action: "openMenu('creditos',document.getElementById('mi-creditos'),'cred_cobr')" });

    // 4. Sin movimientos de tesorería este mes
    if (thisMon.length === 0 && data.length > 0)
      alertas.push({ icon: '📅', text: 'Sin movimientos de tesorería registrados este mes', color: 'var(--muted)', action: "openMenu('tesoreria',document.getElementById('mi-tesoreria'));sv('tes_flujo',null)" });

    // 5. Cobranza: pagos vencidos y próximos
    try {
      const allCred = [
        ...(Array.isArray(END_CREDITS) ? END_CREDITS.map(c=>({...c,_ent:'end'})) : []),
        ...(Array.isArray(DYN_CREDITS) ? DYN_CREDITS.map(c=>({...c,_ent:'dyn'})) : [])
      ].filter(c=>c.st==='Activo'||c.st==='Vencido');

      let pagosProximos=0, pagosVencidos=0, montoVencido=0;
      const today = new Date(); today.setHours(0,0,0,0);
      const in7d = new Date(today); in7d.setDate(in7d.getDate()+7);

      allCred.forEach(c=>{
        if(!c.amort||c.amort.length<=1) return;
        c.amort.slice(1).forEach(r=>{
          if(typeof credPeriodStatus!=='function') return;
          const st = credPeriodStatus(c, r);
          if(st==='VENCIDO'){ pagosVencidos++; montoVencido+=(r.pago||0); }
          else if(st==='PENDIENTE'){
            const f = typeof credParseDate==='function' ? credParseDate(r.fecha) : null;
            if(f&&f>=today&&f<=in7d) pagosProximos++;
          }
        });
      });

      if(pagosProximos>0) alertas.push({ icon:'🔔', text:`${pagosProximos} pagos vencen en los próximos 7 días`, color:'var(--orange)', action:"openMenu('creditos',document.getElementById('mi-creditos'),'cred_cobr')" });
      if(pagosVencidos>0) alertas.push({ icon:'🚨', text:`${pagosVencidos} pagos vencidos por ${typeof fmtK==='function'?fmtK(montoVencido):'$'+montoVencido} total`, color:'var(--red)', action:"openMenu('creditos',document.getElementById('mi-creditos'),'cred_cobr')" });
    } catch(e){ console.warn('[Inicio] Cobranza alertas error:',e); }

    // 7. Tickets pendientes de lectura
    try {
      const tkData = DB.get('vmcr_tickets_pagos_tpv') || [];
      const tkPend = tkData.filter(t => t.leido === false).length;
      if(tkPend > 0) alertas.push({ icon:'🎫', text:`${tkPend} ticket${tkPend>1?'s':''} pendiente${tkPend>1?'s':''} de lectura`, color:'#9c27b0', action:"openMenu('tickets',document.getElementById('mi-tickets'),'tk_pagos_tpv')" });
    } catch(e){ console.warn('[Inicio] Tickets alertas error:',e); }

  } catch (e) { console.warn('[Inicio] Alertas error:', e); }

  // Render alertas
  if (alertas.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--green);font-size:.75rem">✅ Todo en orden — sin alertas pendientes</div>';
  } else {
    container.innerHTML = alertas.map(a =>
      `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:4px;border-radius:8px;cursor:pointer;background:${a.color}10;border-left:3px solid ${a.color}" onclick="${a.action}">
        <span style="font-size:1rem">${a.icon}</span>
        <span style="font-size:.72rem;color:var(--text);flex:1">${a.text}</span>
        <span style="font-size:.62rem;color:var(--muted)">ver →</span>
      </div>`
    ).join('');
  }
}

// ═══ TAREAS MANUALES ═══

function _loadTareas() {
  try { const d = DB.get(TAREAS_KEY); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}

function _saveTareas(tareas) {
  DB.set(TAREAS_KEY, tareas);
}

function addTarea() {
  const input = document.getElementById('inicio-tarea-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const tareas = _loadTareas();
  tareas.push({ id: Date.now(), text, done: false, createdAt: new Date().toISOString() });
  _saveTareas(tareas);
  input.value = '';
  renderTareas();
}

function toggleTarea(id) {
  const tareas = _loadTareas();
  const t = tareas.find(t => t.id === id);
  if (t) t.done = !t.done;
  _saveTareas(tareas);
  renderTareas();
}

function deleteTarea(id) {
  let tareas = _loadTareas();
  tareas = tareas.filter(t => t.id !== id);
  _saveTareas(tareas);
  renderTareas();
}

function renderTareas() {
  const container = document.getElementById('inicio-tareas-body');
  if (!container) return;
  const tareas = _loadTareas();

  // Separate: pending first, done after
  const pending = tareas.filter(t => !t.done);
  const done = tareas.filter(t => t.done);
  const sorted = [...pending, ...done];

  if (sorted.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--muted);font-size:.72rem">Sin tareas pendientes. Agrega una arriba.</div>';
    return;
  }

  container.innerHTML = sorted.map(t =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);${t.done ? 'opacity:.5' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTarea(${t.id})" style="cursor:pointer;accent-color:var(--green)">
      <span style="flex:1;font-size:.72rem;${t.done ? 'text-decoration:line-through;color:var(--muted)' : 'color:var(--text)'}">${t.text}</span>
      ${!isViewer() ? `<button onclick="deleteTarea(${t.id})" style="background:none;border:none;cursor:pointer;font-size:.7rem;color:var(--muted);padding:2px 4px" title="Eliminar">✕</button>` : ''}
    </div>`
  ).join('');
}

// ═══════════════════════════════════════

// RENDER: RESUMEN
// ═══════════════════════════════════════
function rResumen(){
  // NOTE: _syncAll() is called by the router before rResumen().
  // This ensures wbLoadFees + fiLoad + fgLoad + fiInjectTPV + fiInjectCredits + syncFlujoToRecs
  // are all executed, so S.recs contains ALL data (TPV, créditos, Wirebit fees, flujos).

  const entKeys = ['Salem','Endless','Dynamo','Wirebit'];
  const entC    = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const entCBg  = {Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};

  // ── Ingresos por empresa desde S.recs ──
  const ingByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.yr==_year).forEach(r=>{
      if(ingByEnt[r.ent]) r.vals.forEach((v,i)=> ingByEnt[r.ent][i] += (v||0));
    });
  } catch(e){}

  // ── Gastos por empresa desde S.recs ──
  const gasByEnt = {Salem:Array(12).fill(0),Endless:Array(12).fill(0),Dynamo:Array(12).fill(0),Wirebit:Array(12).fill(0)};
  try {
    (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.yr==_year).forEach(r=>{
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
// ═══════════════════════════════════════
// DASHBOARD GRUPO — Sección 2 & 3
// ═══════════════════════════════════════
let _edoMode = 'mensual';
let _dashMode = 'mensual';

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
  const entIco = {Salem:'💳', Endless:'🏦', Dynamo:'🏦', Wirebit:'⛓'};
  const entNav = {Salem:"navTo('sal_res')", Endless:"navTo('end_res')", Dynamo:"navTo('dyn_res')", Wirebit:"navTo('wb_res')"};

  const cards = ['Salem','Endless','Dynamo','Wirebit'].map(e => {
    const ing  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+sum(r.vals),0);
    const gas  = (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+sum(r.vals),0);
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
      t:'Ingresos Grupo Financiero '+_year, s:'Salem · Endless · Dynamo · Wirebit',
      render:()=>{
        fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows = ['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const recs = S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year);
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
        fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const entCBg={Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const recs=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year);
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
      t:'Gastos Grupo Financiero '+_year, s:'Nómina · Gastos operativos · Gastos compartidos',
      render:()=>{
        fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const nom = NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas = S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
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
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          return {e, v:nom+gas};
        });
        dc('m-chart1');
        new Chart(document.getElementById('m-chart1'),{type:'doughnut',data:{labels:rows.map(r=>r.e),datasets:[{data:rows.map(r=>r.v),backgroundColor:rows.map(r=>entCBg[r.e]),borderColor:rows.map(r=>entC[r.e]),borderWidth:1.5}]},
          options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:11},boxWidth:10}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}}},cutout:'55%',scales:{x:{display:false},y:{display:false}}}});
      }
    },
    // ── Dashboard: Margen Grupo
    resumen_margen:{
      t:'Margen Operativo Grupo Financiero '+_year, s:'Ingresos capturados − Gastos totales por empresa',
      render:()=>{
        fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
        const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
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
        fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
        const rows=['Salem','Endless','Dynamo','Wirebit'].map(e=>{
          const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
          const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
          const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
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
      t:'Centum Capital — Ingresos '+_year,s:'Salem TPV · Fondeo Tarjetas · Endless · Dynamo',
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
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
      </div>
      <p style="text-align:center;color:var(--muted);padding:24px 0;font-size:.85rem">Pendiente de captura de datos reales.</p>`
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
      render:()=>{const _s=NOM_DIST.Salem||0,_e=NOM_DIST.Endless||0,_d=NOM_DIST.Dynamo||0;return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val">${fmtK(_s)}/mes</div></div>
        <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val">${fmtK(_e)}/mes</div></div>
        <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val">${fmtK(_d)}/mes</div></div>
      </div>
      <table class="mbt"><thead><tr><th>Empleado</th><th>Rol</th><th class="r">Sueldo/Mes</th><th class="r">% Salem</th><th class="r">% Endless</th><th class="r">% Dynamo</th></tr></thead><tbody>
        ${NOM.filter(e=>e.dist.Salem>0||e.dist.Endless>0||e.dist.Dynamo>0).map(e=>`<tr>
          <td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td>
          <td class="mo" style="color:#0073ea">${e.dist.Salem>0?(e.dist.Salem*100).toFixed(0)+'%':'—'}</td>
          <td class="mo" style="color:#00b875">${e.dist.Endless>0?(e.dist.Endless*100).toFixed(0)+'%':'—'}</td>
          <td class="mo" style="color:#ff7043">${e.dist.Dynamo>0?(e.dist.Dynamo*100).toFixed(0)+'%':'—'}</td>
        </tr>`).join('')}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL CENTUM</td><td></td><td></td><td class="mo bld" style="color:#0073ea">${fmtK(_s)}</td><td class="mo bld" style="color:#00b875">${fmtK(_e)}</td><td class="mo bld" style="color:#ff7043">${fmtK(_d)}</td></tr>
      </tbody></table>`;}
    },
    // ── Grupo Ingresos
    grupo_ing_modal:{
      t:'Grupo Financiero — Ingresos Consolidados '+_year,s:'Centum Capital + Wirebit',
      render:()=>{
        const rows=MO.map((m,i)=>`<tr><td class="bld">${m}</td><td class="mo">—</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo bld pos">${fmt(WB_ING_TOTAL[i])}</td></tr>`).join('');
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Wirebit</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Centum Capital</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
          <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Total Capturado</div><div class="m-kpi-val" style="color:var(--muted)">$0</div></div>
        </div>
        <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Centum (pendiente)</th><th class="r">Wirebit</th><th class="r">Total Grupo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    },
    // ── Grupo Costos
    grupo_costos_modal:{
      t:'Grupo Financiero — Costos y Gastos Totales '+_year,s:'Las 4 entidades consolidadas',
      render:()=>{
        const salMes=SAL_GASTOS_ITEMS.reduce((a,i)=>a+(i.ppto||0),0);
        const endNom=NOM_DIST.Endless||23000, dynNom=NOM_DIST.Dynamo||23000;
        const wbCostoMes=Math.round(sum(WB_COSTO_TOTAL)/12);
        const wbNomMes=Math.round(sum(WB_NOM_TOTAL)/12);
        const nomCompMes=NOM.reduce((a,n)=>a+(n.s||0),0);
        const gcompMes=GCOMP.reduce((a,g)=>a+(g.vals.length?Math.round(sum(g.vals)/12):0),0);
        const items=[
          {n:'Salem Internacional',c:'#0073ea',v:salMes},
          {n:'Endless Money',c:'#00b875',v:endNom},
          {n:'Dynamo Finance',c:'#ff7043',v:dynNom},
          {n:'Wirebit (costos dir.)',c:'#9b51e0',v:wbCostoMes},
          {n:'Wirebit (nómina)',c:'#9b51e0',v:wbNomMes},
          {n:'Nómina Compartida (todos)',c:null,v:nomCompMes},
          {n:'Gastos Compartidos (ppto)',c:null,v:gcompMes},
        ];
        const totalAnual=items.reduce((a,i)=>a+i.v*12,0);
        const rows=items.filter(i=>i.v>0).map(i=>{
          const pct=totalAnual?Math.round(i.v*12/totalAnual*100):0;
          return`<tr><td class="bld"${i.c?' style="color:'+i.c+'"':''}>${i.n}</td><td class="mo neg">${fmt(i.v)}</td><td class="mo neg">${fmt(i.v*12)}</td><td class="mo">${pct}%</td></tr>`;
        }).join('');
        const salAnual=salMes*12, endAnual=endNom*12, dynAnual=dynNom*12, wbAnual=(wbCostoMes+wbNomMes)*12;
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val" style="color:var(--red)">${salAnual?fmtK(salAnual)+'/año':'Sin datos'}</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(endAnual)}/año</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(dynAnual)}/año</div></div>
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Wirebit</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(wbAnual)} nom.</div></div>
        </div>
        <table class="mbt"><thead><tr><th>Entidad</th><th class="r">Gastos/Mes</th><th class="r">Total Anual</th><th class="r">% del Grupo</th></tr></thead><tbody>
          ${rows}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld neg">—</td><td class="mo bld neg">${fmtK(totalAnual)}</td><td class="mo bld">100%</td></tr>
        </tbody></table>`;
      }
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
            labels:['Salem (sin datos)','Endless (sin datos)','Dynamo (sin datos)','Wirebit (sin datos)'],
            datasets:[{data:[1,1,1,1],backgroundColor:['rgba(0,115,234,.15)','rgba(0,184,117,.15)','rgba(255,112,67,.15)','rgba(155,81,224,.15)'],borderWidth:0}]
          },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:10},boxWidth:9,padding:8}},tooltip:pieTip2},cutout:'50%',scales:{x:{display:false},y:{display:false}}}});
          dc('m-chart2');
          const _nd=NOM_DIST;
          CH['m-chart2']=new Chart(document.getElementById('m-chart2'),{type:'doughnut',data:{
            labels:['Salem '+fmtK(_nd.Salem||0),'Endless '+fmtK(_nd.Endless||0),'Dynamo '+fmtK(_nd.Dynamo||0),'Wirebit '+fmtK(_nd.Wirebit||0)],
            datasets:[{data:[_nd.Salem||0,_nd.Endless||0,_nd.Dynamo||0,_nd.Wirebit||0],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)'],borderWidth:0}]
          },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:10},boxWidth:9,padding:8}},tooltip:pieTip2},cutout:'50%',scales:{x:{display:false},y:{display:false}}}});
        },50);
        return canv+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">Ingresos por Entidad</div><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">Nómina Mensual por Empresa</div></div>`;
      }
    },
    // ── Salem Ingresos
    salem_ing_modal:{
      t:'Salem — Ingresos '+_year,s:'TPV por cliente + Fondeo Tarjetas Centum Black',
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
      t:'Salem — Costos Directos '+_year,s:'Efevoo TPV · Efevoo Tarjetas · SitesPay',
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
      t:'Salem — Gastos Operativos '+_year,s:'Presupuesto detallado por categoría',
      render:()=>{
        const total=SAL_GASTOS_ITEMS.reduce((s,g)=>s+g.ppto,0);
        const rows=SAL_GASTOS_ITEMS.filter(g=>g.ppto>0).map(g=>`<tr><td class="bld">${g.c}</td><td><span style="font-size:.65rem;color:var(--muted)">${g.cat}</span></td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td><td class="mo">${total?((g.ppto/total)*100).toFixed(1):'0'}%</td></tr>`).join('');
        const nomSalG=NOM_DIST.Salem||186000;
        return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Nómina/Mes</div><div class="m-kpi-val">${fmtK(nomSalG)}</div></div><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Nómina Anual</div><div class="m-kpi-val">${fmtK(nomSalG*12)}</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">${(total-nomSalG)>0?fmtK(total-nomSalG)+'/mes':'Sin datos'}</div></div></div>
          <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th><th class="r">% Total</th></tr></thead><tbody>${rows}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(total)}</td><td class="mo bld neg">${fmt(total*12)}</td><td class="mo bld">100%</td></tr>
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
      t:'Endless — Gastos Operativos '+_year,s:'Presupuesto detallado por categoría',
      render:()=>{const nEnd=NOM_DIST.Endless||23000;return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Nómina/Mes</div><div class="m-kpi-val">${fmtK(nEnd)}</div></div><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Nómina Anual</div><div class="m-kpi-val">${fmtK(nEnd*12)}</div></div><div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div></div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
          <tr><td class="bld">Nómina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">Nómina</span></td><td class="mo neg">${fmt(nEnd)}</td><td class="mo neg">${fmt(nEnd*12)}</td></tr>
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(nEnd)}/mes</td><td class="mo bld neg">${fmt(nEnd*12)}/año</td></tr>
        </tbody></table>`;}
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
      t:'Dynamo Finance — Gastos Operativos '+_year,s:'Presupuesto detallado por categoría',
      render:()=>{const nDyn=NOM_DIST.Dynamo||23000;return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Nómina/Mes</div><div class="m-kpi-val">${fmtK(nDyn)}</div></div><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Nómina Anual</div><div class="m-kpi-val">${fmtK(nDyn*12)}</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div></div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
          <tr><td class="bld">Nómina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">Nómina</span></td><td class="mo neg">${fmt(nDyn)}</td><td class="mo neg">${fmt(nDyn*12)}</td></tr>
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(nDyn)}/mes</td><td class="mo bld neg">${fmt(nDyn*12)}/año</td></tr>
        </tbody></table>`;}
    },
    // ── Ingresos Wirebit
    ingresos:{
      t:'Wirebit — Modelo de Ingresos '+_year,s:'5 fuentes · Presupuesto mensual · TC $17.9',
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
      t:'Wirebit — Margen Bruto '+_year,s:'Ingresos vs Costos por mes',
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
      t:'Nómina Compartida — Distribución '+_year,s:'11 empleados · Asignación por empresa',
      render:()=>{
        const rows=NOM.map(e=>{
          const dists=Object.entries(e.dist).filter(([,p])=>p>0).map(([co,p])=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:5px"><span style="width:7px;height:7px;border-radius:50%;background:${{Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'}[co]||'#aaa'};display:inline-block"></span><span style="font-size:.68rem">${co} ${(p*100).toFixed(0)}%</span></span>`).join('');
          return`<tr><td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td><td>${dists}</td><td class="mo">${fmt(e.s*12)}</td></tr>`;
        }).join('');
        const distData=[{n:'Salem',v:NOM_DIST.Salem||0,c:'#0073ea'},{n:'Endless',v:NOM_DIST.Endless||0,c:'#00b875'},{n:'Dynamo',v:NOM_DIST.Dynamo||0,c:'#ff7043'},{n:'Wirebit',v:NOM_DIST.Wirebit||0,c:'#9b51e0'}];
        const distRows=distData.map(d=>`<tr><td class="bld"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:3px;background:${d.c};display:inline-block"></span>${d.n}</span></td><td class="mo pos">${fmt(d.v)}/mes</td><td class="mo pos">${fmt(d.v*12)}/año</td></tr>`).join('');
        const nomMensual=NOM.reduce((a,e)=>a+(e.s||0),0), nomCount=NOM.length, nomAvg=nomCount?Math.round(nomMensual/nomCount):0;
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Total Mensual</div><div class="m-kpi-val">${fmtK(nomMensual)}</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Total Anual</div><div class="m-kpi-val">${fmtK(nomMensual*12)}</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Empleados</div><div class="m-kpi-val">${nomCount}</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Promedio/mes</div><div class="m-kpi-val">${fmtK(nomAvg)}</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empleado</div>
        <div style="overflow-x:auto;margin-bottom:16px"><table class="mbt"><thead><tr><th>Nombre</th><th>Rol</th><th class="r">Sueldo/Mes</th><th>Distribución</th><th class="r">Anual</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empresa</div>
        <table class="mbt"><thead><tr><th>Empresa</th><th class="r">Mensual</th><th class="r">Anual</th></tr></thead><tbody>${distRows}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld pos">${fmtK(nomMensual)}/mes</td><td class="mo bld pos">${fmtK(nomMensual*12)}/año</td></tr>
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
        const acum=sum(monthly), avgMes=monthly.length?Math.round(acum/monthly.length):0;
        const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
        return`<div class="m-kpi-row">
          <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Acumulado Ene–Ago</div><div class="m-kpi-val" style="color:var(--orange)">${acum?fmtK(acum):'Sin datos'}</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Mayor Categoría</div><div class="m-kpi-val" style="font-size:.85rem">${topCat?topCat[0]:'Pendiente'}</div></div>
          <div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Ppto/Mes Promedio</div><div class="m-kpi-val">${avgMes?fmtK(avgMes):'Sin datos'}</div></div>
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
      render:()=>{
        const total=SAL_GASTOS_ITEMS.reduce((s,g)=>s+g.ppto,0);
        const gasRows=SAL_GASTOS_ITEMS.filter(g=>g.ppto>0).map(g=>`<tr><td class="bld">${g.c}</td><td style="color:var(--muted);font-size:.75rem">${g.cat}</td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td></tr>`).join('');
        const nomSal=NOM_DIST.Salem||186000;
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Nómina Asignada</div><div class="m-kpi-val">${fmtK(nomSal)}/mes</div></div>
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">${(total-nomSal)>0?fmtK(total-nomSal)+'/mes':'Sin datos'}</div></div>
        <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Ingresos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
      </div>
      <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Gastos con Datos</div>
      <table class="mbt"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
        ${gasRows}
        <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(total)}/mes</td><td class="mo bld neg">${fmt(total*12)}/año</td></tr>
      </tbody></table>
      <div style="margin-top:12px;text-align:right"><button class="btn btn-blue" onclick="closeModal();navTo('sal_res')" style="font-size:.73rem">Ver P&L completo →</button></div>`;
      }
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
      t:'Wirebit — Resumen Ejecutivo '+_year,s:'Exchange · VEX · OTC · Tarjetas Cripto',
      render:()=>{
        const ingAnual=sum(WB_ING_TOTAL), nomAnual=sum(WB_NOM_TOTAL), costoAnual=sum(WB_COSTO_TOTAL);
        const ebitda=ingAnual-costoAnual-nomAnual;
        const canv=`<canvas id="m-chart1" height="140" style="margin-bottom:14px"></canvas>`;
        setTimeout(()=>{
          dc('m-chart1');
          const datasets=Object.entries(WB_ING).map(([k,v],i)=>({label:k.replace('Fees ',''),data:v,backgroundColor:['rgba(155,81,224,.6)','rgba(0,115,234,.6)','rgba(0,184,117,.6)','rgba(255,112,67,.6)','rgba(255,160,0,.6)'][i],borderWidth:0,stack:'s'}));
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:MO,datasets},
            options:{...cOpts(),plugins:{legend:{labels:{color:'#444669',font:{size:10},boxWidth:8,padding:8}}},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        },50);
        const rows=MO.map((m,i)=>`<tr><td class="bld">${m}</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo neg">${fmt(WB_COSTO_TOTAL[i])}</td><td class="mo neg">${fmt(WB_NOM_TOTAL[i])}</td><td class="mo ${(WB_MARGEN[i]-WB_NOM_TOTAL[i])>=0?'pos':'neg'}">${fmt(WB_MARGEN[i]-WB_NOM_TOTAL[i])}</td></tr>`).join('');
        return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Ingresos Anuales</div><div class="m-kpi-val" style="color:#9b51e0">${ingAnual?fmtK(ingAnual):'Sin datos'}</div></div>
          <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Inicio → Fin</div><div class="m-kpi-val" style="font-size:.9rem">${(WB_ING_TOTAL[0]||WB_ING_TOTAL[11])?fmtK(WB_ING_TOTAL[0])+' → '+fmtK(WB_ING_TOTAL[11]):'Sin datos'}</div></div>
          <div class="m-kpi" style="--ac:${ebitda>=0?'var(--green)':'var(--red)'}"><div class="m-kpi-lbl">EBITDA Anual Est.</div><div class="m-kpi-val" style="color:${ebitda>=0?'var(--green)':'var(--red)'};font-size:.88rem">${ingAnual?fmtK(ebitda):'Pendiente'}</div></div>
          <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Nómina Anual WB</div><div class="m-kpi-val">${fmtK(nomAnual)}</div></div>
        </div>
        ${canv}
        <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Directos</th><th class="r">Nómina</th><th class="r">EBITDA</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="margin-top:12px;text-align:right"><button class="btn btn-blue" onclick="closeModal();navTo('wb_res')" style="font-size:.73rem;background:#9b51e0;border-color:#9b51e0">Ver P&L completo →</button></div>`;
      }
    },
    // ── WB Ingresos chart
    wb_ingresos_chart:{
      t:'Wirebit — Ingresos vs Costos Detallado',s:'Presupuesto mensual '+_year,
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
      t:'Wirebit — Mix de Ingresos por Fuente',s:'Distribución anual presupuestada '+_year,
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
