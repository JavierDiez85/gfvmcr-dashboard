// GF — Finanzas: Carga Masiva de Ingresos y Gastos
(function(window) {
  'use strict';

  var CM_STORAGE_KEY = 'gf_cm_last_upload';
  var CM_MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // ── Descargar plantilla Excel ──────────────────────────
  function downloadPlantilla(){
    if(typeof XLSX === 'undefined'){ toast('XLSX no disponible'); return; }

    var wb = XLSX.utils.book_new();

    // ─── Hoja 1: Ingresos ───
    var ingHeaders = ['Concepto','Empresa','Categoría'].concat(CM_MO);
    var ingExamples = [
      ['Comisiones Q1','Salem','TPV',50000,50000,50000,0,0,0,0,0,0,0,0,0],
      ['Intereses Crédito','Endless','Crédito Simple',12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000],
      ['Fee Exchange','Wirebit','Exchange',8000,9000,0,0,0,0,0,0,0,0,0,0],
    ];
    var ingData = [ingHeaders].concat(ingExamples);
    var wsIng = XLSX.utils.aoa_to_sheet(ingData);
    wsIng['!cols'] = [{wch:25},{wch:12},{wch:18}].concat(CM_MO.map(function(){return{wch:10}}));
    XLSX.utils.book_append_sheet(wb, wsIng, 'Ingresos');

    // ─── Hoja 2: Gastos ───
    var gasHeaders = ['Concepto','Empresa','Categoría','Compartido','Concepto GC'].concat(CM_MO);
    var gasExamples = [
      ['Renta Oficina','Salem','Renta','SI','Renta oficina',15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000],
      ['Software Wirebit','Wirebit','Operaciones','NO','',5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000],
      ['Material MKT','Salem','Marketing','NO','',3000,0,0,3000,0,0,3000,0,0,3000,0,0],
    ];
    var gasData = [gasHeaders].concat(gasExamples);
    var wsGas = XLSX.utils.aoa_to_sheet(gasData);
    wsGas['!cols'] = [{wch:25},{wch:12},{wch:18},{wch:12},{wch:20}].concat(CM_MO.map(function(){return{wch:10}}));
    XLSX.utils.book_append_sheet(wb, wsGas, 'Gastos');

    // ─── Hoja 3: Referencia ───
    var refData = [
      ['REFERENCIA — Valores válidos para la plantilla'],
      [],
      ['EMPRESAS VÁLIDAS:'],
    ];
    EMPRESAS.forEach(function(e){ refData.push([e]); });
    refData.push([]);
    refData.push(['CATEGORÍAS DE INGRESO POR EMPRESA:']);
    EMPRESAS.forEach(function(e) {
      var cats = (typeof ENT_CATS_ING !== 'undefined' ? ENT_CATS_ING[e] : null) || CATS_ING;
      refData.push([e + ':'].concat(cats));
    });
    refData.push([]);
    refData.push(['CATEGORÍAS DE GASTO (todas las empresas):']);
    (typeof CATS_GAS !== 'undefined' ? CATS_GAS : []).forEach(function(c){ refData.push([c]); });
    refData.push([]);
    refData.push(['CONCEPTOS GASTOS COMPARTIDOS (para columna "Concepto GC"):']);
    refData.push(['(Solo usar cuando Compartido = SI)']);
    try {
      var gcItems = typeof GC_EDIT !== 'undefined' ? GC_EDIT : GCOMP;
      gcItems.forEach(function(g){ refData.push([g.c, 'Cat: '+g.cat]); });
    } catch(e){}

    var wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = [{wch:30},{wch:20},{wch:18},{wch:18},{wch:18},{wch:18}];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia');

    XLSX.writeFile(wb, 'GF_Plantilla_Carga_Masiva.xlsx');
    toast('Plantilla descargada');
  }

  // ── Procesar upload masivo ─────────────────────────────
  async function startCargaMasiva(){
    var fileInput = document.getElementById('cm-file');
    var strategyEl = document.getElementById('cm-strategy');
    var progressDiv = document.getElementById('cm-progress');
    var barEl = document.getElementById('cm-bar');
    var msgEl = document.getElementById('cm-msg');
    var resultEl = document.getElementById('cm-result');

    if(!fileInput || !fileInput.files[0]){
      toast('Selecciona un archivo Excel'); return;
    }
    if(typeof XLSX === 'undefined'){ toast('XLSX no disponible'); return; }

    var strategy = strategyEl ? strategyEl.value : 'append';
    var file = fileInput.files[0];

    progressDiv.style.display = 'block';
    resultEl.style.display = 'none';
    var progress = function(pct, msg) {
      barEl.style.width = pct + '%';
      msgEl.textContent = msg;
    };

    try {
      progress(5, 'Leyendo archivo...');
      var buffer = await file.arrayBuffer();
      var workbook = XLSX.read(buffer, { type: 'array' });

      progress(15, 'Buscando hojas Ingresos y Gastos...');

      var findSheet = function(names) {
        for(var i=0; i<names.length; i++){
          var match = workbook.SheetNames.find(function(s){ return s.toLowerCase().includes(names[i].toLowerCase()); });
          if(match) return match;
        }
        return null;
      };
      var ingSheet = findSheet(['Ingreso','Income','Revenue']);
      var gasSheet = findSheet(['Gasto','Expense','Cost']);

      if(!ingSheet && !gasSheet){
        throw new Error('No se encontraron hojas "Ingresos" ni "Gastos" en el archivo');
      }

      var errors = [];
      var parsedIng = [];
      var parsedGas = [];
      var totalRows = 0;

      if(ingSheet){
        progress(25, 'Procesando hoja de Ingresos...');
        var rows = XLSX.utils.sheet_to_json(workbook.Sheets[ingSheet], { defval: '' });
        totalRows += rows.length;

        rows.forEach(function(r, idx) {
          var lineNum = idx + 2;
          var concepto = String(r['Concepto'] || r['concepto'] || '').trim();
          var empresa = String(r['Empresa'] || r['empresa'] || '').trim();
          var categoria = String(r['Categoría'] || r['Categoria'] || r['categoría'] || r['categoria'] || '').trim();

          if(!concepto){ errors.push('Ingreso fila '+lineNum+': Sin concepto'); return; }
          if(!EMPRESAS.includes(empresa)){ errors.push('Ingreso fila '+lineNum+': Empresa "'+empresa+'" no válida'); return; }

          var validCats = (typeof ENT_CATS_ING !== 'undefined' ? ENT_CATS_ING[empresa] : null) || CATS_ING;
          if(!validCats.includes(categoria)){
            errors.push('Ingreso fila '+lineNum+': Categoría "'+categoria+'" no válida para '+empresa+'. Válidas: '+validCats.join(', '));
            return;
          }

          var vals = CM_MO.map(function(m) {
            var v = r[m] || r[m.toLowerCase()] || 0;
            return Math.round(Number(v) || 0);
          });

          if(!vals.some(function(v){ return v > 0; })){ errors.push('Ingreso fila '+lineNum+': "'+concepto+'" — todos los meses en $0'); return; }

          parsedIng.push({ concepto: concepto, empresa: empresa, categoria: categoria, vals: vals, line: lineNum });
        });
      }

      if(gasSheet){
        progress(45, 'Procesando hoja de Gastos...');
        var gasRows = XLSX.utils.sheet_to_json(workbook.Sheets[gasSheet], { defval: '' });
        totalRows += gasRows.length;

        gasRows.forEach(function(r, idx) {
          var lineNum = idx + 2;
          var concepto = String(r['Concepto'] || r['concepto'] || '').trim();
          var empresa = String(r['Empresa'] || r['empresa'] || '').trim();
          var categoria = String(r['Categoría'] || r['Categoria'] || r['categoría'] || r['categoria'] || '').trim();
          var compartido = String(r['Compartido'] || r['compartido'] || 'NO').trim().toUpperCase() === 'SI';
          var conceptoGC = String(r['Concepto GC'] || r['concepto gc'] || r['ConceptoGC'] || '').trim();

          if(!concepto){ errors.push('Gasto fila '+lineNum+': Sin concepto'); return; }
          if(!EMPRESAS.includes(empresa)){ errors.push('Gasto fila '+lineNum+': Empresa "'+empresa+'" no válida'); return; }

          var validCats = (typeof ENT_CATS_GAS !== 'undefined' ? ENT_CATS_GAS[empresa] : null) || CATS_GAS;
          if(!validCats.includes(categoria)){
            errors.push('Gasto fila '+lineNum+': Categoría "'+categoria+'" no válida. Válidas: '+validCats.join(', '));
            return;
          }

          if(compartido && conceptoGC){
            var gcItems = typeof GC_EDIT !== 'undefined' ? GC_EDIT : (typeof GCOMP !== 'undefined' ? GCOMP : []);
            if(!gcItems.find(function(g){ return g.c === conceptoGC; })){
              errors.push('Gasto fila '+lineNum+': Concepto GC "'+conceptoGC+'" no existe en Gastos Compartidos');
              return;
            }
          }

          var vals = CM_MO.map(function(m) {
            var v = r[m] || r[m.toLowerCase()] || 0;
            return Math.round(Number(v) || 0);
          });

          if(!vals.some(function(v){ return v > 0; })){ errors.push('Gasto fila '+lineNum+': "'+concepto+'" — todos los meses en $0'); return; }

          parsedGas.push({ concepto: concepto, empresa: empresa, categoria: categoria, compartido: compartido, conceptoGC: conceptoGC, vals: vals, line: lineNum });
        });
      }

      progress(65, 'Validación completa. Guardando datos...');

      var validCount = parsedIng.length + parsedGas.length;
      if(validCount === 0){
        throw new Error('No se encontraron filas válidas.\n' + errors.slice(0, 10).join('\n'));
      }

      fiLoad(); fgLoad();

      if(strategy === 'replace'){
        FI_ROWS = FI_ROWS.filter(function(r){ return r.auto || r.autoTPV; });
        FG_ROWS = FG_ROWS.filter(function(r){ return r.autoTPV; });
      }

      var ts = Date.now();
      parsedIng.forEach(function(r, i) {
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

      parsedGas.forEach(function(r, i) {
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

      DB.set('gf_fi', FI_ROWS.filter(function(r){ return !r.auto && !r.autoTPV; }));
      DB.set('gf_fg', FG_ROWS.filter(function(r){ return !r.autoTPV; }));
      fiInjectCredits();
      syncFlujoToRecs();

      var ingTotal = parsedIng.reduce(function(s, r){ return s + r.vals.reduce(function(a, b){ return a + b; }, 0); }, 0);
      var gasTotal = parsedGas.reduce(function(s, r){ return s + r.vals.reduce(function(a, b){ return a + b; }, 0); }, 0);
      DB.set(CM_STORAGE_KEY, {
        date: new Date().toISOString(),
        filename: file.name,
        strategy: strategy,
        ingresos: parsedIng.length,
        gastos: parsedGas.length,
        ingTotal: ingTotal,
        gasTotal: gasTotal,
        errors: errors.length,
      });

      progress(100, 'Carga completa');

      resultEl.style.display = 'block';
      resultEl.style.background = errors.length > 0 ? '#fff3e0' : '#e8f5e9';
      resultEl.style.border = '1px solid ' + (errors.length > 0 ? '#ff9800' : '#4caf50');
      resultEl.innerHTML =
        '<div style="font-weight:700;margin-bottom:6px;color:'+(errors.length>0?'#e65100':'#2e7d32')+'">' +
          (errors.length>0?'⚠️':'✅')+' Carga '+(errors.length>0?'parcial':'exitosa') +
        '</div>' +
        '<div style="display:flex;gap:16px;margin-bottom:6px">' +
          '<span>📥 <b>'+parsedIng.length+'</b> ingresos ('+(typeof fmtK==='function'?fmtK(ingTotal):'$'+ingTotal.toLocaleString())+')</span>' +
          '<span>📤 <b>'+parsedGas.length+'</b> gastos ('+(typeof fmtK==='function'?fmtK(gasTotal):'$'+gasTotal.toLocaleString())+')</span>' +
          '<span>📊 <b>'+totalRows+'</b> filas totales leídas</span>' +
        '</div>' +
        (errors.length > 0 ?
          '<details style="margin-top:6px">' +
            '<summary style="cursor:pointer;color:#e65100;font-weight:600">'+errors.length+' error(es) — clic para ver</summary>' +
            '<ul style="margin:6px 0;padding-left:18px;font-size:.68rem;color:#c62828">' +
              errors.map(function(e){ return '<li>'+e+'</li>'; }).join('') +
            '</ul>' +
          '</details>'
        : '');

      _cmRenderPreview(parsedIng, parsedGas);
      _cmUpdateKPIs();

      toast('✅ ' + validCount + ' registros cargados');

    } catch(e){
      progress(0, '');
      progressDiv.style.display = 'none';
      resultEl.style.display = 'block';
      resultEl.style.background = '#ffebee';
      resultEl.style.border = '1px solid #ef5350';
      resultEl.innerHTML = '<div style="color:#c62828;font-weight:600">❌ Error: '+e.message+'</div>';
      toast('Error en carga masiva');
    }
  }

  function _cmRenderPreview(ing, gas){
    var tbody = document.getElementById('cm-preview-tbody');
    if(!tbody) return;
    var allRows = ing.map(function(r){ return Object.assign({}, r, {tipo:'Ingreso', color:'#1b5e20'}); })
      .concat(gas.map(function(r){ return Object.assign({}, r, {tipo:'Gasto', color:'#c62828'}); }));
    if(!allRows.length){
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Sin datos</td></tr>';
      return;
    }
    tbody.innerHTML = allRows.map(function(r) {
      var total = r.vals.reduce(function(a, b){ return a + b; }, 0);
      var entColor = (typeof ENT_COLOR !== 'undefined' ? ENT_COLOR[r.empresa] : null) || '#666';
      return '<tr>' +
        '<td style="font-size:.74rem">'+r.concepto+'</td>' +
        '<td><span class="pill" style="background:'+(r.tipo==='Ingreso'?'#e8f5e9':'#ffebee')+';color:'+r.color+';font-size:.62rem">'+r.tipo+'</span></td>' +
        '<td style="font-size:.74rem;color:'+entColor+';font-weight:600">'+r.empresa+'</td>' +
        '<td><span class="pill" style="background:#f3eafd;color:#7a2eb8;font-size:.62rem">'+r.categoria+'</span></td>' +
        '<td class="mo" style="font-weight:600;color:'+r.color+'">'+(typeof fmtFull==='function'?fmtFull(total):'$'+total.toLocaleString())+'</td>' +
        '<td style="text-align:center">✅</td>' +
      '</tr>';
    }).join('');
  }

  function _cmUpdateKPIs(){
    var data = DB.get(CM_STORAGE_KEY);
    var q = function(id){ return document.getElementById(id); };
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
      var d = new Date(data.date);
      q('cm-kpi-sub').textContent = data.filename + ' · ' + d.toLocaleDateString('es-MX');
    }
  }

  function rCargaMasiva(){
    _cmUpdateKPIs();
    var fi = document.getElementById('cm-file');
    if(fi) fi.value = '';
    var p = document.getElementById('cm-progress');
    if(p) p.style.display = 'none';
    var r = document.getElementById('cm-result');
    if(r) r.style.display = 'none';
  }

  // Expose globals
  window.CM_STORAGE_KEY = CM_STORAGE_KEY;
  window.downloadPlantilla = downloadPlantilla;
  window.startCargaMasiva = startCargaMasiva;
  window.rCargaMasiva = rCargaMasiva;
  window._cmRenderPreview = _cmRenderPreview;
  window._cmUpdateKPIs = _cmUpdateKPIs;

  // Register views
  if(typeof registerView === 'function'){
    registerView('carga_masiva', function(){ rCargaMasiva(); });
  }

})(window);
