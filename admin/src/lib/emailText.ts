/**
 * Convert the editor's rich HTML into the plain text used for character counts
 * and disabled states. Block-level tags become line breaks so the count matches
 * what the recipient will read.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6]|div)>/gi, '\n');

  if (typeof DOMParser === 'undefined') {
    return withBreaks.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  const document = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (document.body.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
