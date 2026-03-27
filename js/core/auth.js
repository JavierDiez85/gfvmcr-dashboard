// GF — Auth: usuarios, permisos y sesión

// USUARIOS & PERMISOS
// ═══════════════════════════════════════
// Auto-generated from NAV_STRUCTURE (nav-structure.js)
const MENU_PERMS = navGenerateMenuPerms();

let USUARIOS = [];
let _uEditId = null;

function uLoad(){
  try{ USUARIOS = DB.get('gf_usuarios') || []; }catch(e){ USUARIOS=[]; }
}
function uSave(){
  DB.set('gf_usuarios', USUARIOS);
}

function rUsuarios(){
  uLoad();
  const el = document.getElementById('u-list');
  const cnt = document.getElementById('u-count');
  if(!el) return;
  cnt.textContent = USUARIOS.length + ' usuario' + (USUARIOS.length!==1?'s':'');

  if(!USUARIOS.length){
    el.innerHTML = `<div class="gf-empty-lg" style="font-style:italic">
      No hay usuarios registrados. Crea el primero con "+ Nuevo Usuario".
    </div>`;
    return;
  }

  const rolColor = {admin:'var(--purple)',editor:'var(--blue)',viewer:'var(--muted)'};
  const rolLabel = {admin:'Admin',editor:'Editor',viewer:'Solo lectura'};

  el.innerHTML = USUARIOS.map(u => {
    const menuCount = Object.keys(u.perms||{}).filter(k=>u.perms[k]==='menu').length;
    const initials  = escapeHtml(u.nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase());
    const rc        = rolColor[u.rol] || 'var(--muted)';
    return `<div class="u-row">
      <div class="u-avatar ${u.activo ? 'active' : 'inactive'}">${initials}</div>
      <div class="u-info">
        <div class="u-name">
          ${escapeHtml(u.nombre)}
          ${!u.activo ? '<span class="u-badge-inactivo">INACTIVO</span>' : ''}
        </div>
        <div class="u-email">${escapeHtml(u.email)}${u.empresa?' · '+escapeHtml(u.empresa):''}</div>
      </div>
      <div class="u-role">
        <div class="u-role-badge" style="color:${rc}">${rolLabel[u.rol]||u.rol}</div>
      </div>
      <div class="u-access">
        <div class="u-access-lbl">Accesos</div>
        <div class="u-access-val">${menuCount} módulos</div>
      </div>
      <button class="u-edit-btn" data-click="uEditUser" data-arg="${u.id}">✏️ Editar</button>
    </div>`;
  }).join('');
}

