// GF — Creditos: Detalle, formulario y amortizacion
(function(window) {
  'use strict';

  // ── Modal de detalle con tabla de amortizacion ──
  function credOpenDetail(entKey, nombre, idx){
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    // Use direct index (reliable now that _origIdx is passed from dashboard/cobranza)
    const resolvedIdx = (typeof idx === 'number' && idx >= 0 && idx < credits.length) ? idx : credits.findIndex(c => c.cl === nombre);
    const c = credits[resolvedIdx];
    if(!c) return;

    const col    = entKey==='end' ? '#00b875' : '#ff7043';
    const label  = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
    const intTot = credTotalIntereses(c);
    const ivaTot = c.amort ? c.amort.slice(1).reduce((s,r)=>s+(r.ivaInt||0),0) : 0;
    const pagoTotal = credTotalPagos(c);

    let amortTable = '';
    if(c.amort && c.amort.length > 1){
      const rows = c.amort.map((r,i)=>{
        if(i===0) return `<tr style="background:var(--bg)">
          <td class="r" style="font-weight:600">0</td>
          <td>${r.fecha||'—'}</td>
          <td class="mo">—</td><td class="mo">—</td><td class="mo">—</td><td class="mo">—</td>
          <td class="mo bld" style="color:${col}">${fmtFull(r.saldo)}</td>
          <td style="text-align:center;color:var(--muted);font-size:.65rem">—</td>
        </tr>`;
        const isPaid = r.saldo <= 0.01;
        const st = credPeriodStatus(c, r);
        const totalPagR = credTotalPagadoPeriodo(c, r.periodo);
        const pr = (c.pagos||[]).filter(p=>p.periodo===r.periodo).sort((a,b)=>(b.fecha||'')>(a.fecha||'')?1:-1)[0];
        let cobrCell = '';
        if(st==='PAGADO'){
          cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--green-bg);color:var(--green);font-weight:700">Pagado</span><br><span style="font-size:.58rem;color:var(--muted)">${pr?pr.fecha:''} · ${fmtFull(totalPagR)}</span></td>`;
        } else if(st==='PARCIAL'){
          cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--orange-bg);color:var(--orange);font-weight:700">Parcial</span><br><span style="font-size:.58rem;color:var(--muted)">${fmtFull(totalPagR)} de ${fmtFull(r.pago)}</span><br>${!isViewer() ? `<button class="btn btn-out cred-reg-pago-btn" style="font-size:.58rem;margin-top:2px;padding:1px 6px;height:auto" data-ent="${escapeHtml(entKey)}" data-idx="${resolvedIdx}" data-periodo="${r.periodo}">+ Completar</button>` : ''}</td>`;
        } else if(st==='VENCIDO'){
          const dias = credDiasAtraso(r);
          cobrCell = `<td style="text-align:center"><span style="font-size:.62rem;padding:2px 7px;border-radius:8px;background:var(--red-bg);color:var(--red);font-weight:700">Vencido ${dias}d</span><br>${!isViewer() ? `<button class="cred-reg-pago-btn" style="font-size:.58rem;margin-top:2px;padding:2px 8px;border-radius:6px;background:var(--red);color:#fff;border:none;cursor:pointer" data-ent="${escapeHtml(entKey)}" data-idx="${resolvedIdx}" data-periodo="${r.periodo}">Registrar Pago</button>` : ''}</td>`;
        } else {
          cobrCell = !isViewer() ? `<td style="text-align:center"><button class="btn btn-out cred-reg-pago-btn" style="font-size:.58rem;padding:2px 8px;height:auto" data-ent="${escapeHtml(entKey)}" data-idx="${resolvedIdx}" data-periodo="${r.periodo}">Registrar Pago</button></td>` : '<td></td>';
        }
        return `<tr ${isPaid?'style="opacity:.6"':''}>
          <td class="r">${r.periodo}</td>
          <td style="font-size:.75rem">${r.fecha||'—'}</td>
          <td class="mo bld">${fmtFull(r.pago)}</td>
          <td class="mo pos">${fmtFull(r.capital)}</td>
          <td class="mo" style="color:var(--orange)">${fmtFull(r.int)}</td>
          <td class="mo" style="color:var(--muted);font-size:.72rem">${fmtFull(r.ivaInt)}</td>
          <td class="mo bld" style="color:${isPaid?'var(--green)':col}">${isPaid?'✅ Pagado':fmtFull(r.saldo)}</td>
          ${cobrCell}
        </tr>`;
      }).join('');
      const resumen = credCobranzaResumen(c);
      const resBadge = resumen ? `<span style="font-size:.6rem;padding:1px 6px;border-radius:6px;margin-left:6px;background:${resumen.vencido>0?'var(--red-bg)':'var(--green-bg)'};color:${resumen.vencido>0?'var(--red)':'var(--green)'};font-weight:600">${resumen.pagado}/${resumen.total} pagados</span>` : '';
      amortTable = `
        <div style="margin-top:16px">
          <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">📅 Tabla de Amortizacion ${resBadge}</div>
          <div id="cobr-form-container"></div>
          <div style="overflow-x:auto">
            <table class="bt">
              <thead><tr>
                <th class="r">Periodo</th><th>Fecha</th>
                <th class="r">Pago Fijo</th><th class="r">Abono Capital</th>
                <th class="r">Intereses</th><th class="r">IVA Intereses</th>
                <th class="r">Saldo Capital</th>
                <th style="text-align:center;min-width:100px">Cobranza</th>
              </tr></thead>
              <tbody>${rows}</tbody>
              <tfoot><tr style="background:var(--bg);font-weight:700">
                <td colspan="2" class="bld">TOTALES</td>
                <td class="mo bld">${fmtFull(pagoTotal)}</td>
                <td class="mo pos">${fmtFull(c.monto)}</td>
                <td class="mo" style="color:var(--orange)">${fmtFull(intTot)}</td>
                <td class="mo" style="color:var(--muted)">${fmtFull(ivaTot)}</td>
                <td class="mo bld" style="color:var(--green)">$0.00</td>
                <td></td>
              </tfoot>
            </table>
          </div>
        </div>`;
    }

    const html = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        <div style="width:44px;height:44px;border-radius:12px;background:${col}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem">🏦</div>
        <div style="flex:1">
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${c.cl}</div>
          <div style="font-size:.72rem;color:var(--muted)">${label} · ${c.producto||c.tipo||'Credito Simple'} · ${c.cat?'CAT '+c.cat+'%':''}</div>
        </div>
        <span style="font-size:.7rem;font-weight:700;padding:4px 12px;border-radius:12px;background:${c.st==='Activo'?'var(--green-bg)':c.st==='Vencido'?'var(--red-bg)':'var(--yellow-bg)'};color:${c.st==='Activo'?'var(--green)':c.st==='Vencido'?'var(--red)':'var(--yellow)'}">${c.st}</span>
      </div>

      <!-- KPIs del credito -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
        <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
          <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Monto Original</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:${col}">${fmtFull(c.monto)}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
          <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Pago Fijo</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem">${credPagoFijo(c)?fmtFull(credPagoFijo(c)):'—'}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
          <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total a Pagar</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--blue)">${pagoTotal?fmtFull(pagoTotal):'—'}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:12px;border:1px solid var(--border)">
          <div style="font-size:.67rem;color:var(--muted);margin-bottom:4px">Total Intereses</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:var(--purple)">${fmtFull(intTot)}</div>
        </div>
      </div>

      <!-- Datos del credito -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
          <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Plazo</div>
          <div style="font-weight:600">${c.plazo} periodos (${c.vencimiento||'Años'})</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
          <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Tasa Anual</div>
          <div style="font-weight:600">${c.tasa}% · IVA ${c.iva||16}%</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
          <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Comision apertura</div>
          <div style="font-weight:600">${c.com||0}% → ${fmtFull(credComApertura(c))}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem">
          <div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">CAT</div>
          <div style="font-weight:600">${c.cat||c.tasa}%</div>
        </div>
        ${c.disbDate ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha desembolso</div><div style="font-weight:600">'+c.disbDate+'</div></div>' : ''}
        ${c.fechaElab ? '<div style="background:var(--bg);border-radius:var(--r);padding:10px 14px;font-size:.78rem"><div style="color:var(--muted);font-size:.67rem;margin-bottom:2px">Fecha elaboracion</div><div style="font-weight:600">'+c.fechaElab+'</div></div>' : ''}
      </div>
      ${amortTable}
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
        <button id="cred-del-btn" class="cred-del-hover-btn" data-ent="${escapeHtml(entKey)}" data-idx="${resolvedIdx}"
          style="background:var(--red-bg);color:var(--red);border:1px solid var(--red-lt);border-radius:var(--r);padding:7px 16px;cursor:pointer;font-size:.78rem;font-weight:600">
          🗑 Eliminar credito
        </button>
      </div>`;

    openModal(null, `🏦 Detalle — ${_esc(c.cl)} · ${fmtK(c.monto)}`, html);

    // Event delegation for detail modal (bind once per render)
    const modalBody = document.getElementById('modal-body');
    if(modalBody && !modalBody._credDetailBound){
      modalBody._credDetailBound = true;
      modalBody.addEventListener('click', function(e){
        const regBtn = e.target.closest('.cred-reg-pago-btn');
        if(regBtn){
          e.stopPropagation();
          credRegistrarPago(regBtn.dataset.ent, +regBtn.dataset.idx, +regBtn.dataset.periodo);
          return;
        }
        const delBtn = e.target.closest('#cred-del-btn');
        if(delBtn){
          credDelete(delBtn.dataset.ent, +delBtn.dataset.idx);
          return;
        }
        const guardarBtn = e.target.closest('.cred-guardar-pago-btn');
        if(guardarBtn){
          credGuardarPago(guardarBtn.dataset.ent, +guardarBtn.dataset.idx, +guardarBtn.dataset.periodo);
          return;
        }
        const cancelBtn = e.target.closest('.cred-cancel-pago-btn');
        if(cancelBtn){
          var f = document.getElementById(cancelBtn.dataset.form);
          if(f) f.remove();
        }
      });
    }
  }

  // ── Registro de pagos ──
  function credRegistrarPago(entKey, creditIdx, periodo){
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    const c = credits[creditIdx];
    if(!c) return;
    const amortRow = c.amort ? c.amort.find(r=>r.periodo===periodo) : null;
    if(!amortRow) return;

    const formId = 'cobr-form-'+periodo;
    const existing = document.getElementById(formId);
    if(existing){ existing.remove(); return; }

    // Remove any other open form
    document.querySelectorAll('[id^="cobr-form-"]').forEach(el=>el.remove());

    const defaultFecha = new Date().toISOString().split('T')[0];
    const totalYaPagado = typeof credTotalPagadoPeriodo === 'function' ? credTotalPagadoPeriodo(c, periodo) : ((c.pagos||[]).find(p=>p.periodo===periodo)||{}).monto||0;
    const isParcial = totalYaPagado > 0 && totalYaPagado < (amortRow.pago||0) - 0.01;
    const faltante = Math.max(0, (amortRow.pago||0) - totalYaPagado);
    // Para periodo parcial: sugerir el faltante. Para periodo sin pago: sugerir el monto completo.
    const defaultMonto = isParcial ? +faltante.toFixed(2) : (amortRow.pago||0);

    const formHtml = `
      <div id="${formId}" style="background:var(--blue-bg);border:1px solid var(--blue);border-radius:10px;padding:14px 18px;margin:12px 0;animation:fadeIn .2s">
        <div style="font-size:.75rem;font-weight:700;color:var(--blue);margin-bottom:10px">
          💰 ${isParcial ? 'Complementar Pago' : 'Registrar Pago'} — Periodo ${periodo} · Vence: ${amortRow.fecha||'—'} · Pago fijo: ${fmtFull(amortRow.pago)}
          ${isParcial ? `<span style="color:var(--orange);font-size:.68rem;font-weight:600;margin-left:6px">Ya pagado: ${fmtFull(totalYaPagado)} · Faltante: ${fmtFull(faltante)}</span>` : ''}
        </div>
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <label style="font-size:.65rem;color:var(--muted);display:block;margin-bottom:3px">Fecha del pago</label>
            <input id="cobr-fecha-${periodo}" type="date" value="${defaultFecha}"
              style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;font-family:'Figtree',sans-serif;background:var(--white);color:var(--text)">
          </div>
          <div style="flex:1;min-width:140px">
            <label style="font-size:.65rem;color:var(--muted);display:block;margin-bottom:3px">${isParcial ? 'Monto complementario' : 'Monto pagado'}</label>
            <input id="cobr-monto-${periodo}" type="number" step="0.01" value="${defaultMonto}"
              style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;font-family:'Figtree',sans-serif;background:var(--white);color:var(--text)">
          </div>
          <button class="cred-guardar-pago-btn" data-ent="${escapeHtml(entKey)}" data-idx="${creditIdx}" data-periodo="${periodo}"
            style="padding:7px 18px;border-radius:8px;background:var(--green);color:#fff;border:none;cursor:pointer;font-size:.72rem;font-weight:600;font-family:'Figtree',sans-serif">
            Guardar
          </button>
          <button class="cred-cancel-pago-btn" data-form="${escapeHtml(formId)}"
            style="padding:7px 14px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:.72rem;font-family:'Figtree',sans-serif">
            Cancelar
          </button>
        </div>
        ${isParcial ? `<div style="font-size:.62rem;color:var(--green);margin-top:6px">✅ El monto ingresado se sumará al pago existente (${fmtFull(totalYaPagado)})</div>` : ''}
      </div>`;

    const container = document.getElementById('cobr-form-container');
    if(container){ container.innerHTML = formHtml; }
    else {
      // Fallback: insert before table
      const tbl = document.querySelector('#modal-body .bt');
      if(tbl) tbl.closest('div').insertAdjacentHTML('beforebegin', formHtml);
    }
  }

  function credGuardarPago(entKey, creditIdx, periodo){
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    const c = credits[creditIdx];
    if(!c) return;

    const fechaEl = document.getElementById('cobr-fecha-'+periodo);
    const montoEl = document.getElementById('cobr-monto-'+periodo);
    if(!fechaEl||!montoEl) return;

    const fechaISO = fechaEl.value;
    const monto = parseFloat(montoEl.value);
    if(!fechaISO||isNaN(monto)||monto<=0){ toast('Ingresa fecha y monto validos'); return; }

    const [y,m,d] = fechaISO.split('-');
    const fechaDDMMYYYY = `${d}/${m}/${y}`;

    if(!c.pagos) c.pagos = [];
    const totalYaPagado = c.pagos.filter(p=>p.periodo===periodo).reduce((s,p)=>s+(p.monto||0),0);
    const amortPago = (c.amort && c.amort.find(r=>r.periodo===periodo)) ? c.amort.find(r=>r.periodo===periodo).pago||0 : 0;
    const isParcial = totalYaPagado > 0 && totalYaPagado < amortPago - 0.01;

    if(isParcial){
      // Complemento: sumar al pago existente y consolidar en un solo registro
      const newTotal = +(totalYaPagado + monto).toFixed(2);
      // Reemplazar todos los registros del periodo por uno consolidado
      c.pagos = c.pagos.filter(p=>p.periodo!==periodo);
      c.pagos.push({ periodo, fecha:fechaDDMMYYYY, monto:newTotal });
    } else {
      // Pago nuevo o reemplazo completo
      const idx = c.pagos.findIndex(p=>p.periodo===periodo);
      if(idx>=0) c.pagos[idx] = { periodo, fecha:fechaDDMMYYYY, monto };
      else c.pagos.push({ periodo, fecha:fechaDDMMYYYY, monto });
    }

    DB.set('gf_cred_'+entKey, credits);
    credOpenDetail(entKey, c.cl, creditIdx);
    const nuevoTotal = c.pagos.filter(p=>p.periodo===periodo).reduce((s,p)=>s+(p.monto||0),0);
    toast('✅ Pago registrado — Periodo '+periodo+(isParcial?' ('+fmtFull(nuevoTotal)+' total)':''));
  }

  function credClearAll(entKey){
    const label = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
    customConfirm('¿Limpiar toda la cartera de '+label+'? Esta accion no se puede deshacer.', 'Limpiar', (ok)=>{
      if(!ok) return;
      const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
      credits.length = 0;
      DB.remove('gf_cred_'+entKey);
      DB.remove('gf_cc_hist');
      entKey==='end' ? rEndCred() : rDynCred();
      fiInjectTPV(); fiInjectCredits(); syncFlujoToRecs();
      toast('🗑 Cartera de '+label+' limpiada');
    });
  }

  function credDelete(entKey, idx){
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    const name = (credits[idx] && credits[idx].cl) ? credits[idx].cl : 'este credito';
    customConfirm('¿Eliminar "' + name + '"?', 'Eliminar', (ok)=>{
      if(!ok) return;
      credits.splice(idx, 1);
      DB.set('gf_cred_' + entKey, credits);
      closeModal();
      if(entKey==='end') rEndCred(); else rDynCred();
      toast('🗑 ' + name + ' eliminado');
    });
  }

  // ══════════════════════════════════════
  // CREDITO MANUAL — Formulario + Generador de Amortizacion
  // ══════════════════════════════════════
  let _credFormEnt = '';     // entKey del formulario abierto
  let _credFormIdx = -1;     // -1 = nuevo, >=0 = edicion
  let _amortDraft  = [];     // tabla de amortizacion en borrador

  function credAddRow(entKey){
    credOpenForm(entKey);
  }

  /** Abrir modal con formulario de captura de credito */
  function credOpenForm(entKey, editIdx){
    _credFormEnt = entKey;
    _credFormIdx = typeof editIdx === 'number' ? editIdx : -1;
    _amortDraft  = [];

    const isEdit = _credFormIdx >= 0;
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    const c = isEdit ? credits[_credFormIdx] : null;
    const col = entKey==='end' ? '#00b875' : '#ff7043';
    const label = entKey==='end' ? 'Endless Money' : 'Dynamo Finance';
    const title = (isEdit ? '✏️ Editar' : '➕ Nuevo') + ' Credito — ' + label;

    // Defaults
    const today = new Date();
    const todayStr = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    const dDate = c && c.disbDate ? _credDisbToISO(c.disbDate) : todayStr;

    const html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-bottom:16px">
        <div style="grid-column:1/-1">
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Cliente / Acreditado</label>
          <input id="cf-cl" type="text" value="${c?c.cl:''}" placeholder="Nombre del cliente" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Monto del Credito</label>
          <input id="cf-monto" type="number" step="0.01" min="0" value="${c?c.monto:''}" placeholder="100000" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Plazo (meses)</label>
          <input id="cf-plazo" type="number" min="1" max="360" value="${c?c.plazo:12}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Tasa Anual %</label>
          <input id="cf-tasa" type="number" step="0.01" min="0" value="${c?c.tasa:''}" placeholder="24" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Comision Apertura %</label>
          <input id="cf-com" type="number" step="0.01" min="0" value="${c?c.com:0}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">IVA Intereses %</label>
          <input id="cf-iva" type="number" step="0.01" min="0" value="${c&&c.iva!=null?c.iva:16}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Fecha Desembolso</label>
          <input id="cf-fecha" type="date" value="${dDate}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Tipo</label>
          <select id="cf-tipo" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
            <option value="Simple" ${c&&c.tipo==='Simple'?'selected':''}>Simple</option>
            <option value="Revolvente" ${c&&c.tipo==='Revolvente'?'selected':''}>Revolvente</option>
          </select>
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Estatus</label>
          <select id="cf-st" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
            <option value="Prospecto" ${c&&c.st==='Prospecto'?'selected':''}>Prospecto</option>
            <option value="Activo" ${(!c||c.st==='Activo')?'selected':''}>Activo</option>
            <option value="Vencido" ${c&&c.st==='Vencido'?'selected':''}>Vencido</option>
            <option value="Pagado" ${c&&c.st==='Pagado'?'selected':''}>Pagado</option>
          </select>
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Garantia</label>
          <input id="cf-garantia" type="text" value="${c?c.garantia||'':''}" placeholder="Opcional" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Destino</label>
          <input id="cf-destino" type="text" value="${c?c.destino||'':''}" placeholder="Opcional" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
        <div>
          <label style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:3px">Producto</label>
          <input id="cf-producto" type="text" value="${c?c.producto||'':''}" placeholder="Opcional" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:var(--bg)">
        </div>
      </div>

      <!-- Botones de accion -->
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <button class="cred-generar-btn" style="padding:8px 18px;border-radius:8px;background:${col};color:#fff;border:none;font-size:.78rem;font-weight:600;cursor:pointer">📊 Generar Tabla</button>
        <button class="cred-save-btn" style="padding:8px 18px;border-radius:8px;background:var(--blue);color:#fff;border:none;font-size:.78rem;font-weight:600;cursor:pointer">💾 Guardar Credito</button>
        <button class="cred-cancel-btn" style="padding:8px 18px;border-radius:8px;background:transparent;color:var(--muted);border:1px solid var(--border);font-size:.78rem;cursor:pointer">Cancelar</button>
      </div>

      <!-- Contenedor de la tabla de amortizacion -->
      <div id="cf-amort-container"></div>
    `;

    openModal(null, title, html);

    // ── Event listeners for modal action buttons ──
    var genBtn = document.querySelector('.cred-generar-btn');
    if(genBtn) genBtn.addEventListener('click', credGenerarAmort);
    var saveBtn = document.querySelector('.cred-save-btn');
    if(saveBtn) saveBtn.addEventListener('click', credSaveForm);
    var cancelBtn = document.querySelector('.cred-cancel-btn');
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Si es edicion y ya tiene tabla, cargarla
    if(isEdit && c && c.amort && c.amort.length > 1){
      _amortDraft = JSON.parse(JSON.stringify(c.amort));
      setTimeout(()=> _credRenderAmortDraft(), 50);
    }
  }

  /** Convertir disbDate DD/MM/YYYY a YYYY-MM-DD para input date */
  function _credDisbToISO(str){
    if(!str) return '';
    if(str.includes('-') && str.length===10) return str; // ya es ISO
    const p = str.split('/');
    if(p.length!==3) return '';
    return p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0');
  }

  /** Generar tabla de amortizacion (sistema frances — pagos fijos) */
  function credGenerarAmort(){
    const monto = parseFloat(document.getElementById('cf-monto').value) || 0;
    const plazo = parseInt(document.getElementById('cf-plazo').value) || 12;
    const tasaAnual = parseFloat(document.getElementById('cf-tasa').value) || 0;
    const ivaP = parseFloat(document.getElementById('cf-iva').value) || 16;
    const fechaStr = document.getElementById('cf-fecha').value;

    if(monto <= 0){ toast('⚠️ Ingresa un monto valido'); return; }
    if(tasaAnual <= 0){ toast('⚠️ Ingresa una tasa valida'); return; }

    const r = tasaAnual / 100 / 12; // tasa mensual
    // Pago fijo (sistema frances)
    const pagoFijo = r > 0 ? monto * (r * Math.pow(1+r, plazo)) / (Math.pow(1+r, plazo) - 1) : monto / plazo;

    // Fecha de inicio
    let startDate = fechaStr ? new Date(fechaStr + 'T12:00:00') : new Date();

    _amortDraft = [];
    // Fila 0: saldo inicial
    _amortDraft.push({
      periodo: 0,
      fecha: credFormatDate(startDate),
      pago: 0, capital: 0, int: 0, ivaInt: 0,
      saldo: Math.round(monto*100)/100
    });

    let saldo = monto;
    for(let i = 1; i <= plazo; i++){
      const fechaPeriodo = new Date(startDate);
      fechaPeriodo.setMonth(fechaPeriodo.getMonth() + i);

      const interes = Math.round(saldo * r * 100) / 100;
      const ivaInt = Math.round(interes * (ivaP/100) * 100) / 100;
      const capital = Math.round((pagoFijo - interes) * 100) / 100;
      saldo = Math.round((saldo - capital) * 100) / 100;
      if(i === plazo) saldo = 0; // ajustar redondeo ultimo periodo

      _amortDraft.push({
        periodo: i,
        fecha: credFormatDate(fechaPeriodo),
        pago: Math.round(pagoFijo * 100) / 100,
        capital: capital,
        int: interes,
        ivaInt: ivaInt,
        saldo: Math.max(saldo, 0)
      });
    }

    _credRenderAmortDraft();
    toast('📊 Tabla generada: ' + plazo + ' periodos');
  }

  /** Renderizar tabla de amortizacion editable */
  function _credRenderAmortDraft(){
    const el = document.getElementById('cf-amort-container');
    if(!el || !_amortDraft.length) return;

    const col = _credFormEnt==='end' ? '#00b875' : '#ff7043';
    let totPago=0, totCap=0, totInt=0, totIva=0;
    _amortDraft.slice(1).forEach(r=>{ totPago+=r.pago; totCap+=r.capital; totInt+=r.int; totIva+=r.ivaInt; });

    const rows = _amortDraft.map((r,i)=>{
      if(i===0) return `<tr style="background:var(--bg)">
        <td class="r" style="font-weight:600">0</td>
        <td><input class="amort-draft-input" type="text" value="${r.fecha}" data-idx="0" data-field="fecha" style="width:90px;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem;background:var(--bg)"></td>
        <td class="mo">—</td><td class="mo">—</td><td class="mo">—</td><td class="mo">—</td>
        <td class="mo bld" style="color:${col}">${fmtFull(r.saldo)}</td>
      </tr>`;
      return `<tr>
        <td class="r">${r.periodo}</td>
        <td><input class="amort-draft-input" type="text" value="${r.fecha}" data-idx="${i}" data-field="fecha" style="width:90px;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem"></td>
        <td><input class="amort-draft-input" type="number" step="0.01" value="${r.pago.toFixed(2)}" data-idx="${i}" data-field="pago" data-recalc="1" style="width:85px;text-align:right;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem"></td>
        <td><input class="amort-draft-input" type="number" step="0.01" value="${r.capital.toFixed(2)}" data-idx="${i}" data-field="capital" data-recalc="1" style="width:85px;text-align:right;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem"></td>
        <td><input class="amort-draft-input" type="number" step="0.01" value="${r.int.toFixed(2)}" data-idx="${i}" data-field="int" data-recalc="1" style="width:85px;text-align:right;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem"></td>
        <td><input class="amort-draft-input" type="number" step="0.01" value="${r.ivaInt.toFixed(2)}" data-idx="${i}" data-field="ivaInt" data-recalc="1" style="width:85px;text-align:right;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:.72rem"></td>
        <td class="mo bld" style="color:${r.saldo<=0.01?'var(--green)':col};font-size:.75rem">${r.saldo<=0.01?'✅ $0':fmtFull(r.saldo)}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">📅 Tabla de Amortizacion <span style="font-size:.65rem;font-weight:400;color:var(--muted)">(editable — modifica cualquier celda)</span></div>
      <div style="overflow-x:auto;max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:10px">
        <table class="bt" style="margin:0">
          <thead style="position:sticky;top:0;z-index:1"><tr>
            <th class="r" style="width:50px">Per.</th><th style="width:100px">Fecha</th>
            <th class="r" style="width:95px">Pago Fijo</th><th class="r" style="width:95px">Capital</th>
            <th class="r" style="width:95px">Intereses</th><th class="r" style="width:95px">IVA Int.</th>
            <th class="r" style="width:95px">Saldo</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot id="cf-amort-foot"><tr style="background:var(--bg);font-weight:700">
            <td colspan="2" class="bld">TOTALES</td>
            <td class="mo bld">${fmtFull(totPago)}</td>
            <td class="mo bld" style="color:var(--green)">${fmtFull(totCap)}</td>
            <td class="mo bld" style="color:var(--orange)">${fmtFull(totInt)}</td>
            <td class="mo" style="color:var(--muted)">${fmtFull(totIva)}</td>
            <td class="mo bld" style="color:var(--green)">$0.00</td>
          </tr></tfoot>
        </table>
      </div>
      <div style="font-size:.62rem;color:var(--muted);margin-top:6px">${_amortDraft.length-1} periodos · Sistema frances (pagos fijos)</div>
    `;

    // Event delegation for amort draft inputs (bind once)
    if(!el._amortBound){
      el._amortBound = true;
      el.addEventListener('change', function(e){
        const inp = e.target.closest('.amort-draft-input');
        if(!inp) return;
        var idx = +inp.dataset.idx;
        var field = inp.dataset.field;
        if(field === 'fecha'){
          _amortDraft[idx].fecha = inp.value;
        } else {
          _amortDraft[idx][field] = +inp.value;
          if(inp.dataset.recalc) _credRecalcTotals();
        }
      });
    }
  }

  /** Recalcular totales del footer cuando se edita una celda */
  function _credRecalcTotals(){
    const foot = document.getElementById('cf-amort-foot');
    if(!foot) return;
    let totPago=0, totCap=0, totInt=0, totIva=0;
    _amortDraft.slice(1).forEach(r=>{ totPago+=r.pago; totCap+=r.capital; totInt+=r.int; totIva+=r.ivaInt; });
    const cells = foot.querySelectorAll('td');
    if(cells.length>=6){
      cells[1].innerHTML = fmtFull(totPago);
      cells[2].innerHTML = fmtFull(totCap);
      cells[3].innerHTML = fmtFull(totInt);
      cells[4].innerHTML = fmtFull(totIva);
    }
  }

  /** Guardar credito desde el formulario */
  function credSaveForm(){
    const cl = (document.getElementById('cf-cl').value||'').trim();
    const monto = parseFloat(document.getElementById('cf-monto').value) || 0;
    const plazo = parseInt(document.getElementById('cf-plazo').value) || 12;
    const tasa = parseFloat(document.getElementById('cf-tasa').value) || 0;
    const com = parseFloat(document.getElementById('cf-com').value) || 0;
    const iva = parseFloat(document.getElementById('cf-iva').value) || 16;
    const tipo = document.getElementById('cf-tipo').value;
    const st = document.getElementById('cf-st').value;
    const garantia = (document.getElementById('cf-garantia').value||'').trim();
    const destino = (document.getElementById('cf-destino').value||'').trim();
    const producto = (document.getElementById('cf-producto').value||'').trim();
    const fechaISO = document.getElementById('cf-fecha').value;

    // Validar
    if(!cl){ toast('⚠️ Ingresa el nombre del cliente'); return; }
    if(monto <= 0){ toast('⚠️ Ingresa un monto valido'); return; }

    // Convertir fecha ISO a DD/MM/YYYY
    let disbDate = '';
    if(fechaISO){
      const p = fechaISO.split('-');
      disbDate = p[2]+'/'+p[1]+'/'+p[0];
    }

    var creditId = cl.replace(/[^a-zA-Z0-9]/g,'_').toLowerCase() + '_' + monto + '_' + plazo;
    const credit = {
      creditId, cl, monto, plazo, tasa, com, iva, tipo, st,
      garantia, destino, producto, disbDate,
      amort: _amortDraft.length > 1 ? _amortDraft : [],
      pagos: []
    };

    const entKey = _credFormEnt;
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;

    if(_credFormIdx >= 0){
      // Edicion: preservar pagos existentes
      credit.pagos = credits[_credFormIdx].pagos || [];
      credits[_credFormIdx] = credit;
    } else {
      credits.push(credit);
    }

    DB.set('gf_cred_' + entKey, credits);
    closeModal();
    entKey==='end' ? rEndCred() : rDynCred();
    toast('✅ Credito ' + (_credFormIdx >= 0 ? 'actualizado' : 'guardado') + ': ' + cl);

    // Limpiar estado
    _credFormEnt = '';
    _credFormIdx = -1;
    _amortDraft = [];
  }

  function credDelRow(entKey, ci){
    if(false) return; // confirm handled via customConfirm elsewhere
    const credits = entKey==='end' ? END_CREDITS : DYN_CREDITS;
    credits.splice(ci,1);
    entKey==='end' ? rEndCred() : rDynCred();
    fiInjectCredits(); rPL(entKey); rPLCharts(entKey);
  }

  // Expose globals
  window.credOpenDetail    = credOpenDetail;
  window.credRegistrarPago = credRegistrarPago;
  window.credGuardarPago   = credGuardarPago;
  window.credClearAll      = credClearAll;
  window.credDelete        = credDelete;
  window.credAddRow        = credAddRow;
  window.credOpenForm      = credOpenForm;
  window._credDisbToISO    = _credDisbToISO;
  window.credGenerarAmort  = credGenerarAmort;
  window._credRenderAmortDraft = _credRenderAmortDraft;
  window._credRecalcTotals = _credRecalcTotals;
  window.credSaveForm      = credSaveForm;
  window.credDelRow        = credDelRow;
  window._amortDraft       = _amortDraft;

})(window);
