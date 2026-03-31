// GF — UI Components: modals, sidebar, confirm dialogs, file loading, export
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // MODALES (from dashboard.js)
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
        t:'Ingresos Grupo Financiero '+_year, s:'Salem \u00b7 Endless \u00b7 Dynamo \u00b7 Wirebit',
        render:()=>{
          fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
          const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0',Stellaris:'#e53935'};
          const rows = ['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
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
              <td class="mo pos">${r.tot?fmt(r.tot):'\u2014'}</td>
              <td class="mo">${r.mes?fmt(r.mes):'\u2014'}</td>
              <td class="mo">${grand?Math.round(r.tot/grand*100)+'%':'\u2014'}</td>
              <td style="text-align:center">${r.n}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo pos">${grand?fmt(grand):'$0 \u2014 captura pendiente'}</td><td class="mo">${grand?fmt(Math.round(grand/12)):'\u2014'}</td><td>100%</td><td>${rows.reduce((a,r)=>a+r.n,0)}</td></tr>
          </tbody></table>`;
        },
        afterRender:()=>{
          fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
          const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
          const entCBg={Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};
          const rows=['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
            const recs=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year);
            return {e, vals:MO.map((_,i)=>recs.reduce((a,r)=>a+(r.vals[i]||0),0))};
          }).filter(r=>r.vals.some(v=>v>0));
          if(!rows.length) return;
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:MO,datasets:rows.map(r=>({label:r.e,data:r.vals,backgroundColor:entCBg[r.e],borderColor:entC[r.e],borderWidth:1.5}))},
            options:cOpts({scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},y:{stacked:true,grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}})});
        }
      },
      // ── Dashboard: Gastos Grupo
      resumen_gastos:{
        t:'Gastos Grupo Financiero '+_year, s:'N\u00f3mina \u00b7 Gastos operativos \u00b7 Gastos compartidos',
        render:()=>{
          fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
          const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
          const rows=['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
            const nom = NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
            const gas = S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            return {e, nom, gas, tot:nom+gas};
          });
          const grand=rows.reduce((a,r)=>a+r.tot,0);
          return `<canvas id="m-chart1" height="200"></canvas>
          <table class="mbt" style="margin-top:14px"><thead><tr><th>Empresa</th><th class="r">N\u00f3mina Anual</th><th class="r">Gastos Capturados</th><th class="r">Total</th><th class="r">% del Grupo</th></tr></thead><tbody>
            ${rows.map(r=>`<tr>
              <td class="bld" style="color:${entC[r.e]}">${r.e}</td>
              <td class="mo neg">${fmt(r.nom)}</td>
              <td class="mo neg">${r.gas?fmt(r.gas):'\u2014'}</td>
              <td class="mo neg">${fmt(r.tot)}</td>
              <td class="mo">${grand?Math.round(r.tot/grand*100)+'%':'\u2014'}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo neg">${fmt(rows.reduce((a,r)=>a+r.nom,0))}</td><td class="mo neg">${fmt(rows.reduce((a,r)=>a+r.gas,0))}</td><td class="mo neg">${fmt(grand)}</td><td>100%</td></tr>
          </tbody></table>`;
        },
        afterRender:()=>{
          const entCBg={Salem:'rgba(0,115,234,.22)',Endless:'rgba(0,184,117,.22)',Dynamo:'rgba(255,112,67,.22)',Wirebit:'rgba(155,81,224,.22)'};
          const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
          const rows=['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
            const nom=NOM_EDIT.reduce((a,n)=>a+n.s*((e==='Salem'?n.sal:e==='Endless'?n.end:e==='Dynamo'?n.dyn:n.wb)||0)/100,0)*12;
            const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            return {e, v:nom+gas};
          });
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'doughnut',data:{labels:rows.map(r=>r.e),datasets:[{data:rows.map(r=>r.v),backgroundColor:rows.map(r=>entCBg[r.e]),borderColor:rows.map(r=>entC[r.e]),borderWidth:1.5}]},
            options:{...cOpts(),plugins:{legend:{position:'right',labels:{color:'#444669',font:{size:11},boxWidth:10}},tooltip:{...cOpts().plugins.tooltip,callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}}},cutout:'55%',scales:{x:{display:false},y:{display:false}}}});
        }
      },
      // ── Dashboard: Margen Grupo
      resumen_margen:{
        t:'Margen Operativo Grupo Financiero '+_year, s:'Ingresos capturados \u2212 Gastos totales por empresa',
        render:()=>{
          fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
          const entC={Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
          const rows=['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
            const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            const nom=Array.from({length:12},(_,m)=>nomMesTotal(e,m,+_year)).reduce((a,b)=>a+b,0);
            const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            const margen=ing-(nom+gas);
            return {e, ing, nom, gas, margen};
          });
          const totIng=rows.reduce((a,r)=>a+r.ing,0);
          const totGas=rows.reduce((a,r)=>a+r.nom+r.gas,0);
          const totM=totIng-totGas;
          return `<canvas id="m-chart1" height="180"></canvas>
          <table class="mbt" style="margin-top:14px"><thead><tr><th>Empresa</th><th class="r">Ingresos</th><th class="r">N\u00f3mina + Gastos</th><th class="r">Margen</th><th class="r">% Margen</th></tr></thead><tbody>
            ${rows.map(r=>`<tr>
              <td class="bld" style="color:${entC[r.e]}">${r.e}</td>
              <td class="mo pos">${r.ing?fmt(r.ing):'\u2014'}</td>
              <td class="mo neg">${fmt(r.nom+r.gas)}</td>
              <td class="mo ${r.margen>=0?'pos':'neg'}">${r.ing?fmt(r.margen):'\u2014'}</td>
              <td class="mo ${r.margen>=0?'pos':'neg'}">${r.ing?Math.round(r.margen/r.ing*100)+'%':'\u2014'}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid var(--border2);font-weight:700"><td>TOTAL GRUPO</td><td class="mo pos">${totIng?fmt(totIng):'$0'}</td><td class="mo neg">${fmt(totGas)}</td><td class="mo ${totM>=0?'pos':'neg'}">${totIng?fmt(totM):'\u2014'}</td><td class="mo ${totM>=0?'pos':'neg'}">${totIng?Math.round(totM/totIng*100)+'%':'\u2014'}</td></tr>
          </tbody></table>`;
        },
        afterRender:()=>{
          fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
          const rows=['Salem','Endless','Dynamo','Wirebit','Stellaris'].map(e=>{
            const ing=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            const nom=Array.from({length:12},(_,m)=>nomMesTotal(e,m,+_year)).reduce((a,b)=>a+b,0);
            const gas=S.recs.filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===e&&r.yr==_year).reduce((a,r)=>a+r.vals.reduce((x,y)=>x+y,0),0);
            return {e, v:ing-(nom+gas)};
          });
          dc('m-chart1');
          CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'bar',data:{labels:rows.map(r=>r.e),datasets:[{data:rows.map(r=>r.v),
            backgroundColor:rows.map(r=>r.v>=0?'rgba(0,184,117,.25)':'rgba(229,57,53,.2)'),
            borderColor:rows.map(r=>r.v>=0?'#00b875':'#e53935'),borderWidth:1.5,borderRadius:6}]},
            options:cOpts({indexAxis:'y',scales:{x:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+(Math.abs(v)/1000).toFixed(0)+'K'}},y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:11}}}},plugins:{legend:{display:false}}})});
        }
      },
      // ── Centum Ingresos
      centum_ing_modal:{
        t:'Centum Capital \u2014 Ingresos '+_year,s:'Salem TPV \u00b7 Fondeo Tarjetas \u00b7 Endless \u00b7 Dynamo',
        render:()=>`<div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.77rem;color:#0060b8">
          \ud83d\udca1 Los ingresos de Centum Capital dependen de los datos reales de Salem, Endless y Dynamo. Usa <strong>"Ingresar Datos"</strong> para capturar la informaci\u00f3n mensual.
        </div>
        <div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem \u2014 Fuentes</div><div class="m-kpi-val" style="font-size:.85rem">TPV + Fondeo</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless \u2014 Ing. Est.</div><div class="m-kpi-val">$23.2K/a\u00f1o</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo \u2014 Ing. Est.</div><div class="m-kpi-val">$426.6K/a\u00f1o</div></div>
        </div>
        <table class="mbt"><thead><tr><th>Entidad</th><th>Fuente de Ingreso</th><th class="r">Est. Mensual</th><th class="r">Est. Anual</th><th>Status</th></tr></thead><tbody>
          <tr><td class="bld" style="color:#0073ea">Salem Internacional</td><td>Ingresos TPV + Fondeo Tarjetas</td><td class="mo">\u2014</td><td class="mo">\u2014</td><td><span style="font-size:.65rem;background:var(--yellow-lt);color:#7a6000;padding:2px 7px;border-radius:20px;font-weight:700">Pendiente</span></td></tr>
          <tr><td class="bld" style="color:#00b875">Endless Money</td><td>Intereses Cr\u00e9dito Simple (Jer\u00f3nimo)</td><td class="mo pos">$1,934</td><td class="mo pos">$23,208</td><td><span style="font-size:.65rem;background:var(--green-lt);color:#007a48;padding:2px 7px;border-radius:20px;font-weight:700">Activo</span></td></tr>
          <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td>Intereses Cr\u00e9dito Simple (Easy Clean)</td><td class="mo pos">$1,068</td><td class="mo pos">$12,816</td><td><span style="font-size:.65rem;background:var(--green-lt);color:#007a48;padding:2px 7px;border-radius:20px;font-weight:700">Activo</span></td></tr>
          <tr><td class="bld" style="color:#ff7043">Dynamo Finance</td><td>Intereses Juan Manuel (VENCIDO)</td><td class="mo neg">$34,482</td><td class="mo neg">$413,784</td><td><span style="font-size:.65rem;background:var(--red-lt);color:#b02020;padding:2px 7px;border-radius:20px;font-weight:700">\u26a0 Vencido</span></td></tr>
        </tbody></table>`
      },
      // ── Centum Costos
      centum_costos_modal:{
        t:'Centum Capital \u2014 Costos y Gastos Consolidados',s:'Presupuesto mensual de las 3 entidades',
        render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo Gastos/Mes</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
        </div>
        <p style="text-align:center;color:var(--muted);padding:24px 0;font-size:.85rem">Pendiente de captura de datos reales.</p>`
      },
      // ── Centum Cartera
      centum_cartera_modal:{
        t:'Centum Capital \u2014 Cartera Consolidada de Cr\u00e9ditos',s:'Endless Money + Dynamo Finance',
        render:()=>`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">\u26a0\ufe0f <strong>Alerta:</strong> Juan Manuel de la Colina (Dynamo) \u2014 $2.5M vencida = 44% de la cartera total de Centum.</div>
          <div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val">$5.7M</div></div>
            <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
            <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Cartera Activa</div><div class="m-kpi-val" style="color:var(--green)">$200K</div></div>
            <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline Total</div><div class="m-kpi-val">$5.25M</div></div>
          </div>
          <table class="mbt"><thead><tr><th>SOFOM</th><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th class="r">Int/Mes</th><th>Status</th></tr></thead><tbody>
            ${[...END_CREDITS.map(c=>({...c,ent:'Endless',col:'#00b875'})),...DYN_CREDITS.map(c=>({...c,ent:'Dynamo',col:'#ff7043'}))].map(c=>`
            <tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld" style="color:${c.col}">${c.ent}</td><td>${c.cl}</td><td class="mo bld">${fmt(c.m)}</td><td>${c.pl}</td><td>${c.t}</td><td class="mo ${c.im?'pos':''}">${c.im?fmt(c.im):'\u2014'}</td><td>${spill(c.st)}</td></tr>`).join('')}
          </tbody></table>`
      },
      // ── Centum Nomina
      centum_nom_modal:{
        t:'Centum Capital \u2014 N\u00f3mina Asignada',s:'Salem + Endless + Dynamo',
        render:()=>{const _s=NOM_DIST.Salem||0,_e=NOM_DIST.Endless||0,_d=NOM_DIST.Dynamo||0;return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val">${fmtK(_s)}/mes</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val">${fmtK(_e)}/mes</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val">${fmtK(_d)}/mes</div></div>
        </div>
        <table class="mbt"><thead><tr><th>Empleado</th><th>Rol</th><th class="r">Sueldo/Mes</th><th class="r">% Salem</th><th class="r">% Endless</th><th class="r">% Dynamo</th></tr></thead><tbody>
          ${NOM.filter(e=>e.dist.Salem>0||e.dist.Endless>0||e.dist.Dynamo>0).map(e=>`<tr>
            <td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td>
            <td class="mo" style="color:#0073ea">${e.dist.Salem>0?(e.dist.Salem*100).toFixed(0)+'%':'\u2014'}</td>
            <td class="mo" style="color:#00b875">${e.dist.Endless>0?(e.dist.Endless*100).toFixed(0)+'%':'\u2014'}</td>
            <td class="mo" style="color:#ff7043">${e.dist.Dynamo>0?(e.dist.Dynamo*100).toFixed(0)+'%':'\u2014'}</td>
          </tr>`).join('')}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL CENTUM</td><td></td><td></td><td class="mo bld" style="color:#0073ea">${fmtK(_s)}</td><td class="mo bld" style="color:#00b875">${fmtK(_e)}</td><td class="mo bld" style="color:#ff7043">${fmtK(_d)}</td></tr>
        </tbody></table>`;}
      },
      // ── Grupo Ingresos
      grupo_ing_modal:{
        t:'Grupo Financiero \u2014 Ingresos Consolidados '+_year,s:'Centum Capital + Wirebit',
        render:()=>{
          const rows=MO.map((m,i)=>`<tr><td class="bld">${m}</td><td class="mo">\u2014</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo bld pos">${fmt(WB_ING_TOTAL[i])}</td></tr>`).join('');
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
        t:'Grupo Financiero \u2014 Costos y Gastos Totales '+_year,s:'Las 4 entidades consolidadas',
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
            {n:'Wirebit (n\u00f3mina)',c:'#9b51e0',v:wbNomMes},
            {n:'N\u00f3mina Compartida (todos)',c:null,v:nomCompMes},
            {n:'Gastos Compartidos (ppto)',c:null,v:gcompMes},
          ];
          const totalAnual=items.reduce((a,i)=>a+i.v*12,0);
          const rows=items.filter(i=>i.v>0).map(i=>{
            const pct=totalAnual?Math.round(i.v*12/totalAnual*100):0;
            return`<tr><td class="bld"${i.c?' style="color:'+i.c+'"':''}>${i.n}</td><td class="mo neg">${fmt(i.v)}</td><td class="mo neg">${fmt(i.v*12)}</td><td class="mo">${pct}%</td></tr>`;
          }).join('');
          const salAnual=salMes*12, endAnual=endNom*12, dynAnual=dynNom*12, wbAnual=(wbCostoMes+wbNomMes)*12;
          return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Salem</div><div class="m-kpi-val" style="color:var(--red)">${salAnual?fmtK(salAnual)+'/a\u00f1o':'Sin datos'}</div></div>
            <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Endless</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(endAnual)}/a\u00f1o</div></div>
            <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Dynamo</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(dynAnual)}/a\u00f1o</div></div>
            <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Wirebit</div><div class="m-kpi-val" style="color:var(--red)">${fmtK(wbAnual)} nom.</div></div>
          </div>
          <table class="mbt"><thead><tr><th>Entidad</th><th class="r">Gastos/Mes</th><th class="r">Total Anual</th><th class="r">% del Grupo</th></tr></thead><tbody>
            ${rows}
            <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld neg">\u2014</td><td class="mo bld neg">${fmtK(totalAnual)}</td><td class="mo bld">100%</td></tr>
          </tbody></table>`;
        }
      },
      // ── Grupo Cartera
      grupo_cartera_modal:{
        t:'Grupo Financiero \u2014 Cartera y Pipeline de Cr\u00e9dito',s:'Endless + Dynamo \u00b7 Todas las posiciones',
        render:()=>`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">\u26a0\ufe0f Juan Manuel de la Colina (Dynamo) \u2014 $2.5M vencida sin resolver.</div>
          <div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Total Cartera</div><div class="m-kpi-val">$5.7M</div></div>
            <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
            <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Activa</div><div class="m-kpi-val" style="color:var(--green)">$200K</div></div>
            <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$5.25M</div></div>
          </div>
          <table class="mbt"><thead><tr><th>SOFOM</th><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
            ${[...END_CREDITS.map(c=>({...c,ent:'Endless',col:'#00b875'})),...DYN_CREDITS.map(c=>({...c,ent:'Dynamo',col:'#ff7043'}))].map(c=>`
            <tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld" style="color:${c.col}">${c.ent}</td><td>${c.cl}</td><td class="mo bld">${fmt(c.m)}</td><td>${c.pl}</td><td>${c.t}</td><td class="mo ${c.im?'pos':''}">${c.im?fmt(c.im):'\u2014'}</td><td class="mo ${c.ia?'pos':''}">${c.ia?fmt(c.ia):'\u2014'}</td><td>${spill(c.st)}</td></tr>`).join('')}
          </tbody></table>`
      },
      // ── Grupo Mix
      grupo_mix_modal:{
        t:'Grupo Financiero \u2014 Mix Ingresos y N\u00f3mina',s:'Distribuci\u00f3n anual presupuestada',
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
          return canv+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">Ingresos por Entidad</div><div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;text-align:center;margin-bottom:4px">N\u00f3mina Mensual por Empresa</div></div>`;
        }
      },
      // ── Salem Ingresos
      salem_ing_modal:{
        t:'Salem \u2014 Ingresos '+_year,s:'TPV por cliente + Fondeo Tarjetas Centum Black',
        render:()=>{
          const salRows = FI_ROWS.filter(r=>r.ent==='Salem'&&!r.auto);
          const totalAnual = salRows.reduce((s,r)=>s+r.vals.reduce((a,b)=>a+b,0),0);
          const totalMes = salRows.reduce((s,r)=>s+(r.vals.reduce((a,b)=>a+b,0)/12),0);
          const hasReal = salRows.length > 0;
          const rowsHtml = hasReal
            ? salRows.map(r=>`<tr><td class="bld">${r.concepto||'\u2014'}</td><td style="color:var(--muted);font-size:.73rem">${r.cat}</td><td class="mo pos">${fmt(r.vals.reduce((a,b)=>a+b,0)/12)}</td><td class="mo pos bld">${fmt(r.vals.reduce((a,b)=>a+b,0))}</td></tr>`).join('')
            : `<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:16px">Sin datos reales capturados \u2014 usa Flujo de Ingresos para agregar</td></tr>`;
          return `<div class="m-kpi-row">
            <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Real Anual</div><div class="m-kpi-val" style="color:#0073ea">${fmtK(totalAnual)}</div></div>
            <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Promedio Mensual</div><div class="m-kpi-val">${fmtK(totalMes)}</div></div>
            <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Conceptos</div><div class="m-kpi-val">${salRows.length}</div></div>
          </div>
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Ingresos Capturados</div>
          <table class="mbt"><thead><tr><th>Concepto</th><th>Categor\u00eda</th><th class="r">Prom/Mes</th><th class="r">Total Anual</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
        }
      },
      // ── Salem Costos
      salem_costos_modal:{
        t:'Salem \u2014 Costos Directos '+_year,s:'Efevoo TPV \u00b7 Efevoo Tarjetas \u00b7 SitesPay',
        render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Costo Mensual Total</div><div class="m-kpi-val" style="color:var(--red)">$210K</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Anual Estimado</div><div class="m-kpi-val" style="color:var(--red)">$2.52M</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Mayor Costo</div><div class="m-kpi-val" style="font-size:.85rem">Efevoo Tarjetas</div></div></div>
          <table class="mbt"><thead><tr><th>Concepto</th><th class="r">Ppto/Mes</th><th class="r">% del Total</th><th class="r">Anual Est.</th></tr></thead><tbody>
            <tr><td class="bld">Efevoo \u2014 Tarjetas Centum Black</td><td class="mo neg">$110,000</td><td class="mo">52%</td><td class="mo neg">$1,320,000</td></tr>
            <tr><td class="bld">Efevoo \u2014 TPV / Terminales</td><td class="mo neg">$100,000</td><td class="mo">48%</td><td class="mo neg">$1,200,000</td></tr>
            <tr><td class="bld">Comisiones SitesPay</td><td class="mo neg">$13,000</td><td class="mo">6%</td><td class="mo neg">$156,000</td></tr>
            <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td class="mo bld neg">$210,000/mes</td><td class="mo"></td><td class="mo bld neg">$2,520,000/a\u00f1o</td></tr>
          </tbody></table>`
      },
      // ── Salem Gastos Operativos
      salem_gas_modal:{
        t:'Salem \u2014 Gastos Operativos '+_year,s:'Presupuesto detallado por categor\u00eda',
        render:()=>{
          const total=SAL_GASTOS_ITEMS.reduce((s,g)=>s+g.ppto,0);
          const rows=SAL_GASTOS_ITEMS.filter(g=>g.ppto>0).map(g=>`<tr><td class="bld">${g.c}</td><td><span style="font-size:.65rem;color:var(--muted)">${g.cat}</span></td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td><td class="mo">${total?((g.ppto/total)*100).toFixed(1):'0'}%</td></tr>`).join('');
          const nomSalG=NOM_DIST.Salem||186000;
          return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">N\u00f3mina/Mes</div><div class="m-kpi-val">${fmtK(nomSalG)}</div></div><div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">N\u00f3mina Anual</div><div class="m-kpi-val">${fmtK(nomSalG*12)}</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">${(total-nomSalG)>0?fmtK(total-nomSalG)+'/mes':'Sin datos'}</div></div></div>
            <table class="mbt"><thead><tr><th>Concepto</th><th>Categor\u00eda</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th><th class="r">% Total</th></tr></thead><tbody>${rows}
            <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(total)}</td><td class="mo bld neg">${fmt(total*12)}</td><td class="mo bld">100%</td></tr>
            </tbody></table>`;
        }
      },
      // ── Salem TPV clientes
      salem_tpv_modal:{
        t:'Salem \u2014 Clientes TPV / Terminales',s:'14 terminales activas \u2014 Pendiente datos reales',
        render:()=>`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Terminales</div><div class="m-kpi-val">14</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Costo Efevoo TPV</div><div class="m-kpi-val" style="color:var(--red)">$100K/mes</div></div><div class="m-kpi" style="--ac:var(--muted)"><div class="m-kpi-lbl">Real Capturado</div><div class="m-kpi-val">$0</div></div></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
            ${SAL_TPV_CLIENTES.map((c,i)=>`<div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 13px">
              <div style="font-weight:700;font-size:.78rem;color:#0060b8;margin-bottom:3px">${c}</div>
              <div style="font-size:.65rem;color:var(--muted)">Terminal #${i+1} \u00b7 Pendiente real</div>
            </div>`).join('')}
          </div>
          <div style="background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:10px 14px;font-size:.75rem;color:#0060b8">
            \ud83d\udca1 Para capturar datos reales de TPV, usa la secci\u00f3n <strong>"Ingresar Datos"</strong> del men\u00fa lateral.
          </div>`
      },
      // ── Endless cartera modal
      endless_cred_modal:{
        t:'Endless Money \u2014 Cartera de Cr\u00e9ditos',s:'Cr\u00e9dito Simple \u00b7 SOFOM regulada CNBV',
        render:()=>{
          const rows=END_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'\u2014'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'\u2014'}</td><td>${spill(c.st)}</td></tr>`}).join('');
          return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#00b875">$3.1M</div></div><div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Ingreso Anual Est.</div><div class="m-kpi-val">$23.2K</div></div><div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$3M</div></div></div>
            <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisi\u00f3n</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
      },
      // ── Endless gastos modal
      endless_gas_modal:{
        t:'Endless \u2014 Gastos Operativos '+_year,s:'Presupuesto detallado por categor\u00eda',
        render:()=>{const nEnd=NOM_DIST.Endless||23000;return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">N\u00f3mina/Mes</div><div class="m-kpi-val">${fmtK(nEnd)}</div></div><div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">N\u00f3mina Anual</div><div class="m-kpi-val">${fmtK(nEnd*12)}</div></div><div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div></div>
          <table class="mbt"><thead><tr><th>Concepto</th><th>Categor\u00eda</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
            <tr><td class="bld">N\u00f3mina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">N\u00f3mina</span></td><td class="mo neg">${fmt(nEnd)}</td><td class="mo neg">${fmt(nEnd*12)}</td></tr>
            <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(nEnd)}/mes</td><td class="mo bld neg">${fmt(nEnd*12)}/a\u00f1o</td></tr>
          </tbody></table>`;}
      },
      // ── Dynamo cartera modal
      dynamo_cred_modal:{
        t:'Dynamo Finance \u2014 Cartera de Cr\u00e9ditos',s:'SOFOM regulada CNBV \u00b7 Alerta cartera vencida',
        render:()=>{
          const rows=DYN_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c);return`<tr${c.st==='Vencido'?' style="background:var(--red-bg)"':''}><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'\u2014'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'\u2014'}</td><td>${spill(c.st)}</td></tr>`}).join('');
          return`<div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:.77rem;color:var(--red)">\u26a0\ufe0f <strong>Alerta:</strong> Juan Manuel de la Colina \u2014 $2.5M en cartera vencida = 96% de la cartera activa.</div>
            <div class="m-kpi-row"><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#ff7043">$2.6M</div></div><div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div><div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$2.25M</div></div></div>
            <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisi\u00f3n</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
      },
      // ── Dynamo gastos modal
      dynamo_gas_modal:{
        t:'Dynamo Finance \u2014 Gastos Operativos '+_year,s:'Presupuesto detallado por categor\u00eda',
        render:()=>{const nDyn=NOM_DIST.Dynamo||23000;return`<div class="m-kpi-row"><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">N\u00f3mina/Mes</div><div class="m-kpi-val">${fmtK(nDyn)}</div></div><div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">N\u00f3mina Anual</div><div class="m-kpi-val">${fmtK(nDyn*12)}</div></div><div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div></div>
          <table class="mbt"><thead><tr><th>Concepto</th><th>Categor\u00eda</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
            <tr><td class="bld">N\u00f3mina (asignada)</td><td><span style="font-size:.65rem;color:var(--muted)">N\u00f3mina</span></td><td class="mo neg">${fmt(nDyn)}</td><td class="mo neg">${fmt(nDyn*12)}</td></tr>
            <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(nDyn)}/mes</td><td class="mo bld neg">${fmt(nDyn*12)}/a\u00f1o</td></tr>
          </tbody></table>`;}
      },
      // ── Ingresos Wirebit
      ingresos:{
        t:'Wirebit \u2014 Modelo de Ingresos '+_year,s:'5 fuentes \u00b7 Presupuesto mensual \u00b7 TC $17.9',
        render:()=>{
          const rows=Object.entries(WB_ING).map(([k,v])=>{
            const tot=sum(v);
            return`<tr><td class="bld">${k}</td>${v.map(x=>`<td class="mo">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(tot)}</td></tr>`;
          }).join('');
          const totRow=`<tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL INGRESOS</td>${WB_ING_TOTAL.map(x=>`<td class="mo bld pos">${fmt(x)}</td>`).join('')}<td class="mo bld pos">${fmt(sum(WB_ING_TOTAL))}</td></tr>`;
          const costRows=Object.entries(WB_COSTOS).map(([k,v])=>`<tr><td class="bld" style="padding-left:18px">${k}</td>${v.map(x=>`<td class="mo neg">${x?fmt(x):'\u2014'}</td>`).join('')}<td class="mo neg">${fmt(sum(v))}</td></tr>`).join('');
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
        t:'Wirebit \u2014 Margen Bruto '+_year,s:'Ingresos vs Costos por mes',
        render:()=>{
          const canv=`<canvas id="m-chart1" height="160" style="margin-bottom:14px"></canvas>`;
          const rows=MO.map((m,i)=>{
            const mg=WB_MARGEN[i],pct=WB_ING_TOTAL[i]?((mg/WB_ING_TOTAL[i])*100).toFixed(1)+'%':'\u2014';
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
      // ── N\u00f3mina
      nomina:{
        t:'N\u00f3mina Compartida \u2014 Distribuci\u00f3n '+_year,s:'11 empleados \u00b7 Asignaci\u00f3n por empresa',
        render:()=>{
          const rows=NOM.map(e=>{
            const dists=Object.entries(e.dist).filter(([,p])=>p>0).map(([co,p])=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:5px"><span style="width:7px;height:7px;border-radius:50%;background:${{Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'}[co]||'#aaa'};display:inline-block"></span><span style="font-size:.68rem">${co} ${(p*100).toFixed(0)}%</span></span>`).join('');
            return`<tr><td class="bld">${e.n}</td><td style="color:var(--muted);font-size:.75rem">${e.r}</td><td class="mo bld pos">${fmt(e.s)}</td><td>${dists}</td><td class="mo">${fmt(e.s*12)}</td></tr>`;
          }).join('');
          const distData=[{n:'Salem',v:NOM_DIST.Salem||0,c:'#0073ea'},{n:'Endless',v:NOM_DIST.Endless||0,c:'#00b875'},{n:'Dynamo',v:NOM_DIST.Dynamo||0,c:'#ff7043'},{n:'Wirebit',v:NOM_DIST.Wirebit||0,c:'#9b51e0'}];
          const distRows=distData.map(d=>`<tr><td class="bld"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:3px;background:${d.c};display:inline-block"></span>${d.n}</span></td><td class="mo pos">${fmt(d.v)}/mes</td><td class="mo pos">${fmt(d.v*12)}/a\u00f1o</td></tr>`).join('');
          const nomMensual=NOM.reduce((a,e)=>a+(e.s||0),0), nomCount=NOM.length, nomAvg=nomCount?Math.round(nomMensual/nomCount):0;
          return`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Total Mensual</div><div class="m-kpi-val">${fmtK(nomMensual)}</div></div>
            <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Total Anual</div><div class="m-kpi-val">${fmtK(nomMensual*12)}</div></div>
            <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Empleados</div><div class="m-kpi-val">${nomCount}</div></div>
            <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Promedio/mes</div><div class="m-kpi-val">${fmtK(nomAvg)}</div></div>
          </div>
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empleado</div>
          <div style="overflow-x:auto;margin-bottom:16px"><table class="mbt"><thead><tr><th>Nombre</th><th>Rol</th><th class="r">Sueldo/Mes</th><th>Distribuci\u00f3n</th><th class="r">Anual</th></tr></thead><tbody>${rows}</tbody></table></div>
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Empresa</div>
          <table class="mbt"><thead><tr><th>Empresa</th><th class="r">Mensual</th><th class="r">Anual</th></tr></thead><tbody>${distRows}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL GRUPO</td><td class="mo bld pos">${fmtK(nomMensual)}/mes</td><td class="mo bld pos">${fmtK(nomMensual*12)}/a\u00f1o</td></tr>
          </tbody></table>`;
        }
      },
      // ── Gastos Compartidos
      gastos_comp_kpi:{
        t:'Gastos Compartidos \u2014 Detalle Ene\u2013Ago',s:'18 conceptos \u00b7 Distribuci\u00f3n por empresa',
        render:()=>{
          const monthly=Array(8).fill(0);
          GCOMP.forEach(g=>g.vals.forEach((v,i)=>monthly[i]+=v));
          const catMap={};
          GCOMP.forEach(g=>{catMap[g.cat]=(catMap[g.cat]||0)+sum(g.vals);});
          const catRows=Object.entries(catMap).sort((a,b)=>b[1]-a[1])
            .map(([k,v])=>`<tr><td class="bld">${k}</td><td class="mo neg">${fmt(v)}</td><td class="mo">${((v/sum(Object.values(catMap)))*100).toFixed(1)}%</td></tr>`).join('');
          const rows=GCOMP.map(g=>{
            const tot=sum(g.vals);
            const ents=[g.sal>0?`SAL ${g.sal*100|0}%`:'',g.end>0?`END ${g.end*100|0}%`:'',g.dyn>0?`DYN ${g.dyn*100|0}%`:'',g.wb>0?`WB ${g.wb*100|0}%`:''].filter(Boolean).join(' \u00b7 ');
            return`<tr><td class="bld">${g.c}</td><td style="color:var(--muted);font-size:.72rem">${g.cat}</td><td style="font-size:.7rem;color:var(--text2)">${ents}</td>${g.vals.map(v=>`<td class="mo neg">${v?fmt(v):'\u2014'}</td>`).join('')}<td class="mo bld neg">${fmt(tot)}</td></tr>`;
          }).join('');
          const acum=sum(monthly), avgMes=monthly.length?Math.round(acum/monthly.length):0;
          const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
          return`<div class="m-kpi-row">
            <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Acumulado Ene\u2013Ago</div><div class="m-kpi-val" style="color:var(--orange)">${acum?fmtK(acum):'Sin datos'}</div></div>
            <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Mayor Categor\u00eda</div><div class="m-kpi-val" style="font-size:.85rem">${topCat?topCat[0]:'Pendiente'}</div></div>
            <div class="m-kpi" style="--ac:var(--blue)"><div class="m-kpi-lbl">Ppto/Mes Promedio</div><div class="m-kpi-val">${avgMes?fmtK(avgMes):'Sin datos'}</div></div>
          </div>
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Por Categor\u00eda</div>
          <div style="overflow-x:auto;margin-bottom:16px"><table class="mbt"><thead><tr><th>Categor\u00eda</th><th class="r">Total</th><th class="r">% del Total</th></tr></thead><tbody>${catRows}</tbody></table></div>
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Detalle por Concepto</div>
          <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Concepto</th><th>Cat.</th><th>Distribuci\u00f3n</th>${MO.slice(0,8).map(m=>`<th class="r">${m}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
      },
      // ── Salem detalle
      salem_kpi:{
        t:'Salem Internacional \u2014 Resumen Ejecutivo',s:'TPV \u00b7 Fondeo Tarjetas Centum Black',
        render:()=>{
          const total=SAL_GASTOS_ITEMS.reduce((s,g)=>s+g.ppto,0);
          const gasRows=SAL_GASTOS_ITEMS.filter(g=>g.ppto>0).map(g=>`<tr><td class="bld">${g.c}</td><td style="color:var(--muted);font-size:.75rem">${g.cat}</td><td class="mo neg">${fmt(g.ppto)}</td><td class="mo neg">${fmt(g.ppto*12)}</td></tr>`).join('');
          const nomSal=NOM_DIST.Salem||186000;
          return`<div class="m-kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">N\u00f3mina Asignada</div><div class="m-kpi-val">${fmtK(nomSal)}/mes</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Otros Gastos</div><div class="m-kpi-val" style="color:var(--muted)">${(total-nomSal)>0?fmtK(total-nomSal)+'/mes':'Sin datos'}</div></div>
          <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Ingresos</div><div class="m-kpi-val" style="color:var(--muted)">Sin datos</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Gastos con Datos</div>
        <table class="mbt"><thead><tr><th>Concepto</th><th>Categor\u00eda</th><th class="r">Ppto/Mes</th><th class="r">Anual Est.</th></tr></thead><tbody>
          ${gasRows}
          <tr style="border-top:2px solid var(--border2)"><td class="bld">TOTAL</td><td></td><td class="mo bld neg">${fmt(total)}/mes</td><td class="mo bld neg">${fmt(total*12)}/a\u00f1o</td></tr>
        </tbody></table>
        <div style="margin-top:12px;text-align:right"><button class="btn btn-blue modal-nav-btn" data-nav="sal_res" style="font-size:.73rem">Ver P&L completo \u2192</button></div>`;
        }
      },
      // ── Endless detalle
      endless_kpi:{
        t:'Endless Money \u2014 Resumen Ejecutivo',s:'Cr\u00e9dito Simple \u00b7 Tarjetas Centum Blue \u00b7 SOFOM CNBV',
        render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#00b875">$3.1M</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">Ingreso Anual Est.</div><div class="m-kpi-val">$23.2K</div></div>
          <div class="m-kpi" style="--ac:#00b875"><div class="m-kpi-lbl">N\u00f3mina Asignada</div><div class="m-kpi-val">$23K/mes</div></div>
          <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$3M</div></div>
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Cartera de Cr\u00e9ditos</div>
        <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisi\u00f3n</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
          ${END_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c),sp=spill(c.st);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'\u2014'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'\u2014'}</td><td>${sp}</td></tr>`;}).join('')}
        </tbody></table>
        <div style="margin-top:12px;text-align:right"><button class="btn btn-green modal-nav-btn" data-nav="end_res" style="font-size:.73rem">Ver P&L completo \u2192</button></div>`
      },
      // ── Dynamo detalle
      dynamo_kpi:{
        t:'Dynamo Finance \u2014 Resumen Ejecutivo',s:'Cr\u00e9dito Simple \u00b7 SOFOM regulada CNBV',
        render:()=>`<div class="m-kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">Cartera Total</div><div class="m-kpi-val" style="color:#ff7043">$2.6M</div></div>
          <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Cartera Vencida</div><div class="m-kpi-val" style="color:var(--red)">$2.5M</div></div>
          <div class="m-kpi" style="--ac:#ff7043"><div class="m-kpi-lbl">N\u00f3mina Asignada</div><div class="m-kpi-val">$23K/mes</div></div>
          <div class="m-kpi" style="--ac:var(--yellow)"><div class="m-kpi-lbl">Pipeline</div><div class="m-kpi-val">$2.25M</div></div>
        </div>
        <div style="background:var(--red-bg);border:1px solid var(--red-lt);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:var(--red)">
          \u26a0\ufe0f <strong>Alerta:</strong> Juan Manuel de la Colina \u2014 $2.5M en cartera vencida. Representa el 96% de la cartera activa de Dynamo.
        </div>
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Cartera de Cr\u00e9ditos</div>
        <table class="mbt"><thead><tr><th>Cliente</th><th class="r">Monto</th><th>Plazo</th><th>Tasa</th><th>Comisi\u00f3n</th><th class="r">Int/Mes</th><th class="r">Ing. Anual</th><th>Status</th></tr></thead><tbody>
          ${DYN_CREDITS.map(c=>{const im=credIntMes(c),ia=credIngAnual(c),sp=spill(c.st);return`<tr><td class="bld">${c.cl}</td><td class="mo bld">${fmt(c.monto)}</td><td>${c.plazo} ${c.vencimiento||''}</td><td>${c.tasa}%</td><td>${c.com||0}%</td><td class="mo ${im?'pos':''}">${im?fmt(im):'\u2014'}</td><td class="mo ${ia?'pos':''}">${ia?fmt(ia):'\u2014'}</td><td>${sp}</td></tr>`;}).join('')}
        </tbody></table>
        <div style="margin-top:12px;text-align:right"><button class="btn btn-out modal-nav-btn" data-nav="dyn_res" style="border-color:#ff7043;color:#ff7043;font-size:.73rem">Ver P&L completo \u2192</button></div>`
      },
      // ── Wirebit detalle
      wirebit_kpi:{
        t:'Wirebit \u2014 Resumen Ejecutivo '+_year,s:'Exchange \u00b7 VEX \u00b7 OTC \u00b7 Tarjetas Cripto',
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
            <div class="m-kpi" style="--ac:#9b51e0"><div class="m-kpi-lbl">Inicio \u2192 Fin</div><div class="m-kpi-val" style="font-size:.9rem">${(WB_ING_TOTAL[0]||WB_ING_TOTAL[11])?fmtK(WB_ING_TOTAL[0])+' \u2192 '+fmtK(WB_ING_TOTAL[11]):'Sin datos'}</div></div>
            <div class="m-kpi" style="--ac:${ebitda>=0?'var(--green)':'var(--red)'}"><div class="m-kpi-lbl">EBITDA Anual Est.</div><div class="m-kpi-val" style="color:${ebitda>=0?'var(--green)':'var(--red)'};font-size:.88rem">${ingAnual?fmtK(ebitda):'Pendiente'}</div></div>
            <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">N\u00f3mina Anual WB</div><div class="m-kpi-val">${fmtK(nomAnual)}</div></div>
          </div>
          ${canv}
          <div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Directos</th><th class="r">N\u00f3mina</th><th class="r">EBITDA</th></tr></thead><tbody>${rows}</tbody></table></div>
          <div style="margin-top:12px;text-align:right"><button class="btn btn-blue modal-nav-btn" data-nav="wb_res" style="font-size:.73rem;background:#9b51e0;border-color:#9b51e0">Ver P&L completo \u2192</button></div>`;
        }
      },
      // ── WB Ingresos chart
      wb_ingresos_chart:{
        t:'Wirebit \u2014 Ingresos vs Costos Detallado',s:'Presupuesto mensual '+_year,
        render:()=>{
          const canv=`<canvas id="m-chart1" height="200" style="margin-bottom:16px"></canvas>`;
          setTimeout(()=>{
            dc('m-chart1');
            CH['m-chart1']=new Chart(document.getElementById('m-chart1'),{type:'line',data:{labels:MO,datasets:[
              {label:'Total Ingresos',data:WB_ING_TOTAL,borderColor:'#9b51e0',backgroundColor:'rgba(155,81,224,.08)',fill:true,tension:.4,pointRadius:4,borderWidth:2.5},
              {label:'Costos Directos',data:WB_COSTO_TOTAL,borderColor:'#ff7043',backgroundColor:'rgba(255,112,67,.06)',fill:true,tension:.4,pointRadius:4,borderWidth:2},
              {label:'N\u00f3mina WB',data:WB_NOM_TOTAL,borderColor:'#0073ea',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[5,3]},
            ]},options:cOpts()});
          },50);
          const rows=MO.map((m,i)=>{
            const mg=WB_MARGEN[i],ebitda=mg-WB_NOM_TOTAL[i];
            return`<tr><td class="bld">${m}</td><td class="mo pos">${fmt(WB_ING_TOTAL[i])}</td><td class="mo neg">${fmt(WB_COSTO_TOTAL[i])}</td><td class="mo ${mg>=0?'pos':'neg'}">${fmt(mg)}</td><td class="mo neg">${fmt(WB_NOM_TOTAL[i])}</td><td class="mo ${ebitda>=0?'pos':'neg'}">${fmt(ebitda)}</td></tr>`;
          }).join('');
          return canv+`<div style="overflow-x:auto"><table class="mbt"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Costos Dir.</th><th class="r">Margen Bruto</th><th class="r">N\u00f3mina</th><th class="r">EBITDA</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
      },
      // ── WB Fuentes chart
      wb_fuentes_chart:{
        t:'Wirebit \u2014 Mix de Ingresos por Fuente',s:'Distribuci\u00f3n anual presupuestada '+_year,
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

  function spill(st){
    if(st==='Activo') return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--green-lt);color:#007a48">Activo</span>`;
    if(st.includes('VENCIDO')) return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--red-lt);color:#b02020">\u26a0 VENCIDO</span>`;
    return`<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.63rem;font-weight:700;background:var(--yellow-lt);color:#7a6000">Prospecto</span>`;
  }

  // ═══════════════════════════════════════
  // CUSTOM CONFIRM (from creditos.js)
  // ═══════════════════════════════════════
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

  // ═══════════════════════════════════════
  // FILE UPLOAD (from creditos.js)
  // ═══════════════════════════════════════
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
        lu.innerHTML=`\u2705 <b>${f.name}</b>`;
        toast('\u2705 Excel cargado: '+f.name+' ('+wb.SheetNames.length+' hojas)');
        render(document.querySelector('.view.active').id.replace('view-',''));
      }catch(err){toast('\u274c '+err.message);}
    };
    r.readAsArrayBuffer(f); ev.target.value='';
  }

  // ═══════════════════════════════════════
  // SIDEBAR TOGGLE (from creditos.js)
  // ═══════════════════════════════════════
  function toggleSidebar(){
    const shell = document.getElementById('sb-shell');
    const main  = document.getElementById('main');
    const collapsed = shell.classList.toggle('collapsed');
    main.classList.toggle('sb-hidden', collapsed);
    updateToggleBtn();
    setTimeout(resizeCharts, 250);
  }

  function updateToggleBtn(){
    const btn = document.getElementById('sb-toggle');
    const collapsed = document.getElementById('sb-shell').classList.contains('collapsed');
    btn.style.left = collapsed ? '8px' : '80px';
    btn.textContent = collapsed ? '\u203a' : '\u2039';
    btn.title = collapsed ? 'Mostrar menu' : 'Ocultar menu';
  }

  function resizeCharts(){
    Object.values(CH).forEach(c=>{ try{c.resize();}catch(e){} });
  }

  // ═══════════════════════════════════════
  // EXPORT HTML (from creditos.js)
  // ═══════════════════════════════════════
  function exportHTML(){
    // Use stored source (set at load time)
    if(!window._htmlSource){
      toast('\u26a0\ufe0f Fuente no disponible, intenta recargar la pagina');
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
    a.download = 'GF-Dashboard-' + new Date().toISOString().slice(0,10) + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('\u2705 HTML exportado con todos los datos');
  }

  // ═══════════════════════════════════════
  // refreshActivePL (from finanzas.js)
  // ═══════════════════════════════════════
  function refreshActivePL(){
    const active = document.querySelector('.view.active');
    if(!active) return;
    const vid = active.id.replace('view-','');
    const plMap = {sal_res:'sal',end_res:'end',dyn_res:'dyn',wb_res:'wb'};
    if(plMap[vid]){ rPL(plMap[vid]); rPLCharts(plMap[vid]); }
    // Also refresh flujo tables if active
    if(vid==='flujo_ing') rFlujoIng();
    if(vid==='flujo_gas') rFlujoGas();
  }

  // ═══════════════════════════════════════
  // openTopGastos / closeTopGastos (from finanzas.js)
  // ═══════════════════════════════════════
  function openTopGastos(entity) {
    const ov = document.getElementById('top-gastos-overlay');
    if (!ov) return;
    ov.style.display = 'flex';

    const tbody = document.getElementById('top-gas-tbody');
    const kpisDiv = document.getElementById('top-gas-kpis');
    const subDiv = document.getElementById('top-gas-subtitle');
    const thEnt = document.getElementById('top-gas-th-ent');

    // Show/hide entity column
    if (thEnt) thEnt.style.display = entity ? 'none' : '';

    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Cargando...</td></tr>';

    try {
      // 1. Filter S.recs for gastos (exclude shared sources) + year
      let gastos = (S.recs || []).filter(r => !r.isSharedSource && r.tipo === 'gasto' && r.yr==_year);

      // 2. If entity specified, filter
      if (entity) gastos = gastos.filter(r => r.ent === entity);

      // 3. Aggregate by concepto + ent
      const map = {};
      gastos.forEach(r => {
        const key = (r.concepto || '?') + '|' + (r.ent || '?');
        if (!map[key]) map[key] = { concepto: r.concepto || '?', ent: r.ent || '?', cat: r.cat || '-', total: 0 };
        map[key].total += (r.vals || []).reduce((a, v) => a + (v || 0), 0);
      });

      // 4. Sort descending and take top 10
      const sorted = Object.values(map).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
      const top10 = sorted.slice(0, 10);
      const totalGas = sorted.reduce((s, r) => s + r.total, 0);
      const top10Tot = top10.reduce((s, r) => s + r.total, 0);
      const top10Pct = totalGas > 0 ? (top10Tot / totalGas * 100).toFixed(1) : '0';

      // 5. Handle empty state
      if (!sorted.length) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Sin gastos capturados</td></tr>';
        if (kpisDiv) kpisDiv.innerHTML = '';
        if (subDiv) subDiv.textContent = entity ? 'Gastos \u00b7 ' + entity : 'Gastos por empresa \u00b7 Grupo';
        return;
      }

      // 6. Subtitle
      if (subDiv) subDiv.textContent = entity
        ? 'Gastos \u00b7 ' + entity + ' \u00b7 ' + sorted.length + ' conceptos'
        : 'Gastos por empresa \u00b7 Grupo \u00b7 ' + sorted.length + ' conceptos';

      // 7. KPI chips
      if (kpisDiv) {
        kpisDiv.innerHTML = `
          <div style="background:var(--orange-bg);color:var(--orange);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
            Total: ${fmtK(totalGas)}
          </div>
          <div style="background:var(--blue-bg);color:#0073ea;padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
            Top 10: ${fmtK(top10Tot)} (${top10Pct}%)
          </div>
          <div style="background:var(--purple-bg);color:var(--purple);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
            ${sorted.length} conceptos
          </div>`;
      }

      // 8. Render table rows
      const entColors = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
      if (tbody) {
        tbody.innerHTML = top10.map((r, i) => {
          const pct = totalGas > 0 ? (r.total / totalGas * 100).toFixed(1) : '0.0';
          const barW = top10[0] && top10[0].total > 0 ? (r.total / top10[0].total * 100).toFixed(0) : 0;
          const ec = entColors[r.ent] || '#555';
          return `<tr>
            <td style="font-weight:700;color:var(--orange)">${i + 1}</td>
            <td><b>${r.concepto}</b></td>
            ${entity ? '' : `<td><span style="color:${ec};font-weight:600">${r.ent}</span></td>`}
            <td style="color:var(--muted)">${r.cat}</td>
            <td style="text-align:right"><b style="color:var(--orange)">${fmtK(r.total)}</b>
              <div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px">
                <div style="height:100%;background:var(--orange);border-radius:2px;width:${barW}%"></div>
              </div>
            </td>
            <td style="text-align:right;font-weight:600">${pct}%</td>
          </tr>`;
        }).join('');
      }
    } catch (e) {
      console.error('[Gastos] openTopGastos error:', e);
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#e53935">Error al cargar datos</td></tr>';
    }
  }

  function closeTopGastos() {
    const ov = document.getElementById('top-gastos-overlay');
    if (ov) ov.style.display = 'none';
  }

  // ═══════════════════════════════════════
  // selOpts (from finanzas.js)
  // ═══════════════════════════════════════
  function selOpts(arr, cur){ return arr.map(o=>`<option${o===cur?' selected':''}>${o}</option>`).join(''); }

  // Expose globals
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.spill = spill;
  window.customConfirm = customConfirm;
  window.loadFile = loadFile;
  window.toggleSidebar = toggleSidebar;
  window.updateToggleBtn = updateToggleBtn;
  window.resizeCharts = resizeCharts;
  window.exportHTML = exportHTML;
  window.refreshActivePL = refreshActivePL;
  window.openTopGastos = openTopGastos;
  window.closeTopGastos = closeTopGastos;
  window.selOpts = selOpts;

  // ── Event delegation: modal nav buttons (closeModal + navTo) ──
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.modal-nav-btn');
    if(btn && btn.dataset.nav){
      closeModal();
      navTo(btn.dataset.nav);
    }
  });

})(window);
