import { describe, it, expect } from 'vitest';
import { getInitials, getAvatarColor } from '@/lib/avatar';

describe('getInitials', () => {
  it('takes first and last initial from a full name', () => {
    expect(getInitials('Alice Smith')).toBe('AS');
  });

  it('takes the first two letters of a single word', () => {
    expect(getInitials('alice')).toBe('AL');
  });

  it('ignores middle names', () => {
    expect(getInitials('Alice Barbara Carter')).toBe('AC');
  });

  it('derives initials from the local part of an email', () => {
    expect(getInitials('alice.smith@example.com')).toBe('AS');
  });

  it('trims surrounding whitespace', () => {
    expect(getInitials('  Alice  Smith  ')).toBe('AS');
  });

  it('returns a placeholder for empty input', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });
});

describe('getAvatarColor', () => {
  it('returns a hex colour', () => {
    expect(getAvatarColor('alice')).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('is deterministic for the same seed', () => {
    expect(getAvatarColor('alice@example.com')).toBe(getAvatarColor('alice@example.com'));
  });

  it('distributes different seeds across the palette', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `user-${i}@example.com`);
    const colours = new Set(seeds.map((seed) => getAvatarColor(seed)));
    expect(colours.size).toBeGreaterThan(3);
  });
});
