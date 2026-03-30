# AGENTS.md — Guía para Agentes de IA

> Formato estándar [agents.md](https://agents.md/) para guiar a cualquier agente de código (Claude, Cursor, Copilot, GitHub Jules, etc.) en este proyecto.

## Resumen del Proyecto

**Dashboard ERP de Grupo Financiero VMCR** — aplicación web interna que consolida la operación financiera de 5 entidades bajo el holding Centum Capital. ~36,000 líneas de código.

**Stack:**
- Frontend: Vanilla HTML/CSS/JS (SIN frameworks)
- Charts: Chart.js 4.x (CDN)
- Backend: Node.js vanilla (`http` module, SIN Express)
- Base de datos: Supabase (PostgreSQL + RLS + REST API)
- Auth: PBKDF2 + JWT (httpOnly cookie)
- IA: Anthropic Claude API (chat con tool use)

---

## Setup y Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
node server.js
# Abre http://localhost:8080

# Producción (Railway)
npm start   # equivale a: node server.js
```

**Variables de entorno requeridas** (ver `.env.example`):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=<min_64_chars_para_jwt>
```

**No hay tests unitarios automatizados.** Verificar cambios manualmente en el navegador.

---

## Arquitectura

```
/ (raíz)
├── index.html              # SPA principal (4,600 líneas)
├── server.js               # Backend HTTP + API endpoints
├── security.js             # CSP, CORS, auth middleware, rate limiting
├── lib/                    # Módulos backend (NO servidos al cliente)
│   ├── ai-chat.js          # Integración Anthropic API
│   ├── tools.js            # Definiciones de tools para IA
│   ├── tool-executors.js   # Ejecución de tools (Supabase queries)
│   ├── permissions.js      # Control de acceso por rol
│   └── supabase-helpers.js # REST helpers para Supabase
├── js/
│   ├── core/               # Infraestructura base
│   │   ├── storage.js      # DB wrapper (localStorage ↔ Supabase)
│   │   ├── supabase.js     # Motor de sincronización + APP_KEYS
│   │   ├── login.js        # Auth, sesión, roles
│   │   ├── helpers.js      # fmt(), sum(), escapeHtml(), MN[]
│   │   ├── nav-structure.js# NAV_STRUCTURE (fuente única de navegación)
│   │   ├── router.js       # VIEW_REGISTRY, navTo(), selectView()
│   │   └── auth.js         # Gestión de usuarios y permisos
│   ├── shared/             # Utilidades compartidas
│   │   ├── ui-components.js# openModal(), toast(), export helpers
│   │   ├── chart-helpers.js# Funciones de Chart.js
│   │   ├── pl-engine.js    # Motor de P&L (CRÍTICO)
│   │   └── flujo-engine.js # Motor de flujo de caja
│   ├── features/           # Un directorio por módulo de negocio
│   │   ├── dashboard/      # KPIs y resúmenes
│   │   ├── finanzas/       # P&L, nómina, gastos compartidos
│   │   ├── creditos/       # Portafolio de créditos (Endless/Dynamo)
│   │   ├── tpv/            # Terminales punto de venta
│   │   ├── tarjetas/       # Tarjetas CENTUM
│   │   ├── wirebit/        # Exchange cripto
│   │   ├── tesoreria/      # Tesorería y bancos
│   │   ├── facturacion/    # CFDI y cuentas por pagar/cobrar
│   │   ├── expedientes/    # Documentos de clientes
│   │   ├── tickets/        # Sistema de tickets
│   │   ├── config/         # Configuración y categorías
│   │   └── ai-chat/        # Chat con IA
│   └── main.js             # Bootstrap / initApp()
├── assets/css/             # Estilos globales
├── ticket.html             # Formulario público de tickets
└── flujograma.html         # Diagrama de flujo
```

**API Endpoints:**
```
POST /api/login        — Auth (email + hash → JWT cookie)
POST /api/login/salt   — Obtener salt para hashing
POST /api/logout       — Expirar cookie JWT
POST /api/chat         — Chat IA con tool execution
GET  /api/config       — Credenciales Supabase (público)
GET  /api/health       — Health check (admin only)
POST /api/upload/*     — Carga de datos TPV/tarjetas
```

---

## Convenciones de Código

### Módulos Frontend

Todos los archivos JS de features usan **IIFE**:
```javascript
(function(window) {
  'use strict';
  // ... código del módulo ...
  window.miFuncion = miFuncion;  // exponer como global
})(window);
```

### Patrones Obligatorios

1. **Siempre escapar HTML de datos**: usar `escapeHtml(texto)` antes de insertar en innerHTML
2. **Event delegation** en vez de inline handlers: usar `data-*` attributes + `addEventListener` en el contenedor
3. **Chart.js**: destruir chart anterior antes de crear uno nuevo:
   ```javascript
   if (MIS_CHARTS['key']) MIS_CHARTS['key'].destroy();
   MIS_CHARTS['key'] = new Chart(ctx, config);
   ```
4. **Persistencia write-through**:
   ```javascript
   DB.set('gf_mi_key', datos);  // guarda en localStorage + async push a Supabase
   ```
5. **Registrar nuevas keys** en `APP_KEYS` (supabase.js) para que se sincronicen
6. **Guardar datos completos**, nunca solo el subset filtrado
7. **Formato de moneda**: usar `fmt(monto)` que retorna `$X,XXX.XX`

### Navegación

Toda la navegación se define en `NAV_STRUCTURE` (nav-structure.js). Para agregar una vista:
1. Agregar entrada en `NAV_STRUCTURE`
2. Registrar handler en `VIEW_REGISTRY` (router.js)
3. Agregar HTML del view en `index.html`

---

## Capa de Datos

### Patrón Write-Through

```
Frontend: DB.set(key, data)
  → localStorage.setItem(key, JSON.stringify(data))
  → Supabase.pushKey(key)  (async, no blocking)

Frontend: DB.get(key)
  → JSON.parse(localStorage.getItem(key))
```

### Keys Principales

| Key | Contenido |
|-----|-----------|
| `gf_fi` | Flujo de ingresos |
| `gf_fg` | Flujo de gastos |
| `gf_nomina` / `gf_gc` | Nómina / Gastos compartidos |
| `gf_cred_end` / `gf_cred_dyn` | Créditos Endless / Dynamo |
| `gf_tesoreria` | Movimientos de tesorería |
| `gf_usuarios` | Lista de usuarios del sistema |

### Supabase

- **app_data**: tabla key-value (JSONB) para datos sincronizados
- **tpv_***: tablas directas para TPV (transactions, clients, etc.)
- **tar_***: tablas directas para tarjetas CENTUM
- **exp_***: tablas para expedientes (clientes + documentos)
- **RPC functions**: `tpv_kpis()`, `tpv_clients_volume()`, etc.

---

## Seguridad

- **CSP** activa en `security.js` (script-src sin `unsafe-eval`)
- **JWT** como httpOnly cookie (`Secure` en producción, `SameSite=Strict`)
- **Auth middleware** (`requireAuth`) lee cookie o header Authorization
- **PBKDF2** para hashing de contraseñas (client-side + server verification)
- **Rate limiting** en login (10 req/60s) y chat (15 req/60s)
- **CORS** whitelist explícita
- **Rutas bloqueadas**: `.env`, `server.js`, `security.js`, `lib/`, `node_modules/`
- **Body size limit**: 128KB máximo

---

## Dominio de Negocio

### Entidades del Grupo

| ID | Nombre | Negocio | Color |
|----|--------|---------|-------|
| `sal` | Salem | TPV, tarjetas CENTUM | `#0073ea` |
| `end` | Endless | Créditos simples | `#00b875` |
| `dyn` | Dynamo | Créditos simples | `#ff7043` |
| `wb` | Wirebit | Crypto exchange | `#9b51e0` |
| `stel` | Stellaris | Fintech | `#e53935` |

### Módulos Principales

- **P&L**: Estado de resultados por empresa (Ingresos → Costes → Margen → EBITDA → Utilidad Neta)
- **Créditos**: Amortización francesa, tracking de cobranza (PAGADO/PARCIAL/VENCIDO/PENDIENTE)
- **TPV**: Transacciones, comisiones escalonadas, pagos a promotores/agentes
- **Tarjetas**: Fondeo, dispersión, fees
- **Tesorería**: Flujo de caja, bancos, conciliación
- **Facturación**: CFDI emitidas/recibidas, CxP/CxC
- **Nómina**: Distribuida por % entre empresas

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total, gestión de usuarios |
| `editor` | Crear/editar datos en módulos asignados |
| `viewer` | Solo lectura |

---

## Anti-Patrones (NO hacer)

1. **NO usar frameworks** (React, Vue, Angular) — el proyecto es 100% vanilla JS
2. **NO usar npm para frontend** — las libs se cargan por CDN
3. **NO usar Express/Fastify** — el backend es `http` nativo de Node.js
4. **NO insertar HTML sin escapar** — siempre `escapeHtml()` para datos de usuario
5. **NO usar inline handlers con variables** — usar event delegation con `data-*` attributes
6. **NO guardar datos filtrados** — siempre persistir el dataset completo
7. **NO crear charts sin destruir el anterior** — memory leak
8. **NO agregar keys de datos sin registrar** en `APP_KEYS` (supabase.js)
9. **NO hacer queries SQL directas** — usar Supabase REST API o RPC
10. **NO exponer secrets** en logs, URLs, o respuestas HTTP
