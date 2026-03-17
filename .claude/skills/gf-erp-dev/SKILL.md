---
name: gf-erp-dev
description: >
  Skill de desarrollo para el ERP/Dashboard de Grupo Financiero VMCR.
  Usa cuando: desarrolles vistas, componentes, charts, tablas, KPIs, módulos financieros,
  formularios de carga de datos, integración con Supabase, o cualquier feature del dashboard.
  Stack: Vanilla HTML/CSS/JS, Chart.js, Node.js backend, Supabase (PostgreSQL + RLS).
  Entidades: Salem, Endless, Dynamo, Wirebit, Stellaris bajo Centum Capital.
  Dominio: finanzas corporativas, créditos, TPV, tarjetas, facturación CFDI, tesorería.
---

# GF ERP Dev — Skill de Desarrollo del Dashboard Financiero

## Cuándo Usar Este Skill

Usar **siempre** que se trabaje en el dashboard de Grupo Financiero:
- Crear o modificar vistas (P&L, dashboards, formularios, tablas)
- Diseñar componentes UI (cards, KPIs, charts, tablas, modals)
- Trabajar con datos financieros (ingresos, gastos, créditos, comisiones)
- Integrar con Supabase (queries, RPC, app_data)
- Modificar navegación, permisos, seguridad
- Crear charts con Chart.js
- Cargar/persistir datos (flujos, nómina, gastos, créditos, TPV, tarjetas)
- Diseñar lógica de negocio financiero (P&L, EBITDA, amortización, cobranza)

---

## 1. Contexto de Negocio

### Grupo Financiero VMCR
Grupo holding financiero mexicano compuesto por varias empresas. El dashboard es un ERP interno que consolida la operación financiera de todas las entidades.

### Entidades del Grupo

| ID | Entidad | Negocio Principal | Color |
|----|---------|-------------------|-------|
| `sal` | Salem Internacional | Holding financiero, procesamiento TPV, tarjetas CENTUM | `#0073ea` (azul) |
| `end` | Endless Capital | Créditos simples, préstamos a empresas | `#00b875` (verde) |
| `dyn` | Dynamo Financiera | Créditos simples, préstamos a empresas | `#ff7043` (naranja) |
| `wb` | Wirebit | Cripto exchange, tarjetas Wirebit | `#9b51e0` (morado) |
| `stel` | Stellaris | Nueva entidad financiera | `#e53935` (rojo) |
| `centum` | Centum Capital | Consolidado Salem + Endless + Dynamo (sin WB/Stel) | — |
| `grupo` | Grupo Financiero | Consolidado TOTAL (todas las entidades) | — |

### Conceptos Financieros Clave

**P&L (Estado de Resultados)**
```
INGRESOS TOTALES
  - Comisiones TPV, Intereses Créditos, Fondeo Tarjetas, etc.
- COSTES DIRECTOS (variables, ligados al producto)
  - Nómina Operativa, Comisiones Bancarias, Software Operativo
= MARGEN OPERATIVO (Utilidad Bruta)
- GASTOS ADMINISTRATIVOS (fijos, overhead)
  - Nómina Admin, Renta, Servicios, Marketing, Regulatorio
= EBITDA
- Depreciación y Amortización
= UTILIDAD NETA
```

**Categorías de Gastos** (`_isCostRow()` en pl-engine.js):
- **Costes Directos**: `Operaciones`, `Com. Bancarias`, `TPV Comisiones`, `Costo Directo`, `Costos Directos`, `Nómina Operativa`
- **Gastos Administrativos**: `Administrativo`, `Renta`, `Marketing`, `Representación`, `Regulatorio`, `Varios`, `Nómina Administrativa`

**Créditos (Endless/Dynamo)**
- Crédito simple con tabla de amortización francesa
- Campos: monto, tasa anual, plazo meses, comisión apertura, fecha desembolso
- Los intereses se inyectan automáticamente como ingresos en el P&L (`fiInjectCredits()`)
- Cobranza: tracking de pagos vs plan de amortización

**TPV (Salem)**
- Procesamiento de pagos con terminal punto de venta
- Comisiones escalonadas por volumen (rate cards)
- Flujo: transacciones → comisión Salem → pago a promotores/agentes
- Datos viven en Supabase directo (no en app_data)

**Tarjetas CENTUM (Salem)**
- Tarjetas prepagadas empresariales
- Fondeo por transferencia o efectivo
- Conceptos de cobro: dispersión, emisión, mantenimiento
- Datos viven en Supabase directo

