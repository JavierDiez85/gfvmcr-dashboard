const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const {
  SECURITY_HEADERS, ALLOWED_DIRS,
  isBlockedPath, getClientIP, isRateLimited, startCleanup,
  checkCors, readBody, sendError, extractDateParams, validateSbConfig,
  requireAuth, setupGlobalErrorHandlers, rateLimitKey
} = require('./security');

// Cargar .env (sin dependencias externas)
const _envPath = path.join(__dirname, '.env');
if (fs.existsSync(_envPath)) {
  fs.readFileSync(_envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = (match[2] || '').trim();
  });
}

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Iniciar limpieza periódica del rate limiter + error handlers globales
startCleanup();
setupGlobalErrorHandlers();

// ══════════════════════════════════════
// SUPABASE REST — Zero-dependency helpers
// ══════════════════════════════════════
const SB_URL = process.env.SUPABASE_URL || '';
// SB_SERVICE_KEY: service role key — NUNCA se expone al browser. Úsalo en Railway env vars.
// SB_ANON_KEY:    anon/public key  — se envía al browser via /api/config (solo lectura via RLS).
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const SB_ANON_KEY    = process.env.SUPABASE_KEY || '';

/** Generic HTTPS request helper */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

/** Resolve Supabase credentials — server always uses service key */
function _sbCreds() {
  const url = SB_URL || process.env.SUPABASE_URL || '';
  const key = SB_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
  validateSbConfig(url, key);
  return { url, key };
}

/** Call a Supabase RPC function */
async function supabaseRpc(fnName, params = {}) {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const body = JSON.stringify(params);
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/rpc/${fnName}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
  return result;
}

/** Read a key from app_data table (key-value store) */
async function getAppData(key) {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`,
    method: 'GET',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Accept': 'application/json'
    }
  });
  if (Array.isArray(result) && result.length > 0) return result[0].value;
  return null;
}

/** Query a Supabase table with filters */
async function supabaseQuery(table, select = '*', filters = '') {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const qs = `select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`;
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/${table}?${qs}`,
    method: 'GET',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Accept': 'application/json'
    }
  });
  return result;
}

// ══════════════════════════════════════
// PERMISSION SYSTEM — Tool access by user role/perms
// ══════════════════════════════════════

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
  // New skills
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
    // Admin with custom perms: access unless explicitly denied
    return !required.every(p => perms[p] === false);
  }
  // Editor/viewer: must have at least one required perm explicitly granted
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

// ══════════════════════════════════════
// TOOL DEFINITIONS — 12 herramientas para Claude
// ══════════════════════════════════════
const TOOLS = [
  {
    name: 'get_tpv_kpis',
    description: 'Obtener KPIs globales de Terminales Punto de Venta: total cobrado, comisiones (Efevoo, Salem, Convenia, Comisionista), número de clientes, transacciones y terminales. Filtrable por rango de fechas.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional, sin filtro = histórico completo)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_clients_volume',
    description: 'Obtener volumen de cobro por cliente desglosado por tipo de tarjeta (TC, TD, Amex, TI). Incluye número de transacciones. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_commissions',
    description: 'Obtener comisiones netas por cliente: total cobrado, comisión de cada entidad (Efevoo, Salem, Convenia, Comisionista) y monto neto. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_agent_summary',
    description: 'Resumen de rendimiento por agente/promotor: total vendido, comisión Salem, comisión del agente, número de clientes, monto pagado y pendiente. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_terminal_status',
    description: 'Estado de terminales activas: cliente, terminal_id, último uso, ingresos, número de transacciones, días sin uso. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tarjetas_kpis',
    description: 'KPIs del módulo de tarjetas: total transacciones, monto total, cargos vs abonos, tarjetas activas, saldo total, rechazadas, tasa de rechazo, ticket promedio.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_credit_portfolio',
    description: 'Obtener portafolio de créditos de una empresa. Incluye cada crédito con su tabla de amortización, pagos recibidos, saldo, interés generado, estado de morosidad.',
    input_schema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['endless', 'dynamo'],
          description: 'Empresa de créditos: "endless" o "dynamo"'
        }
      },
      required: ['company']
    }
  },
  {
    name: 'get_pl_summary',
    description: 'Obtener Estado de Resultados (P&L) de todas las entidades del grupo. Incluye ingresos, gastos, utilidad por mes y entidad.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_treasury_and_banks',
    description: 'Obtener movimientos de tesorería y saldos bancarios de todas las cuentas.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_tickets',
    description: 'Obtener tickets de pago del sistema TPV: montos, estados (abierto, aprobado, pagado, rechazado), fechas y destinos (banco o tarjeta).',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_cash_flows',
    description: 'Obtener flujos de efectivo: ingresos (gf_fi) y egresos (gf_fg) con categorías, montos y fechas.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_users',
    description: 'Obtener lista de usuarios del sistema: nombres, roles y estado activo.',
    input_schema: { type: 'object', properties: {} }
  },
  // ── NEW SKILLS ──
  {
    name: 'analyze_credit_risk',
    description: 'Análisis de riesgo crediticio del portafolio: concentración por cliente, índice de morosidad, reservas sugeridas, distribución de calificación de riesgo (A/B/C/D/E), exposición máxima por cliente.',
    input_schema: {
      type: 'object',
      properties: {
        company: { type: 'string', enum: ['endless', 'dynamo', 'both'], description: 'Empresa o ambas (default: both)' }
      }
    }
  },
  {
    name: 'project_cash_flow',
    description: 'Proyección de flujo de efectivo: estima ingresos futuros por comisiones TPV + intereses de créditos + flujos recurrentes para los próximos N meses.',
    input_schema: {
      type: 'object',
      properties: {
        months: { type: 'number', description: 'Meses a proyectar (default: 3, max: 12)' }
      }
    }
  },
  {
    name: 'compare_periods',
    description: 'Comparativo entre dos períodos: compara KPIs de TPV, créditos y tarjetas entre período actual vs anterior. Muestra variaciones absolutas y porcentuales.',
    input_schema: {
      type: 'object',
      properties: {
        period_type: { type: 'string', enum: ['month', 'quarter', 'year'], description: 'Tipo de período a comparar (default: month)' }
      }
    }
  },
  {
    name: 'get_alerts',
    description: 'Alertas proactivas del sistema: créditos próximos a vencer, terminales inactivas, pagos pendientes, concentración de riesgo, anomalías en flujo.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'simulate_credit',
    description: 'Simular un nuevo crédito: calcula tabla de amortización, pago mensual, total de intereses, CAT estimado y ROI para el grupo.',
    input_schema: {
      type: 'object',
      properties: {
        monto:  { type: 'number', description: 'Monto del crédito en MXN' },
        tasa:   { type: 'number', description: 'Tasa de interés anual (%)' },
        plazo:  { type: 'number', description: 'Plazo en meses' },
        comision: { type: 'number', description: 'Comisión de apertura % (default: 0)' }
      },
      required: ['monto', 'tasa', 'plazo']
    }
  },
  {
    name: 'search_client',
    description: 'Buscar un cliente por nombre en todas las entidades del grupo (TPV, créditos Endless, créditos Dynamo, tarjetas). Devuelve toda la información encontrada del cliente.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre o parte del nombre del cliente a buscar' }
      },
      required: ['query']
    }
  },
  {
    name: 'executive_summary',
    description: 'Resumen ejecutivo completo del Grupo Financiero VMCR: consolida KPIs de todas las entidades (TPV, créditos, tarjetas, tesorería, P&L) en un solo reporte.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'analyze_trends',
    description: 'Análisis de tendencias: identifica patrones en datos históricos de TPV (cobros mensuales, crecimiento de clientes), créditos (colocación, morosidad) y flujos de efectivo.',
    input_schema: {
      type: 'object',
      properties: {
        area: { type: 'string', enum: ['tpv', 'credits', 'treasury', 'all'], description: 'Área a analizar (default: all)' }
      }
    }
  }
];

