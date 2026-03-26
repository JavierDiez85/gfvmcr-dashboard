// ═══════════════════════════════════════════════════════════
// XLSX COMPAT — SheetJS-compatible API backed by ExcelJS
// Elimina dependencia de xlsx@0.18.5 (CVE-2023-30533 + ReDoS)
// y quita necesidad de 'unsafe-eval' en CSP.
//
// API expuesta: window.XLSX con:
//   XLSX.read(buffer, opts)          → async → workbook
//   XLSX.writeFile(wb, filename)     → async → descarga
//   XLSX.utils.sheet_to_json(ws, o)  → sync
//   XLSX.utils.json_to_sheet(data)   → sync
//   XLSX.utils.aoa_to_sheet(data)    → sync
//   XLSX.utils.book_new()            → sync
//   XLSX.utils.book_append_sheet()   → sync
// ═══════════════════════════════════════════════════════════
(function(window) {
  'use strict';

  // ── Extrae el valor de una celda ExcelJS ──────────────────
  function _v(cell, defval) {
    if (!cell || cell.value === null || cell.value === undefined) {
      return defval !== undefined ? defval : '';
    }
    const v = cell.value;
    if (v instanceof Date) return v;
    // Celda con fórmula → usar resultado evaluado
    if (v !== null && typeof v === 'object' && 'result' in v) return v.result;
    // Texto enriquecido
    if (v !== null && typeof v === 'object' && Array.isArray(v.richText)) {
      return v.richText.map(function(r) { return r.text || ''; }).join('');
    }
    return v;
  }

  // ── Workbook wrapper ──────────────────────────────────────
  function _Wb() {
    this.SheetNames = [];
    this.Sheets = {};
  }

  // ── XLSX.read — ASYNC ─────────────────────────────────────
  async function xlsxRead(data) {
    const wb  = new _Wb();
    const exWb = new ExcelJS.Workbook();
    // ExcelJS acepta ArrayBuffer directamente
    const buf = data instanceof ArrayBuffer ? data
      : (data.buffer instanceof ArrayBuffer ? data.buffer : data);
    await exWb.xlsx.load(buf);
    exWb.worksheets.forEach(function(ws) {
      wb.SheetNames.push(ws.name);
      wb.Sheets[ws.name] = ws; // worksheet ExcelJS directo
    });
    return wb;
  }

  // ── XLSX.utils.sheet_to_json ──────────────────────────────
  function sheet_to_json(ws, opts) {
    opts = opts || {};
    const defval = opts.defval;
    const result = [];

    // ── Modo array (header: 1) ──
    if (opts.header === 1) {
      ws.eachRow({ includeEmpty: false }, function(row) {
        const arr = [];
        const maxCol = row.cellCount;
        for (var c = 1; c <= maxCol; c++) {
          arr.push(_v(row.getCell(c), defval !== undefined ? defval : null));
        }
        result.push(arr);
      });
      return result;
    }

    // Fila de cabecera: 1-indexed (ExcelJS). opts.range=N → header en fila N+1
    const headerRow = (typeof opts.range === 'number') ? opts.range + 1 : 1;
    let headers = null;

    ws.eachRow({ includeEmpty: false }, function(row, rowNum) {
      if (rowNum === headerRow) {
        headers = [];
        const maxCol = row.cellCount;
        for (var c = 1; c <= maxCol; c++) {
          headers.push(String(_v(row.getCell(c), '') || ''));
        }
        return;
      }
      if (rowNum <= headerRow || !headers) return;

      const obj = {};
      // Pre-rellenar con defval si se especificó
      if (defval !== undefined) {
        headers.forEach(function(h) { if (h) obj[h] = defval; });
      }
      const maxCol = Math.max(row.cellCount, headers.length);
      for (var c = 1; c <= maxCol; c++) {
        const h = headers[c - 1];
        if (!h) continue;
        const val = _v(row.getCell(c), defval);
        obj[h] = (val !== undefined && val !== null) ? val : (defval !== undefined ? defval : '');
      }
      result.push(obj);
    });

    return result;
  }

  // ── XLSX.utils.json_to_sheet ──────────────────────────────
  function json_to_sheet(data) {
    // Retorna descriptor — procesado en writeFile
    return { _type: 'json', _data: data || [] };
  }

  // ── XLSX.utils.aoa_to_sheet ───────────────────────────────
  function aoa_to_sheet(data) {
    return { _type: 'aoa', _data: data || [] };
  }

  // ── XLSX.utils.book_new ───────────────────────────────────
  function book_new() { return new _Wb(); }

  // ── XLSX.utils.book_append_sheet ─────────────────────────
  function book_append_sheet(wb, ws, name) {
    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
  }

  // ── XLSX.writeFile — ASYNC ────────────────────────────────
  async function writeFile(wb, filename) {
    const exWb = new ExcelJS.Workbook();

    wb.SheetNames.forEach(function(name) {
      const sd = wb.Sheets[name];
      const ws = exWb.addWorksheet(name);
      // Anchos de columna definidos con ws['!cols'] = [{wch:N}, ...]
      const cols = sd['!cols'] || [];

      if (sd._type === 'json') {
        const data = sd._data;
        if (data && data.length > 0) {
          const keys = Object.keys(data[0]);
          ws.columns = keys.map(function(k, i) {
            return { header: k, key: k, width: (cols[i] && cols[i].wch) ? cols[i].wch : 18 };
          });
          data.forEach(function(row) { ws.addRow(row); });
        }
      } else if (sd._type === 'aoa') {
        sd._data.forEach(function(row) { ws.addRow(row); });
        // Aplicar anchos si se definieron
        if (cols.length && ws.columns) {
          ws.columns = ws.columns.map(function(c, i) {
            return { ...c, width: (cols[i] && cols[i].wch) ? cols[i].wch : (c.width || 12) };
          });
        }
      }
    });

    const buffer = await exWb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Exponer como window.XLSX ──────────────────────────────
  window.XLSX = {
    read:      xlsxRead,
    writeFile: writeFile,
    utils: {
      sheet_to_json:    sheet_to_json,
      json_to_sheet:    json_to_sheet,
      aoa_to_sheet:     aoa_to_sheet,
      book_new:         book_new,
      book_append_sheet: book_append_sheet,
    },
  };

})(window);