**Wirebit**
- Exchange de criptomonedas
- Fees por transacción (buy/sell spread)
- Tarjetas Wirebit
- Datos de fees por año: `gf_wb_fees_YYYY`

**Facturación CFDI**
- Facturas emitidas y recibidas por empresa
- CxP (Cuentas por Pagar) = facturas recibidas pendientes de pago
- Pagos Pendientes = facturas emitidas sin cobrar
- Complementos de pago

**Nómina Compartida**
- Nómina total distribuida por % entre empresas
- Cada empleado tiene: nombre, rol, sueldo, tipo (Operativo/Administrativo), y % de distribución por empresa
- La distribución afecta directamente el P&L de cada empresa

**Gastos Compartidos**
- Gastos operativos del grupo distribuidos por % entre empresas
- Concepto + categoría + presupuesto + distribución % por empresa
- Igual que nómina, afecta directamente el P&L

---

## 2. Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend**: Vanilla HTML/CSS/JS (NO React/Vue/Angular)
- **Charts**: Chart.js 4.x (CDN)
- **Backend**: Node.js vanilla `http` module (NO Express)
- **Database**: Supabase (PostgreSQL + RLS + RPC functions)
- **Sync**: localStorage como caché → Supabase como fuente de verdad
- **Auth**: PBKDF2 hash + sessionStorage + Supabase validation

### Estructura de Archivos (Feature-Based Architecture)
```
/
├── index.html              # SPA - una sola página HTML con todas las vistas
├── server.js               # Backend Node.js (API chat + static files + Supabase proxy)
├── security.js             # Headers, CORS, rate limiter, auth middleware
├── assets/css/styles.css   # Estilos globales (variables CSS, layout, componentes)
├── js/
│   ├── core/                       # Infraestructura base
│   │   ├── storage.js              # DB wrapper (localStorage get/set + Supabase push)
│   │   ├── supabase.js             # SB sync engine (pullAll, pushKey, APP_KEYS)
│   │   ├── login.js                # Autenticación, sesión, permisos
│   │   ├── helpers.js              # fmt(), sum(), MO[], cOpts(), escapeHtml()
│   │   ├── nav-structure.js        # NAV_STRUCTURE — Fuente de verdad del menú
│   │   ├── router.js               # Routing: navTo(), sv(), render(), VIEW_REGISTRY
│   │   └── auth.js                 # Gestión de usuarios y permisos
│   │
│   ├── shared/                     # Datos y utilidades compartidas entre features
│   │   ├── data-constants.js       # NOM, GCOMP, WB_ING/COSTOS, END/DYN_CREDITS, CATS
│   │   ├── ui-components.js        # openModal(), closeModal(), exportHTML(), toast()
│   │   ├── chart-helpers.js        # rPLCharts(), rEvoChart(), rConsCharts()
│   │   ├── pl-engine.js            # rPL(), rConsolidado(), rIngView(), rGasView(), rNomView(), ENT_MAP, registerPL()
│   │   └── flujo-engine.js         # FI_ROWS, FG_ROWS, fiLoad(), fgLoad(), fiInjectTPV(), fiInjectCredits(), syncFlujoToRecs()
│   │
│   ├── features/                   # Un directorio por dominio de negocio
│   │   ├── dashboard/              # inicio.js, resumen.js
│   │   ├── finanzas/               # nomina.js, gastos-comp.js, flujo-ingresos.js, flujo-gastos.js, carga-masiva.js
│   │   ├── creditos/               # credit-engine.js, credit-dashboard.js, credit-detail.js, credit-cobranza.js, credit-carga.js
│   │   ├── tpv/                    # tpv-data.js, tpv-general.js, tpv-dashboard.js, tpv-pagos.js, etc.
│   │   ├── tarjetas/               # tarjetas-data.js, tarjetas-charts.js, tarjetas-upload.js
│   │   ├── wirebit/                # wirebit-data.js, wirebit-views.js, wirebit-upload.js
│   │   ├── tesoreria/              # tesoreria.js
│   │   ├── facturacion/            # facturacion-egresos.js, facturacion-empresa.js, tpv-facturacion.js
│   │   ├── tickets/                # tickets.js
│   │   ├── expedientes/            # expedientes.js
│   │   ├── config/                 # config.js
│   │   └── ai-chat/               # ai-chat.js
│   │
│   └── main.js                     # Bootstrap: initApp() trigger
```

