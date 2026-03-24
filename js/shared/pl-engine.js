// GF — P&L Engine: renders, views, consolidados
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // fmtK (from finanzas.js)
  // ═══════════════════════════════════════
  function fmtK(v){
    return(v<0?'-':'')+'$'+Math.abs(Math.round(v)).toLocaleString('es-MX');
  }

  // ═══════════════════════════════════════
  // _isCostRow (from finanzas.js)
  // ═══════════════════════════════════════
  // Categorias que son Costes Directos (variables, ligados al producto)
  const COST_CATS = ['Operaciones','Com. Bancarias','TPV Comisiones','Costo Directo','Costos Directos'];

  // Build dynamic cost category types from config (cd = costos directos)
  function _getCostTypes(){
    const types = new Set(COST_CATS.map(c=>c.toLowerCase()));
    if(typeof catGetData === 'function'){
      const cd = catGetData('cd') || [];
      cd.forEach(c => { if(c.tipo) types.add(c.tipo.toLowerCase()); });
    }
    return types;
  }

  function _isCostRow(r){
    // Explicit tipo field takes precedence (set by user in flujo-gastos UI)
    if(r.tipo === 'costo') return true;
    if(r.tipo === 'gasto') return false;
    // Fallback: auto-detect from category (legacy rows without tipo)
    if(r.cat==='Nómina') return r.concepto.toLowerCase().includes('operativ') || r.concepto.toLowerCase().includes('directa');
    // Check against both hardcoded and config-based cost categories
    const costTypes = _getCostTypes();
    return costTypes.has((r.cat||'').toLowerCase());
  }

  // ═══════════════════════════════════════
  // ENT_MAP (from finanzas.js)
  // ═══════════════════════════════════════
  const ENT_MAP = {
    sal:{name:'Salem Internacional',fullName:'Salem',nomKey:'sal',color:'#0073ea'},
    end:{name:'Endless Money',fullName:'Endless',nomKey:'end',color:'#00b875'},
    dyn:{name:'Dynamo Finance',fullName:'Dynamo',nomKey:'dyn',color:'#ff7043'},
    wb:{name:'Wirebit',fullName:'Wirebit',nomKey:'wb',color:'#9b51e0'},
    stel:{name:'Stellaris',fullName:'Stellaris',nomKey:'stel',color:'#e53935'},
  };

  // ═══════════════════════════════════════
  // rPL (from finanzas.js — the big P&L render)
  // ═══════════════════════════════════════
  function rPL(ent){
    // Guard: only render if view is active or element exists
    const tableEl = document.getElementById(ent+'-res-thead');
    if(!tableEl) return;

    // Period filter bar (year + sub-period)
    if(typeof gfpRender === 'function'){
      gfpRender(ent+'-res-pbar', {ent, color:ENT_MAP[ent].color, years:['2025','2026']});
    }

    const NOM_SAL  = 186000;
    const NOM_END  = 23000;
    const NOM_DYN  = 23000;

    // NOM_EDIT-aware: recalcula la distribucion real desde la config de nomina
    function nomPorEmpresa(empKey){
      return NOM_EDIT.reduce((sum, e) => {
        const pct = {Salem:e.sal, Endless:e.end, Dynamo:e.dyn, Wirebit:e.wb, Stellaris:e.stel}[empKey] || 0;
        return sum + (e.s * pct / 100);
      }, 0);
    }

    // ── Generate expense rows from configurable categories ──
    function _gasRowsFromConfig(entName){
      const cd = typeof catGetData === 'function' ? catGetData('cd') : [];
      const ga = typeof catGetData === 'function' ? catGetData('ga') : [];
      const cdRows = cd.filter(c => !c.empresas || c.empresas.includes(entName)).map(c => {
        const row = { type:'gasto', label:'  '+c.nombre, cats:[c.tipo] };
        if(c.nombre.toLowerCase().includes('nómina') || c.nombre.toLowerCase().includes('nomina'))
          row.ppto = (m,y) => nomMesOp(entName,m,y);
        else row.concepts = [c.nombre.toLowerCase()];
        return row;
      });
      const gaRows = ga.filter(c => !c.empresas || c.empresas.includes(entName)).map(c => {
        const row = { type:'gasto', label:'  '+c.nombre, cats:[c.tipo] };
        if(c.nombre.toLowerCase().includes('nómina') || c.nombre.toLowerCase().includes('nomina'))
          row.ppto = (m,y) => nomMesAdm(entName,m,y);
        else row.concepts = [c.nombre.toLowerCase()];
        return row;
      });
      return { cdRows, gaRows };
    }

    const configs = {
      // ── SALEM ──
      sal: { id:'sal-res', entName:'Salem', acColor:'#0073ea',
        sections:[
          { type:'header', label:'\u25b6 INGRESOS' },
          { type:'ing',  label:'  Comisiones TPV',                    cats:['TPV'], concepts:['comision','comisi\u00f3n','com ','fee','auto'] },
          { type:'ing',  label:'  Fondeo Tarjetas Transferencias',     cats:['Tarjeta Centum Black'], concepts:['transferencia','spei','clabe'] },
          { type:'ing',  label:'  Fondeo Tarjetas Efectivo',           cats:['Tarjeta Centum Black'], concepts:['efectivo','cash','dep\u00f3sito','deposito'] },
          { type:'ing',  label:'  Venta Terminal',                     cats:['TPV','Otros Ingresos'], concepts:['venta'] },
          { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

          { type:'header', label:'\u25b6 COSTES DIRECTOS', note:'Variables ligados al producto' },
          ..._gasRowsFromConfig('Salem').cdRows,
          { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
          { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },

          { type:'header', label:'\u25b6 GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
          ..._gasRowsFromConfig('Salem').gaRows,
          { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
          { type:'ebitda',    label:'EBITDA', bold:true, util:true },
        ]
      },

      // ── ENDLESS ──
      end: { id:'end-res', entName:'Endless', acColor:'#00b875',
        sections:[
          { type:'header', label:'\u25b6 INGRESOS' },
          { type:'ing', label:'  Intereses Cr\u00e9dito Simple',         cats:['Cr\u00e9dito Simple'] },
          { type:'ing', label:'  Comisi\u00f3n por Apertura',            cats:['Cr\u00e9dito Simple'], concepts:['apertura'] },
          { type:'ing', label:'  Intereses Cr\u00e9dito Automotriz',     cats:['Cr\u00e9dito Automotriz'] },
          { type:'ing', label:'  Gastos Adm\u00f3n y Legales',           cats:['Cr\u00e9dito Simple','Cr\u00e9dito Automotriz'], concepts:['adm\u00f3n','legal','gasto adm'] },
          { type:'ing', label:'  Intereses Moratorios',             cats:['Cr\u00e9dito Simple','Cr\u00e9dito Automotriz','Tarjeta Centum Blue'], concepts:['morat'] },
          { type:'ing', label:'  Intereses Tarjeta Centum Blue',    cats:['Tarjeta Centum Blue'] },
          { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

          { type:'header', label:'\u25b6 COSTES DIRECTOS', note:'Variables ligados al producto' },
          ..._gasRowsFromConfig('Endless').cdRows,
          { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
          { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },

          { type:'header', label:'\u25b6 GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
          ..._gasRowsFromConfig('Endless').gaRows,
          { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
          { type:'ebitda',    label:'EBITDA', bold:true, util:true },
        ]
      },

      // ── DYNAMO ──
      dyn: { id:'dyn-res', entName:'Dynamo', acColor:'#ff7043',
        sections:[
          { type:'header', label:'\u25b6 INGRESOS' },
          { type:'ing', label:'  Intereses Cr\u00e9dito Simple',      cats:['Cr\u00e9dito Simple'] },
          { type:'ing', label:'  Comisi\u00f3n por Apertura',         cats:['Cr\u00e9dito Simple'], concepts:['apertura'] },
          { type:'ing', label:'  Intereses Cr\u00e9dito Automotriz',  cats:['Cr\u00e9dito Automotriz'] },
          { type:'ing', label:'  Gastos Adm\u00f3n y Legales',        cats:['Cr\u00e9dito Simple','Cr\u00e9dito Automotriz'], concepts:['adm\u00f3n','legal','gasto adm'] },
          { type:'ing', label:'  Intereses Moratorios',          cats:['Cr\u00e9dito Simple','Cr\u00e9dito Automotriz'], concepts:['morat'] },
          { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

          { type:'header', label:'\u25b6 COSTES DIRECTOS', note:'Variables ligados al producto' },
          ..._gasRowsFromConfig('Dynamo').cdRows,
          { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
          { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },

          { type:'header', label:'\u25b6 GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
          ..._gasRowsFromConfig('Dynamo').gaRows,
          { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
          { type:'ebitda',    label:'EBITDA', bold:true, util:true },
        ]
      },

      // ── WIREBIT ──
      wb: { id:'wb-res', entName:'Wirebit', acColor:'#9b51e0',
        sections:[
          { type:'header', label:'\u25b6 INGRESOS' },
          { type:'ing', label:'  Fee por Exchange Cripto',    cats:['Exchange'] },
          { type:'ing', label:'  Fee por OTC',               cats:['OTC'] },
          { type:'ing', label:'  Fee Retiro en Blockchain',  cats:['Retiro Blockchain'] },
          { type:'ing', label:'  Fee Retiro en FIAT',        cats:['Retiro FIAT'] },
          { type:'ing', label:'  Fee Fondeo de Tarjeta',     cats:['Tarjeta Wirebit'] },
          { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

          { type:'header', label:'\u25b6 COSTES DIRECTOS', note:'Variables ligados al producto' },
          ..._gasRowsFromConfig('Wirebit').cdRows,
          { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
          { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },

          { type:'header', label:'\u25b6 GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
          ..._gasRowsFromConfig('Wirebit').gaRows,
          { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
          { type:'ebitda',    label:'EBITDA', bold:true, util:true },
        ]
      },

      // ── STELLARIS ──
      stel: { id:'stel-res', entName:'Stellaris', acColor:'#e53935',
        sections:[
          { type:'header', label:'\u25b6 INGRESOS' },
          { type:'ing', label:'  M\u00e1quinas (% Net Win)',    cats:['M\u00e1quinas Net Win'] },
          { type:'ing', label:'  Juego en Vivo',              cats:['Juego en Vivo'] },
          { type:'ing', label:'  Mesas de Juego',             cats:['Mesas de Juego'] },
          { type:'ing', label:'  Restaurante',                cats:['Restaurante'] },
          { type:'ing', label:'  Otros Ingresos',             cats:['Otros Ingresos'] },
          { type:'total_ing', label:'TOTAL INGRESOS', bold:true },

          { type:'header', label:'\u25b6 COSTES DIRECTOS', note:'Variables ligados al producto' },
          ..._gasRowsFromConfig('Stellaris').cdRows,
          { type:'total_cost', label:'TOTAL COSTES DIRECTOS', bold:true },
          { type:'margen_op',  label:'MARGEN OPERATIVO', bold:true, util:true },

          { type:'header', label:'\u25b6 GASTOS ADMINISTRATIVOS', note:'Fijos y overhead' },
          ..._gasRowsFromConfig('Stellaris').gaRows,
          { type:'total_gas', label:'TOTAL GASTOS ADMINISTRATIVOS', bold:true },
          { type:'ebitda',    label:'EBITDA', bold:true, util:true },
        ]
      },
    };

    const cfg = configs[ent];
    const entName = cfg.entName;

    // ── Resolver valores desde S.recs ──
    function recsVals(tipo, cats, concepts){
      const matches = S.recs.filter(r => {
        if(r.isSharedSource) return false;
        if(r.yr!=_year) return false;
        if(r.tipo !== tipo) return false;
        if(r.ent !== entName) return false;
        if(cats && !cats.some(c => r.cat.toLowerCase().includes(c.toLowerCase()))) return false;
        if(concepts && !concepts.some(c => r.concepto.toLowerCase().includes(c.toLowerCase()))) return false;
        return true;
      });
      if(!matches.length) return null;
      return MO.map((_,i) => matches.reduce((a,r) => a+(r.vals[i]||0), 0));
    }
    function hasRecs(tipo){ return S.recs.some(r=>!r.isSharedSource&&r.yr==_year&&r.tipo===tipo&&r.ent===entName); }

    // ── Compare: previous year recsVals ──
    const _tblCmp = typeof cmpActive === 'function' && cmpActive();
    const _prevYr = _tblCmp ? cmpPrevYear() : null;
    function recsValsPrev(tipo, cats, concepts){
      if(!_tblCmp) return null;
      const matches = S.recs.filter(r => {
        if(r.isSharedSource) return false;
        if(r.yr!=_prevYr) return false;
        if(r.tipo !== tipo) return false;
        if(r.ent !== entName) return false;
        if(cats && !cats.some(c => r.cat.toLowerCase().includes(c.toLowerCase()))) return false;
        if(concepts && !concepts.some(c => r.concepto.toLowerCase().includes(c.toLowerCase()))) return false;
        return true;
      });
      if(!matches.length) return null;
      return MO.map((_,i) => matches.reduce((a,r) => a+(r.vals[i]||0), 0));
    }

    // ── Acumuladores ──
    let totIng  = MO.map(()=>0);
    let totCost = MO.map(()=>0);
    let totGas  = MO.map(()=>0);
    let pTotIng  = MO.map(()=>0);
    let pTotCost = MO.map(()=>0);
    let pTotGas  = MO.map(()=>0);
    let section = 'none';

    // ── Resolver cada seccion ──
    const rows = [];
    for(const s of cfg.sections){
      if(s.type === 'header'){
        const lc = s.label.toLowerCase();
        if(lc.includes('ingreso'))          section = 'ing';
        else if(lc.includes('coste') || lc.includes('costo')) section = 'cost';
        else if(lc.includes('gasto') || lc.includes('admin')) section = 'gas';
        rows.push({...s, _type:'hdr'});
        continue;
      }

      // Valores hardcoded (presupuesto Wirebit, costos WB)
      if(s.vals){
        const v = s.vals;
        if(s.type==='ing')  totIng  = totIng.map((x,i)=>x+v[i]);
        if(s.type==='gasto'){ if(section==='cost') totCost=totCost.map((x,i)=>x+v[i]); else totGas=totGas.map((x,i)=>x+v[i]); }
        // Prev: hardcoded vals are same for prev year (presupuesto)
        if(_tblCmp){
          if(s.type==='ing') pTotIng=pTotIng.map((x,i)=>x+v[i]);
          if(s.type==='gasto'){ if(section==='cost') pTotCost=pTotCost.map((x,i)=>x+v[i]); else pTotGas=pTotGas.map((x,i)=>x+v[i]); }
        }
        rows.push({...s, _type:'data', _vals:v, _valsPrev:_tblCmp?v:null, _real:false});
        continue;
      }

      // ing_ppto: solo mostrar si no hay recs reales
      if(s.type === 'ing_ppto'){
        if(!hasRecs('ingreso')){
          totIng = totIng.map((x,i)=>x+s.vals[i]);
          if(_tblCmp) pTotIng=pTotIng.map((x,i)=>x+s.vals[i]);
          rows.push({...s, _type:'data', _vals:s.vals, _valsPrev:_tblCmp?s.vals:null, _real:false, _ppto:true});
        }
        continue;
      }

      // Datos desde S.recs
      if(s.type==='ing' || s.type==='gasto'){
        let v = recsVals(s.type==='ing'?'ingreso':'gasto', s.cats||null, s.concepts||null);
        // Fallback a vals_fallback si existe (ej. nomina Wirebit)
        if(!v && s.vals_fallback) v = s.vals_fallback;
        // Fallback a ppto calculado — solo para gastos, NO para ingresos (ingresos deben ser reales)
        if(!v && s.ppto && s.type==='gasto') v = MO.map((_,i)=>Math.round(s.ppto(i, +_year)));
        const isReal = !!recsVals(s.type==='ing'?'ingreso':'gasto', s.cats||null, s.concepts||null);
        const vals = v || MO.map(()=>0);
        if(s.type==='ing')  totIng  = totIng.map((x,i)=>x+vals[i]);
        if(s.type==='gasto'){ if(section==='cost') totCost=totCost.map((x,i)=>x+vals[i]); else totGas=totGas.map((x,i)=>x+vals[i]); }
        // Prev year
        let vPrev = null;
        if(_tblCmp){
          vPrev = recsValsPrev(s.type==='ing'?'ingreso':'gasto', s.cats||null, s.concepts||null);
          if(!vPrev && s.ppto && s.type==='gasto') vPrev = MO.map((_,i)=>Math.round(s.ppto(i, +_prevYr)));
          const valsPrev = vPrev || MO.map(()=>0);
          if(s.type==='ing') pTotIng=pTotIng.map((x,i)=>x+valsPrev[i]);
          if(s.type==='gasto'){ if(section==='cost') pTotCost=pTotCost.map((x,i)=>x+valsPrev[i]); else pTotGas=pTotGas.map((x,i)=>x+valsPrev[i]); }
        }
        rows.push({...s, _type:'data', _vals:vals, _valsPrev:vPrev, _real:isReal});
        continue;
      }

      // Totales calculados
      if(s.type==='total_ing'){  rows.push({...s, _type:'subtotal', _vals:[...totIng],  _valsPrev:_tblCmp?[...pTotIng]:null, _cls:'pos'}); continue; }
      if(s.type==='total_cost'){ rows.push({...s, _type:'subtotal', _vals:[...totCost], _valsPrev:_tblCmp?[...pTotCost]:null, _cls:'neg'}); continue; }
      if(s.type==='total_gas'){  rows.push({...s, _type:'subtotal', _vals:[...totGas],  _valsPrev:_tblCmp?[...pTotGas]:null, _cls:'neg'}); continue; }
      if(s.type==='margen_op'){
        const mo = totIng.map((x,i)=>x-totCost[i]);
        const pMo = _tblCmp ? pTotIng.map((x,i)=>x-pTotCost[i]) : null;
        rows.push({...s, _type:'util', _vals:mo, _valsPrev:pMo, _cls:_periodSum(mo,ent)>=0?'pos':'neg'});
        continue;
      }
      if(s.type==='ebitda'){
        const ebitda = totIng.map((x,i)=>x-totCost[i]-totGas[i]);
        const pEbitda = _tblCmp ? pTotIng.map((x,i)=>x-pTotCost[i]-pTotGas[i]) : null;
        rows.push({...s, _type:'util', _vals:ebitda, _valsPrev:pEbitda, _cls:_periodSum(ebitda,ent)>=0?'pos':'neg'});
        continue;
      }
    }

    // ── Period columns ──
    const _pc = periodColumns((typeof _gfPeriod!=='undefined'?_gfPeriod[ent]:null)||'año');
    const {cols: _pCols, colLabels: _pLabels} = _pc;
    const _pAgg = (arr) => {
      const agg = _pCols.map(idxs=>colVal(arr,idxs));
      if(_pc.addTotal) agg.push(sum(arr));
      return agg;
    };
    const nCols = _pLabels.length;

    // ── Renderizar ──
    const thead = document.getElementById(cfg.id+'-thead');
    const tbody  = document.getElementById(cfg.id+'-tbody');
    thead.innerHTML = `<th style="min-width:180px">Concepto</th>`
      + _pLabels.map(l=>`<th class="r" style="min-width:72px">${l}</th>`).join('');

    const acC = cfg.acColor;

    // Helper: comparison sub-line for a cell
    const _cmpSub = (cur, prev, invert) => {
      if(!_tblCmp || prev==null) return '';
      const d = cmpDelta(cur, prev);
      if(!d) return '';
      const cls = d.dir==='neutral'?'dnu':(d.dir==='up'?(invert?'ddn':'dup'):(invert?'dup':'ddn'));
      return `<div class="cmp-prev">${fmtFull(prev)} <span class="${cls}" style="font-size:.55rem;padding:0 3px;border-radius:6px">${d.label}</span></div>`;
    };

    tbody.innerHTML = rows.map(r => {
      if(r._type === 'hdr'){
        const note = r.note ? ` <span style="font-size:.62rem;font-weight:400;opacity:.75">${r.note}</span>` : '';
        return `<tr class="grp" style="background:${acC}22;border-left:3px solid ${acC}">
          <td colspan="${nCols+1}" style="color:${acC};font-weight:700;padding:7px 12px;font-size:.8rem">${r.label}${note}</td></tr>`;
      }

      const v12   = r._vals || Array(12).fill(0);
      const agg   = _pAgg(v12);
      const tot   = sum(v12);
      const hasData = v12.some(x=>x!==0);
      const p12   = r._valsPrev || null;
      const pAgg  = p12 ? _pAgg(p12) : null;

      if(r._type === 'util' || r._type === 'subtotal'){
        const bg = r._type==='util'
          ? (tot>=0 ? '#e8f5e9' : '#ffebee')
          : (r._cls==='pos' ? '#e3f2fd' : '#fafafa');
        const color = r._type==='util'
          ? (tot>=0 ? '#1b5e20' : '#b71c1c')
          : (r._cls==='pos' ? '#1565c0' : '#444');
        const isGas = r._cls==='neg';
        return `<tr style="background:${bg}">
          <td style="padding:7px 12px;font-weight:800;font-size:.82rem;color:${color};border-left:3px solid ${acC}">${r.label}</td>
          ${agg.map((x,i)=>`<td class="mo" style="font-weight:${i===agg.length-1?800:700};color:${color}${i===agg.length-1?';font-size:.9rem':''}">${x?fmtFull(x):'\u2014'}${pAgg?_cmpSub(x,pAgg[i],isGas):''}</td>`).join('')}
        </tr>`;
      }

      // Data row normal
      const isIng = r.type==='ing' || r.type==='ing_ppto';
      const valColor = isIng ? '#1b5e20' : '#555';
      const isGasRow = r.type==='gasto';
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 12px 6px 20px;font-size:.8rem;color:var(--text)">${r.label}</td>
        ${agg.map((x,i)=>`<td class="mo" style="color:${x?valColor:'var(--muted)'};font-size:.78rem${i===agg.length-1?';font-weight:600':''}">${x?fmtFull(x):'\u2014'}${pAgg?_cmpSub(x,pAgg[i],isGasRow):''}</td>`).join('')}
      </tr>`;
    }).join('');

    // Update entity dashboard KPI cards with real totals
    const kIngEl = document.getElementById(ent+'-k-ing');
    const kCostEl = document.getElementById(ent+'-k-cost');
    const kGasEl = document.getElementById(ent+'-k-gas');
    const annIng = _periodSum(totIng, ent);
    const annCost = _periodSum(totCost, ent);
    const annGas = _periodSum(totGas, ent);

    // ── Compare vs previous year ──
    const _plCmp = typeof cmpActive === 'function' && cmpActive();
    let _pAnnIng=0, _pAnnCost=0, _pAnnGas=0;
    if(_plCmp){
      const _pEntName = ENT_MAP[ent] ? ENT_MAP[ent].name : ent;
      const _pIngV = cmpPrevVals('ingreso', _pEntName);
      const _pCostV = cmpPrevVals('gasto', _pEntName, ['Costes Directos','Costos Directos','Costo de Ventas','Comisiones']);
      const _pGasV = cmpPrevVals('gasto', _pEntName, ['Gastos Administrativos','Gastos Operativos','Gastos Admin']);
      _pAnnIng = _periodSum(_pIngV, ent);
      _pAnnCost = _periodSum(_pCostV, ent);
      _pAnnGas = _periodSum(_pGasV, ent);
    }

    if(kIngEl) kIngEl.innerHTML = (annIng > 0 ? fmtK(annIng) : '\u2014') + (_plCmp ? cmpBadge(annIng, _pAnnIng) : '');
    if(kCostEl){
      kCostEl.innerHTML = (annCost > 0 ? fmtK(annCost) : '\u2014') + (_plCmp ? cmpBadge(annCost, _pAnnCost, true) : '');
      kCostEl.style.color = annCost > 0 ? 'var(--red)' : 'var(--muted)';
      kCostEl.style.fontSize = annCost > 0 ? '' : '.85rem';
    }
    const kCostD = document.getElementById(ent+'-k-cost-d');
    if(kCostD) kCostD.textContent = annCost > 0 ? 'N\u00f3mina + comisiones' : 'Pendiente de captura';
    if(kGasEl){
      kGasEl.innerHTML = (annGas > 0 ? fmtK(annGas) : '\u2014') + (_plCmp ? cmpBadge(annGas, _pAnnGas, true) : '');
      kGasEl.style.color = annGas > 0 ? 'var(--purple)' : 'var(--muted)';
      kGasEl.style.fontSize = annGas > 0 ? '' : '.85rem';
    }
    const kGasD = document.getElementById(ent+'-k-gas-d');
    if(kGasD) kGasD.textContent = annGas > 0 ? 'Renta, admin, regulatorio' : 'Pendiente de captura';

    // ── Poblar KPIs de creditos para Endless / Dynamo ──
    if(ent==='end' || ent==='dyn'){
      const credits = ent==='end' ? END_CREDITS : DYN_CREDITS;
      const activos = credits.filter(c=>c.st==='Activo');
      const prospectos = credits.filter(c=>c.st==='Prospecto');
      const cartera = activos.reduce((s,c)=>s+credSaldoActual(c),0);
      const elCart = document.getElementById(ent+'-kpi-cartera');
      const elCartSub = document.getElementById(ent+'-kpi-cartera-sub');
      if(elCart) elCart.textContent = cartera > 0 ? fmtK(cartera) : '\u2014';
      if(elCartSub) elCartSub.textContent = activos.length + ' cr\u00e9dito' + (activos.length!==1?'s':'') + ' activo' + (activos.length!==1?'s':'');
      const elIngSub = document.getElementById(ent+'-kpi-ing-sub');
      if(elIngSub) elIngSub.textContent = annIng > 0 ? 'Intereses + comisiones' : 'Pendiente datos';
      // Ingreso por cobrar: intereses de periodos NO pagados de todos los creditos activos (sin filtro de año)
      var ingPend = 0, periPend = 0;
      activos.forEach(function(c){
        if(!c.amort || c.amort.length<=1) return;
        c.amort.slice(1).forEach(function(row){
          var st = (typeof credPeriodStatus==='function') ? credPeriodStatus(c, row) : null;
          if(st==='VENCIDO'||st==='PENDIENTE'){
            ingPend += (row.int||0) + (row.ivaInt||0);
            periPend++;
          } else if(st==='PARCIAL'){
            var _pgs = c.pagos||[];
            var _pg = _pgs.find(function(p){ return p.periodo===row.periodo; });
            var _pct = (_pg && row.pago>0) ? _pg.monto/row.pago : 0;
            ingPend += Math.round(((row.int||0) + (row.ivaInt||0)) * (1 - _pct));
            periPend++;
          }
        });
      });
      var elIngPend = document.getElementById(ent+'-kpi-ing-pend');
      var elIngPendSub = document.getElementById(ent+'-kpi-ing-pend-sub');
      if(elIngPend) elIngPend.textContent = ingPend > 0 ? fmtK(ingPend) : '$0';
      if(elIngPendSub) elIngPendSub.textContent = periPend > 0 ? periPend + ' periodo'+(periPend!==1?'s':'')+' pendiente'+(periPend!==1?'s':'') : 'Todo cobrado';
      const pipeline = prospectos.reduce((s,c)=>s+(c.monto||0),0);
      const elPipe = document.getElementById(ent+'-kpi-pipeline');
      const elPipeSub = document.getElementById(ent+'-kpi-pipeline-sub');
      if(elPipe) elPipe.textContent = pipeline > 0 ? fmtK(pipeline) : '\u2014';
      if(elPipeSub) elPipeSub.textContent = prospectos.length > 0 ? prospectos.length + ' prospecto' + (prospectos.length!==1?'s':'') : 'Sin prospectos';
    }

    // ── Poblar KPI de nomina Wirebit ──
    if(ent==='wb'){
      const wbNom = nomMesTotal('Wirebit');
      const elNom = document.getElementById('wb-kpi-nomina');
      if(elNom){ elNom.textContent = fmtK(wbNom) + '/mes'; elNom.style.color=''; elNom.style.fontSize=''; }
    }
  }

  // ═══════════════════════════════════════
  // rConsolidado (from finanzas.js)
  // ═══════════════════════════════════════
  function rConsolidado(type){
    const isCentum=type==='centum';
    const tid=isCentum?'centum':'grupo';
    const thead=document.getElementById(tid+'-thead');
    const tbody=document.getElementById(tid+'-tbody');

    // Period filter bar (year only)
    if(typeof gfpRender === 'function'){
      gfpRender(tid+'-pbar', {ent:tid, color:'var(--blue)', type:'sub', years:['2025','2026'], viewId:tid});
    }

    thead.innerHTML=`<th>Concepto</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total ${_year}</th>`;

    function _rv(ents, tipo){
      const ea = Array.isArray(ents)?ents:[ents];
      return MO.map((_,i)=>
        (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&ea.includes(r.ent)&&r.yr==_year)
          .reduce((s,r)=>s+(r.vals[i]||0),0)
      );
    }
    function _nom(ents){
      const ea = Array.isArray(ents)?ents:[ents];
      let total=0;
      try{ NOM_EDIT.forEach(n=>{
        ea.forEach(e=>{
          const k=e==='Salem'?'sal':e==='Endless'?'end':e==='Dynamo'?'dyn':e==='Stellaris'?'stel':'wb';
          total+=n.s*(n[k]||0)/100;
        });
      });}catch(e){}
      return MO.map(()=>Math.round(total));
    }
    const _add=(a,b)=>a.map((v,i)=>v+(b[i]||0));
    const _sub=(a,b)=>a.map((v,i)=>v-(b[i]||0));

    const centumEnts=['Salem','Endless','Dynamo'];
    const _coCmp = typeof cmpActive === 'function' && cmpActive();
    let rows;

    if(isCentum){
      const salIng=_rv('Salem','ingreso'), endIng=_rv('Endless','ingreso'), dynIng=_rv('Dynamo','ingreso');
      const totIng=_add(_add(salIng,endIng),dynIng);
      const totGas=_rv(centumEnts,'gasto');
      const nom=_nom(centumEnts);
      const margen=_sub(totIng,totGas);
      const ebitda=_sub(margen,nom);
      // Prev year
      let pSalIng,pEndIng,pDynIng,pTotIng,pTotGas,pNom,pMargen,pEbitda;
      if(_coCmp){
        pSalIng=_rvPrev('Salem','ingreso');pEndIng=_rvPrev('Endless','ingreso');pDynIng=_rvPrev('Dynamo','ingreso');
        pTotIng=_add(_add(pSalIng,pEndIng),pDynIng);pTotGas=_rvPrev(centumEnts,'gasto');pNom=nom;
        pMargen=_sub(pTotIng,pTotGas);pEbitda=_sub(pMargen,pNom);
      }
      rows=[
        {l:'\u25b8 CENTUM CAPITAL \u2014 Ingresos',hdr:true},
        {l:'  \u00b7 Salem',vals:salIng,pv:_coCmp?pSalIng:null,t:'ing'},
        {l:'  \u00b7 Endless',vals:endIng,pv:_coCmp?pEndIng:null,t:'ing'},
        {l:'  \u00b7 Dynamo',vals:dynIng,pv:_coCmp?pDynIng:null,t:'ing'},
        {l:'TOTAL INGRESOS CENTUM',vals:totIng,pv:_coCmp?pTotIng:null,t:'total',bold:true},
        {l:'COSTOS + GASTOS OPERATIVOS',vals:totGas,pv:_coCmp?pTotGas:null,t:'gasto',bold:true},
        {l:'MARGEN BRUTO',vals:margen,pv:_coCmp?pMargen:null,t:'util',bold:true},
        {l:'N\u00d3MINA CENTUM',vals:nom,pv:_coCmp?pNom:null,t:'gasto',bold:true},
        {l:'EBITDA CENTUM CAPITAL',vals:ebitda,pv:_coCmp?pEbitda:null,t:'util',bold:true},
      ];
    } else {
      const cIng=_rv(centumEnts,'ingreso'), wIng=_rv('Wirebit','ingreso'), stIng=_rv('Stellaris','ingreso');
      const totIng=_add(_add(cIng,wIng),stIng);
      const cGas=_rv(centumEnts,'gasto'), wGas=_rv('Wirebit','gasto'), stGas=_rv('Stellaris','gasto');
      const totGas=_add(_add(cGas,wGas),stGas);
      const margen=_sub(totIng,totGas);
      const cNom=_nom(centumEnts), wNom=_nom('Wirebit'), stNom=_nom('Stellaris');
      const totNom=_add(_add(cNom,wNom),stNom);
      const ebitda=_sub(margen,totNom);
      // Prev year
      let pcIng,pwIng,pstIng,pTotIng,pcGas,pwGas,pstGas,pTotGas,pMargen,pTotNom,pEbitda;
      if(_coCmp){
        pcIng=_rvPrev(centumEnts,'ingreso');pwIng=_rvPrev('Wirebit','ingreso');pstIng=_rvPrev('Stellaris','ingreso');
        pTotIng=_add(_add(pcIng,pwIng),pstIng);
        pcGas=_rvPrev(centumEnts,'gasto');pwGas=_rvPrev('Wirebit','gasto');pstGas=_rvPrev('Stellaris','gasto');
        pTotGas=_add(_add(pcGas,pwGas),pstGas);
        pMargen=_sub(pTotIng,pTotGas);pTotNom=totNom;pEbitda=_sub(pMargen,pTotNom);
      }
      rows=[
        {l:'\u25b8 CENTUM CAPITAL \u2014 Ingresos',vals:cIng,pv:_coCmp?pcIng:null,t:'ing'},
        {l:'\u25b8 WIREBIT \u2014 Ingresos',vals:wIng,pv:_coCmp?pwIng:null,t:'ing'},
        {l:'\u25b8 STELLARIS \u2014 Ingresos',vals:stIng,pv:_coCmp?pstIng:null,t:'ing'},
        {l:'TOTAL INGRESOS GRUPO',vals:totIng,pv:_coCmp?pTotIng:null,t:'total',bold:true},
        {l:'\u25b8 CENTUM CAPITAL \u2014 Gastos',vals:cGas,pv:_coCmp?pcGas:null,t:'gasto'},
        {l:'\u25b8 WIREBIT \u2014 Gastos',vals:wGas,pv:_coCmp?pwGas:null,t:'gasto'},
        {l:'\u25b8 STELLARIS \u2014 Gastos',vals:stGas,pv:_coCmp?pstGas:null,t:'gasto'},
        {l:'TOTAL GASTOS',vals:totGas,pv:_coCmp?pTotGas:null,t:'total',bold:true},
        {l:'MARGEN BRUTO GRUPO',vals:margen,pv:_coCmp?pMargen:null,t:'util',bold:true},
        {l:'\u25b8 CENTUM CAPITAL \u2014 N\u00f3mina',vals:cNom,pv:_coCmp?cNom:null,t:'gasto'},
        {l:'\u25b8 WIREBIT \u2014 N\u00f3mina',vals:wNom,pv:_coCmp?wNom:null,t:'gasto'},
        {l:'\u25b8 STELLARIS \u2014 N\u00f3mina',vals:stNom,pv:_coCmp?stNom:null,t:'gasto'},
        {l:'TOTAL N\u00d3MINA GRUPO',vals:totNom,pv:_coCmp?pTotNom:null,t:'total',bold:true},
        {l:'EBITDA GRUPO',vals:ebitda,pv:_coCmp?pEbitda:null,t:'util',bold:true},
      ];
    }

    // Cell comparison sub-line helper
    const _coSub = (cur, prev, invert) => {
      if(!_coCmp || prev==null) return '';
      const d = cmpDelta(cur, prev);
      if(!d) return '';
      const cls = d.dir==='neutral'?'dnu':(d.dir==='up'?(invert?'ddn':'dup'):(invert?'dup':'ddn'));
      return `<div class="cmp-prev">${fmtFull(prev)} <span class="${cls}" style="font-size:.55rem;padding:0 3px;border-radius:6px">${d.label}</span></div>`;
    };

    tbody.innerHTML=rows.map(r=>{
      if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
      const tot=sum(r.vals);
      const pTot=r.pv?sum(r.pv):null;
      const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
      const isGas=r.t==='gasto';
      return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map((v,i)=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'\u2014'}${r.pv?_coSub(v,r.pv[i],isGas):''}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}${r.pv?_coSub(tot,pTot,isGas):''}</td></tr>`;
    }).join('');

    // ── KPIs ──
    const _conCmp = typeof cmpActive === 'function' && cmpActive();
    function _rvPrev(ents, tipo){
      const ea = Array.isArray(ents)?ents:[ents];
      const py = typeof cmpPrevYear === 'function' ? cmpPrevYear() : _year-1;
      return MO.map((_,i)=>
        (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&ea.includes(r.ent)&&r.yr==py)
          .reduce((s,r)=>s+(r.vals[i]||0),0)
      );
    }
    if(isCentum){
      const centumNom = nomMesTotal('Salem') + nomMesTotal('Endless') + nomMesTotal('Dynamo');
      const el = document.getElementById('centum-kpi-nomina');
      if(el){ el.textContent = fmtK(centumNom) + '/mes'; el.style.color=''; el.style.fontSize=''; }
      const kIng = document.getElementById('centum-k-ing');
      const kGas = document.getElementById('centum-k-gas');
      const totI = _periodSum(_rv(centumEnts,'ingreso'), 'centum');
      const totG = _periodSum(_rv(centumEnts,'gasto'), 'centum');
      if(kIng){ kIng.innerHTML = (totI>0 ? fmtK(totI) : '\u2014') + (_conCmp ? cmpBadge(totI, _periodSum(_rvPrev(centumEnts,'ingreso'),'centum')) : ''); }
      if(kGas){ kGas.innerHTML = (totG>0 ? fmtK(totG) : '\u2014') + (_conCmp ? cmpBadge(totG, _periodSum(_rvPrev(centumEnts,'gasto'),'centum'), true) : ''); }
      const allCred = [...END_CREDITS,...DYN_CREDITS].filter(c=>c.st==='Activo'||c.st==='Vencido');
      const carteraTotal = allCred.reduce((s,c)=>s+credSaldoActual(c),0);
      const kCart = document.getElementById('centum-kpi-cartera');
      const kCartSub = document.getElementById('centum-kpi-cartera-sub');
      if(kCart) kCart.textContent = carteraTotal > 0 ? fmtK(carteraTotal) : '\u2014';
      if(kCartSub) kCartSub.textContent = allCred.length + ' cr\u00e9dito' + (allCred.length!==1?'s':'') + ' (End+Dyn)';
    } else {
      const allEnts = ['Salem','Endless','Dynamo','Wirebit','Stellaris'];
      const totI = _periodSum(_rv(allEnts,'ingreso'), 'grupo');
      const totG = _periodSum(_rv(allEnts,'gasto'), 'grupo');
      const kIng = document.getElementById('grupo-k-ing');
      const kGas = document.getElementById('grupo-k-gas');
      if(kIng){ kIng.innerHTML = (totI>0 ? fmtK(totI) : '\u2014') + (_conCmp ? cmpBadge(totI, _periodSum(_rvPrev(allEnts,'ingreso'),'grupo')) : ''); }
      if(kGas){ kGas.innerHTML = (totG>0 ? fmtK(totG) : '\u2014') + (_conCmp ? cmpBadge(totG, _periodSum(_rvPrev(allEnts,'gasto'),'grupo'), true) : ''); }
    }
  }

  // ═══════════════════════════════════════
  // rIngView (from finanzas.js)
  // ═══════════════════════════════════════
  function rIngView(entKey){
    const cfg=ENT_MAP[entKey]; if(!cfg) return;
    const entName=cfg.fullName, color=cfg.color;
    const thead=document.getElementById(entKey+'-ing-thead');
    const tbody=document.getElementById(entKey+'-ing-tbody');
    if(!thead||!tbody) return;

    if(typeof gfpRender === 'function'){
      gfpRender(entKey+'-ing-pbar', {ent:entKey, color, years:['2025','2026'], viewId:entKey+'_ing'});
    }

    const _ipc = periodColumns((typeof _gfPeriod!=='undefined'?_gfPeriod[entKey]:null)||'año');
    const _ipCV = (vals) => { const a=_ipc.cols.map(idxs=>colVal(vals,idxs)); if(_ipc.addTotal) a.push(sum(vals)); return a; };

    const rows=FI_ROWS.filter(r=>r.ent===entName&&r.yr==_year);
    const curMonth=new Date().getMonth();
    const totalAnual=rows.reduce((s,r)=>s+_periodSum(r.vals, entKey),0);
    const totalMes=rows.reduce((s,r)=>s+(r.vals[curMonth]||0),0);

    const kT=document.getElementById(entKey+'-ing-kpi-total');
    const kTs=document.getElementById(entKey+'-ing-kpi-total-sub');
    const kM=document.getElementById(entKey+'-ing-kpi-mes');
    const kMs=document.getElementById(entKey+'-ing-kpi-mes-sub');
    const kC=document.getElementById(entKey+'-ing-kpi-count');
    const kCs=document.getElementById(entKey+'-ing-kpi-count-sub');

    // ── Compare: previous year totals for Income ──
    const _iCmp = typeof cmpActive === 'function' && cmpActive();
    let _iPrevTot=0, _iPrevMes=0;
    if(_iCmp){
      const prevRows=FI_ROWS.filter(r=>r.ent===entName&&r.yr==cmpPrevYear());
      _iPrevTot=prevRows.reduce((s,r)=>s+_periodSum(r.vals, entKey),0);
      _iPrevMes=prevRows.reduce((s,r)=>s+(r.vals[curMonth]||0),0);
    }

    if(totalAnual>0){
      if(kT){kT.innerHTML=fmtK(totalAnual)+(_iCmp?cmpBadge(totalAnual,_iPrevTot):'');kT.style.color=color;kT.style.fontSize='';}
      if(kTs){kTs.textContent='Ingresos acumulados '+_year;kTs.className='kpi-d';}
    } else {
      if(kT){kT.textContent='Sin datos';kT.style.color='var(--muted)';kT.style.fontSize='.85rem';}
      if(kTs){kTs.textContent='Pendiente de captura';kTs.className='kpi-d dnu';}
    }
    if(totalMes>0){
      if(kM){kM.innerHTML=fmtK(totalMes)+(_iCmp?cmpBadge(totalMes,_iPrevMes):'');kM.style.color='var(--blue)';kM.style.fontSize='';}
      if(kMs){kMs.textContent=MO[curMonth]+' '+_year;kMs.className='kpi-d';}
    } else {
      if(kM){kM.textContent='\u2014';kM.style.color='var(--muted)';kM.style.fontSize='.85rem';}
      if(kMs){kMs.textContent='Pendiente';kMs.className='kpi-d dnu';}
    }
    if(kC){kC.textContent=rows.length;kC.style.color=rows.length>0?'var(--green)':'var(--muted)';kC.style.fontSize=rows.length>0?'':'.85rem';}
    if(kCs) kCs.textContent=rows.length+' concepto'+(rows.length!==1?'s':'')+' de ingreso';

    const ck='c'+entKey+'ingbar';
    dc(ck);
    const mTotals=MO.map((_,i)=>rows.reduce((s,r)=>s+(r.vals[i]||0),0));
    const _ingDs=[{label:'Ingresos '+cfg.name,data:mTotals,backgroundColor:color+'44',borderColor:color,borderWidth:1.5,borderRadius:4}];
    if(_iCmp){
      const prevRows=FI_ROWS.filter(r=>r.ent===entName&&r.yr==cmpPrevYear());
      const _pMT=MO.map((_,i)=>prevRows.reduce((s,r)=>s+(r.vals[i]||0),0));
      _ingDs.push({label:'Ingresos '+cmpPrevYear(),data:_pMT,backgroundColor:color+'10',borderColor:color+'55',borderWidth:1.5,borderRadius:4,borderDash:[4,4]});
    }
    const cv=document.getElementById('c-'+entKey+'-ing-bar');
    if(cv){
      CH[ck]=new Chart(cv,{
        type:'bar',
        data:{labels:MO,datasets:_ingDs},
        options:{...cOpts(),
          plugins:{legend:{display:_iCmp,position:'top',labels:{color:'#8b8fb5',font:{size:9},boxWidth:8,padding:6}},tooltip:cOpts().plugins?.tooltip},
          scales:{x:{grid:{display:false},ticks:{color:'#b0b4d0',font:{size:10}}},y:{grid:{color:'rgba(228,232,244,.6)'},ticks:{color:'#b0b4d0',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}
        }
      });
    }

    thead.innerHTML='<th>Concepto</th><th>Categor\u00eda</th>'+_ipc.colLabels.map(l=>'<th class="r">'+l+'</th>').join('');
    const nIC = _ipc.colLabels.length;
    if(rows.length===0){
      tbody.innerHTML='<tr><td colspan="'+(nIC+2)+'" style="text-align:center;padding:24px;color:var(--muted);font-size:.82rem">Sin ingresos registrados para '+cfg.name+' \u2014 usa <b>Flujo de Ingresos</b> o <b>Carga Masiva</b> para agregar datos</td></tr>';
      return;
    }
    const totCols=_ipc.colLabels.map(()=>0);
    // Prev year rows for comparison
    const _iPrevRows = _iCmp ? FI_ROWS.filter(r=>r.ent===entName&&r.yr==cmpPrevYear()) : [];
    const _iPrevTotCols = _ipc.colLabels.map(()=>0);
    const _iSubLine = (cur, prev) => {
      if(!_iCmp) return '';
      const d = cmpDelta(cur, prev);
      if(!d) return '';
      const cls = d.dir==='neutral'?'dnu':(d.dir==='up'?'dup':'ddn');
      return '<div class="cmp-prev">'+fmtFull(prev)+' <span class="'+cls+'" style="font-size:.55rem;padding:0 3px;border-radius:6px">'+d.label+'</span></div>';
    };
    tbody.innerHTML=rows.map(r=>{
      const cv=_ipCV(r.vals);
      cv.forEach((v,i)=>totCols[i]+=v);
      // Find matching prev year row
      let pCv = null;
      if(_iCmp){
        const pRow = _iPrevRows.find(pr=>pr.concepto===r.concepto && pr.cat===r.cat);
        if(pRow){ pCv = _ipCV(pRow.vals); pCv.forEach((v,i)=>_iPrevTotCols[i]+=v); }
      }
      const badge=r.auto?' <span style="font-size:.55rem;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto</span>':(r.autoTPV?' <span style="font-size:.55rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span>':'');
      return '<tr><td class="bld">'+r.concepto+badge+'</td><td><span class="pill" style="background:'+color+'18;color:'+color+';font-size:.62rem">'+r.cat+'</span></td>'+cv.map((v,i)=>'<td class="mo'+(v?' pos':'')+'">'+(v?fmtFull(v):'\u2014')+(pCv?_iSubLine(v,pCv[i]):'')+'</td>').join('')+'</tr>';
    }).join('');
    tbody.innerHTML+='<tr class="grp"><td colspan="2">TOTAL INGRESOS '+entName.toUpperCase()+'</td>'+totCols.map((v,i)=>'<td class="mo pos bld">'+(v?fmtFull(v):'\u2014')+(_iCmp?_iSubLine(v,_iPrevTotCols[i]):'')+'</td>').join('')+'</tr>';
  }

  // ═══════════════════════════════════════
  // rGasView (from finanzas.js)
  // ═══════════════════════════════════════
  function rGasView(entKey){
    const cfg=ENT_MAP[entKey]; if(!cfg) return;
    const entName=cfg.fullName, nomK=cfg.nomKey, color=cfg.color;

    if(typeof gfpRender === 'function'){
      gfpRender(entKey+'-gas-pbar', {ent:entKey, color, years:['2025','2026'], viewId:entKey+'_gas'});
    }

    const _gpc = periodColumns((typeof _gfPeriod!=='undefined'?_gfPeriod[entKey]:null)||'año');
    const _gpCV = (vals) => { const a=_gpc.cols.map(idxs=>colVal(vals,idxs)); if(_gpc.addTotal) a.push(sum(vals)); return a; };
    const _ghdr = '<th>Concepto</th><th>Categor\u00eda</th>'+_gpc.colLabels.map(l=>'<th class="r">'+l+'</th>').join('');
    const _gnC = _gpc.colLabels.length;

    const costThead=document.getElementById(entKey+'-cost-thead');
    const costTbody=document.getElementById(entKey+'-cost-tbody');
    const gasThead=document.getElementById(entKey+'-gas-thead');
    const gasTbody=document.getElementById(entKey+'-gas-tbody');
    if(!gasThead||!gasTbody) return;

    if(costThead) costThead.innerHTML=_ghdr;
    gasThead.innerHTML=_ghdr;

    const gastos=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==_year);

    const agg=new Map();
    gastos.forEach(r=>{
      const key=r.concepto;
      if(agg.has(key)){const e=agg.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
      else agg.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
    });

    const hasNomRecs=gastos.some(r=>r.cat==='N\u00f3mina');
    if(!hasNomRecs && typeof NOM_EDIT!=='undefined'){
      const nomOpVals=Array.from({length:12},(_,m)=>Math.round(nomMesOp(entName,m,+_year)));
      const nomAdmVals=Array.from({length:12},(_,m)=>Math.round(nomMesAdm(entName,m,+_year)));
      if(nomOpVals.some(v=>v>0)) agg.set('N\u00f3mina Operativa',{concepto:'N\u00f3mina Operativa',cat:'N\u00f3mina',vals:nomOpVals,ppto:true});
      if(nomAdmVals.some(v=>v>0)) agg.set('N\u00f3mina Administrativa',{concepto:'N\u00f3mina Administrativa',cat:'N\u00f3mina',vals:nomAdmVals,ppto:true});
    }

    if(typeof GC_EDIT!=='undefined'){
      GC_EDIT.forEach(gc=>{
        if(!gc.c || !gc[nomK] || gc[nomK]<=0) return;
        if(agg.has(gc.c)) return;
        const pptoMes=Math.round((gc.ppto||0)*gc[nomK]/100);
        if(pptoMes>0) agg.set(gc.c,{concepto:gc.c,cat:gc.cat||'Varios',vals:Array(12).fill(pptoMes),ppto:true});
      });
    }

    const all=[...agg.values()];
    const costRows=all.filter(r=>_isCostRow(r)).sort((a,b)=>sum(b.vals)-sum(a.vals));
    const gasRows=all.filter(r=>!_isCostRow(r)).sort((a,b)=>sum(b.vals)-sum(a.vals));

    const pillBg=color+'18';
    // Prev year gastos for table comparison
    const _gTblCmp = typeof cmpActive === 'function' && cmpActive();
    const _gPrevMap = new Map();
    if(_gTblCmp){
      const prevGR=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==cmpPrevYear());
      prevGR.forEach(r=>{
        const key=r.concepto;
        if(_gPrevMap.has(key)){const e=_gPrevMap.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
        else _gPrevMap.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
      });
    }
    const _gSubLine = (cur, prev) => {
      if(!_gTblCmp) return '';
      const d = cmpDelta(cur, prev);
      if(!d) return '';
      // invert=true for expenses (lower is better)
      const cls = d.dir==='neutral'?'dnu':(d.dir==='up'?'ddn':'dup');
      return '<div class="cmp-prev">'+fmtFull(prev)+' <span class="'+cls+'" style="font-size:.55rem;padding:0 3px;border-radius:6px">'+d.label+'</span></div>';
    };
    function renderTable(rows, tbody, label){
      if(rows.length===0){
        tbody.innerHTML='<tr><td colspan="'+(_gnC+2)+'" style="text-align:center;padding:20px;color:var(--muted);font-size:.82rem">Sin registros</td></tr>';
        return {total:0};
      }
      const totCols=_gpc.colLabels.map(()=>0);
      const pTotCols=_gpc.colLabels.map(()=>0);
      tbody.innerHTML=rows.map(g=>{
        const cv=_gpCV(g.vals);
        cv.forEach((v,i)=>totCols[i]+=v);
        let pCv=null;
        if(_gTblCmp){
          const pRow=_gPrevMap.get(g.concepto);
          if(pRow){ pCv=_gpCV(pRow.vals); pCv.forEach((v,i)=>pTotCols[i]+=v); }
        }
        const pptoTag=g.ppto?' <span style="font-size:.55rem;color:var(--muted);font-weight:400">(ppto)</span>':'';
        return '<tr><td class="bld">'+g.concepto+pptoTag+'</td><td><span class="pill" style="background:'+pillBg+';color:'+color+';font-size:.62rem">'+g.cat+'</span></td>'+cv.map((v,i)=>'<td class="mo'+(v?' neg':'')+'"'+(g.ppto?' style="opacity:.65"':'')+'>'+(v?fmtFull(v):'\u2014')+(pCv?_gSubLine(v,pCv[i]):'')+'</td>').join('')+'</tr>';
      }).join('');
      const gt=sum(totCols);
      tbody.innerHTML+='<tr class="grp"><td colspan="2">'+label+'</td>'+totCols.map((v,i)=>'<td class="mo neg bld">'+(v?fmtFull(v):'\u2014')+(_gTblCmp?_gSubLine(v,pTotCols[i]):'')+'</td>').join('')+'</tr>';
      return {total:gt};
    }

    const costRes=costTbody ? renderTable(costRows,costTbody,'TOTAL COSTES DIRECTOS') : {totM:Array(12).fill(0),total:0};
    const gasRes=renderTable(gasRows,gasTbody,'TOTAL GASTOS ADMINISTRATIVOS');

    const curMonth=new Date().getMonth();
    const costTotal=costRes.total;
    const gasTotal=gasRes.total;
    const grandTotal=costTotal+gasTotal;

    const kCost=document.getElementById(entKey+'-gas-kpi-cost');
    const kCostD=document.getElementById(entKey+'-gas-kpi-cost-d');
    const kGas=document.getElementById(entKey+'-gas-kpi-gas');
    const kGasD=document.getElementById(entKey+'-gas-kpi-gas-d');
    const kAnu=document.getElementById(entKey+'-gas-kpi-anual');
    const kAnuD=document.getElementById(entKey+'-gas-kpi-anual-d');

    // ── Compare: previous year cost/expense totals ──
    const _gCmp = typeof cmpActive === 'function' && cmpActive();
    let _gPrevCost=0, _gPrevGas=0;
    if(_gCmp){
      const prevGastos=(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===entName&&r.yr==cmpPrevYear());
      const prevAll=new Map();
      prevGastos.forEach(r=>{
        const key=r.concepto;
        if(prevAll.has(key)){const e=prevAll.get(key);r.vals.forEach((v,i)=>e.vals[i]+=v);}
        else prevAll.set(key,{concepto:r.concepto,cat:r.cat,vals:[...r.vals]});
      });
      [...prevAll.values()].forEach(g=>{
        if(_isCostRow(g)) _gPrevCost+=sum(g.vals); else _gPrevGas+=sum(g.vals);
      });
    }

    if(kCost){kCost.innerHTML=(costTotal>0?fmtK(costTotal):'\u2014')+(_gCmp?cmpBadge(costTotal,_gPrevCost,true):'');kCost.style.color=costTotal>0?'var(--orange)':'var(--muted)';kCost.style.fontSize=costTotal>0?'':'.85rem';}
    if(kCostD){kCostD.textContent=costTotal>0?costRows.length+' concepto'+(costRows.length!==1?'s':''):'Sin costes registrados';kCostD.className=costTotal>0?'kpi-d':'kpi-d dnu';}

    if(kGas){kGas.innerHTML=(gasTotal>0?fmtK(gasTotal):'\u2014')+(_gCmp?cmpBadge(gasTotal,_gPrevGas,true):'');kGas.style.color=gasTotal>0?'var(--red)':'var(--muted)';kGas.style.fontSize=gasTotal>0?'':'.85rem';}
    if(kGasD){kGasD.textContent=gasTotal>0?gasRows.length+' concepto'+(gasRows.length!==1?'s':''):'Sin gastos registrados';kGasD.className=gasTotal>0?'kpi-d':'kpi-d dnu';}

    const _gPrevGrand = _gPrevCost + _gPrevGas;
    if(kAnu){kAnu.innerHTML=(grandTotal>0?fmtK(grandTotal):'Sin datos')+(_gCmp?cmpBadge(grandTotal,_gPrevGrand,true):'');kAnu.style.color=grandTotal>0?'var(--yellow)':'var(--muted)';kAnu.style.fontSize=grandTotal>0?'':'.85rem';}
    if(kAnuD){kAnuD.textContent=grandTotal>0?'Acumulado '+_year:'Pendiente de captura';kAnuD.className=grandTotal>0?'kpi-d':'kpi-d dnu';}
  }

  // ═══════════════════════════════════════
  // rNomView (from finanzas.js)
  // ═══════════════════════════════════════
  function rNomView(entKey){
    const cfg=ENT_MAP[entKey]; if(!cfg) return;
    const nomK=cfg.nomKey;
    const thead=document.getElementById(entKey+'-nom-thead');
    const tbody=document.getElementById(entKey+'-nom-tbody');
    if(!thead||!tbody) return;

    if(typeof gfpRender === 'function'){
      gfpRender(entKey+'-nom-pbar', {ent:entKey, color:cfg.color, years:['2025','2026'], viewId:entKey+'_nom'});
    }

    const _npc = periodColumns((typeof _gfPeriod!=='undefined'?_gfPeriod[entKey]:null)||'año');
    const _npCV = (vals) => { const a=_npc.cols.map(idxs=>colVal(vals,idxs)); if(_npc.addTotal) a.push(sum(vals)); return a; };

    const emps=NOM_EDIT.filter(e=>(e[nomK]||0)>0);
    const detail=emps.map(e=>{
      const mc=Math.round(e.s*(e[nomK]||0)/100);
      return {n:e.n,r:e.r,tipo:e.tipo,pct:e[nomK],vals:Array(12).fill(mc),total:mc*12};
    });
    const monthTotals=MO.map((_,i)=>detail.reduce((s,e)=>s+e.vals[i],0));
    const annualTotal=sum(monthTotals);

    const kT=document.getElementById(entKey+'-nom-kpi-total');
    const kC=document.getElementById(entKey+'-nom-kpi-count');
    const kA=document.getElementById(entKey+'-nom-kpi-avg');
    if(kT){kT.textContent=annualTotal>0?fmtK(annualTotal):'\u2014';kT.style.color=annualTotal>0?cfg.color:'var(--muted)';kT.style.fontSize=annualTotal>0?'':'.85rem';}
    if(kC){kC.textContent=emps.length+' empleado'+(emps.length!==1?'s':'');kC.style.color='var(--blue)';}
    if(kA){const avg=annualTotal/12;kA.textContent=avg>0?fmtK(avg):'\u2014';kA.style.color=avg>0?'var(--green)':'var(--muted)';kA.style.fontSize=avg>0?'':'.85rem';}

    const _nnC = _npc.colLabels.length;
    thead.innerHTML='<th>Empleado</th><th>Rol</th><th class="r">Tipo</th><th class="r">%</th>'+_npc.colLabels.map(l=>'<th class="r">'+l+'</th>').join('');
    if(detail.length===0){
      tbody.innerHTML='<tr><td colspan="'+(4+_nnC)+'" style="text-align:center;padding:24px;color:var(--muted);font-size:.82rem">Sin empleados asignados a '+cfg.name+' \u2014 configura la distribuci\u00f3n en <b>N\u00f3mina Compartida</b></td></tr>';
      return;
    }
    const totNomCols=_npc.colLabels.map(()=>0);
    tbody.innerHTML=detail.map(e=>{
      const cv=_npCV(e.vals);
      cv.forEach((v,i)=>totNomCols[i]+=v);
      const tc=e.tipo==='Operativo'?'#0073ea':'#9b51e0';
      return '<tr><td class="bld">'+_esc(e.n)+'</td><td style="color:var(--muted);font-size:.76rem">'+_esc(e.r)+'</td><td style="text-align:right"><span style="font-size:.66rem;font-weight:600;color:'+tc+'">'+_esc(e.tipo)+'</span></td><td class="mo" style="color:'+cfg.color+';font-weight:600">'+e.pct+'%</td>'+cv.map(v=>'<td class="mo'+(v?' neg':'')+'">'+(v?fmt(v):'\u2014')+'</td>').join('')+'</tr>';
    }).join('');
    tbody.innerHTML+='<tr class="grp"><td colspan="4">TOTAL N\u00d3MINA '+cfg.fullName.toUpperCase()+'</td>'+totNomCols.map(v=>'<td class="mo neg bld">'+fmt(v)+'</td>').join('')+'</tr>';
  }

  // ═══════════════════════════════════════
  // rWBNom (from finanzas.js)
  // ═══════════════════════════════════════
  function rWBNom(){
    const thead=document.getElementById('wb-nom-thead');
    const tbody=document.getElementById('wb-nom-tbody');
    thead.innerHTML=`<th>Empleado</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th>`;
    tbody.innerHTML=WB_NOM_DETAIL.map(e=>`<tr><td class="bld">${_esc(e.n)}</td>${e.vals.map(v=>`<td class="mo ${v>0?'neg':''}">${v?fmt(v):'\u2014'}</td>`).join('')}<td class="mo bld neg">${fmt(e.total)}</td></tr>`).join('');
    tbody.innerHTML+=`<tr class="grp"><td>TOTAL N\u00d3MINA WIREBIT</td>${WB_NOM_TOTAL.map(v=>`<td class="mo neg bld">${fmt(v)}</td>`).join('')}<td class="mo neg bld">${fmt(sum(WB_NOM_TOTAL))}</td></tr>`;
  }

  // ═══════════════════════════════════════
  // rSalTPV (from finanzas.js)
  // ═══════════════════════════════════════
  function rSalTPV(){
    const thead=document.getElementById('sal-tpv-thead');
    const tbody=document.getElementById('sal-tpv-tbody');
    thead.innerHTML=`<th>Cliente</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total</th><th class="r">Ppto ${_year}</th>`;
    tbody.innerHTML=SAL_TPV_CLIENTES.map(c=>`<tr>
      <td class="bld">${_esc(c)}</td>${MO.map(()=>'<td class="mo" style="color:var(--muted)">\u2014</td>').join('')}
      <td class="mo bld" style="color:var(--muted)">\u2014</td>
      <td class="mo" style="color:var(--muted)">\u2014</td>
    </tr>`).join('');
    tbody.innerHTML+=`<tr class="grp"><td>TOTAL TPV</td>${MO.map(()=>'<td class="mo">$0</td>').join('')}<td class="mo bld">$0</td><td class="mo">\u2014</td></tr>`;
  }

  // ═══════════════════════════════════════
  // rSalGas (from finanzas.js)
  // ═══════════════════════════════════════
  function rSalGas(){ rGasView('sal'); }

  // ═══════════════════════════════════════
  // rEntGrupo — Vista consolidado para una empresa individual (Grupo → Finanzas)
  // ═══════════════════════════════════════
  function rEntGrupo(entKey){
    const cfg = ENT_MAP[entKey];
    if(!cfg) return;
    const eName = cfg.fullName; // 'Wirebit' or 'Stellaris'
    const pfx = entKey === 'wb' ? 'wbg' : 'stelg';

    // Period filter bar (year only)
    if(typeof gfpRender === 'function'){
      gfpRender(pfx+'-pbar', {ent:entKey, color:cfg.color, type:'sub', years:['2025','2026'], viewId:entKey+'_grupo'});
    }

    // Helpers
    function _rv(tipo){
      return MO.map((_,i)=>
        (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&r.ent===eName&&r.yr==_year)
          .reduce((s,r)=>s+(r.vals[i]||0),0)
      );
    }
    function _nom(){
      let total=0;
      try{ NOM_EDIT.forEach(n=>{
        total+=n.s*(n[cfg.nomKey]||0)/100;
      });}catch(e){}
      return MO.map(()=>Math.round(total));
    }
    const _sub=(a,b)=>a.map((v,i)=>v-(b[i]||0));

    const ing = _rv('ingreso');
    const gas = _rv('gasto');
    const nom = _nom();
    const margen = _sub(ing, gas);
    const ebitda = _sub(margen, nom);

    // KPIs — period-filtered
    const totIng = _periodSum(ing, entKey);
    const totGas = _periodSum(gas, entKey);
    const totNom = _periodSum(nom, entKey);
    const totEbitda = _periodSum(ebitda, entKey);

    // ── Compare: previous year for EntGrupo ──
    const _egCmp = typeof cmpActive === 'function' && cmpActive();
    let _egPI=0, _egPG=0, _egPN=0, _egPE=0;
    if(_egCmp){
      const py = cmpPrevYear();
      const pIng = MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===eName&&r.yr==py).reduce((s,r)=>s+(r.vals[i]||0),0));
      const pGas = MO.map((_,i)=>(S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='gasto'&&r.ent===eName&&r.yr==py).reduce((s,r)=>s+(r.vals[i]||0),0));
      _egPI = _periodSum(pIng, entKey);
      _egPG = _periodSum(pGas, entKey);
      _egPN = _periodSum(nom, entKey); // nómina assumed constant
      _egPE = _egPI - _egPG - _egPN;
    }

    const qk = id => document.getElementById(id);
    if(qk(pfx+'-k-ing')) qk(pfx+'-k-ing').innerHTML = (totIng>0 ? fmtK(totIng) : '\u2014') + (_egCmp ? cmpBadge(totIng, _egPI) : '');
    if(qk(pfx+'-k-gas')) qk(pfx+'-k-gas').innerHTML = (totGas>0 ? fmtK(totGas) : '\u2014') + (_egCmp ? cmpBadge(totGas, _egPG, true) : '');
    if(qk(pfx+'-k-nom')) qk(pfx+'-k-nom').textContent = totNom>0 ? fmtK(totNom) : '\u2014';
    if(qk(pfx+'-k-ebitda')){
      qk(pfx+'-k-ebitda').innerHTML = fmtK(totEbitda) + (_egCmp ? cmpBadge(totEbitda, _egPE) : '');
      qk(pfx+'-k-ebitda').style.color = totEbitda>=0 ? 'var(--green)' : 'var(--red)';
    }

    // Table — breakdown by category
    const thead = document.getElementById(pfx+'-thead');
    const tbody = document.getElementById(pfx+'-tbody');
    if(!thead || !tbody) return;
    thead.innerHTML=`<th>Concepto</th>`+MO.map(m=>`<th class="r">${m}</th>`).join('')+`<th class="r">Total ${_year}</th>`;

    // Build rows: Ingresos by category, Gastos by category, Nomina, EBITDA
    const ingCats = (typeof ENT_CATS_ING !== 'undefined' ? ENT_CATS_ING[eName] : []) || [];
    const gasCats = (typeof ENT_CATS_GAS !== 'undefined' ? ENT_CATS_GAS[eName] : []) || [];

    function _rvCat(tipo, cat){
      return MO.map((_,i)=>
        (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo===tipo&&r.ent===eName&&r.cat===cat&&r.yr==_year)
          .reduce((s,r)=>s+(r.vals[i]||0),0)
      );
    }

    let rows = [];
    rows.push({l:'\u25b8 INGRESOS',hdr:true});
    ingCats.forEach(cat=>{
      const v = _rvCat('ingreso', cat);
      if(v.some(x=>x!==0)) rows.push({l:'  \u00b7 '+cat, vals:v, t:'ing'});
    });
    rows.push({l:'TOTAL INGRESOS', vals:ing, t:'total', bold:true});

    rows.push({l:'\u25b8 COSTOS + GASTOS', hdr:true});
    gasCats.forEach(cat=>{
      const v = _rvCat('gasto', cat);
      if(v.some(x=>x!==0)) rows.push({l:'  \u00b7 '+cat, vals:v, t:'gasto'});
    });
    rows.push({l:'TOTAL GASTOS', vals:gas, t:'total', bold:true});

    rows.push({l:'MARGEN BRUTO', vals:margen, t:'util', bold:true});
    rows.push({l:'N\u00d3MINA', vals:nom, t:'gasto', bold:true});
    rows.push({l:'EBITDA '+eName.toUpperCase(), vals:ebitda, t:'util', bold:true});

    tbody.innerHTML = rows.map(r=>{
      if(r.hdr) return`<tr class="grp"><td colspan="${MO.length+2}">${r.l}</td></tr>`;
      const tot=sum(r.vals);
      const cls=r.t==='util'?(tot>=0?'pos':'neg'):'';
      return`<tr><td${r.bold?' class="bld"':''}>${r.l}</td>${r.vals.map(v=>`<td class="mo ${v<0?'neg':v>0&&r.t==='ing'?'pos':''}">${v?fmtFull(v):'\u2014'}</td>`).join('')}<td class="mo bld ${cls}">${fmtFull(tot)}</td></tr>`;
    }).join('');

    // Charts
    rEvoChart('c-'+pfx+'-evo', [entKey]);
    _rEntGrupoIngChart(pfx, eName, ingCats, entKey);
  }

  // Helper chart: income mix donut for entity grupo views
  function _rEntGrupoIngChart(pfx, eName, ingCats, entKey){
    const canvasId = 'c-'+pfx+'-ing';
    const el = document.getElementById(canvasId);
    if(!el) return;
    if(typeof dc === 'function') dc(canvasId);

    const colors = ['rgba(0,115,234,.6)','rgba(0,184,117,.6)','rgba(255,112,67,.6)','rgba(155,81,224,.6)','rgba(229,57,53,.6)','rgba(33,150,243,.6)'];
    const _ek = entKey || (eName==='Wirebit'?'wb':eName==='Stellaris'?'stel':'sal');
    const data = ingCats.map(cat =>
      (S.recs||[]).filter(r=>!r.isSharedSource&&r.tipo==='ingreso'&&r.ent===eName&&r.cat===cat&&r.yr==_year)
        .reduce((s,r)=>s+_periodSum(r.vals, _ek),0)
    ).filter((_,i)=>ingCats[i]);

    const labels = ingCats.map((cat,i) => cat + ' ' + (typeof fmtK==='function'?fmtK(data[i]||0):''));

    if(typeof CH !== 'undefined') CH[canvasId] = new Chart(el,{
      type:'doughnut',
      data:{
        labels: labels,
        datasets:[{data:data, backgroundColor:colors.slice(0, data.length), borderWidth:0}]
      },
      options:{responsive:true, plugins:{legend:{position:'bottom',labels:{font:{size:10}}},title:{display:true,text:'Mix Ingresos '+eName,font:{size:12}}}}
    });
  }

  // ═══════════════════════════════════════
  // Popups detalle por cliente (KPI cards)
  // ═══════════════════════════════════════
  function _credKpiPopup(entKey, type){
    var credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    var activos = credits.filter(function(c){ return c.st==='Activo'; });
    var label = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
    var col = entKey==='end' ? '#00b875' : '#ff7043';
    var title, rows = [];

    if(type==='cartera'){
      title = 'Cartera por Cliente — ' + label;
      activos.forEach(function(c){
        var saldo = credSaldoActual(c);
        var pct = c.monto > 0 ? Math.round(saldo / c.monto * 100) : 0;
        rows.push({ cl: c.cl, val: saldo, sub: fmtK(c.monto) + ' original · ' + pct + '% pendiente', monto: c.monto });
      });
      rows.sort(function(a,b){ return b.val - a.val; });
    }
    else if(type==='cobrado'){
      title = 'Ingreso Cobrado por Cliente — ' + label;
      activos.forEach(function(c){
        if(!c.amort || c.amort.length<=1) return;
        var cobrado = 0, periodos = 0;
        c.amort.slice(1).forEach(function(row){
          var st = credPeriodStatus(c, row);
          if(st==='PAGADO'){
            cobrado += (row.int||0);
            periodos++;
          } else if(st==='PARCIAL'){
            var _pgs = c.pagos||[];
            var _pg = _pgs.find(function(p){ return p.periodo===row.periodo; });
            var _pct = (_pg && row.pago>0) ? _pg.monto/row.pago : 0;
            cobrado += Math.round((row.int||0) * _pct);
            periodos++;
          }
        });
        rows.push({ cl: c.cl, val: cobrado, sub: periodos + ' periodo'+(periodos!==1?'s':'')+' cobrado'+(periodos!==1?'s':'') + ' · ' + c.tasa+'% anual' });
      });
      rows.sort(function(a,b){ return b.val - a.val; });
    }
    else if(type==='pendiente'){
      title = 'Ingreso por Cobrar por Cliente — ' + label;
      activos.forEach(function(c){
        if(!c.amort || c.amort.length<=1) return;
        var pend = 0, periodos = 0, vencido = 0;
        c.amort.slice(1).forEach(function(row){
          var st = credPeriodStatus(c, row);
          if(st==='VENCIDO'){
            pend += (row.int||0) + (row.ivaInt||0);
            vencido += (row.int||0) + (row.ivaInt||0);
            periodos++;
          } else if(st==='PENDIENTE'){
            pend += (row.int||0) + (row.ivaInt||0);
            periodos++;
          } else if(st==='PARCIAL'){
            var _pgs = c.pagos||[];
            var _pg = _pgs.find(function(p){ return p.periodo===row.periodo; });
            var _pct = (_pg && row.pago>0) ? _pg.monto/row.pago : 0;
            var resto = Math.round(((row.int||0) + (row.ivaInt||0)) * (1 - _pct));
            pend += resto;
            periodos++;
          }
        });
        if(pend > 0) rows.push({ cl: c.cl, val: pend, sub: periodos + ' periodo'+(periodos!==1?'s':'') + (vencido>0 ? ' · <span style="color:var(--red)">' + fmtK(vencido) + ' vencido</span>' : ' · al corriente'), vencido: vencido });
      });
      rows.sort(function(a,b){ return b.val - a.val; });
    }

    var total = rows.reduce(function(s,r){ return s + r.val; }, 0);
    var html = '<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:baseline">'
      + '<span style="font-size:.78rem;color:var(--muted)">' + rows.length + ' cliente'+(rows.length!==1?'s':'')+'</span>'
      + '<span style="font-family:\'Poppins\',sans-serif;font-weight:700;font-size:1.1rem;color:'+col+'">' + fmtK(total) + '</span>'
      + '</div>';

    html += '<div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">';
    rows.forEach(function(r){
      var pct = total > 0 ? (r.val / total * 100) : 0;
      html += '<div style="background:var(--bg);border-radius:10px;padding:12px 14px;border:1px solid var(--border)">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
        + '<span style="font-weight:700;font-size:.82rem">' + _esc(r.cl) + '</span>'
        + '<span style="font-family:\'Poppins\',sans-serif;font-weight:700;font-size:.88rem;color:'+col+'">' + fmtK(r.val) + '</span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
        + '<span style="font-size:.68rem;color:var(--muted)">' + r.sub + '</span>'
        + '<span style="font-size:.65rem;color:var(--muted)">' + pct.toFixed(1) + '%</span>'
        + '</div>'
        + '<div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px;overflow:hidden">'
        + '<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:2px"></div>'
        + '</div>'
        + '</div>';
    });
    if(rows.length===0) html += '<div style="text-align:center;padding:30px;color:var(--muted);font-size:.82rem">Sin datos</div>';
    html += '</div>';

    openModal(null, title, html);
  }

  // Expose globals
  window._credKpiPopup = _credKpiPopup;
  window.fmtK = fmtK;
  window._isCostRow = _isCostRow;
  window.COST_CATS = COST_CATS;
  window.ENT_MAP = ENT_MAP;
  window.rPL = rPL;
  window.rConsolidado = rConsolidado;
  window.rEntGrupo = rEntGrupo;
  window.rIngView = rIngView;
  window.rGasView = rGasView;
  window.rNomView = rNomView;
  window.rWBNom = rWBNom;
  window.rSalTPV = rSalTPV;
  window.rSalGas = rSalGas;

  // Register P&L views for all 5 entities + consolidados
  if(typeof registerPL === 'function'){
    registerPL('sal');
    registerPL('end');
    registerPL('dyn');
    registerPL('wb');
    registerPL('stel');
  }
  if(typeof registerView === 'function'){
    registerView('centum', function(){ return _syncAll().then(function(){ rConsolidado('centum'); rConsCharts('centum'); rEvoChart('c-centum-evo',['sal','end','dyn']); }); });
    registerView('grupo', function(){ return _syncAll().then(function(){ rConsolidado('grupo'); rConsCharts('grupo'); rEvoChart('c-grupo-evo',['sal','end','dyn','wb','stel']); }); });
    registerView('wb_grupo', function(){ return _syncAll().then(function(){ rEntGrupo('wb'); }); });
    registerView('stel_grupo', function(){ return _syncAll().then(function(){ rEntGrupo('stel'); }); });
  }

})(window);
