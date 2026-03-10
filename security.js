// ══════════════════════════════════════
// SECURITY MODULE — Grupo Financiero Dashboard
// Centraliza: headers, CORS, rate limiter, path blocking, helpers DRY
// ══════════════════════════════════════

// ── Headers de seguridad (aplicar a TODAS las respuestas) ──
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
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
  /^\/\.DS_Store/i
];

// ── Directorios permitidos para archivos estáticos ──
const ALLOWED_DIRS = ['/index.html', '/js/', '/css/', '/assets/', '/img/', '/favicon'];

/** Verificar si una ruta está bloqueada */
function isBlockedPath(urlPath) {
  return BLOCKED_PATTERNS.some(re => re.test(urlPath));
}

/** Obtener IP real del cliente (sin confiar en x-forwarded-for spoofeable) */
function getClientIP(req) {
  return req.socket.remoteAddress || '0.0.0.0';
}

// ── Rate limiter por IP (sliding window 60s) ──
const _rl = {};

function isRateLimited(ip, max = 20) {
  const now = Date.now(), win = 60000;
  if (!_rl[ip]) _rl[ip] = [];
  _rl[ip] = _rl[ip].filter(t => now - t < win);
  if (_rl[ip].length >= max) return true;
  _rl[ip].push(now);
  return false;
}

/** Iniciar limpieza periódica de IPs inactivas (cada 5 min) */
function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const ip of Object.keys(_rl)) {
      _rl[ip] = _rl[ip].filter(t => now - t < 60000);
      if (_rl[ip].length === 0) delete _rl[ip];
    }
  }, 300000);
}

/** Enviar respuesta JSON de error (DRY helper) */
function sendError(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/** Validar CORS same-origin dinámico. Retorna true si bloqueó (403 enviado). */
function checkCors(req, res, port) {
  const origin = req.headers.origin;
  if (!origin) return false;

  const host = req.headers.host || '';
  const allowedOrigins = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    `https://${host}`,
    `http://${host}`
  ];

  if (!allowedOrigins.includes(origin)) {
    sendError(res, 403, 'Origin not allowed');
    return true;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  validateSbConfig
};
