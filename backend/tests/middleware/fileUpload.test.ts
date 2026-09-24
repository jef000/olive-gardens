import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { matchesMagicNumber } from '../../src/middleware/fileUpload.middleware';

test('file upload magic numbers accept JPEG, PNG, and WebP signatures', () => {
  assert.equal(matchesMagicNumber(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(matchesMagicNumber(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'), true);
  assert.equal(matchesMagicNumber(Buffer.from('RIFFxxxxWEBP'), 'image/webp'), true);
});

test('file upload magic numbers reject executable and spoofed content', () => {
  assert.equal(matchesMagicNumber(Buffer.from('MZnot-an-image'), 'image/jpeg'), false);
  assert.equal(matchesMagicNumber(Buffer.from('\x7fELFnot-an-image'), 'image/png'), false);
  assert.equal(matchesMagicNumber(Buffer.from('<script>alert(1)</script>'), 'image/jpeg'), false);
});
