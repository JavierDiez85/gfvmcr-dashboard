// GFVMCR — Auth: usuarios, permisos y sesión

// USUARIOS & PERMISOS
// ═══════════════════════════════════════
const MENU_PERMS = {
  finanzas:   { label:'💹 Finanzas', subs:[
    {id:'resumen',label:'Dashboard Grupo'},{id:'centum',label:'Centum Capital'},
    {id:'sal_res',label:'Salem — P&L'},{id:'sal_tpv',label:'Salem — TPV'},{id:'sal_gas',label:'Salem — Gastos'},
    {id:'end_res',label:'Endless — P&L'},{id:'end_cred',label:'Cartera Endless'},
    {id:'dyn_res',label:'Dynamo — P&L'},{id:'dyn_cred',label:'Cartera Dynamo'},
    {id:'wb_res',label:'Wirebit — P&L'},{id:'wb_ing',label:'Wirebit Ingresos'},{id:'wb_nom',label:'Nómina Wirebit'},
    {id:'flujo_ing',label:'Flujo Ingresos'},{id:'flujo_gas',label:'Flujo Gastos'},
    {id:'nomina',label:'Nómina Compartida'},{id:'gastos_comp',label:'Gastos Compartidos'},
  ]},
  terminales: { label:'🖥️ Terminales', subs:[] },
  tarjetas:   { label:'💳 Tarjetas', subs:[
    {id:'tarjeta_wb',label:'Wirebit'},{id:'tarjeta_black',label:'Centum Black'},{id:'tarjeta_blue',label:'Centum Blue'},
  ]},
  creditos:   { label:'🏦 Créditos', subs:[
    {id:'end_cred',label:'Cartera Endless'},{id:'dyn_cred',label:'Cartera Dynamo'},
  ]},
  config:     { label:'⚙️ Configuración', subs:[
    {id:'cfg_usuarios',label:'Usuarios'},
  ]},
};

let USUARIOS = [];
let _uEditId = null;

function uLoad(){
  try{ USUARIOS = JSON.parse(localStorage.getItem('vmcr_usuarios')||'[]'); }catch(e){ USUARIOS=[]; }
}
function uSave(){
  localStorage.setItem('vmcr_usuarios', JSON.stringify(USUARIOS));
}