### Patrón IIFE
Cada archivo en `shared/` y `features/` usa IIFE para exponer globals:
```javascript
(function(window) {
  'use strict';
  function myFunction() { /* ... */ }
  window.myFunction = myFunction;

  // Register views at the bottom
  if(typeof registerView === 'function'){
    registerView('my_view_id', function(){ myFunction(); });
  }
})(window);
```

---

## 3. Sistema de Datos (Data Layer)

### Patrón Write-Through (DB + SB)
```
┌──────────────┐  DB.set(key, val)  ┌───────────────┐  SB.pushKey(key)  ┌──────────┐
│  Código JS   │ ─────────────────→ │  localStorage  │ ────────────────→ │ Supabase │
│  (frontend)  │                    │  (caché sync)  │     (async)       │ app_data │
└──────────────┘  DB.get(key)       └───────────────┘  SB.pullAll()      └──────────┘
                  ←─────────────────                   ←────────────────
```

**`DB.set(key, val)`**: Escribe a localStorage + hace `SB.pushKey(key)` async a Supabase
**`DB.get(key)`**: Lee de localStorage (síncrono, rápido)
**`SB.pullAll()`**: Al login, baja TODOS los datos de Supabase → localStorage
**`SB.pushKey(key)`**: Sube un key específico a Supabase `app_data` table
**Viewers**: `DB.set()` bloquea escrituras para usuarios con rol `viewer`

### APP_KEYS — Registro de Keys Sincronizables
Toda key nueva que use `DB.set()` **DEBE** registrarse en `APP_KEYS` (supabase.js):
```javascript
const APP_KEYS = [
  'gf4','gf_fi','gf_fg','gf_cred_end','gf_cred_dyn',
  'gf_cc_hist','gf_usuarios','gf_theme','gf_tesoreria',
  'gf_bancos','gf_tpv_pagos','gf_cat_cd','gf_cat_ga',
  'gf_tickets_pagos_tpv','gf_tpv_agente_pagos',
  'gf_tpv_promotor_pagos','gf_tpv_rate_changes',
  'gf_wb_fees_2026','gf_wb_upload_summary','gf_wb_tarjetas_2026',
  'gf_nomina','gf_gc'
];
```

### Mapa Completo de Almacenamiento

| Módulo | Storage Key(s) | Mecanismo |
|--------|---------------|-----------|
| Flujo Ingresos | `gf_fi` | `DB.set` → app_data |
| Flujo Gastos | `gf_fg` | `DB.set` → app_data |
| Carga Masiva | `gf_fi` + `gf_fg` + `gf_cm_last_upload` | `DB.set` → app_data |
| Nómina | `gf_nomina` | `DB.set` → app_data |
| Gastos Compartidos | `gf_gc` | `DB.set` → app_data |
| Créditos Endless | `gf_cred_end` + `gf_cc_hist` | `DB.set` → app_data |
| Créditos Dynamo | `gf_cred_dyn` + `gf_cc_hist` | `DB.set` → app_data |
| TPV | `tpv_transactions`, `tpv_clients`, etc. | Supabase directo (tablas propias) |
| Tarjetas CENTUM | `tar_transactions`, `tar_cardholders` | Supabase directo (RPC) |
| Wirebit Fees | `gf_wb_fees_YYYY` | `DB.set` → app_data |
| Wirebit Tarjetas | `gf_wb_tarjetas_YYYY` | `DB.set` → app_data |
| Facturación CxP | `gf_cxp` | `DB.set` → app_data |
| Expedientes | `exp_clientes`, `exp_documentos` | Supabase directo |
| Tesorería | `gf_tesoreria` | `DB.set` → app_data |
| TPV Pagos | `gf_tpv_pagos` | `DB.set` → app_data |
| Config Usuarios | `gf_usuarios` | `DB.set` → app_data |
| Config Tema | `gf_theme` | `DB.set` → app_data |
| Config Categorías | `gf_cat_cd`, `gf_cat_ga` | `DB.set` → app_data |

### Pipeline de Datos → P&L
```
FI_ROWS (gf_fi)  ──┐
FG_ROWS (gf_fg)  ──┤
fiInjectCredits() ──┤── syncFlujoToRecs() ──→ S.recs ──→ rPL(ent) ──→ P&L render
fiInjectTPV()    ──┤
NOM_EDIT         ──┤
GC_EDIT          ──┘
```

