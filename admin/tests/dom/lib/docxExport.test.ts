import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildDocxBlob, buildDocumentXml } from '@/lib/docxExport';
import { columnsFromRows } from '@/lib/ooxml';

const rows = [
  { name: 'A & B <café>', revenue: 1250 },
  { name: 'Delta', revenue: 980.5 },
];
const columns = columnsFromRows(rows);

describe('docxExport', () => {
  it('writes a titled landscape document with a table', () => {
    const document = buildDocumentXml('Olive Garden Users', columns, rows);
    expect(document).toContain('Olive Garden Users');
    expect(document).toContain('<w:tbl>');
    expect(document).toContain('w:orient="landscape"');
    expect(document).toContain('2 rows · Generated');
  });

  it('escapes cell values and shades the header row', () => {
    const document = buildDocumentXml('Report', columns, rows);
    expect(document).toContain('A &amp; B &lt;café&gt;');
    expect(document).toContain('w:fill="0F172A"');
    expect(document).toContain('w:fill="F8FAFC"');
    expect(document).toContain('w:tblHeader');
  });

  it('renders a summary table before the detail rows', () => {
    const document = buildDocumentXml('Olive Garden Bookings', columns, rows, [
      { label: 'Period', value: '1 Oct – 31 Oct' },
      { label: 'Total revenue', value: 'KES 2,230' },
    ]);
    const summaryIndex = document.indexOf('Period');
    const detailIndex = document.indexOf('Name');
    expect(summaryIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeLessThan(detailIndex);
    expect(document).toContain('w:fill="F1F5F9"');
  });

  it('produces a valid zip with document, styles, and metadata parts', async () => {
    const blob = await buildDocxBlob('Olive Garden Users', columns, rows);
    const zip = await JSZip.loadAsync(blob);
    const parts = Object.keys(zip.files).sort();
    expect(parts).toContain('[Content_Types].xml');
    expect(parts).toContain('word/document.xml');
    expect(parts).toContain('word/styles.xml');
    expect(parts).toContain('word/_rels/document.xml.rels');
    expect(parts).toContain('docProps/core.xml');
    const document = await zip.file('word/document.xml')!.async('string');
    expect(document).toContain('Delta');
  });
});
