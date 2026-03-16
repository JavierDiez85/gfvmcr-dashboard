// GF — Finanzas: Flujo de Gastos
(function(window) {
  'use strict';

function rFlujoGas(){
  if(!document.getElementById('fg-tbody')) return; // view not active
  const tbody = document.getElementById('fg-tbody');
  if(!tbody) return;

  // Show TPV auto notice if any autoTPV rows
  const fgTpvNotice = document.getElementById('fg-tpv-notice');
  if(fgTpvNotice) fgTpvNotice.style.display = FG_ROWS.some(r=>r.autoTPV) ? 'flex' : 'none';

  tbody.innerHTML = FG_ROWS.map((r,ri) => {
    // Auto-injected TPV rows: non-editable display
    if(r.autoTPV) {
      const entC = ENT_COLOR[r.ent]||'#555';
      const rowTot = r.vals.reduce((a,b)=>a+b,0);
      return `<tr style="background:rgba(0,115,234,.04);border-bottom:1px solid var(--border)">
        <td style="padding:4px 8px"><div style="font-size:.78rem;font-weight:600;color:var(--text)">${r.concepto}<span style="font-size:.57rem;background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:1px 5px;border-radius:9px;font-weight:700;margin-left:4px">auto TPV</span></div>
        <div style="font-size:.6rem;color:var(--muted);margin-top:1px">${r.note||''}</div></td>
        <td style="padding:4px 6px"><span style="font-weight:600;font-size:.76rem;color:${entC}">${r.ent}</span></td>
        <td style="padding:4px 6px;font-size:.73rem">${r.cat}</td>
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
        <input ${inS('left')} value="${r.concepto}" onchange="FG_ROWS[${ri}].concepto=this.value;fgAutoDetect(${ri})" placeholder="Concepto...">
      </td>
      <td style="padding:4px 6px">
        <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.74rem;padding:2px 4px;background:var(--bg);color:${entC};font-weight:600"
          onchange="FG_ROWS[${ri}].ent=this.value;this.style.color=ENT_COLOR[this.value]||'#555';FG_ROWS[${ri}].cat=catsGas(this.value)[0];fgUpdateKPIs()">
          ${EMPRESAS.map(e=>`<option${e===r.ent?' selected':''} style="color:${ENT_COLOR[e]}">${e}</option>`).join('')}
        </select>
      </td>
      <td style="padding:4px 6px">
        <select style="width:100%;border:1px solid var(--border);border-radius:4px;font-size:.73rem;padding:2px 4px;background:var(--bg)"
          onchange="FG_ROWS[${ri}].cat=this.value">
          ${selOpts(catsGas(r.ent), r.cat)}
        </select>
      </td>
      <td style="padding:4px 6px;font-size:.73rem;color:var(--muted);text-align:center">${r.yr}</td>
      <td style="padding:4px 6px;text-align:center">
        <div style="width:36px;height:20px;border-radius:10px;${toggleOn}position:relative;cursor:pointer;transition:background .15s;margin:auto"
          onclick="fgToggleShared(${ri})" title="${isShared?'Compartido':'Solo esta empresa'}">
          <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;${dotPos};transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>
        </div>
      </td>
      <td style="padding:4px 6px">
        ${isShared
          ? `<select style="width:100%;border:1px solid #ff7043;border-radius:4px;font-size:.71rem;padding:2px 4px;background:var(--bg);color:var(--orange)"
              onchange="FG_ROWS[${ri}].gcConcept=this.value;fgUpdateKPIs()">
              <option value="">— Seleccionar —</option>${gcOpts}
            </select>`
          : `<span style="font-size:.7rem;color:var(--muted);padding-left:4px">—</span>`}
      </td>
      ${r.vals.map((v,i)=>`<td style="padding:2px 3px">${moInput(r.id,i,v,true)}</td>`).join('')}
      <td class="mo neg bld" style="font-size:.78rem;font-weight:700" id="fg-rtot-${r.id}">${r.vals.some(v=>v)?fmt(r.vals.reduce((a,b)=>a+b,0)):'—'}</td>
      <td style="text-align:center;padding:2px">
        ${!isViewer() ? `<button onclick="fgDelRow('${r.id}')" title="Eliminar"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;padding:2px 5px"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button>` : ''}
      </td>
    </tr>`;
  }).join('') + `<tr>
    <td colspan="19" style="padding:8px 12px">
      <button onclick="fgAddRow()" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:5px 16px;font-size:.75rem;color:var(--muted);cursor:pointer;width:100%;transition:all .12s"
        onmouseover="this.style.borderColor='var(--orange)';this.style.color='var(--orange)'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
        + Agregar fila de gasto
      </button>
    </td>
  </tr>`;

  flUpdateFooter('fg');
  flUpdateKPIs('fg');
}

function fgAddRow(){
  FG_ROWS.push({id:Date.now(), concepto:'', ent:'Salem', cat:'Administrativo', yr:String(_year), shared:false, gcConcept:'', vals:Array(12).fill(0)});
  rFlujoGas();
  setTimeout(()=>{
    const t=document.getElementById('fg-tbody');
    if(t){const rows=t.querySelectorAll('tr');if(rows.length>1)rows[rows.length-2].scrollIntoView({behavior:'smooth',block:'nearest'});}
  },50);
}

function fgDelRow(id){
  FG_ROWS = FG_ROWS.filter(r=>String(r.id)!==String(id));
  rFlujoGas();
}

function fgToggleShared(ri){
  FG_ROWS[ri].shared = !FG_ROWS[ri].shared;
  if(!FG_ROWS[ri].shared) FG_ROWS[ri].gcConcept='';
  // Auto-detect concept
  if(FG_ROWS[ri].shared) fgAutoDetect(ri);
  rFlujoGas();
}

function fgAutoDetect(ri){
  const r = FG_ROWS[ri];
  if(!r.shared || !r.concepto) return;
  const con = r.concepto.toLowerCase();
  const match = GC_EDIT.find(g=>g.c.toLowerCase()===con||con.includes(g.c.toLowerCase())||g.c.toLowerCase().includes(con));
  if(match && !r.gcConcept){ FG_ROWS[ri].gcConcept=match.c; rFlujoGas(); }
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
    Concepto:r.concepto, 'Empresa que paga':r.ent, Categoría:r.cat, Año:r.yr,
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
  window.fgUpdateKPIs = fgUpdateKPIs;
  window.fgSave = fgSave;
  window.fgExport = fgExport;

  // Register views
  if(typeof registerView === 'function'){
    registerView('flujo_gas', function(){ return _syncAll().then(function(){ rFlujoGas(); }); });
  }

})(window);