**Función crítica**: `syncFlujoToRecs()` convierte FI_ROWS + FG_ROWS en el formato `S.recs` que consume el motor de P&L. **Debe llamarse** después de cualquier cambio en datos de flujo.

---

## 4. Sistema de Navegación

### Navegación Dual
```
┌───────────────────────────────────────────────────────┐
│  Topbar (oscuro): breadcrumb + tema + usuario + logout │
├────┬──────────────────────────────────────────────────┤
│    │  HNav Sections: [Finanzas] [Operación] [Carga]   │
│ SB │  HNav Views: P&L | Ingresos | Gastos | Nómina    │
│72px├──────────────────────────────────────────────────┤
│    │                                                   │
│    │          Vista Activa (contenido)                 │
│    │                                                   │
└────┴──────────────────────────────────────────────────┘
```

- **Sidebar vertical** (72px): Iconos de empresas (Grupo, Salem, Endless, Dynamo, Wirebit, Stellaris, Config)
- **HNav horizontal**: Secciones (tabs) + vistas (chips con dropdown para subgrupos)
- **NAV_STRUCTURE** en `nav-structure.js`: Fuente ÚNICA de verdad para todo el menú

### VIEW_ALIAS — Vistas Filtradas por Empresa
Vistas que comparten un mismo `<div>` HTML pero se filtran por empresa:
```javascript
const VIEW_ALIAS = {
  flujo_ing_sal:'flujo_ing', flujo_ing_end:'flujo_ing', // etc.
  flujo_gas_sal:'flujo_gas', flujo_gas_end:'flujo_gas', // etc.
  carga_masiva_sal:'carga_masiva', carga_masiva_end:'carga_masiva', // etc.
  carga_creditos_end:'carga_creditos', carga_creditos_dyn:'carga_creditos',
  expedientes_sal:'expedientes', expedientes_end:'expedientes', // etc.
};
```
El sufijo de empresa (`_sal`, `_end`, `_dyn`, `_wb`, `_stel`) indica qué datos mostrar. El div HTML es compartido (ej. `view-flujo_ing`). El `registerView()` para cada variante filtra los datos.

### VIEW_REGISTRY — Registro de Vistas
Los módulos registran sus vistas con `registerView()`:
```javascript
registerView('nomina', function(){ rNomina(); });
registerView('gastos_comp', function(){ rGastosComp(); });
```

Para P&L de entidades, usar `registerPL()` (registra `_res`, `_ing`, `_gas`, `_nom`):
```javascript
registerPL('sal');  // Registra sal_res, sal_ing, sal_gas, sal_nom
registerPL('end');  // Registra end_res, end_ing, end_gas, end_nom
```

---

## 5. Patrones de Código

### Crear una Vista Nueva — Checklist Completo

1. **HTML** en `index.html` — añadir `<div class="view" id="view-XXXX">...</div>`
2. **VT** en `router.js` — añadir título: `VT['my_view'] = 'Mi Vista'`
3. **NAV_STRUCTURE** en `nav-structure.js` — registrar en la sección/grupo correcto
4. **JS function** en el módulo correspondiente — `function rMyView() { ... }`
5. **registerView()** al final del IIFE — `registerView('my_view', function(){ rMyView(); });`
6. **Si usa datos editables**: cargar de DB al inicio (`DB.get()`), guardar con `DB.set()` + `syncFlujoToRecs()` + `refreshActivePL()`
7. **Si la key es nueva**: registrar en `APP_KEYS` (supabase.js)

### Vista Filtrada por Empresa (VIEW_ALIAS)

Para crear una variante por empresa de una vista existente:
1. Añadir alias en `VIEW_ALIAS`: `my_view_sal:'my_view'`
2. Añadir título en `VT`: `my_view_sal:'Mi Vista — Salem'`
3. Añadir en `NAV_STRUCTURE` bajo la empresa correcta
4. `registerView('my_view_sal', function(){ rMyView('Salem'); });`
5. En la función de render, filtrar datos: `rows.filter(r => r.ent === empFilter)`
6. **IMPORTANTE**: Las funciones de save SIEMPRE guardan TODOS los datos (no solo los filtrados)

