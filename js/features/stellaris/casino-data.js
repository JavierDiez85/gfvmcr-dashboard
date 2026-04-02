// GF — Stellaris Casino: Data Layer + Parsers
(function(window) {
  'use strict';

  const CASINO_KEY = 'gf_casino';

  // ═══════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════

  function casinoLoad() {
    return (typeof DB !== 'undefined' && DB.get(CASINO_KEY)) || { cortes: [] };
  }

  function casinoSave(data) {
    if (typeof DB !== 'undefined') DB.set(CASINO_KEY, data);
  }

  function casinoAddCorte(corte) {
    const data = casinoLoad();
    // Replace if same id exists (re-upload)
    const idx = data.cortes.findIndex(c => c.id === corte.id);
    if (idx >= 0) data.cortes[idx] = corte;
    else data.cortes.push(corte);
    // Sort by date desc
    data.cortes.sort((a, b) => (b.fecha + b.turno).localeCompare(a.fecha + a.turno));
    casinoSave(data);
    return data;
  }

  function casinoDeleteCorte(id) {
    const data = casinoLoad();
    data.cortes = data.cortes.filter(c => c.id !== id);
    casinoSave(data);
    return data;
  }

  // ═══════════════════════════════════════
  // PDF PARSER — Resumen de Caja por Hora
  // ═══════════════════════════════════════

  function parseCasinoPDF(text) {
    const corte = {
      id: '',
      fecha: '',
      turno: '',
      sala: '',
      // Caja
      entradas: 0,
      salidas: 0,
      retencion_premios: 0,
      resultado_caja: 0,
      // Maquinas
      jugado: 0,
      netwin: 0,
      hold_pct: 0,
      terminales: 0,
      netwin_terminal: 0,
      // Pasivo
      pasivo_redimible: 0,
      pasivo_no_redimible: 0,
      // Ocupacion
      sesiones: 0,
      ocupacion_actual: 0,
      ocupacion_periodo: 0,
      // Aforo
      aforo_hombres: 0,
      aforo_mujeres: 0,
      aforo_total: 0,
      // Cuentas
      altas: 0,
      cuentas_activas_30: 0,
      cuentas_activas_90: 0,
      cuentas_activas_180: 0,
      cuentas_inactivas: 0,
      cuentas_total: 0,
      // Proveedores
      proveedores: [],
      // Cajeros (from Excel, empty here)
      cajeros: [],
      // Meta
      source: 'pdf',
      uploaded_at: new Date().toISOString()
    };

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Helper: find $ amounts near a label — handles ($123.45) negative and same-line values
    const findAmount = (label) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(label.toLowerCase())) {
          // Check same line for $amount or ($amount) or negative
          const m = lines[i].match(/\(?\$?([\d,]+\.?\d*)\)?/g);
          if (m) {
            for (const match of m) {
              const cleaned = match.replace(/[$,()]/g, '');
              const val = parseFloat(cleaned);
              if (val > 0 || match.includes('$')) {
                return match.includes('(') ? -val : val;
              }
            }
          }
          // Check next line
          if (i + 1 < lines.length) {
            const m2 = lines[i + 1].match(/\(?\$?([\d,]+\.?\d*)\)?/);
            if (m2) {
              const val = parseFloat(m2[1].replace(/,/g, ''));
              return lines[i + 1].includes('(') ? -val : val;
            }
          }
        }
      }
      return 0;
    };

    // Helper: find a number after a label — handles "Label:   123" on same line
    const findNumber = (label) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(label.toLowerCase())) {
          // Extract number from AFTER the label on same line
          const afterLabel = lines[i].substring(lines[i].toLowerCase().indexOf(label.toLowerCase()) + label.length);
          const m = afterLabel.match(/[\d,]+\.?\d*/);
          if (m && parseFloat(m[0].replace(/,/g, '')) > 0) return parseFloat(m[0].replace(/,/g, ''));
          // Check next line
          if (i + 1 < lines.length) {
            const m2 = lines[i + 1].match(/[\d,]+\.?\d*/);
            if (m2) return parseFloat(m2[0].replace(/,/g, ''));
          }
        }
      }
      return 0;
    };

    // Helper: find percentage after a label — handles "Label:   12.5%" on same line
    const findPct = (label) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(label.toLowerCase())) {
          const m = lines[i].match(/([\d.]+)%/);
          if (m) return parseFloat(m[1]);
          if (i + 1 < lines.length) {
            const m2 = lines[i + 1].match(/([\d.]+)%/);
            if (m2) return parseFloat(m2[1]);
          }
        }
      }
      return 0;
    };

    // Sala
    for (const l of lines) {
      const sm = l.match(/Sala:\s*(.+)/i);
      if (sm) { corte.sala = sm[1].trim(); break; }
    }

    // Dates — search multiple patterns for robustness
    let desde = '', hasta = '';

    // Strategy 1: Look for "Desde:" and "Hasta:" with date nearby (up to 3 lines ahead)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/Desde:/i)) {
        // Check same line and next 3 lines for a date
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const dm = lines[j].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+\d{1,2}:\d{2}/);
          if (dm) { desde = lines[j]; break; }
        }
      }
      if (lines[i].match(/Hasta:/i)) {
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const dm = lines[j].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+\d{1,2}:\d{2}/);
          if (dm) { hasta = lines[j]; break; }
        }
      }
    }

    // Strategy 2: If no Desde/Hasta found, extract from title/subject line
    if (!desde) {
      const fullText = text;
      // Look for "Site: 175 - Grand Tuxtla Casino 4/1/2026 8:00 PM" pattern
      const titleMatch = fullText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (titleMatch) {
        hasta = `${titleMatch[1]}/${titleMatch[2]}/${titleMatch[3]} ${titleMatch[4]}`;
        // Infer desde as same day 8:00 AM
        desde = `${titleMatch[1]}/${titleMatch[2]}/${titleMatch[3]} 8:00 AM`;
      }
    }

    // Strategy 3: Find ANY date in M/D/YYYY format in the first 30 lines
    if (!desde) {
      for (let i = 0; i < Math.min(30, lines.length); i++) {
        const dm = lines[i].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dm && parseInt(dm[3]) >= 2024) {
          desde = lines[i];
          break;
        }
      }
    }

    // Parse date from "4/1/2026 8:00 AM" or "4/1/2026" format
    const dateMatch = (desde || hasta).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const m = dateMatch[1].padStart(2, '0');
      const d = dateMatch[2].padStart(2, '0');
      corte.fecha = `${dateMatch[3]}-${m}-${d}`;
    }
    const timeFrom = desde.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
    const timeTo = hasta.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (timeFrom && timeTo) {
      corte.turno = `${timeFrom[1]} - ${timeTo[1]}`;
    } else if (timeTo) {
      corte.turno = `8:00 AM - ${timeTo[1]}`;
    }
    corte.id = `corte_${corte.fecha}_${(corte.turno || '').replace(/[^0-9AMP]/gi, '')}`;

    // Caja
    corte.entradas = findAmount('Total Entradas');
    corte.salidas = findAmount('Total Salidas');
    corte.retencion_premios = findAmount('Retención Premios');
    corte.resultado_caja = findAmount('Resultado de Caja');

    // Maquinas — search using multiple strategies for PDF.js compatibility
    // Strategy A: Full-text regex (handles PDF.js single-line extraction)
    const fullText = text;
    const jugadoMatch = fullText.match(/Jugado\s*\$?([\d,]+\.?\d*)/i);
    const netwinMatch = fullText.match(/Netwin\s*\$?([\d,]+\.?\d*)/i);
    const holdMatch = fullText.match(/Hold\s*([\d.]+)%/i);
    const termMatch = fullText.match(/Num\.?\s*Terminales\s*(\d+)/i);
    const nwtMatch = fullText.match(/Netwin\/Term\.?\s*\$?([\d,]+\.?\d*)/i);

    if (jugadoMatch) corte.jugado = parseFloat(jugadoMatch[1].replace(/,/g, ''));
    if (netwinMatch) corte.netwin = parseFloat(netwinMatch[1].replace(/,/g, ''));
    if (holdMatch) corte.hold_pct = parseFloat(holdMatch[1]);
    if (termMatch) corte.terminales = parseInt(termMatch[1]);
    if (nwtMatch) corte.netwin_terminal = parseFloat(nwtMatch[1].replace(/,/g, ''));

    // Strategy B: Line-by-line (handles pdftotext format where label and value are on separate lines)
    if (!corte.jugado) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^Jugado$/i) && i + 1 < lines.length) {
          const m = lines[i + 1].match(/\$?([\d,]+\.?\d*)/);
          if (m) corte.jugado = parseFloat(m[1].replace(/,/g, ''));
        }
        if (lines[i].match(/^Netwin$/i) && !lines[i].match(/Term/i) && i + 1 < lines.length) {
          const m = lines[i + 1].match(/\$?([\d,]+\.?\d*)/);
          if (m && !corte.netwin) corte.netwin = parseFloat(m[1].replace(/,/g, ''));
        }
        if (lines[i].match(/^Hold$/i) && i + 1 < lines.length) {
          const m = lines[i + 1].match(/([\d.]+)%/);
          if (m && !corte.hold_pct) corte.hold_pct = parseFloat(m[1]);
        }
        if (lines[i].match(/^Num\.?\s*Terminales$/i) && i + 1 < lines.length) {
          if (!corte.terminales) corte.terminales = parseInt(lines[i + 1]) || 0;
        }
      }
    }

    // Pasivo
    corte.pasivo_redimible = findAmount('Redimible');
    corte.pasivo_no_redimible = findAmount('No Redimible');

    // Ocupacion — use findNumber/findPct (handles "Label:  value" on same line)
    corte.sesiones = findNumber('Sesiones:');
    corte.ocupacion_actual = findPct('Actual:');
    corte.ocupacion_periodo = findPct('En el periodo:');
    // If "Actual" is 0 but "En el periodo" has value, use it
    if (!corte.ocupacion_actual && corte.ocupacion_periodo) corte.ocupacion_actual = corte.ocupacion_periodo;

    // Aforo
    corte.aforo_hombres = findNumber('Hombres:');
    corte.aforo_mujeres = findNumber('Mujeres:');
    corte.aforo_total = corte.aforo_hombres + corte.aforo_mujeres;
    // Fallback: look for "Total:" after "Anónimos:" (aforo section)
    if (!corte.aforo_total) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/An[oó]nimos:/i)) {
          // Next "Total:" is aforo total
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            if (lines[j].match(/Total:/i)) {
              const afterT = lines[j].substring(lines[j].indexOf(':') + 1);
              const val = parseInt(afterT.replace(/,/g, ''));
              if (val > 0) { corte.aforo_total = val; break; }
            }
          }
          break;
        }
      }
    }

    // Cuentas
    corte.altas = findNumber('Altas:');
    corte.cuentas_activas_30 = findNumber('Activo <= 30:');
    corte.cuentas_activas_90 = findNumber('Activo <= 90:');
    corte.cuentas_activas_180 = findNumber('Activo <= 180:');
    corte.cuentas_inactivas = findNumber('Inactivo:');
    corte.cuentas_total = corte.altas + corte.cuentas_activas_30 + corte.cuentas_activas_90 + corte.cuentas_activas_180 + corte.cuentas_inactivas;

    // Proveedores — multiple strategies
    const KNOWN_PROVS = ['AGS','EGT','FBM','MERKUR','ORTIZ','ZITRO','AINSWORTH','ARISTOCRAT','IGT','KONAMI','NOVOMATIC','SG','WMS'];

    // Strategy A: Regex on full text (handles PDF.js inline format)
    // Pattern: "PROVNAME Jugado $X Netwin $Y Hold Z% Num. Terminales N"
    for (const provName of KNOWN_PROVS) {
      const provRx = new RegExp(provName + '\\s+Jugado\\s+\\$?([\\d,]+\\.?\\d*)\\s+Netwin\\s+\\(?\\$?([\\d,]+\\.?\\d*)\\)?\\s+.*?Hold\\s+(-?[\\d.]+)%\\s+.*?(?:Num\\.?\\s*Terminales)\\s+(\\d+)', 'i');
      const pm = fullText.match(provRx);
      if (pm) {
        corte.proveedores.push({
          nombre: provName,
          jugado: parseFloat(pm[1].replace(/,/g, '')),
          netwin: parseFloat(pm[2].replace(/,/g, '')),
          hold: parseFloat(pm[3]),
          terminales: parseInt(pm[4]),
          netwin_terminal: 0
        });
      }
    }

    // Strategy B: Line-by-line (pdftotext format)
    if (!corte.proveedores.length) {
      const provSection = text.indexOf('Estad');
      if (provSection >= 0) {
        const provText = text.substring(provSection);
        const provLines = provText.split('\n').map(l => l.trim()).filter(Boolean);
        const provNames = [];
        for (let i = 0; i < provLines.length; i++) {
          if (provLines[i].match(/^[A-Z]{2,20}$/) && provLines[i] !== 'Total:' && KNOWN_PROVS.includes(provLines[i])) {
            provNames.push({ name: provLines[i], idx: i });
          }
        }
        for (const prov of provNames) {
          const p = { nombre: prov.name, jugado: 0, netwin: 0, hold: 0, terminales: 0, netwin_terminal: 0 };
          for (let j = prov.idx + 1; j < Math.min(prov.idx + 15, provLines.length); j++) {
            const line = provLines[j];
            if (KNOWN_PROVS.includes(line) || line === 'Total:') break;
            // Same-line: "Jugado   $136,292.30"
            let m;
            if ((m = line.match(/^Jugado\s+\(?\$?([\d,]+\.?\d*)/i))) { p.jugado = parseFloat(m[1].replace(/,/g, '')); continue; }
            if ((m = line.match(/^Netwin\s+\(?\$?([\d,]+\.?\d*)/i)) && !line.match(/Term/i)) { p.netwin = parseFloat(m[1].replace(/,/g, '')); if(line.includes('(')) p.netwin=-p.netwin; continue; }
            if ((m = line.match(/^Hold\s+(-?[\d.]+)%/i))) { p.hold = parseFloat(m[1]); continue; }
            if ((m = line.match(/^Num\.?\s*Terminales\s+(\d+)/i))) { p.terminales = parseInt(m[1]); continue; }
            if ((m = line.match(/^Netwin\/Term\.?\s+\(?\$?([\d,]+\.?\d*)/i))) { p.netwin_terminal = parseFloat(m[1].replace(/,/g, '')); if(line.includes('(')) p.netwin_terminal=-p.netwin_terminal; continue; }
            // Separate lines: "Jugado\n$136,292"
            if (line.match(/^Jugado$/i) && j+1<provLines.length) { m=provLines[j+1].match(/\$?([\d,]+\.?\d*)/); if(m) p.jugado=parseFloat(m[1].replace(/,/g,'')); continue; }
            if (line.match(/^Netwin$/i) && !line.match(/Term/i) && j+1<provLines.length) { m=provLines[j+1].match(/\(?\$?([\d,]+\.?\d*)/); if(m) p.netwin=parseFloat(m[1].replace(/,/g,'')); if(provLines[j+1].includes('(')) p.netwin=-p.netwin; continue; }
            if (line.match(/^Hold$/i) && j+1<provLines.length) { m=provLines[j+1].match(/(-?[\d.]+)%/); if(m) p.hold=parseFloat(m[1]); continue; }
            if (line.match(/^Num\.?\s*Terminales$/i) && j+1<provLines.length) { p.terminales=parseInt(provLines[j+1])||0; continue; }
          }
          if (p.jugado > 0 || p.netwin !== 0) corte.proveedores.push(p);
        }
      }
    }

    // Calculate netwin/terminal for providers that don't have it
    corte.proveedores.forEach(p => {
      if (!p.netwin_terminal && p.terminales > 0) p.netwin_terminal = +(p.netwin / p.terminales).toFixed(2);
    });

    return corte;
  }

  // ═══════════════════════════════════════
  // EXCEL PARSER — Sesiones de Caja
  // ═══════════════════════════════════════

  function parseCasinoExcel(workbook) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Find header row (contains "Usuario", "Apertura", etc.)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] || [];
      const str = row.join(' ').toLowerCase();
      if (str.includes('usuario') && str.includes('apertura')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) return [];

    const headers = data[headerIdx];
    const colIdx = {};
    headers.forEach((h, i) => {
      const hl = String(h || '').toLowerCase().trim();
      if (hl === 'usuario') colIdx.usuario = i;
      if (hl === 'apertura') colIdx.apertura = i;
      if (hl === 'cierre') colIdx.cierre = i;
      if (hl === 'terminal') colIdx.terminal = i;
      if (hl === 'e') colIdx.estado = i;
      if (hl === 'entradas' && colIdx.entradas === undefined) colIdx.entradas = i;
      if (hl === 'salidas' && colIdx.salidas === undefined) colIdx.salidas = i;
      if (hl === 'impuestos') colIdx.impuestos = i;
      if (hl === 'resultado caja') colIdx.resultado = i;
      if (hl.includes('depósitos') && !hl.includes('-')) colIdx.depositos = i;
      if (hl.includes('retiros') && !hl.includes('-')) colIdx.retiros = i;
    });

    // Also try positional (from known structure: col 5=Entradas, 6=Salidas, 8=Impuestos, 9=Resultado)
    if (colIdx.entradas === undefined) colIdx.entradas = 5;
    if (colIdx.salidas === undefined) colIdx.salidas = 6;
    if (colIdx.impuestos === undefined) colIdx.impuestos = 8;
    if (colIdx.resultado === undefined) colIdx.resultado = 9;

    const cajeros = [];
    for (let i = headerIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      const usuario = String(row[colIdx.usuario] || '').trim();
      if (!usuario || usuario.startsWith('SYS-')) continue; // Skip system sessions

      const entradas = parseFloat(row[colIdx.entradas]) || 0;
      const salidas = parseFloat(row[colIdx.salidas]) || 0;
      const impuestos = parseFloat(row[colIdx.impuestos]) || 0;
      const resultado = parseFloat(row[colIdx.resultado]) || 0;
      const depositos = parseFloat(row[colIdx.depositos]) || 0;
      const retiros = parseFloat(row[colIdx.retiros]) || 0;
      const estado = String(row[colIdx.estado] || '').trim();
      const apertura = String(row[colIdx.apertura] || '').trim();
      const cierre = String(row[colIdx.cierre] || '').trim();

      cajeros.push({
        nombre: usuario,
        apertura,
        cierre,
        estado,
        entradas,
        salidas,
        impuestos,
        resultado,
        depositos,
        retiros
      });
    }

    return cajeros;
  }

  // ═══════════════════════════════════════
  // AGGREGATION HELPERS
  // ═══════════════════════════════════════

  /** Get cortes for a date range */
  function casinoCortes(from, to) {
    const data = casinoLoad();
    return data.cortes.filter(c => {
      if (from && c.fecha < from) return false;
      if (to && c.fecha > to) return false;
      return true;
    });
  }

  /** Aggregate cortes by month for P&L injection */
  function casinoMonthlyNetwin(year) {
    const data = casinoLoad();
    const monthly = Array(12).fill(0);
    const prefix = String(year);
    data.cortes.forEach(c => {
      if (!c.fecha || !c.fecha.startsWith(prefix)) return;
      const month = parseInt(c.fecha.split('-')[1]) - 1; // 0-based
      if (month >= 0 && month < 12) monthly[month] += c.netwin || 0;
    });
    return monthly;
  }

  /** KPIs for a period */
  function casinoKPIs(from, to) {
    const cortes = casinoCortes(from, to);
    if (!cortes.length) return null;
    return {
      num_cortes: cortes.length,
      total_entradas: cortes.reduce((s, c) => s + (c.entradas || 0), 0),
      total_salidas: cortes.reduce((s, c) => s + (c.salidas || 0), 0),
      total_resultado: cortes.reduce((s, c) => s + (c.resultado_caja || 0), 0),
      total_jugado: cortes.reduce((s, c) => s + (c.jugado || 0), 0),
      total_netwin: cortes.reduce((s, c) => s + (c.netwin || 0), 0),
      avg_hold: cortes.reduce((s, c) => s + (c.hold_pct || 0), 0) / cortes.length,
      total_terminales: Math.max(...cortes.map(c => c.terminales || 0)),
      avg_ocupacion: cortes.reduce((s, c) => s + (c.ocupacion_actual || 0), 0) / cortes.length,
      total_aforo: cortes.reduce((s, c) => s + (c.aforo_total || 0), 0),
      total_altas: cortes.reduce((s, c) => s + (c.altas || 0), 0),
    };
  }

  // ═══════════════════════════════════════
  // EXPOSE
  // ═══════════════════════════════════════
  window.CASINO_KEY = CASINO_KEY;
  window.casinoLoad = casinoLoad;
  window.casinoSave = casinoSave;
  window.casinoAddCorte = casinoAddCorte;
  window.casinoDeleteCorte = casinoDeleteCorte;
  window.parseCasinoPDF = parseCasinoPDF;
  window.parseCasinoExcel = parseCasinoExcel;
  window.casinoCortes = casinoCortes;
  window.casinoMonthlyNetwin = casinoMonthlyNetwin;
  window.casinoKPIs = casinoKPIs;

})(window);
