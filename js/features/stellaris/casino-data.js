// GF — Stellaris Casino: Data Layer + Parsers
(function(window) {
  'use strict';

  const CASINO_KEY = 'gf_casino';
  const CASINO_CONFIG_KEY = 'gf_casino_config';

  // Default config
  const CASINO_CONFIG_DEFAULT = {
    proveedores: {
      AGS: { pct_maquinero: 0 },
      EGT: { pct_maquinero: 0 },
      FBM: { pct_maquinero: 0 },
      MERKUR: { pct_maquinero: 0 },
      ORTIZ: { pct_maquinero: 0 },
      ZITRO: { pct_maquinero: 0 }
    },
    pct_operadora: 10
  };

  // ═══════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════

  function casinoLoad() {
    return (typeof DB !== 'undefined' && DB.get(CASINO_KEY)) || { cortes: [] };
  }

  function casinoConfigLoad() {
    const cfg = (typeof DB !== 'undefined' && DB.get(CASINO_CONFIG_KEY)) || null;
    if (!cfg) return JSON.parse(JSON.stringify(CASINO_CONFIG_DEFAULT));
    // Merge with defaults to ensure new providers are included
    const merged = JSON.parse(JSON.stringify(CASINO_CONFIG_DEFAULT));
    if (cfg.proveedores) {
      for (var k in cfg.proveedores) merged.proveedores[k] = cfg.proveedores[k];
    }
    if (cfg.pct_operadora !== undefined) merged.pct_operadora = cfg.pct_operadora;
    return merged;
  }

  function casinoConfigSave(cfg) {
    if (typeof DB !== 'undefined') DB.set(CASINO_CONFIG_KEY, cfg);
  }

  function casinoSave(data) {
    if (typeof DB !== 'undefined') DB.set(CASINO_KEY, data);
  }

  // Financial fields that the Excel Resumen is authoritative for
  const EXCEL_FINANCIAL_FIELDS = [
    'entradas','salidas','resultado_caja','retencion_premios',
    'deposito_juego_in','acceso_instalaciones','tarjeta_bancaria_in',
    'deposito_juego_out','pago_premios',
    'premios_maquinas','premio_sorteo',
    'imp_federal','imp_estatal',
    'promo_redimible','promo_no_redimible','cancel_promo_nr',
    'pagos_manuales','efectivo_caja','efectivo_entregado',
    'efectivo_faltante','efectivo_sobrante',
    'pasivo_redimible','pasivo_no_redimible',
    'bancos_moviles','depositos_caja'
  ];

  // Machine fields that the PDF is authoritative for
  const PDF_MACHINE_FIELDS = [
    'jugado','netwin','hold_pct','terminales','netwin_terminal',
    'sesiones','ocupacion_actual','ocupacion_periodo',
    'aforo_hombres','aforo_mujeres','aforo_total',
    'altas','cuentas_activas_30','cuentas_activas_90','cuentas_activas_180',
    'cuentas_inactivas','cuentas_total'
  ];

  function casinoAddCorte(corte) {
    const data = casinoLoad();
    const idx = data.cortes.findIndex(c => c.id === corte.id);
    if (idx >= 0) {
      const existing = data.cortes[idx];
      const merged = Object.assign({}, existing);
      const isExcel = (corte.source || '').includes('excel');
      const isPDF = (corte.source || '') === 'pdf';

      for (const key of Object.keys(corte)) {
        const newVal = corte[key];

        // Arrays: only overwrite if new is non-empty
        if (Array.isArray(newVal)) {
          if (newVal.length > 0) merged[key] = newVal;
          continue;
        }

        // Excel source: always wins for financial fields (even if 0 is valid)
        if (isExcel && EXCEL_FINANCIAL_FIELDS.includes(key)) {
          if (newVal !== null && newVal !== undefined && newVal !== '') merged[key] = newVal;
          continue;
        }

        // PDF source: always wins for machine fields
        if (isPDF && PDF_MACHINE_FIELDS.includes(key)) {
          if (newVal !== null && newVal !== undefined && newVal !== '') merged[key] = newVal;
          continue;
        }

        // Default: overwrite if non-zero/truthy
        if (newVal !== 0 && newVal !== '' && newVal !== null && newVal !== undefined) {
          merged[key] = newVal;
        }
      }

      // Always update metadata
      merged.uploaded_at = corte.uploaded_at;
      if (corte.source) {
        const sources = (existing.source || '').split('+').filter(Boolean);
        if (!sources.includes(corte.source)) sources.push(corte.source);
        merged.source = sources.join('+');
      }
      data.cortes[idx] = merged;
    } else {
      data.cortes.push(corte);
    }
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
      // ── Caja (totales) ──
      entradas: 0,
      salidas: 0,
      retencion_premios: 0,
      resultado_caja: 0,
      // ── Desglose Entradas ──
      deposito_juego_in: 0,      // Depósito de Juego (entrada)
      acceso_instalaciones: 0,    // Acceso y uso de instalaciones
      tarjeta_bancaria_in: 0,     // Operaciones con Tarjeta Bancaria
      // ── Desglose Salidas ──
      deposito_juego_out: 0,      // Depósito de Juego (salida/devolución)
      pago_premios: 0,            // Pago de Premios total
      // ── Premios (desglose) ──
      premios_maquinas: 0,        // Premios (de máquinas)
      premio_sorteo: 0,           // Pago de premio sorteo
      // ── Impuestos ──
      imp_federal: 0,             // Impuesto Federal (1%)
      imp_estatal: 0,             // Impuesto Estatal (6%)
      // ── Promociones ──
      promo_redimible: 0,         // Promoción Redimible
      promo_no_redimible: 0,      // Promoción No Redimible
      cancel_promo_nr: 0,         // Cancelación Promo NR
      // ── Pagos manuales ──
      pagos_manuales: 0,
      // ── Maquinas ──
      jugado: 0,
      netwin: 0,
      hold_pct: 0,
      terminales: 0,
      netwin_terminal: 0,
      // ── Pasivo ──
      pasivo_redimible: 0,
      pasivo_no_redimible: 0,
      // ── Balance efectivo ──
      efectivo_caja: 0,
      efectivo_entregado: 0,
      efectivo_faltante: 0,
      efectivo_sobrante: 0,
      // ── Ocupacion ──
      sesiones: 0,
      ocupacion_actual: 0,
      ocupacion_periodo: 0,
      // ── Aforo ──
      aforo_hombres: 0,
      aforo_mujeres: 0,
      aforo_total: 0,
      // ── Cuentas ──
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
      // Look for "Site: 175 - Grand Tuxtla Casino 4/3/2026 5:00 AM" pattern
      const titleMatch = fullText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (titleMatch) {
        hasta = `${titleMatch[1]}/${titleMatch[2]}/${titleMatch[3]} ${titleMatch[4]}`;
        // Check if this is an early morning close (before 8AM) — operation date is PREVIOUS day
        const hourStr = titleMatch[4];
        const isAM = /AM/i.test(hourStr);
        const hour = parseInt(hourStr);
        if (isAM && hour < 8) {
          // 5:00 AM close = previous day's operation
          const closeDate = new Date(parseInt(titleMatch[3]), parseInt(titleMatch[1])-1, parseInt(titleMatch[2]));
          closeDate.setDate(closeDate.getDate() - 1);
          const pm = String(closeDate.getMonth()+1);
          const pd = String(closeDate.getDate());
          desde = `${pm}/${pd}/${closeDate.getFullYear()} 8:00 AM`;
        } else {
          desde = `${titleMatch[1]}/${titleMatch[2]}/${titleMatch[3]} 8:00 AM`;
        }
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
    // ID based on date only — one corte per day (cierre replaces intraday)
    corte.id = `corte_${corte.fecha}`;

    // Caja
    corte.entradas = findAmount('Total Entradas');
    corte.salidas = findAmount('Total Salidas');
    corte.retencion_premios = findAmount('Retención Premios') || findAmount('Retención sobre Premios');
    corte.resultado_caja = findAmount('Resultado de Caja');

    // ── Desglose Entradas ──
    corte.deposito_juego_in = findAmount('Depósito de Juego');
    corte.acceso_instalaciones = findAmount('Acceso y uso de instalaciones');
    corte.tarjeta_bancaria_in = findAmount('Operaciones con Tarjeta Bancaria') || findAmount('Tarjeta Bancaria');

    // ── Desglose Salidas (buscar en sección Salidas) ──
    // deposito_juego_out se calcula: Total Salidas - Pago Premios
    corte.pago_premios = findAmount('Pago de Premios');
    if (corte.pago_premios && corte.salidas) corte.deposito_juego_out = +(corte.salidas - corte.pago_premios).toFixed(2);

    // ── Premios desglose ──
    corte.premios_maquinas = findAmount('Premios');
    corte.premio_sorteo = findAmount('Pago de premio sorteo');
    // Si premios_maquinas incluye el sorteo, ajustar
    if (corte.premios_maquinas > 0 && corte.premio_sorteo > 0 && corte.premios_maquinas > corte.premio_sorteo) {
      // "Premios" en el reporte es solo máquinas, separado del sorteo
    }

    // ── Impuestos (calculados: Federal 1%, Estatal 6% sobre premios brutos) ──
    corte.imp_federal = findAmount('Impuesto Federal');
    corte.imp_estatal = findAmount('Impuesto Estatal');
    // Si no se encontraron, calcular desde premios brutos
    if (!corte.imp_federal && corte.premios_maquinas) {
      const base_impuesto = corte.premios_maquinas + corte.premio_sorteo;
      corte.imp_federal = +(base_impuesto * 0.01).toFixed(2);
      corte.imp_estatal = +(base_impuesto * 0.06).toFixed(2);
    }

    // ── Promociones ──
    corte.promo_redimible = findAmount('Promoción Redimible');
    corte.promo_no_redimible = findAmount('Promoción No Redimible');
    corte.cancel_promo_nr = findAmount('Cancelación Promoción No Redimible');

    // ── Pagos manuales ──
    corte.pagos_manuales = findNumber('Pago manual') || findAmount('Pagos manuales');

    // ── Balance efectivo ──
    corte.efectivo_caja = findAmount('Efectivo en caja');
    corte.efectivo_entregado = findAmount('Entregado');
    corte.efectivo_faltante = findAmount('Faltante');
    corte.efectivo_sobrante = findAmount('Sobrante');

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
  // EXCEL PARSER — Resumen de Cajas (full corte from Excel)
  // ═══════════════════════════════════════

  function parseCasinoResumenExcel(workbook) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Helper: find value by scanning all rows for a label match
    // Looks in cols 0-3 for the label, returns the numeric value from the rightmost col
    const findVal = (label) => {
      const lbl = label.toLowerCase();
      for (let i = 0; i < data.length; i++) {
        const row = data[i] || [];
        for (let c = 0; c < Math.min(4, row.length); c++) {
          const cell = String(row[c] == null ? '' : row[c]).trim();
          if (cell.toLowerCase() === lbl) {
            for (let v = row.length - 1; v > c; v--) {
              if (row[v] != null && String(row[v]).trim() !== '') {
                const s = String(row[v]);
                const raw = s.replace(/[$,\s()]/g, '');
                const val = parseFloat(raw);
                if (!isNaN(val) && val !== 0) return s.includes('(') ? -val : val;
                if (!isNaN(val)) return val;
              }
            }
          }
        }
      }
      return 0;
    };

    // Helper: find the Nth occurrence of a label (for duplicate labels in different sections)
    const findValN = (label, nth) => {
      const lbl = label.toLowerCase();
      let count = 0;
      for (let i = 0; i < data.length; i++) {
        const row = data[i] || [];
        for (let c = 0; c < Math.min(4, row.length); c++) {
          const cell = String(row[c] == null ? '' : row[c]).trim();
          if (cell.toLowerCase() === lbl) {
            count++;
            if (count === nth) {
              for (let v = row.length - 1; v > c; v--) {
                if (row[v] != null && String(row[v]).trim() !== '') {
                  const s = String(row[v]);
                  const raw = s.replace(/[$,\s()]/g, '');
                  const val = parseFloat(raw);
                  if (!isNaN(val)) return s.includes('(') ? -val : val;
                }
              }
            }
          }
        }
      }
      return 0;
    };

    // Extract dates
    let fecha = '', turno = '', sala = '';
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i] || [];
      const rowStr = row.map(c => c == null ? '' : String(c)).join(' ');
      const salaMatch = rowStr.match(/\d+\s*-\s*(.+CASINO.*)/i);
      if (salaMatch) sala = salaMatch[0].trim();
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] == null ? '' : row[c]).trim();
        if (cell.match(/^Desde:?$/i)) {
          for (let d = c+1; d < Math.min(c+3, row.length); d++) {
            if (row[d]) { const dm = String(row[d]).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}:\d{2})/); if(dm){fecha=`${dm[3]}-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`;turno=dm[4];break;} }
          }
        }
        if (cell.match(/^Hasta:?$/i)) {
          for (let d = c+1; d < Math.min(c+3, row.length); d++) {
            if (row[d]) { const dm = String(row[d]).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}:\d{2})/); if(dm&&turno){turno+=' - '+dm[4];break;} }
          }
        }
      }
    }

    // Use findVal for ALL fields — no section tracking needed
    // Entradas: first occurrence of "Depósito de Juego" is the entry (row 22)
    const deposito_juego_in = findVal('Depósito de Juego');
    const acceso = findVal('Acceso y uso de instalaciones y máquinas') || findVal('Acceso y uso de instalaciones');
    const tarjeta_in = findVal('Operaciones con Tarjeta Bancaria');

    // Salidas: "Depósito de Juego" appears twice (row 22 = entradas, row 33 = salidas)
    const deposito_juego_out = findValN('Depósito de Juego', 2);
    const pago_premios = findVal('Pago de Premios');

    // Totals: "Entradas" and "Salidas" appear as labels with values (rows 49, 50, 76, 77)
    const total_entradas = findValN('Entradas', 2) || findValN('Entradas', 3) || (deposito_juego_in + acceso);
    const total_salidas = findValN('Salidas', 2) || findValN('Salidas', 3) || (deposito_juego_out + pago_premios);
    const resultado_caja = findVal('Resultado de Caja');

    // Premios
    const premios_maq = findVal('Premios');
    const premio_sorteo = findVal('Pago de premio sorteo');
    const retencion = findVal('Retención sobre Premios');

    // Impuestos
    const imp_fed = findVal('Impuesto Federal');
    const imp_est = findVal('Impuesto Estatal');

    // Promociones
    const promo_red = findVal('Promoción Redimible');
    const promo_nr = findVal('Promoción No Redimible');
    const cancel_nr = findVal('Cancelación Promoción No Redimible');

    // Balance
    const efectivo = findVal('Peso Mexicano') || findVal('Efectivo en caja');
    const entregado = findVal('Entregado');
    const faltante = findVal('Faltante');
    const sobrante = findVal('Sobrante');

    // Pagos manuales: find "Total" after "Pagos manuales" section
    let pagos_man = 0;
    for (let i = 0; i < data.length; i++) {
      const c1 = String(data[i]?.[1] == null ? '' : data[i][1]).trim();
      if (c1 === 'Pagos manuales') {
        for (let j = i+1; j < Math.min(i+5, data.length); j++) {
          const t = String(data[j]?.[1] == null ? '' : data[j][1]).trim();
          if (t === 'Total') { const v = data[j]?.[4]; if (v != null) pagos_man = parseFloat(String(v).replace(/[$,()]/g,''))||0; break; }
        }
        break;
      }
    }

    // Pasivo Final
    let pasivo_red = 0, pasivo_nr = 0;
    for (let i = 0; i < data.length; i++) {
      const c1 = String(data[i]?.[1] == null ? '' : data[i][1]).trim();
      if (c1 === 'Pasivo Final') {
        for (let j = i+1; j < Math.min(i+6, data.length); j++) {
          const c2 = String(data[j]?.[2] == null ? '' : data[j][2]).trim();
          const v = data[j]?.[4];
          const val = v != null ? parseFloat(String(v).replace(/[$,()]/g,''))||0 : 0;
          if (c2 === 'Redimible') pasivo_red = val;
          if (c2 === 'Promo. NR' || c2 === 'Promo. RE') pasivo_nr = val;
          if (c1 === 'Incremento de Pasivo' || String(data[j]?.[1]||'').trim() === 'Incremento de Pasivo') break;
        }
        break;
      }
    }

    // Bancos
    const bancos = findVal('Entregado Bancos Móviles/Validadores');
    const depositos_caja = findVal('Depósitos de caja');

    // Calculate impuestos if missing
    const premios_brutos = premios_maq + premio_sorteo;
    const imp_federal = imp_fed || (premios_brutos > 0 ? +(premios_brutos * 0.01).toFixed(2) : 0);
    const imp_estatal = imp_est || (premios_brutos > 0 ? +(premios_brutos * 0.06).toFixed(2) : 0);
    const retencion_final = retencion || (imp_federal + imp_estatal);

    console.log('[Casino] Excel Resumen parsed:', {
      fecha, entradas: total_entradas, salidas: total_salidas, resultado: resultado_caja,
      deposito_in: deposito_juego_in, deposito_out: deposito_juego_out, premios: pago_premios,
      imp_fed: imp_federal, imp_est: imp_estatal, retencion: retencion_final,
      promo_red, promo_nr, premios_maq, premio_sorteo
    });

    return {
      id: `corte_${fecha}`, fecha, turno, sala,
      entradas: total_entradas,
      salidas: total_salidas,
      retencion_premios: retencion_final,
      resultado_caja: resultado_caja || (total_entradas - total_salidas - retencion_final),
      deposito_juego_in, acceso_instalaciones: acceso, tarjeta_bancaria_in: tarjeta_in,
      deposito_juego_out: deposito_juego_out || (total_salidas - pago_premios),
      pago_premios: pago_premios || (premios_maq + premio_sorteo - retencion_final),
      premios_maquinas: premios_maq, premio_sorteo,
      imp_federal, imp_estatal,
      promo_redimible: promo_red, promo_no_redimible: promo_nr, cancel_promo_nr: cancel_nr,
      pagos_manuales: pagos_man,
      efectivo_caja: efectivo, efectivo_entregado: entregado,
      efectivo_faltante: faltante, efectivo_sobrante: sobrante,
      pasivo_redimible: pasivo_red, pasivo_no_redimible: pasivo_nr,
      bancos_moviles: bancos, depositos_caja,
      // Machine data NOT in this report — will be merged from existing corte
      jugado: 0, netwin: 0, hold_pct: 0, terminales: 0, netwin_terminal: 0,
      sesiones: 0, ocupacion_actual: 0, ocupacion_periodo: 0,
      aforo_hombres: 0, aforo_mujeres: 0, aforo_total: 0,
      altas: 0, cuentas_activas_30: 0, cuentas_activas_90: 0,
      cuentas_activas_180: 0, cuentas_inactivas: 0, cuentas_total: 0,
      proveedores: [], cajeros: [],
      source: 'excel-resumen', uploaded_at: new Date().toISOString()
    };
  }

  /** Detect Excel type: 'resumen' or 'sesiones' */
  function detectCasinoExcelType(workbook) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const rowStr = (data[i] || []).join(' ').toLowerCase();
      if (rowStr.includes('resumen de caja')) return 'resumen';
      if (rowStr.includes('sesiones de caja')) return 'sesiones';
    }
    // Fallback: if has "Balance de caja" → resumen, if has "Usuario" → sesiones
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const rowStr = (data[i] || []).join(' ').toLowerCase();
      if (rowStr.includes('balance de caja')) return 'resumen';
      if (rowStr.includes('usuario') && rowStr.includes('apertura')) return 'sesiones';
    }
    return 'unknown';
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

  /** Full monthly P&L aggregation for Casino — feeds into fiInjectCasino() */
  function casinoMonthlyPnL(year) {
    const data = casinoLoad();
    const cfg = casinoConfigLoad();
    const prefix = String(year);
    const zeros = () => Array(12).fill(0);

    const pnl = {
      // INGRESOS
      netwin: zeros(), acceso_instalaciones: zeros(), tarjeta_bancaria: zeros(),
      // COSTOS DIRECTOS
      maquinero: zeros(), imp_federal: zeros(), imp_estatal: zeros(), promo_redimible: zeros(),
      // Totals (calculated after aggregation)
      total_ingresos: zeros(), total_costos: zeros(), margen_operativo: zeros()
    };

    data.cortes.forEach(function(c) {
      if (!c.fecha || !c.fecha.startsWith(prefix)) return;
      var m = parseInt(c.fecha.split('-')[1]) - 1;
      if (m < 0 || m > 11) return;

      // Ingresos
      pnl.netwin[m] += c.netwin || 0;
      pnl.acceso_instalaciones[m] += c.acceso_instalaciones || 0;
      pnl.tarjeta_bancaria[m] += c.tarjeta_bancaria_in || 0;

      // Impuestos
      pnl.imp_federal[m] += c.imp_federal || 0;
      pnl.imp_estatal[m] += c.imp_estatal || 0;

      // Promos redimibles
      pnl.promo_redimible[m] += c.promo_redimible || 0;

      // Maquinero: calculate per provider from corte data
      (c.proveedores || []).forEach(function(p) {
        var provCfg = cfg.proveedores[p.nombre] || cfg.proveedores[p.nombre.toUpperCase()];
        var pct = provCfg ? (provCfg.pct_maquinero || 0) : 0;
        if (pct > 0 && p.netwin > 0) {
          pnl.maquinero[m] += Math.round(p.netwin * pct / 100);
        }
      });
    });

    // Calculate totals
    for (var i = 0; i < 12; i++) {
      pnl.total_ingresos[i] = pnl.netwin[i] + pnl.acceso_instalaciones[i] + pnl.tarjeta_bancaria[i];
      pnl.total_costos[i] = pnl.maquinero[i] + pnl.imp_federal[i] + pnl.imp_estatal[i] + pnl.promo_redimible[i];
      pnl.margen_operativo[i] = pnl.total_ingresos[i] - pnl.total_costos[i];
    }

    return pnl;
  }

  // ═══════════════════════════════════════
  // ANALYTICS HELPERS
  // ═══════════════════════════════════════

  /** Get the corte immediately before the given date */
  function casinoPrevCorte(fecha) {
    if (!fecha) return null;
    const data = casinoLoad();
    const prev = data.cortes.filter(c => c.fecha < fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return prev[0] || null;
  }

  /** Get KPIs for the equivalent previous period */
  function casinoPrevKPIs(from, to) {
    if (!from || !to) return null;
    const d1 = new Date(from + 'T00:00:00');
    const d2 = new Date(to + 'T00:00:00');
    const span = Math.round((d2 - d1) / 86400000); // days
    const prevTo = new Date(d1); prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - span);
    const fmt2 = d => d.toISOString().slice(0, 10);
    return casinoKPIs(fmt2(prevFrom), fmt2(prevTo));
  }

  /** Daily series for trend charts: {labels, series: {field: [values]}} */
  function casinoDailySeries(from, to, fields) {
    const cortes = casinoCortes(from, to).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const labels = cortes.map(c => c.fecha);
    const series = {};
    fields.forEach(f => { series[f] = cortes.map(c => c[f] || 0); });
    return { labels, series, count: cortes.length };
  }

  /** Break-even analysis for promotions */
  function casinoBreakEven(kpis) {
    if (!kpis) return { breakeven: 0, ratio: 0, costo_terminal: 0, status: 'neutral' };
    const promo = kpis.total_promo_redimible || 0;
    const netwin = kpis.total_netwin || 0;
    const term = kpis.total_terminales || 0;
    const ratio = promo > 0 ? +(netwin / promo).toFixed(2) : (netwin > 0 ? 999 : 0);
    return {
      breakeven: promo,
      ratio: ratio,
      costo_terminal: term > 0 ? +(promo / term).toFixed(0) : 0,
      status: promo === 0 ? 'neutral' : (ratio >= 1 ? 'profit' : 'danger'),
      excedente: netwin - promo
    };
  }

  /** Auto-generate operational insights/alerts */
  function casinoInsights(kpis, prevKpis) {
    if (!kpis) return [];
    const ins = [];
    const f = typeof fmt === 'function' ? fmt : v => '$' + Math.round(v).toLocaleString('es-MX');

    // Hold bajo
    if (kpis.avg_hold > 0 && kpis.avg_hold < 5) {
      ins.push({ type: 'warn', icon: '⚠️', text: 'Hold promedio (' + kpis.avg_hold.toFixed(2) + '%) esta por debajo del rango ideal (5-10%). Las maquinas retienen poco del juego.' });
    }

    // Promos > Netwin
    if (kpis.total_promo_redimible > 0 && kpis.total_promo_redimible > kpis.total_netwin) {
      const diff = kpis.total_promo_redimible - kpis.total_netwin;
      ins.push({ type: 'alert', icon: '🔴', text: 'Promociones redimibles (' + f(kpis.total_promo_redimible) + ') superan el netwin (' + f(kpis.total_netwin) + ') por ' + f(diff) + '.' });
    }

    // Resultado negativo pero sin promos sería positivo
    if (kpis.total_resultado < 0 && kpis.resultado_sin_promos > 0) {
      ins.push({ type: 'info', icon: '💡', text: 'Sin promociones redimibles, el resultado seria positivo: ' + f(kpis.resultado_sin_promos) + '.' });
    }

    // Resultado positivo
    if (kpis.total_resultado > 0) {
      ins.push({ type: 'positive', icon: '✅', text: 'Resultado de caja positivo: ' + f(kpis.total_resultado) + '.' });
    }

    // Proveedores con hold negativo
    if (kpis.num_cortes === 1) {
      const data = casinoLoad();
      const lastCorte = data.cortes[0];
      if (lastCorte && lastCorte.proveedores) {
        const malos = lastCorte.proveedores.filter(p => p.hold < 0);
        if (malos.length) {
          const names = malos.map(p => p.nombre + ' (' + p.hold.toFixed(2) + '%)').join(', ');
          ins.push({ type: 'alert', icon: '🎰', text: 'Proveedores con hold negativo (perdiendo dinero): ' + names + '.' });
        }
      }
    }

    // Comparativo vs dia anterior
    if (prevKpis) {
      if (kpis.total_netwin > 0 && prevKpis.total_netwin > 0) {
        const pct = ((kpis.total_netwin - prevKpis.total_netwin) / prevKpis.total_netwin * 100).toFixed(1);
        const dir = pct > 0 ? '▲' : '▼';
        ins.push({ type: pct > 0 ? 'positive' : 'warn', icon: dir, text: 'Netwin ' + dir + ' ' + Math.abs(pct) + '% vs dia anterior (' + f(prevKpis.total_netwin) + ' → ' + f(kpis.total_netwin) + ').' });
      }
      if (prevKpis.avg_hold > 0) {
        const holdDiff = (kpis.avg_hold - prevKpis.avg_hold).toFixed(2);
        if (Math.abs(holdDiff) >= 1) {
          ins.push({ type: holdDiff > 0 ? 'positive' : 'warn', icon: holdDiff > 0 ? '▲' : '▼', text: 'Hold ' + (holdDiff > 0 ? '+' : '') + holdDiff + '% vs dia anterior (' + prevKpis.avg_hold.toFixed(2) + '% → ' + kpis.avg_hold.toFixed(2) + '%).' });
        }
      }
    }

    return ins;
  }

  /** Provider stats across multiple cortes: participation, daily avg */
  function casinoProviderStats(cortes) {
    if (!cortes || !cortes.length) return [];
    const agg = {};
    let totalNetwin = 0;
    const days = cortes.length;

    cortes.forEach(c => {
      (c.proveedores || []).forEach(p => {
        if (!agg[p.nombre]) agg[p.nombre] = { nombre: p.nombre, netwin: 0, jugado: 0, terminales: 0, days: 0 };
        agg[p.nombre].netwin += p.netwin || 0;
        agg[p.nombre].jugado += p.jugado || 0;
        agg[p.nombre].terminales = Math.max(agg[p.nombre].terminales, p.terminales || 0);
        agg[p.nombre].days++;
        totalNetwin += p.netwin || 0;
      });
    });

    return Object.values(agg).map(p => ({
      ...p,
      participacion: totalNetwin !== 0 ? +(p.netwin / totalNetwin * 100).toFixed(1) : 0,
      netwin_dia: days > 0 ? +(p.netwin / days).toFixed(0) : 0,
      hold: p.jugado > 0 ? +(p.netwin / p.jugado * 100).toFixed(2) : 0
    })).sort((a, b) => b.netwin - a.netwin);
  }

  /** KPIs for a period */
  function casinoKPIs(from, to) {
    const cortes = casinoCortes(from, to);
    if (!cortes.length) return null;
    const sum = (field) => cortes.reduce((s, c) => s + (c[field] || 0), 0);
    const avg = (field) => sum(field) / cortes.length;

    const total_entradas = sum('entradas');
    const total_salidas = sum('salidas');
    const total_premios_maquinas = sum('premios_maquinas');
    const total_premio_sorteo = sum('premio_sorteo');
    const total_promo_redimible = sum('promo_redimible');
    const total_promo_no_redimible = sum('promo_no_redimible');
    const total_cancel_promo_nr = sum('cancel_promo_nr');
    const total_netwin = sum('netwin');
    // Retención = siempre Federal + Estatal (más confiable que el campo separado)
    const total_retencion = (total_imp_federal + total_imp_estatal) || sum('retencion_premios');
    const total_imp_federal = sum('imp_federal');
    const total_imp_estatal = sum('imp_estatal');

    // Confirmed formulas
    const premios_brutos = total_premios_maquinas + total_premio_sorteo;
    const neto_promociones = total_promo_redimible + total_promo_no_redimible - total_cancel_promo_nr;
    const ganancia_neta_real = total_netwin - total_promo_redimible;
    const resultado_sin_promos = sum('resultado_caja') + total_promo_redimible;
    const total_terminales = Math.max(...cortes.map(c => c.terminales || 0), 0);
    const netwin_por_terminal = total_terminales > 0 ? total_netwin / total_terminales : 0;
    const pct_deposito = total_entradas > 0 ? (sum('deposito_juego_in') / total_entradas * 100) : 0;
    const pct_acceso = total_entradas > 0 ? (sum('acceso_instalaciones') / total_entradas * 100) : 0;
    const pct_tarjeta = total_entradas > 0 ? (sum('tarjeta_bancaria_in') / total_entradas * 100) : 0;
    // Pasivo
    const total_pasivo_redimible = sum('pasivo_redimible');
    const total_pasivo_no_redimible = sum('pasivo_no_redimible');
    // Balance
    const total_efectivo_caja = sum('efectivo_caja');
    const total_efectivo_entregado = sum('efectivo_entregado');
    const total_faltante = sum('efectivo_faltante');
    const total_sobrante = sum('efectivo_sobrante');

    return {
      num_cortes: cortes.length,
      // Totales caja
      total_entradas,
      total_salidas,
      total_resultado: sum('resultado_caja'),
      // Desglose entradas
      total_deposito_juego_in: sum('deposito_juego_in'),
      total_acceso_instalaciones: sum('acceso_instalaciones'),
      total_tarjeta_bancaria: sum('tarjeta_bancaria_in'),
      pct_deposito, pct_acceso, pct_tarjeta,
      // Desglose salidas
      total_deposito_juego_out: sum('deposito_juego_out'),
      total_pago_premios: sum('pago_premios'),
      // Premios
      total_premios_maquinas,
      total_premio_sorteo,
      premios_brutos,
      // Impuestos — Federal 1% + Estatal 6% = 7% sobre premios brutos (Art. 137-139 LISR + Chiapas)
      total_imp_federal,
      total_imp_estatal,
      total_retencion,
      base_imponible: premios_brutos,
      pct_imp_efectivo: premios_brutos > 0 ? (total_retencion / premios_brutos * 100) : 0,
      // Promociones
      total_promo_redimible,
      total_promo_no_redimible,
      total_cancel_promo_nr,
      neto_promociones,
      // Rentabilidad
      ganancia_neta_real,
      resultado_sin_promos,
      // Maquinas
      total_jugado: sum('jugado'),
      total_netwin,
      avg_hold: avg('hold_pct'),
      total_terminales,
      netwin_por_terminal,
      // Ocupacion
      avg_ocupacion: avg('ocupacion_actual'),
      total_aforo: sum('aforo_total'),
      total_altas: sum('altas'),
      // Balance
      total_efectivo_caja,
      total_efectivo_entregado,
      total_faltante,
      total_sobrante,
      total_pagos_manuales: sum('pagos_manuales'),
      // Pasivo
      total_pasivo_redimible,
      total_pasivo_no_redimible,
      total_pasivo: total_pasivo_redimible + total_pasivo_no_redimible,
      // Bancos moviles
      total_bancos_moviles: sum('bancos_moviles'),
      total_depositos_caja: sum('depositos_caja'),
    };
  }

  // ═══════════════════════════════════════
  // EXPOSE
  // ═══════════════════════════════════════
  window.CASINO_KEY = CASINO_KEY;
  window.CASINO_CONFIG_KEY = CASINO_CONFIG_KEY;
  window.casinoLoad = casinoLoad;
  window.casinoConfigLoad = casinoConfigLoad;
  window.casinoConfigSave = casinoConfigSave;
  window.casinoSave = casinoSave;
  window.casinoAddCorte = casinoAddCorte;
  window.casinoDeleteCorte = casinoDeleteCorte;
  window.parseCasinoPDF = parseCasinoPDF;
  window.parseCasinoResumenExcel = parseCasinoResumenExcel;
  window.detectCasinoExcelType = detectCasinoExcelType;
  window.parseCasinoExcel = parseCasinoExcel;
  window.casinoPrevCorte = casinoPrevCorte;
  window.casinoPrevKPIs = casinoPrevKPIs;
  window.casinoDailySeries = casinoDailySeries;
  window.casinoBreakEven = casinoBreakEven;
  window.casinoInsights = casinoInsights;
  window.casinoProviderStats = casinoProviderStats;
  window.casinoCortes = casinoCortes;
  window.casinoMonthlyNetwin = casinoMonthlyNetwin;
  window.casinoMonthlyPnL = casinoMonthlyPnL;
  window.casinoKPIs = casinoKPIs;

})(window);
