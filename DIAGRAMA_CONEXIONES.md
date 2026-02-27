# GFVMCR — Diagrama de Conexiones de Datos
> Generado: 2026-02-27 | Referencia para debugging de flujos

---

## FUENTES DE DATOS (Carga)

| # | Fuente | Tipo | Archivo/Handler | Almacena en |
|---|--------|------|-----------------|-------------|
| F1 | Upload TPV Transacciones | Excel | `startTxnUpload()` | `vmcr_tpv_*` |
| F2 | Upload TPV Config | Excel | `startCfgUpload()` | `vmcr_tpv_*` |
| F3 | Upload Tarjetas CENTUM | Excel | `startTarUpload()` | localStorage tarjetas |
| F4 | Upload Wirebit | Excel | `startWBUpload()` | `vmcr_wb_fees_2026` |
| F5 | Upload Tesoreria | Excel | `tesSubirExcel()` | `vmcr_tesoreria` |
| F6 | Upload Creditos PDF | PDF | `rCargaCreditos()` | `vmcr_cred_end`, `vmcr_cred_dyn` |
| F7 | Carga Masiva | Excel | `startCargaMasiva()` | `vmcr_fi`, `vmcr_fg` |
| F8 | Flujo Ingresos (manual) | Formulario | `fiSave()` | `vmcr_fi` |
| F9 | Flujo Gastos (manual) | Formulario | `fgSave()` | `vmcr_fg` |
| F10 | Nomina (manual) | Formulario | `nomSave()` | `vmcr_nom` |
| F11 | Gastos Compartidos (manual) | Formulario | `gcSave()` | `vmcr_gc` |
| F12 | Supabase Pull | API | `SB.pullAll()` | Todos los keys |

---

## ALMACENES DE DATOS (Variables Globales)

| # | Variable | Contenido | Persistencia (localStorage) |
|---|----------|-----------|---------------------------|
| D1 | `S.recs` | Master P&L (todos los registros) | `vmcr4` |
| D2 | `FI_ROWS` | Filas de ingresos (manual+auto) | `vmcr_fi` |
| D3 | `FG_ROWS` | Filas de gastos (manual+auto) | `vmcr_fg` |
| D4 | `END_CREDITS` | Creditos Endless | `vmcr_cred_end` |
| D5 | `DYN_CREDITS` | Creditos Dynamo | `vmcr_cred_dyn` |
| D6 | `WB_ING` | Ingresos Wirebit por concepto | `vmcr_wb_fees_2026` |
| D7 | `WB_COSTOS` | Costos Wirebit por concepto | (calculado de D6) |
| D8 | `WB_ING_TOTAL` | Total ingresos WB mensual | (calculado de D6) |
| D9 | `WB_COSTO_TOTAL` | Total costos WB mensual | (calculado de D7) |
| D10 | `NOM_EDIT` | Nomina empleados + distribucion | `vmcr_nom` |
| D11 | `GC_EDIT` | Gastos compartidos + distribucion | `vmcr_gc` |
| D12 | TPV data (Supabase cache) | Comisiones terminales | `vmcr_tpv_monthly_pl_*` |
| D13 | `WB_NOM_TOTAL` | Nomina Wirebit mensual | (calculado de D10) |
| D14 | Tesoreria movimientos | Flujo caja por banco | `vmcr_tesoreria` |
| D15 | Bancos y cuentas | Lista bancos | `vmcr_bancos` |

---

## PIPELINE DE SINCRONIZACION (`_syncAll()`)

```
_syncAll() [router.js]
  |
  |-- wbLoadFees()           F4 --> D6,D7,D8,D9
  |-- DB.get('vmcr_cred_end') F6 --> D4
  |-- DB.get('vmcr_cred_dyn') F6 --> D5
  |-- fiLoad()                F8 --> D2
  |-- fgLoad()                F9 --> D3
  |-- TPV.calcMonthlyPL()     F1 --> D12 (async Supabase)
  |-- fiInjectTPV()           D12 --> D2 (auto rows) + D3 (comisiones)
  |-- fiInjectCredits()       D4+D5 --> D2 (intereses auto)
  |-- syncFlujoToRecs()       D2+D3+D6+D7 --> D1
```

