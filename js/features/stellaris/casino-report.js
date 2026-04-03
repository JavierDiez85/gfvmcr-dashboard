// GF — Stellaris Casino: PDF Report Generator (browser-side)
(function(window) {
  'use strict';

  const RED = '#e53935', GREEN = '#00b875', BLUE = '#0073ea',
        ORANGE = '#ff7043', PURPLE = '#9b51e0', DARK = '#1a1a2e',
        MUTED = '#6b7280', LIGHT_BG = '#f8f9fa', BORDER = '#e5e7eb';

  function _fmtR(v) {
    if (!v && v !== 0) return '$0';
    return (v < 0 ? '-' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('es-MX');
  }
  function _fmtD(v) {
    if (!v && v !== 0) return '$0.00';
    return (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Generate casino executive report PDF from current data + filter
   * @param {string} [filter] — period filter ('hoy','ayer','semana','mes',...) or null for 'todo'
   * @param {boolean} [autoDownload=true] — trigger browser download
   * @returns {jsPDF} the doc instance
   */
  function casinoGenerateReport(filter, autoDownload) {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      toast && toast('jsPDF no cargado. Recarga la pagina.');
      return null;
    }
    if (autoDownload === undefined) autoDownload = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const ML = 14, MR = 14;
    const CW = W - ML - MR;
    let Y = 14;

    // Get data for the period
    const range = typeof _casinoDateRange === 'function'
      ? (window._casinoDateRange || window.rCasinoDashboard, _casinoDateRange(filter || 'todo'))
      : { from: null, to: null, label: 'Todo' };

    // Try using dashboard's internal function
    let dateRange;
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const fmt2 = d => d.toISOString().slice(0,10);
      const to = fmt2(today);
      const f = filter || 'todo';
      if (f === 'hoy') dateRange = { from: to, to, label: 'Hoy' };
      else if (f === 'ayer') { const y = new Date(today); y.setDate(y.getDate()-1); dateRange = { from: fmt2(y), to: fmt2(y), label: 'Ayer' }; }
      else if (f === 'semana') { const w = new Date(today); w.setDate(w.getDate()-6); dateRange = { from: fmt2(w), to, label: 'Ultimos 7 dias' }; }
      else if (f === 'mes') { const m = new Date(today.getFullYear(), today.getMonth(), 1); dateRange = { from: fmt2(m), to, label: 'Este mes' }; }
      else if (f === 'trimestre') { const q = new Date(today.getFullYear(), Math.floor(today.getMonth()/3)*3, 1); dateRange = { from: fmt2(q), to, label: 'Este trimestre' }; }
      else if (f === 'semestre') { const s = new Date(today.getFullYear(), today.getMonth()<6?0:6, 1); dateRange = { from: fmt2(s), to, label: 'Este semestre' }; }
      else if (f === 'anual') { const a = new Date(today.getFullYear(), 0, 1); dateRange = { from: fmt2(a), to, label: String(today.getFullYear()) }; }
      else dateRange = { from: null, to: null, label: 'Todo el historial' };
    } catch(e) { dateRange = { from: null, to: null, label: 'Todo' }; }

    const cortes = casinoCortes(dateRange.from, dateRange.to);
    const kpis = casinoKPIs(dateRange.from, dateRange.to) || {};
    const last = cortes[0] || {};
    const fechaHoy = new Date().toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' });

    // ─── HELPERS ───
    function addPageFooter() {
      doc.setFontSize(6); doc.setTextColor(MUTED);
      doc.text('ERP Grupo Financiero VMCR · Fuente: Sistema Wigos · ' + fechaHoy, W/2, H-8, { align: 'center' });
      doc.text('Pag. ' + doc.internal.getNumberOfPages(), W - MR, H - 8, { align: 'right' });
    }

    function checkPage(need) {
      if (Y + need > H - 18) { addPageFooter(); doc.addPage(); Y = 14; }
    }

    function sectionTitle(icon, text) {
      checkPage(12);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK);
      doc.text(icon + ' ' + text, ML, Y); Y += 7;
    }

    // ─── PAGE 1: HEADER + KPIs + FLUJO ───
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK);
    doc.text('Informe Operativo — Casino Stellaris', ML, Y); Y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED);
    doc.text((last.sala || 'Grand Tuxtla Casino') + ' · ' + dateRange.label + ' · ' + cortes.length + ' corte' + (cortes.length !== 1 ? 's' : ''), ML, Y);
    Y += 8;

    // KPIs row
    const kpiData = [
      ['NETWIN', _fmtR(kpis.total_netwin), GREEN],
      ['RESULTADO', _fmtR(kpis.total_resultado), kpis.total_resultado >= 0 ? GREEN : RED],
      ['HOLD %', kpis.avg_hold ? kpis.avg_hold.toFixed(2) + '%' : '--', BLUE],
      ['JUGADO', _fmtR(kpis.total_jugado), PURPLE],
    ];
    const kpiW = CW / 4;
    kpiData.forEach(function(k, i) {
      const x = ML + i * kpiW;
      doc.setFillColor(LIGHT_BG); doc.roundedRect(x, Y, kpiW - 2, 14, 2, 2, 'F');
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(k[2]);
      doc.text(k[1], x + kpiW/2 - 1, Y + 7, { align: 'center' });
      doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED);
      doc.text(k[0], x + kpiW/2 - 1, Y + 12, { align: 'center' });
    });
    Y += 18;

    // ─── FLUJO DE DINERO ───
    sectionTitle('$', 'Flujo de Dinero');
    doc.autoTable({
      startY: Y, margin: { left: ML, right: MR },
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 }, lineColor: BORDER, lineWidth: 0.2 },
      headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 7 },
      head: [['Concepto', 'Monto', '%']],
      body: [
        [{ content: 'ENTRADAS', colSpan: 3, styles: { fillColor: '#f0fdf4', fontStyle: 'bold', textColor: '#166534' } }],
        ['Deposito de Juego', _fmtR(kpis.total_deposito_juego_in), kpis.pct_deposito ? kpis.pct_deposito.toFixed(1)+'%' : ''],
        ['Acceso e Instalaciones', _fmtR(kpis.total_acceso_instalaciones), kpis.pct_acceso ? kpis.pct_acceso.toFixed(1)+'%' : ''],
        ['Tarjeta Bancaria', _fmtR(kpis.total_tarjeta_bancaria), kpis.pct_tarjeta ? kpis.pct_tarjeta.toFixed(1)+'%' : ''],
        [{ content: '= TOTAL ENTRADAS', styles: { fontStyle: 'bold' } }, { content: _fmtR(kpis.total_entradas), styles: { fontStyle: 'bold' } }, ''],
        [{ content: 'SALIDAS', colSpan: 3, styles: { fillColor: '#fef2f2', fontStyle: 'bold', textColor: '#991b1b' } }],
        ['Devolucion Depositos', _fmtR(kpis.total_deposito_juego_out), ''],
        ['Pago de Premios', _fmtR(kpis.total_pago_premios), ''],
        [{ content: '= TOTAL SALIDAS', styles: { fontStyle: 'bold' } }, { content: _fmtR(kpis.total_salidas), styles: { fontStyle: 'bold' } }, ''],
        [{ content: 'IMPUESTOS (Art. 137-139 LISR + Chiapas)', colSpan: 3, styles: { fillColor: '#eff6ff', fontStyle: 'bold', textColor: '#1e40af' } }],
        ['Federal ISR (1%)', _fmtR(kpis.total_imp_federal), ''],
        ['Estatal Chiapas (6%)', _fmtR(kpis.total_imp_estatal), ''],
        [{ content: '= RETENCION (7%)', styles: { fontStyle: 'bold' } }, { content: _fmtR(kpis.total_retencion), styles: { fontStyle: 'bold' } }, ''],
        [{ content: 'Base imponible (premios brutos)', styles: { fontSize: 6, textColor: MUTED } }, { content: _fmtR(kpis.premios_brutos), styles: { fontSize: 6, textColor: MUTED } }, ''],
        [{ content: 'RESULTADO', styles: { fontStyle: 'bold', fillColor: DARK, textColor: '#fff', fontSize: 9 } },
         { content: _fmtR(kpis.total_resultado), styles: { fontStyle: 'bold', fillColor: DARK, textColor: '#fff', fontSize: 9 } }, { content: '', styles: { fillColor: DARK } }],
      ],
      columnStyles: { 0: { cellWidth: CW * 0.55 }, 1: { cellWidth: CW * 0.30, halign: 'right' }, 2: { cellWidth: CW * 0.15, halign: 'right', textColor: MUTED, fontSize: 6.5 } },
    });
    Y = doc.lastAutoTable.finalY + 2;
    doc.setFontSize(5.5); doc.setTextColor(MUTED);
    doc.text('Formula: Entradas - Salidas - Retencion = Resultado', ML, Y); Y += 6;

    // ─── PROVEEDORES ───
    if (last.proveedores && last.proveedores.length) {
      sectionTitle('#', 'Rendimiento por Proveedor (' + (last.fecha || '') + ')');
      const provRows = last.proveedores.map(function(p) {
        const sem = p.hold >= 10 ? 'Excelente' : p.hold >= 5 ? 'Bueno' : p.hold >= 0 ? 'Hold bajo' : 'Perdida';
        return [
          p.nombre,
          _fmtR(p.jugado),
          { content: _fmtR(p.netwin), styles: { textColor: p.netwin >= 0 ? GREEN : RED, fontStyle: 'bold' } },
          { content: p.hold.toFixed(2) + '%', styles: { textColor: p.hold >= 10 ? GREEN : p.hold >= 5 ? BLUE : p.hold >= 0 ? ORANGE : RED } },
          String(p.terminales),
          _fmtR(p.netwin_terminal || (p.terminales ? Math.round(p.netwin/p.terminales) : 0)),
          sem
        ];
      });
      provRows.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: _fmtR(last.jugado), styles: { fontStyle: 'bold' } },
        { content: _fmtR(last.netwin), styles: { fontStyle: 'bold', textColor: GREEN } },
        { content: (last.hold_pct ? last.hold_pct.toFixed(2)+'%' : '--'), styles: { fontStyle: 'bold' } },
        { content: String(last.terminales || ''), styles: { fontStyle: 'bold' } },
        { content: _fmtR(last.netwin_terminal), styles: { fontStyle: 'bold' } },
        ''
      ]);
      doc.autoTable({
        startY: Y, margin: { left: ML, right: MR },
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.15 },
        headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 6.5 },
        head: [['Proveedor', 'Jugado', 'Netwin', 'Hold%', 'Term.', 'Netwin/T', 'Estado']],
        body: provRows,
        columnStyles: {
          0: { cellWidth: 22 }, 1: { halign: 'right', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 22 }, 3: { halign: 'right', cellWidth: 17 },
          4: { halign: 'center', cellWidth: 13 }, 5: { halign: 'right', cellWidth: 22 },
          6: { cellWidth: CW - 121, fontSize: 6, textColor: MUTED }
        },
      });
      Y = doc.lastAutoTable.finalY + 2;
      doc.setFontSize(5); doc.setTextColor(MUTED);
      doc.text('Semaforo: Hold>=10% (Excelente) | >=5% (Bueno) | 0-5% (Hold bajo) | negativo (Perdida)', ML, Y);
      Y += 6;
    }

    // ─── PAGE 2: PREMIOS + RENTABILIDAD ───
    checkPage(60);
    sectionTitle('!', 'Premios y Promociones');
    doc.autoTable({
      startY: Y, margin: { left: ML, right: MR },
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.2 },
      head: [['Concepto', 'Monto']],
      headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 7 },
      body: [
        [{ content: 'PREMIOS', colSpan: 2, styles: { fillColor: LIGHT_BG, fontStyle: 'bold' } }],
        ['Premios Maquinas', _fmtD(kpis.total_premios_maquinas)],
        ['Premios Sorteo', _fmtD(kpis.total_premio_sorteo)],
        [{ content: 'Premios Brutos (base imponible)', styles: { fontStyle: 'bold' } }, { content: _fmtD(kpis.premios_brutos), styles: { fontStyle: 'bold' } }],
        [{ content: 'IMPUESTOS SOBRE PREMIOS', colSpan: 2, styles: { fillColor: '#eff6ff', fontStyle: 'bold', textColor: '#1e40af' } }],
        ['Federal ISR 1% (Art. 137-139 LISR)', _fmtD(kpis.total_imp_federal)],
        ['Estatal Chiapas 6%', _fmtD(kpis.total_imp_estatal)],
        [{ content: 'Retencion Total 7%', styles: { fontStyle: 'bold' } }, { content: _fmtD(kpis.total_retencion), styles: { fontStyle: 'bold' } }],
        ['Pago de Premios (neto de retencion)', _fmtD(kpis.total_pago_premios)],
        [{ content: 'PROMOCIONES', colSpan: 2, styles: { fillColor: LIGHT_BG, fontStyle: 'bold' } }],
        ['Redimibles (sorteos cobrables)', _fmtD(kpis.total_promo_redimible)],
        ['No Redimibles (solo jugar)', _fmtD(kpis.total_promo_no_redimible)],
        ['Cancelaciones NR', '-' + _fmtD(kpis.total_cancel_promo_nr)],
        [{ content: 'Neto Promociones', styles: { fontStyle: 'bold' } }, { content: _fmtD(kpis.neto_promociones), styles: { fontStyle: 'bold' } }],
      ],
      columnStyles: { 0: { cellWidth: CW * 0.65 }, 1: { cellWidth: CW * 0.35, halign: 'right' } },
    });
    Y = doc.lastAutoTable.finalY + 2;
    doc.setFontSize(5.5); doc.setTextColor(MUTED);
    doc.text('Nota: Promo Redimible = Premio Sorteo (fichas gratis cobradas como premios reales)', ML, Y);
    Y += 8;

    // ─── RENTABILIDAD ───
    sectionTitle('>', 'Analisis de Rentabilidad');
    doc.autoTable({
      startY: Y, margin: { left: ML, right: MR },
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
      body: [
        [{ content: 'Ganancia Maquinas (Netwin)', styles: { fontStyle: 'bold' } }, { content: _fmtR(kpis.total_netwin), styles: { fontStyle: 'bold', textColor: GREEN } }],
        [{ content: '  Hold ' + (kpis.avg_hold ? kpis.avg_hold.toFixed(2)+'%' : '--') + ' | ' + (kpis.total_terminales||0) + ' terminales | ' + _fmtR(kpis.netwin_por_terminal) + '/terminal', colSpan: 2, styles: { fontSize: 6, textColor: MUTED } }],
        [{ content: 'Costo Promociones Redimibles', styles: { fontStyle: 'bold' } }, { content: '-' + _fmtR(kpis.total_promo_redimible), styles: { fontStyle: 'bold', textColor: RED } }],
        [{ content: '= Ganancia Neta Real', styles: { fontStyle: 'bold', fillColor: '#e8edf3' } }, { content: _fmtR(kpis.ganancia_neta_real), styles: { fontStyle: 'bold', fillColor: '#e8edf3', textColor: (kpis.ganancia_neta_real||0) >= 0 ? GREEN : RED } }],
        ['Impuestos Pagados (7%)', { content: '-' + _fmtR(kpis.total_retencion), styles: { textColor: RED } }],
        [{ content: 'RESULTADO DE CAJA', styles: { fontStyle: 'bold', fillColor: DARK, textColor: '#fff', fontSize: 9.5 } },
         { content: _fmtR(kpis.total_resultado), styles: { fontStyle: 'bold', fillColor: DARK, textColor: '#fff', fontSize: 9.5 } }],
        [{ content: 'Sin promociones seria', styles: { fillColor: '#f0fdf4' } },
         { content: _fmtR(kpis.resultado_sin_promos), styles: { fillColor: '#f0fdf4', textColor: GREEN, fontStyle: 'bold' } }],
      ],
      columnStyles: { 0: { cellWidth: CW * 0.65 }, 1: { cellWidth: CW * 0.35, halign: 'right' } },
    });
    Y = doc.lastAutoTable.finalY + 2;
    doc.setFontSize(5.5); doc.setTextColor(MUTED);
    doc.text('El resultado es negativo cuando las promos redimibles (sorteos) superan el netwin de maquinas', ML, Y);
    Y += 8;

    // ─── OCUPACION KPIs ───
    checkPage(18);
    const occData = [
      ['OCUPACION', kpis.avg_ocupacion ? kpis.avg_ocupacion.toFixed(1)+'%' : '--'],
      ['AFORO', String(kpis.total_aforo || 0)],
      ['ALTAS', String(kpis.total_altas || 0)],
      ['TERMINALES', String(kpis.total_terminales || 0)],
    ];
    const occW = CW / 4;
    occData.forEach(function(o, i) {
      var x = ML + i * occW;
      doc.setFillColor(LIGHT_BG); doc.roundedRect(x, Y, occW - 2, 12, 2, 2, 'F');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(BLUE);
      doc.text(o[1], x + occW/2 - 1, Y + 6, { align: 'center' });
      doc.setFontSize(5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED);
      doc.text(o[0], x + occW/2 - 1, Y + 10.5, { align: 'center' });
    });
    Y += 16;

    // ─── BALANCE ───
    if (kpis.total_efectivo_caja) {
      checkPage(30);
      sectionTitle('B', 'Balance de Caja');
      doc.autoTable({
        startY: Y, margin: { left: ML, right: MR },
        theme: 'striped',
        styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.15 },
        headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 7 },
        head: [['Concepto', 'Monto']],
        body: [
          ['Efectivo en caja', _fmtD(kpis.total_efectivo_caja)],
          ['Entregado', _fmtD(kpis.total_efectivo_entregado)],
          ['Faltante', _fmtD(kpis.total_faltante)],
          ['Sobrante', _fmtD(kpis.total_sobrante)],
          ['Tarjeta Bancaria', _fmtD(kpis.total_tarjeta_bancaria)],
          ['Depositos de caja', _fmtD(kpis.total_depositos_caja)],
        ],
        columnStyles: { 0: { cellWidth: CW * 0.65 }, 1: { cellWidth: CW * 0.35, halign: 'right' } },
      });
      Y = doc.lastAutoTable.finalY + 4;
    }

    // ─── PASIVO ───
    if (kpis.total_pasivo) {
      checkPage(20);
      sectionTitle('P', 'Pasivo Final');
      doc.autoTable({
        startY: Y, margin: { left: ML, right: MR },
        theme: 'striped',
        styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.15 },
        headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 7 },
        head: [['Tipo', 'Monto']],
        body: [
          ['Redimible', _fmtD(kpis.total_pasivo_redimible)],
          ['No Redimible', _fmtD(kpis.total_pasivo_no_redimible)],
          [{ content: 'Total Pasivo', styles: { fontStyle: 'bold', fillColor: '#e8edf3' } },
           { content: _fmtD(kpis.total_pasivo), styles: { fontStyle: 'bold', fillColor: '#e8edf3' } }],
        ],
        columnStyles: { 0: { cellWidth: CW * 0.65 }, 1: { cellWidth: CW * 0.35, halign: 'right' } },
      });
      Y = doc.lastAutoTable.finalY + 4;
    }

    // ─── CAJEROS ───
    if (last.cajeros && last.cajeros.length) {
      checkPage(30);
      sectionTitle('C', 'Control de Caja — Cajeros (' + last.cajeros.length + ')');
      var cajRows = last.cajeros.map(function(c) {
        return [c.nombre, _fmtR(c.entradas), _fmtR(c.salidas), _fmtR(c.impuestos), _fmtR(c.resultado)];
      });
      doc.autoTable({
        startY: Y, margin: { left: ML, right: MR },
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: BORDER, lineWidth: 0.15 },
        headStyles: { fillColor: DARK, textColor: '#fff', fontStyle: 'bold', fontSize: 6.5 },
        head: [['Cajero', 'Entradas', 'Salidas', 'Impuestos', 'Resultado']],
        body: cajRows,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      });
      Y = doc.lastAutoTable.finalY + 4;
    }

    // Footer on all pages
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(6); doc.setTextColor(MUTED);
      doc.text('ERP Grupo Financiero VMCR · Fuente: Sistema Wigos · ' + fechaHoy, W/2, H - 8, { align: 'center' });
      doc.text('Pag. ' + p + '/' + totalPages, W - MR, H - 8, { align: 'right' });
    }

    // Download
    if (autoDownload) {
      var dateStr = last.fecha ? last.fecha.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
      doc.save('Informe_Casino_' + dateStr + '.pdf');
      if (typeof toast === 'function') toast('PDF descargado: Informe_Casino_' + dateStr + '.pdf');
    }

    return doc;
  }

  // ═══════════════════════════════════════
  // EXPOSE
  // ═══════════════════════════════════════
  window.casinoGenerateReport = casinoGenerateReport;

})(window);
