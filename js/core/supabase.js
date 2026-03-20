// ══════════════════════════════════════
// SUPABASE — Motor de sincronización
// localStorage = caché local (lecturas síncronas)
// Supabase = persistencia remota (escrituras async)
// ══════════════════════════════════════

let SUPABASE_URL = '';
let SUPABASE_KEY = '';
let _sb = null;

// Cargar config desde el servidor Node.js (/api/config)
// Sin fallback embebido — las credenciales solo viven en el servidor
async function _loadConfig() {
  if (_sb) return;

  try {
    const r = await fetch('/api/config');
    if (r.ok) {
      const cfg = await r.json();
      if (cfg.supabaseUrl && cfg.supabaseKey) {
        SUPABASE_URL = cfg.supabaseUrl;
        SUPABASE_KEY = cfg.supabaseKey;
        _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return;
      }
    }
  } catch (e) { /* servidor no disponible */ }

  // Sin servidor: app funciona en modo offline (solo localStorage)
  console.warn('[SB] No se pudo conectar al servidor. Modo offline.');
}

// Client identity (para tracking de sync)
const CLIENT_ID = localStorage.getItem('_gf_client_id') ||
  (() => { const id = crypto.randomUUID(); localStorage.setItem('_gf_client_id', id); return id; })();

// Todas las keys conocidas
const APP_KEYS = [
  'gf4','gf_fi','gf_fg','gf_cred_end','gf_cred_dyn',
  'gf_cc_hist','gf_usuarios','gf_theme','gf_tesoreria',
  'gf_bancos','gf_tpv_pagos','gf_cat_cd','gf_cat_ga',
  'gf_tickets_pagos_tpv','gf_tpv_agente_pagos',
  'gf_tpv_promotor_pagos','gf_tpv_rate_changes',
  // Wirebit data (year-dependent)
  'gf_wb_fees_2025','gf_wb_fees_2026','gf_wb_upload_summary','gf_wb_tarjetas_2025','gf_wb_tarjetas_2026',
  // Nómina y gastos compartidos
  'gf_nomina','gf_gc',
  // Facturación CxP
  'gf_cxp'
];

// Estado de sync
let _lastSync = null;
let _syncInProgress = false;
let _online = navigator.onLine;
// Persistir pendientes en localStorage para sobrevivir cierres de tab
const _pendingPush = new Set(
  (function(){ try { return JSON.parse(localStorage.getItem('_gf_pending_sync')) || []; } catch(e){ return []; }})()
);
function _savePending(){
  try { localStorage.setItem('_gf_pending_sync', JSON.stringify([..._pendingPush])); } catch(e){}
}

// Indicador visual de sync
function _syncStatus(state, msg){
  var el = document.getElementById('sync-indicator');
  if(!el) return;
  var icons = { syncing:'\u2B6E', ok:'\u2713', error:'\u26A0', offline:'\u26A0' };
  var colors = { syncing:'var(--blue)', ok:'var(--green)', error:'var(--red)', offline:'var(--orange)' };
  var c = colors[state] || 'var(--muted)';
  el.style.color = c;
  el.innerHTML = '<span style="font-size:.75rem;font-weight:700;color:'+c+'">' + (icons[state]||'') + '</span>'
               + ' <span style="font-size:.68rem;font-weight:600;color:'+c+'">' + (msg||'') + '</span>';
  if(state==='ok') setTimeout(function(){ if(el.style.color===colors.ok) el.innerHTML='<span style="font-size:.68rem;color:var(--muted)">\u2713</span>'; }, 3000);
}

// ── Retry con backoff exponencial ──
var _retryTimer = null;
var _retryDelay = 1000; // empieza en 1s
var _RETRY_MAX  = 30000; // máximo 30s
function _scheduleRetry(){
  if(_retryTimer) return; // ya hay uno programado
  _retryTimer = setTimeout(function(){
    _retryTimer = null;
    if(!_online || _pendingPush.size === 0){ _retryDelay = 1000; return; }
    _syncStatus('syncing','Reintentando...');
    SB.flushPending().then(function(){
      if(_pendingPush.size === 0){ _retryDelay = 1000; }
      else { _retryDelay = Math.min(_retryDelay * 2, _RETRY_MAX); _scheduleRetry(); }
    });
  }, _retryDelay);
}

