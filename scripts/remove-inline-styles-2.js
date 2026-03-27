/**
 * remove-inline-styles-2.js
 * Segunda pasada: elementos con id="" → genera reglas #id{} en CSS y elimina style=""
 * Uso: node scripts/remove-inline-styles-2.js
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'assets/css/styles.css');

let html = fs.readFileSync(htmlPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

const before = (html.match(/style="/g) || []).length;

// Regex: captura tag con id Y style (en cualquier orden)
// Captura: id, style value, tag completo (hasta >)
const tagRe = /<([a-z][a-z0-9]*)([^>]*?)>/gi;

const idStyleRules = [];
let replaced = 0;

html = html.replace(tagRe, (fullTag, tagName, attrs) => {
  // Extrae id
  const idMatch = attrs.match(/\bid="([^"]+)"/);
  // Extrae style
  const styleMatch = attrs.match(/\bstyle="([^"]+)"/);

  if (!idMatch || !styleMatch) return fullTag; // nada que hacer

  const id = idMatch[1];
  const styleVal = styleMatch[1];

  // Guarda la regla CSS
  idStyleRules.push(`#${id}{${styleVal}}`);

  // Quita style="" del tag
  const newAttrs = attrs.replace(/\s*style="[^"]*"/, '');
  replaced++;
  return `<${tagName}${newAttrs}>`;
});

// Añade las reglas al CSS (sección dedicada)
if (idStyleRules.length > 0) {
  const section = `\n/* ================================================================\n   CSP INLINE-STYLE PASS-2 — reglas por ID (autogeneradas ${new Date().toISOString().slice(0,10)})\n   ================================================================ */\n${idStyleRules.join('\n')}\n`;
  css += section;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log(`Reglas CSS generadas: ${idStyleRules.length}`);
}

fs.writeFileSync(htmlPath, html, 'utf8');

const after = (html.match(/style="/g) || []).length;
console.log(`\nAntes: ${before} | Después: ${after} | Eliminados: ${before - after}`);
