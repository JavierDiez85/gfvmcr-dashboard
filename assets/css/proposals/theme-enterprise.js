/* ================================================================
   THEME ENTERPRISE — JS Companion v2
   ================================================================
   Reemplaza TODOS los emojis con iconos SVG inline profesionales.
   Cobertura completa:
   - Sidebar: circulos con iniciales de color
   - KPI icons: SVG minimalistas
   - Buttons: strip emojis, keep text
   - Section headers: strip emojis
   - Quick access cards: replace icon emojis
   - Nav pills/tabs: strip emojis
   - Select options: strip emojis
   - Theme toggle / logout: professional icons
   - WIP notices: clean text
   - Modal titles: strip emojis
   - MutationObserver: limpia contenido dinamico
   ================================================================
   Activar: <script src="...theme-enterprise.js"> en index.html
   Desactivar: quitar el <script>
   NO modifica archivos de produccion.
   ================================================================ */

(function() {
  'use strict';

  /* ────────────────────────────────────────────────
     SVG Icon Library (inline, 16x16, stroke 1.8)
     Estilo: Fluent UI / Lucide-like
     ──────────────────────────────────────────────── */
  const ICONS = {
    dollar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'chart-bar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>',
    'chart-up': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    'chart-down': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
    users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'credit-card': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="17"/><line x1="15" y1="22" x2="15" y2="17"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/></svg>',
    folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    receipt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
    settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bank: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 22 7"/><rect x="3" y="9" width="3" height="10"/><rect x="10" y="9" width="3" height="10"/><rect x="18" y="9" width="3" height="10"/><line x1="1" y1="21" x2="23" y2="21"/><line x1="1" y1="7" x2="23" y2="7"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    droplet: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    wallet: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2" y1="10" x2="22" y2="10"/></svg>',
    percent: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    package: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'file-text': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    monitor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    store: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    hash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    rocket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    handshake: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>',
    tag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    ticket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>',
    medal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>',
    ban: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    'check-circle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'log-out': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    alert: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    circle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="5"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    attach: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    printer: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    construction: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'user-tie': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11l-2 4h4l-2-4z"/></svg>'
  };

  /* ────────────────────────────────────────────────
     EMOJI REGEX — comprehensive coverage
     ──────────────────────────────────────────────── */
  const EMOJI_RE = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2702}-\u{27B0}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{2328}]|[\u{23CF}]|[\u{23ED}-\u{23EF}]|[\u{23F1}-\u{23F2}])+\uFE0F?/gu;

  function stripEmojis(text) {
    return text.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
  }

  function hasEmoji(text) {
    EMOJI_RE.lastIndex = 0;
    return EMOJI_RE.test(text);
  }

  /* ────────────────────────────────────────────────
     KPI ICON EMOJI → SVG Mapping (comprehensive)
     ──────────────────────────────────────────────── */
  const EMOJI_TO_SVG = {};
  // Helper to add mappings
  function addMap(emoji, svgKey) { EMOJI_TO_SVG[emoji] = svgKey; }

  // Money
  addMap('\uD83D\uDCB0', 'dollar');     // 💰
  addMap('\uD83D\uDCB8', 'dollar');     // 💸
  addMap('\uD83D\uDCB5', 'dollar');     // 💵
  addMap('\uD83D\uDCB2', 'dollar');     // 💲
  addMap('\uD83D\uDCB9', 'chart-up');   // 💹
  // Charts
  addMap('\uD83D\uDCCA', 'chart-bar');  // 📊
  addMap('\uD83D\uDCC8', 'chart-up');   // 📈
  addMap('\uD83D\uDCC9', 'chart-down'); // 📉
  // People
  addMap('\uD83D\uDC65', 'users');      // 👥
  addMap('\uD83D\uDC64', 'user');       // 👤
  addMap('\uD83E\uDDD1\u200D\uD83D\uDCBC', 'user-tie'); // 🧑‍💼
  addMap('\uD83E\uDDD1', 'user');       // 🧑
  // Finance
  addMap('\uD83D\uDCB3', 'credit-card'); // 💳
  addMap('\uD83C\uDFE6', 'bank');       // 🏦
  addMap('\uD83C\uDFE2', 'building');   // 🏢
  addMap('\uD83C\uDFC6', 'medal');      // 🏆
  addMap('\uD83C\uDFEA', 'store');      // 🏪
  // Documents
  addMap('\uD83D\uDCC1', 'folder');     // 📁
  addMap('\uD83D\uDCC4', 'file-text');  // 📄
  addMap('\uD83E\uDDFE', 'receipt');    // 🧾
  addMap('\uD83D\uDCDD', 'file-text');  // 📝
  addMap('\uD83D\uDCCB', 'file-text');  // 📋
  addMap('\uD83D\uDCC5', 'clock');      // 📅
  addMap('\uD83D\uDCD1', 'file-text');  // 📑
  // Arrows / transfer
  addMap('\uD83D\uDCE4', 'upload');     // 📤
  addMap('\uD83D\uDCE5', 'download');   // 📥
  addMap('\uD83D\uDCE9', 'mail');       // 📩
  // Buildings
  addMap('\uD83C\uDFDB\uFE0F', 'bank'); // 🏛️
  addMap('\uD83C\uDFDB', 'bank');       // 🏛
  // Security
  addMap('\uD83D\uDEE1\uFE0F', 'shield'); // 🛡️
  addMap('\uD83D\uDEE1', 'shield');     // 🛡
  addMap('\uD83D\uDD12', 'shield');     // 🔒
  addMap('\uD83D\uDEA8', 'alert');      // 🚨
  // Misc icons
  addMap('\u2699\uFE0F', 'settings');   // ⚙️
  addMap('\u2699', 'settings');         // ⚙
  addMap('\uD83D\uDCA7', 'droplet');    // 💧
  addMap('\uD83C\uDFAF', 'target');     // 🎯
  addMap('\uD83D\uDCE6', 'package');    // 📦
  addMap('\uD83D\uDD52', 'clock');      // 🕒
  addMap('\uD83D\uDCBC', 'folder');     // 💼
  addMap('\uD83D\uDD0D', 'target');     // 🔍
  addMap('\u26A0\uFE0F', 'alert');      // ⚠️
  addMap('\u26A0', 'alert');            // ⚠
  addMap('\uD83D\uDE80', 'rocket');     // 🚀
  addMap('\uD83C\uDF10', 'globe');      // 🌐
  addMap('\uD83D\uDDA5\uFE0F', 'monitor'); // 🖥️
  addMap('\uD83D\uDDA5', 'monitor');    // 🖥
  addMap('\uD83D\uDD22', 'hash');       // 🔢
  addMap('\uD83E\uDD1D', 'handshake'); // 🤝
  addMap('\uD83C\uDFF7\uFE0F', 'tag'); // 🏷️
  addMap('\uD83C\uDFF7', 'tag');       // 🏷
  addMap('\uD83C\uDF9F\uFE0F', 'ticket'); // 🎟️
  addMap('\uD83C\uDF9F', 'ticket');    // 🎟
  addMap('\uD83C\uDFAB', 'ticket');    // 🎫
  addMap('\uD83E\uDD47', 'medal');     // 🥇
  addMap('\uD83D\uDCCE', 'attach');    // 📎
  addMap('\uD83D\uDD04', 'refresh');   // 🔄
  addMap('\uD83D\uDEA7', 'construction'); // 🚧
  addMap('\uD83D\uDCA1', 'info');      // 💡
  addMap('\uD83D\uDEAB', 'ban');       // 🚫
  // Colored circles → generic filled circle (used in KPIs)
  addMap('\uD83D\uDD35', 'circle');    // 🔵
  addMap('\uD83D\uDFE2', 'circle');    // 🟢
  addMap('\uD83D\uDFE0', 'circle');    // 🟠
  addMap('\uD83D\uDFE3', 'circle');    // 🟣
  addMap('\uD83D\uDD34', 'circle');    // 🔴
  addMap('\uD83D\uDFE1', 'circle');    // 🟡
  // Action emojis used in buttons
  addMap('\uD83D\uDCBE', 'save');      // 💾
  addMap('\uD83D\uDDD1', 'trash');     // 🗑
  addMap('\uD83D\uDDD1\uFE0F', 'trash'); // 🗑️
  addMap('\u270F\uFE0F', 'edit');      // ✏️
  addMap('\u270F', 'edit');            // ✏
  addMap('\u2705', 'check-circle');    // ✅
  addMap('\u2795', 'plus');            // ➕
  addMap('\u2600\uFE0F', 'sun');       // ☀️
  addMap('\u2600', 'sun');             // ☀
  addMap('\uD83D\uDEAA', 'log-out');   // 🚪
  addMap('\uD83D\uDDA8\uFE0F', 'printer'); // 🖨️
  addMap('\uD83D\uDDA8', 'printer');   // 🖨
  addMap('\u26D3\uFE0F', 'link');      // ⛓️
  addMap('\u26D3', 'link');            // ⛓
  addMap('\uD83C\uDF19', 'target');    // 🌙 (moon → just strip)

  /* ────────────────────────────────────────────────
     Company Sidebar — Replace emojis with colored initials
     ──────────────────────────────────────────────── */
  const COMPANY_MAP = {
    'co-grupo':     { initials: 'GF', bg: '#605e5c', text: '#fff' },
    'co-salem':     { initials: 'S',  bg: '#0078d4', text: '#fff' },
    'co-endless':   { initials: 'E',  bg: '#107c10', text: '#fff' },
    'co-dynamo':    { initials: 'D',  bg: '#ca5010', text: '#fff' },
    'co-wirebit':   { initials: 'W',  bg: '#5c2d91', text: '#fff' },
    'co-stellaris': { initials: 'St', bg: '#d13438', text: '#fff' },
    'co-config':    { initials: '',   bg: 'transparent', text: '#a19f9d', icon: 'settings' }
  };

  function replaceSidebarEmojis() {
    Object.entries(COMPANY_MAP).forEach(([id, cfg]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const iconEl = el.querySelector('.sb-co-icon');
      if (!iconEl || iconEl.dataset.entPro) return;
      iconEl.dataset.entPro = '1';

      if (cfg.icon) {
        iconEl.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;color:' + cfg.text + '">' + ICONS[cfg.icon] + '</span>';
      } else {
        iconEl.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:4px;background:' + cfg.bg + ';color:' + cfg.text + ';font-family:\'Segoe UI\',\'Inter\',sans-serif;font-size:.6rem;font-weight:700;letter-spacing:.02em">' + cfg.initials + '</span>';
      }
    });

    // Brand logo
    const brand = document.querySelector('.sb-brand');
    if (brand) {
      const brandIcon = brand.querySelector('div');
      if (brandIcon && !brandIcon.dataset.entPro) {
        const txt = brandIcon.textContent.trim();
        if (hasEmoji(txt) || txt === '') {
          brandIcon.dataset.entPro = '1';
          brandIcon.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:6px;background:#0078d4;color:#fff;font-family:\'Segoe UI\',\'Inter\',sans-serif;font-size:.7rem;font-weight:800;letter-spacing:.02em">GF</span>';
          brandIcon.style.fontSize = 'unset';
        }
      }
    }
  }

  /* ────────────────────────────────────────────────
     KPI Icons — Replace emoji with SVG
     ──────────────────────────────────────────────── */
  function replaceKPIEmojis() {
    document.querySelectorAll('.kpi-ico').forEach(ico => {
      if (ico.dataset.entPro) return;
      const txt = ico.textContent.trim();
      // Try exact match first, then try char-by-char
      let svgKey = EMOJI_TO_SVG[txt];
      if (!svgKey) {
        // Try matching first emoji character
        for (const [emoji, key] of Object.entries(EMOJI_TO_SVG)) {
          if (txt.includes(emoji)) { svgKey = key; break; }
        }
      }
      if (svgKey && ICONS[svgKey]) {
        ico.dataset.entPro = '1';
        ico.innerHTML = ICONS[svgKey];
        ico.style.display = 'inline-flex';
        ico.style.alignItems = 'center';
        ico.style.justifyContent = 'center';
      } else if (hasEmoji(txt)) {
        // Fallback: replace unknown emojis with a generic icon
        ico.dataset.entPro = '1';
        ico.innerHTML = ICONS['chart-bar'];
        ico.style.display = 'inline-flex';
        ico.style.alignItems = 'center';
        ico.style.justifyContent = 'center';
      }
    });
  }

  /* ────────────────────────────────────────────────
     Quick Access Cards — Replace large emoji icons
     These are divs with font-size > 1rem inside cards
     ──────────────────────────────────────────────── */
  function replaceQuickAccessIcons() {
    // Target the quick access grid icons (large emoji divs)
    document.querySelectorAll('div[style*="font-size"]').forEach(el => {
      if (el.dataset.entPro) return;
      const style = el.getAttribute('style') || '';
      // Match large-font emoji containers (1rem+)
      if (!/font-size\s*:\s*(1\.[0-9]|[2-9]|1\.)/i.test(style)) return;

      const txt = el.textContent.trim();
      if (!hasEmoji(txt)) return;

      let svgKey = EMOJI_TO_SVG[txt];
      if (!svgKey) {
        for (const [emoji, key] of Object.entries(EMOJI_TO_SVG)) {
          if (txt.includes(emoji)) { svgKey = key; break; }
        }
      }
      if (svgKey && ICONS[svgKey]) {
        el.dataset.entPro = '1';
        // Make the SVG bigger for quick access (24x24)
        const bigSvg = ICONS[svgKey].replace(/width="16"/g, 'width="24"').replace(/height="16"/g, 'height="24"');
        el.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;color:inherit">' + bigSvg + '</span>';
        el.style.fontSize = 'unset';
        el.style.lineHeight = '1';
      }
    });
  }

  /* ────────────────────────────────────────────────
     Buttons — Strip emojis from button text
     ──────────────────────────────────────────────── */
  function cleanButtons() {
    document.querySelectorAll('button, .btn').forEach(el => {
      const txt = el.textContent.trim();
      if (!hasEmoji(txt)) return;

      // Theme toggle button — always re-clean (app swaps sun/moon)
      if (el.id === 'theme-toggle-btn') {
        const isDark = document.body.classList.contains('dark');
        el.textContent = isDark ? '' : '';
        el.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center">' + (isDark ? ICONS['sun'] : ICONS['target']) + '</span>';
        return;
      }

      if (el.dataset.entClean) return;
      el.dataset.entClean = '1';
      cleanTextNodes(el);
    });
  }

  /* ────────────────────────────────────────────────
     Select Options — Strip emojis
     ──────────────────────────────────────────────── */
  function cleanSelects() {
    document.querySelectorAll('option').forEach(el => {
      if (el.dataset.entClean) return;
      const txt = el.textContent;
      if (!hasEmoji(txt)) return;
      el.dataset.entClean = '1';
      el.textContent = stripEmojis(txt);
    });
  }

  /* ────────────────────────────────────────────────
     Generic text cleanup — all remaining elements
     ──────────────────────────────────────────────── */
  function cleanTextElements() {
    // Nav pills
    document.querySelectorAll('.hnav-view').forEach(el => {
      if (el.dataset.entClean) return;
      const cleaned = stripEmojis(el.textContent);
      if (cleaned !== el.textContent.trim()) {
        el.dataset.entClean = '1';
        el.textContent = cleaned;
      }
    });

    // Nav tabs
    document.querySelectorAll('.hnav-tab').forEach(el => {
      if (el.dataset.entClean) return;
      const cleaned = stripEmojis(el.textContent);
      if (cleaned !== el.textContent.trim()) {
        el.dataset.entClean = '1';
        el.textContent = cleaned;
      }
    });

    // Table headers
    document.querySelectorAll('.tw-ht, .cc-t').forEach(el => {
      if (el.dataset.entClean) return;
      cleanTextNodes(el);
      el.dataset.entClean = '1';
    });

    // KPI labels
    document.querySelectorAll('.kpi-lbl').forEach(el => {
      if (el.dataset.entClean) return;
      const cleaned = stripEmojis(el.textContent);
      if (cleaned !== el.textContent.trim()) {
        el.textContent = cleaned;
      }
      el.dataset.entClean = '1';
    });

    // Section titles (Poppins styled) and any div with emoji text
    document.querySelectorAll('[style*="Poppins"], [style*="font-weight:700"], [style*="font-weight: 700"]').forEach(el => {
      if (el.dataset.entClean) return;
      if (el.tagName === 'BUTTON' || el.tagName === 'OPTION') return;
      if (!hasEmoji(el.textContent)) return;

      if (el.children.length === 0) {
        const cleaned = stripEmojis(el.textContent);
        if (cleaned !== el.textContent.trim()) {
          el.textContent = cleaned;
        }
      } else {
        cleanTextNodes(el);
      }
      el.dataset.entClean = '1';
    });

    // Span elements with emojis (breadcrumbs, labels, etc)
    document.querySelectorAll('span, strong, div.wip-notice, th').forEach(el => {
      if (el.dataset.entClean) return;
      if (el.children.length > 2) return; // Skip complex containers
      const txt = el.textContent;
      if (!hasEmoji(txt)) return;

      el.dataset.entClean = '1';
      cleanTextNodes(el);
    });

    // Login emoji
    const loginEmoji = document.querySelector('#login-overlay div[style*="font-size:2rem"]');
    if (loginEmoji && !loginEmoji.dataset.entPro) {
      loginEmoji.dataset.entPro = '1';
      loginEmoji.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:6px;background:#0078d4;color:#fff;font-family:\'Segoe UI\',\'Inter\',sans-serif;font-size:.85rem;font-weight:800">GF</span>';
    }

    // Theme selector emojis (moon/sun in config)
    document.querySelectorAll('div[style*="font-size:1.2rem"]').forEach(el => {
      if (el.dataset.entPro) return;
      const txt = el.textContent.trim();
      if (!hasEmoji(txt)) return;
      el.dataset.entPro = '1';
      let svgKey = EMOJI_TO_SVG[txt];
      if (!svgKey) {
        for (const [emoji, key] of Object.entries(EMOJI_TO_SVG)) {
          if (txt.includes(emoji)) { svgKey = key; break; }
        }
      }
      if (svgKey && ICONS[svgKey]) {
        const svg20 = ICONS[svgKey].replace(/width="16"/g, 'width="20"').replace(/height="16"/g, 'height="20"');
        el.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;color:inherit">' + svg20 + '</span>';
        el.style.fontSize = 'unset';
      }
    });
  }

  function cleanTextNodes(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (hasEmoji(node.textContent)) {
        node.textContent = stripEmojis(node.textContent);
      }
    });
  }

  /* ────────────────────────────────────────────────
     Poppins → Segoe UI override
     ──────────────────────────────────────────────── */
  function overridePoppinsInlineStyles() {
    document.querySelectorAll('[style*="Poppins"]').forEach(el => {
      if (el.dataset.entFont) return;
      el.dataset.entFont = '1';
      el.style.fontFamily = "'Segoe UI', 'Inter', sans-serif";
    });
  }

  /* ────────────────────────────────────────────────
     Nuclear option: sweep ALL remaining emojis
     Runs last to catch anything the targeted passes missed
     ──────────────────────────────────────────────── */
  function nuclearEmojiSweep() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        // Skip script/style/svg elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'PATH'
            || tag === 'CIRCLE' || tag === 'LINE' || tag === 'RECT' || tag === 'POLYLINE'
            || tag === 'POLYGON') {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip elements whose SVG icons we set (don't strip those)
        if (parent.dataset && parent.dataset.entPro) return NodeFilter.FILTER_REJECT;
        // Only accept nodes with emojis
        EMOJI_RE.lastIndex = 0;
        if (EMOJI_RE.test(node.textContent)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const cleaned = stripEmojis(node.textContent);
      if (cleaned !== node.textContent) {
        node.textContent = cleaned;
        if (node.parentElement) node.parentElement.dataset.entNuc = '1';
      }
    });
  }

  /* ────────────────────────────────────────────────
     Master — apply all transformations
     ──────────────────────────────────────────────── */
  function applyEnterprise() {
    replaceSidebarEmojis();
    replaceKPIEmojis();
    replaceQuickAccessIcons();
    cleanButtons();
    cleanSelects();
    cleanTextElements();
    overridePoppinsInlineStyles();
    // Nuclear sweep last
    nuclearEmojiSweep();
  }

  /* ────────────────────────────────────────────────
     MutationObserver
     ──────────────────────────────────────────────── */
  let debounceTimer = null;
  function debouncedApply() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      applyEnterprise();
      syncCompanyColor();
    }, 80);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      for (const m of mutations) {
        // Skip mutations caused by our own changes
        if (m.target && m.target.dataset && (m.target.dataset.entPro || m.target.dataset.entClean || m.target.dataset.entNuc)) continue;
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          needsUpdate = true;
          break;
        }
        if (m.type === 'characterData') {
          needsUpdate = true;
          break;
        }
      }
      if (needsUpdate) debouncedApply();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /* ────────────────────────────────────────────────
     Company Color Sync — colores dinámicos en hnav
     ──────────────────────────────────────────────── */
  const COMPANY_COLORS = {
    grupo:     { h: '#6b7280', hd: '#4b5563', hl: '#9ca3af', shadow: '107,114,128' },
    salem:     { h: '#3b82f6', hd: '#2563eb', hl: '#60a5fa', shadow: '59,130,246'  },
    endless:   { h: '#22c55e', hd: '#16a34a', hl: '#4ade80', shadow: '34,197,94'   },
    dynamo:    { h: '#f97316', hd: '#ea580c', hl: '#fb923c', shadow: '249,115,22'  },
    wirebit:   { h: '#8b5cf6', hd: '#7c3aed', hl: '#a78bfa', shadow: '139,92,246'  },
    stellaris: { h: '#ef4444', hd: '#dc2626', hl: '#f87171', shadow: '239,68,68'   },
    config:    { h: '#6b7280', hd: '#4b5563', hl: '#9ca3af', shadow: '107,114,128' }
  };

  let _lastActiveCompany = null;

  function syncCompanyColor() {
    // Detect active company from sidebar
    const activeCo = document.querySelector('.sb-co.active');
    if (!activeCo) return;

    const coId = (activeCo.id || '').replace('co-', '');
    if (!coId || coId === _lastActiveCompany) return;
    _lastActiveCompany = coId;

    const colors = COMPANY_COLORS[coId] || COMPANY_COLORS.grupo;
    const root = document.documentElement;

    root.style.setProperty('--co', colors.h);
    root.style.setProperty('--co-dk', colors.hd);
    root.style.setProperty('--co-lt', colors.hl);
    root.style.setProperty('--co-shadow', colors.shadow);
  }

  /* ────────────────────────────────────────────────
     Init
     ──────────────────────────────────────────────── */
  function init() {
    applyEnterprise();
    syncCompanyColor();
    setTimeout(applyEnterprise, 200);
    setTimeout(applyEnterprise, 600);
    setTimeout(applyEnterprise, 1500);
    setTimeout(applyEnterprise, 3000);
    startObserver();

    // Also sync color on sidebar clicks
    document.querySelectorAll('.sb-co').forEach(co => {
      co.addEventListener('click', () => {
        setTimeout(syncCompanyColor, 50);
      });
    });

    console.log('[theme-enterprise] Enterprise theme v2 + company colors activated');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();
