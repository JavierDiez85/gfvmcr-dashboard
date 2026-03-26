/**
 * Export: Clientes y Terminales en uso actual
 *
 * Lógica: Para cada terminal_id, busca el ÚLTIMO cliente con el que transaccionó
 * (por fecha más reciente). Agrupa por cliente.
 *
 * Output: Excel con columnas Cliente | Terminal (No. Serie)
 */

const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY environment variables');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Consultando terminales desde tpv_transactions...');

  // Traer todos los registros únicos de terminal_id + cliente + fecha más reciente
  // Supabase tiene límite de 1000 rows por default, paginamos
  let allRows = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await sb
      .from('tpv_transactions')
      .select('terminal_id, cliente, fecha')
      .not('terminal_id', 'is', null)
      .not('terminal_id', 'eq', '')
      .order('fecha', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error en query:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows = allRows.concat(data);
      offset += pageSize;
      console.log(`  ... ${allRows.length} registros cargados`);
      if (data.length < pageSize) hasMore = false;
    }
  }

  console.log(`Total registros: ${allRows.length}`);

  // Para cada terminal, encontrar el cliente MÁS RECIENTE
  const terminalMap = {}; // terminal_id -> { cliente, fecha }

  for (const row of allRows) {
    const tid = (row.terminal_id || '').trim();
    if (!tid) continue;

    if (!terminalMap[tid] || row.fecha > terminalMap[tid].fecha) {
      terminalMap[tid] = { cliente: row.cliente, fecha: row.fecha };
    }
  }

  console.log(`Terminales únicas encontradas: ${Object.keys(terminalMap).length}`);

  // Agrupar por cliente
  const clienteTerminales = {}; // cliente -> [terminal_id, ...]
  for (const [tid, info] of Object.entries(terminalMap)) {
    const cliente = info.cliente || 'Sin cliente';
    if (!clienteTerminales[cliente]) clienteTerminales[cliente] = [];
    clienteTerminales[cliente].push(tid);
  }

  // Ordenar clientes alfabéticamente
  const clientesSorted = Object.keys(clienteTerminales).sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );

  // Construir filas para Excel: una fila por cada terminal
  const rows = [];
  for (const cliente of clientesSorted) {
    const terminales = clienteTerminales[cliente].sort();
    for (const terminal of terminales) {
      rows.push({
        'Cliente': cliente,
        'Terminal (No. Serie)': terminal
      });
    }
  }

  console.log(`\nResumen:`);
  console.log(`  Clientes: ${clientesSorted.length}`);
  console.log(`  Terminales: ${rows.length}`);

  // Crear Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes y Terminales');

  worksheet.columns = [
    { header: 'Cliente', key: 'Cliente', width: 40 },
    { header: 'Terminal (No. Serie)', key: 'Terminal (No. Serie)', width: 25 }
  ];

  worksheet.addRows(rows);

  const outPath = path.join(__dirname, '..', 'Clientes_Terminales_Actual.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log(`\n✅ Archivo generado: ${outPath}`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
