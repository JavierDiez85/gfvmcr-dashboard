// GF — Creditos: Carga desde PDF + historial
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // CARGA DE CREDITOS DESDE PDF
  // ═══════════════════════════════════════

  function ccLoad(){
    try{ CC_HISTORY = DB.get('gf_cc_hist') || []; }catch(e){ CC_HISTORY=[]; }
  }

  // Filtro activo por empresa (null = sin filtro)
  window._ccFilterEmpresa = null;

  function rCargaCreditos(filterEmpresa){
    window._ccFilterEmpresa = (filterEmpresa !== undefined) ? filterEmpresa : null;
    ccLoad();
    ccRenderHistory();
    // Pre-select and optionally lock empresa selector
    var sel = document.getElementById('cc-empresa');
    if(sel && window._ccFilterEmpresa){
      sel.value = window._ccFilterEmpresa;
      sel.disabled = true;
      sel.style.opacity = '0.7';
    } else if(sel){
      sel.disabled = false;
      sel.style.opacity = '1';
    }
  }

  function ccHandleDrop(e){
    e.preventDefault();
    const dz = document.getElementById('cc-dropzone');
    dz.style.borderColor = 'var(--border2)';
    dz.style.background  = 'var(--bg)';
    const file = e.dataTransfer.files[0];
    if(file && file.type === 'application/pdf') ccLoadFile(file);
    else toast('⚠️ Solo se aceptan archivos PDF');
  }

  function ccLoadFile(file){
    if(!file) return;
    ccSetStatus('loading', `📖 Leyendo "${file.name}"…`);
    document.getElementById('cc-preview-wrap').style.display = 'none';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      ccSetStatus('loading', '🤖 Analizando tabla de creditos con IA…');
      try {
        await ccAnalyzeWithClaude(base64, file.name);
      } catch(err) {
        ccSetStatus('error', '❌ Error al procesar: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function ccAnalyzeWithClaude(base64pdf, filename){
    const empresa = document.getElementById('cc-empresa').value;
    ccSetStatus('loading', '📖 Extrayendo texto del PDF…');

    // Extract text using PDF.js
    const pdfData = atob(base64pdf);
    const pdfBytes = new Uint8Array(pdfData.length);
    for(let i=0;i<pdfData.length;i++) pdfBytes[i]=pdfData.charCodeAt(i);

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdfDoc = await pdfjsLib.getDocument({data: pdfBytes}).promise;
    let fullText = '';
    for(let p=1; p<=pdfDoc.numPages; p++){
      const page = await pdfDoc.getPage(p);
      const tc   = await page.getTextContent();
      fullText += tc.items.map(i=>i.str).join(' ') + '\n';
    }

    ccSetStatus('loading', '🔍 Analizando tabla de amortización…');

    const credito = ccParseCentumPDF(fullText, filename);
    if(!credito) throw new Error('No se pudo leer la tabla. Verifica que sea un PDF generado desde el sistema crediticio (no contratos escaneados).');

    CC_PREVIEW = [credito];
    ccSetStatus('ok', `✅ Crédito de <strong>${credito.cl}</strong> extraído de "${filename}"`);
    try { ccRenderPreview(empresa, null); } catch(e){ console.error('Preview error:',e); }
  }

  function ccParseCentumPDF(text, filename){
    const t = text.replace(/\s+/g,' ');
    const get = (re) => { const m=t.match(re); return m?m[1].trim():null; };
    const parseMXN = s => s ? parseFloat(s.replace(/,/g,'')) : 0;

    // ── Try Format A (old): "Solicitante:" layout ──
    let nombre   = get(/Solicitante\s*:\s*([A-Za-záéíóúÁÉÍÓÚüÜñÑ ]+?)(?:\s{2,}|Crédito|$)/i);
    let monto    = get(/Crédito solicitado[^$]*\$\s*([\d,]+\.?\d*)/i);
    let producto = get(/Producto financiero\s*:\s*([^\n]+?)(?:\s{2,}|Vencimiento)/i);
    let venc     = get(/Vencimiento:\s*([^\s]+(?:\s+[^\s]+)??)(?=\s{2,}|\s*Plazo)/i);
    let tasa     = get(/Tasa:\s*([\d.]+)\s*%/i);
    let cat      = get(/CAT\s*:\s*([\d.]+)\s*%/i);
    let fechaElab= get(/Fecha de elaboraci[oó]n:\s*([^\n]+?)(?:\s{2,}|Solicitante|$)/i);

    // ── Try Format B (new): "Nombre del Cliente:" layout ──
    if(!nombre) nombre = get(/Nombre del Cliente:\s*(.+?)(?=\s{2,}Producto\s*:|$)/i);
    if(!monto)  monto  = get(/Monto del Cr[eé]dito[^$]*\$\s*([\d,]+\.?\d*)/i);
    if(!producto) producto = get(/Producto:\s*(.+?)(?=\s{2,}N[°o]\s*de\s*Cr[eé]dito|$)/i);
    if(!venc) venc = get(/Fecha de Vencimiento:\s*(.+?)(?=\s{2,}IVA\s*Comisi[oó]n|Plazo|$)/i);
    if(!fechaElab) fechaElab = get(/Fecha de elaboraci[oó]n:\s*(.+?)(?=\s{2,}|$)/i);

    // Shared fields (work in both formats)
    const pagoFijoM = t.match(/Pago fijo[\s\S]*?\$[\s\d,.]+?\$\s*([\d,]+\.?\d*)/i);
    const pagoFijo = pagoFijoM ? pagoFijoM[1] : null;
    const plazo    = get(/Plazo:\s*(\d+)/i);
    const iva      = get(/IVA\s*:\s*([\d.]+)\s*%/i);
    const com      = get(/Comisi[oó]n\s*:\s*([\d.]+)\s*%/i);

    // Split into rows by detecting "N  DD/..." pattern, extract $ amounts per row
    const amort = [];
    const rowSplitRe = /\b(\d{1,3})\s+([\d]{1,2}\/[\dA-Za-z]{2,4}\/?\d{0,4}|[\d]{1,2}\/[A-Za-z0-9]+\/\d{4})([\s\S]*?)(?=\b\d{1,3}\s+[\d]{1,2}\/|Total:|La presente|$)/g;
    let m;
    while((m=rowSplitRe.exec(t))!==null){
      const periodo = parseInt(m[1]);
      if(periodo > 200) continue;
      const rowText = m[3];
      const amounts = [...rowText.matchAll(/\$\s*([\d,]+\.?\d*)/g)].map(a=>parseMXN(a[1]));
      if(amounts.length < 2) continue;
      amort.push({
        periodo,
        fecha:   m[2],
        pago:    amounts[0],             // 1st $ = pago fijo
        capital: amounts[1],             // 2nd $ = abono capital
        int:     amounts[2]||0,          // 3rd $ = intereses
        ivaInt:  amounts[3]||0,          // 4th $ = IVA intereses
        saldo:   amounts[amounts.length-1], // last $ = saldo a capital
      });
    }

    // ── Derive tasa from amortization if not explicitly found ──
    // Use first payment row (periodo 1) where interest / previous balance ≈ monthly rate
    if(!tasa && amort.length >= 2){
      const row1 = amort.find(r => r.periodo === 1);
      const row0 = amort.find(r => r.periodo === 0);
      if(row1 && row1.int > 0){
        const prevBalance = row0 ? row0.saldo : parseMXN(monto);
        if(prevBalance > 0){
          const monthlyRate = row1.int / prevBalance;
          tasa = (monthlyRate * 12 * 100).toFixed(2);
        }
      }
    }

    console.log('[CC] PDF parsed OK —', amort.length, 'periodos');

    if(!nombre || amort.length < 1) return null;

    // ── Get pagoFijo from first real payment if not found via regex ──
    var pagoFijoVal = parseMXN(pagoFijo);
    if(!pagoFijoVal && amort.length > 0){
      const firstPay = amort.find(r => r.pago > 0);
      if(firstPay) pagoFijoVal = firstPay.pago;
    }

    var montoVal = parseMXN(monto);
    var creditId = (nombre||'').replace(/[^a-zA-Z0-9]/g,'_').toLowerCase() + '_' + montoVal + '_' + (parseInt(plazo)||0);

    return {
      creditId:   creditId,
      cl:         nombre,
      monto:      montoVal,
      plazo:      parseInt(plazo)||0,
      vencimiento:venc||'',
      tasa:       parseFloat(tasa)||0,
      iva:        parseFloat(iva)||16,
      com:        parseFloat(com)||0,
      cat:        parseFloat(cat)||0,
      tipo:       'Simple',
      producto:   producto||'Crédito Simple',
      pagoFijo:   pagoFijoVal,
      st:         'Activo',
      disbDate:   amort.length>0 ? amort[0].fecha : '',
      fechaElab:  fechaElab||'',
      amort,
    };
  }

  function ccRenderPreview(empresa, notas){
    const wrap   = document.getElementById('cc-preview-wrap');
    const thead  = document.getElementById('cc-preview-thead');
    const tbody  = document.getElementById('cc-preview-tbody');
    const title  = document.getElementById('cc-preview-title');
    const notesEl= document.getElementById('cc-preview-notes');
    const empresaLabel = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';

    title.textContent = `${creditos_count()} creditos extraidos — ${empresaLabel}`;

    thead.innerHTML = '<th>Cliente</th><th class="r">Monto</th><th class="r">Plazo</th><th class="r">Tasa</th><th class="r">Comision</th><th>Tipo</th><th>Destino</th><th>Status</th><th class="r">Fecha</th>';

    const stColor = {Activo:'var(--green)',Prospecto:'var(--yellow)',Vencido:'var(--red)',Pagado:'var(--purple)'};
    tbody.innerHTML = CC_PREVIEW.map((c,i) => `
      <tr>
        <td style="font-weight:600">${_esc(c.cl||'—')}</td>
        <td class="mo pos">${fmtFull(c.monto)}</td>
        <td class="r">${c.plazo} meses</td>
        <td class="r">${c.tasa}%</td>
        <td class="r">${c.com?c.com+'%':'—'}</td>
        <td style="font-size:.75rem">${c.tipo||'Simple'}</td>
        <td style="font-size:.75rem;color:var(--muted)">${c.destino||'—'}</td>
        <td><span style="font-size:.68rem;font-weight:700;color:${stColor[c.st]||'var(--muted)'}">${c.st}</span></td>
        <td class="r" style="font-size:.72rem;color:var(--muted)">${c.disbDate||'—'}</td>
      </tr>`).join('');

    if(notas) notesEl.innerHTML = `<strong>Notas del analisis:</strong> ${_esc(notas)}`;
    else notesEl.innerHTML = '';

    wrap.style.display = 'block';
    wrap.scrollIntoView({behavior:'smooth'});
  }

  function creditos_count(){ return CC_PREVIEW.length; }

  function _getCreditId(c){
    // Generate creditId if missing (backward compat for old credits)
    if(c.creditId) return c.creditId;
    return (c.cl||'').replace(/[^a-zA-Z0-9]/g,'_').toLowerCase() + '_' + (c.monto||0) + '_' + (c.plazo||0);
  }

  function ccImport(){
    if(!CC_PREVIEW.length){ toast('⚠️ No hay creditos para importar'); return; }
    const empresa = document.getElementById('cc-empresa').value;

    // Ensure all preview credits have creditId
    CC_PREVIEW.forEach(c => { if(!c.creditId) c.creditId = _getCreditId(c); });

    if(empresa === 'endless'){
      // Match by creditId (unique per credit), NOT by client name
      CC_PREVIEW.forEach(c => {
        const idx = END_CREDITS.findIndex(x => _getCreditId(x) === c.creditId);
        if(idx >= 0){
          // Update existing credit (same monto+plazo+client)
          END_CREDITS[idx] = {...END_CREDITS[idx], ...c};
        } else {
          // New credit — append (even if same client name)
          END_CREDITS.push(c);
        }
      });
      DB.set('gf_cred_end', END_CREDITS);
    } else {
      CC_PREVIEW.forEach(c => {
        const idx = DYN_CREDITS.findIndex(x => _getCreditId(x) === c.creditId);
        if(idx >= 0){
          DYN_CREDITS[idx] = {...DYN_CREDITS[idx], ...c};
        } else {
          DYN_CREDITS.push(c);
        }
      });
      DB.set('gf_cred_dyn', DYN_CREDITS);
    }

    // Log to history
    ccLoad();
    CC_HISTORY.unshift({
      date: new Date().toLocaleString('es-MX'),
      empresa: empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance',
      count: CC_PREVIEW.length,
      names: CC_PREVIEW.map(c=>c.cl).join(', ')
    });
    DB.set('gf_cc_hist', CC_HISTORY.slice(0,20));

    // Sync flows
    fiInjectTPV();
    fiInjectCredits();
    syncFlujoToRecs();

    const n = CC_PREVIEW.length;
    const label = empresa === 'endless' ? 'Endless Money' : 'Dynamo Finance';
    CC_PREVIEW = [];
    ccClearPreview();
    ccRenderHistory();
    toast(`✅ ${n} credito${n!==1?'s':''} importado${n!==1?'s':''} a ${label}`);

  }

  function ccClearPreview(){
    CC_PREVIEW = [];
    document.getElementById('cc-preview-wrap').style.display = 'none';
    document.getElementById('cc-status').style.display = 'none';
    document.getElementById('cc-file-input').value = '';
  }

  function ccSetStatus(type, html){
    const el = document.getElementById('cc-status');
    const colors = {
      loading: {bg:'var(--blue-bg)',  border:'var(--blue-lt)',  color:'var(--blue)'},
      ok:      {bg:'var(--green-bg)', border:'var(--green-lt)', color:'var(--green)'},
      error:   {bg:'var(--red-bg)',   border:'var(--red-lt)',   color:'var(--red)'},
    };
    const c = colors[type] || colors.loading;
    el.style.cssText = `display:block;padding:10px 14px;border-radius:var(--r);background:${c.bg};border:1px solid ${c.border};color:${c.color};font-size:.8rem`;
    el.innerHTML = html;
  }

  function ccRenderHistory(){
    ccLoad();
    const el = document.getElementById('cc-history');
    if(!el) return;
    if(!CC_HISTORY.length){
      el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:.78rem">Sin cargas registradas</div>';
      return;
    }
    el.innerHTML = CC_HISTORY.map((h,i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);font-size:.78rem">
        <span style="color:var(--muted);min-width:140px;flex-shrink:0">${h.date}</span>
        <span style="font-weight:600;color:var(--blue);flex-shrink:0">${h.empresa}</span>
        <span style="color:var(--green);font-weight:600;flex-shrink:0">${h.count} credito${h.count!==1?'s':''}</span>
        <span style="color:var(--muted);font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${h.names}</span>
      </div>`).join('');
  }

  function ccDeleteHistory(idx){
    ccLoad();
    CC_HISTORY.splice(idx, 1);
    DB.set('gf_cc_hist', CC_HISTORY);
    ccRenderHistory();
  }

  // Expose globals
  window.ccLoad            = ccLoad;
  window.rCargaCreditos    = rCargaCreditos;
  window.ccHandleDrop      = ccHandleDrop;
  window.ccLoadFile        = ccLoadFile;
  window.ccAnalyzeWithClaude = ccAnalyzeWithClaude;
  window.ccParseCentumPDF  = ccParseCentumPDF;
  window.ccRenderPreview   = ccRenderPreview;
  window.creditos_count    = creditos_count;
  window.ccImport          = ccImport;
  window.ccClearPreview    = ccClearPreview;
  window.ccSetStatus       = ccSetStatus;
  window.ccRenderHistory   = ccRenderHistory;
  window.ccDeleteHistory   = ccDeleteHistory;

  // Register views
  if(typeof registerView === 'function'){
    registerView('carga_creditos', function(){ rCargaCreditos(null); });
    registerView('carga_creditos_end', function(){ rCargaCreditos('endless'); });
    registerView('carga_creditos_dyn', function(){ rCargaCreditos('dynamo'); });
  }

})(window);
