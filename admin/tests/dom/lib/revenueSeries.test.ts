import { describe, it, expect } from 'vitest';
import { toRevenueSeries } from '@/lib/revenueSeries';

describe('toRevenueSeries', () => {
  it('sorts months chronologically', () => {
    const input = [
      { month: 'Feb', revenue: 200 },
      { month: 'Jan', revenue: 100 },
      { month: 'Mar', revenue: 300 },
    ];
    expect(toRevenueSeries(input).map((p) => p.month)).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('drops points with negative revenue', () => {
    const input = [
      { month: 'Jan', revenue: 100 },
      { month: 'Feb', revenue: -50 },
    ];
    expect(toRevenueSeries(input)).toHaveLength(1);
  });

  it('drops points with non-finite revenue', () => {
    const input = [
      { month: 'Jan', revenue: 100 },
      { month: 'Feb', revenue: Number.NaN },
    ];
    expect(toRevenueSeries(input).map((p) => p.month)).toEqual(['Jan']);
  });

  it('sorts unknown months last', () => {
    const input = [
      { month: 'Q1', revenue: 400 },
      { month: 'Jan', revenue: 100 },
    ];
    expect(toRevenueSeries(input).map((p) => p.month)).toEqual(['Jan', 'Q1']);
  });

  it('does not mutate the input array', () => {
    const input = [
      { month: 'Feb', revenue: 200 },
      { month: 'Jan', revenue: 100 },
    ];
    toRevenueSeries(input);
    expect(input.map((p) => p.month)).toEqual(['Feb', 'Jan']);
  });
});
