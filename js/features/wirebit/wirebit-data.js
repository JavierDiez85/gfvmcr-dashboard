// GF — Wirebit Data
(function(window) {
  'use strict';

// ══════════════════════════════════════
// WIREBIT DATA — Analysis views
// Transacciones Cripto + Tarjetas WB
// ══════════════════════════════════════

// ─── Period filter state ───────────────────────────────────────────────────
// Now uses the unified _gfPeriod system from period-filter.js
// _gfPeriod['wb_tar'] and _gfPeriod['wb_cri'] store 'año'|'q1'-'q4'|'mes_0'-'mes_11'
// _year (global) controls the active year for both views

/** Render the unified period filter bar for wb_cripto */
function _wbcRenderBar(){
  gfpRender('wbc-year-bar', { ent:'wb_cri', color:'#9b51e0', viewId:'wb_cripto' });
}

/** Render the unified period filter bar for wb_tarjetas */
function _wbtRenderBar(){
  gfpRender('wbt-periodo-bar', { ent:'wb_tar', color:'#9b51e0', viewId:'wb_tarjetas' });
}

/** Returns {from, to, label, groupBy} for active period of Tarjetas WB.
 *  Reads from _gfPeriod['wb_tar'] and _year. */
function _wbtRange(){
  const y = typeof _year !== 'undefined' ? _year : new Date().getFullYear();
  const p = (typeof _gfPeriod !== 'undefined' ? _gfPeriod['wb_tar'] : null) || 'año';

  if(p.startsWith('mes_')){
    const mi = parseInt(p.split('_')[1]);
    return { from: new Date(y,mi,1).toISOString().slice(0,10),
             to:   new Date(y,mi+1,0).toISOString().slice(0,10),
             label: MO[mi]+' '+y, groupBy:'day' };
  }
  const qMap = { q1:[0,2], q2:[3,5], q3:[6,8], q4:[9,11] };
  if(qMap[p]){
    const [qs,qe] = qMap[p];
    return { from: new Date(y,qs,1).toISOString().slice(0,10),
             to:   new Date(y,qe+1,0).toISOString().slice(0,10),
             label: p.toUpperCase()+' '+y, groupBy:'month' };
  }
  // 'año' (default)
  return { from:y+'-01-01', to:y+'-12-31', label:'Año '+y, groupBy:'month' };
}

/** Returns month indices [0..11] for the active wb_cri period */
function _wbcPeriodIdxs(){
  return _periodIdxs('wb_cri');
}

/** Merge cripto fees data for the active year and period filter.
 *  Uses _year (global) and _gfPeriod['wb_cri'] to filter months. */
function _mergeWBCripto(){
  const y = String(typeof _year !== 'undefined' ? _year : new Date().getFullYear());
  const monthIdxs = _wbcPeriodIdxs(); // e.g. [0..11] for 'año', [0,1,2] for 'q1', [5] for 'mes_5'

  const mergedConcepto = {}; // { concepto: { 'YYYY-MM': value } }
  const mergedClients  = {}; // { client: {total_usd, total_mxn, txn_count} }
  let totalUSD = 0, totalMXN = 0, txnCount = 0, updated = null;

  const d = DB.get('gf_wb_fees_'+y);
  if(!d) return null;

  // We need the full-year totals for client table proportions, but only show filtered data
  if(!updated || (d.updated && d.updated > updated)) updated = d.updated;

  // monthly by concepto: array of 12 values indexed by month (0-based)
  // Only include months in the active period
  for(const [concepto, vals] of Object.entries(d.monthly || {})){
    if(!mergedConcepto[concepto]) mergedConcepto[concepto] = {};
    (vals||[]).forEach((v,i)=>{
      if(monthIdxs.indexOf(i) === -1) return; // skip months outside filter
      const ym = y+'-'+String(i+1).padStart(2,'0');
      mergedConcepto[concepto][ym] = (mergedConcepto[concepto][ym]||0)+v;
    });
  }

  // Sum filtered totals
  Object.values(mergedConcepto).forEach(byPeriod=>{
    Object.values(byPeriod).forEach(v=>{ totalMXN += v; });
  });

  // For USD and txnCount, scale proportionally if we have full-year data
  // (since we only have monthly MXN breakdowns, estimate from ratio)
  const fullYearMXN = (d.total_mxn || 0);
  const ratio = fullYearMXN > 0 ? totalMXN / fullYearMXN : 0;
  totalUSD = Math.round((d.total_usd || 0) * ratio);
  txnCount = Math.round(((d.txn_count || d.txnCount || 0)) * ratio);

  // clients — scale proportionally too
  for(const c of (d.byClient||[])){
    if(!mergedClients[c.client]) mergedClients[c.client]={total_usd:0,total_mxn:0,txn_count:0};
    mergedClients[c.client].total_usd  += Math.round((c.total_usd || 0) * ratio);
    mergedClients[c.client].total_mxn  += Math.round((c.total_mxn || 0) * ratio);
    mergedClients[c.client].txn_count  += Math.round((c.txn_count || 0) * ratio);
  }

  if(!totalUSD && !totalMXN) return null;

  // Build sorted monthly summary
  const allPeriods = new Set();
  Object.values(mergedConcepto).forEach(m=>Object.keys(m).forEach(p=>allPeriods.add(p)));
  const periods = [...allPeriods].sort();
  const monthlySummary = periods.map(ym=>({
    period: ym,
    mxn: Object.values(mergedConcepto).reduce((s,m)=>s+(m[ym]||0),0),
    txnCount: 0
  }));

  const byClient = Object.entries(mergedClients)
    .map(([client,d])=>({client,...d}))
    .sort((a,b)=>b.total_mxn-a.total_mxn);

  return { monthly:mergedConcepto, monthlySummary, byClient, totalUSD, totalMXN, txnCount, updated };
}

// ── 1. Crypto Transaction Analysis (wb_cripto) ──
function rWBCripto(){
  _wbcRenderBar();
  const merged = _mergeWBCripto();

  const kTxns = document.getElementById('wbc-kpi-txns');
  const kUSD  = document.getElementById('wbc-kpi-usd');
  const kMXN  = document.getElementById('wbc-kpi-mxn');
  const kFX   = document.getElementById('wbc-kpi-fx');

  if(!merged){
    kTxns.textContent='—'; kTxns.style.color='var(--muted)';
    document.getElementById('wbc-kpi-txns-sub').textContent='Sin datos cargados';
    kUSD.textContent='—'; kUSD.style.color='var(--muted)';
    kMXN.textContent='—'; kMXN.style.color='var(--muted)';
    kFX.textContent='—';  kFX.style.color='var(--muted)';
    document.getElementById('wbc-clients-tbody').innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">Sin datos. Sube el Excel de transacciones Wirebit desde Carga de Datos.</td></tr>';
    return;
  }

  const _cPer = (typeof _gfPeriod !== 'undefined' ? _gfPeriod['wb_cri'] : null) || 'año';
  const _cY = typeof _year !== 'undefined' ? _year : new Date().getFullYear();
  let yearLabel = String(_cY);
  if(_cPer.startsWith('q')) yearLabel = _cPer.toUpperCase()+' '+_cY;
  else if(_cPer.startsWith('mes_')){ const _mi = parseInt(_cPer.split('_')[1]); yearLabel = MO[_mi]+' '+_cY; }

  // ── KPIs ──
  kTxns.textContent = (merged.txnCount||0).toLocaleString();
  kTxns.style.color = '#0073ea';
  document.getElementById('wbc-kpi-txns-sub').textContent = 'Fees válidos · '+yearLabel;

  kUSD.textContent = '$'+Math.round(merged.totalUSD).toLocaleString()+' USD';
  kUSD.style.color = 'var(--green)';
  document.getElementById('wbc-kpi-usd-sub').textContent = 'Fees acumulados '+yearLabel;

  kMXN.textContent = '$'+Math.round(merged.totalMXN).toLocaleString()+' MXN';
  kMXN.style.color = 'var(--purple)';
  document.getElementById('wbc-kpi-mxn-sub').textContent = 'Conversión diaria USD→MXN';

  const avgFX = merged.totalMXN / (merged.totalUSD || 1);
  kFX.textContent = '$'+avgFX.toFixed(2);
  kFX.style.color = 'var(--orange)';
  document.getElementById('wbc-kpi-fx-sub').textContent = 'USD/MXN prom. ponderado';

  // ── Update title ──
  const titleEl = document.getElementById('wbc-title');
  if(titleEl) titleEl.textContent = 'Wirebit — Transacciones Cripto '+yearLabel;

  // Actualizar títulos de gráficas según periodo
  var _wbcCT = document.getElementById('wbc-chart-title');
  var _wbcCS = document.getElementById('wbc-chart-sub');
  var _wbcTT = document.getElementById('wbc-type-title');
  var _wbcTS = document.getElementById('wbc-type-sub');
  const _cGroupLabel = _cPer.startsWith('mes_') ? 'Diario' : 'Mensual';
  if(_wbcCT) _wbcCT.textContent = 'Volumen '+_cGroupLabel+' (MXN) — '+yearLabel;
  if(_wbcCS) _wbcCS.textContent = _cPer.startsWith('mes_') ? 'Fees por concepto · '+yearLabel : 'Fees convertidos por mes · '+yearLabel;
  if(_wbcTT) _wbcTT.textContent = 'Por Tipo de Transaccion';
  if(_wbcTS) _wbcTS.textContent = 'Distribucion de fees · '+yearLabel;

  // ── Chart 1: Monthly fees MXN ──
  dc('cwbcm');
  const multiYear = false; // now always single year via _year
  const periods = merged.monthlySummary;
  const chartLabels = periods.map(r=>{
    const [yr,mo] = r.period.split('-');
    return MO[parseInt(mo)-1]+(multiYear?' '+yr.slice(2):'');
  });
  const mxnValues = periods.map(r=>Math.round(r.mxn));

  CH['cwbcm'] = new Chart(document.getElementById('c-wbc-monthly'),{
    type:'bar',
    data:{
      labels: chartLabels,
      datasets:[
        { label:'Fees MXN', data:mxnValues, backgroundColor:'rgba(155,81,224,.25)', borderColor:'#9b51e0', borderWidth:1.5, borderRadius:4 }
      ]
    },
    options:{...cOpts(),
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:ctx=>' $'+Math.round(ctx.raw).toLocaleString()+' MXN'}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10}}},
        y:{grid:{color:'rgba(228,232,244,.5)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+Math.abs(Math.round(v/1000))+'K'}}
      }
    }
  });

  // ── Chart 2: By concepto doughnut ──
  dc('cwbct');
  const conceptoTotals = Object.entries(merged.monthly)
    .map(([concepto,byPeriod])=>({label:concepto, total:Object.values(byPeriod).reduce((s,v)=>s+v,0)}))
    .filter(x=>x.total>0)
    .sort((a,b)=>b.total-a.total);

  const dColors = ['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'];
  CH['cwbct'] = new Chart(document.getElementById('c-wbc-types'),{
    type:'doughnut',
    data:{
      labels: conceptoTotals.map(x=>x.label),
      datasets:[{
        data: conceptoTotals.map(x=>x.total),
        backgroundColor: dColors.map(c=>c+'33'),
        borderColor: dColors,
        borderWidth:2
      }]
    },
    options:{...cOpts(), cutout:'60%',
      plugins:{
        legend:{position:'bottom',labels:{color:'#8b8fb5',font:{size:9},boxWidth:8,padding:6}},
        tooltip:{callbacks:{label:ctx=>{
          const tot=ctx.dataset.data.reduce((a,b)=>a+b,0);
          return ' '+fmtK(ctx.raw)+' ('+(ctx.raw/tot*100).toFixed(1)+'%)';
        }}}
      },
      scales:{x:{display:false},y:{display:false}}
    }
  });

  // ── Client table ──
  const tbody = document.getElementById('wbc-clients-tbody');
  const clients = merged.byClient;
  if(clients && clients.length>0){
    const totMXN = clients.reduce((s,c)=>s+c.total_mxn,0);
    const totUSD = clients.reduce((s,c)=>s+c.total_usd,0);
    const totTxn = clients.reduce((s,c)=>s+c.txn_count,0);
    tbody.innerHTML = clients.map((c,i)=>{
      const pct = ((c.total_mxn/totMXN)*100).toFixed(1);
      return `<tr>
        <td style="font-weight:600;color:var(--muted)">${i+1}</td>
        <td style="font-weight:600">${c.client||'Sin nombre'}</td>
        <td class="r">${c.txn_count.toLocaleString()}</td>
        <td class="r">$${c.total_usd.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td class="r" style="font-weight:600">$${Math.round(c.total_mxn).toLocaleString()}</td>
        <td class="r">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
            <div style="width:50px;height:6px;border-radius:3px;background:var(--border);overflow:hidden"><div style="height:100%;width:${Math.min(parseFloat(pct),100)}%;background:#9b51e0;border-radius:3px"></div></div>
            ${pct}%
          </div>
        </td>
      </tr>`;
    }).join('');
    tbody.innerHTML += `<tr class="bld" style="border-top:2px solid var(--border)">
      <td colspan="2" style="font-weight:700">TOTAL</td>
      <td class="r" style="font-weight:700">${totTxn.toLocaleString()}</td>
      <td class="r" style="font-weight:700">$${totUSD.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td class="r" style="font-weight:700;color:var(--purple)">$${Math.round(totMXN).toLocaleString()}</td>
      <td class="r" style="font-weight:700">100%</td>
    </tr>`;
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">Sin datos de clientes para '+yearLabel+'</td></tr>';
  }
}


