// GF — Dashboard: Inicio (Pantalla de Bienvenida)
(function(window) {
  'use strict';

const TAREAS_KEY = 'gf_tareas';

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

async function _inicioTarKPIs() {
  const _s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  try {
    if (typeof _loadConfig === 'function') await _loadConfig();
    if (!_sb) { _s('inicio-tar-monto','—'); _s('inicio-tar-txns','—'); _s('inicio-tar-th','—'); return; }
    const [r1, r2, r3] = await Promise.all([
      _sb.from('tar_transactions').select('monto', {count:'exact'}).limit(0),
      _sb.from('tar_transactions').select('monto').limit(100000),
      _sb.from('tar_cardholders').select('id', {count:'exact', head:true})
    ]);
    const txnCount = r1.count || 0;
    const totalMonto = (r2.data || []).reduce((a, r) => a + (parseFloat(r.monto) || 0), 0);
    const thCount = r3.count || 0;
    _s('inicio-tar-monto', txnCount > 0 ? fmtK(totalMonto) : '—');
    _s('inicio-tar-monto-sub', txnCount > 0 ? 'Total procesado' : 'Sin transacciones');
    _s('inicio-tar-txns', txnCount > 0 ? txnCount.toLocaleString('es-MX') : '—');
    _s('inicio-tar-th', thCount > 0 ? thCount.toLocaleString('es-MX') : '—');
  } catch (e) {
    console.warn('[Inicio] Tarjetas KPIs error:', e);
    _s('inicio-tar-monto','—'); _s('inicio-tar-txns','—'); _s('inicio-tar-th','—');
  }
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
    if (sinConfig > 0) alertas.push({ icon: '⚙️', text: `${sinConfig} clientes TPV sin comisiones configuradas`, color: 'var(--orange)', action: "navTo('tpv_comisiones')" });

    // 2. Flujo neto negativo
    const data = typeof tesLoad === 'function' ? tesLoad() : [];
    const mes = typeof tesCurMonth === 'function' ? tesCurMonth() : '';
    const thisMon = data.filter(m => m.fecha?.substring(0, 7) === mes);
    const mesIng = thisMon.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const mesGas = thisMon.filter(m => m.tipo === 'Gasto').reduce((s, m) => s + m.monto, 0);
    if (mesIng - mesGas < 0) alertas.push({ icon: '🔴', text: 'Flujo neto del mes es negativo: ' + (typeof tesFmtSigned === 'function' ? tesFmtSigned(mesIng - mesGas) : ''), color: 'var(--red)', action: "navTo('tes_flujo')" });

    // 3. Créditos vencidos (fix: c.st not c.status)
    let vencidos = 0;
    if (typeof END_CREDITS !== 'undefined' && Array.isArray(END_CREDITS))
      vencidos += END_CREDITS.filter(c => c.st === 'Vencido').length;
    if (typeof DYN_CREDITS !== 'undefined' && Array.isArray(DYN_CREDITS))
      vencidos += DYN_CREDITS.filter(c => c.st === 'Vencido').length;
    if (vencidos > 0) alertas.push({ icon: '⚠️', text: `${vencidos} créditos vencidos en cartera`, color: 'var(--red)', action: "navTo('cred_cobr')" });

    // 4. Sin movimientos de tesorería este mes
    if (thisMon.length === 0 && data.length > 0)
      alertas.push({ icon: '📅', text: 'Sin movimientos de tesorería registrados este mes', color: 'var(--muted)', action: "navTo('tes_flujo')" });

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

      if(pagosProximos>0) alertas.push({ icon:'🔔', text:`${pagosProximos} pagos vencen en los próximos 7 días`, color:'var(--orange)', action:"navTo('cred_cobr')" });
      if(pagosVencidos>0) alertas.push({ icon:'🚨', text:`${pagosVencidos} pagos vencidos por ${typeof fmtK==='function'?fmtK(montoVencido):'$'+montoVencido} total`, color:'var(--red)', action:"navTo('cred_cobr')" });
    } catch(e){ console.warn('[Inicio] Cobranza alertas error:',e); }

    // 7. Tickets pendientes de lectura
    try {
      const tkData = DB.get('gf_tickets_pagos_tpv') || [];
      const tkPend = tkData.filter(t => t.leido === false).length;
      if(tkPend > 0) alertas.push({ icon:'🎫', text:`${tkPend} ticket${tkPend>1?'s':''} pendiente${tkPend>1?'s':''} de lectura`, color:'#9c27b0', action:"navTo('tk_pagos_tpv')" });
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

  // Expose globals
  window.TAREAS_KEY = TAREAS_KEY;
  window.rInicio = rInicio;
  window._inicioTesKPIs = _inicioTesKPIs;
  window._inicioTPVKPIs = _inicioTPVKPIs;
  window._inicioTarKPIs = _inicioTarKPIs;
  window._inicioAlertas = _inicioAlertas;
  window._loadTareas = _loadTareas;
  window._saveTareas = _saveTareas;
  window.addTarea = addTarea;
  window.toggleTarea = toggleTarea;
  window.deleteTarea = deleteTarea;
  window.renderTareas = renderTareas;

  // Register views
  if(typeof registerView === 'function'){
    registerView('inicio', function(){ return rInicio(); });
  }

})(window);
