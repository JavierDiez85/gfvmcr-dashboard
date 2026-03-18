// GF — Creditos: Cobranza — seguimiento de pagos
(function(window) {
  'use strict';

  // ══════════════════════════════════════
  // COBRANZA — SEGUIMIENTO DE PAGOS
  // ══════════════════════════════════════
  function rCredCobr(entFilter, elPrefix){
    if(!elPrefix) elPrefix = 'cobr';

    // Period filter bar
    if(typeof gfpRender === 'function'){
      const viewId = entFilter==='dyn' ? 'dyn_cobr' : 'cred_cobr';
      const color = entFilter==='dyn' ? '#ff7043' : '#00b875';
      gfpRender(elPrefix+'-pbar', {ent: entFilter||'end', color, type:'sub', years:['2025','2026'], viewId});
    }

    // Reload data
    try{const s=DB.get('gf_cred_end');if(s&&s.length>=END_CREDITS.length){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
    try{const s=DB.get('gf_cred_dyn');if(s&&s.length>=DYN_CREDITS.length){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}

    let all = [];
    if(!entFilter || entFilter==='end') all.push(...END_CREDITS.map(c=>({...c, _ent:'end', _entLabel:'Endless Money', _col:'#00b875'})));
    if(!entFilter || entFilter==='dyn') all.push(...DYN_CREDITS.map(c=>({...c, _ent:'dyn', _entLabel:'Dynamo Finance', _col:'#ff7043'})));
    all = all.filter(c=>c.st==='Activo'||c.st==='Vencido');

    // Aggregate
    let totalPorCobrar=0, cobranzaAlDia=0, cobranzaVencida=0;
    let totalPeriodos=0, periodosPagados=0;
    const clientData = [];

    all.forEach(c=>{
      const res = credCobranzaResumen(c);
      if(!res) return;
      const pendienteMonto = (c.amort||[]).slice(1)
        .filter(r=>credPeriodStatus(c,r)==='PENDIENTE')
        .reduce((s,r)=>s+(r.pago||0),0);
      totalPorCobrar += res.montoVencido + pendienteMonto;
      cobranzaAlDia += res.montoPagado;
      cobranzaVencida += res.montoVencido;
      totalPeriodos += res.total;
      periodosPagados += res.pagado;

      const prox = credProximoPago(c);
      clientData.push({
        ...c, _resumen:res, _prox:prox,
        _diasAtraso: res.maxAtraso,
        _statusLabel: res.vencido>0?'Vencido' : res.parcial>0?'Parcial' : res.pagado===res.total?'Pagado' : 'Al dia'
      });
    });

    const cumplimiento = totalPeriodos>0 ? ((periodosPagados/totalPeriodos)*100).toFixed(1) : '0';

    _cobrKPIs(totalPorCobrar, cobranzaAlDia, cobranzaVencida, cumplimiento, elPrefix);
    _cobrCharts(clientData, elPrefix);
    _cobrRenderList(clientData, elPrefix);
  }

  function _cobrKPIs(totalPorCobrar, alDia, vencida, cumplimiento, elPrefix){
    if(!elPrefix) elPrefix = 'cobr';
    const el = document.getElementById(elPrefix+'-kpis');
    if(!el) return;
    const _c = k => `
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--rlg);padding:14px 16px;border-top:3px solid ${k.color}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:.7rem;font-weight:600;color:var(--text2)">${k.lbl}</div>
          <div style="width:28px;height:28px;border-radius:8px;background:${k.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${k.ico}</div>
        </div>
        <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.1rem;color:${k.color}">${k.val}</div>
        <div style="font-size:.67rem;color:var(--muted);margin-top:3px">${k.sub}</div>
      </div>`;
    const pct = parseFloat(cumplimiento);
    el.innerHTML = [
      { lbl:'Total por Cobrar', val:fmtK(totalPorCobrar), sub:'Pendiente + Vencido', ico:'💰', color:'#0073ea', bg:'var(--blue-bg)' },
      { lbl:'Cobranza al Dia', val:fmtK(alDia), sub:'Pagos recibidos', ico:'✅', color:'var(--green)', bg:'var(--green-bg)' },
      { lbl:'Cobranza Vencida', val:fmtK(vencida), sub:vencida>0?'Requiere atencion':'Sin vencidos', ico:'🚨', color:vencida>0?'var(--red)':'var(--green)', bg:vencida>0?'var(--red-bg)':'var(--green-bg)' },
      { lbl:'% Cumplimiento', val:cumplimiento+'%', sub:'Periodos pagados vs total', ico:'📊', color:pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--red)', bg:pct>=80?'var(--green-bg)':pct>=50?'var(--orange-bg)':'var(--red-bg)' }
    ].map(_c).join('');
  }

  function _cobrCharts(clientData, elPrefix){
    if(!elPrefix) elPrefix = 'cobr';
    const totalPagado = clientData.reduce((s,c)=>s+(c._resumen?.pagado||0),0);
    const totalParcial = clientData.reduce((s,c)=>s+(c._resumen?.parcial||0),0);
    const totalVencido = clientData.reduce((s,c)=>s+(c._resumen?.vencido||0),0);
    const totalPendiente = clientData.reduce((s,c)=>s+(c._resumen?.pendiente||0),0);

    const _ck1 = elPrefix+'-st';
    const _ck2 = elPrefix+'-venc';
    dc(_ck1);
    const _cs = document.getElementById('c-'+elPrefix+'-status');
    if(!_cs) return;
    CH[_ck1] = new Chart(_cs,{
      type:'bar',
      data:{
        labels:['Pagados','Parciales','Vencidos','Pendientes'],
        datasets:[{
          data:[totalPagado,totalParcial,totalVencido,totalPendiente],
          backgroundColor:['rgba(0,184,117,.22)','rgba(255,160,0,.22)','rgba(234,57,67,.22)','rgba(0,115,234,.22)'],
          borderColor:['#00b875','#ffa000','#ea3943','#0073ea'],
          borderWidth:1.5, borderRadius:4
        }]
      },
      options:{...cOpts(), indexAxis:'y',
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw+' periodos'}}},
        scales:{
          x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{stepSize:1,color:'#b0b4d0',font:{size:9}}},
          y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}
        }
      }
    });

    const vencidos = clientData
      .filter(c=>c._resumen&&c._resumen.montoVencido>0)
      .sort((a,b)=>b._resumen.montoVencido-a._resumen.montoVencido)
      .slice(0,5);

    dc(_ck2);
    const _cv = document.getElementById('c-'+elPrefix+'-vencida');
    if(!_cv) return;
    CH[_ck2] = new Chart(_cv,{
      type:'bar',
      data:{
        labels:vencidos.length>0 ? vencidos.map(c=>c.cl) : ['Sin vencidos'],
        datasets:[{
          data:vencidos.length>0 ? vencidos.map(c=>c._resumen.montoVencido) : [0],
          backgroundColor:'rgba(234,57,67,.22)',
          borderColor:'#ea3943',
          borderWidth:1.5, borderRadius:4
        }]
      },
      options:{...cOpts(), indexAxis:'y',
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmtFull(ctx.raw)}}},
        scales:{
          x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:9},callback:v=>fmtK(v)}},
          y:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}}
        }
      }
    });
  }

  function _cobrRenderList(clientData, elPrefix){
    if(!elPrefix) elPrefix = 'cobr';
    const listEl = document.getElementById(elPrefix+'-list');
    const countEl = document.getElementById(elPrefix+'-count');
    if(!listEl) return;
    if(countEl) countEl.textContent = clientData.length;

    if(!clientData.length){
      listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:.82rem">
        <div style="font-size:2rem;margin-bottom:10px">✅</div>
        No hay creditos activos para seguimiento de cobranza.
      </div>`;
      return;
    }

    const sorted = [...clientData].sort((a,b)=>{
      if(a._statusLabel==='Vencido'&&b._statusLabel!=='Vencido') return -1;
      if(b._statusLabel==='Vencido'&&a._statusLabel!=='Vencido') return 1;
      return (b._diasAtraso||0)-(a._diasAtraso||0);
    });

    const stIco = {'Vencido':'🚨','Parcial':'⚠️','Al dia':'✅','Pagado':'🏁'};
    const stBg  = {'Vencido':'var(--red-bg)','Parcial':'var(--orange-bg)','Al dia':'var(--green-bg)','Pagado':'var(--purple-bg)'};
    const stCol = {'Vencido':'var(--red)','Parcial':'var(--orange)','Al dia':'var(--green)','Pagado':'var(--purple)'};

    listEl.innerHTML = sorted.map(c=>{
      const credits = c._ent==='end' ? END_CREDITS : DYN_CREDITS;
      const origIdx = credits.findIndex(x=>x.cl===c.cl);
      const proxFecha = c._prox ? c._prox.fecha : '—';
      const proxMonto = c._prox ? fmtFull(c._prox.pago) : '—';
      const sl = c._statusLabel;

      return `<div class="cobr-row" data-name="${(c.cl||'').toLowerCase()}"
        onclick="credOpenDetail('${c._ent}','${(c.cl||'').replace(/'/g,"\\'")}',${origIdx})"
        style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s"
        onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
        <div style="width:36px;height:36px;border-radius:10px;background:${stBg[sl]||'var(--bg)'};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${stIco[sl]||'📋'}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-weight:700;font-size:.82rem">${c.cl}</span>
            <span style="font-size:.56rem;font-weight:700;padding:1px 5px;border-radius:6px;background:${c._col}18;color:${c._col};border:1px solid ${c._col}35">${c._entLabel}</span>
          </div>
          <div style="font-size:.68rem;color:var(--muted)">${c._resumen.pagado}/${c._resumen.total} periodos pagados</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:100px">
          <div style="font-size:.78rem;font-weight:600">${proxFecha}</div>
          <div style="font-size:.62rem;color:var(--muted)">Proximo Pago</div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem">${proxMonto}</div>
          <div style="font-size:.62rem;color:var(--muted)">Monto</div>
        </div>
        <div style="text-align:center;flex-shrink:0;min-width:80px">
          <span style="font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:10px;background:${stBg[sl]||'var(--bg)'};color:${stCol[sl]||'var(--text)'}">${sl}</span>
          ${c._diasAtraso>0 ? `<div style="font-size:.6rem;color:var(--red);margin-top:2px;font-weight:600">${c._diasAtraso} dias</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:85px">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:${c._resumen.montoVencido>0?'var(--red)':'var(--green)'}">${fmtK(c._resumen.montoVencido)}</div>
          <div style="font-size:.62rem;color:var(--muted)">Vencido</div>
        </div>
        <div style="color:var(--muted);font-size:.9rem;flex-shrink:0">›</div>
      </div>`;
    }).join('');
  }

  function cobrFilter(q){
    const query = q.toLowerCase();
    document.querySelectorAll('#cobr-list .cobr-row').forEach(r=>{
      r.style.display = r.dataset.name.includes(query) ? '' : 'none';
    });
  }
  function dynCobrFilter(q){
    const query = q.toLowerCase();
    document.querySelectorAll('#dyn-cobr-list .cobr-row').forEach(r=>{
      r.style.display = r.dataset.name.includes(query) ? '' : 'none';
    });
  }

  // Expose globals
  window.rCredCobr      = rCredCobr;
  window._cobrKPIs      = _cobrKPIs;
  window._cobrCharts    = _cobrCharts;
  window._cobrRenderList = _cobrRenderList;
  window.cobrFilter     = cobrFilter;
  window.dynCobrFilter  = dynCobrFilter;

  // Register views
  if(typeof registerView === 'function'){
    registerView('cred_cobr', function(){ rCredCobr('end','cobr'); });
    registerView('dyn_cobr', function(){ rCredCobr('dyn','dyn-cobr'); });
  }

})(window);