// ══════════════════════════════════════
// TOOL EXECUTORS — Ejecutar cada herramienta
// ══════════════════════════════════════

/** Truncate large arrays to avoid blowing up token budget */
function truncateResult(data, maxItems = 80) {
  if (!Array.isArray(data)) return data;
  if (data.length <= maxItems) return data;
  return {
    _truncated: true,
    total: data.length,
    showing: maxItems,
    data: data.slice(0, maxItems)
  };
}

// ── Credit pre-processing (replicate credit-engine.js logic server-side) ──
const _MESES_MAP = {ene:0,feb:1,mar:2,abr:3,apr:3,may:4,jun:5,jul:6,ago:7,aug:7,sep:8,oct:9,nov:10,dic:11,dec:11};
function _credParseDate(str) {
  if (!str) return null;
  const p = str.split('/');
  if (p.length !== 3) return null;
  let mes = parseInt(p[1]);
  if (isNaN(mes)) {
    mes = _MESES_MAP[(p[1]||'').toLowerCase().substring(0,3)];
    if (mes === undefined) return null;
  } else { mes--; }
  return new Date(parseInt(p[2]), mes, parseInt(p[0]));
}

function _credPeriodStatus(credit, row) {
  if (!row || row.periodo === 0) return null;
  const pagos = credit.pagos || [];
  const totalPagado = pagos.filter(p => p.periodo === row.periodo).reduce((s,p) => s + (p.monto||0), 0);
  const fechaVenc = _credParseDate(row.fecha);
  const today = new Date(); today.setHours(0,0,0,0);
  if (totalPagado > 0) {
    return totalPagado >= (row.pago||0) - 0.05 ? 'PAGADO' : 'PARCIAL';
  }
  if (!fechaVenc) return 'PENDIENTE';
  return fechaVenc < today ? 'VENCIDO' : 'PENDIENTE';
}

function _processCredits(credits) {
  if (!Array.isArray(credits)) return credits;
  const today = new Date(); today.setHours(0,0,0,0);

  return credits.map(c => {
    const amort = c.amort || [];
    const rows = amort.slice(1); // skip period 0
    const pagos = c.pagos || [];

    let pagado=0, parcial=0, vencido=0, pendiente=0;
    let montoVencido=0, montoPagado=0, montoPendiente=0, maxAtraso=0;
    const periodosVencidos = [];
    const periodosPagados = [];

    rows.forEach(r => {
      const st = _credPeriodStatus(c, r);
      const totalPag = pagos.filter(p => p.periodo === r.periodo).reduce((s,p) => s + (p.monto||0), 0);
      if (st === 'PAGADO')   { pagado++; montoPagado += totalPag; periodosPagados.push(r.periodo); }
      else if (st === 'PARCIAL') { parcial++; montoPagado += totalPag; montoVencido += (r.pago||0) - totalPag; }
      else if (st === 'VENCIDO') {
        vencido++;
        montoVencido += (r.pago||0);
        const f = _credParseDate(r.fecha);
        const dias = f ? Math.floor((today - f)/(86400000)) : 0;
        if (dias > maxAtraso) maxAtraso = dias;
        periodosVencidos.push({ periodo: r.periodo, fecha: r.fecha, monto: r.pago, diasAtraso: dias });
      }
      else { pendiente++; montoPendiente += (r.pago||0); }
    });

    // Saldo actual = saldo del último periodo pagado
    let saldoActual = c.monto || 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (_credPeriodStatus(c, rows[i]) === 'PAGADO') { saldoActual = rows[i].saldo || 0; break; }
    }

    // Próximo pago
    let proximoPago = null;
    for (let i = 0; i < rows.length; i++) {
      const st = _credPeriodStatus(c, rows[i]);
      if (st === 'VENCIDO' || st === 'PENDIENTE' || st === 'PARCIAL') {
        proximoPago = { periodo: rows[i].periodo, fecha: rows[i].fecha, monto: rows[i].pago };
        break;
      }
    }

    return {
      cliente: c.cl,
      estado: c.st,
      monto: c.monto,
      tasa: c.tasa,
      plazo: c.plazo,
      cat: c.cat,
      fechaDesembolso: c.disbDate,
      pagoFijo: rows.length > 0 ? rows[0].pago : 0,
      saldoActual: +saldoActual.toFixed(2),
      totalPeriodos: rows.length,
      cobranza: {
        pagados: pagado,
        parciales: parcial,
        vencidos: vencido,
        pendientes: pendiente,
        montoPagado: +montoPagado.toFixed(2),
        montoVencido: +montoVencido.toFixed(2),
        montoPendiente: +montoPendiente.toFixed(2),
        maxDiasAtraso: maxAtraso,
        periodosVencidos,
        periodosPagados
      },
      proximoPago,
      totalPagosRegistrados: pagos.length,
      pagosDetalle: pagos.map(p => ({ periodo: p.periodo, monto: p.monto, fecha: p.fecha }))
    };
  });
}

