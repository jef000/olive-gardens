import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildSheetXml, buildSummarySheetXml, buildWorkbookXml, buildXlsxBlob } from '@/lib/xlsxExport';
import { columnsFromRows } from '@/lib/ooxml';

const rows = [
  { name: 'A & B <café>', revenue: 1250 },
  { name: 'Delta', revenue: 980.5 },
];
const columns = columnsFromRows(rows);
const summary = [
  { label: 'Period', value: '1 Oct – 31 Oct' },
  { label: 'Total revenue', value: 'KES 2,230' },
];

describe('xlsxExport', () => {
  it('writes inline strings with escaping and numeric cells', () => {
    const sheet = buildSheetXml(columns, rows);
    expect(sheet).toContain('A &amp; B &lt;café&gt;');
    expect(sheet).toContain('t="inlineStr"');
    expect(sheet).toContain('<v>1250</v>');
    expect(sheet).toContain('<v>980.5</v>');
  });

  it('freezes the header row, sizes columns, and styles the header', () => {
    const sheet = buildSheetXml(columns, rows);
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain('<col min="1" max="1"');
    expect(sheet).toContain('<autoFilter ref="A1:B3"/>');
    expect(sheet).toContain('<c r="A1" s="1" t="inlineStr">');
    expect(sheet).toContain('<c r="A2" s="0" t="inlineStr">');
  });

  it('keeps sheet names readable in the workbook', () => {
    const workbook = buildWorkbookXml(['Olive Garden Users']);
    expect(workbook).toContain('name="Olive Garden Users"');
    expect(workbook).toContain('r:id="rId1"');
  });

  it('lists a summary sheet before the detail sheet', () => {
    const workbook = buildWorkbookXml(['Summary', 'Olive Garden Users']);
    expect(workbook).toContain('name="Summary" sheetId="1" r:id="rId1"');
    expect(workbook).toContain('name="Olive Garden Users" sheetId="2" r:id="rId2"');
  });

  it('writes summary labels and values', () => {
    const sheet = buildSummarySheetXml(summary);
    expect(sheet).toContain('Period');
    expect(sheet).toContain('KES 2,230');
    expect(sheet).toContain('<c r="A1" s="2" t="inlineStr">');
  });

  it('produces a valid zip with workbook, styles, and metadata parts', async () => {
    const blob = await buildXlsxBlob('Olive Garden Users', columns, rows);
    const zip = await JSZip.loadAsync(blob);
    const parts = Object.keys(zip.files).sort();
    expect(parts).toContain('[Content_Types].xml');
    expect(parts).toContain('xl/workbook.xml');
    expect(parts).toContain('xl/worksheets/sheet1.xml');
    expect(parts).toContain('xl/styles.xml');
    expect(parts).toContain('docProps/core.xml');
    const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(sheet).toContain('Delta');
  });

  it('adds a second worksheet when a summary is provided', async () => {
    const blob = await buildXlsxBlob('Olive Garden Users', columns, rows, summary);
    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files)).toContain('xl/worksheets/sheet2.xml');
    const workbook = await zip.file('xl/workbook.xml')!.async('string');
    expect(workbook).toContain('name="Summary"');
    const summarySheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(summarySheet).toContain('Total revenue');
  });
});