---

## VISTAS Y COMPONENTES NUMERADOS

### V1 — Panel de Control (`inicio`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V1.K1 | Saldo Consolidado | KPI | D14 | OK |
| V1.K2 | Flujo Neto Mes | KPI | D14 | OK |
| V1.K3 | Ingresos Mes | KPI | D1 | OK |
| V1.K4 | Gastos Mes | KPI | D1 | OK |
| V1.C1 | Flujo Tesoreria | Chart line | D14 | OK |
| V1.C2 | Ingresos por Empresa | Chart bar | D1 | OK |
| V1.C3 | Gastos por Empresa | Chart doughnut | D1 | OK |
| V1.C4 | Nomina por Empresa | Chart bar | D10 | OK |
| V1.C5 | Margen por Empresa | Chart bar | D1 | OK |
| V1.T1 | Tareas pendientes | Lista | `vmcr_tareas` | OK |

### V2 — Dashboard Grupo (`resumen`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V2.K1 | Ingresos Grupo | KPI | D1 | OK |
| V2.K2 | Gastos Grupo | KPI | D1 | OK |
| V2.K3 | Nomina Total | KPI | D10 | OK |
| V2.K4 | Margen Total | KPI | D1 calc | OK |
| V2.C1 | Ing vs Gas mensual | Chart bar | D1 | OK |
| V2.T1 | Resumen por empresa | Cards | D1 | OK |

### V3 — Centum Capital (`centum`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V3.K1 | Ingresos Centum | KPI `centum-k-ing` | D1 (Sal+End+Dyn) | OK |
| V3.K2 | Gastos Centum | KPI `centum-k-gas` | D1 (Sal+End+Dyn) | OK |
| V3.K3 | Cartera Credito | KPI `centum-kpi-cartera` | D4+D5 | OK (recien fijado) |
| V3.K4 | Nomina Asignada | KPI `centum-kpi-nomina` | D10 | OK |
| V3.C1 | Ingresos por Entidad | Chart bar apilado | D1 | OK (recien fijado) |
| V3.C2 | Cartera por Entidad | Chart doughnut | D4+D5 | OK (recien fijado) |
| V3.T1 | Estado Resultados | Tabla | D1 | OK |
| V3.B1 | Card Salem | Boton navTo | sal_res | OK |
| V3.B2 | Card Endless | Boton navTo | end_res | OK |
| V3.B3 | Card Dynamo | Boton navTo | dyn_res | OK |

### V4 — Grupo Financiero (`grupo`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V4.K1 | Ingresos Grupo | KPI `grupo-k-ing` | D1 (todos) | OK |
| V4.K2 | Gastos Grupo | KPI `grupo-k-gas` | D1 (todos) | OK |
| V4.K3 | Nomina Total | KPI `grupo-kpi-nomina` | D10 | OK |
| V4.C1 | Ingresos 4 entidades | Chart bar apilado | D1 | OK (recien fijado) |
| V4.C2 | Nomina por Entidad | Chart doughnut | D10 | OK |
| V4.T1 | Estado Resultados | Tabla consolidado | D1 | OK |
| V4.B1 | Card Salem | Boton navTo | sal_res | OK |
| V4.B2 | Card Endless | Boton navTo | end_res | OK |
| V4.B3 | Card Dynamo | Boton navTo | dyn_res | OK |
| V4.B4 | Card Wirebit | Boton navTo | wb_res | OK |