### Persistencia de Datos Editables
```javascript
// ── INICIALIZACIÓN: Cargar de DB o usar defaults ──
var _saved = (typeof DB !== 'undefined' && DB.get) ? DB.get('gf_my_key') : null;
let MY_EDIT = (_saved && _saved.length)
  ? _saved
  : DEFAULT_DATA.map(d => ({/* transform */}));

// ── GUARDAR: Persistir + propagar a P&L ──
function mySave(){
  myUpdateUI();              // Actualizar UI
  DB.set('gf_my_key', MY_EDIT);  // Persistir (localStorage + Supabase)
  if(typeof syncFlujoToRecs === 'function') syncFlujoToRecs();
  if(typeof refreshActivePL === 'function') refreshActivePL();
  toast('Datos guardados');
}
```

### Patrones de Formateo
```javascript
// Moneda MXN
fmt(1234567.89)          // → "$1,234,567.89"
fmtK(1234567)            // → "$1.23M"  (compacto con K/M)
fmtPct(0.2345)           // → "23.5%"

// Meses
MN[0..11]                // → ['Ene','Feb',...,'Dic']
MNF[0..11]               // → ['Enero','Febrero',...,'Diciembre']

// Colores de empresa (usados en ENT_MAP)
ENT_MAP.sal.color = '#0073ea'  // Azul Salem
ENT_MAP.end.color = '#00b875'  // Verde Endless
ENT_MAP.dyn.color = '#ff7043'  // Naranja Dynamo
ENT_MAP.wb.color  = '#9b51e0'  // Morado Wirebit
ENT_MAP.stel.color = '#e53935' // Rojo Stellaris
```

### Patrón de Card/KPI
```html
<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:20px;">
  <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">TÍTULO KPI</div>
  <div style="font-size:1.8rem;font-weight:800;color:var(--text);margin:4px 0" id="mi-kpi">$1.23M</div>
  <div style="font-size:.7rem;color:var(--muted)">Descripción</div>
  <div style="height:4px;background:var(--blue-bg);border-radius:2px;margin-top:12px">
    <div style="height:100%;width:75%;background:var(--blue);border-radius:2px"></div>
  </div>
</div>
```

### Patrón de Tabla Editable
```javascript
function renderRow(item, i) {
  const inS = 'style="width:100%;border:none;background:transparent;font-size:.78rem;font-family:inherit;padding:0"';
  return `<tr id="row-${i}">
    <td><input ${inS} value="${item.name}" onchange="MY_EDIT[${i}].name=this.value;updateUI()"></td>
    <td><input type="number" ${inS} value="${item.amount}" onchange="MY_EDIT[${i}].amount=+this.value;updateUI()" style="text-align:right"></td>
    <td style="text-align:center"><button onclick="deleteRow(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer">✕</button></td>
  </tr>`;
}
```

### Patrón de Chart (Chart.js)
```javascript
const ctx = document.getElementById('my-chart').getContext('2d');
if(window._myChart) window._myChart.destroy(); // Siempre destruir el anterior
window._myChart = new Chart(ctx, {
  type: 'bar', // line, doughnut, pie
  data: {
    labels: MN,  // Meses
    datasets: [{
      label: 'Ingresos',
      data: monthlyData,
      backgroundColor: ENT_MAP[ent].color,
      borderRadius: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: v => fmtK(v) } }
    }
  }
});
```

### Variables CSS Principales
```css
--blue: #0073EA;        --blue-bg: rgba(0,115,234,.08);
--green: #00b894;       --red: #e74c3c;
--text: #1a1d2e;        --text2: #4a5568;
--muted: #8b95a5;       --white: #fff;
--bg: #f4f5f7;          --border: #e2e5ea;    --border2: #d1d5db;
--r: 10px;              --sh: 0 1px 4px rgba(0,0,0,.06);
/* Sidebar / dark nav */
--sb: #1c1e2e;          --sb-h: #272942;
--sb-t: #c5c7e0;        --sb-m: #6165a0;
```

---

## 6. Funciones Globales Clave

### Helpers (helpers.js)
- `fmt(n)` — Formato moneda MXN: `$1,234,567.89`
- `fmtK(n)` — Formato compacto: `$1.23M`
- `fmtPct(n)` — Porcentaje: `23.5%`
- `sum(arr)` — Suma de array numérico
- `escapeHtml(str)` — Escape para prevenir XSS
- `toast(msg)` — Notificación flotante
- `MN`, `MNF` — Arrays de nombres de meses cortos/largos
- `_year` — Año fiscal activo (global)

