// GF — Permission system: tool access by user role/perms
'use strict';

/** Map: tool name → array of menu IDs that grant access (null = admin only) */
const TOOL_PERMS = {
  'get_credit_portfolio':   ['cred_dash', 'cred_cobranza', 'cred_carga'],
  'get_tpv_kpis':           ['tpv_general', 'tpv_dashboard', 'tpv_resumen'],
  'get_tpv_clients_volume': ['tpv_general', 'tpv_dashboard'],
  'get_tpv_commissions':    ['tpv_comisiones'],
  'get_tpv_agent_summary':  ['tpv_agentes', 'tpv_promotores'],
  'get_tpv_terminal_status':['tpv_terminales', 'tpv_general'],
  'get_tarjetas_kpis':      ['tarjetas_dash'],
  'get_pl_summary':         ['resumen', 'grupo', 'sal_res', 'end_res', 'dyn_res', 'wb_res', 'stel_res'],
  'get_treasury_and_banks': ['tes_flujo', 'tes_grupo', 'tes_individual'],
  'get_tickets':            ['tpv_general', 'tpv_pagos'],
  'get_cash_flows':         ['sal_ing', 'sal_gas', 'end_ing', 'dyn_ing', 'fg', 'nomina'],
  'get_users':              null,  // admin only
  'analyze_credit_risk':    ['cred_dash', 'cred_cobranza'],
  'project_cash_flow':      ['tes_flujo', 'tes_grupo', 'resumen'],
  'compare_periods':        ['tpv_dashboard', 'tpv_general', 'resumen'],
  'get_alerts':             ['resumen', 'grupo', 'cred_dash', 'tpv_dashboard'],
  'simulate_credit':        ['cred_dash', 'cred_carga'],
  'search_client':          ['tpv_general', 'cred_dash', 'tarjetas_dash'],
  'executive_summary':      ['resumen', 'grupo'],
  'analyze_trends':         ['resumen', 'grupo', 'tpv_dashboard', 'cred_dash']
};

/** Check if a user can use a specific tool */
function isToolAllowed(toolName, user) {
  if (!user) return false;
  const rol   = user.rol   || 'viewer';
  const perms = user.perms || {};
  const hasCustomPerms = Object.keys(perms).length > 0;

  // Admin without custom perms → full access
  if (rol === 'admin' && !hasCustomPerms) return true;

  const required = TOOL_PERMS[toolName];
  if (required === null) return rol === 'admin';           // admin-only
  if (!required)         return true;                      // unrestricted

  if (rol === 'admin') {
    return !required.every(p => perms[p] === false);
  }
  return required.some(p => perms[p] === true || perms[p] === 'menu');
}

/** Build list of restricted module names for the system prompt */
function _restrictedModules(user) {
  const names = {
    'get_credit_portfolio':   'Portafolio de Créditos',
    'get_tpv_kpis':           'TPV / Terminales',
    'get_tpv_clients_volume': 'Volumen TPV por Cliente',
    'get_tpv_commissions':    'Comisiones TPV',
    'get_tpv_agent_summary':  'Agentes y Promotores',
    'get_tpv_terminal_status':'Estado de Terminales',
    'get_tarjetas_kpis':      'Tarjetas',
    'get_pl_summary':         'Estado de Resultados (P&L)',
    'get_treasury_and_banks': 'Tesorería y Bancos',
    'get_tickets':            'Tickets de Pago',
    'get_cash_flows':         'Flujos de Caja (Ingresos/Gastos)',
    'get_users':              'Gestión de Usuarios',
    'analyze_credit_risk':    'Análisis de Riesgo Crediticio',
    'project_cash_flow':      'Proyección de Flujo',
    'compare_periods':        'Comparativo de Períodos',
    'get_alerts':             'Alertas del Sistema',
    'simulate_credit':        'Simulador de Créditos',
    'search_client':          'Búsqueda de Clientes',
    'executive_summary':      'Resumen Ejecutivo',
    'analyze_trends':         'Análisis de Tendencias'
  };
  return Object.keys(TOOL_PERMS)
    .filter(t => !isToolAllowed(t, user))
    .map(t => names[t] || t);
}

module.exports = { TOOL_PERMS, isToolAllowed, _restrictedModules };
