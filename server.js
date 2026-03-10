const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const {
  SECURITY_HEADERS, ALLOWED_DIRS,
  isBlockedPath, getClientIP, isRateLimited, startCleanup,
  checkCors, readBody, sendError, extractDateParams, validateSbConfig
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

// Iniciar limpieza periódica del rate limiter
startCleanup();

// ══════════════════════════════════════
// SUPABASE REST — Zero-dependency helpers
// ══════════════════════════════════════
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';

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

/** Call a Supabase RPC function */
async function supabaseRpc(fnName, params = {}) {
  validateSbConfig(SB_URL, SB_KEY);
  const parsed = new URL(SB_URL);
  const body = JSON.stringify(params);
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/rpc/${fnName}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
  return result;
}

/** Read a key from app_data table (key-value store) */
async function getAppData(key) {
  validateSbConfig(SB_URL, SB_KEY);
  const parsed = new URL(SB_URL);
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`,
    method: 'GET',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (Array.isArray(result) && result.length > 0) return result[0].value;
  return null;
}

/** Query a Supabase table with filters */
async function supabaseQuery(table, select = '*', filters = '') {
  validateSbConfig(SB_URL, SB_KEY);
  const parsed = new URL(SB_URL);
  const qs = `select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`;
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/${table}?${qs}`,
    method: 'GET',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Accept': 'application/json'
    }
  });
  return result;
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

async function executeTool(name, input) {
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
        const data = await getAppData(key);
        if (!data) return { message: 'No hay datos de créditos para ' + input.company };
        // Summarize if array is large
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
    console.error(`[Tool] Error en ${name}`);
    return { error: 'Error ejecutando herramienta' };
  }
}

// ══════════════════════════════════════
// ANTHROPIC API — Call with tool loop
// ══════════════════════════════════════
const SYSTEM_PROMPT = [
  'Eres el asistente financiero experto del dashboard de Grupo Financiero.',
  'Responde SIEMPRE en español. Sé directo, preciso y útil.',
  '',
  'HERRAMIENTAS DISPONIBLES:',
  'Tienes acceso a herramientas que consultan datos en tiempo real del ERP.',
  'SIEMPRE usa las herramientas para obtener datos actualizados antes de responder.',
  'NO inventes datos ni cifras. Si una herramienta falla, informa al usuario.',
  'Puedes llamar varias herramientas en paralelo si necesitas datos de múltiples fuentes.',
  '',
  'REGLAS DE RESPUESTA:',
  '• Cuando te pregunten cifras, DA EL NÚMERO EXACTO de los datos obtenidos.',
  '• Cuando muestres montos usa formato $X,XXX.XX MXN.',
  '• Usa negritas (**texto**) para destacar cifras clave.',
  '• Si te piden comparaciones, calcula las diferencias y porcentajes de cambio.',
  '• Si te piden resúmenes, organiza la info con viñetas claras.',
  '• Si los datos permiten calcular algo (sumas, promedios, porcentajes, tendencias), HAZLO sin que te lo pidan.',
  '• Responde en 2-4 párrafos máximo. No seas excesivamente largo.',
  '',
  'CONOCIMIENTO DEL NEGOCIO:',
  '• Grupo Financiero con 5 entidades: Salem, Endless, Dynamo, Wirebit y Centum Capital.',
  '• Endless y Dynamo otorgan créditos. Cada crédito tiene tabla de amortización (capital, interés, IVA, saldo) y pagos recibidos.',
  '• Las terminales TPV procesan transacciones de clientes. Cada transacción tiene monto, fecha, cliente y terminal.',
  '• Los agentes/promotores ganan comisión sobre el volumen de TPV que manejan.',
  '• P&L = estado de resultados (ingresos vs gastos por entidad).',
  '• Tesorería = movimientos de efectivo entre cuentas y entidades.',
  '• Tickets = solicitudes internas (pagos a proveedores, comisiones, etc.) con estados: abierto, aprobado, pagado, rechazado.',
  '',
  'CÁLCULOS QUE PUEDES HACER:',
  '• Créditos: interés total generado, pagos recibidos vs esperados, saldo por cobrar, morosidad, rendimiento por crédito.',
  '• TPV: volumen diario/mensual, tendencias, ticket promedio, ranking de clientes.',
  '• P&L: utilidad por entidad, margen, variaciones mensuales.',
  '• General: totales, promedios, comparativas, proyecciones simples.'
].join('\n');

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
async function handleChat(apiKey, messages, context) {
  const systemContent = SYSTEM_PROMPT + '\n\nCONTEXTO DE SESIÓN:\n' + (context || 'Sin contexto adicional');

  let currentMessages = [...messages];
  const MAX_ROUNDS = 8;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemContent,
      tools: TOOLS,
      messages: currentMessages
    };

    const response = await callAnthropic(apiKey, payload);

    // If Claude is done (end_turn), return final response
    if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
      // Chat completado
      return response;
    }

    // If Claude wants to use tools
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = (response.content || []).filter(b => b.type === 'tool_use');
      // Tool calls en progreso

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(toolUseBlocks.map(async block => {
        const start = Date.now();
        const result = await executeTool(block.name, block.input || {});
        // Tool ejecutada
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

  // ── API: Config (Supabase) — solo same-origin con rate limit ──
  if (req.method === 'GET' && req.url === '/api/config') {
    if (isRateLimited(ip, 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
    }));
    return;
  }

  // ── API: AI Chat with Tool Use ──
  if (req.method === 'POST' && req.url === '/api/chat') {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) { sendError(res, 500, 'ANTHROPIC_API_KEY no configurada en el servidor'); return; }
    if (isRateLimited(ip, 20)) { sendError(res, 429, 'Demasiadas solicitudes. Espera un momento.'); return; }

    try {
      const body = await readBody(req);
      const messages = (body.messages || []).map(m => ({ role: m.role, content: m.content }));
      const context = body.context || '';

      const response = await handleChat(API_KEY, messages, context);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

    } catch (e) {
      console.error('[Chat] Error:', e.message);
      // No exponer detalles internos al cliente
      const isApiError = e.message.includes('API error');
      sendError(res, isApiError ? 502 : 400, isApiError ? 'Error del servicio AI' : 'Solicitud inválida');
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

}).listen(PORT, () => console.log('Grupo Financiero Dashboard listening on port ' + PORT));