### V5 — Salem P&L (`sal_res`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V5.K1 | Ingresos Real | KPI `sal-k-ing` | D1 (Salem ingreso) | OK |
| V5.K2 | Gastos Operativos | KPI `sal-k-gas` | D1 (Salem gasto) | OK |
| V5.K3 | Nomina Asignada | KPI | D10 | OK |
| V5.C1 | Gastos por Categoria | Chart bar | D1 (gastos Salem) | PARCIAL — datos hardcodeados a 0 |
| V5.C2 | TPV Clientes | Chart doughnut | D12 | PARCIAL — "Sin datos" placeholder |
| V5.T1 | Estado Resultados | Tabla P&L | D1 | OK |
| V5.B1 | Ver Cartera (no aplica) | — | — | — |

### V6 — Salem TPV (`sal_tpv`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V6.T1 | Tabla clientes x mes | Tabla | SAL_TPV_CLIENTES | PENDIENTE — datos hardcodeados |

### V7 — Salem Gastos (`sal_gas`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V7.T1 | Tabla gastos x mes | Tabla | SAL_GASTOS_ITEMS | PENDIENTE — datos hardcodeados |

### V8 — Endless P&L (`end_res`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V8.K1 | Cartera Total | KPI `end-kpi-cartera` | D4 | OK (recien fijado) |
| V8.K2 | Ingresos Real | KPI `end-k-ing` | D1 (End ingreso) | OK (recien fijado) |
| V8.K3 | Pipeline | KPI `end-kpi-pipeline` | D4 prospectos | OK (recien fijado) |
| V8.C1 | Gastos Operativos | Chart bar | D1 (gastos End) | OK (recien fijado) |
| V8.C2 | Cartera Status | Chart doughnut | D4 | OK (recien fijado) |
| V8.T1 | Estado Resultados | Tabla P&L | D1 | OK |
| V8.B1 | Ver Cartera | Boton navTo | end_cred | OK |

### V9 — Endless Cartera (`end_cred`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V9.K1-5 | KPIs cartera | KPIs `end-dash-kpis` | D4 | OK |
| V9.T1 | Lista creditos | Cards | D4 | OK |
| V9.B1 | Cargar PDF | Boton navTo | carga_creditos | OK |

### V10 — Dynamo P&L (`dyn_res`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V10.K1 | Cartera Total | KPI `dyn-kpi-cartera` | D5 | OK (recien fijado) |
| V10.K2 | Ingresos Real | KPI `dyn-k-ing` | D1 (Dyn ingreso) | OK (recien fijado) |
| V10.K3 | Pipeline | KPI `dyn-kpi-pipeline` | D5 prospectos | OK (recien fijado) |
| V10.C1 | Gastos Operativos | Chart bar | D1 (gastos Dyn) | OK (recien fijado) |
| V10.C2 | Cartera Status | Chart doughnut | D5 | OK (recien fijado) |
| V10.T1 | Estado Resultados | Tabla P&L | D1 | OK |
| V10.B1 | Ver Cartera | Boton navTo | dyn_cred | OK |

### V11 — Dynamo Cartera (`dyn_cred`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V11.K1-5 | KPIs cartera | KPIs `dyn-dash-kpis` | D5 | OK |
| V11.T1 | Lista creditos | Cards | D5 | OK |
| V11.B1 | Cargar PDF | Boton navTo | carga_creditos | OK |

### V12 — Wirebit P&L (`wb_res`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V12.K1 | Ingresos Real | KPI `wb-k-ing` | D1 (WB ingreso) | OK |
| V12.K2 | Gastos | KPI `wb-k-gas` | D1 (WB gasto) | OK |
| V12.K3 | Nomina | KPI `wb-kpi-nomina` | D10 | OK |
| V12.C1 | Ingresos vs Costos | Chart line | D8,D9 | OK |
| V12.C2 | Fuentes Ingreso | Chart doughnut | D6 | OK |
| V12.T1 | Estado Resultados | Tabla P&L | D1 | OK |

### V13 — Wirebit Ingresos (`wb_ing`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V13.K1 | Total Ingresos | KPI | D6 sum | OK |
| V13.K2 | Crecimiento | KPI | D6 calc | OK |
| V13.K3 | Periodo Inicio | KPI | D6[0] | OK |
| V13.C1 | Ingresos 2026 | Chart bar | D6 | OK |
| V13.C2 | Mix Ingresos | Chart doughnut | D6 | OK |
| V13.T1 | Tabla detalle | Tabla | D6 desglose | OK |

