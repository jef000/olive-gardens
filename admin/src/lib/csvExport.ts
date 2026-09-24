function formatCsvValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Neutralize spreadsheet formula injection: a value that begins with =, +, -,
 * @, tab or CR is interpreted as a formula by Excel/Sheets, so it is prefixed
 * with a quote to force it to render as text.
 */
export function neutralizeCsvFormula(value: string): string {
  return CSV_FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

function escapeCsv(value: unknown): string {
  const formatted = formatCsvValue(value);
  const normalized = typeof formatted === 'string' ? neutralizeCsvFormula(formatted) : formatted;
  const text = String(normalized ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string { if (!rows.length) return ''; const headers = Object.keys(rows[0]); return '\uFEFF' + [headers, ...rows.map((row) => headers.map((header) => row[header]))].map((row) => row.map(escapeCsv).join(',')).join('\r\n'); }
export function downloadCsv<T extends Record<string, unknown>>(filename: string, rows: T[]): void { const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
