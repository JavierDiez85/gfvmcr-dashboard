// GF — Wirebit Views (P&L Ingresos)
(function(window) {
  'use strict';

// ── rWBIng — Wirebit Income P&L view ──
// Extracted from creditos.js
function rWBIng(){
  // ── KPIs ──
  const totalAnual = sum(WB_ING_TOTAL);
  const kTotal = document.getElementById('wb-ing-kpi-total');
  const kStart = document.getElementById('wb-ing-kpi-start');
  const kEnd = document.getElementById('wb-ing-kpi-end');
  const kGrowth = document.getElementById('wb-ing-kpi-growth');
  // Compare KPI for total
  const _wbiKCmp = typeof cmpActive === 'function' && cmpActive();
  let _wbiPrevTotal = 0;
  if(_wbiKCmp){
    const py = cmpPrevYear();
    const pRecs = (S.recs||[]).filter(r=>r.tipo==='ingreso'&&r.ent==='Wirebit'&&r.yr==py);
    _wbiPrevTotal = pRecs.reduce((s,r)=>s+sum(r.vals),0);
  }

  if (totalAnual > 0) {
    kTotal.innerHTML = fmt(totalAnual) + (_wbiKCmp ? cmpBadge(totalAnual, _wbiPrevTotal) : '');
    kTotal.style.color = 'var(--purple)';
    kTotal.style.fontSize = '';
    document.getElementById('wb-ing-kpi-total-sub').textContent = 'Ingresos acumulados '+_year;

    const ene = WB_ING_TOTAL[0];
    kStart.textContent = ene ? fmt(ene) : '—';
    kStart.style.color = ene ? 'var(--green)' : 'var(--muted)';
    kStart.style.fontSize = '';
    document.getElementById('wb-ing-kpi-start-sub').textContent = 'Enero 2026';

    // Find last month with data
    let lastIdx = 11;
    while (lastIdx > 0 && !WB_ING_TOTAL[lastIdx]) lastIdx--;
    const lastVal = WB_ING_TOTAL[lastIdx];
    kEnd.textContent = lastVal ? fmt(lastVal) : '—';
    kEnd.style.color = lastVal ? '#0073ea' : 'var(--muted)';
    kEnd.style.fontSize = '';
    document.getElementById('wb-ing-kpi-end-sub').textContent = MO[lastIdx] + ' 2026';

    // Avg monthly growth (months with data)
    const months = WB_ING_TOTAL.filter(v => v > 0);
    if (months.length >= 2) {
      let growths = 0, cnt = 0;
      for (let i = 1; i < 12; i++) {
        if (WB_ING_TOTAL[i] > 0 && WB_ING_TOTAL[i - 1] > 0) {
          growths += (WB_ING_TOTAL[i] - WB_ING_TOTAL[i - 1]) / WB_ING_TOTAL[i - 1];
          cnt++;
        }
      }
      const avgGrowth = cnt ? (growths / cnt * 100) : 0;
      kGrowth.textContent = (avgGrowth >= 0 ? '+' : '') + avgGrowth.toFixed(1) + '%';
      kGrowth.style.color = avgGrowth >= 0 ? 'var(--orange)' : '#eb5757';
      kGrowth.style.fontSize = '';
      document.getElementById('wb-ing-kpi-growth-sub').textContent = 'Crecimiento mensual promedio';
    }
  }

  const colors=['#9b51e0','#0073ea','#00b875','#ff7043','#ffa000'];
  dc('cwbi2');
  CH['cwbi2']=new Chart(document.getElementById('c-wb-ing2'),{type:'bar',data:{labels:MO,
    datasets:Object.entries(WB_ING).map(([k,v],i)=>({label:k,data:v,backgroundColor:colors[i]+'33',borderColor:colors[i],borderWidth:1.5}))
  },options:cOpts({scales:{x:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+Math.abs(Math.round(v)).toLocaleString('es-MX')}}}})});

  const annual=Object.entries(WB_ING).map(([k,v])=>[k,sum(v)]);
  dc('cwbm');
  CH['cwbm']=new Chart(document.getElementById('c-wb-mix'),{type:'doughnut',data:{
    labels:annual.map(x=>x[0]),
    datasets:[{data:annual.map(x=>x[1]),backgroundColor:colors.map(c=>c+'33'),borderColor:colors,borderWidth:2}]
  },options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:10}}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${(ctx.raw/sum(WB_ING_TOTAL)*100).toFixed(1)}%)`}}},cutout:'65%',scales:{x:{display:false},y:{display:false}}}});

  const thead=document.getElementById('wb-ing-thead');
  const tbody=document.getElementById('wb-ing-tbody');
  thead.innerHTML=`<th>Fuente de Ingreso</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total 2026</th>`;

  // ── Compare: build prev year WB income/cost data ──
  const _wbiCmp = typeof cmpActive === 'function' && cmpActive();
  let _pWBI=null, _pWBIT=null, _pWBC=null, _pWBCT=null, _pWBM=null, _pWBNT=null;
  if(_wbiCmp){
    // Prev year income/cost from S.recs
    const py = cmpPrevYear();
    _pWBI = {};
    Object.keys(WB_ING).forEach(k => {
      const recs = (S.recs||[]).filter(r=>r.tipo==='ingreso'&&r.ent==='Wirebit'&&r.yr==py&&r.cat===k.replace('Fees ',''));
      _pWBI[k] = MO.map((_,i)=>recs.reduce((s,r)=>s+(r.vals[i]||0),0));
    });
    _pWBIT = MO.map((_,i)=>Object.values(_pWBI).reduce((s,v)=>s+(v[i]||0),0));
    _pWBC = {};
    Object.keys(WB_COSTOS).forEach(k => {
      const recs = (S.recs||[]).filter(r=>r.tipo==='gasto'&&r.ent==='Wirebit'&&r.yr==py&&r.cat.includes('Costo'));
      _pWBC[k] = MO.map((_,i)=>recs.reduce((s,r)=>s+(r.vals[i]||0),0));
    });
    _pWBCT = MO.map((_,i)=>Object.values(_pWBC).reduce((s,v)=>s+(v[i]||0),0));
    _pWBM = _pWBIT.map((v,i)=>v-_pWBCT[i]);
    _pWBNT = WB_NOM_TOTAL; // nomina is same config
  }
  const _wbiSub = (cur, prev, invert) => {
    if(!_wbiCmp || prev==null) return '';
    const d = cmpDelta(cur, prev);
    if(!d) return '';
    const cls = d.dir==='neutral'?'dnu':(d.dir==='up'?(invert?'ddn':'dup'):(invert?'dup':'ddn'));
    return `<div class="cmp-prev">${fmtFull(prev)} <span class="${cls}" style="font-size:.55rem;padding:0 3px;border-radius:6px">${d.label}</span></div>`;
  };

  const rows=[
    ...Object.entries(WB_ING).map(([k,v])=>({l:k,vals:v,pv:_wbiCmp&&_pWBI?_pWBI[k]:null,t:'ing'})),
    {l:'TOTAL INGRESOS',vals:WB_ING_TOTAL,pv:_pWBIT,t:'total',bold:true},
    {l:'— COSTOS DIRECTOS —',hdr:true},
    ...Object.entries(WB_COSTOS).map(([k,v])=>({l:k,vals:v,pv:_wbiCmp&&_pWBC?_pWBC[k]:null,t:'gasto'})),
    {l:'TOTAL COSTOS DIRECTOS',vals:WB_COSTO_TOTAL,pv:_pWBCT,t:'total',bold:true},
    {l:'MARGEN BRUTO',vals:WB_MARGEN,pv:_pWBM,t:'util',bold:true},
    {l:'Nómina',vals:WB_NOM_TOTAL,pv:_pWBNT,t:'gasto'},
    {l:'RESULTADO OPERATIVO',vals:WB_MARGEN.map((v,i)=>v-WB_NOM_TOTAL[i]),pv:_pWBM?_pWBM.map((v,i)=>v-(_pWBNT?_pWBNT[i]:0)):null,t:'util',bold:true},
  ];
  tbody.innerHTML=rows.map(r=>{
    if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
    const tot=sum(r.vals);
    const pTot=r.pv?sum(r.pv):null;
    const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
    const isGas=r.t==='gasto';
    return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map((v,i)=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'—'}${r.pv?_wbiSub(v,r.pv[i],isGas):''}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}${r.pv?_wbiSub(tot,pTot,isGas):''}</td></tr>`;
  }).join('');
}

  // Expose globals
  window.rWBIng = rWBIng;

  // Register views
  if(typeof registerView === 'function'){
    registerView('wb_ing', function(){ wbLoadFees(); rWBIng(); });
    registerView('wb_nom', function(){ rWBNom(); });
    registerView('wb_cripto', function(){ rWBCripto(); });
    registerView('wb_tarjetas', function(){ rWBTarjetas(); });
  }

})(window);
