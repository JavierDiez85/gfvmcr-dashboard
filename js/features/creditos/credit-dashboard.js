// GF — Creditos: Dashboard consolidado
(function(window) {
  'use strict';

  // ══════════════════════════════════════
  // DASHBOARD CONSOLIDADO DE CREDITOS
  // ══════════════════════════════════════
  function rCredDash(entFilter, elPrefix){
    // entFilter: 'end'=solo Endless, 'dyn'=solo Dynamo, null=todos
    // elPrefix: prefijo de IDs HTML (default 'cred-dash')
    if(!elPrefix) elPrefix = 'cred-dash';

    // Load latest data from DB
    try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
    try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}

    let all = [];
    if(!entFilter || entFilter==='end') all.push(...END_CREDITS.map((c,i)=>({...c, _ent:'end', _entLabel:'Endless Money', _col:'#00b875', _origIdx:i})));
    if(!entFilter || entFilter==='dyn') all.push(...DYN_CREDITS.map((c,i)=>({...c, _ent:'dyn', _entLabel:'Dynamo Finance', _col:'#ff7043', _origIdx:i})));

    // ── KPIs consolidados ──
    const activos    = all.filter(c=>c.st==='Activo');
    const vencidos   = all.filter(c=>c.st==='Vencido');
    const prospectos = all.filter(c=>c.st==='Prospecto');
    const pagados    = all.filter(c=>c.st==='Pagado');

    const montoTotal     = all.reduce((s,c)=>s+(c.monto||0),0);
    // Cartera vencida = suma de montos de periodos vencidos por fecha (no por estatus del credito)
    const activosYVencidos = all.filter(c=>c.st==='Activo'||c.st==='Vencido');
    const carteraVencida = activosYVencidos.reduce((s,c)=>{
      const res = credCobranzaResumen(c);
      return s + (res ? res.montoVencido : 0);
    },0);
    const saldoTotal     = activosYVencidos.reduce((s,c)=>s+credSaldoActual(c),0);
    const carteraActiva  = saldoTotal - carteraVencida;
    const carteraTotal   = saldoTotal;
    const intTotal       = all.reduce((s,c)=>s+credTotalIntereses(c),0);
    const totalCreditos  = activos.length + vencidos.length + prospectos.length;
    const pctVencida     = carteraTotal>0 ? ((carteraVencida/carteraTotal)*100).toFixed(1) : '0';

    const _kpiCard = (k) => `
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px;border-top:3px solid ${k.color}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
          <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
        </div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
        <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
      </div>`;

    const kpis1 = [
      {lbl:'Total Creditos', val:totalCreditos, sub:`${activos.length} activos · ${vencidos.length} vencidos · ${prospectos.length} prospectos`, ico:'📋', color:'#0073ea', bg:'var(--blue-bg)'},
      {lbl:'Monto Total Prestado', val:fmtK(montoTotal), sub:'Capital otorgado ambas SOFOMs', ico:'💵', color:'var(--green)', bg:'var(--green-bg)'},
      {lbl:'Cartera Vigente', val:fmtK(carteraActiva), sub:'Saldo activo pendiente consolidado', ico:'📈', color:'#0073ea', bg:'var(--blue-bg)'},
    ];
    const kpis2 = [
      {lbl:'Cartera Vencida', val:fmtK(carteraVencida), sub: carteraVencida>0 ? pctVencida+'% del total' : 'Sin vencimientos', ico:'⚠️', color: carteraVencida>0?'var(--red)':'var(--green)', bg: carteraVencida>0?'var(--red-bg)':'var(--green-bg)'},
      {lbl:'Intereses Totales', val:fmtK(intTotal), sub:'Sobre tablas de amortizacion', ico:'💰', color:'var(--purple)', bg:'var(--purple-bg)'},
      {lbl:'Tasa Ponderada Prom.', val: montoTotal>0 ? (all.reduce((s,c)=>s+(c.tasa||0)*(c.monto||0),0)/montoTotal).toFixed(1)+'%' : '—', sub:'Ponderada por monto', ico:'📊', color:'var(--orange)', bg:'var(--orange-bg)'},
    ];

    const el1 = document.getElementById(elPrefix+'-kpis');
    const el2 = document.getElementById(elPrefix+'-kpis2');
    if(el1) el1.innerHTML = kpis1.map(_kpiCard).join('');
    if(el2) el2.innerHTML = kpis2.map(_kpiCard).join('');

    // ── Charts ──
    // Chart 1: Status breakdown (horizontal bar)
    const _chKey1 = elPrefix+'-st';
    const _chKey2 = elPrefix+'-ent';
    dc(_chKey1);
    const _canvasSt = document.getElementById('c-'+elPrefix+'-status');
    if(!_canvasSt) { _credDashEntitySummary('end', END_CREDITS, '#00b875'); _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043'); _credDashRenderAllList(all, elPrefix); return; }
    CH[_chKey1] = new Chart(_canvasSt,{
      type:'bar',
      data:{
        labels:['Activos','Vencidos','Prospectos','Pagados'],
        datasets:[{
          data:[activos.length, vencidos.length, prospectos.length, pagados.length],
          backgroundColor:['rgba(0,184,117,.22)','rgba(234,57,67,.22)','rgba(255,160,0,.22)','rgba(155,81,224,.22)'],
          borderColor:['#00b875','#ea3943','#ffa000','#9b51e0'],
          borderWidth:1.5, borderRadius:4
        }]
      },
      options:{...cOpts(),indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw+' creditos'}}},
        scales:{x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{stepSize:1,color:'#b0b4d0',font:{size:9}}},y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}}}
    });

    // Chart 2: Entity distribution (doughnut)
    dc(_chKey2);
    const endCartera = END_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
    const dynCartera = DYN_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
    const totalCar = endCartera + dynCartera;
    const _canvasEnt = document.getElementById('c-'+elPrefix+'-entity');
    if(!_canvasEnt) { _credDashEntitySummary('end', END_CREDITS, '#00b875'); _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043'); _credDashRenderAllList(all, elPrefix); return; }
    CH[_chKey2] = new Chart(_canvasEnt,{
      type:'doughnut',
      data:{
        labels:[`Endless ${fmtK(endCartera)}`,`Dynamo ${fmtK(dynCartera)}`],
        datasets:[{
          data: totalCar>0 ? [endCartera, dynCartera] : [1,1],
          backgroundColor: totalCar>0 ? ['rgba(0,184,117,.22)','rgba(255,112,67,.22)'] : ['rgba(134,134,134,.15)','rgba(134,134,134,.15)'],
          borderColor: totalCar>0 ? ['#00b875','#ff7043'] : ['rgba(134,134,134,.3)','rgba(134,134,134,.3)'],
          borderWidth:2
        }]
      },
      options:{...cOpts(),cutout:'60%',plugins:{legend:{position:'bottom',labels:{color:'#8b8fb5',font:{size:10},boxWidth:8,padding:6}},
        tooltip:{callbacks:{label:ctx=>' '+fmtK(ctx.raw)+' ('+(totalCar>0?((ctx.raw/totalCar)*100).toFixed(1):0)+'%)'}}},
        scales:{x:{display:false},y:{display:false}}}
    });

    // ── Entity summary cards (solo si hay ambas) ──
    if(!entFilter) {
      _credDashEntitySummary('end', END_CREDITS, '#00b875');
      _credDashEntitySummary('dyn', DYN_CREDITS, '#ff7043');
    }

    // ── Lista combinada ──
    _credDashRenderAllList(all, elPrefix);
  }

  function _credDashEntitySummary(entKey, credits, col){
    const el = document.getElementById('cred-dash-'+entKey+'-summary');
    if(!el) return;
    const activos = credits.filter(c=>c.st==='Activo');
    const vencidos = credits.filter(c=>c.st==='Vencido');
    const prospectos = credits.filter(c=>c.st==='Prospecto');
    const activosYVenc = credits.filter(c=>c.st==='Activo'||c.st==='Vencido');
    const carteraVencida = activosYVenc.reduce((s,c)=>{ const r=credCobranzaResumen(c); return s+(r?r.montoVencido:0); },0);
    const saldoTotal = activosYVenc.reduce((s,c)=>s+credSaldoActual(c),0);
    const carteraVigente = saldoTotal - carteraVencida;
    const montoOriginal = credits.reduce((s,c)=>s+(c.monto||0),0);
    const total = activos.length+vencidos.length+prospectos.length;

    if(!total){
      el.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:.78rem">Sin creditos en cartera</div>`;
      return;
    }

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Creditos</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${col}">${total}</div>
          <div style="font-size:.6rem;color:var(--muted)">${activos.length} act · ${vencidos.length} venc · ${prospectos.length} prosp</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Monto Prestado</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${col}">${fmtK(montoOriginal)}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Cartera Vigente</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:#0073ea">${fmtK(carteraVigente)}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:3px">Cartera Vencida</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${carteraVencida>0?'var(--red)':'var(--green)'}">${fmtK(carteraVencida)}</div>
        </div>
      </div>`;
  }

  function _credDashRenderAllList(all, elPrefix){
    if(!elPrefix) elPrefix = 'cred-dash';
    const listEl = document.getElementById(elPrefix+'-all-list');
    const countEl = document.getElementById(elPrefix+'-total-count');
    if(!listEl) return;

    if(countEl) countEl.textContent = all.length;

    if(!all.length){
      listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
        <div style="font-size:2rem;margin-bottom:10px">📭</div>
        No hay creditos en cartera.<br>
        <span style="font-size:.72rem">Usa <strong>Cargar PDF</strong> para importar desde tabla de amortizacion.</span>
      </div>`;
      return;
    }

    const sorted = [...all].sort((a,b)=>{
      const ord = {Activo:0,Vencido:1,Prospecto:2,Pagado:3};
      return (ord[a.st]||9) - (ord[b.st]||9) || (b.monto||0) - (a.monto||0);
    });

    const stIco = {Activo:'✅',Vencido:'⚠️',Pagado:'🏁',Prospecto:'🎯'};
    const stBg  = {Activo:'var(--green-bg)',Vencido:'var(--red-bg)',Pagado:'var(--purple-bg)',Prospecto:'var(--yellow-bg)'};
    const stCol = {Activo:'var(--green)',Vencido:'var(--red)',Pagado:'var(--purple)',Prospecto:'var(--yellow)'};
    const stBor = {Activo:'var(--green-lt)',Vencido:'var(--red-lt)',Pagado:'var(--purple-lt)',Prospecto:'var(--yellow-lt)'};

    listEl.innerHTML = sorted.map(c=>{
      const saldo = credSaldoActual(c);
      const intTot = credTotalIntereses(c);
      const origIdx = c._origIdx;

      return `<div class="cred-dash-row" data-name="${_esc((c.cl||'').toLowerCase())}" onclick="credOpenDetail('${_esc(c._ent)}','${_esc((c.cl||'').replace(/'/g,"\\'"))}',${origIdx})"
        style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
        onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
        <div style="width:36px;height:36px;border-radius:10px;background:${stBg[c.st]||stBg.Activo};border:1px solid ${stBor[c.st]||stBor.Activo};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${stIco[c.st]||'📋'}</div>
        <div style="flex:1;min-width:0;overflow:hidden">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-weight:700;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;display:inline-block">${_esc(c.cl)}</span>
            <span style="font-size:.58rem;font-weight:700;padding:1px 6px;border-radius:8px;background:${stBg[c.st]};color:${stCol[c.st]};border:1px solid ${stBor[c.st]}">${_esc(c.st)}</span>
            <span style="font-size:.56rem;font-weight:700;padding:1px 5px;border-radius:6px;background:${c._col}18;color:${c._col};border:1px solid ${c._col}35">${_esc(c._entLabel)}</span>
          </div>
          <div style="font-size:.68rem;color:var(--muted)">${_esc(c.tipo||'Simple')} · ${c.tasa||0}% anual · ${c.plazo||0} meses${c.disbDate?' · '+_esc(c.disbDate):''}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:${c._col}">${fmtK(c.monto||0)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Monto</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#0073ea">${fmtK(saldo)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Saldo</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:var(--purple)">${fmtK(intTot)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Intereses</div>
        </div>
        <div style="color:var(--muted);font-size:.9rem;flex-shrink:0">›</div>
      </div>`;
    }).join('');
  }

  function credDashFilter(query){
    const q = query.toLowerCase();
    document.querySelectorAll('#cred-dash-all-list .cred-dash-row').forEach(row=>{
      row.style.display = row.dataset.name.includes(q) ? '' : 'none';
    });
  }
  function dynDashFilter(query){
    const q = query.toLowerCase();
    document.querySelectorAll('#dyn-dash-all-list .cred-dash-row').forEach(row=>{
      row.style.display = row.dataset.name.includes(q) ? '' : 'none';
    });
  }

  // ── Dashboard KPIs ──
  function credRenderDashKPIs(credits, entKey){
    const col   = entKey==='end' ? '#00b875' : '#ff7043';
    const colBg = entKey==='end' ? 'var(--green-bg)' : 'var(--orange-bg)';
    const colLt = entKey==='end' ? 'var(--green-lt)' : 'var(--orange-lt)';
    const el    = document.getElementById(entKey+'-dash-kpis');
    if(!el) return;

    const activos    = credits.filter(c=>c.st==='Activo');
    const vencidos   = credits.filter(c=>c.st==='Vencido');
    const prospectos = credits.filter(c=>c.st==='Prospecto');
    const total      = activos.length + vencidos.length + prospectos.length;

    // Cartera vencida = montos de periodos vencidos por fecha de amortizacion
    const activosYVenc = credits.filter(c=>c.st==='Activo'||c.st==='Vencido');
    const carteraVencida = activosYVenc.reduce((s,c)=>{
      const res = credCobranzaResumen(c);
      return s + (res ? res.montoVencido : 0);
    },0);
    const saldoTotal     = activosYVenc.reduce((s,c)=>s+credSaldoActual(c),0);
    const carteraActiva  = saldoTotal - carteraVencida;
    const carteraTotal   = saldoTotal;
    const ganTotal       = credits.reduce((s,c)=>s+credTotalIntereses(c),0);
    const montoOriginal  = credits.reduce((s,c)=>s+(c.monto||0),0);
    const cobrado        = montoOriginal - carteraTotal + ganTotal;
    const numConVencidos = activosYVenc.filter(c=>{ const r=credCobranzaResumen(c); return r&&r.montoVencido>0; }).length;

    const kpis = [
      {lbl:'Creditos', val:total, sub: `${activos.length} activos · ${vencidos.length} vencidos · ${prospectos.length} prospectos`, ico:'📋', color:col, bg:colBg},
      {lbl:'Monto Prestado', val:fmtK(montoOriginal), sub:'Capital total otorgado', ico:'💵', color:col, bg:colBg},
      {lbl:'Cartera Vigente', val:fmtK(carteraActiva), sub:'Saldo al corriente', ico:'📈', color:'var(--blue)', bg:'var(--blue-bg)'},
      {lbl:'Cartera Vencida', val:fmtK(carteraVencida), sub: carteraVencida>0 ? `${((carteraVencida/carteraTotal)*100).toFixed(1)}% del total · ${numConVencidos} creditos` : 'Sin vencimientos', ico:'⚠️', color: carteraVencida>0?'var(--red)':'var(--green)', bg: carteraVencida>0?'var(--red-bg)':'var(--green-bg)'},
      {lbl:'Intereses Totales', val:fmtK(ganTotal), sub:'Sobre tabla de amortizacion', ico:'💰', color:'var(--purple)', bg:'var(--purple-bg)'},
    ];

    el.innerHTML = kpis.map(k=>`
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
          <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
        </div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
        <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
      </div>`).join('');
  }

  // ── Lista de creditos (cards) ──
  function credRenderList(credits, entKey){
    const col = entKey==='end' ? '#00b875' : '#ff7043';
    const listEl = document.getElementById(entKey+'-cred-list');
    const countEl = document.getElementById(entKey+'-cred-count');
    if(!listEl) return;

    const sorted = [...credits].sort((a,b)=>{
      const da = a.disbDate||'9999', db = b.disbDate||'9999';
      return da < db ? -1 : da > db ? 1 : 0;
    });

    countEl.textContent = credits.length;

    if(!credits.length){
      listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
        <div style="font-size:2rem;margin-bottom:10px">📭</div>
        No hay creditos en cartera.<br>
        <span style="font-size:.72rem">Usa <strong>Cargar PDF</strong> para importar desde tabla de amortizacion.</span>
      </div>`;
      return;
    }

    const stStyle = {
      Activo:    {bg:'var(--green-bg)',   color:'var(--green)',  border:'var(--green-lt)'},
      Vencido:   {bg:'var(--red-bg)',     color:'var(--red)',    border:'var(--red-lt)'},
      Prospecto: {bg:'var(--yellow-bg)',  color:'var(--yellow)', border:'var(--yellow-lt)'},
      Pagado:    {bg:'var(--purple-bg)',  color:'var(--purple)', border:'var(--purple-lt)'},
    };

    listEl.innerHTML = sorted.map((c,i)=>{
      const st  = stStyle[c.st] || stStyle.Activo;
      const saldo = credSaldoActual(c);
      const intTot = credTotalIntereses(c);
      const pago  = credPagoFijo(c);
      const periodos = c.amort ? c.amort.length-1 : c.plazo;
      const cobr = credCobranzaResumen(c);
      const mPagado    = cobr ? cobr.montoPagado : 0;
      const mPendiente = cobr ? cobr.montoPendiente : 0;
      const mVencido   = cobr ? cobr.montoVencido : 0;

      return `<div onclick="credOpenDetail('${_esc(entKey)}','${_esc(c.cl.replace(/'/g,"\\'"))}',${credits.indexOf(c)})"
        style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
        onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">

        <!-- Avatar -->
        <div style="width:40px;height:40px;border-radius:12px;background:${st.bg};border:1px solid ${st.border};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
          ${c.st==='Activo'?'✅':c.st==='Vencido'?'⚠️':c.st==='Pagado'?'🏁':'🎯'}
        </div>

        <!-- Info principal -->
        <div style="flex:1;min-width:0;overflow:hidden">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            <span style="font-weight:700;font-size:.86rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;display:inline-block">${_esc(c.cl)}</span>
            <span style="font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:10px;background:${st.bg};color:${st.color};border:1px solid ${st.border}">${_esc(c.st)}</span>
          </div>
          <div style="font-size:.7rem;color:var(--muted)">${_esc(c.tipo||'Simple')} · ${periodos} ${c.plazo<=24?'meses':'periodos'} · ${c.tasa}% anual${c.iva?` · IVA ${c.iva}%`:''}</div>
          ${c.disbDate?`<div style="font-size:.68rem;color:var(--muted);margin-top:1px">📅 Desembolso: ${_esc(c.disbDate)}</div>`:''}
        </div>

        <!-- Montos -->
        <div style="text-align:right;flex-shrink:0;min-width:90px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:${col}">${fmtK(c.monto)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Monto original</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--blue)">${fmtK(saldo)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Saldo actual</div>
        </div>

        <!-- Cobranza columns -->
        <div style="text-align:right;flex-shrink:0;min-width:80px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--green)">${fmtK(mPagado)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Pagado</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:80px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:var(--orange)">${fmtK(mPendiente)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Pendiente</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:80px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:${mVencido>0?'var(--red)':'var(--green)'}">${mVencido>0?fmtK(mVencido):'$0'}</div>
          <div style="font-size:.62rem;color:var(--muted)">Vencido</div>
        </div>

        <!-- Actions -->
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
          <button onclick="credOpenDetail('${_esc(entKey)}','${_esc(c.cl.replace(/'/g,"\\'"))}',${credits.indexOf(c)})" style="font-size:.62rem;padding:4px 10px;border:1px solid ${col};color:${col};background:transparent;border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap" onmouseover="this.style.background='${col}';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='${col}'">📋 Ver tabla</button>
          <button onclick="credDeleteFromList('${entKey}',${credits.indexOf(c)})" style="font-size:.62rem;padding:4px 10px;border:1px solid var(--border2);color:var(--red);background:transparent;border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap" onmouseover="this.style.background='var(--red)';this.style.color='white';this.style.borderColor='var(--red)'" onmouseout="this.style.background='transparent';this.style.color='var(--red)';this.style.borderColor='var(--border2)'">🗑 Eliminar</button>
        </div>
      </div>`;
    }).join('');
  }

  function rEndCred(){
    try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
    credRenderDashKPIs(END_CREDITS,'end');
    credRenderList(END_CREDITS,'end');
  }
  function rDynCred(){
    try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}
    credRenderDashKPIs(DYN_CREDITS,'dyn');
    credRenderList(DYN_CREDITS,'dyn');
    syncDynResKPIs();
  }

  function syncDynResKPIs(){
    const activos    = DYN_CREDITS.filter(c=>c.st==='Activo');
    const vencidos   = DYN_CREDITS.filter(c=>c.st==='Vencido');
    const prospectos = DYN_CREDITS.filter(c=>c.st==='Prospecto');
    const carteraTotal   = DYN_CREDITS.reduce((s,c)=>s+(c.monto||0),0);
    const carteraVencida = vencidos.reduce((s,c)=>s+(c.monto||0),0);
    const pipeline       = prospectos.reduce((s,c)=>s+(c.monto||0),0);
    const pct = carteraTotal>0 ? ((carteraVencida/carteraTotal)*100).toFixed(1) : 0;
    const q = id => document.getElementById(id);
    if(q('dyn-kpi-cartera'))    q('dyn-kpi-cartera').textContent    = fmtK(carteraTotal);
    if(q('dyn-kpi-cartera-sub'))q('dyn-kpi-cartera-sub').textContent= DYN_CREDITS.length+' credito'+(DYN_CREDITS.length!==1?'s':'');
    if(q('dyn-kpi-vencida'))    q('dyn-kpi-vencida').textContent    = fmtK(carteraVencida);
    if(q('dyn-kpi-vencida-sub'))q('dyn-kpi-vencida-sub').textContent= carteraVencida>0 ? pct+'% cartera' : 'Sin vencimientos';
    if(q('dyn-kpi-vencida-bar'))q('dyn-kpi-vencida-bar').style.width= pct+'%';
    if(q('dyn-kpi-pipeline'))   q('dyn-kpi-pipeline').textContent   = fmtK(pipeline);
    if(q('dyn-kpi-pipeline-sub'))q('dyn-kpi-pipeline-sub').textContent= prospectos.length+' prospecto'+(prospectos.length!==1?'s':'');
  }

  // ── Delete credit from list (without opening detail modal) ──
  function credDeleteFromList(entKey, idx){
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    const name = (credits[idx] && credits[idx].cl) ? credits[idx].cl : 'este crédito';
    customConfirm('¿Eliminar "' + name + '"?', 'Eliminar', function(ok){
      if(!ok) return;
      credits.splice(idx, 1);
      DB.set('gf_cred_' + entKey, credits);
      if(entKey==='end') rEndCred(); else rDynCred();
      fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
      toast('🗑 ' + name + ' eliminado');
    });
  }

  // Expose globals
  window.credDeleteFromList  = credDeleteFromList;
  window.rCredDash           = rCredDash;
  window._credDashEntitySummary = _credDashEntitySummary;
  window._credDashRenderAllList = _credDashRenderAllList;
  window.credDashFilter      = credDashFilter;
  window.dynDashFilter       = dynDashFilter;
  window.credRenderDashKPIs  = credRenderDashKPIs;
  window.credRenderList      = credRenderList;
  window.rEndCred            = rEndCred;
  window.rDynCred            = rDynCred;
  window.syncDynResKPIs      = syncDynResKPIs;

  // Register views
  if(typeof registerView === 'function'){
    registerView('cred_dash', function(){ rCredDash('end','cred-dash'); });
    registerView('dyn_dash', function(){ rCredDash('dyn','dyn-dash'); });
    registerView('end_cred', function(){ rEndCred(); });
    registerView('dyn_cred', function(){ rDynCred(); });
  }

})(window);
