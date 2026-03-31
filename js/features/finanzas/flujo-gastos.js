// GF — Finanzas: Flujo de Gastos
(function(window) {
  'use strict';

// Filtro activo por empresa (null = todas)
window._fgFilterEnt = null;

function rFlujoGas(filterEnt){
  window._fgFilterEnt = (filterEnt !== undefined) ? filterEnt : null;
  if(!document.getElementById('fg-tbody')) return; // view not active
  const tbody = document.getElementById('fg-tbody');
  if(!tbody) return;

  // Show filter banner
  const filterBanner = document.getElementById('fg-filter-banner');
  if(filterBanner) filterBanner.style.display = window._fgFilterEnt ? 'flex' : 'none';
  if(filterBanner && window._fgFilterEnt){
    const ec = ENT_COLOR[window._fgFilterEnt]||'#555';
    filterBanner.innerHTML = `<span style="font-size:.75rem;font-weight:600;color:${ec}">Mostrando solo: ${window._fgFilterEnt}</span><span style="font-size:.65rem;color:var(--muted);margin-left:8px">(${FG_ROWS.filter(r=>r.ent===window._fgFilterEnt).length} filas de ${FG_ROWS.length})</span>`;
  }

  // Show TPV auto notice ONLY when filtering by Salem (autoTPV rows are Salem-exclusive)
  const fgTpvNotice = document.getElementById('fg-tpv-notice');
  const _hasVisibleTPV = window._fgFilterEnt === 'Salem'
    && FG_ROWS.some(r => r.autoTPV && r.ent === 'Salem');
  if(fgTpvNotice) fgTpvNotice.style.display = _hasVisibleTPV ? 'flex' : 'none';

  // Apply filter
  const visibleRows = window._fgFilterEnt ? FG_ROWS.map((r,i)=>({r,ri:i})).filter(x=>x.r.ent===window._fgFilterEnt) : FG_ROWS.map((r,i)=>({r,ri:i}));

  tbody.innerHTML = visibleRows.map(({r,ri}) => {
    // Auto-injected TPV rows: non-editable display
    if(r.autoTPV) {
      const entC = ENT_COLOR[r.ent]||'#555';
      const rowTot = r.vals.reduce((a,b)=>a+b,0);
      return `<tr style="background:rgba(0,115,234,.04);border-bottom:1px solid var(--border)">
        <td style="padding:4px 8px"><div style="font-size:.78rem;font-weight:600;color:var(--text)">${r.concepto}<span style="font-size:.57rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span></div>
        <div style="font-size:.6rem;color:var(--muted);margin-top:1px">${r.note||''}</div></td>
        <td style="padding:4px 6px"><span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span></td>
        <td style="padding:4px 6px;font-size:.73rem">${r.cat}</td>
        <td style="padding:4px 6px;font-size:.68rem;font-weight:600;color:${r.tipo==='gasto'?'#e74c3c':'#00b875'}">${r.tipo==='gasto'?'🏢 Gasto':'📦 Costo'}</td>
        <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
        <td></td><td></td>
        ${r.vals.map(v=>`<td class="mo" style="font-size:.74rem;color:var(--muted);padding:2px 3px">${v?fmt(v):'—'}</td>`).join('')}
        <td class="mo neg bld" style="font-size:.78rem;font-weight:700">${rowTot?fmt(rowTot):'—'}</td>
        <td></td></tr>`;
    }

    const entC = ENT_COLOR[r.ent]||'#555';
    const isShared = r.shared;
    const sharedBg = isShared ? 'background:rgba(230,81,0,.03)' : '';
    const toggleOn = isShared ? 'background:#ff7043;' : 'background:var(--border);';
    const dotPos   = isShared ? 'left:20px' : 'left:2px';
    const gcOpts   = GC_EDIT.map(g=>`<option${g.c===r.gcConcept?' selected':''}>${g.c}</option>`).join('');

    return `<tr id="fg-row-${r.id}" style="${sharedBg};border-bottom:1px solid var(--border)">
      <td style="padding:4px 8px">
        <input ${inS('left')} value="${r.concepto}" class="fg-concepto" data-ri="${ri}" placeholder="Concepto...">
      </td>
      <td style="padding:4px 6px">
        <select class="fg-ent" data-ri="${ri}" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600">
          ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
        </select>
      </td>
      <td style="padding:4px 6px">
        <select class="fg-cat" data-ri="${ri}" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)">
          ${selOpts(catsGas(r.ent), r.cat)}
        </select>
      </td>
      <td style="padding:4px 6px">
        <select class="fg-tipo" data-ri="${ri}" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.71rem;padding:2px 4px;background:${r.tipo==='costo'?'rgba(0,184,148,.08)':'rgba(231,76,60,.08)'};color:${r.tipo==='costo'?'#00b875':'#e74c3c'};font-weight:600">
          <option value="costo"${r.tipo==='costo'?' selected':''}>📦 Costo</option>
          <option value="gasto"${r.tipo!=='costo'?' selected':''}>🏢 Gasto</option>
        </select>
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      <td style="padding:4px 6px;text-align:center">
        <div class="fg-shared" data-ri="${ri}" style="width:36px;height:20px;border-radius:10px;${toggleOn}position:relative;cursor:pointer;transition:background .15s;margin:auto"
          title="${isShared?'Compartido':'Solo esta empresa'}">
          <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;${dotPos};transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>
        </div>
      </td>
      <td style="padding:4px 6px">
        ${isShared
          ? `<select class="fg-gc" data-ri="${ri}" style="width:100%;border:1px solid #ff7043;border-radius:4px;font-size:.71rem;padding:2px 4px;background:var(--bg);color:var(--orange)">
              <option value="">— Seleccionar —</option>${gcOpts}
            </select>`
          : `<span style="font-size:.7rem;color:var(--muted);padding-left:4px">—</span>`}
      </td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,true)}</td>`).join('')}
      <td class="mo neg bld" style="font-size:.78rem;font-weight:700" id="fg-rtot-${r.id}">${r.vals.some(v=>v)?fmt(r.vals.reduce((a,b)=>a+b,0)):'—'}</td>
      <td style="text-align:center;padding:2px">
        ${!isViewer() ? `<button class="fg-del fg-del-hover" data-rid="${r.id}" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px">✕</button>` : ''}
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="20" style="padding:8px 12px">
      <button class="fg-add-row-btn fg-add-hover" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s">
        + Agregar fila de gasto
      </button>
    </td>
  </tr>`;

  // ── Event delegation for data-* handlers ──
  tbody.querySelectorAll('.fg-concepto').forEach(function(el){
    el.onchange = function(){ var ri=+this.dataset.ri; FG_ROWS[ri].concepto=this.value; fgAutoDetect(ri); };
  });
  tbody.querySelectorAll('.fg-ent').forEach(function(el){
    el.onchange = function(){
      var ri=+this.dataset.ri;
      FG_ROWS[ri].ent=this.value;
      this.style.color=ENT_COLOR[this.value]||'#555';
      FG_ROWS[ri].cat=catsGas(this.value)[0];
      fgUpdateKPIs();
    };
  });
  tbody.querySelectorAll('.fg-cat').forEach(function(el){
    el.onchange = function(){ var ri=+this.dataset.ri; FG_ROWS[ri].cat=this.value; fgAutoTipo(ri); };
  });
  tbody.querySelectorAll('.fg-tipo').forEach(function(el){
    el.onchange = function(){ FG_ROWS[+this.dataset.ri].tipo=this.value; rFlujoGas(window._fgFilterEnt); };
  });
  tbody.querySelectorAll('.fg-shared').forEach(function(el){
    el.onclick = function(){ fgToggleShared(+this.dataset.ri); };
  });
  tbody.querySelectorAll('.fg-gc').forEach(function(el){
    el.onchange = function(){ FG_ROWS[+this.dataset.ri].gcConcept=this.value; fgUpdateKPIs(); };
  });
  // ── Add row button ──
  var addBtn = tbody.querySelector('.fg-add-row-btn');
  if(addBtn) addBtn.addEventListener('click', fgAddRow);
  tbody.querySelectorAll('.fg-del').forEach(function(el){
    el.onclick = function(){ fgDelRow(this.dataset.rid); };
  });
  tbody.querySelectorAll('.fl-mo').forEach(function(el){
    el.oninput = function(){ flRowUpdate(this.dataset.type, +this.dataset.rid, +this.dataset.col, +this.value); };
  });

  flUpdateFooter('fg');
  flUpdateKPIs('fg');
}

function fgAutoTipo(ri){
  // Auto-detect tipo based on category
  var r = FG_ROWS[ri];
  var costCats = ['Operaciones','Com. Bancarias','TPV Comisiones','Costo Directo','Costos Directos'];
  if(costCats.indexOf(r.cat) !== -1){
    r.tipo = 'costo';
  } else if(r.cat === 'Nómina'){
    // Keep current tipo or default to gasto
    if(!r.tipo) r.tipo = 'gasto';
  } else {
    r.tipo = 'gasto';
  }
  rFlujoGas(window._fgFilterEnt);
}

function fgAddRow(){
  const ent = window._fgFilterEnt || 'Salem';
  const cat = (typeof catsGas==='function' ? catsGas(ent)[0] : 'Administrativo') || 'Administrativo';
  var costCats = ['Operaciones','Com. Bancarias','TPV Comisiones','Costo Directo','Costos Directos'];
  var tipo = costCats.indexOf(cat) !== -1 ? 'costo' : 'gasto';
  FG_ROWS.push({id:Date.now(), concepto:'', ent:ent, cat:cat, yr:String(_year), shared:false, gcConcept:'', tipo:tipo, vals:Array(12).fill(0)});
  rFlujoGas(window._fgFilterEnt);
  setTimeout(()=>{
    const t=document.getElementById('fg-tbody');
    if(t){const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'});}
  },50);
}

function fgDelRow(id){
  FG_ROWS = FG_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoGas(window._fgFilterEnt);
}

function fgToggleShared(ri){
  FG_ROWS[ri].shared = !FG_ROWS[ri].shared;
  if(!FG_ROWS[ri].shared) FG_ROWS[ri].gcConcept='';
  // Auto-detect concept
  if(FG_ROWS[ri].shared) fgAutoDetect(ri);
  rFlujoGas(window._fgFilterEnt);
}

function fgAutoDetect(ri){
  const r = FG_ROWS[ri];
  if(!r.shared || !r.concepto) return;
  const con = r.concepto.toLowerCase();
  const match = GC_EDIT.find(g=>g.c.toLowerCase()===con||con.includes(g.c.toLowerCase())||g.c.toLowerCase().includes(con));
  if(match && !r.gcConcept){ FG_ROWS[ri].gcConcept=match.c; rFlujoGas(window._fgFilterEnt); }
}

function fgUpdateKPIs(){ flUpdateKPIs('fg'); }

function fgSave(){
  // Persist only non-auto rows (exclude TPV and factura auto-injected)
  const toSave = FG_ROWS.filter(r => !r.autoTPV && !r.autoFactura);
  DB.set('gf_fg', toSave);
  syncFlujoToRecs();
  refreshActivePL();
  const btn = document.getElementById('fg-save-btn');
  if(btn){btn.textContent='✅ Guardado';setTimeout(()=>btn.textContent='💾 Guardar',1800);}
  toast('✅ Flujo de Gastos guardado — P&L actualizado');
}

function fgExport(){
  if(typeof XLSX==='undefined'){toast('❌ XLSX no disponible');return;}
  const data = FG_ROWS.map(r=>({
    Concepto:r.concepto, 'Empresa que paga':r.ent, Categoría:r.cat, 'Tipo P&L':r.tipo==='costo'?'Costo':'Gasto', Año:r.yr,
    '¿Compartido?':r.shared?'SI':'NO', 'Concepto GC':r.gcConcept||'',
    ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
    'Total Anual': r.vals.reduce((a,b)=>a+b,0)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws, 'Flujo Gastos');
  XLSX.writeFile(wb2, 'GF_Flujo_Gastos.xlsx');
}

  // Expose globals
  window.rFlujoGas = rFlujoGas;
  window.fgAddRow = fgAddRow;
  window.fgDelRow = fgDelRow;
  window.fgToggleShared = fgToggleShared;
  window.fgAutoDetect = fgAutoDetect;
  window.fgAutoTipo = fgAutoTipo;
  window.fgUpdateKPIs = fgUpdateKPIs;
  window.fgSave = fgSave;
  window.fgExport = fgExport;

  // Register views
  if(typeof registerView === 'function'){
    registerView('flujo_gas', function(){ return _syncAll().then(function(){ rFlujoGas(null); }); });
    // Vistas filtradas por empresa
    registerView('flujo_gas_sal',  function(){ return _syncAll().then(function(){ rFlujoGas('Salem'); }); });
    registerView('flujo_gas_end',  function(){ return _syncAll().then(function(){ rFlujoGas('Endless'); }); });
    registerView('flujo_gas_dyn',  function(){ return _syncAll().then(function(){ rFlujoGas('Dynamo'); }); });
    registerView('flujo_gas_wb',   function(){ return _syncAll().then(function(){ rFlujoGas('Wirebit'); }); });
    registerView('flujo_gas_stel', function(){ return _syncAll().then(function(){ rFlujoGas('Stellaris'); }); });
  }

})(window);
