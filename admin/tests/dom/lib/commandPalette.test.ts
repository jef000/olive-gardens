import { describe, it, expect } from 'vitest';
import { rankCommands, type PaletteCommand } from '@/lib/commandPalette';

const noop = () => {};
const commands: PaletteCommand[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Navigate', perform: noop },
  { id: 'bookings', label: 'Bookings', group: 'Navigate', keywords: ['reservations', 'events'], perform: noop },
  { id: 'users', label: 'Users', group: 'Navigate', keywords: ['team', 'accounts'], perform: noop },
  { id: 'analytics', label: 'Analytics', group: 'Navigate', perform: noop },
];

describe('rankCommands', () => {
  it('returns every command for an empty query', () => {
    expect(rankCommands('', commands)).toHaveLength(commands.length);
  });

  it('ranks an exact label match above a prefix match', () => {
    const result = rankCommands('bookings', [
      { id: 'a', label: 'Bookings Overview', group: 'Navigate', perform: noop },
      { id: 'b', label: 'Bookings', group: 'Navigate', perform: noop },
    ]);
    expect(result[0].label).toBe('Bookings');
  });

  it('matches on keywords', () => {
    const result = rankCommands('reserv', commands);
    expect(result[0].id).toBe('bookings');
  });

  it('is case-insensitive', () => {
    const result = rankCommands('BOOKINGS', commands);
    expect(result[0].id).toBe('bookings');
  });

  it('returns an empty list when nothing matches', () => {
    expect(rankCommands('zzzz', commands)).toEqual([]);
  });
});
