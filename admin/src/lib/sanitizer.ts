import DOMPurify from 'dompurify';

const SAFE_TAGS = ['b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 'strong', 'ul', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];

export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
}

export function sanitizeHTML(value: unknown): string {
  if (typeof value !== 'string') return '';
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: SAFE_TAGS, ALLOWED_ATTR: [] });
}

export function encodeSpecialChars(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function sanitizeURL(value: unknown): string {
  if (typeof value !== 'string' || /^(javascript|data|vbscript):/i.test(value.trim())) return '';
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? value.trim() : '';
  } catch {
    return '';
  }
}
