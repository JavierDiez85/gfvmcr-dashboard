const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const {
  SECURITY_HEADERS, ALLOWED_DIRS,
  isBlockedPath, getClientIP, isRateLimited, startCleanup,
  checkCors, readBody, sendError, validateSbConfig,
  requireAuth, signToken, verifyToken, setupGlobalErrorHandlers, rateLimitKey
} = require('./security');

// Modules
const { httpsRequest, _sbCreds, SB_URL, SB_SERVICE_KEY } = require('./lib/supabase-helpers');
const { handleChat } = require('./lib/ai-chat');

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
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
};

// Iniciar limpieza periódica del rate limiter + error handlers globales
startCleanup();
setupGlobalErrorHandlers();

// ══════════════════════════════════════
// CENTUMPAY INTEGRATION
// ══════════════════════════════════════

// Token cache en memoria
const _centum = { token: null, exp: 0, userId: 11 };

// Headers comunes que el portal web envía
const _CENTUM_HDRS = {
  'Content-Type':  'application/json',
  'Accept':        'application/json, text/plain, */*',
  'Origin':        'https://centumpay.centum.mx',
  'Referer':       'https://centumpay.centum.mx/',
  'User-Agent':    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

// Versión de httpsRequest que devuelve {status, headers, body, parsed}
function _centumRaw(options, body) {
  return new Promise((resolve, reject) => {
    const req = require('https').request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: raw, parsed });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function _centumAuth() {
  if (_centum.token && Date.now() < _centum.exp - 60_000) return _centum.token;
  const email = process.env.CENTUMPAY_EMAIL;
  const pwd   = process.env.CENTUMPAY_PASSWORD;
  if (!email || !pwd) throw new Error('CENTUMPAY_EMAIL / CENTUMPAY_PASSWORD no configurados en .env');

  console.log('[CentumPay] Iniciando login con Puppeteer...');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();

    // Interceptar respuesta de /api/login/auth antes de navegar
    let authData = null;
    page.on('response', async resp => {
      if (resp.url().includes('/api/login/auth') && resp.request().method() === 'POST') {
        authData = await resp.json().catch(() => null);
      }
    });

    await page.goto('https://centumpay.centum.mx', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('[CentumPay] Página cargada, llenando formulario...');

    // Llenar email
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', email, { delay: 50 });

    // Llenar password
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.type('input[type="password"]', pwd, { delay: 50 });

    // Click submit y esperar respuesta de auth
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.sessionStorage.getItem('hash'), { timeout: 15000 }).catch(() => {});

    // Obtener JWT de sessionStorage o de la respuesta interceptada
    const jwtFromStorage = await page.evaluate(() => window.sessionStorage.getItem('hash')).catch(() => null);
    const jwt = jwtFromStorage || authData?.response;

    console.log('[CentumPay] authData:', JSON.stringify(authData)?.slice(0, 100));
    console.log('[CentumPay] jwtFromStorage:', jwtFromStorage ? jwtFromStorage.slice(0,30)+'...' : 'null');

    if (!jwt || typeof jwt !== 'string' || jwt.split('.').length !== 3) {
      throw new Error(`Puppeteer login falló. jwt="${String(jwt).slice(0,100)}" authResp="${JSON.stringify(authData)?.slice(0,150)}"`);
    }

    const parts = jwt.split('.');
    const b64   = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pl    = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    _centum.token  = jwt;
    _centum.exp    = (pl.exp || 0) * 1000;
    _centum.userId = 11;
    console.log('[CentumPay] ✅ Puppeteer login OK, expira:', new Date(_centum.exp).toISOString());
    return jwt;
  } finally {
    await browser.close();
  }
}

// ── Festivos bancarios México — CNBV/Banxico ──

// Domingo de Pascua (algoritmo gregoriano anónimo)
function _easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
// Cache de Semana Santa por año
const _easterCache = {};
function _semanaSanta(year) {
  if (!_easterCache[year]) {
    const pascua     = _easterSunday(year);
    const juevesSanto = new Date(pascua); juevesSanto.setDate(pascua.getDate() - 3);
    const viernesSanto = new Date(pascua); viernesSanto.setDate(pascua.getDate() - 2);
    _easterCache[year] = {
      jueves: juevesSanto.toISOString().slice(0, 10),
      viernes: viernesSanto.toISOString().slice(0, 10),
    };
  }
  return _easterCache[year];
}

function _isMexHoliday(d) {
  const year = d.getFullYear();
  const mm   = d.getMonth() + 1;
  const dd   = d.getDate();
  const dow  = d.getDay(); // 0=dom … 6=sab
  const iso  = d.toISOString().slice(0, 10);

  // ── Festivos de fecha fija ──
  if (mm === 1  && dd === 1)  return true; // Año Nuevo
  if (mm === 5  && dd === 1)  return true; // Día del Trabajo
  if (mm === 9  && dd === 16) return true; // Independencia
  if (mm === 12 && dd === 25) return true; // Navidad

  // ── Festivos en lunes (por decreto DOF) ──
  if (mm === 2  && dow === 1 && dd >= 1  && dd <= 7)  return true; // Constitución (1er lunes feb)
  if (mm === 3  && dow === 1 && dd >= 15 && dd <= 21) return true; // Benito Juárez (3er lunes mar)
  if (mm === 11 && dow === 1 && dd >= 15 && dd <= 21) return true; // Revolución (3er lunes nov)

  // ── Semana Santa (Jueves y Viernes Santo) ──
  const ss = _semanaSanta(year);
  if (iso === ss.jueves || iso === ss.viernes) return true;

  return false;
}
function _isBizDay(d) { return d.getDay() !== 0 && d.getDay() !== 6 && !_isMexHoliday(d); }
// Avanza N días hábiles a partir de una fecha (sin modificar el objeto original)
function _addBizDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00'); // mediodía para evitar DST
  let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); if (_isBizDay(d)) added++; }
  return d.toISOString().slice(0, 10);
}
// Siguiente día hábil después de dateStr
function _nextBizDay(dateStr) { return _addBizDays(dateStr, 1); }

