// GFVMCR — Créditos: carteras, PDF upload

// RENDER: CARTERAS
// ═══════════════════════════════════════
// CRÉDITOS — Engine completo
// ═══════════════════════════════════════

// ── Helpers de cálculo ──
function credIntMes(c){
  if(!c.monto||!c.tasa) return 0;
  // If amortization table exists, use first period interest
  if(c.amort && c.amort.length>1) return c.amort[1].int||0;
  return c.monto * (c.tasa/100) / (c.plazo<=24?12:c.plazo<=60?12:1);
}
function credComApertura(c){ return c.monto*(c.com||0)/100; }
function credIngAnual(c){
  if(c.amort && c.amort.length>1){
    return c.amort.slice(1).reduce((s,r)=>s+(r.int||0)+(r.ivaInt||0),0);
  }
  return credIntMes(c)*12 + credComApertura(c);
}
function credSaldoActual(c){
  // Return current outstanding capital (last known saldo from amort table)
  if(c.amort && c.amort.length>0) return c.amort[0].saldo||c.monto;
  return c.monto;
}
function credPagoFijo(c){
  if(c.amort && c.amort.length>1) return c.amort[1].pago||0;
  return 0;
}
function credTotalPagos(c){
  if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.pago||0),0);
  return 0;
}
function credTotalIntereses(c){
  if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.int||0),0);
  return 0;
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

  const carteraTotal   = credits.reduce((s,c)=>s+credSaldoActual(c),0);
  const carteraActiva  = activos.reduce((s,c)=>s+credSaldoActual(c),0);
  const carteraVencida = vencidos.reduce((s,c)=>s+credSaldoActual(c),0);
  const ganTotal       = credits.reduce((s,c)=>s+credTotalIntereses(c),0);
  const montoOriginal  = credits.reduce((s,c)=>s+(c.monto||0),0);
  const cobrado        = montoOriginal - carteraTotal + ganTotal;

  const kpis = [
    {lbl:'Créditos', val:total, sub: `${activos.length} activos · ${vencidos.length} vencidos · ${prospectos.length} prospectos`, ico:'📋', color:col, bg:colBg},
    {lbl:'Monto Prestado', val:fmtK(montoOriginal), sub:'Capital total otorgado', ico:'💵', color:col, bg:colBg},
    {lbl:'Cartera Vigente', val:fmtK(carteraActiva), sub:'Saldo activo pendiente', ico:'📈', color:'var(--blue)', bg:'var(--blue-bg)'},
    {lbl:'Cartera Vencida', val:fmtK(carteraVencida), sub: carteraVencida>0 ? `${((carteraVencida/carteraTotal)*100).toFixed(1)}% del total` : 'Sin vencimientos', ico:'⚠️', color: carteraVencida>0?'var(--red)':'var(--green)', bg: carteraVencida>0?'var(--red-bg)':'var(--green-bg)'},
    {lbl:'Intereses Totales', val:fmtK(ganTotal), sub:'Sobre tabla de amortización', ico:'💰', color:'var(--purple)', bg:'var(--purple-bg)'},
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

// ── Lista de créditos (cards) ──
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
      No hay créditos en cartera.<br>
      <span style="font-size:.72rem">Usa <strong>Cargar PDF</strong> para importar desde tabla de amortización.</span>
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
    const progreso = c.amort ? Math.round(((c.amort.length-1 - (c.amort.filter(r=>r.saldo>0).length-1)) / (c.amort.length-1))*100) : 0;

    return `<div onclick="credOpenDetail('${entKey}','${c.cl.replace(/'/g,"\\'")}',${credits.indexOf(c)})"
      style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">

      <!-- Avatar -->
      <div style="width:40px;height:40px;border-radius:12px;background:${st.bg};border:1px solid ${st.border};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
        ${c.st==='Activo'?'✅':c.st==='Vencido'?'⚠️':c.st==='Pagado'?'🏁':'🎯'}
      </div>

      <!-- Info principal -->
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span style="font-weight:700;font-size:.86rem">${c.cl}</span>
          <span style="font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:10px;background:${st.bg};color:${st.color};border:1px solid ${st.border}">${c.st}</span>
        </div>
        <div style="font-size:.7rem;color:var(--muted)">${c.tipo||'Simple'} · ${periodos} ${c.plazo<=24?'meses':'periodos'} · ${c.tasa}% anual${c.iva?` · IVA ${c.iva}%`:''}</div>
        ${c.disbDate?`<div style="font-size:.68rem;color:var(--muted);margin-top:1px">📅 Desembolso: ${c.disbDate}</div>`:''}
      </div>

      <!-- Montos -->
      <div style="text-align:right;flex-shrink:0;min-width:110px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.95rem;color:${col}">${fmtK(c.monto)}</div>
        <div style="font-size:.68rem;color:var(--muted)">Monto original</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:100px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:var(--blue)">${fmtK(saldo)}</div>
        <div style="font-size:.68rem;color:var(--muted)">Saldo actual</div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:100px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem;color:var(--purple)">${fmtK(intTot)}</div>
        <div style="font-size:.68rem;color:var(--muted)">Total intereses</div>
      </div>
      ${pago?`<div style="text-align:right;flex-shrink:0;min-width:100px">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.88rem">${fmtK(pago)}</div>
        <div style="font-size:.68rem;color:var(--muted)">Pago fijo</div>
      </div>`:''}

      <!-- Arrow -->
      <div style="color:var(--muted);font-size:1rem;flex-shrink:0">›</div>
    </div>`;
  }).join('');
}

