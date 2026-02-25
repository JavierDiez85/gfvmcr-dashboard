// GFVMCR — Router: navegación y routing de vistas

// VIEW ROUTING
// ═══════════════════════════════════════
const VT = {
  resumen:'Dashboard Grupo Financiero',ingresar:'Ingresar Datos',nomina:'Nómina Compartida',gastos_comp:'Gastos Compartidos',
  sal_res:'Salem — P&L',sal_tpv:'Salem — TPV / Clientes',sal_gas:'Salem — Gastos',
  end_res:'Endless — P&L',end_cred:'Endless — Cartera',
  dyn_res:'Dynamo — P&L',dyn_cred:'Dynamo — Cartera',
  tpv_general:'Terminales — Dashboard General', tpv_dashboard:'Terminales — Dashboard Periodo',
  tpv_pagos:'Terminales — Control de Pagos', tpv_resumen:'Terminales — Resumen por Cliente',
  tpv_agentes:'Terminales — Comisiones Agentes', tpv_terminales:'Terminales — Por Cliente',
  tpv_cambios:'Terminales — Cambios de Terminal',
  wb_res:'Wirebit — P&L',wb_ing:'Wirebit — Ingresos',wb_nom:'Wirebit — Nómina',
  centum:'Centum Capital',grupo:'Grupo Financiero',cfg_usuarios:'Configuración — Usuarios',cfg_apariencia:'Configuración — Apariencia',cfg_permisos:'Configuración — Permisos',cfg_categorias:'Configuración — Categorías P&L',cfg_bancos:'Configuración — Bancos y Cuentas',tes_flujo:'Tesorería — Flujo de Caja',tes_individual:'Tesorería — Por Empresa',tes_grupo:'Tesorería — Consolidado Grupo',carga_creditos:'Captura — Carga de Créditos'
};

function navTo(id){
  // Ensure finanzas submenu is open
  const miEl = document.getElementById('mi-finanzas');
  if(miEl && (_activeMenu !== 'finanzas' || !_subOpen)){
    openMenu('finanzas', miEl);
  }
  // Find sidebar item by data-view attribute (reliable)
  const siEl = document.querySelector(`.si[data-view="${id}"]`);
  sv(id, siEl);
}

function sv(id, navEl){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.si').forEach(n=>n.classList.remove('active'));
  const v = document.getElementById('view-'+id);
  if(v) v.classList.add('active');
  if(navEl) navEl.classList.add('active');
  document.getElementById('vt').textContent = VT[id]||id;
  document.getElementById('vbc').textContent = VT[id]||id;
  render(id);
}

function render(id){
  switch(id){
    case 'resumen': rResumen(); break;
    case 'nomina': rNomina(); break;
    case 'gastos_comp': rGastosComp(); break;
    case 'tpv_general': initTPVTables(); setTimeout(initTPVCharts_general,50); break;
    case 'tpv_dashboard': initTPVTables(); setTimeout(initTPVCharts_dashboard,50); break;
    case 'tpv_pagos': rTPVPagos(); break;
    case 'tpv_resumen': break;
    case 'tpv_agentes': rTPVAgentes(); setTimeout(initTPVCharts_agentes,50); break;
    case 'tar_dashboard': setTimeout(()=>initTarCharts('tar_dashboard'),50); break;
    case 'tar_conceptos': setTimeout(()=>initTarCharts('tar_conceptos'),50); break;
    case 'tar_subclientes': setTimeout(()=>initTarCharts('tar_subclientes'),50); break;
    case 'tar_rechazos': setTimeout(()=>initTarCharts('tar_rechazos'),50); break;
    case 'tar_tarjetahabientes': setTimeout(()=>initTarCharts('tar_tarjetahabientes'),50); break;
    case 'tpv_terminales': rTPVTerminales(); break;
    case 'tpv_cambios': rTPVCambios(); break;
    case 'sal_res': rPL('sal'); rPLCharts('sal'); break;
    case 'sal_tpv': rSalTPV(); break;
    case 'sal_gas': rSalGas(); break;
    case 'end_res': fiInjectCredits(); syncFlujoToRecs(); rPL('end'); rPLCharts('end'); break;
    case 'end_cred': rEndCred(); break;
    case 'dyn_res': fiInjectCredits(); syncFlujoToRecs(); rPL('dyn'); rPLCharts('dyn'); break;
    case 'dyn_cred': rDynCred(); break;
    case 'wb_res': rPL('wb'); rPLCharts('wb'); break;
    case 'wb_ing': rWBIng(); break;
    case 'wb_nom': rWBNom(); break;
    case 'centum': rConsolidado('centum'); rConsCharts('centum'); break;
    case 'grupo': rConsolidado('grupo'); rConsCharts('grupo'); break;
    case 'tes_flujo': rTesFlujo(); break;
    case 'tes_individual': rTesIndividual(); break;
    case 'tes_grupo': rTesGrupo(); break;
    case 'cfg_usuarios': rUsuarios(); break;
    case 'cfg_apariencia': rApariencia(); break;
    case 'cfg_permisos': rPermisos(); break;
    case 'cfg_categorias': rCatView(); break;
    case 'cfg_bancos': rBancosView(); break;
    case 'carga_creditos': rCargaCreditos(); break;
    case 'flujo_ing': fiLoad(); fiInjectCredits(); rFlujoIng(); break;
    case 'flujo_gas': rFlujoGas(); break;
    case 'ingresar': rFlujoIng(); break;
  }
}

// ═══════════════════════════════════════