async function executeTool(name, input, user = {}) {
  // Server-side permission guard
  if (!isToolAllowed(name, user)) {
    return { _access_denied: true, message: 'Tu perfil no tiene acceso a este módulo. Contacta al administrador para solicitar acceso.' };
  }
  try {
    switch (name) {
      case 'get_tpv_kpis': {
        const data = await supabaseRpc('tpv_kpis', extractDateParams(input));
        return Array.isArray(data) && data.length > 0 ? data[0] : data;
      }
      case 'get_tpv_clients_volume':
        return truncateResult(await supabaseRpc('tpv_clients_by_volume', extractDateParams(input)));
      case 'get_tpv_commissions':
        return truncateResult(await supabaseRpc('tpv_client_commissions', extractDateParams(input)));
      case 'get_tpv_agent_summary':
        return await supabaseRpc('tpv_agent_summary', extractDateParams(input));
      case 'get_tpv_terminal_status':
        return truncateResult(await supabaseRpc('tpv_terminal_status', extractDateParams(input)), 50);
      case 'get_tarjetas_kpis': {
        const data = await supabaseRpc('tar_dashboard_kpis');
        return Array.isArray(data) && data.length > 0 ? data[0] : data;
      }
      case 'get_credit_portfolio': {
        const key = input.company === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
        const empresa = input.company === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
        const data = await getAppData(key);
        if (!data) return {
          _no_data: true,
          message: `No hay datos de créditos de ${empresa} disponibles en el servidor. Los datos podrían estar pendientes de sincronización. El usuario debe abrir el módulo de Créditos en el dashboard para que los datos se sincronicen con el servidor.`
        };
        // Pre-process: compute payment status, overdue periods, balances server-side
        const processed = _processCredits(Array.isArray(data) ? data : []);
        if (processed.length > 30) {
          return { empresa, total_creditos: processed.length, creditos: processed.slice(0, 30), _truncated: true };
        }
        return { empresa, fecha_analisis: new Date().toISOString().slice(0,10), total_creditos: processed.length, creditos: processed };
      }
      case 'get_pl_summary': {
        return await getAppData('gf4') || { message: 'No hay datos de P&L' };
      }
      case 'get_treasury_and_banks': {
        const [tesoreria, bancos] = await Promise.all([
          getAppData('gf_tesoreria'),
          getAppData('gf_bancos')
        ]);
        return { tesoreria: tesoreria || [], bancos: bancos || [] };
      }
      case 'get_tickets': {
        const data = await getAppData('gf_tickets_pagos_tpv');
        return truncateResult(data || []);
      }
      case 'get_cash_flows': {
        const [fi, fg] = await Promise.all([
          getAppData('gf_fi'),
          getAppData('gf_fg')
        ]);
        return { ingresos: fi || [], egresos: fg || [] };
      }
      case 'get_users': {
        const data = await getAppData('gf_usuarios');
        // Strip sensitive fields
        if (Array.isArray(data)) {
          return data.map(u => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo }));
        }
        return data || [];
      }
      // ── NEW SKILL EXECUTORS ──

      case 'analyze_credit_risk': {
        const companies = input.company === 'both' || !input.company
          ? ['endless', 'dynamo'] : [input.company];
        const results = {};
        for (const co of companies) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) { results[label] = { sin_datos: true }; continue; }
          const credits = _processCredits(raw).filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
          const totalCartera = credits.reduce((s,c) => s + (c.monto||0), 0);
          const totalSaldo = credits.reduce((s,c) => s + (c.saldoActual||0), 0);
          const totalVencido = credits.reduce((s,c) => s + (c.cobranza.montoVencido||0), 0);
          const morosidad = totalSaldo > 0 ? +(totalVencido / totalSaldo * 100).toFixed(2) : 0;

          // Concentración por cliente
          const concentracion = credits.map(c => ({
            cliente: c.cliente, saldo: c.saldoActual,
            pctCartera: totalSaldo > 0 ? +(c.saldoActual / totalSaldo * 100).toFixed(1) : 0
          })).sort((a,b) => b.saldo - a.saldo);

          // Calificación de riesgo
          const calificaciones = credits.map(c => {
            const v = c.cobranza.vencidos;
            const d = c.cobranza.maxDiasAtraso;
            let calif = 'A'; // Al día
            if (v >= 1 && d <= 30) calif = 'B';
            else if (v >= 1 && d <= 60) calif = 'C';
            else if (v >= 2 && d <= 90) calif = 'D';
            else if (v >= 3 || d > 90) calif = 'E';
            return { cliente: c.cliente, calificacion: calif, diasAtraso: d, periodosVencidos: v, saldo: c.saldoActual };
          });
          const dist = { A:0, B:0, C:0, D:0, E:0 };
          calificaciones.forEach(c => dist[c.calificacion]++);

          // Reservas sugeridas (% del saldo según calificación)
          const pctReserva = { A: 0, B: 0.05, C: 0.15, D: 0.40, E: 1.0 };
          const reservaSugerida = calificaciones.reduce((s,c) => s + c.saldo * (pctReserva[c.calificacion]||0), 0);

          results[label] = {
            totalCreditos: credits.length,
            montoOriginalTotal: +totalCartera.toFixed(2),
            saldoVigente: +totalSaldo.toFixed(2),
            montoVencido: +totalVencido.toFixed(2),
            indiceMorosidad: morosidad + '%',
            concentracionTop5: concentracion.slice(0, 5),
            exposicionMaxima: concentracion[0] || null,
            distribucionRiesgo: dist,
            detalleRiesgo: calificaciones.filter(c => c.calificacion !== 'A'),
            reservaSugerida: +reservaSugerida.toFixed(2),
            criteriosReserva: '(A=0%, B=5%, C=15%, D=40%, E=100% del saldo)'
          };
        }
        return { fecha_analisis: new Date().toISOString().slice(0,10), ...results };
      }

      case 'project_cash_flow': {
        const months = Math.min(Math.max(input.months || 3, 1), 12);
        const today = new Date();
        const projections = [];

        // Credit income projection
        let creditIncome = 0;
        for (const key of ['gf_cred_end', 'gf_cred_dyn']) {
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          const processed = _processCredits(raw).filter(c => c.estado === 'Activo');
          processed.forEach(c => { creditIncome += c.pagoFijo || 0; });
        }

        // TPV commission projection (use last month average)
        let tpvMonthlyAvg = 0;
        try {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          const tpvData = await supabaseRpc('tpv_kpis', {
            p_from: lastMonth.toISOString().slice(0,10),
            p_to: lastMonthEnd.toISOString().slice(0,10)
          });
          if (Array.isArray(tpvData) && tpvData[0]) {
            tpvMonthlyAvg = (tpvData[0].com_salem || 0) + (tpvData[0].com_convenia || 0);
          }
        } catch(e) { /* no TPV data */ }

        // Cash flow data
        const [fi, fg] = await Promise.all([getAppData('gf_fi'), getAppData('gf_fg')]);
        let avgIngresos = 0, avgEgresos = 0;
        if (Array.isArray(fi) && fi.length > 0) {
          avgIngresos = fi.reduce((s,r) => s + (r.monto||0), 0) / Math.max(1, new Set(fi.map(r => (r.fecha||'').substring(0,7))).size);
        }
        if (Array.isArray(fg) && fg.length > 0) {
          avgEgresos = fg.reduce((s,r) => s + (r.monto||0), 0) / Math.max(1, new Set(fg.map(r => (r.fecha||'').substring(0,7))).size);
        }

        for (let i = 1; i <= months; i++) {
          const m = new Date(today.getFullYear(), today.getMonth() + i, 1);
          projections.push({
            mes: m.toISOString().slice(0,7),
            ingresosCreditos: +creditIncome.toFixed(2),
            ingresosTPV: +tpvMonthlyAvg.toFixed(2),
            otrosIngresos: +avgIngresos.toFixed(2),
            totalIngresos: +(creditIncome + tpvMonthlyAvg + avgIngresos).toFixed(2),
            egresos: +avgEgresos.toFixed(2),
            flujoNeto: +(creditIncome + tpvMonthlyAvg + avgIngresos - avgEgresos).toFixed(2)
          });
        }
        return {
          fecha_analisis: new Date().toISOString().slice(0,10),
          nota: 'Proyección basada en promedios históricos y pagos esperados de créditos activos',
          meses_proyectados: months,
          proyeccion: projections
        };
      }

      case 'compare_periods': {
        const ptype = input.period_type || 'month';
        const today = new Date();
        let currFrom, currTo, prevFrom, prevTo;

        if (ptype === 'month') {
          currFrom = new Date(today.getFullYear(), today.getMonth(), 1);
          currTo = today;
          prevFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          prevTo = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (ptype === 'quarter') {
          const q = Math.floor(today.getMonth() / 3);
          currFrom = new Date(today.getFullYear(), q * 3, 1);
          currTo = today;
          prevFrom = new Date(today.getFullYear(), (q - 1) * 3, 1);
          prevTo = new Date(today.getFullYear(), q * 3, 0);
        } else {
          currFrom = new Date(today.getFullYear(), 0, 1);
          currTo = today;
          prevFrom = new Date(today.getFullYear() - 1, 0, 1);
          prevTo = new Date(today.getFullYear() - 1, 11, 31);
        }

        const fmt = d => d.toISOString().slice(0,10);
        const [currTPV, prevTPV] = await Promise.all([
          supabaseRpc('tpv_kpis', { p_from: fmt(currFrom), p_to: fmt(currTo) }).catch(() => []),
          supabaseRpc('tpv_kpis', { p_from: fmt(prevFrom), p_to: fmt(prevTo) }).catch(() => [])
        ]);
        const c = (Array.isArray(currTPV) && currTPV[0]) || {};
        const p = (Array.isArray(prevTPV) && prevTPV[0]) || {};

        const variation = (curr, prev) => {
          if (!prev || prev === 0) return { actual: curr||0, anterior: prev||0, variacion: 'N/A' };
          const pct = (((curr||0) - prev) / prev * 100).toFixed(1);
          return { actual: curr||0, anterior: prev||0, variacion: pct + '%' };
        };

        return {
          tipo_periodo: ptype,
          periodo_actual: `${fmt(currFrom)} a ${fmt(currTo)}`,
          periodo_anterior: `${fmt(prevFrom)} a ${fmt(prevTo)}`,
          tpv: {
            total_cobrado: variation(c.total_cobrado, p.total_cobrado),
            num_transacciones: variation(c.num_transacciones, p.num_transacciones),
            com_salem: variation(c.com_salem, p.com_salem),
            num_clientes: variation(c.num_clientes, p.num_clientes)
          }
        };
      }

      case 'get_alerts': {
        const alerts = [];
        const today = new Date(); today.setHours(0,0,0,0);

        // Credit alerts
        for (const co of ['endless', 'dynamo']) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          const credits = _processCredits(raw);

          credits.forEach(c => {
            if (c.cobranza.vencidos > 0) {
              alerts.push({
                tipo: 'CRÉDITO_VENCIDO', prioridad: 'ALTA', empresa: label,
                cliente: c.cliente, mensaje: `${c.cobranza.vencidos} periodo(s) vencido(s), $${c.cobranza.montoVencido.toLocaleString()} pendiente, ${c.cobranza.maxDiasAtraso} días de atraso`
              });
            }
            if (c.proximoPago) {
              const f = _credParseDate(c.proximoPago.fecha);
              if (f) {
                const dias = Math.floor((f - today) / 86400000);
                if (dias >= 0 && dias <= 7) {
                  alerts.push({
                    tipo: 'PAGO_PRÓXIMO', prioridad: 'MEDIA', empresa: label,
                    cliente: c.cliente, mensaje: `Pago de $${(c.proximoPago.monto||0).toLocaleString()} vence en ${dias} día(s) (${c.proximoPago.fecha})`
                  });
                }
              }
            }
          });
        }

        // Terminal inactivity alerts
        try {
          const thirtyAgo = new Date(today.getTime() - 30*86400000);
          const terminals = await supabaseRpc('tpv_terminal_status', {
            p_from: thirtyAgo.toISOString().slice(0,10),
            p_to: today.toISOString().slice(0,10)
          });
          if (Array.isArray(terminals)) {
            terminals.forEach(t => {
              if ((t.dias_sin_uso || 0) > 15) {
                alerts.push({
                  tipo: 'TERMINAL_INACTIVA', prioridad: 'BAJA', empresa: 'Salem',
                  cliente: t.cliente, mensaje: `Terminal ${t.terminal_id} sin actividad hace ${t.dias_sin_uso} días`
                });
              }
            });
          }
        } catch(e) { /* skip */ }

        alerts.sort((a,b) => {
          const p = { ALTA: 0, MEDIA: 1, BAJA: 2 };
          return (p[a.prioridad]||3) - (p[b.prioridad]||3);
        });
        return { fecha: new Date().toISOString().slice(0,10), total_alertas: alerts.length, alertas: alerts };
      }

      case 'simulate_credit': {
        const { monto, tasa, plazo, comision = 0 } = input;
        if (!monto || !tasa || !plazo) return { error: 'Se requiere monto, tasa y plazo' };
        const tasaMensual = tasa / 100 / 12;
        const iva = 0.16;
        // Pago fijo (French amortization)
        const pagoBase = tasaMensual > 0
          ? monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazo))
          : monto / plazo;

        const amort = [];
        let saldo = monto;
        let totalIntereses = 0, totalIVA = 0;
        for (let i = 1; i <= plazo; i++) {
          const interes = +(saldo * tasaMensual).toFixed(2);
          const ivaInt = +(interes * iva).toFixed(2);
          const capital = +(pagoBase - interes - ivaInt).toFixed(2);
          saldo = +(saldo - capital).toFixed(2);
          if (saldo < 0) saldo = 0;
          totalIntereses += interes;
          totalIVA += ivaInt;
          amort.push({ periodo: i, pago: +pagoBase.toFixed(2), capital, interes, ivaInt, saldo });
        }

        const comMonto = monto * (comision / 100);
        const totalPagos = pagoBase * plazo;
        const cat = (((totalPagos + comMonto) / monto - 1) / (plazo / 12) * 100);
        const ingresoGrupo = totalIntereses + totalIVA + comMonto;
        const roi = ((ingresoGrupo - monto) / monto * 100);

        return {
          parametros: { monto, tasa_anual: tasa + '%', plazo_meses: plazo, comision_apertura: comision + '%' },
          resultados: {
            pago_mensual: +pagoBase.toFixed(2),
            total_a_pagar: +totalPagos.toFixed(2),
            total_intereses: +totalIntereses.toFixed(2),
            total_iva_intereses: +totalIVA.toFixed(2),
            comision_apertura: +comMonto.toFixed(2),
            cat_estimado: +cat.toFixed(2) + '%',
            ingreso_grupo: +ingresoGrupo.toFixed(2),
            roi_grupo: +roi.toFixed(2) + '%'
          },
          tabla_amortizacion: amort.length <= 12 ? amort : { primeros_6: amort.slice(0,6), ultimos_3: amort.slice(-3), _nota: `${amort.length} periodos totales` }
        };
      }

      case 'search_client': {
        const q = (input.query || '').toLowerCase().trim();
        if (!q) return { error: 'Se requiere un término de búsqueda' };
        const results = { busqueda: input.query, encontrados: {} };

        // Search in credits
        for (const co of ['endless', 'dynamo']) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          const processed = _processCredits(raw);
          const matches = processed.filter(c => (c.cliente||'').toLowerCase().includes(q));
          if (matches.length > 0) results.encontrados[label + ' (Créditos)'] = matches;
        }

        // Search in TPV clients
        try {
          const tpvClients = await supabaseRpc('tpv_clients_by_volume', {});
          if (Array.isArray(tpvClients)) {
            const matches = tpvClients.filter(c => (c.cliente||c.nombre||'').toLowerCase().includes(q));
            if (matches.length > 0) results.encontrados['Salem (TPV)'] = truncateResult(matches, 10);
          }
        } catch(e) { /* skip */ }

        // Search in tarjetas
        try {
          const tarData = await supabaseRpc('tar_cardholders_summary', {});
          if (Array.isArray(tarData)) {
            const matches = tarData.filter(c => (c.tarjetahabiente||c.subcliente||'').toLowerCase().includes(q));
            if (matches.length > 0) results.encontrados['Tarjetas'] = truncateResult(matches, 10);
          }
        } catch(e) { /* skip */ }

        results.total_resultados = Object.values(results.encontrados).reduce((s,arr) => s + (Array.isArray(arr) ? arr.length : (arr.data||[]).length), 0);
        return results;
      }

      case 'executive_summary': {
        const [tpvKpis, tarKpis, plData, credEnd, credDyn, tesoreria] = await Promise.all([
          supabaseRpc('tpv_kpis', {}).then(d => (Array.isArray(d) && d[0]) || {}).catch(() => ({})),
          supabaseRpc('tar_dashboard_kpis').then(d => (Array.isArray(d) && d[0]) || {}).catch(() => ({})),
          getAppData('gf4').catch(() => null),
          getAppData('gf_cred_end').catch(() => null),
          getAppData('gf_cred_dyn').catch(() => null),
          getAppData('gf_tesoreria').catch(() => null)
        ]);

        const processPortfolio = (raw, label) => {
          if (!raw || !Array.isArray(raw)) return { empresa: label, sin_datos: true };
          const credits = _processCredits(raw);
          const activos = credits.filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
          return {
            empresa: label,
            total_creditos: credits.length,
            activos: activos.length,
            saldo_total: +activos.reduce((s,c) => s + c.saldoActual, 0).toFixed(2),
            monto_vencido: +activos.reduce((s,c) => s + c.cobranza.montoVencido, 0).toFixed(2),
            creditos_con_atraso: activos.filter(c => c.cobranza.vencidos > 0).length
          };
        };

        return {
          fecha: new Date().toISOString().slice(0,10),
          tpv_salem: {
            total_cobrado: tpvKpis.total_cobrado || 0,
            comision_salem: tpvKpis.com_salem || 0,
            num_clientes: tpvKpis.num_clientes || 0,
            num_transacciones: tpvKpis.num_transacciones || 0
          },
          tarjetas: {
            total_transacciones: tarKpis.total_transacciones || 0,
            monto_total: tarKpis.monto_total || 0,
            tarjetas_activas: tarKpis.tarjetas_activas || 0,
            tasa_rechazo: tarKpis.tasa_rechazo || 0
          },
          creditos: {
            endless: processPortfolio(credEnd, 'Endless Money'),
            dynamo: processPortfolio(credDyn, 'Dynamo Finance')
          },
          tesoreria_resumen: Array.isArray(tesoreria) ? {
            total_movimientos: tesoreria.length,
            ingresos: +tesoreria.filter(t => (t.tipo||'').toLowerCase() === 'ingreso').reduce((s,t) => s + (t.monto||0), 0).toFixed(2),
            egresos: +tesoreria.filter(t => (t.tipo||'').toLowerCase() === 'egreso').reduce((s,t) => s + (t.monto||0), 0).toFixed(2)
          } : { sin_datos: true },
          pl_disponible: !!plData
        };
      }

      case 'analyze_trends': {
        const area = input.area || 'all';
        const trends = {};
        const today = new Date();

        if (area === 'tpv' || area === 'all') {
          // Monthly TPV for last 6 months
          const monthlyTPV = [];
          for (let i = 5; i >= 0; i--) {
            const from = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const to = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            try {
              const d = await supabaseRpc('tpv_kpis', { p_from: from.toISOString().slice(0,10), p_to: to.toISOString().slice(0,10) });
              const kpi = (Array.isArray(d) && d[0]) || {};
              monthlyTPV.push({
                mes: from.toISOString().slice(0,7),
                cobrado: kpi.total_cobrado || 0,
                comision_salem: kpi.com_salem || 0,
                transacciones: kpi.num_transacciones || 0,
                clientes: kpi.num_clientes || 0
              });
            } catch(e) { monthlyTPV.push({ mes: from.toISOString().slice(0,7), sin_datos: true }); }
          }
          // Calculate growth rates
          for (let i = 1; i < monthlyTPV.length; i++) {
            const prev = monthlyTPV[i-1].cobrado;
            const curr = monthlyTPV[i].cobrado;
            monthlyTPV[i].crecimiento = prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) + '%' : 'N/A';
          }
          trends.tpv = { ultimos_6_meses: monthlyTPV };
        }

        if (area === 'credits' || area === 'all') {
          // Credit portfolio status
          const portfolioStatus = {};
          for (const co of ['endless', 'dynamo']) {
            const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
            const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
            const raw = await getAppData(key);
            if (!raw || !Array.isArray(raw)) continue;
            const credits = _processCredits(raw);
            const activos = credits.filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
            const totalColocado = credits.reduce((s,c) => s + (c.monto||0), 0);
            const saldoActual = activos.reduce((s,c) => s + c.saldoActual, 0);
            const capitalRecuperado = totalColocado - saldoActual;
            portfolioStatus[label] = {
              total_colocado: +totalColocado.toFixed(2),
              saldo_vigente: +saldoActual.toFixed(2),
              capital_recuperado: +capitalRecuperado.toFixed(2),
              pct_recuperado: totalColocado > 0 ? +(capitalRecuperado/totalColocado*100).toFixed(1)+'%' : '0%',
              morosidad: activos.filter(c => c.cobranza.vencidos > 0).length + ' de ' + activos.length + ' créditos'
            };
          }
          trends.creditos = portfolioStatus;
        }

        if (area === 'treasury' || area === 'all') {
          const [fi, fg] = await Promise.all([getAppData('gf_fi'), getAppData('gf_fg')]);
          if (Array.isArray(fi) || Array.isArray(fg)) {
            const monthlyFlow = {};
            (fi||[]).forEach(r => {
              const m = (r.fecha||'').substring(0,7);
              if (!m) return;
              if (!monthlyFlow[m]) monthlyFlow[m] = { ingresos: 0, egresos: 0 };
              monthlyFlow[m].ingresos += (r.monto||0);
            });
            (fg||[]).forEach(r => {
              const m = (r.fecha||'').substring(0,7);
              if (!m) return;
              if (!monthlyFlow[m]) monthlyFlow[m] = { ingresos: 0, egresos: 0 };
              monthlyFlow[m].egresos += (r.monto||0);
            });
            const sorted = Object.entries(monthlyFlow).sort((a,b) => a[0].localeCompare(b[0])).slice(-6);
            trends.flujo_efectivo = sorted.map(([mes, d]) => ({
              mes, ingresos: +d.ingresos.toFixed(2), egresos: +d.egresos.toFixed(2),
              neto: +(d.ingresos - d.egresos).toFixed(2)
            }));
          }
        }

        return { fecha_analisis: new Date().toISOString().slice(0,10), area_analizada: area, tendencias: trends };
      }

      default:
        return { error: 'Tool no reconocida: ' + name };
    }
  } catch (e) {
    console.error('[Tool] Execution error in', name, ':', e.message);
    return { error: 'Error ejecutando herramienta: ' + e.message };
  }
}