// ── Modal de detalle con tabla de amortización ──
function credOpenDetail(entKey, nombre, idx){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  // Find by name (safer than index after sort)
  const realIdx = credits.findIndex(c => c.cl === nombre);
  const c = realIdx >= 0 ? credits[realIdx] : credits[idx];
  const resolvedIdx = realIdx >= 0 ? realIdx : idx;
  if(!c) return;

  const col    = entKey==='end' ? '#00b875' : '#ff7043';
  const label  = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
  const intTot = credTotalIntereses(c);
  const ivaTot = c.amort ? c.amort.slice(1).reduce((s,r)=>s+(r.ivaInt||0),0) : 0;
  const pagoTotal = credTotalPagos(c);

  let amortTable = '';
  if(c.amort && c.amort.length > 1){
    const rows = c.amort.map((r,i)=>{
      if(i===0) return `<tr style="background:var(--bg)">
        <td class="r" style="font-weight:600">0</td>
        <td>${r.fecha||'—'}</td>
        <td class="mo">—</td><td class="mo">—</td><td class="mo">—</td><td class="mo">—</td>
        <td class="mo bld" style="color:${col}">${fmtFull(r.saldo)}</td>
      </tr>`;
      const isPaid = r.saldo <= 0.01;
      return `<tr ${isPaid?'style="opacity:.6"':''}>
        <td class="r">${r.periodo}</td>
        <td style="font-size:.75rem">${r.fecha||'—'}</td>
        <td class="mo bld">${fmtFull(r.pago)}</td>
        <td class="mo pos">${fmtFull(r.capital)}</td>
        <td class="mo" style="color:var(--orange)">${fmtFull(r.int)}</td>
        <td class="mo" style="color:var(--muted);font-size:.72rem">${fmtFull(r.ivaInt)}</td>
        <td class="mo bld" style="color:${isPaid?'var(--green)':col}">${isPaid?'✅ Pagado':fmtFull(r.saldo)}</td>
      </tr>`;
    }).join('');
    amortTable = `
      <div style="margin-top:16px">
        <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">📅 Tabla de Amortización</div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr>
              <th class="r">Periodo</th><th>Fecha</th>
              <th class="r">Pago Fijo</th><th class="r">Abono Capital</th>
              <th class="r">Intereses</th><th class="r">IVA Intereses</th>
              <th class="r">Saldo Capital</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr style="background:var(--bg);font-weight:700">
              <td colspan="2" class="bld">TOTALES</td>
              <td class="mo bld">${fmtFull(pagoTotal)}</td>
              <td class="mo pos">${fmtFull(c.monto)}</td>
              <td class="mo" style="color:var(--orange)">${fmtFull(intTot)}</td>
              <td class="mo" style="color:var(--muted)">${fmtFull(ivaTot)}</td>
              <td class="mo bld" style="color:var(--green)">$0.00</td>
            </tfoot>
          </table>
        </div>
      </div>`;
  }

  const html = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
      <div style="width:44px;height:44px;border-radius:12px;background:${col}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem">🏦</div>
      <div style="flex:1">
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${c.cl}</div>
        <div style="font-size:.72rem;color:var(--muted)">${label} · ${c.producto||c.tipo||'Crédito Simple'} · ${c.cat?'CAT '+c.cat+'%':''}</div>
      </div>
      <span style="font-size:.7rem;font-weight:700;padding:4px 12px;border-radius:12px;background:${c.st==='Activo'?'var(--green-bg)':c.st==='Vencido'?'var(--red-bg)':'var(--yellow-bg)'};color:${c.st==='Activo'?'var(--green)':c.st==='Vencido'?'var(--red)':'var(--yellow)'}">${c.st}</span>
    </div>

    <!-- KPIs del crédito -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Monto Original</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:${col}">${fmtFull(c.monto)}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Pago Fijo</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${credPagoFijo(c)?fmtFull(credPagoFijo(c)):'—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total a Pagar</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--blue)">${pagoTotal?fmtFull(pagoTotal):'—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
        <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total Intereses</div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--purple)">${fmtFull(intTot)}</div>
      </div>
    </div>

    <!-- Datos del crédito -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Plazo</div>
        <div style="font-weight:600">${c.plazo} periodos (${c.vencimiento||'Años'})</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Tasa Anual</div>
        <div style="font-weight:600">${c.tasa}% · IVA ${c.iva||16}%</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Comisión apertura</div>
        <div style="font-weight:600">${c.com||0}% → ${fmtFull(credComApertura(c))}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
        <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">CAT</div>
        <div style="font-weight:600">${c.cat||c.tasa}%</div>
      </div>
      ${c.disbDate ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha desembolso</div><div style="font-weight:600">'+c.disbDate+'</div></div>' : ''}
      ${c.fechaElab ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha elaboración</div><div style="font-weight:600">'+c.fechaElab+'</div></div>' : ''}
    </div>
    ${amortTable}
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
      <button id="cred-del-btn" data-ent="${entKey}" data-idx="${resolvedIdx}"
        style="background:var(--red-bg);color:var(--red);border:1px solid var(--red-lt);border-radius:var(--r);padding:7px 16px;cursor:pointer;font-size:.78rem;font-weight:600"
        onmouseover="this.style.background='var(--red)';this.style.color='#fff'"
        onmouseout="this.style.background='var(--red-bg)';this.style.color='var(--red)'">
        🗑 Eliminar crédito
      </button>
    </div>`;

  openModal(null, `🏦 Detalle — ${c.cl}`, html);
}

function credClearAll(entKey){
  const label = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
  customConfirm('¿Limpiar toda la cartera de '+label+'? Esta acción no se puede deshacer.', 'Limpiar', (ok)=>{
    if(!ok) return;
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    credits.length = 0;
    localStorage.removeItem('vmcr_cred_'+entKey);
    localStorage.removeItem('vmcr_cc_hist');
    entKey==='end' ? rEndCred() : rDynCred();
    fiInjectCredits(); syncFlujoToRecs();
    toast('🗑 Cartera de '+label+' limpiada');
  });
}

function credDelete(entKey, idx){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  const name = (credits[idx] && credits[idx].cl) ? credits[idx].cl : 'este crédito';
  customConfirm('¿Eliminar "' + name + '"?', 'Eliminar', (ok)=>{
    if(!ok) return;
    credits.splice(idx, 1);
    localStorage.setItem('vmcr_cred_' + entKey, JSON.stringify(credits));
    closeModal();
    if(entKey==='end') rEndCred(); else rDynCred();
    toast('🗑 ' + name + ' eliminado');
  });
}

function credAddRow(entKey){
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  credits.push({cl:'Nuevo Crédito',monto:0,plazo:12,tasa:0,com:0,tipo:'Simple',garantia:'',destino:'',st:'Prospecto',disbDate:'',amort:[]});
  entKey==='end' ? rEndCred() : rDynCred();
}

function credDelRow(entKey, ci){
  if(false) return; // confirm handled via customConfirm elsewhere
  const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
  credits.splice(ci,1);
  entKey==='end' ? rEndCred() : rDynCred();
  fiInjectCredits(); rPL(entKey); rPLCharts(entKey);
}

function rEndCred(){
  try{const s=JSON.parse(localStorage.getItem('vmcr_cred_end'));if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  credRenderDashKPIs(END_CREDITS,'end');
  credRenderList(END_CREDITS,'end');
}
function rDynCred(){
  try{const s=JSON.parse(localStorage.getItem('vmcr_cred_dyn'));if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}
  credRenderDashKPIs(DYN_CREDITS,'dyn');
  credRenderList(DYN_CREDITS,'dyn');
  syncDynResKPIs();
}

// RENDER: WIREBIT INGRESOS
// ═══════════════════════════════════════
function rWBIng(){
  const colors=['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'];
  dc('cwbi2');
  CH['cwbi2']=new Chart(document.getElementById('c-wb-ing2'),{type:'bar',data:{labels:MO,
    datasets:Object.entries(WB_ING).map(([k,v],i)=>({label:k,data:v,backgroundColor:colors[i]+'33',borderColor:colors[i],borderWidth:1.5}))
  },options:cOpts({scales:{x:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+Math.abs(v/1000).toFixed(0)+'K'}}}})});

  const annual=Object.entries(WB_ING).map(([k,v])=>[k,sum(v)]);
  dc('cwbm');
  CH['cwbm']=new Chart(document.getElementById('c-wb-mix'),{type:'doughnut',data:{
    labels:annual.map(x=>x[0]),
    datasets:[{data:annual.map(x=>x[1]),backgroundColor:colors.map(c=>c+'33'),borderColor:colors,borderWidth:2}]
  },options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:10}}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${(ctx.raw/sum(WB_ING_TOTAL)*100).toFixed(1)}%)`}}},cutout:'65%',scales:{x:{display:false},y:{display:false}}}});

  const thead=document.getElementById('wb-ing-thead');
  const tbody=document.getElementById('wb-ing-tbody');
  thead.innerHTML=`<th>Fuente de Ingreso</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total 2026</th>`;

  const rows=[
    ...Object.entries(WB_ING).map(([k,v])=>({l:k,vals:v,t:'ing'})),
    {l:'TOTAL INGRESOS',vals:WB_ING_TOTAL,t:'total',bold:true},
    {l:'— COSTOS DIRECTOS —',hdr:true},
    ...Object.entries(WB_COSTOS).map(([k,v])=>({l:k,vals:v,t:'gasto'})),
    {l:'TOTAL COSTOS DIRECTOS',vals:WB_COSTO_TOTAL,t:'total',bold:true},
    {l:'MARGEN BRUTO',vals:WB_MARGEN,t:'util',bold:true},
    {l:'Nómina',vals:WB_NOM_TOTAL,t:'gasto'},
    {l:'RESULTADO OPERATIVO',vals:WB_MARGEN.map((v,i)=>v-WB_NOM_TOTAL[i]),t:'util',bold:true},
  ];
  tbody.innerHTML=rows.map(r=>{
    if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
    const tot=sum(r.vals);
    const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
    return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map(v=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'—'}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}</td></tr>`;
  }).join('');
}

// ═══════════════════════════════════════

// FILE UPLOAD
// ═══════════════════════════════════════
// FILE UPLOAD

function loadFile(ev){
  const f=ev.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      S.excelData={};
      wb.SheetNames.forEach(n=>{ S.excelData[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''}); });
      const lu=document.getElementById('lu');
      lu.style.display='inline';
      lu.innerHTML=`✅ <b>${f.name}</b>`;
      toast('✅ Excel cargado: '+f.name+' ('+wb.SheetNames.length+' hojas)');
      render(document.querySelector('.view.active').id.replace('view-',''));
    }catch(err){toast('❌ '+err.message);}
  };
  r.readAsArrayBuffer(f); ev.target.value='';
}


// ── Sidebar & Menu system ──
let _activeMenu = 'finanzas'; // current open menu
let _subOpen = true;          // submenu panel visible

function openMenu(menuId, el){
  // Si picamos el mismo menú que ya está abierto → cerrar
  if(_activeMenu === menuId && _subOpen){
    closeSubMenu();
    return;
  }

  // Activar item del menú principal
  document.querySelectorAll('.mi').forEach(m => m.classList.remove('active'));
  el.classList.add('active');

  // Mostrar sub-panel correcto
  document.querySelectorAll('.sub-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('sub-' + menuId);
  if(panel) panel.style.display = 'block';

  _activeMenu = menuId;

  // Abrir submenú si estaba cerrado
  _subOpen = true;
  document.getElementById('sb-sub').classList.add('open');
  document.getElementById('main').classList.add('sub-open');
  document.getElementById('main').classList.remove('sub-closed');
  updateToggleBtn();
  setTimeout(resizeCharts, 240);
}

function closeSubMenu(){
  _subOpen = false;
  document.getElementById('sb-sub').classList.remove('open');
  document.getElementById('main').classList.remove('sub-open');
  document.getElementById('main').classList.add('sub-closed');
  document.querySelectorAll('.mi').forEach(m => m.classList.remove('active'));
  updateToggleBtn();
  setTimeout(resizeCharts, 240);
}

function toggleSidebar(){
  const shell = document.getElementById('sb-shell');
  const main  = document.getElementById('main');
  const btn   = document.getElementById('sb-toggle');
  const collapsed = shell.classList.toggle('collapsed');
  if(collapsed){
    main.classList.remove('sub-open');
    main.classList.add('sb-hidden');
  } else {
    main.classList.remove('sb-hidden');
    if(_subOpen) main.classList.add('sub-open');
  }
  updateToggleBtn();
  setTimeout(resizeCharts, 240);
}

function updateToggleBtn(){
  const btn     = document.getElementById('sb-toggle');
  const shell   = document.getElementById('sb-shell');
  const collapsed = shell.classList.contains('collapsed');
  if(collapsed){
    btn.style.left = '8px';
    btn.textContent = '›';
    btn.title = 'Mostrar menú';
  } else if(_subOpen){
    btn.style.left = '422px';  // 200 menu + 214 sub + 8 gap
    btn.textContent = '‹';
    btn.title = 'Ocultar menú';
  } else {
    btn.style.left = '208px';  // 200 menu + 8 gap
    btn.textContent = '‹';
    btn.title = 'Ocultar menú';
  }
}

function resizeCharts(){
  Object.values(CH).forEach(c=>{ try{c.resize();}catch(e){} });
}

// ═══════════════════════════════════════

// CARGA DE CRÉDITOS DESDE PDF
// ═══════════════════════════════════════
let CC_PREVIEW = [];   // créditos extraídos pendientes de importar
let CC_HISTORY = [];   // historial de cargas

function ccLoad(){
  try{ CC_HISTORY = JSON.parse(localStorage.getItem('vmcr_cc_hist')||'[]'); }catch(e){ CC_HISTORY=[]; }
}

function rCargaCreditos(){
  ccLoad();
  ccRenderHistory();
}

function ccHandleDrop(e){
  e.preventDefault();
  const dz = document.getElementById('cc-dropzone');
  dz.style.borderColor = 'var(--border2)';
  dz.style.background  = 'var(--bg)';
  const file = e.dataTransfer.files[0];
  if(file && file.type === 'application/pdf') ccLoadFile(file);
  else toast('⚠️ Solo se aceptan archivos PDF');
}

function ccLoadFile(file){
  if(!file) return;
  ccSetStatus('loading', `📖 Leyendo "${file.name}"…`);
  document.getElementById('cc-preview-wrap').style.display = 'none';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    ccSetStatus('loading', '🤖 Analizando tabla de créditos con IA…');
    try {
      await ccAnalyzeWithClaude(base64, file.name);
    } catch(err) {
      ccSetStatus('error', '❌ Error al procesar: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

async function ccAnalyzeWithClaude(base64pdf, filename){
  const empresa = document.getElementById('cc-empresa').value;
  ccSetStatus('loading', '📖 Extrayendo texto del PDF…');

  // Extract text using PDF.js
  const pdfData = atob(base64pdf);
  const pdfBytes = new Uint8Array(pdfData.length);
  for(let i=0;i<pdfData.length;i++) pdfBytes[i]=pdfData.charCodeAt(i);

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdfDoc = await pdfjsLib.getDocument({data: pdfBytes}).promise;
  let fullText = '';
  for(let p=1; p<=pdfDoc.numPages; p++){
    const page = await pdfDoc.getPage(p);
    const tc   = await page.getTextContent();
    fullText += tc.items.map(i=>i.str).join(' ') + '\n';
  }

  ccSetStatus('loading', '🔍 Analizando tabla de amortización…');

  const credito = ccParseCentumPDF(fullText, filename);
  if(!credito) throw new Error('No se pudo leer la tabla. Verifica que sea un PDF de Centum Capital en formato estándar.');

  CC_PREVIEW = [credito];
  ccSetStatus('ok', `✅ Crédito de <strong>${credito.cl}</strong> extraído de "${filename}"`);
  try { ccRenderPreview(empresa, null); } catch(e){ console.error('Preview error:',e); }
}

function ccParseCentumPDF(text, filename){
  const t = text.replace(/\s+/g,' ');
  const get = (re) => { const m=t.match(re); return m?m[1].trim():null; };

  const nombre   = get(/Solicitante\s*:\s*([A-Za-záéíóúÁÉÍÓÚüÜñÑ ]+?)(?:\s{2,}|Crédito|$)/i);
  const monto    = get(/Crédito solicitado[^$]*\$\s*([\d,]+\.?\d*)/i);
  const pagoFijoM = t.match(/Pago fijo[\s\S]*?\$[\s\d,.]+?\$\s*([\d,]+\.?\d*)/i);
  const pagoFijo = pagoFijoM ? pagoFijoM[1] : null;
  const producto = get(/Producto financiero\s*:\s*([^\n]+?)(?:\s{2,}|Vencimiento)/i);
  const venc     = get(/Vencimiento:\s*([^\s]+(?:\s+[^\s]+)??)(?=\s{2,}|\s*Plazo)/i);
  const plazo    = get(/Plazo:\s*(\d+)/i);
  const tasa     = get(/Tasa:\s*([\d.]+)\s*%/i);
  const iva      = get(/IVA\s*:\s*([\d.]+)\s*%/i);
  const com      = get(/Comisión\s*:\s*([\d.]+)\s*%/i);
  const cat      = get(/CAT\s*:\s*([\d.]+)\s*%/i);
  const fechaElab= get(/Fecha de elaboración:\s*([^\n]+?)(?:\s{2,}|Solicitante)/i);

  const parseMXN = s => s ? parseFloat(s.replace(/,/g,'')) : 0;

  // Split into rows by detecting "N  DD/..." pattern, extract $ amounts per row
  const amort = [];
  const rowSplitRe = /\b(\d{1,3})\s+([\d]{1,2}\/[\d]{2,4}\/?\d{0,4}|[\d]{1,2}\/[A-Za-z]+\/\d{4})([\s\S]*?)(?=\b\d{1,3}\s+[\d]{1,2}\/|Total:|La presente|$)/g;
  let m;
  while((m=rowSplitRe.exec(t))!==null){
    const periodo = parseInt(m[1]);
    if(periodo > 200) continue;
    const rowText = m[3];
    const amounts = [...rowText.matchAll(/\$\s*([\d,]+\.?\d*)/g)].map(a=>parseMXN(a[1]));
    if(amounts.length < 2) continue;
    amort.push({
      periodo,
      fecha:   m[2],
      pago:    amounts[0],             // 1st $ = pago fijo
      capital: amounts[1],             // 2nd $ = abono capital
      int:     amounts[2]||0,          // 3rd $ = intereses
      ivaInt:  amounts[3]||0,          // 4th $ = IVA intereses
      saldo:   amounts[amounts.length-1], // last $ = saldo a capital
    });
  }

  console.log('PDF parsed - nombre:', nombre, 'amort rows:', amort.length, amort);

  if(!nombre || amort.length < 1) return null;

  return {
    cl:         nombre,
    monto:      parseMXN(monto),
    plazo:      parseInt(plazo)||0,
    vencimiento:venc||'Años',
    tasa:       parseFloat(tasa)||0,
    iva:        parseFloat(iva)||16,
    com:        parseFloat(com)||0,
    cat:        parseFloat(cat)||0,
    tipo:       'Simple',
    producto:   producto||'Centum Simple',
    pagoFijo:   parseMXN(pagoFijo),
    st:         'Activo',
    disbDate:   amort.length>0 ? amort[0].fecha : '',
    fechaElab:  fechaElab||'',
    amort,
  };
}

function ccRenderPreview(empresa, notas){
  const wrap   = document.getElementById('cc-preview-wrap');
  const thead  = document.getElementById('cc-preview-thead');
  const tbody  = document.getElementById('cc-preview-tbody');
  const title  = document.getElementById('cc-preview-title');
  const notesEl= document.getElementById('cc-preview-notes');
  const empresaLabel = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';

  title.textContent = `${creditos_count()} créditos extraídos — ${empresaLabel}`;

  thead.innerHTML = '<th>Cliente</th><th class="r">Monto</th><th class="r">Plazo</th><th class="r">Tasa</th><th class="r">Comisión</th><th>Tipo</th><th>Destino</th><th>Status</th><th class="r">Fecha</th>';

  const stColor = {Activo:'var(--green)',Prospecto:'var(--yellow)',Vencido:'var(--red)',Pagado:'var(--purple)'};
  tbody.innerHTML = CC_PREVIEW.map((c,i) => `
    <tr>
      <td style="font-weight:600">${c.cl||'—'}</td>
      <td class="mo pos">${fmtFull(c.monto)}</td>
      <td class="r">${c.plazo} meses</td>
      <td class="r">${c.tasa}%</td>
      <td class="r">${c.com?c.com+'%':'—'}</td>
      <td style="font-size:.75rem">${c.tipo||'Simple'}</td>
      <td style="font-size:.75rem;color:var(--muted)">${c.destino||'—'}</td>
      <td><span style="font-size:.68rem;font-weight:700;color:${stColor[c.st]||'var(--muted)'}">${c.st}</span></td>
      <td class="r" style="font-size:.72rem;color:var(--muted)">${c.disbDate||'—'}</td>
    </tr>`).join('');

  if(notas) notesEl.innerHTML = `<strong>Notas del análisis:</strong> ${notas}`;
  else notesEl.innerHTML = '';

  wrap.style.display = 'block';
  wrap.scrollIntoView({behavior:'smooth'});
}

function creditos_count(){ return CC_PREVIEW.length; }

function ccImport(){
  if(!CC_PREVIEW.length){ toast('⚠️ No hay créditos para importar'); return; }
  const empresa = document.getElementById('cc-empresa').value;

  if(empresa === 'endless'){
    // Merge: keep existing non-auto credits, add new ones (avoid duplicates by cl name)
    const existingNames = END_CREDITS.map(c=>c.cl.toLowerCase());
    const newOnes = CC_PREVIEW.filter(c => !existingNames.includes(c.cl.toLowerCase()));
    const updated = CC_PREVIEW.map(c => {
      const idx = END_CREDITS.findIndex(x=>x.cl.toLowerCase()===c.cl.toLowerCase());
      return idx>=0 ? {...END_CREDITS[idx], ...c} : c;
    });
    // Add any existing ones not in the new list
    END_CREDITS.forEach(c => {
      if(!updated.find(x=>x.cl.toLowerCase()===c.cl.toLowerCase())) updated.push(c);
    });
    END_CREDITS.length = 0;
    updated.forEach(c => END_CREDITS.push(c));
    localStorage.setItem('vmcr_cred_end', JSON.stringify(END_CREDITS));
  } else {
    const updated = CC_PREVIEW.map(c => {
      const idx = DYN_CREDITS.findIndex(x=>x.cl.toLowerCase()===c.cl.toLowerCase());
      return idx>=0 ? {...DYN_CREDITS[idx], ...c} : c;
    });
    DYN_CREDITS.forEach(c => {
      if(!updated.find(x=>x.cl.toLowerCase()===c.cl.toLowerCase())) updated.push(c);
    });
    DYN_CREDITS.length = 0;
    updated.forEach(c => DYN_CREDITS.push(c));
    localStorage.setItem('vmcr_cred_dyn', JSON.stringify(DYN_CREDITS));
  }

  // Log to history
  ccLoad();
  CC_HISTORY.unshift({
    date: new Date().toLocaleString('es-MX'),
    empresa: empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance',
    count: CC_PREVIEW.length,
    names: CC_PREVIEW.map(c=>c.cl).join(', ')
  });
  localStorage.setItem('vmcr_cc_hist', JSON.stringify(CC_HISTORY.slice(0,20)));

  // Sync flows
  fiInjectCredits();
  syncFlujoToRecs();

  const n = CC_PREVIEW.length;
  const label = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';
  CC_PREVIEW = [];
  ccClearPreview();
  ccRenderHistory();
  toast(`✅ ${n} crédito${n!==1?'s':''} importado${n!==1?'s':''} a ${label}`);

}

function ccClearPreview(){
  CC_PREVIEW = [];
  document.getElementById('cc-preview-wrap').style.display = 'none';
  document.getElementById('cc-status').style.display = 'none';
  document.getElementById('cc-file-input').value = '';
}

function ccSetStatus(type, html){
  const el = document.getElementById('cc-status');
  const colors = {
    loading: {bg:'var(--blue-bg)',  border:'var(--blue-lt)',  color:'var(--blue)'},
    ok:      {bg:'var(--green-bg)', border:'var(--green-lt)', color:'var(--green)'},
    error:   {bg:'var(--red-bg)',   border:'var(--red-lt)',   color:'var(--red)'},
  };
  const c = colors[type] || colors.loading;
  el.style.cssText = `display:block;padding:10px 14px;border-radius:var(--r);background:${c.bg};border:1px solid ${c.border};color:${c.color};font-size:.8rem`;
  el.innerHTML = html;
}

function ccRenderHistory(){
  ccLoad();
  const el = document.getElementById('cc-history');
  if(!el) return;
  if(!CC_HISTORY.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:.78rem">Sin cargas registradas</div>';
    return;
  }
  el.innerHTML = CC_HISTORY.map((h,i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);font-size:.78rem">
      <span style="color:var(--muted);min-width:140px;flex-shrink:0">${h.date}</span>
      <span style="font-weight:600;color:var(--blue);flex-shrink:0">${h.empresa}</span>
      <span style="color:var(--green);font-weight:600;flex-shrink:0">${h.count} crédito${h.count!==1?'s':''}</span>
      <span style="color:var(--muted);font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${h.names}</span>
    </div>`).join('');
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
  if(q('dyn-kpi-cartera-sub'))q('dyn-kpi-cartera-sub').textContent= DYN_CREDITS.length+' crédito'+(DYN_CREDITS.length!==1?'s':'');
  if(q('dyn-kpi-vencida'))    q('dyn-kpi-vencida').textContent    = fmtK(carteraVencida);
  if(q('dyn-kpi-vencida-sub'))q('dyn-kpi-vencida-sub').textContent= carteraVencida>0 ? pct+'% cartera' : 'Sin vencimientos';
  if(q('dyn-kpi-vencida-bar'))q('dyn-kpi-vencida-bar').style.width= pct+'%';
  if(q('dyn-kpi-pipeline'))   q('dyn-kpi-pipeline').textContent   = fmtK(pipeline);
  if(q('dyn-kpi-pipeline-sub'))q('dyn-kpi-pipeline-sub').textContent= prospectos.length+' prospecto'+(prospectos.length!==1?'s':'');
}