// ── Helper: merge tarjetas data from all year keys ──
function _getWBTarData(){
  const years = ['2025','2026'];
  const allTxns = [];
  let totalMonto = 0, updated = null, filename = null;
  const allMonthly = {};
  for(const y of years){
    const d = DB.get('gf_wb_tarjetas_'+y);
    if(!d || !d.transactions) continue;
    allTxns.push(...d.transactions);
    totalMonto += d.totalMonto || 0;
    if(!updated || d.updated > updated){ updated = d.updated; filename = d.filename; }
    (d.monthlySummary||[]).forEach(r=>{
      if(!allMonthly[r.period]) allMonthly[r.period] = {monto:0, txnCount:0};
      allMonthly[r.period].monto += r.monto;
      allMonthly[r.period].txnCount += r.txnCount;
    });
  }
  if(!allTxns.length) return null;
  const monthlySummary = Object.entries(allMonthly)
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([period,d])=>({period,...d}));
  return { transactions: allTxns, totalMonto, monthlySummary, updated, filename, txnCount: allTxns.length };
}

// ── 2. Wirebit Tarjetas Dashboard (wb_tarjetas) ──
function rWBTarjetas(){
  _wbtRenderBar();
  const data     = _getWBTarData();
  const emptyDiv   = document.getElementById('wbt-empty');
  const contentDiv = document.getElementById('wbt-content');

  if(!data || !data.transactions || data.transactions.length===0){
    if(emptyDiv)   emptyDiv.style.display = '';
    if(contentDiv) contentDiv.style.display = 'none';
    return;
  }
  if(emptyDiv)   emptyDiv.style.display = 'none';
  if(contentDiv) contentDiv.style.display = 'block';

  // ── Apply period filter ──
  const range  = _wbtRange();
  const txns   = data.transactions.filter(t => t.date >= range.from && t.date <= range.to);
  const totalMonto = txns.reduce((s,t)=>s+(t.monto||0),0);

  // Update period label
  const lblEl = document.getElementById('wbt-period-label');
  if(lblEl) lblEl.textContent = range.label;

  // ── KPIs ──
  const kTxns = document.getElementById('wbt-kpi-txns');
  kTxns.textContent = txns.length.toLocaleString();
  kTxns.style.color = '#0073ea';
  document.getElementById('wbt-kpi-txns-sub').textContent = range.label;

  const kMonto = document.getElementById('wbt-kpi-monto');
  kMonto.textContent = '$'+Math.round(totalMonto).toLocaleString();
  kMonto.style.color = 'var(--green)';
  document.getElementById('wbt-kpi-monto-sub').textContent = 'Volumen operado';

  const kAvg = document.getElementById('wbt-kpi-avg');
  kAvg.textContent = txns.length ? '$'+Math.round(totalMonto/txns.length).toLocaleString() : '—';
  kAvg.style.color = 'var(--purple)';
  document.getElementById('wbt-kpi-avg-sub').textContent = 'Ticket promedio';

  const clients = [...new Set(txns.map(t=>t.cliente).filter(Boolean))];
  const kClients = document.getElementById('wbt-kpi-clients');
  kClients.textContent = clients.length;
  kClients.style.color = 'var(--orange)';
  document.getElementById('wbt-kpi-clients-sub').textContent = 'Clientes únicos';

  if(!txns.length){
    dc('cwbtm'); dc('cwbtt');
    const tbody = document.getElementById('wbt-clients-tbody');
    if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">Sin transacciones en ${range.label}</td></tr>`;
    return;
  }

  // ── Chart 1: Volumen por período ──
  dc('cwbtm');
  // Actualizar título y subtítulo del chart según periodo
  var _cht = document.getElementById('wbt-chart-title');
  var _chs = document.getElementById('wbt-chart-sub');
  var _tyt = document.getElementById('wbt-type-title');
  var _tys = document.getElementById('wbt-type-sub');
  if(_cht) _cht.textContent = range.groupBy === 'day' ? 'Volumen Diario — Tarjetas WB' : 'Volumen Mensual — Tarjetas WB';
  if(_chs) _chs.textContent = range.groupBy === 'day' ? 'Monto operado por dia · '+range.label : 'Monto operado por mes';
  if(_tyt) _tyt.textContent = 'Por Tipo de Transaccion';
  if(_tys) _tys.textContent = 'Distribucion · '+range.label;

  const byPeriod = {};
  txns.forEach(t=>{
    const key = range.groupBy === 'day' ? t.date : t.date.slice(0,7);
    if(!byPeriod[key]) byPeriod[key] = {monto:0, count:0};
    byPeriod[key].monto += (t.monto||0);
    byPeriod[key].count++;
  });
  const periods = Object.keys(byPeriod).sort();
  const multiYear = periods.some(p=>p.startsWith('2025')) && periods.some(p=>p.startsWith('2026'));
  const chartLabels = periods.map(p=>{
    if(range.groupBy === 'day'){
      const d = parseInt(p.slice(8));
      return d; // día como número (1, 2, 3...)
    }
    const [yr,mo] = p.split('-');
    return MO[parseInt(mo)-1]+(multiYear?' '+yr.slice(2):'');
  });

  CH['cwbtm'] = new Chart(document.getElementById('c-wbt-monthly'),{
    type:'bar',
    data:{
      labels: chartLabels,
      datasets:[
        { label:'Monto', data:periods.map(p=>Math.round(byPeriod[p].monto)), backgroundColor:'rgba(155,81,224,.25)', borderColor:'#9b51e0', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
        { label:'Transacciones', data:periods.map(p=>byPeriod[p].count), type:'line', borderColor:'#0073ea', borderWidth:2, pointRadius:3, yAxisID:'y1', tension:.3 }
      ]
    },
    options:{...cOpts(),
      plugins:{legend:{display:true,position:'top',labels:{color:'#8b8fb5',font:{size:10},boxWidth:8,padding:8}},
        tooltip:{callbacks:{label:ctx=>ctx.datasetIndex===0?' $'+Math.round(ctx.raw).toLocaleString():' '+ctx.raw+' txns'}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10},maxRotation:0}},
        y:{position:'left',grid:{color:'rgba(228,232,244,.5)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+Math.abs(Math.round(v)).toLocaleString('es-MX')}},
        y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#0073ea',font:{size:9}}}
      }
    }
  });

  // ── Chart 2: Por tipo ──
  dc('cwbtt');
  const byType = {};
  txns.forEach(t=>{ const k=t.tipo||'Otro'; byType[k]=(byType[k]||0)+(t.monto||0); });
  const types   = Object.entries(byType).sort((a,b)=>b[1]-a[1]);
  const tColors = ['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000','#e91e63'];
  CH['cwbtt'] = new Chart(document.getElementById('c-wbt-types'),{
    type:'doughnut',
    data:{
      labels: types.map(x=>x[0]),
      datasets:[{ data:types.map(x=>x[1]), backgroundColor:tColors.map(c=>c+'33'), borderColor:tColors, borderWidth:2 }]
    },
    options:{...cOpts(), cutout:'60%',
      plugins:{legend:{position:'bottom',labels:{color:'#8b8fb5',font:{size:9},boxWidth:8,padding:6}},
        tooltip:{callbacks:{label:ctx=>{
          const tot=ctx.dataset.data.reduce((a,b)=>a+b,0);
          return ' $'+Math.round(ctx.raw).toLocaleString()+' ('+(ctx.raw/tot*100).toFixed(1)+'%)';
        }}}},
      scales:{x:{display:false},y:{display:false}}
    }
  });

  // ── Tabla clientes ──
  const byClient = {};
  txns.forEach(t=>{
    const k = t.cliente||'Sin nombre';
    if(!byClient[k]) byClient[k]={monto:0,count:0};
    byClient[k].monto+=(t.monto||0);
    byClient[k].count++;
  });
  const clientList = Object.entries(byClient).sort((a,b)=>b[1].monto-a[1].monto);
  const tbody = document.getElementById('wbt-clients-tbody');
  tbody.innerHTML = clientList.map(([cl,d],i)=>{
    const pct = totalMonto ? ((d.monto/totalMonto)*100).toFixed(1) : '0.0';
    const avg = d.count ? Math.round(d.monto/d.count) : 0;
    return `<tr>
      <td style="font-weight:600;color:var(--muted)">${i+1}</td>
      <td style="font-weight:600">${cl}</td>
      <td class="r">${d.count.toLocaleString()}</td>
      <td class="r" style="font-weight:600">$${Math.round(d.monto).toLocaleString()}</td>
      <td class="r">$${avg.toLocaleString()}</td>
      <td class="r">${pct}%</td>
    </tr>`;
  }).join('');
  if(clientList.length){
    tbody.innerHTML += `<tr class="bld" style="border-top:2px solid var(--border)">
      <td colspan="2" style="font-weight:700">TOTAL</td>
      <td class="r" style="font-weight:700">${txns.length.toLocaleString()}</td>
      <td class="r" style="font-weight:700;color:var(--green)">$${Math.round(totalMonto).toLocaleString()}</td>
      <td class="r" style="font-weight:700">$${(txns.length?Math.round(totalMonto/txns.length):0).toLocaleString()}</td>
      <td class="r" style="font-weight:700">100%</td>
    </tr>`;
  }
}


// ── 3. Wirebit Tarjetas Upload (wb_tar_upload) ──
function rWBTarUpload(){
  const data = _getWBTarData();
  const kTxns  = document.getElementById('wbtu-kpi-txns');
  const kMonto = document.getElementById('wbtu-kpi-monto');
  const kLast  = document.getElementById('wbtu-kpi-last');

  if(data && data.transactions && data.transactions.length>0){
    kTxns.textContent = data.transactions.length.toLocaleString();
    kTxns.style.color = '#0073ea';
    document.getElementById('wbtu-kpi-txns-sub').textContent = data.transactions.length+' transacciones cargadas';

    kMonto.textContent = '$'+Math.round(data.totalMonto).toLocaleString();
    kMonto.style.color = 'var(--green)';
    document.getElementById('wbtu-kpi-monto-sub').textContent = 'Volumen total operado';

    kLast.textContent = new Date(data.updated).toLocaleDateString('es-MX');
    kLast.style.color = 'var(--purple)';
    document.getElementById('wbtu-kpi-last-sub').textContent = data.filename||'Archivo cargado';

    _renderWBTarMonthly(data.monthlySummary||[]);
  } else {
    kTxns.textContent='—'; kTxns.style.color='var(--muted)';
    document.getElementById('wbtu-kpi-txns-sub').textContent='Sin datos cargados';
    kMonto.textContent='—'; kMonto.style.color='var(--muted)';
    document.getElementById('wbtu-kpi-monto-sub').textContent='Sube el Excel de tarjetas';
    kLast.textContent='—'; kLast.style.color='var(--muted)';
    document.getElementById('wbtu-kpi-last-sub').textContent='Sin cargas registradas';
  }
}

function _renderWBTarMonthly(data){
  const tbody = document.getElementById('wbtu-summary-tbody');
  if(!tbody||!data||!data.length){
    if(tbody) tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">Sin datos. Sube el Excel de tarjetas Wirebit.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(row=>{
    const m=parseInt(row.period.split('-')[1])-1;
    const monthName = MO[m]+' '+row.period.split('-')[0];
    const avg = row.txnCount>0 ? Math.round(row.monto/row.txnCount) : 0;
    return `<tr><td>${monthName}</td><td class="r">${row.txnCount.toLocaleString()}</td><td class="r" style="font-weight:600">$${Math.round(row.monto).toLocaleString()}</td><td class="r">$${avg.toLocaleString()}</td></tr>`;
  }).join('');

  const totTxn = data.reduce((s,r)=>s+r.txnCount,0);
  const totMonto = data.reduce((s,r)=>s+r.monto,0);
  const totAvg = totTxn>0 ? Math.round(totMonto/totTxn) : 0;
  tbody.innerHTML += `<tr class="bld" style="border-top:2px solid var(--border)"><td style="font-weight:700">TOTAL</td><td class="r" style="font-weight:700">${totTxn.toLocaleString()}</td><td class="r" style="font-weight:700;color:var(--green)">$${Math.round(totMonto).toLocaleString()}</td><td class="r" style="font-weight:700">$${totAvg.toLocaleString()}</td></tr>`;
}