### V14 — Wirebit Nomina (`wb_nom`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V14.K1 | Total Nomina | KPI | WB_NOM_DETAIL | OK |
| V14.K2 | Empleados | KPI | count | OK |
| V14.K3 | Promedio | KPI | avg | OK |
| V14.T1 | Tabla detalle | Tabla | WB_NOM_DETAIL | OK |

### V15 — Creditos Dashboard (`cred_dash`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V15.K1-6 | KPIs consolidados | KPIs | D4+D5 | OK |
| V15.C1 | Status creditos | Chart bar | D4+D5 | OK |
| V15.C2 | Distribucion entidad | Chart doughnut | D4+D5 | OK |
| V15.T1 | Lista todos creditos | Tabla | D4+D5 | OK |
| V15.B1 | Card Endless | Boton navTo | end_cred | OK |
| V15.B2 | Card Dynamo | Boton navTo | dyn_cred | OK |

### V16 — Creditos Cobranza (`cred_cobr`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V16.K1-4 | KPIs cobranza | KPIs | D4+D5 pagos | OK |
| V16.C1 | Status cobranza | Chart bar | D4+D5 | OK |
| V16.C2 | Cartera vencida | Chart doughnut | D4+D5 | OK |
| V16.T1 | Tabla cobranza | Tabla | D4+D5 | OK |

### V17 — Nomina Compartida (`nomina`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V17.K1-6 | KPIs nomina | KPIs | D10 | OK |
| V17.T1 | Tabla empleados | Tabla editable | D10 | OK |
| V17.B1 | Guardar | Boton | nomSave() | OK |

### V18 — Gastos Compartidos (`gastos_comp`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V18.K1-5 | KPIs gastos comp | KPIs | D11 | OK |
| V18.T1 | Tabla gastos | Tabla editable | D11 | OK |
| V18.B1 | Guardar | Boton | gcSave() | OK |

### V19 — Flujo Ingresos (`flujo_ing`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V19.K1-6 | KPIs por empresa | KPIs | D2 | OK |
| V19.T1 | Tabla flujo | Tabla editable | D2 | OK |
| V19.B1 | Guardar | Boton | fiSave() | OK |
| V19.B2 | Exportar Excel | Boton | fiExport() | OK |
| V19.B3 | Agregar fila | Boton | fiAdd() | OK |

### V20 — Flujo Gastos (`flujo_gas`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V20.K1-6 | KPIs por empresa | KPIs | D3 | OK |
| V20.T1 | Tabla flujo | Tabla editable | D3 | OK |
| V20.B1 | Guardar | Boton | fgSave() | OK |
| V20.B2 | Exportar Excel | Boton | fgExport() | OK |
| V20.B3 | Agregar fila | Boton | fgAdd() | OK |

### V21-V27 — TPV/Terminales
| # | Vista | KPIs | Charts | Tablas | Estado |
|---|-------|------|--------|--------|--------|
| V21 | TPV General (`tpv_general`) | 4 KPIs | Top10 bar + Pie mix | Tabla general | OK |
| V22 | TPV Dashboard (`tpv_dashboard`) | 4 KPIs | Daily top + Pie + Line | Tabla periodo | OK |
| V23 | TPV Pagos (`tpv_pagos`) | 3 KPIs | — | Tabla pagos editable | OK |
| V24 | TPV Resumen (`tpv_resumen`) | 4 KPIs | — | Tabla resumen cliente | OK |
| V25 | TPV Agentes (`tpv_agentes`) | 3 KPIs | Bar agentes | Tabla agentes | OK |
| V26 | TPV Terminales (`tpv_terminales`) | 3 KPIs | Top bar + Status pie | Tabla terminales | OK |
| V27 | TPV Cambios (`tpv_cambios`) | 2 KPIs | — | Tabla cambios | OK |

