import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { rankCommands, type PaletteCommand } from '@/lib/commandPalette';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      { id: 'dashboard', label: 'Dashboard', group: 'Navigate', keywords: ['home'], perform: () => navigate('/') },
      { id: 'users', label: 'Users', group: 'Navigate', keywords: ['team', 'accounts', 'roles'], perform: () => navigate('/users') },
      { id: 'bookings', label: 'Bookings', group: 'Navigate', keywords: ['reservations', 'events', 'calendar'], perform: () => navigate('/bookings') },
      { id: 'inquiries', label: 'Inquiries', group: 'Navigate', keywords: ['messages', 'contact'], perform: () => navigate('/inquiries') },
      { id: 'analytics', label: 'Analytics', group: 'Navigate', keywords: ['reports', 'charts', 'revenue'], perform: () => navigate('/analytics') },
      { id: 'gallery', label: 'Gallery', group: 'Navigate', keywords: ['photos', 'images'], perform: () => navigate('/gallery') },
      { id: 'notifications', label: 'Notifications', group: 'Navigate', keywords: ['alerts'], perform: () => navigate('/notifications') },
      { id: 'settings', label: 'Settings', group: 'Navigate', keywords: ['account', 'security', 'preferences'], perform: () => navigate('/settings') },
      { id: 'sign-out', label: 'Sign out', group: 'Account', perform: () => logout() },
    ],
    [navigate, logout]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = rankCommands(query, commands);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !results[selectedIndex]) return;
    document.getElementById(`command-option-${results[selectedIndex].id}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, results, selectedIndex]);

  const run = (command: PaletteCommand) => {
    command.perform();
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = results[selectedIndex];
      if (command) run(command);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <DialogContent className="top-[16%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-gray-200/70 px-4 dark:border-white/10">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-autocomplete="list"
            aria-activedescendant={results[selectedIndex] ? `command-option-${results[selectedIndex].id}` : undefined}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSelectedIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions…"
            className="h-12 border-0 bg-transparent px-0 pr-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <ul id="command-palette-list" className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Commands">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-gray-400">No matching pages or actions</li>
          ) : (
            results.map((command, index) => (
              <li
                key={command.id}
                id={`command-option-${command.id}`}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => run(command)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  index === selectedIndex ? 'bg-brand-500/15 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                )}
              >
                <span className="truncate font-medium">{command.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-gray-400">{command.group}</span>
                  {index === selectedIndex && <CornerDownLeft className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />}
                </span>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
