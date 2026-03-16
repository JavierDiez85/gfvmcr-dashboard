// GF — Navigation Structure: dual nav (sidebar + horizontal)

// ═══════════════════════════════════════
// NAV_STRUCTURE — single source of truth
// ═══════════════════════════════════════
const NAV_STRUCTURE = {
  companies: [
    {
      id:'grupo', label:'Grupo', icon:'🏢', color:'#0073ea',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'resumen',
          groups:[{ label:null, views:[
            {id:'resumen',label:'Dashboard Grupo',icon:'🏠'},
            {id:'centum',label:'Centum Capital',icon:'🏢'},
            {id:'grupo',label:'Consolidado',icon:'🌐'},
          ]}]
        },
        { id:'tesoreria', label:'Tesorería', icon:'🏛️', defaultView:'tes_flujo',
          groups:[{ label:null, views:[
            {id:'tes_flujo',label:'Flujo de Caja',icon:'📥'},
            {id:'tes_individual',label:'Por Empresa',icon:'🏢'},
            {id:'tes_grupo',label:'Consolidado Grupo',icon:'🌐'},
          ]}]
        },
        { id:'carga', label:'Carga de Datos', icon:'📋', defaultView:'carga_masiva',
          groups:[
            { label:'General', views:[
              {id:'carga_masiva',label:'Carga Masiva',icon:'📋'},
              {id:'flujo_ing',label:'Flujo de Ingresos',icon:'📥'},
              {id:'flujo_gas',label:'Flujo de Gastos',icon:'📤'},
              {id:'nomina',label:'Nómina Compartida',icon:'👥'},
              {id:'gastos_comp',label:'Gastos Compartidos',icon:'⚙️'},
              {id:'carga_creditos',label:'Carga de Créditos',icon:'📄'},
            ]},
            { label:'Empresas', views:[
              {id:'tpv_upload',label:'Datos TPV',icon:'⬆️'},
              {id:'tpv_comisiones',label:'Config. Comisiones',icon:'⚙️'},
              {id:'tar_upload',label:'Carga Tarjetas',icon:'💳'},
              {id:'wb_upload',label:'Wirebit Cripto',icon:'⛓'},
              {id:'wb_tar_upload',label:'Wirebit Tarjetas',icon:'💳'},
            ]},
          ]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'carga_facturas',
          groups:[{ label:null, views:[
            {id:'carga_facturas',label:'Facturas Emitidas',icon:'📤'},
            {id:'carga_egresos',label:'Facturas Recibidas',icon:'📥'},
            {id:'pagos_pendientes',label:'Pagos Pendientes',icon:'💳'},
          ]}]
        },
      ]
    },
    {
      id:'salem', label:'Salem', icon:'💙', color:'#0073ea',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'sal_res',
          groups:[{ label:null, views:[
            {id:'sal_res',label:'Resumen P&L',icon:'📊'},
            {id:'sal_ing',label:'Ingresos',icon:'💰'},
            {id:'sal_gas',label:'Costes y Gastos',icon:'💸'},
            {id:'sal_nom',label:'Nómina',icon:'👥'},
          ]}]
        },
        { id:'operacion', label:'Operación', icon:'⚙️', defaultView:'tpv_general',
          groups:[
            { label:'Terminales', views:[
              {id:'tpv_general',label:'Dashboard General',icon:'🌐'},
              {id:'tpv_dashboard',label:'Dashboard Periodo',icon:'📊'},
              {id:'tpv_pagos',label:'Control de Pagos',icon:'💳'},
              {id:'tpv_resumen',label:'Resumen por Cliente',icon:'👤'},
              {id:'tpv_agentes',label:'Comisiones Agentes',icon:'🤝'},
              {id:'tpv_terminales',label:'Gestión Terminales',icon:'🖥️'},
              {id:'tpv_promotores',label:'Promotores',icon:'👥'},
            ]},
            { label:'Tarjetas', views:[
              {id:'tar_dashboard',label:'Dashboard General',icon:'📊'},
              {id:'tar_conceptos',label:'Desglose Concepto',icon:'🏷️'},
              {id:'tar_subclientes',label:'Top Subclientes',icon:'🏢'},
              {id:'tar_rechazos',label:'Análisis Rechazos',icon:'⚠️'},
              {id:'tar_tarjetahabientes',label:'Tarjetahabientes',icon:'👥'},
            ]},
            { label:'Tickets', views:[
              {id:'tk_pagos_tpv',label:'Pagos TPV',icon:'🎫'},
            ]},
          ]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_terminales',
          groups:[{ label:null, views:[
            {id:'fact_terminales',label:'Terminales',icon:'🖥️'},
            {id:'fact_tarjetas',label:'Tarjetas',icon:'💳'},
          ]}]
        },
      ]
    },
    {
      id:'endless', label:'Endless', icon:'💚', color:'#00b875',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'end_res',
          groups:[{ label:null, views:[
            {id:'end_res',label:'Resumen P&L',icon:'📊'},
            {id:'end_ing',label:'Ingresos',icon:'💰'},
            {id:'end_gas',label:'Costes y Gastos',icon:'💸'},
            {id:'end_nom',label:'Nómina',icon:'👥'},
          ]}]
        },
        { id:'operacion', label:'Operación', icon:'⚙️', defaultView:'cred_dash',
          groups:[{ label:'Créditos', views:[
            {id:'cred_dash',label:'Dashboard Créditos',icon:'📊'},
            {id:'end_cred',label:'Cartera Endless',icon:'📋'},
            {id:'cred_cobr',label:'Cobranza Endless',icon:'⚠️'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_endless',
          groups:[{ label:null, views:[
            {id:'fact_endless',label:'Facturación Endless',icon:'💚'},
          ]}]
        },
      ]
    },
    {
      id:'dynamo', label:'Dynamo', icon:'🔶', color:'#ff7043',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'dyn_res',
          groups:[{ label:null, views:[
            {id:'dyn_res',label:'Resumen P&L',icon:'📊'},
            {id:'dyn_ing',label:'Ingresos',icon:'💰'},
            {id:'dyn_gas',label:'Costes y Gastos',icon:'💸'},
            {id:'dyn_nom',label:'Nómina',icon:'👥'},
          ]}]
        },
        { id:'operacion', label:'Operación', icon:'⚙️', defaultView:'dyn_dash',
          groups:[{ label:'Créditos', views:[
            {id:'dyn_dash',label:'Dashboard Créditos',icon:'📊'},
            {id:'dyn_cred',label:'Cartera Dynamo',icon:'📋'},
            {id:'dyn_cobr',label:'Cobranza Dynamo',icon:'⚠️'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_dynamo',
          groups:[{ label:null, views:[
            {id:'fact_dynamo',label:'Facturación Dynamo',icon:'🔶'},
          ]}]
        },
      ]
    },
    {
      id:'wirebit', label:'Wirebit', icon:'💜', color:'#9b51e0',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'wb_res',
          groups:[{ label:null, views:[
            {id:'wb_res',label:'Resumen P&L',icon:'📊'},
            {id:'wb_ing',label:'Ingresos',icon:'💰'},
            {id:'wb_gas',label:'Costes y Gastos',icon:'💸'},
            {id:'wb_nom',label:'Nómina',icon:'👥'},
          ]}]
        },
        { id:'operacion', label:'Operación', icon:'⚙️', defaultView:'wb_cripto',
          groups:[{ label:null, views:[
            {id:'wb_cripto',label:'Transacciones Cripto',icon:'🔍'},
            {id:'wb_tarjetas',label:'Transacciones Tarjetas',icon:'💳'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_wirebit',
          groups:[{ label:null, views:[
            {id:'fact_wirebit',label:'Facturación Wirebit',icon:'💜'},
          ]}]
        },
      ]
    },
    {
      id:'stellaris', label:'Stellaris', icon:'🔴', color:'#e53935',
      sections:[
        { id:'finanzas', label:'Finanzas', icon:'💹', defaultView:'stel_res',
          groups:[{ label:null, views:[
            {id:'stel_res',label:'Resumen P&L',icon:'📊'},
            {id:'stel_ing',label:'Ingresos',icon:'💰'},
            {id:'stel_gas',label:'Costes y Gastos',icon:'💸'},
            {id:'stel_nom',label:'Nómina',icon:'👥'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_stellaris',
          groups:[{ label:null, views:[
            {id:'fact_stellaris',label:'Facturación Stellaris',icon:'🔴'},
          ]}]
        },
      ]
    },
  ],
  crossCutting: [
    {
      id:'config', label:'Configuración', icon:'⚙️', defaultView:'cfg_usuarios',
      views:[
        {id:'cfg_usuarios',label:'Usuarios',icon:'👤'},
        {id:'cfg_permisos',label:'Permisos',icon:'🔐'},
        {id:'cfg_apariencia',label:'Apariencia',icon:'🎨'},
        {id:'cfg_categorias',label:'Categorías P&L',icon:'📂'},
        {id:'cfg_bancos',label:'Bancos y Cuentas',icon:'🏦'},
      ]
    },
  ],
};

// ═══════════════════════════════════════
// NAV STATE
// ═══════════════════════════════════════
let _activeCompany  = null;   // 'grupo','salem','endless','dynamo','wirebit','stellaris'
let _activeSection  = null;   // 'finanzas','operacion','carga','expedientes','facturacion','tesoreria'
let _activeCross    = null;   // 'config'

// ═══════════════════════════════════════
// LOOKUP HELPERS
// ═══════════════════════════════════════

/** Find which company+section owns a viewId. Returns {company, section, group, view} or null */
function navLookupView(viewId){
  for(const co of NAV_STRUCTURE.companies){
    for(const sec of co.sections){
      for(const grp of sec.groups){
        const v = grp.views.find(x=>x.id===viewId);
        if(v) return {company:co, section:sec, group:grp, view:v};
      }
    }
  }
  // Check cross-cutting
  for(const cc of NAV_STRUCTURE.crossCutting){
    const v = cc.views.find(x=>x.id===viewId);
    if(v) return {company:null, section:null, group:null, view:v, cross:cc};
  }
  return null;
}

/** Get company definition by id */
function navGetCompany(id){ return NAV_STRUCTURE.companies.find(c=>c.id===id); }

/** Get all unique view IDs in the structure */
function navAllViewIds(){
  const ids = new Set();
  for(const co of NAV_STRUCTURE.companies)
    for(const sec of co.sections)
      for(const grp of sec.groups)
        for(const v of grp.views) ids.add(v.id);
  for(const cc of NAV_STRUCTURE.crossCutting)
    for(const v of cc.views) ids.add(v.id);
  return ids;
}

// ═══════════════════════════════════════
// GENERATE MENU_PERMS for backward compat
// ═══════════════════════════════════════
function navGenerateMenuPerms(){
  const perms = {};
  for(const co of NAV_STRUCTURE.companies){
    const subs = [];
    for(const sec of co.sections)
      for(const grp of sec.groups)
        for(const v of grp.views)
          if(!subs.find(s=>s.id===v.id)) subs.push({id:v.id, label:v.label});
    perms[co.id === 'grupo' ? 'grupo_menu' : co.id] = { label: co.icon+' '+co.label, subs };
  }
  for(const cc of NAV_STRUCTURE.crossCutting){
    perms[cc.id] = { label: cc.icon+' '+cc.label, subs: cc.views.map(v=>({id:v.id,label:v.label})) };
  }
  return perms;
}

// ═══════════════════════════════════════
// NAVIGATION FUNCTIONS
// ═══════════════════════════════════════

/** Select a company in the sidebar, render horizontal sections.
 *  Optional targetSection/targetView let navTo() jump to a specific place */
function selectCompany(companyId, targetSection, targetView){
  const co = navGetCompany(companyId);
  if(!co) return;

  _activeCross = null;
  _activeCompany = companyId;

  // Highlight sidebar
  document.querySelectorAll('.sb-co').forEach(el=>el.classList.remove('active'));
  const coEl = document.getElementById('co-'+companyId);
  if(coEl) coEl.classList.add('active');

  // Render horizontal section tabs
  renderHNav(co);

  // Select target section or first available
  const secId = targetSection || (co.sections.length ? co.sections[0].id : null);
  if(secId) selectSection(secId, targetView);
}

/** Select a section tab in horizontal menu.
 *  Optional targetView lets navTo() jump to a specific view */
function selectSection(sectionId, targetView){
  if(!_activeCompany) return;
  const co = navGetCompany(_activeCompany);
  if(!co) return;
  const sec = co.sections.find(s=>s.id===sectionId);
  if(!sec) return;

  _activeSection = sectionId;

  // Highlight tab
  document.querySelectorAll('.hnav-tab').forEach(t=>t.classList.remove('active'));
  const tabEl = document.querySelector(`.hnav-tab[data-sec="${sectionId}"]`);
  if(tabEl) tabEl.classList.add('active');

  // Render views row
  renderHNavViews(sec);

  // Navigate to target view or default
  selectView(targetView || sec.defaultView);
}

/** Handle cross-cutting click (Config).
 *  Optional targetView lets navTo() jump to a specific view */
function selectCross(crossId, targetView){
  const cc = NAV_STRUCTURE.crossCutting.find(c=>c.id===crossId);
  if(!cc) return;

  _activeCompany = null;
  _activeSection = null;
  _activeCross = crossId;

  // Highlight sidebar
  document.querySelectorAll('.sb-co').forEach(el=>el.classList.remove('active'));
  const coEl = document.getElementById('co-'+crossId);
  if(coEl) coEl.classList.add('active');

  // Render horizontal as simple view tabs
  const hnav = document.getElementById('hnav');
  const secRow = document.getElementById('hnav-sections');
  const viewRow = document.getElementById('hnav-views');

  secRow.innerHTML = cc.views.map(v =>
    `<div class="hnav-tab" data-sec="${v.id}" onclick="selectCrossView('${v.id}')">${v.icon} ${v.label}</div>`
  ).join('');
  viewRow.innerHTML = '';
  hnav.style.display = '';

  // Select target view or default
  selectCrossView(targetView || cc.defaultView);
}

/** Select a view within cross-cutting section */
function selectCrossView(viewId){
  document.querySelectorAll('.hnav-tab').forEach(t=>t.classList.remove('active'));
  const tabEl = document.querySelector(`.hnav-tab[data-sec="${viewId}"]`);
  if(tabEl) tabEl.classList.add('active');

  document.getElementById('hnav-views').innerHTML = '';
  sv(viewId, null);
}

/** Navigate to home — deselect everything */
function navHome(){
  _activeCompany = null;
  _activeSection = null;
  _activeCross = null;
  document.querySelectorAll('.sb-co').forEach(el=>el.classList.remove('active'));
  document.getElementById('hnav').style.display = 'none';
  sv('inicio', null);
}

// ═══════════════════════════════════════
// RENDER HORIZONTAL NAV
// ═══════════════════════════════════════

/** Render section tabs for a company */
function renderHNav(co){
  const hnav = document.getElementById('hnav');
  const secRow = document.getElementById('hnav-sections');
  const viewRow = document.getElementById('hnav-views');

  // Check permissions — filter sections with no permitted views
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const perms = user?.perms || {};
  const isAdmin = user?.rol === 'admin';
  const hasCustom = Object.keys(perms).length > 0;

  const visibleSections = co.sections.filter(sec => {
    if(isAdmin && !hasCustom) return true;
    // Section visible if at least one view is permitted
    return sec.groups.some(grp => grp.views.some(v => _navViewAllowed(v.id, co.id, perms, isAdmin)));
  });

  secRow.innerHTML = visibleSections.map(sec =>
    `<div class="hnav-tab" data-sec="${sec.id}" onclick="selectSection('${sec.id}')">${sec.icon} ${sec.label}</div>`
  ).join('');

  viewRow.innerHTML = '';
  hnav.style.display = '';
}

/** Render view chips for a section (with group labels) */
function renderHNavViews(sec){
  const viewRow = document.getElementById('hnav-views');
  if(!viewRow) return;

  // Check permissions
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const perms = user?.perms || {};
  const isAdmin = user?.rol === 'admin';
  const hasCustom = Object.keys(perms).length > 0;
  const coId = _activeCompany;

  let html = '';
  for(const grp of sec.groups){
    const visibleViews = grp.views.filter(v => {
      if(isAdmin && !hasCustom) return true;
      return _navViewAllowed(v.id, coId, perms, isAdmin);
    });
    if(!visibleViews.length) continue;

    // Group label (only if there's a label and multiple groups have views)
    if(grp.label){
      html += `<div class="hnav-group-label">${grp.label}</div>`;
    }
    for(const v of visibleViews){
      html += `<div class="hnav-view" data-view="${v.id}" onclick="selectView('${v.id}')">${v.label}</div>`;
    }
  }
  viewRow.innerHTML = html;
}

/** Select a specific view chip */
function selectView(viewId){
  // Highlight chip
  document.querySelectorAll('.hnav-view').forEach(c=>c.classList.remove('active'));
  const chip = document.querySelector(`.hnav-view[data-view="${viewId}"]`);
  if(chip) chip.classList.add('active');

  sv(viewId, null);
}

/** Check if a view is allowed by permissions */
function _navViewAllowed(viewId, companyId, perms, isAdmin){
  const menuKey = companyId === 'grupo' ? 'grupo_menu' : companyId;
  if(isAdmin){
    if(perms[menuKey] === false) return false;
    if(perms[viewId] === false) return false;
    return true;
  }
  // Non-admin needs explicit permission
  if(perms[viewId] === true) return true;
  if(perms[menuKey] === 'menu' || perms[menuKey] === true) return true;
  // Backward compat: old 'facturacion' and 'expedientes' top-level menu keys
  if((perms['facturacion'] === 'menu' || perms['facturacion'] === true) &&
     (viewId.startsWith('fact_') || viewId === 'carga_facturas')) return true;
  if((perms['expedientes'] === 'menu' || perms['expedientes'] === true) &&
     viewId === 'expedientes') return true;
  return false;
}

// ═══════════════════════════════════════
