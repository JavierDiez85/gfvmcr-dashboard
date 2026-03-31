// GF — Finanzas: Flujo de Ingresos
(function(window) {
  'use strict';

// Filtro activo por empresa (null = todas)
window._fiFilterEnt = null;

function rFlujoIng(filterEnt){
  window._fiFilterEnt = (filterEnt !== undefined) ? filterEnt : null;
  if(!document.getElementById('fi-tbody')) return; // view not active
  const tbody = document.getElementById('fi-tbody');
  if(!tbody) return;

  // Show filter banner
  const filterBanner = document.getElementById('fi-filter-banner');
  if(filterBanner) filterBanner.style.display = window._fiFilterEnt ? 'flex' : 'none';
  if(filterBanner && window._fiFilterEnt){
    const ec = ENT_COLOR[window._fiFilterEnt]||'#555';
    filterBanner.innerHTML = `<span style="font-size:.75rem;font-weight:600;color:${ec}">Mostrando solo: ${window._fiFilterEnt}</span><span style="font-size:.65rem;color:var(--muted);margin-left:8px">(${FI_ROWS.filter(r=>r.ent===window._fiFilterEnt).length} filas de ${FI_ROWS.length})</span>`;
  }

  // Show credits notice if any auto rows
  const notice = document.getElementById('fi-cred-notice');
  if(notice) notice.style.display = FI_ROWS.some(r=>r.auto) ? 'flex' : 'none';

  // Apply filter
  const visibleRows = window._fiFilterEnt ? FI_ROWS.map((r,i)=>({r,ri:i})).filter(x=>x.r.ent===window._fiFilterEnt) : FI_ROWS.map((r,i)=>({r,ri:i}));

  tbody.innerHTML = visibleRows.map(({r,ri}) => {
    const isAuto = r.auto || r.autoTPV;
    const rowBg  = isAuto ? (r.autoTPV ? 'background:rgba(0,115,234,.04)' : 'background:rgba(0,184,117,.04)') : '';
    const badge  = r.autoTPV
      ? `<span style="font-size:.57rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span>`
      : (isAuto ? `<span style="font-size:.57rem;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto</span>` : '');
    const noteEl = r.note ? `<div style="font-size:.6rem;color:var(--muted);margin-top:1px">${r.note}</div>` : '';
    const entC   = ENT_COLOR[r.ent]||'#555';

    return `<tr id="fi-row-${r.id}" style="${rowBg};border-bottom:1px solid var(--border)">
      <td style="padding:4px 8px">
        ${isAuto
          ? `<div style="font-size:.78rem;font-weight:600;color:var(--text)">${r.concepto}${badge}</div>${noteEl}`
          : `<input ${inS('left')} value="${r.concepto}" class="fi-concepto" data-ri="${ri}" placeholder="Concepto...">`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span>`
          : `<select class="fi-ent" data-ri="${ri}" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600">
              ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
            </select>`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-size:.73rem;color:var(--muted)">${r.cat}</span>`
          : `<select class="fi-cat" data-ri="${ri}" style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)">
              ${selOpts(catsIng(r.ent), r.cat)}
            </select>`}
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,false)}</td>`).join('')}
      <td class="mo pos bld" style="font-size:.78rem;font-weight:700" id="fi-rtot-${r.id}">${fmt(r.vals.reduce((a,b)=>a+b,0))}</td>
      <td style="text-align:center;padding:2px">
        ${!isAuto && !isViewer() ? `<button class="fi-del fi-del-hover" data-rid="${r.id}" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px">✕</button>` : ''}
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="17" style="padding:8px 12px">
      <button class="fi-add-row-btn fi-add-hover" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s">
        + Agregar fila de ingreso
      </button>
    </td>
  </tr>`;

  // ── Event delegation for data-* handlers ──
  tbody.querySelectorAll('.fi-concepto').forEach(function(el){
    el.onchange = function(){ FI_ROWS[+this.dataset.ri].concepto = this.value; };
  });
  tbody.querySelectorAll('.fi-ent').forEach(function(el){
    el.onchange = function(){
      var ri = +this.dataset.ri;
      FI_ROWS[ri].ent = this.value;
      this.style.color = ENT_COLOR[this.value]||'#555';
      FI_ROWS[ri].cat = catsIng(this.value)[0];
      rFlujoIng(window._fiFilterEnt);
    };
  });
  tbody.querySelectorAll('.fi-cat').forEach(function(el){
    el.onchange = function(){ FI_ROWS[+this.dataset.ri].cat = this.value; };
  });
  tbody.querySelectorAll('.fi-del').forEach(function(el){
    el.onclick = function(){ fiDelRow(this.dataset.rid); };
  });
  tbody.querySelectorAll('.fl-mo').forEach(function(el){
    el.oninput = function(){ flRowUpdate(this.dataset.type, +this.dataset.rid, +this.dataset.col, +this.value); };
  });
  // ── Add row button ──
  var addBtn = tbody.querySelector('.fi-add-row-btn');
  if(addBtn) addBtn.addEventListener('click', fiAddRow);

  flUpdateFooter('fi');
  flUpdateKPIs('fi');
}

function fiAddRow(){
  const ent = window._fiFilterEnt || 'Salem';
  const cat = (typeof catsIng==='function' ? catsIng(ent)[0] : 'TPV') || 'TPV';
  FI_ROWS.push({id: Date.now(), concepto:'', ent:ent, cat:cat, yr:String(_year), vals:Array(12).fill(0), auto:false});
  rFlujoIng(window._fiFilterEnt);
  // Scroll to last row
  setTimeout(()=>{
    const t=document.getElementById('fi-tbody');
    if(t){ const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'}); }
  },50);
}

function fiDelRow(id){
  FI_ROWS = FI_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoIng(window._fiFilterEnt);
}

function fiSave(){
  // Persist only non-auto rows (exclude credit auto AND TPV auto)
  const toSave = FI_ROWS.filter(r=>!r.auto && !r.autoTPV);
  DB.set('gf_fi', toSave);
  // Sync to S.recs for P&L compatibility
  syncFlujoToRecs();
  refreshActivePL();
  const btn = document.getElementById('fi-save-btn');
  if(btn){btn.textContent='✅ Guardado';setTimeout(()=>btn.textContent='💾 Guardar',1800);}
  toast('✅ Flujo de Ingresos guardado — P&L actualizado');
}

function fiExport(){
  if(typeof XLSX==='undefined'){toast('❌ XLSX no disponible');return;}
  const data = FI_ROWS.map(r=>({
    Concepto:r.concepto, Empresa:r.ent, Categoría:r.cat, Año:r.yr,
    ...Object.fromEntries(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m,i)=>[m,r.vals[i]||0])),
    'Total Anual': r.vals.reduce((a,b)=>a+b,0)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws, 'Flujo Ingresos');
  XLSX.writeFile(wb2, 'GF_Flujo_Ingresos.xlsx');
}

  // Expose globals
  window.rFlujoIng = rFlujoIng;
  window.fiAddRow = fiAddRow;
  window.fiDelRow = fiDelRow;
  window.fiSave = fiSave;
  window.fiExport = fiExport;

  // Register views
  if(typeof registerView === 'function'){
    registerView('flujo_ing', function(){ return _syncAll().then(function(){ rFlujoIng(null); }); });
    registerView('ingresar', function(){ rFlujoIng(null); });
    // Vistas filtradas por empresa
    registerView('flujo_ing_sal',  function(){ return _syncAll().then(function(){ rFlujoIng('Salem'); }); });
    registerView('flujo_ing_end',  function(){ return _syncAll().then(function(){ rFlujoIng('Endless'); }); });
    registerView('flujo_ing_dyn',  function(){ return _syncAll().then(function(){ rFlujoIng('Dynamo'); }); });
    registerView('flujo_ing_wb',   function(){ return _syncAll().then(function(){ rFlujoIng('Wirebit'); }); });
    registerView('flujo_ing_stel', function(){ return _syncAll().then(function(){ rFlujoIng('Stellaris'); }); });
  }

})(window);
