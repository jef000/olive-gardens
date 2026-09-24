import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { encodeSpecialChars, sanitizeHTML, sanitizeText, sanitizeURL } from '../../src/utils/sanitizer';

test('sanitizer removes executable markup across generated payloads', () => {
  const payloads = Array.from({ length: 120 }, (_, index) =>
    `<script>alert(${index})</script><img src=x onerror=alert(${index})><a href="javascript:alert(1)">text-${index}</a>`
  );
  for (const payload of payloads) {
    const text = sanitizeText(payload);
    const html = sanitizeHTML(payload);
    assert.equal(/script|onerror|javascript:/i.test(text), false);
    assert.equal(/script|onerror|javascript:/i.test(html), false);
  }
});

test('sanitizer preserves only the explicit safe HTML allow-list', () => {
  const result = sanitizeHTML('<p><strong>safe</strong><iframe src="x"></iframe><span onclick="x">text</span></p>');
  assert.match(result, /<p><strong>safe<\/strong>/);
  assert.equal(/iframe|onclick|span/i.test(result), false);
});

test('special characters are encoded deterministically', () => {
  assert.equal(encodeSpecialChars(`&< >"'`), '&amp;&lt; &gt;&quot;&#39;');
  assert.equal(sanitizeURL('javascript:alert(1)'), '');
  assert.equal(sanitizeURL('data:text/html,evil'), '');
  assert.equal(sanitizeURL('/uploads/image.webp'), '/uploads/image.webp');
});
