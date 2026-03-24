// GF — Data constants: presupuestos, nomina, gastos compartidos, creditos, categorias
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // Capture HTML source at load time for export
  // ═══════════════════════════════════════
  window._htmlSource = document.documentElement.outerHTML;

  // ═══════════════════════════════════════
  // DATA: WIREBIT PRESUPUESTO 2026 (del Excel)
  // ═══════════════════════════════════════
  // MO is now defined globally in helpers.js

  const WB_ING = {
    'Fees Fondeo Tarjetas':   [0,0,0,0,0,0,0,0,0,0,0,0],
    'Fees Fondeo Tarjeta CRM':[0,0,0,0,0,0,0,0,0,0,0,0],
    'Fees VEX Retail':        [0,0,0,0,0,0,0,0,0,0,0,0],
    'Fees VEX Ecommerce':     [0,0,0,0,0,0,0,0,0,0,0,0],
    'Fees Retiros / OTC':     [0,0,0,0,0,0,0,0,0,0,0,0],
  };
  const WB_ING_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];

  const WB_COSTOS = {
    'Bitfinex':           [0,0,0,0,0,0,0,0,0,0,0,0],
    'Lmax':               [0,0,0,0,0,0,0,0,0,0,0,0],
    'Bitso':              [0,0,0,0,0,0,0,0,0,0,0,0],
    'Efevoo Fondeo':      [0,0,0,0,0,0,0,0,0,0,0,0],
    'Efevoo Tarjetas':    [0,0,0,0,0,0,0,0,0,0,0,0],
    'Efevoo SaaS':        [0,0,0,0,0,0,0,0,0,0,0,0],
    'Comisiones BBVA':    [0,0,0,0,0,0,0,0,0,0,0,0],
  };
  const WB_COSTO_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];
  const WB_MARGEN = WB_ING_TOTAL.map((v,i)=>v-WB_COSTO_TOTAL[i]);

  // Inject Wirebit fees from localStorage into WB_ING arrays
  function wbLoadFees() {
    const data = DB.get('gf_wb_fees_2026');
    if (!data || !data.monthly) return;
    for (const [concepto, vals] of Object.entries(data.monthly)) {
      if (WB_ING[concepto]) {
        for (let i = 0; i < 12; i++) WB_ING[concepto][i] = Math.round(vals[i] || 0);
      }
    }
    // Recalculate totals
    for (let i = 0; i < 12; i++) {
      WB_ING_TOTAL[i] = Object.values(WB_ING).reduce((s, v) => s + v[i], 0);
      WB_MARGEN[i] = WB_ING_TOTAL[i] - WB_COSTO_TOTAL[i];
    }
  }

  const WB_NOM_TOTAL = [0,0,0,0,0,0,0,0,0,0,0,0];

  // ── NOM: nómina configurable (carga de Supabase/localStorage, fallback a defaults) ──
  const NOM_DEFAULTS = [
    {n:'\u00c1ngel Ahedo',     r:'Dir. Comercial',    s:120000, tipo:'Administrativo', dist:{Salem:.9, Endless:.05,Dynamo:.05,Wirebit:0, Stellaris:0}},
    {n:'Javier Diez',     r:'DOF / CFO',         s:120000, tipo:'Administrativo', dist:{Salem:.4, Endless:.1, Dynamo:.1, Wirebit:.4, Stellaris:0}},
    {n:'Joaquin Vallejo', r:'CEO Wirebit',       s:120000, tipo:'Administrativo', dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1, Stellaris:0}},
    {n:'Ezequiel',        r:'Tech Wirebit',      s:44000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1, Stellaris:0}},
    {n:'Anna',            r:'Marketing',         s:40000,  tipo:'Administrativo', dist:{Salem:.4, Endless:.1, Dynamo:.1, Wirebit:.4, Stellaris:0}},
    {n:'Ricardo',         r:'Tech Wirebit',      s:38000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1, Stellaris:0}},
    {n:'David',           r:'Ops Wirebit',       s:30000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1, Stellaris:0}},
    {n:'Ismael',          r:'Tech Wirebit',      s:22000,  tipo:'Operativo',      dist:{Salem:0,  Endless:0,  Dynamo:0,  Wirebit:1, Stellaris:0}},
    {n:'Emiliano Mendoza',r:'Serv. al cliente',  s:10000,  tipo:'Operativo',      dist:{Salem:.6, Endless:.1, Dynamo:.1, Wirebit:.2, Stellaris:0}},
    {n:'Sergio',          r:'Administraci\u00f3n',    s:8000,   tipo:'Administrativo', dist:{Salem:1,  Endless:0,  Dynamo:0,  Wirebit:0, Stellaris:0}},
  ];
  const NOM = (typeof DB !== 'undefined' && DB.get('gf_nomina')) || NOM_DEFAULTS;

  // Recalculate NOM_DIST from actual NOM data
  function _calcNomDist() {
    const d = {Salem:0, Endless:0, Dynamo:0, Wirebit:0, Stellaris:0};
    NOM.forEach(e => { for (const [ent, pct] of Object.entries(e.dist || {})) { d[ent] = (d[ent]||0) + Math.round(e.s * pct); } });
    return d;
  }
  const NOM_DIST = _calcNomDist();

  // ── GCOMP: gastos compartidos configurables ──
  const GCOMP_DEFAULTS = [
    {c:'Renta impresora',    cat:'Administrativo', sal:.2,end:.2,dyn:.2,wb:.4, stel:0, vals:[]},
    {c:'Renta oficina',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Mantenimiento',      cat:'Renta Oficina',  sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Alestra',            cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Luz',                cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Insumos Oficina',    cat:'Administrativo', sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Efevoo Tarjetas',    cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Efevoo TPV',         cat:'Costo Directo',  sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Material MKT',       cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Evento NL',          cat:'Marketing',      sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Viajes',             cat:'Representaci\u00f3n', sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Software',           cat:'Operaciones',    sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
    {c:'Hardware',           cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'STP',                cat:'Operaciones',    sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Comisiones SitesPay',cat:'Com. Bancarias', sal:1, end:0, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'CNBV Endless',       cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'CNBV Dynamo',        cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  stel:0, vals:[]},
    {c:'Icarus Endless',     cat:'Regulatorio',    sal:0, end:1, dyn:0, wb:0,  stel:0, vals:[]},
    {c:'Icarus Dynamo',      cat:'Regulatorio',    sal:0, end:0, dyn:1, wb:0,  stel:0, vals:[]},
    {c:'Otros/Varios',       cat:'Varios',         sal:.4,end:.1,dyn:.1,wb:.4, stel:0, vals:[]},
  ];
  const GCOMP = (typeof DB !== 'undefined' && DB.get('gf_gastos_comp')) || GCOMP_DEFAULTS;

  /** Save NOM/GCOMP changes back to storage */
  function nomSave() { if (typeof DB !== 'undefined') DB.set('gf_nomina', NOM); }
  function gcompSave() { if (typeof DB !== 'undefined') DB.set('gf_gastos_comp', GCOMP); }

  const SAL_TPV_CLIENTES = [];

  const SAL_GASTOS_ITEMS = [
    // Costos Directos
    {c:'N\u00f3mina Operativa',       cat:'N\u00f3mina',       sec:'cd', ppto:0},
    {c:'Software (CD)',          cat:'Operaciones',  sec:'cd', ppto:0},
    {c:'Hardware (CD)',          cat:'Operaciones',  sec:'cd', ppto:0},
    {c:'Comisiones Promotor\u00eda',  cat:'Com. Bancarias',sec:'cd',ppto:0},
    // Gastos Administrativos
    {c:'N\u00f3mina Administrativa',  cat:'N\u00f3mina',       sec:'ga', ppto:0},
    {c:'Renta Oficina',          cat:'Renta',        sec:'ga', ppto:0},
    {c:'Mantenimiento',          cat:'Renta',        sec:'ga', ppto:0},
    {c:'Renta Impresora',        cat:'Administrativo',sec:'ga',ppto:0},
    {c:'Software',               cat:'Operaciones',  sec:'ga', ppto:0},
    {c:'Hardware',               cat:'Operaciones',  sec:'ga', ppto:0},
    {c:'Efevoo Tarjetas',        cat:'Costo Directo',sec:'ga', ppto:0},
    {c:'Efevoo TPV',             cat:'Costo Directo',sec:'ga', ppto:0},
    {c:'Marketing',              cat:'Marketing',    sec:'ga', ppto:0},
    {c:'Luz',                    cat:'Administrativo',sec:'ga',ppto:0},
    {c:'Insumos Oficina',        cat:'Administrativo',sec:'ga',ppto:0},
    {c:'Vi\u00e1ticos',               cat:'Representaci\u00f3n',sec:'ga',ppto:0},
    {c:'Comisiones Bancarias',   cat:'Com. Bancarias',sec:'ga',ppto:0},
    {c:'Cumplimiento',           cat:'Regulatorio',  sec:'ga', ppto:0},
  ];

  const END_CREDITS = /*EMBED:END_CREDITS*/[]/*END:END_CREDITS*/;
  const DYN_CREDITS = /*EMBED:DYN_CREDITS*/[]/*END:DYN_CREDITS*/;

  const WB_NOM_DETAIL = [];

  // ═══════════════════════════════════════
  // CATEGORY CONSTANTS (from finanzas.js)
  // ═══════════════════════════════════════
  const CATS_ING  = ['TPV','Tarjeta Centum Black','Cr\u00e9dito Simple','Cr\u00e9dito Automotriz','Tarjeta Centum Blue','Exchange','OTC','Retiro Blockchain','Retiro FIAT','Tarjeta Wirebit','Otros Ingresos'];
  const CATS_GAS  = ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'];
  const ENT_CATS_ING = {
    'Salem':   ['TPV','Tarjeta Centum Black','Tarjeta Centum Blue','Otros Ingresos'],
    'Endless': ['Cr\u00e9dito Simple','Otros Ingresos'],
    'Dynamo':  ['Cr\u00e9dito Simple','Cr\u00e9dito Automotriz','Otros Ingresos'],
    'Wirebit': ['Exchange','OTC','Retiro Blockchain','Retiro FIAT','Tarjeta Wirebit','Otros Ingresos'],
    'Stellaris': ['M\u00e1quinas Net Win','Juego en Vivo','Mesas de Juego','Restaurante','Otros Ingresos'],
  };
  const ENT_CATS_GAS = {
    'Salem':   ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'],
    'Endless': ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'],
    'Dynamo':  ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'],
    'Wirebit': ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'],
    'Stellaris': ['N\u00f3mina','Costo Directo','Renta','Marketing','Operaciones','Regulatorio','Administrativo','Representaci\u00f3n','Com. Bancarias','Varios'],
  };
  function catsIng(ent){ return ENT_CATS_ING[ent] || CATS_ING; }
  function catsGas(ent){ return ENT_CATS_GAS[ent] || CATS_GAS; }

  // Auto-load Wirebit fees on script init
  wbLoadFees();

  // Expose globals
  window.WB_ING = WB_ING;
  window.WB_ING_TOTAL = WB_ING_TOTAL;
  window.WB_COSTOS = WB_COSTOS;
  window.WB_COSTO_TOTAL = WB_COSTO_TOTAL;
  window.WB_MARGEN = WB_MARGEN;
  window.wbLoadFees = wbLoadFees;
  window.WB_NOM_TOTAL = WB_NOM_TOTAL;
  window.NOM = NOM;
  window.NOM_DEFAULTS = NOM_DEFAULTS;
  window.NOM_DIST = NOM_DIST;
  window.nomSave = nomSave;
  window._calcNomDist = _calcNomDist;
  window.GCOMP = GCOMP;
  window.GCOMP_DEFAULTS = GCOMP_DEFAULTS;
  window.gcompSave = gcompSave;
  window.SAL_TPV_CLIENTES = SAL_TPV_CLIENTES;
  window.SAL_GASTOS_ITEMS = SAL_GASTOS_ITEMS;
  window.END_CREDITS = END_CREDITS;
  window.DYN_CREDITS = DYN_CREDITS;
  window.WB_NOM_DETAIL = WB_NOM_DETAIL;
  window.CATS_ING = CATS_ING;
  window.CATS_GAS = CATS_GAS;
  window.ENT_CATS_ING = ENT_CATS_ING;
  window.ENT_CATS_GAS = ENT_CATS_GAS;
  window.catsIng = catsIng;
  window.catsGas = catsGas;

})(window);
