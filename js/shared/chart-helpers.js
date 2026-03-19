// GF — Chart helpers: P&L charts, evolution charts, consolidated charts
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // rPLCharts (from finanzas.js)
  // ═══════════════════════════════════════
  // Helper: sum record vals respecting period filter
  function _recSum(r, ent) { return _periodSum(r.vals, ent); }

  function rPLCharts(ent){
    // Guard: skip if charts not in DOM
    const canvasId = 'c-'+ent+'-pl';
    if(!document.getElementById(canvasId) && !document.getElementById('c-'+ent+'-gas')) return;
    const pieTip={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}};
    const noAxes={x:{display:false},y:{display:false}};
    const compactOpts=(noLeg=true)=>({...cOpts(),plugins:{legend:{display:!noLeg,labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}});

    if(ent==='sal'){
      // Gastos bar — from S.recs
      const salGasCats = [
        {lbl:'N\u00f3mina',       cats:['N\u00f3mina']},
        {lbl:'Efevoo Tar.',  cats:['Costo Directo','Marketing'], concepts:['efevoo tarjetas']},
        {lbl:'Efevoo TPV',   cats:['Costo Directo'], concepts:['efevoo tpv']},
        {lbl:'Com. TPV',     cats:['Com. Bancarias','TPV Comisiones']},
        {lbl:'Renta',        cats:['Renta']},
        {lbl:'Marketing',    cats:['Marketing']},
        {lbl:'Otros',        cats:['Administrativo','Operaciones','Regulatorio','Representaci\u00f3n','Varios']},
      ];
      const salGasVals = salGasCats.map(gc => {
        const matched = (S.recs||[]).filter(r => !r.isSharedSource && r.tipo==='gasto' && r.ent==='Salem' && r.yr==_year && gc.cats.some(c=>r.cat.toLowerCase().includes(c.toLowerCase())) && (!gc.concepts || gc.concepts.some(c=>r.concepto.toLowerCase().includes(c))));
        return matched.reduce((s,r) => s + _recSum(r, ent), 0);
      });
      const _pIdxs = _periodIdxs(ent);
      if(salGasVals[0]===0){ try{ salGasVals[0] = NOM_EDIT.reduce((s,n)=>s+n.s*(n.sal||0)/100,0) * _pIdxs.length; }catch(e){} }
      const colors=['rgba(229,57,53,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(134,134,134,.5)'];
      dc('c-sal-gas');
      CH['c-sal-gas']=new Chart(document.getElementById('c-sal-gas'),{type:'bar',data:{labels:salGasCats.map(g=>g.lbl),datasets:[{data:salGasVals,backgroundColor:colors,borderWidth:0}]},options:compactOpts()});

      // TPV donut — ingresos por fuente from S.recs
      dc('c-sal-pie');
      const tpvIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&r.cat==='TPV'&&r.yr==_year).reduce((s,r)=>s+_recSum(r,ent),0);
      const tarIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&(r.cat.includes('Tarjeta')||r.cat.includes('Centum'))&&r.yr==_year).reduce((s,r)=>s+_recSum(r,ent),0);
      const otrosIng = (S.recs||[]).filter(r=>r.ent==='Salem'&&r.tipo==='ingreso'&&r.cat!=='TPV'&&!r.cat.includes('Tarjeta')&&!r.cat.includes('Centum')&&r.yr==_year).reduce((s,r)=>s+_recSum(r,ent),0);
      const hasSalIng = tpvIng>0||tarIng>0||otrosIng>0;
      CH['c-sal-pie']=new Chart(document.getElementById('c-sal-pie'),{type:'doughnut',data:{
        labels: hasSalIng ? [`TPV ${fmtK(tpvIng)}`,`Tarjetas ${fmtK(tarIng)}`,`Otros ${fmtK(otrosIng)}`] : ['Sin datos'],
        datasets:[{data: hasSalIng ? [tpvIng||0.01,tarIng||0.01,otrosIng||0.01] : [1],
          backgroundColor: hasSalIng ? ['rgba(0,115,234,.6)','rgba(155,81,224,.6)','rgba(134,134,134,.4)'] : ['rgba(200,200,200,.3)'],
          borderColor: hasSalIng ? ['#0073ea','#9b51e0','#888'] : ['transparent'],
          borderWidth: hasSalIng ? 2 : 0}]
      },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
    }
    if(ent==='end' || ent==='dyn'){
      const entName = ent==='end' ? 'Endless' : 'Dynamo';
      const credits = ent==='end' ? END_CREDITS : DYN_CREDITS;
      const colors = ['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(255,112,67,.7)','rgba(0,184,117,.7)','rgba(255,160,0,.7)','rgba(229,57,53,.7)','rgba(134,134,134,.5)'];

      // Gastos bar — from S.recs
      const gasCats = [
        {lbl:'N\u00f3mina',       cats:['N\u00f3mina']},
        {lbl:'Regulatorio',  cats:['Regulatorio']},
        {lbl:'Renta',        cats:['Renta']},
        {lbl:'Operaciones',  cats:['Operaciones']},
        {lbl:'Marketing',    cats:['Marketing']},
        {lbl:'Com. Banc.',   cats:['Com. Bancarias']},
        {lbl:'Otros',        cats:['Administrativo','Representaci\u00f3n','Varios','Costo Directo']},
      ];
      const gasVals = gasCats.map(gc => {
        const matched = (S.recs||[]).filter(r => !r.isSharedSource && r.tipo==='gasto' && r.ent===entName && r.yr==_year && gc.cats.some(c=>r.cat.toLowerCase().includes(c.toLowerCase())));
        return matched.reduce((s,r) => s + _recSum(r, ent), 0);
      });
      // Add nomina from NOM_EDIT if not in S.recs
      const _pIdxsEnt = _periodIdxs(ent);
      if(gasVals[0]===0){
        try{ gasVals[0] = NOM_EDIT.reduce((s,n)=>s+n.s*(n[ent]||0)/100,0) * _pIdxsEnt.length; }catch(e){}
      }
      dc('c-'+ent+'-gas');
      if(document.getElementById('c-'+ent+'-gas')) CH['c-'+ent+'-gas']=new Chart(document.getElementById('c-'+ent+'-gas'),{type:'bar',data:{labels:gasCats.map(g=>g.lbl),datasets:[{data:gasVals,backgroundColor:colors,borderWidth:0}]},options:compactOpts()});

      // Cartera donut — from credits
      dc('c-'+ent+'-pie');
      const activos = credits.filter(c=>c.st==='Activo');
      const vencidos = credits.filter(c=>c.st==='Vencido');
      const prospectos = credits.filter(c=>c.st==='Prospecto');
      const cAct = activos.reduce((s,c)=>s+credSaldoActual(c),0);
      const cVen = vencidos.reduce((s,c)=>s+credSaldoActual(c),0);
      const cPro = prospectos.reduce((s,c)=>s+(c.monto||0),0);
      const hasCartera = cAct>0 || cVen>0 || cPro>0;
      if(document.getElementById('c-'+ent+'-pie')) CH['c-'+ent+'-pie']=new Chart(document.getElementById('c-'+ent+'-pie'),{type:'doughnut',data:{
        labels: hasCartera ? [`Activa ${fmtK(cAct)}`,`Vencida ${fmtK(cVen)}`,`Prospectos ${fmtK(cPro)}`] : ['Sin datos de cartera'],
        datasets:[{
          data: hasCartera ? [cAct||0.01, cVen||0.01, cPro||0.01] : [1],
          backgroundColor: hasCartera ? ['rgba(0,184,117,.6)','rgba(234,57,67,.6)','rgba(255,160,0,.4)'] : ['rgba(134,134,134,.2)'],
          borderColor: hasCartera ? ['#00b875','#ea3943','#ffa000'] : ['rgba(134,134,134,.3)'],
          borderWidth: hasCartera ? 2 : 0
        }]
      },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
    }
    if(ent==='wb'){
      // Line ingresos vs costos — filtered by period
      dc('c-wb-pl');
      const _wbPI = _periodIdxs('wb');
      const _wbLabels = _wbPI.map(i=>MO[i]);
      const _wbIngF = _wbPI.map(i=>WB_ING_TOTAL[i]||0);
      const _wbCosF = _wbPI.map(i=>WB_COSTO_TOTAL[i]||0);
      CH['c-wb-pl']=new Chart(document.getElementById('c-wb-pl'),{type:'line',data:{labels:_wbLabels,datasets:[
        {label:'Ingresos',data:_wbIngF,borderColor:'#9b51e0',backgroundColor:'rgba(155,81,224,.08)',fill:true,tension:.4,pointRadius:2,borderWidth:2},
        {label:'Costos',data:_wbCosF,borderColor:'#ff7043',fill:false,tension:.4,pointRadius:2,borderWidth:1.5},
      ]},options:{...cOpts(),plugins:{legend:{labels:{color:'#8b8fb5',font:{size:9},boxWidth:7,padding:7}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
      // Fuentes donut — filtered by period
      const wbAnn=Object.entries(WB_ING).map(([k,v])=>[k.replace('Fees ',''),_periodSum(v,'wb')]);
      dc('c-wb-pl-pie');
      CH['c-wb-pl-pie']=new Chart(document.getElementById('c-wb-pl-pie'),{type:'doughnut',data:{
        labels:wbAnn.map(x=>x[0]),datasets:[{data:wbAnn.map(x=>x[1]),backgroundColor:['rgba(155,81,224,.7)','rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(255,160,0,.7)'],borderWidth:0}]
      },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
    }
  }

  // ═══════════════════════════════════════
  // setPLMode (from finanzas.js)
  // ═══════════════════════════════════════
  const _plMode = {sal:'mensual', end:'mensual', dyn:'mensual', wb:'mensual'};

  function setPLMode(ent, mode, btn){
    _plMode[ent] = mode;
    if(btn){
      btn.closest('.pbar').querySelectorAll('.pbtn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    }
    rPL(ent); rPLCharts(ent);
  }

  // ═══════════════════════════════════════
  // rEvoChart (from finanzas.js)
  // ═══════════════════════════════════════
  function rEvoChart(canvasId, entKeys){
    const el=document.getElementById(canvasId);
    if(!el) return;
    dc(canvasId);

    const keys=Array.isArray(entKeys)?entKeys:[entKeys];
    const ingM=MO.map(()=>0), costM=MO.map(()=>0), gasM=MO.map(()=>0);

    keys.forEach(ek=>{
      const cfg=ENT_MAP[ek]; if(!cfg) return;
      const entName=cfg.fullName, nomK=cfg.nomKey;

      // Ingresos
      (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===entName&&r.yr==_year)
        .forEach(r=>r.vals.forEach((v,i)=>ingM[i]+=v));

      // Gastos (aggregate by concepto to avoid duplication)
      const gastoRecs=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==_year);
      const agg=new Map();
      gastoRecs.forEach(r=>{
        const key=r.concepto;
        if(agg.has(key)){const e=agg.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
        else agg.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
      });

      // NOM_EDIT fallback
      if(!gastoRecs.some(r=>r.cat==='N\u00f3mina')&&typeof NOM_EDIT!=='undefined'){
        const op=Math.round(nomMesOp(entName)),adm=Math.round(nomMesAdm(entName));
        if(op>0) agg.set(ek+'_NomOp',{concepto:'N\u00f3mina Operativa',cat:'N\u00f3mina',vals:Array(12).fill(op)});
        if(adm>0) agg.set(ek+'_NomAdm',{concepto:'N\u00f3mina Administrativa',cat:'N\u00f3mina',vals:Array(12).fill(adm)});
      }

      // GC_EDIT (gastos compartidos)
      if(typeof GC_EDIT!=='undefined'){
        GC_EDIT.forEach(gc=>{
          if(!gc.c||!gc[nomK]||gc[nomK]<=0) return;
          if(agg.has(gc.c)) return;
          const pptoMes=Math.round((gc.ppto||0)*gc[nomK]/100);
          if(pptoMes>0) agg.set(gc.c+'_'+ek,{concepto:gc.c,cat:gc.cat||'Varios',vals:Array(12).fill(pptoMes)});
        });
      }

      [...agg.values()].forEach(r=>{
        if(_isCostRow(r)) r.vals.forEach((v,i)=>costM[i]+=v);
        else r.vals.forEach((v,i)=>gasM[i]+=v);
      });
    });

    const ebitdaM=MO.map((_,i)=>ingM[i]-costM[i]-gasM[i]);

    // Filter to only show months in the active period
    const _ek = keys[0] || 'sal';
    const _pI = _periodIdxs(_ek);
    const _fLabels = _pI.map(i=>MO[i]);
    const _fIng = _pI.map(i=>ingM[i]);
    const _fCost = _pI.map(i=>costM[i]);
    const _fGas = _pI.map(i=>gasM[i]);
    const _fEbitda = _pI.map(i=>ebitdaM[i]);

    CH[canvasId]=new Chart(el,{
      type:'bar',
      data:{
        labels:_fLabels,
        datasets:[
          {label:'Ingresos',data:_fIng,backgroundColor:'rgba(46,184,92,.55)',borderColor:'rgba(46,184,92,.8)',borderWidth:1,borderRadius:3,order:2},
          {label:'Costes Directos',data:_fCost,backgroundColor:'rgba(255,152,0,.50)',borderColor:'rgba(255,152,0,.8)',borderWidth:1,borderRadius:3,order:3},
          {label:'Gastos Admin',data:_fGas,backgroundColor:'rgba(239,68,68,.40)',borderColor:'rgba(239,68,68,.7)',borderWidth:1,borderRadius:3,order:4},
          {type:'line',label:'EBITDA',data:_fEbitda,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.08)',borderWidth:2.5,pointRadius:3,pointBackgroundColor:'#6366f1',tension:.3,fill:true,order:1}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:true,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'top',labels:{color:'#8b8fb5',font:{size:10},boxWidth:10,padding:10}},
          tooltip:{...cOpts().plugins.tooltip,mode:'index',intersect:false}
        },
        scales:{
          x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},
          y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}
        }
      }
    });
  }

  // ═══════════════════════════════════════
  // rConsCharts (from finanzas.js)
  // ═══════════════════════════════════════
  function rConsCharts(type){
    const pieTip={...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)} (${((ctx.raw/ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}};
    const noAxes={x:{display:false},y:{display:false}};
    const smOpts=(noLeg=true)=>({...cOpts(),plugins:{legend:{display:!noLeg,labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:cOpts().plugins.tooltip},scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}});

    if(type==='centum'){
      // Ingresos por entidad bar (Salem vs Endless vs Dynamo) — filtered by period
      dc('c-centum-gas');
      const centumEnts = ['Salem','Endless','Dynamo'];
      const _cpI = _periodIdxs('centum');
      const _cpLabels = _cpI.map(i=>MO[i]);
      const centumIngByEnt = centumEnts.map(e => {
        const full = MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((s,r)=>s+(r.vals[i]||0),0));
        return _cpI.map(i=>full[i]);
      });
      CH['c-centum-gas']=new Chart(document.getElementById('c-centum-gas'),{type:'bar',data:{labels:_cpLabels,
        datasets:[
          {label:'Salem',data:centumIngByEnt[0],backgroundColor:'rgba(0,115,234,.5)',borderWidth:0},
          {label:'Endless',data:centumIngByEnt[1],backgroundColor:'rgba(0,184,117,.5)',borderWidth:0},
          {label:'Dynamo',data:centumIngByEnt[2],backgroundColor:'rgba(255,112,67,.5)',borderWidth:0},
        ]
      },options:{...smOpts(false),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});

      // Cartera donut from END_CREDITS + DYN_CREDITS
      dc('c-centum-pie');
      const endCart = END_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
      const dynCart = DYN_CREDITS.filter(c=>c.st==='Activo'||c.st==='Vencido').reduce((s,c)=>s+credSaldoActual(c),0);
      const totCart = endCart + dynCart;
      CH['c-centum-pie']=new Chart(document.getElementById('c-centum-pie'),{type:'doughnut',data:{
        labels: totCart>0 ? [`Endless ${fmtK(endCart)}`,`Dynamo ${fmtK(dynCart)}`] : ['Sin datos de cartera'],
        datasets:[{
          data: totCart>0 ? [endCart||0.01, dynCart||0.01] : [1],
          backgroundColor: totCart>0 ? ['rgba(0,184,117,.6)','rgba(255,112,67,.6)'] : ['rgba(134,134,134,.2)'],
          borderColor: totCart>0 ? ['#00b875','#ff7043'] : ['rgba(134,134,134,.3)'],
          borderWidth: totCart>0 ? 2 : 0
        }]
      },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
    }

    if(type==='grupo'){
      // Ingresos por fuente — all entities — filtered by period
      dc('c-grupo-ing');
      const _gpI = _periodIdxs('grupo');
      const _gpLabels = _gpI.map(i=>MO[i]);
      const _grpIng = (ent) => { const full = MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===ent&&r.yr==_year).reduce((s,r)=>s+(r.vals[i]||0),0)); return _gpI.map(i=>full[i]); };
      const salIngM = _grpIng('Salem'), endIngM = _grpIng('Endless'), dynIngM = _grpIng('Dynamo'), wbIngM = _grpIng('Wirebit');
      CH['c-grupo-ing']=new Chart(document.getElementById('c-grupo-ing'),{type:'bar',data:{labels:_gpLabels,
        datasets:[
          {label:'Salem',data:salIngM,backgroundColor:'rgba(0,115,234,.5)',borderWidth:0},
          {label:'Endless',data:endIngM,backgroundColor:'rgba(0,184,117,.5)',borderWidth:0},
          {label:'Dynamo',data:dynIngM,backgroundColor:'rgba(255,112,67,.5)',borderWidth:0},
          {label:'Wirebit',data:wbIngM,backgroundColor:'rgba(155,81,224,.5)',borderWidth:0},
        ]
      },options:{...smOpts(false),scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:9}},stacked:true},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
      // Nomina por empresa donut
      dc('c-grupo-nom');
      const _nomE={Salem:0,Endless:0,Dynamo:0,Wirebit:0,Stellaris:0};
      try{NOM_EDIT.forEach(n=>{_nomE.Salem+=n.s*(n.sal||0)/100;_nomE.Endless+=n.s*(n.end||0)/100;_nomE.Dynamo+=n.s*(n.dyn||0)/100;_nomE.Wirebit+=n.s*(n.wb||0)/100;_nomE.Stellaris+=n.s*((n.stel||0))/100;})}catch(e){}
      CH['c-grupo-nom']=new Chart(document.getElementById('c-grupo-nom'),{type:'doughnut',data:{
        labels:['Salem '+fmtK(_nomE.Salem),'Endless '+fmtK(_nomE.Endless),'Dynamo '+fmtK(_nomE.Dynamo),'Wirebit '+fmtK(_nomE.Wirebit),'Stellaris '+fmtK(_nomE.Stellaris)],
        datasets:[{data:[_nomE.Salem,_nomE.Endless,_nomE.Dynamo,_nomE.Wirebit,_nomE.Stellaris],backgroundColor:['rgba(0,115,234,.7)','rgba(0,184,117,.7)','rgba(255,112,67,.7)','rgba(155,81,224,.7)','rgba(229,57,53,.7)'],borderWidth:0}]
      },options:{...cOpts(),plugins:{legend:{position:'bottom',labels:{color:'#444669',font:{size:9},boxWidth:7,padding:5}},tooltip:pieTip},cutout:'55%',scales:noAxes}});
    }
  }

  // Expose _plMode for external access
  window._plMode = _plMode;

  // Expose globals
  window.rPLCharts = rPLCharts;
  window.setPLMode = setPLMode;
  window.rEvoChart = rEvoChart;
  window.rConsCharts = rConsCharts;

})(window);
