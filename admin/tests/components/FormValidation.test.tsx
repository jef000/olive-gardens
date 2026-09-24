import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { useFieldValidation } from '@/hooks/useFieldValidation';

function EmailField() {
  const [value, setValue] = useState('');
  const { state, error } = useFieldValidation(value, (input) => {
    if (!input) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) ? null : 'Enter a valid email address';
  });
  return (
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={state === 'error'} aria-describedby="email-error" />
      {state === 'error' && <span id="email-error">{error}</span>}
      {state === 'valid' && <span data-testid="valid-indicator">OK</span>}
    </div>
  );
}

describe('real-time form validation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates debounced input and shows an error', () => {
    vi.useFakeTimers();
    render(<EmailField />);
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error and marks the field valid', () => {
    vi.useFakeTimers();
    render(<EmailField />);
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'guest@example.com' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('valid-indicator')).toBeInTheDocument();
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not validate before the debounce delay elapses', () => {
    vi.useFakeTimers();
    render(<EmailField />);
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
  });
});
