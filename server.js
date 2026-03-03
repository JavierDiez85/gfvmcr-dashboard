const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

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

// ══════════════════════════════════════
// RATE LIMITER — 20 requests / minuto por IP
// ══════════════════════════════════════
const _rl = {};
function isRateLimited(ip) {
  const now = Date.now(), win = 60000, max = 20;
  if (!_rl[ip]) _rl[ip] = [];
  _rl[ip] = _rl[ip].filter(t => now - t < win);
  if (_rl[ip].length >= max) return true;
  _rl[ip].push(now);
  return false;
}

// ══════════════════════════════════════
// BODY PARSER — leer JSON del request
// ══════════════════════════════════════
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

// ══════════════════════════════════════
// SERVER
// ══════════════════════════════════════
http.createServer(async (req, res) => {

  // ── API: AI Chat proxy ──
  if (req.method === 'POST' && req.url === '/api/chat') {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }));
      return;
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }));
      return;
    }

    try {
      const body = await readBody(req);

      const systemPrompt = [
        'Eres el asistente financiero experto del dashboard de Grupo Financiero VMCR.',
        'Responde SIEMPRE en español. Sé directo, preciso y útil.',
        '',
        'REGLAS DE RESPUESTA:',
        '• Cuando te pregunten cifras, DA EL NÚMERO EXACTO del contexto. Nunca digas "no tengo datos" si la info está en el contexto.',
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
        '• General: totales, promedios, comparativas, proyecciones simples.',
        '',
        'CONTEXTO ACTUAL DEL DASHBOARD:',
        body.context || '(sin contexto disponible)'
      ].join('\n');

      const payload = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: body.messages || []
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const apiReq = https.request(options, apiRes => {
        const chunks = [];
        apiRes.on('data', c => chunks.push(c));
        apiRes.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(raw);
        });
      });

      apiReq.on('error', e => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error al conectar con Anthropic: ' + e.message }));
      });

      apiReq.write(payload);
      apiReq.end();

    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Solicitud inválida: ' + e.message }));
    }
    return;
  }

  // ── Archivos estáticos ──
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  // Prevenir directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
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
