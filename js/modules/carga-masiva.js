// ══════════════════════════════════════
// CARGA MASIVA — Bulk Upload de Ingresos y Gastos
// Genera plantilla Excel y procesa uploads masivos
// ══════════════════════════════════════

const CM_STORAGE_KEY = 'vmcr_cm_last_upload';
const CM_MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Descargar plantilla Excel ──────────────────────────
function downloadPlantilla(){
  if(typeof XLSX === 'undefined'){ toast('XLSX no disponible'); return; }

  const wb = XLSX.utils.book_new();

  // ─── Hoja 1: Ingresos ───
  const ingHeaders = ['Concepto','Empresa','Categoría',...CM_MO];
  const ingExamples = [
    ['Comisiones Q1','Salem','TPV',50000,50000,50000,0,0,0,0,0,0,0,0,0],
    ['Intereses Crédito','Endless','Crédito Simple',12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000],
    ['Fee Exchange','Wirebit','Exchange',8000,9000,0,0,0,0,0,0,0,0,0,0],
  ];
  const ingData = [ingHeaders, ...ingExamples];
  const wsIng = XLSX.utils.aoa_to_sheet(ingData);
  wsIng['!cols'] = [{wch:25},{wch:12},{wch:18},...CM_MO.map(()=>({wch:10}))];
  XLSX.utils.book_append_sheet(wb, wsIng, 'Ingresos');

  // ─── Hoja 2: Gastos ───
  const gasHeaders = ['Concepto','Empresa','Categoría','Compartido','Concepto GC',...CM_MO];
  const gasExamples = [
    ['Renta Oficina','Salem','Renta','SI','Renta oficina',15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000],
    ['Software Wirebit','Wirebit','Operaciones','NO','',5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000],
    ['Material MKT','Salem','Marketing','NO','',3000,0,0,3000,0,0,3000,0,0,3000,0,0],
  ];
  const gasData = [gasHeaders, ...gasExamples];
  const wsGas = XLSX.utils.aoa_to_sheet(gasData);
  wsGas['!cols'] = [{wch:25},{wch:12},{wch:18},{wch:12},{wch:20},...CM_MO.map(()=>({wch:10}))];
  XLSX.utils.book_append_sheet(wb, wsGas, 'Gastos');

  // ─── Hoja 3: Referencia ───
  const refData = [
    ['REFERENCIA — Valores válidos para la plantilla'],
    [],
    ['EMPRESAS VÁLIDAS:'],
    ...EMPRESAS.map(e => [e]),
    [],
    ['CATEGORÍAS DE INGRESO POR EMPRESA:'],
  ];
  EMPRESAS.forEach(e => {
    const cats = (typeof ENT_CATS_ING !== 'undefined' ? ENT_CATS_ING[e] : null) || CATS_ING;
    refData.push([e + ':', ...cats]);
  });
  refData.push([]);
  refData.push(['CATEGORÍAS DE GASTO (todas las empresas):']);
  (typeof CATS_GAS !== 'undefined' ? CATS_GAS : []).forEach(c => refData.push([c]));
  refData.push([]);
  refData.push(['CONCEPTOS GASTOS COMPARTIDOS (para columna "Concepto GC"):']);
  refData.push(['(Solo usar cuando Compartido = SI)']);
  try {
    const gcItems = typeof GC_EDIT !== 'undefined' ? GC_EDIT : GCOMP;
    gcItems.forEach(g => refData.push([g.c, 'Cat: '+g.cat]));
  } catch(e){}

  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [{wch:30},{wch:20},{wch:18},{wch:18},{wch:18},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia');

  XLSX.writeFile(wb, 'GF_Plantilla_Carga_Masiva.xlsx');
  toast('Plantilla descargada');
}

// ── Procesar upload masivo ─────────────────────────────
async function startCargaMasiva(){
  const fileInput = document.getElementById('cm-file');
  const strategyEl = document.getElementById('cm-strategy');
  const progressDiv = document.getElementById('cm-progress');
  const barEl = document.getElementById('cm-bar');
  const msgEl = document.getElementById('cm-msg');
  const resultEl = document.getElementById('cm-result');

  if(!fileInput || !fileInput.files[0]){
    toast('Selecciona un archivo Excel'); return;
  }
  if(typeof XLSX === 'undefined'){ toast('XLSX no disponible'); return; }

  const strategy = strategyEl ? strategyEl.value : 'append';
  const file = fileInput.files[0];

  progressDiv.style.display = 'block';
  resultEl.style.display = 'none';
  const progress = (pct, msg) => {
    barEl.style.width = pct + '%';
    msgEl.textContent = msg;
  };

  try {
    progress(5, 'Leyendo archivo...');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    progress(15, 'Buscando hojas Ingresos y Gastos...');

    // ── Detect sheets ──
    const findSheet = (names) => {
      for(const n of names){
        const match = workbook.SheetNames.find(s => s.toLowerCase().includes(n.toLowerCase()));
        if(match) return match;
      }
      return null;
    };
    const ingSheet = findSheet(['Ingreso','Income','Revenue']);
    const gasSheet = findSheet(['Gasto','Expense','Cost']);

    if(!ingSheet && !gasSheet){
      throw new Error('No se encontraron hojas "Ingresos" ni "Gastos" en el archivo');
    }

    const errors = [];
    const parsedIng = [];
    const parsedGas = [];
    let totalRows = 0;

    // ── Parse Ingresos ──
    if(ingSheet){
      progress(25, 'Procesando hoja de Ingresos...');
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[ingSheet], { defval: '' });
      totalRows += rows.length;

      rows.forEach((r, idx) => {
        const lineNum = idx + 2; // +2 for header + 0-index
        const concepto = String(r['Concepto'] || r['concepto'] || '').trim();
        const empresa = String(r['Empresa'] || r['empresa'] || '').trim();
        const categoria = String(r['Categoría'] || r['Categoria'] || r['categoría'] || r['categoria'] || '').trim();

        if(!concepto){ errors.push(`Ingreso fila ${lineNum}: Sin concepto`); return; }
        if(!EMPRESAS.includes(empresa)){ errors.push(`Ingreso fila ${lineNum}: Empresa "${empresa}" no válida`); return; }

        const validCats = (typeof ENT_CATS_ING !== 'undefined' ? ENT_CATS_ING[empresa] : null) || CATS_ING;
        if(!validCats.includes(categoria)){
          errors.push(`Ingreso fila ${lineNum}: Categoría "${categoria}" no válida para ${empresa}. Válidas: ${validCats.join(', ')}`);
          return;
        }

        const vals = CM_MO.map(m => {
          const v = r[m] || r[m.toLowerCase()] || 0;
          return Math.round(Number(v) || 0);
        });

        if(!vals.some(v => v > 0)){ errors.push(`Ingreso fila ${lineNum}: "${concepto}" — todos los meses en $0`); return; }

        parsedIng.push({ concepto, empresa, categoria, vals, line: lineNum });
      });
    }

    // ── Parse Gastos ──
    if(gasSheet){
      progress(45, 'Procesando hoja de Gastos...');
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[gasSheet], { defval: '' });
      totalRows += rows.length;

      rows.forEach((r, idx) => {
        const lineNum = idx + 2;
        const concepto = String(r['Concepto'] || r['concepto'] || '').trim();
        const empresa = String(r['Empresa'] || r['empresa'] || '').trim();
        const categoria = String(r['Categoría'] || r['Categoria'] || r['categoría'] || r['categoria'] || '').trim();
        const compartido = String(r['Compartido'] || r['compartido'] || 'NO').trim().toUpperCase() === 'SI';
        const conceptoGC = String(r['Concepto GC'] || r['concepto gc'] || r['ConceptoGC'] || '').trim();

        if(!concepto){ errors.push(`Gasto fila ${lineNum}: Sin concepto`); return; }
        if(!EMPRESAS.includes(empresa)){ errors.push(`Gasto fila ${lineNum}: Empresa "${empresa}" no válida`); return; }

        const validCats = (typeof ENT_CATS_GAS !== 'undefined' ? ENT_CATS_GAS[empresa] : null) || CATS_GAS;
        if(!validCats.includes(categoria)){
          errors.push(`Gasto fila ${lineNum}: Categoría "${categoria}" no válida. Válidas: ${validCats.join(', ')}`);
          return;
        }

        if(compartido && conceptoGC){
          const gcItems = typeof GC_EDIT !== 'undefined' ? GC_EDIT : (typeof GCOMP !== 'undefined' ? GCOMP : []);
          if(!gcItems.find(g => g.c === conceptoGC)){
            errors.push(`Gasto fila ${lineNum}: Concepto GC "${conceptoGC}" no existe en Gastos Compartidos`);
            return;
          }
        }

        const vals = CM_MO.map(m => {
          const v = r[m] || r[m.toLowerCase()] || 0;
          return Math.round(Number(v) || 0);
        });

        if(!vals.some(v => v > 0)){ errors.push(`Gasto fila ${lineNum}: "${concepto}" — todos los meses en $0`); return; }

        parsedGas.push({ concepto, empresa, categoria, compartido, conceptoGC, vals, line: lineNum });
      });
    }

    progress(65, 'Validación completa. Guardando datos...');

    const validCount = parsedIng.length + parsedGas.length;
    if(validCount === 0){
      throw new Error('No se encontraron filas válidas.\n' + errors.slice(0, 10).join('\n'));
    }

    // ── Inject into FI_ROWS / FG_ROWS ──
    fiLoad(); fgLoad();

    if(strategy === 'replace'){
      // Remove all manual (non-auto) rows
      FI_ROWS = FI_ROWS.filter(r => r.auto || r.autoTPV);
      FG_ROWS = FG_ROWS.filter(r => r.autoTPV);
    }

    const ts = Date.now();
    parsedIng.forEach((r, i) => {
      FI_ROWS.push({
        id: ts + '_ing_' + i,
        concepto: r.concepto,
        ent: r.empresa,
        cat: r.categoria,
        yr: String(_year),
        vals: r.vals,
        auto: false
      });
    });

    parsedGas.forEach((r, i) => {
      FG_ROWS.push({
        id: ts + '_gas_' + i,
        concepto: r.concepto,
        ent: r.empresa,
        cat: r.categoria,
        yr: String(_year),
        shared: r.compartido,
        gcConcept: r.conceptoGC || '',
        vals: r.vals
      });
    });

    progress(80, 'Sincronizando con P&L...');

    // Save
    DB.set('vmcr_fi', FI_ROWS.filter(r => !r.auto && !r.autoTPV));
    DB.set('vmcr_fg', FG_ROWS.filter(r => !r.autoTPV));
    fiInjectCredits();
    syncFlujoToRecs();

    // Save upload summary
    const ingTotal = parsedIng.reduce((s, r) => s + r.vals.reduce((a, b) => a + b, 0), 0);
    const gasTotal = parsedGas.reduce((s, r) => s + r.vals.reduce((a, b) => a + b, 0), 0);
    DB.set(CM_STORAGE_KEY, {
      date: new Date().toISOString(),
      filename: file.name,
      strategy,
      ingresos: parsedIng.length,
      gastos: parsedGas.length,
      ingTotal,
      gasTotal,
      errors: errors.length,
    });

    progress(100, 'Carga completa');

    // ── Result panel ──
    resultEl.style.display = 'block';
    resultEl.style.background = errors.length > 0 ? '#fff3e0' : '#e8f5e9';
    resultEl.style.border = '1px solid ' + (errors.length > 0 ? '#ff9800' : '#4caf50');
    resultEl.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;color:${errors.length>0?'#e65100':'#2e7d32'}">
        ${errors.length>0?'⚠️':'✅'} Carga ${errors.length>0?'parcial':'exitosa'}
      </div>
      <div style="display:flex;gap:16px;margin-bottom:6px">
        <span>📥 <b>${parsedIng.length}</b> ingresos (${typeof fmtK==='function'?fmtK(ingTotal):'$'+ingTotal.toLocaleString()})</span>
        <span>📤 <b>${parsedGas.length}</b> gastos (${typeof fmtK==='function'?fmtK(gasTotal):'$'+gasTotal.toLocaleString()})</span>
        <span>📊 <b>${totalRows}</b> filas totales leídas</span>
      </div>
      ${errors.length > 0 ? `
        <details style="margin-top:6px">
          <summary style="cursor:pointer;color:#e65100;font-weight:600">${errors.length} error(es) — clic para ver</summary>
          <ul style="margin:6px 0;padding-left:18px;font-size:.68rem;color:#c62828">
            ${errors.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </details>
      ` : ''}
    `;

    // ── Render preview table ──
    _cmRenderPreview(parsedIng, parsedGas);

    // ── Update KPIs ──
    _cmUpdateKPIs();

    toast(`✅ ${validCount} registros cargados`);

  } catch(e){
    progress(0, '');
    progressDiv.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.style.background = '#ffebee';
    resultEl.style.border = '1px solid #ef5350';
    resultEl.innerHTML = `<div style="color:#c62828;font-weight:600">❌ Error: ${e.message}</div>`;
    toast('Error en carga masiva');
  }
}

// ── Preview table ──
function _cmRenderPreview(ing, gas){
  const tbody = document.getElementById('cm-preview-tbody');
  if(!tbody) return;
  const allRows = [
    ...ing.map(r => ({...r, tipo: 'Ingreso', color: '#1b5e20'})),
    ...gas.map(r => ({...r, tipo: 'Gasto', color: '#c62828'})),
  ];
  if(!allRows.length){
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Sin datos</td></tr>';
    return;
  }
  tbody.innerHTML = allRows.map(r => {
    const total = r.vals.reduce((a, b) => a + b, 0);
    const entColor = (typeof ENT_COLOR !== 'undefined' ? ENT_COLOR[r.empresa] : null) || '#666';
    return `<tr>
      <td style="font-size:.74rem">${r.concepto}</td>
      <td><span class="pill" style="background:${r.tipo==='Ingreso'?'#e8f5e9':'#ffebee'};color:${r.color};font-size:.62rem">${r.tipo}</span></td>
      <td style="font-size:.74rem;color:${entColor};font-weight:600">${r.empresa}</td>
      <td><span class="pill" style="background:#f3eafd;color:#7a2eb8;font-size:.62rem">${r.categoria}</span></td>
      <td class="mo" style="font-weight:600;color:${r.color}">${typeof fmtFull==='function'?fmtFull(total):'$'+total.toLocaleString()}</td>
      <td style="text-align:center">✅</td>
    </tr>`;
  }).join('');
}

// ── Update KPIs from saved summary ──
function _cmUpdateKPIs(){
  const data = DB.get(CM_STORAGE_KEY);
  const q = id => document.getElementById(id);
  if(!data){
    if(q('cm-kpi-rows')) q('cm-kpi-rows').textContent = '—';
    if(q('cm-kpi-ing')) q('cm-kpi-ing').textContent = '—';
    if(q('cm-kpi-gas')) q('cm-kpi-gas').textContent = '—';
    if(q('cm-kpi-sub')) q('cm-kpi-sub').textContent = 'Sin cargas previas';
    return;
  }
  if(q('cm-kpi-rows')){ q('cm-kpi-rows').textContent = data.ingresos + data.gastos; q('cm-kpi-rows').style.color='var(--blue)'; }
  if(q('cm-kpi-ing')){ q('cm-kpi-ing').textContent = typeof fmtK==='function'?fmtK(data.ingTotal):'$'+data.ingTotal; q('cm-kpi-ing').style.color='var(--green)'; }
  if(q('cm-kpi-gas')){ q('cm-kpi-gas').textContent = typeof fmtK==='function'?fmtK(data.gasTotal):'$'+data.gasTotal; q('cm-kpi-gas').style.color='var(--red)'; }
  if(q('cm-kpi-sub')){
    const d = new Date(data.date);
    q('cm-kpi-sub').textContent = data.filename + ' · ' + d.toLocaleDateString('es-MX');
  }
}

// ── Render view ──
function rCargaMasiva(){
  _cmUpdateKPIs();
  // Reset file input
  const fi = document.getElementById('cm-file');
  if(fi) fi.value = '';
  // Reset progress/result
  const p = document.getElementById('cm-progress');
  if(p) p.style.display = 'none';
  const r = document.getElementById('cm-result');
  if(r) r.style.display = 'none';
  // Load last preview if available
  const tb = document.getElementById('cm-preview-tbody');
  if(tb && !tb.querySelector('td[colspan]')){
    // Keep existing preview
  }
}
