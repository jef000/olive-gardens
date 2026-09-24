import { Children, createContext, useContext, useId, useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { cn } from '@/lib/utils';

type TabsValue = string;

type TabsContextValue = {
  value?: TabsValue;
  baseId: string;
  onValueChange?: (value: TabsValue) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  value?: TabsValue;
  defaultValue?: TabsValue;
  onValueChange?: (value: TabsValue) => void;
  className?: string;
  children: ReactElement[] | ReactElement;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const baseId = useId();
  const childArray = Children.toArray(children) as ReactElement[];
  const firstValue = childArray[0]?.props?.value as TabsValue | undefined;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<TabsValue | undefined>(defaultValue ?? firstValue);

  const currentValue = isControlled ? value : internalValue ?? firstValue;

  const handleValueChange = (next: TabsValue) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const contextValue: TabsContextValue = {
    value: currentValue,
    baseId,
    onValueChange: handleValueChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactElement[] | ReactElement;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    const index = tabs.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;

    event.preventDefault();
    const nextIndex =
      event.key === 'Home' ? 0 :
      event.key === 'End' ? tabs.length - 1 :
      event.key === 'ArrowRight' ? (index + 1) % tabs.length :
      (index - 1 + tabs.length) % tabs.length;

    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn('inline-flex items-center rounded-lg border border-gray-200 bg-white', className)}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: TabsValue;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs.');
  }

  const isActive = context.value === value;

  return (
    <button
      role="tab"
      type="button"
      id={`${context.baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${context.baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => context.onValueChange?.(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8b9172]',
        isActive
          ? 'bg-[#8b9172] text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: TabsValue;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs.');
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${context.baseId}-panel-${value}`}
      aria-labelledby={`${context.baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('mt-4', className)}
    >
      {children}
    </div>
  );
}