### Flujo Engine (flujo-engine.js)
- `fiLoad()` / `fgLoad()` — Cargar FI_ROWS / FG_ROWS de DB
- `fiSave()` / `fgSave()` — Guardar a DB + propagar
- `fiInjectCredits()` — Inyecta intereses de créditos como ingresos automáticos
- `fiInjectTPV()` — Inyecta comisiones TPV como ingresos automáticos
- `syncFlujoToRecs()` — **CRÍTICA**: Convierte flujos a `S.recs` para P&L
- `refreshActivePL()` — Refresca la vista P&L activa tras cambio de datos

### P&L Engine (pl-engine.js)
- `rPL(ent)` — Renderiza el P&L completo de una entidad
- `rConsolidado()` — P&L consolidado de Centum Capital
- `rEntGrupo(ent)` — P&L consolidado por entidad (para vistas wb_grupo, stel_grupo)
- `rIngView(ent)` / `rGasView(ent)` — Vistas detalladas de ingresos/gastos
- `rNomView(ent)` — Vista de nómina por empresa
- `registerPL(entKey)` — Registra las 4 vistas P&L de una entidad
- `ENT_MAP` — Mapa de entidades con nombre, color, nomKey

### Nómina (nomina.js)
- `NOM_EDIT` — Array editable de empleados
- `nomMesTotal(empresa)` — Total nómina mensual para una empresa
- `nomMesOp(empresa)` / `nomMesAdm(empresa)` — Nómina operativa/administrativa
- `nomSave()` — Guarda con `DB.set('gf_nomina', NOM_EDIT)`

### Gastos Compartidos (gastos-comp.js)
- `GC_EDIT` — Array editable de conceptos de gasto
- `gcSave()` — Guarda con `DB.set('gf_gc', GC_EDIT)`

### Navegación (nav-structure.js + router.js)
- `navTo(id)` — Navega a una vista (busca en NAV_STRUCTURE)
- `sv(id, navEl)` — Muestra vista, actualiza breadcrumb, llama render()
- `render(id)` — Despacha al handler registrado en VIEW_REGISTRY
- `registerView(id, handler)` — Registra un handler de vista
- `registerPL(entKey)` — Registra las 4 vistas P&L
- `selectCompany(id)` / `selectSection(id)` — Navegación programática

---

## 7. Supabase — Tablas y RPC

### Tabla `app_data` (datos genéricos via DB.set/get)
```sql
-- Estructura simplificada
CREATE TABLE app_data (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ,
  client_id TEXT
);
```

### Tablas TPV (Supabase directo)
- `tpv_transactions` — Transacciones procesadas
- `tpv_clients` — Catálogo de clientes
- `tpv_terminals` — Terminales activas
- `tpv_agents` — Agentes/promotores
- `tpv_commission_rates` — Tasas de comisión

### Tablas Tarjetas (Supabase directo)
- `tar_transactions` — Transacciones de tarjetas CENTUM
- `tar_cardholders` — Tarjetahabientes

### Tablas Expedientes (Supabase directo)
- `exp_clientes` — Expedientes de clientes
- `exp_documentos` — Documentos adjuntos

---

## 8. Seguridad

