import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fc from 'fast-check';
import { toCsv, neutralizeCsvFormula } from '../../src/lib/csvExport.ts';

function parseOneColumn(csv: string): string[] {
  const source = csv.replace(/^\uFEFF/, '');
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted && char === '"' && source[index + 1] === '"') { value += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && (char === '\r' || char === '\n')) { if (char === '\r' && source[index + 1] === '\n') index += 1; values.push(value); value = ''; continue; }
    if (!quoted && char === ',') { values.push(value); value = ''; continue; }
    value += char;
  }
  values.push(value);
  return values;
}

test('CSV escaping preserves arbitrary special-character fields', () => {
  fc.assert(fc.property(fc.string(), fc.string(), (first, second) => {
    const csv = toCsv([{ first, second }]);
    const [headerFirst, headerSecond, valueFirst, valueSecond] = parseOneColumn(csv);
    assert.equal(headerFirst, 'first');
    assert.equal(headerSecond, 'second');
    assert.equal(valueFirst, neutralizeCsvFormula(first));
    assert.equal(valueSecond, neutralizeCsvFormula(second));
  }), { numRuns: 120 });
});

test('CSV output includes an Excel-compatible UTF-8 BOM', () => {
  assert.equal(toCsv([{ value: 'hello' }]).charCodeAt(0), 0xfeff);
});
