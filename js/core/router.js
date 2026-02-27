// GF — Router: navegación y routing de vistas

// VIEW ROUTING
// ═══════════════════════════════════════
const VT = {
  inicio:'Panel de Control',
  resumen:'Dashboard Grupo Financiero',ingresar:'Ingresar Datos',
  flujo_ing:'Carga — Flujo de Ingresos',flujo_gas:'Carga — Flujo de Gastos',
  nomina:'Carga — Nómina Compartida',gastos_comp:'Carga — Gastos Compartidos',
  sal_res:'Salem — P&L',sal_ing:'Salem — Ingresos',sal_gas:'Salem — Costes y Gastos',sal_nom:'Salem — Nómina',
  cred_dash:'Créditos — Dashboard Consolidado',
  cred_cobr:'Créditos — Cobranza',
  end_res:'Endless — P&L',end_ing:'Endless — Ingresos',end_gas:'Endless — Costes y Gastos',end_nom:'Endless — Nómina',end_cred:'Endless — Cartera',
  dyn_res:'Dynamo — P&L',dyn_ing:'Dynamo — Ingresos',dyn_gas:'Dynamo — Costes y Gastos',dyn_nom:'Dynamo — Nómina',dyn_cred:'Dynamo — Cartera',
  tpv_general:'Terminales — Dashboard General', tpv_dashboard:'Terminales — Dashboard Periodo',
  tpv_pagos:'Terminales — Control de Pagos', tpv_resumen:'Terminales — Resumen por Cliente',
  tpv_agentes:'Terminales — Comisiones Agentes', tpv_terminales:'Terminales — Por Cliente',
  tpv_cambios:'Terminales — Cambios de Terminal',
  tpv_comisiones:'Terminales — Configuración de Comisiones',
  tpv_upload:'Carga — Datos TPV',
  tar_upload:'Carga — Tarjetas CENTUM',
  wb_res:'Wirebit — P&L',wb_ing:'Wirebit — Ingresos',wb_gas:'Wirebit — Costes y Gastos',wb_cripto:'Wirebit — Transacciones Cripto',wb_nom:'Wirebit — Nómina',wb_tarjetas:'Wirebit — Tarjetas WB',wb_upload:'Wirebit — Carga Transacciones Cripto',wb_tar_upload:'Carga — Tarjetas Wirebit',
  tar_dashboard:'Tarjetas — Dashboard CENTUM',tar_conceptos:'Tarjetas — Conceptos',tar_subclientes:'Tarjetas — Subclientes',tar_rechazos:'Tarjetas — Rechazos',tar_tarjetahabientes:'Tarjetas — Tarjetahabientes',
  carga_masiva:'Carga — Masiva Ingresos y Gastos',
  centum:'Centum Capital',grupo:'Grupo Financiero',cfg_usuarios:'Configuración — Usuarios',cfg_apariencia:'Configuración — Apariencia',cfg_permisos:'Configuración — Permisos',cfg_categorias:'Configuración — Categorías P&L',cfg_bancos:'Configuración — Bancos y Cuentas',tes_flujo:'Tesorería — Flujo de Caja',tes_individual:'Tesorería — Por Empresa',tes_grupo:'Tesorería — Consolidado Grupo',carga_creditos:'Carga — Créditos PDF'
};

function navTo(id){
  // Find which sub-panel owns this view
  const siEl = document.querySelector(`.si[data-view="${id}"]`);
  if(siEl){
    const panel = siEl.closest('.mi-sub');
    if(panel){
      const menuId = panel.id.replace('sub-','');
      const miEl = document.getElementById('mi-' + menuId);
      if(miEl){
        if(_activeMenu === menuId){
          // Same menu — just navigate
          sv(id, siEl);
          return;
        }
        // Different menu — switch and navigate
        openMenu(menuId, miEl, id);
        return;
      }
    }
  }
  sv(id, siEl);
}

function sv(id, navEl){
  _currentView = id;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.si').forEach(n=>n.classList.remove('active'));
  const v = document.getElementById('view-'+id);
  if(v) v.classList.add('active');
  if(navEl) navEl.classList.add('active');
  const _label = VT[id]||id;
  const _parts = _label.split(' — ');
  const _sec = _parts.length>1 ? _parts[0] : null;
  const _pg  = _parts.length>1 ? _parts.slice(1).join(' — ') : _label;
  document.getElementById('vt').textContent = _pg;
  const _vbc = document.getElementById('vbc');
  _vbc.innerHTML = _sec
    ? `<span>Grupo Financiero</span><span>›</span><span>${_sec}</span><span>›</span><span style="color:var(--blue)">${_pg}</span>`
    : `<span>Grupo Financiero</span><span>›</span><span style="color:var(--blue)">${_pg}</span>`;
  render(id);
}