function uRenderPerms(perms){
  const el = document.getElementById('u-perms');
  if(!el) return;
  el.innerHTML = Object.entries(MENU_PERMS).map(([menuId, menu]) => {
    const menuOn = perms[menuId] === 'menu' || perms[menuId] === true;
    return `<div class="u-perm-block ${menuOn?'on':'off'}">
      <label class="u-perm-hdr ${menuOn?'on':'off'}">
        <input type="checkbox" class="u-perm-hdr-chk" data-menu="${menuId}" ${menuOn?'checked':''}>
        <span class="u-perm-hdr-lbl ${menuOn?'on':'off'}">${menu.label}</span>
      </label>
      ${menu.subs.length ? `<div id="subperms-${menuId}" class="u-perm-subs ${menuOn?'on':'off'}" ${menuOn?'':'style="display:none"'}>
        ${menu.subs.map(s=>{
          const subOn = perms[s.id] !== false && menuOn;
          return `<label class="u-perm-sub-label">
            <input type="checkbox" class="u-perm-sub-chk" data-sub="${s.id}" data-menu="${menuId}" ${subOn?'checked':''}>
            <span class="u-perm-sub-txt">${s.label}</span>
          </label>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function uToggleMenu(cb){
  const menuId = cb.dataset.menu;
  const panel  = document.getElementById('subperms-'+menuId);
  const label  = cb.closest('.u-perm-hdr');
  const block  = cb.closest('.u-perm-block');
  const span   = label && label.querySelector('.u-perm-hdr-lbl');
  const menuOn = cb.checked;
  // Update visual classes
  if(label){ label.className = 'u-perm-hdr ' + (menuOn?'on':'off'); }
  if(span){  span.className  = 'u-perm-hdr-lbl ' + (menuOn?'on':'off'); }
  if(block){ block.className = 'u-perm-block ' + (menuOn?'on':'off'); }
  if(panel){
    panel.style.display = menuOn ? 'block' : 'none';
    panel.className = 'u-perm-subs ' + (menuOn?'on':'off');
    panel.querySelectorAll('input[type=checkbox]').forEach(inp => { inp.checked = menuOn; });
  }
}

function uToggleSub(cb){
  const menuId = cb.dataset.menu;
  if(cb.checked){
    const menuCb = document.querySelector(`input[data-menu="${menuId}"]:not([data-sub])`);
    if(menuCb && !menuCb.checked){
      menuCb.checked = true;
      uToggleMenu(menuCb);
      cb.checked = true;
    }
  }
}

// Delegación de eventos para el panel de usuarios/permisos (reemplaza inline handlers)
(function(){
  document.addEventListener('change', function(e){
    const t = e.target;
    // Checkbox de módulo en permisos
    if(t.matches('#u-perms input[data-menu]:not([data-sub])')) { uToggleMenu(t); return; }
    // Checkbox de submódulo en permisos
    if(t.matches('#u-perms input[data-sub]')) { uToggleSub(t); return; }
  });
})();

function uCollectPerms(){
  const perms = {};
  document.querySelectorAll('#u-perms input[data-menu]:not([data-sub])').forEach(cb => {
    perms[cb.dataset.menu] = cb.checked ? 'menu' : false;
  });
  document.querySelectorAll('#u-perms input[data-sub]').forEach(cb => {
    if(perms[cb.dataset.menu]==='menu'){
      perms[cb.dataset.sub] = cb.checked;
    }
  });
  return perms;
}

function uNewUser(){
  _uEditId = null;
  document.getElementById('u-form-title').textContent = '+ Nuevo Usuario';
  document.getElementById('u-nombre').value = '';
  document.getElementById('u-email').value = '';
  document.getElementById('u-password').value = '';
  document.getElementById('u-tel').value = '';
  document.getElementById('u-empresa').value = '';
  document.getElementById('u-rol').value = 'viewer';
  document.getElementById('u-activo').checked = true;
  document.getElementById('u-del-btn').style.display = 'none';
  // Default perms: empty
  uRenderPerms({});
  document.getElementById('u-form-wrap').style.display = 'block';
  document.getElementById('u-form-wrap').scrollIntoView({behavior:'smooth'});
}

function uEditUser(id){
  uLoad();
  const u = USUARIOS.find(x=>x.id===id);
  if(!u) return;
  _uEditId = id;
  document.getElementById('u-form-title').textContent = '✏️ Editar — ' + u.nombre;
  document.getElementById('u-nombre').value = u.nombre;
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-password').value = '';
  document.getElementById('u-tel').value = u.tel||'';
  document.getElementById('u-empresa').value = u.empresa||'';
  document.getElementById('u-rol').value = u.rol||'viewer';
  document.getElementById('u-activo').checked = u.activo !== false;
  document.getElementById('u-del-btn').style.display = 'inline-flex';
  uRenderPerms(u.perms||{});
  document.getElementById('u-form-wrap').style.display = 'block';
  document.getElementById('u-form-wrap').scrollIntoView({behavior:'smooth'});
}

async function uSaveUser(){
  const nombre  = document.getElementById('u-nombre').value.trim();
  const email   = document.getElementById('u-email').value.trim();
  const pwd     = document.getElementById('u-password').value;
  if(!nombre || !email){ toast('⚠️ Nombre y correo son requeridos'); return; }

  // Contraseña obligatoria para usuarios nuevos
  if(!_uEditId && (!pwd || pwd.length<6)){ toast('⚠️ La contraseña debe tener al menos 6 caracteres'); return; }

  uLoad();
  // Preserve existing perms when editing, start empty for new users
  const existingPerms = _uEditId ? (USUARIOS.find(x=>x.id===_uEditId)?.perms||{}) : {};
  const existingUser  = _uEditId ? USUARIOS.find(x=>x.id===_uEditId) : null;
  const existingHash  = existingUser?.passwordHash || '';
  const existingSalt  = existingUser?.salt || '';

  // Si hay password nuevo, hashear con PBKDF2 + salt
  let newHash = existingHash;
  let newSalt = existingSalt;
  if (pwd) {
    newSalt = generateSalt();
    newHash = await hashPasswordPBKDF2(pwd, newSalt);
  }

  const data = {
    id: _uEditId || 'u_'+Date.now(),
    nombre, email,
    passwordHash: newHash,
    salt: newSalt,
    tel:     document.getElementById('u-tel').value.trim(),
    empresa: document.getElementById('u-empresa').value,
    rol:     document.getElementById('u-rol').value,
    activo:  document.getElementById('u-activo').checked,
    perms:   existingPerms,
    updatedAt: new Date().toISOString(),
  };

  if(_uEditId){
    const idx = USUARIOS.findIndex(x=>x.id===_uEditId);
    if(idx>=0) USUARIOS[idx] = data;
  } else {
    data.createdAt = data.updatedAt;
    USUARIOS.push(data);
  }

  uSave();
  uCancelForm();
  rUsuarios();
  toast(`✅ Usuario ${_uEditId?'actualizado':'creado'}: ${nombre}`);
}

function uDeleteUser(){
  if(!_uEditId) return;
  uLoad();
  const u = USUARIOS.find(x=>x.id===_uEditId);
  customConfirm('¿Eliminar al usuario "' + (u?.nombre||'') + '"?', 'Eliminar', (ok)=>{
    if(!ok) return;
    USUARIOS = USUARIOS.filter(x=>x.id!==_uEditId);
    uSave();
    uCancelForm();
    rUsuarios();
    toast('🗑 Usuario eliminado');
  });
}

function uCancelForm(){
  _uEditId = null;
  document.getElementById('u-form-wrap').style.display = 'none';
}
// Theme + Permisos → moved to js/modules/config.js
