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

    // Helper: find $ amounts near a label
    const findAmount = (label) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(label.toLowerCase())) {
          // Check same line for $amount
          const m = lines[i].match(/\$[\d,]+\.?\d*/);
          if (m) return parseFloat(m[0].replace(/[$,]/g, ''));
          // Check next line
          if (i + 1 < lines.length) {
            const m2 = lines[i + 1].match(/\$[\d,]+\.?\d*/);
            if (m2) return parseFloat(m2[0].replace(/[$,]/g, ''));
          }
        }
      }
      return 0;
    };

    const findNumber = (label) => {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(label.toLowerCase())) {
          const m = lines[i].match(/[\d,]+\.?\d*/);
          if (m) return parseFloat(m[0].replace(/,/g, ''));
          if (i + 1 < lines.length) {
            const m2 = lines[i + 1].match(/[\d,]+\.?\d*/);
            if (m2) return parseFloat(m2[0].replace(/,/g, ''));
          }
        }
      }
      return 0;
    };

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

    // Dates
    let desde = '', hasta = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Desde:/i) && i + 1 < lines.length) {
        desde = lines[i + 1].trim() || lines[i].replace(/Desde:\s*/i, '').trim();
      }
      if (lines[i].match(/^Hasta:/i) && i + 1 < lines.length) {
        hasta = lines[i + 1].trim() || lines[i].replace(/Hasta:\s*/i, '').trim();
      }
    }
    // Parse date from "4/1/2026 8:00 AM" format
    const dateMatch = desde.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      corte.fecha = `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
    }
    const timeFrom = desde.match(/\d{1,2}:\d{2}\s*[AP]M/i);
    const timeTo = hasta.match(/\d{1,2}:\d{2}\s*[AP]M/i);
    if (timeFrom && timeTo) {
      corte.turno = `${timeFrom[0]} - ${timeTo[0]}`;
    }
    corte.id = `corte_${corte.fecha}_${(corte.turno || '').replace(/[^0-9AMP]/gi, '')}`;

    // Caja
    corte.entradas = findAmount('Total Entradas');
    corte.salidas = findAmount('Total Salidas');
    corte.retencion_premios = findAmount('Retención Premios');
    corte.resultado_caja = findAmount('Resultado de Caja');

    // Maquinas — search for main stats block
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Jugado$/i) && i + 1 < lines.length) {
        const m = lines[i + 1].match(/\$[\d,]+\.?\d*/);
        if (m) corte.jugado = parseFloat(m[0].replace(/[$,]/g, ''));
      }
      if (lines[i].match(/^Netwin$/i) && i + 1 < lines.length) {
        const m = lines[i + 1].match(/\$[\d,]+\.?\d*/);
        if (m) corte.netwin = parseFloat(m[0].replace(/[$,]/g, ''));
      }
      if (lines[i].match(/^Hold$/i) && i + 1 < lines.length) {
        const m = lines[i + 1].match(/([\d.]+)%/);
        if (m) corte.hold_pct = parseFloat(m[1]);
      }
      if (lines[i].match(/^Num\. Terminales$/i) && i + 1 < lines.length) {
        corte.terminales = parseInt(lines[i + 1]) || 0;
      }
      if (lines[i].match(/^Netwin\/Term\.$/i) && i + 1 < lines.length) {
        const m = lines[i + 1].match(/\$[\d,]+\.?\d*/);
        if (m) corte.netwin_terminal = parseFloat(m[0].replace(/[$,]/g, ''));
      }
    }

    // Pasivo
    corte.pasivo_redimible = findAmount('Redimible');
    corte.pasivo_no_redimible = findAmount('No Redimible');

    // Ocupacion
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Sesiones:/i)) {
        if (i + 1 < lines.length) corte.sesiones = parseInt(lines[i + 1]) || 0;
      }
      if (lines[i].match(/^Actual:/i)) {
        if (i + 1 < lines.length) { const m = lines[i + 1].match(/([\d.]+)%/); if (m) corte.ocupacion_actual = parseFloat(m[1]); }
      }
      if (lines[i].match(/^En el periodo:/i)) {
        if (i + 1 < lines.length) { const m = lines[i + 1].match(/([\d.]+)%/); if (m) corte.ocupacion_periodo = parseFloat(m[1]); }
      }
    }

    // Aforo
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Hombres:/i)) {
        if (i + 1 < lines.length) corte.aforo_hombres = parseInt(lines[i + 1]) || 0;
      }
      if (lines[i].match(/^Mujeres:/i)) {
        if (i + 1 < lines.length) corte.aforo_mujeres = parseInt(lines[i + 1]) || 0;
      }
      if (lines[i].match(/^Total:/i) && i > 5) { // skip early "Total" matches
        const nextVal = parseInt(lines[i + 1]);
        if (nextVal > 0 && nextVal < 10000 && !corte.aforo_total) corte.aforo_total = nextVal;
      }
    }

    // Cuentas
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^Altas:/i) && i + 1 < lines.length) corte.altas = parseInt(lines[i + 1]) || 0;
      if (lines[i].match(/^Activo <= 30:/i) && i + 1 < lines.length) corte.cuentas_activas_30 = parseInt(lines[i + 1]) || 0;
      if (lines[i].match(/^Activo <= 90:/i) && i + 1 < lines.length) corte.cuentas_activas_90 = parseInt(lines[i + 1]) || 0;
      if (lines[i].match(/^Activo <= 180:/i) && i + 1 < lines.length) corte.cuentas_activas_180 = parseInt(lines[i + 1]) || 0;
      if (lines[i].match(/^Inactivo:/i) && i + 1 < lines.length) corte.cuentas_inactivas = parseInt(lines[i + 1].replace(/,/g, '')) || 0;
    }
    corte.cuentas_total = corte.altas + corte.cuentas_activas_30 + corte.cuentas_activas_90 + corte.cuentas_activas_180 + corte.cuentas_inactivas;

    // Proveedores — look for "Estadísticas por Proveedor" section
    const provSection = text.indexOf('Estad');
    if (provSection >= 0) {
      const provText = text.substring(provSection);
      const provLines = provText.split('\n').map(l => l.trim()).filter(Boolean);
      // Known providers pattern: name followed by Jugado/Netwin/Hold/etc
      const provNames = [];
      for (let i = 0; i < provLines.length; i++) {
        // Provider name is a line that's all uppercase and short
        if (provLines[i].match(/^[A-Z]{2,20}$/) && provLines[i] !== 'Total:') {
          provNames.push({ name: provLines[i], idx: i });
        }
      }

      for (const prov of provNames) {
        const p = { nombre: prov.name, jugado: 0, netwin: 0, hold: 0, terminales: 0, netwin_terminal: 0 };
        // Search next ~10 lines for values
        for (let j = prov.idx + 1; j < Math.min(prov.idx + 12, provLines.length); j++) {
          const line = provLines[j];
          if (line.match(/^Jugado$/i) && j + 1 < provLines.length) {
            const m = provLines[j + 1].match(/\$[\d,]+\.?\d*/);
            if (m) p.jugado = parseFloat(m[0].replace(/[$,]/g, ''));
          }
          if (line.match(/^Netwin$/i) && j + 1 < provLines.length) {
            const m = provLines[j + 1].match(/\$[\d,]+\.?\d*/);
            if (m) p.netwin = parseFloat(m[0].replace(/[$,]/g, ''));
          }
          if (line.match(/^Hold$/i) && j + 1 < provLines.length) {
            const m = provLines[j + 1].match(/([\d.]+)%/);
            if (m) p.hold = parseFloat(m[1]);
          }
          if (line.match(/^Num\. Terminales$/i) && j + 1 < provLines.length) {
            p.terminales = parseInt(provLines[j + 1]) || 0;
          }
          if (line.match(/^Netwin\/Term\.$/i) && j + 1 < provLines.length) {
            const m = provLines[j + 1].match(/\$[\d,]+\.?\d*/);
            if (m) p.netwin_terminal = parseFloat(m[0].replace(/[$,]/g, ''));
          }
        }
        if (p.jugado > 0 || p.netwin > 0) corte.proveedores.push(p);
      }
    }

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