### Backend Headers (helmet-equivalent)
- `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`
- `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- `Permissions-Policy`, `X-DNS-Prefetch-Control`

### Rate Limiter
- Sliding window 60s por IP+ruta
- `/api/config`: 10 req/min
- `/api/chat`: 15 req/min (requiere auth)

### CORS
- Whitelist explícita: `localhost:PORT` + `CORS_ORIGIN` env var
- Preflight cache 24h

### Auth
- `/api/chat` requiere Bearer token (sesión base64)
- Roles: `admin`, `editor`, `viewer`
- Viewers no pueden escribir datos (`DB.set()` bloqueado)
- Permisos granulares por vista en `gf_usuarios`

---

## 9. Quality Checklist — Antes de Entregar

### Persistencia de Datos
- [ ] Toda función `save()` llama a `DB.set(key, data)`
- [ ] La key está registrada en `APP_KEYS` (supabase.js)
- [ ] Los datos se cargan de DB al inicializar: `DB.get(key)` con fallback a defaults
- [ ] Después de guardar: llamar `syncFlujoToRecs()` + `refreshActivePL()` si afecta P&L
- [ ] Los filtros por empresa son SOLO visuales — save guarda TODOS los datos
- [ ] Mostrar feedback visual al usuario: `toast()` + cambio de botón

### Vistas y Navegación
- [ ] Vista registrada con `registerView(id, handler)` al final del IIFE
- [ ] Título en `VT` (router.js)
- [ ] Entrada en `NAV_STRUCTURE` (nav-structure.js) en la sección correcta
- [ ] `<div class="view" id="view-XXX">` en index.html
- [ ] Si es vista filtrada: entrada en `VIEW_ALIAS` + registerView por cada variante

### Datos con Campo `ent`
- [ ] Toda fila de flujo tiene campo `ent` (nombre de empresa: 'Salem', 'Endless', etc.)
- [ ] Categorías usan los valores exactos de `COST_CATS` o categorías de gastos estándar
- [ ] Años como string: `yr: String(_year)`

### Charts
- [ ] Destruir chart anterior antes de crear uno nuevo: `if(window._myChart) window._myChart.destroy()`
- [ ] Usar `maintainAspectRatio: false` + container con height fijo
- [ ] Usar `fmtK()` en ticks del eje Y
- [ ] Colores de `ENT_MAP[ent].color`

### Seguridad y UX
- [ ] Usar `escapeHtml()` en datos de usuario mostrados en innerHTML
- [ ] Dark mode: usar variables CSS (`var(--text)`, `var(--bg)`, etc.), NO valores hardcodeados
- [ ] Responsive: verificar en 768px breakpoint
- [ ] Zero errores en consola del navegador

---

## 10. Anti-Patrones (EVITAR)

1. **NO usar frameworks** — El proyecto es vanilla JS. No añadir React, Vue, etc.
2. **NO usar npm para frontend** — Solo CDN (Chart.js, Supabase, fonts)
3. **NO console.log en producción** — Solo `console.warn`/`console.error` con prefijo `[Módulo]`
4. **NO emojis como iconos estructurales** — Solo decorativamente en headers
5. **NO SQL directo** — Toda comunicación con DB es via Supabase REST/RPC
6. **NO exponer secretos** — `.env`, `server.js`, `security.js` bloqueados
7. **NO cambiar NAV_STRUCTURE sin actualizar VT y registerView** — Mantener sincronizados
8. **NO usar innerHTML sin escapeHtml()** — Prevenir XSS en datos de usuario
9. **NO olvidar DB.set() en funciones save** — Los datos DEBEN persistir (bug detectado y corregido en nómina y gastos compartidos)
10. **NO olvidar registrar keys en APP_KEYS** — Sin esto, los datos no se sincronizan a Supabase
11. **NO guardar solo datos filtrados** — Las funciones save SIEMPRE deben guardar el dataset completo
12. **NO modificar S.recs directamente** — Usar syncFlujoToRecs() para reconstruir desde FI_ROWS + FG_ROWS

---

## 11. Sugerencias de Mejora Financiera

Cuando trabajes en el dashboard, considera proactivamente estas mejoras de lógica financiera:

### P&L y Análisis
- **Varianza presupuestal**: Comparar real vs presupuesto por línea
- **Márgenes por producto/servicio**: Desglosar rentabilidad por línea de negocio
- **Tendencias interanuales**: Comparar mes actual vs mismo mes año anterior
- **Alertas automáticas**: Notificar cuando un gasto supera X% del presupuesto

### Créditos
- **Provisiones por riesgo**: Clasificar cartera por días de mora (vigente, 30d, 60d, 90d+)
- **TIR efectiva**: Calcular tasa interna de retorno real incluyendo comisiones
- **Concentración de cartera**: Alertar si un cliente supera X% del total

### TPV
- **Rentabilidad por terminal**: Comisión neta después de pagar promotor
- **Tasa de actividad**: % de terminales activas vs totales
- **Proyección de ingresos**: Basada en tendencia de volumen transaccional

### Tesorería
- **Forecast de flujo de caja**: Basado en CxC + CxP + compromisos fijos
- **Días de cobertura**: Liquidez disponible / gastos diarios promedio
- **Reconciliación bancaria**: Cruzar movimientos bancos vs registros internos

### Facturación
- **Aging de CxC/CxP**: Clasificar por antigüedad (corriente, 30d, 60d, 90d+)
- **DSO (Days Sales Outstanding)**: Días promedio de cobro
- **DPO (Days Payable Outstanding)**: Días promedio de pago
