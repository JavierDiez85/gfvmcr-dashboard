// GFVMCR — Inicialización principal
// Bootstrap asíncrono: Supabase → localStorage → render

document.addEventListener('DOMContentLoaded', () => {
  initApp().then(() => {
    // Post-init adicional
    const fm = document.getElementById('tes-fil-mes');
    if (fm && typeof tesCurMonth === 'function') fm.value = tesCurMonth();
  }).catch(e => {
    console.error('[main] initApp falló, fallback a localStorage:', e);
    // Fallback: correr init con lo que haya en localStorage
    try {
      S.recs = DB.get('vmcr4') || [];
      uLoad(); ccLoad(); fiLoad(); fgLoad(); syncFlujoToRecs();
      applyTheme(_theme); renderReg(); sv('inicio', null);
      if (typeof updateToggleBtn === 'function') updateToggleBtn();
    } catch (e2) { console.error('[main] fallback también falló:', e2); }
    const loader = document.getElementById('app-loader');
    if (loader) loader.style.display = 'none';
  });
});