window.addEventListener('online',  () => { _online = true; _retryDelay = 1000; _syncStatus('syncing','Reconectando...'); SB.flushPending(); });
window.addEventListener('offline', () => { _online = false; if(_retryTimer){ clearTimeout(_retryTimer); _retryTimer=null; } _syncStatus('offline','Sin conexión'); });

// ══════════════════════════════════════
// SB — Objeto de sincronización
// ══════════════════════════════════════
const SB = {

  // Jalar TODOS los datos de Supabase → localStorage
  async pullAll() {
    try {
      if (!_sb) await _loadConfig();
      const { data, error } = await _sb
        .from('app_data')
        .select('key, value, updated_at');
      if (error) throw error;
      if (!data || !data.length) return;

      for (const row of data) {
        if (row.value === null) continue;
        const remoteVal = JSON.stringify(row.value);
        // Supabase es la fuente de verdad
        if (remoteVal && remoteVal !== 'null') {
          localStorage.setItem(row.key, remoteVal);
        }
      }
      _lastSync = new Date().toISOString();
      console.log('[SB] pullAll OK —', data.length, 'keys');
    } catch (e) {
      console.warn('[SB] pullAll falló (offline?):', e.message);
      // La app continúa con localStorage — esto está bien
    }
  },

  // Empujar una key de localStorage → Supabase
  async pushKey(key) {
    if (!_online || !_sb) { _pendingPush.add(key); _savePending(); _syncStatus('offline','Pendiente'); return; }
    _syncStatus('syncing','Guardando...');
    try {
      const raw = localStorage.getItem(key);
      const value = raw ? JSON.parse(raw) : null;
      const { error } = await _sb
        .from('app_data')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: CLIENT_ID
        });
      if (error) throw error;
      _pendingPush.delete(key);
      _savePending();
      if(_pendingPush.size === 0) _syncStatus('ok','Guardado');
    } catch (e) {
      console.warn(`[SB] pushKey(${key}) falló:`, e.message);
      _pendingPush.add(key);
      _savePending();
      _syncStatus('error','Error al guardar');
      _scheduleRetry();
    }
  },

  // Empujar todas las keys pendientes (cuando vuelve la conexión)
  async flushPending() {
    const keys = [..._pendingPush];
    if(!keys.length) return;
    _syncStatus('syncing', keys.length + ' pendiente' + (keys.length!==1?'s':''));
    for (const key of keys) {
      await SB.pushKey(key);
    }
    if(_pendingPush.size === 0) _syncStatus('ok','Todo sincronizado');
    else _syncStatus('error', _pendingPush.size + ' sin guardar');
  },

  // Sync en background: jalar cambios desde Supabase periódicamente
  async backgroundPull() {
    if (_syncInProgress || !_online) return;
    _syncInProgress = true;
    try {
      if (!_sb) await _loadConfig();
      let query = _sb.from('app_data').select('key, value, updated_at, updated_by');
      if (_lastSync) {
        query = query.gt('updated_at', _lastSync);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) {
        let changed = false;
        for (const row of data) {
          // No sobreescribir con nuestros propios cambios
          if (row.updated_by === CLIENT_ID) continue;
          if (row.value === null) continue;
          const remoteVal = JSON.stringify(row.value);
          const localVal = localStorage.getItem(row.key);
          if (remoteVal !== localVal) {
            localStorage.setItem(row.key, remoteVal);
            changed = true;
          }
        }
        _lastSync = new Date().toISOString();
        // Refrescar UI si hay cambios de otro usuario
        if (changed) {
          console.log('[SB] Datos actualizados desde otro dispositivo');
          _refreshAppState();
        }
        // Validar integridad de sesión cada pull
        if (typeof validateSession === 'function') validateSession();
      }
    } catch (e) {
      console.warn('[SB] backgroundPull falló:', e.message);
    } finally {
      _syncInProgress = false;
    }
  },

  // Iniciar polling (cada 30 segundos)
  startPolling(intervalMs = 30000) {
    setInterval(() => SB.backgroundPull(), intervalMs);
  }
};

