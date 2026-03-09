// GF — AI Chat: asistente inteligente del dashboard
// Widget flotante con conexión a Claude API vía /api/chat

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let _chatOpen = false;
let _chatMessages = [];
let _chatLoading = false;

// ═══════════════════════════════════════
// INIT — llamado desde main.js post-login
// ═══════════════════════════════════════
function initAIChat() {
  if (!isLoggedIn()) return;
  _chatLoadSession();
  _chatInjectDOM();
}

// ═══════════════════════════════════════
// DOM INJECTION — FAB + Panel + Styles
// ═══════════════════════════════════════
function _chatInjectDOM() {
  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #ai-chat-fab{
      position:fixed;bottom:24px;right:24px;z-index:9000;
      width:52px;height:52px;border-radius:50%;
      background:var(--blue);color:#fff;border:none;
      cursor:pointer;font-size:1.5rem;line-height:1;
      box-shadow:var(--shm);
      transition:transform .18s,background .15s;
      display:flex;align-items:center;justify-content:center;
    }
    #ai-chat-fab:hover{transform:scale(1.08);filter:brightness(1.1)}

    #ai-chat-panel{
      position:fixed;bottom:88px;right:24px;z-index:9001;
      width:380px;max-height:520px;
      background:var(--white);border:1px solid var(--border);
      border-radius:var(--rlg);box-shadow:var(--shm);
      display:none;flex-direction:column;
      opacity:0;transform:translateY(12px);
      transition:opacity .22s,transform .22s;
    }
    #ai-chat-panel.open{opacity:1;transform:translateY(0)}

    #ai-chat-header{
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;
      border-bottom:1px solid var(--border);
      font-size:.85rem;font-weight:700;color:var(--text);
    }
    #ai-chat-header button{
      background:none;border:none;color:var(--muted);cursor:pointer;
      font-size:1.1rem;padding:0 2px;transition:color .12s;
    }
    #ai-chat-header button:hover{color:var(--text)}

    #ai-chat-messages{
      flex:1;overflow-y:auto;padding:12px 14px;
      display:flex;flex-direction:column;gap:10px;
      min-height:200px;max-height:360px;
    }

    #ai-chat-welcome{
      text-align:center;padding:30px 20px;color:var(--muted);font-size:.78rem;line-height:1.6;
    }
    #ai-chat-welcome b{color:var(--text);font-size:.85rem}

    .ai-msg{
      padding:8px 12px;border-radius:10px;font-size:.8rem;
      line-height:1.5;max-width:88%;word-wrap:break-word;
    }
    .ai-msg.user{
      align-self:flex-end;background:var(--blue);color:#fff;
      border-bottom-right-radius:3px;
    }
    .ai-msg.assistant{
      align-self:flex-start;background:var(--bg);color:var(--text);
      border-bottom-left-radius:3px;border:1px solid var(--border);
    }
    .ai-msg.assistant strong{color:var(--blue)}
    .ai-msg.assistant code{
      background:var(--border);padding:1px 4px;border-radius:3px;font-size:.73rem;
    }
    .ai-msg.error{
      align-self:center;background:var(--red);color:#fff;
      border-radius:8px;font-size:.73rem;text-align:center;
    }

    .ai-typing{
      display:flex;gap:5px;padding:8px 14px;align-self:flex-start;
    }
    .ai-typing span{
      width:7px;height:7px;border-radius:50%;background:var(--muted);
      animation:ai-bounce .6s infinite alternate;
    }
    .ai-typing span:nth-child(2){animation-delay:.15s}
    .ai-typing span:nth-child(3){animation-delay:.3s}
    @keyframes ai-bounce{to{transform:translateY(-5px);opacity:.3}}

    #ai-chat-input-area{
      display:flex;gap:8px;padding:10px 14px;
      border-top:1px solid var(--border);
    }
    #ai-chat-input{
      flex:1;padding:8px 12px;border:1px solid var(--border);
      border-radius:var(--r);font-size:.8rem;font-family:'Figtree',sans-serif;
      background:var(--bg);color:var(--text);outline:none;
    }
    #ai-chat-input:focus{border-color:var(--blue)}
    #ai-chat-input::placeholder{color:var(--muted)}

    #ai-chat-send{
      background:var(--blue);color:#fff;border:none;border-radius:var(--r);
      padding:0 14px;cursor:pointer;font-size:1rem;transition:background .12s;
      display:flex;align-items:center;
    }
    #ai-chat-send:hover{filter:brightness(1.1)}
    #ai-chat-send:disabled{opacity:.4;cursor:not-allowed}

    @media(max-width:480px){
      #ai-chat-panel{width:calc(100vw - 20px);right:10px;bottom:80px;max-height:65vh}
      #ai-chat-fab{width:46px;height:46px;bottom:16px;right:16px;font-size:1.3rem}
    }
  `;
  document.head.appendChild(style);

  // FAB
  const fab = document.createElement('button');
  fab.id = 'ai-chat-fab';
  fab.title = 'Asistente AI';
  fab.innerHTML = '🤖';
  fab.onclick = _chatToggle;
  document.body.appendChild(fab);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'ai-chat-panel';
  panel.innerHTML = `
    <div id="ai-chat-header">
      <span>🤖 Asistente AI</span>
      <div style="display:flex;gap:6px;align-items:center">
        <button onclick="_chatClear()" title="Limpiar chat" style="font-size:.75rem">🗑️</button>
        <button onclick="_chatClose()" title="Cerrar">✕</button>
      </div>
    </div>
    <div id="ai-chat-messages"></div>
    <div id="ai-chat-input-area">
      <input id="ai-chat-input" type="text" placeholder="Pregunta sobre tus datos..."
        onkeydown="if(event.key==='Enter')_chatSend();if(event.key==='Escape')_chatClose();" />
      <button id="ai-chat-send" onclick="_chatSend()">➤</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Render initial messages
  _chatRenderMessages();
}

