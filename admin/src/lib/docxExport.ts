import {
  cellText,
  downloadBlob,
  escapeXml,
  exportTimestamp,
  zipFiles,
  type ExportColumn,
  type ExportRows,
  type ExportSummaryItem,
} from '@/lib/ooxml';

const PAGE_WIDTH = 15398;
const PAGE_HEIGHT = 11906;
const MARGIN = 720;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

function columnWidths(columns: ExportColumn[], rows: ExportRows): number[] {
  const measures = columns.map((column) =>
    rows.reduce((max, row) => Math.max(max, cellText(row[column.key]).length), column.header.length)
  );
  const total = measures.reduce((sum, measure) => sum + measure, 0) || 1;
  return measures.map((measure) => Math.max(900, Math.round((measure / total) * PAGE_WIDTH)));
}

function runXml(text: string, options: { bold?: boolean; size?: number; color?: string } = {}): string {
  const properties = [
    options.bold ? '<w:b/>' : '',
    `<w:sz w:val="${options.size ?? 18}"/>`,
    `<w:color w:val="${options.color ?? '1F2937'}"/>`,
  ].join('');
  return `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paragraphXml(runs: string, options: { after?: number } = {}): string {
  return `<w:p><w:pPr><w:spacing w:after="${options.after ?? 0}" w:line="240" w:lineRule="auto"/></w:pPr>${runs}</w:p>`;
}

function cellXml(text: string, options: { width: number; shade?: string; header?: boolean; bold?: boolean }): string {
  const shading = options.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${options.shade}"/>` : '';
  const runs = options.header
    ? runXml(text, { bold: true, size: 17, color: 'FFFFFF' })
    : runXml(text, { size: 17, color: '1F2937', bold: options.bold });
  return `<w:tc><w:tcPr><w:tcW w:w="${options.width}" w:type="dxa"/>${shading}<w:vAlign w:val="top"/></w:tcPr>${paragraphXml(runs)}</w:tc>`;
}

function tableXml(cells: { text: string; width: number; shade?: string; header?: boolean; bold?: boolean }[][]): string {
  const grid = cells[0]?.map((cell) => `<w:gridCol w:w="${cell.width}"/>`).join('') ?? '';
  const rows = cells
    .map((row) => {
      const headerRow = row.some((cell) => cell.header);
      return `<w:tr>${headerRow ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${row.map((cell) => cellXml(cell.text, cell)).join('')}</w:tr>`;
    })
    .join('');
  return `<w:tbl>
  <w:tblPr>
    <w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
    </w:tblBorders>
    <w:tblLayout w:type="fixed"/>
    <w:tblCellMar>
      <w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>
      <w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tblGrid>${grid}</w:tblGrid>
  ${rows}
</w:tbl>`;
}

function summaryTableXml(summary: ExportSummaryItem[]): string {
  const labelWidth = 4200;
  const valueWidth = PAGE_WIDTH - labelWidth;
  return tableXml(
    summary.map((item, index) => [
      { text: item.label, width: labelWidth, shade: 'F1F5F9', bold: true },
      { text: item.value, width: valueWidth, shade: index % 2 === 1 ? 'F8FAFC' : undefined },
    ])
  );
}

export function buildDocumentXml(title: string, columns: ExportColumn[], rows: ExportRows, summary?: ExportSummaryItem[]): string {
  const widths = columnWidths(columns, rows);

  const heading = paragraphXml(runXml(title, { bold: true, size: 36, color: '0F172A' }), { after: 60 });
  const meta = paragraphXml(
    runXml(`${rows.length} rows · Generated ${exportTimestamp()}`, { size: 17, color: '64748B' }),
    { after: 200 }
  );

  const detailTable = tableXml([
    columns.map((column, index) => ({ text: column.header, width: widths[index], shade: '0F172A', header: true })),
    ...rows.map((row, rowIndex) =>
      columns.map((column, index) => ({
        text: cellText(row[column.key]),
        width: widths[index],
        shade: rowIndex % 2 === 1 ? 'F8FAFC' : undefined,
      }))
    ),
  ]);

  const summaryBlock = summary?.length
    ? `${summaryTableXml(summary)}${paragraphXml('', { after: 160 })}`
    : '';

  const section = `<w:sectPr><w:pgSz w:w="${PAGE_WIDTH + MARGIN * 2}" w:h="${PAGE_HEIGHT}" w:orient="landscape"/><w:pgMar w:top="${MARGIN}" w:right="${MARGIN}" w:bottom="${MARGIN}" w:left="${MARGIN}" w:header="${MARGIN}" w:footer="${MARGIN}" w:gutter="0"/></w:sectPr>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${heading}${meta}${summaryBlock}${detailTable}${paragraphXml('')}${section}</w:body>
</w:document>`;
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

export async function buildDocxBlob(title: string, columns: ExportColumn[], rows: ExportRows, summary?: ExportSummaryItem[]): Promise<Blob> {
  const files: Record<string, string> = {
    '[Content_Types].xml': CONTENT_TYPES,
    '_rels/.rels': ROOT_RELS,
    'word/document.xml': buildDocumentXml(title, columns, rows, summary),
    'word/_rels/document.xml.rels': DOCUMENT_RELS,
    'word/styles.xml': STYLES,
    'docProps/core.xml': buildCoreXml(title),
    'docProps/app.xml': buildAppXml(),
  };
  return zipFiles(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

export async function downloadDocx(baseName: string, title: string, columns: ExportColumn[], rows: ExportRows, summary?: ExportSummaryItem[]): Promise<void> {
  const blob = await buildDocxBlob(title, columns, rows, summary);
  downloadBlob(blob, `${baseName}.docx`);
}
