// GF — AI Chat
(function(window) {
  'use strict';

// GF — AI Chat: asistente inteligente del dashboard
// Search bar + panel con conexión a Claude API vía /api/chat

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
// SVG ICONS
// ═══════════════════════════════════════
const _IC_SPARKLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L9.5 8.5 2 12l7.5 3.5L12 22l2.5-6.5L22 12l-7.5-3.5z"/></svg>';
const _IC_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
const _IC_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
const _IC_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

// ═══════════════════════════════════════
// DOM INJECTION — Search Bar + Panel + Styles
// ═══════════════════════════════════════
function _chatInjectDOM() {
  if (document.getElementById('ai-search-wrap')) return; // already injected
  const style = document.createElement('style');
  style.textContent = `
    /* ── Search Bar in Topbar ── */
    #ai-search-wrap{
      display:flex;align-items:center;flex:1;max-width:480px;
      margin:0 16px;position:relative;
    }
    #ai-search-bar{
      width:100%;height:34px;padding:0 14px 0 38px;
      border:1px solid var(--border);border-radius:8px;
      background:#fff;color:var(--text);
      font-size:.82rem;font-family:'Figtree',sans-serif;font-weight:500;
      outline:none;transition:all .2s ease;
    }
    #ai-search-bar::placeholder{color:var(--muted);font-weight:400}
    #ai-search-bar:hover{border-color:rgba(0,115,234,.3)}
    #ai-search-bar:focus{
      border-color:var(--blue);
      box-shadow:0 0 0 3px rgba(0,115,234,.12);
    }
    #ai-search-icon{
      position:absolute;left:10px;top:50%;transform:translateY(-50%);
      width:18px;height:18px;color:var(--muted);
      pointer-events:none;transition:color .2s;
    }
    #ai-search-wrap:focus-within #ai-search-icon{color:var(--blue)}
    #ai-search-kbd{
      position:absolute;right:10px;top:50%;transform:translateY(-50%);
      font-size:.6rem;color:var(--muted);border:1px solid var(--border);
      border-radius:4px;padding:1px 5px;pointer-events:none;font-family:monospace;
      transition:opacity .15s;
    }
    #ai-search-bar:focus ~ #ai-search-kbd{opacity:0}

    /* ── Chat Panel ── */
    #ai-chat-panel{
      position:fixed;top:50px;right:16px;z-index:9001;
      width:420px;max-height:560px;
      background:var(--white);border:1px solid var(--border);
      border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);
      display:none;flex-direction:column;
      opacity:0;transform:translateY(8px) scale(.98);
      transition:opacity .2s ease,transform .2s ease;
    }
    #ai-chat-panel.open{opacity:1;transform:translateY(0) scale(1)}

    #ai-chat-header{
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 16px;
      border-bottom:1px solid var(--border);
      background:linear-gradient(135deg,rgba(0,115,234,.04),rgba(91,95,199,.04));
      border-radius:14px 14px 0 0;
    }
    #ai-chat-header-title{
      display:flex;align-items:center;gap:8px;
      font-size:.85rem;font-weight:700;color:var(--text);
    }
    #ai-chat-header-title svg{width:18px;height:18px;color:var(--blue)}
    #ai-chat-header-actions{display:flex;gap:4px;align-items:center}
    #ai-chat-header-actions button{
      background:none;border:none;color:var(--muted);cursor:pointer;
      padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;
      transition:all .12s;
    }
    #ai-chat-header-actions button:hover{color:var(--text);background:var(--bg)}

    #ai-chat-messages{
      flex:1;overflow-y:auto;padding:14px 16px;
      display:flex;flex-direction:column;gap:10px;
      min-height:200px;max-height:380px;
    }

    #ai-chat-welcome{
      text-align:center;padding:32px 24px;color:var(--muted);font-size:.78rem;line-height:1.7;
    }
    #ai-chat-welcome b{color:var(--text);font-size:.88rem;display:block;margin-bottom:8px}
    #ai-chat-welcome-skills{
      display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:14px;
    }
    #ai-chat-welcome-skills span{
      font-size:.68rem;padding:4px 10px;border-radius:20px;
      background:var(--bg);border:1px solid var(--border);color:var(--text);
      cursor:pointer;transition:all .15s;font-weight:500;
    }
    #ai-chat-welcome-skills span:hover{
      background:var(--blue);color:#fff;border-color:var(--blue);
    }

    .ai-msg{
      padding:10px 14px;border-radius:12px;font-size:.8rem;
      line-height:1.55;max-width:88%;word-wrap:break-word;
    }
    .ai-msg.user{
      align-self:flex-end;background:linear-gradient(135deg,#0073ea,#5b5fc7);color:#fff;
      border-bottom-right-radius:4px;
    }
    .ai-msg.assistant{
      align-self:flex-start;background:var(--bg);color:var(--text);
      border-bottom-left-radius:4px;border:1px solid var(--border);
    }
    .ai-msg.assistant strong{color:var(--blue)}
    .ai-msg.assistant code{
      background:var(--border);padding:1px 5px;border-radius:4px;font-size:.73rem;
    }
    .ai-msg.error{
      align-self:center;background:var(--red);color:#fff;
      border-radius:8px;font-size:.73rem;text-align:center;
    }

    .ai-typing{
      display:flex;gap:5px;padding:10px 16px;align-self:flex-start;
    }
    .ai-typing span{
      width:7px;height:7px;border-radius:50%;background:var(--muted);
      animation:ai-bounce .6s infinite alternate;
    }
    .ai-typing span:nth-child(2){animation-delay:.15s}
    .ai-typing span:nth-child(3){animation-delay:.3s}
    @keyframes ai-bounce{to{transform:translateY(-5px);opacity:.3}}

    #ai-chat-input-area{
      display:flex;gap:8px;padding:12px 14px;
      border-top:1px solid var(--border);
      background:var(--bg);border-radius:0 0 14px 14px;
    }
    #ai-chat-input{
      flex:1;padding:9px 14px;border:1px solid var(--border);
      border-radius:8px;font-size:.8rem;font-family:'Figtree',sans-serif;
      background:var(--white);color:var(--text);outline:none;transition:border-color .15s;
    }
    #ai-chat-input:focus{border-color:var(--blue)}
    #ai-chat-input::placeholder{color:var(--muted)}

    #ai-chat-send{
      background:linear-gradient(135deg,#0073ea,#5b5fc7);color:#fff;border:none;border-radius:8px;
      padding:0 14px;cursor:pointer;transition:all .15s;
      display:flex;align-items:center;justify-content:center;
    }
    #ai-chat-send svg{width:16px;height:16px}
    #ai-chat-send:hover{filter:brightness(1.1);transform:scale(1.03)}
    #ai-chat-send:disabled{opacity:.4;cursor:not-allowed;transform:none}

    @media(max-width:600px){
      #ai-search-wrap{max-width:200px;margin:0 8px}
      #ai-search-kbd{display:none}
      #ai-chat-panel{width:calc(100vw - 20px);right:10px;top:50px;max-height:70vh}
    }
    @media(max-width:420px){
      #ai-search-wrap{max-width:140px}
    }
  `;
  document.head.appendChild(style);

  // ── Search Bar — inject into topbar ──
  const searchWrap = document.createElement('div');
  searchWrap.id = 'ai-search-wrap';
  searchWrap.innerHTML = `
    <div id="ai-search-icon">${_IC_SPARKLE}</div>
    <input id="ai-search-bar" type="text" placeholder="Buscar módulo o preguntar a la IA..." autocomplete="off" />
    <span id="ai-search-kbd">Enter</span>
    <div id="ai-search-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;margin-top:4px;
      background:var(--white);border:1px solid var(--border);border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:300px;overflow-y:auto;z-index:9002;"></div>
  `;

  const tb = document.getElementById('tb');
  const tbR = document.querySelector('.tb-r');
  if (tb && tbR) {
    tb.insertBefore(searchWrap, tbR);
  }

  // ── Build module search index from NAV_STRUCTURE ──
  const _searchIndex = [];
  if (typeof NAV_STRUCTURE !== 'undefined' && NAV_STRUCTURE.companies) {
    NAV_STRUCTURE.companies.forEach(co => {
      (co.sections||[]).forEach(sec => {
        (sec.groups||[]).forEach(g => {
          (g.views||[]).forEach(v => {
            _searchIndex.push({ id: v.id, label: v.label, section: sec.label, company: co.label, co: co.id });
          });
        });
      });
    });
  }

  let _searchSel = -1; // selected index in dropdown

  // Search bar events
  const searchBar = document.getElementById('ai-search-bar');
  const dropdown = document.getElementById('ai-search-dropdown');
  if (searchBar && dropdown) {
    searchBar.addEventListener('input', () => {
      const q = searchBar.value.trim().toLowerCase();
      if (!q || q.length < 2) { dropdown.style.display = 'none'; _searchSel = -1; return; }

      // Filter modules
      const matches = _searchIndex.filter(m =>
        m.label.toLowerCase().includes(q) || m.section.toLowerCase().includes(q) || m.company.toLowerCase().includes(q)
      ).slice(0, 6);

      if (!matches.length) { dropdown.style.display = 'none'; _searchSel = -1; return; }

      _searchSel = -1;
      dropdown.innerHTML = matches.map((m, i) =>
        `<div class="ai-sr" data-idx="${i}" data-view="${m.id}" data-co="${m.co}" style="padding:8px 14px;cursor:pointer;
          display:flex;justify-content:space-between;align-items:center;font-size:.78rem;
          border-bottom:1px solid var(--border);transition:background .1s">
          <span><b style="color:var(--text)">${_chatEsc(m.label)}</b>
            <span style="color:var(--muted);margin-left:6px">${_chatEsc(m.section)}</span></span>
          <span style="font-size:.65rem;color:var(--muted);background:var(--bg);padding:2px 6px;border-radius:4px">${_chatEsc(m.company)}</span>
        </div>`
      ).join('') +
        `<div class="ai-sr-ai" style="padding:8px 14px;cursor:pointer;font-size:.78rem;color:var(--blue);
          display:flex;align-items:center;gap:6px;background:rgba(0,115,234,.03)">
          ${_IC_SPARKLE.replace('width:18px;height:18px', 'width:14px;height:14px')}
          <span>Preguntar a la IA: "<b>${_chatEsc(searchBar.value.trim())}</b>"</span>
        </div>`;
      dropdown.style.display = 'block';

      // Click handlers
      dropdown.querySelectorAll('.ai-sr').forEach(el => {
        el.onmouseenter = () => el.style.background = 'var(--bg)';
        el.onmouseleave = () => el.style.background = '';
        el.onclick = () => {
          const viewId = el.dataset.view;
          searchBar.value = ''; dropdown.style.display = 'none';
          if (typeof selectCompany === 'function') selectCompany(el.dataset.co);
          setTimeout(() => { if (typeof navTo === 'function') navTo(viewId); }, 50);
        };
      });
      const aiOption = dropdown.querySelector('.ai-sr-ai');
      if (aiOption) {
        aiOption.onmouseenter = () => aiOption.style.background = 'rgba(0,115,234,.08)';
        aiOption.onmouseleave = () => aiOption.style.background = 'rgba(0,115,234,.03)';
        aiOption.onclick = () => {
          const q = searchBar.value.trim();
          searchBar.value = ''; dropdown.style.display = 'none';
          _chatOpenPanel();
          setTimeout(() => { const chatInp = document.getElementById('ai-chat-input'); if (chatInp) { chatInp.value = q; _chatSend(); } }, 100);
        };
      }
    });

    searchBar.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.ai-sr, .ai-sr-ai');
      if (e.key === 'ArrowDown' && dropdown.style.display !== 'none') {
        e.preventDefault(); _searchSel = Math.min(_searchSel + 1, items.length - 1);
        items.forEach((el, i) => el.style.background = i === _searchSel ? 'var(--bg)' : '');
      } else if (e.key === 'ArrowUp' && dropdown.style.display !== 'none') {
        e.preventDefault(); _searchSel = Math.max(_searchSel - 1, 0);
        items.forEach((el, i) => el.style.background = i === _searchSel ? 'var(--bg)' : '');
      } else if (e.key === 'Enter') {
        if (_searchSel >= 0 && items[_searchSel]) {
          items[_searchSel].click(); return;
        }
        const q = searchBar.value.trim();
        if (!q) return;
        searchBar.value = ''; dropdown.style.display = 'none';
        _chatOpenPanel();
        setTimeout(() => { const chatInp = document.getElementById('ai-chat-input'); if (chatInp) { chatInp.value = q; _chatSend(); } }, 100);
      } else if (e.key === 'Escape') {
        searchBar.blur(); dropdown.style.display = 'none';
      }
    });

    searchBar.addEventListener('blur', () => { setTimeout(() => { dropdown.style.display = 'none'; }, 200); });
  }

  // Global shortcut: Ctrl+K / Cmd+K to focus search
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const sb = document.getElementById('ai-search-bar');
      if (sb) sb.focus();
    }
  });

  // ── Chat Panel ──
  const panel = document.createElement('div');
  panel.id = 'ai-chat-panel';
  panel.innerHTML = `
    <div id="ai-chat-header">
      <div id="ai-chat-header-title">${_IC_SPARKLE} Asistente IA</div>
      <div id="ai-chat-header-actions">
        <button onclick="_chatClear()" title="Limpiar chat">${_IC_TRASH}</button>
        <button onclick="_chatClose()" title="Cerrar">${_IC_CLOSE}</button>
      </div>
    </div>
    <div id="ai-chat-messages"></div>
    <div id="ai-chat-input-area">
      <input id="ai-chat-input" type="text" placeholder="Escribe tu pregunta..."
        onkeydown="if(event.key==='Enter')_chatSend();if(event.key==='Escape')_chatClose();" />
      <button id="ai-chat-send" onclick="_chatSend()">${_IC_SEND}</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Click outside to close
  document.addEventListener('click', e => {
    if (!_chatOpen) return;
    const panel = document.getElementById('ai-chat-panel');
    const wrap = document.getElementById('ai-search-wrap');
    if (panel && !panel.contains(e.target) && wrap && !wrap.contains(e.target)) {
      _chatClose();
    }
  });

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
        <b>Hola${name ? ' ' + name : ''}</b>
        Soy el asistente inteligente del dashboard.<br>
        Pregunta lo que necesites sobre el grupo financiero.
        <div id="ai-chat-welcome-skills">
          <span onclick="_chatQuickQ('Dame un resumen ejecutivo')">Resumen Ejecutivo</span>
          <span onclick="_chatQuickQ('¿Qué alertas hay?')">Alertas</span>
          <span onclick="_chatQuickQ('¿Cómo está el riesgo de la cartera?')">Riesgo Crediticio</span>
          <span onclick="_chatQuickQ('Compara este mes vs el anterior')">Comparativo</span>
          <span onclick="_chatQuickQ('¿Cómo van las tendencias?')">Tendencias</span>
        </div>
      </div>`;
    return;
  }

  let html = '';
  _chatMessages.forEach(m => {
    if (m.role === 'user') {
      html += `<div class="ai-msg user">${_chatEsc(m.content)}</div>`;
    } else if (m.role === 'error') {
      html += `<div class="ai-msg error">${_chatEsc(m.content)}</div>`;
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

// Quick question from welcome chips
function _chatQuickQ(q) {
  const inp = document.getElementById('ai-chat-input');
  if (inp) { inp.value = q; _chatSend(); }
}

// ═══════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════
async function _chatSend() {
  const inp = document.getElementById('ai-chat-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text || _chatLoading) return;

  _chatMessages.push({ role: 'user', content: text, ts: Date.now() });
  inp.value = '';
  _chatLoading = true;
  _chatRenderMessages();

  const btn = document.getElementById('ai-chat-send');
  if (btn) btn.disabled = true;

  try {
    const context = await _chatBuildContext();
    const apiMessages = _chatMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const _jwt = sessionStorage.getItem('gf_token') || '';
    const _sess = sessionStorage.getItem('gf_session') || '';
    const _token = _jwt || btoa(_sess);
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + _token
      },
      body: JSON.stringify({ messages: apiMessages, context })
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Error del servidor (${resp.status})`);

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
// CONTEXT BUILDER
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
  window._chatQuickQ = _chatQuickQ;

})(window);