// ═══════════════════════════════════════
// TOGGLE / OPEN / CLOSE
// ═══════════════════════════════════════
function _chatToggle() {
  _chatOpen ? _chatClose() : _chatOpenPanel();
}

function _chatOpenPanel() {
  const panel = document.getElementById('ai-chat-panel');
  if (!panel) return;
  panel.style.display = 'flex';
  setTimeout(() => panel.classList.add('open'), 10);
  _chatOpen = true;
  setTimeout(() => {
    const inp = document.getElementById('ai-chat-input');
    if (inp) inp.focus();
  }, 250);
}

function _chatClose() {
  const panel = document.getElementById('ai-chat-panel');
  if (!panel) return;
  panel.classList.remove('open');
  _chatOpen = false;
  setTimeout(() => { panel.style.display = 'none'; }, 220);
}

// ═══════════════════════════════════════
// RENDER MESSAGES
// ═══════════════════════════════════════
function _chatRenderMessages() {
  const el = document.getElementById('ai-chat-messages');
  if (!el) return;

  if (!_chatMessages.length && !_chatLoading) {
    const user = getCurrentUser();
    const name = user ? user.nombre.split(' ')[0] : '';
    el.innerHTML = `
      <div id="ai-chat-welcome">
        <b>Hola${name ? ' ' + name : ''} 👋</b><br><br>
        Soy el asistente AI del dashboard.<br>
        Pregúntame sobre tickets, pagos,<br>
        créditos, tesorería o cualquier dato<br>
        del sistema.
      </div>`;
    return;
  }

  let html = '';
  _chatMessages.forEach(m => {
    if (m.role === 'user') {
      html += `<div class="ai-msg user">${_chatEsc(m.content)}</div>`;
    } else if (m.role === 'error') {
      html += `<div class="ai-msg error">⚠️ ${_chatEsc(m.content)}</div>`;
    } else {
      html += `<div class="ai-msg assistant">${_chatMd(m.content)}</div>`;
    }
  });

  if (_chatLoading) {
    html += `<div class="ai-typing"><span></span><span></span><span></span></div>`;
  }

  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

// ═══════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════
async function _chatSend() {
  const inp = document.getElementById('ai-chat-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text || _chatLoading) return;

  // Add user message
  _chatMessages.push({ role: 'user', content: text, ts: Date.now() });
  inp.value = '';
  _chatLoading = true;
  _chatRenderMessages();

  // Disable send
  const btn = document.getElementById('ai-chat-send');
  if (btn) btn.disabled = true;

  try {
    // Build context from current data (async — includes Supabase queries)
    const context = await _chatBuildContext();

    // Keep last 10 messages for API (alternating user/assistant)
    const apiMessages = _chatMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, context })
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `Error del servidor (${resp.status})`);
    }

    // Extract text from Anthropic response
    const reply = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : 'No pude generar una respuesta. Intenta reformular tu pregunta.';

    _chatMessages.push({ role: 'assistant', content: reply, ts: Date.now() });

  } catch (e) {
    console.warn('[AI Chat] Error:', e.message);
    _chatMessages.push({
      role: 'error',
      content: e.message || 'Error de conexión. Intenta de nuevo.',
      ts: Date.now()
    });
  }

  _chatLoading = false;
  if (btn) btn.disabled = false;
  _chatRenderMessages();
  _chatSaveSession();

  // Re-focus input
  setTimeout(() => { if (inp) inp.focus(); }, 50);
}