// ── 4. Card Upload Processing ──
async function startWBTarUpload(){
  const fileInput = document.getElementById('wbtu-file');
  const file = fileInput.files[0];
  if(!file){ toast('⚠️ Selecciona un archivo Excel'); return; }

  const progressDiv = document.getElementById('wbtu-progress');
  const progressBar = document.getElementById('wbtu-bar');
  const progressMsg = document.getElementById('wbtu-msg');
  const resultDiv   = document.getElementById('wbtu-result');

  progressDiv.style.display = 'block';
  resultDiv.style.display   = 'none';

  try {
    progressBar.style.width = '10%';
    progressMsg.textContent = 'Leyendo archivo Excel...';

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, {type:'array', cellDates:true});
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {defval:''});

    if(!rows.length) throw new Error('El archivo no contiene datos');

    progressBar.style.width = '30%';
    progressMsg.textContent = rows.length+' filas encontradas. Procesando...';

    // Auto-detect column names (flexible)
    const sample = rows[0];
    const keys = Object.keys(sample);
    const findCol = (...names) => keys.find(k => names.some(n => k.toLowerCase().includes(n.toLowerCase())));

    const colFecha    = findCol('fecha','date','created','Fecha');
    const colTipo     = findCol('tipo','type','concepto_tipo','Tipo');
    const colMonto    = findCol('monto','amount','total','Monto');
    const colCliente  = findCol('cliente','client','nombre','Cliente');
    const colTarjeta  = findCol('tarjeta','card','numero','Tarjeta');
    const colConcepto = findCol('concepto','description','detalle','Concepto');

    const txns = [];
    for(const row of rows){
      let dateStr;
      const raw = colFecha ? row[colFecha] : '';
      if(raw instanceof Date){
        dateStr = raw.toISOString().slice(0,10);
      } else if(typeof raw==='number'){
        // Excel serial
        const d = new Date((raw-25569)*86400000);
        dateStr = d.toISOString().slice(0,10);
      } else {
        // Handle DD/MM/YYYY format (Spanish dates) before falling back to JS Date parsing
        const ddmmyyyy = typeof raw === 'string' && raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          dateStr = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2,'0')}-${ddmmyyyy[1].padStart(2,'0')}`;
        } else {
          const parsed = new Date(raw);
          dateStr = isNaN(parsed) ? null : parsed.toISOString().slice(0,10);
        }
      }
      if(!dateStr) continue;

      const monto = parseFloat(colMonto ? row[colMonto] : 0);
      if(isNaN(monto)) continue;

      txns.push({
        date: dateStr,
        tipo: colTipo ? (row[colTipo]||'').toString().trim() : '',
        monto,
        cliente: colCliente ? (row[colCliente]||'').toString().trim() : '',
        tarjeta: colTarjeta ? (row[colTarjeta]||'').toString().trim() : '',
        concepto: colConcepto ? (row[colConcepto]||'').toString().trim() : '',
        month: parseInt(dateStr.slice(5,7))-1,
      });
    }

    if(!txns.length) throw new Error('No se encontraron transacciones validas. Verifica que el archivo tenga columnas de fecha y monto.');

    progressBar.style.width = '60%';
    progressMsg.textContent = txns.length+' transacciones validas. Guardando...';

    // Aggregate monthly
    const byMonth = {};
    let totalMonto = 0;
    for(const tx of txns){
      const ym = tx.date.slice(0,7);
      if(!byMonth[ym]) byMonth[ym] = {monto:0, txnCount:0};
      byMonth[ym].monto += tx.monto;
      byMonth[ym].txnCount++;
      totalMonto += tx.monto;
    }

    const monthlySummary = Object.entries(byMonth)
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([period,d])=>({period,...d}));

    // Save per year (merge with existing data for each year)
    const byYear = {};
    for(const tx of txns){
      const y = tx.date.slice(0,4);
      if(!byYear[y]) byYear[y] = [];
      byYear[y].push(tx);
    }
    const yearsProcessed = [];
    for(const [year, yearTxns] of Object.entries(byYear)){
      const key = 'gf_wb_tarjetas_'+year;
      const existing = DB.get(key);
      const merged = existing && existing.transactions ? [...existing.transactions, ...yearTxns] : yearTxns;
      // Recalculate monthly summary for this year
      const yByMonth = {};
      let yTotal = 0;
      for(const tx of merged){
        const ym = tx.date.slice(0,7);
        if(!yByMonth[ym]) yByMonth[ym] = {monto:0, txnCount:0};
        yByMonth[ym].monto += tx.monto;
        yByMonth[ym].txnCount++;
        yTotal += tx.monto;
      }
      const yMonthlySummary = Object.entries(yByMonth)
        .sort(([a],[b])=>a.localeCompare(b))
        .map(([period,d])=>({period,...d}));
      DB.set(key, {
        year, transactions: merged, monthlySummary: yMonthlySummary,
        totalMonto: yTotal, txnCount: merged.length,
        filename: file.name, updated: new Date().toISOString()
      });
      yearsProcessed.push(year);
    }

    progressBar.style.width = '100%';
    progressMsg.textContent = 'Carga completa!';

    resultDiv.style.display    = 'block';
    resultDiv.style.background = 'var(--green-bg)';
    resultDiv.style.color      = 'var(--green)';
    resultDiv.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">✅ Carga exitosa</div>
      <div>• <b>${txns.length.toLocaleString()}</b> transacciones procesadas</div>
      <div>• Monto total: <b>$${Math.round(totalMonto).toLocaleString()}</b></div>
      <div>• Periodos: <b>${monthlySummary.length} meses</b></div>
      <div>• Años: <b>${yearsProcessed.join(', ')}</b></div>
      ${colFecha ? '' : '<div style="color:var(--orange)">⚠️ Columna de fecha no detectada automaticamente</div>'}
    `;

    rWBTarUpload();
    toast('✅ Tarjetas WB: '+txns.length+' transacciones cargadas');
    fileInput.value = '';

  } catch(err){
    resultDiv.style.display    = 'block';
    resultDiv.style.background = 'rgba(235,87,87,.08)';
    resultDiv.style.color      = '#eb5757';
    resultDiv.innerHTML = `<div style="font-weight:600">❌ Error</div><div>${err.message}</div>`;
    console.error('[WB Tar Upload]', err);
    toast('❌ Error: '+err.message);
  }
}

function clearWBTarData(){
  if(!confirm('¿Eliminar TODOS los datos de tarjetas Wirebit? Esta acción no se puede deshacer.')) return;
  ['2025','2026'].forEach(y => DB.set('gf_wb_tarjetas_'+y, null));
  toast('🗑️ Datos de tarjetas WB eliminados');
  rWBTarUpload();
}

  // Expose globals
  window.rWBCripto = rWBCripto;
  window.rWBTarjetas = rWBTarjetas;
  window.rWBTarUpload = rWBTarUpload;
  window._renderWBTarMonthly = _renderWBTarMonthly;
  window.startWBTarUpload = startWBTarUpload;
  window.clearWBTarData = clearWBTarData;
  window._getWBTarData = _getWBTarData;
  window._wbcRenderBar = _wbcRenderBar;
  window._wbtRenderBar = _wbtRenderBar;
  window._mergeWBCripto = _mergeWBCripto;

})(window);
