// ══════════════════════════════════════
// SECURITY MODULE — Grupo Financiero Dashboard
// Centraliza: headers, CORS, rate limiter, path blocking, auth, error handler
// ══════════════════════════════════════

// ── Headers de seguridad (helmet-equivalent, sin dependencias) ──
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',                                    // Desactivar filtro XSS legacy (recomendación OWASP)
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',  // HSTS 1 año
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Download-Options': 'noopen',
  // CSP — bloquea scripts inyectados, solo permite origenes conocidos
  //
  // PENDIENTES para CSP strict (ver auditoría 2026-03-24):
  //
  // 1. 'unsafe-eval' en script-src:
  //    Requerido por xlsx@0.18.5 (CDN, usa new Function() internamente) y pdf.js.
  //    Se puede eliminar al migrar xlsx client-side a una alternativa sin eval
  //    y reemplazar pdf.js worker con un hash SRI + sin eval.
  //
  // 2. 'unsafe-inline' en script-src:
  //    index.html tiene ~356 event handlers inline (onclick, onkeydown, onchange…).
  //    Requiere modularizar index.html: mover todos los handlers a archivos JS externos.
  //
  // 3. 'unsafe-inline' en style-src:
  //    Cientos de atributos style="" inline en el HTML.
  //    Requiere extraer todos los estilos inline a clases CSS.
  //    (El único <style> tag — @keyframes gf-spin — ya fue movido a styles.css).
  //
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://*.supabase.co https://cdnjs.cloudflare.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};

// ── Archivos/rutas bloqueadas (nunca servir via HTTP) ──
const BLOCKED_PATTERNS = [
  /^\/\.env/i,
  /^\/server\.js/i,
  /^\/security\.js/i,
  /^\/package\.json/i,
  /^\/package-lock\.json/i,
  /^\/node_modules/i,
  /^\/\.git/i,
  /^\/\.claude/i,
  /^\/\.vscode/i,
  /^\/.+\.md$/i,
  /^\/\.npmrc/i,
  /^\/\.DS_Store/i,
  /^\/lib\//i
];

// ── Directorios permitidos para archivos estáticos ──
const ALLOWED_DIRS = ['/index.html', '/js/', '/css/', '/assets/', '/img/', '/favicon'];

/** Verificar si una ruta está bloqueada */
function isBlockedPath(urlPath) {
  return BLOCKED_PATTERNS.some(re => re.test(urlPath));
}

/** Obtener IP real del cliente — confía en x-forwarded-for solo detrás de proxy conocido */
function getClientIP(req) {
  // En producción (Railway, etc.), el proxy inyecta x-forwarded-for confiable
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && process.env.TRUST_PROXY === '1') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '0.0.0.0';
}

// ── Rate limiter por IP (sliding window 60s, con buckets por ruta) ──
const _rl = {};

/** Rate limiter genérico. key = IP o IP+ruta para granularidad */
function isRateLimited(key, max = 20) {
  const now = Date.now(), win = 60000;
  if (!_rl[key]) _rl[key] = [];
  _rl[key] = _rl[key].filter(t => now - t < win);
  if (_rl[key].length >= max) return true;
  _rl[key].push(now);
  return false;
}

/** Iniciar limpieza periódica de IPs inactivas (cada 5 min) */
function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(_rl)) {
      _rl[key] = _rl[key].filter(t => now - t < 60000);
      if (_rl[key].length === 0) delete _rl[key];
    }
  }, 300000);
}

/** Enviar respuesta JSON de error (DRY helper) */
function sendError(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/** Build whitelist of allowed origins (localhost + producción via env) */
function _buildOrigins(port) {
  const origins = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ];
  // Producción: definir CORS_ORIGIN en .env (ej: https://gf-dashboard.up.railway.app)
  const prod = process.env.CORS_ORIGIN;
  if (prod) prod.split(',').forEach(o => origins.push(o.trim()));
  return origins;
}

