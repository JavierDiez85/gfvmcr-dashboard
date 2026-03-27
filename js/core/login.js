// GF — Login, sesión y control de acceso
// Cargado ANTES de helpers.js y router.js

let CURRENT_USER = null;

// ── Hashing ──
// Legacy SHA-256 (sin salt) — solo para migración
async function hashPasswordLegacy(plain){
  const data = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// PBKDF2 con salt — 100,000 iteraciones
function generateSalt(){
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function hashPasswordPBKDF2(plain, salt){
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(plain), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: enc.encode(salt),
    iterations: 100000,
    hash: 'SHA-256'
  }, keyMaterial, 256);
  return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Wrapper: usa PBKDF2 si hay salt, legacy si no
async function hashPassword(plain, salt){
  if(salt) return hashPasswordPBKDF2(plain, salt);
  return hashPasswordLegacy(plain);
}

// ── Expiración de sesión (30 min de inactividad) ──
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
let _lastTouchTs = 0;

function _touchSession(){
  const now = Date.now();
  if (now - _lastTouchTs < 30000) return; // throttle: máximo 1 vez cada 30s
  _lastTouchTs = now;
  try {
    const raw = sessionStorage.getItem('gf_session');
    if (!raw) return;
    const s = JSON.parse(raw);
    s.lastActivity = now;
    sessionStorage.setItem('gf_session', JSON.stringify(s));
  } catch(e){}
}

// Registrar actividad del usuario
['click','keydown','scroll','mousemove'].forEach(evt =>
  document.addEventListener(evt, _touchSession, { passive: true })
);

// Watchdog: verificar expiración cada 60s
setInterval(() => {
  try {
    const raw = sessionStorage.getItem('gf_session');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.lastActivity && (Date.now() - s.lastActivity > SESSION_TIMEOUT_MS)) {
      console.log('[session] Sesión expirada por inactividad');
      toast('⏰ Sesión expirada por inactividad');
      setTimeout(() => doLogout(), 1500);
    }
  } catch(e){}
}, 60000);

// ── Session helpers ──
function getCurrentUser(){
  if(CURRENT_USER) return CURRENT_USER;
  try{
    const s=sessionStorage.getItem('gf_session');
    if(s){
      const parsed = JSON.parse(s);
      // Verificar expiración
      if (parsed.lastActivity && (Date.now() - parsed.lastActivity > SESSION_TIMEOUT_MS)) {
        console.log('[session] Sesión expirada en getCurrentUser');
        CURRENT_USER = null;
        sessionStorage.removeItem('gf_session');
        return null;
      }
      CURRENT_USER = parsed;
      return CURRENT_USER;
    }
  }catch(e){}
  return null;
}
function isLoggedIn(){ return getCurrentUser()!==null; }
function isAdmin(){ const u=getCurrentUser(); return u&&u.rol==='admin'; }
function isViewer(){ const u=getCurrentUser(); return u&&u.rol==='viewer'; }

// ── Validación de integridad de sesión ──
async function validateSession(){
  const session = getCurrentUser();
  if (!session) return false;

  // Cargar usuarios reales
  let usuarios = [];
  try {
    if (_sb) {
      const { data } = await _sb.from('app_data').select('value').eq('key','gf_usuarios').single();
      if (data && data.value) usuarios = data.value;
    }
  } catch(e){}
  if (!usuarios.length) {
    try { usuarios = JSON.parse(localStorage.getItem('gf_usuarios')) || []; } catch(e){}
  }
  if (!usuarios.length) return true; // Sin datos no podemos validar

  const real = usuarios.find(u => u.id === session.id && u.email === session.email);

  // Si el usuario no existe o fue desactivado → cerrar sesión
  if (!real || real.activo === false) {
    console.warn('[session] Usuario no encontrado o inactivo, cerrando sesión');
    toast('⚠️ Tu cuenta fue desactivada');
    setTimeout(() => doLogout(), 1500);
    return false;
  }

  // Si el rol o perms cambiaron → actualizar sesión local
  let changed = false;
  if (real.rol !== session.rol) { session.rol = real.rol; changed = true; }
  if (JSON.stringify(real.perms || {}) !== JSON.stringify(session.perms || {})) {
    session.perms = real.perms || {}; changed = true;
  }
  if (real.nombre !== session.nombre) { session.nombre = real.nombre; changed = true; }

  if (changed) {
    console.log('[session] Sesión actualizada con datos reales del usuario');
    CURRENT_USER = session;
    sessionStorage.setItem('gf_session', JSON.stringify(session));
    applyRoleRestrictions();
    applyMenuPermissions();
  }
  return true;
}

// ── Rate-limit de login ──
const _loginAttempts = {}; // { email: [timestamp, timestamp, ...] }
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

