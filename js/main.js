// GF — Inicialización principal
// Bootstrap asíncrono: Login → Supabase → localStorage → render

document.addEventListener('DOMContentLoaded', async () => {
  // Si ya hay sesión activa, iniciar directamente
  if (isLoggedIn()) {
    // Validar integridad de sesión antes de iniciar
    if (typeof validateSession === 'function') {
      const valid = await validateSession();
      if (!valid) return; // sesión inválida → doLogout() ya fue llamado
    }

    document.getElementById('login-overlay').style.display = 'none';

    try {
      await initApp();
    } catch(e) {
      console.error('[main] initApp falló, fallback a localStorage:', e);
      try {
        S.recs = DB.get('vmcr4') || [];
        uLoad(); ccLoad(); fiLoad(); fgLoad(); syncFlujoToRecs();
        applyTheme(_theme); renderReg(); sv('inicio', null);
        if (typeof updateToggleBtn === 'function') updateToggleBtn();
      } catch (e2) { console.error('[main] fallback también falló:', e2); }
      const loader = document.getElementById('app-loader');
      if (loader) loader.style.display = 'none';
    }

    // Post-init
    const fm = document.getElementById('tes-fil-mes');
    if (fm && typeof tesCurMonth === 'function') fm.value = tesCurMonth();

    applyRoleRestrictions();
    applyMenuPermissions();

    // AI Chat assistant
    if (typeof initAIChat === 'function') initAIChat();
  } else {
    // No hay sesión → ocultar loader, mostrar login
    const loader = document.getElementById('app-loader');
    if (loader) loader.style.display = 'none';
    // login overlay ya está visible por defecto
  }
});
