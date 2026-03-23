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
  'get_users':              null  // admin only
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
    'get_users':              'Gestión de Usuarios'
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
        if (Array.isArray(data) && data.length > 30) {
          return { total_creditos: data.length, data: data.slice(0, 30), _truncated: true };
        }
        return data;
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
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      ok: true,
      env: {
        SUPABASE_URL:         !!process.env.SUPABASE_URL,
        SUPABASE_KEY:         !!process.env.SUPABASE_KEY,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
        ANTHROPIC_API_KEY:    !!process.env.ANTHROPIC_API_KEY,
      }
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
  const vars = {
    SUPABASE_URL:         process.env.SUPABASE_URL         ? '✓ configurado' : '✗ NO CONFIGURADO',
    SUPABASE_KEY:         process.env.SUPABASE_KEY         ? '✓ configurado' : '✗ NO CONFIGURADO',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✓ configurado' : '✗ NO CONFIGURADO',
    ANTHROPIC_API_KEY:    process.env.ANTHROPIC_API_KEY    ? '✓ configurado' : '✗ NO CONFIGURADO',
  };
  console.log('[ENV]', JSON.stringify(vars, null, 2));
});
