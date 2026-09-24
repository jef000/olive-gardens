function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Return safe markup for rendering search matches. The source text is escaped first. */
export function highlightText(text: string, search: string): string {
  const safeText = escapeHtml(text);
  if (!search.trim()) return safeText;
  const escaped = escapeHtml(search.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safeText.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}
