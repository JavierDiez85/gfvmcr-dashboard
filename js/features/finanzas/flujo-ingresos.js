// GF — Finanzas: Flujo de Ingresos
(function(window) {
  'use strict';

function rFlujoIng(){
  if(!document.getElementById('fi-tbody')) return; // view not active
  const tbody = document.getElementById('fi-tbody');
  if(!tbody) return;

  // Show credits notice if any auto rows
  const notice = document.getElementById('fi-cred-notice');
  if(notice) notice.style.display = FI_ROWS.some(r=>r.auto) ? 'flex' : 'none';

  tbody.innerHTML = FI_ROWS.map((r,ri) => {
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
          : `<input ${inS('left')} value="${r.concepto}" onchange="FI_ROWS[${ri}].concepto=this.value" placeholder="Concepto...">`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span>`
          : `<select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600"
              onchange="FI_ROWS[${ri}].ent=this.value;this.style.color=ENT_COLOR[this.value]||'#555';FI_ROWS[${ri}].cat=catsIng(this.value)[0];rFlujoIng()">
              ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
            </select>`}
      </td>
      <td style="padding:4px 6px">
        ${isAuto
          ? `<span style="font-size:.73rem;color:var(--muted)">${r.cat}</span>`
          : `<select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)"
              onchange="FI_ROWS[${ri}].cat=this.value">
              ${selOpts(catsIng(r.ent), r.cat)}
            </select>`}
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,false)}</td>`).join('')}
      <td class="mo pos bld" style="font-size:.78rem;font-weight:700" id="fi-rtot-${r.id}">${fmt(r.vals.reduce((a,b)=>a+b,0))}</td>
      <td style="text-align:center;padding:2px">
        ${!isAuto && !isViewer() ? `<button onclick="fiDelRow('${r.id}')" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button>` : ''}
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="17" style="padding:8px 12px">
      <button onclick="fiAddRow()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s"
        onmouseover="this.style.borderColor='var(--green)';this.style.color='var(--green)'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
        + Agregar fila de ingreso
      </button>
    </td>
  </tr>`;

  flUpdateFooter('fi');
  flUpdateKPIs('fi');
}

function fiAddRow(){
  FI_ROWS.push({id: Date.now(), concepto:'', ent:'Salem', cat:'TPV', yr:String(_year), vals:Array(12).fill(0), auto:false});
  rFlujoIng();
  // Scroll to last row
  setTimeout(()=>{
    const t=document.getElementById('fi-tbody');
    if(t){ const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'}); }
  },50);
}

function fiDelRow(id){
  FI_ROWS = FI_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoIng();
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
    registerView('flujo_ing', function(){ return _syncAll().then(function(){ rFlujoIng(); }); });
    registerView('ingresar', function(){ rFlujoIng(); });
  }

})(window);
