/**
 * Tests: credit-engine.js — fórmulas financieras puras
 *
 * Estrategia: cargamos el IIFE con un mock de window para extraer
 * las funciones sin tocar el código fuente ni el DOM.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Cargar el IIFE en un window simulado ──────────────────────────────────────
const win = {};
const code = readFileSync(resolve(process.cwd(), 'js/features/creditos/credit-engine.js'), 'utf-8');
new Function('window', code)(win);

const {
  credParseDate, credFormatDate,
  credIntMes, credComApertura, credIngAnual,
  credPagoFijo, credTotalPagos, credTotalIntereses,
  credPeriodStatus, credTotalPagadoPeriodo,
  credDiasAtraso, credCobranzaResumen, credSaldoActual,
} = win;

// ── Fixture: crédito con tabla de amortización (sistema francés, 3 periodos) ─
// monto=10,000 tasa=24% anual → r=0.02/mes, pagoFijo≈368.72
const CREDIT = {
  monto: 10000,
  tasa: 24,
  com: 2,
  pagos: [],
  amort: [
    { periodo: 0, fecha: '01/01/2026', pago: 0,      capital: 0,      int: 0,   ivaInt: 0,  saldo: 10000   },
    { periodo: 1, fecha: '01/02/2026', pago: 368.72, capital: 168.72, int: 200, ivaInt: 32, saldo: 9831.28 },
    { periodo: 2, fecha: '01/03/2026', pago: 368.72, capital: 172.09, int: 196.63, ivaInt: 31.46, saldo: 9659.19 },
    { periodo: 3, fecha: '01/04/2026', pago: 368.72, capital: 175.54, int: 193.18, ivaInt: 30.91, saldo: 9483.65 },
  ],
};

// ── credParseDate ─────────────────────────────────────────────────────────────
describe('credParseDate', () => {
  test('parsea DD/MM/YYYY correctamente', () => {
    const d = credParseDate('15/03/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // marzo = 2
    expect(d.getDate()).toBe(15);
  });

  test('parsea DD/Mon/YYYY con mes en texto español', () => {
    const d = credParseDate('10/ene/2026');
    expect(d.getMonth()).toBe(0);
    const d2 = credParseDate('05/dic/2025');
    expect(d2.getMonth()).toBe(11);
  });

  test('parsea DD/Mon/YYYY con mes en texto inglés', () => {
    expect(credParseDate('01/apr/2026').getMonth()).toBe(3);
    expect(credParseDate('15/aug/2025').getMonth()).toBe(7);
  });

  test('retorna null con string vacío o null', () => {
    expect(credParseDate('')).toBeNull();
    expect(credParseDate(null)).toBeNull();
  });

  test('retorna null con formato inválido', () => {
    expect(credParseDate('2026-03-15')).toBeNull(); // no tiene 3 partes con /
    expect(credParseDate('15-03-2026')).toBeNull();
  });
});

// ── credFormatDate ────────────────────────────────────────────────────────────
describe('credFormatDate', () => {
  test('formatea correctamente con ceros a la izquierda', () => {
    const d = new Date(2026, 0, 5); // 5 enero 2026
    expect(credFormatDate(d)).toBe('05/01/2026');
  });

  test('retorna string vacío con null', () => {
    expect(credFormatDate(null)).toBe('');
    expect(credFormatDate(undefined)).toBe('');
  });

  test('round-trip parse → format', () => {
    const original = '23/11/2025';
    expect(credFormatDate(credParseDate(original))).toBe(original);
  });
});

// ── credIntMes ────────────────────────────────────────────────────────────────
describe('credIntMes', () => {
  test('usa primera fila de amort si existe', () => {
    expect(credIntMes(CREDIT)).toBe(200); // amort[1].int = 200
  });

  test('calcula monto*tasa/100/12 sin tabla de amort', () => {
    const c = { monto: 12000, tasa: 24 };
    expect(credIntMes(c)).toBeCloseTo(240, 2); // 12000 * 0.24 / 12 = 240
  });

  test('retorna 0 si faltan monto o tasa', () => {
    expect(credIntMes({ monto: 0, tasa: 24 })).toBe(0);
    expect(credIntMes({ monto: 10000, tasa: 0 })).toBe(0);
    expect(credIntMes({})).toBe(0);
  });
});

// ── credComApertura ───────────────────────────────────────────────────────────
describe('credComApertura', () => {
  test('calcula monto * com / 100', () => {
    expect(credComApertura({ monto: 10000, com: 2 })).toBeCloseTo(200, 2);
    expect(credComApertura({ monto: 50000, com: 1.5 })).toBeCloseTo(750, 2);
  });

  test('retorna 0 si com es 0 o undefined', () => {
    expect(credComApertura({ monto: 10000, com: 0 })).toBe(0);
    expect(credComApertura({ monto: 10000 })).toBe(0);
  });
});

// ── credIngAnual ──────────────────────────────────────────────────────────────
describe('credIngAnual', () => {
  test('suma int + ivaInt de toda la tabla de amort', () => {
    // (200+32) + (196.63+31.46) + (193.18+30.91) = 684.18
    const expected = (200 + 32) + (196.63 + 31.46) + (193.18 + 30.91);
    expect(credIngAnual(CREDIT)).toBeCloseTo(expected, 1);
  });

  test('usa fórmula simple sin tabla de amort', () => {
    const c = { monto: 12000, tasa: 24, com: 1 }; // intMes=240, comAp=120
    // 240*12 + 120 = 3000
    expect(credIngAnual(c)).toBeCloseTo(3000, 2);
  });
});

// ── credPagoFijo ──────────────────────────────────────────────────────────────
describe('credPagoFijo', () => {
  test('retorna pago de amort[1]', () => {
    expect(credPagoFijo(CREDIT)).toBeCloseTo(368.72, 2);
  });

  test('retorna 0 sin tabla de amort', () => {
    expect(credPagoFijo({ monto: 10000 })).toBe(0);
  });
});

// ── credTotalPagos / credTotalIntereses ───────────────────────────────────────
describe('credTotalPagos y credTotalIntereses', () => {
  test('suma todos los pagos de la tabla', () => {
    expect(credTotalPagos(CREDIT)).toBeCloseTo(368.72 * 3, 1);
  });

  test('suma todos los intereses de la tabla', () => {
    const expected = 200 + 196.63 + 193.18;
    expect(credTotalIntereses(CREDIT)).toBeCloseTo(expected, 1);
  });

  test('retorna 0 sin tabla', () => {
    expect(credTotalPagos({ monto: 10000 })).toBe(0);
    expect(credTotalIntereses({ monto: 10000 })).toBe(0);
  });
});

// ── credPeriodStatus ──────────────────────────────────────────────────────────
describe('credPeriodStatus', () => {
  beforeEach(() => {
    // Fijar "hoy" al 2026-03-25 para tests reproducibles
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('PAGADO cuando total pagado >= pago del periodo', () => {
    const credit = { ...CREDIT, pagos: [{ periodo: 1, monto: 368.72 }] };
    expect(credPeriodStatus(credit, credit.amort[1])).toBe('PAGADO');
  });

  test('PAGADO con tolerancia de $0.05 (redondeo)', () => {
    const credit = { ...CREDIT, pagos: [{ periodo: 1, monto: 368.68 }] }; // 0.04 de diferencia
    expect(credPeriodStatus(credit, credit.amort[1])).toBe('PAGADO');
  });

  test('PARCIAL cuando hay pago pero insuficiente', () => {
    const credit = { ...CREDIT, pagos: [{ periodo: 1, monto: 200 }] }; // solo la mitad
    expect(credPeriodStatus(credit, credit.amort[1])).toBe('PARCIAL');
  });

  test('VENCIDO cuando fecha pasó y sin pago (periodo 1: 01/02/2026)', () => {
    // Hoy = 25/03/2026, fecha = 01/02/2026 → vencido
    const credit = { ...CREDIT, pagos: [] };
    expect(credPeriodStatus(credit, credit.amort[1])).toBe('VENCIDO');
  });

  test('PENDIENTE cuando fecha futura sin pago (periodo 3: 01/04/2026)', () => {
    // Hoy = 25/03/2026, fecha = 01/04/2026 → pendiente
    const credit = { ...CREDIT, pagos: [] };
    expect(credPeriodStatus(credit, credit.amort[3])).toBe('PENDIENTE');
  });

  test('suma múltiples pagos del mismo periodo', () => {
    const credit = {
      ...CREDIT,
      pagos: [
        { periodo: 2, monto: 200 },
        { periodo: 2, monto: 168.72 }, // total = 368.72 = PAGADO
      ],
    };
    expect(credPeriodStatus(credit, credit.amort[2])).toBe('PAGADO');
  });
});

// ── credDiasAtraso ────────────────────────────────────────────────────────────
describe('credDiasAtraso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));
  });

  afterAll(() => { vi.useRealTimers(); });

  test('calcula días de atraso correctamente', () => {
    // fecha venc = 01/02/2026, hoy = 25/03/2026 → 52 días
    const row = { fecha: '01/02/2026' };
    expect(credDiasAtraso(row)).toBe(52);
  });

  test('retorna 0 si la fecha es futura', () => {
    const row = { fecha: '01/04/2026' };
    expect(credDiasAtraso(row)).toBe(0);
  });

  test('retorna 0 con fecha inválida', () => {
    expect(credDiasAtraso({ fecha: '' })).toBe(0);
    expect(credDiasAtraso({ fecha: null })).toBe(0);
  });
});

// ── credTotalPagadoPeriodo ────────────────────────────────────────────────────
describe('credTotalPagadoPeriodo', () => {
  test('suma solo los pagos del periodo indicado', () => {
    const credit = {
      pagos: [
        { periodo: 1, monto: 100 },
        { periodo: 1, monto: 268.72 },
        { periodo: 2, monto: 368.72 },
      ],
    };
    expect(credTotalPagadoPeriodo(credit, 1)).toBeCloseTo(368.72, 2);
    expect(credTotalPagadoPeriodo(credit, 2)).toBeCloseTo(368.72, 2);
  });

  test('retorna 0 si no hay pagos para el periodo', () => {
    expect(credTotalPagadoPeriodo(CREDIT, 1)).toBe(0);
  });
});

// ── credCobranzaResumen ───────────────────────────────────────────────────────
describe('credCobranzaResumen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));
  });

  afterAll(() => { vi.useRealTimers(); });

  test('clasifica periodos correctamente', () => {
    // periodos 1 y 2 → VENCIDO (01/02 y 01/03), periodo 3 → PENDIENTE (01/04)
    const credit = { ...CREDIT, pagos: [] };
    const r = credCobranzaResumen(credit);

    expect(r.vencido).toBe(2);
    expect(r.pendiente).toBe(1);
    expect(r.pagado).toBe(0);
    expect(r.parcial).toBe(0);
    expect(r.total).toBe(3);
  });

  test('acumula montoVencido de periodos VENCIDO', () => {
    const credit = { ...CREDIT, pagos: [] };
    const r = credCobranzaResumen(credit);
    // periodos 1+2 vencidos: 368.72 * 2
    expect(r.montoVencido).toBeCloseTo(368.72 * 2, 1);
  });

  test('acumula montoPagado incluyendo pagos parciales', () => {
    const credit = {
      ...CREDIT,
      pagos: [
        { periodo: 1, monto: 368.72 }, // PAGADO
        { periodo: 2, monto: 100 },    // PARCIAL
      ],
    };
    const r = credCobranzaResumen(credit);
    expect(r.pagado).toBe(1);
    expect(r.parcial).toBe(1);
    expect(r.montoPagado).toBeCloseTo(368.72 + 100, 1);
  });

  test('calcula maxAtraso en días', () => {
    const credit = { ...CREDIT, pagos: [] };
    const r = credCobranzaResumen(credit);
    // periodo 1 venc = 01/02/2026, hoy = 25/03/2026 → 52 días
    // periodo 2 venc = 01/03/2026, hoy = 25/03/2026 → 24 días
    expect(r.maxAtraso).toBe(52);
  });

  test('retorna null sin tabla de amort', () => {
    expect(credCobranzaResumen({ monto: 10000, pagos: [] })).toBeNull();
  });
});

// ── credSaldoActual ───────────────────────────────────────────────────────────
describe('credSaldoActual', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));
  });

  afterAll(() => { vi.useRealTimers(); });

  test('retorna monto original si no hay pagos', () => {
    const credit = { ...CREDIT, pagos: [] };
    expect(credSaldoActual(credit)).toBe(10000); // amort[0].saldo
  });

  test('retorna saldo del último periodo PAGADO', () => {
    const credit = {
      ...CREDIT,
      pagos: [{ periodo: 1, monto: 368.72 }],
    };
    expect(credSaldoActual(credit)).toBeCloseTo(9831.28, 1);
  });

  test('retorna saldo ajustado en pago PARCIAL', () => {
    const credit = {
      ...CREDIT,
      // Solo se abona $200 en periodo 1: int=200, ivaInt=32 → abonoCapital=0
      pagos: [{ periodo: 1, monto: 200 }],
    };
    // totalPag=200, int=200, ivaInt=32 → abonoCapital = max(0, 200-200-32) = 0
    // saldoAnterior = amort[0].saldo = 10000
    // resultado = 10000 - 0 = 10000
    expect(credSaldoActual(credit)).toBeCloseTo(10000, 1);
  });

  test('retorna monto si no hay tabla de amort', () => {
    expect(credSaldoActual({ monto: 5000 })).toBe(5000);
  });
});