// Helper: full data pipeline — ensures ALL data sources are loaded and synced to S.recs
// Async because TPV data lives in Supabase and needs fetching before injection
async function _syncAll(){
  wbLoadFees();
  // Load credits from DB before injection
  try{const s=DB.get('vmcr_cred_end');if(s){END_CREDITS.length=0;s.forEach(c=>END_CREDITS.push(c));}}catch(e){}
  try{const s=DB.get('vmcr_cred_dyn');if(s){DYN_CREDITS.length=0;s.forEach(c=>DYN_CREDITS.push(c));}}catch(e){}
  fiLoad(); fgLoad();
  // Pre-fetch TPV commission data from Supabase into cache
  if(typeof TPV !== 'undefined' && TPV.calcMonthlyPL){
    try { await TPV.calcMonthlyPL(String(_year)); } catch(e){ console.warn('[_syncAll] TPV fetch:', e.message); }
  }
  fiInjectTPV(); fiInjectCredits();
  syncFlujoToRecs();
}

function render(id){
  switch(id){
    case 'inicio': rInicio(); break;
    case 'resumen': _syncAll().then(()=>rResumen()); break;
    case 'nomina': rNomina(); break;
    case 'gastos_comp': rGastosComp(); break;
    case 'tpv_general': initTPVGeneral(); break;
    case 'tpv_dashboard': initTPVDashboard(); break;
    case 'tpv_pagos': rTPVPagos(); break;
    case 'tpv_resumen': rTPVResumen(); break;
    case 'tpv_agentes': rTPVAgentes(); break;
    case 'tar_dashboard': setTimeout(()=>initTarCharts('tar_dashboard'),50); break;
    case 'tar_conceptos': setTimeout(()=>initTarCharts('tar_conceptos'),50); break;
    case 'tar_subclientes': setTimeout(()=>initTarCharts('tar_subclientes'),50); break;
    case 'tar_rechazos': setTimeout(()=>initTarCharts('tar_rechazos'),50); break;
    case 'tar_tarjetahabientes': setTimeout(()=>initTarCharts('tar_tarjetahabientes'),50); break;
    case 'tpv_terminales': rTPVTerminales(); break;
    case 'tpv_cambios': rTPVCambios(); break;
    case 'tpv_comisiones': rTPVComisiones(); break;
    case 'tpv_upload': rTPVUpload(); break;
    case 'tar_upload': rTarUpload(); break;
    case 'sal_res': _syncAll().then(()=>{rPL('sal'); rPLCharts('sal'); rEvoChart('c-sal-evo','sal');}); break;
    case 'sal_ing': _syncAll().then(()=>rIngView('sal')); break;
    case 'sal_gas': _syncAll().then(()=>rGasView('sal')); break;
    case 'sal_nom': rNomView('sal'); break;
    case 'end_res': _syncAll().then(()=>{rPL('end'); rPLCharts('end'); rEvoChart('c-end-evo','end');}); break;
    case 'end_ing': _syncAll().then(()=>rIngView('end')); break;
    case 'end_gas': _syncAll().then(()=>rGasView('end')); break;
    case 'end_nom': rNomView('end'); break;
    case 'cred_dash': rCredDash(); break;
    case 'cred_cobr': rCredCobr(); break;
    case 'end_cred': rEndCred(); break;
    case 'dyn_res': _syncAll().then(()=>{rPL('dyn'); rPLCharts('dyn'); rEvoChart('c-dyn-evo','dyn');}); break;
    case 'dyn_ing': _syncAll().then(()=>rIngView('dyn')); break;
    case 'dyn_gas': _syncAll().then(()=>rGasView('dyn')); break;
    case 'dyn_nom': rNomView('dyn'); break;
    case 'dyn_cred': rDynCred(); break;
    case 'wb_res': _syncAll().then(()=>{rPL('wb'); rPLCharts('wb'); rEvoChart('c-wb-evo','wb');}); break;
    case 'wb_ing': wbLoadFees(); rWBIng(); break;
    case 'wb_gas': _syncAll().then(()=>rGasView('wb')); break;
    case 'wb_nom': rWBNom(); break;
    case 'wb_upload': rWBUpload(); break;
    case 'wb_cripto': rWBCripto(); break;
    case 'wb_tarjetas': rWBTarjetas(); break;
    case 'wb_tar_upload': rWBTarUpload(); break;
    case 'centum': _syncAll().then(()=>{rConsolidado('centum'); rConsCharts('centum'); rEvoChart('c-centum-evo',['sal','end','dyn']);}); break;
    case 'grupo': _syncAll().then(()=>{rConsolidado('grupo'); rConsCharts('grupo'); rEvoChart('c-grupo-evo',['sal','end','dyn','wb']);}); break;
    case 'tes_flujo': rTesFlujo(); break;
    case 'tes_individual': rTesIndividual(); break;
    case 'tes_grupo': rTesGrupo(); break;
    case 'cfg_usuarios': rUsuarios(); break;
    case 'cfg_apariencia': rApariencia(); break;
    case 'cfg_permisos': rPermisos(); break;
    case 'cfg_categorias': rCatView(); break;
    case 'cfg_bancos': rBancosView(); break;
    case 'carga_creditos': rCargaCreditos(); break;
    case 'carga_masiva': rCargaMasiva(); break;
    case 'flujo_ing': _syncAll().then(()=>rFlujoIng()); break;
    case 'flujo_gas': _syncAll().then(()=>rFlujoGas()); break;
    case 'ingresar': rFlujoIng(); break;
  }
}

// ═══════════════════════════════════════
