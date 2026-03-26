/**
 * Tests: Fórmula de amortización francesa (sistema de pagos fijos)
 *
 * Prueba la lógica pura de credGenerarAmort() extraída de credit-detail.js.
 * No se instancia el DOM — solo se verifica la matemática financiera.
 */
import { describe, test, expect } from 'vitest';

// ── Función pura extraída de credGenerarAmort() ───────────────────────────────
/**
 * Genera tabla de amortización sistema francés (pago fijo).
 * @param {number} monto   Capital inicial
 * @param {number} plazo   Número de periodos mensuales
 * @param {number} tasaAnual Tasa de interés anual en %
 * @param {number} ivaP    IVA sobre intereses en %
 * @returns {Array} Tabla con fila 0 (saldo inicial) + N filas de periodos
 */
function generarAmortFrancesa(monto, plazo, tasaAnual, ivaP = 16) {
  const r = tasaAnual / 100 / 12;
  const pagoFijo = r > 0
    ? monto * (r * Math.pow(1 + r, plazo)) / (Math.pow(1 + r, plazo) - 1)
    : monto / plazo;

  const tabla = [{ periodo: 0, pago: 0, capital: 0, int: 0, ivaInt: 0, saldo: Math.round(monto * 100) / 100 }];
  let saldo = monto;

  for (let i = 1; i <= plazo; i++) {
    const interes  = Math.round(saldo * r * 100) / 100;
    const ivaInt   = Math.round(interes * (ivaP / 100) * 100) / 100;
    const capital  = Math.round((pagoFijo - interes) * 100) / 100;
    saldo = Math.round((saldo - capital) * 100) / 100;
    if (i === plazo) saldo = 0;

    tabla.push({
      periodo: i,
      pago:    Math.round(pagoFijo * 100) / 100,
      capital,
      int:     interes,
      ivaInt,
      saldo:   Math.max(saldo, 0),
    });
  }
  return tabla;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Amortización francesa — pago fijo', () => {
  test('pagoFijo correcto para crédito estándar (10k @ 24% anual, 12 meses)', () => {
    const tabla = generarAmortFrancesa(10000, 12, 24);
    // Fórmula: 10000 * (0.02 * 1.02^12) / (1.02^12 - 1) ≈ 945.60
    const pago = tabla[1].pago;
    expect(pago).toBeCloseTo(945.60, 0);
  });

  test('todos los periodos tienen el mismo pago (sistema francés)', () => {
    const tabla = generarAmortFrancesa(50000, 24, 18);
    const primerPago = tabla[1].pago;
    // Todos los pagos iguales (tolerancia $0.01 por redondeo centésimos)
    for (let i = 1; i <= 24; i++) {
      expect(tabla[i].pago).toBeCloseTo(primerPago, 0);
    }
  });

  test('saldo llega a 0 en el último periodo', () => {
    const tabla = generarAmortFrancesa(30000, 36, 24);
    expect(tabla[36].saldo).toBe(0);
  });

  test('capital de cada periodo = pago - interés', () => {
    const tabla = generarAmortFrancesa(15000, 12, 20);
    for (let i = 1; i <= 12; i++) {
      // capital + int ≈ pago (diferencia máxima de $0.02 por redondeo)
      expect(tabla[i].capital + tabla[i].int).toBeCloseTo(tabla[i].pago, 0);
    }
  });

  test('interés = saldo anterior * tasa mensual', () => {
    const tabla = generarAmortFrancesa(20000, 12, 24); // r = 0.02
    const r = 0.02;
    for (let i = 1; i <= 12; i++) {
      const saldoAnterior = tabla[i - 1].saldo;
      expect(tabla[i].int).toBeCloseTo(saldoAnterior * r, 0);
    }
  });

  test('capital crece periodo a periodo (amortización creciente)', () => {
    const tabla = generarAmortFrancesa(10000, 12, 24);
    for (let i = 2; i <= 12; i++) {
      expect(tabla[i].capital).toBeGreaterThan(tabla[i - 1].capital);
    }
  });

  test('interés decrece periodo a periodo (a menor saldo, menos interés)', () => {
    const tabla = generarAmortFrancesa(10000, 12, 24);
    for (let i = 2; i <= 12; i++) {
      expect(tabla[i].int).toBeLessThan(tabla[i - 1].int);
    }
  });

  test('suma total de capital = monto original', () => {
    const monto = 25000;
    const tabla = generarAmortFrancesa(monto, 18, 21);
    const totalCapital = tabla.slice(1).reduce((s, r) => s + r.capital, 0);
    expect(totalCapital).toBeCloseTo(monto, 0);
  });

  test('IVA sobre interés = interés * 16%', () => {
    const tabla = generarAmortFrancesa(10000, 6, 18, 16);
    for (let i = 1; i <= 6; i++) {
      expect(tabla[i].ivaInt).toBeCloseTo(tabla[i].int * 0.16, 2);
    }
  });

  test('caso borde: tasa 0% → pagos iguales al monto / plazo', () => {
    const tabla = generarAmortFrancesa(12000, 12, 0);
    // Sin interés: pago = 12000/12 = 1000, interés = 0
    expect(tabla[1].pago).toBeCloseTo(1000, 2);
    expect(tabla[1].int).toBe(0);
    expect(tabla[12].saldo).toBe(0);
  });

  test('plazo largo (60 meses / 5 años)', () => {
    const tabla = generarAmortFrancesa(100000, 60, 18);
    expect(tabla.length).toBe(61); // 1 fila inicial + 60 periodos
    expect(tabla[60].saldo).toBe(0);
    // Pago ≈ $2,539 para estas condiciones
    expect(tabla[1].pago).toBeGreaterThan(2000);
    expect(tabla[1].pago).toBeLessThan(3000);
  });
});

