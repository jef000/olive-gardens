import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '@/components/DateRangePicker';
import { ALL_TIME, datePresets } from '@/lib/dateRange';

describe('DateRangePicker', () => {
  it('emits the preset range when a preset is clicked', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={ALL_TIME} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    const expected = datePresets().find((preset) => preset.label === 'Last 7 days')!.range;
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('emits custom date edits', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ from: '2026-09-01', to: '2026-09-17' }} onChange={onChange} idPrefix="test" />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-05' } });
    expect(onChange).toHaveBeenCalledWith({ from: '2026-09-05', to: '2026-09-17' });

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-20' } });
    expect(onChange).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-09-20' });
  });

  it('shows a hint when the range is inverted', () => {
    render(<DateRangePicker value={{ from: '2026-09-30', to: '2026-09-01' }} onChange={vi.fn()} />);
    expect(screen.getByText('The start date must be on or before the end date.')).toBeInTheDocument();
  });

  it('does not show the hint for a valid range', () => {
    render(<DateRangePicker value={{ from: '2026-09-01', to: '2026-09-30' }} onChange={vi.fn()} />);
    expect(screen.queryByText('The start date must be on or before the end date.')).not.toBeInTheDocument();
  });
});