// ══════════════════════════════════════
// ANTHROPIC API — Call with tool loop
// ══════════════════════════════════════
const BASE_SYSTEM_PROMPT = [
  'Eres el asistente financiero experto del dashboard de Grupo Financiero VMCR.',
  'Responde SIEMPRE en español. Sé directo, preciso y útil.',
  '',
  'CAPACIDADES ANALÍTICAS:',
  'Tienes acceso a herramientas de datos en tiempo real. SIEMPRE úsalas antes de responder.',
  'Puedes llamar varias herramientas EN PARALELO para respuestas más rápidas.',
  'NO inventes datos. Si una herramienta falla o no hay datos, dilo claramente.',
  '',
  'ANÁLISIS QUE DEBES HACER PROACTIVAMENTE (sin que te lo pidan):',
  '• Al mostrar créditos vencidos: calcula días de atraso promedio, monto total en riesgo, % del portafolio.',
  '• Al mostrar TPV: identifica clientes top, terminales inactivas, tendencia vs período anterior.',
  '• Al mostrar P&L: calcula margen %, variación mensual, identifica la entidad más/menos rentable.',
  '• Al mostrar tesorería: señala saldo neto, flujo positivo/negativo, alertas de liquidez.',
  '• SIEMPRE termina con 1-2 observaciones clave o acciones recomendadas.',
  '',
  'SKILLS AVANZADOS DISPONIBLES:',
  '• analyze_credit_risk: Usa cuando pregunten sobre riesgo, morosidad, concentración o reservas de cartera.',
  '• project_cash_flow: Usa para proyecciones de flujo de efectivo futuro.',
  '• compare_periods: Usa para comparativos mes vs mes, trimestre vs trimestre, o año vs año.',
  '• get_alerts: Usa al inicio de sesión o cuando pregunten "qué hay pendiente", "alertas", "novedades".',
  '• simulate_credit: Usa cuando pidan simular, calcular o cotizar un crédito nuevo.',
  '• search_client: Usa para buscar un cliente específico en todas las entidades del grupo.',
  '• executive_summary: Usa cuando pidan "resumen general", "cómo va el grupo", "reporte ejecutivo".',
  '• analyze_trends: Usa para identificar patrones, tendencias, comparar evolución histórica.',
  '• Puedes combinar múltiples skills en una sola respuesta para dar análisis más completos.',
  '',
  'FORMATO DE RESPUESTA:',
  '• Cifras exactas con formato $X,XXX MXN (usa K para miles, M para millones en resúmenes).',
  '• **Negritas** para cifras clave y conclusiones importantes.',
  '• Viñetas para listas, tablas cuando sea relevante.',
  '• Máximo 4 párrafos. Conciso pero completo.',
  '• Si hay más de 5 items, muestra los top 5 y el total.',
  '',
  'CONOCIMIENTO DEL NEGOCIO:',
  '• Grupo Financiero VMCR: 5 entidades bajo Centum Capital.',
  '• Salem: opera terminales TPV, comisiones a agentes/promotores.',
  '• Endless Money y Dynamo Finance: cartera de créditos con amortización mensual.',
  '• IMPORTANTE CRÉDITOS: Los datos de créditos YA vienen pre-procesados con el estado correcto de cada periodo.',
  '  - cobranza.vencidos = periodos con fecha PASADA y SIN pago. NUNCA reportes periodos futuros como vencidos.',
  '  - cobranza.pagados = periodos con pago completo registrado.',
  '  - cobranza.pendientes = periodos con fecha FUTURA (aún no vencen).',
  '  - Usa SOLO los campos pre-calculados (cobranza, saldoActual, proximoPago). NO reinterpretes datos crudos.',
  '  - Si cobranza.vencidos = 0, el crédito está AL DÍA, sin importar cuántos periodos pendientes tenga.',
  '• Wirebit: fintech, ingresos por fees de transacción.',
  '• Stellaris: empresa de inversión.',
  '• Los créditos tienen estado: Activo, Vencido, Liquidado. Vencido = cobranza pendiente.',
  '• ROI = (margen - inversión) / inversión × 100.',
  '• CxP = Cuentas por Pagar (facturas pendientes de pago a proveedores).',
  '',
  'PERMISOS Y RESTRICCIONES — MUY IMPORTANTE:',
  'Cada usuario tiene un perfil con acceso limitado a ciertos módulos.',
  'Si intentas usar una herramienta bloqueada por permisos, recibirás un error de acceso.',
  'En ese caso responde: "Tu perfil actual no tiene acceso a [módulo]. Contacta al administrador."',
  'NUNCA intentes sortear o ignorar restricciones de acceso.',
  'NUNCA respondas con datos de un módulo restringido aunque los "recuerdes" de contexto previo.'
].join('\n');

