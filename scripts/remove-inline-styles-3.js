/**
 * remove-inline-styles-3.js
 * Tercera pasada: patrones 2+ adicionales que quedaron en la segunda ronda
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const before = (html.match(/style="/g) || []).length;

const STYLE_TO_CLASS = {
  'flex:1;height:1px;background:var(--border2)': 'gf-divider-line',
  'flex:1;background:#fff;border-radius:4px;height:40px;border:1px solid #e4e8f4': 'gf-swatch-lt',
  'flex:1;background:#1c1f2e;border-radius:4px;height:40px;border:1px solid #272a3a': 'gf-swatch-dk',
  'display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-bottom:14px': 'gf-g2-1',
  'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px': 'gf-g2-14',
  'display:flex;justify-content:space-between': 'gf-row-jb',
  'display:flex;justify-content:flex-end;gap:10px;margin-top:6px': 'gf-row-end',
  'display:flex;gap:6px;align-items:center;margin-bottom:14px;flex-wrap:wrap;padding:10px 14px;background:var(--white);border:1px solid var(--border);border-radius:10px': 'gf-filter-bar',
  'display:flex;flex-direction:column;gap:12px': 'gf-col-12',
  'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px': 'gf-row-sb-8',
  'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px': 'gf-row-sb-14',
  'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px': 'gf-row-sb-10',
  'display:flex;align-items:center;gap:10px;margin-bottom:12px': 'gf-row-g10',
  'cursor:pointer;user-select:none;padding:8px 0;display:flex;align-items:center;gap:8px': 'gf-collapse-row',
  'border-left:3px solid #9b51e0': 'gf-bl-purple',
  'background:var(--white);border-radius:14px;padding:24px;width:420px;max-width:90vw;box-shadow:0 12px 40px rgba(0,0,0,.2)': 'gf-modal-box',
  'background:var(--purple-bg)': 'gf-bg-purple',
  'background:var(--purple);width:55%': 'gf-bar-purple',
  'background:var(--green-bg)': 'gf-bg-green',
  'background:var(--green);width:99%': 'gf-bar-99',
  'background:var(--blue-bg)': 'gf-bg-blue',
  'background:transparent;color:#0073ea;border:1px solid #0073ea;border-radius:6px;padding:4px 10px;font-size:.68rem;cursor:pointer': 'gf-btn-link-sm',
  'background:rgba(99,102,241,.1);color:#6366f1': 'gf-badge-indigo',
  'background:#ff704322;color:#ff7043': 'gf-kpi-ico-orange',
  'background:#e5393522;color:#e53935': 'gf-kpi-ico-red',
  'background:#00b87522;color:#00b875': 'gf-kpi-ico-green',
  'background:#0073ea;width:0%': 'gf-bar-blue0',
  'background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:.72rem;font-weight:600;cursor:pointer': 'gf-btn-blue-sm',
  'background:#0073ea22;color:#0073ea': 'gf-kpi-ico-blue',
  'width:9px;height:9px;border-radius:50%;background:#0073ea;display:inline-block': 'gf-dot-blue',
  'width:9px;height:9px;border-radius:50%;background:#00b875;display:inline-block;margin-left:6px': 'gf-dot-green',
  'width:9px;height:9px;border-radius:50%;background:#9b51e0;display:inline-block;margin-left:6px': 'gf-dot-purple',
  'width:9px;height:9px;border-radius:50%;background:#e53935;display:inline-block;margin-left:6px': 'gf-dot-red',
  'width:9px;height:9px;border-radius:50%;background:#ff7043;display:inline-block;margin-left:6px': 'gf-dot-orange',
};

let totalConverted = 0;

for (const [styleValue, className] of Object.entries(STYLE_TO_CLASS)) {
  const escaped = styleValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`style="${escaped}"`, 'g');

  let count = 0;
  html = html.replace(re, () => { count++; return `data-was-style="${className}"`; });
  if (count > 0) {
    totalConverted += count;
    console.log(`  ✓ [${count}x] ${className}`);
  }
}

// Segunda pasada: data-was-style → class
const lines = html.split('\n');
const result = lines.map(line => {
  if (!line.includes('data-was-style=')) return line;
  const classes = [];
  line = line.replace(/data-was-style="([^"]+)"/g, (_, cls) => { classes.push(cls); return ''; });
  if (!classes.length) return line;
  if (/class="([^"]*)"/.test(line)) {
    line = line.replace(/class="([^"]*)"/, (_, existing) => `class="${(existing + ' ' + classes.join(' ')).trim()}"`);
  } else {
    line = line.replace(/(<\w+)(\s|>)/, (m, tag, after) => `${tag} class="${classes.join(' ')}"${after}`);
  }
  return line;
});

html = result.join('\n');
fs.writeFileSync(htmlPath, html, 'utf8');

const after = (html.match(/style="/g) || []).length;
console.log(`\nAntes: ${before} | Después: ${after} | Convertidos: ${before - after}`);
