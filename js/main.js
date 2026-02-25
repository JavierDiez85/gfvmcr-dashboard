// GFVMCR — Inicialización principal
// Este archivo arranca la aplicación cuando el DOM está listo.

document.addEventListener('DOMContentLoaded', () => {
  // Aplicar tema guardado
  applyTheme();

  // Render inicial del dashboard
  rResumen();

  // Inicializar mes en filtros si aplica
  const fm = document.getElementById('tes-fil-mes');
  if (fm) fm.value = tesCurMonth();
});