/** Build dynamic system prompt per user */
function buildSystemPrompt(context, user) {
  const rol    = user?.rol    || 'viewer';
  const perms  = user?.perms  || {};
  const nombre = user?.nombre || 'Usuario';
  const isAdmin = rol === 'admin' && Object.keys(perms).length === 0;

  const restricted = _restrictedModules(user);
  const permSection = isAdmin
    ? `\nPERFIL DE SESIÓN:\nUsuario: ${nombre} | Rol: Administrador | Acceso: COMPLETO a todos los módulos.`
    : `\nPERFIL DE SESIÓN:\nUsuario: ${nombre} | Rol: ${rol}\nMódulos SIN acceso (responde con aviso de restricción si preguntan): ${restricted.length > 0 ? restricted.join(', ') : 'ninguno'}\nMódulos con acceso: todos los demás.`;

  return BASE_SYSTEM_PROMPT + permSection + '\n\nCONTEXTO DE SESIÓN:\n' + (context || 'Sin contexto');
}

/** Call Anthropic Messages API */
function callAnthropic(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const data = JSON.parse(raw);
          if (res.statusCode >= 400) reject(new Error(data.error?.message || `API error ${res.statusCode}`));
          else resolve(data);
        } catch { reject(new Error('Invalid API response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('API timeout')); });
    req.write(body);
    req.end();
  });
}

