---
name: gf-erp-dev
description: >
  Skill de desarrollo para el ERP/Dashboard de Grupo Financiero.
  Usa cuando: desarrolles vistas, componentes, charts, tablas, KPIs, módulos financieros,
  formularios de carga de datos, integración con Supabase, o cualquier feature del dashboard.
  Stack: Vanilla HTML/CSS/JS, Chart.js, Node.js backend, Supabase (PostgreSQL + RLS).
  Entidades: Salem, Endless, Dynamo, Wirebit, Centum Capital.
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

## Arquitectura del Proyecto

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
│   │   ├── storage.js              # DB wrapper (localStorage get/set)
│   │   ├── supabase.js             # SB sync engine (pullAll, pushKey, backgroundPull)
│   │   ├── login.js                # Autenticación, sesión, permisos
│   │   ├── helpers.js              # fmt(), sum(), MO[], cOpts(), escapeHtml()
│   │   ├── nav-structure.js        # NAV_STRUCTURE — Fuente de verdad del menú
│   │   ├── router.js               # Routing de vistas (navTo, sv, render)
│   │   └── auth.js                 # Gestión de usuarios y permisos
│   │
│   ├── shared/                     # Datos y utilidades compartidas entre features
│   │   ├── data-constants.js       # NOM, WB_ING/COSTOS, END/DYN_CREDITS, CATS
│   │   ├── ui-components.js        # openModal(), closeModal(), exportHTML(), toggleSidebar()
│   │   ├── chart-helpers.js        # rPLCharts(), rEvoChart(), rConsCharts()
│   │   ├── pl-engine.js            # rPL(), rConsolidado(), rIngView(), rGasView(), rNomView()
│   │   └── flujo-engine.js         # fiLoad(), fgLoad(), fiInjectTPV(), syncFlujoToRecs()
│   │
│   ├── features/                   # Un directorio por dominio de negocio
│   │   ├── dashboard/
│   │   │   ├── inicio.js           # Panel de control, alertas, tareas manuales
│   │   │   └── resumen.js          # Dashboard Grupo, EDO, entity summaries
│   │   ├── finanzas/
│   │   │   ├── nomina.js           # Nómina compartida (editable)
│   │   │   ├── gastos-comp.js      # Gastos compartidos (editable)
│   │   │   ├── flujo-ingresos.js   # Carga de flujo de ingresos
│   │   │   ├── flujo-gastos.js     # Carga de flujo de gastos
│   │   │   └── carga-masiva.js     # Upload Excel masivo
│   │   ├── creditos/
│   │   │   ├── credit-engine.js    # Cálculos puros (intereses, saldos, amortización)
│   │   │   ├── credit-dashboard.js # Dashboard de cartera Endless/Dynamo
│   │   │   ├── credit-detail.js    # Detalle, formularios, pagos
│   │   │   ├── credit-cobranza.js  # Cobranza y seguimiento
│   │   │   └── credit-carga.js     # Carga PDF de créditos
│   │   ├── tpv/
│   │   │   ├── tpv-data.js         # Queries Supabase para TPV (objeto TPV)
│   │   │   ├── tpv-general.js      # Dashboard general histórico
│   │   │   ├── tpv-dashboard.js    # Dashboard por periodo
│   │   │   ├── tpv-pagos.js        # Control de pagos
│   │   │   ├── tpv-resumen.js      # Resumen por cliente
│   │   │   ├── tpv-agentes.js      # Comisiones agentes
│   │   │   ├── tpv-terminales.js   # Gestión de terminales
│   │   │   ├── tpv-promotores.js   # Promotores
│   │   │   ├── tpv-comisiones.js   # Configuración comisiones
│   │   │   ├── tpv-facturacion.js  # Facturación + CFDI
│   │   │   └── tpv-upload.js       # Carga datos TPV
│   │   ├── tarjetas/
│   │   │   ├── tarjetas-data.js    # Queries Supabase (objeto TAR)
│   │   │   ├── tarjetas-charts.js  # Charts CENTUM + categorías P&L
│   │   │   └── tarjetas-upload.js  # Carga datos tarjetas
│   │   ├── wirebit/
│   │   │   ├── wirebit-data.js     # Cripto, tarjetas WB
│   │   │   ├── wirebit-views.js    # rWBIng() ingresos WB
│   │   │   └── wirebit-upload.js   # Carga transacciones cripto
│   │   ├── tesoreria/tesoreria.js  # Flujo de caja, bancos, consolidado
│   │   ├── tickets/tickets.js      # Tickets de pago TPV
│   │   ├── expedientes/expedientes.js  # Expedientes de clientes
│   │   ├── config/config.js        # Tema, permisos, apariencia
│   │   └── ai-chat/ai-chat.js     # Widget chat con Claude API
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
})(window);
```
Esto permite que `router.js` (switch/case) y `onclick=""` en HTML sigan funcionando sin cambios.

### Navegación Dual
```
┌─────────────────────────────────────────────────────┐
│  Topbar (oscuro): breadcrumb + tema + usuario + logout │
├────┬────────────────────────────────────────────────┤
│    │  HNav Sections: [Finanzas] [Operación] [Exp]   │
│ SB │  HNav Views: GRUPO | Dashboard | Resumen | ... │
│72px├────────────────────────────────────────────────┤
│    │                                                 │
│    │          Vista Activa (contenido)               │
│    │                                                 │
└────┴────────────────────────────────────────────────┘
```

- **Sidebar vertical** (72px): Iconos de empresas (Salem, Endless, Dynamo, Wirebit, Config)
- **HNav horizontal** (oscuro): Secciones (tabs) + vistas (chips)
- **NAV_STRUCTURE** en `nav-structure.js`: Fuente única de verdad para todo el menú

### Entidades del Grupo
| ID | Entidad | Negocio |
|----|---------|---------|
| sal | Salem Internacional | Holding financiero, TPV |
| end | Endless Capital | Créditos, préstamos |
| dyn | Dynamo Financiera | Créditos, préstamos |
| wb | Wirebit | Cripto, tarjetas |
| centum | Centum Capital | Consolidado Salem+Endless+Dynamo |
| grupo | Grupo Financiero | Consolidado total (incluye Wirebit) |

### Data Layer
- **DB wrapper**: `DB.get(key)` / `DB.set(key, value)` — lee/escribe localStorage
- **Supabase sync**: `SB.pushKey(key)` sube a Supabase, `SB.pullAll()` baja todo
- **Keys principales**: `gf4` (P&L recs), `gf_fi` (flujo ingresos), `gf_fg` (flujo gastos), `gf_cred_end`/`gf_cred_dyn` (créditos), `gf_usuarios`, `gf_tesoreria`, `gf_bancos`
- **TPV data**: Vive directamente en Supabase (tablas `tpv_transactions`, `tpv_clients`, etc.)
- **Tarjetas data**: En Supabase (funciones RPC `tar_*`)

## Patrones de Código

### Crear una Vista Nueva

1. **HTML** en `index.html` — añadir `<div class="view" id="view-XXXX">...</div>`
2. **Router** en `router.js` — añadir case en `render(id)`
3. **NAV_STRUCTURE** en `nav-structure.js` — registrar la vista en la sección/grupo correcto
4. **View Title** en `router.js` — añadir en el objeto `VT`
5. **JS function** en el módulo correspondiente — `function rXXXX() { ... }`

### Patrones de Formateo
```javascript
// Moneda MXN
fmt(1234567.89)          // → "$1,234,567.89"
fmtK(1234567)            // → "$1.23M"  (compacto con K/M)
fmtPct(0.2345)           // → "23.5%"

