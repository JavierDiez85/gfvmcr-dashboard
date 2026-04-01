# Manual Completo — Dashboard Grupo Financiero VMCR

> **Versión**: 1.3 | **Fecha**: 2026-04-01 | **Código**: ~37,500 líneas
>
> Este manual cubre 3 niveles: operativo (cómo usar), técnico (cómo funciona) y desarrollo (cómo modificar). Diseñado para que cualquier desarrollador o agente de IA pueda retomar el proyecto desde cero.

---

## Tabla de Contenidos

- [Parte 1: Manual Operativo](#parte-1-manual-operativo)
- [Parte 2: Arquitectura Técnica](#parte-2-arquitectura-técnica)
- [Parte 3: Guía de Desarrollo](#parte-3-guía-de-desarrollo)
  - [3.11 Troubleshooting](#311-troubleshooting)
  - [3.12 Backup y Recovery](#312-backup-y-recovery)
- [Parte 4: Referencia Rápida](#parte-4-referencia-rápida)

---

# Parte 1: Manual Operativo

## 1.1 Login y Roles

### Acceso
- URL local: `http://localhost:8080`
- URL producción: `https://gfvmcr-dashboard-production.up.railway.app`

### Proceso de Login
1. Ingresar email y contraseña (botón 👁 para mostrar/ocultar contraseña)
2. El sistema hashea la contraseña con PBKDF2 (client-side)
3. El servidor valida el hash y emite un JWT como cookie httpOnly
4. La sesión dura 24 horas (JWT) con timeout de inactividad de 30 minutos

### Mensajes de error de login
- **429**: "Demasiados intentos. Espera un momento e intenta de nuevo." (rate limit server-side)
- **Credenciales incorrectas**: "Correo o contraseña incorrectos"
- **Sin red**: "Sin conexión al servidor. Verifica tu internet."
- **Rate limit local**: "Demasiados intentos. Espera 5 minutos." (5 intentos en 5 min)

### Roles
| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total. Gestión de usuarios. Puede ver `/api/health` con detalle |
| **editor** | Crear/editar datos en los módulos que tenga asignados |
| **viewer** | Solo lectura. No puede crear, editar ni eliminar |

### Permisos Granulares
Además del rol, cada usuario tiene permisos por módulo. Un admin sin permisos custom ve todo. Un editor solo ve los módulos donde tiene `perms[moduloId] = 'menu'` o `true`.

---

## 1.2 Navegación

### Sidebar (izquierda)
Barra vertical de 72px con iconos de las entidades:
- **GF** (Grupo) — Vista consolidada
- **S** (Salem) — TPV, tarjetas, P&L Salem
- **E** (Endless) — Créditos Endless
- **D** (Dynamo) — Créditos Dynamo
- **W** (Wirebit) — Crypto exchange
- **St** (Stellaris) — Nueva entidad
- **Config** (engrane) — Usuarios, permisos, apariencia

### Topbar (arriba)
- Barra de búsqueda IA (buscar módulo o preguntar al bot)
- Nombre del usuario y rol
- Botón de tema (claro/oscuro)
- Indicador de sincronización
- Botón "Salir"

### Navegación Horizontal
Al seleccionar una entidad, aparecen:
1. **Tabs de sección**: Finanzas, Operación, Carga de Datos, etc.
2. **Chips de vista**: Las vistas específicas dentro de cada sección

---

## 1.3 Dashboard Grupo (Inicio)

**Vista**: Panel de Control principal al entrar.

### KPIs Globales
- **Ingresos Totales**: Suma de ingresos de todas las entidades
- **Gastos Totales**: Suma de costos + gastos administrativos
- **Margen Operativo**: Ingresos - Costos directos
- **Nómina Total**: Distribución de nómina entre empresas

### Cards por Empresa
Cada entidad muestra: ingresos, gastos, margen y % de contribución al grupo.

### Tesorería — Flujo de Caja Real
- Saldo consolidado
- Flujo neto del mes
- Ingresos del mes
- Desglose por empresa (Salem, Endless, Dynamo, Wirebit, Stellaris)

### Gráficas
- Ingresos Grupo por empresa (barras apiladas, 12 meses)
- Gastos por empresa (donut)
- Nómina por empresa (barras)
- Margen operativo (barras horizontales)

### Resumen por Empresa
Cards con ingresos, gastos, nómina/mes y margen por cada entidad. Link a "ver P&L" de cada una.

---

## 1.4 Finanzas

Para entender cómo fluyen los datos entre módulos (Créditos→P&L, TPV→P&L, Nómina→P&L), ver secciones 3.6-3.8.

### 1.4.1 Resumen P&L (por entidad)
**Vistas**: `sal_res`, `end_res`, `dyn_res`, `wb_res`, `stel_res`

Muestra el Estado de Resultados completo:
```
INGRESOS TOTALES
  - Líneas de ingreso por concepto y mes
- COSTES DIRECTOS (Operaciones, Com. Bancarias, Nómina Operativa)
= MARGEN OPERATIVO
- GASTOS ADMINISTRATIVOS (Renta, Marketing, Nómina Admin, etc.)
= EBITDA
- Depreciación
= UTILIDAD NETA
```

**Filtros de periodo**: Año completo, trimestre (Q1-Q4), mes individual, **"Todo"** (sin restricción), **rango de meses** (Shift+Click para seleccionar inicio y fin).
**Rango de meses**: Al hacer Shift+Click en un mes se selecciona el rango entre el mes activo y el clickeado (ej. Mar-Ago). El rango aparece resaltado y etiquetado.
**Comparativa**: Toggle "vs año anterior" para ver variación. (Oculto en modo Todo/Rango).
**Gráficas**: Evolución mensual (barras + línea EBITDA), composición de gastos (donut).

### 1.4.2 Flujo de Ingresos
**Vistas**: `flujo_ing`, `flujo_ing_sal`, `flujo_ing_end`, etc.

Tabla de ingresos con columnas:
- Concepto, Entidad, Categoría, 12 meses (Ene-Dic), Total

**Datos automáticos** (no editables):
- Comisiones TPV (auto-inyectadas desde Supabase)
- Intereses de créditos (auto-calculados de la cartera)

**Datos manuales** (editables):
- Cualquier otro ingreso: agregar fila con `+ Agregar`
- Editar montos directamente en la celda del mes

### 1.4.3 Flujo de Gastos
**Vistas**: `flujo_gas`, `flujo_gas_sal`, etc.

Similar al de ingresos pero para gastos. Columnas adicionales:
- **Tipo**: Operativo, Financiero, Administrativo
- **Compartido**: Toggle para gastos que se distribuyen entre entidades
- **GC Concepto**: Si es compartido, seleccionar el gasto compartido para distribución automática

### 1.4.4 Nómina Compartida
**Vista**: `nomina`

Tabla de empleados con:
- Nombre, Rol, Tipo (Operativo/Administrativo), Sueldo
- Distribución por empresa (% para Salem, Endless, Dynamo, Wirebit, Stellaris)
- Total debe sumar 100%

**Click en empleado** abre modal de detalle con:
- Info editable (nombre, rol, tipo, fechas)
- Sueldo y cambios históricos
- Distribución % con barra visual
- Costo mensual por empresa (tabla 12 meses)

### 1.4.5 Gastos Compartidos
**Vista**: `gastos_comp`

Tabla de gastos fijos que se distribuyen entre empresas:
- Concepto, Categoría, Presupuesto mensual
- % de distribución por empresa (Salem, Endless, Dynamo, Wirebit)
- Automáticamente se inyectan en el flujo de gastos de cada entidad

---

## 1.5 Créditos

### 1.5.1 Dashboard de Créditos
**Vistas**: `cred_dash` (Endless), `dyn_dash` (Dynamo)

KPIs:
- Total cartera (monto original)
- Saldo vigente (capital pendiente)
- Créditos activos / vencidos / liquidados
- Tasa promedio ponderada

Lista de créditos con: cliente, monto, tasa, plazo, estado, saldo actual, próximo pago.
**Click en crédito** abre detalle completo con tabla de amortización.

### 1.5.2 Cobranza
**Vistas**: `cred_cobr` (Endless), `dyn_cobr` (Dynamo)

Muestra solo créditos con periodos vencidos:
- Cliente, periodos vencidos, monto vencido, días de atraso
- Botón "Registrar Pago" para cada periodo

### 1.5.3 Detalle de Crédito (Modal)
Al hacer click en un crédito:
- Información general (cliente, monto, tasa, plazo, estado)
- Tabla de amortización completa:
  - Periodo, Fecha, Pago, Capital, Interés, IVA, Saldo
  - Estado por periodo: PAGADO (verde), PARCIAL (amarillo), VENCIDO (rojo), PENDIENTE (gris)
- Botón "Registrar Pago" en periodos vencidos o pendientes
- Botón "Eliminar Crédito"

### 1.5.4 Simulador de Crédito
- Inputs: monto, tasa anual, plazo (meses), comisión apertura
- Genera tabla de amortización francesa
- Editable antes de guardar

### 1.5.5 Lógica de Estados
| Estado | Condición |
|--------|-----------|
| PAGADO | Pago registrado >= monto del periodo (tolerancia 0.05 MXN) |
| PARCIAL | Pago registrado > 0 pero < monto del periodo |
| VENCIDO | Fecha del periodo ya pasó y NO hay pago |
| PENDIENTE | Fecha del periodo es futura |

**REGLA ABSOLUTA**: Un periodo con fecha futura NUNCA puede estar vencido.

La tolerancia de 0.05 MXN es una constante en `credit-engine.js` y `tool-executors.js`. Si necesita ajustarse, buscar `- 0.05` en ambos archivos.

---

## 1.6 TPV (Terminales Punto de Venta)

### 1.6.1 Dashboard General
**Vista**: `tpv_general`

KPIs: total cobrado, comisiones (Efevoo, Salem, Convenia, Comisionista), clientes, transacciones, terminales.

### 1.6.2 Dashboard por Periodo
**Vista**: `tpv_dashboard`

Filtro por rango de fechas. Comparativa vs periodo anterior.

### 1.6.3 Control de Pagos
**Vista**: `tpv_pagos`

Tabla de clientes con: vendido, comisión, pagos registrados, pendiente.
- **Botón "+ Pago"**: Registrar pago a cliente
- **Historial**: Ver todos los pagos de un cliente

### 1.6.4 Comisiones
**Vista**: `tpv_comisiones`

Desglose de comisiones por cliente: Efevoo, Salem, Convenia, Comisionista, Neto.
- Click en cliente abre detalle
- Botón editar para modificar tasas

### 1.6.5 Agentes y Promotores
**Vistas**: `tpv_agentes`, `tpv_promotores`

Rendimiento por agente/promotor: vendido, comisión, clientes, pagos.
- Registrar pagos a agentes
- Ver historial de pagos

### 1.6.6 Terminales
**Vista**: `tpv_terminales`

Lista de terminales: último uso, ingresos, transacciones, días sin uso.
Alertas de terminales inactivas (>15 días).

### 1.6.7 Facturación TPV
**Vista**: `fact_terminales`

Facturas por cliente/periodo. Crear, ver PDF, eliminar facturas.

### 1.6.8 Carga de Datos TPV
**Vista**: `tpv_upload`

Upload de Excel con transacciones:
- Estrategias: reemplazar todo, reemplazar periodo, solo agregar nuevas
- Validación y preview antes de confirmar
- Rollback disponible (deshacer última carga)
- Historial de cargas

### 1.6.9 Fórmulas de Comisiones TPV

Cada transacción genera 4 comisiones calculadas por la RPC `tpv_client_commissions`:

| Entidad | Fórmula | Descripción |
|---------|---------|-------------|
| Efevoo | `monto × rate_efevoo_{tarjeta}` | Comisión del procesador |
| Salem | `monto × rate_salem_{tarjeta}` | Comisión de Salem |
| Convenia | `monto × rate_convenia_{tarjeta}` | Comisión de Convenia (si aplica) |
| Comisionista | `monto × rate_comisionista_{tarjeta}` | Comisión del promotor/agente |

Donde `{tarjeta}` = TC, TD, Amex, o TI según el tipo de tarjeta.

Para MSI (Meses Sin Intereses), las tasas se leen de `tpv_client_msi_rates` por plazo (3/6/9/12 meses).

Las tasas se configuran por cliente en la sección de Comisiones.

---

## 1.7 Tarjetas CENTUM

### 1.7.1 Dashboard
**Vista**: `tar_dashboard`

Gráficas de volumen por concepto, tendencias, top clientes.

### 1.7.2 Vistas adicionales
- `tar_conceptos` — Desglose por concepto de cobro
- `tar_subclientes` — Ranking de tarjetahabientes
- `tar_rechazos` — Análisis de rechazos
- `tar_tarjetahabientes` — Registro de tarjetahabientes

### 1.7.3 Carga de Datos
**Vista**: `tar_upload`

Upload de Excel con transacciones de tarjetas. Similar al TPV upload.

---

## 1.8 Wirebit

### 1.8.1 P&L Wirebit
**Vista**: `wb_res`

Estado de resultados: fees de exchange, costos operativos, margen.

### 1.8.2 Transacciones
- `wb_cripto` — Transacciones de criptomonedas
- `wb_tarjetas` — Transacciones de tarjetas Wirebit

### 1.8.3 Carga de Datos
- `wb_upload` — Upload de fees de exchange
- `wb_tar_upload` — Upload de transacciones de tarjetas

---

## 1.9 Tesorería

### 1.9.1 Flujo de Caja
**Vista**: `tes_flujo`

Tabla de movimientos: fecha, empresa, tipo (ingreso/gasto), categoría, concepto, cuenta, monto.
- Filtros: empresa, tipo, fecha, búsqueda
- Agregar/editar/eliminar movimientos
- Selección múltiple para operaciones batch

### 1.9.2 Por Empresa
**Vista**: `tes_individual`

KPIs por empresa: ingresos, gastos, flujo neto. Gráfica mensual. Últimos movimientos.

### 1.9.3 Consolidado Grupo
**Vista**: `tes_grupo`

Vista consolidada de todas las empresas.

### 1.9.4 Bancos y Cuentas
**Vista**: `cfg_bancos`

Configurar cuentas bancarias: nombre, tipo, empresas asignadas.
- Toggle de empresas por cuenta (checkboxes)
- Agregar/editar/eliminar cuentas

---

## 1.10 Facturación

### 1.10.1 Por Empresa
**Vistas**: `fact_tarjetas` (Salem), `fact_endless`, `fact_dynamo`, `fact_wirebit`, `fact_stellaris`

Tres sub-secciones por empresa:
- **Emitidas**: Facturas que emitimos (CxC)
- **Recibidas**: Facturas que recibimos (CxP)
- **Pagos Pendientes**: Facturas sin cobrar/pagar

### 1.10.2 Carga de Facturas
**Vista**: `carga_facturas`

Upload de XML CFDI. Parseo automático de datos del comprobante.

### 1.10.3 Carga de Egresos
**Vista**: `carga_egresos`

Captura manual o por archivo de facturas de egreso. Drag & drop de PDFs. Modo efectivo.

---

## 1.11 Expedientes

**Vistas**: `expedientes`, `expedientes_sal`, `expedientes_end`, etc.

Gestión de documentos por cliente:
- Lista de clientes con búsqueda y filtros
- Agregar/editar clientes (nombre, email, teléfono, tipo, productos)
- Subir documentos por categoría (identificación, comprobantes, contratos, anexos)
- Ver y eliminar documentos
- Almacenamiento en Supabase Storage

---

## 1.12 Tickets

### 1.12.1 Panel Interno
**Vista**: `tk_pagos_tpv`

KPIs: total, pendientes, abiertos, en proceso, resueltos.
Tabla de tickets con filtros por estado, prioridad, búsqueda.
- Click en ticket abre detalle
- Cambiar estado (pendiente → abierto → en_proceso → resuelto → cerrado)

### 1.12.2 Formulario Público
**URL**: `/ticket.html`

Formulario para que clientes envíen tickets de pago:
- Empresa, asunto, descripción, prioridad
- Agregar múltiples pagos (banco o tarjetas, monto fijo o %)
- Horarios de pago informados

---

## 1.13 Configuración

### 1.13.1 Usuarios
**Vista**: `cfg_usuarios`

CRUD de usuarios: nombre, email, contraseña, teléfono, empresa, rol, activo.
Asignación de permisos por módulo con checkboxes.

### 1.13.2 Apariencia
**Vista**: `cfg_apariencia`

Tema claro/oscuro. Se persiste en `gf_theme`.

### 1.13.3 Categorías P&L
**Vista**: `cfg_categorias`

Gestión de categorías de ingresos y gastos para el P&L.

---

## 1.14 Bot IA (Asistente)

> **Estado actual**: Bot temporalmente desactivado (`initAIChat()` retorna inmediatamente). Para reactivar, eliminar el `return` al inicio de `initAIChat()` en `js/features/ai-chat/ai-chat.js`.

### Acceso
- Escribir en la barra de búsqueda del topbar y presionar Enter
- Se abre panel de chat lateral

### Qué puede hacer
- Consultar datos en tiempo real (créditos, TPV, tesorería, P&L)
- Analizar riesgo crediticio
- Proyectar flujo de caja
- Comparar periodos (mes vs mes, trimestre, año)
- Buscar clientes en todas las entidades
- Simular créditos nuevos
- Generar resumen ejecutivo
- Identificar alertas y tendencias

### Herramientas disponibles (20)
`get_tpv_kpis`, `get_tpv_clients_volume`, `get_tpv_commissions`, `get_tpv_agent_summary`, `get_tpv_terminal_status`, `get_tarjetas_kpis`, `get_credit_portfolio`, `get_pl_summary`, `get_treasury_and_banks`, `get_tickets`, `get_cash_flows`, `get_users` (admin), `analyze_credit_risk`, `project_cash_flow`, `compare_periods`, `get_alerts`, `simulate_credit`, `search_client`, `executive_summary`, `analyze_trends`

### Permisos
El bot respeta los permisos del usuario. Si un usuario no tiene acceso a créditos, el bot no puede consultar datos de créditos.

---

# Parte 2: Arquitectura Técnica

## 2.1 Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Vanilla HTML/CSS/JS (SIN frameworks) |
| Charts | Chart.js 4.x (CDN) |
| Backend | Node.js vanilla (`http` module, SIN Express) |
| Base de datos | Supabase (PostgreSQL + RLS + REST API) |
| Auth | PBKDF2 + JWT (httpOnly cookie, SameSite=Strict) |
| IA | Anthropic Claude API (Sonnet 4) — actualmente desactivado |
| Deploy | Railway.app + Docker |
| PWA | Service Worker (cache solo icons/manifest) + manifest.json |

### Dependencias (package.json)
```json
{
  "@supabase/supabase-js": "^2.99.2",
  "xlsx": "^0.18.5"
}
```

Solo 2 dependencias. Todo lo demás es vanilla o CDN.

---

## 2.2 Flujo de Autenticación

```
[Cliente]                          [Servidor]                    [Supabase]
    |                                  |                              |
    |-- POST /api/login/salt --------->|                              |
    |   {email}                        |-- getAppData('gf_usuarios')->|
    |<-- {salt: "hex"} ----------------|<-- [{id,email,salt,...}] ----|
    |                                  |                              |
    |-- hashPasswordPBKDF2(pwd, salt)  |                              |
    |                                  |                              |
    |-- POST /api/login -------------->|                              |
    |   {email, passwordHash, salt}    |                              |
    |                                  |-- verify hash vs stored ---->|
    |                                  |-- signToken(payload) ------->|
    |<-- Set-Cookie: gf_token=JWT -----|                              |
    |<-- {user: {...}, salt} ----------|                              |
    |                                  |                              |
    |-- sessionStorage.gf_session ---  |                              |
    |-- initApp() ------------------->|                              |
    |                                  |                              |
    |-- POST /api/chat -------------->|  (cookie sent automatically)  |
    |   (cookie: gf_token=JWT)         |-- requireAuth(req) -------->|
    |                                  |   reads cookie → verifyToken |
    |<-- {content: [...]} ------------|                              |
```

### JWT
- Algoritmo: HMAC-SHA256
- Secret: `SESSION_SECRET` env var (OBLIGATORIO, mínimo 32 caracteres). Si no está configurado, el servidor falla al arrancar.
- Expiry: 24 horas
- Payload: `{id, nombre, email, rol, perms, iat, exp}`
- Cookie flags: `HttpOnly; SameSite=Strict; Path=/; Secure` (en producción)

### Nota sobre hashing client-side
El hashing PBKDF2 se realiza client-side para que el servidor nunca vea la contraseña en texto plano. El salt se obtiene vía `/api/login/salt` (siempre retorna 200 para prevenir enumeración de usuarios). El hash viaja por HTTPS y se compara server-side contra el hash almacenado.

**Limitaciones conocidas**: Si el hash es interceptado (MitM sin HTTPS), podría reenviarse (replay). Por eso la cookie JWT es `SameSite=Strict` y `Secure` en producción. Railway fuerza HTTPS automáticamente con redirect 301 de HTTP→HTTPS.

### Timeout de inactividad
- 30 minutos sin actividad → logout automático
- Eventos que resetean: click, keydown, scroll, mousemove (throttled cada 30s)
- Watchdog cada 60s verifica `lastActivity`

---

## 2.3 Capa de Datos

### Patrón Write-Through
```
DB.set(key, data)
  → localStorage.setItem(key, JSON.stringify(data))     [inmediato]
  → SB.pushKey(key)                                     [async, background]
       → UPSERT app_data SET value=data WHERE key=key
```

### Sincronización
1. **Pull inicial**: `SB.pullAll()` al login → descarga todas las keys de `app_data`
2. **Push incremental**: `SB.pushKey(key)` en cada `DB.set()`
3. **Background pull**: Cada 30 segundos, consulta `app_data WHERE updated_at > lastSync`
4. **Cola offline**: Si no hay conexión, las keys pendientes se acumulan en `_pendingPush`
5. **Conflicto**: Last-write-wins por key. Se ignoran cambios propios (`updated_by === CLIENT_ID`)

**⚠ Riesgo de conflicto**: Si dos usuarios editan la misma key simultáneamente (ej: nómina), el último en guardar sobreescribe al otro sin aviso. Mitigación actual: el background pull cada 30s detecta cambios remotos y refresca. Para datos críticos, se recomienda que solo un usuario edite a la vez.

**Límite de localStorage**: ~5-10MB según navegador. Con el volumen actual de datos (~2MB promedio), hay margen, pero se recomienda monitorear si crece significativamente.

### APP_KEYS (keys sincronizadas)

| Key | Descripción |
|-----|-------------|
| `gf4` | Registros P&L manuales (legacy). Contiene S.recs filtrados sin datos auto-inyectados (TPV, créditos). Se mantiene por compatibilidad. |

```javascript
['gf4','gf_fi','gf_fg','gf_cred_end','gf_cred_dyn','gf_cc_hist',
 'gf_usuarios','gf_theme','gf_tesoreria','gf_bancos','gf_tpv_pagos',
 'gf_cat_cd','gf_cat_ga','gf_tickets_pagos_tpv','gf_tpv_agente_pagos',
 'gf_tpv_promotor_pagos','gf_tpv_rate_changes',
 'gf_wb_fees_2025','gf_wb_fees_2026','gf_wb_upload_summary',
 'gf_wb_tarjetas_2025','gf_wb_tarjetas_2026','gf_nomina','gf_gc','gf_cxp']
```

### Tablas Supabase Directas (no app_data)

| Tabla | Módulo | Operaciones |
|-------|--------|-------------|
| `tpv_agentes` | TPV | Agentes con % comisión |
| `tpv_clients` | TPV | Clientes con 16 campos de tasa |
| `tpv_client_msi_rates` | TPV | Tasas MSI por plazo/entidad/tarjeta |
| `tpv_transactions` | TPV | Transacciones (millones de filas) |
| `tpv_upload_batches` | TPV | Historial de cargas |
| `tar_transactions` | Tarjetas | Transacciones de tarjetas |
| `tar_cardholders` | Tarjetas | Tarjetahabientes |
| `exp_clientes` | Expedientes | Clientes con productos |
| `exp_documentos` | Expedientes | Documentos (metadata + storage path) |
| `app_data` | Todos | Key-value store para datos sincronizados |
| `sync_meta` | Sistema | Tracking de sincronización por cliente |

---

## 2.4 API Endpoints

| Método | Ruta | Auth | Rate Limit | Descripción |
|--------|------|------|------------|-------------|
| GET | `/api/health` | JWT (admin) | — | Health check + validación env |
| GET | `/api/config` | — | 60/min | Credenciales Supabase (anon) |
| POST | `/api/login/salt` | — | 15/min | Obtener salt para hashing |
| POST | `/api/login` | — | 10/min | Login → JWT cookie |
| POST | `/api/logout` | — | — | Expirar cookie |
| POST | `/api/chat` | JWT | 15/min | Chat IA con tools |
| POST | `/api/upload/tpv/prepare` | JWT | 30/min | Preparar upload TPV |
| POST | `/api/upload/tpv/config` | JWT | 30/min | Configurar agentes/clientes |
| DELETE | `/api/upload/tpv/batch/:id` | JWT | — | Rollback upload TPV |
| POST | `/api/upload/tarjetas/prepare` | JWT | 30/min | Preparar upload tarjetas |
| DELETE | `/api/upload/tarjetas/batch/:id` | JWT | — | Rollback upload tarjetas |
| GET | `/*` | — | — | Archivos estáticos |

Nota: `/api/config` expone el anon key de Supabase (público por diseño). RLS (Row Level Security) en Supabase protege los datos — el anon key solo permite operaciones permitidas por las políticas RLS.

---

## 2.5 Seguridad

### CSP (Content Security Policy)
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: blob:
connect-src 'self' https://*.supabase.co https://cdnjs.cloudflare.com
frame-src 'none'
object-src 'none'
base-uri 'self'
```

### Headers de seguridad
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `HSTS: max-age=31536000`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

### Rate Limiting
Sliding window de 60 segundos por IP + ruta. Cleanup cada 60s.

### Rutas Bloqueadas
`.env`, `server.js`, `security.js`, `package.json`, `lib/`, `node_modules/`, `.git/`, `.claude/`, archivos `.md`

### HTTPS
Railway fuerza HTTPS automáticamente (redirect 301 HTTP→HTTPS). La cookie `gf_token` tiene flag `Secure` en producción, garantizando que solo se envía por HTTPS.

### CORS
Whitelist explícita: localhost + `CORS_ORIGIN` env var.

---

## 2.6 Bot IA — Arquitectura

### Flujo
```
[Cliente] → POST /api/chat {messages, context}
  → [server.js] requireAuth → handleChat()
    → [ai-chat.js] buildSystemPrompt(context, user)
    → filter tools by user permissions
    → LOOP (max 8 rounds):
        → callAnthropic(model, system, tools, messages)
        ← if stop_reason == 'end_turn' → return response
        ← if stop_reason == 'tool_use':
            → executeTool(name, input, user)  [server-side, Supabase]
            → append tool_result to messages
            → continue loop
```

### Modelo: `claude-sonnet-4-20250514`
### Max tokens: 4096
### System prompt: ~70 líneas en español con:
- Instrucciones de formato (cifras en MXN, negritas, viñetas)
- Conocimiento del negocio (5 entidades, créditos, TPV)
- Reglas de créditos (VENCIDO vs PENDIENTE vs PAGADO)
- Permisos del usuario actual
- Contexto de sesión

---

## 2.7 Deploy

### Railway
- Push a `main` → auto-deploy
- Variables de entorno configuradas en Railway dashboard
- Dominio: `gfvmcr-dashboard-production.up.railway.app`

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

### Variables de Entorno Requeridas
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=<min_64_chars>
```

### Variables Opcionales
```
CORS_ORIGIN=https://mi-dominio.com    # whitelist CORS
TRUST_PROXY=1                          # para Railway (X-Forwarded-For)
NODE_ENV=production                    # activa Secure flag en cookies
IVA_RATE=0.16                          # Tasa IVA (default 0.16 = 16%). Para zona fronteriza norte usar 0.08. No hay soporte actual para productos exentos.
TERMINAL_INACTIVITY_DAYS=15            # días para alerta de terminal inactiva
PORT=8080                              # puerto (default 8080)
```

---

## 2.8 PWA y Versión Móvil

### Soporte PWA (Progressive Web App)
- `manifest.json`: nombre, iconos 192px y 512px, `start_url: "/"`, `display: "standalone"`
- `service-worker.js`: cachea solo `icon-192.png`, `icon-512.png` y `manifest.json`
- HTML/JS/CSS NO se cachean → siempre se sirve código fresco desde el servidor
- Auto-reload: cuando un nuevo SW se activa, la página recarga automáticamente
- En iOS: instalar desde Safari → "Agregar a pantalla de inicio"

### Rutas permitidas (security.js)
`manifest.json` y `service-worker.js` están en `ALLOWED_DIRS` para acceso público sin auth.

### Vista Móvil (breakpoint 480px)
- KPIs: grid 2 columnas, tipografía compacta
- Topbar: 34px de altura, sin toggle de tema
- Tablas: fuentes 0.5–0.6rem, padding 4px
- Entity cards: scroll horizontal con snap
- Charts: max-height 150px
- Scrollbars: 3px de ancho
- Search bar: 100px mínimo

### Limitaciones actuales móvil
- Bot IA desactivado en móvil (también desactivado globalmente al 2026-04-01)
- Algunas vistas complejas (créditos, TPV detalle) pueden requerir scroll horizontal

---

# Parte 3: Guía de Desarrollo

## 3.1 Patrones de Código

### Módulos Frontend — IIFE
Todos los archivos JS de features usan Immediately Invoked Function Expression:
```javascript
(function(window) {
  'use strict';

  function miRenderFunction() {
    // ... lógica ...
  }

  function miHelperPrivado() {
    // no expuesto
  }

  // Exponer como globals
  window.miRenderFunction = miRenderFunction;
})(window);
```

### Escapar HTML
**SIEMPRE** usar `escapeHtml(texto)` antes de insertar datos en innerHTML:
```javascript
el.innerHTML = `<td>${escapeHtml(usuario.nombre)}</td>`;
```

### Event Delegation
**NO usar** inline handlers con variables. Usar `data-*` attributes + `addEventListener`:
```javascript
// ❌ MAL
html += `<button onclick="func('${id}')">Click</button>`;

// ✅ BIEN
html += `<button class="mi-btn" data-id="${escapeHtml(id)}">Click</button>`;
// ... después del innerHTML:
container.addEventListener('click', function(e) {
  const btn = e.target.closest('.mi-btn');
  if (btn) func(btn.dataset.id);
});
```

Usar `._bound` flag para evitar duplicados en re-renders:
```javascript
if (!container._miBound) {
  container._miBound = true;
  container.addEventListener('click', handler);
}
```

### Chart.js — Destroy Before Create
```javascript
if (CH['mi-chart']) CH['mi-chart'].destroy();
CH['mi-chart'] = new Chart(ctx, config);
```

### Persistencia
```javascript
// Guardar (write-through)
DB.set('gf_mi_key', datos);

// Leer
const datos = DB.get('gf_mi_key') || [];
```

---

## 3.2 Cómo Agregar una Vista Nueva

### Paso 1: Definir en NAV_STRUCTURE
```javascript
// js/core/nav-structure.js
// Dentro de la sección correspondiente de la empresa:
{id: 'mi_vista', label: 'Mi Vista', icon: '📊'}
```

### Paso 2: Crear el div en index.html
```html
<div id="view-mi_vista" class="view">
  <!-- Contenido se renderiza dinámicamente -->
</div>
```

### Paso 3: Registrar handler
```javascript
// En el archivo JS del módulo:
registerView('mi_vista', function() {
  return _syncAll().then(() => {
    const el = document.getElementById('view-mi_vista');
    if (!el) return;

    const data = DB.get('gf_mi_key') || [];
    el.innerHTML = `
      <div class="kpi-row c3">
        ${UI.kpiCard({label: 'Total', value: fmt(total), color: 'blue'})}
      </div>
      <div class="tw">
        <div class="tw-h"><div class="tw-ht">Mi Tabla</div></div>
        <table class="bt">...</table>
      </div>
    `;
  });
});
```

### Paso 4: Agregar título en VT
```javascript
// js/core/router.js
const VT = {
  // ...
  mi_vista: 'Mi Nueva Vista',
};
```

---

## 3.3 Cómo Agregar un Tool de IA

### Paso 1: Definir el tool
```javascript
// lib/tools.js
{
  name: 'mi_tool',
  description: 'Descripción en español de qué hace el tool',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Descripción del parámetro' }
    }
  }
}
```

### Paso 2: Implementar ejecución
```javascript
// lib/tool-executors.js, dentro del switch:
case 'mi_tool': {
  const data = await getAppData('gf_mi_key');
  if (!data) return { error: 'Sin datos disponibles' };
  return truncateResult(data);
}
```

### Paso 3: Agregar permisos
```javascript
// lib/permissions.js
const TOOL_PERMS = {
  // ...
  'mi_tool': ['mi_vista', 'otra_vista'],  // módulos requeridos
  // null = solo admin
  // undefined = sin restricción
};
```

---

## 3.4 Cómo Agregar una Nueva Key de Datos

### Paso 1: Registrar en APP_KEYS
```javascript
// js/core/supabase.js
const APP_KEYS = [
  // ... existentes ...
  'gf_mi_nueva_key',
];
```

### Paso 2: Usar en el código
```javascript
// Guardar
DB.set('gf_mi_nueva_key', datos);

// Leer
const datos = DB.get('gf_mi_nueva_key') || valorDefault;
```

### Paso 3: (Opcional) Seed en Supabase
```sql
-- supabase-setup.sql
INSERT INTO app_data (key, value) VALUES ('gf_mi_nueva_key', '[]'::jsonb);
```

---

## 3.5 Cómo Crear Charts

```javascript
// 1. HTML container
const html = UI.chartPanel({
  id: 'c-mi-chart',
  title: 'Mi Gráfica',
  subtitle: 'Datos mensuales',
  height: 240
});

// 2. Render después de insertar HTML
setTimeout(() => {
  const ctx = document.getElementById('c-mi-chart');
  if (!ctx) return;

  // Destruir si existe
  if (CH['mi-chart']) CH['mi-chart'].destroy();

  const isDark = document.body.classList.contains('dark');
  const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tc = isDark ? '#9da0c5' : '#8b8fb5';

  CH['mi-chart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MO, // ['Ene','Feb',...,'Dic']
      datasets: [{
        label: 'Ingresos',
        data: [10000, 20000, ...],
        backgroundColor: 'rgba(0,115,234,.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: tc, font: { size: 11 } } } },
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc } },
        y: { grid: { color: gc }, ticks: { color: tc, callback: v => '$' + Number(v).toLocaleString('es-MX') } }
      }
    }
  });
}, 80);
```

---

## 3.6 Flujo de Datos: Créditos → P&L

```
gf_cred_end / gf_cred_dyn (localStorage)
  ↓ fiInjectCredits() [flujo-engine.js]
  ↓ Calcula intereses mensuales por crédito activo
  ↓ Crea filas automáticas en FI_ROWS (auto=true)
  ↓ syncFlujoToRecs() [flujo-engine.js]
  ↓ Convierte FI_ROWS → S.recs (tipo='ingreso', cat='Crédito Simple')
  ↓ rPL('end') [pl-engine.js]
  ↓ Lee S.recs filtradas por entidad → renderiza P&L
```

## 3.7 Flujo de Datos: TPV → P&L

```
Supabase: tpv_transactions
  ↓ TPV.calcMonthlyPL(year) [tpv-data.js]
  ↓ Consulta RPC tpv_kpis por mes
  ↓ fiInjectTPV() [flujo-engine.js]
  ↓ Crea filas auto en FI_ROWS (com_salem) y FG_ROWS (com_comisionista)
  ↓ syncFlujoToRecs()
  ↓ S.recs → rPL('sal')
```

## 3.8 Flujo de Datos: Nómina → P&L

```
gf_nomina (localStorage)
  ↓ NOM_EDIT array con empleados
  ↓ _nomDist(empresa, empleado, mes, year) [data-constants.js]
  ↓ Distribuye sueldo por % entre empresas
  ↓ Se inyecta como gasto en S.recs con cat='Nómina'
  ↓ _isCostRow() determina si es 'Nómina Operativa' (costo) o 'Nómina Administrativa' (gasto)
  ↓ Afecta Margen Operativo o EBITDA según clasificación
```

---

## 3.9 Anti-Patrones (NO hacer)

1. **NO usar frameworks** (React, Vue, Angular)
2. **NO usar npm para frontend** — las libs se cargan por CDN
3. **NO usar Express/Fastify** — backend es `http` nativo
4. **NO insertar HTML sin escapar** — siempre `escapeHtml()`
5. **NO usar inline handlers con variables** — usar event delegation
6. **NO guardar datos filtrados** — siempre persistir dataset completo
7. **NO crear charts sin destruir anterior** — memory leak
8. **NO agregar keys sin registrar en APP_KEYS**
9. **NO hacer queries SQL directas** — usar Supabase REST/RPC
10. **NO exponer secrets** en logs, URLs, o respuestas HTTP
11. **NO modificar múltiples chats del proyecto simultáneamente** — un solo chat activo
12. **NO usar `eval()` o `new Function()`** — CSP bloquea `unsafe-eval`

---

## 3.10 Checklist de Calidad

Antes de hacer deploy:
- [ ] `escapeHtml()` en todo dato de usuario insertado en HTML
- [ ] Event delegation con `data-*` en vez de inline handlers con variables
- [ ] Charts destruidos antes de recrear
- [ ] Datos completos guardados (no filtrados)
- [ ] Nuevas keys registradas en APP_KEYS
- [ ] Nuevas vistas registradas en NAV_STRUCTURE + VIEW_REGISTRY + VT
- [ ] Sin `console.log` en producción (solo `console.warn`/`error` con contexto)
- [ ] Responsive: probado en 1200px, 768px, 480px
- [ ] Dark mode: colores usan CSS variables (no hardcoded)
- [ ] Rate limiting en nuevos endpoints
- [ ] Auth (`requireAuth`) en endpoints con datos sensibles

---

## 3.11 Troubleshooting

### La sincronización falla
- Verificar conexión a internet
- Abrir consola (F12) → buscar errores `[SB]` o `[sync]`
- El indicador de sync en el topbar muestra: 🟢 ok, 🔴 error, 🟠 offline
- Si persiste: recargar página (F5). Los datos locales se mantienen en localStorage

### Un chart no renderiza
- Verificar que el canvas element existe (`document.getElementById('c-xxx')`)
- Verificar que el chart anterior fue destruido: `if(CH['key']) CH['key'].destroy()`
- Abrir consola → buscar errores de Chart.js
- Causa común: el view no está visible cuando se intenta renderizar

### Los datos del P&L no cuadran
- Verificar que `syncFlujoToRecs()` se ejecutó (console: `S.recs.length`)
- Verificar inyecciones: `fiInjectTPV()`, `fiInjectCredits()`, `ceInjectGastos()`
- Verificar año activo: `_year` debe coincidir con el año de los datos
- Verificar periodo activo: `_gfPeriod[ent]` puede estar filtrando meses

### El bot IA no responde
- Verificar que `ANTHROPIC_API_KEY` está configurado en el servidor
- Verificar la cookie JWT: si expiró (24h), hacer logout/login
- Abrir consola → buscar errores `[AI Chat]`
- Verificar rate limiting: máximo 15 requests/minuto

### Error "Error procesando solicitud" en el bot
- El servidor ahora devuelve el mensaje de error real
- Causas comunes: Supabase no configurado, API key inválida, timeout (>60s)
- Verificar logs del servidor en Railway

### Un cliente no aparece en TPV
- Verificar que existe en `tpv_clients` (Comisiones → buscar)
- Verificar que sus transacciones tienen `cliente_id` correcto (no NULL)
- Si el nombre cambió, las transacciones antiguas mantienen el nombre original

---

## 3.12 Backup y Recovery

### Supabase
- **Backups automáticos**: Supabase Pro incluye daily backups con 7 días de retención
- **Point-in-time recovery**: Disponible en plan Pro (restore a cualquier punto en las últimas 24h)
- **Export manual**: Dashboard de Supabase → SQL Editor → `SELECT * FROM app_data` → Export CSV

### localStorage
- Los datos locales son una **copia** de Supabase. Si se corrompen, borrar localStorage del navegador y recargar — `SB.pullAll()` restaura todo desde Supabase
- Para borrar: F12 → Application → Local Storage → click derecho → Clear

### Auditoría de cambios
- `app_data.updated_at`: timestamp del último cambio por key
- `app_data.updated_by`: CLIENT_ID del dispositivo que hizo el cambio
- No hay historial de versiones por key (solo último estado)
- **Recomendación futura**: Implementar tabla `app_data_history` con trigger para auditoría completa

---

# Parte 4: Referencia Rápida

## 4.1 Mapa de Archivos

```
/
├── index.html                 # SPA (4,650 líneas)
├── server.js                  # Backend HTTP (438 líneas)
├── security.js                # Seguridad (279 líneas)
├── package.json               # 2 dependencias
├── Dockerfile                 # Node 18 Alpine
├── AGENTS.md                  # Guía para agentes IA
├── MANUAL.md                  # Este archivo
│
├── lib/                       # Backend (NO servido)
│   ├── ai-chat.js             # Anthropic integration (151)
│   ├── tools.js               # 20 tool definitions (178)
│   ├── tool-executors.js      # Tool execution (454)
│   ├── permissions.js         # RBAC (77)
│   └── supabase-helpers.js    # REST helpers (82)
│
├── js/core/                   # Infraestructura frontend
│   ├── storage.js             # DB wrapper (42)
│   ├── supabase.js            # Sync engine (448)
│   ├── login.js               # Auth flow (283)
│   ├── helpers.js             # Utilidades globales
│   ├── nav-structure.js       # NAV_STRUCTURE
│   ├── router.js              # VIEW_REGISTRY + routing
│   └── auth.js                # Gestión usuarios
│
├── js/shared/                 # Código compartido
│   ├── chart-helpers.js       # Charts P&L y evolución (378)
│   ├── compare-engine.js      # Motor de comparación periodos (101)
│   ├── data-constants.js      # Constantes (NOM, GCOMP, WB) (189)
│   ├── flujo-engine.js        # Motor flujo de caja (478)
│   ├── period-filter.js       # Filtros de periodo (210)
│   ├── pl-engine.js           # Motor P&L (1,249)
│   ├── ui-components.js       # Modal, toast, exports (881)
│   └── ui-kit.js              # KPI cards, tables (308)
│
├── js/features/               # Un directorio por módulo
│   ├── creditos/
│   │   ├── credit-carga.js        # Carga de créditos PDF (390)
│   │   ├── credit-cobranza.js     # Cobranza (231)
│   │   ├── credit-dashboard.js    # Dashboard créditos (569)
│   │   ├── credit-detail.js       # Detalle de crédito (646)
│   │   └── credit-engine.js       # Motor de cálculo (149)
│   ├── tpv/
│   │   ├── tpv-agentes.js         # Comisiones agentes (367)
│   │   ├── tpv-comisiones.js      # Config comisiones (474)
│   │   ├── tpv-dashboard.js       # Dashboard por periodo (295)
│   │   ├── tpv-data.js            # Data layer TPV (603)
│   │   ├── tpv-facturacion.js     # Facturación TPV (1,084)
│   │   ├── tpv-general.js         # Dashboard general (415)
│   │   ├── tpv-pagos.js           # Control de pagos (730)
│   │   ├── tpv-promotores.js      # Promotores (307)
│   │   ├── tpv-resumen.js         # Resumen por cliente (224)
│   │   ├── tpv-terminales.js      # Terminales (185)
│   │   └── tpv-upload.js          # Carga de datos (908)
│   ├── tarjetas/
│   │   ├── tarjetas-charts.js     # Charts y categorías (728)
│   │   ├── tarjetas-data.js       # Data layer tarjetas (137)
│   │   └── tarjetas-upload.js     # Carga de datos (441)
│   ├── wirebit/
│   │   ├── wirebit-data.js        # Fees y datos (777)
│   │   ├── wirebit-upload.js      # Carga de fees (421)
│   │   └── wirebit-views.js       # Vistas cripto/tarjetas (139)
│   ├── finanzas/
│   │   ├── carga-masiva.js        # Upload masivo CSV (397)
│   │   ├── flujo-gastos.js        # Flujo de gastos (242)
│   │   ├── flujo-ingresos.js      # Flujo de ingresos (165)
│   │   ├── gastos-comp.js         # Gastos compartidos (144)
│   │   └── nomina.js              # Nómina (452)
│   ├── dashboard/             # inicio.js, resumen.js, inversiones.js
│   ├── tesoreria/             # tesoreria.js
│   ├── facturacion/           # facturacion-empresa.js, facturacion-egresos.js
│   ├── expedientes/           # expedientes.js
│   ├── tickets/               # tickets.js
│   ├── config/                # config.js
│   └── ai-chat/               # ai-chat.js
│
├── assets/css/
│   └── styles.css             # Estilos globales + dark mode
│
├── ticket.html                # Formulario público (399)
└── flujograma.html            # Diagrama de flujo (629)
```

## 4.2 Funciones Globales

### Formateo
| Función | Uso | Ejemplo |
|---------|-----|---------|
| `fmt(n)` | Moneda | `fmt(123456)` → `$123,456` |
| `fmtK(n)` | Moneda abreviada | `fmtK(1234567)` → `$1,234K` |
| `fmtFull(n)` | Moneda con decimales | `fmtFull(123.456)` → `$123.46` |
| `pct(p)` | Porcentaje | `pct(0.125)` → `12.5%` |
| `escapeHtml(s)` | Escapar HTML | `escapeHtml('<script>')` → `&lt;script&gt;` |

### Navegación
| Función | Uso |
|---------|-----|
| `navTo(viewId)` | Navegar a vista |
| `selectCompany(id)` | Seleccionar empresa |
| `selectSection(id)` | Seleccionar sección |
| `selectView(id)` | Seleccionar vista |
| `navHome()` | Ir al inicio |

### Datos
| Función | Uso |
|---------|-----|
| `DB.get(key)` | Leer de localStorage |
| `DB.set(key, val)` | Guardar (write-through) |
| `SB.pullAll()` | Descargar todo de Supabase |
| `SB.pushKey(key)` | Subir key a Supabase |

### UI
| Función | Uso |
|---------|-----|
| `openModal(id, title?, html?)` | Abrir modal |
| `closeModal()` | Cerrar modal |
| `toast(msg)` | Notificación (3.2s) |
| `customConfirm(msg, btnText, cb)` | Diálogo de confirmación |
| `isViewer()` | ¿Usuario es viewer? |
| `isLoggedIn()` | ¿Hay sesión activa? |
| `getCurrentUser()` | Obtener usuario actual |

### Constantes
| Constante | Contenido |
|-----------|-----------|
| `MO` | `['Ene','Feb',...,'Dic']` |
| `MN` | `['Enero','Febrero',...,'Diciembre']` |
| `ENT_COLOR` | `{Salem:'#0073ea', Endless:'#00b875', ...}` |
| `CATS_ING` | Categorías de ingresos |
| `CATS_GAS` | Categorías de gastos |
| `CH` | Objeto con instancias Chart.js |

## 4.3 Variables CSS

### Colores principales
```css
--blue: #0073ea;    --green: #00b875;   --red: #e53935;
--orange: #ff7043;  --purple: #9b51e0;  --yellow: #ffa000;
```

### Cada color tiene 3 variantes
```css
--blue:    #0073ea;  /* color principal */
--blue-lt: #d4e8ff;  /* light (badges, borders) */
--blue-bg: #ebf4ff;  /* background (hover, cards) */
```

### Layout
```css
--bg: #f4f6fb;      /* fondo general */
--white: #fff;       /* fondo cards */
--border: #e4e8f4;   /* bordes */
--text: #1a1c2e;     /* texto principal */
--text2: #444669;    /* texto secundario */
--muted: #8b8fb5;    /* texto desvanecido */
--r: 8px;            /* border-radius normal */
--rlg: 12px;         /* border-radius grande */
```

### Clases de componentes
| Clase | Uso |
|-------|-----|
| `.kpi-row` | Grid de KPI cards (4 columnas) |
| `.kpi-row.c3` | Grid de 3 columnas |
| `.kpi-card` | Card individual |
| `.tw` | Table wrapper (background + border) |
| `.tw-h` | Table header |
| `.bt` | Base table |
| `.cc` | Chart card container |
| `.btn` | Botón base |
| `.btn-blue` | Botón azul (primario) |
| `.btn-out` | Botón outline |
| `.fi` | Input field |
| `.fs` | Select field |
| `.mo` | Celda monetaria (text-align: right) |
| `.pos` | Valor positivo (verde) |
| `.neg` | Valor negativo (rojo) |
| `.bld` | Texto bold |

---

## 4.4 Entidades del Negocio

| ID | Key Prefix | Nombre | Color | Negocio |
|----|-----------|--------|-------|---------|
| `sal` | `sal_` | Salem Internacional | `#0073ea` | TPV, Tarjetas CENTUM |
| `end` | `end_` | Endless Capital | `#00b875` | Créditos simples |
| `dyn` | `dyn_` | Dynamo Financiera | `#ff7043` | Créditos simples |
| `wb` | `wb_` | Wirebit | `#9b51e0` | Crypto exchange |
| `stel` | `stel_` | Stellaris | `#e53935` | Fintech |
| `centum` | — | Centum Capital | — | Consolidado (sal+end+dyn) |
| `grupo` | — | Grupo Financiero | — | Consolidado total |

---

*Última actualización: 2026-03-31*