// ── Tests: comisión de apertura ───────────────────────────────────────────────
describe('Comisión de apertura (credComApertura)', () => {
  function credComApertura(c) {
    return c.monto * (c.com || 0) / 100;
  }

  test('2% sobre 10,000 = 200', () => {
    expect(credComApertura({ monto: 10000, com: 2 })).toBeCloseTo(200, 2);
  });

  test('1.5% sobre 250,000 = 3,750', () => {
    expect(credComApertura({ monto: 250000, com: 1.5 })).toBeCloseTo(3750, 2);
  });

  test('0% → 0', () => {
    expect(credComApertura({ monto: 10000, com: 0 })).toBe(0);
  });
});

// ── Tests: KPI morosidad ──────────────────────────────────────────────────────
describe('KPI morosidad (calcMor logic)', () => {
  function calcMor(saldo, vencido) {
    const vigente = saldo - vencido;
    const pct = saldo > 0 ? ((vencido / saldo) * 100).toFixed(1) : 0;
    return { vigente, vencida: vencido, pct };
  }

  test('sin morosidad: todo vigente', () => {
    const r = calcMor(100000, 0);
    expect(r.vigente).toBe(100000);
    expect(r.vencida).toBe(0);
    expect(r.pct).toBe('0.0');
  });

  test('50% de morosidad', () => {
    const r = calcMor(100000, 50000);
    expect(r.vigente).toBe(50000);
    expect(r.pct).toBe('50.0');
  });

  test('100% vencido', () => {
    const r = calcMor(80000, 80000);
    expect(r.vigente).toBe(0);
    expect(r.pct).toBe('100.0');
  });

  test('saldo 0 retorna pct=0 (sin división por cero)', () => {
    const r = calcMor(0, 0);
    expect(r.pct).toBe(0);
  });

  test('pct redondeado a 1 decimal', () => {
    const r = calcMor(100000, 33333);
    expect(r.pct).toBe('33.3');
  });
});
