// ══════════════════════════════════════
// STORAGE — Capa de datos
// localStorage = caché síncrona (lecturas rápidas)
// Supabase = persistencia remota (escrituras async)
// ══════════════════════════════════════

const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch(e) { return null; }
  },
  set(key, val) {
    // Bloquear escrituras para viewers (excepto tema)
    if (key !== 'gf_theme' && typeof isViewer === 'function' && isViewer()) {
      console.warn('[DB.set] bloqueado — modo solo lectura');
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch(e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.error('[DB.set] Almacenamiento lleno — key:', key);
        if (typeof toast === 'function') toast('⚠️ Almacenamiento local lleno. Algunos datos no se guardaron.');
      } else {
        console.error('[DB.set] Error:', e.message);
      }
      return;
    }
    // Write-through: empujar a Supabase en background
    if (typeof SB !== 'undefined' && SB.pushKey) {
      SB.pushKey(key).catch(e => console.warn('[DB.set] push falló:', e.message));
    }
  },
  remove(key) {
    localStorage.removeItem(key);
    // Sync removal a Supabase
    if (typeof SB !== 'undefined' && SB.pushKey) {
      SB.pushKey(key).catch(e => console.warn('[DB.remove] push falló:', e.message));
    }
  }
};