// ══════════════════════════════════════
// REFRESH — Recargar estado desde localStorage actualizado
// ══════════════════════════════════════
function _refreshAppState() {
  try {
    // Recargar estado global
    S.recs = DB.get('gf4') || [];

    // Recargar créditos
    const ec = DB.get('gf_cred_end');
    if (ec && ec.length) { END_CREDITS.length = 0; ec.forEach(c => END_CREDITS.push(c)); }
    const dc2 = DB.get('gf_cred_dyn');
    if (dc2 && dc2.length) { DYN_CREDITS.length = 0; dc2.forEach(c => DYN_CREDITS.push(c)); }

    // Recargar flujos
    if (typeof fiLoad === 'function') fiLoad();
    if (typeof fgLoad === 'function') fgLoad();
    if (typeof fiInjectTPV === 'function') fiInjectTPV();
    if (typeof syncFlujoToRecs === 'function') syncFlujoToRecs();

    // Re-renderizar vista activa
    const v = document.querySelector('.view.active');
    if (v && typeof render === 'function') {
      render(v.id.replace('view-', ''));
    }
    // Update ticket badge on sync
    if (typeof _tkUpdateBadge === 'function') _tkUpdateBadge();
  } catch (e) {
    console.warn('[SB] _refreshAppState error:', e);
  }
}

// ══════════════════════════════════════
// MIGRACIÓN — Renombrar claves antiguas vmcr_* → gf_*
// ══════════════════════════════════════
// Migrar keys que se omitieron en la migración original (corre siempre)
function _migrateExtraKeys() {
  const extras = {
    'vmcr_tpv_agente_pagos':'gf_tpv_agente_pagos',
    'vmcr_tpv_promotor_pagos':'gf_tpv_promotor_pagos',
    'vmcr_tpv_rate_changes':'gf_tpv_rate_changes'
  };
  for (const [oldK, newK] of Object.entries(extras)) {
    const v = localStorage.getItem(oldK);
    if (v && !localStorage.getItem(newK)) {
      console.log('[SB] Migrando key extra:', oldK, '→', newK);
      localStorage.setItem(newK, v);
      localStorage.removeItem(oldK);
    }
  }
}

async function _migrateOldKeys() {
  if (localStorage.getItem('_gf_keys_migrated')) return;
  console.log('[SB] Migrando claves vmcr_* → gf_*...');
  const OLD_MAP = {
    'vmcr4':'gf4','vmcr_fi':'gf_fi','vmcr_fg':'gf_fg','vmcr_cred_end':'gf_cred_end',
    'vmcr_cred_dyn':'gf_cred_dyn','vmcr_cc_hist':'gf_cc_hist','vmcr_usuarios':'gf_usuarios',
    'vmcr_theme':'gf_theme','vmcr_tesoreria':'gf_tesoreria','vmcr_bancos':'gf_bancos',
    'vmcr_tpv_pagos':'gf_tpv_pagos','vmcr_cat_cd':'gf_cat_cd','vmcr_cat_ga':'gf_cat_ga',
    'vmcr_tickets_pagos_tpv':'gf_tickets_pagos_tpv',
    'vmcr_tpv_agente_pagos':'gf_tpv_agente_pagos',
    'vmcr_tpv_promotor_pagos':'gf_tpv_promotor_pagos',
    'vmcr_tpv_rate_changes':'gf_tpv_rate_changes'
  };
  // localStorage
  for (const [oldK, newK] of Object.entries(OLD_MAP)) {
    const v = localStorage.getItem(oldK);
    if (v) { localStorage.setItem(newK, v); localStorage.removeItem(oldK); }
  }
  // sessionStorage
  const sess = sessionStorage.getItem('vmcr_session');
  if (sess) { sessionStorage.setItem('gf_session', sess); sessionStorage.removeItem('vmcr_session'); }
  // Supabase app_data
  try {
    if (!_sb) await _loadConfig();
    for (const [oldK, newK] of Object.entries(OLD_MAP)) {
      const { data } = await _sb.from('app_data').select('value').eq('key', oldK).single();
      if (data && data.value) {
        await _sb.from('app_data').upsert({ key: newK, value: data.value, updated_at: new Date().toISOString(), updated_by: CLIENT_ID });
        await _sb.from('app_data').delete().eq('key', oldK);
      }
    }
  } catch (e) { console.warn('[SB] Error migrando claves Supabase:', e.message); }
  // Migrar _vmcr_client_id
  const oldCid = localStorage.getItem('_vmcr_client_id');
  if (oldCid) { localStorage.setItem('_gf_client_id', oldCid); localStorage.removeItem('_vmcr_client_id'); }
  localStorage.setItem('_gf_keys_migrated', new Date().toISOString());
  console.log('[SB] Migración de claves completada');
}