### V28 — TPV Comisiones Config (`tpv_comisiones`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V28.K1-4 | KPIs comisiones | KPIs | Config comisiones | OK |
| V28.T1 | Tabla config | Tabla editable | Rate config | OK |

### V29-V33 — Tarjetas CENTUM
| # | Vista | KPIs | Charts | Tablas | Estado |
|---|-------|------|--------|--------|--------|
| V29 | Dashboard (`tar_dashboard`) | 3 KPIs | Dias bar + Concepto pie | Tabla | OK |
| V30 | Conceptos (`tar_conceptos`) | 2 KPIs | Top10 bar + Monto/Txns | Tabla | OK |
| V31 | Subclientes (`tar_subclientes`) | 2 KPIs | Bar + Pie | Tabla | OK |
| V32 | Rechazos (`tar_rechazos`) | 2 KPIs | Bar + Pie | Tabla | OK |
| V33 | Tarjetahabientes (`tar_tarjetahabientes`) | 2 KPIs | Saldos doughnut | Tabla | OK |

### V34-V36 — Tesoreria
| # | Vista | KPIs | Charts | Tablas | Estado |
|---|-------|------|--------|--------|--------|
| V34 | Flujo Caja (`tes_flujo`) | 4 KPIs | Line flujo + Bar ing/gas | Tabla movimientos | OK |
| V35 | Por Empresa (`tes_individual`) | 4 KPIs | — | Tabla por empresa | OK |
| V36 | Consolidado (`tes_grupo`) | 4 KPIs | Bars + Pie | Tabla consolidado | OK |

### V37 — Carga Masiva (`carga_masiva`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V37.K1 | Ultima carga | KPI `cm-kpi-rows` | localStorage | OK |
| V37.K2 | Total Ingresos | KPI `cm-kpi-ing` | localStorage | OK |
| V37.K3 | Total Gastos | KPI `cm-kpi-gas` | localStorage | OK |
| V37.B1 | Descargar Plantilla | Boton | downloadPlantilla() | OK |
| V37.B2 | Subir Excel | Boton | startCargaMasiva() | OK |
| V37.T1 | Preview registros | Tabla | parsing result | OK |

### V38 — Carga Creditos PDF (`carga_creditos`)
| # | Componente | Tipo | Fuente Datos | Estado |
|---|-----------|------|-------------|--------|
| V38.B1 | Subir PDF | Boton file input | PDF.js parser | OK |
| V38.B2 | Importar a cartera | Boton | ccImport() | OK |
| V38.T1 | Preview amortizacion | Tabla | CC_PREVIEW | OK |
| V38.T2 | Historial imports | Tabla | CC_HISTORY | OK |

### V39-V42 — Upload views
| # | Vista | Upload Boton | Handler | Estado |
|---|-------|-------------|---------|--------|
| V39 | TPV Upload (`tpv_upload`) | Subir Excel | startTxnUpload() | OK |
| V40 | Tarjetas Upload (`tar_upload`) | Subir Excel | startTarUpload() | OK |
| V41 | Wirebit Upload (`wb_upload`) | Subir Excel | startWBUpload() | OK |

### V42-V46 — Configuracion
| # | Vista | Componentes | Estado |
|---|-------|------------|--------|
| V42 | Usuarios (`cfg_usuarios`) | Tabla + CRUD | OK |
| V43 | Apariencia (`cfg_apariencia`) | Theme selector | OK |
| V44 | Permisos (`cfg_permisos`) | Matriz permisos | OK |
| V45 | Categorias P&L (`cfg_categorias`) | 2 tablas editables | OK |
| V46 | Bancos (`cfg_bancos`) | Tabla + CRUD | OK |

---

## CONEXIONES PENDIENTES / PROBLEMAS CONOCIDOS

