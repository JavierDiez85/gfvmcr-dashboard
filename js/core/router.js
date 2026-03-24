// GF — Router: navegación y routing de vistas

// VIEW ROUTING
// ═══════════════════════════════════════
const VT = {
  inicio:'Panel de Control',
  resumen:'Dashboard Grupo Financiero',ingresar:'Ingresar Datos',
  flujo_ing:'Carga — Flujo de Ingresos',flujo_gas:'Carga — Flujo de Gastos',
  nomina:'Carga — Nómina Compartida',gastos_comp:'Carga — Gastos Compartidos',
  sal_res:'Salem — P&L',sal_ing:'Salem — Ingresos',sal_gas:'Salem — Costes y Gastos',sal_nom:'Salem — Nómina',
  cred_dash:'Endless — Dashboard Créditos',
  cred_cobr:'Endless — Cobranza',
  dyn_cobr:'Dynamo — Cobranza',
  end_res:'Endless — P&L',end_ing:'Endless — Ingresos',end_gas:'Endless — Costes y Gastos',end_nom:'Endless — Nómina',end_cred:'Endless — Cartera',
  dyn_res:'Dynamo — P&L',dyn_ing:'Dynamo — Ingresos',dyn_gas:'Dynamo — Costes y Gastos',dyn_nom:'Dynamo — Nómina',dyn_cred:'Dynamo — Cartera',
  dyn_dash:'Dynamo — Dashboard Créditos',
  tpv_general:'Terminales — Dashboard General', tpv_dashboard:'Terminales — Dashboard Periodo',
  tpv_pagos:'Terminales — Control de Pagos', tpv_resumen:'Terminales — Resumen por Cliente',
  tpv_agentes:'Terminales — Comisiones Agentes', tpv_terminales:'Terminales — Gestión de Terminales',
  tpv_promotores:'Terminales — Promotores',
  tpv_comisiones:'Terminales — Configuración de Comisiones',
  tk_pagos_tpv:'Tickets — Pagos TPV',
  tpv_upload:'Carga — Datos TPV',
  tar_upload:'Carga — Tarjetas CENTUM',
  wb_res:'Wirebit — P&L',wb_ing:'Wirebit — Ingresos',wb_gas:'Wirebit — Costes y Gastos',wb_cripto:'Wirebit — Transacciones Cripto',wb_nom:'Wirebit — Nómina',wb_tarjetas:'Wirebit — Tarjetas WB',wb_upload:'Wirebit — Carga Transacciones Cripto',wb_tar_upload:'Carga — Tarjetas Wirebit',
  tar_dashboard:'Tarjetas — Dashboard CENTUM',tar_conceptos:'Tarjetas — Conceptos',tar_subclientes:'Tarjetas — Subclientes',tar_rechazos:'Tarjetas — Rechazos',tar_tarjetahabientes:'Tarjetas — Tarjetahabientes',
  carga_masiva:'Carga — Masiva Ingresos y Gastos',
  carga_inversiones:'Carga — Inversión por Empresa',
  centum:'Centum Capital',grupo:'Grupo Financiero',cfg_usuarios:'Configuración — Usuarios',cfg_apariencia:'Configuración — Apariencia',cfg_permisos:'Configuración — Permisos',cfg_categorias:'Configuración — Categorías P&L',cfg_bancos:'Configuración — Bancos y Cuentas',tes_flujo:'Tesorería — Flujo de Caja',tes_individual:'Tesorería — Por Empresa',tes_grupo:'Tesorería — Consolidado Grupo',carga_creditos:'Carga — Créditos PDF',
  fact_terminales:'Facturación — Terminales',fact_tarjetas:'Facturación — Tarjetas',fact_endless:'Facturación — Endless',fact_dynamo:'Facturación — Dynamo',fact_wirebit:'Facturación — Wirebit',fact_stellaris:'Facturación — Stellaris',
  stel_res:'Stellaris — P&L',stel_ing:'Stellaris — Ingresos',stel_gas:'Stellaris — Costes y Gastos',stel_nom:'Stellaris — Nómina',
  carga_facturas:'Facturación — Carga de Facturas',
  carga_egresos:'Facturación — Facturas Recibidas',pagos_pendientes:'Facturación — Pagos Pendientes',
  emit_salem:'Facturación — Emitidas Salem',emit_endless:'Facturación — Emitidas Endless',emit_dynamo:'Facturación — Emitidas Dynamo',emit_wirebit:'Facturación — Emitidas Wirebit',emit_stellaris:'Facturación — Emitidas Stellaris',
  recv_salem:'Facturación — Recibidas Salem',recv_endless:'Facturación — Recibidas Endless',recv_dynamo:'Facturación — Recibidas Dynamo',recv_wirebit:'Facturación — Recibidas Wirebit',recv_stellaris:'Facturación — Recibidas Stellaris',
  pp_salem:'Facturación — Pagos Pendientes Salem',pp_endless:'Facturación — Pagos Pendientes Endless',pp_dynamo:'Facturación — Pagos Pendientes Dynamo',pp_wirebit:'Facturación — Pagos Pendientes Wirebit',pp_stellaris:'Facturación — Pagos Pendientes Stellaris',
  expedientes:'Expedientes — Clientes',
  // Flujo Ingresos por empresa
  flujo_ing_sal:'Flujo de Ingresos — Salem',flujo_ing_end:'Flujo de Ingresos — Endless',flujo_ing_dyn:'Flujo de Ingresos — Dynamo',flujo_ing_wb:'Flujo de Ingresos — Wirebit',flujo_ing_stel:'Flujo de Ingresos — Stellaris',
  // Flujo Gastos por empresa
  flujo_gas_sal:'Flujo de Gastos — Salem',flujo_gas_end:'Flujo de Gastos — Endless',flujo_gas_dyn:'Flujo de Gastos — Dynamo',flujo_gas_wb:'Flujo de Gastos — Wirebit',flujo_gas_stel:'Flujo de Gastos — Stellaris',
  // Carga Masiva por empresa
  carga_masiva_sal:'Carga Masiva — Salem',carga_masiva_end:'Carga Masiva — Endless',carga_masiva_dyn:'Carga Masiva — Dynamo',carga_masiva_wb:'Carga Masiva — Wirebit',carga_masiva_stel:'Carga Masiva — Stellaris',
  // Créditos PDF por empresa
  carga_creditos_end:'Créditos PDF — Endless',carga_creditos_dyn:'Créditos PDF — Dynamo',
  // Expedientes por empresa
  expedientes_sal:'Expedientes — Salem',expedientes_end:'Expedientes — Endless',expedientes_dyn:'Expedientes — Dynamo',expedientes_wb:'Expedientes — Wirebit',expedientes_stel:'Expedientes — Stellaris',
  // Grupo Finanzas — vistas consolidado por empresa
  wb_grupo:'Wirebit — Consolidado',stel_grupo:'Stellaris — Consolidado',
};

