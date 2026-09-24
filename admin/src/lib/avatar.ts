const PALETTE = [
  '#8b9172',
  '#a98467',
  '#7d9d9c',
  '#9b8a9e',
  '#b08d57',
  '#7a8ca3',
  '#a37a7a',
  '#6f9e8a',
];

export function getInitials(value: string): string {
  const input = value.trim();
  if (!input) return '?';
  const source = input.includes('@') ? input.split('@')[0] : input;
  const parts = source.split(/[\s._\-+]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