/** Validar CORS con whitelist explícita. Retorna true si bloqueó (403 enviado). */
function checkCors(req, res, port) {
  const origin = req.headers.origin;
  if (!origin) return false;

  const allowed = _buildOrigins(port);

  // Permitir same-host: cubre IPs de red local, IPv6 (::1), hostnames de red, etc.
  const reqHost = req.headers.host || '';
  const isSameHost = origin === `http://${reqHost}` || origin === `https://${reqHost}`;

  if (!isSameHost && !allowed.includes(origin)) {
    sendError(res, 403, 'Origin not allowed');
    return true;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');  // Preflight cache 24h
  res.setHeader('Vary', 'Origin');
  return false;
}

/** Leer y parsear JSON del body (con límite de tamaño) */
function readBody(req, maxBytes = 131072) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > maxBytes) { req.destroy(); reject(new Error('Body too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** Extraer parámetros de fecha de input de herramienta (DRY helper) */
function extractDateParams(input) {
  const params = {};
  if (input.p_from) params.p_from = input.p_from;
  if (input.p_to) params.p_to = input.p_to;
  return params;
}

/** Validar que Supabase esté configurado (DRY helper) */
function validateSbConfig(url, key) {
  if (!url || !key) throw new Error('Supabase not configured');
}

// ── JWT helpers (HMAC-SHA256, zero-dependency) ──
const crypto = require('crypto');

function _jwtSecret() {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY;
  if (!secret) {
    console.error('[SECURITY] ❌ No SESSION_SECRET nor SUPABASE_SERVICE_KEY — JWT signing is insecure!');
    throw new Error('Server misconfigured: no JWT secret available');
  }
  return secret;
}

function _b64url(buf) {
  return (typeof buf === 'string' ? Buffer.from(buf) : buf)
    .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function _b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/** Sign a JWT with HMAC-SHA256 — expires in 24h */
function signToken(payload) {
  const header = _b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = _b64url(JSON.stringify({ ...payload, iat: now, exp: now + 86400 }));
  const sig = _b64url(crypto.createHmac('sha256', _jwtSecret()).update(header + '.' + body).digest());
  return header + '.' + body + '.' + sig;
}

/** Verify a JWT — returns payload or null */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const sig = _b64url(crypto.createHmac('sha256', _jwtSecret()).update(parts[0] + '.' + parts[1]).digest());
    if (sig !== parts[2]) return null; // invalid signature
    const payload = JSON.parse(_b64urlDecode(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch { return null; }
}

/** Auth middleware — accepts both signed JWT and legacy Base64 tokens */
function requireAuth(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.length < 30) {
    sendError(res, 401, 'No autorizado');
    return false;
  }
  const token = auth.slice(7);

  // Try signed JWT first
  const jwt = verifyToken(token);
  if (jwt && jwt.id && jwt.nombre) {
    req._user = jwt;
    return true;
  }

  // Fallback: legacy Base64 — DEPRECATED, will be removed in future version
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const session = JSON.parse(decoded);
    if (!session.id || !session.nombre) {
      sendError(res, 401, 'Sesión inválida');
      return false;
    }
    console.warn(`[AUTH] ⚠️ Legacy Base64 token used by ${session.nombre} (${session.email || 'no-email'}) — should migrate to JWT`);
    req._user = session;
    return true;
  } catch {
    sendError(res, 401, 'Token malformado');
    return false;
  }
}

/** Global error handler — registrar sin exponer detalles al cliente */
function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught exception:', err.message);
    // No exponer stack trace — solo log interno
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[WARN] Unhandled rejection:', String(reason).slice(0, 200));
    // No crashear por promise rejection, solo loguear
  });
}

/** Rate limit por ruta — genera key compuesto IP+ruta */
function rateLimitKey(ip, route) {
  return ip + ':' + route;
}

module.exports = {
  SECURITY_HEADERS,
  BLOCKED_PATTERNS,
  ALLOWED_DIRS,
  isBlockedPath,
  getClientIP,
  isRateLimited,
  startCleanup,
  checkCors,
  readBody,
  sendError,
  extractDateParams,
  validateSbConfig,
  requireAuth,
  signToken,
  verifyToken,
  setupGlobalErrorHandlers,
  rateLimitKey
};
