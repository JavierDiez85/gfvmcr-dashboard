# Grupo Financiero VMCR — Dashboard 2026

Dashboard financiero para Grupo Financiero VMCR.  
Incluye P&L por empresa, Tesorería, Terminales TPV, Tarjetas y Créditos.

## Estructura del proyecto

```
gfvmcr/
├── index.html              — Aplicación principal
├── assets/
│   └── css/
│       └── styles.css      — Estilos globales
└── js/
    ├── core/
    │   ├── storage.js      — Capa de datos (localStorage → API futura)
    │   ├── helpers.js      — Utilidades: formato, toast, modales
    │   ├── router.js       — Navegación entre vistas
    │   └── auth.js         — Usuarios y permisos
    └── modules/
        ├── dashboard.js    — Dashboard grupo, KPIs consolidados
        ├── finanzas.js     — P&L por empresa, nómina, flujos
        ├── creditos.js     — Carteras de crédito, carga PDF
        ├── terminales.js   — TPV, pagos, comisiones
        ├── tesoreria.js    — Flujo de caja, bancos, consolidado
        └── config.js       — Categorías P&L, apariencia
```

## Cómo ejecutar localmente

Abre `index.html` directamente en tu navegador, o usa un servidor local:

```bash
# Con Python (viene instalado en Mac/Linux)
python3 -m http.server 8000
# Luego abre: http://localhost:8000
```

## Roadmap

- [ ] Conectar base de datos (API REST)
- [ ] Login con autenticación real
- [ ] Deploy en servidor privado
- [ ] Integración GitHub Actions para deploy automático
