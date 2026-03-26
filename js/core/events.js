// ═══════════════════════════════════════════════════════════
// EVENTS.JS — Delegación centralizada de eventos
// Elimina inline handlers del HTML (onclick=, onchange=, oninput=)
// para cumplir CSP 'unsafe-inline' sin usar eval().
//
// Convenciones de data-attributes:
//
// CLICK:
//   data-nav="viewId"               → navTo(viewId)
//   data-company="id"               → selectCompany(id)
//   data-cross="id"                 → selectCross(id)
//   data-modal="name"               → openModal(name)
//   data-modal-stop="name"          → event.stopPropagation(); openModal(name)
//   data-sv="viewId"                → sv(viewId, null)
//   data-click="fn"                 → fn(el)  (sin data-arg)
//   data-click="fn" data-arg="x"   → fn(x)
//   data-click="fn" data-arg="x" data-arg2="y" → fn(x, y)
//   data-click="fn" data-arg="x" data-arg-bool → fn(Boolean(x==='true'))
//   data-click="fn" data-arg="x" data-arg2-el  → fn(x, el)
//   data-click-null="fn"            → fn(null)
//   data-click-if-self="fn"         → if(e.target===el) fn()
//   data-click-child-input          → el.querySelector('input[type=file]').click()
//   data-click-el-id="fn"           → fn(getElementById(data-target-id))
//   data-toggle-theme               → alterna dark/light
//   data-collapse-toggle="bodyId"   → toggle display + ▶/▼ arrow en primer span
//   data-hide-id="elemId"           → getElementById(elemId).style.display='none'
//   data-close-if-self              → if(e.target===el) el.style.display='none'
//
// CHANGE:
//   data-change="fn"                → fn()
//   data-change-val="fn"            → fn(el.value)
//   data-change-el="fn"             → fn(el)
//   data-change-chk="fn"            → fn(el.checked)
//   data-change-cat="id" data-cat-type="t" data-cat-co="co"
//                                   → catToggleEmp(id, t, co, el.checked)
//   data-change-chain="key"         → ejecuta cadena predefinida en _CHAINS
//   data-files="fn"                 → fn(el.files[0])
//   data-files-self="fn" data-files-arg="x" → fn(el, x)
//
// INPUT:
//   data-input="fn"                 → fn(el.value)
//   data-input="fn" data-input-arg="x"  → fn(x, el.value)
//
// DRAG & DROP:
//   data-dragover-border="color"    → event.preventDefault(); el.style.borderColor=color
//   data-dragover-bg="color"        → el.style.background=color
//   data-dragover-class="cls"       → event.preventDefault(); el.classList.add(cls)
//   data-dragleave-border="color"   → el.style.borderColor=color
//   data-dragleave-bg="color"       → el.style.background=color
//   data-dragleave-class="cls"      → el.classList.remove(cls)
//   data-drop="fn"                  → event.preventDefault(); fn(event)
//   data-drop="fn" data-drop-arg="x" → event.preventDefault(); fn(event, x)
// ═══════════════════════════════════════════════════════════
(function() {
  'use strict';

  // Cadenas onchange predefinidas (para "A();B()" patterns)
  var _CHAINS = {
    'tpv-resumen':   function() { if(TPV) TPV.invalidateAll(); rTPVResumen && rTPVResumen(); },
    'tpv-pagos':     function() { if(TPV) TPV.invalidateAll(); rTPVPagos && rTPVPagos(); },
    'tpv-dashboard': function() { if(TPV) TPV.invalidateAll(); if(typeof initTPVDashboard==='function') initTPVDashboard(); },
  };

  // ── Resolución segura de función global ──────────────────
  function _fn(name) {
    var f = window[name];
    return (typeof f === 'function') ? f : null;
  }

  // ── CLICK ─────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    var el = e.target.closest(
      '[data-nav],[data-company],[data-cross],[data-modal],[data-modal-stop],' +
      '[data-sv],[data-click],[data-click-null],[data-click-if-self],[data-toggle-theme],' +
      '[data-collapse-toggle],[data-hide-id],[data-close-if-self],[data-click-child-input],' +
      '[data-click-el-id]'
    );
    if (!el) return;

    // Navegar a vista
    if (el.dataset.nav) {
      if (typeof navTo === 'function') navTo(el.dataset.nav);
      return;
    }
    // Seleccionar empresa
    if (el.dataset.company) {
      if (typeof selectCompany === 'function') selectCompany(el.dataset.company);
      return;
    }
    // Seleccionar sección cross-cutting
    if (el.dataset.cross) {
      if (typeof selectCross === 'function') selectCross(el.dataset.cross);
      return;
    }
    // Abrir modal (con stop propagation opcional)
    if (el.dataset.modalStop) {
      e.stopPropagation();
      if (typeof openModal === 'function') openModal(el.dataset.modalStop);
      return;
    }
    if (el.dataset.modal) {
      if (typeof openModal === 'function') openModal(el.dataset.modal);
      return;
    }
    // sv(view, null)
    if (el.dataset.sv) {
      if (typeof sv === 'function') sv(el.dataset.sv, null);
      return;
    }
    // Alternar tema dark/light
    if (el.hasAttribute('data-toggle-theme')) {
      if (typeof setTheme === 'function') setTheme(typeof _theme !== 'undefined' && _theme === 'dark' ? 'light' : 'dark');
      return;
    }
    // Condicional: solo dispara si el click fue directo sobre el elemento
    if (el.dataset.clickIfSelf) {
      if (e.target === el) { var f = _fn(el.dataset.clickIfSelf); if (f) f(); }
      return;
    }
    // Cerrar overlay si click fue directo sobre el elemento
    if (el.hasAttribute('data-close-if-self')) {
      if (e.target === el) el.style.display = 'none';
      return;
    }
    // Ocultar elemento por id
    if (el.dataset.hideId) {
      var t = document.getElementById(el.dataset.hideId);
      if (t) t.style.display = 'none';
      return;
    }
    // Toggle sección colapsable + flecha ▶/▼
    if (el.dataset.collapseToggle) {
      var body = document.getElementById(el.dataset.collapseToggle);
      if (body) {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
        var arrow = el.querySelector('span');
        if (arrow) arrow.textContent = body.style.display === 'none' ? '▶' : '▼';
      }
      return;
    }
    // Disparar input[type=file] hijo
    if (el.hasAttribute('data-click-child-input')) {
      var inp = el.querySelector('input[type=file]');
      if (inp) inp.click();
      return;
    }
    // fn(getElementById(data-target-id))
    if (el.dataset.clickElId) {
      var f = _fn(el.dataset.clickElId);
      if (!f) return;
      var target = document.getElementById(el.dataset.targetId || '');
      if (target) f(target);
      return;
    }
    // fn(null)
    if (el.dataset.clickNull) {
      var f = _fn(el.dataset.clickNull); if (f) f(null); return;
    }
    // Función genérica con args opcionales
    if (el.dataset.click) {
      var fn = _fn(el.dataset.click);
      if (!fn) return;
      var a1 = el.dataset.arg  !== undefined ? el.dataset.arg  : null;
      var a2 = el.dataset.arg2 !== undefined ? el.dataset.arg2 : null;
      // data-arg-bool: convierte a1 a booleano real
      if (el.hasAttribute('data-arg-bool') && a1 !== null) a1 = (a1 === 'true');
      // data-arg2-el: usa el elemento como segundo argumento
      if (el.hasAttribute('data-arg2-el') && a1 !== null) { fn(a1, el); return; }
      if (a1 !== null && a2 !== null) fn(a1, a2);
      else if (a1 !== null)           fn(a1);
      else                            fn(el);
      return;
    }
  });

  // ── CHANGE ────────────────────────────────────────────────
  document.addEventListener('change', function(e) {
    var el = e.target;

    // Cadena predefinida
    if (el.dataset.changeChain) {
      var chain = _CHAINS[el.dataset.changeChain];
      if (chain) chain();
      return;
    }
    // catToggleEmp(id, type, company, checked)
    if (el.dataset.changeCat !== undefined) {
      if (typeof catToggleEmp === 'function') {
        catToggleEmp(Number(el.dataset.changeCat), el.dataset.catType, el.dataset.catCo, el.checked);
      }
      return;
    }
    // fn(el.checked)
    if (el.dataset.changeChk) {
      var f = _fn(el.dataset.changeChk); if (f) f(el.checked); return;
    }
    // fn(el)
    if (el.dataset.changeEl) {
      var f = _fn(el.dataset.changeEl); if (f) f(el); return;
    }
    // fn(el.value)
    if (el.dataset.changeVal) {
      var f = _fn(el.dataset.changeVal); if (f) f(el.value); return;
    }
    // fn()
    if (el.dataset.change) {
      var f = _fn(el.dataset.change); if (f) f(); return;
    }
    // fn(el.files[0])
    if (el.dataset.files) {
      var f = _fn(el.dataset.files); if (f && el.files) f(el.files[0]); return;
    }
    // fn(el, arg)
    if (el.dataset.filesSelf) {
      var f = _fn(el.dataset.filesSelf); if (f) f(el, el.dataset.filesArg); return;
    }
  });

  // ── INPUT ─────────────────────────────────────────────────
  document.addEventListener('input', function(e) {
    var el = e.target;
    if (!el.dataset.input) return;
    var fn = _fn(el.dataset.input);
    if (!fn) return;
    var arg = el.dataset.inputArg;
    arg !== undefined ? fn(arg, el.value) : fn(el.value);
  });

  // ── DRAG OVER ─────────────────────────────────────────────
  document.addEventListener('dragover', function(e) {
    var el = e.target.closest(
      '[data-dragover-border],[data-dragover-bg],[data-dragover-class],[data-drop]'
    );
    if (!el) return;
    e.preventDefault();
    if (el.dataset.dragoverBorder) el.style.borderColor = el.dataset.dragoverBorder;
    if (el.dataset.dragoverBg)     el.style.background  = el.dataset.dragoverBg;
    if (el.dataset.dragoverClass)  el.classList.add(el.dataset.dragoverClass);
  });

  // ── DRAG LEAVE ────────────────────────────────────────────
  document.addEventListener('dragleave', function(e) {
    var el = e.target.closest(
      '[data-dragleave-border],[data-dragleave-bg],[data-dragleave-class]'
    );
    if (!el) return;
    if (el.dataset.dragleaveBorder) el.style.borderColor = el.dataset.dragleaveBorder;
    if (el.dataset.dragleaveBg)     el.style.background  = el.dataset.dragleaveBg;
    if (el.dataset.dragleaveClass)  el.classList.remove(el.dataset.dragleaveClass);
  });

  // ── DROP ──────────────────────────────────────────────────
  document.addEventListener('drop', function(e) {
    var el = e.target.closest('[data-drop]');
    if (!el) return;
    e.preventDefault();
    // Reset drag styles after drop
    if (el.dataset.dragleaveBorder) el.style.borderColor = el.dataset.dragleaveBorder;
    if (el.dataset.dragleaveBg)     el.style.background  = el.dataset.dragleaveBg;
    if (el.dataset.dragleaveClass)  el.classList.remove(el.dataset.dragleaveClass);
    var fn = _fn(el.dataset.drop);
    if (!fn) return;
    var arg = el.dataset.dropArg;
    arg !== undefined ? fn(e, arg) : fn(e);
  });

})();
