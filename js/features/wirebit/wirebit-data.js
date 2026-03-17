// GF — Wirebit Data
(function(window) {
  'use strict';

// ══════════════════════════════════════
// WIREBIT DATA — Analysis views
// Transacciones Cripto + Tarjetas WB
// ══════════════════════════════════════

// ── 1. Crypto Transaction Analysis (wb_cripto) ──
function rWBCripto(){
  const feesData = DB.get('gf_wb_fees_2026');
  const summary  = DB.get('gf_wb_upload_summary');

  const kTxns = document.getElementById('wbc-kpi-txns');
  const kUSD  = document.getElementById('wbc-kpi-usd');
  const kMXN  = document.getElementById('wbc-kpi-mxn');
  const kFX   = document.getElementById('wbc-kpi-fx');

  if(!feesData || !summary){
    kTxns.textContent='—'; kTxns.style.color='var(--muted)';
    document.getElementById('wbc-kpi-txns-sub').textContent='Sin datos cargados';
    kUSD.textContent='—'; kUSD.style.color='var(--muted)';
    kMXN.textContent='—'; kMXN.style.color='var(--muted)';
    kFX.textContent='—';  kFX.style.color='var(--muted)';
    document.getElementById('wbc-clients-tbody').innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">Sin datos. Sube el Excel de transacciones Wirebit desde Carga de Datos.</td></tr>';
    return;
  }

  // ── KPIs ──
  kTxns.textContent = (summary.txnCount||0).toLocaleString();
  kTxns.style.color = '#0073ea';
  document.getElementById('wbc-kpi-txns-sub').textContent =
    'Actualizado: '+new Date(summary.updated).toLocaleDateString('es-MX');

  kUSD.textContent = '$'+Math.round(summary.totalUSD).toLocaleString()+' USD';
  kUSD.style.color = 'var(--green)';
  document.getElementById('wbc-kpi-usd-sub').textContent = 'Fees acumulados 2026';

  kMXN.textContent = '$'+Math.round(summary.totalMXN).toLocaleString()+' MXN';
  kMXN.style.color = 'var(--purple)';
  document.getElementById('wbc-kpi-mxn-sub').textContent = 'Conversion diaria USD→MXN';

  const avgFX = summary.totalMXN / summary.totalUSD;
  kFX.textContent = '$'+avgFX.toFixed(2);
  kFX.style.color = 'var(--orange)';
  document.getElementById('wbc-kpi-fx-sub').textContent = 'USD/MXN prom. ponderado';

  // ── Chart 1: Monthly volume bar + transaction count line ──
  dc('cwbcm');
  const monthlyData = summary.monthlySummary || [];
  const labels    = monthlyData.map(r=>{ const m=parseInt(r.period.split('-')[1])-1; return MO[m]; });
  const mxnValues = monthlyData.map(r=>Math.round(r.mxn));
  const txnCounts = monthlyData.map(r=>r.txnCount);

  CH['cwbcm'] = new Chart(document.getElementById('c-wbc-monthly'),{
    type:'bar',
    data:{
      labels,
      datasets:[
        { label:'Fees MXN', data:mxnValues, backgroundColor:'rgba(155,81,224,.25)', borderColor:'#9b51e0', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
        { label:'Transacciones', data:txnCounts, type:'line', borderColor:'#0073ea', backgroundColor:'rgba(0,115,234,.08)', borderWidth:2, pointRadius:3, yAxisID:'y1', tension:.3, fill:true }
      ]
    },
    options:{...cOpts(),
      plugins:{legend:{display:true,position:'top',labels:{color:'#8b8fb5',font:{size:10},boxWidth:8,padding:8}},
        tooltip:{...cOpts().plugins?.tooltip, callbacks:{label:ctx=> ctx.datasetIndex===0 ? ' $'+Math.round(ctx.raw).toLocaleString()+' MXN' : ' '+ctx.raw.toLocaleString()+' txns'}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10}}},
        y:{position:'left',grid:{color:'rgba(228,232,244,.5)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+Math.abs(Math.round(v)).toLocaleString('es-MX')}},
        y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#0073ea',font:{size:9}}}
      }
    }
  });

  // ── Chart 2: By transaction type doughnut ──
  dc('cwbct');
  const conceptoTotals = Object.entries(feesData.monthly)
    .map(([concepto,vals])=>({label:concepto, total:vals.reduce((s,v)=>s+v,0)}))
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
  if(feesData.byClient && feesData.byClient.length>0){
    const totalMXN = feesData.byClient.reduce((s,c)=>s+c.total_mxn,0);
    tbody.innerHTML = feesData.byClient.map((c,i)=>{
      const pct = ((c.total_mxn/totalMXN)*100).toFixed(1);
      return `<tr>
        <td style="font-weight:600;color:var(--muted)">${i+1}</td>
        <td style="font-weight:600">${c.client||'Sin nombre'}</td>
        <td class="r">${c.txn_count.toLocaleString()}</td>
        <td class="r">$${c.total_usd.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td class="r" style="font-weight:600">$${Math.round(c.total_mxn).toLocaleString()}</td>
        <td class="r">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
            <div style="width:50px;height:6px;border-radius:3px;background:var(--border);overflow:hidden"><div style="height:100%;width:${Math.min(pct,100)}%;background:#9b51e0;border-radius:3px"></div></div>
            ${pct}%
          </div>
        </td>
      </tr>`;
    }).join('');

    // Totals row
    const totUSD = feesData.byClient.reduce((s,c)=>s+c.total_usd,0);
    const totTxn = feesData.byClient.reduce((s,c)=>s+c.txn_count,0);
    tbody.innerHTML += `<tr class="bld" style="border-top:2px solid var(--border)">
      <td colspan="2" style="font-weight:700">TOTAL</td>
      <td class="r" style="font-weight:700">${totTxn.toLocaleString()}</td>
      <td class="r" style="font-weight:700">$${totUSD.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td class="r" style="font-weight:700;color:var(--purple)">$${Math.round(totalMXN).toLocaleString()}</td>
      <td class="r" style="font-weight:700">100%</td>
    </tr>`;
  }
}


// ── 2. Wirebit Tarjetas Dashboard (wb_tarjetas) ──
function rWBTarjetas(){
  const data = DB.get('gf_wb_tarjetas_2026');
  const emptyDiv   = document.getElementById('wbt-empty');
  const contentDiv = document.getElementById('wbt-content');

  if(!data || !data.transactions || data.transactions.length===0){
    if(emptyDiv)   emptyDiv.style.display   = '';
    if(contentDiv) contentDiv.style.display  = 'none';
    return;
  }

  // Has data → show content
  if(emptyDiv)   emptyDiv.style.display   = 'none';
  if(contentDiv) contentDiv.style.display  = 'block';

  const txns = data.transactions;
  const totalMonto = txns.reduce((s,t)=>s+(t.monto||0),0);
  const clients = [...new Set(txns.map(t=>t.cliente).filter(Boolean))];

  // KPIs
  const kTxns = document.getElementById('wbt-kpi-txns');
  kTxns.textContent = txns.length.toLocaleString();
  kTxns.style.color = '#0073ea';
  document.getElementById('wbt-kpi-txns-sub').textContent = 'Actualizado: '+new Date(data.updated).toLocaleDateString('es-MX');

  const kMonto = document.getElementById('wbt-kpi-monto');
  kMonto.textContent = '$'+Math.round(totalMonto).toLocaleString();
  kMonto.style.color = 'var(--green)';
  document.getElementById('wbt-kpi-monto-sub').textContent = 'Volumen total operado';

  const kAvg = document.getElementById('wbt-kpi-avg');
  kAvg.textContent = '$'+Math.round(totalMonto/txns.length).toLocaleString();
  kAvg.style.color = 'var(--purple)';
  document.getElementById('wbt-kpi-avg-sub').textContent = 'Ticket promedio';

  const kClients = document.getElementById('wbt-kpi-clients');
  kClients.textContent = clients.length;
  kClients.style.color = 'var(--orange)';
  document.getElementById('wbt-kpi-clients-sub').textContent = 'Clientes unicos';

  // Chart: Monthly volume
  dc('cwbtm');
  const byMonth = {};
  txns.forEach(t=>{
    const ym = t.date.slice(0,7);
    if(!byMonth[ym]) byMonth[ym] = {monto:0, count:0};
    byMonth[ym].monto += (t.monto||0);
    byMonth[ym].count++;
  });
  const months = Object.keys(byMonth).sort();
  CH['cwbtm'] = new Chart(document.getElementById('c-wbt-monthly'),{
    type:'bar',
    data:{
      labels: months.map(ym=>{ const m=parseInt(ym.split('-')[1])-1; return MO[m]; }),
      datasets:[
        { label:'Monto', data:months.map(m=>Math.round(byMonth[m].monto)), backgroundColor:'rgba(155,81,224,.25)', borderColor:'#9b51e0', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
        { label:'Transacciones', data:months.map(m=>byMonth[m].count), type:'line', borderColor:'#0073ea', borderWidth:2, pointRadius:3, yAxisID:'y1', tension:.3 }
      ]
    },
    options:{...cOpts(),
      plugins:{legend:{display:true,position:'top',labels:{color:'#8b8fb5',font:{size:10},boxWidth:8,padding:8}}},
      scales:{
        x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:10}}},
        y:{position:'left',grid:{color:'rgba(228,232,244,.5)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+Math.abs(Math.round(v)).toLocaleString('es-MX')}},
        y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#0073ea',font:{size:9}}}
      }
    }
  });

  // Chart: By type doughnut
  dc('cwbtt');
  const byType = {};
  txns.forEach(t=>{ const k=t.tipo||'Otro'; byType[k]=(byType[k]||0)+(t.monto||0); });
  const types = Object.entries(byType).sort((a,b)=>b[1]-a[1]);
  const tColors = ['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000','#e91e63'];
  CH['cwbtt'] = new Chart(document.getElementById('c-wbt-types'),{
    type:'doughnut',
    data:{
      labels: types.map(x=>x[0]),
      datasets:[{ data:types.map(x=>x[1]), backgroundColor:tColors.map(c=>c+'33'), borderColor:tColors, borderWidth:2 }]
    },
    options:{...cOpts(), cutout:'60%',
      plugins:{legend:{position:'bottom',labels:{color:'#8b8fb5',font:{size:9},boxWidth:8,padding:6}}},
      scales:{x:{display:false},y:{display:false}}
    }
  });

  // Client table
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
    const pct = ((d.monto/totalMonto)*100).toFixed(1);
    const avg = Math.round(d.monto/d.count);
    return `<tr>
      <td style="font-weight:600;color:var(--muted)">${i+1}</td>
      <td style="font-weight:600">${cl}</td>
      <td class="r">${d.count.toLocaleString()}</td>
      <td class="r" style="font-weight:600">$${Math.round(d.monto).toLocaleString()}</td>
      <td class="r">$${avg.toLocaleString()}</td>
      <td class="r">${pct}%</td>
    </tr>`;
  }).join('');
}


// ── 3. Wirebit Tarjetas Upload (wb_tar_upload) ──
function rWBTarUpload(){
  const data = DB.get('gf_wb_tarjetas_2026');
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
        const parsed = new Date(raw);
        dateStr = isNaN(parsed) ? null : parsed.toISOString().slice(0,10);
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

    DB.set('gf_wb_tarjetas_2026', {
      year:'2026',
      transactions: txns,
      monthlySummary,
      totalMonto,
      txnCount: txns.length,
      filename: file.name,
      updated: new Date().toISOString()
    });

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

  // Expose globals
  window.rWBCripto = rWBCripto;
  window.rWBTarjetas = rWBTarjetas;
  window.rWBTarUpload = rWBTarUpload;
  window._renderWBTarMonthly = _renderWBTarMonthly;
  window.startWBTarUpload = startWBTarUpload;

})(window);
