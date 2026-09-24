export interface RevenuePoint {
  month: string;
  revenue: number;
}

const MONTH_ORDER = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthIndex(month: string): number {
  const index = MONTH_ORDER.indexOf(month.trim().toLowerCase());
  return index === -1 ? MONTH_ORDER.length : index;
}

export function toRevenueSeries(points: RevenuePoint[]): RevenuePoint[] {
  return points
    .filter((point) => Number.isFinite(point.revenue) && point.revenue >= 0)
    .sort((a, b) => monthIndex(a.month) - monthIndex(b.month));
}
