// GF — Login, sesión y control de acceso
// Cargado ANTES de helpers.js y router.js

let CURRENT_USER = null;

// ── Hashing ──
async function hashPassword(plain){
  const data = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ── Session helpers ──
function getCurrentUser(){
  if(CURRENT_USER) return CURRENT_USER;
  try{ const s=sessionStorage.getItem('vmcr_session'); if(s){ CURRENT_USER=JSON.parse(s); return CURRENT_USER; } }catch(e){}
  return null;
}
function isLoggedIn(){ return getCurrentUser()!==null; }
function isAdmin(){ const u=getCurrentUser(); return u&&u.rol==='admin'; }
function isViewer(){ const u=getCurrentUser(); return u&&u.rol==='viewer'; }

// ── Login ──
async function doLogin(){
  const email=(document.getElementById('login-email').value||'').trim().toLowerCase();
  const password=document.getElementById('login-password').value||'';
  const errEl=document.getElementById('login-error');

  if(!email||!password){
    errEl.textContent='Ingresa correo y contraseña'; errEl.style.display='block'; return;
  }

  // Obtener usuarios: primero de Supabase, fallback a localStorage
  let usuarios=[];
  try{
    if(typeof _sb!=='undefined'){
      const {data}=await _sb.from('app_data').select('value').eq('key','vmcr_usuarios').single();
      if(data&&data.value) usuarios=data.value;
    }
  }catch(e){ console.warn('[login] Supabase fetch falló, usando localStorage'); }
  if(!usuarios.length){
    try{ usuarios=JSON.parse(localStorage.getItem('vmcr_usuarios'))||[]; }catch(e2){}
  }

  const hash=await hashPassword(password);
  const user=usuarios.find(u=>
    u.email&&u.email.toLowerCase()===email&&
    u.passwordHash===hash&&
    u.activo!==false
  );

  if(!user){
    errEl.textContent='Correo o contraseña incorrectos'; errEl.style.display='block'; return;
  }

  // Guardar sesión (sin passwordHash)
  CURRENT_USER={id:user.id,nombre:user.nombre,email:user.email,rol:user.rol||'viewer',perms:user.perms||{}};
  sessionStorage.setItem('vmcr_session',JSON.stringify(CURRENT_USER));

  // Ocultar login, iniciar app
  document.getElementById('login-overlay').style.display='none';
  try{ await initApp(); }catch(e){ console.error('[login] initApp falló:', e); }
  applyRoleRestrictions();
  applyMenuPermissions();
}

// ── Logout ──
function doLogout(){
  CURRENT_USER=null;
  sessionStorage.removeItem('vmcr_session');
  location.reload();
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
  if(!user) return;

  const perms=user.perms||{};

  // Admins: si no tienen perms específicos, ven todo
  const hasCustomPerms=Object.keys(perms).length>0;
  if(user.rol==='admin'&&!hasCustomPerms) return;

  // Buscar todos los items del sidebar con data-view
  document.querySelectorAll('.si[data-view]').forEach(si=>{
    const viewId=si.getAttribute('data-view')||si.dataset.view;
    // Detectar menú padre real desde el DOM
    const panel=si.closest('.mi-sub');
    const menuId=panel?panel.id.replace('sub-',''):null;

    if(user.rol==='admin'){
      // Admin: ocultar si el menú padre no está habilitado
      if(menuId&&perms[menuId]!=='menu'&&perms[menuId]!==true){ si.style.display='none'; return; }
      // Sub explícitamente deshabilitado
      if(perms[viewId]===false){ si.style.display='none'; return; }
      return; // Admin — módulo habilitado → mostrar
    }
    // No-admin: necesita permiso explícito
    if(perms[viewId]===true) return;
    if(menuId&&(perms[menuId]==='menu'||perms[menuId]===true)) return;
    si.style.display='none';
  });

  // Ocultar menú padre si todos sus subs están ocultos
  if(typeof MENU_PERMS!=='undefined'){
    for(const menuId of Object.keys(MENU_PERMS)){
      const panel=document.getElementById('sub-'+menuId);
      if(!panel) continue;
      const visibleSubs=panel.querySelectorAll('.si:not([style*="display: none"])');
      if(visibleSubs.length===0){
        const mi=document.getElementById('mi-'+menuId);
        if(mi) mi.style.display='none';
        panel.style.display='none';
      }
    }
  }
}
