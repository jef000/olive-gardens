import {
  cellText,
  downloadBlob,
  escapeXml,
  isNumericValue,
  sanitizeSheetName,
  zipFiles,
  type ExportColumn,
  type ExportRows,
  type ExportSummaryItem,
} from '@/lib/ooxml';

function contentTypes(sheetCount: number): string {
  const overrides = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${overrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

function workbookRels(sheetCount: number): string {
  const sheets = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function columnName(index: number): string {
  let name = '';
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function columnWidth(column: ExportColumn, rows: ExportRows): number {
  const longest = rows.reduce((max, row) => Math.max(max, cellText(row[column.key]).length), column.header.length);
  return Math.min(60, Math.max(10, longest + 2));
}

function cellXml(reference: string, value: unknown, style: number): string {
  if (isNumericValue(value)) {
    return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
  }
  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cellText(value))}</t></is></c>`;
}

export function buildSheetXml(columns: ExportColumn[], rows: ExportRows): string {
  const lastColumn = columnName(Math.max(0, columns.length - 1));
  const lastRow = rows.length + 1;
  const cols = columns
    .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${columnWidth(column, rows)}" customWidth="1"/>`)
    .join('');
  const headerRow = `<row r="1" ht="20" customHeight="1">${columns
    .map((column, index) => cellXml(`${columnName(index)}1`, column.header, 1))
    .join('')}</row>`;
  const bodyRows = rows
    .map((row, rowIndex) => {
      const number = rowIndex + 2;
      const cells = columns.map((column, columnIndex) => cellXml(`${columnName(columnIndex)}${number}`, row[column.key], 0)).join('');
      return `<row r="${number}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${cols}</cols>
  <sheetData>${headerRow}${bodyRows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

export function buildSummarySheetXml(summary: ExportSummaryItem[]): string {
  const rows = summary
    .map((item, index) => {
      const number = index + 1;
      return `<row r="${number}">${cellXml(`A${number}`, item.label, 2)}${cellXml(`B${number}`, item.value, 0)}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:B${summary.length}"/>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="32" customWidth="1"/>
    <col min="2" max="2" width="70" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
</worksheet>`;
}

export function buildWorkbookXml(sheets: string[]): string {
  const entries = sheets
    .map((name, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${entries}</sheets>
</workbook>`;
}

function buildCoreXml(title: string): string {
  const created = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Olive Garden Admin</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Olive Garden Admin</Application>
</Properties>`;
}

export async function buildXlsxBlob(title: string, columns: ExportColumn[], rows: ExportRows, summary?: ExportSummaryItem[]): Promise<Blob> {
  const hasSummary = Boolean(summary?.length);
  const sheets = hasSummary ? ['Summary', sanitizeSheetName(title)] : [sanitizeSheetName(title)];
  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes(sheets.length),
    '_rels/.rels': ROOT_RELS,
    'xl/workbook.xml': buildWorkbookXml(sheets),
    'xl/_rels/workbook.xml.rels': workbookRels(sheets.length),
    'xl/styles.xml': STYLES,
    'xl/worksheets/sheet1.xml': hasSummary ? buildSummarySheetXml(summary!) : buildSheetXml(columns, rows),
    'docProps/core.xml': buildCoreXml(title),
    'docProps/app.xml': buildAppXml(),
  };
  if (hasSummary) {
    files['xl/worksheets/sheet2.xml'] = buildSheetXml(columns, rows);
  }
  return zipFiles(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function downloadXlsx(baseName: string, title: string, columns: ExportColumn[], rows: ExportRows, summary?: ExportSummaryItem[]): Promise<void> {
  const blob = await buildXlsxBlob(title, columns, rows, summary);
  downloadBlob(blob, `${baseName}.xlsx`);
}
