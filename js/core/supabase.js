// ══════════════════════════════════════
// SUPABASE — Motor de sincronización
// localStorage = caché local (lecturas síncronas)
// Supabase = persistencia remota (escrituras async)
// ══════════════════════════════════════

const SUPABASE_URL = 'https://ofuzwfiqjvlronulhwbw.supabase.co';
const SUPABASE_KEY = '***REDACTED_SUPABASE_ANON_KEY***';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Client identity (para tracking de sync)
const CLIENT_ID = localStorage.getItem('_vmcr_client_id') ||
  (() => { const id = crypto.randomUUID(); localStorage.setItem('_vmcr_client_id', id); return id; })();

// Todas las keys conocidas
const APP_KEYS = [
  'vmcr4','vmcr_fi','vmcr_fg','vmcr_cred_end','vmcr_cred_dyn',
  'vmcr_cc_hist','vmcr_usuarios','vmcr_theme','vmcr_tesoreria',
  'vmcr_bancos','vmcr_tpv_pagos','vmcr_cat_cd','vmcr_cat_ga',
  'vmcr_tickets_pagos_tpv'
];

// Estado de sync
let _lastSync = null;
let _syncInProgress = false;
let _online = navigator.onLine;
const _pendingPush = new Set();

window.addEventListener('online',  () => { _online = true;  SB.flushPending(); });
window.addEventListener('offline', () => { _online = false; });

// ══════════════════════════════════════
// SB — Objeto de sincronización
// ══════════════════════════════════════
const SB = {

  // Jalar TODOS los datos de Supabase → localStorage
  async pullAll() {
    try {
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
    if (!_online) { _pendingPush.add(key); return; }
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
    } catch (e) {
      console.warn(`[SB] pushKey(${key}) falló:`, e.message);
      _pendingPush.add(key);
    }
  },

  // Empujar todas las keys pendientes (cuando vuelve la conexión)
  async flushPending() {
    const keys = [..._pendingPush];
    for (const key of keys) {
      await SB.pushKey(key);
    }
  },

  // Sync en background: jalar cambios desde Supabase periódicamente
  async backgroundPull() {
    if (_syncInProgress || !_online) return;
    _syncInProgress = true;
    try {
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
    S.recs = DB.get('vmcr4') || [];

    // Recargar créditos
    const ec = DB.get('vmcr_cred_end');
    if (ec && ec.length) { END_CREDITS.length = 0; ec.forEach(c => END_CREDITS.push(c)); }
    const dc2 = DB.get('vmcr_cred_dyn');
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
// MIGRACIÓN — Subir localStorage existente a Supabase (una sola vez)
// ══════════════════════════════════════
async function _migrateLocalToSupabase() {
  const migrated = localStorage.getItem('_vmcr_migrated');
  if (migrated) return;

  console.log('[SB] Migrando localStorage → Supabase...');
  let count = 0;

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

  localStorage.setItem('_vmcr_migrated', new Date().toISOString());
  console.log(`[SB] Migración completa — ${count} keys subidas`);
}

// ══════════════════════════════════════
// INIT APP — Bootstrap asíncrono
// ══════════════════════════════════════
async function initApp() {
  const loader = document.getElementById('app-loader');
  if (loader) loader.style.display = 'flex';

  try {
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
    const ec = DB.get('vmcr_cred_end');
    if (ec && ec.length) { END_CREDITS.length = 0; ec.forEach(c => END_CREDITS.push(c)); }
    const dc2 = DB.get('vmcr_cred_dyn');
    if (dc2 && dc2.length) { DYN_CREDITS.length = 0; dc2.forEach(c => DYN_CREDITS.push(c)); }

    // Recargar S.recs
    S.recs = DB.get('vmcr4') || [];

    // Init existente
    uLoad(); ccLoad(); fiLoad(); fgLoad(); fiInjectTPV(); syncFlujoToRecs();
    // Re-leer theme de localStorage (pudo cambiar después de pullAll)
    _theme = DB.get('vmcr_theme') || 'light';
    applyTheme(_theme);
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
