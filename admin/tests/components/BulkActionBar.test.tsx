import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionBar from '@/components/BulkActionBar';

describe('BulkActionBar', () => {
  it('renders nothing without a selection', () => {
    const { container } = render(<BulkActionBar count={0} onDelete={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to a generic secondary label when none is given', () => {
    render(<BulkActionBar count={2} onSecondary={vi.fn()} />);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
  });

  it('uses the label the page provides', () => {
    const onSecondary = vi.fn();
    render(<BulkActionBar count={1} onSecondary={onSecondary} secondaryLabel="Change role" />);
    fireEvent.click(screen.getByRole('button', { name: 'Change role' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});
