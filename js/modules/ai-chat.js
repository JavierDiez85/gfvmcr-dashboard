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
    // Build context from current data
    const context = _chatBuildContext();

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
  sessionStorage.removeItem('vmcr_chat_history');
  _chatRenderMessages();
}

// ═══════════════════════════════════════
// CONTEXT BUILDER — resumen de toda la data
// ═══════════════════════════════════════
function _chatBuildContext() {
  const lines = [];
  const now = new Date();
  const user = getCurrentUser();
  lines.push('Fecha: ' + now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  lines.push('Usuario: ' + (user ? user.nombre : '?') + ' (' + (user ? user.rol : '?') + ')');
  lines.push('Año fiscal: ' + _year);

  // ── Tickets ──
  try {
    const tickets = DB.get('vmcr_tickets_pagos_tpv') || [];
    if (tickets.length) {
      const byStatus = {};
      tickets.forEach(t => {
        const st = t.estado || 'sin_estado';
        byStatus[st] = (byStatus[st] || 0) + 1;
      });
      const statusStr = Object.entries(byStatus).map(([k, v]) => v + ' ' + k).join(', ');
      lines.push('\nTICKETS (' + tickets.length + ' total): ' + statusStr);
      // Last 5
      const recent = tickets.slice(-5);
      lines.push('Últimos 5:');
      recent.forEach(t => {
        const pagosCount = Array.isArray(t.pagos) ? t.pagos.length : 0;
        let montoStr = '';
        if (pagosCount) {
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
        lines.push('  #' + (t.id || '?') + ' | ' + (t.asunto || t.cliente || '?') + ' | ' + (t.estado || '?') + ' | ' + montoStr + ' | ' + (t.prioridad || '') + ' | ' + pagosCount + ' pagos');
      });
    } else {
      lines.push('\nTICKETS: 0');
    }
  } catch (e) { lines.push('\nTICKETS: error al leer'); }

  // ── Pagos TPV ──
  try {
    const pagos = DB.get('vmcr_tpv_pagos') || [];
    if (pagos.length) {
      let total = 0;
      pagos.forEach(p => total += (Number(p.monto) || 0));
      lines.push('\nPAGOS TPV: ' + pagos.length + ' registros, total $' + total.toLocaleString('es-MX'));
    } else {
      lines.push('\nPAGOS TPV: 0');
    }
  } catch (e) { lines.push('\nPAGOS TPV: error al leer'); }

  // ── P&L Records ──
  try {
    const recs = DB.get('vmcr4') || [];
    if (recs.length) {
      lines.push('\nREGISTROS P&L: ' + recs.length + ' transacciones');
      const ents = {};
      recs.forEach(r => {
        const ent = r.ent || r.empresa || 'otro';
        if (!ents[ent]) ents[ent] = { ing: 0, gas: 0, n: 0 };
        ents[ent].n++;
        if (r.tipo === 'ingreso') ents[ent].ing += (Number(r.monto) || 0);
        else ents[ent].gas += (Number(r.monto) || 0);
      });
      Object.entries(ents).forEach(([ent, d]) => {
        lines.push('  ' + ent + ': ' + d.n + ' ops, ingresos $' + d.ing.toLocaleString('es-MX') + ', gastos $' + d.gas.toLocaleString('es-MX'));
      });
    }
  } catch (e) {}

  // ── Flujos ──
  try {
    const fi = DB.get('vmcr_fi') || {};
    const fg = DB.get('vmcr_fg') || {};
    const fiEnts = Object.keys(fi).length;
    const fgEnts = Object.keys(fg).length;
    if (fiEnts || fgEnts) {
      lines.push('\nFLUJOS: ingresos en ' + fiEnts + ' entidades, gastos en ' + fgEnts + ' entidades');
      // Summarize totals per entity
      Object.entries(fi).forEach(([ent, data]) => {
        if (Array.isArray(data)) {
          const total = data.reduce((s, v) => s + (Number(v) || 0), 0);
          if (total) lines.push('  Ingreso ' + ent + ': $' + total.toLocaleString('es-MX') + ' anual');
        }
      });
      Object.entries(fg).forEach(([ent, data]) => {
        if (Array.isArray(data)) {
          const total = data.reduce((s, v) => s + (Number(v) || 0), 0);
          if (total) lines.push('  Gasto ' + ent + ': $' + total.toLocaleString('es-MX') + ' anual');
        }
      });
    }
  } catch (e) {}

  // ── Créditos ──
  try {
    const credEnd = DB.get('vmcr_cred_end') || [];
    const credDyn = DB.get('vmcr_cred_dyn') || [];
    if (credEnd.length || credDyn.length) {
      lines.push('\nCRÉDITOS:');
      if (credEnd.length) {
        const endAct = credEnd.filter(c => c.status === 'Activo' || c.estado === 'Activo').length;
        lines.push('  Endless: ' + credEnd.length + ' créditos (' + endAct + ' activos)');
      }
      if (credDyn.length) {
        const dynAct = credDyn.filter(c => c.status === 'Activo' || c.estado === 'Activo').length;
        lines.push('  Dynamo: ' + credDyn.length + ' créditos (' + dynAct + ' activos)');
      }
    }
  } catch (e) {}

  // ── Tesorería ──
  try {
    const tes = DB.get('vmcr_tesoreria') || [];
    if (tes.length) {
      let totalIng = 0, totalEgr = 0;
      tes.forEach(t => {
        const m = Number(t.monto) || 0;
        if (t.tipo === 'ingreso' || m > 0) totalIng += Math.abs(m);
        else totalEgr += Math.abs(m);
      });
      lines.push('\nTESORERÍA: ' + tes.length + ' movimientos, ingresos $' + totalIng.toLocaleString('es-MX') + ', egresos $' + totalEgr.toLocaleString('es-MX'));
    }
  } catch (e) {}

  // ── Bancos ──
  try {
    const bancos = DB.get('vmcr_bancos') || [];
    if (bancos.length) {
      lines.push('\nBANCOS: ' + bancos.length + ' cuentas (' + bancos.map(b => b.nombre || b.banco || '?').join(', ') + ')');
    }
  } catch (e) {}

  // ── Usuarios ──
  try {
    const usuarios = DB.get('vmcr_usuarios') || [];
    if (usuarios.length) {
      const activos = usuarios.filter(u => u.activo !== false).length;
      lines.push('\nUSUARIOS: ' + usuarios.length + ' registrados (' + activos + ' activos)');
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
    sessionStorage.setItem('vmcr_chat_history', JSON.stringify(_chatMessages.slice(-30)));
  } catch (e) {}
}

function _chatLoadSession() {
  try {
    const raw = sessionStorage.getItem('vmcr_chat_history');
    _chatMessages = raw ? JSON.parse(raw) : [];
  } catch (e) {
    _chatMessages = [];
  }
}
