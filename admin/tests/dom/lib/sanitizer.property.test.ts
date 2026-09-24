import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sanitizeText, sanitizeHTML, encodeSpecialChars, sanitizeURL } from '@/lib/sanitizer';

function parseAsDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function hasEventHandlers(document: Document): boolean {
  const elements = Array.from(document.querySelectorAll('*'));
  return elements.some((element) => Array.from(element.attributes).some((attribute) => attribute.name.toLowerCase().startsWith('on')));
}

describe('input sanitizer property tests', () => {
  it('removes script tags, event handlers, and javascript: URLs from arbitrary input', () => {
    fc.assert(fc.property(fc.string(), (payload) => {
      const text = sanitizeText(payload);
      const doc = parseAsDocument(text);
      expect(doc.querySelector('script')).toBeNull();
      expect(hasEventHandlers(doc)).toBe(false);
      expect(text.toLowerCase()).not.toContain('javascript:');
    }), { numRuns: 120 });
  });

  it('preserves safe tags while removing dangerous ones', () => {
    fc.assert(fc.property(fc.string(), (payload) => {
      const html = sanitizeHTML(payload);
      const doc = parseAsDocument(html);
      expect(doc.querySelector('script')).toBeNull();
      expect(doc.querySelector('img')).toBeNull();
      expect(doc.querySelector('iframe')).toBeNull();
      expect(hasEventHandlers(doc)).toBe(false);
    }), { numRuns: 120 });
  });

  it('keeps whitelisted formatting tags in sanitized HTML', () => {
    const html = sanitizeHTML('<p>Hello <strong>world</strong></p><script>alert(1)</script>');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<p>');
    expect(html).not.toContain('script');
  });

  it('encodes &, <, >, ", and \' in arbitrary input', () => {
    fc.assert(fc.property(fc.string(), (payload) => {
      const encoded = encodeSpecialChars(payload);
      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
      expect(encoded).not.toContain('"');
      expect(encoded).not.toContain("'");
      if (payload.includes('&')) expect(encoded).toContain('&amp;');
    }), { numRuns: 120 });
  });

  it('blocks javascript: and data: URLs while allowing http(s)', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeURL('https://example.com/venue')).toBe('https://example.com/venue');
    expect(sanitizeURL('/venue/olive-garden')).toBe('/venue/olive-garden');
  });
});
