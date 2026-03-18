import { Children, createContext, useContext } from 'react';
import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

type TabsValue = string;

type TabsContextValue = {
  value: TabsValue;
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
  const contextValue: TabsContextValue = {
    value: value ?? defaultValue ?? (Children.toArray(children)[0] as ReactElement)?.props?.value,
    onValueChange,
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
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
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
      aria-selected={isActive}
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
    <div role="tabpanel" tabIndex={0} className={cn('mt-4', className)}>
      {children}
    </div>
  );
}
