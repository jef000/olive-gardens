import { describe, it, expect } from 'vitest';
import {
  columnsFromRows,
  escapeXml,
  exportBaseName,
  exportTitleFromFilename,
  humanizeKey,
  sanitizeSheetName,
} from '@/lib/ooxml';

describe('ooxml helpers', () => {
  it('humanizes column keys', () => {
    expect(humanizeKey('total_amount')).toBe('Total Amount');
    expect(humanizeKey('bookingReference')).toBe('Booking Reference');
    expect(humanizeKey('id')).toBe('Id');
  });

  it('builds columns from the first row', () => {
    expect(columnsFromRows([{ email: 'a@b.c', role: 'admin' }])).toEqual([
      { header: 'Email', key: 'email' },
      { header: 'Role', key: 'role' },
    ]);
    expect(columnsFromRows([])).toEqual([]);
  });

  it('sanitizes sheet names', () => {
    expect(sanitizeSheetName('Olive Garden / Users [2026]')).toBe('Olive Garden Users 2026');
    expect(sanitizeSheetName('')).toBe('Report');
    expect(sanitizeSheetName('x'.repeat(80)).length).toBe(31);
  });

  it('derives base names and titles from export filenames', () => {
    expect(exportBaseName('olive-garden-users.csv')).toBe('olive-garden-users');
    expect(exportBaseName('olive-garden-bookings.xlsx')).toBe('olive-garden-bookings');
    expect(exportTitleFromFilename('olive-garden-users.csv')).toBe('Olive Garden Users');
  });

  it('escapes XML and strips control characters', () => {
    expect(escapeXml('A & B <café> "quoted"')).toBe('A &amp; B &lt;café&gt; &quot;quoted&quot;');
    expect(escapeXml("it's ok")).toBe('it&apos;s ok');
    expect(escapeXml('bad\u0007char')).toBe('badchar');
    expect(escapeXml(null)).toBe('');
  });
});
