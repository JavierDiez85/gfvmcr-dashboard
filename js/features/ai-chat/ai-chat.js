// GF — AI Chat
(function(window) {
  'use strict';

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

    // Auth: enviar token de sesión para validación server-side
    const _sess = sessionStorage.getItem('gf_session') || '';
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + btoa(_sess)
      },
      body: JSON.stringify({ messages: apiMessages, context })
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || `Error del servidor (${resp.status})`);
    }

    // Extract text from Anthropic response (find first text block — tool_use blocks may precede it)
    const textBlock = (data.content || []).find(b => b.type === 'text');
    const reply = textBlock
      ? textBlock.text
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
// CONTEXT BUILDER — Minimal context (tools handle data server-side)
// ═══════════════════════════════════════
async function _chatBuildContext() {
  const now = new Date();
  const user = getCurrentUser();
  const hoy = now.toISOString().slice(0, 10);
  const mesActual = hoy.slice(0, 7) + '-01';
  return [
    'Fecha: ' + now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    'Fecha ISO hoy: ' + hoy,
    'Primer día del mes: ' + mesActual,
    'Usuario: ' + (user ? user.nombre : '?') + ' (' + (user ? user.rol : '?') + ')',
    'Año fiscal: ' + (typeof _year !== 'undefined' ? _year : now.getFullYear())
  ].join('\n');
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

  // Expose globals
  window._chatOpen = _chatOpen;
  window._chatMessages = _chatMessages;
  window._chatLoading = _chatLoading;
  window.initAIChat = initAIChat;
  window._chatInjectDOM = _chatInjectDOM;
  window._chatToggle = _chatToggle;
  window._chatOpenPanel = _chatOpenPanel;
  window._chatClose = _chatClose;
  window._chatRenderMessages = _chatRenderMessages;
  window._chatSend = _chatSend;
  window._chatClear = _chatClear;
  window._chatBuildContext = _chatBuildContext;
  window._chatEsc = _chatEsc;
  window._chatMd = _chatMd;
  window._chatSaveSession = _chatSaveSession;
  window._chatLoadSession = _chatLoadSession;

})(window);