// VIEW_ALIAS: mapea viewIds con sufijo de empresa al div HTML compartido
const VIEW_ALIAS = {
  flujo_ing_sal:'flujo_ing',flujo_ing_end:'flujo_ing',flujo_ing_dyn:'flujo_ing',flujo_ing_wb:'flujo_ing',flujo_ing_stel:'flujo_ing',
  flujo_gas_sal:'flujo_gas',flujo_gas_end:'flujo_gas',flujo_gas_dyn:'flujo_gas',flujo_gas_wb:'flujo_gas',flujo_gas_stel:'flujo_gas',
  carga_masiva_sal:'carga_masiva',carga_masiva_end:'carga_masiva',carga_masiva_dyn:'carga_masiva',carga_masiva_wb:'carga_masiva',carga_masiva_stel:'carga_masiva',
  carga_creditos_end:'carga_creditos',carga_creditos_dyn:'carga_creditos',
  expedientes_sal:'expedientes',expedientes_end:'expedientes',expedientes_dyn:'expedientes',expedientes_wb:'expedientes',expedientes_stel:'expedientes',
};

// ═══════════════════════════════════════
// VIEW REGISTRY — Features auto-register via registerView()
// ═══════════════════════════════════════
const VIEW_REGISTRY = {};

function registerView(id, handler) {
  VIEW_REGISTRY[id] = handler;
}

