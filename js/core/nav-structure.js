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
            {id:'grupo',label:'Consolidado',icon:'🌐'},
            {id:'centum',label:'Centum Capital',icon:'🏢'},
            {id:'wb_grupo',label:'Wirebit',icon:'💜'},
            {id:'stel_grupo',label:'Stellaris',icon:'🔴'},
          ]}]
        },
        { id:'tesoreria', label:'Tesorería', icon:'🏛️', defaultView:'tes_flujo',
          groups:[{ label:null, views:[
            {id:'tes_flujo',label:'Flujo de Caja',icon:'📥'},
            {id:'tes_individual',label:'Por Empresa',icon:'🏢'},
            {id:'tes_grupo',label:'Consolidado Grupo',icon:'🌐'},
          ]}]
        },
        { id:'carga', label:'Carga de Datos', icon:'📋', defaultView:'nomina',
          groups:[{ label:null, views:[
            {id:'nomina',label:'Nómina Compartida',icon:'👥'},
            {id:'gastos_comp',label:'Gastos Compartidos',icon:'⚙️'},
            {id:'carga_inversiones',label:'Inversión por Empresa',icon:'💰'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes',
          groups:[{ label:null, views:[
            {id:'expedientes',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'pagos_pendientes',
          groups:[{ label:null, views:[
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
        { id:'carga', label:'Carga de Datos', icon:'📤', defaultView:'tpv_upload',
          groups:[{ label:null, views:[
            {id:'carga_masiva_sal',label:'Carga Masiva',icon:'📊'},
            {id:'flujo_ing_sal',label:'Flujo de Ingresos',icon:'💰'},
            {id:'flujo_gas_sal',label:'Flujo de Gastos',icon:'💸'},
            {id:'tpv_upload',label:'Datos TPV',icon:'📱'},
            {id:'tpv_comisiones',label:'Config. Comisiones',icon:'⚙️'},
            {id:'tar_upload',label:'Tarjetas CENTUM',icon:'💳'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes_sal',
          groups:[{ label:null, views:[
            {id:'expedientes_sal',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'fact_terminales',
          groups:[{ label:null, views:[
            {id:'fact_terminales',label:'Terminales',icon:'🖥️'},
            {id:'emit_salem',label:'Emitidas',icon:'📤'},
            {id:'recv_salem',label:'Recibidas',icon:'📥'},
            {id:'pp_salem',label:'Pagos Pendientes',icon:'💳'},
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
        { id:'carga', label:'Carga de Datos', icon:'📤', defaultView:'carga_masiva_end',
          groups:[{ label:null, views:[
            {id:'carga_masiva_end',label:'Carga Masiva',icon:'📊'},
            {id:'flujo_ing_end',label:'Flujo de Ingresos',icon:'💰'},
            {id:'flujo_gas_end',label:'Flujo de Gastos',icon:'💸'},
            {id:'carga_creditos_end',label:'Créditos PDF',icon:'📄'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes_end',
          groups:[{ label:null, views:[
            {id:'expedientes_end',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'emit_endless',
          groups:[{ label:null, views:[
            {id:'emit_endless',label:'Emitidas',icon:'📤'},
            {id:'recv_endless',label:'Recibidas',icon:'📥'},
            {id:'pp_endless',label:'Pagos Pendientes',icon:'💳'},
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
        { id:'carga', label:'Carga de Datos', icon:'📤', defaultView:'carga_masiva_dyn',
          groups:[{ label:null, views:[
            {id:'carga_masiva_dyn',label:'Carga Masiva',icon:'📊'},
            {id:'flujo_ing_dyn',label:'Flujo de Ingresos',icon:'💰'},
            {id:'flujo_gas_dyn',label:'Flujo de Gastos',icon:'💸'},
            {id:'carga_creditos_dyn',label:'Créditos PDF',icon:'📄'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes_dyn',
          groups:[{ label:null, views:[
            {id:'expedientes_dyn',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'emit_dynamo',
          groups:[{ label:null, views:[
            {id:'emit_dynamo',label:'Emitidas',icon:'📤'},
            {id:'recv_dynamo',label:'Recibidas',icon:'📥'},
            {id:'pp_dynamo',label:'Pagos Pendientes',icon:'💳'},
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
        { id:'carga', label:'Carga de Datos', icon:'📤', defaultView:'carga_masiva_wb',
          groups:[{ label:null, views:[
            {id:'carga_masiva_wb',label:'Carga Masiva',icon:'📊'},
            {id:'flujo_ing_wb',label:'Flujo de Ingresos',icon:'💰'},
            {id:'flujo_gas_wb',label:'Flujo de Gastos',icon:'💸'},
            {id:'wb_upload',label:'Transacciones Cripto',icon:'🪙'},
            {id:'wb_tar_upload',label:'Tarjetas Wirebit',icon:'💳'},
          ]}]
        },
        { id:'expedientes', label:'Expedientes', icon:'📁', defaultView:'expedientes_wb',
          groups:[{ label:null, views:[
            {id:'expedientes_wb',label:'Clientes',icon:'👤'},
          ]}]
        },
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'emit_wirebit',
          groups:[{ label:null, views:[
            {id:'emit_wirebit',label:'Emitidas',icon:'📤'},
            {id:'recv_wirebit',label:'Recibidas',icon:'📥'},
            {id:'pp_wirebit',label:'Pagos Pendientes',icon:'💳'},
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
        { id:'operacion', label:'Operación', icon:'🎰', defaultView:'stel_casino',
          groups:[
            { label:'Maquinas', views:[
              {id:'stel_casino',label:'Dashboard Casino',icon:'🎰'},
            ]},
            { label:'Boveda', views:[
              {id:'stel_boveda',label:'Dashboard Boveda',icon:'🏦'},
              {id:'stel_boveda_upload',label:'Carga Boveda',icon:'📤'},
            ]},
            { label:'Maquineros', views:[
              {id:'stel_cierre_maquineros',label:'Análisis Maquineros',icon:'🎰'},
              {id:'stel_cierre_acumulado', label:'Acumulado Mensual', icon:'📅'},
              {id:'stel_cierre_upload',    label:'Cargar Reporte',    icon:'📤'},
            ]},
          ]
        },
        { id:'rrhh', label:'RRHH', icon:'👥', defaultView:'stel_rrhh_empleados',
          groups:[{ label:null, views:[
            {id:'stel_rrhh_empleados',label:'Empleados',icon:'👤'},
          ]}]
        },
        { id:'carga', label:'Carga de Datos', icon:'📤', defaultView:'carga_masiva_stel',
          groups:[{ label:null, views:[
            {id:'carga_masiva_stel',label:'Carga Masiva',icon:'📊'},
            {id:'flujo_ing_stel',label:'Flujo de Ingresos',icon:'💰'},
            {id:'flujo_gas_stel',label:'Flujo de Gastos',icon:'💸'},
            {id:'stel_casino_upload',label:'Casino (PDF/Excel)',icon:'🎰'},
          ]}]
        },
        /* Expedientes de clientes removido — no aplica para casino */
        { id:'facturacion', label:'Facturación', icon:'🧾', defaultView:'emit_stellaris',
          groups:[{ label:null, views:[
            {id:'emit_stellaris',label:'Emitidas',icon:'📤'},
            {id:'recv_stellaris',label:'Recibidas',icon:'📥'},
            {id:'pp_stellaris',label:'Pagos Pendientes',icon:'💳'},
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

/** Find which company + section a viewId belongs to */
function navFindView(viewId){
  for(const co of NAV_STRUCTURE.companies)
    for(const sec of co.sections)
      for(const grp of sec.groups)
        for(const v of grp.views)
          if(v.id === viewId) return { company: co, section: sec, view: v };
  for(const cc of NAV_STRUCTURE.crossCutting)
    for(const v of cc.views)
      if(v.id === viewId) return { cross: cc, view: v };
  return null;
}

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
  if(typeof _closeMobileSidebar === 'function') _closeMobileSidebar();

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
    `<div class="hnav-tab" data-sec="${v.id}">${v.icon} ${v.label}</div>`
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

  // Mobile: hide Carga de Datos and Facturación
  const isMobile = window.innerWidth <= 480;
  const MOBILE_HIDDEN_SECTIONS = ['carga', 'facturacion'];

  const visibleSections = co.sections.filter(sec => {
    if(isMobile && MOBILE_HIDDEN_SECTIONS.includes(sec.id)) return false;
    if(isAdmin && !hasCustom) return true;
    // Section visible if at least one view is permitted
    return sec.groups.some(grp => grp.views.some(v => _navViewAllowed(v.id, co.id, perms, isAdmin)));
  });

  secRow.innerHTML = visibleSections.map(sec =>
    `<div class="hnav-tab" data-sec="${sec.id}">${sec.icon} ${sec.label}</div>`
  ).join('');

  viewRow.innerHTML = '';
  hnav.style.display = '';
}

/** Render view chips for a section (with group labels / dropdowns) */
function renderHNavViews(sec){
  const viewRow = document.getElementById('hnav-views');
  if(!viewRow) return;

  // Check permissions
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const perms = user?.perms || {};
  const isAdmin = user?.rol === 'admin';
  const hasCustom = Object.keys(perms).length > 0;
  const coId = _activeCompany;

  // Build visible groups
  const visibleGroups = [];
  for(const grp of sec.groups){
    const views = grp.views.filter(v => {
      if(isAdmin && !hasCustom) return true;
      return _navViewAllowed(v.id, coId, perms, isAdmin);
    });
    if(views.length) visibleGroups.push({label:grp.label, views});
  }

  // Detect if we need dropdown mode (any group has a label)
  const useDropdowns = visibleGroups.some(g => g.label);

  let html = '';
  if(useDropdowns){
    for(const grp of visibleGroups){
      if(grp.label){
        // Dropdown group
        html += `<div class="hnav-group" data-group="${grp.label}">`;
        html += `<div class="hnav-group-toggle">${grp.label} <span class="hnav-arrow">&#9662;</span></div>`;
        html += `<div class="hnav-group-items">`;
        for(const v of grp.views){
          html += `<div class="hnav-view" data-view="${v.id}" >${v.label}</div>`;
        }
        html += `</div></div>`;
      } else {
        // No label — render flat
        for(const v of grp.views){
          html += `<div class="hnav-view" data-view="${v.id}" >${v.label}</div>`;
        }
      }
    }
  } else {
    // All groups without labels — flat rendering (original behavior)
    for(const grp of visibleGroups){
      for(const v of grp.views){
        html += `<div class="hnav-view" data-view="${v.id}" >${v.label}</div>`;
      }
    }
  }

  viewRow.innerHTML = html;

  // ── Event listeners for group toggles ──
  viewRow.querySelectorAll('.hnav-group-toggle').forEach(function(el){
    el.addEventListener('click', function(e){ toggleHNavGroup(this, e); });
  });
}

/** Toggle a dropdown group in hnav (accordion: close others) */
function toggleHNavGroup(el, evt){
  if(evt) evt.stopPropagation();
  const group = el.closest('.hnav-group');
  if(!group) return;
  const wasExpanded = group.classList.contains('expanded');
  // Close all groups first (accordion)
  document.querySelectorAll('.hnav-group.expanded').forEach(g => g.classList.remove('expanded'));
  // Toggle this one
  if(!wasExpanded) group.classList.add('expanded');
}

/** Highlight the group toggle that contains the active view (without expanding) */
function _highlightActiveGroup(){
  // Remove active-group from all toggles
  document.querySelectorAll('.hnav-group').forEach(g => g.classList.remove('has-active'));
  const active = document.querySelector('.hnav-view.active');
  if(!active) return;
  const group = active.closest('.hnav-group');
  if(group) group.classList.add('has-active');
}

/** Select a specific view chip */
function selectView(viewId){
  // Highlight chip
  document.querySelectorAll('.hnav-view').forEach(c=>c.classList.remove('active'));
  const chip = document.querySelector(`.hnav-view[data-view="${viewId}"]`);
  if(chip) chip.classList.add('active');

  // Close all dropdowns after selecting a view
  document.querySelectorAll('.hnav-group.expanded').forEach(g => g.classList.remove('expanded'));

  // Highlight the group toggle containing the active view
  _highlightActiveGroup();

  sv(viewId, null);
}

// Event delegation for hnav tabs and views
document.addEventListener('click', function(e){
  const tab = e.target.closest('.hnav-tab[data-sec]');
  if(tab){
    const sec = tab.dataset.sec;
    // Determine if cross-cutting or regular section
    if(typeof selectCrossView === 'function' && tab.closest('#hnav-sections') &&
       document.querySelector('.hnav-tab[data-sec="'+sec+'"]') === tab &&
       typeof NAV_STRUCTURE !== 'undefined' && NAV_STRUCTURE.crossCutting &&
       NAV_STRUCTURE.crossCutting.some(cc => cc.views && cc.views.some(v => v.id === sec))) {
      selectCrossView(sec);
    } else {
      selectSection(sec);
    }
    return;
  }
  const view = e.target.closest('.hnav-view[data-view]');
  if(view){ selectView(view.dataset.view); return; }
});

// Close dropdown groups when clicking outside
document.addEventListener('click', function(e){
  if(!e.target.closest('.hnav-group') && !e.target.closest('.hnav-view')){
    document.querySelectorAll('.hnav-group.expanded').forEach(g => g.classList.remove('expanded'));
  }
});

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
