// GF — Expedientes
(function(window) {
  'use strict';

// GF — Expedientes de Clientes
// CRUD clientes + upload documentos a Supabase Storage

let _expClients = [];
let _expCurrentId = null;
let _expOtroCount = 0;
let _expPendingDocs = []; // Files queued before client is saved

// Filtro activo por empresa (null = todas)
window._expFilterEnt = null;

// Mapeo productos → empresas para filtro
const PROD_TO_ENT = {
  'TPV':'Salem','Tarjeta Centum Black':'Salem','Tarjeta Centum Blue':'Salem',
  'Crédito Simple':'Endless','Crédito Automotriz':'Dynamo',
  'Exchange':'Wirebit','OTC':'Wirebit','Tarjeta Wirebit':'Wirebit',
  'Retiro Blockchain':'Wirebit','Retiro FIAT':'Wirebit',
};

// ── Doc categories by tipo_persona ──
const EXP_DOCS_FISICA = [
  { key:'csf', icon:'📄', label:'Constancia de Situación Fiscal' },
  { key:'domicilio', icon:'🏠', label:'Comprobante de Domicilio' },
  { key:'identificacion', icon:'🪪', label:'Identificación (INE/Pasaporte)' }
];

const EXP_DOCS_MORAL_EXTRA = [
  { key:'csf_empresa', icon:'🏢', label:'CSF de la Empresa' },
  { key:'domicilio_empresa', icon:'🏠', label:'Comprobante Domicilio Empresa' },
  { key:'acta_constitutiva', icon:'📜', label:'Acta Constitutiva' },
  { key:'poderes', icon:'⚖️', label:'Poderes del Rep. Legal' }
];

// ══════════════════════════════════════
// RENDER PRINCIPAL
// ══════════════════════════════════════
async function rExpedientes(filterEnt){
  window._expFilterEnt = (filterEnt !== undefined) ? filterEnt : null;
  await _ensureSupabase();
  await expLoadList();
  _expCurrentId = null;
  document.getElementById('exp-detail').style.display = 'none';
  document.getElementById('exp-placeholder').style.display = '';
  // Show filter banner
  var banner = document.getElementById('exp-filter-banner');
  if(banner){
    banner.style.display = window._expFilterEnt ? 'flex' : 'none';
    if(window._expFilterEnt){
      var ec = (typeof ENT_COLOR!=='undefined' ? ENT_COLOR[window._expFilterEnt] : null) || '#555';
      var count = _expClients.length;
      banner.innerHTML = '<span style="font-size:.75rem;font-weight:600;color:'+ec+'">Clientes de: '+window._expFilterEnt+'</span><span style="font-size:.65rem;color:var(--muted);margin-left:8px">('+count+' clientes)</span>';
    }
  }
}

// ══════════════════════════════════════
// LIST: Cargar y renderizar lista
// ══════════════════════════════════════
async function expLoadList(){
  const { data, error } = await _sb.from('exp_clientes')
    .select('id, tipo_persona, nombre_completo, razon_social, productos, correo')
    .order('nombre_completo', { ascending: true });

  let clients = data || [];
  // Apply company filter if active
  if(window._expFilterEnt){
    clients = clients.filter(function(c){
      var prods = c.productos || [];
      return prods.some(function(p){
        var ent = PROD_TO_ENT[p];
        return ent === window._expFilterEnt;
      });
    });
  }
  _expClients = clients;
  expRenderList(_expClients);
}

function expRenderList(clients){
  const el = document.getElementById('exp-list');
  const empty = document.getElementById('exp-list-empty');

  if(!clients.length){
    el.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  el.innerHTML = clients.map(c => {
    const name = c.tipo_persona === 'moral' ? (c.razon_social || c.nombre_completo || 'Sin nombre') : (c.nombre_completo || 'Sin nombre');
    const tipo = c.tipo_persona === 'moral' ? 'PM' : 'PF';
    const tipoColor = c.tipo_persona === 'moral' ? 'var(--purple)' : 'var(--blue)';
    const prods = c.productos || [];
    const isActive = c.id === _expCurrentId;
    return `<div class="exp-list-item${isActive?' active':''}" onclick="expSelectClient(${c.id})" data-id="${c.id}">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="background:${tipoColor};color:#fff;font-size:.55rem;font-weight:700;padding:2px 6px;border-radius:4px">${tipo}</span>
        <span style="font-weight:600;font-size:.78rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
      </div>
      ${prods.length ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:3px">${prods.map(p=>`<span style="font-size:.55rem;background:var(--bg);padding:1px 5px;border-radius:3px;color:var(--muted)">${p}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
}

function expFilterList(){
  const q = (document.getElementById('exp-search').value || '').toLowerCase().trim();
  if(!q){ expRenderList(_expClients); return; }
  const filtered = _expClients.filter(c => {
    const name = (c.nombre_completo || c.razon_social || '').toLowerCase();
    const email = (c.correo || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
  expRenderList(filtered);
}

// ══════════════════════════════════════
// SELECT: Cargar detalle de un cliente
// ══════════════════════════════════════
async function expSelectClient(id){
  _expCurrentId = id;
  document.getElementById('exp-detail').style.display = '';
  document.getElementById('exp-placeholder').style.display = 'none';
  document.getElementById('exp-btn-delete').style.display = '';

  // Highlight in list
  document.querySelectorAll('.exp-list-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === id);
  });

  // Fetch full client
  const { data } = await _sb.from('exp_clientes').select('*').eq('id', id).single();
  if(!data) { toast('⚠️ Cliente no encontrado'); return; }

  _expFillForm(data);
  await expRenderDocs(id, data.tipo_persona);
}

function _expFillForm(c){
  document.getElementById('exp-id').value = c.id || '';

  // Toggle tipo
  const tipo = c.tipo_persona || 'fisica';
  expToggleTipo(tipo, null, true);

  // Persona física fields
  document.getElementById('exp-nombre').value = c.nombre_completo || '';
  document.getElementById('exp-rfc').value = c.rfc || '';

  // Persona moral fields
  document.getElementById('exp-razon').value = c.razon_social || '';
  document.getElementById('exp-rfc-moral').value = c.rfc || '';
  document.getElementById('exp-representante').value = c.representante_legal || '';
  document.getElementById('exp-rfc-rep').value = '';

  // Common fields
  document.getElementById('exp-contacto').value = c.persona_contacto || '';
  document.getElementById('exp-correo').value = c.correo || '';
  document.getElementById('exp-telefono').value = c.telefono || '';
  document.getElementById('exp-direccion').value = c.direccion || '';
  document.getElementById('exp-notas').value = c.notas || '';

  // Products
  const prods = c.productos || [];
  document.querySelectorAll('#exp-productos input[type=checkbox]').forEach(cb => {
    cb.checked = prods.includes(cb.value);
    cb.closest('.exp-chip').classList.toggle('active', cb.checked);
  });
}

// ══════════════════════════════════════
// NEW: Limpiar formulario
// ══════════════════════════════════════
function expNewClient(){
  _expCurrentId = null;
  document.getElementById('exp-detail').style.display = '';
  document.getElementById('exp-placeholder').style.display = 'none';
  document.getElementById('exp-btn-delete').style.display = 'none';

  // Deselect list
  document.querySelectorAll('.exp-list-item').forEach(el => el.classList.remove('active'));

  // Clear form
  document.getElementById('exp-id').value = '';
  expToggleTipo('fisica', null, true);
  ['exp-nombre','exp-rfc','exp-razon','exp-rfc-moral','exp-representante','exp-rfc-rep',
   'exp-contacto','exp-correo','exp-telefono','exp-direccion','exp-notas'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  // Clear products
  document.querySelectorAll('#exp-productos input[type=checkbox]').forEach(cb => {
    cb.checked = false;
    cb.closest('.exp-chip').classList.remove('active');
  });

  // Clear pending docs and render empty doc cards
  _expPendingDocs = [];
  _expOtroCount = 0;
  _expRenderDocCardsEmpty('fisica');
  _expClearContractCards();
}

function expCancelEdit(){
  _expCurrentId = null;
  _expPendingDocs = [];
  document.getElementById('exp-detail').style.display = 'none';
  document.getElementById('exp-placeholder').style.display = '';
  document.querySelectorAll('.exp-list-item').forEach(el => el.classList.remove('active'));
}

// ══════════════════════════════════════
// TOGGLE: Persona Física / Moral
// ══════════════════════════════════════
function expToggleTipo(tipo, btnEl, silent){
  document.getElementById('exp-fields-fisica').style.display = tipo === 'fisica' ? '' : 'none';
  document.getElementById('exp-fields-moral').style.display = tipo === 'moral' ? '' : 'none';

  // Update toggle buttons
  document.querySelectorAll('#exp-tipo-toggle .pbtn').forEach(b => {
    b.classList.toggle('active', b.dataset.tipo === tipo);
  });

  // Re-render doc categories
  if(!silent){
    if(_expCurrentId){
      expRenderDocs(_expCurrentId, tipo);
    } else {
      _expRenderDocCardsEmpty(tipo);
    }
  }
}

function _expGetTipo(){
  const active = document.querySelector('#exp-tipo-toggle .pbtn.active');
  return active ? active.dataset.tipo : 'fisica';
}

// ══════════════════════════════════════
// SAVE: Guardar cliente
// ══════════════════════════════════════
async function expSaveClient(){
  const tipo = _expGetTipo();
  const productos = [];
  document.querySelectorAll('#exp-productos input:checked').forEach(cb => productos.push(cb.value));

  let nombre, rfc;
  if(tipo === 'fisica'){
    nombre = document.getElementById('exp-nombre').value.trim();
    rfc = document.getElementById('exp-rfc').value.trim().toUpperCase();
  } else {
    nombre = document.getElementById('exp-razon').value.trim();
    rfc = document.getElementById('exp-rfc-moral').value.trim().toUpperCase();
  }

  if(!nombre){
    toast('⚠️ El nombre es obligatorio');
    return;
  }

  const payload = {
    tipo_persona: tipo,
    nombre_completo: tipo === 'fisica' ? nombre : null,
    razon_social: tipo === 'moral' ? nombre : null,
    representante_legal: tipo === 'moral' ? document.getElementById('exp-representante').value.trim() || null : null,
    persona_contacto: document.getElementById('exp-contacto').value.trim() || null,
    correo: document.getElementById('exp-correo').value.trim() || null,
    telefono: document.getElementById('exp-telefono').value.trim() || null,
    rfc: rfc || null,
    direccion: document.getElementById('exp-direccion').value.trim() || null,
    productos: productos,
    notas: document.getElementById('exp-notas').value.trim() || null,
    updated_at: new Date().toISOString()
  };

  const existingId = document.getElementById('exp-id').value;

  let result;
  if(existingId){
    result = await _sb.from('exp_clientes').update(payload).eq('id', parseInt(existingId)).select().single();
  } else {
    result = await _sb.from('exp_clientes').insert(payload).select().single();
  }

  if(result.error){
    toast('❌ Error: ' + result.error.message);
    return;
  }

  const savedId = result.data.id;
  document.getElementById('exp-id').value = savedId;
  _expCurrentId = savedId;
  document.getElementById('exp-btn-delete').style.display = '';

  // Upload any pending docs
  if(_expPendingDocs.length){
    toast(`📤 Subiendo ${_expPendingDocs.length} documento(s)...`);
    for(const pd of _expPendingDocs){
      await _expUploadFileToStorage(savedId, pd.categoria, pd.file);
    }
    _expPendingDocs = [];
  }

  toast('✅ Cliente guardado');
  await expLoadList();
  await expRenderDocs(savedId, tipo);

  // Highlight saved client
  setTimeout(() => {
    document.querySelectorAll('.exp-list-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.id) === savedId);
    });
  }, 50);
}

// ══════════════════════════════════════
// DELETE: Eliminar cliente
// ══════════════════════════════════════
async function expDeleteClient(){
  if(!_expCurrentId) return;

  // Confirm
  const ok = await new Promise(resolve => {
    const ov = document.getElementById('confirm-overlay');
    document.getElementById('confirm-msg').innerHTML = '¿Eliminar este cliente y todos sus documentos?<br><small style="color:var(--muted)">Esta acción no se puede deshacer.</small>';
    ov.style.display = 'flex';
    document.getElementById('confirm-ok').onclick = () => { ov.style.display='none'; resolve(true); };
    document.getElementById('confirm-cancel').onclick = () => { ov.style.display='none'; resolve(false); };
  });
  if(!ok) return;

  // Delete docs from storage first
  const { data: docs } = await _sb.from('exp_documentos').select('storage_path').eq('cliente_id', _expCurrentId);
  if(docs && docs.length){
    const paths = docs.map(d => d.storage_path);
    await _sb.storage.from('expedientes').remove(paths);
  }

  // Delete client (cascades to exp_documentos)
  const { error } = await _sb.from('exp_clientes').delete().eq('id', _expCurrentId);
  if(error){ toast('❌ Error: ' + error.message); return; }

  toast('🗑️ Cliente eliminado');
  _expCurrentId = null;
  document.getElementById('exp-detail').style.display = 'none';
  document.getElementById('exp-placeholder').style.display = '';
  await expLoadList();
}

// ══════════════════════════════════════
// DOCS: Renderizar doc cards
// ══════════════════════════════════════
async function expRenderDocs(clienteId, tipo){
  const grid = document.getElementById('exp-docs-grid');
  const emptyMsg = document.getElementById('exp-docs-empty');

  if(!clienteId){
    grid.innerHTML = '';
    emptyMsg.style.display = '';
    return;
  }
  emptyMsg.style.display = 'none';

  // Load docs from DB
  const { data: docs } = await _sb.from('exp_documentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at');

  const allDocs = docs || [];

  // Build categories based on tipo
  let cats = [...EXP_DOCS_FISICA];
  if(tipo === 'moral'){
    cats = [...EXP_DOCS_FISCAL_MORAL(), ...EXP_DOCS_MORAL_EXTRA];
  }

  // Add "otros" categories from existing docs
  const knownKeys = new Set(cats.map(c=>c.key).concat(['contratos','anexos']));
  const otrosDocs = allDocs.filter(d => !knownKeys.has(d.categoria));
  const otrosCategories = [...new Set(otrosDocs.map(d => d.categoria))];
  otrosCategories.forEach(cat => {
    cats.push({ key: cat, icon:'📎', label: cat, editable: true });
  });

  grid.innerHTML = cats.map(cat => {
    const catDocs = allDocs.filter(d => d.categoria === cat.key);
    return _expDocCardHTML(cat, catDocs);
  }).join('');

  // Also render contracts and annexes
  _expRenderFixedDocs('contratos', allDocs.filter(d => d.categoria === 'contratos'));
  _expRenderFixedDocs('anexos', allDocs.filter(d => d.categoria === 'anexos'));

  _expOtroCount = otrosCategories.length;
}

function EXP_DOCS_FISCAL_MORAL(){
  return [
    { key:'csf', icon:'📄', label:'CSF del Representante Legal' },
    { key:'domicilio', icon:'🏠', label:'Comprobante Domicilio Rep. Legal' },
    { key:'identificacion', icon:'🪪', label:'Identificación Rep. Legal' }
  ];
}

function _expDocCardHTML(cat, docs, pendingFiles){
  const pending = pendingFiles || [];
  const hasDoc = docs.length > 0 || pending.length > 0;

  const filesHTML = docs.map(d => {
    const size = d.tamano ? _expFmtSize(d.tamano) : '';
    const date = d.created_at ? new Date(d.created_at).toLocaleDateString('es-MX') : '';
    return `<div class="exp-doc-file">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">
        <span style="font-size:.7rem">${d.mime_type?.includes('pdf')?'📕':'🖼️'}</span>
        <span style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${d.nombre_archivo}</span>
        <span style="font-size:.58rem;color:var(--muted);white-space:nowrap">${size} · ${date}</span>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button onclick="expViewDoc(${d.id})" title="Ver" style="background:none;border:none;cursor:pointer;font-size:.7rem;padding:2px">👁️</button>
        <button onclick="expDeleteDoc(${d.id})" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:.7rem;padding:2px">🗑️</button>
      </div>
    </div>`;
  }).join('');

  const pendingHTML = pending.map(p => {
    const size = _expFmtSize(p.file.size);
    return `<div class="exp-doc-file" style="background:#fffbeb">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">
        <span style="font-size:.7rem">📎</span>
        <span style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${p.file.name}</span>
        <span style="font-size:.58rem;color:var(--muted);white-space:nowrap">${size}</span>
      </div>
      <span style="font-size:.55rem;font-weight:700;color:#b45309;background:#fef3c7;padding:1px 6px;border-radius:3px">PENDIENTE</span>
    </div>`;
  }).join('');

  const borderStyle = pending.length > 0 && docs.length === 0 ? ' style="border-color:#f59e0b"' : '';
  const badge = docs.length > 0 ? '<span style="color:var(--green);font-size:.65rem;font-weight:700">✓</span>'
    : pending.length > 0 ? '<span style="color:#b45309;font-size:.55rem;font-weight:700">📎</span>' : '';

  return `<div class="exp-doc-card${hasDoc?' has-file':''}"${borderStyle}>
    <div class="exp-doc-header">
      <span class="exp-doc-icon">${cat.icon}</span>
      <span class="exp-doc-title">${cat.label}</span>
      ${badge}
    </div>
    <div class="exp-doc-files">${filesHTML}${pendingHTML}</div>
    <div class="exp-doc-drop" onclick="this.querySelector('input').click()"
      ondragover="event.preventDefault();this.classList.add('dragover')"
      ondragleave="this.classList.remove('dragover')"
      ondrop="expHandleDrop(event,'${cat.key}')">
      <div style="font-size:.72rem;color:var(--muted)">${hasDoc?'+ Reemplazar':'Arrastra o haz clic'}</div>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onchange="expFileSelected(this,'${cat.key}')">
    </div>
  </div>`;
}

function _expRenderFixedDocs(categoria, docs){
  const card = document.getElementById('exp-doc-' + categoria);
  if(!card) return;
  const filesEl = card.querySelector('.exp-doc-files');
  if(!filesEl) return;
  filesEl.innerHTML = docs.map(d => {
    const size = d.tamano ? _expFmtSize(d.tamano) : '';
    const date = d.created_at ? new Date(d.created_at).toLocaleDateString('es-MX') : '';
    return `<div class="exp-doc-file">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">
        <span style="font-size:.7rem">${d.mime_type?.includes('pdf')?'📕':'🖼️'}</span>
        <span style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${d.nombre_archivo}</span>
        <span style="font-size:.58rem;color:var(--muted);white-space:nowrap">${size} · ${date}</span>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button onclick="expViewDoc(${d.id})" title="Ver" style="background:none;border:none;cursor:pointer;font-size:.7rem;padding:2px">👁️</button>
        <button onclick="expDeleteDoc(${d.id})" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:.7rem;padding:2px">🗑️</button>
      </div>
    </div>`;
  }).join('');

  if(docs.length){
    card.classList.add('has-file');
  } else {
    card.classList.remove('has-file');
  }
}

function _expClearContractCards(){
  ['contratos','anexos'].forEach(cat => {
    const card = document.getElementById('exp-doc-' + cat);
    if(card){
      const filesEl = card.querySelector('.exp-doc-files');
      if(filesEl) filesEl.innerHTML = '';
      card.classList.remove('has-file');
    }
  });
}

// ══════════════════════════════════════
// UPLOAD: Subir documento
// ══════════════════════════════════════
function expHandleDrop(e, categoria){
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if(file) expUploadDoc(categoria, file);
}

function expFileSelected(input, categoria){
  const files = input.files;
  if(!files.length) return;
  // Upload all selected files (for contracts/annexes which allow multiple)
  Array.from(files).forEach(f => expUploadDoc(categoria, f));
  input.value = '';
}

async function expUploadDoc(categoria, file){
  const maxSize = 50 * 1024 * 1024; // 50MB
  if(file.size > maxSize){
    toast('⚠️ Archivo muy grande (máx 50MB)');
    return;
  }

  const allowed = ['application/pdf','image/png','image/jpeg','image/jpg'];
  if(!allowed.includes(file.type)){
    toast('⚠️ Solo PDF, PNG o JPG');
    return;
  }

  // If client not saved yet, queue the file
  if(!_expCurrentId){
    const multiCats = ['contratos','anexos'];
    if(!multiCats.includes(categoria)){
      _expPendingDocs = _expPendingDocs.filter(p => p.categoria !== categoria);
    }
    _expPendingDocs.push({ categoria, file });
    toast('📎 ' + file.name + ' listo (se subirá al guardar)');
    _expRenderPendingInUI();
    return;
  }

  // Client exists — upload directly
  toast('📤 Subiendo ' + file.name + '...');
  await _expUploadFileToStorage(_expCurrentId, categoria, file);
  toast('✅ Documento subido');
  await expRenderDocs(_expCurrentId, _expGetTipo());
}

// Actual upload to Supabase Storage + DB record
async function _expUploadFileToStorage(clienteId, categoria, file){
  const ext = file.name.split('.').pop();
  const ts = Date.now();
  const storagePath = `${clienteId}/${categoria}/${ts}.${ext}`;

  // Upload new file first — only delete old after success
  const { error: uploadErr } = await _sb.storage.from('expedientes').upload(storagePath, file, {
    contentType: file.type,
    upsert: true
  });

  if(uploadErr){
    console.warn('[Exp] Upload error:', uploadErr.message);
    return;
  }

  // For single-doc categories, delete old AFTER successful upload
  const multiCats = ['contratos','anexos'];
  if(!multiCats.includes(categoria)){
    const { data: existing } = await _sb.from('exp_documentos')
      .select('id, storage_path')
      .eq('cliente_id', clienteId)
      .eq('categoria', categoria);
    if(existing && existing.length){
      const paths = existing.map(d => d.storage_path);
      await _sb.storage.from('expedientes').remove(paths);
      for(const doc of existing){
        await _sb.from('exp_documentos').delete().eq('id', doc.id);
      }
    }
  }

  const { error: dbErr } = await _sb.from('exp_documentos').insert({
    cliente_id: clienteId,
    categoria: categoria,
    nombre_archivo: file.name,
    storage_path: storagePath,
    tamano: file.size,
    mime_type: file.type
  });

  if(dbErr){
    toast('❌ Error en BD: ' + dbErr.message);
    return;
  }

  toast('✅ Documento subido');
  await expRenderDocs(_expCurrentId, _expGetTipo());
}

// ══════════════════════════════════════
// VIEW: Ver documento
// ══════════════════════════════════════
async function expViewDoc(docId){
  const { data: doc } = await _sb.from('exp_documentos').select('storage_path').eq('id', docId).single();
  if(!doc) return;

  const { data } = await _sb.storage.from('expedientes').createSignedUrl(doc.storage_path, 300);
  if(data?.signedUrl){
    window.open(data.signedUrl, '_blank');
  } else {
    toast('⚠️ No se pudo generar URL');
  }
}

// ══════════════════════════════════════
// DELETE DOC: Eliminar documento
// ══════════════════════════════════════
async function expDeleteDoc(docId){
  const { data: doc } = await _sb.from('exp_documentos').select('storage_path').eq('id', docId).single();
  if(!doc) return;

  await _sb.storage.from('expedientes').remove([doc.storage_path]);
  await _sb.from('exp_documentos').delete().eq('id', docId);

  toast('🗑️ Documento eliminado');
  await expRenderDocs(_expCurrentId, _expGetTipo());
}

// ══════════════════════════════════════
// OTRO: Agregar categoría personalizada
// ══════════════════════════════════════
function expAddOtroDoc(){
  _expOtroCount++;
  const key = 'otro_' + _expOtroCount;
  const grid = document.getElementById('exp-docs-grid');

  const card = document.createElement('div');
  card.className = 'exp-doc-card';
  card.innerHTML = `<div class="exp-doc-header">
      <span class="exp-doc-icon">📎</span>
      <input type="text" class="exp-doc-title-edit" value="Otro documento" placeholder="Nombre de categoría..." onblur="this.closest('.exp-doc-header').querySelector('.exp-doc-title-edit').dataset.key='${key}'">
    </div>
    <div class="exp-doc-files"></div>
    <div class="exp-doc-drop" onclick="this.querySelector('input').click()"
      ondragover="event.preventDefault();this.classList.add('dragover')"
      ondragleave="this.classList.remove('dragover')"
      ondrop="expHandleDrop(event,'${key}')">
      <div style="font-size:.72rem;color:var(--muted)">Arrastra o haz clic</div>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onchange="expFileSelected(this,'${key}')">
    </div>`;

  grid.appendChild(card);
  card.querySelector('input[type=text]').focus();
  card.querySelector('input[type=text]').select();
}

// ══════════════════════════════════════
// CHIPS: Toggle productos
// ══════════════════════════════════════
document.addEventListener('click', e => {
  const chip = e.target.closest('.exp-chip');
  if(!chip) return;
  const cb = chip.querySelector('input[type=checkbox]');
  if(cb){
    cb.checked = !cb.checked;
    chip.classList.toggle('active', cb.checked);
  }
});

// ══════════════════════════════════════
// UTILS
// ══════════════════════════════════════
function _expFmtSize(bytes){
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

// Render empty doc cards for new client (before save)
function _expRenderDocCardsEmpty(tipo){
  const grid = document.getElementById('exp-docs-grid');
  const emptyMsg = document.getElementById('exp-docs-empty');
  emptyMsg.style.display = 'none';

  let cats = [...EXP_DOCS_FISICA];
  if(tipo === 'moral'){
    cats = [...EXP_DOCS_FISCAL_MORAL(), ...EXP_DOCS_MORAL_EXTRA];
  }

  grid.innerHTML = cats.map(cat => {
    const pending = _expPendingDocs.filter(p => p.categoria === cat.key);
    return _expDocCardHTML(cat, [], pending);
  }).join('');

  // Also update contract/annex cards with pending
  _expRenderPendingFixed('contratos');
  _expRenderPendingFixed('anexos');
}

// Show pending files in the UI (yellow badges instead of green)
function _expRenderPendingInUI(){
  const tipo = _expGetTipo();
  if(_expCurrentId){
    // Client already saved, re-render from DB
    expRenderDocs(_expCurrentId, tipo);
    return;
  }
  // New client — re-render empty cards with pending overlays
  _expRenderDocCardsEmpty(tipo);
}

function _expRenderPendingFixed(categoria){
  const card = document.getElementById('exp-doc-' + categoria);
  if(!card) return;
  const filesEl = card.querySelector('.exp-doc-files');
  if(!filesEl) return;
  const pending = _expPendingDocs.filter(p => p.categoria === categoria);
  filesEl.innerHTML = pending.map(p => {
    const size = _expFmtSize(p.file.size);
    return `<div class="exp-doc-file" style="background:#fffbeb">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">
        <span style="font-size:.7rem">📎</span>
        <span style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${p.file.name}</span>
        <span style="font-size:.58rem;color:var(--muted);white-space:nowrap">${size}</span>
      </div>
      <span style="font-size:.55rem;font-weight:700;color:#b45309;background:#fef3c7;padding:1px 6px;border-radius:3px">PENDIENTE</span>
    </div>`;
  }).join('');
  card.classList.toggle('has-file', pending.length > 0);
  if(pending.length) card.style.borderColor = '#f59e0b';
  else card.style.borderColor = '';
}

  // Expose globals
  window._expClients = _expClients;
  window._expCurrentId = _expCurrentId;
  window._expOtroCount = _expOtroCount;
  window._expPendingDocs = _expPendingDocs;
  window.EXP_DOCS_FISICA = EXP_DOCS_FISICA;
  window.EXP_DOCS_MORAL_EXTRA = EXP_DOCS_MORAL_EXTRA;
  window.rExpedientes = rExpedientes;
  window.expLoadList = expLoadList;
  window.expRenderList = expRenderList;
  window.expFilterList = expFilterList;
  window.expSelectClient = expSelectClient;
  window._expFillForm = _expFillForm;
  window.expNewClient = expNewClient;
  window.expCancelEdit = expCancelEdit;
  window.expToggleTipo = expToggleTipo;
  window._expGetTipo = _expGetTipo;
  window.expSaveClient = expSaveClient;
  window.expDeleteClient = expDeleteClient;
  window.expRenderDocs = expRenderDocs;
  window.EXP_DOCS_FISCAL_MORAL = EXP_DOCS_FISCAL_MORAL;
  window._expDocCardHTML = _expDocCardHTML;
  window._expRenderFixedDocs = _expRenderFixedDocs;
  window._expClearContractCards = _expClearContractCards;
  window.expHandleDrop = expHandleDrop;
  window.expFileSelected = expFileSelected;
  window.expUploadDoc = expUploadDoc;
  window._expUploadFileToStorage = _expUploadFileToStorage;
  window.expViewDoc = expViewDoc;
  window.expDeleteDoc = expDeleteDoc;
  window.expAddOtroDoc = expAddOtroDoc;
  window._expFmtSize = _expFmtSize;
  window._expRenderDocCardsEmpty = _expRenderDocCardsEmpty;
  window._expRenderPendingInUI = _expRenderPendingInUI;
  window._expRenderPendingFixed = _expRenderPendingFixed;

  // Register views
  if(typeof registerView === 'function'){
    registerView('expedientes', function(){ return rExpedientes(null); });
    // Vistas filtradas por empresa
    registerView('expedientes_sal',  function(){ return rExpedientes('Salem'); });
    registerView('expedientes_end',  function(){ return rExpedientes('Endless'); });
    registerView('expedientes_dyn',  function(){ return rExpedientes('Dynamo'); });
    registerView('expedientes_wb',   function(){ return rExpedientes('Wirebit'); });
    registerView('expedientes_stel', function(){ return rExpedientes('Stellaris'); });
  }

})(window);