// ══════════════════════════════════════
// MIGRACIÓN — Subir localStorage existente a Supabase (una sola vez)
// ══════════════════════════════════════
async function _migrateLocalToSupabase() {
  const migrated = localStorage.getItem('_gf_migrated');
  if (migrated) return;

  console.log('[SB] Migrando localStorage → Supabase...');
  let count = 0;

  if (!_sb) await _loadConfig();
  for (const key of APP_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null') continue;

    try {
      const value = JSON.parse(raw);
      // Solo subir si Supabase tiene el valor vacío/default
      const { data: existing } = await _sb
        .from('app_data')
        .select('value')
        .eq('key', key)
        .single();

      const isEmpty = !existing || existing.value === null ||
        JSON.stringify(existing.value) === '[]' ||
        JSON.stringify(existing.value) === '{}' ||
        JSON.stringify(existing.value) === '"light"';

      if (isEmpty && value) {
        await _sb.from('app_data').upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: CLIENT_ID
        });
        count++;
      }
    } catch (e) {
      console.warn(`[SB] migración key ${key} falló:`, e.message);
    }
  }

  localStorage.setItem('_gf_migrated', new Date().toISOString());
  console.log(`[SB] Migración completa — ${count} keys subidas`);
}

// ══════════════════════════════════════
// INIT APP — Bootstrap asíncrono
// ══════════════════════════════════════
async function initApp() {
  const loader = document.getElementById('app-loader');
  if (loader) loader.style.display = 'flex';

  try {
    // 0. Cargar config de Supabase desde el servidor
    await _loadConfig();

    // 0b. Migrar keys extra que se omitieron (corre siempre)
    _migrateExtraKeys();

    // 0c. Renombrar claves antiguas vmcr_* → gf_*
    await _migrateOldKeys();

    // 1. Migrar datos locales existentes (solo la primera vez)
    await _migrateLocalToSupabase();

    // 2. Jalar datos más recientes de Supabase
    await SB.pullAll();
  } catch (e) {
    console.warn('[SB] Init remoto falló, usando localStorage local:', e.message);
  }

  // 3. Ejecutar la secuencia de init síncrona existente (lee de localStorage)
  try {
    // Recargar créditos
    const ec = DB.get('gf_cred_end');
    if (ec && ec.length) { END_CREDITS.length = 0; ec.forEach(c => END_CREDITS.push(c)); }
    const dc2 = DB.get('gf_cred_dyn');
    if (dc2 && dc2.length) { DYN_CREDITS.length = 0; dc2.forEach(c => DYN_CREDITS.push(c)); }

    // Recargar S.recs
    S.recs = DB.get('gf4') || [];

    // Init existente
    uLoad(); ccLoad(); fiLoad(); fgLoad(); fiInjectTPV(); syncFlujoToRecs();
    // Siempre iniciar en modo día al abrir sesión
    applyTheme('light');
    renderReg();
    sv('inicio', null);
    if (typeof updateToggleBtn === 'function') updateToggleBtn();
    if (typeof _tkUpdateBadge === 'function') _tkUpdateBadge();
  } catch (e) {
    console.error('[initApp] Error en secuencia de init:', e);
  }

  // 4. Ocultar loader
  if (loader) loader.style.display = 'none';

  // 5. Iniciar sync en background
  SB.startPolling(30000);
  console.log('[SB] App inicializada con Supabase sync ✓');
}
