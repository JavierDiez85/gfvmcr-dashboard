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
      if (passwordHash !== user.passwordHash) { sendError(res, 401, 'Credenciales inválidas'); return; }

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
});