// ── Custom confirm (replaces browser confirm() which is blocked in iframes) ──
function customConfirm(msg, okLabel, callback){
  const overlay = document.getElementById('confirm-overlay');
  const msgEl   = document.getElementById('confirm-msg');
  const okBtn   = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  msgEl.textContent = msg;
  okBtn.textContent = okLabel || 'Eliminar';
  overlay.style.display = 'flex';
  const cleanup = () => { overlay.style.display = 'none'; okBtn.onclick = null; cancelBtn.onclick = null; };
  okBtn.onclick    = () => { cleanup(); callback(true);  };
  cancelBtn.onclick = () => { cleanup(); callback(false); };
}

function ccDeleteHistory(idx){
  ccLoad();
  CC_HISTORY.splice(idx, 1);
  localStorage.setItem('vmcr_cc_hist', JSON.stringify(CC_HISTORY));
  ccRenderHistory();
}


// ═══════════════════════════════════════
// EXPORTAR HTML CON DATOS EMBEBIDOS
// ═══════════════════════════════════════
function exportHTML(){
  // Use stored source (set at load time)
  if(!window._htmlSource){
    toast('⚠️ Fuente no disponible, intenta recargar la página');
    return;
  }
  let html = window._htmlSource;

  function embedMarker(src, key, data){
    const json = JSON.stringify(data);
    const re = new RegExp('/\\*EMBED:' + key + '\\*\\/[\\s\\S]*?/\\*END:' + key + '\\*\\/');
    return src.replace(re, '/*EMBED:' + key + '*/' + json + '/*END:' + key + '*/');
  }

  html = embedMarker(html, 'END_CREDITS', END_CREDITS);
  html = embedMarker(html, 'DYN_CREDITS', DYN_CREDITS);
  html = embedMarker(html, 'FI_ROWS', FI_ROWS.filter(r=>!r.auto));
  html = embedMarker(html, 'FG_ROWS', FG_ROWS);

  // Update the stored source so next export is also up to date
  window._htmlSource = html;

  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'GFVMCR-Dashboard-' + new Date().toISOString().slice(0,10) + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✅ HTML exportado con todos los datos');
}
// ═══════════════════════════════════════
