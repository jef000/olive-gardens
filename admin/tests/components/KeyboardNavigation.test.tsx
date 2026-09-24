import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { registerKeyboardShortcuts } from '@/lib/keyboardShortcuts';

describe('keyboard shortcuts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('activates a shortcut on Ctrl+key', () => {
    const action = vi.fn();
    const unregister = registerKeyboardShortcuts([{ key: 'b', label: 'Bookings', ctrlOrMeta: true, action }]);
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(action).toHaveBeenCalledTimes(1);
    unregister();
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches shortcuts case-insensitively', () => {
    const action = vi.fn();
    const unregister = registerKeyboardShortcuts([{ key: 'K', label: 'Search', ctrlOrMeta: true, action }]);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(action).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('requires the modifier key when ctrlOrMeta is set', () => {
    const action = vi.fn();
    const unregister = registerKeyboardShortcuts([{ key: 'b', label: 'Bookings', ctrlOrMeta: true, action }]);
    fireEvent.keyDown(document, { key: 'b' });
    expect(action).not.toHaveBeenCalled();
    unregister();
  });

  it('ignores shortcuts when focus is inside a text input', () => {
    const action = vi.fn();
    const unregister = registerKeyboardShortcuts([{ key: 'b', label: 'Bookings', ctrlOrMeta: true, action }]);
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'b', ctrlKey: true });
    expect(action).not.toHaveBeenCalled();
    unregister();
  });

  it('activates shortcuts without a modifier key', () => {
    const action = vi.fn();
    const unregister = registerKeyboardShortcuts([{ key: '?', label: 'Help', action }]);
    fireEvent.keyDown(document, { key: '?' });
    expect(action).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('dismisses a dialog with the Escape key', () => {
    function Dialog() {
      const [open, setOpen] = React.useState(true);
      React.useEffect(() => registerKeyboardShortcuts([
        { key: 'Escape', label: 'Close dialog', action: () => setOpen(false) },
      ]), []);
      return open ? <div role="dialog" aria-modal="true">Dialog content</div> : null;
    }
    render(<Dialog />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