| # | Componente | Problema | Prioridad |
|---|-----------|----------|-----------|
| P1 | V5.C1 (Salem Gastos chart) | Datos hardcodeados `vals=[0,0,0,0,0,0,0]` — no lee de S.recs | MEDIA |
| P2 | V5.C2 (Salem TPV donut) | Placeholder "Sin datos" — no conectado a TPV data | MEDIA |
| P3 | V6.T1 (Salem TPV tabla) | Tabla con datos hardcodeados, no conectada a TPV real | MEDIA |
| P4 | V7.T1 (Salem Gastos tabla) | Tabla con datos hardcodeados, no conectada a FG_ROWS | MEDIA |
| P5 | V2 (Dashboard Grupo) | Faltan tarjetas de empresa Endless/Dynamo con datos | BAJA |
| P6 | Modales genericos | Algunos modales de detalle pueden no mostrar data real | BAJA |
| P7 | `fiInjectCredits()` | Usa formula simple `monto*tasa/12` en vez de tabla amortizacion | MEDIA |
| P8 | Creditos — mapeo calendario | Intereses llenan 12 meses iguales; deberia mapear periodos amort a meses reales | MEDIA |

---

## FLUJO COMPLETO POR ESCENARIO

### Escenario: "Subo un PDF de credito Dynamo"
```
F6 (PDF upload) --> rCargaCreditos() --> CC_PREVIEW
  --> ccImport('dyn') --> DYN_CREDITS (D5) --> DB.set('vmcr_cred_dyn')
  --> Al navegar a dyn_res:
      _syncAll() --> DB.get('vmcr_cred_dyn') --> D5
                 --> fiInjectCredits() --> D5 --> D2 (intereses auto)
                 --> syncFlujoToRecs() --> D2 --> D1
      rPL('dyn') --> D1 --> V10.T1 (tabla P&L)
                        --> V10.K1 (cartera), V10.K2 (ingresos)
      rPLCharts('dyn') --> D1+D5 --> V10.C1 (gastos bar), V10.C2 (cartera pie)
  --> Al navegar a centum:
      rConsolidado('centum') --> D1 --> V3.T1 (tabla), V3.K1-K4 (KPIs)
      rConsCharts('centum') --> D1+D4+D5 --> V3.C1 (bar), V3.C2 (pie)
```

### Escenario: "Subo un Excel de Wirebit"
```
F4 (Excel upload) --> startWBUpload() --> parse fees
  --> DB.set('vmcr_wb_fees_2026') --> D6,D7,D8,D9
  --> Al navegar a wb_res:
      _syncAll() --> wbLoadFees() --> D6 --> syncFlujoToRecs() --> D1
      rPL('wb') --> D1 --> V12.T1, V12.K1, V12.K2
      rPLCharts('wb') --> D6,D8,D9 --> V12.C1, V12.C2
  --> Al navegar a grupo:
      rConsolidado('grupo') --> D1 --> V4.T1, V4.K1-K2
      rConsCharts('grupo') --> D1 --> V4.C1 (4 entidades)
```

### Escenario: "Carga Masiva de ingresos y gastos"
```
F7 (Excel upload) --> startCargaMasiva() --> parse Ingresos+Gastos sheets
  --> validacion empresa/categoria
  --> FI_ROWS (D2) + FG_ROWS (D3)
  --> DB.set('vmcr_fi') + DB.set('vmcr_fg')
  --> syncFlujoToRecs() --> D1
  --> Al navegar a cualquier P&L:
      _syncAll() --> fiLoad() + fgLoad() --> D2+D3
      syncFlujoToRecs() --> D1
      rPL(ent) --> D1 --> tabla + KPIs
```

---

## COMO USAR ESTE DIAGRAMA

Para reportar un problema, usa el formato:
- "V8.K1 no muestra datos" = KPI Cartera Total en Endless P&L
- "V3.C2 no se actualiza" = Chart doughnut de cartera en Centum
- "Falta conexion entre F6 y V10.T1" = Los PDFs de credito no llegan a la tabla P&L de Dynamo
- "P1 pendiente" = El chart de gastos de Salem sigue hardcodeado
