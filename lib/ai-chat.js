// GF — Anthropic API integration + chat handler with tool loop
'use strict';
const https = require('https');
const { TOOLS } = require('./tools');
const { isToolAllowed, _restrictedModules } = require('./permissions');
const { executeTool } = require('./tool-executors');

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
  '  - REGLA ABSOLUTA: Un periodo con fecha FUTURA (después de hoy) NUNCA puede estar vencido. Si ves fechas como 04/2026 y hoy es 03/2026, eso es PENDIENTE, no vencido.',
  '  - cobranza.parciales = periodos donde se pagó una parte pero falta el resto. El faltante SÍ cuenta como monto vencido.',
  '  - saldoActual ya descuenta pagos parciales del capital. Úsalo directamente.',
  '  - pagosDetalle muestra cada pago individual con su periodo, fecha y monto.',
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
  const allowedTools = TOOLS.filter(t => isToolAllowed(t.name, user));
  let currentMessages = [...messages];
  const MAX_ROUNDS = 8;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await callAnthropic(apiKey, {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemContent,
      tools: allowedTools,
      messages: currentMessages
    });

    if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') return response;

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = (response.content || []).filter(b => b.type === 'tool_use');
      const toolResults = await Promise.all(toolUseBlocks.map(async block => {
        const result = await executeTool(block.name, block.input || {}, user);
        return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
      }));
      currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      continue;
    }

    return response;
  }
  throw new Error('Max tool rounds exceeded');
}

module.exports = { handleChat, buildSystemPrompt, TOOLS };
