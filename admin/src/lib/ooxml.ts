export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportSummaryItem {
  label: string;
  value: string;
}

export type ExportRows = Record<string, unknown>[];

export function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function isNumericValue(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function escapeXml(value: unknown): string {
  let text = '';
  for (const character of String(value ?? '')) {
    const code = character.charCodeAt(0);
    const invalid = code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
    if (!invalid) text += character;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

export function columnsFromRows(rows: ExportRows): ExportColumn[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((key) => ({ header: humanizeKey(key), key }));
}

export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31);
  return cleaned || 'Report';
}

export function exportBaseName(filename: string): string {
  return filename.replace(/\.(csv|xlsx|docx|pdf)$/i, '');
}

export function exportTitleFromFilename(filename: string): string {
  return exportBaseName(filename)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function exportTimestamp(): string {
  return new Date().toLocaleString();
}

export async function zipFiles(files: Record<string, string>, mimeType: string): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  Object.entries(files).forEach(([path, content]) => zip.file(path, content));
  return zip.generateAsync({ type: 'blob', mimeType, compression: 'DEFLATE' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
