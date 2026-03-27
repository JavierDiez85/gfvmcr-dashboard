/**
 * remove-inline-styles.js
 * Sustituye atributos style="" en index.html por clases CSS utilitarias gf-*
 * Uso: node scripts/remove-inline-styles.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const before = (html.match(/style="/g) || []).length;

// ================================================================
// Mapa: valor exacto del atributo style → nombre(s) de clase CSS
// ================================================================
const STYLE_TO_CLASS = {
  // Display / visibility
  'display:none': 'gf-dn',
  'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center': 'gf-modal-ov',
  'display:none;margin-top:12px': 'gf-dn-mt12',
  'display:none;margin-top:10px;padding:10px;border-radius:8px;font-size:.72rem': 'gf-dn-err',
  'display:none;align-items:center;gap:8px;padding:6px 14px;margin-bottom:8px;background:rgba(0,115,234,.06);border:1px solid rgba(0,115,234,.15);border-radius:8px': 'gf-info-band',
  'position:sticky;top:0;z-index:2': 'gf-sticky-h',

  // Grid
  'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px': 'gf-g4',
  'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px': 'gf-g2',

  // Flex
  'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px': 'gf-row-sb',
  'display:flex;gap:4px;align-items:center;font-size:.7rem;color:var(--muted)': 'gf-row-muted',
  'flex:1': 'gf-flex1',
  'flex:1;min-width:180px': 'gf-flex1-w180',
  'flex:1;min-width:120px;background:var(--bg);border-radius:var(--r);padding:12px;text-align:center': 'gf-flex1-w120',

  // Card
  'background:var(--card);border-radius:12px;padding:14px;border:1px solid var(--border)': 'gf-card-box',

  // Progress bars
  'background:var(--green);width:0%': 'gf-bar-green',
  'background:var(--red);width:0%': 'gf-bar-red',
  'background:var(--green);width:100%': 'gf-bar-full',

  // Buttons
  'width:100%;padding:10px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.8rem;cursor:pointer;font-family:\'Figtree\',sans-serif': 'gf-btn-primary-full',
  'cursor:pointer;font-size:1.1rem;color:var(--muted)': 'gf-icon-btn',

  // Inputs / selects
  'padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)': 'gf-sel-a',
  'padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text)': 'gf-sel-b',
  'padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text)': 'gf-sel-c',
  'padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:.72rem;background:var(--bg);color:var(--text);min-width:180px': 'gf-sel-d',
  'width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:.72rem;background:var(--bg);color:var(--text);margin-bottom:6px': 'gf-inp-a',
  'width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;resize:vertical;background:var(--white);color:var(--text);box-sizing:border-box': 'gf-inp-b',
  'font-size:.75rem;width:100%;padding:8px 10px;border:1px solid var(--border2);border-radius:8px;background:var(--white)': 'gf-inp-c',
  'font-size:.68rem;height:28px': 'gf-inp-h28',

  // Widths
  'width:36px': 'gf-w36',
  'width:40px': 'gf-w40',
  'width:50px': 'gf-w50',
  'width:60px': 'gf-w60',
  'width:100px': 'gf-w100',
  'width:120px': 'gf-w120',
  'width:200px': 'gf-w200',
  'min-width:900px': 'gf-mw900',

  // Padding
  'padding:0': 'gf-p0',
  'padding:8px 12px': 'gf-p8-12',
  'padding:12px 16px': 'gf-p12-16',
  'padding:16px 18px': 'gf-p16-18',
  'padding:12px;margin-bottom:14px': 'gf-p12-mb14',
  'padding:8px 6px;text-align:right': 'gf-td-r',

  // Margin
  'margin-bottom:12px': 'gf-mb12',
  'margin-top:14px': 'gf-mt14',
  'margin:24px 0 18px;border-top:2px solid var(--border);position:relative': 'gf-divider',

  // Typography
  'text-transform:uppercase': 'gf-ttu',
  'font-weight:700;font-size:.85rem': 'gf-fw7-85',
  'font-weight:700;font-size:.82rem': 'gf-fw7-82',
  'font-size:1rem;font-weight:700;color:var(--text)': 'gf-fw7-1',
  'font-size:.6rem;font-weight:400;color:var(--muted)': 'gf-fs6-muted',
  'font-size:.67rem;color:var(--muted);margin-bottom:4px': 'gf-label-muted',
  'font-size:.72rem;font-weight:600;color:var(--text2);display:block;margin-bottom:6px': 'gf-text2-label',
  'font-size:.72rem;font-weight:600;color:var(--text)': 'gf-text-label',
  'font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em': 'gf-muted-65-ttu',
  'font-size:.75rem;color:var(--muted);margin:0 0 10px;line-height:1.6': 'gf-muted-75-mb',
  'font-size:.75rem;font-weight:600;margin-bottom:8px': 'gf-section-title',
  'margin-top:10px;font-size:.68rem;color:var(--muted);background:var(--blue-bg);border:1px solid var(--blue-lt);border-radius:8px;padding:8px 12px': 'gf-info-note',
  'font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700': 'gf-poppins-95',
  'font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:14px': 'gf-poppins-95-mb',
  'font-family:\'Poppins\',sans-serif;font-size:1rem;font-weight:700;margin-bottom:14px': 'gf-poppins-1-mb',
  'font-family:\'Poppins\',sans-serif;font-size:1.05rem;font-weight:700;margin-bottom:16px': 'gf-poppins-105-mb',
  'text-align:center;color:var(--muted);padding:30px;font-size:.78rem': 'gf-empty-lg',
  'text-align:center;color:var(--muted);padding:20px': 'gf-empty-md',
  'text-align:center;color:var(--muted);padding:12px;font-size:.75rem': 'gf-empty-sm',

  // Colors
  'color:#0073ea;font-weight:600': 'gf-c-blue-fw',
  'color:#00b875': 'gf-c-green',
  'color:#ff7043': 'gf-c-orange',
  'color:var(--yellow)': 'gf-c-yellow',
  'font-size:.62rem;color:#ff7043;font-weight:700': 'gf-c-orange-fw',
  'font-size:.62rem;color:#00b875;font-weight:700': 'gf-c-green-fw',
  'font-size:.62rem;color:#0073ea;font-weight:700': 'gf-c-blue-fw2',

  // Badges
  'background:#fce4ec;color:#e53935': 'gf-badge-err',
  'background:var(--yellow-bg);color:var(--yellow)': 'gf-badge-yellow',
  'font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(0,115,234,.12);color:#0073ea;margin-left:6px': 'gf-badge-blue',
  'font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(255,112,67,.12);color:#ff7043;margin-left:6px': 'gf-badge-orange',
  'font-size:.7rem;border-color:#9b51e0;color:#9b51e0': 'gf-tag-wb',
  'font-size:.62rem;padding:3px 7px;border-color:var(--purple);color:var(--purple)': 'gf-tag-purple',

  // Border-left
  'border-left:3px solid #0073ea': 'gf-bl-blue',
  'border-left:3px solid #00b875': 'gf-bl-green',
  'border-left:3px solid #ff7043': 'gf-bl-orange',

  // Fieldset legend
  'position:absolute;top:-10px;left:20px;background:var(--bg);padding:0 10px;font-size:.7rem;color:var(--muted);font-weight:600;text-transform:uppercase': 'gf-legend',
};

// ================================================================
// Función: reemplaza style="VALUE" → agrega clase(s) al elemento
// ================================================================
function replaceStyle(tag, styleValue, className) {
  // Normaliza comillas tipográficas que puedan estar en el HTML
  const escapedValue = styleValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Reemplaza style="VALUE" dentro de un tag; agrega class si no existe
  const re = new RegExp(`(style="${escapedValue}")`, 'g');
  return tag.replace(re, (match, p1, offset, str) => {
    return `data-style-replaced="${className}"`;
  });
}

// ================================================================
// Proceso: reemplaza cada style="" reconocido
// ================================================================
let converted = 0;

for (const [styleValue, className] of Object.entries(STYLE_TO_CLASS)) {
  // Construimos regex que busca style="VALUE" exacto (con posibles variantes de comillas)
  const escaped = styleValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`style="${escaped}"`, 'g');

  let count = 0;
  html = html.replace(re, (match, offset) => {
    count++;
    return `data-was-style="${className}"`;
  });
  if (count > 0) {
    converted += count;
    console.log(`  ✓ [${count}x] ${className}`);
  }
}

// ================================================================
// Segunda pasada: convertir data-was-style → agregar class al tag
// ================================================================
// Estrategia: procesar línea a línea
const lines = html.split('\n');
const result = lines.map(line => {
  // Si la línea tiene data-was-style, extrae los nombres de clase
  if (!line.includes('data-was-style=')) return line;

  // Extrae todos los data-was-style de la línea
  const classes = [];
  line = line.replace(/data-was-style="([^"]+)"/g, (_, cls) => {
    classes.push(cls);
    return ''; // lo quitamos temporalmente
  });

  if (classes.length === 0) return line;

  // Agrega las clases al atributo class del elemento
  // Si ya tiene class="...", anexa; si no, crea
  if (/class="([^"]*)"/.test(line)) {
    line = line.replace(/class="([^"]*)"/, (_, existing) => {
      const all = (existing + ' ' + classes.join(' ')).trim();
      return `class="${all}"`;
    });
  } else {
    // Inserta class después del tag de apertura (ej: <div, <button, <input, <span, etc.)
    line = line.replace(/(<\w+)(\s)/, `$1 class="${classes.join(' ')}"$2`);
  }

  return line;
});

html = result.join('\n');

// ================================================================
// Guardar resultado
// ================================================================
fs.writeFileSync(filePath, html, 'utf8');

const after = (html.match(/style="/g) || []).length;
console.log(`\nAntes: ${before} | Después: ${after} | Convertidos: ${before - after}`);
