// ══════════════════════════════════════
// STORAGE — Capa de datos
// Hoy: localStorage. Futuro: API REST.
// ══════════════════════════════════════

const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch(e) { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  // Future API methods (uncomment when backend ready):
  // async fetch(endpoint) {
  //   const r = await fetch(`/api/${endpoint}`, { headers: authHeaders() });
  //   return r.json();
  // },
  // async post(endpoint, data) {
  //   const r = await fetch(`/api/${endpoint}`, {
  //     method: 'POST',
  //     headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data)
  //   });
  //   return r.json();
  // }
};