// ═══════════════════════════════════════
// CLEAR CHAT
// ═══════════════════════════════════════
function _chatClear() {
  _chatMessages = [];
  sessionStorage.removeItem('gf_chat_history');
  _chatRenderMessages();
}

// ═══════════════════════════════════════
// CONTEXT BUILDER — resumen de toda la data (localStorage + Supabase)
// ═══════════════════════════════════════
async function _chatBuildContext() {
  const lines = [];
  const now = new Date();
  const user = getCurrentUser();
  lines.push('Fecha: ' + now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  lines.push('Usuario: ' + (user ? user.nombre : '?') + ' (' + (user ? user.rol : '?') + ')');
  lines.push('Año fiscal: ' + _year);

  // ══════════════════════════════════════
  // SUPABASE: Transacciones TPV (datos en vivo)
  // ══════════════════════════════════════
  try {
    if (_sb) {
      // Fechas útiles
      const hoy = now.toISOString().slice(0, 10);
      const ayer = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      const mesActual = hoy.slice(0, 7) + '-01';
      const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mesAnteriorFrom = mesAnteriorDate.toISOString().slice(0, 10);
      const mesAnteriorTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

      // Consultas en paralelo para velocidad
      const [totalCount, ayerData, mesData, mesAntData, topClients, clientCount] = await Promise.all([
        // Total transacciones
        _sb.from('tpv_transactions').select('*', { count: 'exact', head: true }),
        // Transacciones de ayer
        _sb.from('tpv_transactions').select('monto').eq('fecha', ayer),
        // Transacciones del mes actual
        _sb.from('tpv_transactions').select('monto, fecha').gte('fecha', mesActual).lte('fecha', hoy),
        // Transacciones del mes anterior
        _sb.from('tpv_transactions').select('monto').gte('fecha', mesAnteriorFrom).lte('fecha', mesAnteriorTo),
        // Top 10 clientes por volumen (mes actual)
        _sb.from('tpv_transactions').select('cliente, monto').gte('fecha', mesActual).lte('fecha', hoy),
        // Total clientes configurados
        _sb.from('tpv_clients').select('*', { count: 'exact', head: true })
      ]);

      const totalTxns = totalCount.count || 0;
      lines.push('\n═══ TERMINALES PUNTO DE VENTA (TPV) ═══');
      lines.push('Total histórico: ' + totalTxns.toLocaleString() + ' transacciones');
      lines.push('Clientes configurados: ' + (clientCount.count || 0));

      // Ayer
      if (ayerData.data && ayerData.data.length) {
        const ayerTotal = ayerData.data.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
        lines.push('\nAYER (' + ayer + '): ' + ayerData.data.length + ' transacciones, total $' + ayerTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
      } else {
        lines.push('\nAYER (' + ayer + '): 0 transacciones');
      }

      // Hoy
      if (mesData.data) {
        const hoyTxns = mesData.data.filter(r => r.fecha === hoy);
        if (hoyTxns.length) {
          const hoyTotal = hoyTxns.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
          lines.push('HOY (' + hoy + '): ' + hoyTxns.length + ' transacciones, total $' + hoyTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        } else {
          lines.push('HOY (' + hoy + '): 0 transacciones');
        }
      }

      // Mes actual
      if (mesData.data && mesData.data.length) {
        const mesTotal = mesData.data.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
        lines.push('MES ACTUAL (' + hoy.slice(0, 7) + '): ' + mesData.data.length + ' transacciones, total $' + mesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }));

        // Días únicos con actividad
        const diasUnicos = new Set(mesData.data.map(r => r.fecha));
        lines.push('  Días con actividad: ' + diasUnicos.size);
        lines.push('  Promedio diario: $' + (mesTotal / diasUnicos.size).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
      }

      // Mes anterior
      if (mesAntData.data && mesAntData.data.length) {
        const mesAntTotal = mesAntData.data.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
        lines.push('MES ANTERIOR (' + mesAnteriorFrom.slice(0, 7) + '): ' + mesAntData.data.length + ' transacciones, total $' + mesAntTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
      }

      // Top clientes del mes
      if (topClients.data && topClients.data.length) {
        const byClient = {};
        topClients.data.forEach(r => {
          const c = r.cliente || 'Desconocido';
          if (!byClient[c]) byClient[c] = { n: 0, total: 0 };
          byClient[c].n++;
          byClient[c].total += parseFloat(r.monto) || 0;
        });
        const sorted = Object.entries(byClient).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
        lines.push('\nTOP 10 CLIENTES (mes actual):');
        sorted.forEach(([name, d], i) => {
          lines.push('  ' + (i + 1) + '. ' + name + ': ' + d.n + ' txns, $' + d.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        });
      }

      // Agentes / Promotores
      try {
        const { data: agentes } = await _sb.from('tpv_agentes').select('nombre, siglas, pct_comision, activo');
        if (agentes && agentes.length) {
          const activos = agentes.filter(a => a.activo !== false);
          lines.push('\nAGENTES/PROMOTORES: ' + agentes.length + ' total (' + activos.length + ' activos)');
          activos.forEach(a => {
            lines.push('  ' + a.nombre + ' (' + (a.siglas || '?') + '): ' + ((a.pct_comision || 0) * 100).toFixed(1) + '% comisión');
          });
        }
      } catch (e) {}

      // Terminales
      try {
        const { data: terminales, count: termCount } = await _sb.from('tpv_transactions')
          .select('terminal_id', { count: 'exact', head: false })
          .not('terminal_id', 'is', null)
          .gte('fecha', mesActual);
        if (terminales) {
          const uniqueTerminals = new Set(terminales.map(t => t.terminal_id));
          lines.push('\nTERMINALES ACTIVAS (mes actual): ' + uniqueTerminals.size);
        }
      } catch (e) {}
    }
  } catch (e) {
    lines.push('\nTRANSACCIONES TPV: error al consultar Supabase (' + e.message + ')');
  }

  // ══════════════════════════════════════
  // LOCALSTORAGE: Tickets, P&L, Créditos, etc.
  // ══════════════════════════════════════

  // ── Tickets (detallado) ──
  try {
    const tickets = DB.get('gf_tickets_pagos_tpv') || [];
    if (tickets.length) {
      lines.push('\n═══ TICKETS ═══');
      const byStatus = {};
      let montoTotalFijo = 0, montoTotalPct = 0;
      tickets.forEach(t => {
        const st = t.estado || 'sin_estado';
        byStatus[st] = (byStatus[st] || 0) + 1;
        if (Array.isArray(t.pagos)) {
          t.pagos.forEach(p => {
            if (p.monto_tipo === 'porcentaje') montoTotalPct += (Number(p.monto) || 0);
            else montoTotalFijo += (Number(p.monto) || 0);
          });
        } else if (t.monto) {
          montoTotalFijo += Number(t.monto) || 0;
        }
      });
      const statusStr = Object.entries(byStatus).map(([k, v]) => v + ' ' + k).join(', ');
      lines.push('Total: ' + tickets.length + ' tickets (' + statusStr + ')');
      lines.push('Monto total en tickets: $' + montoTotalFijo.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + (montoTotalPct ? ' + porcentajes aplicados' : ''));

      // Abiertos y pendientes primero
      const abiertos = tickets.filter(t => t.estado === 'abierto' || t.estado === 'pendiente' || t.estado === 'aprobado');
      if (abiertos.length) {
        lines.push('Tickets activos (' + abiertos.length + '):');
        abiertos.forEach(t => {
          let montoStr = '';
          if (Array.isArray(t.pagos) && t.pagos.length) {
            const parts = [];
            t.pagos.forEach(p => {
              if (p.monto_tipo === 'porcentaje') parts.push(p.monto + '% ' + (p.concepto || ''));
              else parts.push('$' + Number(p.monto).toLocaleString('es-MX') + ' ' + (p.concepto || ''));
            });
            montoStr = parts.join(' + ');
          } else if (t.monto) {
            montoStr = '$' + Number(t.monto).toLocaleString('es-MX');
          }
          lines.push('  #' + (t.id || '?') + ' | ' + (t.estado || '?') + ' | ' + (t.asunto || t.cliente || '?') + ' | ' + montoStr + (t.fecha ? ' | ' + t.fecha : ''));
        });
      }

      // Últimos 5 más recientes
      const recent = tickets.slice(-5);
      lines.push('Últimos 5 creados:');
      recent.forEach(t => {
        let montoStr = '';
        if (Array.isArray(t.pagos) && t.pagos.length) {
          let fijo = 0, pcts = 0;
          t.pagos.forEach(p => {
            if (p.monto_tipo === 'porcentaje') pcts += (Number(p.monto) || 0);
            else fijo += (Number(p.monto) || 0);
          });
          montoStr = fijo ? '$' + fijo.toLocaleString('es-MX') : '';
          if (pcts) montoStr += (montoStr ? ' + ' : '') + pcts + '%';
        } else if (t.monto) {
          montoStr = '$' + Number(t.monto).toLocaleString('es-MX');
        }
        lines.push('  #' + (t.id || '?') + ' | ' + (t.asunto || t.cliente || '?') + ' | ' + (t.estado || '?') + ' | ' + montoStr + (t.fecha ? ' | ' + t.fecha : ''));
      });
    } else {
      lines.push('\nTICKETS: 0');
    }
  } catch (e) {}

  // ── P&L Records (con desglose mensual) ──
  try {
    const recs = DB.get('gf4') || [];
    if (recs.length) {
      lines.push('\n═══ ESTADO DE RESULTADOS (P&L) ═══');
      lines.push('Total: ' + recs.length + ' transacciones registradas');

      // Por entidad
      const ents = {};
      let grandIng = 0, grandGas = 0;
      recs.forEach(r => {
        const ent = r.ent || r.empresa || 'otro';
        if (!ents[ent]) ents[ent] = { ing: 0, gas: 0, n: 0, byMonth: {} };
        ents[ent].n++;
        const m = Number(r.monto) || 0;
        if (r.tipo === 'ingreso') { ents[ent].ing += m; grandIng += m; }
        else { ents[ent].gas += m; grandGas += m; }

        // Desglose mensual
        const mes = r.mes || r.month || r.fecha?.slice(0, 7) || '?';
        if (!ents[ent].byMonth[mes]) ents[ent].byMonth[mes] = { ing: 0, gas: 0 };
        if (r.tipo === 'ingreso') ents[ent].byMonth[mes].ing += m;
        else ents[ent].byMonth[mes].gas += m;
      });

      lines.push('CONSOLIDADO: ingresos $' + grandIng.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ', gastos $' + grandGas.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ', utilidad $' + (grandIng - grandGas).toLocaleString('es-MX', { minimumFractionDigits: 2 }));

      Object.entries(ents).forEach(([ent, d]) => {
        const utilidad = d.ing - d.gas;
        const margen = d.ing ? ((utilidad / d.ing) * 100).toFixed(1) : '0';
        lines.push('  ' + ent + ': ' + d.n + ' ops | ingresos $' + d.ing.toLocaleString('es-MX') + ' | gastos $' + d.gas.toLocaleString('es-MX') + ' | utilidad $' + utilidad.toLocaleString('es-MX') + ' (' + margen + '% margen)');

        // Top meses con más actividad
        const meses = Object.entries(d.byMonth).sort((a, b) => (b[1].ing + b[1].gas) - (a[1].ing + a[1].gas)).slice(0, 3);
        if (meses.length > 1) {
          meses.forEach(([mes, md]) => {
            lines.push('    ' + mes + ': ing $' + md.ing.toLocaleString('es-MX') + ', gas $' + md.gas.toLocaleString('es-MX') + ', util $' + (md.ing - md.gas).toLocaleString('es-MX'));
          });
        }
      });
    }
  } catch (e) {}

  // ── Flujos (con desglose mensual) ──
  try {
    const fi = DB.get('gf_fi') || {};
    const fg = DB.get('gf_fg') || {};
    const fiEnts = Object.keys(fi).length;
    const fgEnts = Object.keys(fg).length;
    if (fiEnts || fgEnts) {
      lines.push('\n═══ FLUJOS DE EFECTIVO ═══');
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      let grandIng = 0, grandGas = 0;

      Object.entries(fi).forEach(([ent, data]) => {
        if (Array.isArray(data)) {
          const total = data.reduce((s, v) => s + (Number(v) || 0), 0);
          grandIng += total;
          if (total) {
            lines.push('  Ingreso ' + ent + ': $' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' anual');
            // Mostrar meses con actividad
            const mesConDato = data.map((v, i) => ({ mes: meses[i], val: Number(v) || 0 })).filter(m => m.val > 0);
            if (mesConDato.length) {
              lines.push('    ' + mesConDato.map(m => m.mes + ': $' + m.val.toLocaleString('es-MX')).join(' | '));
            }
          }
        }
      });

      Object.entries(fg).forEach(([ent, data]) => {
        if (Array.isArray(data)) {
          const total = data.reduce((s, v) => s + (Number(v) || 0), 0);
          grandGas += total;
          if (total) {
            lines.push('  Gasto ' + ent + ': $' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' anual');
            const mesConDato = data.map((v, i) => ({ mes: meses[i], val: Number(v) || 0 })).filter(m => m.val > 0);
            if (mesConDato.length) {
              lines.push('    ' + mesConDato.map(m => m.mes + ': $' + m.val.toLocaleString('es-MX')).join(' | '));
            }
          }
        }
      });

      lines.push('  TOTAL FLUJOS: ingresos $' + grandIng.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ', gastos $' + grandGas.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ', neto $' + (grandIng - grandGas).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
    }
  } catch (e) {}

  // ── Créditos (con ganancias calculadas) ──
  try {
    const credEnd = DB.get('gf_cred_end') || [];
    const credDyn = DB.get('gf_cred_dyn') || [];
    if (credEnd.length || credDyn.length) {
      lines.push('\n═══ CRÉDITOS ═══');
      const _isActivo = c => c.st === 'Activo' || c.status === 'Activo' || c.estado === 'Activo';

      // Función para analizar un crédito completo
      const _analizarCredito = (c) => {
        const monto = Number(c.monto) || 0;
        const tasa = Number(c.tasa) || 0;
        const plazo = Number(c.plazo) || 0;
        const amort = Array.isArray(c.amort) ? c.amort : [];
        const pagos = Array.isArray(c.pagos) ? c.pagos : [];

        // Totales de la tabla de amortización
        let intTotal = 0, ivaTotal = 0, capitalTotal = 0, pagoTotalEsperado = 0;
        amort.forEach(a => {
          intTotal += Number(a.int) || 0;
          ivaTotal += Number(a.ivaInt) || 0;
          capitalTotal += Number(a.capital) || 0;
          pagoTotalEsperado += Number(a.pago) || 0;
        });

        // Pagos recibidos
        const pagosRecibidos = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
        const periodosTotal = amort.length;
        const periodosPagados = pagos.length;

        // Interés ganado hasta la fecha (de los periodos pagados)
        let intGanado = 0, ivaGanado = 0, capitalRecuperado = 0;
        const periodosPagSet = new Set(pagos.map(p => p.periodo));
        amort.forEach(a => {
          if (periodosPagSet.has(a.periodo)) {
            intGanado += Number(a.int) || 0;
            ivaGanado += Number(a.ivaInt) || 0;
            capitalRecuperado += Number(a.capital) || 0;
          }
        });

        // Saldo por cobrar
        const saldoActual = amort.length ? (Number(amort[amort.length - 1].saldo) || 0) : monto;
        const saldoPorCobrar = pagoTotalEsperado - pagosRecibidos;

        // Próximo pago
        let proximoPago = null;
        const hoyStr = new Date().toISOString().slice(0, 10);
        for (const a of amort) {
          if (!periodosPagSet.has(a.periodo)) {
            proximoPago = a;
            break;
          }
        }

        // Comisión
        const comision = Number(c.com) || 0;

        return {
          monto, tasa, plazo, intTotal, ivaTotal, capitalTotal, pagoTotalEsperado,
          pagosRecibidos, periodosTotal, periodosPagados, intGanado, ivaGanado,
          capitalRecuperado, saldoPorCobrar, comision, proximoPago,
          pagoFijo: Number(c.pagoFijo) || 0,
          tipo: c.tipo || '',
          producto: c.producto || '',
          disbDate: c.disbDate || '',
          vencimiento: c.vencimiento || ''
        };
      };

      // Analizar cada entidad
      [['Endless', credEnd], ['Dynamo', credDyn]].forEach(([nombre, arr]) => {
        if (!arr.length) return;
        const activos = arr.filter(_isActivo);
        const liquidados = arr.filter(c => !_isActivo(c));
        const totalCartera = activos.reduce((s, c) => s + (Number(c.monto) || 0), 0);

        // Totales consolidados de activos
        let totalIntEsperado = 0, totalIntGanado = 0, totalIvaGanado = 0;
        let totalPagosRecibidos = 0, totalPagosEsperados = 0;
        let totalCapRecuperado = 0, totalComisiones = 0;

        lines.push('\n  ' + nombre + ': ' + arr.length + ' créditos (' + activos.length + ' activos, ' + liquidados.length + ' liquidados)');
        lines.push('  Cartera activa: $' + totalCartera.toLocaleString('es-MX', { minimumFractionDigits: 2 }));

        activos.forEach(c => {
          const a = _analizarCredito(c);
          totalIntEsperado += a.intTotal;
          totalIntGanado += a.intGanado;
          totalIvaGanado += a.ivaGanado;
          totalPagosRecibidos += a.pagosRecibidos;
          totalPagosEsperados += a.pagoTotalEsperado;
          totalCapRecuperado += a.capitalRecuperado;
          totalComisiones += a.comision;

          lines.push('    • ' + (c.cl || '?') + ': $' + a.monto.toLocaleString('es-MX') + ', tasa ' + a.tasa + '%, ' + a.tipo + ' ' + a.plazo + (a.vencimiento === 'Meses' ? ' meses' : a.vencimiento === 'Trimestres' ? ' trimestres' : ' periodos'));
          lines.push('      Pago fijo: $' + a.pagoFijo.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' | Desembolso: ' + (a.disbDate || 'N/A'));
          lines.push('      Amortización: interés total $' + a.intTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ', IVA $' + a.ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
          lines.push('      Pagos: ' + a.periodosPagados + '/' + a.periodosTotal + ' periodos, recibidos $' + a.pagosRecibidos.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' de $' + a.pagoTotalEsperado.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
          lines.push('      Ganancia cobrada: interés $' + a.intGanado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' + IVA $' + a.ivaGanado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' = $' + (a.intGanado + a.ivaGanado).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
          lines.push('      Capital recuperado: $' + a.capitalRecuperado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' | Por cobrar: $' + a.saldoPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
          if (a.comision) lines.push('      Comisión apertura: $' + a.comision.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
          if (a.proximoPago) {
            lines.push('      Próximo pago: periodo ' + a.proximoPago.periodo + ', $' + (Number(a.proximoPago.pago) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' (fecha: ' + (a.proximoPago.fecha || 'N/A') + ')');
          }
        });

        // Resumen consolidado de la entidad
        lines.push('  RESUMEN ' + nombre.toUpperCase() + ':');
        lines.push('    Interés total esperado (vida de créditos): $' + totalIntEsperado.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    Interés ganado (cobrado): $' + totalIntGanado.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    IVA de interés cobrado: $' + totalIvaGanado.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    Total cobrado (pagos): $' + totalPagosRecibidos.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    Capital recuperado: $' + totalCapRecuperado.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    Faltante por cobrar: $' + (totalPagosEsperados - totalPagosRecibidos).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        if (totalComisiones) lines.push('    Comisiones apertura: $' + totalComisiones.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        lines.push('    Ganancia total generada: $' + (totalIntGanado + totalIvaGanado + totalComisiones).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' (interés + IVA + comisiones)');

        // También analizar liquidados si hay
        if (liquidados.length) {
          let liqIntGanado = 0, liqIvaGanado = 0, liqPagosRec = 0, liqComisiones = 0;
          liquidados.forEach(c => {
            const a = _analizarCredito(c);
            liqIntGanado += a.intGanado;
            liqIvaGanado += a.ivaGanado;
            liqPagosRec += a.pagosRecibidos;
            liqComisiones += a.comision;
          });
          lines.push('    Liquidados (' + liquidados.length + '): ganancia total $' + (liqIntGanado + liqIvaGanado + liqComisiones).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        }
      });
    }
  } catch (e) {}

  // ── Tesorería (detallada) ──
  try {
    const tes = DB.get('gf_tesoreria') || [];
    if (tes.length) {
      lines.push('\n═══ TESORERÍA ═══');
      let totalIng = 0, totalEgr = 0;
      const byEnt = {};
      const byCat = {};
      tes.forEach(t => {
        const m = Number(t.monto) || 0;
        if (t.tipo === 'ingreso' || m > 0) totalIng += Math.abs(m);
        else totalEgr += Math.abs(m);
        // Por entidad
        const ent = t.ent || t.empresa || t.entidad || 'otro';
        if (!byEnt[ent]) byEnt[ent] = { ing: 0, egr: 0, n: 0 };
        byEnt[ent].n++;
        if (t.tipo === 'ingreso' || m > 0) byEnt[ent].ing += Math.abs(m);
        else byEnt[ent].egr += Math.abs(m);
        // Por categoría
        const cat = t.categoria || t.concepto || t.cat || 'otro';
        if (!byCat[cat]) byCat[cat] = 0;
        byCat[cat] += Math.abs(m);
      });
      lines.push('Total: ' + tes.length + ' movimientos');
      lines.push('Ingresos: $' + totalIng.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' | Egresos: $' + totalEgr.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' | Neto: $' + (totalIng - totalEgr).toLocaleString('es-MX', { minimumFractionDigits: 2 }));

      if (Object.keys(byEnt).length > 1) {
        lines.push('Por entidad:');
        Object.entries(byEnt).forEach(([ent, d]) => {
          lines.push('  ' + ent + ': ' + d.n + ' movs, ing $' + d.ing.toLocaleString('es-MX') + ', egr $' + d.egr.toLocaleString('es-MX'));
        });
      }

      // Top categorías de gasto
      const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (topCat.length > 1) {
        lines.push('Top conceptos:');
        topCat.forEach(([cat, m]) => {
          lines.push('  ' + cat + ': $' + m.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
        });
      }
    }
  } catch (e) {}

  // ── Bancos (con saldos) ──
  try {
    const bancos = DB.get('gf_bancos') || [];
    if (bancos.length) {
      lines.push('\n═══ BANCOS ═══');
      let totalSaldo = 0;
      bancos.forEach(b => {
        const saldo = Number(b.saldo) || Number(b.balance) || 0;
        totalSaldo += saldo;
        const nombre = b.nombre || b.banco || '?';
        const ent = b.ent || b.entidad || b.empresa || '';
        lines.push('  ' + nombre + (ent ? ' (' + ent + ')' : '') + ': saldo $' + saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + (b.moneda ? ' ' + b.moneda : ' MXN'));
      });
      lines.push('  Saldo total bancos: $' + totalSaldo.toLocaleString('es-MX', { minimumFractionDigits: 2 }));
    }
  } catch (e) {}

  // ── Usuarios (con roles) ──
  try {
    const usuarios = DB.get('gf_usuarios') || [];
    if (usuarios.length) {
      lines.push('\n═══ USUARIOS ═══');
      const activos = usuarios.filter(u => u.activo !== false);
      const byRol = {};
      activos.forEach(u => {
        const rol = u.rol || 'sin_rol';
        byRol[rol] = (byRol[rol] || 0) + 1;
      });
      lines.push('Total: ' + usuarios.length + ' registrados (' + activos.length + ' activos)');
      if (Object.keys(byRol).length) {
        lines.push('Por rol: ' + Object.entries(byRol).map(([r, n]) => n + ' ' + r).join(', '));
      }
      activos.forEach(u => {
        lines.push('  ' + (u.nombre || '?') + ' — ' + (u.rol || '?') + (u.email ? ' (' + u.email + ')' : ''));
      });
    }
  } catch (e) {}

  return lines.join('\n');
}

// ═══════════════════════════════════════
// MARKDOWN RENDERING (básico)
// ═══════════════════════════════════════
function _chatEsc(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _chatMd(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n- /g, '\n• ')
    .replace(/\n\d+\. /g, (m) => '\n' + m.trim() + ' ')
    .replace(/\n/g, '<br>');
}

// ═══════════════════════════════════════
// SESSION PERSISTENCE (sessionStorage)
// ═══════════════════════════════════════
function _chatSaveSession() {
  try {
    sessionStorage.setItem('gf_chat_history', JSON.stringify(_chatMessages.slice(-30)));
  } catch (e) {}
}

function _chatLoadSession() {
  try {
    const raw = sessionStorage.getItem('gf_chat_history');
    _chatMessages = raw ? JSON.parse(raw) : [];
  } catch (e) {
    _chatMessages = [];
  }
}