// Meses
MN[0..11]                // → ['Ene','Feb',...,'Dic']
MNF[0..11]               // → ['Enero','Febrero',...,'Diciembre']

// Colores de empresa
EC.sal = '#0073EA'        // Azul Salem
EC.end = '#00b894'        // Verde Endless
EC.dyn = '#6c5ce7'        // Morado Dynamo
EC.wb  = '#fd79a8'        // Rosa Wirebit
```

### Patrón de Card/KPI
```html
<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:20px;">
  <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">TÍTULO KPI</div>
  <div style="font-size:1.8rem;font-weight:800;color:var(--text);margin:4px 0">$1.23M</div>
  <div style="font-size:.7rem;color:var(--muted)">Descripción</div>
  <div style="height:4px;background:var(--blue-bg);border-radius:2px;margin-top:12px">
    <div style="height:100%;width:75%;background:var(--blue);border-radius:2px"></div>
  </div>
</div>
```

### Patrón de Tabla
```javascript
el.innerHTML = `
<table style="width:100%;border-collapse:collapse;font-size:.78rem">
  <thead><tr style="border-bottom:2px solid var(--border)">
    <th style="text-align:left;padding:8px;font-weight:700;color:var(--muted);font-size:.65rem;text-transform:uppercase">Columna</th>
  </tr></thead>
  <tbody>${data.map(row => `
    <tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <td style="padding:8px">${escapeHtml(row.name)}</td>
      <td style="padding:8px;text-align:right;font-weight:700">${fmt(row.amount)}</td>
    </tr>`).join('')}
  </tbody>
</table>`;
```

### Patrón de Chart (Chart.js)
```javascript
const ctx = document.getElementById('my-chart').getContext('2d');
new Chart(ctx, {
  type: 'bar', // line, doughnut, pie
  data: {
    labels: MN,  // Meses
    datasets: [{
      label: 'Ingresos',
      data: monthlyData,
      backgroundColor: EC.sal,  // Color de la entidad
      borderRadius: 4
    }]
  },
  options: {
    responsive: true,
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
--bg: #f4f5f7;          --border: #e2e5ea;
--r: 10px;              --sh: 0 1px 4px rgba(0,0,0,.06);
/* Sidebar / dark nav */
--sb: #1c1e2e;          --sb-h: #272942;
--sb-t: #c5c7e0;        --sb-m: #6165a0;
```

## Seguridad del Backend

### Headers (helmet-equivalent)
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
- Headers: Content-Type, Authorization

### Auth Middleware
- `/api/chat` requiere Bearer token (sesión base64)
- Server valida que el token contiene sesión con user ID

## Anti-Patrones (EVITAR)

1. **NO usar frameworks** — El proyecto es vanilla JS. No añadir React, Vue, etc.
2. **NO usar npm para frontend** — Solo CDN (Chart.js, Supabase, Poppins/Figtree fonts)
3. **NO console.log en producción** — Solo `console.warn`/`console.error` con prefijo `[Módulo]`
4. **NO emojis como iconos estructurales** — Usar emojis solo decorativamente en headers
5. **NO SQL directo** — Toda comunicación con DB es via Supabase REST/RPC
6. **NO exponer secretos** — `.env`, `server.js`, `security.js` bloqueados en ALLOWED_DIRS
7. **NO cambiar NAV_STRUCTURE sin actualizar router** — Siempre mantener sincronizados
8. **NO usar innerHTML sin escapeHtml()** — Prevenir XSS en datos de usuario

## Checklist Pre-Deploy

- [ ] Zero errores en consola del navegador
- [ ] `node -c server.js` pasa sin errores de sintaxis
- [ ] Todas las vistas nuevas registradas en NAV_STRUCTURE + VT + render()
- [ ] Permisos actualizados si se añadieron módulos
- [ ] Rate limits adecuados para nuevos endpoints
- [ ] Headers de seguridad aplicados a todas las respuestas
- [ ] Dark mode funciona (variables CSS usan tokens semánticos)
- [ ] Responsive verificado (768px breakpoint)
