/**
 * Export: Clientes y Terminales en uso actual
 *
 * Lógica: Para cada terminal_id, busca el ÚLTIMO cliente con el que transaccionó
 * (por fecha más reciente). Agrupa por cliente.
 *
 * Output: Excel con columnas Cliente | Terminal (No. Serie)
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const SUPABASE_URL = 'https://ofuzwfiqjvlronulhwbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdXp3ZmlxanZscm9udWxod2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTQ4NDcsImV4cCI6MjA4NzYzMDg0N30.Ftw2fNM9pLxm09odMa_-zUM7YStK93lMkffZKLnxUMU';

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
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 40 }, // Cliente
    { wch: 25 }, // Terminal
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes y Terminales');

  const outPath = path.join(__dirname, '..', 'Clientes_Terminales_Actual.xlsx');
  XLSX.writeFile(wb, outPath);
  console.log(`\n✅ Archivo generado: ${outPath}`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