// Register P&L suite for an entity (4 views: _res, _ing, _gas, _nom)
function registerPL(entKey) {
  registerView(entKey+'_res', function(){ return _syncAll().then(function(){ rPL(entKey); rPLCharts(entKey); rEvoChart('c-'+entKey+'-evo', entKey); }); });
  registerView(entKey+'_ing', function(){ return _syncAll().then(function(){ rIngView(entKey); }); });
  registerView(entKey+'_gas', function(){ return _syncAll().then(function(){ rGasView(entKey); }); });
  registerView(entKey+'_nom', function(){ rNomView(entKey); });
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function navTo(id){
  if(id === 'inicio'){ navHome(); return; }

  // Look up which company+section owns this view
  const loc = navLookupView(id);
  if(loc){
    if(loc.cross){
      selectCross(loc.cross.id, id);
    } else {
      selectCompany(loc.company.id, loc.section.id, id);
    }
    return;
  }
  // Fallback: just show the view
  sv(id, null);
}

function sv(id, navEl){
  // Destruir charts de la vista anterior para liberar memoria
  if(typeof destroyAllCharts === 'function') destroyAllCharts();
  _currentView = id;
  try { sessionStorage.setItem('gf_lastView', id); } catch(e) {}
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const divId = VIEW_ALIAS[id] || id;
  const v = document.getElementById('view-'+divId);
  if(v) v.classList.add('active');

  // Highlight active chip in horizontal nav
  document.querySelectorAll('.hnav-view').forEach(c=>c.classList.remove('active'));
  const chip = document.querySelector(`.hnav-view[data-view="${id}"]`);
  if(chip) chip.classList.add('active');

  // Build breadcrumb
  const _label = VT[id]||id;
  const _parts = _label.split(' — ');
  const _pg  = _parts.length>1 ? _parts.slice(1).join(' — ') : _label;

  // Use company/section names in breadcrumb
  const co = _activeCompany ? navGetCompany(_activeCompany) : null;
  const coLabel = co ? co.label : 'Grupo Financiero';
  const secObj = co && _activeSection ? co.sections.find(s=>s.id===_activeSection) : null;
  const secLabel = secObj ? secObj.label : (_parts.length>1 ? _parts[0] : null);

  document.getElementById('vt').textContent = _pg;
  const _vbc = document.getElementById('vbc');
  _vbc.innerHTML = secLabel
    ? `<span>${coLabel}</span><span>›</span><span>${secLabel}</span><span>›</span><span style="color:var(--blue)">${_pg}</span>`
    : `<span>${coLabel}</span><span>›</span><span style="color:var(--blue)">${_pg}</span>`;
  render(id);
}

// Helper: full data pipeline — ensures ALL data sources are loaded and synced to S.recs
// Async because TPV data lives in Supabase and needs fetching before injection
async function _syncAll(){
  wbLoadFees();
  // Load credits from DB before injection
  try{const s=DB.get('gf_cred_end');if(s){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  try{const s=DB.get('gf_cred_dyn');if(s){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}
  fiLoad(); fgLoad();
  // Pre-fetch TPV commission data from Supabase into cache
  if(typeof TPV !== 'undefined' && TPV.calcMonthlyPL){
    try {
      await TPV.calcMonthlyPL(String(_year));
    } catch(e){
      console.warn('[_syncAll] TPV fetch:', e.message);
      // Avisar visualmente que los datos TPV en Finanzas pueden estar desactualizados
      if (typeof _syncStatus === 'function') {
        _syncStatus('error', 'TPV sin datos actuales');
        setTimeout(function(){ _syncStatus('offline','Pendiente'); }, 6000);
      }
    }
  }
  fiInjectTPV(); fiInjectCredits();
  if(typeof ceInjectGastos === 'function') ceInjectGastos();
  syncFlujoToRecs();
}

// Error banner visible para el usuario cuando una vista async falla
function _viewError(viewId, error) {
  console.error(`[View ${viewId}] Error:`, error);
  const divId = VIEW_ALIAS[viewId] || viewId;
  const el = document.getElementById('view-' + divId);
  if (el) {
    const existing = el.querySelector('.view-error-banner');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.className = 'view-error-banner';
    banner.style.cssText = 'background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;padding:12px 16px;margin:12px;border-radius:8px;font-size:.82rem';
    var msg = String(error.message || error).replace(/</g,'&lt;');
    var isSbErr = msg.toLowerCase().includes('supabase') || msg.toLowerCase().includes('no disponible');
    var extra = isSbErr
      ? '<br><button onclick="location.reload()" style="margin-top:6px;padding:4px 12px;background:#b91c1c;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:.8rem">🔄 Recargar página</button>'
      : '<br><small>Revisa la consola del navegador (F12) para más detalles.</small>';
    banner.innerHTML = '⚠️ Error cargando datos: <b>' + msg + '</b>' + extra;
    el.insertBefore(banner, el.firstChild && el.firstChild.nextSibling ? el.firstChild.nextSibling : el.firstChild);
  }
}

// ═══════════════════════════════════════
// RENDER — Dispatches to registered view handlers
// ═══════════════════════════════════════
function render(id){
  const _c = function(e){ _viewError(id, e); };
  const handler = VIEW_REGISTRY[id];
  if(handler){
    try {
      const result = handler();
      // If handler returns a Promise, catch errors
      if(result && typeof result.catch === 'function') result.catch(_c);
    } catch(e){ _c(e); }
  } else {
    // Stub views (fact_tarjetas, fact_endless, etc.) — no handler, no error
    if(!VT[id]) console.warn('[Router] Vista no registrada:', id);
  }
}

// Error boundary global — captura errores no controlados
window.addEventListener('error', function(e){
  if(_currentView && _currentView !== 'inicio'){
    console.error('[Global Error]', e.message, e.filename, e.lineno);
    _viewError(_currentView, {message: e.message || 'Error inesperado'});
  }
});
window.addEventListener('unhandledrejection', function(e){
  if(_currentView && _currentView !== 'inicio'){
    var msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason || 'Promise rechazada');
    console.error('[Unhandled Rejection]', msg);
    _viewError(_currentView, {message: msg});
  }
});

// ═══════════════════════════════════════