function _checkRateLimit(email) {
  const now = Date.now();
  if (!_loginAttempts[email]) _loginAttempts[email] = [];
  // Limpiar intentos antiguos
  _loginAttempts[email] = _loginAttempts[email].filter(ts => now - ts < LOGIN_WINDOW_MS);
  return _loginAttempts[email].length < MAX_LOGIN_ATTEMPTS;
}
function _recordAttempt(email) {
  if (!_loginAttempts[email]) _loginAttempts[email] = [];
  _loginAttempts[email].push(Date.now());
}
function _clearAttempts(email) {
  delete _loginAttempts[email];
}

// ── Login ──
async function doLogin(){
  const email=(document.getElementById('login-email').value||'').trim().toLowerCase();
  const password=document.getElementById('login-password').value||'';
  const errEl=document.getElementById('login-error');

  if(!email||!password){
    errEl.textContent='Ingresa correo y contraseña'; errEl.style.display='block'; return;
  }

  // Rate-limit check
  if (!_checkRateLimit(email)) {
    errEl.textContent = 'Demasiados intentos. Espera 5 minutos.';
    errEl.style.display = 'block'; return;
  }

  // ── Server-side login con JWT firmado ──
  // 1. Obtener salt del usuario
  let userSalt = null;
  try {
    const saltResp = await fetch('/api/login/salt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (saltResp.ok) {
      const saltData = await saltResp.json();
      userSalt = saltData.salt;
    }
  } catch(e) { console.warn('[login] No se pudo obtener salt'); }

  // 2. Hashear contraseña client-side
  let passwordHash;
  if (userSalt) {
    passwordHash = await hashPasswordPBKDF2(password, userSalt);
  } else {
    passwordHash = await hashPasswordLegacy(password);
  }

  // 3. Enviar hash al server para validación + JWT
  try {
    const loginResp = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash, salt: userSalt })
    });
    if (loginResp.ok) {
      const loginResult = await loginResp.json();
      _clearAttempts(email);
      const user = loginResult.user;
      CURRENT_USER = { ...user, lastActivity: Date.now() };
      sessionStorage.setItem('gf_session', JSON.stringify(CURRENT_USER));
      // Token is now stored as httpOnly cookie (R4) — no longer in sessionStorage
    } else {
      _recordAttempt(email);
      errEl.textContent = 'Correo o contraseña incorrectos'; errEl.style.display = 'block'; return;
    }
  } catch(e) {
    errEl.textContent = 'Error de conexión con el servidor'; errEl.style.display = 'block'; return;
  }

  // Ocultar login, iniciar app
  document.getElementById('login-overlay').style.display='none';
  try{ await initApp(); }catch(e){ console.error('[login] initApp falló:', e); }
  applyRoleRestrictions();
  applyMenuPermissions();
  if (typeof initAIChat === 'function') initAIChat();
}

// ── Logout ──
function doLogout(){
  CURRENT_USER=null;
  sessionStorage.removeItem('gf_session');
  // Clear httpOnly cookie server-side (R4)
  fetch('/api/logout', { method: 'POST' }).finally(() => location.reload());
}

// ── Aplicar restricciones de rol ──
function applyRoleRestrictions(){
  const user=getCurrentUser();
  if(!user) return;
  document.body.setAttribute('data-role',user.rol);
  const tbUser=document.getElementById('tb-user');
  const rolLabels={admin:'Admin',editor:'Editor',viewer:'Lectura'};
  if(tbUser) tbUser.textContent=user.nombre+' ('+( rolLabels[user.rol]||user.rol)+')';
}

// ── Filtrar menú según permisos ──
function applyMenuPermissions(){
  const user=getCurrentUser();
  if(!user||typeof NAV_STRUCTURE==='undefined') return;

  const perms=user.perms||{};
  const isAdmin=user.rol==='admin';
  const hasCustomPerms=Object.keys(perms).length>0;

  // Admins sin perms custom ven todo
  if(isAdmin&&!hasCustomPerms) return;

  // Ocultar empresas del sidebar si NINGUNA vista es accesible
  NAV_STRUCTURE.companies.forEach(co=>{
    const anyVisible=co.sections.some(sec=>
      sec.groups.some(grp=>
        grp.views.some(v=>_navViewAllowed(v.id,co.id,perms,isAdmin))
      )
    );
    const coEl=document.getElementById('co-'+co.id);
    if(coEl) coEl.style.display=anyVisible?'':'none';
  });

  // Ocultar cross-cutting si no tiene permisos
  NAV_STRUCTURE.crossCutting.forEach(cc=>{
    const anyVisible=cc.views.some(v=>{
      if(isAdmin){ return perms[cc.id]!==false && perms[v.id]!==false; }
      return perms[v.id]===true||perms[cc.id]==='menu'||perms[cc.id]===true;
    });
    const coEl=document.getElementById('co-'+cc.id);
    if(coEl) coEl.style.display=anyVisible?'':'none';
  });
}

// ── Handlers del formulario de login (sin inline handlers en el HTML) ──
(function(){
  const btn = document.getElementById('login-btn');
  const pwd = document.getElementById('login-password');
  if(btn) btn.addEventListener('click', doLogin);
  if(pwd) pwd.addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
})();
