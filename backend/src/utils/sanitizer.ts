import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const domWindow = new JSDOM('').window;
const purify = createDOMPurify(domWindow as unknown as Parameters<typeof createDOMPurify>[0]);

const SAFE_TAGS = ['a', 'b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 's', 'strong', 'u', 'ul'];
const SAFE_ATTRIBUTES = ['class', 'href'];

/** Remove all markup and dangerous protocols from user-provided text. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return purify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
}

/** Preserve a small, explicit HTML allow-list for rich text fields. */
export function sanitizeHTML(value: unknown): string {
  if (typeof value !== 'string') return '';
  return purify.sanitize(value, {
    ALLOWED_TAGS: SAFE_TAGS,
    ALLOWED_ATTR: SAFE_ATTRIBUTES,
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  });
}

/** Encode characters that have special meaning in HTML. */
export function encodeSpecialChars(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only http(s) and relative URLs. */
export function sanitizeURL(value: unknown): string {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (/^(javascript|data|vbscript):/i.test(candidate)) return '';

  try {
    const parsed = new URL(candidate, 'http://localhost');
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return candidate;
  } catch {
    return '';
  }
}