function _centumTransform(t, batchId) {
  // Parsear directamente del string para evitar conversión de timezone
  // datcr viene en hora local de México (ej. "2026-04-22T23:15:00")
  const raw   = t.datcr || '';
  const fecha = raw.slice(0, 10) || null;                         // YYYY-MM-DD
  const hora  = raw.length >= 19 ? raw.slice(11, 19) : null;     // HH:MM:SS
  const hour  = raw.length >= 13 ? parseInt(raw.slice(11, 13)) : -1;

  // ── Fecha base: si hora >= 23:00 avanza al día siguiente ──
  let baseDate = fecha;
  if (fecha && hour >= 23) {
    const next = new Date(fecha + 'T12:00:00'); // mediodia UTC, seguro contra DST
    next.setDate(next.getDate() + 1);
    baseDate = next.toISOString().slice(0, 10);
  }

  // ── Card type key ──
  const marca  = (t.redtarj  || '').toLowerCase();
  const bin    = (t.BIN      || '').toLowerCase();
  const metodo = (t.tipotarj || '').toLowerCase();
  let cardTypeKey = 'TC';
  const isAmex = marca.includes('amex') || marca.includes('american');
  if      (isAmex)                        cardTypeKey = 'Amex';
  else if (bin.includes('internacional')) cardTypeKey = 'TI';
  else if (metodo.includes('d\u00e9b') || metodo.includes('deb') || metodo.includes('prepago')) cardTypeKey = 'TD';

  // ── Fecha liquidación ──
  // Amex: T+3 días hábiles | Resto: siguiente día hábil (T+1)
  const fechaLiq = baseDate
    ? (isAmex ? _addBizDays(baseDate, 3) : _nextBizDay(baseDate))
    : null;

  // ── Tipo transacción ──
  const isCancela = !!(t.cancela || t.devolucion || t.reverso);
  let tipo = 'PAGO';
  if      (t.cancela)    tipo = 'CANCELACI\u00d3N';
  else if (t.devolucion) tipo = 'DEVOLUCI\u00d3N';
  else if (t.reverso)    tipo = 'REVERSO';
  else if (t.msi)        tipo = 'PAGO X MSI';

  // ── Plazo MSI ──
  let plazo = 0;
  if (t.msi && typeof t.msi === 'number') plazo = t.msi;
  else if (t.msi && typeof t.msi === 'string') { const m = String(t.msi).match(/\d+/); if (m) plazo = +m[0]; }

  // ── Montos: negativos en cancelaciones/devoluciones/reversas ──
  const sign  = isCancela ? -1 : 1;
  const monto = sign * (parseFloat(t.amount)     || 0);
  const com   = t.ganancia   != null ? sign * parseFloat(t.ganancia)   : null;
  const iva   = t.iva        != null ? sign * parseFloat(t.iva)        : null;

  return {
    excel_id:          String(t.idTrans || ''),
    upload_batch:      batchId,
    adquiriente:       'EfevooPay',
    cliente:           (t.EMP || '').toUpperCase().trim(),
    monto,
    fecha,
    hora,
    terminal_id:       t.device_id ? String(t.device_id) : null,
    fecha_liquidacion: fechaLiq,
    sucursal:          t.SUC     || null,
    mes:               fecha ? fecha.slice(0, 7) : null,
    marca_tarjeta:     t.redtarj  || null,
    card_type_key:     cardTypeKey,
    tipo_tarjeta:      t.BIN      || null,
    metodo_pago:       t.tipotarj || null,
    tipo_transaccion:  tipo,
    plazo_msi:         plazo,
    tasa_comision_cp:  t.porcentaje != null ? parseFloat(t.porcentaje) : null,
    monto_comision_cp: com,
    iva_comision_cp:   iva,
    modo_entrada:      null,
  };
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
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: Health check ──
  if (req.method === 'GET' && req.url === '/api/health') {
    // Verify admin auth without sendError (health must always respond)
    let jwt = null;
    const cookies = req.headers.cookie || '';
    const m = cookies.match(/(?:^|;\s*)gf_token=([^;]+)/);
    if (m) jwt = verifyToken(m[1]);
    if (!jwt) {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ') && auth.length >= 30) jwt = verifyToken(auth.slice(7));
    }
    if (!jwt || jwt.rol !== 'admin') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
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
      env: { SUPABASE_URL: !!sbUrl, SUPABASE_KEY: !!sbKey, SUPABASE_SERVICE_KEY: !!sbSvc, ANTHROPIC_API_KEY: !!aiKey },
      ...(warnings.length ? { warnings } : {})
    }));
    return;
  }

  // ── API: Config — devuelve SOLO el anon key al browser ──
  if (req.method === 'GET' && req.url === '/api/config') {
    if (isRateLimited(rateLimitKey(ip, 'config'), 60)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ supabaseUrl: process.env.SUPABASE_URL || '', supabaseKey: process.env.SUPABASE_KEY || '' }));
    return;
  }

  // ── API: Login — valida credenciales server-side y devuelve JWT firmado ──
  if (req.method === 'POST' && req.url === '/api/login') {
    if (isRateLimited(rateLimitKey(ip, 'login'), 10)) { sendError(res, 429, 'Demasiados intentos. Espera un momento.'); return; }
    try {
      const body = await readBody(req);
      const { email, passwordHash, salt } = body;
      if (!email || !passwordHash) { sendError(res, 400, 'Email y hash requeridos'); return; }

      // Fetch users from Supabase
      const { getAppData } = require('./lib/supabase-helpers');
      let usuarios = [];
      try { usuarios = await getAppData('gf_usuarios') || []; } catch(e) {}
      if (!Array.isArray(usuarios) || !usuarios.length) { sendError(res, 503, 'No se pudieron cargar usuarios'); return; }

      const user = usuarios.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.activo !== false);
      if (!user) { sendError(res, 401, 'Credenciales inválidas'); return; }

      // Verify hash matches
      if (!crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(user.passwordHash || ''))) { sendError(res, 401, 'Credenciales inválidas'); return; }

      // Sign JWT
      const token = signToken({
        id: user.id, nombre: user.nombre, email: user.email,
        rol: user.rol || 'viewer', perms: user.perms || {}
      });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `gf_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT ? '; Secure' : ''}`
      });
      res.end(JSON.stringify({
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol || 'viewer', perms: user.perms || {} },
        salt: user.salt || null
      }));
    } catch (e) {
      console.error('[Login]', e.message);
      sendError(res, 500, 'Error en login');
    }
    return;
  }

  // ── API: Logout — expire httpOnly cookie ──
  if (req.method === 'POST' && req.url === '/api/logout') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `gf_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT ? '; Secure' : ''}`
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ── API: Get user salt (for client-side hashing before login) ──
  if (req.method === 'POST' && req.url === '/api/login/salt') {
    if (isRateLimited(rateLimitKey(ip, 'login'), 15)) { sendError(res, 429, 'Rate limit'); return; }
    try {
      const body = await readBody(req);
      const { email } = body;
      if (!email) { sendError(res, 400, 'Email requerido'); return; }
      const { getAppData } = require('./lib/supabase-helpers');
      let usuarios = [];
      try { usuarios = await getAppData('gf_usuarios') || []; } catch(e) {}
      const user = (Array.isArray(usuarios) ? usuarios : []).find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.activo !== false);
      // Always return 200 to prevent user enumeration
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ salt: user?.salt || null }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ salt: null }));
    }
    return;
  }

  // ══════════════════════════════════════
  // UPLOAD ENDPOINTS — DELETE/UPDATE vía server con service key
  // ══════════════════════════════════════

  // ── TPV: Preparar upload ──
  if (req.method === 'POST' && req.url === '/api/upload/tpv/prepare') {
    if (!requireAuth(req, res)) return;
    if (isRateLimited(rateLimitKey(ip, 'upload'), 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    try {
      const body = await readBody(req, 10 * 1024 * 1024);
      const { strategy, periodoKey, minDate, maxDate, batchInfo } = body;
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const delHdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };

      if (strategy === 'replace_all' || strategy === 'replace') {
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_transactions?id=neq.0', method: 'DELETE', headers: delHdrs });
      } else if ((strategy === 'replace_period' || strategy === 'replace-period') && (minDate || periodoKey)) {
        const filter = minDate
          ? `fecha=gte.${encodeURIComponent(minDate)}&fecha=lte.${encodeURIComponent(maxDate || minDate)}`
          : `periodo=eq.${encodeURIComponent(periodoKey)}`;
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?${filter}`, method: 'DELETE', headers: delHdrs });
      }

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

  // ── TPV: Config upload ──
  if (req.method === 'POST' && req.url === '/api/upload/tpv/config') {
    if (!requireAuth(req, res)) return;
    if (isRateLimited(rateLimitKey(ip, 'upload'), 30)) { sendError(res, 429, 'Rate limit exceeded'); return; }
    try {
      const body = await readBody(req, 10 * 1024 * 1024);
      const { agentes, clients, clientsToDelete, msiRates, batchInfo, replaceClients, relinkTransactions } = body;
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = (extra = {}) => ({ 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json', ...extra });

      if (agentes?.length) {
        const b = JSON.stringify(agentes);
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_agentes', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }
      if (clientsToDelete?.length) {
        if (!clientsToDelete.every(id => /^\d+$/.test(String(id)))) { sendError(res, 400, 'clientsToDelete contiene IDs inválidos'); return; }
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_client_msi_rates?cliente_id=in.(${clientsToDelete.join(',')})`, method: 'DELETE', headers: hdrs({ 'Prefer': 'return=minimal' }) });
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?cliente_id=in.(${clientsToDelete.join(',')})`, method: 'PATCH',
          headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength('{"cliente_id":null}') } }, '{"cliente_id":null}');
        await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_clients?id=in.(${clientsToDelete.join(',')})`, method: 'DELETE', headers: hdrs({ 'Prefer': 'return=minimal' }) });
      }
      if (clients?.length) {
        const b = JSON.stringify(clients);
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_clients', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }
      if (replaceClients && msiRates !== undefined) {
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_client_msi_rates?cliente_id=neq.0', method: 'DELETE', headers: hdrs({ 'Prefer': 'return=minimal' }) });
        if (msiRates?.length) {
          const b = JSON.stringify(msiRates);
          await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_client_msi_rates', method: 'POST',
            headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
        }
      }
      if (batchInfo) {
        const b = JSON.stringify({ ...batchInfo, created_at: new Date().toISOString() });
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tpv_upload_batches', method: 'POST',
          headers: { ...hdrs({ 'Prefer': 'return=minimal' }), 'Content-Length': Buffer.byteLength(b) } }, b);
      }
      if (relinkTransactions) {
        const allClients = await httpsRequest({ hostname: parsed.hostname,
          path: '/rest/v1/tpv_clients?select=id,nombre', method: 'GET',
          headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Accept': 'application/json' } });
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
    if (req._user.rol !== 'admin') { sendError(res, 403, 'Solo administradores pueden eliminar lotes'); return; }
    try {
      const batchId = decodeURIComponent(req.url.split('/').pop());
      if (!batchId || batchId.length > 64 || /[^a-zA-Z0-9\-_]/.test(batchId)) { sendError(res, 400, 'batchId inválido'); return; }
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_transactions?batch_id=eq.${encodeURIComponent(batchId)}`, method: 'DELETE', headers: hdrs });
      const upd = JSON.stringify({ estado: 'rolled_back', updated_at: new Date().toISOString() });
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tpv_upload_batches?id=eq.${encodeURIComponent(batchId)}`, method: 'PATCH',
        headers: { ...hdrs, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(upd) } }, upd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      console.error('[Upload TPV rollback]', e.message);
      sendError(res, 500, 'Error en rollback: ' + e.message);
    }
    return;
  }

  // ── Tarjetas: Preparar upload ──
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
        await httpsRequest({ hostname: parsed.hostname, path: '/rest/v1/tar_cardholders?id=neq.0', method: 'DELETE', headers: hdrs });
      } else if (strategy === 'append_new') {
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
    if (req._user.rol !== 'admin') { sendError(res, 403, 'Solo administradores pueden eliminar lotes'); return; }
    try {
      const batchId = decodeURIComponent(req.url.split('/').pop());
      if (!batchId || batchId.length > 64 || /[^a-zA-Z0-9\-_]/.test(batchId)) { sendError(res, 400, 'batchId inválido'); return; }
      const { url: sbUrl, key: sbKey } = _sbCreds();
      const parsed = new URL(sbUrl);
      const hdrs = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Prefer': 'return=minimal' };
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_transactions?batch_id=eq.${encodeURIComponent(batchId)}`, method: 'DELETE', headers: hdrs });
      await httpsRequest({ hostname: parsed.hostname, path: `/rest/v1/tar_cardholders?batch_id=eq.${encodeURIComponent(batchId)}`, method: 'DELETE', headers: hdrs });
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

  // ── CentumPay: Debug (admin only) ──
  if (req.method === 'GET' && req.url === '/api/centum/debug') {
    if (!requireAuth(req, res)) return;
    if (req._user.rol !== 'admin') { sendError(res, 403, 'Admin only'); return; }
    try {
      const email = process.env.CENTUMPAY_EMAIL || '(no configurado)';
      const pwd   = process.env.CENTUMPAY_PASSWORD;
      const hash  = pwd ? crypto.createHash('sha256').update(pwd).digest('base64') : '(sin password)';
      // Paso 1: inicializar sesión
      const hashPath = `/api/login/hash?email=${encodeURIComponent(email)}&usuario=&contrasena=`;
      const h1 = await _centumRaw({ hostname: 'centumpay.centum.mx', path: hashPath, method: 'GET', headers: _CENTUM_HDRS });
      // Paso 2: auth
      const body = JSON.stringify({ email, hash, usuario: '', contrasena: '' });
      const r = await _centumRaw({
        hostname: 'centumpay.centum.mx', path: '/api/login/auth', method: 'POST',
        headers: { ..._CENTUM_HDRS, 'Content-Length': Buffer.byteLength(body) },
      }, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        email, hashUsado: hash.slice(0, 10) + '...',
        step1_hash_status: h1.status, step1_code: h1.parsed?.response,
        httpStatus: r.status,
        responseBody: r.body.slice(0, 500),
        parsedOk: !!r.parsed,
        isSuccess: r.parsed?.isSuccess,
      }));
    } catch (e) {
      sendError(res, 500, 'Debug error: ' + e.message);
    }
    return;
  }

  // ── CentumPay: Status ──
  if (req.method === 'GET' && req.url === '/api/centum/status') {
    if (!requireAuth(req, res)) return;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      configured: !!(process.env.CENTUMPAY_EMAIL && process.env.CENTUMPAY_PASSWORD),
      tokenActive: !!(_centum.token && Date.now() < _centum.exp),
      tokenExp: _centum.exp ? new Date(_centum.exp).toISOString() : null,
    }));
    return;
  }

  // ── CentumPay: Test Auth Automático ──
  if (req.method === 'POST' && req.url === '/api/centum/test-auth') {
    if (!requireAuth(req, res)) return;
    if (req._user.rol !== 'admin') { sendError(res, 403, 'Admin only'); return; }
    try {
      _centum.token = null; // Forzar re-auth
      _centum.exp = 0;
      const jwt = await _centumAuth();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        message: 'Auth automático OK',
        tokenPreview: jwt.slice(0, 20) + '...',
        expira: new Date(_centum.exp).toISOString(),
      }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // ── CentumPay: Sync Terminales → tpv_transactions ──
  if (req.method === 'POST' && req.url === '/api/centum/sync-terminales') {
    if (!requireAuth(req, res)) return;
    if (req._user.rol !== 'admin') { sendError(res, 403, 'Solo administradores'); return; }
    if (isRateLimited(rateLimitKey(ip, 'centum_sync'), 5)) { sendError(res, 429, 'Demasiadas solicitudes. Espera un momento.'); return; }
    try {
      const body = await readBody(req);
      const { fechaInicio, fechaFin, jwtToken } = body;
      if (!fechaInicio || !fechaFin) { sendError(res, 400, 'fechaInicio y fechaFin requeridos (YYYY-MM-DD)'); return; }

      // Usar JWT provisto manualmente si existe, si no intentar auth automática
      let token;
      if (jwtToken && jwtToken.startsWith('eyJ')) {
        token = jwtToken;
        // Guardar en cache para reutilizar
        try {
          const parts = jwtToken.split('.');
          const pl = JSON.parse(Buffer.from(parts[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
          _centum.token = jwtToken;
          _centum.exp   = (pl.exp || 0) * 1000;
          console.log('[CentumPay] Usando JWT manual, expira:', new Date(_centum.exp).toISOString());
        } catch {}
      } else {
        token = await _centumAuth();
      }

      // Fetch transacciones desde CentumPay
      const txBody = JSON.stringify({
        idagep_empresa: '1',
        fechaInicio: fechaInicio + 'T00:00:00',
        fechaFin:    fechaFin    + 'T23:59:59',
        idagep_sucursal: 0,
        idagep_usuarios: _centum.userId,
        pagina: 0, tamano_pagina: 0,
        tipo: 'all', tipoTransaccion: 'all',
      });
      const txData = await httpsRequest({
        hostname: 'centumpay.centum.mx', path: '/api/transactions/resumen', method: 'POST',
        headers: { ..._CENTUM_HDRS, 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(txBody) },
      }, txBody);

      if (!txData.isSuccess) throw new Error('CentumPay transacciones falló: ' + JSON.stringify(txData).slice(0, 200));
      const rows = txData.response?.transacciones || [];

      if (!rows.length) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, inserted: 0, message: 'Sin transacciones en el período' }));
        return;
      }

      const { url: sbUrl, key: sbKey } = _sbCreds();
      const sbH = new URL(sbUrl);
      const sbHdrs = (ex = {}) => ({ apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', ...ex });

      // Crear batch de auditoría
      const batchId = crypto.randomUUID();
      const bBody = JSON.stringify([{
        id: batchId,
        filename: `centumpay_sync_${fechaInicio}_${fechaFin}`,
        row_count: rows.length,
        date_range_from: fechaInicio,
        date_range_to: fechaFin,
        strategy: 'replace_period',
        uploaded_by: req._user.nombre || req._user.email || 'centum_sync',
      }]);
      await httpsRequest({ hostname: sbH.hostname, path: '/rest/v1/tpv_upload_batches', method: 'POST', headers: { ...sbHdrs({ Prefer: 'return=minimal' }), 'Content-Length': Buffer.byteLength(bBody) } }, bBody);

      // Eliminar filas previas del período (solo EfevooPay para no tocar Banorte)
      await httpsRequest({ hostname: sbH.hostname, path: `/rest/v1/tpv_transactions?fecha=gte.${fechaInicio}&fecha=lte.${fechaFin}&adquiriente=eq.EfevooPay`, method: 'DELETE', headers: sbHdrs({ Prefer: 'return=minimal' }) });

      // Transformar e insertar en lotes de 500
      const transformed = rows.map(t => _centumTransform(t, batchId));
      let inserted = 0;
      for (let i = 0; i < transformed.length; i += 500) {
        const chunk = transformed.slice(i, i + 500);
        const iBody = JSON.stringify(chunk);
        await httpsRequest({ hostname: sbH.hostname, path: '/rest/v1/tpv_transactions', method: 'POST', headers: { ...sbHdrs({ Prefer: 'return=minimal' }), 'Content-Length': Buffer.byteLength(iBody) } }, iBody);
        inserted += chunk.length;
      }

      console.log(`[CentumPay] Sync OK: ${inserted} txns (${fechaInicio} → ${fechaFin})`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, inserted, batchId, from: fechaInicio, to: fechaFin }));
    } catch (e) {
      console.error('[CentumPay Sync]', e.message);
      sendError(res, 500, 'Error en sincronización: ' + (e.message || 'error desconocido'));
    }
    return;
  }

  // ── API: AI Chat with Tool Use ──
  if (req.method === 'POST' && req.url === '/api/chat') {
    if (!requireAuth(req, res)) return;
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) { sendError(res, 503, 'Servicio no disponible'); return; }
    if (isRateLimited(rateLimitKey(ip, 'chat'), 15)) { sendError(res, 429, 'Demasiadas solicitudes. Espera un momento.'); return; }
    try {
      const body = await readBody(req);
      const messages = (body.messages || []).map(m => ({ role: m.role, content: m.content }));
      const context = body.context || '';
      // Use user from requireAuth (supports JWT + legacy Base64)
      const chatUser = req._user || {};
      const response = await handleChat(API_KEY, messages, context, chatUser);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (e) {
      console.error('[Chat] Request failed:', e.message, e.stack);
      const safeMsg = e.message && !e.message.includes('sk-')
        ? e.message : 'Error interno del servidor';
      sendError(res, 502, safeMsg);
    }
    return;
  }

  // ── Archivos estáticos ──
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  if (isBlockedPath(url)) { res.writeHead(404); res.end('Not found'); return; }

  const filePath = path.join(ROOT, url);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  const isAllowed = ALLOWED_DIRS.some(d => url === d || url.startsWith(d));
  if (!isAllowed) { res.writeHead(404); res.end('Not found'); return; }

  fs.stat(filePath, (err, stats) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    let target = filePath;
    if (stats.isDirectory()) target = path.join(filePath, 'index.html');
    fs.readFile(target, (err2, data) => {
      if (err2) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(target).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
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
  // Diagnóstico de env vars al arrancar
  const _env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  };
  const vars = {};
  for (const [k, v] of Object.entries(_env)) vars[k] = v ? '✓ configurado' : '✗ NO CONFIGURADO';
  console.log('[ENV]', JSON.stringify(vars, null, 2));

  // Validación de formato
  const _warnings = [];
  if (_env.SUPABASE_URL && !_env.SUPABASE_URL.startsWith('https://'))
    _warnings.push('⚠ SUPABASE_URL no empieza con https:// — ¿Pusiste el JWT aquí por error?');
  if (_env.SUPABASE_URL && _env.SUPABASE_URL.startsWith('eyJ'))
    _warnings.push('⚠ SUPABASE_URL contiene un JWT — intercambia con SUPABASE_KEY');
  if (_env.SUPABASE_KEY && _env.SUPABASE_KEY.startsWith('https://'))
    _warnings.push('⚠ SUPABASE_KEY contiene una URL — intercambia con SUPABASE_URL');
  if (_env.SUPABASE_KEY && !_env.SUPABASE_KEY.startsWith('eyJ'))
    _warnings.push('⚠ SUPABASE_KEY no parece un JWT válido (debe empezar con eyJ...)');
  if (_env.SUPABASE_SERVICE_KEY && !_env.SUPABASE_SERVICE_KEY.startsWith('eyJ'))
    _warnings.push('⚠ SUPABASE_SERVICE_KEY no parece un JWT válido');
  if (_env.ANTHROPIC_API_KEY && !_env.ANTHROPIC_API_KEY.startsWith('sk-ant-'))
    _warnings.push('⚠ ANTHROPIC_API_KEY no empieza con sk-ant-');
  if (_warnings.length) console.error('[ENV] ¡CONFIGURACIÓN INCORRECTA!\n' + _warnings.join('\n'));
  // CentumPay
  const cpEmail = process.env.CENTUMPAY_EMAIL;
  const cpPwd   = process.env.CENTUMPAY_PASSWORD;
  if (!cpEmail || !cpPwd) console.warn('[CentumPay] ⚠ CENTUMPAY_EMAIL / CENTUMPAY_PASSWORD no configurados — sync deshabilitado');
  else {
    console.log('[CentumPay] ✓ Credenciales configuradas para', cpEmail);
    _scheduleDailySync();
  }
});

// ══════════════════════════════════════
// CRON: Sync diario automático a las 7am CST (13:00 UTC)
// ══════════════════════════════════════
function _scheduleDailySync() {
  const HOUR_UTC = 13; // 7am CST (UTC-6) / 8am CDT (UTC-5) → 13:00 UTC cubre ambos
  const MIN_UTC  = 0;

  function _msUntilNext() {
    const now = new Date();
    const next = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      HOUR_UTC, MIN_UTC, 0, 0
    ));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
  }

  async function _runDailySync() {
    const now = new Date();
    // Sincronizar ayer (CST: UTC-6)
    const ayer = new Date(now.getTime() - 6 * 3600_000 - 24 * 3600_000);
    const fecha = ayer.toISOString().slice(0, 10);
    console.log(`[CentumPay Cron] Iniciando sync diario: ${fecha}`);
    try {
      const token = await _centumAuth();
      // Llamar al mismo flujo de sync que usa el endpoint manual
      const txBody = JSON.stringify({
        idagep_empresa: '1',
        fechaInicio: fecha + 'T00:00:00',
        fechaFin:    fecha + 'T23:59:59',
        idagep_sucursal: 0,
        idagep_usuarios: _centum.userId,
        pagina: 0, tamano_pagina: 0,
        tipo: 'all', tipoTransaccion: 'all',
      });
      const txData = await httpsRequest({
        hostname: 'centumpay.centum.mx', path: '/api/transactions/resumen', method: 'POST',
        headers: { ..._CENTUM_HDRS, 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(txBody) },
      }, txBody);

      if (!txData.isSuccess) throw new Error('Transacciones falló: ' + JSON.stringify(txData).slice(0, 200));
      const rows = txData.response?.transacciones || [];

      if (rows.length) {
        const { url: sbUrl, key: sbKey } = _sbCreds();
        const sbH = new URL(sbUrl);
        const sbHdrs = (ex = {}) => ({ apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', ...ex });
        const batchId = crypto.randomUUID();

        // Batch de auditoría
        const bBody = JSON.stringify([{
          id: batchId, filename: `centumpay_cron_${fecha}`,
          row_count: rows.length, date_range_from: fecha, date_range_to: fecha,
          strategy: 'replace_period', uploaded_by: 'cron_7am',
        }]);
        await httpsRequest({ hostname: sbH.hostname, path: '/rest/v1/tpv_upload_batches', method: 'POST', headers: { ...sbHdrs({ Prefer: 'return=minimal' }), 'Content-Length': Buffer.byteLength(bBody) } }, bBody);

        // Eliminar previas y reinsertar
        await httpsRequest({ hostname: sbH.hostname, path: `/rest/v1/tpv_transactions?fecha=gte.${fecha}&fecha=lte.${fecha}&adquiriente=eq.EfevooPay`, method: 'DELETE', headers: sbHdrs({ Prefer: 'return=minimal' }) });
        const transformed = rows.map(t => _centumTransform(t, batchId));
        for (let i = 0; i < transformed.length; i += 500) {
          const chunk = transformed.slice(i, i + 500);
          const iBody = JSON.stringify(chunk);
          await httpsRequest({ hostname: sbH.hostname, path: '/rest/v1/tpv_transactions', method: 'POST', headers: { ...sbHdrs({ Prefer: 'return=minimal' }), 'Content-Length': Buffer.byteLength(iBody) } }, iBody);
        }
        console.log(`[CentumPay Cron] ✅ ${rows.length} transacciones sincronizadas (${fecha})`);
      } else {
        console.log(`[CentumPay Cron] Sin transacciones para ${fecha}`);
      }
    } catch (e) {
      console.error(`[CentumPay Cron] ❌ Error: ${e.message}`);
    }
    // Programar siguiente ejecución (mañana a las 7am CST)
    setTimeout(() => { _runDailySync(); }, _msUntilNext());
  }

  const ms = _msUntilNext();
  const next = new Date(Date.now() + ms);
  console.log(`[CentumPay Cron] Próximo sync: ${next.toISOString()} (en ${Math.round(ms/60000)} min)`);
  setTimeout(() => { _runDailySync(); }, ms);
}
