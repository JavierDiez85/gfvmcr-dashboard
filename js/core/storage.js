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
    localStorage.setItem(key, JSON.stringify(val));
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