function rUsuarios(){
  uLoad();
  const el = document.getElementById('u-list');
  const cnt = document.getElementById('u-count');
  if(!el) return;
  cnt.textContent = USUARIOS.length + ' usuario' + (USUARIOS.length!==1?'s':'');

  if(!USUARIOS.length){
    el.innerHTML = `<div style="padding:28px;text-align:center;color:var(--muted);font-style:italic;font-size:.82rem">
      No hay usuarios registrados. Crea el primero con "+ Nuevo Usuario".
    </div>`;
    return;
  }

  const rolColor = {admin:'var(--purple)',editor:'var(--blue)',viewer:'var(--muted)'};
  const rolLabel = {admin:'Admin',editor:'Editor',viewer:'Solo lectura'};

  el.innerHTML = USUARIOS.map(u => {
    const permsCount = Object.keys(u.perms||{}).filter(k=>u.perms[k]===true||u.perms[k]==='menu').length;
    const menuCount  = Object.keys(u.perms||{}).filter(k=>u.perms[k]==='menu').length;
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);transition:background .1s" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <!-- Avatar -->
      <div style="width:36px;height:36px;border-radius:50%;background:${u.activo?'var(--blue-bg)':'var(--border)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;color:${u.activo?'var(--blue)':'var(--muted)'};flex-shrink:0">
        ${u.nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
      </div>
      <!-- Info -->
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.84rem;display:flex;align-items:center;gap:6px">
          ${u.nombre}
          ${!u.activo ? '<span style="font-size:.6rem;background:var(--red-bg);color:var(--red);border:1px solid var(--red-lt);padding:1px 6px;border-radius:10px;font-weight:700">INACTIVO</span>' : ''}
        </div>
        <div style="font-size:.7rem;color:var(--muted)">${u.email}${u.empresa?' · '+u.empresa:''}</div>
      </div>
      <!-- Role -->
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:.65rem;font-weight:700;color:${rolColor[u.rol]||'var(--muted)'};background:var(--bg);border:1px solid var(--border);padding:2px 8px;border-radius:10px">${rolLabel[u.rol]||u.rol}</div>
      </div>
      <!-- Access -->
      <div style="text-align:center;flex-shrink:0;min-width:80px">
        <div style="font-size:.65rem;color:var(--muted)">Accesos</div>
        <div style="font-size:.82rem;font-weight:700;color:var(--blue)">${menuCount} módulos</div>
      </div>
      <!-- Edit -->
      <button onclick="uEditUser('${u.id}')" style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:5px 10px;cursor:pointer;font-size:.72rem;color:var(--text2);flex-shrink:0" onmouseover="this.style.background='var(--blue-bg)';this.style.color='var(--blue)'" onmouseout="this.style.background='var(--bg)';this.style.color='var(--text2)'">
        ✏️ Editar
      </button>
    </div>`;
  }).join('');
}

function uRenderPerms(perms){
  const el = document.getElementById('u-perms');
  if(!el) return;
  el.innerHTML = Object.entries(MENU_PERMS).map(([menuId, menu]) => {
    const menuOn = perms[menuId] === 'menu' || perms[menuId] === true;
    return `<div style="background:var(--bg);border:1px solid ${menuOn?'var(--blue-lt)':'var(--border)'};border-radius:var(--r);overflow:hidden;transition:border-color .15s">
      <!-- Header del módulo -->
      <label style="display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:${menuOn?'var(--blue-bg)':'transparent'};transition:background .15s">
        <input type="checkbox" data-menu="${menuId}" ${menuOn?'checked':''} onchange="uToggleMenu('${menuId}',this)"
          style="width:14px;height:14px;accent-color:var(--blue);flex-shrink:0">
        <span style="font-size:.76rem;font-weight:700;color:${menuOn?'var(--blue)':'var(--text2)'}">${menu.label}</span>
      </label>
      <!-- Submenús -->
      ${menu.subs.length ? `<div id="subperms-${menuId}" style="border-top:1px solid ${menuOn?'var(--blue-lt)':'var(--border)'};padding:6px 8px;display:${menuOn?'block':'none'}">
        ${menu.subs.map(s=>{
          const subOn = perms[s.id] !== false && menuOn;
          return `<label style="display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:pointer;border-radius:5px" onmouseover="this.style.background='rgba(0,115,234,.06)'" onmouseout="this.style.background=''">
            <input type="checkbox" data-sub="${s.id}" data-menu="${menuId}" ${subOn?'checked':''} onchange="uToggleSub('${s.id}','${menuId}',this)"
              style="width:13px;height:13px;accent-color:var(--blue);flex-shrink:0">
            <span style="font-size:.7rem;color:var(--text2)">${s.label}</span>
          </label>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function uToggleMenu(menuId, cb){
  const panel = document.getElementById('subperms-'+menuId);
  const label = cb.parentElement;
  const menuOn = cb.checked;
  // Update visual
  label.style.background = menuOn ? 'var(--blue-bg)' : 'transparent';
  label.querySelector('span').style.color = menuOn ? 'var(--blue)' : 'var(--text2)';
  if(panel){
    panel.style.display = menuOn ? 'block' : 'none';
    panel.style.borderTopColor = menuOn ? 'var(--blue-lt)' : 'var(--border)';
    // Check all subs if menu enabled
    panel.querySelectorAll('input[type=checkbox]').forEach(inp => { inp.checked = menuOn; });
  }
  label.closest('[style]').style.borderColor = menuOn ? 'var(--blue-lt)' : 'var(--border)';
}

function uToggleSub(subId, menuId, cb){
  // If enabling a sub, ensure parent menu is enabled
  if(cb.checked){
    const menuCb = document.querySelector(`input[data-menu="${menuId}"]:not([data-sub])`);
    if(menuCb && !menuCb.checked){
      menuCb.checked = true;
      uToggleMenu(menuId, menuCb);
      cb.checked = true; // restore after parent toggle
    }
  }
}

function uCollectPerms(){
  const perms = {};
  document.querySelectorAll('#u-perms input[data-menu]:not([data-sub])').forEach(cb => {
    if(cb.checked) perms[cb.dataset.menu] = 'menu';
  });
  document.querySelectorAll('#u-perms input[data-sub]').forEach(cb => {
    if(perms[cb.dataset.menu]){
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
  document.getElementById('u-tel').value = u.tel||'';
  document.getElementById('u-empresa').value = u.empresa||'';
  document.getElementById('u-rol').value = u.rol||'viewer';
  document.getElementById('u-activo').checked = u.activo !== false;
  document.getElementById('u-del-btn').style.display = 'inline-flex';
  uRenderPerms(u.perms||{});
  document.getElementById('u-form-wrap').style.display = 'block';
  document.getElementById('u-form-wrap').scrollIntoView({behavior:'smooth'});
}

function uSaveUser(){
  const nombre  = document.getElementById('u-nombre').value.trim();
  const email   = document.getElementById('u-email').value.trim();
  if(!nombre || !email){ toast('⚠️ Nombre y correo son requeridos'); return; }

  uLoad();
  // Preserve existing perms when editing, start empty for new users
  const existingPerms = _uEditId ? (USUARIOS.find(x=>x.id===_uEditId)?.perms||{}) : {};
  const data = {
    id: _uEditId || 'u_'+Date.now(),
    nombre, email,
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


// ═══════════════════════════════════════
// APARIENCIA / TEMA
// ═══════════════════════════════════════
let _theme = localStorage.getItem('vmcr_theme') || 'light';

function applyTheme(t){
  _theme = t;
  document.body.classList.toggle('dark', t === 'dark');
  const tb = document.getElementById('theme-toggle-btn');
  if(tb) tb.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('vmcr_theme', t);
  // Update chart defaults
  const textColor = t === 'dark' ? '#9da0c5' : '#8b8fb5';
  const gridColor = t === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(228,232,244,.7)';
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;
  // Re-render active charts
  setTimeout(()=>{ const v = document.querySelector('.view.active'); if(v) render(v.id.replace('view-','')); }, 50);
}

function setTheme(t){
  applyTheme(t);
  rApariencia(); // refresh the UI cards
}

function rApariencia(){
  const isLight = _theme !== 'dark';
  const lCard = document.getElementById('theme-light');
  const dCard = document.getElementById('theme-dark');
  const lChk  = document.getElementById('check-light');
  const dChk  = document.getElementById('check-dark');
  if(!lCard) return;

  if(isLight){
    lCard.style.borderColor = 'var(--blue)';
    lCard.style.background  = 'var(--blue-bg)';
    lChk.style.background   = 'var(--blue)';
    lChk.style.color        = '#fff';
    dCard.style.borderColor = 'var(--border)';
    dCard.style.background  = '';
    dChk.style.background   = 'var(--border)';
    dChk.style.color        = 'transparent';
  } else {
    dCard.style.borderColor = '#0073ea';
    dCard.style.background  = 'rgba(0,115,234,.1)';
    dChk.style.background   = '#0073ea';
    dChk.style.color        = '#fff';
    lCard.style.borderColor = 'var(--border)';
    lCard.style.background  = '';
    lChk.style.background   = 'var(--border)';
    lChk.style.color        = 'transparent';
  }
}


// ═══════════════════════════════════════
// PERMISOS (vista separada)
// ═══════════════════════════════════════
let _permUserId = null;

function rPermisos(){
  uLoad();
  const sel = document.getElementById('perm-user-sel');
  if(!sel) return;

  // Populate dropdown
  sel.innerHTML = '<option value="">— Selecciona un usuario —</option>' +
    USUARIOS.map(u => `<option value="${u.id}" ${u.id===_permUserId?'selected':''}>${u.nombre}${!u.activo?' (inactivo)':''} — ${u.empresa||'Sin empresa'}</option>`).join('');

  if(_permUserId){
    pLoadUser(_permUserId);
  } else {
    document.getElementById('perm-panel').style.display = 'none';
    document.getElementById('perm-empty').style.display = 'block';
  }
}

function pLoadUser(uid){
  _permUserId = uid;
  const panel = document.getElementById('perm-panel');
  const empty = document.getElementById('perm-empty');
  const info  = document.getElementById('perm-user-info');

  if(!uid){
    panel.style.display = 'none';
    empty.style.display = 'block';
    info.textContent = '';
    return;
  }

  uLoad();
  const u = USUARIOS.find(x=>x.id===uid);
  if(!u){ panel.style.display='none'; return; }

  const rolLabel = {admin:'Administrador',editor:'Editor',viewer:'Solo lectura'};
  info.innerHTML = `<span style="font-weight:600;color:var(--blue)">${u.nombre}</span> · ${rolLabel[u.rol]||u.rol} · ${u.email}`;
  document.getElementById('perm-panel-title').textContent = `🔐 Permisos — ${u.nombre}`;

  uRenderPerms(u.perms||{});
  panel.style.display = 'block';
  empty.style.display = 'none';
}

function pSavePerms(){
  if(!_permUserId){ toast('⚠️ Selecciona un usuario'); return; }
  uLoad();
  const idx = USUARIOS.findIndex(x=>x.id===_permUserId);
  if(idx<0) return;
  USUARIOS[idx].perms = uCollectPerms();
  USUARIOS[idx].updatedAt = new Date().toISOString();
  uSave();
  toast(`✅ Permisos guardados — ${USUARIOS[idx].nombre}`);
}

function pCancelPerms(){
  _permUserId = null;
  document.getElementById('perm-user-sel').value = '';
  document.getElementById('perm-panel').style.display = 'none';
  document.getElementById('perm-empty').style.display = 'block';
  document.getElementById('perm-user-info').textContent = '';
}

function pSelectAll(on){
  document.querySelectorAll('#u-perms input[type=checkbox]').forEach(cb => {
    if(cb.checked !== on){
      cb.checked = on;
      if(cb.dataset.menu && !cb.dataset.sub) uToggleMenu(cb.dataset.menu, cb);
    }
  });
}


// ═══════════════════════════════════════
