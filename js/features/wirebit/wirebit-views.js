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
  if (totalAnual > 0) {
    kTotal.textContent = fmt(totalAnual);
    kTotal.style.color = 'var(--purple)';
    kTotal.style.fontSize = '';
    document.getElementById('wb-ing-kpi-total-sub').textContent = 'Ingresos acumulados 2026';

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

  // Expose globals
  window.rWBIng = rWBIng;

})(window);