/** Main chat handler with tool loop */
async function handleChat(apiKey, messages, context, user) {
  const systemContent = buildSystemPrompt(context, user);

  // Only expose tools the user is allowed to use
  const allowedTools = TOOLS.filter(t => isToolAllowed(t.name, user));

  let currentMessages = [...messages];
  const MAX_ROUNDS = 8;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemContent,
      tools: allowedTools,
      messages: currentMessages
    };

    const response = await callAnthropic(apiKey, payload);

    if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
      return response;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = (response.content || []).filter(b => b.type === 'tool_use');

      const toolResults = await Promise.all(toolUseBlocks.map(async block => {
        const result = await executeTool(block.name, block.input || {}, user);
        return {
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result)
        };
      }));

      // Append assistant response + tool results to messages
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ];
      continue;
    }

    // Unknown stop_reason — return as-is
    // stop_reason inesperado
    return response;
  }

  throw new Error('Max tool rounds exceeded');
}

// ══════════════════════════════════════
// SERVER
// ══════════════════════════════════════
http.createServer(async (req, res) => {
  const ip = getClientIP(req);

  // ── Security headers en TODAS las respuestas ──
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // ── CORS: same-origin dinámico (localhost + Railway) ──
  if (checkCors(req, res, PORT)) return;
  // Preflight CORS
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: Health check — diagnostica el estado de las env vars (sin exponer valores) ──
  if (req.method === 'GET' && req.url === '/api/health') {
    const sbUrl = process.env.SUPABASE_URL || '';
    const sbKey = process.env.SUPABASE_KEY || '';
    const sbSvc = process.env.SUPABASE_SERVICE_KEY || '';
    const aiKey = process.env.ANTHROPIC_API_KEY || '';
    const warnings = [];
    if (sbUrl && !sbUrl.startsWith('https://')) warnings.push('SUPABASE_URL no es una URL válida (debe empezar con https://)');
    if (sbUrl && sbUrl.startsWith('eyJ'))       warnings.push('SUPABASE_URL contiene un JWT — intercambia con SUPABASE_KEY');
    if (sbKey && sbKey.startsWith('https://'))   warnings.push('SUPABASE_KEY contiene una URL — intercambia con SUPABASE_URL');
    if (sbKey && !sbKey.startsWith('eyJ'))       warnings.push('SUPABASE_KEY no es un JWT válido (debe empezar con eyJ...)');
    if (sbSvc && !sbSvc.startsWith('eyJ'))       warnings.push('SUPABASE_SERVICE_KEY no es un JWT válido');
    if (aiKey && !aiKey.startsWith('sk-ant-'))   warnings.push('ANTHROPIC_API_KEY no empieza con sk-ant-');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      ok: warnings.length === 0,
      env: {
        SUPABASE_URL:         !!sbUrl,
        SUPABASE_KEY:         !!sbKey,
        SUPABASE_SERVICE_KEY: !!sbSvc,
        ANTHROPIC_API_KEY:    !!aiKey,
      },
      ...(warnings.length ? { warnings } : {})
    }));
    return;
  }

  // ── API: Config — devuelve SOLO el anon key al browser (nunca el service key) ──
  if (req.method === 'GET' && req.url === '/api/config') {
    if (isRateLimited(rateLimitKey(ip, 'config'), 60)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''   // anon key only
    }));
    return;
  }

  // ══════════════════════════════════════
  // UPLOAD ENDPOINTS — Operaciones peligrosas (DELETE/UPDATE) vía server con service key
  // El browser NO puede hacer DELETE/UPDATE directamente — solo el server con service key
  // ══════════════════════════════════════

  // ── TPV: Preparar upload (delete previo si replace strategy) + crear batch ──
  if (req.method === 'POST' && req.url === '/api/upload/tpv/prepare') {
    if (!requireAuth(req, res)) return;
    if (isRateLimited(rateLimitKey(ip, 'upload'), 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    try {
      const body = await readBody(req, 10 * 1024 * 1024); // 10MB max
      const { strategy, periodoKey, minDate, maxDate, batchInfo } = body;
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const delHdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };

      // 1. Delete según estrategia
      if (strategy === 'replace_all' || strategy === 'replace') {
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_transactions?id=neq.0', method: 'DELETE', headers: delHdrs });
      } else if ((strategy === 'replace_period' || strategy === 'replace-period') && (minDate || periodoKey)) {
        const filter = minDate
          ? `fecha=gte.${encodeURIComponent(minDate)}&fecha=lte.${encodeURIComponent(maxDate || minDate)}`
          : `periodo=eq.${encodeURIComponent(periodoKey)}`;
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?${filter}`, method: 'DELETE', headers: delHdrs });
      }

      // 2. Crear batch record
      const batchBody = JSON.stringify({ ...batchInfo, created_at: new Date().toISOString() });
      const batchResult = await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_upload_batches', method: 'POST',
        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json',
          'Prefer': 'return=representation', 'Content-Length': Buffer.byteLength(batchBody) } }, batchBody);

      const batchId = Array.isArray(batchResult) ? batchResult[0]?.id : batchResult?.id;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, batchId }));
    } catch (e) {
      console.error('[Upload TPV prepare]', e.message);
      sendError(res, 500, 'Error preparando upload: ' + e.message);
    }
    return;
  }

  // ── TPV: Config upload (agentes, clientes, tasas, relink) ──
  if (req.method === 'POST' && req.url === '/api/upload/tpv/config') {
    if (!requireAuth(req, res)) return;
    if (isRateLimited(rateLimitKey(ip, 'upload'), 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    try {
      const body = await readBody(req, 10 * 1024 * 1024);
      const { agentes, clients, clientsToDelete, msiRates, batchInfo, replaceClients, relinkTransactions } = body;
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = (extra = {}) => ({ 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json', ...extra });

      // Agentes upsert
      if (agentes?.length) {
        const b = JSON.stringify(agentes);
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_agentes', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }

      // Clients delete + upsert
      if (clientsToDelete?.length) {
        // Delete MSI rates first (FK dependency)
        const bIds = JSON.stringify(clientsToDelete);
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_client_msi_rates?cliente_id=in.(${clientsToDelete.join(',')})`, method: 'DELETE',
          headers: hdrs({ 'Prefer': 'return=minimal' }) });
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?cliente_id=in.(${clientsToDelete.join(',')})`, method: 'PATCH',
          headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength('{"cliente_id":null}') } }, '{"cliente_id":null}');
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_clients?id=in.(${clientsToDelete.join(',')})`, method: 'DELETE',
          headers: hdrs({ 'Prefer': 'return=minimal' }) });
      }
      if (clients?.length) {
        const b = JSON.stringify(clients);
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_clients', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }

      // MSI rates: replace all
      if (replaceClients && msiRates !== undefined) {
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_client_msi_rates?cliente_id=neq.0', method: 'DELETE',
          headers: hdrs({ 'Prefer': 'return=minimal' }) });
        if (msiRates?.length) {
          const b = JSON.stringify(msiRates);
          await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_client_msi_rates', method: 'POST',
            headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
        }
      }

      // Batch record para config
      if (batchInfo) {
        const b = JSON.stringify({ ...batchInfo, created_at: new Date().toISOString() });
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_upload_batches', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }

      // Re-link transactions → clients (nombre ilike match, longer names first)
      if (relinkTransactions) {
        const allClients = await httpsRequest({ hostname: parsed.hostname,
          path: '/rest/v1/tpv_clients?select=id,nombre',
          method: 'GET', headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Accept': 'application/json' } });
        if (Array.isArray(allClients)) {
          const sorted = allClients.sort((a, b) => b.nombre.length - a.nombre.length);
          for (const c of sorted) {
            const upd = JSON.stringify({ cliente_id: c.id });
            await httpsRequest({ hostname: parsed.hostname,
              path: `/rest/v1/tpv_transactions?cliente=ilike.${encodeURIComponent(c.nombre + '%')}&cliente_id=is.null`,
              method: 'PATCH',
              headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength(upd) } }, upd);
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      console.error('[Upload TPV config]', e.message);
      sendError(res, 500, 'Error en config TPV: ' + e.message);
    }
    return;
  }

  // ── TPV: Rollback batch ──
  if (req.method === 'DELETE' && req.url.startsWith('/api/upload/tpv/batch/')) {
    if (!requireAuth(req, res)) return;
    try {
      const batchId = req.url.split('/').pop();
      if (!batchId || isNaN(Number(batchId))) { sendError(res, 400, 'batchId inválido'); return; }
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?batch_id=eq.${batchId}`, method: 'DELETE', headers: hdrs });
      const upd = JSON.stringify({ estado: 'rolled_back', updated_at: new Date().toISOString() });
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_upload_batches?id=eq.${batchId}`, method: 'PATCH',
        headers: { ...hdrs, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(upd) } }, upd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      console.error('[Upload TPV rollback]', e.message);
      sendError(res, 500, 'Error en rollback: ' + e.message);
    }
    return;
  }

  // ── Tarjetas: Preparar upload (delete previo + crear batch) ──
  if (req.method === 'POST' && req.url === '/api/upload/tarjetas/prepare') {
    if (!requireAuth(req, res)) return;
    if (isRateLimited(rateLimitKey(ip, 'upload'), 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    try {
      const body = await readBody(req, 10 * 1024 * 1024);
      const { strategy, periodoKey, minDate, maxDate, batchInfo } = body;
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };

      if (strategy === 'replace_all' || strategy === 'replace') {
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_transactions?id=neq.0', method: 'DELETE', headers: hdrs });
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_cardholders?id=neq.0', method: 'DELETE', headers: hdrs });
      } else if ((strategy === 'replace_period' || strategy === 'replace-period') && (minDate || periodoKey)) {
        const filter = minDate
          ? `fecha=gte.${encodeURIComponent(minDate)}&fecha=lte.${encodeURIComponent(maxDate || minDate)}`
          : `periodo=eq.${encodeURIComponent(periodoKey)}`;
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_transactions?${filter}`, method: 'DELETE', headers: hdrs });
        // replace_period also replaces all cardholders (snapshot)
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_cardholders?id=neq.0', method: 'DELETE', headers: hdrs });
      } else if (strategy === 'append_new') {
        // append_new: keep transactions, replace cardholders snapshot
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_cardholders?id=neq.0', method: 'DELETE', headers: hdrs });
      }

      const batchBody = JSON.stringify({ ...batchInfo, created_at: new Date().toISOString() });
      const batchResult = await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_upload_batches', method: 'POST',
        headers: { ...hdrs, 'Content-Type': 'application/json', 'Prefer': 'return=representation', 'Content-Length': Buffer.byteLength(batchBody) } }, batchBody);

      const batchId = Array.isArray(batchResult) ? batchResult[0]?.id : batchResult?.id;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, batchId }));
    } catch (e) {
      console.error('[Upload Tarjetas prepare]', e.message);
      sendError(res, 500, 'Error preparando upload tarjetas: ' + e.message);
    }
    return;
  }

  // ── Tarjetas: Rollback batch ──
  if (req.method === 'DELETE' && req.url.startsWith('/api/upload/tarjetas/batch/')) {
    if (!requireAuth(req, res)) return;
    try {
      const batchId = req.url.split('/').pop();
      if (!batchId || isNaN(Number(batchId))) { sendError(res, 400, 'batchId inválido'); return; }
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_transactions?batch_id=eq.${batchId}`, method: 'DELETE', headers: hdrs });
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_cardholders?batch_id=eq.${batchId}`, method: 'DELETE', headers: hdrs });
      const upd = JSON.stringify({ estado: 'rolled_back', updated_at: new Date().toISOString() });
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_upload_batches?id=eq.${batchId}`, method: 'PATCH',
        headers: { ...hdrs, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(upd) } }, upd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      console.error('[Upload Tarjetas rollback]', e.message);
      sendError(res, 500, 'Error en rollback tarjetas: ' + e.message);
    }
    return;
  }

  // ── API: AI Chat with Tool Use ──
  if (req.method === 'POST' && req.url === '/api/chat') {
    // Auth: requiere token de sesión
    if (!requireAuth(req, res)) return;
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) { sendError(res, 503, 'Servicio no disponible'); return; }
    if (isRateLimited(rateLimitKey(ip, 'chat'), 15)) { sendError(res, 429, 'Demasiadas solicitudes. Espera un momento.'); return; }

    try {
      const body = await readBody(req);
      const messages = (body.messages || []).map(m => ({ role: m.role, content: m.content }));
      const context = body.context || '';

      // Extract user session for permission checking
      let chatUser = {};
      try {
        const decoded = Buffer.from(req.headers.authorization.slice(7), 'base64').toString('utf8');
        chatUser = JSON.parse(decoded);
      } catch (e) { chatUser = {}; }

      const response = await handleChat(API_KEY, messages, context, chatUser);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

    } catch (e) {
      console.error('[Chat] Request failed:', e.message);
      sendError(res, 502, 'Error procesando solicitud');
    }
    return;
  }

  // ── Archivos estáticos ──
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  // Bloquear archivos sensibles (.env, server.js, .git, etc.)
  if (isBlockedPath(url)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const filePath = path.join(ROOT, url);

  // Prevenir directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Solo servir archivos dentro de directorios permitidos
  const isAllowed = ALLOWED_DIRS.some(d => url === d || url.startsWith(d));
  if (!isAllowed) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }

    let target = filePath;
    if (stats.isDirectory()) target = path.join(filePath, 'index.html');

    fs.readFile(target, (err2, data) => {
      if (err2) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(target).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      // Prevent caching for JS/CSS/HTML so changes always take effect
      if (['.js', '.css', '.html'].includes(ext)) {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  });

}).listen(PORT, () => {
  console.log('Grupo Financiero Dashboard listening on port ' + PORT);
  // ── Diagnóstico de variables de entorno al arrancar ──
  const _env = {
    SUPABASE_URL:         process.env.SUPABASE_URL         || '',
    SUPABASE_KEY:         process.env.SUPABASE_KEY         || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
    ANTHROPIC_API_KEY:    process.env.ANTHROPIC_API_KEY    || '',
  };
  const vars = {};
  for (const [k, v] of Object.entries(_env)) vars[k] = v ? '✓ configurado' : '✗ NO CONFIGURADO';
  console.log('[ENV]', JSON.stringify(vars, null, 2));

  // ── Validación de formato — detecta valores intercambiados o incorrectos ──
  const _warnings = [];
  if (_env.SUPABASE_URL && !_env.SUPABASE_URL.startsWith('https://')) {
    _warnings.push('⚠ SUPABASE_URL no empieza con https:// — ¿Pusiste el JWT aquí por error? Debe ser algo como https://xxx.supabase.co');
  }
  if (_env.SUPABASE_URL && _env.SUPABASE_URL.startsWith('eyJ')) {
    _warnings.push('⚠ SUPABASE_URL contiene un JWT (token) en vez de una URL — intercambia los valores de SUPABASE_URL y SUPABASE_KEY');
  }
  if (_env.SUPABASE_KEY && _env.SUPABASE_KEY.startsWith('https://')) {
    _warnings.push('⚠ SUPABASE_KEY contiene una URL en vez de un token — intercambia los valores de SUPABASE_URL y SUPABASE_KEY');
  }
  if (_env.SUPABASE_KEY && !_env.SUPABASE_KEY.startsWith('eyJ')) {
    _warnings.push('⚠ SUPABASE_KEY no parece un JWT válido (debe empezar con eyJ...) — verifica que sea el anon key de Supabase → Settings → API');
  }
  if (_env.SUPABASE_SERVICE_KEY && !_env.SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
    _warnings.push('⚠ SUPABASE_SERVICE_KEY no parece un JWT válido — verifica que sea el service_role key de Supabase → Settings → API');
  }
  if (_env.ANTHROPIC_API_KEY && !_env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    _warnings.push('⚠ ANTHROPIC_API_KEY no empieza con sk-ant- — verifica que sea una API key válida de Anthropic');
  }
  if (_warnings.length) {
    console.error('[ENV] ¡CONFIGURACIÓN INCORRECTA!\n' + _warnings.join('\n'));
  }
});
