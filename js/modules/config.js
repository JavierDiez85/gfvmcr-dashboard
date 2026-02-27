// GFVMCR — Configuración: categorías P&L, apariencia

// APARIENCIA / TEMA
// ═══════════════════════════════════════
let _theme = DB.get('vmcr_theme') || 'light';

function applyTheme(t){
  _theme = t;
  document.body.classList.toggle('dark', t === 'dark');
  const tb = document.getElementById('theme-toggle-btn');
  if(tb) tb.textContent = t === 'dark' ? '☀️' : '🌙';
  DB.set('vmcr_theme', t);
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
// CARGA DE CRÉDITOS DESDE PDF
