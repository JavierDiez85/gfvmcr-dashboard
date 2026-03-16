// GF — Flujo Engine: flujo de ingresos/gastos, sync, legacy data entry
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // STATE VARIABLES
  // ═══════════════════════════════════════
  let FI_ROWS = /*EMBED:FI_ROWS*/[]/*END:FI_ROWS*/; // [{id, concepto, ent, cat, yr, vals:[12], auto, credId}]
  let FG_ROWS = /*EMBED:FG_ROWS*/[]/*END:FG_ROWS*/; // [{id, concepto, ent, cat, yr, shared, gcConcept, vals:[12]}]

  const EMPRESAS  = ['Salem','Endless','Dynamo','Wirebit'];
  const ENT_COLOR = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};

  // ═══════════════════════════════════════
  // fiLoad / fgLoad (from finanzas.js)
  // ═══════════════════════════════════════
  function fiLoad(){
    try{ FI_ROWS = DB.get('gf_fi') || []; }catch(e){FI_ROWS=[];}
    // Reinject creditos automaticos
    fiInjectCredits();
  }
  function fgLoad(){
    try{ FG_ROWS = DB.get('gf_fg') || []; }catch(e){FG_ROWS=[];}
  }

  // ═══════════════════════════════════════
  // fiInjectCredits (from finanzas.js)
  // ═══════════════════════════════════════
  function fiInjectCredits(){
    // Quitar filas auto anteriores
    FI_ROWS = FI_ROWS.filter(r => !r.auto);
    const allCredits = [
      ...END_CREDITS.filter(c=>c.st==='Activo').map(c=>({...c, ent:'Endless'})),
      ...DYN_CREDITS.filter(c=>c.st==='Activo').map(c=>({...c, ent:'Dynamo'})),
    ];
    allCredits.forEach(cr => {
      const vals = Array(12).fill(0);
      let hasAmort = false;

      // Usar tabla de amortizacion real si existe
      if(cr.amort && cr.amort.length > 1){
        hasAmort = true;
        cr.amort.slice(1).forEach(row => {
          const fecha = (typeof credParseDate==='function') ? credParseDate(row.fecha) : null;
          if(!fecha || fecha.getFullYear() !== _year) return;
          vals[fecha.getMonth()] += Math.round(row.int || 0);
        });
      }

      // Fallback: formula simplificada si no hay tabla de amortizacion
      if(!hasAmort){
        const intMes = Math.round(cr.monto * (cr.tasa/100) / 12);
        if(!intMes) return;
        vals.fill(intMes);
      }

      if(!vals.some(v => v > 0)) return;

      // Intereses
      FI_ROWS.unshift({
        id: 'cred_int_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
        concepto: 'Intereses \u2014 '+cr.cl,
        ent: cr.ent,
        cat: 'Cr\u00e9dito Simple',
        yr: String(_year),
        vals: vals,
        auto: true,
        credId: cr.cl,
        note: `${cr.tasa}% anual \u00b7 ${fmt(cr.monto)}` + (hasAmort ? ' \u00b7 amort' : ' \u00b7 f\u00f3rmula')
      });

      // Comision de apertura — en el mes real de desembolso
      if(cr.com && cr.com > 0){
        const comMonto = Math.round(cr.monto * cr.com / 100);
        const comVals = Array(12).fill(0);
        const dDate = (typeof credParseDate==='function') ? credParseDate(cr.disbDate) : null;
        const comMonth = (dDate && dDate.getFullYear() === _year) ? dDate.getMonth() : 0;
        comVals[comMonth] = comMonto;
        FI_ROWS.unshift({
          id: 'cred_com_'+cr.cl.replace(/[^a-zA-Z0-9]/g,'_'),
          concepto: 'Comisi\u00f3n Apertura \u2014 '+cr.cl,
          ent: cr.ent,
          cat: 'Cr\u00e9dito Simple',
          yr: String(_year),
          vals: comVals,
          auto: true,
          credId: cr.cl,
          note: cr.com + '% comisi\u00f3n'
        });
      }
    });
  }

  // ═══════════════════════════════════════
  // fiInjectTPV (from finanzas.js)
  // ═══════════════════════════════════════
  function fiInjectTPV(){
    // Quitar filas auto TPV anteriores
    FI_ROWS = FI_ROWS.filter(r => !r.autoTPV);
    FG_ROWS = FG_ROWS.filter(r => !r.autoTPV);

    const year = String(_year);
    const data = (typeof TPV !== 'undefined' && TPV.monthlyPLData)
      ? TPV.monthlyPLData(year) : null;
    if (!data || !data.monthly) return;

    const vals_salem = data.monthly.map(m => Math.round(m.com_salem || 0));
    const vals_promo = data.monthly.map(m => Math.round(m.com_comisionista || 0));
    const vals_internas = data.monthly.map(m => Math.round(m.com_agentes || 0));

    // Ingreso: Comisiones TPV (Salem)
    FI_ROWS.unshift({
      id: 'tpv_com_salem',
      concepto: 'Comisiones TPV (auto)',
      ent: 'Salem',
      cat: 'TPV',
      yr: year,
      vals: vals_salem,
      autoTPV: true,
      note: 'Auto-inyectado desde datos TPV'
    });

    // Gasto: Comisiones Promotoria (external promoters)
    FG_ROWS.unshift({
      id: 'tpv_com_promo',
      concepto: 'Comisiones Promotor\u00eda TPV',
      ent: 'Salem',
      cat: 'TPV Comisiones',
      yr: year,
      vals: vals_promo,
      autoTPV: true,
      note: 'Auto-inyectado desde datos TPV'
    });

    // Gasto: Comisiones Internas (agent commissions)
    FG_ROWS.unshift({
      id: 'tpv_com_internas',
      concepto: 'Comisiones Internas TPV',
      ent: 'Salem',
      cat: 'TPV Comisiones',
      yr: year,
      vals: vals_internas,
      autoTPV: true,
      note: 'Auto-inyectado desde datos TPV'
    });
  }

  // ═══════════════════════════════════════
  // fiCalcTotals / fgCalcTotals (from finanzas.js)
  // ═══════════════════════════════════════
  function fiCalcTotals(){
    const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
    const moTots = Array(12).fill(0);
    FI_ROWS.forEach(r => {
      r.vals.forEach((v,i) => { moTots[i] += v; kpis[r.ent] = (kpis[r.ent]||0)+v; kpis.total += v; });
    });
    return {kpis, moTots};
  }

  function fgCalcTotals(){
    const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
    const moTots = Array(12).fill(0);
    FG_ROWS.forEach(r => {
      r.vals.forEach((v,i) => { moTots[i] += v; kpis[r.ent] = (kpis[r.ent]||0)+v; kpis.total += v; });
    });
    return {kpis, moTots};
  }

  // ═══════════════════════════════════════
  // flRowUpdate (from finanzas.js)
  // ═══════════════════════════════════════
  function flRowUpdate(type, rowId, moIdx, val){
    const rows = type==='fi' ? FI_ROWS : FG_ROWS;
    const row = rows.find(r=>r.id===rowId);
    if(!row) return;
    row.vals[moIdx] = val||0;
    flUpdateFooter(type);
    flUpdateKPIs(type);
  }

  // ═══════════════════════════════════════
  // flUpdateFooter (from finanzas.js)
  // ═══════════════════════════════════════
  function flUpdateFooter(type){
    const rows = type==='fi' ? FI_ROWS : FG_ROWS;
    const _MO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const moTots = Array(12).fill(0);
    rows.forEach(r => r.vals.forEach((v,i) => moTots[i] += v));
    _MO.forEach((m,i) => {
      const el = document.getElementById(`${type}-ft-${m}`);
      if(el) el.textContent = moTots[i] ? fmt(moTots[i]) : '\u2014';
    });
    const tot = moTots.reduce((a,b)=>a+b,0);
    const el = document.getElementById(`${type}-ft-total`);
    if(el) el.textContent = tot ? fmt(tot) : '\u2014';
  }

  // ═══════════════════════════════════════
  // flUpdateKPIs (from finanzas.js)
  // ═══════════════════════════════════════
  function flUpdateKPIs(type){
    const rows = type==='fi' ? FI_ROWS : FG_ROWS;
    const kpis = {total:0, Salem:0, Endless:0, Dynamo:0, Wirebit:0};
    rows.forEach(r => r.vals.forEach(v => { kpis[r.ent]=(kpis[r.ent]||0)+v; kpis.total+=v; }));
    const pfx = type;
    const qk = id => document.getElementById(id);
    if(qk(`${pfx}-kpi-total`)) qk(`${pfx}-kpi-total`).textContent = fmtK(kpis.total);
    if(qk(`${pfx}-kpi-n`))     qk(`${pfx}-kpi-n`).textContent = rows.length+(type==='fi'?' conceptos':' conceptos');
    if(qk(`${pfx}-kpi-sal`))   qk(`${pfx}-kpi-sal`).textContent = fmtK(kpis.Salem||0);
    if(qk(`${pfx}-kpi-end`))   qk(`${pfx}-kpi-end`).textContent = fmtK(kpis.Endless||0);
    if(qk(`${pfx}-kpi-dyn`))   qk(`${pfx}-kpi-dyn`).textContent = fmtK(kpis.Dynamo||0);
    if(qk(`${pfx}-kpi-wb`))    qk(`${pfx}-kpi-wb`).textContent  = fmtK(kpis.Wirebit||0);
    // row count badge
    const rc = document.getElementById(`${pfx}-row-count`);
    if(rc) rc.textContent = rows.length+' filas';
  }

  // ═══════════════════════════════════════
  // syncFlujoToRecs (from finanzas.js)
  // ═══════════════════════════════════════
  function syncFlujoToRecs(){
    // Limpiar recs previos generados por flujos (no los de addRec legacy)
    S.recs = S.recs.filter(r => !r.fromFlujo);

    // Ingresos
    FI_ROWS.forEach(r => {
      if(!r.concepto && !r.auto && !r.autoTPV) return;
      S.recs.push({
        id: 'fi_'+r.id,
        tipo: 'ingreso',
        concepto: r.concepto,
        ent: r.ent,
        cat: r.cat,
        yr: r.yr,
        vals: [...r.vals],
        fromFlujo: true,
        auto: r.auto||false
      });
    });

    // Gastos
    FG_ROWS.forEach(r => {
      if(!r.concepto) return;
      if(r.shared && r.gcConcept){
        // Distribuir segun GC_EDIT
        const gc = GC_EDIT.find(g=>g.c===r.gcConcept);
        if(gc){
          const dist = [{k:'Salem',p:gc.sal},{k:'Endless',p:gc.end},{k:'Dynamo',p:gc.dyn},{k:'Wirebit',p:gc.wb}].filter(d=>d.p>0);
          dist.forEach(d => {
            S.recs.push({
              id: 'fg_'+r.id+'_'+d.k,
              tipo: 'gasto',
              concepto: r.concepto,
              ent: d.k,
              cat: r.cat,
              yr: r.yr,
              vals: r.vals.map(v=>Math.round(v*d.p)),
              fromFlujo: true,
              shared: true,
              sharedFrom: r.ent,
              sharedPct: Math.round(d.p*100)
            });
          });
          return;
        }
      }
      S.recs.push({
        id: 'fg_'+r.id,
        tipo: 'gasto',
        concepto: r.concepto,
        ent: r.ent,
        cat: r.cat,
        yr: r.yr,
        vals: [...r.vals],
        fromFlujo: true
      });
    });

    // ── Wirebit upload fees -> S.recs ──
    const _WB_CAT = {
      'Fees Fondeo Tarjetas':'Tarjeta Wirebit',
      'Fees Fondeo Tarjeta CRM':'Tarjeta Wirebit',
      'Fees VEX Retail':'Exchange',
      'Fees VEX Ecommerce':'Exchange',
      'Fees Retiros / OTC':'OTC',
    };
    if(typeof WB_ING !== 'undefined'){
      for(const [concepto, vals] of Object.entries(WB_ING)){
        if(!vals.some(v=>v>0)) continue;
        S.recs.push({
          id: 'wb_fee_'+concepto.replace(/[^a-zA-Z0-9]/g,'_'),
          tipo: 'ingreso',
          concepto: concepto,
          ent: 'Wirebit',
          cat: _WB_CAT[concepto] || 'Exchange',
          yr: String(_year),
          vals: [...vals],
          fromFlujo: true
        });
      }
    }

    // ── Wirebit costos directos -> S.recs ──
    if(typeof WB_COSTO_TOTAL !== 'undefined' && WB_COSTO_TOTAL.some(v=>v>0)){
      const _WB_COST_MAP = {
        'Bitfinex':'Costo Directo','Lmax':'Costo Directo','Bitso':'Costo Directo',
        'Efevoo Fondeo':'Costo Directo','Efevoo Tarjetas':'Costo Directo',
        'Efevoo SaaS':'Costo Directo','Comisiones BBVA':'Com. Bancarias',
      };
      if(typeof WB_COSTOS !== 'undefined'){
        for(const [concepto, vals] of Object.entries(WB_COSTOS)){
          if(!vals.some(v=>v>0)) continue;
          S.recs.push({
            id: 'wb_cost_'+concepto.replace(/[^a-zA-Z0-9]/g,'_'),
            tipo: 'gasto',
            concepto: concepto,
            ent: 'Wirebit',
            cat: _WB_COST_MAP[concepto] || 'Costo Directo',
            yr: String(_year),
            vals: [...vals],
            fromFlujo: true
          });
        }
      }
    }

    DB.set('gf4', S.recs.filter(r=>!r.fromFlujo));
  }

  // ═══════════════════════════════════════
  // LEGACY DATA ENTRY (from finanzas.js)
  // ═══════════════════════════════════════
  function addRec(){} // replaced by fiAddRow / fgAddRow
  function renderReg(){} // replaced by rFlujoIng / rFlujoGas
  function clearData(){
    customConfirm('\u00bfBorrar todos los registros?', 'Borrar', (ok)=>{
      if(!ok) return;
      S.recs=[]; FI_ROWS=[]; FG_ROWS=[];
      DB.remove('gf4');
      DB.remove('gf_fi');
      DB.remove('gf_fg');
      refreshActivePL();
      toast('\ud83d\uddd1 Datos borrados');
    });
  }
  function delRec(id){
    S.recs=S.recs.filter(r=>String(r.id)!==String(id));
    DB.set('gf4', S.recs);
    refreshActivePL();
  }
  function expData(){
    if(typeof XLSX==='undefined'){toast('\u274c XLSX no disponible');return;}
    const all = [...FI_ROWS.map(r=>({...r,tipo:'ingreso'})), ...FG_ROWS.map(r=>({...r,tipo:'gasto'}))];
    const data = all.map(r=>({
      Tipo:r.tipo, Concepto:r.concepto, Empresa:r.ent, 'Categor\u00eda':r.cat, 'A\u00f1o':r.yr,
      ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
      'Total Anual': r.vals.reduce((a,b)=>a+b,0)
    }));
    const ws=XLSX.utils.json_to_sheet(data);
    const wb2=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2,ws,'Flujo GF');
    XLSX.writeFile(wb2,'GF_datos.xlsx');
  }

  // Expose FI_ROWS and FG_ROWS as window properties with getter/setter
  // so they remain the same references when mutated
  Object.defineProperty(window, 'FI_ROWS', {
    get: function() { return FI_ROWS; },
    set: function(v) { FI_ROWS = v; },
    configurable: true
  });
  Object.defineProperty(window, 'FG_ROWS', {
    get: function() { return FG_ROWS; },
    set: function(v) { FG_ROWS = v; },
    configurable: true
  });

  // Input helpers used by flujo-ingresos.js and flujo-gastos.js
  var inS = function(align, extra) {
    align = align || 'right'; extra = extra || '';
    return 'style="width:100%;border:none;background:transparent;font-size:.76rem;font-family:inherit;text-align:'+align+';padding:1px 2px;'+extra+'"';
  };
  var moInput = function(rowId, idx, v, isGas) {
    return '<input type="number" '+inS()+' value="'+(v||'')+'" placeholder="0" min="0" step="100"'+
      ' oninput="flRowUpdate(\''+(isGas?'fg':'fi')+'\','+rowId+','+idx+',+this.value)"'+
      ' style="width:100%;border:none;background:transparent;font-size:.75rem;text-align:right;padding:1px 2px;color:'+(isGas?'var(--orange)':'var(--green)')+'">';
  };

  // ═══════════════════════════════════════
  // Factura injection helpers (used by facturacion-egresos.js)
  // ═══════════════════════════════════════
  function _ceCleanFGRows(){
    FG_ROWS = FG_ROWS.filter(function(r){ return !r.autoFactura; });
  }
  function _ceInjectEntries(entries, yr){
    entries.forEach(function(entry){
      var c = entry.cxp;
      FG_ROWS.unshift({
        id: 'fact_' + c.id,
        concepto: c.proveedor + ' \u2014 ' + (c.concepto || 'Factura'),
        ent: c.empresa,
        cat: c.categoria,
        yr: yr,
        shared: false,
        gcConcept: '',
        vals: entry.vals.slice(),
        autoFactura: true,
        note: 'Auto \u2014 Factura ' + (c.folio_fiscal || c.id)
      });
    });
  }

  // Expose globals
  window.EMPRESAS = EMPRESAS;
  window.ENT_COLOR = ENT_COLOR;
  window.inS = inS;
  window.moInput = moInput;
  window.fiLoad = fiLoad;
  window.fgLoad = fgLoad;
  window.fiInjectCredits = fiInjectCredits;
  window.fiInjectTPV = fiInjectTPV;
  window.fiCalcTotals = fiCalcTotals;
  window.fgCalcTotals = fgCalcTotals;
  window.flRowUpdate = flRowUpdate;
  window.flUpdateFooter = flUpdateFooter;
  window.flUpdateKPIs = flUpdateKPIs;
  window.syncFlujoToRecs = syncFlujoToRecs;
  window.addRec = addRec;
  window.renderReg = renderReg;
  window.clearData = clearData;
  window.delRec = delRec;
  window.expData = expData;
  window._ceCleanFGRows = _ceCleanFGRows;
  window._ceInjectEntries = _ceInjectEntries;

})(window);
