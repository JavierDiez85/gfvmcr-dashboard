/**
 * remove-inline-styles-final.js
 * Pasada final: mapea TODOS los estilos inline restantes a clases CSS.
 * También genera el bloque CSS completo para styles.css
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath  = path.join(__dirname, '..', 'assets/css/styles.css');

let html = fs.readFileSync(htmlPath, 'utf8');
const before = (html.match(/style="/g) || []).length;

// ================================================================
// Mapa: style value → [className, cssDeclaration]
// ================================================================
const MAP = [
  // CSS custom properties (kpi-card --ac)
  ['--ac:#6366f1', 'kpi-ac-indigo', '--ac:#6366f1'],
  ['--ac:#9c27b0', 'kpi-ac-purple', '--ac:#9c27b0'],
  ['--ac:#ff9800', 'kpi-ac-amber',  '--ac:#ff9800'],

  // Progress bars (static decorative initial states)
  ['background:#0073ea;width:52%', 'gf-bar-b-52', 'background:#0073ea;width:52%'],
  ['background:#9b51e0;width:45%', 'gf-bar-p-45', 'background:#9b51e0;width:45%'],
  ['background:#9c27b0;width:0%',  'gf-bar-m-0',  'background:#9c27b0;width:0%'],
  ['background:#ff9800;width:0%',  'gf-bar-a-0',  'background:#ff9800;width:0%'],
  ['background:var(--blue);width:60%',   'gf-bar-blu-60', 'background:var(--blue);width:60%'],
  ['background:var(--muted);width:5%',   'gf-bar-mu-5',   'background:var(--muted);width:5%'],
  ['background:var(--orange);width:50%', 'gf-bar-or-50',  'background:var(--orange);width:50%'],
  ['background:var(--orange);width:55%', 'gf-bar-or-55',  'background:var(--orange);width:55%'],
  ['background:var(--orange);width:60%', 'gf-bar-or-60',  'background:var(--orange);width:60%'],
  ['background:var(--orange);width:75%', 'gf-bar-or-75',  'background:var(--orange);width:75%'],
  ['background:var(--purple);width:0%',  'gf-bar-pu-0',   'background:var(--purple);width:0%'],
  ['background:var(--purple);width:100%','gf-bar-pu-100', 'background:var(--purple);width:100%'],
  ['background:var(--purple);width:40%', 'gf-bar-pu-40',  'background:var(--purple);width:40%'],
  ['background:var(--purple);width:48%', 'gf-bar-pu-48',  'background:var(--purple);width:48%'],
  ['background:var(--red);width:17%',    'gf-bar-re-17',  'background:var(--red);width:17%'],
  ['background:var(--red);width:23%',    'gf-bar-re-23',  'background:var(--red);width:23%'],
  ['background:var(--red);width:28.2%',  'gf-bar-re-28',  'background:var(--red);width:28.2%'],
  ['background:var(--red);width:38%',    'gf-bar-re-38',  'background:var(--red);width:38%'],
  ['background:var(--red);width:80%',    'gf-bar-re-80',  'background:var(--red);width:80%'],
  ['background:var(--red);width:90%',    'gf-bar-re-90',  'background:var(--red);width:90%'],
  ['background:var(--yellow);width:70%', 'gf-bar-ye-70',  'background:var(--yellow);width:70%'],

  // Modal / dialog containers
  ['background:var(--white,#fff);border-radius:16px;padding:36px 32px;width:380px;max-width:90vw;box-shadow:0 8px 40px rgba(0,0,0,.15);text-align:center',
    'gf-login-card',
    'background:var(--white,#fff);border-radius:16px;padding:36px 32px;width:380px;max-width:90vw;box-shadow:0 8px 40px rgba(0,0,0,.15);text-align:center'],
  ['background:var(--white);border-radius:14px;padding:24px;width:440px;max-width:90vw;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-440', 'background:var(--white);border-radius:14px;padding:24px;width:440px;max-width:90vw;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:600px;max-width:90vw;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-600a', 'background:var(--white);border-radius:14px;padding:24px;width:600px;max-width:90vw;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:600px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-600b', 'background:var(--white);border-radius:14px;padding:24px;width:600px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:700px;max-width:90vw;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-700a', 'background:var(--white);border-radius:14px;padding:24px;width:700px;max-width:90vw;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:700px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-700b', 'background:var(--white);border-radius:14px;padding:24px;width:700px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:780px;max-width:94vw;max-height:85vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-780', 'background:var(--white);border-radius:14px;padding:24px;width:780px;max-width:94vw;max-height:85vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:800px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-800', 'background:var(--white);border-radius:14px;padding:24px;width:800px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;padding:24px;width:900px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)',
    'gf-dlg-900', 'background:var(--white);border-radius:14px;padding:24px;width:900px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)'],
  ['background:var(--white);border-radius:14px;width:720px;max-width:94vw;max-height:85vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);padding:24px 28px',
    'gf-dlg-720', 'background:var(--white);border-radius:14px;width:720px;max-width:94vw;max-height:85vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);padding:24px 28px'],
  ['background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:380px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.25)',
    'gf-dlg-sm', 'background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:380px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.25)'],
  ['background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:520px;width:94%;box-shadow:0 8px 32px rgba(0,0,0,.25);max-height:85vh;overflow-y:auto',
    'gf-dlg-md', 'background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:520px;width:94%;box-shadow:0 8px 32px rgba(0,0,0,.25);max-height:85vh;overflow-y:auto'],
  ['background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:580px;width:94%;box-shadow:0 8px 32px rgba(0,0,0,.25);max-height:85vh;overflow-y:auto',
    'gf-dlg-md2', 'background:var(--white);border-radius:var(--rlg);padding:24px 28px;max-width:580px;width:94%;box-shadow:0 8px 32px rgba(0,0,0,.25);max-height:85vh;overflow-y:auto'],
  ['background:var(--white);border-radius:var(--rlg);width:90%;max-width:900px;height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.3)',
    'gf-dlg-pdf', 'background:var(--white);border-radius:var(--rlg);width:90%;max-width:900px;height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.3)'],

  // Theme mockup elements
  ['background:#0f1018;height:28px;display:flex;align-items:center;padding:0 10px;gap:5px',
    'gf-mock-dk-bar', 'background:#0f1018;height:28px;display:flex;align-items:center;padding:0 10px;gap:5px'],
  ['background:#13151f;padding:8px;display:flex;gap:5px',
    'gf-mock-dk-body', 'background:#13151f;padding:8px;display:flex;gap:5px'],
  ['background:#1c1e2e;height:28px;display:flex;align-items:center;padding:0 10px;gap:5px',
    'gf-mock-lt-bar', 'background:#1c1e2e;height:28px;display:flex;align-items:center;padding:0 10px;gap:5px'],
  ['background:#f4f6fb;padding:8px;display:flex;gap:5px',
    'gf-mock-lt-body', 'background:#f4f6fb;padding:8px;display:flex;gap:5px'],
  ['width:28px;height:14px;background:#1a1d2e;border-radius:3px', 'gf-mock-dk-chip', 'width:28px;height:14px;background:#1a1d2e;border-radius:3px'],
  ['width:28px;height:14px;background:#272942;border-radius:3px', 'gf-mock-lt-chip', 'width:28px;height:14px;background:#272942;border-radius:3px'],
  ['flex:1;height:14px;background:#1a1d2e;border-radius:3px', 'gf-mock-dk-line', 'flex:1;height:14px;background:#1a1d2e;border-radius:3px'],
  ['flex:1;height:14px;background:#272942;border-radius:3px', 'gf-mock-lt-line', 'flex:1;height:14px;background:#272942;border-radius:3px'],
  ['border-radius:8px;overflow:hidden;border:1px solid #272a3a;font-size:0', 'gf-mock-dk-frame', 'border-radius:8px;overflow:hidden;border:1px solid #272a3a;font-size:0'],
  ['border-radius:8px;overflow:hidden;border:1px solid #e4e8f4;font-size:0', 'gf-mock-lt-frame', 'border-radius:8px;overflow:hidden;border:1px solid #e4e8f4;font-size:0'],
  ['width:36px;height:36px;border-radius:10px;background:#13151f;border:1px solid #272a3a;display:flex;align-items:center;justify-content:center;font-size:1.2rem',
    'gf-theme-icon-dk', 'width:36px;height:36px;border-radius:10px;background:#13151f;border:1px solid #272a3a;display:flex;align-items:center;justify-content:center;font-size:1.2rem'],
  ['width:36px;height:36px;border-radius:10px;background:#f4f6fb;border:1px solid #e4e8f4;display:flex;align-items:center;justify-content:center;font-size:1.2rem',
    'gf-theme-icon-lt', 'width:36px;height:36px;border-radius:10px;background:#f4f6fb;border:1px solid #e4e8f4;display:flex;align-items:center;justify-content:center;font-size:1.2rem'],

  // KPI icon backgrounds (unique colors)
  ['background:rgba(156,39,176,.1);color:#9c27b0', 'gf-kpi-ico-magenta', 'background:rgba(156,39,176,.1);color:#9c27b0'],
  ['background:rgba(255,152,0,.1);color:#ff9800',  'gf-kpi-ico-amber',   'background:rgba(255,152,0,.1);color:#ff9800'],
  ['background:rgba(255,68,68,.1);color:var(--red)','gf-kpi-ico-danger',  'background:rgba(255,68,68,.1);color:var(--red)'],
  ['background:var(--bg);color:var(--muted)',        'gf-kpi-ico-muted',   'background:var(--bg);color:var(--muted)'],

  // Entity colored spans / tags
  ['color:#9b51e0',             'gf-c-purple',     'color:#9b51e0'],
  ['color:#9b51e0;font-weight:600', 'gf-c-purple-fw', 'color:#9b51e0;font-weight:600'],
  ['color:#e53935;font-weight:600', 'gf-c-red-fw',    'color:#e53935;font-weight:600'],
  ['color:#ff7043;font-weight:600', 'gf-c-or-fw',     'color:#ff7043;font-weight:600'],
  ['color:#00b875;font-weight:600', 'gf-c-gr-fw',     'color:#00b875;font-weight:600'],
  ['color:var(--blue);font-weight:600','gf-c-bl-fw2',   'color:var(--blue);font-weight:600'],
  ['color:var(--muted);font-size:.8rem','gf-c-mu-8',   'color:var(--muted);font-size:.8rem'],

  // Font sizes (icon/emoji)
  ['font-size:1.5rem',                         'gf-fs-15',   'font-size:1.5rem'],
  ['font-size:1.6rem;margin-bottom:6px',        'gf-fs-16mb', 'font-size:1.6rem;margin-bottom:6px'],
  ['font-size:2rem;margin-bottom:4px',          'gf-fs-2mb4', 'font-size:2rem;margin-bottom:4px'],
  ['font-size:2rem;margin-bottom:8px',          'gf-fs-2mb8', 'font-size:2rem;margin-bottom:8px'],
  ['font-size:2rem;margin-bottom:10px',         'gf-fs-2mb10','font-size:2rem;margin-bottom:10px'],
  ['font-size:3rem;margin-bottom:12px;opacity:.4','gf-fs-3-fade','font-size:3rem;margin-bottom:12px;opacity:.4'],
  ['font-size:3rem;margin-bottom:16px',         'gf-fs-3mb', 'font-size:3rem;margin-bottom:16px'],

  // Font Poppins variants
  ["font-family:'Poppins',sans-serif;font-size:.78rem;font-weight:700;color:var(--text2)",
    'gf-pp-78-t2', "font-family:'Poppins',sans-serif;font-size:.78rem;font-weight:700;color:var(--text2)"],
  ["font-family:'Poppins',sans-serif;font-size:.78rem;font-weight:700;margin-bottom:8px;color:var(--text2)",
    'gf-pp-78-t2-mb', "font-family:'Poppins',sans-serif;font-size:.78rem;font-weight:700;margin-bottom:8px;color:var(--text2)"],
  ["font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px",
    'gf-pp-95-mb4', "font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px"],
  ["font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:8px",
    'gf-pp-11-t-mb', "font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:8px"],
  ["font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;margin-bottom:2px",
    'gf-pp-11-mb2', "font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;margin-bottom:2px"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#0073ea;margin-top:3px",
    'gf-pp-82-bl', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#0073ea;margin-top:3px"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#00b875;margin-top:3px",
    'gf-pp-82-gr', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#00b875;margin-top:3px"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#9b51e0;margin-top:3px",
    'gf-pp-82-pu', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#9b51e0;margin-top:3px"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#ff7043;margin-top:3px",
    'gf-pp-82-or', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.82rem;color:#ff7043;margin-top:3px"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#0073ea",
    'gf-pp-85-bl', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#0073ea"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#00b875",
    'gf-pp-85-gr', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#00b875"],
  ["font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#ff7043",
    'gf-pp-85-or', "font-family:'Poppins',sans-serif;font-weight:700;font-size:.85rem;color:#ff7043"],

  // Entity colored btn/badge variants
  ['font-size:.61rem;color:#0073ea;font-weight:700', 'gf-tag-bl-61', 'font-size:.61rem;color:#0073ea;font-weight:700'],
  ['font-size:.61rem;color:#00b875;font-weight:700', 'gf-tag-gr-61', 'font-size:.61rem;color:#00b875;font-weight:700'],
  ['font-size:.61rem;color:#9b51e0;font-weight:700', 'gf-tag-pu-61', 'font-size:.61rem;color:#9b51e0;font-weight:700'],
  ['font-size:.61rem;color:#ff7043;font-weight:700', 'gf-tag-or-61', 'font-size:.61rem;color:#ff7043;font-weight:700'],
  ['font-size:.62rem;color:#9b51e0;font-weight:700', 'gf-tag-pu-62', 'font-size:.62rem;color:#9b51e0;font-weight:700'],
  ['font-size:.68rem;font-weight:700;color:#0073ea;background:#0073ea15;padding:3px 10px;border-radius:6px',
    'gf-pill-bl', 'font-size:.68rem;font-weight:700;color:#0073ea;background:#0073ea15;padding:3px 10px;border-radius:6px'],
  ['font-size:.68rem;font-weight:700;color:#00b875;background:#00b87515;padding:3px 10px;border-radius:6px',
    'gf-pill-gr', 'font-size:.68rem;font-weight:700;color:#00b875;background:#00b87515;padding:3px 10px;border-radius:6px'],
  ['font-size:.68rem;font-weight:700;color:#9b51e0;background:#9b51e015;padding:3px 10px;border-radius:6px',
    'gf-pill-pu', 'font-size:.68rem;font-weight:700;color:#9b51e0;background:#9b51e015;padding:3px 10px;border-radius:6px'],
  ['font-size:.68rem;font-weight:700;color:#ff7043;background:#ff704315;padding:3px 10px;border-radius:6px',
    'gf-pill-or', 'font-size:.68rem;font-weight:700;color:#ff7043;background:#ff704315;padding:3px 10px;border-radius:6px'],
  ['font-size:.72rem;background:#00b875;color:white;border:none', 'gf-btn-gr-72', 'font-size:.72rem;background:#00b875;color:white;border:none'],
  ['font-size:.72rem;background:#ff7043;color:white;border:none', 'gf-btn-or-72', 'font-size:.72rem;background:#ff7043;color:white;border:none'],
  ['font-size:.72rem;white-space:nowrap;background:#9b51e0;color:white;border:none', 'gf-btn-pu-72', 'font-size:.72rem;white-space:nowrap;background:#9b51e0;color:white;border:none'],
  ['font-size:.7rem;background:#9b51e0;color:white;border:none', 'gf-btn-pu-7', 'font-size:.7rem;background:#9b51e0;color:white;border:none'],
  ['font-size:.7rem;padding:5px 14px;background:var(--green);border-color:var(--green)',
    'gf-btn-gr-act', 'font-size:.7rem;padding:5px 14px;background:var(--green);border-color:var(--green)'],
  ['font-size:.8rem;padding:10px 24px;background:#9b51e0;color:white;border:none',
    'gf-btn-pu-lg', 'font-size:.8rem;padding:10px 24px;background:#9b51e0;color:white;border:none'],
  ['font-size:.72rem;border-color:var(--orange);color:var(--orange)', 'gf-btn-or-out', 'font-size:.72rem;border-color:var(--orange);color:var(--orange)'],
  ['font-size:.72rem;white-space:nowrap;border-color:var(--green);color:var(--green)',
    'gf-btn-gr-out', 'font-size:.72rem;white-space:nowrap;border-color:var(--green);color:var(--green)'],
  ['font-size:.72rem;white-space:nowrap;color:var(--red);border-color:var(--red)',
    'gf-btn-re-out', 'font-size:.72rem;white-space:nowrap;color:var(--red);border-color:var(--red)'],
  ['font-size:.7rem;border-color:var(--green);color:var(--green)', 'gf-btn-gr-out-7', 'font-size:.7rem;border-color:var(--green);color:var(--green)'],

  // Badges
  ['background:#e3f2fd;border:1px solid #bbdefb;padding:1px 6px;border-radius:8px;font-weight:700',
    'gf-badge-lightblue', 'background:#e3f2fd;border:1px solid #bbdefb;padding:1px 6px;border-radius:8px;font-weight:700'],
  ['background:#e8f5e9;border:1px solid #c8e6c9;padding:1px 6px;border-radius:8px;font-weight:700',
    'gf-badge-lightgreen', 'background:#e8f5e9;border:1px solid #c8e6c9;padding:1px 6px;border-radius:8px;font-weight:700'],

  // Buttons misc
  ['background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--muted)', 'gf-ghost-12', 'background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--muted)'],
  ['background:none;border:none;cursor:pointer;font-size:1rem;color:var(--muted)',   'gf-ghost-10', 'background:none;border:none;cursor:pointer;font-size:1rem;color:var(--muted)'],
  ['background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--muted)', 'gf-ghost-12b','background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--muted)'],
  ['background:transparent;color:#0073ea;border:1px solid #0073ea;border-radius:6px;padding:3px 10px;font-size:.67rem;cursor:pointer',
    'gf-link-btn-xs', 'background:transparent;color:#0073ea;border:1px solid #0073ea;border-radius:6px;padding:3px 10px;font-size:.67rem;cursor:pointer'],
  ['background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:5px 12px;font-size:.7rem;cursor:pointer;color:var(--muted)',
    'gf-seg-btn', 'background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:5px 12px;font-size:.7rem;cursor:pointer;color:var(--muted)'],
  ['width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;margin-left:12px',
    'gf-modal-close', 'width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;margin-left:12px'],
  ['width:100%;padding:8px;border:2px dashed var(--border2);border-radius:var(--r);background:transparent;color:var(--blue);font-size:.72rem;font-weight:600;cursor:pointer;transition:all .2s',
    'gf-add-btn', 'width:100%;padding:8px;border:2px dashed var(--border2);border-radius:var(--r);background:transparent;color:var(--blue);font-size:.72rem;font-weight:600;cursor:pointer;transition:all .2s'],

  // Flex layouts (single use variants)
  ['display:flex;align-items:center;gap:10px;margin:20px 0 14px', 'gf-row-g10-m', 'display:flex;align-items:center;gap:10px;margin:20px 0 14px'],
  ['display:flex;align-items:center;gap:12px;margin-bottom:16px', 'gf-row-g12-mb16', 'display:flex;align-items:center;gap:12px;margin-bottom:16px'],
  ['display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.8rem;font-weight:600;padding:8px 12px;background:var(--green-bg);border:1px solid var(--green-lt);border-radius:var(--r);width:100%',
    'gf-chk-label', 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.8rem;font-weight:600;padding:8px 12px;background:var(--green-bg);border:1px solid var(--green-lt);border-radius:var(--r);width:100%'],
  ['display:flex;align-items:flex-end', 'gf-row-end-bot', 'display:flex;align-items:flex-end'],
  ['display:flex;flex-direction:column;gap:6px;font-size:.78rem', 'gf-col-6-78', 'display:flex;flex-direction:column;gap:6px;font-size:.78rem'],
  ['display:flex;gap:10px', 'gf-row-g10b', 'display:flex;gap:10px'],
  ['display:flex;gap:10px;align-items:center', 'gf-row-g10-ai', 'display:flex;gap:10px;align-items:center'],
  ['display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap', 'gf-row-g10-mb12-fw', 'display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap'],
  ['display:flex;gap:10px;justify-content:flex-end', 'gf-row-g10-je', 'display:flex;gap:10px;justify-content:flex-end'],
  ['display:flex;gap:12px;flex-wrap:wrap', 'gf-row-g12-fw', 'display:flex;gap:12px;flex-wrap:wrap'],
  ['display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px', 'gf-row-g12-fw-mb', 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px'],
  ['display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px', 'gf-row-g14-fw-mb', 'display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px'],
  ['display:flex;gap:4px;align-items:center', 'gf-row-g4-ai', 'display:flex;gap:4px;align-items:center'],
  ['display:flex;gap:4px;align-items:center;font-size:.68rem;color:var(--muted)', 'gf-row-g4-mu', 'display:flex;gap:4px;align-items:center;font-size:.68rem;color:var(--muted)'],
  ['display:flex;gap:6px;margin-bottom:12px', 'gf-row-g6-mb12', 'display:flex;gap:6px;margin-bottom:12px'],
  ['display:flex;gap:8px;align-items:center;flex-wrap:wrap', 'gf-row-g8-ai-fw', 'display:flex;gap:8px;align-items:center;flex-wrap:wrap'],
  ['display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap', 'gf-row-g8-mb12-fw', 'display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap'],
  ['display:flex;gap:8px;justify-content:flex-end;margin-top:16px;border-top:1px solid var(--border);padding-top:14px',
    'gf-footer-btns', 'display:flex;gap:8px;justify-content:flex-end;margin-top:16px;border-top:1px solid var(--border);padding-top:14px'],
  ['display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap', 'gf-row-g8-mb10', 'display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap'],
  ['display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center', 'gf-row-g8-mb12', 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center'],
  ['display:flex;gap:8px;margin-bottom:14px', 'gf-row-g8-mb14', 'display:flex;gap:8px;margin-bottom:14px'],
  ['display:flex;gap:8px;margin-left:auto', 'gf-row-g8-ml', 'display:flex;gap:8px;margin-left:auto'],
  ['display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--border);padding-top:14px',
    'gf-form-footer', 'display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--border);padding-top:14px'],
  ['display:flex;justify-content:space-between;align-items:center;margin-bottom:14px', 'gf-row-sb-14b', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px'],
  ['display:flex;justify-content:space-between;align-items:center;margin-bottom:20px', 'gf-row-sb-20', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px'],
  ['display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border)',
    'gf-panel-hdr', 'display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border)'],
  ['display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px;font-weight:700',
    'gf-total-row', 'display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px;font-weight:700'],
  ['display:flex;justify-content:space-between;font-size:.65rem;font-weight:600', 'gf-row-sb-65', 'display:flex;justify-content:space-between;font-size:.65rem;font-weight:600'],

  // Grid layouts
  ['display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px', 'gf-g3-mb16', 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px'],
  ['display:grid;grid-template-columns:1fr 1fr;gap:10px', 'gf-g2-10', 'display:grid;grid-template-columns:1fr 1fr;gap:10px'],
  ['display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;font-size:.78rem;margin-bottom:16px',
    'gf-g2-preview', 'display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;font-size:.78rem;margin-bottom:16px'],
  ['display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px', 'gf-g2-mb10', 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px'],
  ['display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px', 'gf-g2-mb16', 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px'],
  ['display:grid;grid-template-columns:1fr 1fr;gap:8px', 'gf-g2-8', 'display:grid;grid-template-columns:1fr 1fr;gap:8px'],
  ['display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px', 'gf-g4-2111', 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px'],
  ['display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start', 'gf-g2-sidebar', 'display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start'],
  ['display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px', 'gf-g3-mb10', 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px'],
  ['grid-column:1/-1', 'gf-full-col', 'grid-column:1/-1'],

  // Flex misc
  ['flex-shrink:0', 'gf-fs0', 'flex-shrink:0'],
  ['flex:1;min-width:120px;background:var(--blue-bg);border-radius:var(--r);padding:12px;text-align:center',
    'gf-flex-kpi', 'flex:1;min-width:120px;background:var(--blue-bg);border-radius:var(--r);padding:12px;text-align:center'],
  ['flex:1;min-width:200px', 'gf-flex1-w200', 'flex:1;min-width:200px'],

  // Misc layout
  ['height:6px;background:var(--bg);border-radius:3px;overflow:hidden;margin-bottom:6px',
    'gf-prog-bg', 'height:6px;background:var(--bg);border-radius:3px;overflow:hidden;margin-bottom:6px'],
  ['width:100%;height:6px;border-radius:3px;background:var(--border2);overflow:hidden;margin-top:5px',
    'gf-prog-bg2', 'width:100%;height:6px;border-radius:3px;background:var(--border2);overflow:hidden;margin-top:5px'],
  ['overflow-x:auto;margin-bottom:18px', 'gf-ox-mb18', 'overflow-x:auto;margin-bottom:18px'],
  ['overflow-x:auto;padding:0 14px 14px', 'gf-ox-p', 'overflow-x:auto;padding:0 14px 14px'],
  ['padding:0;overflow-x:auto', 'gf-p0-ox', 'padding:0;overflow-x:auto'],
  ['position:relative;display:inline-block', 'gf-pos-rel-ib', 'position:relative;display:inline-block'],
  ['position:sticky;top:0', 'gf-sticky', 'position:sticky;top:0'],
  ['width:100%;border-collapse:collapse;font-size:.72rem', 'gf-tbl-base', 'width:100%;border-collapse:collapse;font-size:.72rem'],

  // Padding variants
  ['padding:14px 18px;display:flex;align-items:center;gap:12px', 'gf-p14-row', 'padding:14px 18px;display:flex;align-items:center;gap:12px'],
  ['padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0',
    'gf-modal-hdr', 'padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0'],
  ['padding:16px;display:flex;flex-direction:column;gap:14px', 'gf-p16-col', 'padding:16px;display:flex;flex-direction:column;gap:14px'],
  ['padding:18px', 'gf-p18', 'padding:18px'],
  ['padding:20px 18px', 'gf-p20-18', 'padding:20px 18px'],
  ['padding:20px 18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:600px',
    'gf-theme-grid', 'padding:20px 18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:600px'],
  ['padding:20px;text-align:center;color:var(--muted);font-size:.78rem', 'gf-empty-pd', 'padding:20px;text-align:center;color:var(--muted);font-size:.78rem'],
  ['padding:4px 10px;border:1px solid var(--border);border-radius:6px;font-size:.7rem;background:var(--bg);color:var(--text);width:180px',
    'gf-inp-srch', 'padding:4px 10px;border:1px solid var(--border);border-radius:6px;font-size:.7rem;background:var(--bg);color:var(--text);width:180px'],
  ['padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:200px;background:var(--white);color:var(--text)',
    'gf-inp-200', 'padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:200px;background:var(--white);color:var(--text)'],
  ['padding:5px 8px;display:flex;align-items:center;flex-shrink:0', 'gf-logout-btn', 'padding:5px 8px;display:flex;align-items:center;flex-shrink:0'],
  ['padding:7px 12px;font-size:.78rem;color:var(--blue)', 'gf-tab-bl', 'padding:7px 12px;font-size:.78rem;color:var(--blue)'],
  ['padding:7px 12px;font-size:.78rem;color:var(--orange)', 'gf-tab-or', 'padding:7px 12px;font-size:.78rem;color:var(--orange)'],
  ['padding:8px 10px 6px', 'gf-p8-10-6', 'padding:8px 10px 6px'],
  ['padding:8px 12px;font-size:.78rem;color:var(--text)', 'gf-p8-12-txt', 'padding:8px 12px;font-size:.78rem;color:var(--text)'],
  ['padding:8px;display:flex;flex-direction:column;gap:14px', 'gf-p8-col', 'padding:8px;display:flex;flex-direction:column;gap:14px'],

  // Font misc
  ['font-size:.65rem;color:var(--blue);text-transform:uppercase;letter-spacing:.04em',
    'gf-fs65-bl-ttu', 'font-size:.65rem;color:var(--blue);text-transform:uppercase;letter-spacing:.04em'],
  ['font-size:.65rem;color:var(--muted);background:var(--blue-bg);padding:3px 10px;border-radius:20px;border:1px solid var(--blue-lt)',
    'gf-hint-pill', 'font-size:.65rem;color:var(--muted);background:var(--blue-bg);padding:3px 10px;border-radius:20px;border:1px solid var(--blue-lt)'],
  ['font-size:.65rem;color:var(--muted);margin-left:4px', 'gf-fs65-mu-ml', 'font-size:.65rem;color:var(--muted);margin-left:4px'],
  ['font-size:.65rem;padding:4px 10px', 'gf-fs65-p', 'font-size:.65rem;padding:4px 10px'],
  ['font-size:.66rem;height:26px;padding:0 12px', 'gf-btn-xs', 'font-size:.66rem;height:26px;padding:0 12px'],
  ['font-size:.67rem;color:var(--blue)', 'gf-fs67-bl', 'font-size:.67rem;color:var(--blue)'],
  ['font-size:.68rem;color:var(--muted);font-weight:600', 'gf-fs68-mu-fw', 'font-size:.68rem;color:var(--muted);font-weight:600'],
  ['font-size:.68rem;color:var(--muted);margin-top:4px', 'gf-fs68-mu-mt', 'font-size:.68rem;color:var(--muted);margin-top:4px'],
  ['font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em',
    'gf-sec-label', 'font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em'],
  ['font-size:.68rem;height:28px;padding:0 12px', 'gf-btn-h28', 'font-size:.68rem;height:28px;padding:0 12px'],
  ['font-size:.68rem;padding:5px 10px;color:var(--muted)', 'gf-fs68-p-mu', 'font-size:.68rem;padding:5px 10px;color:var(--muted)'],
  ['font-size:.72rem;color:#8b8fb5;margin-bottom:24px', 'gf-login-sub', 'font-size:.72rem;color:#8b8fb5;margin-bottom:24px'],
  ['font-size:.72rem;color:var(--muted);margin-bottom:18px', 'gf-fs72-mu-mb18', 'font-size:.72rem;color:var(--muted);margin-bottom:18px'],
  ['font-size:.72rem;color:var(--muted);margin-top:18px', 'gf-fs72-mu-mt18', 'font-size:.72rem;color:var(--muted);margin-top:18px'],
  ['font-size:.72rem;cursor:pointer', 'gf-fs72-ptr', 'font-size:.72rem;cursor:pointer'],
  ['font-size:.72rem;font-weight:600;color:var(--text);margin-left:10px', 'gf-fs72-fw-ml', 'font-size:.72rem;font-weight:600;color:var(--text);margin-left:10px'],
  ['font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px',
    'gf-cap-label', 'font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px'],
  ['font-size:.72rem;font-weight:700;color:var(--purple);letter-spacing:.05em', 'gf-pu-label', 'font-size:.72rem;font-weight:700;color:var(--purple);letter-spacing:.05em'],
  ['font-size:.72rem;width:100%', 'gf-fs72-w100', 'font-size:.72rem;width:100%'],
  ['font-size:.75rem;color:var(--muted);text-align:center;padding:20px', 'gf-empty-75', 'font-size:.75rem;color:var(--muted);text-align:center;padding:20px'],
  ['font-size:.78rem;font-weight:600;color:var(--text)', 'gf-fs78-fw', 'font-size:.78rem;font-weight:600;color:var(--text)'],
  ['font-size:.78rem;padding:8px 20px;white-space:nowrap', 'gf-btn-78-p', 'font-size:.78rem;padding:8px 20px;white-space:nowrap'],
  ['font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:6px;padding-bottom:6px;border-bottom:2px solid var(--border2);display:flex;align-items:center;gap:6px;color:var(--text)',
    'gf-section-bar', 'font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:6px;padding-bottom:6px;border-bottom:2px solid var(--border2);display:flex;align-items:center;gap:6px;color:var(--text)'],
  ['font-size:.7rem;padding:5px 14px', 'gf-fs7-p14', 'font-size:.7rem;padding:5px 14px'],
  ['font-size:.82rem;color:var(--muted);max-width:400px;margin:0 auto 24px;line-height:1.5',
    'gf-subtitle', 'font-size:.82rem;color:var(--muted);max-width:400px;margin:0 auto 24px;line-height:1.5'],
  ['font-size:.82rem;color:var(--muted,#8b8fb5)', 'gf-loader-txt', 'font-size:.82rem;color:var(--muted,#8b8fb5)'],
  ['font-size:.85rem;font-weight:600;margin-bottom:6px', 'gf-fs85-fw-mb', 'font-size:.85rem;font-weight:600;margin-bottom:6px'],
  ['font-size:.62rem;height:24px;padding:0 10px', 'gf-btn-62-h24', 'font-size:.62rem;height:24px;padding:0 10px'],
  ['font-weight:400;color:var(--muted)', 'gf-fw4-mu', 'font-weight:400;color:var(--muted)'],
  ['font-weight:400;color:var(--muted);font-size:.62rem;text-transform:none', 'gf-fw4-mu-62', 'font-weight:400;color:var(--muted);font-size:.62rem;text-transform:none'],
  ['font-weight:600;font-size:.78rem', 'gf-fw6-78', 'font-weight:600;font-size:.78rem'],
  ['font-weight:600;font-size:.85rem;margin-bottom:4px', 'gf-fw6-85-mb', 'font-weight:600;font-size:.85rem;margin-bottom:4px'],
  ['font-weight:700;font-size:.78rem;color:var(--text);cursor:pointer;user-select:none',
    'gf-collapse-title', 'font-weight:700;font-size:.78rem;color:var(--text);cursor:pointer;user-select:none'],
  ['font-weight:700;font-size:.78rem;margin-bottom:8px;color:var(--text)', 'gf-fw7-78-mb', 'font-weight:700;font-size:.78rem;margin-bottom:8px;color:var(--text)'],
  ['font-weight:700;font-size:.95rem', 'gf-fw7-95', 'font-weight:700;font-size:.95rem'],

  // Margin misc
  ['margin-bottom:0', 'gf-mb0', 'margin-bottom:0'],
  ['margin-bottom:6px;display:block', 'gf-mb6-blk', 'margin-bottom:6px;display:block'],
  ['margin-left:8px;color:var(--blue)', 'gf-ml8-bl', 'margin-left:8px;color:var(--blue)'],
  ['margin-top:10px', 'gf-mt10', 'margin-top:10px'],
  ['margin-top:10px;padding:10px 14px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--text2);line-height:1.5',
    'gf-info-box', 'margin-top:10px;padding:10px 14px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--text2);line-height:1.5'],
  ['margin-top:16px;border-top:1px solid var(--border);padding-top:14px;display:flex;gap:8px',
    'gf-actions-row', 'margin-top:16px;border-top:1px solid var(--border);padding-top:14px;display:flex;gap:8px'],
  ['margin-top:4px', 'gf-mt4', 'margin-top:4px'],
  ['margin-top:6px;font-size:.7rem;opacity:.8', 'gf-mt6-op', 'margin-top:6px;font-size:.7rem;opacity:.8'],
  ['margin-top:auto', 'gf-mt-auto', 'margin-top:auto'],
  ['margin:0;font-size:1rem;color:var(--text)', 'gf-m0-1rem', 'margin:0;font-size:1rem;color:var(--text)'],
  ['margin:10px 0 10px', 'gf-m10-v', 'margin:10px 0 10px'],

  // Border misc
  ['border-bottom:2px solid var(--border);color:var(--muted)', 'gf-bb-mu', 'border-bottom:2px solid var(--border);color:var(--muted)'],
  ['border-left:1px solid var(--border);height:22px;margin:0 4px', 'gf-sep-v', 'border-left:1px solid var(--border);height:22px;margin:0 4px'],
  ['background:var(--bg);font-weight:700;border-top:2px solid var(--border2)', 'gf-tfoot-row', 'background:var(--bg);font-weight:700;border-top:2px solid var(--border2)'],

  // Width (table columns)
  ['width:32px', 'gf-w32', 'width:32px'],
  ['width:55px;text-align:center', 'gf-w55-c', 'width:55px;text-align:center'],
  ['width:65px', 'gf-w65', 'width:65px'],
  ['width:70px', 'gf-w70', 'width:70px'],
  ['width:75px;color:#0073ea', 'gf-w75-bl', 'width:75px;color:#0073ea'],
  ['width:75px;color:#00b875', 'gf-w75-gr', 'width:75px;color:#00b875'],
  ['width:75px;color:#9b51e0', 'gf-w75-pu', 'width:75px;color:#9b51e0'],
  ['width:75px;color:#ff7043', 'gf-w75-or', 'width:75px;color:#ff7043'],
  ['width:85px;color:#0073ea', 'gf-w85-bl', 'width:85px;color:#0073ea'],
  ['width:85px;color:#00b875', 'gf-w85-gr', 'width:85px;color:#00b875'],
  ['width:85px;color:#9b51e0', 'gf-w85-pu', 'width:85px;color:#9b51e0'],
  ['width:85px;color:#e53935', 'gf-w85-re', 'width:85px;color:#e53935'],
  ['width:85px;color:#ff7043', 'gf-w85-or', 'width:85px;color:#ff7043'],
  ['width:88px', 'gf-w88', 'width:88px'],
  ['width:88px;background:var(--orange-lt);color:var(--orange)', 'gf-w88-or', 'width:88px;background:var(--orange-lt);color:var(--orange)'],
  ['width:90px;background:var(--blue-bg);color:var(--blue)', 'gf-w90-bl', 'width:90px;background:var(--blue-bg);color:var(--blue)'],
  ['width:90px;text-align:center', 'gf-w90-c', 'width:90px;text-align:center'],
  ['width:95px', 'gf-w95', 'width:95px'],
  ['width:110px', 'gf-w110', 'width:110px'],
  ['width:130px', 'gf-w130', 'width:130px'],
  ['width:130px;color:var(--orange)', 'gf-w130-or', 'width:130px;color:var(--orange)'],
  ['width:150px', 'gf-w150', 'width:150px'],
  ['width:160px', 'gf-w160', 'width:160px'],
  ['width:180px', 'gf-w180', 'width:180px'],
  ['width:42px;color:var(--orange)', 'gf-w42-or', 'width:42px;color:var(--orange)'],
  ['min-width:180px', 'gf-mw180', 'min-width:180px'],
  ['min-width:680px', 'gf-mw680', 'min-width:680px'],

  // App loader inner elements
  ['width:36px;height:36px;border:3px solid var(--border,#e4e8f4);border-top-color:var(--blue,#0073ea);border-radius:50%;animation:gf-spin 1s linear infinite',
    'gf-spinner', 'width:36px;height:36px;border:3px solid var(--border,#e4e8f4);border-top-color:var(--blue,#0073ea);border-radius:50%;animation:gf-spin 1s linear infinite'],

  // Text center misc
  ['text-align:center;font-size:.7rem', 'gf-tc-7', 'text-align:center;font-size:.7rem'],
];

// ================================================================
// Generar el bloque CSS
// ================================================================
const cssRules = MAP.map(([, cls, decl]) => `.${cls}{${decl}}`).join('\n');
const cssBlock = `\n/* ================================================================\n   CSP INLINE-STYLE FINAL — todas las clases restantes (2026-03-27)\n   ================================================================ */\n${cssRules}\n`;

let css = fs.readFileSync(cssPath, 'utf8');
css += cssBlock;
fs.writeFileSync(cssPath, css, 'utf8');
console.log(`CSS: ${MAP.length} clases añadidas`);

// ================================================================
// Reemplazar en HTML
// ================================================================
let converted = 0;
for (const [styleValue, className] of MAP) {
  const escaped = styleValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`style="${escaped}"`, 'g');
  let count = 0;
  html = html.replace(re, () => { count++; return `data-was-style="${className}"`; });
  if (count > 0) { converted += count; console.log(`  ✓ [${count}x] ${className}`); }
}

// Segunda pasada: data-was-style → class
const lines = html.split('\n');
html = lines.map(line => {
  if (!line.includes('data-was-style=')) return line;
  const classes = [];
  line = line.replace(/data-was-style="([^"]+)"/g, (_, cls) => { classes.push(cls); return ''; });
  if (!classes.length) return line;
  if (/class="([^"]*)"/.test(line)) {
    line = line.replace(/class="([^"]*)"/, (_, ex) => `class="${(ex + ' ' + classes.join(' ')).trim()}"`);
  } else {
    line = line.replace(/(<\w+)(\s|>)/, (m, tag, after) => `${tag} class="${classes.join(' ')}"${after}`);
  }
  return line;
}).join('\n');

fs.writeFileSync(htmlPath, html, 'utf8');

const after = (html.match(/style="/g) || []).length;
console.log(`\nAntes: ${before} | Después: ${after} | Convertidos: ${before - after}`);
