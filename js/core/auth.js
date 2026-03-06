// GF — Auth: usuarios, permisos y sesión

// USUARIOS & PERMISOS
// ═══════════════════════════════════════
const MENU_PERMS = {
  grupo_menu: { label:'🏢 Grupo', subs:[
    {id:'resumen',label:'Dashboard Grupo'},{id:'centum',label:'Centum Capital'},
    {id:'sal_res',label:'Salem — P&L'},{id:'sal_ing',label:'Salem — Ingresos'},{id:'sal_gas',label:'Salem — Costes y Gastos'},{id:'sal_nom',label:'Salem — Nómina'},
    {id:'end_res',label:'Endless — P&L'},{id:'end_ing',label:'Endless — Ingresos'},{id:'end_gas',label:'Endless — Costes y Gastos'},{id:'end_nom',label:'Endless — Nómina'},
    {id:'dyn_res',label:'Dynamo — P&L'},{id:'dyn_ing',label:'Dynamo — Ingresos'},{id:'dyn_gas',label:'Dynamo — Costes y Gastos'},{id:'dyn_nom',label:'Dynamo — Nómina'},
    {id:'wb_res',label:'Wirebit — P&L'},{id:'wb_ing',label:'Wirebit — Ingresos'},{id:'wb_gas',label:'Wirebit — Costes y Gastos'},{id:'wb_nom',label:'Wirebit — Nómina'},
    {id:'tes_flujo',label:'Flujo de Caja'},{id:'tes_individual',label:'Tesorería por Empresa'},{id:'tes_grupo',label:'Consolidado Grupo'},
    {id:'carga_masiva',label:'Carga Masiva'},{id:'flujo_ing',label:'Flujo Ingresos'},{id:'flujo_gas',label:'Flujo Gastos'},
    {id:'nomina',label:'Nómina Compartida'},{id:'gastos_comp',label:'Gastos Compartidos'},
    {id:'carga_creditos',label:'Carga Créditos'},{id:'tpv_upload',label:'Datos TPV'},{id:'tpv_comisiones',label:'Config. Comisiones'},
    {id:'tar_upload',label:'Carga Tarjetas'},{id:'wb_upload',label:'Wirebit Cripto'},{id:'wb_tar_upload',label:'Wirebit Tarjetas'},
  ]},
  salem:      { label:'💙 Salem', subs:[
    {id:'tpv_general',label:'Dashboard General'},{id:'tpv_dashboard',label:'Dashboard Periodo'},
    {id:'tpv_pagos',label:'Control de Pagos'},{id:'tpv_resumen',label:'Resumen por Cliente'},
    {id:'tpv_agentes',label:'Comisiones Agentes'},{id:'tpv_terminales',label:'Gestión de Terminales'},{id:'tpv_promotores',label:'Promotores'},
    {id:'tar_dashboard',label:'Dashboard Tarjetas'},{id:'tar_conceptos',label:'Conceptos'},
    {id:'tar_subclientes',label:'Subclientes'},{id:'tar_rechazos',label:'Rechazos'},{id:'tar_tarjetahabientes',label:'Tarjetahabientes'},
    {id:'tk_pagos_tpv',label:'Tickets Pagos TPV'},
  ]},
  endless:    { label:'💚 Endless', subs:[
    {id:'cred_dash',label:'Dashboard Créditos'},{id:'end_cred',label:'Cartera Endless'},{id:'cred_cobr',label:'Cobranza Endless'},
  ]},
  dynamo:     { label:'🔶 Dynamo', subs:[
    {id:'dyn_cred',label:'Cartera Dynamo'},{id:'dyn_cobr',label:'Cobranza Dynamo'},
  ]},
  wirebit:    { label:'💜 Wirebit', subs:[
    {id:'wb_cripto',label:'Transacciones Cripto'},{id:'wb_tarjetas',label:'Transacciones Tarjetas'},
  ]},
  config:     { label:'⚙️ Configuración', subs:[
    {id:'cfg_usuarios',label:'Usuarios'},{id:'cfg_permisos',label:'Permisos'},
    {id:'cfg_apariencia',label:'Apariencia'},{id:'cfg_categorias',label:'Categorías P&L'},{id:'cfg_bancos',label:'Bancos y Cuentas'},
  ]},
};

let USUARIOS = [];
let _uEditId = null;

function uLoad(){
  try{ USUARIOS = DB.get('vmcr_usuarios') || []; }catch(e){ USUARIOS=[]; }
}
function uSave(){
  DB.set('vmcr_usuarios', USUARIOS);
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
        ${escapeHtml(u.nombre.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase())}
      </div>
      <!-- Info -->
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.84rem;display:flex;align-items:center;gap:6px">
          ${escapeHtml(u.nombre)}
          ${!u.activo ? '<span style="font-size:.6rem;background:var(--red-bg);color:var(--red);border:1px solid var(--red-lt);padding:1px 6px;border-radius:10px;font-weight:700">INACTIVO</span>' : ''}
        </div>
        <div style="font-size:.7rem;color:var(--muted)">${escapeHtml(u.email)}${u.empresa?' · '+escapeHtml(u.empresa):''}</div>
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
